-- Phase 13: durable human coordination and external decision evidence.
create table if not exists public.abba_human_coordination_requests (
  request_id uuid primary key default gen_random_uuid(),
  correlation_id text not null,
  request_type text not null check (request_type in ('CLARIFICATION','AUTHORIZATION','CONSENT','REVIEW','ESCALATION','NOTIFICATION')),
  human_ref text not null,
  objective text not null,
  context_refs text[] not null default '{}',
  evidence_refs text[] not null default '{}',
  decision_required boolean not null,
  expires_at timestamptz not null,
  status text not null check (status in ('REQUESTED','ACKNOWLEDGED','RECEIVED','DECLINED','EXPIRED','RESOLVED','CANCELLED')),
  minimum_context jsonb not null default '{}'::jsonb,
  provenance jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_abba_human_requests_status
  on public.abba_human_coordination_requests(status, expires_at);

create table if not exists public.abba_human_decisions (
  decision_id uuid primary key default gen_random_uuid(),
  request_id uuid references public.abba_human_coordination_requests(request_id) on delete restrict,
  human_ref text not null,
  decision_type text not null check (decision_type in ('CLARIFIED','APPROVED','REJECTED','ACKNOWLEDGED','REVOKED')),
  decision_payload jsonb not null default '{}'::jsonb,
  evidence_refs text[] not null default '{}',
  authority_ref text,
  signature_ref text,
  recorded_by text not null,
  decided_at timestamptz not null,
  provenance jsonb not null default '{}'::jsonb,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  check (recorded_by <> 'ABBA')
);

create index if not exists idx_abba_human_decisions_request
  on public.abba_human_decisions(request_id, decided_at desc);

alter table public.abba_human_coordination_requests enable row level security;
alter table public.abba_human_decisions enable row level security;

revoke all on public.abba_human_coordination_requests from public, anon, authenticated, service_role;
revoke all on public.abba_human_decisions from public, anon, authenticated, service_role;

drop policy if exists abba_human_requests_read_authenticated on public.abba_human_coordination_requests;
create policy abba_human_requests_read_authenticated
  on public.abba_human_coordination_requests for select to authenticated using (true);

drop policy if exists abba_human_decisions_read_authenticated on public.abba_human_decisions;
create policy abba_human_decisions_read_authenticated
  on public.abba_human_decisions for select to authenticated using (true);

create or replace function public.append_abba_human_coordination_request(p_request jsonb)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_key text := nullif(p_request->>'idempotencyKey','');
begin
  if v_key is null or p_request->>'correlationId' is null or p_request->>'requestType' is null
     or p_request->>'humanRef' is null or p_request->>'objective' is null
     or p_request->>'expiresAt' is null then
    raise exception 'INVALID_ABBA_HUMAN_COORDINATION_REQUEST';
  end if;
  select request_id into v_id
  from public.abba_human_coordination_requests
  where idempotency_key=v_key;
  if v_id is not null then return v_id; end if;
  insert into public.abba_human_coordination_requests(
    correlation_id,request_type,human_ref,objective,context_refs,evidence_refs,
    decision_required,expires_at,status,minimum_context,provenance,idempotency_key
  ) values(
    p_request->>'correlationId',
    p_request->>'requestType',
    p_request->>'humanRef',
    p_request->>'objective',
    array(select value from jsonb_array_elements_text(coalesce(p_request->'contextRefs','[]'::jsonb))),
    array(select value from jsonb_array_elements_text(coalesce(p_request->'evidenceRefs','[]'::jsonb))),
    coalesce((p_request->>'decisionRequired')::boolean,false),
    (p_request->>'expiresAt')::timestamptz,
    coalesce(p_request->>'status','REQUESTED'),
    coalesce(p_request->'minimumContext','{}'::jsonb),
    coalesce(p_request->'provenance','{}'::jsonb),
    v_key
  ) returning request_id into v_id;
  return v_id;
end $$;

create or replace function public.append_abba_human_decision(p_decision jsonb)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_key text := nullif(p_decision->>'idempotencyKey','');
begin
  if v_key is null or p_decision->>'humanRef' is null or p_decision->>'decisionType' is null
     or p_decision->>'recordedBy' is null or p_decision->>'recordedBy'='ABBA' then
    raise exception 'INVALID_ABBA_HUMAN_DECISION';
  end if;
  select decision_id into v_id
  from public.abba_human_decisions
  where idempotency_key=v_key;
  if v_id is not null then return v_id; end if;
  insert into public.abba_human_decisions(
    request_id,human_ref,decision_type,decision_payload,evidence_refs,
    authority_ref,signature_ref,recorded_by,decided_at,provenance,idempotency_key
  ) values(
    nullif(p_decision->>'requestId','')::uuid,
    p_decision->>'humanRef',
    p_decision->>'decisionType',
    coalesce(p_decision->'decisionPayload','{}'::jsonb),
    array(select value from jsonb_array_elements_text(coalesce(p_decision->'evidenceRefs','[]'::jsonb))),
    p_decision->>'authorityRef',
    p_decision->>'signatureRef',
    p_decision->>'recordedBy',
    coalesce(nullif(p_decision->>'decidedAt','')::timestamptz,now()),
    coalesce(p_decision->'provenance','{}'::jsonb),
    v_key
  ) returning decision_id into v_id;
  return v_id;
end $$;

revoke all on function public.append_abba_human_coordination_request(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.append_abba_human_coordination_request(jsonb) to service_role;
revoke all on function public.append_abba_human_decision(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.append_abba_human_decision(jsonb) to service_role;
