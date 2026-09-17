# SPOTIST — Universal SEEK Architecture v2

**Status:** CANONICAL ECOSYSTEM CAPABILITY CONTRACT
**Depends on:** `architecture/SPOTIST_CANONICAL_CAPABILITY.md`; Carbon Actual Universal Event & Interaction contracts; canonical capability, relationship, evidence and authority contracts

## 1. Purpose

SPOTIST is the ecosystem-wide **SEEK capability**. It is not restricted to sourcing, procurement, products, services, commerce or markets.

The product may be narrow or broad in any given surface; the capability remains open-world.

## 2. Canonical primitive: SEEK

A `SEEK` is a first-class ecosystem object representing an authorized intent to discover, locate, identify, trace, match, qualify, verify, connect, assemble or monitor something legitimately sought.

A seek may target people, identities, family/relationship connections, animals or pets, objects, property, vehicles, locations, rare items, books/art/collectibles, information, documents, evidence leads, skills, expertise, human services, suppliers, manufacturers, production capacity, resources, opportunities, offers, events, activities, adventures, missing/lost objects and other representable objects of intent.

## 3. Seek object contract

A seek SHOULD be representable using, where applicable:

```text
seek_id, seeker, intent, objective, candidate_target, criteria, constraints,
preferences, context, location, geographic_scope, time_window, urgency,
priority, acceptable_substitutions, source_policy, privacy_class,
authority_context, consent_context, evidence_requirements,
verification_requirements, notification_policy, monitoring_policy, expiry,
status, parent_seek, related_seeks, mission_id, results, claims, outcomes,
provenance, corrections
```

Implementations may add fields but must not change canonical meaning without governed extension.

## 4. Seek lifecycle

```text
DRAFT
  ↓ AUTHORIZED
INTERPRETING
  ↓ DISCOVERING
MATCHING / TRACING / LOCATING
  ↓ QUALIFYING
VERIFYING
  ↓ CONNECTED / ASSEMBLED / ALERTED
HANDOFF
  ↓ OUTCOME
CLOSED / EXPIRED / CANCELLED / CONTINUING
```

A seek may branch, pause, resume, be refined, or become a standing seek. History is preserved; correction does not erase prior states.

## 5. Intent before category

Users do not need to know the domain category before creating a seek. SPOTIST interprets natural-language, voice, visual, document-based or compound expressions into a provisional seek model. Unknown or ambiguous intent must not be forced into an incorrect familiar category for implementation convenience.

## 6. Standing seeks

A Standing Seek is an authorized seek that remains active after an initial discovery cycle. It includes scope, authorized sources, monitoring conditions, notification rules, refresh/event triggers, privacy/security constraints, expiry/review period, authority boundaries and evidence thresholds. It must be revocable and must not silently expand its scope.

## 7. Discovery Source Fabric

SPOTIST is not a single search provider. Authorized sources may include ecosystem registries, public web resources, structured databases, marketplaces, public registries, archives/libraries, partner systems, providers/businesses, participant-contributed data, agents, lawful sensors/signals and future source types.

Each source should expose provenance and metadata such as:

`source_id, source_type, authority, access_scope, freshness, geographic_scope, coverage, cost, terms, reliability, provenance`

SPOTIST must not imply that unsearched sources were searched.

## 8. Result semantics

A SPOTIST result is a representation of a discovery, claim, lead, match, evidence item or relationship—not automatically the underlying truth, ownership, identity, permission, availability or entitlement.

Result states include exact match, strong match, possible match, alternative, substitute, lead, unverified lead, evidence-backed finding, conflicting finding, historical finding, inferred relationship and unresolved. Material results should be traceable to sources, timestamps and evidence where available.

## 9. Evidence and verification

Discovery remains distinct from verification:

```text
observation → source → claim → evidence → corroboration → verification status → contradiction → correction/history
```

A generated or inferred answer cannot become verified merely because it was generated confidently.

## 10. Match semantics

SPOTIST may compare exactness, compatibility, constraints, geography, timing, availability, cost/value where relevant, quality, evidence strength, provenance, reliability, risk and user preferences. Match explanations should identify principal relevance factors rather than present opaque scores as objective truth.

Paid placement must not silently masquerade as relevance.

## 11. Seeker / holder / provider network

SPOTIST operates bidirectionally:

```text
SEEKER → seeks X
HOLDER / PROVIDER / EXPERT / OPPORTUNITY → exposes X
SPOTIST → discovers and connects compatible sides
```

