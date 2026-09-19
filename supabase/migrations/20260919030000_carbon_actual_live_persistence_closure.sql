-- Carbon Actual live persistence closure
-- Applied to the canonical Supabase project on 2026-09-19.
-- Constitutional authority remains carbonactual/hapi-world/CANON.md.

-- Domain scope nodes project into durable scope records.
insert into public.omnii_scope_records
  (id,subject_ref,subject_type,horizon,architectural_class,reality_state,lifecycle,
   confidence,provenance,authority_context,temporal_validity,uncertainty,metadata)
select
  n.id,n.id,'ECOSYSTEM','NOW','domain module','ACTUAL','active',1.0,
  jsonb_build_object('source','omnii_registry_nodes','registry_id',n.registry_id,
    'registry_node_id',n.id,'atlas_id',n.metadata->>'atlas_id',
    'authority','carbonactual/carbonactual',
    'constitutional_authority','carbonactual/hapi-world/CANON.md'),
  jsonb_build_object('semantic_authority','carbonactual/carbonactual',
    'constitutional_authority','carbonactual/hapi-world/CANON.md',
    'contract','architecture/CARBON_ACTUAL_DOMAIN_CIRCUMFERENCE_2026.json'),
  jsonb_build_object('scope_version','2026-09-19','effective_from',n.created_at,
    'temporal_model','historical/current/planned/emerging/future/unknown'),
  jsonb_build_object('open_world',coalesce((n.metadata->>'open_world')::boolean,true),
    'uncertainty_policy','preserve_unknown_and_future_states'),
  coalesce(n.metadata,'{}'::jsonb)||jsonb_build_object(
    'scope_record_projection',true,'projection_source','omnii_registry_nodes',
    'projection_version','2026-09-19')
from public.omnii_registry_nodes n
where n.node_type='domain_scope'
on conflict (id) do update set
  subject_ref=excluded.subject_ref,subject_type=excluded.subject_type,
  horizon=excluded.horizon,architectural_class=excluded.architectural_class,
  reality_state=excluded.reality_state,lifecycle=excluded.lifecycle,
  confidence=excluded.confidence,provenance=excluded.provenance,
  authority_context=excluded.authority_context,
  temporal_validity=excluded.temporal_validity,uncertainty=excluded.uncertainty,
  metadata=excluded.metadata,updated_at=now();

-- Client roles must not reach internal runtime/economic/token/settlement tables directly.
create policy internal_client_deny_canonical_runtime_records on public.canonical_runtime_records
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_completeness_gaps on public.omnii_completeness_gaps
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_economic_allocations on public.omnii_economic_allocations
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_economic_compositions on public.omnii_economic_compositions
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_economic_entitlements on public.omnii_economic_entitlements
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_economic_events on public.omnii_economic_events
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_economic_vectors on public.omnii_economic_vectors
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_ecosystem_benchmarks on public.omnii_ecosystem_benchmarks
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_mint_issuances on public.omnii_mint_issuances
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_quality_assessments on public.omnii_quality_assessments
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_reconciliations on public.omnii_reconciliations
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_settlements on public.omnii_settlements
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_token_identifiers on public.omnii_token_identifiers
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_token_lifecycle_events on public.omnii_token_lifecycle_events
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_token_representations on public.omnii_token_representations
  for all to anon,authenticated using(false) with check(false);
create policy internal_client_deny_omnii_valuation_methods on public.omnii_valuation_methods
  for all to anon,authenticated using(false) with check(false);

