import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-human-coordination.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-human-coordination-jobs.json','utf8'));
const coordination=await readFile('packages/orchestration/src/humanCoordinationEngine.ts','utf8');
const consent=await readFile('packages/orchestration/src/consentBoundary.ts','utf8');
const auth=await readFile('packages/orchestration/src/humanAuthorizationBoundary.ts','utf8');
const pack=await readFile('packages/orchestration/src/humanCoordinationPack.ts','utf8');
const runtime=await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');

test('human coordination covers clarification, authorization, consent, review and escalation',()=>{
  for(const name of ['CLARIFICATION','AUTHORIZATION','CONSENT','REVIEW','ESCALATION']) assert.ok(contract.functions.includes(name));
});

test('ABBA cannot fabricate human authority or input',()=>{
  assert.match(coordination,/canResolveAutomatically:false/);
  assert.match(consent,/isInferred:false/);
  assert.match(auth,/grantsAuthority:false/);
});

test('consent is scoped and explicit',()=>{
  assert.match(consent,/scope/);
  assert.match(consent,/status:'PENDING'/);
  assert.match(contract.rules.join(' '),/lack of consent is not consent/i);
});

test('human coordination pack is execution-disabled',()=>{
  assert.equal(jobs.jobs.length,10);
  assert.match(pack,/executionAllowed:false/);
  assert.match(runtime,/humanCoordinationStore/);
  assert.match(runtime,/recordRequest/);
  assert.match(runtime,/recordDecision/);
});
