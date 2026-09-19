# Carbon Actual Technical Standards Alignment — 2026-09-19

Status: canonical implementation-reference layer beneath HAPI World `CANON.md`.

This document records external technical standards and frameworks that may be used as replaceable implementation/reference inputs. They do not become Carbon Actual constitutional law.

## Financial identity and messaging

### ISO 4217
ISO 4217 provides three-letter alphabetic and three-digit numeric currency codes and also describes minor-unit relationships for currencies with minor units; ISO states the current ISO 4217:2015 edition remains current after review in 2021. citeturn723855search4

Use for: currency identification, settlement messages, balances, FX, valuation and reporting.

### ISO 20022
ISO 20022 provides a common modeling and repository approach for financial business areas, transactions, message flows and associated business data. Its current catalogue covers areas including payments, securities, FX and trade finance. citeturn623612search2turn623612search6

Use for: payment, clearing, settlement, securities, FX, cash-management, trade-finance and transaction-message interoperability.

### ISO 17442 / LEI
ISO 17442-1:2020 defines an unambiguous legal-entity identifier scheme relevant to financial transactions; ISO states it was reviewed and confirmed in 2026. citeturn623612search0

Use for: counterparty/entity resolution where an LEI exists; never infer that an LEI alone proves authority or ownership.

## Identity and credentials

### W3C DID Core
W3C DID Core 1.0 defines decentralized identifiers as identifiers for subjects including people, organizations, things and other entities, with resolvable DID documents and verification methods. citeturn723855search0turn723855search10

Use for: decentralized identifier adapters, resolution and cryptographic control proofs.

### W3C Verifiable Credentials 2.0
W3C published the Verifiable Credentials 2.0 family as Recommendations in May 2025. The specifications support machine-verifiable, privacy-respecting credentials and cryptographic data integrity. citeturn723855search3

Use for: credential evidence, credential verification, status/revocation workflows and portable attestations.

## Cybersecurity

### NIST Cybersecurity Framework 2.0
NIST CSF 2.0 provides a taxonomy of cybersecurity outcomes for organizations of different sizes and sectors, with explicit attention to governance and supply-chain risk. citeturn723855search1turn723855search12

Use for: security-domain circumference, governance, risk assessment, protective controls, incident response, recovery and supplier/security evaluation.

## Alignment rule

External standards are mapped into Carbon Actual as one or more of:

- evidence/reference source;
- capability specification;
- interoperability format;
- identifier/credential scheme;
- control or assurance framework;
- replaceable provider/implementation constraint.

They do not override HAPI World `CANON.md`, the nine-facet kernel, human authority, or any existing frozen ecosystem boundary.

## Relationship to SWIRMs and TEAMs

Standards are inputs to capability implementations.

`standard/specification → capability contract → provider/implementation → SWIRM → TEAM`

A standard does not create a new SWIRM. A protocol does not create authority. A message format does not prove an event occurred. A credential format does not by itself establish the truth of every claim it contains.

## Implementation priorities

Money and transactions should support currency identifiers and financial message interoperability where relevant. Identity and credentials should support DID/VC adapters where appropriate. Security controls should be mappable to established risk frameworks. All such integrations remain independently verified and replaceable.
