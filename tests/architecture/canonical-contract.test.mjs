import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../architecture/canonical');

const load = async (filename) => JSON.parse(await readFile(resolve(root, filename), 'utf8'));

test('Phase 0 canonical module set is complete and JSON-valid', async () => {
  const system = await load('system-contract.json');
  assert.equal(system.system, 'Carbon Actual');
  assert.equal(system.orchestrationPlane, 'ABBA');
  assert.equal(system.constitutionalAuthority, 'carbonactual/hapi-world/CANON.md');

  for (const moduleName of system.modules) {
    await assert.doesNotReject(async () => { await load(moduleName); });
  }
});

test('Archived OMNII is provenance-only and not the live semantic authority', async () => {
  const system = await load('system-contract.json');
  assert.equal(system.provenance.historicalRepository, 'carbonactual/omnii');
  assert.equal(system.provenance.historicalRepositoryStatus, 'ARCHIVED_PROVENANCE_ONLY');
  assert.equal(system.provenance.liveCanonicalRepository, 'carbonactual/carbonactual');
});

test('ABBA cannot self-authorize or bypass policy', async () => {
  const auth = await load('identity-authority.json');
  assert.equal(auth.authorityBoundaries.abbaControlPlane.canSelfAuthorize, false);
  assert.equal(auth.authorityBoundaries.abbaControlPlane.canAuthorizeStateMutations, false);
  assert.equal(auth.authorityBoundaries.abbaControlPlane.canBypassPolicies, false);
  assert.equal(auth.authorityBoundaries.abbaControlPlane.canCreateAuthority, false);
});

test('Capability, permission and authority remain distinct', async () => {
  const model = await load('capability-permission.json');
  assert(model.nonEquivalences.includes('capability != permission'));
  assert(model.nonEquivalences.includes('permission != authority'));
  assert(model.nonEquivalences.includes('match != authorization'));
});

test('Agent lifecycle retains the supplied Phase 0 transitions', async () => {
  const model = await load('agent-state-machines.json');
  assert.equal(model.initialState, 'UNINITIALIZED');
  const key = model.transitionRules.map(t => `${t.from}->${t.to}:${t.requiredEvent}`);
  assert(key.includes('UNINITIALIZED->REGISTERED:agent_registered'));
  assert(key.includes('REGISTERED->PROVISIONED:agent_capabilities_bound'));
  assert(key.includes('PROVISIONED->ACTIVE:agent_activated'));
  assert(key.includes('ACTIVE->EXECUTING:agent_task_started'));
  assert(key.includes('EXECUTING->ACTIVE:agent_task_completed'));
  assert(key.includes('*->TERMINATED:agent_terminated'));
});

test('Economic event model carries traceability and core events', async () => {
  const model = await load('economic-event-model.json');
  const events = model.requiredEventSchema.properties.eventType.enum;
  for (const eventType of ['value_created', 'agent_task_completed', 'agent_contract_settled', 'pulse_observed', 'reconciliation_completed']) {
    assert(events.includes(eventType));
  }
  for (const field of ['schemaVersion', 'provenance', 'correlationId', 'idempotencyKey']) {
    assert(model.requiredEventSchema.properties[field]);
  }
});

test('Pulse remains measurement and not authority/currency', async () => {
  const model = await load('value-pulse-rules.json');
  assert.equal(model.referenceEquation.equation, 'PulseScore = ((V_created - C_consumed) * T_velocity) / log2(N_active_agents + 1)');
  assert(model.constraints.pulseCannotAutomaticallyBecome.includes('currency'));
  assert(model.constraints.pulseCannotAutomaticallyBecome.includes('authority'));
});

test('Asset/liability and tokenization boundaries remain distinct', async () => {
  const al = await load('asset-liability-rules.json');
  const tok = await load('tokenization-rules.json');
  assert.equal(al.classificationInputs.includes('evidence'), true);
  assert.equal(tok.constraints.underlyingObjectPrimary, true);
  assert.equal(tok.maxDecimalPlaces ?? tok.constraints.maxDecimalPlaces, 18);
  assert(tok.rules.some(r => r.includes('cannot manufacture ownership')));
});

test('Execution contract protects the adapter and state-mutation boundaries', async () => {
  const model = await load('execution-contracts.json');
  assert.equal(model.stateMutationRule.noBypass, true);
  assert(model.adapterBoundary.mustUse.includes('authority_policy_gate'));
  assert(model.adapterBoundary.mustUse.includes('idempotency'));
});
