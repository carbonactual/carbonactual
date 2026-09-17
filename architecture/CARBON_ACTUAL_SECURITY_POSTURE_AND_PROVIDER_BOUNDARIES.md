# Carbon Actual Security Posture & Provider Boundary Doctrine — Canonical

**Status: CANONICAL**

## Purpose

Security controls are part of the Control Plane. They protect the distinction between constitutional authority, application permissions, provider privileges, runtime observation and persisted data.

## RLS invariant

Application data exposed through database APIs MUST be protected by Row Level Security unless the table is intentionally non-client-facing and is isolated behind a provider/runtime boundary.

Operational observability tables are service/runtime data by default. They MUST NOT be left readable or writable by anonymous or authenticated public-facing roles merely because they are useful to operators.

Enabling RLS without an explicit policy plan is not a complete remediation. The required sequence is:

`classify → define actors → define permitted operations → define predicates → test deny/allow cases → enable RLS → verify service paths → re-run security audit`

## Provider-managed infrastructure boundary

Provider-managed extensions or infrastructure may reassert privileges or behavior. A migration that repeatedly issues an ineffective privilege change is not a durable control.

The observed state MUST therefore be treated as a provider-boundary finding until the underlying configuration is restricted through a provider-supported path.

Do not represent ineffective privilege statements as a successful remediation.

## API-key lifecycle

The ecosystem MUST use provider-supported public/publishable and secret/server-side credential classes appropriately. Secret material MUST NOT enter source control, client bundles, telemetry payloads or application event bodies.

The migration is staged:

`discover references → provision new keys → migrate clients → migrate server components → verify last-use of legacy keys → disable legacy keys → retain rollback evidence`

No key migration step should require embedding a secret into code or logs.

## Secret telemetry invariant

Observability captures control metadata, not secrets. Redaction MUST happen before emission where feasible. At minimum, the following classes are prohibited from event bodies and attributes:

- API keys and bearer tokens
- authentication cookies/session secrets
- private signing material
- full payment credentials
- passwords and recovery secrets

## Event semantics

Operational events SHOULD follow a stable, domain-specific event name and place dynamic identifiers in attributes. Events represent meaningful occurrences; duration-bearing operations are represented as spans where appropriate.

## Agent boundary

An agent is an actor with delegated capability, not an authority source. Agent execution MUST remain constrained by:

`identity → delegation → capability → scope → jurisdiction → policy → risk class → approval gate → execution → evidence → audit`

An agent may propose, classify, route or execute an authorized capability. It MUST NOT manufacture authority, silently broaden scope, resolve constitutional conflicts, or turn an unverified external response into Actual state.

High-impact or irreversible actions require explicit stronger gates and, where policy requires, human approval.

## Provider independence

External services are replaceable adapters. Their outage, schema, pricing, rate limit, or privilege model MUST NOT silently redefine Carbon Actual semantics.

## Promotion rule

A security control is not considered production-ready merely because code exists. Promotion requires:

`policy defined + implementation present + deny/allow tests + runtime verification + evidence + rollback path`

Unresolved provider constraints remain visible findings rather than hidden exceptions.
