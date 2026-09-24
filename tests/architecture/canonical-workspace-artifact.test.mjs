import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workspace=await readFile('packages/orchestration/src/workspaceIntelligenceEngine.ts','utf8');
const migration=await readFile('packages/orchestration/src/artifactMigrationEngine.ts','utf8');
const recovery=await readFile('packages/orchestration/src/workspaceRecoveryEngine.ts','utf8');
const pack=await readFile('packages/orchestration/src/workspaceArtifactIntelligencePack.ts','utf8');
const contract=JSON.parse(await readFile('architecture/canonical/abba-workspace-artifact-intelligence.json','utf8'));
const jobs=JSON.parse(await readFile('architecture/canonical/abba-workspace-artifact-jobs.json','utf8'));
const runtime=await readFile('packages/orchestration/src/runtimeOrchestrator.ts','utf8');

test('workspace intelligence covers lineage, duplication, drift, migration and recovery',()=>{
  for(const token of ['LINEAGE','DUPLICATE_DETECTION','DRIFT_DETECTION','MIGRATION','RECOVERY']) assert.match(JSON.stringify(contract),new RegExp(token));
  assert.match(workspace,/UNRESOLVED_LINEAGE/);
  assert.match(workspace,/DUPLICATE/);
});

test('migrations preserve history/provenance and block destructive defaults',()=>{
  assert.match(migration,/HISTORY_PRESERVATION_REQUIRED/);
  assert.match(migration,/PROVENANCE_PRESERVATION_REQUIRED/);
  assert.match(migration,/DESTRUCTIVE_MIGRATION_REQUIRES_EXPLICIT_HUMAN_REVIEW/);
  assert.match(migration,/executionAllowed:false/);
});

test('recovery preserves the current state and builds a recovery point',()=>{
  assert.match(recovery,/CAPTURE_CURRENT_STATE/);
  assert.match(recovery,/BUILD_RECOVERY_POINT/);
  assert.match(recovery,/destructiveAllowed:false/);
});

test('workspace pack is execution-disabled',()=>{
  assert.equal(jobs.jobs.length,13);
  assert.match(pack,/executionAllowed:false/);
  assert.match(runtime,/workspaceArtifactPack\.analyze/);
  assert.match(runtime,/WORKSPACE_FINDING/);
});
