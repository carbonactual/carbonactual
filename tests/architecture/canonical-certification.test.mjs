import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract = JSON.parse(await readFile('architecture/canonical/abba-learning-certification-loop.json','utf8'));
const engine = await readFile('packages/orchestration/src/certificationEngine.ts','utf8');
const migration = await readFile('supabase/migrations/20260924000008_abba_competency_and_certification.sql','utf8');
const graph = JSON.parse(await readFile('architecture/canonical/abba-core-jobs.json','utf8'));

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

test('certification and competency records are durable and the core lifecycle reaches them', () => {
  assert.match(migration, /abba_competency_states/);
  assert.match(migration, /abba_certification_records/);
  assert.match(migration, /upsert_abba_competency_state/);
  assert.match(migration, /append_abba_certification_record/);
  assert.match(migration, /REVOKE ALL ON public\.abba_competency_states/);
  assert.equal(graph.jobSequence.length, 69);
  assert.equal(graph.jobSequence.at(-1).name, 'CONTINUE_OR_STOP');
  assert(graph.jobSequence.some((job) => job.name === 'VERIFY_EXTERNAL_CERTIFICATION'));
});
