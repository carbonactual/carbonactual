import type { CanonicalEvent } from '@carbon-actual/events';

export type TelemetrySignalType =
  | 'SIGNAL_RESOURCE_PULSE'
  | 'SIGNAL_AGENT_HEALTH'
  | 'SIGNAL_VALUE_METRIC'
  | 'SIGNAL_ANOMALY_LOG'
  | 'SIGNAL_EXTERNAL_ADAPTER'
  | 'SIGNAL_USER_DEMAND'
  | 'SIGNAL_POLICY_FRICTION'
  | 'SIGNAL_NETWORK_LATENCY'
  | 'SIGNAL_TASK_OUTCOME';

export interface TelemetrySignal {
  signalId: string;
  signalType: TelemetrySignalType;
  sourceType: 'AGENT' | 'ECONOMIC_ENGINE' | 'SURFACE' | 'EXTERNAL_ADAPTER' | 'HUMAN_OR_OPERATOR' | 'RUNTIME';
  sourceEntityId: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature: string;
  provenance: { source: string; evidenceRef?: string; [key: string]: unknown };
  correlationId: string;
}

export interface SignalVerifier {
  verify(signal: TelemetrySignal): Promise<boolean>;
}

export interface CuratedCandidate {
  entityId: string;
  capabilities: string[];
  available: boolean;
  authorityEligible: boolean;
  riskEligible: boolean;
  reliability: number;
  cost: number;
  latencyMs: number;
  contextFit: number;
}

export interface CuratedTeamProposal {
  teamId: string;
  objective: string;
  assignedEntityIds: string[];
  contextPayload: Record<string, unknown>;
  estimatedYield: number;
  selectionBasis: string[];
  authorizationRequired: boolean;
}

export interface TelemetryProcessingResult {
  signalId: string;
  isValid: boolean;
  actionRequired: boolean;
  disposition: 'VALIDATED' | 'REJECTED' | 'PROVISIONAL';
  anomalyReason?: string;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function suitabilityScore(candidate: CuratedCandidate): number {
  const reliability = clamp(candidate.reliability);
  const contextFit = clamp(candidate.contextFit);
  const costEfficiency = 1 / (1 + Math.max(0, candidate.cost));
  const latencyEfficiency = 1 / (1 + Math.max(0, candidate.latencyMs) / 1000);
  return (
    reliability * 0.35 +
    contextFit * 0.35 +
    costEfficiency * 0.15 +
    latencyEfficiency * 0.15
  );
}

export class ABBAFeedbackEngine {
  constructor(
    private readonly verifier: SignalVerifier,
    private readonly controlPlaneId = 'ABBA_PRIMARY_CONTROL_PLANE'
  ) {}

  public async processTelemetry(
    signal: TelemetrySignal
  ): Promise<TelemetryProcessingResult> {
    if (!signal.signalId || !signal.sourceEntityId || !signal.signature || !signal.provenance?.source) {
      return {
        signalId: signal.signalId || 'unknown',
        isValid: false,
        actionRequired: false,
        disposition: 'REJECTED',
        anomalyReason: 'INCOMPLETE_SIGNAL_ENVELOPE'
      };
    }

    const verified = await this.verifier.verify(signal);
    if (!verified) {
      return {
        signalId: signal.signalId,
        isValid: false,
        actionRequired: false,
        disposition: 'REJECTED',
        anomalyReason: 'SIGNATURE_OR_PROVENANCE_VERIFICATION_FAILED'
      };
    }

    return {
      signalId: signal.signalId,
      isValid: true,
      actionRequired: this.evaluateSystemicNeed(signal),
      disposition: 'VALIDATED'
    };
  }

  public curateSpecializedTeam(
    objective: string,
    candidates: CuratedCandidate[],
    options: {
      requiredCapabilities?: string[];
      maxMembers?: number;
      riskClass?: 'LOW' | 'MEDIUM' | 'HIGH';
      context?: Record<string, unknown>;
    } = {}
  ): CuratedTeamProposal {
    const requiredCapabilities = options.requiredCapabilities ?? [];
    const maxMembers = Math.max(1, Math.min(options.maxMembers ?? 3, 25));

    const eligible = candidates.filter((candidate) => {
      if (!candidate.available || !candidate.authorityEligible || !candidate.riskEligible) return false;
      if (options.riskClass === 'HIGH' && candidate.contextFit < 0.8) return false;
      return true;
    });

    const ranked = [...eligible].sort((left, right) => suitabilityScore(right) - suitabilityScore(left));

    const selected: CuratedCandidate[] = [];
    const covered = new Set<string>();

    for (const capability of requiredCapabilities) {
      const match = ranked.find(
        (candidate) => candidate.capabilities.includes(capability) && !selected.includes(candidate)
      );
      if (match) {
        selected.push(match);
        match.capabilities.forEach((item) => covered.add(item));
      }
    }

    for (const candidate of ranked) {
      if (selected.length >= maxMembers) break;
      if (!selected.includes(candidate)) selected.push(candidate);
    }

    const selectedScores = selected.map(suitabilityScore);
    const estimatedYield = selectedScores.length
      ? Number((selectedScores.reduce((sum, value) => sum + value, 0) / selectedScores.length).toFixed(6))
      : 0;

    const proposal: CuratedTeamProposal = {
      teamId: `team_${crypto.randomUUID()}`,
      objective,
      assignedEntityIds: selected.map((candidate) => candidate.entityId),
      contextPayload: {
        routedAt: new Date().toISOString(),
        controlPlaneId: this.controlPlaneId,
        ...(options.context ?? {})
      },
      estimatedYield,
      selectionBasis: [
        'capability coverage',
        'availability',
        'authority eligibility',
        'risk eligibility',
        'reliability',
        'context suitability',
        'cost efficiency',
        'latency efficiency'
      ],
      authorizationRequired: true
    };

    return proposal;
  }

  private evaluateSystemicNeed(signal: TelemetrySignal): boolean {
    return [
      'SIGNAL_RESOURCE_PULSE',
      'SIGNAL_AGENT_HEALTH',
      'SIGNAL_VALUE_METRIC',
      'SIGNAL_ANOMALY_LOG',
      'SIGNAL_POLICY_FRICTION',
      'SIGNAL_TASK_OUTCOME'
    ].includes(signal.signalType);
  }
}

export interface FeedbackEventProjection {
  signal: TelemetrySignal;
  sourceEvent?: CanonicalEvent;
  proposedResponse?: {
    type:
      | 'TEAM_PROPOSAL'
      | 'WORKFLOW_ADJUSTMENT_PROPOSAL'
      | 'RESOURCE_REALLOCATION_PROPOSAL'
      | 'POLICY_CHANGE_PROPOSAL'
      | 'PULSE_RECALCULATION_REQUEST'
      | 'ANOMALY_ESCALATION';
    requiresAuthority: true;
  };
}
