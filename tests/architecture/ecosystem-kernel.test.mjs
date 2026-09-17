import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const kernel = JSON.parse(await readFile('architecture/ecosystem-kernel.json', 'utf8'));
const contract = JSON.parse(await readFile('architecture/kernel-repo-contract.json', 'utf8'));
const products = JSON.parse(await readFile('architecture/product-projection-registry.json', 'utf8'));

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
  for (const repo of Object.values(contract.repositories)) assert.equal(repo.may_define_new_kernel_facet, false);
  assert.match(contract.product_rule, /Products are fruits/);
});

test('kernel flow has the approved universal order', () => {
  assert.deepEqual(kernel.universal_flow, expectedFacets);
});

test('product registry uses only kernel facets and common required facets', () => {
  const required = new Set(products.common_required_facets);
  assert.equal(products.status, 'canonical-registry');
  assert.equal(Object.keys(products.products).length, 13);
  for (const [name, product] of Object.entries(products.products)) {
    assert.ok(product.repository, `${name} has a repository`);
    for (const facet of product.facets) assert.ok(expectedFacets.includes(facet), `${name} uses only known facets`);
    for (const facet of required) assert.ok(product.facets.includes(facet), `${name} includes ${facet}`);
  }
});

test('canonical control surfaces contain no obsolete operating-spine identity', async () => {
  const obsoleteSpineIdentity = ['O', 'M', 'N', 'I', 'I'].join('');
  const paths = [
    'README.md',
    'architecture/ECOSYSTEM_KERNEL.md',
    'architecture/ecosystem-kernel.json',
    'architecture/kernel-repo-contract.json',
    'architecture/product-projection-registry.json',
    'scripts/validate-kernel.mjs',
    'tests/architecture/ecosystem-kernel.test.mjs',
    'docs/superpowers/specs/2026-09-17-carbon-actual-operating-spine.md',
    'docs/superpowers/plans/2026-09-17-carbon-actual-operating-spine.md'
  ];
  for (const path of paths) {
    const content = await readFile(path, 'utf8');
    assert.equal(content.includes(obsoleteSpineIdentity), false, `${path} contains obsolete operating-spine naming`);
  }
});
