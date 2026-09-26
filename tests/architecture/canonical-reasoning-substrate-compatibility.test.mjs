import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-reasoning-assurance-substrate-compatibility.json','utf8'));
const reasoning=await readFile('architecture/canonical/abba-reasoning-assurance.json','utf8');

test('Phase 7 reasoning is explicitly delegated to the live substrate binding layer',()=>{
  assert.equal(contract.substrateImplementation,'PHASE10_LIVE_SUBSTRATE_BINDING');
  assert.equal(contract.productionEventIngress,'public.omnii_append_event(...)');
  assert.match(JSON.stringify(contract.rules),/never creates a second canonical event table/i);
  assert.match(reasoning,/Authority \+ Policy \+ Consent Gate/);
});
