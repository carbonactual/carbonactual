import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const supervisor = await readFile('packages/orchestration/src/abbaCoreSupervisor.ts','utf8');
const index = await readFile('packages/orchestration/src/index.ts','utf8');

test('ABBA core supervisor integrates observation, continuation and reconciliation', () => {
  assert.match(supervisor, /runtime\.executeObservationCycle/);
  assert.match(supervisor, /jobs\.reconcileCycle/);
  assert.match(supervisor, /CHOOSE_ALL_AND_CONTINUE/);
  assert.match(supervisor, /reconciliation\.reconcile/);
  assert.match(supervisor, /proposeRepair/);
});

test('ABBA core supervisor is part of the exported orchestration surface', () => {
  assert.match(index, /abbaCoreSupervisor/);
});
