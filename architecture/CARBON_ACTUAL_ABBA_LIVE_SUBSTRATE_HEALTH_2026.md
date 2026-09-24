# CARBON ACTUAL — ABBA LIVE SUBSTRATE HEALTH — 2026

Technical readiness is a separate gate from authority.

ABBA evaluates the existing operational substrate for:

- presence
- RLS posture
- client write boundaries
- privileged ingress availability
- ingress mapping
- duplicate semantic surfaces
- reconciliation health

The order is:

TECHNICAL SUBSTRATE READINESS → AUTHORITY/POLICY/CONSENT → EXECUTION.

A healthy substrate is not permission to act. A valid authority grant does not make a broken substrate safe to use.

The live Carbon Actual event surface is currently mapped to `public.omnii_events` through `public.omnii_append_event(...)`. State and execution audit remain bound to their existing atomic substrate functions.

Reasoning binding metadata is persisted in `public.abba_reasoning_substrate_bindings` with RLS and controlled RPC ingress.

The managed PostGIS `spatial_ref_sys` table still requires platform-level ownership remediation for the staged RLS change; the project SQL role cannot alter that managed table.
