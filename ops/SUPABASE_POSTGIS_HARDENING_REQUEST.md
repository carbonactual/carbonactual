# Supabase PostGIS hardening request — 2026-09-19

## Why this is external

The canonical project `omnii-canonical` has PostGIS 3.3.7 installed in `public`. Supabase's current PostGIS documentation states that when PostGIS is installed in `public`, the Security Advisor can report `public.spatial_ref_sys`; the project `postgres` role cannot fix that by enabling RLS because the extension-owned table is not owned by that role. Supabase recommends moving PostGIS into a dedicated schema, and offers a support-assisted relocation path that avoids dropping/recreating the extension.

Reference:
https://supabase.com/docs/guides/database/extensions/postgis

## Exact requested change

Please move the existing PostGIS extension from `public` to a dedicated non-public schema (preferably `extensions`, or the provider-recommended equivalent) using Supabase's supported procedure for non-relocatable PostGIS.

Requested acceptance checks:

1. PostGIS remains installed and functional.
2. Existing geometry/geography/raster/topology columns remain readable and writable by the application.
3. Existing spatial indexes continue to work.
4. `public.spatial_ref_sys` is no longer present in the API-exposed `public` schema.
5. Existing application policies and functions continue to work.
6. The application search path explicitly resolves the new PostGIS schema where needed.
7. No application data is lost.
8. Security Advisor no longer reports `public.spatial_ref_sys` or `extension_in_public` for PostGIS.

## Current evidence

- PostGIS installed version: 3.3.7.
- PostGIS extension schema: `public`.
- Security Advisor continues to report:
  - `rls_disabled_in_public` for `public.spatial_ref_sys`.
  - `extension_in_public` for PostGIS.
  - three `st_estimatedextent` SECURITY DEFINER overloads.
- Attempts to revoke client execution on the PostGIS-owned `st_estimatedextent` overloads are reasserted by the managed extension surface.

The final three function warnings are therefore recorded as provider-managed until the extension is moved or Supabase changes the managed object permissions.

## Do not do

Do not use `ALTER EXTENSION ... SET SCHEMA` directly against the current non-relocatable PostGIS installation without the provider-supported procedure. Supabase's documentation states that the extension is non-relocatable in supported PostGIS versions and recommends either the documented drop/recreate path after backup or contacting Supabase Support for the relocation procedure.

## Post-change validation

Run:

`select postgis_full_version();`

Then rerun the Supabase Security Advisor.

The application-side invariant remains unchanged: provider schemas and extension objects are implementation details; Carbon Actual semantic authority remains the canonical Carbon Actual contract and HAPI World CANON.
