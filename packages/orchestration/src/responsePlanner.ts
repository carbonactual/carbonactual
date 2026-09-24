import type { ABBAContextSynthesis } from './contextEngine';
import type { TelemetrySignal } from './feedbackEngine';

export type ResponseProposalType =
  | 'TEAM_PROPOSAL'
  | 'WORKFLOW_ADJUSTMENT_PROPOSAL'
  | 'RESOURCE_REALLOCATION_PROPOSAL'
  | 'POLICY_CHANGE_PROPOSAL'
  | 'PULSE_RECALCULATION_REQUEST'
  | 'ANOMALY_ESCALATION';

export interface ResponseProposal {
  proposalId: string;
  type: ResponseProposalType;
  objective: string;
  reason: string;
  sourceSignalIds: string[];
  contextId: string;
  priority: 'ROUTINE' | 'ATTENTION' | 'URGENT';
  authorityRequired: true;
  executionAllowed: false;
}

export interface ResponsePlan {
  planId: string;
  contextId: string;
  proposals: ResponseProposal[];
  authorizationRequired: true;
}

export class ABBAResponsePlanner {
  public buildPlan(
    contextId: string,
    synthesis: ABBAContextSynthesis,
    signals: TelemetrySignal[]
  ): ResponsePlan {
    const sourceSignalIds = [...new Set(signals.map((signal) => signal.signalId))];
    const proposals: ResponseProposal[] = [];

    if (synthesis.anomalies > 0) {
      proposals.push(this.proposal(
        'ANOMALY_ESCALATION',
        'Investigate and contain validated anomaly observations',
        `Anomaly observations detected: ${synthesis.anomalies}`,
        sourceSignalIds,
        contextId,
        'URGENT'
      ));
    }

    if (synthesis.contradictionCount > 0) {
      proposals.push(this.proposal(
        'WORKFLOW_ADJUSTMENT_PROPOSAL',
        'Resolve conflicting observations before consequential progression',
        `Contradictory assertions preserved: ${synthesis.contradictionCount}`,
        sourceSignalIds,
        contextId,
        'ATTENTION'
      ));
    }

    if (signals.some((signal) => signal.signalType === 'SIGNAL_RESOURCE_PULSE')) {
      proposals.push(this.proposal(
        'RESOURCE_REALLOCATION_PROPOSAL',
        'Re-evaluate resource allocation against observed demand and yield',
        'Resource pulse observations require rebalancing analysis',
        sourceSignalIds,
        contextId,
        'ATTENTION'
      ));
    }

    if (signals.some((signal) => signal.signalType === 'SIGNAL_POLICY_FRICTION')) {
      proposals.push(this.proposal(
        'POLICY_CHANGE_PROPOSAL',
        'Review policy friction and identify governed policy alternatives',
        'Policy friction observation requires policy analysis',
        sourceSignalIds,
        contextId,
        'ATTENTION'
      ));
    }

    if (signals.some((signal) => signal.signalType === 'SIGNAL_VALUE_METRIC')) {
      proposals.push(this.proposal(
        'PULSE_RECALCULATION_REQUEST',
        'Recalculate feedback metrics from reconciled value observations',
        'Value observations are available for governed reconciliation',
        sourceSignalIds,
        contextId,
        'ROUTINE'
      ));
    }

    return {
      planId: `response_${crypto.randomUUID()}`,
      contextId,
      proposals,
      authorizationRequired: true
    };
  }

  private proposal(
    type: ResponseProposalType,
    objective: string,
    reason: string,
    sourceSignalIds: string[],
    contextId: string,
    priority: ResponseProposal['priority']
  ): ResponseProposal {
    return {
      proposalId: `proposal_${crypto.randomUUID()}`,
      type,
      objective,
      reason,
      sourceSignalIds,
      contextId,
      priority,
      authorityRequired: true,
      executionAllowed: false
    };
  }
}
