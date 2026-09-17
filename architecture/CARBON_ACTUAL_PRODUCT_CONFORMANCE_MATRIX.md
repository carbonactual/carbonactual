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
| ABBA MAS | carbonactual/abba | reusable capability/product | command, routing, proof coordination | authority, authorization, workflow, execution, evidence |
| OMNI | carbonactual/omni | product/runtime client | user-facing operating environment | identity, capability, discovery, context, workflow, value |
| HAPI World | carbonactual/hapi-world | ecosystem composition | human/AI ecosystem | identity, relationship, context, value, evidence |
| HAPI World Nexus | carbonactual/hapi-world-nexus | presentation/ecosystem client | ecosystem presentation | discovery, context, Atlas, evidence |
| NASC | carbonactual/abba-automation-ecosystem | institutional product | registries, forms, workflows, automations, agents | authority, capability, workflow, evidence, management |
| Direct Bank App | carbonactual/direct-bank-app | financial product | controlled banking/payment workflow | authority, authorization, transaction, settlement, audit |
| Open Ballot | carbonactual/open-ballot | civic simulator/domain product | civic transparency/training/simulation | identity, evidence, trust, workflow, location/time |
| RITES | carbonactual/RITES | continuity domain product | human continuity and legacy | identity, relationship, consent, rights, continuity, evidence |
| Nigerian Cultural Atlas | carbonactual/nigerian-cultural-atlas | cultural product | cultural knowledge/discovery | knowledge, identity, relationship, provenance, Atlas |
| BKLIT UI | carbonactual/bklit-ui | presentation/UI | downstream interface | Atlas, discovery, context, workflow |
| BUNK | carbonactual/bunk | property product | property/built environment | property, rights, value, discovery, availability, workflow, evidence |
| NOUN Student Bot | carbonactual/noun-student-bot | education product | student support/onboarding | identity, communication, workflow, capability, evidence |

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

The legacy ABBA MAS repository is not a current authority. ABBA MAS belongs to the active `carbonactual/abba` composition. BUNK belongs to the active `carbonactual/bunk` product repository. The retired operating-spine repository is historical provenance only.
