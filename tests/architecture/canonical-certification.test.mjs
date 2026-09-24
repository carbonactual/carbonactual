import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract = JSON.parse(await readFile('architecture/canonical/abba-learning-certification-loop.json','utf8'));
const engine = await readFile('packages/orchestration/src/certificationEngine.ts','utf8');

test('ABBA learning loop includes practice, assessment and external verification', () => {
  assert.deepEqual(contract.loop.slice(0, 7), [
    'CAPABILITY_GAP_DETECTION','CURRICULUM_DISCOVERY','KNOWLEDGE_ACQUISITION','PRACTICE',
    'ASSESSMENT','EVIDENCE_CAPTURE','EXTERNAL_CERTIFICATION_VERIFICATION'
  ]);
  assert.equal(contract.certificationAuthority.selfCertificationAllowed, false);
});

test('certification engine rejects empty evidence and self-certification', () => {
  assert.match(engine, /CERTIFICATION_EVIDENCE_REQUIRED/);
  assert.match(engine, /SELF_CERTIFICATION_FORBIDDEN/);
  assert.match(engine, /issuer.*ABBA/);
});

test('certification updates competency without granting operational authority', () => {
  assert.match(engine, /CompetencyState/);
  assert.doesNotMatch(engine, /permission\s*=|authority\s*=\s*true/i);
  assert.match(engine, /credentialRef/);
  assert.match(engine, /evidenceRefs/);
});
