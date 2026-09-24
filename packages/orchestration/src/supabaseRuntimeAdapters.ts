import type { HumanCoordinationStore } from './humanCoordinationPack';
import type { CanonicalEventEnvelope, CanonicalEventWriter } from './executionGateway';
import type { ReasoningSubstrateBindingStore } from './governedReasoningSubstrateBridge';
import type {
  ABBAControlCycle,
  ABBAJobRun,
  JobRunStore,
  SubstrateBinding,
  SubstrateBindingStore
} from './abbaSupervisor';
import type {
  ObservationStore,
  TeamProposalStore,
  ResponseProposalStore
} from './closedLoopRuntime';
import type { TelemetryProcessingResult, TelemetrySignal, CuratedTeamProposal } from './feedbackEngine';
import type { ResponseProposal } from './responsePlanner';
import type {
  ExecutionAttempt,
  ExecutionAttemptReservation,
  ExecutionAttemptStore,
  ActionExecutionOutcome
} from './executionGateway';

export interface SupabaseRpcClient {
  call(functionName: string, payload: Record<string, unknown>): Promise<unknown>;
}

export interface SupabaseTableReader {
  select(
    table: string,
    options?: { columns?: string; limit?: number; filters?: Record<string, string> }
  ): Promise<Array<Record<string, unknown>>>;
}

function rpcId(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value[0] && typeof value[0] === 'object') {
    const first = value[0] as Record<string, unknown>;
    const candidate = first.id ?? first.uuid ?? first.proposal_id ?? first.observation_id ?? first.reconciliation_id ?? first.completion_id ?? first.proof_id;
    if (typeof candidate === 'string') return candidate;
  }
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const candidate = object.id ?? object.uuid ?? object.proposal_id ?? object.observation_id ?? object.reconciliation_id ?? object.completion_id ?? object.proof_id;
    if (typeof candidate === 'string') return candidate;
  }
  throw new Error('SUPABASE_RPC_IDENTIFIER_NOT_RETURNED');
}

function rpcObject(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    const first = value[0];
    if (first && typeof first === 'object') return first as Record<string, unknown>;
  }
  if (value && typeof value === 'object') return value as Record<string, unknown>;
  throw new Error('SUPABASE_RPC_OBJECT_NOT_RETURNED');
}

