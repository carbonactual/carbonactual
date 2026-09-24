-- Phase 10: reasoning-to-substrate binding assurance.
-- Additive only. No canonical event table is mutated directly.
create table if not exists public.abba_reasoning_substrate_bindings (
  binding_id uuid primary key default gen_random_uuid(),
  reasoning_chain_id text not null,
  cycle_id text,
  canonical_event_id text,
  binding_status text not null check (binding_status in ('PREPARED','GATED','EXECUTED','BLOCKED','RECOVERY_REQUIRED')),
  artifact_count integer not null check (artifact_count >= 0),
  blocking_reasons text[] not null default '{}',
  artifact_assessments jsonb not null default '[]'::jsonb,
  canonical_event_draft jsonb,
  provenance jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_abba_reasoning_substrate_bindings_chain
  on public.abba_reasoning_substrate_bindings(reasoning_chain_id, created_at desc);

alter table public.abba_reasoning_substrate_bindings enable row level security;
revoke all on public.abba_reasoning_substrate_bindings from public, anon, authenticated, service_role;

drop policy if exists abba_reasoning_substrate_bindings_read_authenticated on public.abba_reasoning_substrate_bindings;
create policy abba_reasoning_substrate_bindings_read_authenticated
  on public.abba_reasoning_substrate_bindings
  for select to authenticated
  using (true);

create or replace function public.append_abba_reasoning_substrate_binding(p_binding jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_key text := nullif(p_binding->>'idempotencyKey','');
begin
  if nullif(p_binding->>'reasoningChainId','') is null
     or v_key is null
     or p_binding->>'bindingStatus' is null
     or p_binding->>'artifactAssessments' is null then
    raise exception 'INVALID_ABBA_REASONING_SUBSTRATE_BINDING';
  end if;

  select binding_id into v_id
  from public.abba_reasoning_substrate_bindings
  where idempotency_key = v_key;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.abba_reasoning_substrate_bindings (
    reasoning_chain_id,
    cycle_id,
    canonical_event_id,
    binding_status,
    artifact_count,
    blocking_reasons,
    artifact_assessments,
    canonical_event_draft,
    provenance,
    idempotency_key
  )
  values (
    p_binding->>'reasoningChainId',
    p_binding->>'cycleId',
    nullif(p_binding->>'canonicalEventId',''),
    p_binding->>'bindingStatus',
    coalesce((p_binding->>'artifactCount')::integer,0),
    array(select value from jsonb_array_elements_text(coalesce(p_binding->'blockingReasons','[]'::jsonb))),
    p_binding->'artifactAssessments',
    p_binding->'canonicalEventDraft',
    coalesce(p_binding->'provenance','{}'::jsonb),
    v_key
  )
  returning binding_id into v_id;

  return v_id;
end;
$$;

revoke all on function public.append_abba_reasoning_substrate_binding(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.append_abba_reasoning_substrate_binding(jsonb)
  to service_role;

CREATE OR REPLACE FUNCTION public.update_abba_reasoning_substrate_binding(p_binding jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := nullif(p_binding->>'bindingId','')::uuid;
  v_next text := nullif(p_binding->>'bindingStatus','');
  v_current text;
BEGIN
  IF v_id IS NULL OR v_next IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_REASONING_BINDING_UPDATE';
  END IF;

  SELECT binding_status INTO v_current
  FROM public.abba_reasoning_substrate_bindings
  WHERE binding_id = v_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'ABBA_REASONING_BINDING_NOT_FOUND';
  END IF;

  IF v_current = v_next THEN
    NULL;
  ELSIF v_current = 'PREPARED' AND v_next IN ('GATED','BLOCKED','RECOVERY_REQUIRED','EXECUTED') THEN
    NULL;
  ELSIF v_current = 'GATED' AND v_next IN ('EXECUTED','BLOCKED','RECOVERY_REQUIRED') THEN
    NULL;
  ELSIF v_current IN ('EXECUTED','BLOCKED','RECOVERY_REQUIRED') THEN
    RAISE EXCEPTION 'ABBA_REASONING_BINDING_STATUS_REGRESSION:%:%', v_current, v_next;
  ELSE
    RAISE EXCEPTION 'ABBA_REASONING_BINDING_TRANSITION_NOT_ALLOWED:%:%', v_current, v_next;
  END IF;

  UPDATE public.abba_reasoning_substrate_bindings
  SET binding_status = v_next,
      canonical_event_id = coalesce(nullif(p_binding->>'canonicalEventId','')::uuid, canonical_event_id),
      blocking_reasons = CASE
        WHEN p_binding ? 'blockingReasons'
        THEN ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_binding->'blockingReasons','[]'::jsonb)))
        ELSE blocking_reasons
      END,
      updated_at = now()
  WHERE binding_id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_abba_reasoning_substrate_binding(jsonb)
  FROM public, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_abba_reasoning_substrate_binding(jsonb)
  TO service_role;
