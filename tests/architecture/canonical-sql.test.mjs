import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sql = await readFile('supabase/migrations/20260924000000_canonical_init.sql', 'utf8');
const ingress = await readFile('supabase/migrations/20260924000002_canonical_event_ingress_and_pulse.sql', 'utf8');
const feedback = await readFile('supabase/migrations/20260924000003_feedback_observation_and_proposals.sql', 'utf8');
const response = await readFile('supabase/migrations/20260924000004_abba_response_proposals.sql', 'utf8');
const supervisor = await readFile('supabase/migrations/20260924000005_abba_supervisor_and_substrate_bindings.sql', 'utf8');
const reconciliation = await readFile('supabase/migrations/20260924000006_abba_reconciliation_and_completion.sql', 'utf8');
const executions = await readFile('supabase/migrations/20260924000007_abba_execution_attempt_ledger.sql', 'utf8');

test('canonical migration preserves append-only event history', () => {
  assert.match(sql, /BEFORE UPDATE OR DELETE ON public\.canonical_events/);
  assert.match(sql, /Canonical events are immutable/);
});

test('canonical migration rejects weak event ingress', () => {
  assert.match(sql, /event_type TEXT NOT NULL CHECK \(event_type IN/);
  assert.match(sql, /idempotency_key TEXT NOT NULL UNIQUE/);
  assert.match(sql, /CONSEQUENTIAL_EVENT_REQUIRES_AUTHORITY/);
  assert.doesNotMatch(sql, /actor_entity_id IS NOT NULL\)/);
});

test('canonical migration keeps client writes closed', () => {
  for (const table of ['entities','authority_grants','hapi_agents','canonical_events','ledger_accounts','ledger_entries','ledger_lines','pulse_observations']) {
    assert(sql.includes(`REVOKE INSERT, UPDATE, DELETE ON public.${table} FROM anon, authenticated;`), `missing client DML revoke for ${table}`);
  }
});

test('ledger balancing is unit-specific and checks debit/credit presence', () => {
  assert(sql.includes("COUNT(*) FILTER (WHERE side='DEBIT')"));
  assert(sql.includes("COUNT(*) FILTER (WHERE side='CREDIT')"));
  assert.match(sql, /GROUP BY unit/);
});

test('Privileged canonical RPC and Pulse trigger exist', () => {
  assert(ingress.includes('append_canonical_event'));
  assert(ingress.includes('GRANT EXECUTE ON FUNCTION public.append_canonical_event(jsonb) TO service_role'));
  assert(ingress.includes('trg_calculate_pulse_score'));
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.pulse_observations/);
  assert.match(sql, /pulse_score NUMERIC/);
});

test('feedback observation storage is durable and closed to direct writes', () => {
  assert.match(feedback, /CREATE TABLE IF NOT EXISTS public\.feedback_observations/);
  assert.match(feedback, /signal_id text NOT NULL UNIQUE/);
  assert(feedback.includes('append_feedback_observation'));
  assert(feedback.includes('GRANT EXECUTE ON FUNCTION public.append_feedback_observation(jsonb) TO service_role'));
  assert(feedback.includes('REVOKE ALL ON public.feedback_observations FROM PUBLIC, anon, authenticated, service_role'));
});

test('ABBA proposal storage is idempotent and cannot authorize itself', () => {
  assert.match(feedback, /CREATE TABLE IF NOT EXISTS public\.abba_team_proposals/);
  assert.match(feedback, /idempotency_key text NOT NULL UNIQUE/);
  assert.match(feedback, /authorization_required boolean NOT NULL DEFAULT true CHECK \(authorization_required = true\)/);
  assert(feedback.includes('append_abba_team_proposal'));
  assert(feedback.includes('GRANT EXECUTE ON FUNCTION public.append_abba_team_proposal(jsonb) TO service_role'));
});

test('ABBA response proposals are durable and execution-disabled until gated', () => {
  assert.match(response, /CREATE TABLE IF NOT EXISTS public\.abba_response_proposals/);
  assert(response.includes('idempotency_key text NOT NULL UNIQUE'));
  assert(response.includes('authority_required boolean NOT NULL DEFAULT true CHECK (authority_required = true)'));
  assert(response.includes('execution_allowed boolean NOT NULL DEFAULT false CHECK (execution_allowed = false)'));
  assert(response.includes('append_abba_response_proposal'));
  assert(response.includes('GRANT EXECUTE ON FUNCTION public.append_abba_response_proposal(jsonb) TO service_role'));
});
