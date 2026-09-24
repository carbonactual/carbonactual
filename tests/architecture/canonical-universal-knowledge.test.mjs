import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-universal-knowledge-mastery.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-universal-knowledge-mastery-jobs.json','utf8'));
const knowledge=await readFile('packages/orchestration/src/knowledgeIntegrityEngine.ts','utf8');
const language=await readFile('packages/orchestration/src/languageCapabilityEngine.ts','utf8');
const mastery=await readFile('packages/orchestration/src/masteryEngine.ts','utf8');
const pack=await readFile('packages/orchestration/src/universalKnowledgeMasteryPack.ts','utf8');

test('knowledge mastery contract covers atoms, language and progressive mastery',()=>{
  assert.ok(contract.knowledgeAtomKinds.includes('WORD'));
  assert.ok(contract.knowledgeAtomKinds.includes('SENSE'));
  assert.ok(contract.knowledgeAtomKinds.includes('FILE'));
  assert.ok(contract.languageModalities.includes('BRAILLE'));
  assert.ok(contract.learningLevels.includes('EMERITUS'));
});

test('knowledge graph preserves provenance and contradiction status',()=>{
  assert.match(knowledge,/sourceKind/);
  assert.match(knowledge,/isTruth: false/);
  assert.match(knowledge,/KNOWLEDGE_CONTESTED/);
});

test('language capability spans lexical, grammatical, cultural and accessibility modalities',()=>{
  assert.match(language,/DICTIONARY/);
  assert.match(language,/SENSE_DISAMBIGUATION/);
  assert.match(language,/GRAMMAR/);
  assert.match(language,/SLANG/);
  assert.match(language,/BRAILLE/);
  assert.match(language,/operationalAuthority: false/);
});

test('advanced mastery requires external verification and does not grant authority',()=>{
  assert.match(mastery,/EXTERNAL_CREDENTIAL_REQUIRED/);
  assert.match(mastery,/grantsAuthority: false/);
});

test('knowledge mastery job pack supplies the learning lifecycle',()=>{
  assert.equal(jobs.packId,'UNIVERSAL_KNOWLEDGE_MASTERY');
  assert.ok(jobs.jobs.includes('VERIFY_EXTERNAL_CERTIFICATION'));
  assert.ok(jobs.jobs.includes('CHECK_MASTERY_DECAY'));
  assert.match(pack,/executionAllowed: false/);
});
