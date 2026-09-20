import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistry, validateRecipe } from '../../scripts/compose-product-recipe.mjs';

test('all declared product recipes resolve against the shared composition fabric', async () => {
  const registry = await loadRegistry();
  const names = Object.keys(registry.recipes ?? {});
  assert.ok(names.length >= 15);

  for (const name of names) {
    const result = await validateRecipe(name, { registry });
    assert.equal(result.ok, true, `${name}: ${result.errors.join('; ')}`);
    assert.equal(result.recipe.composition_spine, registry.composition_spine);
    assert.ok(result.recipe.event_fabric.includes('UNIVERSAL_EVENT_INTERACTION_FABRIC'));
    assert.ok(result.recipe.interfaces.includes('mcp'));
    assert.ok(result.recipe.interfaces.includes('agent'));
  }
});
