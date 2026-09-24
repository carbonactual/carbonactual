import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const graph = JSON.parse(await readFile('architecture/canonical/abba-core-jobs.json', 'utf8'));
const runtime = await readFile('packages/orchestration/src/closedLoopRuntime.ts', 'utf8');

test('ABBA core job graph is sequential and ends in governed continuation/stop', () => {
  assert.equal(graph.masterIntelligence, 'ABBA');
  assert.equal(graph.jobSequence.length, 24);
  assert.equal(graph.jobSequence.at(-1).name, 'CONTINUE_OR_STOP');
  assert.equal(graph.continuation.defaultBehavior, 'CHOOSE_ALL_AND_CONTINUE');
});

test('closed-loop runtime preserves the observation-to-proposal boundary', () => {
  assert.match(runtime, /processTelemetry\(signal\)/);
  assert.match(runtime, /capabilityDiscovery\.discover\(query\)/);
  assert.match(runtime, /curateSpecializedTeam/);
  assert.match(runtime, /teamProposalStore\.record/);
  assert.match(runtime, /observationStore\.record/);
  assert.match(runtime, /Promise\.all\(/);
  assert.doesNotMatch(runtime, /append_canonical_event/);
  assert.doesNotMatch(runtime, /supabase/);
});

test('closed-loop runtime blocks invalid or persistence-failed signals before composition', () => {
  assert.match(runtime, /!processing\.isValid/);
  assert.match(runtime, /OBSERVATION_PERSISTENCE_FAILED/);
  assert.match(runtime, /kind: 'BLOCKED'/);
  assert.match(runtime, /blockedSignalIds/);
});
