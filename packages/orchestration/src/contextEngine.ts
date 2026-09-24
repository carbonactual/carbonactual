import type { TelemetrySignal } from './feedbackEngine';

export type ObservationClassification =
  | 'PERFORMANCE'
  | 'RESOURCE'
  | 'VALUE'
  | 'ANOMALY'
  | 'POLICY_FRICTION'
  | 'DEMAND'
  | 'LATENCY'
  | 'TASK_OUTCOME'
  | 'EXTERNAL';

export interface CorrelatedObservationGroup {
  correlationId: string;
  signalIds: string[];
  sourceEntityIds: string[];
  classifications: ObservationClassification[];
  firstObservedAt: string;
  lastObservedAt: string;
}

export interface ContradictionRecord {
  assertionKey: string;
  observedValues: unknown[];
  sourceSignalIds: string[];
  resolution: 'UNRESOLVED_CONFLICT';
}

export interface ABBAContextBundle {
  contextId: string;
  sourceSignalIds: string[];
  groups: CorrelatedObservationGroup[];
  contradictions: ContradictionRecord[];
  minimumContext: Record<string, unknown>;
}

export interface ABBAContextSynthesis {
  contextId: string;
  classification: 'CONSISTENT' | 'CONFLICTED' | 'INCOMPLETE';
  observations: number;
  actionableObservations: number;
  anomalies: number;
  contradictionCount: number;
  confidence: number;
  claims: Array<{
    assertionKey: string;
    status: 'OBSERVED' | 'CONFLICTED' | 'UNVERIFIED';
    supportingSignalIds: string[];
  }>;
}

function classificationFor(signal: TelemetrySignal): ObservationClassification {
  switch (signal.signalType) {
    case 'SIGNAL_RESOURCE_PULSE': return 'RESOURCE';
    case 'SIGNAL_AGENT_HEALTH': return 'PERFORMANCE';
    case 'SIGNAL_VALUE_METRIC': return 'VALUE';
    case 'SIGNAL_ANOMALY_LOG': return 'ANOMALY';
    case 'SIGNAL_EXTERNAL_ADAPTER': return 'EXTERNAL';
    case 'SIGNAL_USER_DEMAND': return 'DEMAND';
    case 'SIGNAL_POLICY_FRICTION': return 'POLICY_FRICTION';
    case 'SIGNAL_NETWORK_LATENCY': return 'LATENCY';
    case 'SIGNAL_TASK_OUTCOME': return 'TASK_OUTCOME';
  }
}

function assertionFrom(signal: TelemetrySignal): { key: string; value: unknown } | null {
  const key = signal.payload.assertionKey;
  if (typeof key !== 'string' || !key.trim()) return null;
  return { key: key.trim(), value: signal.payload.assertionValue };
}

export class ABBAContextEngine {
  public correlate(signals: TelemetrySignal[]): CorrelatedObservationGroup[] {
    const groups = new Map<string, CorrelatedObservationGroup>();

    for (const signal of signals) {
      const existing = groups.get(signal.correlationId);
      const classification = classificationFor(signal);
      if (!existing) {
        groups.set(signal.correlationId, {
          correlationId: signal.correlationId,
          signalIds: [signal.signalId],
          sourceEntityIds: [signal.sourceEntityId],
          classifications: [classification],
          firstObservedAt: signal.timestamp,
          lastObservedAt: signal.timestamp
        });
        continue;
      }

      existing.signalIds = [...new Set([...existing.signalIds, signal.signalId])];
      existing.sourceEntityIds = [...new Set([...existing.sourceEntityIds, signal.sourceEntityId])];
      existing.classifications = [...new Set([...existing.classifications, classification])];
      existing.firstObservedAt = existing.firstObservedAt < signal.timestamp ? existing.firstObservedAt : signal.timestamp;
      existing.lastObservedAt = existing.lastObservedAt > signal.timestamp ? existing.lastObservedAt : signal.timestamp;
    }

    return [...groups.values()].sort((left, right) => left.correlationId.localeCompare(right.correlationId));
  }

  public preserveContradictions(signals: TelemetrySignal[]): ContradictionRecord[] {
    const assertions = new Map<string, { values: unknown[]; signalIds: string[] }>();

    for (const signal of signals) {
      const assertion = assertionFrom(signal);
      if (!assertion) continue;
      const current = assertions.get(assertion.key) ?? { values: [], signalIds: [] };
      if (!current.values.some((value) => JSON.stringify(value) === JSON.stringify(assertion.value))) {
        current.values.push(assertion.value);
      }
      current.signalIds.push(signal.signalId);
      assertions.set(assertion.key, current);
    }

    return [...assertions.entries()]
      .filter(([, value]) => value.values.length > 1)
      .map(([assertionKey, value]) => ({
        assertionKey,
        observedValues: value.values,
        sourceSignalIds: [...new Set(value.signalIds)],
        resolution: 'UNRESOLVED_CONFLICT'
      }))
      .sort((left, right) => left.assertionKey.localeCompare(right.assertionKey));
  }

  public buildContext(signals: TelemetrySignal[]): ABBAContextBundle {
    const groups = this.correlate(signals);
    const contradictions = this.preserveContradictions(signals);
    const sourceSignalIds = signals.map((signal) => signal.signalId);

    return {
      contextId: `context_${crypto.randomUUID()}`,
      sourceSignalIds: [...new Set(sourceSignalIds)],
      groups,
      contradictions,
      minimumContext: {
        correlationIds: groups.map((group) => group.correlationId),
        sourceEntityIds: [...new Set(signals.map((signal) => signal.sourceEntityId))],
        signalCount: signals.length
      }
    };
  }

  public synthesize(
    context: ABBAContextBundle,
    signals: TelemetrySignal[]
  ): ABBAContextSynthesis {
    const actionableObservations = signals.filter((signal) => [
      'SIGNAL_RESOURCE_PULSE',
      'SIGNAL_AGENT_HEALTH',
      'SIGNAL_VALUE_METRIC',
      'SIGNAL_ANOMALY_LOG',
      'SIGNAL_POLICY_FRICTION',
      'SIGNAL_TASK_OUTCOME'
    ].includes(signal.signalType)).length;

    const anomalies = signals.filter((signal) => signal.signalType === 'SIGNAL_ANOMALY_LOG').length;
    const contradictionKeys = new Set(context.contradictions.map((item) => item.assertionKey));
    const claims = new Map<string, { status: 'OBSERVED' | 'CONFLICTED' | 'UNVERIFIED'; supportingSignalIds: string[] }>();

    for (const signal of signals) {
      const assertion = assertionFrom(signal);
      if (!assertion) continue;
      const existing = claims.get(assertion.key);
      claims.set(assertion.key, {
        status: contradictionKeys.has(assertion.key) ? 'CONFLICTED' : 'OBSERVED',
        supportingSignalIds: [...new Set([...(existing?.supportingSignalIds ?? []), signal.signalId])]
      });
    }

    const completeness = signals.length ? 1 : 0;
    const conflictPenalty = Math.min(0.6, context.contradictions.length * 0.1);
    const confidence = Number(Math.max(0, Math.min(1, completeness - conflictPenalty)).toFixed(6));

    return {
      contextId: context.contextId,
      classification: !signals.length ? 'INCOMPLETE' : context.contradictions.length ? 'CONFLICTED' : 'CONSISTENT',
      observations: signals.length,
      actionableObservations,
      anomalies,
      contradictionCount: context.contradictions.length,
      confidence,
      claims: [...claims.entries()].map(([assertionKey, value]) => ({ assertionKey, ...value }))
    };
  }
}
