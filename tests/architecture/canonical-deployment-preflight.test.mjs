import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const jobs = JSON.parse(await readFile('architecture/canonical/abba-core-jobs.json','utf8'));
const migration = await readFile('supabase/migrations/20260924000009_abba_phase6_runtime_assurance.sql','utf8');
const preflight = await readFile('packages/orchestration/src/deploymentPreflight.ts','utf8');
const bindingMap = await readFile('architecture/canonical/abba-substrate-binding-map.json','utf8');

test('core job graph extends the governed lifecycle to phase6 assurance', () => {
  assert.equal(jobs.version, '1.8.0');
  assert.equal(jobs.jobSequence.length, 104);
  assert.equal(jobs.jobSequence.at(-1).name, 'CONTINUE_OR_STOP');
  assert.equal(jobs.jobSequence.at(-1).dependsOn[0], 'ABBACORE-103');
  assert.equal(jobs.jobSequence.find((job) => job.name === 'RECONCILE_LIVE_SUBSTRATE').dependsOn[0], 'ABBACORE-46');
});

test('runtime preflight rejects destructive migration surfaces and checks canonical write boundary', () => {
  assert.match(preflight, /DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);
  assert.match(preflight, /omnii_append_event/);
  assert.match(preflight, /20260924000010_reasoning_substrate_binding/);
  assert.match(preflight, /20260924000013_reasoning_binding_update_rpc_text/);
  assert.match(preflight, /RLS/);
});

test('phase6 migration preserves the authority boundary while adding assurance persistence', () => {
  assert.match(migration, /REVOKE ALL ON public\.abba_completion_proofs FROM PUBLIC, anon, authenticated, service_role/);
  assert.match(migration, /is_authority_grant boolean NOT NULL DEFAULT false/);
  assert.match(migration, /ABBA_CONTROL_CYCLE_STATUS_REGRESSION/);
  assert.match(bindingMap, /omnii_append_event/);
});
