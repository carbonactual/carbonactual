# Carbon Actual Product Conformance Matrix

**Status: CANONICAL — Product Estate Conformance**
**Common Layer: Carbon Actual Common Layer v1.0.0**

## Rule

Products are downstream compositions of Carbon Actual. They may specialize domain behavior and presentation, but they MUST consume the Common Layer for recurring semantics and MUST NOT establish alternate identity, relationship, authority, graph, workflow, execution, evidence, value or ledger foundations.

## Canonical execution pattern
`Identity → Relationship → Intent ↔ Capability → Discovery → Match → Context + Availability → Authority → Authorization → Workflow → Execution → Evidence → Outcome → Settlement/Ledger → Pulse`

## Current product and foundation surfaces

| Product / Surface | Repository | Classification | Primary specialization | Required shared fabric |
|---|---|---|---|---|
| ABBA | carbonactual/abba | product | master intelligence/orchestration | identity, intent, capability, discovery, authority, workflow, evidence, interoperability |
| ABBA MAS | carbonactual/abba | absorbed capability composition (`mas/`); former standalone repository archived | command, routing, proof coordination, swarm/capability fabric | authority, authorization, workflow, execution, evidence |
| OMNI | carbonactual/omni | product/runtime client | user-facing operating environment | identity, capability, discovery, context, workflow, value |
| TIP | carbonactual/tip | economic product | trade, markets, investment, exchange, sourcing | identity, capability, discovery, relationship, authority, value, settlement |
| SPOTIST | carbonactual/spotist | seek/discovery product | search, discovery, matching and capability finding | identity, intent, capability, discovery, relationship, evidence |
| HAPI World | carbonactual/hapi-world | ecosystem composition | human/AI ecosystem and constitutional world | identity, relationship, context, value, evidence |
| HAPI World Nexus | carbonactual/hapi-world | absorbed presentation/integration composition (`nexus/`); former standalone repository archived | ecosystem presentation and integration/audit surface | discovery, context, Atlas, evidence, integration |
| NAIRE | carbonactual/naire | floor product | human operating environment, person/family/life operations | identity, relationship, authority, context, value, evidence |
| NGIN | carbonactual/ngin | floor product | organization and territory operations | identity, relationship, authority, capability, context, evidence |
| SEED | carbonactual/seed | foundation composition | genesis, incubation, pre-actualization registry | identity, authority, intent, capability, relationship, evidence, state |
| HERITAGE | carbonactual/heritage | foundation/continuity product | lineage, provenance, cultural continuity | identity, relationship, provenance, evidence, state, value |
| I/O | carbonactual/io | foundation movement product | movement, transport and circulation orchestration | identity, authority, capability, workflow, evidence, value, settlement |
| Value System | carbonactual/value-system | foundation value product | value semantics, classification and governed pathways | identity, authority, relationship, evidence, state, value |
| InstituteGPT | carbonactual/institutegpt | domain platform | education, learning, assessment and education administration | identity, authority, intent, capability, relationship, event, evidence, state |
| NOUN Student Bot | carbonactual/noun-student-bot | education product | student support/onboarding | identity, communication, workflow, capability, evidence |
| MCP BOT | carbonactual/mcp-bot | education child product | CIBN micro-finance certification preparation | identity, authority, intent, capability, event, evidence, state |
| Open Bank | carbonactual/open-bank | banking product | banking operations | identity, authority, intent, capability, relationship, event, evidence, state, value |
| Open Ballot | carbonactual/open-ballot | civic product | civic transparency, training and election workflows | identity, authority, intent, capability, relationship, event, evidence, state |
| RITES | carbonactual/RITES | continuity domain product | human continuity and legacy | identity, relationship, consent, rights, continuity, evidence |
| Nigerian Cultural Atlas | carbonactual/nigerian-cultural-atlas | cultural product | cultural knowledge/discovery | knowledge, identity, relationship, provenance, Atlas |
| BUNK | carbonactual/bunk | property product | property/built environment | property, rights, value, discovery, availability, workflow, evidence |
| ZUJID & CO. | carbonactual/zujid | independent company codebase | professional advisory services | identity, authority, intent, capability, relationship, event, evidence, state, value |

## Historical / archived product surfaces

These repositories or product surfaces remain useful for provenance, recovery and audit, but are not treated as current production authority without an explicit reactivation decision:

| Product / surface | Repository | Status | Rule |
|---|---|---|---|
| Direct Bank App | carbonactual/direct-bank-app | historical-only; no current repository | Preserve lifecycle/provenance only. New financial implementation belongs in current Open Bank/I/O compositions unless a real current repository is explicitly established. |
| NASC | carbonactual/abba-automation-ecosystem | archived repository | Historical product material only; current implementations must inherit Carbon Actual contracts. |
| BKLIT UI | carbonactual/bklit-ui | archived repository | Presentation history only; no current constitutional or runtime authority. |
| ABBA MAS standalone repository | carbonactual/abba-mas | archived repository | Superseded by the `carbonactual/abba/mas/` absorbed capability composition. |
| HAPI World Nexus standalone repository | carbonactual/hapi-world-nexus | archived repository | Superseded by the `carbonactual/hapi-world/nexus/` absorbed composition; HAPI World remains the authority. |

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
- `Archived repository ≠ current authority`
- `Absorbed composition ≠ competing product identity`

## Product conformance lifecycle

`Discover → classify → map shared contracts → isolate domain specialization → bind to canonical runtime → verify authority/evidence lineage → deploy`

Future catalog products may be specified without being falsely marked as built. A repository or domain concept is not proof of production activation.

## Estate correction

ABBA MAS belongs to the active `carbonactual/abba/mas/` composition; its standalone repository is archived. HAPI World Nexus belongs to the active `carbonactual/hapi-world/nexus/` composition; its standalone repository is archived. BUNK belongs to `carbonactual/bunk`. TIP is the current economic participation platform. OMNI is a distinct operating/integration product. NAIRE, NGIN, SEED, HERITAGE, I/O, Value System and InstituteGPT are active inherited foundation/floor/domain compositions. MCP BOT is a child of InstituteGPT. Direct Bank App is historical-only; current banking implementation authority is Open Bank and applicable I/O/value contracts. The historical operating-spine repository remains provenance only.
