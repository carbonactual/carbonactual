import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const planner = await readFile('packages/orchestration/src/responsePlanner.ts', 'utf8');
const migration = await readFile('supabase/migrations/20260924000004_abba_response_proposals.sql', 'utf8');

test('response planner emits only the governed proposal vocabulary', () => {
  assert.match(planner, /TEAM_PROPOSAL/);
  assert.match(planner, /WORKFLOW_ADJUSTMENT_PROPOSAL/);
  assert.match(planner, /RESOURCE_REALLOCATION_PROPOSAL/);
  assert.match(planner, /POLICY_CHANGE_PROPOSAL/);
  assert.match(planner, /PULSE_RECALCULATION_REQUEST/);
  assert.match(planner, /ANOMALY_ESCALATION/);
});

test('response planner cannot authorize or execute its own proposals', () => {
  assert.match(planner, /authorityRequired: true/);
  assert.match(planner, /executionAllowed: false/);
  assert.doesNotMatch(planner, /authorize.*proposal/i);
});

test('response proposals are durable, idempotent and fail-closed', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.abba_response_proposals/);
  assert.match(migration, /idempotency_key text NOT NULL UNIQUE/);
  assert.match(migration, /authority_required boolean NOT NULL DEFAULT true CHECK \(authority_required = true\)/);
  assert.match(migration, /execution_allowed boolean NOT NULL DEFAULT false CHECK \(execution_allowed = false\)/);
  assert.match(migration, /append_abba_response_proposal/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.append_abba_response_proposal\(jsonb\) TO service_role/);
});
