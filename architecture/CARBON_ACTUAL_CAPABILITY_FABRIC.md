# Carbon Actual Capability Fabric (CACF)

**Status: CANONICAL COMPOSITION ARCHITECTURE**

## 1. Purpose

The Carbon Actual Capability Fabric is the provider-neutral integration and orchestration layer through which external tools, services, agents, infrastructure and internal capabilities participate in the Carbon Actual ecosystem.

CACF does **not** become a new constitutional kernel. It composes the existing Carbon Actual primitives and reuses the canonical authority, identity, relationship, value, execution, evidence, control-plane, mission-intelligence, adaptation and learning layers.

The governing distinction is:

`PROVIDER SUPPLIES CAPABILITY → CARBON ACTUAL SUPPLIES CONTEXT / RELATIONSHIP / AUTHORITY / VALUE / GOVERNANCE`

## 2. Canonical position

CACF sits at the integration/composition boundary:

```text
CONSTITUTION / HUMAN AUTHORITY / GOVERNANCE
                    ↓
ROOT / IDENTITY / RELATIONSHIPS / CONTEXT
                    ↓
INTENT / REQUEST / DISCOVERY
                    ↓
CAPABILITY FABRIC
   ┌─────────┬──────────┬───────────┐
   │ Registry│  Router  │ Adapters  │
   └─────────┴──────────┴───────────┘
                    ↓
MISSION INTELLIGENCE
                    ↓
AUTHORITY / APPROVAL
                    ↓
GOVERNED EXECUTION
                    ↓
ACKNOWLEDGEMENT / EXTERNAL EVIDENCE
                    ↓
VERIFICATION / ACTUAL / PULSE
                    ↓
OUTCOME / LEARNING
```

All layers remain concurrent. A request routes only through the capabilities required by its context.

## 3. Capability is not authority

A capability describes what an actor/provider can do. Authority describes who may cause an action to occur, within what scope and under which governance.

Therefore:

`capability ≠ authority`  
`provider privilege ≠ Carbon Actual authority`  
`ABBA recommendation ≠ authorization`  
`route ≠ permission`  
`plan ≠ execution`

The router is not an authority service.

## 4. Canonical capability identity

Each capability has one Carbon Actual canonical identity, for example:

`capability.source_control.repository_read`

A provider implementation references that identity:

`canonical capability → provider adapter → provider operation`

Multiple providers can implement the same canonical capability without creating competing semantic truth.

## 5. Capability descriptor

A descriptor contains at minimum:

`id, name, version, providerId, domain, operation, status, authorityClass, riskClass, sideEffect, identityScope, inputSchema, outputSchema, dependencies, costHint, latencyHint, reliabilityHint, auditPolicy, provenance`

Secrets are never part of this object.

## 6. Provider adapter

An adapter implements the provider boundary. It translates canonical capability requests to provider-specific API/tool calls and translates provider responses into canonical evidence/results.

Provider-specific differences remain implementation/runtime facts:

- API/version limits;
- rate limits;
- outages;
- pricing/cost;
- authentication mechanism;
- schema mapping;
- provider-specific identifiers;
- result quality;
- delivery acknowledgement;
- provider execution state.

A provider cannot redefine the meaning of the canonical capability.

## 7. Routing law

ABBA may ask CACF to discover and rank capabilities. The router may consider:

- required capability coverage;
- provider availability;
- side-effect class;
- risk class;
- reliability evidence;
- latency evidence;
- cost evidence;
- dependency fit;
- mission learning signals;
- identity/context compatibility.

The router must not bypass:

`authority → policy → Mission Intelligence → human approval where required → governed execution`

## 8. External interaction law

Every consequential provider interaction follows:

`outbound intent → provider attempt → acknowledgement → external evidence → verification → internal state transition`

External success is not accepted solely because a provider returned a structurally valid response.

## 9. Provider independence

No provider is constitutional. Providers are replaceable implementations of capability contracts.

A provider may be replaced without changing the canonical capability identity, identity model, authority semantics, relationship semantics, value semantics, Actual state semantics or Mission Intelligence semantics.

## 10. Connected provider universe

Connected plugin/provider families may include source control, database/runtime, deployment/hosting, application deployment, documentation/knowledge, design, analytics, blockchain infrastructure, AI APIs, automation, communication, presence, session management and media/provenance tooling. These are capability sources, not separate operating systems.

## 11. Mission integration

CACF does not replace the Mission Intelligence layer. A routed capability may populate a TEAM/MISSION, but consequential execution still requires mission assessment:

`coverage → SWIRM coverage → dependencies → conflicts → authority requirements → human approval → execution order → readiness`

Mission readiness is not permission.

## 12. Learning integration

Observed outcomes can change selection evidence such as reliability, latency and historical success rates.

Learning cannot grant authority, increase scope, create a credential, convert a warning into permission, or redefine a canonical capability.

## 13. Security and secrets

CACF descriptors and telemetry must not contain API keys, bearer tokens, authentication cookies, passwords, payment credentials or signing secrets.

Secrets remain in the provider/runtime secret boundary. A descriptor may state that a secret or credential is required, but never store the secret itself.

## 14. Nonredundancy

CACF follows the Carbon Actual nonredundancy rule:

`one canonical capability meaning → many governed representations/implementations`

Provider adapters do not create duplicate canonical state. Replicas or caches require lineage, lifecycle, purpose and reconciliation.

## 15. Operational classification

Ministry/domain classifications may be used operationally, but they are not constitutional layers.

## 16. Product composition

**OMNI** is the command/observation surface. **NAIRE** consumes CACF for human/household capabilities. **NGIN** consumes CACF for organization/institution/territory operations. **HAPI World** uses CACF for AI/agent capabilities under identity, delegation and authority. **Communication & Presence** is a shared capability family consumed by OMNI, TIP, HAPI World, education products, ZUJID and other products without creating product-specific communication or presence primitives. RITES/continuity remains an independent domain consuming shared substrate.

## 17. Commercial composition

CACF enables products to be assembled from reusable capabilities instead of rebuilding SaaS primitives repeatedly.

Examples:

`NGIN + CACF → business operating environment`  
`NAIRE + CACF → human operating environment`  
`HAPI World + CACF → AI/agent operating environment`

Third-party providers may be added later through the same adapter contract and conformance path.

## 18. Evolution law

The fabric evolves through:

`discover → specify → implement adapter → test → observe → verify → promote`

A new integration does not require a new constitutional primitive unless the capability cannot be expressed by existing canonical semantics and governance authorizes the extension.

## 19. Safety invariant

**Nothing becomes canonical because a provider exposes it. Nothing becomes trusted because a provider returns it. Nothing becomes executable because a provider can execute it. Nothing becomes Actual merely because an external system claims success.**
