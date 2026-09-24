import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract = JSON.parse(await readFile('architecture/canonical/feedback-telemetry-rules.json','utf8'));
const engine = await readFile('packages/orchestration/src/feedbackEngine.ts','utf8');
const runtime = await readFile('packages/orchestration/src/closedLoopRuntime.ts','utf8');

test('feedback contract anchors ABBA without granting self-authority', () => {
  assert.equal(contract.masterIntelligence, 'ABBA');
  assert.equal(contract.observabilityMode, 'GOVERNED_OBSERVABILITY');
  assert.equal(contract.curationEngine.authorityEligibilityRequired, true);
  assert.equal(contract.curationEngine.riskAssessmentRequired, true);
  assert.equal(contract.proposalRules.authorization, 'authorization_required is always true until an independent authority/policy gate records approval');
});

test('feedback engine requires cryptographic verification to validate a signal', () => {
  assert.match(engine, /SignalVerifier/);
  assert.match(engine, /verifier\.verify\(signal\)/);
  assert.match(engine, /SIGNATURE_OR_PROVENANCE_VERIFICATION_FAILED/);
});

test('feedback engine does not grant authority through team selection', () => {
  assert.match(engine, /authorizationRequired: true/);
  assert.doesNotMatch(engine, /authority\s*=\s*true/);
  assert.doesNotMatch(engine, /authorize.*team/i);
});

test('curation accounts for capability coverage and operational fit', () => {
  assert.match(engine, /requiredCapabilities/);
  assert.match(engine, /availability/);
  assert.match(engine, /authorityEligible/);
  assert.match(engine, /riskEligible/);
  assert.match(engine, /reliability/);
  assert.match(engine, /latencyMs/);
  assert.match(engine, /contextFit/);
});

test('closed-loop runtime is concurrent and requires durable stores before composition', () => {
  assert.match(runtime, /Promise\.all\(/);
  assert.match(runtime, /private readonly observationStore: ObservationStore/);
  assert.match(runtime, /private readonly teamProposalStore: TeamProposalStore/);
  assert.match(runtime, /OBSERVATION_PERSISTENCE_FAILED/);
  assert.match(runtime, /teamProposalStore\.record/);
  assert.doesNotMatch(runtime, /append_canonical_event/);
  assert.doesNotMatch(runtime, /supabase/i);
});
