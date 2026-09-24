import {
  assertCanonicalEvent,
  CanonicalEvent,
  CanonicalEventType
} from '@carbon-actual/events';

export interface MutationProposal {
  proposalId: string;
  controlPlaneId: string;
  targetCapability: string;
  actorEntityId: string;
  proposedEvent: CanonicalEvent;
  policyCheckPassed: boolean;
  policyDecision: 'ALLOW' | 'DENY' | 'REQUIRE_HUMAN_AUTHORIZATION';
}

export interface MutationProposalInput {
  actorEntityId: string;
  principalEntityId?: string;
  eventType: CanonicalEventType;
  payload: Record<string, unknown>;
  authoritySignature: string;
  authorityRef?: string;
  policyVersion: string;
  correlationId?: string;
  causationId?: string;
  idempotencyKey: string;
  riskClass?: string;
  provenance?: { source: string; [key: string]: unknown };
}

export class ABBAOrchestrator {
  constructor(private readonly controlPlaneId: string) {}

  public createMutationProposal(input: MutationProposalInput): MutationProposal {
    const event: CanonicalEvent = {
      eventId: crypto.randomUUID(),
      eventType: input.eventType,
      actorEntityId: input.actorEntityId,
      principalEntityId: input.principalEntityId,
      authorityRef: input.authorityRef,
      authoritySignature: input.authoritySignature,
      timestamp: new Date().toISOString(),
      correlationId: input.correlationId ?? crypto.randomUUID(),
      causationId: input.causationId,
      idempotencyKey: input.idempotencyKey,
      schemaVersion: 'canonical-event-1.0.0',
      policyVersion: input.policyVersion,
      provenance: input.provenance ?? { source: 'ABBA_CONTROL_PLANE' },
      payload: input.payload,
      pulseImpact: {
        deltaValue: 0,
        computeUnitsUsed: 1,
        decimalizedUnits: '100000000000000000'
      }
    };

    assertCanonicalEvent(event);

    const policyDecision = this.preflight(event, input.riskClass);
    return {
      proposalId: crypto.randomUUID(),
      controlPlaneId: this.controlPlaneId,
      targetCapability: `cap_${input.eventType}`,
      actorEntityId: input.actorEntityId,
      proposedEvent: event,
      policyCheckPassed: policyDecision === 'ALLOW',
      policyDecision
    };
  }

  private preflight(event: CanonicalEvent, riskClass?: string): MutationProposal['policyDecision'] {
    if (!event.authoritySignature || !event.authorityRef) {
      return 'REQUIRE_HUMAN_AUTHORIZATION';
    }
    if (riskClass === 'HIGH' && !event.principalEntityId) {
      return 'REQUIRE_HUMAN_AUTHORIZATION';
    }
    return 'ALLOW';
  }
}
