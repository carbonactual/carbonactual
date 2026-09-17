import { readFile } from 'node:fs/promises';

const fail = (message) => {
  console.error(`KERNEL_CONFORMANCE_FAILED: ${message}`);
  process.exitCode = 1;
};

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const obsoleteSpineIdentity = ['O', 'M', 'N', 'I', 'I'].join('');
const migrationRegistryPath = ['architecture/LEGACY_', obsoleteSpineIdentity, '_MIGRATION_REGISTRY.json'].join('');
const integrationFabricPath = 'architecture/CARBON_ACTUAL_INTEGRATION_FABRIC_MANIFEST.json';
const legacyCrosswalkPath = 'architecture/CARBON_ACTUAL_LEGACY_ARCHITECTURE_CROSSWALK.json';

const kernel = await readJson('architecture/ecosystem-kernel.json');
const contract = await readJson('architecture/kernel-repo-contract.json');
const products = await readJson('architecture/product-projection-registry.json');
const migration = await readJson(migrationRegistryPath);
const integrationFabric = await readJson(integrationFabricPath);
const legacyCrosswalk = await readJson(legacyCrosswalkPath);

const expectedFacets = ['identity','authority','intent','capability','relationship','event','evidence','state','value'];

const requiredProductRepositories = [
  'carbonactual/abba','carbonactual/omni','carbonactual/tip','carbonactual/spotist','carbonactual/hapi-world',
  'carbonactual/naire','carbonactual/ngin','carbonactual/seed','carbonactual/heritage','carbonactual/io',
  'carbonactual/value-system','carbonactual/institutegpt','carbonactual/noun-student-bot','carbonactual/open-bank',
  'carbonactual/open-ballot','carbonactual/RITES','carbonactual/nigerian-cultural-atlas','carbonactual/bunk','carbonactual/zujid'
];

