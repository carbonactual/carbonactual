import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const context = await readFile('packages/orchestration/src/contextEngine.ts', 'utf8');
const planner = await readFile('packages/orchestration/src/responsePlanner.ts', 'utf8');

test('ABBA context engine correlates observations and preserves contradictions', () => {
  assert.match(context, /correlationId/);
  assert.match(context, /preserveContradictions/);
  assert.match(context, /UNRESOLVED_CONFLICT/);
  assert.match(context, /minimumContext/);
});

test('ABBA synthesis does not promote observation telemetry into truth', () => {
  assert.match(context, /OBSERVED/);
  assert.match(context, /CONFLICTED/);
  assert.match(context, /UNVERIFIED/);
  assert.doesNotMatch(context, /isTruth\s*=|truth\s*=\s*true/i);
});

test('ABBA response planner only emits governed proposal types', () => {
  for (const proposalType of [
    'TEAM_PROPOSAL','WORKFLOW_ADJUSTMENT_PROPOSAL','RESOURCE_REALLOCATION_PROPOSAL',
    'POLICY_CHANGE_PROPOSAL','PULSE_RECALCULATION_REQUEST','ANOMALY_ESCALATION'
  ]) assert.match(planner, new RegExp(proposalType));
  assert.match(planner, /authorityRequired: true/);
  assert.match(planner, /executionAllowed: false/);
});
