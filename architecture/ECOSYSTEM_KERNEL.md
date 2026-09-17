# Carbon Actual Ecosystem Kernel

## Purpose

Carbon Actual is the canonical ecosystem operating spine and architecture.

The kernel is the smallest shared semantic grammar for the ecosystem:

**Identity → Authority → Intent → Capability → Relationship → Event → Evidence → State → Value**

These are facets, not a replacement ontology. Existing constitutional and domain objects remain authoritative.

## Constitutional boundary

HAPI World `CANON.md` remains supreme. The kernel derives interoperability semantics from the Canon and existing ecosystem concepts. It may compress concepts for routing and interoperability, but it may not silently change their constitutional meaning.

## The nine questions

| Facet | Question | Core distinction |
|---|---|---|
| Identity | WHO? | A referent is not an activity. |
| Authority | WHO MAY? | Permission is not capability. |
| Intent | WHAT IS WANTED? | A request is not an execution. |
| Capability | WHAT CAN BE DONE? | Ability is not authorization. |
| Relationship | HOW ARE THINGS CONNECTED? | Connection is not an event. |
| Event | WHAT HAPPENED? | Occurrence is not evidence. |
| Evidence | HOW DO WE KNOW? | Evidence supports a claim; it is not the claim itself. |
| State | WHAT IS ITS CONDITION? | Current state is not history. |
| Value | WHAT VALUE OR BURDEN RESULTS? | Value is broader than money. |

## Core flow

A typical consequential interaction can therefore be represented as:

1. Identify the participants and objects.
2. Determine authority and consent.
3. Express intent.
4. Discover capabilities that can satisfy the intent.
5. Resolve relevant relationships and constraints.
6. Execute and record events.
7. Attach evidence and provenance.
8. Materialize resulting state transitions.
9. Measure or classify resulting value and burden.

Not every interaction requires every facet to be materialized at the same level of detail. The kernel provides the common vocabulary; domain contracts decide which facets are mandatory for a given operation.

## Non-redundancy rule

Before creating a new ecosystem-wide primitive, the author must demonstrate that the behavior cannot be represented by an existing facet, relationship, event, state transition, evidence type, or value classification.

## Replaceability rule

Databases, queues, model providers, identity implementations, signing systems, hosting providers, payment rails, and other technologies are implementations behind capabilities. Changing an implementation must not change constitutional semantics.

## Open-world rule

Carbon Actual may represent, observe, verify, index, reconstruct, connect to, or transact with real-world and external-system events even when the event was not originally hosted by Carbon Actual.

## ABBA boundary

ABBA consumes the kernel as its common language. ABBA may reason, plan, discover, route, orchestrate, explain, and request authorization. It must not collapse identity, authority, capability, evidence, or value into a single opaque agent state.

## Product boundary

Products are projections of the shared ecosystem. A product may optimize a workflow, interface, market, audience, or sector. It does not create a separate universe merely because its UX is specialized.
