import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const adapter = await readFile('packages/orchestration/src/supabaseRuntimeAdapters.ts','utf8');
const scanner = await readFile('packages/orchestration/src/liveSubstrateReconciler.ts','utf8');
const evidence = await readFile('packages/orchestration/src/evidenceQualityEngine.ts','utf8');
const proof = await readFile('packages/orchestration/src/completionProof.ts','utf8');
const runtime = await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');
const migration = await readFile('supabase/migrations/20260924000009_abba_phase6_runtime_assurance.sql','utf8');

test('Phase 6 provides concrete Supabase adapters without hard-coding authority into the substrate', () => {
  assert.match(adapter, /SupabaseRpcClient/);
  assert.match(adapter, /append_canonical_event|append_feedback_observation/);
  assert.match(adapter, /SupabaseExecutionAttemptStore/);
  assert.match(adapter, /RECOVERY_REQUIRED/);
  assert.match(adapter, /SupabaseCanonicalEventWriter/);
  assert.match(adapter, /public\./);
  assert.doesNotMatch(adapter, /self-authoriz|grant.*authority/i);
});

test('live substrate scanner is read-only and emits reconciliation inputs', () => {
  assert.match(scanner, /SupabaseTableReader/);
  assert.match(scanner, /ReconciliationInput/);
  assert.match(scanner, /reader\.select/);
  assert.doesNotMatch(scanner, /rpc\.call|append_/);
});

test('evidence remains explicitly separate from truth', () => {
  assert.match(evidence, /isTruth: false/);
  assert.match(evidence, /EXTERNAL_PROVIDER/);
  assert.match(evidence, /PROVISIONAL/);
});

test('completion proof binds evidence, reconciliation and remaining work', () => {
  assert.match(proof, /proofFingerprint/);
  assert.match(proof, /evidenceComplete/);
  assert.match(proof, /reconciliationComplete/);
  assert.match(proof, /outstandingJobIds/);
  assert.match(proof, /isAuthorityGrant: false/);
});

test('runtime orchestrator persists reconciliation and completion proof after core steering', () => {
  assert.match(runtime, /coreSupervisor\.observeAndSteer/);
  assert.match(runtime, /reconciliationWriter\.append/);
  assert.match(runtime, /buildCompletionProof/);
  assert.match(runtime, /completionWriter\.append/);
  assert.doesNotMatch(runtime, /append_canonical_event/);
});

test('Phase 6 migration hardens monotonic cycle state and idempotent assurance records', () => {
  assert.match(migration, /abba_cycle_status_transition_allowed/);
  assert.match(migration, /ABBA_CONTROL_CYCLE_STATUS_REGRESSION/);
  assert.match(migration, /idx_abba_reconciliation_idempotency/);
  assert.match(migration, /idx_abba_completion_proof_fingerprint/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.abba_completion_proofs/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.append_abba_completion_proof/);
  assert.match(migration, /ALREADY_RECOVERY_REQUIRED/);
  assert.match(migration, /ABBA_JOB_RUN_STATUS_REGRESSION/);
  assert.match(migration, /ABBA_EXECUTION_STATUS_REGRESSION/);
  assert.match(migration, /recover_expired_abba_job_runs/);
});
