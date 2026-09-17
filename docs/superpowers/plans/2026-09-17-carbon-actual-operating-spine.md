# Carbon Actual Operating Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Carbon Actual/OMNII as the ecosystem operating spine through a small, machine-readable semantic kernel and explicit repository contracts.

**Architecture:** Keep HAPI World constitutional and authoritative. Put the nine-facet interoperability kernel at the Carbon Actual spine boundary, let ABBA consume it for orchestration, and keep platform/runtime implementations behind capability contracts. The kernel is additive and projection-only.

**Tech Stack:** JSON, Markdown, Node.js built-in `node:test`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-carbon-actual-operating-spine.md`

## Global Constraints

- `CANON.md` remains supreme.
- Carbon Actual is the canonical ecosystem operating-spine name.
- OMNII is the architectural identity of the operating spine, not a competing product/world.
- The kernel has exactly nine facets.
- Facets are projections, not replacement entity types.
- Authority is not capability; event is not evidence; state is not history; intent is not execution; value is not money.
- Product-specific code must not create a second constitutional universe.

---

### Task 1: Add machine-readable kernel

**Files:**
- Create: `architecture/ecosystem-kernel.json`
- Test: `tests/architecture/ecosystem-kernel.test.mjs`

**Interfaces:**
- Consumes: existing ecosystem semantics from the approved design.
- Produces: stable JSON contract with nine facet IDs and invariant metadata.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const kernel = JSON.parse(await readFile('architecture/ecosystem-kernel.json', 'utf8'));

const expected = ['identity','authority','intent','capability','relationship','event','evidence','state','value'];

test('kernel has exactly nine stable facets', () => {
  assert.deepEqual(kernel.facets.map((facet) => facet.id), expected);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/architecture/ecosystem-kernel.test.mjs`
Expected: FAIL because the kernel file is not yet present.

- [ ] **Step 3: Write the minimal implementation**

Create `architecture/ecosystem-kernel.json` with the nine facets and the approved invariants.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/architecture/ecosystem-kernel.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add architecture/ecosystem-kernel.json tests/architecture/ecosystem-kernel.test.mjs
git commit -m "feat: establish Carbon Actual semantic kernel"
```

### Task 2: Add repository boundary contract

**Files:**
- Create: `architecture/kernel-repo-contract.json`
- Modify: `tests/architecture/ecosystem-kernel.test.mjs`

**Interfaces:**
- Consumes: kernel facet IDs.
- Produces: repository role registry and non-duplication boundary.

- [ ] **Step 1: Write the failing test**

```js
test('repository contract keeps constitutional, intelligence, platform, and product roles distinct', async () => {
  const contract = JSON.parse(await readFile('architecture/kernel-repo-contract.json', 'utf8'));
  assert.equal(contract.repositories['carbonactual/hapi-world'].role, 'world-and-constitutional-law');
  assert.equal(contract.repositories['carbonactual/abba'].role, 'intelligence-and-orchestration');
  assert.equal(contract.repositories['carbonactual/Carbon-Actual-'].role, 'platform-and-runtime-substrate');
  assert.equal(contract.product_rule.includes('fruits'), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/architecture/ecosystem-kernel.test.mjs`
Expected: FAIL because the repository contract is absent.

- [ ] **Step 3: Write minimal implementation**

Create the repository role registry without renaming or deleting existing repositories.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/architecture/ecosystem-kernel.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add architecture/kernel-repo-contract.json tests/architecture/ecosystem-kernel.test.mjs
git commit -m "feat: define Carbon Actual repository boundaries"
```

### Task 3: Add human-readable operating-spine law

**Files:**
- Create: `architecture/ECOSYSTEM_KERNEL.md`
- Create: `docs/superpowers/specs/2026-09-17-carbon-actual-operating-spine.md`
- Create: `docs/superpowers/plans/2026-09-17-carbon-actual-operating-spine.md`

**Interfaces:**
- Consumes: JSON kernel and repository contract.
- Produces: stable human-readable architecture reference.

- [ ] **Step 1: Verify both machine-readable contracts parse**

Run: `node -e "JSON.parse(require('fs').readFileSync('architecture/ecosystem-kernel.json','utf8')); JSON.parse(require('fs').readFileSync('architecture/kernel-repo-contract.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 2: Commit architecture documentation**

```bash
git add architecture/ECOSYSTEM_KERNEL.md docs/superpowers/specs/2026-09-17-carbon-actual-operating-spine.md docs/superpowers/plans/2026-09-17-carbon-actual-operating-spine.md
git commit -m "docs: establish operating-spine architecture"
```

### Task 4: Add deterministic CI validation

**Files:**
- Create: `scripts/validate-kernel.mjs`
- Create: `tests/architecture/ecosystem-kernel.test.mjs`
- Create: `.github/workflows/ecosystem-kernel.yml`

**Interfaces:**
- Consumes: kernel JSON and repository contract.
- Produces: non-zero exit status for structural violations.

- [ ] **Step 1: Write failing validation checks**

The test suite must assert:

```js
assert.equal(kernel.facets.length, 9);
assert.equal(kernel.identity.canonical_name, 'Carbon Actual');
assert.equal(kernel.identity.architectural_identity, 'OMNII');
assert.equal(kernel.constitutional_boundary.may_override_canon, false);
assert.equal(kernel.design_laws.includes('Authority is never inferred from capability.'), true);
assert.equal(kernel.design_laws.includes('An event is not its evidence.'), true);
assert.equal(kernel.design_laws.includes('Current state is not the historical event stream.'), true);
assert.equal(kernel.design_laws.includes('Intent does not equal execution or outcome.'), true);
assert.equal(kernel.design_laws.includes('Value is broader than money.'), true);
```

- [ ] **Step 2: Run the tests**

Run: `node --test tests/architecture/ecosystem-kernel.test.mjs`
Expected: PASS after implementation.

- [ ] **Step 3: Add validator**

Create `scripts/validate-kernel.mjs` that loads both JSON contracts, checks duplicate facet IDs, validates the nine required IDs, verifies repository roles, and exits `1` on any violation.

- [ ] **Step 4: Add CI workflow**

Create `.github/workflows/ecosystem-kernel.yml` using read-only repository permissions and Node.js. The workflow runs `node scripts/validate-kernel.mjs` and `node --test tests/architecture/ecosystem-kernel.test.mjs`.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-kernel.mjs .github/workflows/ecosystem-kernel.yml tests/architecture/ecosystem-kernel.test.mjs
git commit -m "ci: enforce Carbon Actual kernel conformance"
```

### Task 5: Publish the operating-spine map in the README

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: ecosystem kernel and repository contract.
- Produces: human entrypoint that identifies Carbon Actual as OMNII operating spine and links to canonical architecture files.

- [ ] **Step 1: Write replacement README section**

Add a concise `OPERATING SPINE` section that states:

```text
Carbon Actual = OMNII operating spine
HAPI World = constitutional world/law
ABBA = intelligence/orchestration
Carbon-Actual- = platform/runtime substrate
Products = specialized projections over shared primitives
```

Link to `architecture/ECOSYSTEM_KERNEL.md`, `architecture/ecosystem-kernel.json`, and `architecture/kernel-repo-contract.json`.

- [ ] **Step 2: Validate README references**

Run: `node scripts/validate-kernel.mjs`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: publish operating-spine map"
```
