import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const obsoleteSpineIdentity = ['O', 'M', 'N', 'I', 'I'].join('');
const migrationRegistryPath = ['architecture/LEGACY_', obsoleteSpineIdentity, '_MIGRATION_REGISTRY.json'].join('');
const integrationFabricPath = 'architecture/CARBON_ACTUAL_INTEGRATION_FABRIC_MANIFEST.json';
const legacyCrosswalkPath = 'architecture/CARBON_ACTUAL_LEGACY_ARCHITECTURE_CROSSWALK.json';
const repositoryEstatePath = 'architecture/repository-estate-registry.json';
const kernel = JSON.parse(await readFile('architecture/ecosystem-kernel.json', 'utf8'));
const contract = JSON.parse(await readFile('architecture/kernel-repo-contract.json', 'utf8'));
const products = JSON.parse(await readFile('architecture/product-projection-registry.json', 'utf8'));
const migration = JSON.parse(await readFile(migrationRegistryPath, 'utf8'));
const integrationFabric = JSON.parse(await readFile(integrationFabricPath, 'utf8'));
const legacyCrosswalk = JSON.parse(await readFile(legacyCrosswalkPath, 'utf8'));
const estate = JSON.parse(await readFile(repositoryEstatePath, 'utf8'));

const expectedFacets = ['identity','authority','intent','capability','relationship','event','evidence','state','value'];
const expectedProductRepositories = [
  'carbonactual/abba','carbonactual/omni','carbonactual/tip','carbonactual/spotist','carbonactual/hapi-world',
  'carbonactual/naire','carbonactual/ngin','carbonactual/seed','carbonactual/heritage','carbonactual/io',
  'carbonactual/value-system','carbonactual/institutegpt','carbonactual/noun-student-bot','carbonactual/mcp-bot','carbonactual/open-bank',
  'carbonactual/open-ballot','carbonactual/RITES','carbonactual/nigerian-cultural-atlas','carbonactual/bunk','carbonactual/zujid'
];

test('kernel has exactly nine stable facets', () => {
  assert.deepEqual(kernel.facets.map((facet) => facet.id), expectedFacets);
  assert.equal(new Set(kernel.facets.map((facet) => facet.id)).size, 9);
});

test('Carbon Actual is the sole operating-spine identity', () => {
  assert.equal(kernel.identity.canonical_name, 'Carbon Actual');
  assert.equal(kernel.identity.architectural_identity, 'Carbon Actual');
  assert.match(kernel.identity.rule, /canonical ecosystem operating spine/);
});

test('kernel cannot override the constitutional Canon', () => {
  assert.equal(kernel.constitutional_boundary.supreme_source, 'HAPI World CANON.md');
  assert.equal(kernel.constitutional_boundary.may_override_canon, false);
  assert.equal(kernel.constitutional_boundary.may_replace_existing_canonical_objects, false);
});

test('critical semantic distinctions are explicit', () => {
  const laws = new Set(kernel.design_laws);
  assert.ok(laws.has('Authority is never inferred from capability.'));
  assert.ok(laws.has('An event is not its evidence.'));
  assert.ok(laws.has('Current state is not the historical event stream.'));
  assert.ok(laws.has('Intent does not equal execution or outcome.'));
  assert.ok(laws.has('Value is broader than money.'));
  assert.ok(laws.has('Identity is not activity.'));
});

test('repository boundaries prevent competing constitutional universes', () => {
  assert.equal(contract.spine, 'carbonactual/carbonactual');
  assert.equal(contract.repositories['carbonactual/carbonactual'].role, 'canonical-ecosystem-operating-spine');
  assert.equal(contract.repositories['carbonactual/hapi-world'].role, 'world-and-constitutional-law');
  assert.equal(contract.repositories['carbonactual/abba'].role, 'intelligence-and-orchestration');
  assert.equal(contract.repositories['carbonactual/Carbon-Actual-'].role, 'platform-and-runtime-substrate');
  assert.equal(contract.repositories['carbonactual/mcp-bot'].role, 'education-domain-product');
  assert.equal(contract.repositories['carbonactual/vault'].role, 'private-secret-custody');
  assert.equal(contract.repositories['carbonactual/ECC'].role, 'external-agent-tool-mirror');
  for (const repo of Object.values(contract.repositories)) assert.equal(repo.may_define_new_kernel_facet, false);
  assert.match(contract.product_rule, /Products are fruits/);
});

test('repository estate has one classification per repository and no active unknowns', () => {
  const membership = new Map();
  for (const [className, entries] of Object.entries(estate.classes)) {
    assert.ok(Array.isArray(entries), `${className} is an array`);
    for (const repo of entries) {
      assert.equal(membership.has(repo), false, `${repo} is classified more than once`);
      membership.set(repo, className);
    }
  }
  assert.deepEqual(estate.classes.active_unclassified_repositories, []);
  for (const repo of ['carbonactual/carbonactual','carbonactual/hapi-world','carbonactual/abba','carbonactual/Carbon-Actual-','carbonactual/mcp-bot','carbonactual/vault','carbonactual/ECC','carbonactual/omnii','carbonactual/abba-mas','carbonactual/hapi-world-nexus']) {
    assert.ok(membership.has(repo), `${repo} is classified in the repository estate`);
  }
});

