export interface ActionExecutionInput { actionId: string; payload: Record<string, unknown>; }
export interface ActionExecutionOutcome { status: 'SUCCESS' | 'FAILED'; result: Record<string, unknown>; evidenceRef: string; }
export interface ActionExecutor { execute(input: ActionExecutionInput): Promise<ActionExecutionOutcome>; }

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
export interface GatedExecutionResult { executionId: string; status: 'EXECUTED' | 'BLOCKED' | 'FAILED'; canonicalEventId?: string; evidenceRef?: string; result?: Record<string, unknown>; reason?: string; }

function invalidEnvelope(event: CanonicalEventEnvelope): string | null {
  for (const field of ['eventType','actorEntityId','authorityRef','authoritySignature','correlationId','idempotencyKey','schemaVersion','policyVersion']) {
    const value = event[field as keyof CanonicalEventEnvelope];
    if (typeof value !== 'string' || !value.trim()) return `CANONICAL_EVENT_${field.toUpperCase()}_REQUIRED`;
  }
  return null;
}

export class ABBAExecutionGateway {
  constructor(private readonly actionExecutor: ActionExecutor, private readonly canonicalEventWriter: CanonicalEventWriter) {}

  public async execute(request: GatedExecutionRequest): Promise<GatedExecutionResult> {
    const executionId = `execution_${crypto.randomUUID()}`;

    if (request.gateDecision !== 'ALLOW') {
      return { executionId, status: 'BLOCKED', reason: request.gateDecision === 'DENY' ? 'POLICY_OR_AUTHORITY_DENIED' : 'HUMAN_AUTHORIZATION_REQUIRED' };
    }

    const envelopeError = invalidEnvelope(request.canonicalEvent);
    if (envelopeError) return { executionId, status: 'FAILED', reason: envelopeError };

    const outcome = await this.actionExecutor.execute({ actionId: request.actionId, payload: request.payload });
    if (!outcome.evidenceRef.trim()) return { executionId, status: 'FAILED', reason: 'EXECUTION_EVIDENCE_REQUIRED' };

    let eventId: string;
    try {
      eventId = await this.canonicalEventWriter.append({
        ...request.canonicalEvent,
        payload: { ...request.canonicalEvent.payload, executionId, executionStatus: outcome.status, executionResult: outcome.result, evidenceRef: outcome.evidenceRef },
        provenance: { ...request.canonicalEvent.provenance, executionGateway: 'ABBAExecutionGateway' }
      });
    } catch {
      return { executionId, status: 'FAILED', evidenceRef: outcome.evidenceRef, result: outcome.result, reason: 'CANONICAL_EVENT_PERSISTENCE_FAILED' };
    }

    return { executionId, status: outcome.status === 'SUCCESS' ? 'EXECUTED' : 'FAILED', canonicalEventId: eventId, evidenceRef: outcome.evidenceRef, result: outcome.result };
  }
}
