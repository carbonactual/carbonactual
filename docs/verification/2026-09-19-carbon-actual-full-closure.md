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
| NOUN runtime dependency tables | 37 / 37 |

NOUN live database now includes tenant, account, learner, learning-continuity, past-question, exam, practice, support, service-discovery, opportunity, event/Pulse, alert/notification, knowledge-monitoring and human-escalation surfaces.

Authorization was tightened so student records and consequential requests are owner/admin scoped; shared learning catalogues are member-readable with administrator-only writes; internal queues and derived evidence are client-denied.

Supabase Security Advisor residuals are limited to provider-managed PostGIS:
- `public.spatial_ref_sys` RLS disabled;
- PostGIS installed in `public`;
- three `st_estimatedextent` SECURITY DEFINER overloads executable through client roles.

Supabase Performance Advisor currently reports only informational unused-index findings. There are no remaining unindexed-FK, RLS-init-plan or multiple-permissive-policy warnings.

The supported remediation path for the PostGIS residual is documented in `ops/SUPABASE_POSTGIS_HARDENING_REQUEST.md`; do not drop/recreate the extension blindly.

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

Latest NOUN BOT production deployment verified:
- `dpl_nrxReFK77q8bouXQwaKbziyxv5Vb`
- state: READY
- commit: `1d331b63db0e49c421658425d6a8f04e51b92984`
- production aliases include `noun.carbonactual.com` and `noun-student-bot-dashboard.vercel.app`
- no alias error

Live deployment checks:
- root HTTP 200
- `/api/health` HTTP 200
- `/api/cibn-catalog` HTTP 200 with the 2026-10 official timetable catalog

Current production error monitoring shows no application error groups; the only recurring warning is Node `DEP0169` `url.parse()` deprecation emitted by a transitive/runtime dependency. Repository source search found no direct `url.parse()` call, so it remains tracked rather than suppressed.

## Explicit exclusions

The following remain outside this closure:
- ZUJID & CO. source/application
- Vercel project `zujid`
- Vercel project `carbon-actual-z8li`, treated as a ZUJID-related historical/misbound surface

No changes were made to those surfaces.

## Security residual

The only remaining Supabase Security Advisor findings are provider-managed PostGIS surfaces documented above.

## Current operating position

Carbon Actual semantic architecture is reconciled and live. NOUN BOT's runtime/database dependencies are populated, tenant-aware, owner/admin protected, regression-tested and production-served. The remaining PostGIS item requires provider-supported extension relocation rather than application-side schema invention.
