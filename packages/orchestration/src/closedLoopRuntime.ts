import type {
  CuratedCandidate,
  CuratedTeamProposal,
  ABBAFeedbackEngine,
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
  record(signal: TelemetrySignal, processing: TelemetryProcessingResult): Promise<void>;
}

export interface TeamProposalStore {
  record(
    proposal: CuratedTeamProposal,
    metadata: { cycleId: string; correlationId: string; sourceSignalIds: string[] }
  ): Promise<void>;
}

export interface ClosedLoopObjective {
  objective: string;
  requiredCapabilities: string[];
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  budgetConstraintUnits?: number;
  context?: Record<string, unknown>;
}

export interface ClosedLoopCycleResult {
  cycleId: string;
  telemetryIngestedCount: number;
  observationsPersistedCount: number;
  anomaliesDetected: number;
  actionableObservationCount: number;
  capabilityDiscoveryCount: number;
  teamProposalsGenerated: CuratedTeamProposal[];
  blockedSignalIds: string[];
}

export class ABBAClosedLoopRuntime {
  constructor(
    private readonly feedbackEngine: ABBAFeedbackEngine,
    private readonly capabilityDiscovery: CapabilityDiscovery,
    private readonly observationStore?: ObservationStore,
    private readonly teamProposalStore?: TeamProposalStore
  ) {}

  public async executeObservationCycle(
    incomingSignals: TelemetrySignal[],
    objective: ClosedLoopObjective
  ): Promise<ClosedLoopCycleResult> {
    const cycleId = `cycle_${crypto.randomUUID()}`;
    let observationsPersistedCount = 0;
    let anomaliesDetected = 0;
    let actionableObservationCount = 0;
    let capabilityDiscoveryCount = 0;
    const blockedSignalIds: string[] = [];
    const teamProposalsGenerated: CuratedTeamProposal[] = [];

    for (const signal of incomingSignals) {
      const processing = await this.feedbackEngine.processTelemetry(signal);

      if (this.observationStore) {
        await this.observationStore.record(signal, processing);
        observationsPersistedCount++;
      }

      if (!processing.isValid) {
        anomaliesDetected++;
        blockedSignalIds.push(signal.signalId || 'unknown');
        continue;
      }

      if (!processing.actionRequired) continue;
      actionableObservationCount++;

      const query: SWIRMCapabilityQuery = {
        requiredCapabilities: this.extractRequiredCapabilities(signal, objective),
        maxRiskClass: objective.riskClass,
        budgetConstraintUnits: objective.budgetConstraintUnits,
        objective: this.deriveObjective(signal, objective)
      };

      const candidates = await this.capabilityDiscovery.discover(query);
      capabilityDiscoveryCount += candidates.length;

      const teamProposal = this.feedbackEngine.curateSpecializedTeam(query.objective, candidates, {
        requiredCapabilities: query.requiredCapabilities,
        riskClass: query.maxRiskClass,
        context: {
          ...(objective.context ?? {}),
          sourceSignalId: signal.signalId,
          correlationId: signal.correlationId,
          cycleId
        }
      });

      teamProposalsGenerated.push(teamProposal);

      if (this.teamProposalStore) {
        await this.teamProposalStore.record(teamProposal, {
          cycleId,
          correlationId: signal.correlationId,
          sourceSignalIds: [signal.signalId]
        });
      }
    }

    return {
      cycleId,
      telemetryIngestedCount: incomingSignals.length,
      observationsPersistedCount,
      anomaliesDetected,
      actionableObservationCount,
      capabilityDiscoveryCount,
      teamProposalsGenerated,
      blockedSignalIds
    };
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
