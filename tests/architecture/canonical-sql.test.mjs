import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sql = await readFile(
  'supabase/migrations/20260924000000_canonical_init.sql',
  'utf8'
);

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
  for (const table of [
    'entities',
    'authority_grants',
    'hapi_agents',
    'canonical_events',
    'ledger_accounts',
    'ledger_entries',
    'ledger_lines',
    'pulse_observations'
  ]) {
    assert.match(
      sql,
      new RegExp(`REVOKE INSERT, UPDATE, DELETE ON public\\.${table} FROM anon, authenticated;`)
    );
  }
});

test('ledger balancing is unit-specific and checks debit/credit presence', () => {
  assert.match(sql, /GROUP BY unit/);
  assert.match(sql, /COUNT\(\*\) FILTER \(WHERE side='DEBIT'\)/);
  assert.match(sql, /COUNT\(\*\) FILTER \(WHERE side='CREDIT'\)/);
});

test('Privileged canonical RPC and Pulse trigger exist', () => {
  assert.match(ingress,/append_canonical_event/);
  assert.match(ingress,/GRANT EXECUTE ON FUNCTION public\.append_canonical_event\(jsonb\) TO service_role/);
  assert.match(ingress,/trg_calculate_pulse_score/);
  assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.pulse_observations/);
  assert.match(sql,/pulse_score NUMERIC/);
});
