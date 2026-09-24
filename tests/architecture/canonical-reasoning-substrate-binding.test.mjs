import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const binder = await readFile('packages/orchestration/src/reasoningSubstrateBinding.ts','utf8');
const migration = await readFile('supabase/migrations/20260924000010_reasoning_substrate_binding.sql','utf8');

test('reasoning substrate binder never writes canonical state itself', () => {
  assert.match(binder, /CanonicalEventEnvelope/);
  assert.match(binder, /prepareCanonicalEvent/);
  assert.doesNotMatch(binder, /append_canonical_event/);
  assert.match(binder, /executionAllowed: false/);
});

test('epistemic chain allows branching classes without treating ordering as truth', () => {
  assert.match(binder, /allowedTransition/);
  assert.match(binder, /INVALID_REASONING_TRANSITION/);
  assert.match(binder, /DECISION_REQUIRES_RECOMMENDATION_BASIS/);
});

test('durable binding is idempotent and RLS protected', () => {
  assert.match(migration, /abba_reasoning_substrate_bindings/);
  assert.match(migration, /idempotency_key text not null unique/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /append_abba_reasoning_substrate_binding/);
  assert.match(migration, /revoke all on public\.abba_reasoning_substrate_bindings/);
});
