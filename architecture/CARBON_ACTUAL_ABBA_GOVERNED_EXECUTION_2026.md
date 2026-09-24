# Carbon Actual — ABBA Governed Execution Boundary

The execution boundary separates ABBA's intelligence from authority and runtime side effects.

## Sequence

`Intent → Capability Discovery → Proposal → Authority/Policy/Consent Gate → Execution → Evidence → Canonical Event → State/Value/Pulse Reconciliation`

ABBA may construct and route the request. The gate independently evaluates authority, policy and consent. The execution gateway refuses to invoke an action executor unless the gate result is `ALLOW`.

## Required preservation

Every consequential execution must preserve principal, delegation where applicable, authority, scope, jurisdiction, capability, policy version, intent, risk class, correlation, idempotency, provenance and expiry.

## Evidence-first rule

An execution without an evidence reference is not accepted as a completed governed execution. Execution results are written into the event payload only after evidence is present; canonical state remains governed by the canonical event ingress path.

## Failure behavior

Denied or human-gated work does not reach the action executor. Execution failures remain failures and carry evidence when the provider supplies it. The gateway does not silently convert provider output into authority, truth or success.

## Replacement

The action executor and event writer are interfaces. Providers, queues, runtimes and databases are replaceable implementations behind the capability and event contracts.
