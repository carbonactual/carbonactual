# CARBON ACTUAL — ABBA LIVE SUBSTRATE RECONCILIATION — 2026

## Purpose

Phase 6 binds the canonical ABBA control model to the existing Carbon Actual runtime substrate.

It does **not** create a second runtime universe.

The live substrate remains implementation infrastructure. Carbon Actual contracts and HAPI World Canon remain semantic authority.

## Live binding model

`CANON → CONTRACT → ADAPTER → LIVE SUBSTRATE`

Reads flow through adapters into reconciliation and context synthesis.

Consequential writes continue through:

`INTENT → CAPABILITY → PROPOSAL → AUTHORITY/POLICY/CONSENT → EXECUTION → EVIDENCE → CANONICAL EVENT`

## Existing substrate retained

The adapter layer reuses:

- `omnii_abba_profiles`
- `omnii_abba_sessions`
- `omnii_abba_plans`
- `omnii_abba_decisions`
- `omnii_abba_tool_calls`
- `omnii_abba_memory_records`
- `omnii_process_tasks`
- `canonical_runtime_records`
- `omnii_execution_controls`
- `omnii_events`
- `omnii_state`
- `omnii_reconciliations`
- `omnii_common_primitives`
- `ecosystem_capability_metadata`

The live Supabase schema inspection on 2026-09-24 confirmed these surfaces exist. The adapter does not rename, delete, or reinterpret them as constitutional authorities.

## Reconciliation

The live substrate scanner emits `ReconciliationInput` records only.

It never silently repairs data.

Statuses remain:

`MATCHED | MISMATCHED | MISSING_CANONICAL | MISSING_SUBSTRATE | STALE | DUPLICATE | CONTESTED | UNKNOWN`

A repair proposal is always:

- authority required
- execution disallowed until independently authorized
- traceable to the observed substrate and evidence

## Evidence quality

Evidence is explicitly classified as:

`DIRECT_SYSTEM | EXTERNAL_PROVIDER | HUMAN_ATTESTATION | DERIVED_ANALYSIS | PROVISIONAL`

Evidence quality is an assessment layer. It is not a truth-promotion mechanism.

## Completion proof

A completion proof binds:

- objective
- evidence completeness
- reconciliation completeness
- outstanding jobs
- blockers
- terminal reason
- proof fingerprint

Completion is therefore a verifiable state claim rather than a message emitted because a worker stopped.

## Recovery

Execution attempts have durable idempotency.

A `RECOVERY_REQUIRED` attempt is not automatically replayed. It is handed to reconciliation and recovery logic first.

Expired job leases are recovered into the supervisor path rather than treated as successful completion.

## Deployment posture

Phase 6 is staged in GitHub only.

No Phase 6 migration has been applied to the live Supabase production project.

The next live step is controlled deployment after:

1. repository CI passes,
2. migration preflight passes,
3. substrate reconciliation is clean or explicitly adjudicated,
4. RLS/function privilege posture is reviewed,
5. live deployment is performed through the existing controlled runtime.
