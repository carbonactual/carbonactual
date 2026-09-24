import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const map = JSON.parse(await readFile('architecture/canonical/abba-substrate-binding-map.json','utf8'));
const engine = await readFile('packages/orchestration/src/reconciliationEngine.ts','utf8');

test('ABBA substrate map reuses existing runtime surfaces without granting authority', () => {
  assert(map.bindings.length >= 10);
  assert(map.bindings.some((binding) => binding.substrate === 'public.omnii_process_tasks'));
  assert(map.bindings.some((binding) => binding.substrate === 'public.omnii_execution_controls'));
  assert.match(map.integrationRules.join(' '), /capability availability never implies authority/i);
});

test('reconciliation detects stale, duplicate, missing and mismatched bindings', () => {
  for (const status of ['STALE','DUPLICATE','MISSING_CANONICAL','MISSING_SUBSTRATE','MISMATCHED','MATCHED']) {
    assert.match(engine, new RegExp(status));
  }
  assert.match(engine, /proposeRepair/);
  assert.match(engine, /authorityRequired: true/);
  assert.match(engine, /executionAllowed: false/);
});
