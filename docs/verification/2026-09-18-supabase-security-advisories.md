# Supabase Security Advisories — 2026-09-18

## Project

- Project: `omnii-canonical`
- Project ref: `fomkrgrsqakabftymbjn`
- Database: PostgreSQL 17.6.1.155
- Observed through the authorized Supabase management connection.

## Verified critical finding

`public.spatial_ref_sys` is:

- owned by `supabase_admin`;
- a member of the `postgis` extension;
- exposed in the `public` schema;
- RLS disabled;
- granted table privileges to `anon` and `authenticated` through the extension-owned ACL.

The observed ACL is extension-managed and includes public read access plus grants to project roles. The connected project role cannot be assumed to have ownership authority over this table.

## Required handling

Do **not** treat the generic remediation `ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY` as a completed fix.

A safe remediation requires a provider-supported path that considers:
- extension ownership;
- whether PostGIS should remain in `public`;
- whether PostgREST should expose the extension table;
- required read policies for any legitimate spatial operations;
- regression verification of existing geography/PostGIS functionality.

Until that path is available, this is a visible platform-boundary finding and not an application-level RLS failure.

## Additional advisor findings

The Security Advisor also reports:
- 16 RLS-enabled tables with no policies, including the newly created `public.canonical_runtime_records`. These are intentionally service/runtime tables in the current runtime boundary; broad client access is revoked.
- three `public.st_estimatedextent` SECURITY DEFINER overloads executable by `anon`;
- four SECURITY DEFINER functions executable by `authenticated`, including `omnii_has_active_authority` and the same PostGIS overloads;
- PostGIS is installed in `public`.

These findings require separate policy review. They are not silently marked remediated by the runtime persistence migration.

## Runtime persistence verification

The newly deployed `public.canonical_runtime_records` table has RLS enabled and verified privileges:
- anon: no SELECT, no RPC execution;
- authenticated: no SELECT, no RPC execution;
- service_role: SELECT and RPC execution available.

This is an intentional server-side runtime boundary.

## Principle

Provider-managed infrastructure remains visible as an external dependency and is not misrepresented as successfully remediated by ineffective application-owned SQL.


## Performance advisor snapshot — 2026-09-18

The current performance advisor reports 24 unindexed foreign keys and 320 unused indexes. These metrics are treated as an evidence-backed optimization backlog, not automatic deletion candidates: zero observed scans can be caused by low traffic, recent creation, infrequent workflows, or planned future paths.

The newly created `canonical_runtime_records_collection_idx` is currently unused because the table has zero rows. It remains intentional and should only be reconsidered after runtime workload evidence exists.

No production index or foreign-key mutation was performed in this pass.
