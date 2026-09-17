# Carbon Actual Canonical Object Schema

**Status: CANONICAL CONTRACT**

This document defines the universal object envelope used by everything composed inside the Carbon Actual ecosystem. Domain and product objects specialize this contract; they do not replace it.

## Universal object

Every governed object has:

- `id` — stable canonical identifier
- `type` — semantic object type
- `version` — contract/schema version
- `lifecycle` — draft, active, suspended, archived, superseded, or other registered state
- `provenance` — origin, source, evidence and lineage
- `authority` — authority context and delegation relevant to the object
- `attributes` — domain-specific data
- `relationships` — typed links to other canonical objects
- `dependencies` — required semantic/runtime dependencies
- `capabilities` — operations the object may expose or consume
- `resources` — resources bound to the object or operation
- `timestamps` — creation, update and relevant temporal validity
- `extensions` — namespaced extension data that cannot redefine canonical semantics

## Rules

1. An object type must have one canonical meaning.
2. Product-specific fields belong in the specialization, not a competing universal envelope.
3. Relationships are first-class and must be typed.
4. Authority and provenance are preserved across composition.
5. Lifecycle changes are observable through the event model.
6. Extensions are namespaced and cannot silently override core fields.
7. Historical objects remain addressable when required for provenance and migration.

## Composition

Products use this envelope and the constitutional kernels instead of creating parallel identity, authority, graph or lifecycle models.
