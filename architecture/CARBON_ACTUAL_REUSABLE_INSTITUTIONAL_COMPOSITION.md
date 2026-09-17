# Carbon Actual Reusable Institutional Composition

**Status: CANONICAL ARCHITECTURAL DOCTRINE**

Carbon Actual capabilities are designed to be reusable across organisations, institutions, territories, domains and products. A real-world engagement should normally be implemented by composing existing universal capabilities and domain modules rather than creating a bespoke architecture from scratch.

The objective is:

`BUILD ONCE → STRENGTHEN ONCE → COMPOSE MANY TIMES → CONFIGURE LOCALLY → DEPLOY/HAND OFF CLEANLY`

## 1. Institutional Composition Principle

An institution-specific system is a composition of:

`Carbon Actual Core + Shared Capabilities + Domain Modules + Institutional Configuration + Data + Policy/Rules + Integrations + Presentation`

Institution-specific requirements MUST NOT be promoted into constitutional primitives merely because one deployment needs them.

## 2. Three-Layer Model

### Layer A — Constitutional Core

Universal semantics that remain stable across deployments, including identity, authority, consent, entities, relationships, registries, events, state, evidence, value, continuity, governance, audit and integration.

### Layer B — Reusable Capability Modules

Portable capabilities that implement recurring operational needs, including registry; schema/form; workflow; case management; licensing; inspection; certification; approvals; booking/reservation; procurement; payments/value exchange; document/evidence management; inventory/assets; territory/geo; communications/notifications; reporting/dashboards; compliance; traceability; intelligence/analytics; search; API/integration; simulation/planning; audit/observability; and continuity/recovery.

A module MUST expose stable semantic contracts and MUST avoid unnecessary coupling to a single institution, vendor or deployment.

### Layer C — Institutional Composition

A deployment selects and configures the required modules, defines lawful institutional rules, assigns authority, supplies local forms/data, connects external systems and provides its presentation layer.

## 3. Configure Before Rebuild

A new requirement must be evaluated in this order:

`reuse existing capability → configure → compose modules → extend domain contract → create genuinely new shared capability → constitutional amendment only if foundational semantics are missing`

Duplicating an existing universal capability inside a product is an architectural smell.

## 4. Registry and Form Reuse

Registries and forms are engines/capabilities, not isolated one-off artefacts.

A registry instance derives from the common registry contract and may represent people, organisations, vehicles, seeds, schools, assets, licences, land, facilities or other governed objects without creating a new registry ontology for every domain.

A form is a structured interaction contract connected to identity, authority, requirements, evidence, validation, value/fees where applicable, workflow, decisions, issuance, renewal, audit and appeal/exception handling.

## 5. Portable Domain Packs

Domain modules package reusable semantics for recurring sectors without redefining the universal core. Examples include agriculture/seed systems; transport/mobility; health; education; government/public administration; finance; environment/natural resources; justice/dispute resolution; events/culture; infrastructure; and trade/commerce.

A domain pack may contain schemas, workflows, policies, forms, registries, reports, integrations and UI compositions appropriate to that domain.

## 6. Deployment and Handoff

A client/institution deployment should be separable into:

`core version + module versions + configuration + institutional data + policies/rules + integrations + branding/presentation + deployment controls`

This permits clean handoff, migration, independent operation and future upgrade paths without making the institution dependent on undocumented bespoke logic.

## 7. Versioning and Compatibility

Shared modules MUST be versioned. Breaking changes require explicit compatibility handling, migration paths and provenance.

A downstream deployment may pin a stable module version while newer capabilities are developed centrally.

Institutional configuration MUST remain distinguishable from shared module code so that improvements to a shared capability can propagate safely across deployments.

## 8. Data and Authority Separation

Reusable infrastructure may transport, store, transform and analyze institutional data, but it does not acquire the institution's constitutional authority merely by hosting it.

Institutional authority, jurisdiction, consent and policy remain explicit data and governance boundaries.

## 9. Anti-Lock-In Principle

Reusable composition MUST preserve portability. No paid or proprietary provider, database, workflow engine, AI provider, hosting platform or integration vendor becomes a constitutional dependency merely because it is used in one deployment.

## 10. Commercial/Product Principle

The ecosystem should operate as a productized institutional infrastructure business rather than a sequence of unrelated bespoke builds.

The preferred economic pattern is:

`shared capability investment → multiple deployments → configuration revenue → implementation/integration revenue → support/maintenance → shared capability improvement`

The same capability may therefore serve public institutions, companies, NGOs, research organisations, communities and other governed entities under different configurations and contracts.

## 11. Reference Deployment Principle

A major implementation should strengthen the shared substrate whenever a requirement reveals a genuinely reusable capability.

A reference deployment is therefore both:

1. a functioning institutional solution; and
2. a test/proving ground for improving reusable Carbon Actual capabilities.

A national seed-system deployment, for example, can strengthen registry, licensing, inspection, certification, traceability, market intelligence and public-verification capabilities that later become reusable outside agriculture.

## 12. Conformance Rule

Every significant new feature MUST declare whether it is:

- constitutional/core;
- reusable capability;
- domain module;
- institutional configuration;
- integration adapter; or
- presentation/UI.

No item should be placed in the core merely for convenience.

## Completion Criterion

Carbon Actual conforms to this doctrine when an institution can be assembled from reusable, governed components; when local requirements can be configured without contaminating the universal core; and when the resulting deployment can be operated, upgraded, migrated or handed off as a coherent product.
