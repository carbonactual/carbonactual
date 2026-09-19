# Carbon Actual Live Persistence Contract — 2026-09-19

## Authority

This contract is implementation guidance for the canonical Carbon Actual operating spine. Constitutional authority remains `carbonactual/hapi-world/CANON.md`.

The contract does not create a competing ontology. It enforces persistence for the existing Carbon Actual kernel and its canonical graph.

## Required graph-to-storage invariants

1. Every registry node with `node_type = domain_scope` has exactly one matching `omnii_scope_records` record with the same identifier.
2. Scope persistence preserves provenance, authority context, temporal validity, uncertainty and source metadata.
3. Domain-scope projection is maintained automatically when a domain-scope node is inserted or updated.
4. Domain-scope nodes are append-preserving. They must be made inactive/deprecated or otherwise re-stated rather than physically deleted.
5. Every capability family remains connected to at least one functional SWIRM grouping edge.
6. Registry edges must not point to missing source or target nodes.
7. Internal runtime/economic/reconciliation tables are not directly writable by `anon` or `authenticated` client roles.
8. Authority evaluation exposed to application policy is kept outside the public RPC surface; the public `omnii_has_active_authority` function has been removed.
9. Security-sensitive policy subject resolution uses the private subject resolver and row-invariant `select` evaluation.
10. Provider secrets and credentials are never stored in the registry graph.

## Implemented database controls

### Scope projection

Migration:
`carbon_actual_live_scope_persistence_and_rls_closure_20260919b`

Projection source:
`public.omnii_registry_nodes`

Projection target:
`public.omnii_scope_records`

### Scope drift prevention

Migration:
`carbon_actual_domain_scope_projection_trigger_20260919`

Controls:
- `sync_domain_scope_projection()`
- `trg_sync_domain_scope_projection`
- `trg_preserve_domain_scope_history`

A domain-scope delete now fails deliberately so historical continuity is not silently destroyed.

### Internal table client isolation

The same closure migration added deny-by-default client policies to internal-only runtime, economic, token, settlement, reconciliation and valuation tables. Service-side execution may continue through the appropriate privileged path.

### Authority privacy

Migration:
`carbon_actual_authority_function_privacy_and_rls_plan_20260919`

The authority function now lives in the private schema and is executable only through explicitly granted roles.

### RLS performance

Migration:
`carbon_actual_rls_subject_resolver_20260919`

The six transport RLS policies use a private subject resolver and init-plan-friendly `select` evaluation.

## Verification state

As of 2026-09-19 the live registry reports:

- 335 capability families
- 35 functional SWIRMs
- 30 TEAM patterns
- 58 domain-scope nodes
- 58 persisted scope records
- 1,156 capability grouping edges
- 4,818 registry edges
- 0 ungrouped capabilities
- 0 missing scope projections
- 0 dangling graph edges

## PostgREST continuity

The canonical database contains `public.omnii_abba_sessions` with a service-role-only policy. A historical production log reported that PostgREST could not find this table in its schema cache even though the relation existed. The schema cache was explicitly reloaded using `NOTIFY pgrst, 'reload schema'`, and the current production one-hour error check is clean.

## Residual provider-managed findings

Supabase security advisories still report:
- RLS disabled on `public.spatial_ref_sys`
- PostGIS installed in `public`
- three `st_estimatedextent` SECURITY DEFINER overloads executable through client roles

These are extension/provider-managed PostGIS surfaces. They are intentionally not altered blindly because changing extension-owned objects can break spatial functionality or be reasserted by the managed database. They remain a release/security observation until a provider-supported hardening path is available.

Supabase performance now reports no `auth_rls_initplan` findings. The remaining 342 unused-index findings are informational and are not bulk-dropped without workload evidence.

## Operating rule

The graph is the semantic registry; projection tables are durable operational records. A projection may be rebuilt from the canonical graph, but it must not become an independent competing meaning.

