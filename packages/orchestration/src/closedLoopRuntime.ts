import { ABBAFeedbackEngine } from './feedbackEngine';
import { ABBAContextEngine } from './contextEngine';
import { ABBAResponsePlanner } from './responsePlanner';
import type {
  CuratedCandidate,
  CuratedTeamProposal,
  TelemetrySignal,
  TelemetryProcessingResult
} from './feedbackEngine';
import type { ABBAContextBundle, ABBAContextSynthesis } from './contextEngine';
import type { ResponsePlan, ResponseProposal } from './responsePlanner';

export interface SWIRMCapabilityQuery {
  requiredCapabilities: string[];
  maxRiskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetConstraintUnits?: number;
  objective: string;
}

export interface CapabilityDiscovery {
  discover(query: SWIRMCapabilityQuery): Promise<CuratedCandidate[]>;
}

export interface ObservationStore {
  record(signal: TelemetrySignal, processing: TelemetryProcessingResult): Promise<void>;
}

export interface TeamProposalStore {
  record(
    proposal: CuratedTeamProposal,
    metadata: {
      cycleId: string;
      correlationId: string;
      sourceSignalIds: string[];
      idempotencyKey: string;
    }
  ): Promise<void>;
}

export interface ResponseProposalStore {
  record(
    proposal: ResponseProposal,
    metadata: {
      responsePlanId: string;
      idempotencyKey: string;
    }
  ): Promise<void>;
}

export interface ClosedLoopObjective {
  objective: string;
  requiredCapabilities: string[];
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetConstraintUnits?: number;
  context?: Record<string, unknown>;
}

export interface ClosedLoopFailure {
  signalId: string;
  stage: 'OBSERVE' | 'PERSIST_OBSERVATION' | 'SYNTHESIZE' | 'PERSIST_RESPONSE' | 'DISCOVER' | 'PERSIST_PROPOSAL';
  reason: string;
}

export interface ClosedLoopCycleResult {
  cycleId: string;
  telemetryIngestedCount: number;
  observationsPersistedCount: number;
  anomaliesDetected: number;
  actionableObservationCount: number;
  context: ABBAContextBundle;
  synthesis: ABBAContextSynthesis;
  responsePlan: ResponsePlan;
  responseProposalsPersistedCount: number;
  capabilityDiscoveryCount: number;
  teamProposalsGenerated: CuratedTeamProposal[];
  teamProposalsPersistedCount: number;
  blockedSignalIds: string[];
  failures: ClosedLoopFailure[];
}

type ProcessedSignal = {
  signal: TelemetrySignal;
  processing: TelemetryProcessingResult;
  observationPersisted: boolean;
};

export class ABBAClosedLoopRuntime {
  constructor(
    private readonly feedbackEngine: ABBAFeedbackEngine,
    private readonly capabilityDiscovery: CapabilityDiscovery,
    private readonly observationStore: ObservationStore,
    private readonly responseProposalStore: ResponseProposalStore,
    private readonly teamProposalStore: TeamProposalStore,
    private readonly contextEngine: ABBAContextEngine = new ABBAContextEngine(),
    private readonly responsePlanner: ABBAResponsePlanner = new ABBAResponsePlanner()
  ) {}

  /**
   * Executes the governed core loop. Raw observation handling is concurrent;
   * synthesis precedes composition; persistence failures fail closed.
   * No consequential canonical state mutation occurs in this runtime.
   */
  public async executeObservationCycle(
    incomingSignals: TelemetrySignal[],
    objective: ClosedLoopObjective
  ): Promise<ClosedLoopCycleResult> {
    const cycleId = `cycle_${crypto.randomUUID()}`;
    const processed = await Promise.all(incomingSignals.map((signal) => this.processSignal(signal)));
    const validSignals = processed.filter((item) => item.processing.isValid && item.observationPersisted).map((item) => item.signal);

    const context = this.contextEngine.buildContext(validSignals);
    const synthesis = this.contextEngine.synthesize(context, validSignals);
    const responsePlan = this.responsePlanner.buildPlan(context.contextId, synthesis, validSignals);

    const failures: ClosedLoopFailure[] = [];
    let responseProposalsPersistedCount = 0;

    for (const proposal of responsePlan.proposals) {
      const idempotencyKey = `abba:response:${context.contextId}:${proposal.type}`;
      try {
        await this.responseProposalStore.record(proposal, {
          responsePlanId: responsePlan.planId,
          idempotencyKey
        });
        responseProposalsPersistedCount++;
      } catch (error) {
        failures.push({
          signalId: proposal.sourceSignalIds[0] ?? 'unknown',
          stage: 'PERSIST_RESPONSE',
          reason: error instanceof Error ? error.message : 'RESPONSE_PERSISTENCE_FAILED'
        });
      }
    }

    const responsePersistenceFailed = failures.some((failure) => failure.stage === 'PERSIST_RESPONSE');
    const proposalsGenerated: CuratedTeamProposal[] = [];
    let capabilityDiscoveryCount = 0;

    if (!responsePersistenceFailed) {
      const actionableSignals = validSignals.filter((signal) => this.isActionable(signal));
      const compositionResults = await Promise.all(
        actionableSignals.map((signal) => this.composeTeam(signal, objective, cycleId))
      );
      capabilityDiscoveryCount = compositionResults.reduce((sum, result) => sum + result.discoveryCount, 0);
      for (const result of compositionResults) {
        failures.push(...result.failures);
        if (result.proposal) proposalsGenerated.push(result.proposal);
      }
    }

    const teamProposalsPersistedCount = responsePersistenceFailed
      ? 0
      : await this.persistTeamProposals(proposalsGenerated, validSignals, cycleId, failures);

    return {
      cycleId,
      telemetryIngestedCount: incomingSignals.length,
      observationsPersistedCount: processed.filter((item) => item.observationPersisted).length,
      anomaliesDetected: processed.filter((item) => !item.processing.isValid).length,
      actionableObservationCount: validSignals.filter((signal) => this.isActionable(signal)).length,
      context,
      synthesis,
      responsePlan,
      responseProposalsPersistedCount,
      capabilityDiscoveryCount,
      teamProposalsGenerated: proposalsGenerated,
      teamProposalsPersistedCount,
      blockedSignalIds: processed.filter((item) => !item.processing.isValid || !item.observationPersisted).map((item) => item.signal.signalId),
      failures
    };
  }

