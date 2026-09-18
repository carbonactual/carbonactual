# Carbon Actual Common Layer — Canonical 1.0

**Status: CANONICAL**

## Purpose

The Common Layer is the reusable semantic fabric beneath Carbon Actual products and institutional deployments. It does not create a second constitutional kernel and it does not replace the canonical Carbon Actual object/relationship model.

## Denominator taxonomy

The Common Layer separates **Universal Denominators** from **Ecosystem Denominators** while retaining one authoritative logical registry.

The physical persistence mechanism is an implementation detail. Existing provider tables may retain legacy physical names during migration, but the canonical logical registry is owned by Carbon Actual.

- **Universal denominators:** `THING, AGENT, ACTIVITY, PROCESS, RELATION, QUALITY, STATE, CHANGE, IDENTITY, IDENTIFIER, INFORMATION, COLLECTION, MEASUREMENT, TIME, PLACE, REPRESENTATION, CONTEXT, PURPOSE`.
- **Ecosystem denominators:** `INTENT, CAPABILITY, AUTHORITY, AUTHORIZATION, OBLIGATION, REQUEST, SERVICE, WORKFLOW, TASK, DISCOVERY, MATCHING, AVAILABILITY, RESOURCE, RIGHTS, VALUE, EXCHANGE, MARKET, OFFER, ORDER, TRANSACTION, SETTLEMENT, EVIDENCE, PROVENANCE, POLICY, DECISION, COMMUNICATION, AUDIT, REGISTRY, COMPLIANCE, RISK, CONSENT, CREDENTIAL, SCHEDULING, BOOKING, QUEUE, ALLOCATION, EXECUTION, FULFILLMENT, DELIVERY, INTEROPERABILITY`.
- Domain-specific concepts extend these contracts; technology-specific implementations sit at the edge and remain replaceable.

## Eight deep composition denominators — not kernel facets

`ENTITY + RELATIONSHIP + INTENT + CAPABILITY + VALUE + AUTHORITY + MOTION + OUTCOME`

These are **design/composition dimensions**, not a second semantic kernel or a replacement for the nine canonical kernel facets:

`IDENTITY + AUTHORITY + INTENT + CAPABILITY + RELATIONSHIP + EVENT + EVIDENCE + STATE + VALUE`

The eight-dimension shorthand is useful when designing cross-domain flows; each dimension maps into existing Carbon Actual facets and denominators. It must never be registered or implemented as a competing kernel.

## Shared primitive registry

The Common Layer maintains one authoritative logical registry. Capability extensions add reusable entries without creating a second registry.

Core shared entries include:

`identity, relationship, intent, capability, discovery, matching, context, availability, lifecycle, trust, authority, authorization, resource, property, rights, value, exchange, market, offer, order, transaction, io, settlement, management, communication, document_evidence, workflow, location_time, compliance_risk, analytics_learning, interoperability`

Expanded reusable capabilities include:

`identifier, role, profile, representation, membership, delegation, request, inquiry, application, submission, registration, enrollment, nomination, referral, claim, form, questionnaire, declaration, statement, document, evidence, proof, attestation, provenance, search, query, scheduling, appointment, booking, reservation, queue, allocation, task, assignment, case, stage, checkpoint, action, execution, fulfillment, delivery, assessment, examination, interview, inspection, audit, evaluation, scoring, ranking, result, finding, approval, rejection, selection, adjudication, permission, consent, mandate, license, permit, clearance, policy, rule, control, marketplace, quote, invoice, payment, receipt, refund, return, contract, obligation, ownership, custody, instrument, portfolio, funding, capital, investment_position, notification, invitation, conversation, collaboration, meeting, feedback, address, territory, movement, trip, shipment, state, status, change, version, progression, milestone, outcome, history, tracking, analytics, scenario, simulation, ai_identity, agent_identity, ai_minting, ai_knowledge_package, ai_training, ai_assessment, ai_deployment, ai_evaluation, ai_monitoring, ai_update, ai_retirement, human_supervision, api, adapter, connector, protocol, schema_mapping, import_export, synchronization`

## Canonical ownership boundaries

- **HAPI** is the Human API and principal ecosystem entry boundary.
- **HAPI World** is the AI-side operating world associated with that identity and its AI relationships.
- **InstituteGPT** owns learning, instruction, study, training, practice, competency development, CPD and AI education.
- **Knowledge** is the shared knowledge substrate.
- **General Service** owns universal service mechanics.
- **General Marketplace** owns universal marketplace/discovery/listing/offer capability.
- **Trade** owns exchange execution and fulfillment.
- **Investment** owns capital deployment and investment-position semantics.
- **Markets** owns market/value formation mechanics.
- **Opportunities** owns jobs, contracts, internships, grants, scholarships, projects and similar prospects.
- **NGIN** carries organization/institution/association-side progression and value semantics.
- **NAIRE** carries human-side progression and value/economic semantics without redefining the legal meaning of the national currency.
- **ROOT** remains durable canonical identity/verified-state context; external authority identifiers remain linked records.
- **ACTUAL** represents current operational reality.
- **ATLAS** is a governed discoverable/public projection.
- **IO** records significant interaction, movement, handoff and state transition between layers and domains.

## Universal operating pattern

`intent → discovery → match → context/availability → authority/authorization → application/request → workflow → execution → evidence → result/outcome → settlement/ledger → pulse/learning`

Not every flow uses every stage; the pattern is compositional.

## TEAM → MISSION Intelligence

TEAM is the selected composition of members drawn from SWIRMs. Mission Intelligence evaluates a TEAM before consequential execution:

`TEAM → coverage → SWIRM coverage → dependencies → conflicts → authority requirements → human approval → execution order → readiness`

Readiness is `READY | INCOMPLETE | BLOCKED` and is not permission.

## Evidence, results and certificates

The Common Layer distinguishes `record`, `result`, `evidence`, `attestation`, `credential`, `certificate`, `qualification`, `registration` and `license`. External authorities remain the issuers of authority-bearing credentials.

## ABBA boundary

ABBA is the master intelligence/orchestration layer. It may interpret, reason, plan, discover, match, route, compose, monitor, learn and escalate. It may not issue authority, change the Constitution, or replace required human/legal authority.

## Graph and Atlas

The universal graph remains `Object --[typed Relationship]--> Object`. Atlas is a governed discoverable representation over canonical objects and relationships; it is not a competing system of record.

## Interoperability

External systems connect through adapters, APIs, webhooks, protocols, import/export and identity/schema mappings. No proprietary provider is constitutional.

## Economics

Value is universal and is not reduced to money. Economic vectors, value observations, tokenization, market orders, trades and settlements remain domain implementations of shared exchange/value semantics.

## Trading and investment

Instrument types remain open-world: money, currency, tokens, securities, equity, debt, credit, royalties, licenses, permits, certificates, credentials, contracts, leases, subscriptions, memberships, franchises, mandates, collateral, property, land, resource rights, data rights, AI rights, access rights, carbon/water/energy rights, attention, reputation, position, rank, clearance, skill, time, capacity and opportunity.

## Horizon safety

Every governed object remains classifiable across `OLD | NOW | FUTURE | EMERGING | UNKNOWN_ALIEN`. Future, simulated or unknown states cannot silently become Actual.

## Reuse rule

`build once → strengthen once → compose many times → configure locally → deploy/handoff cleanly`

A new requirement should first reuse an existing primitive/capability before introducing a new domain contract or constitutional change.
