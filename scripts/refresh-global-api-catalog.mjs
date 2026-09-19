#!/usr/bin/env node
/**
 * Refresh the Carbon Actual global API discovery catalogue.
 *
 * Build-time tool only. It discovers metadata from public API directories,
 * normalizes it into provider-neutral records, deduplicates by canonical URL,
 * classifies authentication/provenance, and emits JSON for later Supabase
 * reconciliation. It does not deploy, execute consequential provider calls,
 * or persist secrets.
 */

const SOURCES = [
  { id: "apis-guru", url: "https://api.apis.guru/v2/list.json", kind: "apis_guru" },
  { id: "public-apis", url: "https://api.publicapis.org/entries", kind: "public_apis" },
];

const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    const u = new URL(value.trim());
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};

const normalizeAuth = (value) => {
  const s = String(value ?? "").toLowerCase();
  if (!s || s === "none" || s === "no") return "none";
  if (s.includes("oauth")) return "oauth";
  if (s.includes("api") && s.includes("key")) return "api_key";
  if (s.includes("bearer")) return "bearer";
  return "unknown";
};

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "carbon-actual-global-api-federation/2026"
    }
  });
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status}`);
  }
  return response.json();
}

function fromApisGuru(payload) {
  const out = [];
  for (const [key, entry] of Object.entries(payload ?? {})) {
    const api = entry?.info ?? {};
    const servers = Array.isArray(entry?.servers) ? entry.servers : [];
    const baseUrl = normalizeUrl(servers[0]?.url);
    out.push({
      providerId: `apis-guru:${key}`,
      name: api.title ?? key,
      baseUrl,
      docsUrl: normalizeUrl(entry?.info?.x-origin?.[0]?.url ?? entry?.swaggerUrl),
      specUrl: normalizeUrl(entry?.swaggerUrl),
      authClass: "unknown",
      categories: [],
      source: "apis-guru"
    });
  }
  return out;
}

function fromPublicApis(payload) {
  return (payload?.entries ?? []).map((entry) => ({
    providerId: `public-apis:${String(entry.API ?? entry.Link ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: entry.API ?? "Unnamed API",
    baseUrl: normalizeUrl(entry.Link),
    docsUrl: normalizeUrl(entry.Link),
    specUrl: null,
    authClass: normalizeAuth(entry.Auth),
    categories: String(entry.Category ?? "").split(",").map((x) => x.trim()).filter(Boolean),
    source: "public-apis"
  }));
}

function mergeByBaseUrl(records) {
  const map = new Map();
  for (const record of records) {
    const key = record.baseUrl ?? record.providerId;
    if (!map.has(key)) {
      map.set(key, {
        ...record,
        sourceRefs: [record.source],
      });
      continue;
    }
    const current = map.get(key);
    current.sourceRefs = [...new Set([...current.sourceRefs, record.source])];
    current.categories = [...new Set([...(current.categories ?? []), ...(record.categories ?? [])])];
    current.docsUrl ||= record.docsUrl;
    current.specUrl ||= record.specUrl;
    if (current.authClass === "unknown" && record.authClass !== "unknown") {
      current.authClass = record.authClass;
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  const results = [];
  const failures = [];

  for (const source of SOURCES) {
    try {
      const payload = await fetchJson(source.url);
      if (source.kind === "apis_guru") results.push(...fromApisGuru(payload));
      if (source.kind === "public_apis") results.push(...fromPublicApis(payload));
    } catch (error) {
      failures.push({ source: source.id, error: String(error?.message ?? error) });
    }
  }

  const providers = mergeByBaseUrl(results).map((provider) => ({
    ...provider,
    status: provider.baseUrl ? "discovered" : "quarantined_missing_endpoint",
    secretsStored: false,
    consequentialExecution: false,
  }));

  const output = {
    registry: "CARBON_ACTUAL_GLOBAL_API_FEDERATION",
    generatedAt: new Date().toISOString(),
    sourceCount: SOURCES.length,
    discoveredCount: results.length,
    deduplicatedCount: providers.length,
    failures,
    providers,
    policy: {
      sourceDirectoryIsNotAuthority: true,
      secretsStored: false,
      productionDeployment: false,
      nextStage: "capability_classification_and_supabase_reconciliation"
    }
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main().catch((error) => {
  process.stderr.write(String(error?.stack ?? error) + "\n");
  process.exitCode = 1;
});
