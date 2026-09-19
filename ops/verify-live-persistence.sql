-- Carbon Actual live-persistence invariant check
-- Run with a privileged database connection against the canonical omnii-canonical project.

do $$
declare
  n bigint;
begin
  select count(*) into n
  from public.omnii_registry_nodes n
  where n.node_type = 'domain_scope'
    and not exists (
      select 1 from public.omnii_scope_records s where s.id = n.id
    );
  if n <> 0 then raise exception 'scope projection gaps: %', n; end if;

  select count(*) into n
  from public.omnii_registry_nodes n
  where n.node_type = 'capability_family'
    and not exists (
      select 1
      from public.omnii_registry_edges e
      where (e.source_node = n.id or e.target_node = n.id)
        and e.relationship_type in ('groups','contains','belongs_to')
    );
  if n <> 0 then raise exception 'ungrouped capability families: %', n; end if;

  select count(*) into n
  from public.omnii_registry_edges e
  left join public.omnii_registry_nodes s on s.id = e.source_node
  left join public.omnii_registry_nodes t on t.id = e.target_node
  where s.id is null or t.id is null;
  if n <> 0 then raise exception 'dangling registry edges: %', n; end if;

  select count(*) into n
  from public.omnii_registry_nodes
  where node_type = 'domain_scope';
  if (select count(*) from public.omnii_scope_records) <> n then
    raise exception 'domain scope node/record cardinality mismatch: nodes=%, records=%',
      n, (select count(*) from public.omnii_scope_records);
  end if;

  raise notice 'Carbon Actual live persistence invariants PASS';
end $$;

select jsonb_build_object(
  'capability_families',(select count(*) from public.omnii_registry_nodes where node_type='capability_family'),
  'swirms',(select count(*) from public.omnii_registry_nodes where node_type='swirm'),
  'teams',(select count(*) from public.omnii_registry_nodes where node_type='team'),
  'domain_scope_nodes',(select count(*) from public.omnii_registry_nodes where node_type='domain_scope'),
  'scope_records',(select count(*) from public.omnii_scope_records),
  'registry_edges',(select count(*) from public.omnii_registry_edges)
) as verified_live_state;
