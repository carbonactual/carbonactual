import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const contract=JSON.parse(await readFile('architecture/canonical/abba-capability-benchmarking.json','utf8'));
const benchmark=await readFile('packages/orchestration/src/capabilityBenchmarkEngine.ts','utf8');
const health=await readFile('packages/orchestration/src/providerHealthEngine.ts','utf8');
const fallback=await readFile('packages/orchestration/src/providerFallbackEngine.ts','utf8');

test('capability benchmarking covers quality, reliability, coverage, risk, latency and cost',()=>{
  assert.deepEqual(contract.criteria,['quality','reliability','coverage','risk','latency','cost']);
  assert.match(benchmark,/orderedCandidateIds/);
});

test('provider health is explicit and time-bounded',()=>{
  assert.match(health,/HEALTH_SNAPSHOT_STALE/);
  assert.match(health,/CONSECUTIVE_PROVIDER_FAILURES/);
});

test('fallback is proposal-only and cannot authorize execution',()=>{
  assert.match(fallback,/fallbackProviderRefs/);
  assert.match(fallback,/executionAllowed: false/);
  assert.match(fallback,/authorityEligible: false/);
});
