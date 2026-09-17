# Carbon Actual Canonical Event and State Integrity

**Status: canonical technical contract**

## Purpose

Preserve a reconstructible evidence path while allowing fast derived current-state views.

## Separation

```text
EVENT / EVIDENCE = durable fact
STATE             = derived current condition
PROJECTION        = purpose-specific view
CACHE             = acceleration only
```

A projection or cache MUST NOT silently become the authoritative replacement for an underlying event/evidence record.

## Event minimum contract

Every canonical event SHOULD carry:

```text
id
kind
subject / entity reference
actor / executor reference
occurred_at
recorded_at
correlation_id
causation_id
provenance
authority reference when consequential
payload / evidence reference
schema version
```

## Integrity rules

1. Duplicate event identifiers are rejected.
2. Unknown entity types remain representable and provisional.
3. Out-of-order events are accepted only where the event contract supports ordering reconstruction.
4. Conflicting state writes must retain their evidence rather than overwrite history silently.
5. Rebuild operations derive state from accepted evidence and must be idempotent.
6. External events retain source and provenance information.
7. Consequential events retain the applicable authority lineage.
8. Pulse records remain distinct from raw telemetry and events.

## State transition contract

```text
prior_state + accepted_event + policy/context
       -> validated transition
       -> new derived state
       -> evidence link
```

No state transition may manufacture authority that was not present in the input context.

## Recovery

When a projection is corrupted, the recovery path is:

```text
projection/cache
   X
   ↓ rebuild
canonical events/evidence
   ↓
state projector
   ↓
reconstructed projection
```

This contract preserves continuity while allowing implementation-specific storage and indexing choices.
