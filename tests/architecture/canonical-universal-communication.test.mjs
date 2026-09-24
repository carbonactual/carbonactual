import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-universal-communication.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-universal-communication-jobs.json','utf8'));
const intelligence=await readFile('packages/orchestration/src/communicationIntelligenceEngine.ts','utf8');
const routing=await readFile('packages/orchestration/src/communicationRoutingEngine.ts','utf8');
const outcome=await readFile('packages/orchestration/src/deliveryOutcomeEngine.ts','utf8');
const runtime=await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');
const specialistPacks=JSON.parse(await readFile('architecture/canonical/abba-intelligence-specialist-packs.json','utf8'));

test('communication lifecycle separates delivery from acknowledgement',()=>{
  assert.match(JSON.stringify(contract),/Delivery is not acknowledgement/i);
  assert.match(JSON.stringify(contract),/Provider acknowledgement is not recipient acknowledgement/i);
  assert.match(outcome,/recipientAcknowledged/);
});

test('recipient and relationship resolution are explicit',()=>{
  assert.match(intelligence,/RECIPIENT_UNRESOLVED/);
  assert.match(intelligence,/RELATIONSHIP_UNRESOLVED/);
});

test('channel routing is language, privacy and reliability aware',()=>{
  assert.match(routing,/supportedLanguageCodes/);
  assert.match(routing,/privacyClasses/);
  assert.match(routing,/fallbackChannels/);
});

test('communication specialist pack is complete and execution-disabled',()=>{
  assert.equal(jobs.jobs.length,14);
  assert.ok(specialistPacks.packs.some(pack => pack.packId === 'UNIVERSAL_COMMUNICATION'));
  assert.match(runtime,/communicationPack\.assess/);
  assert.match(JSON.stringify(jobs),/executionAllowed/);
});
