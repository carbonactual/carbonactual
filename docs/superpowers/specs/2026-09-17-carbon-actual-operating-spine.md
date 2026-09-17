# Carbon Actual Operating Spine Design

## Status

Approved and implementation started.

## Goal

Make Carbon Actual the canonical operating spine for the ecosystem while preserving HAPI World constitutional authority, ABBA as intelligence/orchestration, and all product-specific domains as projections over shared primitives.

## Architecture

The spine exposes a nine-facet semantic kernel: Identity, Authority, Intent, Capability, Relationship, Event, Evidence, State, and Value. These facets are compatibility abstractions. They do not replace existing canonical entity types, CANON rules, or product-domain objects.

The repository contract separates responsibility: HAPI World owns constitutional law and world semantics; ABBA owns intelligence and orchestration; Carbon-Actual- owns platform/runtime substrate; IO/value systems own economic implementation; products consume the contracts.

## Invariants

1. HAPI World `CANON.md` remains supreme.
2. Carbon Actual is the canonical ecosystem operating-spine name, architecture, and repository source of truth.
3. There is no separate operating-spine identity beside Carbon Actual.
4. No kernel facet is a new constitutional entity type.
5. Authority is never inferred from capability.
6. Event is not evidence.
7. State is not history.
8. Intent is not execution.
9. Value is not synonymous with money.
10. Implementations are replaceable behind capability contracts.
11. Products must reuse shared primitives before introducing ecosystem-wide concepts.
12. External real-world events may be represented and evidenced without being hosted by Carbon Actual.

## Components

- `architecture/ecosystem-kernel.json`: machine-readable kernel definition.
- `architecture/kernel-repo-contract.json`: repository responsibility boundaries.
- `architecture/ECOSYSTEM_KERNEL.md`: human-readable design law for the spine.
- `architecture/product-projection-registry.json`: product composition registry.
- `scripts/validate-kernel.mjs`: deterministic structural and naming conformance check.
- `.github/workflows/ecosystem-kernel.yml`: CI gate for kernel integrity.
- `README.md`: ecosystem map and entrypoint to the operating-spine contract.

## Data flow

Identity → Authority → Intent → Capability → Relationship → Event → Evidence → State → Value.

Domain systems may use a subset where appropriate, but consequential actions must preserve enough linkage to reconstruct what occurred and why.

## Error handling

Invalid kernel JSON, duplicate facet identifiers, broken repository roles, forbidden primitive duplication, stale operating-spine naming, or missing required distinctions must fail CI. No runtime fallback may silently reinterpret constitutional semantics.

## Testing

The conformance layer validates:

- exactly nine canonical facets;
- stable facet IDs;
- Carbon Actual as both the canonical and architectural identity;
- no obsolete operating-spine identity in canonical control surfaces;
- required distinctions between capability/authority, event/evidence, state/history, intent/execution, and value/money;
- HAPI World canonical boundary;
- repository roles and product boundary.
