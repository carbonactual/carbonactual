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
const repositoryEstatePath = 'architecture/repository-estate-registry.json';
const communicationPresencePath = 'architecture/CARBON_ACTUAL_COMMUNICATION_PRESENCE_REGISTRY.json';
const freezeCoveragePath = 'architecture/CARBON_ACTUAL_UNIVERSAL_ARCHITECTURE_FREEZE_COVERAGE.json';
const creativeEconomyPath = 'architecture/CARBON_ACTUAL_CREATIVE_ECONOMY_CAPABILITY_REGISTRY.json';
const capabilityOwnershipPath = 'architecture/CARBON_ACTUAL_CAPABILITY_OWNERSHIP.json';
const routingMapPath = 'architecture/CARBON_ACTUAL_REPOSITORY_ROUTING_MAP.json';
const productTaxonomyPath = 'architecture/CARBON_ACTUAL_PRODUCT_TAXONOMY.json';
const swarmTeamTraceabilityPath = 'architecture/CARBON_ACTUAL_SWARM_TEAM_TRACEABILITY.json';
const ecosystemOverviewPath = 'architecture/CARBON_ACTUAL_ECOSYSTEM_OVERVIEW_ALIGNMENT_2026.md';
const domainCircumferencePath = 'architecture/CARBON_ACTUAL_DOMAIN_CIRCUMFERENCE_2026.json';
const ecosystemDomainAtlasPath = 'architecture/CARBON_ACTUAL_ECOSYSTEM_DOMAIN_ATLAS_2026.json';
const swirmTeamMatrixPath = 'architecture/CARBON_ACTUAL_SWIRM_TEAM_MATRIX_2026.json';
const compositionSpinePath = 'architecture/CARBON_ACTUAL_UNIVERSAL_COMPOSITION_SPINE_2026.md';
const universalEventInteractionPath = 'architecture/CARBON_ACTUAL_UNIVERSAL_EVENT_INTERACTION_FABRIC_2026.md';
const economicObjectUniversePath = 'architecture/CARBON_ACTUAL_ECONOMIC_OBJECT_UNIVERSE_2026.json';
const productRecipeContractPath = 'architecture/CARBON_ACTUAL_PRODUCT_RECIPE_CONTRACT_2026.json';
const entityCapabilityProfilePath = 'architecture/CARBON_ACTUAL_UNIVERSAL_ENTITY_CAPABILITY_PROFILE_2026.md';

const kernel = await readJson('architecture/ecosystem-kernel.json');
const contract = await readJson('architecture/kernel-repo-contract.json');
const products = await readJson('architecture/product-projection-registry.json');
const migration = await readJson(migrationRegistryPath);
const integrationFabric = await readJson(integrationFabricPath);
const legacyCrosswalk = await readJson(legacyCrosswalkPath);
const estate = await readJson(repositoryEstatePath);
const communicationPresence = await readJson(communicationPresencePath);
const freezeCoverage = await readJson(freezeCoveragePath);
const creativeEconomy = await readJson(creativeEconomyPath);
const capabilityOwnership = await readJson(capabilityOwnershipPath);
const routingMap = await readJson(routingMapPath);
const productTaxonomy = await readJson(productTaxonomyPath);
const swarmTeamTraceability = await readJson(swarmTeamTraceabilityPath);
const domainCircumference = await readJson(domainCircumferencePath);
const ecosystemDomainAtlas = await readJson(ecosystemDomainAtlasPath);
const swirmTeamMatrix = await readJson(swirmTeamMatrixPath);
const economicObjectUniverse = await readJson(economicObjectUniversePath);
const productRecipeContract = await readJson(productRecipeContractPath);
const compositionSpine = await readFile(compositionSpinePath, 'utf8');
const universalEventInteraction = await readFile(universalEventInteractionPath, 'utf8');
const entityCapabilityProfile = await readFile(entityCapabilityProfilePath, 'utf8');

