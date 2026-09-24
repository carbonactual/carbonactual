import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const graph=JSON.parse(await readFile('architecture/canonical/abba-core-jobs.json','utf8'));
const evidenceJobs=JSON.parse(await readFile('architecture/canonical/abba-evidence-source-intelligence-jobs.json','utf8'));
const humanJobs=JSON.parse(await readFile('architecture/canonical/abba-human-coordination-jobs.json','utf8'));

test('master graph is contiguous, unique and dependency-linear',()=>{
  assert.equal(graph.jobSequence.length,104);
  const ids=graph.jobSequence.map(job=>job.jobId);
  assert.equal(new Set(ids).size,104);
  for(let i=0;i<ids.length;i+=1) assert.equal(ids[i],`ABBACORE-${String(i+1).padStart(2,'0')}`);
  for(let i=1;i<graph.jobSequence.length;i+=1) assert.deepEqual(graph.jobSequence[i].dependsOn,[graph.jobSequence[i-1].jobId]);
  assert.equal(graph.jobSequence.at(-1).name,'CONTINUE_OR_STOP');
});

test('evidence-source pack matches the expanded graph lifecycle',()=>{
  assert.equal(evidenceJobs.jobs.length,17);
  for(const name of ['CLASSIFY_SOURCE_TYPE','DEDUPLICATE_SOURCE_COPIES','VERIFY_EVIDENCE_CHAIN_QUALITY','DETECT_EVIDENCE_GAPS']) assert.ok(evidenceJobs.jobs.includes(name));
});

test('human coordination pack remains bounded and resumable',()=>{
  assert.equal(humanJobs.jobs.length,10);
  assert.equal(humanJobs.jobs.at(-1),'RESUME_GOVERNED_CONTINUATION');
});
