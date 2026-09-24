-- Durable response proposals emitted by ABBA synthesis.
-- These proposals are not execution authority and remain separate from canonical state events.
CREATE TABLE IF NOT EXISTS public.abba_response_proposals (
  proposal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_plan_id text NOT NULL,
  proposal_type text NOT NULL CHECK (proposal_type IN (
    'TEAM_PROPOSAL',
    'WORKFLOW_ADJUSTMENT_PROPOSAL',
    'RESOURCE_REALLOCATION_PROPOSAL',
    'POLICY_CHANGE_PROPOSAL',
    'PULSE_RECALCULATION_REQUEST',
    'ANOMALY_ESCALATION'
  )),
  context_id text NOT NULL,
  objective text NOT NULL,
  reason text NOT NULL,
  source_signal_ids text[] NOT NULL DEFAULT '{}',
  priority text NOT NULL CHECK (priority IN ('ROUTINE','ATTENTION','URGENT')),
  authority_required boolean NOT NULL DEFAULT true CHECK (authority_required = true),
  execution_allowed boolean NOT NULL DEFAULT false CHECK (execution_allowed = false),
  status text NOT NULL DEFAULT 'PROPOSED' CHECK (status IN (
    'PROPOSED','AUTHORIZED','REJECTED','EXECUTED','SUPERSEDED','EXPIRED'
  )),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_abba_response_proposals_context
  ON public.abba_response_proposals (context_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abba_response_proposals_status
  ON public.abba_response_proposals (status, created_at DESC);

ALTER TABLE public.abba_response_proposals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.abba_response_proposals FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS abba_response_proposals_read_authenticated ON public.abba_response_proposals;
CREATE POLICY abba_response_proposals_read_authenticated
  ON public.abba_response_proposals FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.append_abba_response_proposal(p_proposal jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_key text := nullif(p_proposal->>'idempotencyKey','');
BEGIN
  IF v_key IS NULL
    OR p_proposal->>'responsePlanId' IS NULL
    OR p_proposal->>'proposalId' IS NULL
    OR p_proposal->>'proposalType' IS NULL
    OR p_proposal->>'contextId' IS NULL
    OR p_proposal->>'objective' IS NULL
    OR p_proposal->>'reason' IS NULL
    OR p_proposal->'sourceSignalIds' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_RESPONSE_PROPOSAL_ENVELOPE';
  END IF;

  SELECT proposal_id INTO v_id
  FROM public.abba_response_proposals
  WHERE idempotency_key = v_key;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.abba_response_proposals (
    proposal_id,
    response_plan_id,
    proposal_type,
    context_id,
    objective,
    reason,
    source_signal_ids,
    priority,
    authority_required,
    execution_allowed,
    status,
    idempotency_key,
    expires_at,
    provenance
  )
  VALUES (
    (p_proposal->>'proposalId')::uuid,
    p_proposal->>'responsePlanId',
    p_proposal->>'proposalType',
    p_proposal->>'contextId',
    p_proposal->>'objective',
    p_proposal->>'reason',
    ARRAY(SELECT value FROM jsonb_array_elements_text(p_proposal->'sourceSignalIds')),
    coalesce(p_proposal->>'priority','ATTENTION'),
    true,
    false,
    'PROPOSED',
    v_key,
    nullif(p_proposal->>'expiresAt','')::timestamptz,
    coalesce(p_proposal->'provenance','{}'::jsonb)
  )
  RETURNING proposal_id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_abba_response_proposal(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_response_proposal(jsonb) TO service_role;
