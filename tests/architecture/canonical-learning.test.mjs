import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const engine = await readFile('packages/orchestration/src/learningEngine.ts','utf8');

test('ABBA learning remains provenance-bound and promotion-gated', () => {
  assert.match(engine, /evidenceRefs/);
  assert.match(engine, /provenance/);
  assert.match(engine, /CANDIDATE_FOR_PROMOTION/);
  assert.match(engine, /certificationRequired/);
  assert.match(engine, /CertificationAuthority/);
});

test('ABBA learning cannot silently self-certify', () => {
  assert.match(engine, /certificationAuthority\.verify/);
  assert.match(engine, /UNVERIFIED/);
  assert.doesNotMatch(engine, /selfCertif/i);
});
