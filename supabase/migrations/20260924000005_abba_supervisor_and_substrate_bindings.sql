-- Phase 4: operational supervisor state and compatibility bindings.
-- Additive only: no existing Carbon Actual / legacy substrate objects are altered.
CREATE TABLE IF NOT EXISTS public.abba_control_cycles (
  cycle_id text PRIMARY KEY,
  objective text NOT NULL,
  status text NOT NULL CHECK (status IN ('RUNNING','WAITING_AUTHORIZATION','BLOCKED','COMPLETED','STOPPED')),
  terminal_reason text,
  correlation_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.abba_job_runs (
  cycle_id text NOT NULL REFERENCES public.abba_control_cycles(cycle_id) ON DELETE CASCADE,
  job_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('READY','RUNNING','BLOCKED','SUCCEEDED','FAILED','RETRY_WAIT','CANCELLED')),
  attempt integer NOT NULL DEFAULT 1 CHECK (attempt > 0),
  idempotency_key text NOT NULL UNIQUE,
  leased_by text,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz,
  output jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cycle_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_abba_job_runs_ready
  ON public.abba_job_runs (status, lease_expires_at, updated_at);

CREATE TABLE IF NOT EXISTS public.abba_substrate_bindings (
  binding_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_ref text NOT NULL,
  substrate_kind text NOT NULL CHECK (substrate_kind IN ('LEGACY_ABBA','PROCESS_TASK','RUNTIME_RECORD','ECONOMIC_RECORD','CUSTOM')),
  substrate_ref text NOT NULL,
  status text NOT NULL CHECK (status IN ('BOUND','UNBOUND','STALE','CONTESTED')),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_ref, substrate_kind, substrate_ref)
);

CREATE INDEX IF NOT EXISTS idx_abba_substrate_bindings_canonical
  ON public.abba_substrate_bindings (canonical_ref, status);

ALTER TABLE public.abba_control_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abba_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abba_substrate_bindings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.abba_control_cycles FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.abba_job_runs FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON public.abba_substrate_bindings FROM PUBLIC, anon, authenticated, service_role;

DROP POLICY IF EXISTS abba_control_cycles_read_authenticated ON public.abba_control_cycles;
CREATE POLICY abba_control_cycles_read_authenticated
  ON public.abba_control_cycles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS abba_job_runs_read_authenticated ON public.abba_job_runs;
CREATE POLICY abba_job_runs_read_authenticated
  ON public.abba_job_runs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS abba_substrate_bindings_read_authenticated ON public.abba_substrate_bindings;
CREATE POLICY abba_substrate_bindings_read_authenticated
  ON public.abba_substrate_bindings FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.append_abba_control_cycle(p_cycle jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id text := nullif(p_cycle->>'cycleId','');
BEGIN
  IF v_cycle_id IS NULL OR p_cycle->>'objective' IS NULL OR p_cycle->>'status' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_CONTROL_CYCLE';
  END IF;

  INSERT INTO public.abba_control_cycles (
    cycle_id, objective, status, terminal_reason, correlation_id, metadata, provenance, completed_at
  )
  VALUES (
    v_cycle_id,
    p_cycle->>'objective',
    p_cycle->>'status',
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
    completed_at = EXCLUDED.completed_at,
    started_at = abba_control_cycles.started_at;

  RETURN v_cycle_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.append_abba_job_run(p_run jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cycle_id text := nullif(p_run->>'cycleId','');
  v_job_id text := nullif(p_run->>'jobId','');
  v_key text := nullif(p_run->>'idempotencyKey','');
BEGIN
  IF v_cycle_id IS NULL OR v_job_id IS NULL OR v_key IS NULL OR p_run->>'status' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_JOB_RUN';
  END IF;

  INSERT INTO public.abba_job_runs (
    cycle_id, job_id, status, attempt, idempotency_key, leased_by,
    lease_expires_at, next_attempt_at, output, error
  )
  VALUES (
    v_cycle_id,
    v_job_id,
    p_run->>'status',
    coalesce((p_run->>'attempt')::integer,1),
    v_key,
    p_run->>'leasedBy',
    nullif(p_run->>'leaseExpiresAt','')::timestamptz,
    nullif(p_run->>'nextAttemptAt','')::timestamptz,
    p_run->'output',
    p_run->>'error'
  )
  ON CONFLICT (cycle_id, job_id) DO UPDATE SET
    status = EXCLUDED.status,
    attempt = EXCLUDED.attempt,
    leased_by = EXCLUDED.leased_by,
    lease_expires_at = EXCLUDED.lease_expires_at,
    next_attempt_at = EXCLUDED.next_attempt_at,
    output = EXCLUDED.output,
    error = EXCLUDED.error,
    updated_at = now();

  RETURN jsonb_build_object('cycleId',v_cycle_id,'jobId',v_job_id,'idempotencyKey',v_key);
END;
$$;

CREATE OR REPLACE FUNCTION public.append_abba_substrate_binding(p_binding jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF nullif(p_binding->>'canonicalRef','') IS NULL
    OR p_binding->>'substrateKind' IS NULL
    OR nullif(p_binding->>'substrateRef','') IS NULL
    OR p_binding->>'status' IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_SUBSTRATE_BINDING';
  END IF;

  INSERT INTO public.abba_substrate_bindings (
    canonical_ref, substrate_kind, substrate_ref, status, provenance
  )
  VALUES (
    p_binding->>'canonicalRef',
    p_binding->>'substrateKind',
    p_binding->>'substrateRef',
    p_binding->>'status',
    coalesce(p_binding->'provenance','{}'::jsonb)
  )
  ON CONFLICT (canonical_ref, substrate_kind, substrate_ref) DO UPDATE SET
    status = EXCLUDED.status,
    provenance = EXCLUDED.provenance,
    updated_at = now()
  RETURNING binding_id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_abba_control_cycle(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_control_cycle(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.append_abba_job_run(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_job_run(jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.append_abba_substrate_binding(jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.append_abba_substrate_binding(jsonb) TO service_role;
