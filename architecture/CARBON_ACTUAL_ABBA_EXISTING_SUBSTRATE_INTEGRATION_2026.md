# ABBA — Existing Substrate Integration Strategy

The live Supabase estate already contains ABBA-oriented tables, process-task infrastructure, execution controls, event/state projections, reconciliation records, capability shelves and runtime records.

The correct architecture is therefore an **adapter/binding strategy**, not a replacement migration.

## Canonical boundary

`HAPI World Canon → Carbon Actual contracts → ABBA orchestration → substrate adapters → existing runtime records`

The existing tables are implementation surfaces. Their names, historical origin or current population do not elevate them above the active Carbon Actual repository contracts.

## Reuse priorities

1. Reuse existing ABBA profile/session/plan/decision/tool/memory structures where their contracts match.
2. Reuse existing process-task leases, retries, escalation and worker infrastructure rather than implementing a competing queue.
3. Reuse existing execution controls for timeout, retry, compensation and kill-switch semantics.
4. Reuse existing event/state/reconciliation projections through explicit adapters.
5. Reuse the capability shelf for discovery and Team composition.
6. Introduce new persistence only where the new governed lifecycle has a real missing invariant.

## Do not create a parallel universe

A binding may say:

`canonicalRef → substrateKind → substrateRef → provenance`

It must not silently say:

`substrateRef → constitutionalAuthority`

A provider, table, queue, model, runtime or existing implementation remains replaceable beneath the canonical contracts.

## Reconciliation obligation

For every bound concept ABBA should be able to answer:

- what canonical object/job/decision does this substrate record represent?
- what evidence established the binding?
- what is the current substrate state?
- what is the canonical state?
- are they consistent, stale, missing, duplicated or contested?
- what governed action is required next?

The final question feeds the ABBA continuation engine; it does not directly grant execution authority.