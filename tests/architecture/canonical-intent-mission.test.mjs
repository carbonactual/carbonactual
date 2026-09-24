import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-intent-mission-uncertainty.json','utf8'));
const intent=await readFile('packages/orchestration/src/intentResolutionEngine.ts','utf8');
const mission=await readFile('packages/orchestration/src/missionDecompositionEngine.ts','utf8');
const uncertainty=await readFile('packages/orchestration/src/uncertaintyLedger.ts','utf8');
const stewardship=await readFile('packages/orchestration/src/stewardshipImpactEngine.ts','utf8');

test('intent and mission layers are explicitly represented',()=>{
  assert.deepEqual(contract.layers.slice(0,5),['INTENT_RESOLUTION','CONSTRAINT_DISCOVERY','SUCCESS_CRITERIA','ASSUMPTION_REGISTER','UNCERTAINTY_LEDGER']);
  assert.match(intent,/EXPLICIT_HUMAN/);
  assert.match(intent,/clarificationRequired/);
  assert.match(mission,/criticalPath/);
  assert.match(mission,/unresolvedDependencies/);
});

test('uncertainty is preserved instead of promoted to truth',()=>{
  assert.match(uncertainty,/CONTRADICTION/);
  assert.match(uncertainty,/MISSING_EVIDENCE/);
  assert.match(uncertainty,/isTruth: false/);
});

test('stewardship measures waste, risk, reversibility and human impact',()=>{
  assert.match(stewardship,/WASTE/);
  assert.match(stewardship,/RISK/);
  assert.match(stewardship,/REVERSIBILITY/);
  assert.match(stewardship,/HUMAN_IMPACT/);
});

test('planning never authorizes execution',()=>{
  assert.match(intent,/executionAllowed: false/);
  assert.match(mission,/executionAllowed: false/);
  assert.match(contract.executionBoundary,/Authority \+ Policy \+ Consent Gate/);
});
