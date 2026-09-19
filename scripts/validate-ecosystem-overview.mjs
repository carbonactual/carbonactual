import { readFile } from 'node:fs/promises';

const fail = (message) => {
  console.error(`ECOSYSTEM_OVERVIEW_CONFORMANCE_FAILED: ${message}`);
  process.exitCode = 1;
};

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const overviewPath = 'architecture/CARBON_ACTUAL_ECOSYSTEM_OVERVIEW_ALIGNMENT_2026.md';
const circumferencePath = 'architecture/CARBON_ACTUAL_DOMAIN_CIRCUMFERENCE_2026.json';
const atlasPath = 'architecture/CARBON_ACTUAL_ECOSYSTEM_DOMAIN_ATLAS_2026.json';
const matrixPath = 'architecture/CARBON_ACTUAL_SWIRM_TEAM_MATRIX_2026.json';
const capabilityPath = 'architecture/CARBON_ACTUAL_CAPABILITY_CATALOG_2026.json';

const overview = await readFile(overviewPath, 'utf8');
const circumference = await readJson(circumferencePath);
const atlas = await readJson(atlasPath);
const matrix = await readJson(matrixPath);
const capability = await readJson(capabilityPath);

const expectedFacets = ['identity','authority','intent','capability','relationship','event','evidence','state','value'];

if (!overview.includes('CANON → DOCTRINES → KERNEL → COMMON FUNCTIONS → DOMAIN CIRCUMFERENCE → SWIRMs → TEAMs')) {
  fail('overview alignment chain is missing');
}
if (circumference.domainScope?.status !== 'canonical-composition-rule') fail('domain circumference is not canonical composition rule');
if (circumference.domainScope?.alignment_layer?.overview !== overviewPath) fail('domain circumference overview pointer drift');
if (circumference.domainScope?.alignment_layer?.domain_atlas !== atlasPath) fail('domain circumference atlas pointer drift');
if (circumference.domainScope?.alignment_layer?.swirm_team_matrix !== matrixPath) fail('domain circumference SWIRM/TEAM pointer drift');

if (atlas.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('atlas constitutional authority drift');
if (atlas.authority !== 'carbonactual/carbonactual') fail('atlas semantic authority drift');
if (JSON.stringify(atlas.kernel) !== JSON.stringify(expectedFacets)) fail('atlas kernel facet order drift');

const domains = atlas.domains ?? [];
const domainIds = domains.map((d) => d.id);
if (domains.length < 35) fail(`domain atlas unexpectedly small: ${domains.length}`);
if (new Set(domainIds).size !== domainIds.length) fail('duplicate domain IDs in atlas');
for (const d of domains) {
  if (!d.id || !d.name) fail('domain missing id or name');
  if (!Array.isArray(d.actors) || !d.actors.length) fail(`domain has no actors: ${d.id}`);
  if (!Array.isArray(d.objects) || !d.objects.length) fail(`domain has no objects: ${d.id}`);
  if (!Array.isArray(d.lifecycle) || !d.lifecycle.length) fail(`domain has no lifecycle: ${d.id}`);
  if (!Array.isArray(d.functions) || !d.functions.length) fail(`domain has no functions: ${d.id}`);
  if (!Array.isArray(d.markets) || !d.markets.length) fail(`domain has no markets: ${d.id}`);
  if (!Array.isArray(d.evidence) || !d.evidence.length) fail(`domain has no evidence path: ${d.id}`);
}

if (matrix.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('SWIRM/TEAM matrix constitutional authority drift');
if (matrix.rule?.indexOf('SWIRM = comparable/related capability field') === -1) fail('SWIRM definition drift');
if (matrix.rule?.indexOf('TEAM = contextual cross-domain composition') === -1) fail('TEAM definition drift');

const swirms = matrix.swirms ?? [];
const swirmIds = new Set(swirms.map((s) => s[0]));
if (swirms.length < 30) fail(`SWIRM matrix unexpectedly small: ${swirms.length}`);
if (swirmIds.size !== swirms.length) fail('duplicate SWIRM IDs');
for (const [id, name, domains] of swirms) {
  if (!id || !name || !Array.isArray(domains) || !domains.length) fail(`incomplete SWIRM: ${id}`);
}

const teams = matrix.team_patterns ?? [];
const teamIds = new Set(teams.map((t) => t[0]));
if (teams.length < 30) fail(`TEAM pattern matrix unexpectedly small: ${teams.length}`);
if (teamIds.size !== teams.length) fail('duplicate TEAM IDs');
for (const [id, name, refs, domains] of teams) {
  if (!id || !name || !Array.isArray(refs) || refs.length < 2) fail(`TEAM has fewer than two SWIRM references: ${id}`);
  for (const ref of refs) if (!swirmIds.has(ref)) fail(`TEAM ${id} references unknown SWIRM ${ref}`);
  if (!Array.isArray(domains) || domains.length < 1) fail(`TEAM has no domain context: ${id}`);
}

const capabilityFamilies = capability.families ?? capability.capabilities ?? [];
if (capability.count !== 335) fail(`capability catalog count drift: ${capability.count}`);
if (capabilityFamilies.length !== capability.count) fail(`capability family array/count mismatch: ${capabilityFamilies.length} vs ${capability.count}`);
for (const family of capabilityFamilies) {
  if (!family.id || !family.name) fail('capability family missing id or name');
}

console.log(`Ecosystem overview conformance passed: ${domains.length} atlas domains, ${swirms.length} SWIRMs, ${teams.length} TEAM patterns, ${capabilityFamilies.length} capability families.`);
