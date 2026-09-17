# Carbon Actual Universal & Ecosystem Denominators — Canonical 1.0

**Status:** CANONICAL

## Purpose

This document defines the reusable denominator model for Carbon Actual. It prevents every new application, institution, territory, agent or product from rebuilding concepts that already recur across the ecosystem.

The Common Layer is the reusable substrate. Products and domains compose it; they do not silently create competing versions of canonical semantics.

## 1. Two denominator levels

### Universal denominators

Universal denominators are broad abstractions that recur across independent domains and have strong interoperability value:

`THING, AGENT, ACTIVITY, PROCESS, RELATION, QUALITY, STATE, CHANGE, IDENTITY, IDENTIFIER, INFORMATION, COLLECTION, MEASUREMENT, TIME, PLACE, REPRESENTATION, CONTEXT, PURPOSE`

### Ecosystem denominators

Ecosystem denominators are universal application capabilities that recur throughout Carbon Actual:

`INTENT, CAPABILITY, AUTHORITY, AUTHORIZATION, OBLIGATION, REQUEST, SERVICE, WORKFLOW, TASK, DISCOVERY, MATCHING, AVAILABILITY, RESOURCE, RIGHTS, VALUE, EXCHANGE, MARKET, OFFER, ORDER, TRANSACTION, SETTLEMENT, EVIDENCE, PROVENANCE, POLICY, DECISION, COMMUNICATION, AUDIT, REGISTRY, COMPLIANCE, RISK, CONSENT, CREDENTIAL, SCHEDULING, BOOKING, QUEUE, ALLOCATION, EXECUTION, FULFILLMENT, DELIVERY, INTEROPERABILITY`

These are reused through the Common Layer and its canonical backing contracts rather than reimplemented inside individual products.

## 2. Interoperability references

The synthesis may be informed by broad interoperability standards and ontologies such as BFO, W3C PROV, RDF/RDFS, OWL-Time, SSN/SOSA, Organization Ontology, ODRL, Schema.org, ActivityStreams, ISO/IEC 11179 and OpenAPI. These are references and adapters, not constitutional authorities.

## 3. Universal denominator rules

Every universal denominator should support, directly or through linked common contracts:

`identity → representation → relationship → time/place/context → state/lifecycle → provenance/evidence → change → interoperability`

A universal denominator may be extended by domain vocabulary but its canonical meaning must remain stable.

## 4. Ecosystem denominator rules

Every ecosystem denominator should declare:

- canonical owner/backing;
- lifecycle and valid states;
- authority and authorization requirements;
- identity and provenance requirements;
- temporal validity where applicable;
- evidence and audit expectations;
- domain extension mechanism;
- technology/provider adapters;
- reuse policy.

A capability is not authority merely because it exists. A record is not truth merely because it is stored. A representation is not the thing represented. A match is not authorization. A token is not authority.

## 5. Application composition rule

A new application MUST follow this order:

`discover denominator → reuse existing capability → compose common contracts → configure domain semantics → add bounded domain capability → add technology-specific implementation`

Only when a concept cannot be represented or cleanly extended by existing common contracts should a new denominator be proposed.

## 6. Layer classification

| Layer | Meaning | Example |
|---|---|---|
| Universal | Cross-domain abstraction | Thing, Agent, Process, Relation, Time |
| Ecosystem | Reusable Carbon Actual operating capability | Authority, Workflow, Evidence, Value, Exchange |
| Domain | Specialized semantic capability | Vehicle certification, academic examination, property lease |
| Technology | Implementation/protocol concern | Database table, payment API, blockchain adapter |

Technology-specific implementations remain replaceable. Domain-specific semantics remain composable. Neither may silently become a new universal denominator.

## 7. Single registry rule

The Common Layer remains the single authoritative logical registry. Physical provider tables or caches may retain historical implementation names during migration; that does not create a second semantic registry.

## 8. Examples of reuse

**Transport:** Agent + Thing + Place + Time + Capability + Authority + Credential + Booking + Value + Evidence + Workflow + IO.

**Education:** Agent + Organization + Purpose + Intent + Application + Capability + Assessment + Evidence + Credential + Workflow.

**Property:** Thing + Agent + Place + Relationship + Rights + Authority + Value + Evidence + Transaction + State.

**Government:** Organization + Agent + Jurisdiction/Place + Authority + Service + Request + Form + Workflow + Decision + Registry + Evidence + Audit.

**Media:** Thing/CreativeWork + Agent + Rights + Representation + Value + Exchange + Evidence + Provenance + Communication + Distribution.

The product is different. The denominator substrate is not.

## 9. Non-duplication law

When two or more products independently need materially the same capability, the architecture must first evaluate promotion into the Common Layer. Once canonicalized, downstream applications consume it rather than rebuilding their own universal implementation.

**Rule:** `build once → strengthen once → reuse everywhere → specialize only at the boundary`.

## 10. Open-world rule

New concepts may be introduced without forcing premature universalization. Unknown or novel concepts remain provisional until they satisfy denominator tests; they may be used as bounded domain concepts before promotion.
