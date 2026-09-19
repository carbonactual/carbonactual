-- PostGIS provider hardening verification.
-- Run after Supabase Support moves PostGIS out of public.

select
  e.extname,
  e.extversion,
  n.nspname as installed_schema,
  postgis_full_version() as postgis_version
from pg_extension e
join pg_namespace n on n.oid=e.extnamespace
where e.extname='postgis';

select count(*) as public_spatial_ref_sys_rows
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='spatial_ref_sys';

select
  count(*) filter (where p.proname='st_estimatedextent') as estimated_extent_overloads,
  count(*) filter (where has_function_privilege('anon',p.oid,'EXECUTE')) as anon_executable,
  count(*) filter (where has_function_privilege('authenticated',p.oid,'EXECUTE')) as authenticated_executable
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public';

select
  (select count(*) from public.omnii_registry_nodes where node_type='domain_scope') as domain_scope_nodes,
  (select count(*) from public.omnii_scope_records) as scope_records,
  (select count(*) from public.omnii_registry_edges e
    left join public.omnii_registry_nodes s on s.id=e.source_node
    left join public.omnii_registry_nodes t on t.id=e.target_node
    where s.id is null or t.id is null) as dangling_edges;
