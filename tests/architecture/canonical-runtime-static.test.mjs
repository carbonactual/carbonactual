import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const route = await readFile('apps/edge-api/src/routes/events.ts','utf8');
const orchestration = await readFile('packages/orchestration/src/abbaControlPlane.ts','utf8');
const workflow = await readFile('.github/workflows/canonical-conformance.yml','utf8');
const pkg = JSON.parse(await readFile('package.json','utf8'));

test('Edge writes through canonical RPC, never directly to the event table', () => {
  assert.match(route, /\/rest\/v1\/rpc\/append_canonical_event/);
  assert.doesNotMatch(route, /from\(['"]canonical_events['"]\)/);
  assert.doesNotMatch(route, /\.insert\(/);
});

test('Edge has separate ingress authentication and canonical authority handling', () => {
  assert.match(route, /ABBA_EVENT_SIGNING_SECRET/);
  assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(route, /authorityRef/);
  assert.match(route, /policyDecision/);
});

test('ABBA orchestration package cannot directly mutate persistent state', () => {
  assert.doesNotMatch(orchestration, /supabase|\/rest\/v1\/|\.insert\(/i);
  assert.match(orchestration, /policyDecision/);
});

test('CI includes the complete canonical suite and typecheck', () => {
  assert.match(workflow, /packages\/\*\*/);
  assert.match(workflow, /apps\/edge-api\/\*\*/);
  assert.match(workflow, /tests\/architecture\/canonical-\*\.test\.mjs/);
  assert.match(workflow, /npm run test:contracts/);
  assert.match(workflow, /npm run typecheck/);
  assert.match(JSON.stringify(pkg), /typescript/);
});
