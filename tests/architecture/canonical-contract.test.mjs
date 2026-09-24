import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../');
const canonicalRoot = resolve(root, 'architecture/canonical');
const sqlPath = resolve(root, 'supabase/migrations/20260924000000_canonical_init.sql');

const load = async (filename) =>
  JSON.parse(await readFile(resolve(canonicalRoot, filename), 'utf8'));

test('Phase 0 canonical module set is complete and machine-readable', async () => {
  const system = await load('system-contract.json');
  assert.equal(system.constitutionalAuthority, 'carbonactual/hapi-world/CANON.md');
  assert.equal(system.provenance.historicalRepository, 'carbonactual/omnii');
  assert.equal(system.provenance.historicalRepositoryStatus, 'ARCHIVED_PROVENANCE_ONLY');
  assert.equal(system.provenance.liveCanonicalRepository, 'carbonactual/carbonactual');
  assert.equal(system.modules.length, 15);
  for (const moduleName of system.modules) await assert.doesNotReject(() => load(moduleName));
  assert(system.modules.includes('feedback-telemetry-rules.json'));
  assert(system.modules.includes('abba-core-jobs.json'));
  assert(system.modules.includes('abba-substrate-binding-map.json'));
});

test('ABBA remains an orchestrator, not a self-authorizing authority', async () => {
  const auth = await load('identity-authority.json');
  const rules = auth.authorityBoundaries.abbaControlPlane;
  assert.equal(rules.canSelfAuthorize, false);
  assert.equal(rules.canAuthorizeStateMutations, false);
  assert.equal(rules.canBypassPolicies, false);
  assert.equal(rules.canCreateAuthority, false);
});

test('Capability, permission and authority remain distinct', async () => {
  const model = await load('capability-permission.json');
  assert.equal(model.invariant, 'Capability does not imply Permission or Authority.');
  assert(model.nonEquivalences.includes('capability != permission'));
  assert(model.nonEquivalences.includes('permission != authority'));
  const stateCapability = model.capabilities.find((c) => c.capabilityId === 'cap_state_mutation_request');
  assert(stateCapability);
  assert.match(stateCapability.description, /direct database mutation is not a capability granted to ABBA/);
});

test('Agent lifecycle preserves the canonical state transitions', async () => {
  const model = await load('agent-state-machines.json');
  const transitions = new Set(model.transitionRules.map((t) => `${t.from}->${t.to}:${t.requiredEvent}`));
  for (const expected of [
    'UNINITIALIZED->REGISTERED:agent_registered',
    'REGISTERED->PROVISIONED:agent_capabilities_bound',
    'PROVISIONED->ACTIVE:agent_activated',
    'ACTIVE->EXECUTING:agent_task_started',
    'EXECUTING->ACTIVE:agent_task_completed',
    '*->TERMINATED:agent_terminated'
  ]) assert(transitions.has(expected), `missing transition ${expected}`);
});

test('Economic model carries audit, idempotency and recovery controls', async () => {
  const model = await load('economic-event-model.json');
  const eventTypes = model.requiredEventSchema.properties.eventType.enum;
  for (const eventType of ['value_created', 'agent_task_completed', 'agent_contract_settled', 'pulse_observed', 'reconciliation_completed']) {
    assert(eventTypes.includes(eventType));
  }
  for (const field of ['schemaVersion', 'provenance', 'correlationId', 'idempotencyKey']) {
    assert(model.requiredEventSchema.properties[field]);
  }
});

test('Pulse is measurement/feedback, not currency or authority', async () => {
  const model = await load('value-pulse-rules.json');
  assert.equal(model.referenceEquation.equation, 'PulseScore = ((V_created - C_consumed) * T_velocity) / log2(N_active_agents + 1)');
  for (const forbidden of ['currency', 'authority', 'permission', 'ownership']) {
    assert(model.constraints.pulseCannotAutomaticallyBecome.includes(forbidden));
  }
});

test('Economic representation boundaries remain explicit', async () => {
  const asset = await load('asset-liability-rules.json');
  const token = await load('tokenization-rules.json');
  assert.equal(asset.rules.enforceDoubleEntry, true);
  assert.equal(asset.rules.requireEvidenceForClassification, true);
  assert.equal(token.precision.decimalPlaces, 18);
  assert(token.rules.some((rule) => rule.includes('cannot manufacture ownership')));
  assert(token.rules.some((rule) => rule.includes('Physical asset backing is required only where')));
});

test('SQL substrate is fail-closed for direct client writes and immutable for events', async () => {
  const sql = await readFile(sqlPath, 'utf8');
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.canonical_events FROM anon, authenticated;/);
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.hapi_agents FROM anon, authenticated;/);
  assert.match(sql, /prevent_canonical_event_mutation/);
  assert.match(sql, /DEFERRABLE INITIALLY DEFERRED/);
  assert.match(sql, /ledger_entries/);
  assert.match(sql, /ledger_lines/);
});

test('Canonical execution boundary requires an authenticated, validated, idempotent adapter path', async () => {
  const exec = await load('execution-contracts.json');
  assert.equal(exec.stateMutationRule.noBypass, true);
  for (const requirement of ['authenticated_boundary', 'schema_validation', 'authority_policy_gate', 'idempotency', 'provenance', 'audit']) {
    assert(exec.adapterBoundary.mustUse.includes(requirement));
  }
});
