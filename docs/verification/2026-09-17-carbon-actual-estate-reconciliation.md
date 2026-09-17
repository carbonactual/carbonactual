# Carbon Actual Estate Reconciliation — 2026-09-17

## Scope

This verification record covers the second reconciliation pass after Carbon Actual became the canonical operating spine:

- historical operating-spine architecture mapped into Carbon Actual contracts;
- repository estate classification;
- active product registry reconciliation;
- absorbed repository boundaries;
- stale active runtime bindings;
- InstituteGPT/MCP BOT parentage;
- private credential-custody boundary.

## Verified architecture

- Constitutional authority: `carbonactual/hapi-world/CANON.md`.
- Semantic/operating-spine authority: `carbonactual/carbonactual`.
- Intelligence/orchestration: `carbonactual/abba`.
- Platform/runtime substrate: `carbonactual/Carbon-Actual-`.
- Shared kernel remains exactly nine facets: identity, authority, intent, capability, relationship, event, evidence, state, value.

## Repository estate

The canonical repository estate registry is `architecture/repository-estate-registry.json`.

It distinguishes canonical, constitutional, intelligence, platform, active product, private custody, absorbed archive, historical operating-spine archive, archived internal/experimental, and archived external/tooling repositories. `active_unclassified_repositories` is required to remain empty.

## Product corrections

- MCP BOT is registered as an InstituteGPT child product and has its own Carbon Actual conformance and product-inheritance contracts.
- Direct Bank App is historical-only because no current repository exists in the GitHub estate. No absorption target is asserted.
- Manual Bank planning no longer depends on the vanished Direct Bank repository; current composition is through I/O, Open Bank, Value System, ABBA and Carbon Actual contracts.
- OMNI runtime routing no longer advertises the absorbed ABBA MAS repository, the vanished Direct Bank repository, or the archived Shadow repository as live project targets.
- ABBA MAS remains active only through `carbonactual/abba/mas/`.
- HAPI World Nexus remains active only through `carbonactual/hapi-world/nexus/`.

## Historical architecture

The former operating-spine repository remains archived provenance. The neutral `CARBON_ACTUAL_LEGACY_ARCHITECTURE_CROSSWALK.json` explicitly maps historical canonical architecture sources to current Carbon Actual targets or marks them reference-only.

Promoted current contracts include the Audubon Continuum ecological design doctrine and reusable institutional composition doctrine.

## Security boundary

`carbonactual/vault` is private credential custody only and is not a product or architecture dependency. Its current tree no longer contains the plaintext credential file previously committed there; `.gitignore` and `SECURITY.md` now prohibit recurrence.

Git history still contains the removed credential material. Credential rotation and authorized history purge remain owner-only remediation work and are tracked in GitHub issue #1 in `carbonactual/vault`.

## Verification command surface

The Carbon Actual CI workflow runs:

```text
node scripts/validate-kernel.mjs
node --test tests/architecture/ecosystem-kernel.test.mjs
```

The validator covers the semantic kernel, repository boundary contract, product registry, repository estate registry, integration fabric, legacy architecture crosswalk and canonical stale-identity controls.
