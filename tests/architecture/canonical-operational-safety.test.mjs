import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const envelope=await readFile('packages/orchestration/src/operationalSafetyEnvelope.ts','utf8');
const breaker=await readFile('packages/orchestration/src/circuitBreakerEngine.ts','utf8');
const guard=await readFile('packages/orchestration/src/autonomousSafetyGuard.ts','utf8');
const bridge=await readFile('packages/orchestration/src/governedReasoningSubstrateBridge.ts','utf8');
const contract=JSON.parse(await readFile('architecture/canonical/abba-operational-safety-envelope.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-operational-safety-jobs.json','utf8'));

test('safety envelope covers core operational bounds',()=>{
  for(const token of ['COST_CEILING','CONCURRENCY_CEILING','RETRY_CEILING','BLAST_RADIUS_CEILING','DATA_EGRESS_CEILING','REVERSIBILITY','CIRCUIT_BREAKER']) assert.ok(contract.controls.includes(token));
  assert.match(envelope,/COST_CEILING_EXCEEDED/);
  assert.match(envelope,/BLAST_RADIUS_CEILING_EXCEEDED/);
  assert.match(envelope,/DATA_EGRESS_CEILING_EXCEEDED/);
});

test('circuit breakers are explicit and execution-disabled',()=>{
  assert.match(breaker,/CIRCUIT_OPEN/);
  assert.match(breaker,/FAILURE_THRESHOLD_REACHED/);
  assert.match(breaker,/executionAllowed: false/);
});

test('safety guard can only progress to the authority gate',()=>{
  assert.match(guard,/proceedToAuthorityGate/);
  assert.match(guard,/executionAllowed: false/);
});

test('operational safety is evaluated before authority crossing',()=>{
  assert.match(bridge,/safetyGuard\.evaluate/);
  assert.match(bridge,/if \(!safetyCheck\.proceedToAuthorityGate\)/);
  assert.match(bridge,/gate = await this\.gate\.evaluate/);
});

test('operational safety specialist pack is complete',()=>{
  assert.equal(jobs.jobs.length,11);
  assert.equal(jobs.jobs.at(-1),'PROCEED_TO_AUTHORITY_GATE');
});
