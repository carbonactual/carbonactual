CREATE TABLE IF NOT EXISTS public.abba_competency_states (
  capability_ref text PRIMARY KEY,
  level text NOT NULL CHECK (level IN ('FOUNDATION','PRACTICE','PROFESSIONAL','SPECIALIST','MASTER','EMERITUS')),
  certification_status text NOT NULL CHECK (certification_status IN ('REQUESTED','VERIFIED','REJECTED','EXPIRED','SUPERSEDED')),
  confidence numeric(6,5) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  credential_ref text,
  issuer_ref text,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.abba_certification_records (
  request_id text PRIMARY KEY,
  capability_ref text NOT NULL,
  target_level text NOT NULL CHECK (target_level IN ('FOUNDATION','PRACTICE','PROFESSIONAL','SPECIALIST','MASTER','EMERITUS')),
  status text NOT NULL CHECK (status IN ('REQUESTED','VERIFIED','REJECTED','EXPIRED','SUPERSEDED')),
  issuer text NOT NULL,
  credential_ref text,
  evidence_refs text[] NOT NULL DEFAULT '{}',
  reason text,
  issued_at timestamptz,
  expires_at timestamptz,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_abba_certification_records_capability
  ON public.abba_certification_records (capability_ref, issued_at DESC);

ALTER TABLE public.abba_competency_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abba_certification_records ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.abba_competency_states FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.abba_certification_records FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS abba_competency_read_authenticated ON public.abba_competency_states;
CREATE POLICY abba_competency_read_authenticated
  ON public.abba_competency_states FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS abba_certification_read_authenticated ON public.abba_certification_records;
CREATE POLICY abba_certification_read_authenticated
  ON public.abba_certification_records FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.upsert_abba_competency_state(p_state jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_state->>'capabilityRef' IS NULL OR p_state->>'level' IS NULL OR p_state->>'certificationStatus' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_COMPETENCY_STATE';
  END IF;

  INSERT INTO public.abba_competency_states (
    capability_ref, level, certification_status, confidence,
    credential_ref, issuer_ref, evidence_refs, provenance
  )
  VALUES (
    p_state->>'capabilityRef',
    p_state->>'level',
    p_state->>'certificationStatus',
    coalesce((p_state->>'confidence')::numeric,0),
    p_state->>'credentialRef',
    p_state->>'issuerRef',
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_state->'evidenceRefs','[]'::jsonb))),
    coalesce(p_state->'provenance','{}'::jsonb)
  )
  ON CONFLICT (capability_ref) DO UPDATE SET
    level = EXCLUDED.level,
    certification_status = EXCLUDED.certification_status,
    confidence = EXCLUDED.confidence,
    credential_ref = EXCLUDED.credential_ref,
    issuer_ref = EXCLUDED.issuer_ref,
    evidence_refs = EXCLUDED.evidence_refs,
    provenance = EXCLUDED.provenance,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.append_abba_certification_record(p_record jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id text := nullif(p_record->>'requestId','');
BEGIN
  IF v_request_id IS NULL OR p_record->>'capabilityRef' IS NULL
     OR p_record->>'targetLevel' IS NULL OR p_record->>'status' IS NULL
     OR p_record->>'issuer' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_CERTIFICATION_RECORD';
  END IF;

  INSERT INTO public.abba_certification_records (
    request_id, capability_ref, target_level, status, issuer,
    credential_ref, evidence_refs, reason, issued_at, expires_at, provenance
  )
  VALUES (
    v_request_id,
    p_record->>'capabilityRef',
    p_record->>'targetLevel',
    p_record->>'status',
    p_record->>'issuer',
    p_record->>'credentialRef',
    ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_record->'evidenceRefs','[]'::jsonb))),
    p_record->>'reason',
    nullif(p_record->>'issuedAt','')::timestamptz,
    nullif(p_record->>'expiresAt','')::timestamptz,
    coalesce(p_record->'provenance','{}'::jsonb)
  )
  ON CONFLICT (request_id) DO UPDATE SET
    status = EXCLUDED.status,
    credential_ref = EXCLUDED.credential_ref,
    evidence_refs = EXCLUDED.evidence_refs,
    reason = EXCLUDED.reason,
    issued_at = EXCLUDED.issued_at,
    expires_at = EXCLUDED.expires_at,
    provenance = EXCLUDED.provenance;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_abba_competency_state(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_abba_competency_state(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.append_abba_certification_record(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_certification_record(jsonb) TO service_role;
