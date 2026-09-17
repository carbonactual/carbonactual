# Carbon Actual Canonical Runtime Reconciliation

This document connects the approved Carbon Actual architecture to the runtime without creating a competing kernel.

## Invariants

- Constitutional architecture remains authoritative.
- Existing canonical object, relationship, authority, ledger and common-layer contracts remain the backing contracts.
- Interpretation never becomes authority.
- Matching never becomes authorization.
- Pulse never becomes automatic currency, permission or authority.
- Providers remain adapters.
- Products remain compositions.
- Unknown remains representable and provisional.

## Runtime path

```text
Intent/Event -> Context -> Canonical Entity Resolution -> Capability Discovery -> Swarm -> Team -> Workflow -> Authority/Policy Gate -> Execution -> Evidence -> Pulse -> Value -> Ledger -> Projection -> Becoming
```

This is a logical lifecycle, not a requirement that every transaction synchronously traverse every component.

## Persistent truth vs projections

Canonical records and evidence are authoritative. Current state, search, discovery, Actual and Atlas are projections that may be rebuilt or refreshed. Caches are never authoritative.

## Repository implementation rule

Before adding a new implementation, locate the existing canonical contract/runtime and either reuse it, extend it compatibly, or explicitly classify the new code as an adapter, branch, successor, historical artifact or experiment.
