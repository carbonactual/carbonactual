-- Phase 7.1 — Reasoning assurance substrate binding.
-- Additive binding layer. Consequential execution remains behind the independent
-- Authority + Policy + Consent gate and existing canonical event ingress.

CREATE TABLE IF NOT EXISTS public.abba_reasoning_chains (
  chain_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_entity_id UUID NOT NULL REFERENCES public.entities(entity_id),
  objective TEXT NOT NULL,
  epistemic_sequence JSONB NOT NULL DEFAULT '[]'::jsonb,
  authority_verified BOOLEAN NOT NULL DEFAULT FALSE,
  authority_ref UUID REFERENCES public.authority_grants(grant_id),
  consent_ref TEXT,
  authority_signature TEXT,
  gate_decision TEXT NOT NULL DEFAULT 'NOT_EVALUATED'
    CHECK (gate_decision IN ('NOT_EVALUATED','ALLOW','DENY','REQUIRE_HUMAN_AUTHORIZATION')),
  execution_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocking_reason TEXT,
  canonical_event_id UUID,
  idempotency_key TEXT NOT NULL UNIQUE,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abba_reasoning_chains_actor_created
  ON public.abba_reasoning_chains(actor_entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_abba_reasoning_chains_gate
  ON public.abba_reasoning_chains(gate_decision, execution_blocked, created_at DESC);

ALTER TABLE public.abba_reasoning_chains ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON public.abba_reasoning_chains FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS abba_reasoning_chains_read_authenticated
  ON public.abba_reasoning_chains;

CREATE POLICY abba_reasoning_chains_read_authenticated
  ON public.abba_reasoning_chains
  FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.append_abba_reasoning_chain(p_chain JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_existing UUID;
  v_chain UUID;
BEGIN
  IF NULLIF(p_chain->>'chainId','') IS NULL
     OR NULLIF(p_chain->>'actorEntityId','') IS NULL
     OR NULLIF(p_chain->>'objective','') IS NULL
     OR NULLIF(p_chain->>'idempotencyKey','') IS NULL
     OR p_chain->'epistemicSequence' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_REASONING_CHAIN_ENVELOPE';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.entities e
    WHERE e.entity_id = (p_chain->>'actorEntityId')::uuid
      AND e.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'ABBA_REASONING_CHAIN_ACTIVE_ACTOR_REQUIRED';
  END IF;

  SELECT chain_id INTO v_existing
  FROM public.abba_reasoning_chains
  WHERE idempotency_key = p_chain->>'idempotencyKey'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  v_chain := (p_chain->>'chainId')::uuid;

  INSERT INTO public.abba_reasoning_chains (
    chain_id,
    actor_entity_id,
    objective,
    epistemic_sequence,
    authority_verified,
    authority_ref,
    consent_ref,
    authority_signature,
    gate_decision,
    execution_blocked,
    blocking_reason,
    canonical_event_id,
    idempotency_key,
    provenance
  )
  VALUES (
    v_chain,
    (p_chain->>'actorEntityId')::uuid,
    p_chain->>'objective',
    p_chain->'epistemicSequence',
    COALESCE((p_chain->>'authorityVerified')::boolean, FALSE),
    NULLIF(p_chain->>'authorityRef','')::uuid,
    NULLIF(p_chain->>'consentRef',''),
    NULLIF(p_chain->>'authoritySignature',''),
    COALESCE(p_chain->>'gateDecision','NOT_EVALUATED'),
    COALESCE((p_chain->>'executionBlocked')::boolean, FALSE),
    NULLIF(p_chain->>'blockingReason',''),
    NULLIF(p_chain->>'canonicalEventId','')::uuid,
    p_chain->>'idempotencyKey',
    COALESCE(p_chain->'provenance','{}'::jsonb)
  );

  RETURN v_chain;
END;
$$;

REVOKE ALL ON FUNCTION public.append_abba_reasoning_chain(jsonb)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.append_abba_reasoning_chain(jsonb)
  TO service_role;


CREATE OR REPLACE FUNCTION public.log_and_bind_reasoning_chain(
  p_chain_id UUID,
  p_actor_entity_id UUID,
  p_objective TEXT,
  p_epistemic_sequence JSONB,
  p_authority_verified BOOLEAN,
  p_authority_signature TEXT,
  p_execution_blocked BOOLEAN,
  p_blocking_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $
DECLARE
  v_id UUID;
BEGIN
  v_id := public.append_abba_reasoning_chain(
    jsonb_build_object(
      'chainId', p_chain_id::text,
      'actorEntityId', p_actor_entity_id::text,
      'objective', p_objective,
      'epistemicSequence', COALESCE(p_epistemic_sequence, '[]'::jsonb),
      'authorityVerified', COALESCE(p_authority_verified, FALSE),
      'authoritySignature', p_authority_signature,
      'gateDecision', CASE WHEN COALESCE(p_authority_verified, FALSE) THEN 'ALLOW' ELSE 'NOT_EVALUATED' END,
      'executionBlocked', COALESCE(p_execution_blocked, FALSE),
      'blockingReason', p_blocking_reason,
      'idempotencyKey', 'abba:reasoning-chain:' || p_chain_id::text,
      'provenance', jsonb_build_object('source', 'log_and_bind_reasoning_chain')
    )
  );

  RETURN jsonb_build_object(
    'status', CASE WHEN COALESCE(p_execution_blocked, FALSE) THEN 'BLOCKED' ELSE 'BOUND' END,
    'chain_id', v_id,
    'execution_blocked', COALESCE(p_execution_blocked, FALSE)
  );
END;
$;

REVOKE ALL ON FUNCTION public.log_and_bind_reasoning_chain(uuid, uuid, text, jsonb, boolean, text, boolean, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.log_and_bind_reasoning_chain(uuid, uuid, text, jsonb, boolean, text, boolean, text)
  TO service_role;

-- Extend the staged canonical event vocabulary with the explicit reasoning-binding event.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'canonical_events'
      AND c.conname = 'canonical_events_event_type_check'
  ) THEN
    ALTER TABLE public.canonical_events
      DROP CONSTRAINT canonical_events_event_type_check;
  END IF;

  ALTER TABLE public.canonical_events
    ADD CONSTRAINT canonical_events_event_type_check
    CHECK (event_type IN (
      'agent_created',
      'agent_registered',
      'agent_capabilities_bound',
      'agent_activated',
      'agent_task_started',
      'agent_task_completed',
      'resource_consumed',
      'capability_used',
      'value_created',
      'value_transferred',
      'payment_received',
      'liability_created',
      'asset_created',
      'asset_consumed',
      'agent_contract_formed',
      'agent_contract_settled',
      'pulse_observed',
      'ledger_posted',
      'settlement_confirmed',
      'settlement_failed',
      'agent_suspended',
      'agent_terminated',
      'reconciliation_completed',
      'abba_reasoning_bound'
    ));
END $$;
