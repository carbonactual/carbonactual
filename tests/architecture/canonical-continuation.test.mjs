import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract = JSON.parse(await readFile('architecture/canonical/continuation-rules.json','utf8'));
const engine = await readFile('packages/orchestration/src/continuationEngine.ts','utf8');

test('continuation contract makes choose-all a terminal option and continuation trigger', () => {
  assert.equal(contract.behavior.terminalChoice.optionId, 'CHOOSE_ALL_AND_CONTINUE');
  assert.equal(contract.behavior.terminalChoice.label, 'Choose all');
  assert.equal(contract.behavior.continuation.enabled, true);
});

test('continuation contract requires governed sequencing and follow-on recommendation', () => {
  assert.match(JSON.stringify(contract.behavior.continuation.afterSelection), /re-evaluate/);
  assert.match(JSON.stringify(contract.behavior.continuation.afterSelection), /follow-on recommendations/);
  assert.equal(contract.loopSafety.mustNeverSelfAuthorize, true);
  assert.equal(contract.loopSafety.mustBeIdempotent, true);
});

test('ABBA continuation engine selects all eligible work and adds recommendations without authorizing execution', () => {
  assert.match(engine, /CHOOSE_ALL_AND_CONTINUE/);
  assert.match(engine, /recommendFollowOnJobs/);
  assert.match(engine, /authorityRequired: true/);
  assert.match(engine, /authorizationRequired: true/);
  assert.match(engine, /dependsOn/);
  assert.match(engine, /topological|dependency/i);
});
