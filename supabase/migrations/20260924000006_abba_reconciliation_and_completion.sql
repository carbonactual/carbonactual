CREATE TABLE IF NOT EXISTS public.abba_reconciliation_records (
  reconciliation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id text,
  canonical_ref text NOT NULL,
  substrate_kind text NOT NULL,
  substrate_ref text NOT NULL,
  status text NOT NULL CHECK (status IN ('MATCHED','MISMATCHED','MISSING_CANONICAL','MISSING_SUBSTRATE','STALE','DUPLICATE','CONTESTED','UNKNOWN')),
  reason text NOT NULL,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  repair_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_abba_reconciliation_status
  ON public.abba_reconciliation_records (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.abba_completion_checks (
  completion_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id text NOT NULL,
  objective text NOT NULL,
  completion_status text NOT NULL CHECK (completion_status IN ('COMPLETE','INCOMPLETE','BLOCKED','WAITING_AUTHORIZATION')),
  evidence_complete boolean NOT NULL DEFAULT false,
  reconciliation_complete boolean NOT NULL DEFAULT false,
  outstanding_job_ids text[] NOT NULL DEFAULT '{}',
  blockers text[] NOT NULL DEFAULT '{}',
  checked_at timestamptz NOT NULL DEFAULT now(),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_abba_completion_cycle
  ON public.abba_completion_checks (cycle_id, checked_at DESC);

ALTER TABLE public.abba_reconciliation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abba_completion_checks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.abba_reconciliation_records FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.abba_completion_checks FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS abba_reconciliation_read_authenticated ON public.abba_reconciliation_records;
CREATE POLICY abba_reconciliation_read_authenticated
  ON public.abba_reconciliation_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS abba_completion_read_authenticated ON public.abba_completion_checks;
CREATE POLICY abba_completion_read_authenticated
  ON public.abba_completion_checks FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.append_abba_reconciliation_record(p_record jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_record->>'canonicalRef' IS NULL OR p_record->>'substrateKind' IS NULL
     OR p_record->>'substrateRef' IS NULL OR p_record->>'status' IS NULL
     OR p_record->>'reason' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_RECONCILIATION_RECORD';
  END IF;

  INSERT INTO public.abba_reconciliation_records (
    cycle_id, canonical_ref, substrate_kind, substrate_ref, status, reason,
    evidence_refs, repair_required, provenance
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
    coalesce(p_record->'provenance','{}'::jsonb)
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
BEGIN
  IF p_check->>'cycleId' IS NULL OR p_check->>'objective' IS NULL
     OR p_check->>'completionStatus' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_COMPLETION_CHECK';
  END IF;

  INSERT INTO public.abba_completion_checks (
    cycle_id, objective, completion_status, evidence_complete,
    reconciliation_complete, outstanding_job_ids, blockers, provenance
  )
  VALUES (
    p_check->>'cycleId',
    p_check->>'objective',
    p_check->>'completionStatus',
    coalesce((p_check->>'evidenceComplete')::boolean,false),
    coalesce((p_check->>'reconciliationComplete')::boolean,false),
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_check->'outstandingJobIds','[]'::jsonb))),
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_check->'blockers','[]'::jsonb))),
    coalesce(p_check->'provenance','{}'::jsonb)
  )
  RETURNING completion_id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_abba_reconciliation_record(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_reconciliation_record(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.append_abba_completion_check(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_completion_check(jsonb) TO service_role;