if (kernel.identity?.canonical_name !== 'Carbon Actual') fail('canonical name must be Carbon Actual');
if (kernel.identity?.architectural_identity !== 'Carbon Actual') fail('architectural identity must be Carbon Actual');
if (kernel.constitutional_boundary?.may_override_canon !== false) fail('kernel may not override HAPI World CANON.md');
if (kernel.constitutional_boundary?.may_replace_existing_canonical_objects !== false) fail('kernel may not replace canonical objects');
if (contract.spine !== 'carbonactual/carbonactual') fail('repository contract spine must be carbonactual/carbonactual');
if (migration.canonical_spine !== 'carbonactual/carbonactual') fail('migration registry must point to carbonactual/carbonactual');
if (migration.legacy_repository?.current_authority !== false) fail('archived legacy repository must not be current authority');
if (!Array.isArray(migration.migrated_core_architecture) || migration.migrated_core_architecture.length < 24) fail('migration registry does not contain the complete migrated core architecture inventory');
if (!Array.isArray(migration.active_contracts) || migration.active_contracts.length < 30) fail('migration registry does not cover the complete active contract estate');
if (integrationFabric.canonical_fabric !== `carbonactual/carbonactual/${integrationFabricPath}`) fail('integration fabric must resolve to the canonical Carbon Actual manifest');
if (integrationFabric.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('integration fabric must preserve HAPI World constitutional authority');
if (integrationFabric.authority !== 'SealGrant') fail('integration fabric authority must remain SealGrant');
if (integrationFabric.identity !== '#') fail('integration fabric identity must remain #');

const facetIds = kernel.facets?.map((facet) => facet.id) ?? [];
if (facetIds.length !== expectedFacets.length) fail(`expected ${expectedFacets.length} facets, got ${facetIds.length}`);
if (new Set(facetIds).size !== facetIds.length) fail('duplicate facet IDs detected');
if (facetIds.join('|') !== expectedFacets.join('|')) fail(`facet order mismatch: ${facetIds.join(', ')}`);
if (kernel.universal_flow?.join('|') !== expectedFacets.join('|')) fail('universal flow does not match facet order');

const requiredLaws = [
  'Authority is never inferred from capability.',
  'An event is not its evidence.',
  'Current state is not the historical event stream.',
  'Intent does not equal execution or outcome.',
  'Value is broader than money.',
  'Identity is not activity.'
];
for (const law of requiredLaws) {
  if (!kernel.design_laws?.includes(law)) fail(`required design law missing: ${law}`);
}

const repositories = contract.repositories ?? {};
const requiredRoles = {
  'carbonactual/carbonactual': 'canonical-ecosystem-operating-spine',
  'carbonactual/hapi-world': 'world-and-constitutional-law',
  'carbonactual/abba': 'intelligence-and-orchestration',
  'carbonactual/Carbon-Actual-': 'platform-and-runtime-substrate'
};
for (const [repo, role] of Object.entries(requiredRoles)) {
  if (repositories[repo]?.role !== role) fail(`${repo} must have role ${role}`);
}
for (const [repo, definition] of Object.entries(repositories)) {
  if (definition.may_define_new_kernel_facet !== false) fail(`${repo} may not define a competing kernel facet`);
}

if (!Array.isArray(products.common_required_facets) || !products.common_required_facets.every((facet) => expectedFacets.includes(facet))) {
  fail('product common facet declaration contains unknown facets');
}
const registeredProductRepositories = new Set();
for (const [name, product] of Object.entries(products.products ?? {})) {
  if (!product.repository) fail(`product ${name} is missing repository`);
  registeredProductRepositories.add(product.repository);
  if (!Array.isArray(product.facets) || product.facets.length === 0) fail(`product ${name} has no declared facets`);
  for (const facet of product.facets) {
    if (!expectedFacets.includes(facet)) fail(`product ${name} declares unknown facet ${facet}`);
  }
  for (const required of products.common_required_facets) {
    if (!product.facets.includes(required)) fail(`product ${name} is missing required facet ${required}`);
  }
}
for (const repository of requiredProductRepositories) {
  if (!registeredProductRepositories.has(repository)) fail(`active product repository missing from projection registry: ${repository}`);
}
const directBank = products.lifecycle?.['Direct Bank App'];
if (directBank?.repository_status !== 'historical-no-current-repository' || directBank?.current_authority !== false || directBank?.current_implementation !== null) {
  fail('Direct Bank App must remain historical-only until a real current repository or explicit absorption target exists');
}
if (registeredProductRepositories.has('carbonactual/direct-bank-app')) fail('nonexistent Direct Bank App repository must not be an active product projection');

if (legacyCrosswalk.canonical_repository !== 'carbonactual/carbonactual') fail('legacy architecture crosswalk must point to carbonactual/carbonactual');
if (!Array.isArray(legacyCrosswalk.sources) || legacyCrosswalk.sources.length < 20) fail('legacy architecture crosswalk is incomplete');
for (const source of legacyCrosswalk.sources ?? []) {
  if (!source.path || !source.status) fail('legacy architecture crosswalk contains an incomplete source entry');
  if (!Array.isArray(source.targets)) fail(`legacy architecture crosswalk entry ${source.path} has no target array`);
  if (source.status === 'mapped' && source.targets.length === 0) fail(`mapped legacy architecture source has no current target: ${source.path}`);
  for (const target of source.targets) {
    const content = await readFile(target, 'utf8');
    if (content.includes(obsoleteSpineIdentity)) fail(`current target ${target} contains obsolete operating-spine identity`);
  }
}

const canonicalSurfaces = [
  'README.md','architecture/ECOSYSTEM_KERNEL.md','architecture/ecosystem-kernel.json','architecture/kernel-repo-contract.json',
  'architecture/product-projection-registry.json','architecture/CARBON_ACTUAL_COMMON_LAYER_CANONICAL_1_0.md',
  'architecture/CARBON_ACTUAL_UNIVERSAL_AND_ECOSYSTEM_DENOMINATORS_1_0.md','architecture/CARBON_ACTUAL_CANONICAL_GRAPH_MODEL.md',
  'architecture/CARBON_ACTUAL_CANONICAL_OBJECT_SCHEMA.md','architecture/CARBON_ACTUAL_CAPABILITY_FABRIC.md',
  'architecture/CARBON_ACTUAL_CAPABILITY_ADAPTER_CONTRACT.md','architecture/CARBON_ACTUAL_UNIVERSAL_AGENT_CONTRACT.md',
  'architecture/CARBON_ACTUAL_UNIVERSAL_COMPOSITION_ENGINE.md','architecture/CARBON_ACTUAL_REUSABLE_INSTITUTIONAL_COMPOSITION.md',
  'architecture/CARBON_ACTUAL_AUDUBON_CONTINUUM_ECOLOGICAL_DESIGN_DOCTRINE.md','architecture/CARBON_ACTUAL_UNIVERSAL_EVENT_LIFECYCLE.md',
  'architecture/CARBON_ACTUAL_INTEGRATION_KERNEL.md',integrationFabricPath,'architecture/SPOTIST_CANONICAL_CAPABILITY.md',
  'architecture/SPOTIST_SEEK_ARCHITECTURE_V2.md','architecture/CARBON_ACTUAL_PRODUCT_CONFORMANCE_MATRIX.md',
  'architecture/CARBON_ACTUAL_CONTROL_PLANE.md','architecture/CARBON_ACTUAL_CANONICAL_AUTHORITY_REGISTRY.md',
  'architecture/CARBON_ACTUAL_CANONICAL_EVENT_STATE_INTEGRITY.md','architecture/CARBON_ACTUAL_ABBA_SWARM_TEAM_WORKFLOW_BOUNDARY.md',
  'architecture/CARBON_ACTUAL_RUNTIME_RECONCILIATION.md','architecture/CARBON_ACTUAL_RUNTIME_CONFORMANCE_MATRIX.md',
  'architecture/CARBON_ACTUAL_PROJECTION_BOUNDARY.md','architecture/CARBON_ACTUAL_ECONOMIC_LEDGER_TOKENIZATION_BOUNDARY.md',
  'architecture/CARBON_ACTUAL_ASH_PHOENIX_CONTINUITY_BOUNDARY.md','architecture/CARBON_ACTUAL_PROPOSAL_CONTRADICTION_INTAKE.md',
  'architecture/CARBON_ACTUAL_RUNTIME_OBSERVABILITY_BOUNDARY.md','architecture/CARBON_ACTUAL_SECURITY_POSTURE_AND_PROVIDER_BOUNDARIES.md',
  'docs/superpowers/specs/2026-09-17-carbon-actual-operating-spine.md','docs/superpowers/plans/2026-09-17-carbon-actual-operating-spine.md'
];
for (const path of canonicalSurfaces) {
  const content = await readFile(path, 'utf8');
  if (content.includes(obsoleteSpineIdentity)) fail(`obsolete operating-spine identity remains in ${path}`);
}

if (process.exitCode) process.exit();
console.log(`Kernel conformance passed: ${facetIds.length} facets, ${Object.keys(repositories).length} governed repositories, ${Object.keys(products.products ?? {}).length} active products, ${migration.migrated_core_architecture.length} migrated architecture controls, ${migration.active_contracts.length} active contracts, ${legacyCrosswalk.sources.length} legacy architecture sources crosswalked.`);
