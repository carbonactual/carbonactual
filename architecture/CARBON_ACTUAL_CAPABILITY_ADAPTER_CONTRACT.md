# Carbon Actual Capability and Provider Adapter Contract

**Status: canonical technical contract beneath the frozen ontology.**

## Principle

A capability is a reusable ecosystem function. A provider is an implementation of that function.

```text
PRODUCT -> CAPABILITY INTERFACE -> ADAPTER -> PROVIDER
```

Products MUST depend on the capability contract wherever practical, not on provider-specific semantics.

## Capability contract

```yaml
id: stable-capability-id
version: semantic-version
status: canonical|candidate|experimental|deprecated
family: architectural-family
purpose: description
inputs: []
outputs: []
entities: []
authority: []
permissions: []
data_classes: []
integrations: []
events: []
pulse_metrics: []
value_metrics: []
security_controls: []
privacy_controls: []
health: {}
dependencies: []
provider: {}
replacement: {}
provenance: {}
```

## Adapter rules

1. Adapters translate external APIs/protocols into canonical capability contracts.
2. Provider-specific identifiers do not become canonical object identifiers.
3. Provider failures surface explicit health/degraded status.
4. Retry behavior must be safe for the operation class; consequential non-idempotent actions require idempotency protection.
5. A replacement provider must preserve the capability contract or require an explicit capability-version change.
6. External providers receive the minimum data needed for the operation.
7. Provider availability never implies authority.

## Discovery and execution

```text
DISCOVERY -> MATCH -> POLICY/AUTHORITY -> EXECUTE
```

A discovered provider or successful match does not authorize an action.

## Replacement test

A capability is sufficiently adapterized when a second implementation can satisfy the same contract without changing the product's domain semantics. When this is not possible, the dependency and reason must be documented.
