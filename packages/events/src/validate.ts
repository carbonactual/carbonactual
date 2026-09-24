import { CANONICAL_EVENT_TYPES, CanonicalEvent } from './types';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCanonicalEvent(event: CanonicalEvent): string[] {
  const errors: string[] = [];
  if (!UUID_V4.test(event.eventId)) errors.push('eventId must be a UUID');
  if (!CANONICAL_EVENT_TYPES.includes(event.eventType)) errors.push('eventType is not canonical');
  if (!UUID_V4.test(event.actorEntityId)) errors.push('actorEntityId must be a UUID');
  if (event.principalEntityId && !UUID_V4.test(event.principalEntityId)) errors.push('principalEntityId must be a UUID');
  if (event.authorityRef && !UUID_V4.test(event.authorityRef)) errors.push('authorityRef must be a UUID');
  if (!event.authoritySignature.trim()) errors.push('authoritySignature is required');
  if (!event.idempotencyKey.trim()) errors.push('idempotencyKey is required');
  if (!event.schemaVersion.trim()) errors.push('schemaVersion is required');
  if (!event.correlationId.trim()) errors.push('correlationId is required');
  if (!event.provenance?.source?.trim()) errors.push('provenance.source is required');
  if (!event.payload || typeof event.payload !== 'object') errors.push('payload must be an object');
  if (!Number.isFinite(event.pulseImpact.deltaValue)) errors.push('pulseImpact.deltaValue must be finite');
  if (!Number.isFinite(event.pulseImpact.computeUnitsUsed)) errors.push('pulseImpact.computeUnitsUsed must be finite');
  if (!event.pulseImpact.decimalizedUnits.trim()) errors.push('pulseImpact.decimalizedUnits is required');
  return errors;
}

export function assertCanonicalEvent(event: CanonicalEvent): void {
  const errors = validateCanonicalEvent(event);
  if (errors.length) throw new Error(`CANONICAL_EVENT_INVALID: ${errors.join('; ')}`);
}
