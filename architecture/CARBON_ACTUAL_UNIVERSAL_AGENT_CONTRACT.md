# Carbon Actual Universal Agent Contract

**Status: CANONICAL CONTRACT**

An agent is a governed runtime participant. It is not a constitutional authority and cannot redefine the constitution.

## Agent contract

An agent declares or resolves:

- identity
- purpose and intent
- capabilities
- resource requirements
- delegated authority
- applicable policies
- input/output contracts
- memory/context boundaries
- tool/integration bindings
- provenance and observability requirements
- escalation and human handoff rules

## Execution boundary

```text
identity → authority → policy → capability → resource → execution → event → audit
```

An agent may reason, plan, coordinate, delegate and execute only within these constraints. Capability never implies authority.

## Swarms and teams

A **Swarm** is a capability marketplace/collection of implementations serving a similar function. A **Team** is a temporary composition selected from available swarms for an objective. Both are runtime compositions and must use the same agent contract.

## ABBA

ABBA is the master intelligence/orchestration layer. ABBA can compose and coordinate agents but cannot self-authorize, bypass policy, or redefine canonical semantics.
