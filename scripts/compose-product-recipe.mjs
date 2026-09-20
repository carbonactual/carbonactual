#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const registryPath = new URL('../architecture/CARBON_ACTUAL_PRODUCT_RECIPE_REGISTRY_2026.json', import.meta.url);
const matrixPath = new URL('../architecture/CARBON_ACTUAL_SWIRM_TEAM_MATRIX_2026.json', import.meta.url);

export async function loadRegistry() {
  return JSON.parse(await readFile(registryPath, 'utf8'));
}

export async function loadMatrix() {
  return JSON.parse(await readFile(matrixPath, 'utf8'));
}

export async function resolveRecipe(name) {
  const registry = await loadRegistry();
  const recipe = registry.recipes?.[name];
  if (!recipe) {
    throw new Error(`Unknown product recipe: ${name}`);
  }
  return {
    ...registry.defaults,
    ...recipe,
    name,
    canonical_registry: registry.registry,
    composition_spine: registry.composition_spine,
    event_fabric: recipe.event_fabric ?? registry.defaults.event_fabric,
    authority_gates: recipe.authority_gates ?? registry.defaults.authority_gates,
    economic_operations: recipe.economic_operations ?? registry.defaults.economic_operations,
    interfaces: recipe.interfaces ?? registry.defaults.interfaces,
    adapters: recipe.adapters ?? registry.defaults.adapters,
    deployment_targets: recipe.deployment_targets ?? registry.defaults.deployment_targets
  };
}

export async function validateRecipe(name, { registry, matrix, productRepositories } = {}) {
  registry ??= await loadRegistry();
  matrix ??= await loadMatrix();
  productRepositories ??= new Set(
    Object.values(
      JSON.parse(await readFile(new URL('../architecture/product-projection-registry.json', import.meta.url), 'utf8')).products ?? {}
    ).map((product) => product.repository).filter(Boolean)
  );

  const recipe = await resolveRecipe(name);
  const swirms = new Set((matrix.swirms ?? []).map((entry) => entry[0]));
  const teams = new Set((matrix.team_patterns ?? []).map((entry) => entry[0]));
  const errors = [];

  if (!recipe.repo || !productRepositories.has(recipe.repo)) errors.push('repository is not registered in product-projection-registry');
  for (const swirm of recipe.swirms ?? []) if (!swirms.has(swirm)) errors.push(`unknown SWIRM: ${swirm}`);
  if (!teams.has(recipe.team_pattern)) errors.push(`unknown TEAM pattern: ${recipe.team_pattern}`);
  if (recipe.event_fabric !== 'architecture/CARBON_ACTUAL_UNIVERSAL_EVENT_INTERACTION_FABRIC_2026.md') errors.push('event fabric drift');
  if (!recipe.authority_gates.some((gate) => String(gate).includes('authority'))) errors.push('authority gate missing');
  if (!recipe.interfaces.includes('mcp') || !recipe.interfaces.includes('agent')) errors.push('MCP/agent projection missing');
  if (recipe.economic_operations.some((op) => ![
    'decimalization','fractionalization','tokenization','minting',
    'decentralization','democratization','ledgering','settlement'
  ].includes(op))) errors.push('unknown economic operation');

  return { ok: errors.length === 0, recipe, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const registry = await loadRegistry();
  const matrix = await loadMatrix();
  if (args[0] === '--list') {
    console.log(Object.keys(registry.recipes ?? {}).join('\n'));
    return;
  }
  if (args[0] === '--validate-all') {
    const productRepositories = new Set(
      Object.values(
        JSON.parse(await readFile(new URL('../architecture/product-projection-registry.json', import.meta.url), 'utf8')).products ?? {}
      ).map((product) => product.repository).filter(Boolean)
    );
    const results = [];
    for (const name of Object.keys(registry.recipes ?? {})) {
      results.push(await validateRecipe(name, { registry, matrix, productRepositories }));
    }
    const failures = results.filter((result) => !result.ok);
    if (failures.length) {
      for (const result of failures) console.error(`RECIPE_CONFORMANCE_FAILED: ${result.recipe.name}: ${result.errors.join('; ')}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Product recipe conformance passed: ${results.length} recipes.`);
    return;
  }

  const name = args.join(' ').trim();
  if (!name) {
    console.error('Usage: node scripts/compose-product-recipe.mjs --list | --validate-all | "PRODUCT NAME"');
    process.exitCode = 2;
    return;
  }
  const result = await validateRecipe(name, { registry, matrix });
  if (!result.ok) {
    console.error(`RECIPE_CONFORMANCE_FAILED: ${name}: ${result.errors.join('; ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(result.recipe, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
