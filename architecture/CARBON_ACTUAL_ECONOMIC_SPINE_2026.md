# Carbon Actual Economic Spine — 2026

Status: CANONICAL COMPOSITION CONTRACT
Purpose: governed implementation of ledger, value, Pulse, inverted economics, representation, tokenization and blockchain rails without creating competing primitives.

## Economic path
Intent → Capability → Authority/Consent → Value Given → Action → Pulse Returned → Inverted Classification → Ledger → Evidence → State → Settlement/Reconciliation

## Inverted economics
The current ecosystem rule is exact:
Pulse < Value Sent → Asset
Pulse ≥ Value Sent → Liability
An asset is attributed to the configured recipient/beneficiary. A liability is attributed to the configured ecosystem obligor unless a governed obligor is explicitly supplied.
The comparison is performed only when value and Pulse use the same unit.

## Ledger
The ledger is exact double-entry accounting:
- every consequential value operation requires at least two legs;
- debit total must equal credit total;
- every leg must use the same unit;
- negative, null or unknown-unit legs are rejected;
- every record carries authority, provenance and idempotency references;
- reversals are records, not destructive edits.

## Value
Value is broader than money. Financial value, knowledge, contribution, compute, energy, time, reputation, trust and other measurable forms can be represented under the shared value semantics.
Money is an instrument; it is not the definition of value.

## Pulse
Pulse is the feedback/value signal returned from an action or observation. Pulse is not the underlying value, money, ownership or authority.
The canonical economic feedback record preserves the value given, Pulse returned, classification, evidence and provenance.

## Representation boundaries
Decimalization ≠ Fractionalization ≠ Tokenization ≠ Minting
Decimalization changes quantity representation/precision.
Fractionalization expresses divisible rights or units.
Tokenization creates a digital representation of an underlying object/right/value reference.
Minting is the governed creation/issuance step and remains authority- and adapter-bound.

## Blockchain
Blockchain is an implementation/settlement rail, not a constitutional primitive.
A blockchain rail may provide an external identifier, chain/network settlement, externally verifiable proof, and token transfer/issuance execution.
It does not itself create Carbon Actual authority, ownership, identity, value or truth.
Write operations remain adapter-required and authority-gated. No signing secret is stored in canonical capability or token records.

## Token lifecycle
Supported governed lifecycle states are:
draft → active → frozen/revoked → retired
Relevant lifecycle events use the existing canonical event vocabulary: authorized, locked, unlocked, revoked, retired, corrected.

## Database execution
The live Supabase project uses the existing canonical tables:
- omnii_economic_events
- omnii_value_feedback
- omnii_pulse_observations
- omnii_ledger
- omnii_token_representations
- omnii_token_identifiers
- omnii_token_lifecycle_events
Atomic write entrypoint: omnii_record_economic_operation(jsonb)
Token lifecycle entrypoint: omnii_transition_token_lifecycle(...)
Both are restricted to service_role.

## Source/runtime split
- Constitutional law: active HAPI World Canon.
- Semantic operating architecture: carbonactual/carbonactual.
- Estate/control evidence: B3C0M1NG/carbon_actual.
- Active runtime: carbonactual/Carbon-Actual-.
- Providers/blockchains: replaceable adapters.

This preserves nonredundancy and makes the economic system composable across HAPI World, Open Bank, I/O, OMNI, NAIRE, NGIN, RITES and future products.