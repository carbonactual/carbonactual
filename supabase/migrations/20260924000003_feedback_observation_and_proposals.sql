-- Durable governed observations and ABBA proposal records.
-- These are observation/proposal layers, not substitutes for canonical event history.
CREATE TABLE IF NOT EXISTS public.feedback_observations (
  observation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id text NOT NULL UNIQUE,
  signal_type text NOT NULL CHECK (signal_type IN (
    'SIGNAL_RESOURCE_PULSE',
    'SIGNAL_AGENT_HEALTH',
    'SIGNAL_VALUE_METRIC',
    'SIGNAL_ANOMALY_LOG',
    'SIGNAL_EXTERNAL_ADAPTER',
    'SIGNAL_USER_DEMAND',
    'SIGNAL_POLICY_FRICTION',
    'SIGNAL_NETWORK_LATENCY',
    'SIGNAL_TASK_OUTCOME'
  )),
  source_type text NOT NULL CHECK (source_type IN (
    'AGENT',
    'ECONOMIC_ENGINE',
    'SURFACE',
    'EXTERNAL_ADAPTER',
    'HUMAN_OR_OPERATOR',
    'RUNTIME'
  )),
  source_entity_id text NOT NULL,
  correlation_id text NOT NULL,
  observed_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  integrity_status text NOT NULL CHECK (integrity_status IN ('VALIDATED','REJECTED','PROVISIONAL')),
  action_required boolean NOT NULL DEFAULT false,
  anomaly_reason text,
  source_signature text NOT NULL,
  provenance jsonb NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_feedback_observations_correlation
  ON public.feedback_observations (correlation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_observations_source
  ON public.feedback_observations (source_entity_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_observations_type_time
  ON public.feedback_observations (signal_type, observed_at DESC);

CREATE TABLE IF NOT EXISTS public.abba_team_proposals (
  proposal_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL,
  cycle_id text NOT NULL,
  correlation_id text NOT NULL,
  objective text NOT NULL,
  assigned_entity_ids uuid[] NOT NULL DEFAULT '{}',
  context_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_yield numeric(24,12) NOT NULL CHECK (estimated_yield >= 0 AND estimated_yield <= 1),
  selection_basis jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_signal_ids text[] NOT NULL DEFAULT '{}',
  authorization_required boolean NOT NULL DEFAULT true CHECK (authorization_required = true),
  status text NOT NULL DEFAULT 'PROPOSED' CHECK (status IN (
    'PROPOSED','AUTHORIZED','REJECTED','EXECUTED','SUPERSEDED','EXPIRED'
  )),
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_abba_team_proposals_correlation
  ON public.abba_team_proposals (correlation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abba_team_proposals_status
  ON public.abba_team_proposals (status, created_at DESC);

ALTER TABLE public.feedback_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abba_team_proposals ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.feedback_observations FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.abba_team_proposals FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS feedback_observations_read_authenticated ON public.feedback_observations;
CREATE POLICY feedback_observations_read_authenticated
  ON public.feedback_observations FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS abba_team_proposals_read_authenticated ON public.abba_team_proposals;
CREATE POLICY abba_team_proposals_read_authenticated
  ON public.abba_team_proposals FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.append_feedback_observation(p_observation jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_signal_id text := nullif(p_observation->>'signalId','');
BEGIN
  IF v_signal_id IS NULL
    OR p_observation->>'signalType' IS NULL
    OR p_observation->>'sourceType' IS NULL
    OR p_observation->>'sourceEntityId' IS NULL
    OR p_observation->>'correlationId' IS NULL
    OR p_observation->>'timestamp' IS NULL
    OR p_observation->>'signature' IS NULL
    OR p_observation->'provenance' IS NULL
    OR p_observation->'payload' IS NULL
    OR p_observation->>'integrityStatus' IS NULL THEN
    RAISE EXCEPTION 'INVALID_FEEDBACK_OBSERVATION_ENVELOPE';
  END IF;

  SELECT observation_id INTO v_id
  FROM public.feedback_observations
  WHERE signal_id = v_signal_id;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.feedback_observations (
    signal_id, signal_type, source_type, source_entity_id, correlation_id,
    observed_at, integrity_status, action_required, anomaly_reason,
    source_signature, provenance, payload
  )
  VALUES (
    v_signal_id,
    p_observation->>'signalType',
    p_observation->>'sourceType',
    p_observation->>'sourceEntityId',
    p_observation->>'correlationId',
    (p_observation->>'timestamp')::timestamptz,
    p_observation->>'integrityStatus',
    coalesce((p_observation->>'actionRequired')::boolean, false),
    p_observation->>'anomalyReason',
    p_observation->>'signature',
    p_observation->'provenance',
    p_observation->'payload'
  )
  RETURNING observation_id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.append_abba_team_proposal(p_proposal jsonb)
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
    OR p_proposal->>'teamId' IS NULL
    OR p_proposal->>'cycleId' IS NULL
    OR p_proposal->>'correlationId' IS NULL
    OR p_proposal->>'objective' IS NULL
    OR p_proposal->'sourceSignalIds' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_PROPOSAL_ENVELOPE';
  END IF;

  SELECT proposal_id INTO v_id
  FROM public.abba_team_proposals
  WHERE idempotency_key = v_key;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.abba_team_proposals (
    team_id, cycle_id, correlation_id, objective, assigned_entity_ids,
    context_payload, estimated_yield, selection_basis, source_signal_ids,
    authorization_required, status, idempotency_key, expires_at, provenance
  )
  VALUES (
    p_proposal->>'teamId',
    p_proposal->>'cycleId',
    p_proposal->>'correlationId',
    p_proposal->>'objective',
    ARRAY(
      SELECT value::uuid
      FROM jsonb_array_elements_text(coalesce(p_proposal->'assignedEntityIds','[]'::jsonb))
    ),
    coalesce(p_proposal->'contextPayload','{}'::jsonb),
    coalesce((p_proposal->>'estimatedYield')::numeric, 0),
    coalesce(p_proposal->'selectionBasis','[]'::jsonb),
    ARRAY(SELECT value FROM jsonb_array_elements_text(p_proposal->'sourceSignalIds')),
    true,
    'PROPOSED',
    v_key,
    nullif(p_proposal->>'expiresAt','')::timestamptz,
    coalesce(p_proposal->'provenance','{}'::jsonb)
  )
  RETURNING proposal_id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_feedback_observation(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_feedback_observation(jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.append_abba_team_proposal(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_team_proposal(jsonb) TO service_role;
