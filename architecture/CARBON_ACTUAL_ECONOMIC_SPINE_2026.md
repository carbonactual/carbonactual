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

Two read projections now expose the same ledger without replacing it:
- omnii_economic_account_positions_v1 preserves per-ledger/account activity;
- omnii_economic_account_balances_v1 aggregates balances by account and unit.

## Value
Value is broader than money. Financial value, knowledge, contribution, compute, energy, time, reputation, trust and other measurable forms can be represented under the shared value semantics.
Money is an instrument; it is not the definition of value.

## Pulse
Pulse is the feedback/value signal returned from an action or observation. Pulse is not the underlying value, money, ownership or authority.
The canonical economic feedback record preserves the value given, Pulse returned, classification, evidence and provenance.
The former compatibility function omnii_record_pulse_and_value(...) is disabled so it cannot silently create records under the obsolete classification rule; new canonical economic records use omnii_record_economic_operation(jsonb).

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

## Token lifecycle and operations
Supported governed lifecycle states are:
draft → active → frozen/revoked → retired
Relevant lifecycle events use the existing canonical event vocabulary: authorized, locked, unlocked, revoked, retired, corrected.

Governed token operations are recorded through the existing token lifecycle event table:
- mint
- transfer
- burn
- redeem

Token holdings are a replay projection from the immutable representation baseline plus signed operation deltas. The baseline is captured separately from mutable current supply so transfers cannot create phantom holdings.

## Settlement
omnii_settlements is the existing settlement record. It is now linked to economic events and authority/provenance/idempotency context.
Supported settlement rails remain:
off_chain, ledger, blockchain, hybrid.
Supported settlement states remain:
pending, authorized, processing, settled, failed, reversed, disputed, cancelled.
Preparation and state changes are service-role-only and require explicit evidence when moving to settled.

## Database execution
The live Supabase project uses the existing canonical tables:
- omnii_economic_events
- omnii_value_feedback
- omnii_pulse_observations
- omnii_ledger
- omnii_token_representations
- omnii_token_identifiers
- omnii_token_lifecycle_events
- omnii_settlements

Live write entrypoints include:
- omnii_record_economic_operation(jsonb)
- omnii_transition_token_lifecycle(...)
- omnii_record_token_operation(jsonb)
- omnii_prepare_settlement(jsonb)
- omnii_record_settlement_result(...)

These economic/token/settlement write entrypoints are restricted to service_role; runtime adapters additionally apply SealGrant/policy authorization before consequential execution.

## Runtime
The active runtime exposes the shared economic boundaries through:
- economic engine
- value exchange boundary
- token lifecycle
- token operations
- settlement
- blockchain operation planning

Actual on-chain writes still require a concrete governed blockchain adapter and signer. The current null adapter does not submit transactions.

## Source/runtime split
- Constitutional law: active HAPI World Canon.
- Semantic operating architecture: carbonactual/carbonactual.
- Estate/control evidence: B3C0M1NG/carbon_actual.
- Active runtime: carbonactual/Carbon-Actual-.
- Providers/blockchains: replaceable adapters.

This preserves nonredundancy and makes the economic system composable across HAPI World, Open Bank, I/O, OMNI, NAIRE, NGIN, RITES and future products.