import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const read = async rel => readFile(path.join(root, rel), "utf8");
const registry = JSON.parse(await read("architecture/CARBON_ACTUAL_ABBA_ECONOMIC_FINANCIAL_INTELLIGENCE_FABRIC_2026.json"));
const doc = await read("architecture/CARBON_ACTUAL_ABBA_ECONOMIC_FINANCIAL_INTELLIGENCE_FABRIC_2026.md");
assert.equal(registry.engines.length, 22, "economic fabric must expose 22 engines");
assert.deepEqual(registry.universal_kernel, ["identity","authority","intent","capability","relationship","event","evidence","state","value"]);
for (const key of ["monetization","trading-intelligence","arbitrage","derivatives","financial-command"]) assert.ok(registry.engines.some(x => x.id === key), "missing engine: " + key);
for (const marker of ["capability != authority","money != value","gross spread - fees - taxes","authority/Seal","simulation","provider"]) assert.ok(doc.toLowerCase().includes(marker.toLowerCase()), "missing marker: " + marker);
assert.equal(registry.safety.lawful_loopholes_only, true);
assert.equal(registry.safety.no_profit_guarantees, true);
assert.equal(registry.safety.simulation_not_actual, true);
console.log("ECONOMIC_FINANCIAL_FABRIC_CONFORMANCE_PASSED");