  private async processSignal(signal: TelemetrySignal): Promise<ProcessedSignal> {
    const signalId = signal.signalId || 'unknown';
    let processing: TelemetryProcessingResult;

    try {
      processing = await this.feedbackEngine.processTelemetry(signal);
    } catch {
      processing = {
        signalId,
        isValid: false,
        actionRequired: false,
        disposition: 'REJECTED',
        anomalyReason: 'FEEDBACK_ENGINE_PROCESSING_ERROR'
      };
    }

    let observationPersisted = false;
    try {
      await this.observationStore.record(signal, processing);
      observationPersisted = true;
    } catch {
      observationPersisted = false;
    }

    return { signal, processing, observationPersisted };
  }

  private isActionable(signal: TelemetrySignal): boolean {
    return [
      'SIGNAL_RESOURCE_PULSE',
      'SIGNAL_AGENT_HEALTH',
      'SIGNAL_VALUE_METRIC',
      'SIGNAL_ANOMALY_LOG',
      'SIGNAL_POLICY_FRICTION',
      'SIGNAL_TASK_OUTCOME'
    ].includes(signal.signalType);
  }

  private async composeTeam(signal: TelemetrySignal, objective: ClosedLoopObjective, cycleId: string): Promise<{
    proposal?: CuratedTeamProposal;
    discoveryCount: number;
    failures: ClosedLoopFailure[];
  }> {
    const query: SWIRMCapabilityQuery = {
      requiredCapabilities: this.extractRequiredCapabilities(signal, objective),
      maxRiskClass: objective.riskClass,
      budgetConstraintUnits: objective.budgetConstraintUnits,
      objective: this.deriveObjective(signal, objective)
    };

    try {
      const candidates = await this.capabilityDiscovery.discover(query);
      const proposal = this.feedbackEngine.curateSpecializedTeam(query.objective, candidates, {
        requiredCapabilities: query.requiredCapabilities,
        riskClass: query.maxRiskClass,
        context: {
          ...(objective.context ?? {}),
          sourceSignalId: signal.signalId,
          correlationId: signal.correlationId,
          cycleId
        }
      });
      return { proposal, discoveryCount: candidates.length, failures: [] };
    } catch (error) {
      return {
        discoveryCount: 0,
        failures: [{
          signalId: signal.signalId,
          stage: 'DISCOVER',
          reason: error instanceof Error ? error.message : 'CAPABILITY_DISCOVERY_FAILED'
        }]
      };
    }
  }

  private async persistTeamProposals(
    proposals: CuratedTeamProposal[],
    signals: TelemetrySignal[],
    cycleId: string,
    failures: ClosedLoopFailure[]
  ): Promise<number> {
    let persisted = 0;
    for (const proposal of proposals) {
      const sourceSignalId = String(proposal.contextPayload.sourceSignalId ?? 'unknown');
      const sourceSignal = signals.find((signal) => signal.signalId === sourceSignalId);
      const correlationId = String(proposal.contextPayload.correlationId ?? sourceSignal?.correlationId ?? cycleId);
      const idempotencyKey = `abba:team:${sourceSignalId}:${proposal.objective}`;
      try {
        await this.teamProposalStore.record(proposal, {
          cycleId,
          correlationId,
          sourceSignalIds: sourceSignal ? [sourceSignal.signalId] : [sourceSignalId],
          idempotencyKey
        });
        persisted++;
      } catch (error) {
        failures.push({
          signalId: sourceSignalId,
          stage: 'PERSIST_PROPOSAL',
          reason: error instanceof Error ? error.message : 'PROPOSAL_PERSISTENCE_FAILED'
        });
      }
    }
    return persisted;
  }

  private extractRequiredCapabilities(signal: TelemetrySignal, objective: ClosedLoopObjective): string[] {
    const fromPayload = signal.payload.requiredCapabilities;
    const capabilities = Array.isArray(fromPayload)
      ? fromPayload.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [];
    return [...new Set([...objective.requiredCapabilities, ...capabilities])];
  }

  private deriveObjective(signal: TelemetrySignal, objective: ClosedLoopObjective): string {
    const signalObjective = signal.payload.objective;
    if (typeof signalObjective === 'string' && signalObjective.trim()) return signalObjective.trim();
    return `${objective.objective} — resolve governed observation from ${signal.sourceEntityId}`;
  }
}
