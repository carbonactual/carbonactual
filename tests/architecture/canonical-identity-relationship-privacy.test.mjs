import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const identity=await readFile('packages/orchestration/src/identityRelationshipEngine.ts','utf8');
const privacy=await readFile('packages/orchestration/src/minimumContextRouter.ts','utf8');
const contract=JSON.parse(await readFile('architecture/canonical/abba-identity-relationship-privacy.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-identity-relationship-privacy-jobs.json','utf8'));
const runtime=await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');

test('identity and relationships remain separate from authority',()=>{
  assert.match(identity,/authorityInferred:false/);
  assert.match(identity,/permissionInferred:false/);
  assert.match(contract.rules.join(' '),/Identity is not Activity/i);
});

test('minimum-context routing blocks secret data and records redaction',()=>{
  assert.match(privacy,/SECRET_DATA_DEFAULT_BLOCK/);
  assert.match(privacy,/minimumContextApplied:true/);
  assert.match(privacy,/secretsExposed:false/);
  assert.match(privacy,/redactedPaths/);
});

test('privacy specialist pack is explicit',()=>{
  assert.equal(jobs.jobs.length,9);
  assert.match(runtime,/privacyContext/);
  assert.match(runtime,/privacyRouter\.route/);
  assert.equal(jobs.jobs.at(-1),'AUDIT_PRIVACY_ROUTING');
});
