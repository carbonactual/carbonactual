import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const graph = JSON.parse(await readFile('architecture/canonical/abba-core-jobs.json', 'utf8'));
const runtime = await readFile('packages/orchestration/src/closedLoopRuntime.ts', 'utf8');

test('ABBA core job graph contains the full governed lifecycle', () => {
  assert.equal(graph.masterIntelligence, 'ABBA');
  assert.equal(graph.version, '1.4.0');
  assert.equal(graph.jobSequence.length, 61);
  assert.equal(graph.jobSequence.at(-1).name, 'CONTINUE_OR_STOP');
  assert.equal(graph.jobSequence.find((job) => job.name === 'CLASSIFY_REASONING_ARTIFACTS').dependsOn[0], 'ABBACORE-51');
  assert.equal(graph.continuation.defaultBehavior, 'CHOOSE_ALL_AND_CONTINUE');

  for (let index = 1; index < graph.jobSequence.length; index += 1) {
    assert.deepEqual(graph.jobSequence[index].dependsOn, [graph.jobSequence[index - 1].jobId]);
  }
});

test('closed-loop runtime preserves the observation-to-proposal boundary', () => {
  assert.match(runtime, /processTelemetry\(signal\)/);
  assert.match(runtime, /contextEngine\.buildContext/);
  assert.match(runtime, /contextEngine\.synthesize/);
  assert.match(runtime, /responsePlanner\.buildPlan/);
  assert.match(runtime, /capabilityDiscovery\.discover/);
  assert.match(runtime, /curateSpecializedTeam/);
  assert.match(runtime, /responseProposalStore\.record/);
  assert.match(runtime, /teamProposalStore\.record/);
  assert.match(runtime, /Promise\.all\(/);
  assert.doesNotMatch(runtime, /append_canonical_event/);
  assert.doesNotMatch(runtime, /supabase/);
});

test('closed-loop runtime blocks invalid or persistence-failed signals before composition', () => {
  assert.match(runtime, /item\.processing\.isValid && item\.observationPersisted/);
  assert.match(runtime, /responsePersistenceFailed/);
  assert.match(runtime, /PERSIST_PROPOSAL/);
});