-- RITES foreign-key access paths.
create index if not exists rites_audit_events_actor_id_idx on public.rites_audit_events(actor_id);
create index if not exists rites_audit_events_record_id_idx on public.rites_audit_events(record_id);
create index if not exists rites_audit_events_subject_id_idx on public.rites_audit_events(subject_id);
create index if not exists rites_audit_events_transition_id_idx on public.rites_audit_events(transition_id);
create index if not exists rites_audit_events_workflow_run_id_idx on public.rites_audit_events(workflow_run_id);
create index if not exists rites_consent_grants_created_by_idx on public.rites_consent_grants(created_by);
create index if not exists rites_consent_grants_grantee_id_idx on public.rites_consent_grants(grantee_id);
create index if not exists rites_consent_grants_subject_id_idx on public.rites_consent_grants(subject_id);
create index if not exists rites_handoffs_created_by_idx on public.rites_handoffs(created_by);
create index if not exists rites_handoffs_from_party_id_idx on public.rites_handoffs(from_party_id);
create index if not exists rites_handoffs_record_id_idx on public.rites_handoffs(record_id);
create index if not exists rites_handoffs_subject_id_idx on public.rites_handoffs(subject_id);
create index if not exists rites_handoffs_to_party_id_idx on public.rites_handoffs(to_party_id);
create index if not exists rites_records_created_by_idx on public.rites_records(created_by);
create index if not exists rites_records_provider_id_idx on public.rites_records(provider_id);
create index if not exists rites_records_responsible_party_id_idx on public.rites_records(responsible_party_id);
create index if not exists rites_relationships_created_by_idx on public.rites_relationships(created_by);
create index if not exists rites_subjects_omnii_object_id_idx on public.rites_subjects(omnii_object_id);
create index if not exists rites_transitions_created_by_idx on public.rites_transitions(created_by);
create index if not exists rites_transitions_record_id_idx on public.rites_transitions(record_id);
create index if not exists rites_workflow_runs_subject_id_idx on public.rites_workflow_runs(subject_id);
create index if not exists rites_workflow_runs_transition_id_idx on public.rites_workflow_runs(transition_id);
create index if not exists rites_workflow_runs_workflow_id_idx on public.rites_workflow_runs(workflow_id);

-- Keep domain scope durable and synchronized.
create or replace function public.sync_domain_scope_projection()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
begin
  if tg_op = 'DELETE' then
    if old.node_type = 'domain_scope' then
      raise exception 'domain_scope nodes are append-preserving: mark lifecycle/metadata instead of deleting %', old.id;
    end if;
    return old;
  end if;

  if new.node_type = 'domain_scope' then
    insert into public.omnii_scope_records
      (id,subject_ref,subject_type,horizon,architectural_class,reality_state,lifecycle,
       confidence,provenance,authority_context,temporal_validity,uncertainty,metadata)
    values (
      new.id,new.id,'ECOSYSTEM',
      coalesce(nullif(new.metadata->>'horizon',''),'NOW'),
      coalesce(nullif(new.metadata->>'architectural_class',''),'domain module'),
      coalesce(nullif(new.metadata->>'reality_state',''),'ACTUAL'),
      coalesce(nullif(new.metadata->>'lifecycle',''),'active'),
      case when (new.metadata->>'confidence') ~ '^[0-9]+(\\.[0-9]+)?$'
        then greatest(0,least(1,(new.metadata->>'confidence')::numeric)) else 1 end,
      jsonb_build_object('source','omnii_registry_nodes','registry_id',new.registry_id,
        'registry_node_id',new.id,'atlas_id',new.metadata->>'atlas_id',
        'authority','carbonactual/carbonactual',
        'constitutional_authority','carbonactual/hapi-world/CANON.md'),
      jsonb_build_object('semantic_authority','carbonactual/carbonactual',
        'constitutional_authority','carbonactual/hapi-world/CANON.md',
        'contract','architecture/CARBON_ACTUAL_DOMAIN_CIRCUMFERENCE_2026.json'),
      jsonb_build_object('scope_version','2026-09-19','effective_from',new.created_at,
        'temporal_model','historical/current/planned/emerging/future/unknown'),
      jsonb_build_object('open_world',coalesce((new.metadata->>'open_world')::boolean,true),
        'uncertainty_policy','preserve_unknown_and_future_states'),
      coalesce(new.metadata,'{}'::jsonb)||jsonb_build_object(
        'scope_record_projection',true,'projection_source','omnii_registry_nodes',
        'projection_version','2026-09-19')
    )
    on conflict (id) do update set
      subject_ref=excluded.subject_ref,subject_type=excluded.subject_type,
      horizon=excluded.horizon,architectural_class=excluded.architectural_class,
      reality_state=excluded.reality_state,lifecycle=excluded.lifecycle,
      confidence=excluded.confidence,provenance=excluded.provenance,
      authority_context=excluded.authority_context,
      temporal_validity=excluded.temporal_validity,uncertainty=excluded.uncertainty,
      metadata=excluded.metadata,updated_at=now();
  end if;
  return new;
