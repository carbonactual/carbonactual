# Carbon Actual Integration Kernel

**Status: CANONICAL CONTRACT**

Integration is a constitutional value. Carbon Actual prefers **integrate → compose → adapt** before **build**.

## Integration boundary

External systems connect through explicit adapters/contracts covering:

- identity and authentication evidence
- authority and consent
- data/object mapping
- capabilities and operations
- events and provenance
- errors and retries
- compatibility/versioning
- security and privacy

## Supported integration surfaces

The kernel is designed to accommodate open-source components, white-label systems, APIs, SDKs, agents, MCP servers, ENS/DID/HNS-style identity systems, blockchains and future protocols without making any provider a constitutional dependency.

## Adapter rule

An adapter translates between an external contract and Carbon Actual canonical semantics. It must not introduce a second universal ontology. External implementations remain replaceable.

## Ecosystem rule

Integration keeps existing ecosystem assets useful. A useful external or legacy capability is wrapped, mapped or migrated into the common environment rather than needlessly rebuilt.
