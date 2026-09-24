import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const gate = await readFile('packages/orchestration/src/authorityPolicyGate.ts', 'utf8');
const execution = await readFile('packages/orchestration/src/executionGateway.ts', 'utf8');
const coordinator = await readFile('packages/orchestration/src/governedActionCoordinator.ts', 'utf8');
const doc = await readFile('architecture/CARBON_ACTUAL_ABBA_GOVERNED_EXECUTION_2026.md', 'utf8');

test('authority/policy gate has explicit independent evaluators', () => {
  assert.match(gate, /AuthorityEvaluator/);
  assert.match(gate, /PolicyEvaluator/);
  assert.match(gate, /ConsentEvaluator/);
  assert.match(gate, /REQUIRE_HUMAN_AUTHORIZATION/);
  assert.match(gate, /decision: 'ALLOW'/);
});

test('ABBA gate never manufactures authority', () => {
  assert.match(gate, /authorityRef/);
  assert.match(gate, /AUTHORITY_REFERENCE_REQUIRED/);
  assert.doesNotMatch(gate, /createAuthority|grantAuthority|selfAuthorize/i);
});

test('governed action coordinator evaluates the gate before execution', () => {
  assert.match(coordinator, /gate\.evaluate/);
  assert.match(coordinator, /executionGateway\.execute/);
  assert.match(coordinator, /gateDecision: gate\.decision/);
});

test('execution gateway cannot execute blocked work', () => {
  assert.match(execution, /gateDecision !== 'ALLOW'/);
  assert.match(execution, /HUMAN_AUTHORIZATION_REQUIRED/);
  assert.match(execution, /actionExecutor\.execute/);
});

test('execution requires evidence before canonical event persistence', () => {
  assert.match(execution, /EXECUTION_EVIDENCE_REQUIRED/);
  assert.match(execution, /canonicalEventWriter\.append/);
  assert.match(doc, /Evidence-first rule/);
});
