-- Carbon Actual public-schema future-object privilege guard
-- Applied to omnii-canonical on 2026-09-19.
-- Existing table grants are intentionally unchanged.

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences
  from anon, authenticated, service_role;
