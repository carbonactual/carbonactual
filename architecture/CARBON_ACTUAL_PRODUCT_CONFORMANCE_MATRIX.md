# Carbon Actual Product Conformance Matrix

**Status: CANONICAL — Product Estate Conformance**
**Common Layer: Carbon Actual Common Layer v1.0.0**

## Rule

Products are downstream compositions of Carbon Actual. They may specialize domain behavior and presentation, but they MUST consume the Common Layer for recurring semantics and MUST NOT establish alternate identity, relationship, authority, graph, workflow, execution, evidence, value or ledger foundations.

## Canonical execution pattern
`Identity → Relationship → Intent ↔ Capability → Discovery → Match → Context + Availability → Authority → Authorization → Workflow → Execution → Evidence → Outcome → Settlement/Ledger → Pulse`

## Built product surfaces currently identified

| Product | Repository | Classification | Primary specialization | Required shared fabric |
|---|---|---|---|---|
| ABBA | carbonactual/abba | product | master intelligence/orchestration | identity, intent, capability, discovery, authority, workflow, evidence, interoperability |
| ABBA MAS | carbonactual/abba-mas | reusable capability/product | command, routing, proof coordination | authority, authorization, workflow, execution, evidence |
| OMNI | carbonactual/omni | product/runtime client | user-facing operating environment | identity, capability, discovery, context, workflow, value |
| TIP | carbonactual/tip | economic product | trade, markets, investment, exchange, sourcing | identity, capability, discovery, relationship, authority, value, settlement |
| HAPI World | carbonactual/hapi-world | ecosystem composition | human/AI ecosystem | identity, relationship, context, value, evidence |
| HAPI World Nexus | carbonactual/hapi-world-nexus | presentation/ecosystem client | ecosystem presentation | discovery, context, Atlas, evidence |
| Direct Bank App | carbonactual/direct-bank-app | financial product | controlled banking/payment workflow | authority, authorization, transaction, settlement, audit |
| Open Ballot | carbonactual/open-ballot | civic simulator/domain product | civic transparency/training/simulation | identity, evidence, trust, workflow, location/time |
| RITES | carbonactual/RITES | continuity domain product | human continuity and legacy | identity, relationship, consent, rights, continuity, evidence |
| Nigerian Cultural Atlas | carbonactual/nigerian-cultural-atlas | cultural product | cultural knowledge/discovery | knowledge, identity, relationship, provenance, Atlas |
| BUNK | carbonactual/bunk | property product | property/built environment | property, rights, value, discovery, availability, workflow, evidence |
| NOUN Student Bot | carbonactual/noun-student-bot | education product | student support/onboarding | identity, communication, workflow, capability, evidence |

## Historical / archived product surfaces

These repositories or product surfaces remain useful for provenance, recovery and audit, but are not treated as current production authority without an explicit reactivation decision:

| Product / surface | Repository | Status | Rule |
|---|---|---|---|
| NASC | carbonactual/abba-automation-ecosystem | archived repository | Historical product material only; current implementations must inherit Carbon Actual contracts. |
| BKLIT UI | carbonactual/bklit-ui | archived repository | Presentation history only; no current constitutional or runtime authority. |

## Explicitly preserved boundaries

- `ABBA ≠ authority issuer`
- `Capability ≠ authority`
- `Match ≠ authorization`
- `Plan ≠ execution`
- `Evidence ≠ authority`
- `Atlas ≠ source of operational truth`
- `Product ≠ constitutional layer`
- `Tokenization ≠ proof of ownership`
- `Provider ≠ constitutional dependency`

## Product conformance lifecycle

`Discover → classify → map shared contracts → isolate domain specialization → bind to canonical runtime → verify authority/evidence lineage → deploy`

Future catalog products may be specified without being falsely marked as built. A repository or domain concept is not proof of production activation.

## Estate correction

ABBA MAS belongs to the active `carbonactual/abba-mas` composition and must remain subordinate to Carbon Actual contracts. BUNK belongs to the active `carbonactual/bunk` product repository. TIP is the current economic participation platform. OMNI is a distinct operating/integration product. The retired operating-spine repository is historical provenance only.
