# Carbon Actual Universal Event Lifecycle

**Status: CANONICAL CONTRACT**

Events are the durable record of consequential occurrences and observations. They are not commands, queries, state, actions or workflows.

## Lifecycle

```text
intent
  ↓
authority + policy evaluation
  ↓
capability resolution
  ↓
execution
  ↓
state transition / observation
  ↓
event creation
  ↓
provenance + audit
  ↓
projection / notification / learning
```

## Minimum event envelope

- event id
- event type
- subject/object references
- actor or agent attribution
- authority context
- provenance/evidence
- timestamp and temporal context
- correlation/causation references where applicable
- input/output or outcome summary
- schema version

## Rules

Events must be append-oriented, attributable and auditable. State is derived/modelled separately. Replaying events must not silently grant authority or bypass policy.

Events are the common lifecycle language for products, agents, workflows, services, organizations and territories inside Carbon Actual.
