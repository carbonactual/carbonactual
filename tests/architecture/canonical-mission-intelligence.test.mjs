import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-intelligence-specialist-packs.json','utf8'));
const provenance=await readFile('packages/orchestration/src/capabilityProvenanceEngine.ts','utf8');
const simulation=await readFile('packages/orchestration/src/outcomeSimulationEngine.ts','utf8');
const intent=await readFile('packages/orchestration/src/intentResolutionEngine.ts','utf8');
const mission=await readFile('packages/orchestration/src/missionDecompositionEngine.ts','utf8');
const uncertainty=await readFile('packages/orchestration/src/uncertaintyLedger.ts','utf8');
const stewardship=await readFile('packages/orchestration/src/stewardshipImpactEngine.ts','utf8');
const runtime=await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');
const graph=JSON.parse(await readFile('architecture/canonical/abba-core-jobs.json','utf8'));

test('specialist packs cover mission intelligence, capability assurance, outcomes and stewardship',()=>{
  assert.equal(contract.packs.length,4);
  assert.match(JSON.stringify(contract),/MISSION_INTELLIGENCE/);
  assert.match(JSON.stringify(contract),/CAPABILITY_ASSURANCE/);
  assert.match(JSON.stringify(contract),/OUTCOME_ANALYSIS/);
  assert.match(JSON.stringify(contract),/STEWARDSHIP/);
});

test('intent and mission layers preserve ambiguity and dependencies',()=>{
  assert.match(intent,/clarificationRequired/);
  assert.match(mission,/unresolvedDependencies/);
  assert.match(mission,/executionAllowed: false/);
});

test('uncertainty remains explicitly non-truth',()=>{
  assert.match(uncertainty,/CONTRADICTION/);
  assert.match(uncertainty,/MISSING_EVIDENCE/);
  assert.match(uncertainty,/isTruth: false/);
});

test('capability provenance cannot grant permission or authority',()=>{
  assert.match(provenance,/provenanceAccepted/);
  assert.match(provenance,/executionEligible: false/);
  assert.match(provenance,/authorityEligible: false/);
  assert.match(provenance,/permissionGranted: false/);
});

test('simulation is analysis only',()=>{
  assert.match(simulation,/analysisOnly: true/);
  assert.match(simulation,/isEvidenceOfFutureOutcome: false/);
});

test('core graph exposes specialist packs without changing the governing core',()=>{
  assert.deepEqual(graph.specialistPacks,['MISSION_INTELLIGENCE','CAPABILITY_ASSURANCE','OUTCOME_ANALYSIS','STEWARDSHIP']);
  assert.match(runtime,/missionIntelligencePack/);
  assert.match(runtime,/INTENT_CLARIFICATION_REQUIRED/);
});

test('stewardship covers waste, risk, people, environment and continuity',()=>{
  for (const token of ['WASTE','RISK','HUMAN_IMPACT','ENVIRONMENTAL_IMPACT','CONTINUITY']) assert.match(stewardship,new RegExp(token));
});
