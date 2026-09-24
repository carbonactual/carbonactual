-- Phase 6 runtime assurance: idempotency, monotonic cycle state, recovery-aware execution, completion proofs.
-- Additive and semantic-hardening only.

ALTER TABLE public.abba_reconciliation_records
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_abba_reconciliation_idempotency
  ON public.abba_reconciliation_records (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.abba_completion_checks
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS proof_fingerprint text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_abba_completion_idempotency
  ON public.abba_completion_checks (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_abba_completion_proof_fingerprint
  ON public.abba_completion_checks (proof_fingerprint)
  WHERE proof_fingerprint IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.abba_completion_proofs (
  proof_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id text NOT NULL,
  objective text NOT NULL,
  completion_status text NOT NULL CHECK (completion_status IN ('COMPLETE','INCOMPLETE','BLOCKED','WAITING_AUTHORIZATION')),
  evidence_complete boolean NOT NULL,
  reconciliation_complete boolean NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  outstanding_job_ids text[] NOT NULL DEFAULT '{}',
  blockers text[] NOT NULL DEFAULT '{}',
  terminal_reason text,
  proof_fingerprint text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_authority_grant boolean NOT NULL DEFAULT false CHECK (is_authority_grant = false)
);

CREATE INDEX IF NOT EXISTS idx_abba_completion_proofs_cycle
  ON public.abba_completion_proofs (cycle_id, created_at DESC);

ALTER TABLE public.abba_completion_proofs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.abba_completion_proofs FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS abba_completion_proofs_read_authenticated ON public.abba_completion_proofs;
CREATE POLICY abba_completion_proofs_read_authenticated
  ON public.abba_completion_proofs FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.abba_cycle_status_transition_allowed(
  p_current text,
  p_next text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_current = p_next THEN true
    WHEN p_current = 'RUNNING' AND p_next IN ('WAITING_AUTHORIZATION','BLOCKED','COMPLETED','STOPPED') THEN true
    WHEN p_current = 'WAITING_AUTHORIZATION' AND p_next IN ('RUNNING','BLOCKED','COMPLETED','STOPPED') THEN true
    WHEN p_current = 'BLOCKED' AND p_next IN ('RUNNING','STOPPED') THEN true
    WHEN p_current IN ('COMPLETED','STOPPED') THEN false
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.reserve_abba_execution_attempt(p_execution jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
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
        WHEN 'RECOVERY_REQUIRED' THEN 'ALREADY_RECOVERY_REQUIRED'
        ELSE 'ALREADY_FAILED'
      END,
      'executionId', v_existing.execution_id
    );
  END IF;

  INSERT INTO public.abba_execution_attempts (execution_id, action_id, idempotency_key, status)
  VALUES (v_execution_id, v_action_id, v_key, 'RESERVED');

  RETURN jsonb_build_object('reservation','RESERVED','executionId',v_execution_id);
END;
$;

CREATE OR REPLACE FUNCTION public.append_abba_control_cycle(p_cycle jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id text := nullif(p_cycle->>'cycleId','');
  v_incoming_status text := nullif(p_cycle->>'status','');
  v_current_status text;
BEGIN
  IF v_cycle_id IS NULL OR p_cycle->>'objective' IS NULL OR v_incoming_status IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_CONTROL_CYCLE';
  END IF;

  SELECT status INTO v_current_status
  FROM public.abba_control_cycles
  WHERE cycle_id = v_cycle_id;

  IF v_current_status IS NOT NULL
     AND NOT public.abba_cycle_status_transition_allowed(v_current_status, v_incoming_status) THEN
    RAISE EXCEPTION 'ABBA_CONTROL_CYCLE_STATUS_REGRESSION:%:%', v_current_status, v_incoming_status;
  END IF;

  INSERT INTO public.abba_control_cycles (
    cycle_id, objective, status, terminal_reason, correlation_id, metadata, provenance, completed_at
  )
  VALUES (
    v_cycle_id,
    p_cycle->>'objective',
    v_incoming_status,
    p_cycle->>'terminalReason',
    p_cycle->>'correlationId',
    coalesce(p_cycle->'metadata','{}'::jsonb),
    coalesce(p_cycle->'provenance','{}'::jsonb),
    nullif(p_cycle->>'completedAt','')::timestamptz
  )
  ON CONFLICT (cycle_id) DO UPDATE SET
    objective = EXCLUDED.objective,
    status = EXCLUDED.status,
    terminal_reason = EXCLUDED.terminal_reason,
    correlation_id = EXCLUDED.correlation_id,
    metadata = EXCLUDED.metadata,
    provenance = EXCLUDED.provenance,
    completed_at = EXCLUDED.completed_at;

  RETURN v_cycle_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.append_abba_reconciliation_record(p_record jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_key text := nullif(p_record->>'idempotencyKey','');
BEGIN
  IF p_record->>'canonicalRef' IS NULL OR p_record->>'substrateKind' IS NULL
     OR p_record->>'substrateRef' IS NULL OR p_record->>'status' IS NULL
     OR p_record->>'reason' IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_RECONCILIATION_RECORD';
  END IF;

  SELECT reconciliation_id INTO v_id
  FROM public.abba_reconciliation_records
  WHERE idempotency_key = v_key;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.abba_reconciliation_records (
    cycle_id, canonical_ref, substrate_kind, substrate_ref, status, reason,
    evidence_refs, repair_required, provenance, idempotency_key
  )
  VALUES (
    p_record->>'cycleId',
    p_record->>'canonicalRef',
    p_record->>'substrateKind',
    p_record->>'substrateRef',
    p_record->>'status',
    p_record->>'reason',
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_record->'evidenceRefs','[]'::jsonb))),
    coalesce((p_record->>'repairRequired')::boolean,false),
    coalesce(p_record->'provenance','{}'::jsonb),
    v_key
  )
  RETURNING reconciliation_id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.append_abba_completion_check(p_check jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_key text := nullif(p_check->>'idempotencyKey','');
  v_fingerprint text := nullif(p_check->>'proofFingerprint','');
BEGIN
  IF p_check->>'cycleId' IS NULL OR p_check->>'objective' IS NULL
     OR p_check->>'completionStatus' IS NULL OR v_key IS NULL OR v_fingerprint IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_COMPLETION_CHECK';
  END IF;

  SELECT completion_id INTO v_id
  FROM public.abba_completion_checks
  WHERE idempotency_key = v_key
     OR proof_fingerprint = v_fingerprint
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.abba_completion_checks (
    cycle_id, objective, completion_status, evidence_complete,
    reconciliation_complete, outstanding_job_ids, blockers, provenance,
    idempotency_key, proof_fingerprint
  )
  VALUES (
    p_check->>'cycleId',
    p_check->>'objective',
    p_check->>'completionStatus',
    coalesce((p_check->>'evidenceComplete')::boolean,false),
    coalesce((p_check->>'reconciliationComplete')::boolean,false),
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_check->'outstandingJobIds','[]'::jsonb))),
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_check->'blockers','[]'::jsonb))),
    coalesce(p_check->'provenance','{}'::jsonb),
    v_key,
    v_fingerprint
  )
  RETURNING completion_id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.append_abba_completion_proof(p_proof jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_fingerprint text := nullif(p_proof->>'proofFingerprint','');
BEGIN
  IF v_fingerprint IS NULL
     OR p_proof->>'cycleId' IS NULL
     OR p_proof->>'objective' IS NULL
     OR p_proof->>'completionStatus' IS NULL
     OR p_proof->>'evidenceComplete' IS NOT NULL AND jsonb_typeof(p_proof->'evidenceComplete') <> 'boolean'
     OR p_proof->>'reconciliationComplete' IS NOT NULL AND jsonb_typeof(p_proof->'reconciliationComplete') <> 'boolean' THEN
    RAISE EXCEPTION 'INVALID_ABBA_COMPLETION_PROOF';
  END IF;

  SELECT proof_id INTO v_id
  FROM public.abba_completion_proofs
  WHERE proof_fingerprint = v_fingerprint;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.abba_completion_proofs (
    cycle_id, objective, completion_status, evidence_complete,
    reconciliation_complete, evidence_refs, outstanding_job_ids,
    blockers, terminal_reason, proof_fingerprint, provenance, is_authority_grant
  )
  VALUES (
    p_proof->>'cycleId',
    p_proof->>'objective',
    p_proof->>'completionStatus',
    coalesce((p_proof->>'evidenceComplete')::boolean,false),
    coalesce((p_proof->>'reconciliationComplete')::boolean,false),
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_proof->'evidenceRefs','[]'::jsonb))),
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_proof->'outstandingJobIds','[]'::jsonb))),
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_proof->'blockers','[]'::jsonb))),
    p_proof->>'terminalReason',
    v_fingerprint,
    coalesce(p_proof->'provenance','{}'::jsonb),
    false
  )
  RETURNING proof_id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.abba_cycle_status_transition_allowed(text,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.append_abba_control_cycle(jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.append_abba_reconciliation_record(jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.append_abba_completion_check(jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.append_abba_completion_proof(jsonb) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.abba_cycle_status_transition_allowed(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_control_cycle(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_reconciliation_record(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_completion_check(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_completion_proof(jsonb) TO service_role;
