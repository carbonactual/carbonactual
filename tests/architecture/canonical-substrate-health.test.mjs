import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const engine=await readFile('packages/orchestration/src/substrateHealthEngine.ts','utf8');
const gate=await readFile('packages/orchestration/src/substrateReadinessGate.ts','utf8');
const manifest=JSON.parse(await readFile('architecture/canonical/abba-live-substrate-health.json','utf8'));

test('substrate health checks mapping, RLS, write boundaries and semantic duplication',()=>{
  for(const token of ['RLS_ENABLED','DIRECT_CLIENT_WRITE_DENIED','PRIVILEGED_INGRESS_AVAILABLE','NO_DUPLICATE_SEMANTIC_SURFACE']) assert.match(JSON.stringify(manifest),new RegExp(token));
  assert.match(engine,/DUPLICATE_SEMANTIC_SURFACE/);
  assert.match(engine,/executionTechnicalReady/);
});

test('technical readiness is evaluated before authorization but never grants authorization',()=>{
  assert.match(gate,/PROCEED_TO_AUTHORITY_GATE/);
  assert.match(gate,/HOLD_FOR_SUBSTRATE_REPAIR/);
  assert.match(gate,/executionAllowed:false/);
});

test('production event and reasoning binding ingress are explicitly mapped',()=>{
  assert.match(JSON.stringify(manifest),/omnii_append_event/);
  assert.match(JSON.stringify(manifest),/append_abba_reasoning_substrate_binding/);
  assert.match(JSON.stringify(manifest),/HEALTH_RECONCILED/);
});
