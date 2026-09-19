# Carbon Actual Common Layer Activation — 2026

Status: ACTIVE COMPOSITION CONTRACT

The Common Layer is the reusable denominator beneath products. It must not create competing identity, authority, value, ledger, or domain primitives.

## Activated substrate

The runtime and Supabase layers now expose governed boundaries over the existing Common Layer records:

- Object: canonical thing/resource anchor.
- Participant: human, AI entity, agent, organization, institution, community or other modeled participant.
- Namespace: external or local naming domain.
- Name Resolution: verified/unverified mapping between names and canonical references.
- Relationship: directed/typed connection with authority and provenance.
- Dependency: explicit dependency edge with constraints.
- Interoperability Adapter: replaceable protocol/provider bridge with identity and schema mapping.
- Interoperability Message: idempotent message record with canonical and external references.
- Reconciliation: expected-vs-actual comparison with explicit mismatch/recovery semantics.

These records remain separate from Activity and Identity semantics. An identifier/name is not authority; a representation is not the underlying object; an interoperability adapter is not the protocol itself.

## Identity and external standards

The ecosystem can bind external identity/credential systems through Namespace and Interoperability Adapter records rather than creating proprietary identity silos.

Current standards worth supporting through adapters include:

- W3C Verifiable Credentials Data Model 2.0 for machine-verifiable claims.
- OpenID for Verifiable Credential Issuance 1.0 for credential issuance.
- OpenID for Verifiable Presentations 1.0 for credential presentation.
- WebAuthn Level 3 for strong, scoped public-key authentication.

Those standards provide interoperability mechanisms; Carbon Actual still retains its own human authority, Seal, provenance and canonical-object semantics.

## Duplicate primitive rule

The former active relation primitive duplicated relationship while both pointed to omnii_relationships. relation is now deprecated as an adapter-only alias. relationship is the sole active primitive for that semantic class.

## Architectural path

Identity/Participant → Name/Namespace → Relationship/Dependency → Capability/Intent → Authority/Consent → Action/Activity → Evidence/Provenance → Value/Pulse → State → Settlement/Reconciliation → External Adapters.

The system should activate existing denominators before inventing new ones.
