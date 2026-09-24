import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-evidence-source-intelligence.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-evidence-source-intelligence-jobs.json','utf8'));
const source=await readFile('packages/orchestration/src/sourceIntelligenceEngine.ts','utf8');
const chain=await readFile('packages/orchestration/src/evidenceChainEngine.ts','utf8');
const observation=await readFile('packages/orchestration/src/externalObservationEngine.ts','utf8');
const pack=await readFile('packages/orchestration/src/evidenceSourceIntelligencePack.ts','utf8');

test('source intelligence separates provenance, freshness and truth',()=>{
  assert.ok(contract.rules.some(item=>/source is not truth/i.test(item)));
  assert.match(source,/SOURCE_STALE/);
  assert.match(source,/isTruth:false/);
});

test('evidence chains measure corroboration and independent source groups',()=>{
  assert.match(chain,/corroborationCount/);
  assert.match(chain,/independentSourceGroupCount/);
  assert.match(chain,/CLAIM_CONTRADICTED/);
  assert.match(chain,/isTruth:false/);
});

test('external observations preserve reality state and cannot become truth automatically',()=>{
  assert.match(observation,/realityState/);
  assert.match(observation,/isTruth:false/);
});

test('evidence source specialist pack covers the full lifecycle without authorization',()=>{
  assert.equal(jobs.jobs.length,17);
  assert.match(pack,/executionAllowed:false/);
});
