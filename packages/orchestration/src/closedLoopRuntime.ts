import { ABBAFeedbackEngine } from './feedbackEngine';
import type {
  CuratedCandidate,
  CuratedTeamProposal,
  TelemetrySignal,
  TelemetryProcessingResult
} from './feedbackEngine';

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
  /** Implementations must be idempotent by signalId. */
  record(signal: TelemetrySignal, processing: TelemetryProcessingResult): Promise<void>;
}

export interface TeamProposalStore {
  /** Implementations must be idempotent by metadata.idempotencyKey. */
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

export interface ClosedLoopObjective {
  objective: string;
  requiredCapabilities: string[];
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetConstraintUnits?: number;
  context?: Record<string, unknown>;
}

export interface ClosedLoopFailure {
  signalId: string;
  stage: 'OBSERVE' | 'PERSIST_OBSERVATION' | 'DISCOVER' | 'PERSIST_PROPOSAL';
  reason: string;
}

export interface ClosedLoopCycleResult {
  cycleId: string;
  telemetryIngestedCount: number;
  observationsPersistedCount: number;
  anomaliesDetected: number;
  actionableObservationCount: number;
  capabilityDiscoveryCount: number;
  teamProposalsGenerated: CuratedTeamProposal[];
  teamProposalsPersistedCount: number;
  blockedSignalIds: string[];
  failures: ClosedLoopFailure[];
}

export class ABBAClosedLoopRuntime {
  constructor(
    private readonly feedbackEngine: ABBAFeedbackEngine,
    private readonly capabilityDiscovery: CapabilityDiscovery,
    private readonly observationStore?: ObservationStore,
    private readonly teamProposalStore?: TeamProposalStore
  ) {}

  /**
   * Runs the observation-to-proposal stages concurrently per signal.
   * This stage never executes a consequential action or writes canonical state.
   */
  public async executeObservationCycle(
    incomingSignals: TelemetrySignal[],
    objective: ClosedLoopObjective
  ): Promise<ClosedLoopCycleResult> {
    const cycleId = `cycle_${crypto.randomUUID()}`;

    const results = await Promise.all(
      incomingSignals.map(async (signal) => this.processSignal(signal, objective, cycleId))
    );

    const successfulResults = results.filter(
      (result): result is Extract<(typeof results)[number], { kind: 'PROPOSAL' }> => result.kind === 'PROPOSAL'
    );

    return {
      cycleId,
      telemetryIngestedCount: incomingSignals.length,
      observationsPersistedCount: results.filter((result) => result.observationPersisted).length,
      anomaliesDetected: results.filter((result) => result.anomaly).length,
      actionableObservationCount: results.filter((result) => result.actionable).length,
      capabilityDiscoveryCount: results.reduce((sum, result) => sum + result.discoveryCount, 0),
      teamProposalsGenerated: successfulResults.map((result) => result.proposal),
      teamProposalsPersistedCount: successfulResults.filter((result) => result.proposalPersisted).length,
      blockedSignalIds: results.filter((result) => result.blocked).map((result) => result.signalId),
      failures: results.flatMap((result) => result.failures)
    };
  }

  private async processSignal(
    signal: TelemetrySignal,
    objective: ClosedLoopObjective,
    cycleId: string
  ) {
    const signalId = signal.signalId || 'unknown';
    let processing: TelemetryProcessingResult;

    try {
      processing = await this.feedbackEngine.processTelemetry(signal);
    } catch (error) {
      processing = {
        signalId,
        isValid: false,
        actionRequired: false,
        disposition: 'REJECTED',
        anomalyReason: 'FEEDBACK_ENGINE_PROCESSING_ERROR'
      };
      const failure: ClosedLoopFailure = {
        signalId,
        stage: 'OBSERVE',
        reason: error instanceof Error ? error.message : 'UNKNOWN_FEEDBACK_ENGINE_ERROR'
      };
      await this.persistObservationSafely(signal, processing);
      return {
        kind: 'BLOCKED' as const,
        signalId,
        observationPersisted: false,
        anomaly: true,
        actionable: false,
        discoveryCount: 0,
        blocked: true,
        failures: [failure]
      };
    }

    const observationPersisted = await this.persistObservationSafely(signal, processing);
    if (!observationPersisted) {
      return {
        kind: 'BLOCKED' as const,
        signalId,
        observationPersisted: false,
        anomaly: false,
        actionable: false,
        discoveryCount: 0,
        blocked: true,
        failures: [{
          signalId,
          stage: 'PERSIST_OBSERVATION' as const,
          reason: 'OBSERVATION_PERSISTENCE_FAILED'
        }]
      };
    }

    if (!processing.isValid) {
      return {
        kind: 'BLOCKED' as const,
        signalId,
        observationPersisted: true,
        anomaly: true,
        actionable: false,
        discoveryCount: 0,
        blocked: true,
        failures: [{
          signalId,
          stage: 'OBSERVE' as const,
          reason: processing.anomalyReason ?? 'INVALID_SIGNAL'
        }]
      };
    }

    if (!processing.actionRequired) {
      return {
        kind: 'NO_ACTION' as const,
        signalId,
        observationPersisted: true,
        anomaly: false,
        actionable: false,
        discoveryCount: 0,
        blocked: false,
        failures: [] as ClosedLoopFailure[]
      };
    }

    const query: SWIRMCapabilityQuery = {
      requiredCapabilities: this.extractRequiredCapabilities(signal, objective),
      maxRiskClass: objective.riskClass,
      budgetConstraintUnits: objective.budgetConstraintUnits,
      objective: this.deriveObjective(signal, objective)
    };

    let candidates: CuratedCandidate[];
    try {
      candidates = await this.capabilityDiscovery.discover(query);
    } catch (error) {
      return {
        kind: 'BLOCKED' as const,
        signalId,
        observationPersisted: true,
        anomaly: false,
        actionable: true,
        discoveryCount: 0,
        blocked: true,
        failures: [{
          signalId,
          stage: 'DISCOVER' as const,
          reason: error instanceof Error ? error.message : 'CAPABILITY_DISCOVERY_FAILED'
        }]
      };
    }

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

    let proposalPersisted = false;
    const failures: ClosedLoopFailure[] = [];
    if (this.teamProposalStore) {
      const idempotencyKey = `abba:team:${signal.signalId}:${query.objective}`;
      try {
        await this.teamProposalStore.record(proposal, {
          cycleId,
          correlationId: signal.correlationId,
          sourceSignalIds: [signal.signalId],
          idempotencyKey
        });
        proposalPersisted = true;
      } catch (error) {
        failures.push({
          signalId,
          stage: 'PERSIST_PROPOSAL',
          reason: error instanceof Error ? error.message : 'PROPOSAL_PERSISTENCE_FAILED'
        });
      }
    }

    return {
      kind: 'PROPOSAL' as const,
      signalId,
      observationPersisted: true,
      anomaly: false,
      actionable: true,
      discoveryCount: candidates.length,
      blocked: failures.length > 0,
      proposal,
      proposalPersisted,
      failures
    };
  }

  private async persistObservationSafely(
    signal: TelemetrySignal,
    processing: TelemetryProcessingResult
  ): Promise<boolean> {
    if (!this.observationStore) return true;
    try {
      await this.observationStore.record(signal, processing);
      return true;
    } catch {
      return false;
    }
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
