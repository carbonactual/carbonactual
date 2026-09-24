import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract = JSON.parse(await readFile('architecture/canonical/abba-reasoning-assurance.json','utf8'));
const engine = await readFile('packages/orchestration/src/reasoningAssuranceEngine.ts','utf8');
const runtime = await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');

test('reasoning contract keeps theory, hypothesis, evidence, result, conclusion and recommendation distinct', () => {
  const types = contract.artifactTypes;
  for (const type of ['THEORY','HYPOTHESIS','OBSERVATION','EVIDENCE','RESULT','CONCLUSION','RECOMMENDATION','DECISION']) {
    assert(types.includes(type));
  }
  assert.match(contract.separationRules.join(' '), /THEORY is an explanatory model, not evidence/i);
  assert.match(contract.separationRules.join(' '), /RECOMMENDATION is an action proposal/i);
});

test('reasoning engine requires the right basis for each artifact class', () => {
  assert.match(engine, /HYPOTHESIS_TEST_PLAN_REQUIRED/);
  assert.match(engine, /RESULT_PROCEDURE_REQUIRED/);
  assert.match(engine, /RESULT_EVIDENCE_BASIS_REQUIRED/);
  assert.match(engine, /CONCLUSION_RESULT_OR_EVIDENCE_BASIS_REQUIRED/);
  assert.match(engine, /RECOMMENDATION_CONCLUSION_BASIS_REQUIRED/);
  assert.match(engine, /DECISION_AUTHORITY_REFERENCE_REQUIRED/);
  assert.doesNotMatch(engine, /CONSENT_CHAIN_REQUIRES_PERMISSION_CONTEXT/);
});

test('reasoning engine never authorizes execution', () => {
  assert.match(engine, /executionAllowed: false/);
  assert.match(engine, /authorityRequired: true/);
  assert.match(engine, /RECOMMENDATION_IS_NOT_AUTHORIZATION/);
  assert.match(engine, /DECISION_REQUIRES_INDEPENDENT_GOVERNANCE_VALIDATION/);
});

test('capability, permission, consent and authority stay separate', () => {
  assert.match(contract.governanceRules.join(' '), /Capability never implies permission/);
  assert.match(contract.governanceRules.join(' '), /Permission never implies consent/);
  assert.match(contract.governanceRules.join(' '), /Consent never implies authority/);
  assert.match(runtime, /reasoningAssessments/);
  assert.match(runtime, /evidenceAssessments/);
  assert.match(engine, /PERMISSION_DOES_NOT_IMPLY_AUTHORITY/);
});
