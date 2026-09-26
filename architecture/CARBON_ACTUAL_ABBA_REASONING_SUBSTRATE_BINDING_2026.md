# CARBON ACTUAL — ABBA REASONING ASSURANCE SUBSTRATE BINDING — 2026

Phase 7 now binds the Reasoning Assurance Core to the canonical substrate without allowing reasoning to become authority.

The binding path is:

THEORY → HYPOTHESIS → OBSERVATION → EVIDENCE → RESULT → CONCLUSION → RECOMMENDATION → DECISION
→ AUTHORITY / POLICY / CONSENT
→ CANONICAL EVENT INGRESSION.

The binder validates epistemic direction, persists a durable reasoning-chain audit record, evaluates the independent governance gate when a decision exists, and emits the explicit `abba_reasoning_bound` event only after the gate returns ALLOW.

A missing signature, missing authority/consent references, out-of-order reasoning, invalid reasoning artifact, denied policy, denied authority or unsatisfied consent blocks emission.

The binder does not invent a `SYSTEM_INTERNAL` authority signature and does not write `canonical_events` directly.

The migration is intentionally appended at the next free migration position because `20260924000004` is already occupied by response-proposal persistence. Historical migration names are never overwritten.
