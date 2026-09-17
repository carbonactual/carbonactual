# Carbon Actual Runtime Observability Boundary

Status: canonical technical contract.

## Observability is not ontology

Telemetry, logs, traces and metrics describe runtime behavior. They do not become canonical Pulse, Value, authority or evidence merely because they are collected.

```text
runtime telemetry
   -> observability
   -> correlation / diagnosis
   -> selected evidence where justified
   -> Pulse evaluation when the event meets Pulse criteria
```

## Correlation

Critical flows should carry a common correlation lineage across:

```text
request_id
intent_id
workflow_id
execution_id
event_id
outcome_id
pulse_id
```

Identifiers may be omitted where not applicable, but a consequential action must remain traceable across its relevant lifecycle.

## Distinct measurements

- capability health = availability/reliability;
- outcome quality = result effectiveness;
- operational cost = resource consumption;
- Pulse = ecosystem feedback/evidence under its canonical contract;
- Value = evaluated economic/significance outcome.

These are related but not interchangeable.

## Privacy

Observability must minimize personal or sensitive data. Prefer pseudonymous/correlated identifiers, aggregate metrics and event references over copying full payloads into telemetry. Sensitive payloads remain in controlled stores with appropriate access policies.

## Learning

Validated outcomes can update capability evaluation, Swarm ranking and curation. This feedback must preserve provenance and must not manufacture authority or rewrite historical facts.
