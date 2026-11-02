#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));

const federation = readJson("architecture/CARBON_ACTUAL_GLOBAL_API_FEDERATION_2026.json");
const readiness = readJson("architecture/CARBON_ACTUAL_PRODUCT_CAPABILITY_READINESS_2026.json");

assert.ok(federation.version.startsWith("2026-09-19"), "federation version must be current");
assert.ok(Array.isArray(federation.ingestion_sources) && federation.ingestion_sources.length >= 7, "global discovery sources missing");
assert.ok(federation.providers.length >= 60, "global provider seed unexpectedly small");
assert.ok(Array.isArray(federation.nigeria) && federation.nigeria.length >= 15, "Nigeria provider slice missing");
assert.ok(federation.selection_policy.discovery_priority.includes("first_party"), "first-party priority missing");
assert.ok(readiness.deployment_policy.includes("Production promotion is permitted only after"), "production promotion gate missing");
assert.equal(readiness.supabase_registry.production_deployments_in_this_pass, 1, "the current closure pass records one verified NOUN BOT production promotion");
assert.equal(readiness.products["NOUN BOT"]?.vercel, "production_ready_verified", "the verified NOUN BOT promotion is not reflected in the product projection");
assert.ok(Object.keys(readiness.products).length >= 20, "product projection matrix is incomplete");
assert.equal(readiness.products["ZUJID & CO."].vercel, "do_not_touch");
assert.equal(readiness.products["ZUJID & CO."].codebase_touch, "none in this pass");

const serialized = JSON.stringify(federation);
for (const forbidden of ["apiKey:", "bearer ", "client_secret", "private_key", "refresh_token"]) {
  assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false, `secret-like value found: ${forbidden}`);
}

console.log("Carbon Actual global federation/release readiness validation passed.");
