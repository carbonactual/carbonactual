import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const role=await readFile('packages/orchestration/src/roleIntelligenceEngine.ts','utf8');
const accountability=await readFile('packages/orchestration/src/accountabilityEngine.ts','utf8');
const pack=await readFile('packages/orchestration/src/institutionalRoleIntelligencePack.ts','utf8');
const contract=JSON.parse(await readFile('architecture/canonical/abba-role-responsibility-accountability.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-role-accountability-jobs.json','utf8'));
const runtime=await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');

test('roles and responsibilities stay distinct from authority',()=>{
  assert.match(JSON.stringify(contract),/ROLE/);
  assert.match(JSON.stringify(contract),/RESPONSIBILITY/);
  assert.match(JSON.stringify(contract),/CAPABILITY/);
  assert.match(JSON.stringify(contract),/AUTHORITY/);
});

test('segregation of duties and dual control are explicit',()=>{
  assert.match(role,/SEGREGATION_OF_DUTIES/);
  assert.match(accountability,/DUAL_CONTROL_REQUIRED/);
  assert.match(accountability,/RESPONSIBILITY_OWNER_MISSING/);
});

test('institutional role pack is execution-disabled',()=>{
  assert.equal(jobs.jobs.length,11);
  assert.match(pack,/executionAllowed:false/);
  assert.match(runtime,/roleAccountabilityPack\.analyze/);
  assert.match(runtime,/ACCOUNTABILITY_GAP/);
});
