# Carbon Actual Full Closure Verification — 2026-09-19

## Scope

This record closes the current reconciliation pass across the canonical Carbon Actual repository, the live `omnii-canonical` Supabase project, and the active Vercel estate.

## Canonical architecture

The operating composition remains:

`CANON → DOCTRINES → KERNEL → COMMON FUNCTIONS → DOMAIN CIRCUMFERENCE → SWIRMs → TEAMs → WORKFLOWS → PRODUCTS / INTERFACES`

The nine-facet kernel remains unchanged:

`identity, authority, intent, capability, relationship, event, evidence, state, value`

No competing kernel primitives were introduced.

## Supabase verification

Project: `omnii-canonical` (`fomkrgrsqakabftymbjn`)

Verified live state:

| Invariant | Result |
|---|---:|
| Capability families | 335 |
| Functional SWIRMs | 35 |
| TEAM patterns | 30 |
| Domain-scope nodes | 58 |
| Persisted domain-scope records | 58 |
| Scope projection gaps | 0 |
| Ungrouped capabilities | 0 |
| Registry edges | 4,818 |
| Capability grouping edges | 1,156 |
| Dangling registry edges | 0 |

Persistence repair:
- populated all 58 domain scopes into `omnii_scope_records`
- installed an automatic scope projection trigger
- made domain-scope deletion append-preserving
- isolated 16 internal tables from direct client access
- indexed the missing RITES foreign-key paths
- moved the application authority checker out of the public RPC surface
- removed the six transport RLS init-plan performance warnings

## GitHub verification

Canonical repo: `carbonactual/carbonactual`

The stale 292/35/17/43 live-count paragraph was corrected to the current 335/35/30/58 state.

Current relevant commits from this closure:
- README reconciliation: `914665729085be169e3b3ca19279de2e81a75ebd`

NOUN BOT repo: `carbonactual/noun-student-bot`

Runtime compatibility fixes:
- `8dbd11b9e3465223e5e351f125c62fa74caa8b72` — tolerate legacy student schema drift
- `139ddba065ee1c6ddda8f338a36270cdb3ce841e` — normalize persisted learning confidence

These fixes preserve compatibility when the external NOUN student database lacks `study_level`, and prevent verification labels such as `verified` from being written into numeric confidence columns.

## Vercel verification

Team: `team_vw6sNkb9okBmWBIJiP0pBy9J`

NOUN BOT production currently has READY deployments for both closure commits:
- `dpl_Ejti17R5yeoENCTPsuJG9PnUwCyS` — commit `8dbd11b9...`
- `dpl_HepjbpDAT8JiBduhFJsBwE4LXazd` — commit `139ddba...`

Live checks:
- production root returns HTTP 200
- `/api/health` returns HTTP 200
- `/api/cibn-catalog` is present and returns catalog data

The remaining NOUN production runtime observation is Node `DEP0169` for transitive/runtime `url.parse()` usage. It is a deprecation warning, not an application failure; repository source search did not find a direct `url.parse()` call to replace safely.

The other Vercel projects in the current team sweep showed no runtime error clusters in the selected one-hour window.

## Explicit exclusions

The following remain outside this closure:
- ZUJID & CO. source/application
- Vercel project `zujid`
- Vercel project `carbon-actual-z8li`, treated as a ZUJID-related historical/misbound surface

No changes were made to those surfaces.

## Security residual

The only remaining Supabase security findings are PostGIS/provider-managed:
- `public.spatial_ref_sys` RLS disabled
- PostGIS extension in `public`
- three `st_estimatedextent` SECURITY DEFINER overloads executable by client roles

These are recorded as residual provider-managed findings, not silently marked resolved.

## Closure interpretation

The current estate is structurally reconciled and the identified application/runtime regressions are repaired. Remaining work is now ordinary evidence-driven hardening, provider-specific PostGIS remediation, and future product/runtime promotion—not unresolved kernel or registry gaps.
