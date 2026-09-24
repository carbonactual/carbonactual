import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const binder=await readFile('packages/orchestration/src/reasoningSubstrateBinding.ts','utf8');
const bridge=await readFile('packages/orchestration/src/governedReasoningSubstrateBridge.ts','utf8');
const migration=await readFile('supabase/migrations/20260924000010_reasoning_substrate_binding.sql','utf8');
const rls=await readFile('supabase/migrations/20260924000011_postgis_rls_remediation.sql','utf8');
const adapters=await readFile('packages/orchestration/src/supabaseRuntimeAdapters.ts','utf8');

test('substrate binder prepares but never calls canonical persistence',()=>{
  assert.match(binder,/prepareCanonicalEvent/);
  assert.doesNotMatch(binder,/append_canonical_event/);
  assert.match(binder,/executionAllowed: false/);
});

test('governed bridge crosses the independent gate before execution',()=>{
  assert.match(bridge,/gate\.evaluate/);
  assert.match(bridge,/bindingStatus: 'GATED'/);
  assert.match(bridge,/executionGateway\.execute/);
  assert.doesNotMatch(bridge,/append_canonical_event/);
});

test('reasoning binding persistence is idempotent and monotonic',()=>{
  assert.match(migration,/idempotency_key text not null unique/);
  assert.match(migration,/ABBA_REASONING_BINDING_STATUS_REGRESSION/);
  assert.match(migration,/append_abba_reasoning_substrate_binding/);
});

test('live event adapter binds to the existing omnii append-event substrate',()=>{
  assert.match(adapters,/SupabaseOmniiEventWriter/);
  assert.match(adapters,/omnii_append_event/);
  assert.match(adapters,/p_idempotency_key: event\.idempotencyKey/);
  assert.match(adapters,/CANONICAL_EVENT_TYPES\.includes/);
  assert.match(adapters,/authoritySignature: event\.authoritySignature/);
  assert.doesNotMatch(adapters,/canonical_events\s*\(/i);
});

test('PostGIS remediation enables RLS and preserves public read-only access',()=>{
  assert.match(rls,/ENABLE ROW LEVEL SECURITY/i);
  assert.match(rls,/FOR SELECT/);
  assert.match(rls,/TO PUBLIC/);
  assert.doesNotMatch(rls,/DROP|TRUNCATE|DELETE FROM/i);
});