const expectedFacets = ['identity','authority','intent','capability','relationship','event','evidence','state','value'];
if (communicationPresence.canonical_source !== 'carbonactual/carbonactual/architecture/CARBON_ACTUAL_COMMUNICATION_PRESENCE_FABRIC.md') fail('communication/presence registry must resolve to canonical fabric');
if (freezeCoverage.operating_spine !== 'carbonactual/carbonactual') fail('freeze coverage must resolve to canonical Carbon Actual');
if (creativeEconomy.canonical_contract !== 'carbonactual/carbonactual/architecture/CARBON_ACTUAL_CREATIVE_ECONOMY_DOMAIN_CONTRACT.md') fail('creative economy registry must resolve to canonical contract');
if (capabilityOwnership.semantic_authority !== 'carbonactual/carbonactual') fail('capability ownership semantic authority drift');
if (routingMap.semantic_authority !== 'carbonactual/carbonactual') fail('routing map semantic authority drift');
if (productTaxonomy.authority !== 'carbonactual/carbonactual') fail('product taxonomy authority drift');
const providerPolicyPath = 'architecture/CARBON_ACTUAL_INTEGRATION_PROVIDER_POLICY.md';
const providerPolicy = await readFile(providerPolicyPath, 'utf8');
if (!providerPolicy.includes('Provider is not authority.')) fail('integration provider policy authority boundary missing');
if (!providerPolicy.includes('open standards')) fail('integration provider policy open-first rule missing');
if (productTaxonomy.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('product taxonomy constitutional authority drift');
if (swarmTeamTraceability.authority !== 'carbonactual/carbonactual') fail('Swarm/Team traceability authority drift');
if (swarmTeamTraceability.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('Swarm/Team traceability constitutional authority drift');
if (swarmTeamTraceability.contract !== 'architecture/CARBON_ACTUAL_ABBA_SWARM_TEAM_WORKFLOW_BOUNDARY.md') fail('Swarm/Team traceability contract drift');
if (domainCircumference.domainScope?.alignment_layer?.overview !== ecosystemOverviewPath) fail('domain circumference overview alignment drift');
if (domainCircumference.domainScope?.alignment_layer?.domain_atlas !== ecosystemDomainAtlasPath) fail('domain circumference atlas alignment drift');
if (domainCircumference.domainScope?.alignment_layer?.swirm_team_matrix !== swirmTeamMatrixPath) fail('domain circumference SWIRM/TEAM alignment drift');
if (ecosystemDomainAtlas.authority !== 'carbonactual/carbonactual') fail('ecosystem domain atlas authority drift');
if (ecosystemDomainAtlas.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('ecosystem domain atlas constitutional authority drift');
if (ecosystemDomainAtlas.kernel?.join('|') !== expectedFacets.join('|')) fail('ecosystem domain atlas kernel drift');
if (!Array.isArray(ecosystemDomainAtlas.domains) || ecosystemDomainAtlas.domains.length < 35) fail('ecosystem domain atlas is unexpectedly small');
if (economicObjectUniverse.authority !== 'carbonactual/hapi-world/CANON.md') fail('economic object universe constitutional authority drift');
if (economicObjectUniverse.version !== '2026.1') fail('economic object universe version drift');
for (const op of ['decimalization','fractionalization','tokenization','minting','decentralization','democratization','ledgering','settlement']) {
  if (!economicObjectUniverse.operations?.includes(op)) fail('economic operation missing from shared universe: ' + op);
}
for (const objectFamily of ['fiat','crypto-asset','mineral','food','energy','water','property','collateral','pawned-item','capability','capacity','opportunity']) {
  if (!economicObjectUniverse.object_families?.includes(objectFamily)) fail('economic object family missing from shared universe: ' + objectFamily);
}
if (productRecipeContract.authority !== 'carbonactual/hapi-world/CANON.md') fail('product recipe constitutional authority drift');
if (!Array.isArray(productRecipeContract.template?.interfaces) || !productRecipeContract.template.interfaces.includes('mcp')) fail('product recipe must support MCP projection');
if (!Array.isArray(productRecipeContract.template?.economic_operations) || productRecipeContract.template.economic_operations.length < 7) fail('product recipe economic operation surface is incomplete');
for (const marker of ['Carbon Actual Universal Entity & Capability Profile','Full capability means composability with relevant registered capabilities','identity -> authority/Seal -> policy -> capability']) {
  if (!entityCapabilityProfile.includes(marker)) fail('universal entity capability profile marker missing: ' + marker);
}

for (const marker of ['Carbon Actual Universal Composition Spine','build once -> strengthen once -> compose many','CANON','SWIRMs','TEAM / MISSION']) {
  if (!compositionSpine.includes(marker)) fail('composition spine marker missing: ' + marker);
}
for (const marker of ['in-person','virtual','remote/async','media/broadcast-only','hybrid','externally hosted and observed','Capacity is session-scoped']) {
  if (!universalEventInteraction.includes(marker)) fail('universal event interaction marker missing: ' + marker);
}

if (swirmTeamMatrix.authority !== 'carbonactual/carbonactual') fail('SWIRM/TEAM matrix authority drift');
if (swirmTeamMatrix.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('SWIRM/TEAM matrix constitutional authority drift');
if (!Array.isArray(swirmTeamMatrix.swirms) || swirmTeamMatrix.swirms.length < 30) fail('SWIRM matrix is unexpectedly small');
if (!Array.isArray(swirmTeamMatrix.team_patterns) || swirmTeamMatrix.team_patterns.length < 15) fail('TEAM matrix is unexpectedly small');
if (!Array.isArray(swarmTeamTraceability.traceability) || swarmTeamTraceability.traceability.length !== 10) fail('Swarm/Team traceability must cover 10 canonical relationships/objects');
for (const row of swarmTeamTraceability.traceability) {
  if (!row.object || !row.kernel_facet || !row.swarm_team_role || !row.authority_gate) fail('incomplete Swarm/Team traceability row');
}
for (const requirement of swarmTeamTraceability.team_record_requirements || []) if (typeof requirement !== 'string') fail('invalid Team record requirement');
for (const requirement of swarmTeamTraceability.workflow_record_requirements || []) if (typeof requirement !== 'string') fail('invalid Workflow record requirement');
if (JSON.stringify(swarmTeamTraceability.readiness_states) !== JSON.stringify(['READY','INCOMPLETE','BLOCKED'])) fail('Swarm/Team readiness states drift');
const allowedKinds = new Set(productTaxonomy.classification_values || []);
for (const [name, record] of Object.entries(productTaxonomy.canonical_current_products || {})) {
  if (!allowedKinds.has(record.kind)) fail('invalid product taxonomy kind: ' + name);
  if (!record.repository) fail('current product missing repository: ' + name);
}
for (const [name, record] of Object.entries(productTaxonomy.absorbed_or_internal || {})) {
  if (record.public_product_surface === true) fail('internal/absorbed concept cannot be public product surface: ' + name);
}
for (const name of productTaxonomy.historical_or_preserved_names || []) if (!name?.trim()) fail('empty historical/preserved product name');
if (routingMap.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('routing map constitutional authority drift');
if (routingMap.routes.abba.repository !== 'carbonactual/abba') fail('ABBA routing repository drift');
if (routingMap.routes.abba.delegates_to !== 'ABBA-MAS') fail('ABBA must delegate execution coordination to ABBA-MAS');
if (routingMap.routes.abba_mas.repository !== 'carbonactual/abba') fail('ABBA-MAS repository drift');
if (routingMap.routes.shared_capability_fabric.repository !== 'carbonactual/carbonactual') fail('shared capability fabric repository drift');
if (routingMap.routes.platform_runtime.repository !== 'carbonactual/Carbon-Actual-') fail('platform runtime repository drift');
if (routingMap.routes.products.rule.indexOf('leaves') === -1) fail('product leaf routing rule missing');
for (const [legacy, state] of Object.entries(routingMap.legacy || {})) if (!state || !/archived-provenance/.test(state)) fail('legacy route must remain provenance-only: ' + legacy);
if (capabilityOwnership.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('capability ownership constitutional authority drift');
if (Object.keys(capabilityOwnership.owners || {}).length < 20) fail('capability ownership registry unexpectedly small');
for (const [capability, owner] of Object.entries(capabilityOwnership.owners || {})) {
  if (!owner || typeof owner !== 'string') fail('capability owner missing: ' + capability);
}
if (creativeEconomy.implementation_repository !== null) fail('creative economy product must not have an asserted current implementation repository');
if (creativeEconomy.cultural_atlas_boundary !== 'Nigerian Cultural Atlas remains publishing/atlas; creative production and rights/commercial operations remain separate.') fail('creative economy / Cultural Atlas boundary drift');
if (!Array.isArray(creativeEconomy.capabilities) || creativeEconomy.capabilities.length === 0) fail('creative economy capability registry is empty');
if (freezeCoverage.summary?.required_areas !== 40 || freezeCoverage.summary?.covered !== 40 || freezeCoverage.summary?.gaps !== 0) fail('universal architecture freeze coverage must declare 40 covered areas and zero gaps');
if (!Array.isArray(freezeCoverage.coverage) || freezeCoverage.coverage.length !== 40) fail('universal architecture freeze coverage matrix must contain exactly 40 areas');
for (const entry of freezeCoverage.coverage) {
  if (!Array.isArray(entry) || entry.length !== 3) fail('freeze coverage entry must be [requirement,status,destinations]');
  if (entry[1] !== 'covered') fail('uncovered freeze requirement: ' + entry[0]);
  if (!Array.isArray(entry[2]) || entry[2].length === 0) fail('freeze requirement has no destination: ' + entry[0]);
}
if (communicationPresence.constitutional_authority !== 'carbonactual/hapi-world/CANON.md') fail('communication/presence registry must preserve constitutional authority');
if ((communicationPresence.semantic_facets || []).join('|') !== expectedFacets.join('|')) fail('communication/presence registry facet inheritance drift');
if (communicationPresence.capability_rule !== 'Communication and Presence are cross-cutting capabilities/denominators, not additional kernel facets.') fail('communication/presence must remain subordinate to the nine-facet kernel');
if (!Array.isArray(communicationPresence.maturity?.canonical) || communicationPresence.maturity.canonical.length === 0) fail('communication/presence canonical capability set is empty');
const requiredProductRepositories = [
  'carbonactual/abba','carbonactual/omni','carbonactual/tip','carbonactual/spotist','carbonactual/hapi-world',
  'carbonactual/naire','carbonactual/ngin','carbonactual/seed','carbonactual/heritage','carbonactual/io',
  'carbonactual/value-system','carbonactual/institutegpt','carbonactual/noun-student-bot','carbonactual/mcp-bot',
  'carbonactual/open-bank','carbonactual/open-ballot','carbonactual/RITES','carbonactual/nigerian-cultural-atlas',
  'carbonactual/bunk','carbonactual/zujid'
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

const estateClasses = estate.classes ?? {};
const estateMembership = new Map();
for (const [className, entries] of Object.entries(estateClasses)) {
  if (!Array.isArray(entries)) fail(`repository estate class ${className} must be an array`);
  for (const repo of entries) {
    if (typeof repo !== 'string' || !repo.includes('/')) fail(`invalid repository identifier in estate class ${className}: ${repo}`);
    const prior = estateMembership.get(repo);
    if (prior) fail(`repository ${repo} is classified in both ${prior} and ${className}`);
    estateMembership.set(repo, className);
  }
}
if (!Array.isArray(estateClasses.active_unclassified_repositories) || estateClasses.active_unclassified_repositories.length !== 0) {
  fail('active_unclassified_repositories must be empty');
}
for (const repo of [
  'carbonactual/carbonactual','carbonactual/hapi-world','carbonactual/abba','carbonactual/Carbon-Actual-',
  'carbonactual/mcp-bot','carbonactual/vault','carbonactual/ECC','carbonactual/omnii','carbonactual/abba-mas','carbonactual/hapi-world-nexus'
]) {
  if (!estateMembership.has(repo)) fail(`repository estate does not classify ${repo}`);
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
    if (!product.facets.includes(required)) fail(`product ${name} is missing ${required}`);
  }
  if (!estateClasses.active_products.includes(product.repository) && product.repository !== 'carbonactual/abba' && product.repository !== 'carbonactual/hapi-world') {
    fail(`active product ${name} repository is not classified as active product: ${product.repository}`);
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
  'architecture/CARBON_ACTUAL_CANONICAL_OBJECT_SCHEMA.md','architecture/CARBON_ACTUAL_CAPABILITY_FABRIC.md','architecture/CARBON_ACTUAL_TECHNICAL_STANDARDS_ALIGNMENT_2026.md',
  'architecture/CARBON_ACTUAL_CAPABILITY_ADAPTER_CONTRACT.md','architecture/CARBON_ACTUAL_UNIVERSAL_AGENT_CONTRACT.md',
  'architecture/CARBON_ACTUAL_UNIVERSAL_COMPOSITION_ENGINE.md','architecture/CARBON_ACTUAL_REUSABLE_INSTITUTIONAL_COMPOSITION.md',
  'architecture/CARBON_ACTUAL_AUDUBON_CONTINUUM_ECOLOGICAL_DESIGN_DOCTRINE.md','architecture/CARBON_ACTUAL_UNIVERSAL_EVENT_LIFECYCLE.md',
  'architecture/CARBON_ACTUAL_INTEGRATION_KERNEL.md',integrationFabricPath,'architecture/SPOTIST_CANONICAL_CAPABILITY.md',
  'architecture/SPOTIST_SEEK_ARCHITECTURE_V2.md','architecture/CARBON_ACTUAL_PRODUCT_CONFORMANCE_MATRIX.md',
  'architecture/CARBON_ACTUAL_CONTROL_PLANE.md','architecture/CARBON_ACTUAL_CANONICAL_AUTHORITY_REGISTRY.md',
  'architecture/CARBON_ACTUAL_CANONICAL_EVENT_STATE_INTEGRITY.md','architecture/CARBON_ACTUAL_ABBA_SWARM_TEAM_WORKFLOW_BOUNDARY.md',
  'architecture/CARBON_ACTUAL_RUNTIME_RECONCILIATION.md','architecture/CARBON_ACTUAL_RUNTIME_CONFORMANCE_MATRIX.md',
  'architecture/CARBON_ACTUAL_PROJECTION_BOUNDARY.md','architecture/CARBON_ACTUAL_ECONOMIC_LEDGER_TOKENIZATION_BOUNDARY.md',
  'architecture/CARBON_ACTUAL_ASH_PHOENIX_CONTINUITY_BOUNDARY.md','architecture/CARBON_ACTUAL_PROPOSAL_CONTRADICTION_INTAKE.md','architecture/CARBON_ACTUAL_COMMUNICATION_PRESENCE_FABRIC.md','architecture/CARBON_ACTUAL_COMMUNICATION_PRESENCE_REGISTRY.json','architecture/CARBON_ACTUAL_PHYSICAL_WORLD_INTEROPERABILITY_CONTRACT.md','architecture/CARBON_ACTUAL_HUMAN_ACCESSIBILITY_LOCALIZATION_CONTRACT.md','architecture/CARBON_ACTUAL_ECONOMIC_REVENUE_MONETIZATION_BOUNDARY.md','architecture/CARBON_ACTUAL_UNIVERSAL_ARCHITECTURE_FREEZE_COVERAGE.json','architecture/CARBON_ACTUAL_CREATIVE_ECONOMY_DOMAIN_CONTRACT.md','architecture/CARBON_ACTUAL_CREATIVE_ECONOMY_CAPABILITY_REGISTRY.json','architecture/CARBON_ACTUAL_CAPABILITY_OWNERSHIP.json','architecture/CARBON_ACTUAL_REPOSITORY_ROUTING_MAP.json','architecture/CARBON_ACTUAL_PRODUCT_TAXONOMY.json','architecture/CARBON_ACTUAL_INTEGRATION_PROVIDER_POLICY.md','architecture/CARBON_ACTUAL_SWARM_TEAM_TRACEABILITY.json',ecosystemOverviewPath,domainCircumferencePath,ecosystemDomainAtlasPath,swirmTeamMatrixPath,'architecture/CARBON_ACTUAL_INTEGRATION_PROVIDER_POLICY.md',
  'architecture/CARBON_ACTUAL_RUNTIME_OBSERVABILITY_BOUNDARY.md','architecture/CARBON_ACTUAL_SECURITY_POSTURE_AND_PROVIDER_BOUNDARIES.md',
  'docs/superpowers/specs/2026-09-17-carbon-actual-operating-spine.md','docs/superpowers/plans/2026-09-17-carbon-actual-operating-spine.md'
];
for (const path of canonicalSurfaces) {
  const content = await readFile(path, 'utf8');
  if (content.includes(obsoleteSpineIdentity)) fail(`obsolete operating-spine identity remains in ${path}`);
}

if (process.exitCode) process.exit();
console.log(`Kernel conformance passed: ${facetIds.length} facets, ${Object.keys(repositories).length} governed repositories, ${Object.keys(products.products ?? {}).length} active products, ${estateMembership.size} classified estate repositories, ${migration.migrated_core_architecture.length} migrated architecture controls, ${migration.active_contracts.length} active contracts, ${legacyCrosswalk.sources.length} legacy architecture sources crosswalked.`);