export function createSupabaseRpcClient(
  baseUrl: string,
  serverToken: string,
  fetchImpl: typeof fetch = fetch
): SupabaseRpcClient {
  const normalized = baseUrl.replace(/\/$/, '');
  return {
    async call(functionName, payload) {
      const response = await fetchImpl(`${normalized}/rest/v1/rpc/${encodeURIComponent(functionName)}`, {
        method: 'POST',
        headers: {
          apikey: serverToken,
          Authorization: `Bearer ${serverToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`SUPABASE_RPC_FAILED:${response.status}:${body.slice(0, 500)}`);
      }

      return response.json();
    }
  };
}

export function createSupabaseTableReader(
  baseUrl: string,
  readToken: string,
  fetchImpl: typeof fetch = fetch
): SupabaseTableReader {
  const normalized = baseUrl.replace(/\/$/, '');
  return {
    async select(table, options = {}) {
      const tableName = table.startsWith('public.') ? table.slice('public.'.length) : table;
      const query = new URLSearchParams();
      query.set('select', options.columns ?? '*');
      if (options.limit) query.set('limit', String(options.limit));
      for (const [column, expression] of Object.entries(options.filters ?? {})) {
        query.set(column, expression);
      }

      const response = await fetchImpl(`${normalized}/rest/v1/${encodeURIComponent(tableName)}?${query.toString()}`, {
        method: 'GET',
        headers: {
          apikey: readToken,
          Authorization: `Bearer ${readToken}`,
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`SUPABASE_SELECT_FAILED:${response.status}:${body.slice(0, 500)}`);
      }

      const value = await response.json();
      if (!Array.isArray(value)) throw new Error('SUPABASE_SELECT_EXPECTED_ARRAY');
      return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
    }
  };
}

export class SupabaseCanonicalEventWriter implements CanonicalEventWriter {
  constructor(private readonly rpc: SupabaseRpcClient) {}
  async append(event: CanonicalEventEnvelope): Promise<string> {
    return rpcId(await this.rpc.call('append_canonical_event', event as unknown as Record<string, unknown>));
  }
}

export class SupabaseObservationStore implements ObservationStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}
  async record(signal: TelemetrySignal, processing: TelemetryProcessingResult): Promise<void> {
    await this.rpc.call('append_feedback_observation', {
      signalId: signal.signalId,
      signalType: signal.signalType,
      sourceType: signal.sourceType,
      sourceEntityId: signal.sourceEntityId,
      correlationId: signal.correlationId,
      timestamp: signal.timestamp,
      integrityStatus: processing.disposition,
      actionRequired: processing.actionRequired,
      anomalyReason: processing.anomalyReason,
      signature: signal.signature,
      provenance: signal.provenance,
      payload: signal.payload
    });
  }
}

export class SupabaseTeamProposalStore implements TeamProposalStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}
  async record(
    proposal: CuratedTeamProposal,
    metadata: { cycleId: string; correlationId: string; sourceSignalIds: string[]; idempotencyKey: string }
  ): Promise<void> {
    await this.rpc.call('append_abba_team_proposal', {
      teamId: proposal.teamId,
      cycleId: metadata.cycleId,
      correlationId: metadata.correlationId,
      objective: proposal.objective,
      assignedEntityIds: proposal.assignedEntityIds,
      contextPayload: proposal.contextPayload,
      estimatedYield: proposal.estimatedYield,
      selectionBasis: proposal.selectionBasis,
      sourceSignalIds: metadata.sourceSignalIds,
      idempotencyKey: metadata.idempotencyKey
    });
  }
}

export class SupabaseResponseProposalStore implements ResponseProposalStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}
  async record(
    proposal: ResponseProposal,
    metadata: { responsePlanId: string; idempotencyKey: string }
  ): Promise<void> {
    await this.rpc.call('append_abba_response_proposal', {
      responsePlanId: metadata.responsePlanId,
      proposalId: proposal.proposalId,
      proposalType: proposal.type,
      contextId: proposal.contextId,
      objective: proposal.objective,
      reason: proposal.reason,
      sourceSignalIds: proposal.sourceSignalIds,
      priority: proposal.priority,
      idempotencyKey: metadata.idempotencyKey
    });
  }
}

export class SupabaseJobRunStore implements JobRunStore {
  constructor(private readonly rpc: SupabaseRpcClient, private readonly reader: SupabaseTableReader) {}

  async loadCycle(cycleId: string): Promise<ABBAControlCycle | null> {
    const rows = await this.reader.select('abba_control_cycles', { filters: { cycle_id: `eq.${cycleId}` }, limit: 1 });
    const row = rows[0];
    if (!row) return null;
    return {
      cycleId: String(row.cycle_id),
      objective: String(row.objective),
      status: String(row.status) as ABBAControlCycle['status'],
      terminalReason: row.terminal_reason ? String(row.terminal_reason) : undefined
    };
  }

  async loadRuns(cycleId: string): Promise<ABBAJobRun[]> {
    const rows = await this.reader.select('abba_job_runs', { filters: { cycle_id: `eq.${cycleId}` } });
    return rows.map((row) => ({
      cycleId: String(row.cycle_id),
      jobId: String(row.job_id),
      status: String(row.status) as ABBAJobRun['status'],
      attempt: Number(row.attempt),
      idempotencyKey: String(row.idempotency_key),
      leasedBy: row.leased_by ? String(row.leased_by) : undefined,
      leaseExpiresAt: row.lease_expires_at ? String(row.lease_expires_at) : undefined,
      nextAttemptAt: row.next_attempt_at ? String(row.next_attempt_at) : undefined,
      output: row.output && typeof row.output === 'object' ? row.output as Record<string, unknown> : undefined,
      error: row.error ? String(row.error) : undefined
    }));
  }

  async upsertCycle(cycle: ABBAControlCycle): Promise<void> {
    await this.rpc.call('append_abba_control_cycle', {
      cycleId: cycle.cycleId,
      objective: cycle.objective,
      status: cycle.status,
      terminalReason: cycle.terminalReason
    });
  }

  async upsertRun(run: ABBAJobRun): Promise<void> {
    await this.rpc.call('append_abba_job_run', {
      cycleId: run.cycleId,
      jobId: run.jobId,
      status: run.status,
      attempt: run.attempt,
      idempotencyKey: run.idempotencyKey,
      leasedBy: run.leasedBy,
      leaseExpiresAt: run.leaseExpiresAt,
      nextAttemptAt: run.nextAttemptAt,
      output: run.output,
      error: run.error
    });
  }
}

export class SupabaseSubstrateBindingStore implements SubstrateBindingStore {
  constructor(private readonly rpc: SupabaseRpcClient, private readonly reader: SupabaseTableReader) {}

  async find(canonicalRef: string): Promise<SubstrateBinding[]> {
    const rows = await this.reader.select('abba_substrate_bindings', {
      filters: { canonical_ref: `eq.${canonicalRef}` }
    });
    return rows.map((row) => ({
      canonicalRef: String(row.canonical_ref),
      substrateKind: String(row.substrate_kind) as SubstrateBinding['substrateKind'],
      substrateRef: String(row.substrate_ref),
      status: String(row.status) as SubstrateBinding['status'],
      provenance: row.provenance && typeof row.provenance === 'object' ? row.provenance as Record<string, unknown> : {}
    }));
  }

  async bind(binding: SubstrateBinding): Promise<void> {
    await this.rpc.call('append_abba_substrate_binding', {
      canonicalRef: binding.canonicalRef,
      substrateKind: binding.substrateKind,
      substrateRef: binding.substrateRef,
      status: binding.status,
      provenance: binding.provenance
    });
  }
}

export interface SupabaseReconciliationStore {
  append(input: Record<string, unknown>): Promise<string>;
}

export class SupabaseReconciliationWriter implements SupabaseReconciliationStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}
  async append(input: Record<string, unknown>): Promise<string> {
    return rpcId(await this.rpc.call('append_abba_reconciliation_record', input));
  }
}

export interface SupabaseCompletionStore {
  append(input: Record<string, unknown>): Promise<string>;
}

export class SupabaseCompletionWriter implements SupabaseCompletionStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}
  async append(input: Record<string, unknown>): Promise<string> {
    return rpcId(await this.rpc.call('append_abba_completion_proof', input));
  }
}

export class SupabaseExecutionAttemptStore implements ExecutionAttemptStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}

  async reserve(input: { executionId: string; actionId: string; idempotencyKey: string }): Promise<import('./executionGateway').ExecutionAttemptReservationResult> {
    const result = rpcObject(await this.rpc.call('reserve_abba_execution_attempt', {
      executionId: input.executionId,
      actionId: input.actionId,
      idempotencyKey: input.idempotencyKey
    }));
    const reservation = String(result.reservation) as ExecutionAttemptReservation;
    return {
      reservation,
      existingExecutionId: typeof result.executionId === 'string' ? result.executionId : undefined
    };
  }

  private async update(executionId: string, status: ExecutionAttempt['status'], extra: Record<string, unknown> = {}): Promise<void> {
    await this.rpc.call('update_abba_execution_attempt', {
      executionId, status, ...extra
    });
  }

  async markRunning(executionId: string): Promise<void> {
    await this.update(executionId, 'RUNNING');
  }

  async markSucceeded(executionId: string, outcome: ActionExecutionOutcome): Promise<void> {
    await this.update(executionId, 'SUCCEEDED', {
      evidenceRef: outcome.evidenceRef,
      result: outcome.result
    });
  }

  async markFailed(executionId: string, error: string, evidenceRef?: string): Promise<void> {
    await this.update(executionId, 'FAILED', { error, evidenceRef });
  }

  async markRecoveryRequired(executionId: string, reason: string, evidenceRef?: string): Promise<void> {
    await this.update(executionId, 'RECOVERY_REQUIRED', { error: reason, evidenceRef });
  }
}

export class SupabaseReasoningSubstrateBindingStore implements ReasoningSubstrateBindingStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}

  async append(input: Record<string, unknown>): Promise<string> {
    return rpcId(await this.rpc.call('append_abba_reasoning_substrate_binding', input));
  }

  async update(bindingId: string, update: Record<string, unknown>): Promise<void> {
    await this.rpc.call('update_abba_reasoning_substrate_binding', {
      bindingId,
      ...update
    });
  }
}

import { CANONICAL_EVENT_TYPES, type CanonicalEventType } from '../../events/src/types';

export class SupabaseOmniiEventWriter implements CanonicalEventWriter {
  constructor(private readonly rpc: SupabaseRpcClient) {}

  async append(event: CanonicalEventEnvelope): Promise<string> {
    const actor = event.actorEntityId;
    const source = 'carbonactual/abba';
    if (!CANONICAL_EVENT_TYPES.includes(event.eventType as CanonicalEventType)) {
      throw new Error(`UNSUPPORTED_CANONICAL_EVENT_TYPE:${event.eventType}`);
    }
    const payload = { ...event.payload, authorityRef: event.authorityRef };
    const result = await this.rpc.call('omnii_append_event', {
      p_id: crypto.randomUUID(),
      p_event_type: event.eventType as CanonicalEventType,
      p_event_version: '1',
      p_schema_version: event.schemaVersion,
      p_lifecycle: 'active',
      p_status: 'accepted',
      p_occurred_at: new Date().toISOString(),
      p_recorded_at: new Date().toISOString(),
      p_actor_ref: actor,
      p_subject_ref: typeof event.payload.subjectRef === 'string' ? event.payload.subjectRef : null,
      p_institution_ref: typeof event.payload.institutionRef === 'string' ? event.payload.institutionRef : null,
      p_operating_context_id: typeof event.payload.operatingContextId === 'string' ? event.payload.operatingContextId : null,
      p_correlation_id: event.correlationId,
      p_causation_id: event.causationId ?? null,
      p_parent_event_id: typeof event.payload.parentEventId === 'string' ? event.payload.parentEventId : null,
      p_reality_state: typeof event.payload.realityState === 'string' ? event.payload.realityState : 'actual',
      p_authority_ref: event.authorityRef,
      p_source: source,
      p_provenance: {
        ...event.provenance,
        authoritySignature: event.authoritySignature,
        canonicalAdapter: 'SupabaseOmniiEventWriter'
      },
      p_evidence_refs: event.payload.evidenceRefs ?? [],
      p_metadata: {
        principalEntityId: event.principalEntityId ?? null,
        policyVersion: event.policyVersion,
        schemaVersion: event.schemaVersion
      },
      p_payload: payload,
      p_idempotency_key: event.idempotencyKey
    });

    return rpcId(result);
  }
}

export class SupabaseHumanCoordinationStore implements HumanCoordinationStore {
  constructor(private readonly rpc: SupabaseRpcClient) {}

  async recordRequest(input: Record<string, unknown>): Promise<string> {
    return rpcId(await this.rpc.call('append_abba_human_coordination_request', input));
  }

  async recordDecision(input: Record<string, unknown>): Promise<string> {
    return rpcId(await this.rpc.call('append_abba_human_decision', input));
  }
}
