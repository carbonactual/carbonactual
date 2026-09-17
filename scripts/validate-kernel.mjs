import { readFile } from 'node:fs/promises';

const fail = (message) => {
  console.error(`KERNEL_CONFORMANCE_FAILED: ${message}`);
  process.exitCode = 1;
};

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));

const kernel = await readJson('architecture/ecosystem-kernel.json');
const contract = await readJson('architecture/kernel-repo-contract.json');
const products = await readJson('architecture/product-projection-registry.json');

const expectedFacets = [
  'identity',
  'authority',
  'intent',
  'capability',
  'relationship',
  'event',
  'evidence',
  'state',
  'value'
];

if (kernel.identity?.canonical_name !== 'Carbon Actual') fail('canonical name must be Carbon Actual');
if (kernel.identity?.architectural_identity !== 'OMNII') fail('architectural identity must be OMNII');
if (kernel.constitutional_boundary?.may_override_canon !== false) fail('kernel may not override HAPI World CANON.md');
if (kernel.constitutional_boundary?.may_replace_existing_canonical_objects !== false) fail('kernel may not replace canonical objects');

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
for (const [name, product] of Object.entries(products.products ?? {})) {
  if (!product.repository) fail(`product ${name} is missing repository`);
  if (!Array.isArray(product.facets) || product.facets.length === 0) fail(`product ${name} has no declared facets`);
  for (const facet of product.facets) {
    if (!expectedFacets.includes(facet)) fail(`product ${name} declares unknown facet ${facet}`);
  }
  for (const required of products.common_required_facets) {
    if (!product.facets.includes(required)) fail(`product ${name} is missing required facet ${required}`);
  }
}

if (process.exitCode) process.exit();
console.log(`Kernel conformance passed: ${facetIds.length} facets, ${Object.keys(repositories).length} governed repositories, ${Object.keys(products.products ?? {}).length} products.`);
