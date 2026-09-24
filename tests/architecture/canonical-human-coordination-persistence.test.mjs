import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration=await readFile('supabase/migrations/20260924000014_abba_human_coordination.sql','utf8');
const engine=await readFile('packages/orchestration/src/humanCoordinationEngine.ts','utf8');
const decision=await readFile('packages/orchestration/src/humanAuthorizationBoundary.ts','utf8');

test('human coordination records are durable and RLS protected',()=>{
  assert.match(migration,/abba_human_coordination_requests/);
  assert.match(migration,/abba_human_decisions/);
  assert.match(migration,/enable row level security/i);
  assert.match(migration,/idempotency_key text not null unique/);
});

test('human decisions cannot be fabricated by ABBA',()=>{
  assert.match(migration,/recorded_by <> 'ABBA'/);
  assert.match(migration,/p_decision->>'recordedBy'='ABBA'/);
  assert.match(engine,/canResolveAutomatically:false/);
  assert.match(decision,/grantsAuthority:false/);
});
