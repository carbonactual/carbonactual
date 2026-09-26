import assert from 'node:assert/strict';
import test from 'node:test';

import { SubstrateBinder } from '../../packages/orchestration/src/reasoningSubstrateBinder.ts';

test('substrate binder rejects out-of-order epistemic steps', async () => {
  let auditCalls = 0;
  const binder = new SubstrateBinder(
    { assessMany: () => [] },
    { evaluate: async () => { throw new Error('gate should not run'); } },
    { append: async () => { auditCalls += 1; return 'audit-1'; } },
    { append: async () => 'event-1' }
  );

  const result = await binder.bindAndEmit(
    'chain_1',
    'entity_1',
    'Test Objective',
    [
      { category: 'THEORY', claim: 'System hypothesis', timestamp: new Date().toISOString() },
      { category: 'CONCLUSION', claim: 'Premature conclusion', timestamp: new Date().toISOString() },
      { category: 'OBSERVATION', claim: 'Late observation', timestamp: new Date().toISOString() }
    ],
    {
      principalEntityId: 'entity_1',
      authorityRef: 'grant_1',
      consentRef: 'consent_1',
      scope: 'test',
      jurisdiction: 'test',
      capability: 'reasoning',
      policyVersion: '1',
      intent: 'Test Objective',
      riskClass: 'LOW',
      correlationId: 'corr-1',
      idempotencyKey: 'idemp-1',
      provenance: {},
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    },
    'sig-valid'
  );

  assert.equal(result.success, false);
  assert.match(result.blockerReason ?? '', /EPISTEMIC_VIOLATION/);
  assert.equal(auditCalls, 1);
});

test('substrate binder blocks DECISION without explicit signature', async () => {
  const binder = new SubstrateBinder(
    { assessMany: () => [] },
    { evaluate: async () => { throw new Error('gate should not run'); } },
    { append: async () => 'audit-1' },
    { append: async () => 'event-1' }
  );

  const result = await binder.bindAndEmit(
    'chain_2',
    'entity_1',
    'Execute Action',
    [
      { category: 'THEORY', claim: 'Theory', timestamp: new Date().toISOString() },
      {
        category: 'DECISION',
        claim: 'Execute action',
        authorityRef: 'grant_1',
        consentRef: 'consent_1',
        timestamp: new Date().toISOString()
      }
    ],
    {
      principalEntityId: 'entity_1',
      authorityRef: 'grant_1',
      consentRef: 'consent_1',
      scope: 'test',
      jurisdiction: 'test',
      capability: 'reasoning',
      policyVersion: '1',
      intent: 'Execute Action',
      riskClass: 'LOW',
      correlationId: 'corr-2',
      idempotencyKey: 'idemp-2',
      provenance: {},
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    }
  );

  assert.equal(result.success, false);
  assert.match(result.blockerReason ?? '', /AUTHORITY_GATE_MISSING_SIGNATURE/);
});

test('substrate binder blocks a governed decision when the independent gate denies', async () => {
  let eventCalls = 0;
  const binder = new SubstrateBinder(
    { assessMany: (artifacts) => artifacts.map((artifact) => ({
      artifactId: artifact.artifactId,
      type: artifact.type,
      valid: true,
      reasons: [],
      basisRefs: artifact.basisRefs,
      confidence: 1,
      executionAllowed: false,
      authorityRequired: true
    })) },
    {
      evaluate: async () => ({
        decision: 'DENY',
        authority: { eligible: false, reason: 'DENIED_FOR_TEST' },
        policy: { allowed: false, reason: 'DENIED_FOR_TEST' },
        consent: { required: true, satisfied: false, reason: 'DENIED_FOR_TEST' },
        reasons: ['DENIED_FOR_TEST'],
        evaluatedAt: new Date().toISOString()
      })
    },
    { append: async () => 'audit-2' },
    { append: async () => { eventCalls += 1; return 'event-2'; } }
  );

  const result = await binder.bindAndEmit(
    'chain_3',
    'entity_1',
    'Denied Action',
    [
      { category: 'THEORY', claim: 'Theory', timestamp: new Date().toISOString() },
      { category: 'OBSERVATION', claim: 'Observed metric', timestamp: new Date().toISOString(), evidenceRef: 'obs-1' },
      {
        category: 'DECISION',
        claim: 'Execute action',
        authorityRef: 'grant_1',
        consentRef: 'consent_1',
        timestamp: new Date().toISOString()
      }
    ],
    {
      principalEntityId: 'entity_1',
      authorityRef: 'grant_1',
      consentRef: 'consent_1',
      scope: 'test',
      jurisdiction: 'test',
      capability: 'reasoning',
      policyVersion: '1',
      intent: 'Denied Action',
      riskClass: 'LOW',
      correlationId: 'corr-3',
      idempotencyKey: 'idemp-3',
      provenance: {},
      expiresAt: new Date(Date.now() + 60_000).toISOString()
    },
    'sig-valid'
  );

  assert.equal(result.success, false);
  assert.match(result.blockerReason ?? '', /DENIED_FOR_TEST/);
  assert.equal(eventCalls, 0);
});

test('substrate binder emits only after reasoning and governance pass', async () => {
  let eventCalls = 0;
  let auditPayload: Record<string, unknown> | undefined;

  const binder = new SubstrateBinder(
    {
      assessMany: (artifacts) => artifacts.map((artifact) => ({
        artifactId: artifact.artifactId,
        type: artifact.type,
        valid: true,
        reasons: [],
        basisRefs: artifact.basisRefs,
        confidence: 1,
        executionAllowed: false,
        authorityRequired: true
      }))
    },
    {
      evaluate: async () => ({
        decision: 'ALLOW',
        authority: { eligible: true },
        policy: { allowed: true },
        consent: { required: true, satisfied: true },
        reasons: [],
        evaluatedAt: new Date().toISOString()
      })
    },
    {
      append: async (input) => {
        auditPayload = input;
        return 'audit-3';
      }
    },
    {
      append: async (event) => {
        eventCalls += 1;
        assert.equal(event.eventType, 'abba_reasoning_bound');
        assert.equal(event.idempotencyKey, 'reasoning_chain_3');
        assert.equal(event.authoritySignature, 'sig-valid');
        return 'event-3';
      }
    }
  );

  const result = await binder.bindAndEmit(
    'chain_3',
    'entity_1',
    'Valid Execution',
    [
      { category: 'THEORY', claim: 'Theory', timestamp: new Date().toISOString() },
      { category: 'OBSERVATION', claim: 'Observed metric', evidenceRef: 'obs-1', timestamp: new Date().toISOString() },
      {
        category: 'DECISION',
        claim: 'Approved change',
        authorityRef: 'grant_1',
        consentRef: 'consent_1',
        timestamp: new Date().toISOString()
      }
    ],
    {
      principalEntityId: 'entity_1',
      authorityRef: 'grant_1',
      consentRef: 'consent_1',
      scope: 'test',
      jurisdiction: 'test',
      capability: 'reasoning',
      policyVersion: '1',
      intent: 'Valid Execution',
      riskClass: 'LOW',
      correlationId: 'corr-4',
      idempotencyKey: 'idemp-4',
      provenance: {}
      ,expiresAt: new Date(Date.now() + 60_000).toISOString()
    },
    'sig-valid'
  );

  assert.equal(result.success, true);
  assert.equal(result.canonicalEventId, 'event-3');
  assert.equal(eventCalls, 1);
  assert.equal(auditPayload?.authorityVerified, true);
});