test('kernel flow has the approved universal order', () => {
  assert.deepEqual(kernel.universal_flow, expectedFacets);
});

test('product registry uses only kernel facets and complete active repository coverage', () => {
  const required = new Set(products.common_required_facets);
  const repositories = new Set(Object.values(products.products).map((product) => product.repository));
  assert.equal(products.status, 'canonical-registry');
  for (const repository of expectedProductRepositories) {
    assert.ok(repositories.has(repository), `${repository} is represented in the canonical product registry`);
  }
  assert.equal(repositories.has('carbonactual/direct-bank-app'), false);
  assert.equal(products.lifecycle['Direct Bank App'].repository_status, 'historical-no-current-repository');
  assert.equal(products.lifecycle['Direct Bank App'].historical_status, 'canonical-intent');
  assert.equal(products.lifecycle['Direct Bank App'].current_authority, false);
  assert.equal(products.lifecycle['Direct Bank App'].current_implementation, null);
  for (const [name, product] of Object.entries(products.products)) {
    assert.ok(product.repository, `${name} has a repository`);
    for (const facet of product.facets) assert.ok(expectedFacets.includes(facet), `${name} uses only known facets`);
    for (const facet of required) assert.ok(product.facets.includes(facet), `${name} includes ${facet}`);
  }
});

test('migration registry identifies Carbon Actual as canonical and retired repositories as historical or absorbed', () => {
  assert.equal(migration.canonical_spine, 'carbonactual/carbonactual');
  assert.equal(migration.legacy_repository.repository, 'carbonactual/omnii');
  assert.equal(migration.legacy_repository.status, 'archived-historical');
  assert.equal(migration.legacy_repository.current_authority, false);
  assert.ok(migration.migrated_core_architecture.length >= 25);
  assert.ok(migration.active_contracts.length >= 30);
  const archivedMas = migration.active_contracts.find((entry) => entry.repository === 'carbonactual/abba-mas');
  assert.equal(archivedMas?.current_authority, false);
  assert.equal(archivedMas?.absorbed_by, 'carbonactual/abba');
  const archivedNexus = migration.active_contracts.find((entry) => entry.repository === 'carbonactual/hapi-world-nexus');
  assert.equal(archivedNexus?.current_authority, false);
  assert.equal(archivedNexus?.absorbed_by, 'carbonactual/hapi-world');
});

test('integration fabric has one canonical source and preserves authority boundaries', () => {
  assert.equal(integrationFabric.canonical_fabric, `carbonactual/carbonactual/${integrationFabricPath}`);
  assert.equal(integrationFabric.constitutional_authority, 'carbonactual/hapi-world/CANON.md');
  assert.equal(integrationFabric.authority, 'SealGrant');
  assert.equal(integrationFabric.identity, '#');
  assert.equal(integrationFabric.delivery, 'at-least-once; idempotent consumers required');
});

test('legacy architecture has explicit current-Carbon-Actual coverage', async () => {
  assert.equal(legacyCrosswalk.canonical_repository, 'carbonactual/carbonactual');
  assert.ok(legacyCrosswalk.sources.length >= 20);
  for (const source of legacyCrosswalk.sources) {
    assert.ok(source.path);
    assert.ok(['mapped','reference-only'].includes(source.status));
    assert.ok(Array.isArray(source.targets));
    if (source.status === 'mapped') assert.ok(source.targets.length > 0, `${source.path} has a current target`);
    for (const target of source.targets) {
      const content = await readFile(target, 'utf8');
      assert.equal(content.includes(obsoleteSpineIdentity), false, `${target} contains obsolete operating-spine naming`);
    }
  }
  const audubon = legacyCrosswalk.sources.find((entry) => entry.path.includes('AUDUBON_CONTINUUM_ECOLOGICAL_DESIGN_DOCTRINE'));
  assert.deepEqual(audubon?.targets, ['architecture/CARBON_ACTUAL_AUDUBON_CONTINUUM_ECOLOGICAL_DESIGN_DOCTRINE.md']);
  const institutional = legacyCrosswalk.sources.find((entry) => entry.path.includes('OMNII_REUSABLE_INSTITUTIONAL_COMPOSITION'));
  assert.deepEqual(institutional?.targets, ['architecture/CARBON_ACTUAL_REUSABLE_INSTITUTIONAL_COMPOSITION.md']);
});

test('canonical control surfaces contain no obsolete operating-spine identity', async () => {
  const paths = [
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
  for (const path of paths) {
    const content = await readFile(path, 'utf8');
    assert.equal(content.includes(obsoleteSpineIdentity), false, `${path} contains obsolete operating-spine naming`);
  }
});
