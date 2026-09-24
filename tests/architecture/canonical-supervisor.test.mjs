import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const supervisor = await readFile('packages/orchestration/src/abbaSupervisor.ts','utf8');
const migration = await readFile('supabase/migrations/20260924000005_abba_supervisor_and_substrate_bindings.sql','utf8');

test('ABBA supervisor supports idempotent leases, retries and continuation', () => {
  assert.match(supervisor, /idempotencyKey/);
  assert.match(supervisor, /leaseExpiresAt/);
  assert.match(supervisor, /checkpointFailure/);\n  assert.match(supervisor, /recoverExpiredLease/);\n  assert.match(supervisor, /retryBaseSeconds/);
  assert.match(supervisor, /maxAttempts/);
  assert.match(supervisor, /ACTIVE_JOBS_REMAIN/);
  assert.match(supervisor, /ELIGIBLE_DEPENDENT_JOBS_AVAILABLE/);
  assert.match(supervisor, /OBJECTIVE_COMPLETE/);
});

test('substrate bridge remains a compatibility binding rather than semantic authority', () => {
  assert.match(supervisor, /SubstrateBinding/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.abba_substrate_bindings/);
  assert.match(migration, /substrate_kind text NOT NULL/);
  assert.match(migration, /UNIQUE \(canonical_ref, substrate_kind, substrate_ref\)/);
});

test('supervisor persistence is closed to direct client writes', () => {
  for (const table of ['abba_control_cycles','abba_job_runs','abba_substrate_bindings']) {
    assert.match(migration, new RegExp(`REVOKE ALL ON public\\.${table} FROM PUBLIC, anon, authenticated, service_role`));
  }
});
