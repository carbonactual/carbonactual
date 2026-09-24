import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const routing=await readFile('packages/orchestration/src/capabilityRoutingAssurance.ts','utf8');

test('capability routing composes benchmark, health and fallback without authorization',()=>{
  assert.match(routing,/ABBACapabilityBenchmarkEngine/);
  assert.match(routing,/ABBAProviderHealthEngine/);
  assert.match(routing,/ABBAProviderFallbackEngine/);
  assert.match(routing,/authorityEligible: false/);
  assert.match(routing,/executionAllowed: false/);
});
