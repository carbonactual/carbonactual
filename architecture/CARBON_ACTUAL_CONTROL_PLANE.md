# Carbon Actual Control Plane — Canonical

**Status: CANONICAL**

## Purpose

The Control Plane governs how canonical meaning becomes implementable, executable, observable and trusted across the Carbon Actual ecosystem without creating a competing constitutional layer.

It extends the existing capability, product-conformance, institutional-control, repository and runtime architecture. It does not replace them.

## Constitutional position

The Control Plane is subordinate to Constitution, Human Authority and Governance. It cannot redefine constitutional objects, manufacture authority, or promote an implementation into canonical truth by itself.

## System of truth

The ecosystem maintains distinct truth classes:

1. **Constitutional truth** — governing principles and human-authorized canonical semantics.
2. **Semantic truth** — registries and contracts describing what an object/capability means.
3. **Implementation truth** — repository and code evidence.
4. **Runtime truth** — deployed and observed behavior.
5. **Data truth** — persisted state and evidence.
6. **Historical truth** — immutable provenance of previous states, decisions and superseded material.

No lower layer silently overrides a higher layer.

## Required control records

Every material ecosystem object, capability, product, workflow, agent, integration, schema or runtime component SHOULD be traceable through:

`canonical_id → owner → contract → authority_class → scope → jurisdiction → implementation_ref → data_ref → runtime_ref → evidence_ref → lifecycle → version → dependencies → consumers → failure_policy → conformance_status`

## Promotion ladder

`idea → candidate → specified → implemented → tested → conformant → staged → verified → production → deprecated → retired`

Documentation alone never implies production status.

## Authority gate

Every consequential action must preserve:

`principal + delegation + authority + scope + jurisdiction + capability + policy_version + intent + risk_class + correlation_id + idempotency_key + provenance + expiry`

ABBA may route and compose capabilities but cannot create authority.

## Universal execution controls

Consequential workflows MUST support, where applicable: idempotency, duplicate/replay detection, bounded retries, timeout, lease/heartbeat, dead-letter handling, compensation/reversal, escalation, external acknowledgement and evidence capture.

An external failure MUST NOT be represented as success without verified external evidence.

## State and evidence doctrine

Canonical state follows:

`observation → evidence → validation → Actual projection`

ACTUAL state MUST support freshness and dispute semantics including `fresh`, `stale`, `expired`, `revoked`, `superseded`, `contested`, `provisional` and `unknown` where relevant.

PULSE is measurement/feedback, not a substitute for authority, ownership, identity, legal status or factual evidence.

## Contradiction handling

Conflicts are preserved, classified and resolved through governance rather than erased:

`detected → classified → authority evaluated → resolution decision → superseded/retained → propagated → re-conformed`

Recency is not authority.

## External boundary

Providers and connectors are implementation boundaries. They may supply evidence or execution but do not redefine Carbon Actual semantics.

Every external interaction should be represented as:

`outbound intent → attempt → acknowledgement → external evidence → verification → internal state transition`

## Agent control

Agents are principals/actors operating under explicit delegation. Each agent record should define identity, owner/principal, capabilities, tool permissions, data boundaries, jurisdiction, limits, policy version, memory class, risk class and deactivation state.

High-impact actions require stronger policy gates and may require human authorization.

## Observability

The ecosystem should use a common event envelope carrying at least:

`event_id, event_name, occurred_at, observed_at, actor, principal, subject, source, jurisdiction, correlation_id, causation_id, parent_event_id, schema_version, policy_version, trace_id, payload/evidence_ref`

## Continuous controls

The Control Plane continuously evaluates architecture drift, repository drift, schema drift, deployment drift, security/RLS posture, agent authority drift, workflow failures and stuck work, settlement/reconciliation exceptions, evidence conflicts and stale state, dependency/version drift, performance/index hygiene and product conformance.

Findings are recorded rather than silently corrected when correction requires authority.

## Safety invariant

**Nothing becomes canonical because it is newer. Nothing becomes trusted because it is implemented. Nothing becomes executable because an agent can call it. Nothing becomes Actual merely because a system reported it.**

Promotion requires authority, evidence, conformance and verification.
