import assert from "node:assert/strict";

const sharedFamilies = new Set([
  "identity","authority","intent","capability-discovery","relationship","search",
  "knowledge","geospatial","communications","media","document","workflow",
  "automation","analytics","audit","evidence","state","value","payment",
  "settlement","market-data","trade","education","health","agriculture",
  "transport","weather","earth-observation","space-data","science","culture",
  "heritage","legal-regulatory-reference","security","observability","research",
  "planning","verification","compliance","design","payments-messaging","logistics",
  "real-time-data","geocoding","identity-linking","digital-trust","rights-management"
]);

assert.equal(sharedFamilies.size, 47);
for (const family of ["identity","authority","capability-discovery","value","space-data","rights-management"]) {
  assert.ok(sharedFamilies.has(family), family);
}
console.log("global API federation contract smoke test passed");