SPOTIST does not automatically become the transaction owner merely because it connects parties.

## 12. Compound seeks and missions

A complex seek may become a mission composed of related seeks. SPOTIST discovers and composes candidate components; ABBA remains the general ecosystem intelligence/orchestration layer.

## 13. Outcome semantics

SPOTIST distinguishes found, provisionally found, verified, connected, accepted by seeker, acted upon, completed, failed, unresolved and expired. Finding something does not imply acceptance or action.

## 14. No-result semantics

Unsuccessful discovery is not one generic `not found` state. Unresolved states may include no result in searched sources, no exact result, alternatives only, possible leads, insufficient information, insufficient source coverage, source inaccessible, verification unavailable, authority/privacy restriction, expired seek and genuinely unresolved.

## 15. Tailoring and personalization

Authorized context may include preferences, prior accepts/rejects, saved seeks, recurring patterns, geography, mobility, budget/economic boundaries, timing, accessibility requirements, relevant capabilities and relationships. Personalization must remain discoverable, controllable and bounded by permission/privacy rules.

## 16. Unknown and open-world operation

Unknown/provisional seeks may progress:

```text
unknown / provisional seek → evidence → candidate interpretation → relationship discovery → governed classification
```

SPOTIST must not force all future seeks into today's taxonomy.

## 17. Sensitive and human-related seeking

People-related seeks require context-sensitive authority. SPOTIST must not provide unrestricted surveillance, stalking, doxxing, unauthorized private-record access or unauthorized disclosure infrastructure. Sensitive seeks use appropriate identity, privacy, safeguarding, evidence, consent and authority mechanisms.

## 18. Economic boundary

SPOTIST may discover economic opportunities, offers, suppliers, production capacity, procurement paths and other trade-related objects. The relevant economic domain remains responsible for its own semantics.

```text
SPOTIST → discovers opportunity / supply / match
OMNI    → economic participation / trade / markets / investment
I/O     → applicable value circulation / ledger / settlement
```

SPOTIST does not create a competing economic constitution or ledger.

## 19. Authority boundary

Discovery does not grant authority. Consequential action must use applicable authority, consent, policy, safeguarding, security, legal and governance mechanisms.

## 20. Commercial integrity

Prohibited: undisclosed paid relevance, fabricated inventory/availability/reviews/evidence/transaction history, or hidden conflicts of interest. Commercial relationships remain distinguishable from evidence-backed relevance.

## 21. Product forms

SPOTIST may exist as a standalone product, product module, DESK capability, OMNI capability, API/service, agent capability, internal ecosystem service, workflow or future interface. The standalone product does not own canonical meaning.

## 22. Canonical ecosystem boundaries

```text
Carbon Actual → operating-spine contracts and constitutional interoperability
ABBA          → intelligence / reasoning / orchestration
SPOTIST       → universal SEEK / discovery / matching / tracing
DESK          → participant workspace/dashboard surface
OMNI          → economic participation / trade / markets / investment
I/O           → value circulation / ledger / settlement
HAPI          → human identity / authority / continuity surface
```

These are compositions, not competing constitutions.

## 23. Event and provenance compatibility

Material seek events should map to Carbon Actual event/interaction contracts, preserving event identity, actors/capacities, authority context, source/evidence, timestamps, communication/disclosure context, state changes, correction/history and outcome.

## 24. Interoperability

SPOTIST interfaces should be capability-oriented and provider-neutral. Conceptual operations may include `createSeek`, `interpretSeek`, `refineSeek`, `searchSeek`, `qualifyResult`, `verifyResult`, `saveSeek`, `activateStandingSeek`, `pauseStandingSeek`, `resumeStandingSeek`, `cancelSeek`, `getSeekStatus`, `getSeekEvidence`, `getSeekHistory`, `handoffSeek` and `composeMission`. Exact API names remain implementation details unless separately canonicalized.

## 25. Conformance prohibitions

An implementation is non-conformant if it defines SPOTIST only as sourcing; forces narrow categories before intent; treats search output as truth without evidence state; silently converts discovery into authority; creates a second identity/authority/economic ontology; hides paid ranking; erases uncertainty/history; collapses all no-result states; assumes today's taxonomy is complete; silently expands standing-seek scope; or makes product UI the constitutional source of truth.

## 26. Canonical invariant

> **SPOTIST turns a legitimate human or ecosystem intent to seek into an evidence-aware, context-sensitive, open-world discovery process, without confusing finding with truth, authority, ownership, or action.**
