# Carbon Actual Canonical Authority Registry

**Status:** Canonical technical control
**Purpose:** Prevent semantic regression by making architectural authority explicit and machine-checkable.

## Authority precedence

```text
CONSTITUTIONAL / FROZEN
    > CANONICAL ONTOLOGY / CONTRACT
    > EXPLICIT AMENDMENT
    > CAPABILITY / DOMAIN SPECIFICATION
    > IMPLEMENTATION
    > EXPERIMENT
    > CONVERSATION CHRONOLOGY
```

Chronology alone can never supersede a higher-authority record.

## Record model

Each canonical record contains:

- `canonical_id`
- `name`
- `status`
- `authority_level`
- `introduced_at`
- `canonical_source`
- `supersedes`
- `superseded_by`
- `aliases`
- `depends_on`
- `implements`
- `extends`
- `branch`

## Status values

- `FROZEN`
- `CANONICAL`
- `AMENDMENT`
- `CAPABILITY`
- `DOMAIN`
- `IMPLEMENTATION`
- `EXPERIMENTAL`
- `DEPRECATED`
- `HISTORICAL`

## Enforcement rules

1. A lower-authority artifact cannot redefine a higher-authority identifier or boundary.
2. A rename keeps the canonical identifier and records the new name as an alias or successor.
3. A merge preserves lineage from each prior concept into the canonical destination.
4. A frozen change requires an explicit architecture-amendment record.
5. A capability or branch may extend a canonical contract but cannot silently create a competing universal primitive.
6. Unknown concepts may be registered provisionally without inferred authority.
7. Historical material remains traceable and cannot silently become current authority.

## Protected concepts

Protected concepts include Carbon Actual, OMNI, Being, Becoming, ABBA, Value, Pulse, I/O, Communication, Continuum, Governance, Integration, HASH, SEAL, HAPI, HAPI World, Terminal, Mint, Root, Index, Vault, Actual, Atlas, Ash, Phoenix, the universal object model, logical ledgers, tokenization/fractionalization/decimalization/democratization/decentralization, and the product-composition rule.

## Relationship to implementation

The registry governs architecture only. It does not freeze providers, databases, model vendors, SDKs, infrastructure, pricing, exact economic formulas or product UI.

## AODS / HAPI World Tier II additions — 2026-09-20

Canonical technical extensions registered under existing authority: `architecture/CARBON_ACTUAL_AODS_CANON.md`, `architecture/CARBON_ACTUAL_HAPI_WORLD_TIER_II.md`, `architecture/audubon-plate-manifest.json`, and `.github/CANON_LAW.md`. These remain subordinate to `carbonactual/hapi-world/CANON.md` and do not create a competing constitutional kernel.
