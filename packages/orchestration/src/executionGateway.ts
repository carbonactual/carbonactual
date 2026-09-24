export interface ActionExecutionInput { actionId: string; payload: Record<string, unknown>; }
export interface ActionExecutionOutcome { status: 'SUCCESS' | 'FAILED'; result: Record<string, unknown>; evidenceRef: string; }
export interface ActionExecutor { execute(input: ActionExecutionInput): Promise<ActionExecutionOutcome>; }

export type ExecutionAttemptReservation = 'RESERVED' | 'ALREADY_RUNNING' | 'ALREADY_SUCCEEDED' | 'ALREADY_FAILED' | 'ALREADY_RECOVERY_REQUIRED';

export interface ExecutionAttempt {
  executionId: string;
  actionId: string;
  idempotencyKey: string;
  status: 'RESERVED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'RECOVERY_REQUIRED';
  evidenceRef?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionAttemptStore {
  reserve(input: { executionId: string; actionId: string; idempotencyKey: string }): Promise<ExecutionAttemptReservation>;
  markRunning(executionId: string): Promise<void>;
  markSucceeded(executionId: string, outcome: ActionExecutionOutcome): Promise<void>;
  markFailed(executionId: string, error: string, evidenceRef?: string): Promise<void>;
  markRecoveryRequired(executionId: string, reason: string, evidenceRef?: string): Promise<void>;
}

export interface CanonicalEventEnvelope {
  eventType: string;
  actorEntityId: string;
  principalEntityId?: string;
  authorityRef: string;
  authoritySignature: string;
  correlationId: string;
  causationId?: string;
  idempotencyKey: string;
  schemaVersion: string;
  policyVersion: string;
  provenance: Record<string, unknown>;
  payload: Record<string, unknown>;
  pulseImpact: Record<string, unknown>;
}
export interface CanonicalEventWriter { append(event: CanonicalEventEnvelope): Promise<string>; }
export interface GatedExecutionRequest { gateDecision: 'ALLOW' | 'DENY' | 'REQUIRE_HUMAN_AUTHORIZATION'; actionId: string; payload: Record<string, unknown>; canonicalEvent: CanonicalEventEnvelope; }
export interface GatedExecutionResult { executionId: string; status: 'EXECUTED' | 'BLOCKED' | 'FAILED' | 'RECOVERY_REQUIRED'; canonicalEventId?: string; evidenceRef?: string; result?: Record<string, unknown>; reason?: string; }

function invalidEnvelope(event: CanonicalEventEnvelope): string | null {
  for (const field of ['eventType','actorEntityId','authorityRef','authoritySignature','correlationId','idempotencyKey','schemaVersion','policyVersion']) {
    const value = event[field as keyof CanonicalEventEnvelope];
    if (typeof value !== 'string' || !value.trim()) return `CANONICAL_EVENT_${field.toUpperCase()}_REQUIRED`;
  }
  return null;
}

export class ABBAExecutionGateway {
  constructor(
    private readonly actionExecutor: ActionExecutor,
    private readonly canonicalEventWriter: CanonicalEventWriter,
    private readonly attemptStore: ExecutionAttemptStore
  ) {}

  public async execute(request: GatedExecutionRequest): Promise<GatedExecutionResult> {
    const executionId = `execution_${crypto.randomUUID()}`;

    if (request.gateDecision !== 'ALLOW') {
      return { executionId, status: 'BLOCKED', reason: request.gateDecision === 'DENY' ? 'POLICY_OR_AUTHORITY_DENIED' : 'HUMAN_AUTHORIZATION_REQUIRED' };
    }

    const envelopeError = invalidEnvelope(request.canonicalEvent);
    if (envelopeError) return { executionId, status: 'FAILED', reason: envelopeError };

    const reservation = await this.attemptStore.reserve({
      executionId,
      actionId: request.actionId,
      idempotencyKey: request.canonicalEvent.idempotencyKey
    });

    if (reservation === 'ALREADY_RUNNING') return { executionId, status: 'BLOCKED', reason: 'EXECUTION_ALREADY_RUNNING' };
    if (reservation === 'ALREADY_SUCCEEDED') return { executionId, status: 'BLOCKED', reason: 'EXECUTION_ALREADY_SUCCEEDED' };
    if (reservation === 'ALREADY_FAILED') return { executionId, status: 'BLOCKED', reason: 'EXECUTION_ALREADY_FAILED_REQUIRES_REVIEW' };
    if (reservation === 'ALREADY_RECOVERY_REQUIRED') return { executionId, status: 'RECOVERY_REQUIRED', reason: 'EXECUTION_RECOVERY_REQUIRED' };

    await this.attemptStore.markRunning(executionId);

    let outcome: ActionExecutionOutcome;
    try {
      outcome = await this.actionExecutor.execute({ actionId: request.actionId, payload: request.payload });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'ACTION_EXECUTION_FAILED';
      await this.attemptStore.markFailed(executionId, reason);
      return { executionId, status: 'FAILED', reason };
    }

    if (!outcome.evidenceRef.trim()) {
      await this.attemptStore.markFailed(executionId, 'EXECUTION_EVIDENCE_REQUIRED');
      return { executionId, status: 'FAILED', reason: 'EXECUTION_EVIDENCE_REQUIRED' };
    }

    if (outcome.status === 'FAILED') {
      await this.attemptStore.markFailed(executionId, 'ACTION_EXECUTOR_REPORTED_FAILURE', outcome.evidenceRef);
      return { executionId, status: 'FAILED', evidenceRef: outcome.evidenceRef, result: outcome.result, reason: 'ACTION_EXECUTOR_REPORTED_FAILURE' };
    }

    await this.attemptStore.markSucceeded(executionId, outcome);

    try {
      const eventId = await this.canonicalEventWriter.append({
        ...request.canonicalEvent,
        payload: { ...request.canonicalEvent.payload, executionId, executionStatus: outcome.status, executionResult: outcome.result, evidenceRef: outcome.evidenceRef },
        provenance: { ...request.canonicalEvent.provenance, executionGateway: 'ABBAExecutionGateway' }
      });

      return { executionId, status: 'EXECUTED', canonicalEventId: eventId, evidenceRef: outcome.evidenceRef, result: outcome.result };
    } catch {
      await this.attemptStore.markRecoveryRequired(executionId, 'CANONICAL_EVENT_PERSISTENCE_FAILED', outcome.evidenceRef);
      return { executionId, status: 'RECOVERY_REQUIRED', evidenceRef: outcome.evidenceRef, result: outcome.result, reason: 'CANONICAL_EVENT_PERSISTENCE_FAILED' };
    }
  }
}
