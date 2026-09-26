export type CanonicalEventType =
  | 'agent_created'
  | 'agent_registered'
  | 'agent_capabilities_bound'
  | 'agent_activated'
  | 'agent_task_started'
  | 'agent_task_completed'
  | 'resource_consumed'
  | 'capability_used'
  | 'value_created'
  | 'value_transferred'
  | 'payment_received'
  | 'liability_created'
  | 'asset_created'
  | 'asset_consumed'
  | 'agent_contract_formed'
  | 'agent_contract_settled'
  | 'pulse_observed'
  | 'ledger_posted'
  | 'settlement_confirmed'
  | 'settlement_failed'
  | 'agent_suspended'
  | 'agent_terminated'
  | 'reconciliation_completed'
  | 'abba_reasoning_bound';

export interface PulseImpact {
  deltaValue: number;
  computeUnitsUsed: number;
  decimalizedUnits: string;
}

export interface EventProvenance {
  source: string;
  verified?: boolean;
  evidenceRef?: string;
  [key: string]: unknown;
}

export interface CanonicalEvent<T = Record<string, unknown>> {
  eventId: string;
  eventType: CanonicalEventType;
  actorEntityId: string;
  principalEntityId?: string;
  subjectRef?: string;
  authorityRef?: string;
  authoritySignature: string;
  timestamp: string;
  recordedAt?: string;
  correlationId: string;
  causationId?: string;
  idempotencyKey: string;
  schemaVersion: string;
  policyVersion?: string;
  provenance: EventProvenance;
  evidenceRef?: string;
  payload: T;
  pulseImpact: PulseImpact;
  preStateHash?: string;
  postStateHash?: string;
}

export const CANONICAL_EVENT_TYPES: readonly CanonicalEventType[] = [
  'agent_created','agent_registered','agent_capabilities_bound','agent_activated',
  'agent_task_started','agent_task_completed','resource_consumed','capability_used',
  'value_created','value_transferred','payment_received','liability_created',
  'asset_created','asset_consumed','agent_contract_formed','agent_contract_settled',
  'pulse_observed','ledger_posted','settlement_confirmed','settlement_failed',
  'agent_suspended','agent_terminated','reconciliation_completed','abba_reasoning_bound'
] as const;
