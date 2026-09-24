CREATE TABLE IF NOT EXISTS public.abba_execution_attempts (
  execution_id text PRIMARY KEY,
  action_id text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('RESERVED','RUNNING','SUCCEEDED','FAILED','RECOVERY_REQUIRED')),
  evidence_ref text,
  result jsonb,
  error text,
  reserved_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_abba_execution_attempts_status
  ON public.abba_execution_attempts (status, updated_at DESC);

ALTER TABLE public.abba_execution_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.abba_execution_attempts FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS abba_execution_attempts_read_authenticated ON public.abba_execution_attempts;
CREATE POLICY abba_execution_attempts_read_authenticated
  ON public.abba_execution_attempts FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.reserve_abba_execution_attempt(p_execution jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id text := nullif(p_execution->>'executionId','');
  v_action_id text := nullif(p_execution->>'actionId','');
  v_key text := nullif(p_execution->>'idempotencyKey','');
  v_existing public.abba_execution_attempts;
BEGIN
  IF v_execution_id IS NULL OR v_action_id IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_EXECUTION_ATTEMPT';
  END IF;

  SELECT * INTO v_existing
  FROM public.abba_execution_attempts
  WHERE idempotency_key = v_key;

  IF v_existing.execution_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'reservation',
      CASE v_existing.status
        WHEN 'SUCCEEDED' THEN 'ALREADY_SUCCEEDED'
        WHEN 'RUNNING' THEN 'ALREADY_RUNNING'
        WHEN 'RECOVERY_REQUIRED' THEN 'ALREADY_RUNNING'
        ELSE 'ALREADY_FAILED'
      END,
      'executionId', v_existing.execution_id
    );
  END IF;

  INSERT INTO public.abba_execution_attempts (execution_id, action_id, idempotency_key, status)
  VALUES (v_execution_id, v_action_id, v_key, 'RESERVED');

  RETURN jsonb_build_object('reservation','RESERVED','executionId',v_execution_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_abba_execution_attempt(p_execution jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_execution_id text := nullif(p_execution->>'executionId','');
  v_status text := nullif(p_execution->>'status','');
BEGIN
  IF v_execution_id IS NULL OR v_status IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_EXECUTION_UPDATE';
  END IF;

  UPDATE public.abba_execution_attempts
  SET status = v_status,
      evidence_ref = coalesce(p_execution->>'evidenceRef', evidence_ref),
      result = coalesce(p_execution->'result', result),
      error = coalesce(p_execution->>'error', error),
      started_at = CASE WHEN v_status = 'RUNNING' AND started_at IS NULL THEN now() ELSE started_at END,
      completed_at = CASE WHEN v_status IN ('SUCCEEDED','FAILED','RECOVERY_REQUIRED') THEN now() ELSE completed_at END,
      updated_at = now()
  WHERE execution_id = v_execution_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_abba_execution_attempt(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserve_abba_execution_attempt(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.update_abba_execution_attempt(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_abba_execution_attempt(jsonb) TO service_role;
