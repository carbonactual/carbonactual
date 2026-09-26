import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const binder=await readFile('packages/orchestration/src/reasoningSubstrateBinder.ts','utf8');
const alias=await readFile('packages/orchestration/src/substrateBinder.ts','utf8');
const migration=await readFile('supabase/migrations/20260924000010_reasoning_assurance_binding.sql','utf8');
const events=await readFile('packages/events/src/types.ts','utf8');
const adapter=await readFile('packages/orchestration/src/supabaseRuntimeAdapters.ts','utf8');
const contract=JSON.parse(await readFile('architecture/canonical/abba-reasoning-substrate-binding.json','utf8'));

test('the substrate binder uses the existing governed abstractions',()=>{
  assert.match(binder,/ABBAReasoningAssuranceEngine/);
  assert.match(binder,/ABBAAuthorityPolicyGate/);
  assert.match(binder,/CanonicalEventWriter/);
  assert.match(binder,/ReasoningChainAuditStore/);
  assert.doesNotMatch(binder,/createClient/);
  assert.doesNotMatch(binder,/SYSTEM_INTERNAL/);
});

test('reasoning binding requires independent governance before event emission',()=>{
  assert.match(binder,/gate\.decision !== 'ALLOW'/);
  assert.match(binder,/abba_reasoning_bound/);
  assert.match(binder,/authoritySignature/);
  assert.match(binder,/DECISION_GOVERNANCE_REFERENCES_REQUIRED/);
});

test('reasoning audit persistence is RLS protected and idempotent',()=>{
  assert.match(migration,/abba_reasoning_chains/);
  assert.match(migration,/ENABLE ROW LEVEL SECURITY/);
  assert.match(migration,/idempotency_key TEXT NOT NULL UNIQUE/);
  assert.match(migration,/append_abba_reasoning_chain/);
  assert.match(migration,/REVOKE ALL ON FUNCTION public\.append_abba_reasoning_chain/);
});

test('canonical event vocabulary and Supabase adapter expose the reasoning-bound event',()=>{
  assert.match(events,/abba_reasoning_bound/);
  assert.match(adapter,/SupabaseReasoningChainAuditStore/);
  assert.match(alias,/reasoningSubstrateBinder/);
});

test('contract encodes the complete epistemic-to-governance boundary',()=>{
  assert.deepEqual(contract.pipeline.slice(-3),[
    'DECISION',
    'AUTHORITY_POLICY_CONSENT_GATE',
    'CANONICAL_EVENT_INGRESS'
  ]);
  assert.equal(contract.executionBoundary,'AUTHORITY_POLICY_CONSENT_GATE');
});