end
$function$;

drop trigger if exists trg_sync_domain_scope_projection on public.omnii_registry_nodes;
create trigger trg_sync_domain_scope_projection
after insert or update on public.omnii_registry_nodes
for each row execute function public.sync_domain_scope_projection();

drop trigger if exists trg_preserve_domain_scope_history on public.omnii_registry_nodes;
create trigger trg_preserve_domain_scope_history
before delete on public.omnii_registry_nodes
for each row execute function public.sync_domain_scope_projection();

create schema if not exists private;

create or replace function private.omnii_has_active_authority(p_subject text)
returns boolean
language sql
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1 from public.omnii_authorities a
    where a.subject = p_subject
      and a.status = 'active'
      and (a.expires_at is null or a.expires_at > now())
      and (a.revocable = false or a.revoked_at is null)
  );
$function$;

create or replace function private.omnii_current_subject()
returns text
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
  select auth.uid()::text
$function$;

revoke all on schema private from public;
grant usage on schema private to authenticated,service_role;
revoke all on function private.omnii_has_active_authority(text) from public;
revoke all on function private.omnii_current_subject() from public;
grant execute on function private.omnii_has_active_authority(text) to authenticated,service_role;
grant execute on function private.omnii_current_subject() to authenticated,service_role;

drop policy if exists transport_compliance_read on public.omnii_transport_compliance_cases;
create policy transport_compliance_read on public.omnii_transport_compliance_cases
  for select to authenticated
  using (
    subject_id=(select private.omnii_current_subject())::text
    or authority_ref=(select private.omnii_current_subject())::text
  );

drop policy if exists transport_compliance_reviewer_delete on public.omnii_transport_compliance_cases;
create policy transport_compliance_reviewer_delete on public.omnii_transport_compliance_cases
  for delete to authenticated
  using (
    authority_ref=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  );

drop policy if exists transport_compliance_reviewer_update on public.omnii_transport_compliance_cases;
create policy transport_compliance_reviewer_update on public.omnii_transport_compliance_cases
  for update to authenticated
  using (
    authority_ref=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  )
  with check (
    authority_ref=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  );

drop policy if exists transport_compliance_reviewer_write on public.omnii_transport_compliance_cases;
create policy transport_compliance_reviewer_write on public.omnii_transport_compliance_cases
  for insert to authenticated
  with check (
    authority_ref=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  );

drop policy if exists transport_credentials_issuer_delete on public.omnii_transport_credentials;
create policy transport_credentials_issuer_delete on public.omnii_transport_credentials
  for delete to authenticated
  using (
    issuer=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  );

drop policy if exists transport_credentials_issuer_insert on public.omnii_transport_credentials;
create policy transport_credentials_issuer_insert on public.omnii_transport_credentials
  for insert to authenticated
  with check (
    issuer=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  );

drop policy if exists transport_credentials_issuer_update on public.omnii_transport_credentials;
create policy transport_credentials_issuer_update on public.omnii_transport_credentials
  for update to authenticated
  using (
    issuer=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  )
  with check (
    issuer=(select private.omnii_current_subject())::text
    and (select private.omnii_has_active_authority((select private.omnii_current_subject())::text))
  );

drop policy if exists transport_credentials_read on public.omnii_transport_credentials;
create policy transport_credentials_read on public.omnii_transport_credentials
  for select to authenticated
  using (
    subject_id=(select private.omnii_current_subject())::text
    or issuer=(select private.omnii_current_subject())::text
  );

drop function if exists public.omnii_has_active_authority(text);

create index if not exists rites_relationships_related_subject_id_idx
  on public.rites_relationships(related_subject_id);
