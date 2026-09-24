export interface CapabilityCandidate {
  candidateId: string;
  capabilityRef: string;
  providerRef: string;
  qualityScore: number;
  reliabilityScore: number;
  coverageScore: number;
  riskScore: number;
  latencyMs: number;
  costUnits: number;
  available: boolean;
  evidenceRefs: string[];
}

export interface CapabilityBenchmarkResult {
  capabilityRef: string;
  criteria: Record<string, number>;
  orderedCandidateIds: string[];
  excludedCandidateIds: string[];
  reasons: Record<string, string[]>;
  executionAllowed: false;
}

function clamp(v:number){return Math.max(0,Math.min(1,v));}
function score(c:CapabilityCandidate, w:Record<string,number>):number {
  const quality=clamp(c.qualityScore), reliability=clamp(c.reliabilityScore), coverage=clamp(c.coverageScore);
  const risk=1-clamp(c.riskScore);
  const latency=1-Math.min(1,c.latencyMs/10000);
  const cost=1-Math.min(1,c.costUnits/1000);
  return quality*(w.quality??1)+reliability*(w.reliability??1)+coverage*(w.coverage??1)+risk*(w.risk??1)+latency*(w.latency??0.5)+cost*(w.cost??0.5);
}

export class ABBACapabilityBenchmarkEngine {
  benchmark(candidates: CapabilityCandidate[], criteria: Record<string,number> = {}): CapabilityBenchmarkResult {
    const valid=candidates.filter(c=>c.available && c.evidenceRefs.length>0);
    const excluded=candidates.filter(c=>!valid.includes(c));
    const ordered=[...valid].sort((a,b)=>score(b,criteria)-score(a,criteria));
    const reasons:Record<string,string[]>={};
    for(const c of excluded){
      reasons[c.candidateId]=[
        ...(!c.available?['CAPABILITY_UNAVAILABLE']:[]),
        ...(c.evidenceRefs.length===0?['CAPABILITY_BENCHMARK_EVIDENCE_REQUIRED']:[])
      ];
    }
    return {
      capabilityRef: candidates[0]?.capabilityRef ?? '',
      criteria,
      orderedCandidateIds: ordered.map(c=>c.candidateId),
      excludedCandidateIds: excluded.map(c=>c.candidateId),
      reasons,
      executionAllowed:false
    };
  }
}
