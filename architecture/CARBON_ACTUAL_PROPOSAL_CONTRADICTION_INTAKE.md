# Carbon Actual Proposal and Contradiction Intake

Status: canonical technical governance mechanism.

## Purpose

Prevent conversation-derived or implementation-derived ideas from silently changing canonical semantics.

## Intake lifecycle

```text
proposal
 -> claim extraction
 -> canonical concept resolution
 -> source/lineage capture
 -> semantic comparison
 -> classification
 -> implementation / capability / branch / amendment route
```

## Classification

| Class | Action |
|---|---|
| `CLARIFICATION` | Preserve canonical identifier; improve explanatory material |
| `IMPLEMENTATION` | Change implementation beneath stable contract |
| `CAPABILITY_EXTENSION` | Add reusable capability under an existing family |
| `DOMAIN_BRANCH` | Add domain composition without creating a new universal primitive |
| `AMENDMENT` | Explicitly modify a frozen concept/boundary |
| `HISTORICAL` | Preserve as evidence without current authority |
| `EXPERIMENTAL` | Isolate until evidence supports promotion |
| `CONTRADICTION` | Hold for resolution; do not implement as authoritative |

## Authority comparison

When two statements conflict:

```text
canonical authority
  > explicit amendment
  > capability/domain contract
  > implementation
  > experiment
  > conversation chronology
```

Chronology alone has no authority-raising effect.

## Contradiction handling

A contradiction must retain both source references. The resolver determines whether the later statement is a clarification, implementation correction, branch-specific exception, historical artifact or genuine proposed amendment.

The resolver MUST NOT silently select the newest statement.

## Protected boundaries

- Pulse cannot become automatic currency because a later product spec says so.
- Match cannot become authorization because a later workflow assumes it.
- A provider cannot become a constitutional dependency because a product currently uses it.
- A product cannot create a second universal object or ledger system because its domain needs additional fields.

## Promotion

A proposal may be promoted only after it has a canonical destination and a contract/test boundary. Constitutional amendments additionally require explicit amendment handling and updated source documentation.
