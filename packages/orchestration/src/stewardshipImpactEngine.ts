export type ImpactKind = 'VALUE' | 'COST' | 'WASTE' | 'RISK' | 'DEPENDENCY' | 'HUMAN_IMPACT' | 'ENVIRONMENTAL_IMPACT' | 'REVERSIBILITY' | 'CONTINUITY';

export interface StewardshipImpact {
  impactId: string;
  kind: ImpactKind;
  statement: string;
  magnitude: number;
  reversible: boolean;
  affectedRefs: string[];
  evidenceRefs: string[];
  mitigationOptions: string[];
}

export interface StewardshipAssessment {
  impactId: string;
  kind: ImpactKind;
  magnitude: number;
  reversible: boolean;
  preventionRequired: boolean;
  mitigationRequired: boolean;
  reasons: string[];
}

function clamp(v:number){return Math.max(0,Math.min(1,v));}

export class ABBAStewardshipImpactEngine {
  assess(impact: StewardshipImpact): StewardshipAssessment {
    const magnitude=clamp(impact.magnitude);
    const reasons:string[]=[];
    if(impact.evidenceRefs.length===0) reasons.push('IMPACT_EVIDENCE_REQUIRED');
    if(impact.kind==='WASTE' && magnitude>0) reasons.push('WASTE_PREVENTION_REQUIRED');
    if(impact.kind==='RISK' && magnitude>=0.5) reasons.push('RISK_MITIGATION_REQUIRED');
    if(impact.kind==='HUMAN_IMPACT') reasons.push('HUMAN_IMPACT_REVIEW');
    if(!impact.reversible) reasons.push('IRREVERSIBLE_IMPACT');
    return {
      impactId: impact.impactId,
      kind: impact.kind,
      magnitude,
      reversible: impact.reversible,
      preventionRequired: impact.kind==='WASTE' || !impact.reversible,
      mitigationRequired: reasons.includes('RISK_MITIGATION_REQUIRED') || reasons.includes('IRREVERSIBLE_IMPACT'),
      reasons
    };
  }
}


export function assessStewardshipMany(engine: ABBAStewardshipImpactEngine, impacts: StewardshipImpact[]): StewardshipAssessment[] { return impacts.map((impact) => engine.assess(impact)); }
