# Carbon Actual Global API Federation — Ingestion and Promotion Pipeline

**Status:** CANONICAL BUILD / NOT PRODUCTION DEPLOYED

## Purpose

The global API federation is an open-world discovery and adapter pipeline for APIs, public datasets, machine-readable government services, standards-based endpoints, scientific services, and other internet-accessible machine interfaces.

It is deliberately broader than any product or geography. Nigeria is a jurisdictional slice; Earth, Solar-System, future/frontier and unknown horizons are supported without turning speculation into fact.

## The completeness model

A literal fixed list cannot remain complete because public APIs appear, change, move, deprecate and disappear continuously. Therefore completeness is implemented as:

`directory discovery + first-party discovery + open-data catalog discovery + normalization + deduplication + health/deprecation checks + capability classification + provenance + adapter promotion`

The registry keeps both individual providers and discovery sources. Discovery sources are not authorities.

## Discovery sources

The federation separates **automated refresh sources** from **curated/catalog-only discovery sources**.

Automated refresh currently uses four machine-readable sources:

- APIs.guru
- Public APIs directory API
- Public API Lists
- APIsList (parsed defensively because its published listing schema can evolve)

Curated/catalog-only sources remain discovery inputs until their machine interface is independently verified:

- APIs Collection
- API Evangelist Public APIs
- API Atlas
- Postman API Network

These are discovery indexes. A provider is not trusted merely because an index contains it.

## Provider lifecycle

`DISCOVERED → NORMALIZED → CLASSIFIED → LICENSE_CHECKED → HEALTH_CHECKED → CAPABILITY_MAPPED → ADAPTER_CANDIDATE → VERIFIED → PROMOTABLE → PROMOTED`

A provider can also become:

`DEPRECATED | UNREACHABLE | QUARANTINED | LICENSE_RESTRICTED | AUTH_REQUIRED | UNSAFE`

No automatic transition from an external response to Actual state is permitted.

## Canonical descriptor

Each provider record carries enough information to construct a capability adapter:

`providerId, name, baseUrl, docsUrl, specUrl, authClass, scope, domains, capabilities, license, freshness, health, rateLimitHint, sideEffectClass, provenance, replacement`

Secrets never live in the descriptor.

## Capability mapping

Providers implement existing canonical capability families. New providers do not create new semantic primitives.

The principal shared families currently seeded include:

identity, authority, intent, capability-discovery, relationship, search, knowledge, geospatial, communications, media, documents, workflow, automation, analytics, audit, evidence, state, value, payment, settlement, market-data, trade, education, health, agriculture, transport, weather, earth-observation, space-data, science, culture, heritage, legal/regulatory reference, security, observability, research, planning, verification, compliance, design, financial messaging, logistics, real-time data, geocoding, identity linking, digital trust, and rights management.

## Space and unknown horizons

Solar-system and frontier APIs are real only when backed by evidence. The system can also represent a possible or unknown object without declaring it factual.

Examples:

- NASA/JPL Horizons → observed/actual space data
- Copernicus → observed Earth data
- planetary/mission candidates → planned/possible
- unknown/alien candidate → UNKNOWN_ALIEN, evidence required before factual promotion

There is no invented “alien API”.

## Product integration

Products consume shared capabilities rather than owning duplicate provider connectors:

`PRODUCT → CANONICAL CAPABILITY → PROVIDER ADAPTER → EXTERNAL SOURCE`

This lets OMNI, TIP, SPOTIST, HAPI World, NAIRE, NGIN, SEED, HERITAGE, I/O, Value System, InstituteGPT, NOUN BOT, MCP BOT, Open Bank, Open Ballot, RITES, Cultural Atlas and BUNK reuse the same global API fabric.

ZUJID & CO. is explicitly excluded from code and deployment work under the current boundary.

## Current official data-source additions

The provider catalog also tracks current first-party machine interfaces such as the OECD SDMX REST API and the ILO SDMX REST API. These are provider records, not discovery-directory records. OECD publishes JSON/CSV/XML response formats through its SDMX REST API; ILO publishes an SDMX REST API with the same family of standard REST resources. These sources are independently classified and health-checked before adapter promotion.

## Production gate

A provider or capability is not production-ready until:

1. registry record exists;
2. source/provenance is recorded;
3. authentication class is known;
4. secrets are externalized;
5. license/usage constraints are recorded;
6. endpoint/spec is health-checked;
7. capability mapping exists;
8. adapter contract tests exist;
9. failure/deprecation behavior exists;
10. Supabase representation is reconciled;
11. consuming product readiness is green;
12. only then may Vercel production promotion occur.

## Deployment policy

This pipeline is build-first. No production deployment is performed as part of catalogue ingestion or capability population.

Vercel is a promotion target, not the place where the ecosystem is made ready.
