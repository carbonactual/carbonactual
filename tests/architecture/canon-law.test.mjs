import test from "node:test";
import assert from "node:assert/strict";
import { validateRepoCanon } from "../../scripts/validate-canon-law.mjs";
test("repository canon law is valid",async()=>{const r=await validateRepoCanon(process.cwd());assert.equal(r.passed,true,r.violations.join("\n"));});
