export interface EvidenceClaim {
  claimId: string;
  statement: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  resultRefs: string[];
  contradictionRefs: string[];
  provenance: Record<string, unknown>;
}

export interface EvidenceChainAssessment {
  claimId: string;
  valid: boolean;
  corroborationCount: number;
  independentSourceGroupCount: number;
  hasContradictions: boolean;
  missingEvidence: boolean;
  confidence: number;
  reasons: string[];
  isTruth: false;
}

function clamp(v:number){return Math.max(0,Math.min(1,v));}
function unique(xs:string[]){return [...new Set(xs.map(x=>x.trim()).filter(Boolean))];}

export class ABBAEvidenceChainEngine {
  assess(claim: EvidenceClaim, sourceAssessments: Array<{sourceId:string; independenceGroup?:string; provenanceAccepted:boolean}>): EvidenceChainAssessment {
    const reasons:string[]=[];
    const sourceRefs=unique(claim.sourceRefs);
    const evidenceRefs=unique(claim.evidenceRefs);
    const resultRefs=unique(claim.resultRefs);
    const contradictionRefs=unique(claim.contradictionRefs);
    if(!claim.claimId.trim()) reasons.push('CLAIM_ID_REQUIRED');
    if(!claim.statement.trim()) reasons.push('CLAIM_STATEMENT_REQUIRED');
    if(sourceRefs.length===0) reasons.push('CLAIM_SOURCE_REQUIRED');
    if(evidenceRefs.length===0) reasons.push('CLAIM_EVIDENCE_REQUIRED');

    const usable=sourceAssessments.filter(source => sourceRefs.includes(source.sourceId) && source.provenanceAccepted);
    const groups=new Set(usable.map(source=>source.independenceGroup).filter(Boolean));
    if(usable.length===0) reasons.push('NO_PROVENANCE_ACCEPTED_SOURCE');
    if(usable.length>0 && groups.size===0) reasons.push('SOURCE_INDEPENDENCE_UNKNOWN');
    if(contradictionRefs.length>0) reasons.push('CLAIM_CONTRADICTED');
    if(resultRefs.length===0) reasons.push('NO_RESULT_BASIS');

    const corroboration=Math.max(0,usable.length-1);
    const confidence=clamp(
      0.25 +
      Math.min(0.35,usable.length*0.1) +
      Math.min(0.25,groups.size*0.125) +
      Math.min(0.15,resultRefs.length*0.05) -
      Math.min(0.5,contradictionRefs.length*0.2)
    );

    return {
      claimId:claim.claimId,
      valid:!reasons.some(reason => [
        'CLAIM_ID_REQUIRED','CLAIM_STATEMENT_REQUIRED','CLAIM_SOURCE_REQUIRED',
        'CLAIM_EVIDENCE_REQUIRED','NO_PROVENANCE_ACCEPTED_SOURCE'
      ].includes(reason)),
      corroborationCount:corroboration,
      independentSourceGroupCount:groups.size,
      hasContradictions:contradictionRefs.length>0,
      missingEvidence:evidenceRefs.length===0,
      confidence:Number(confidence.toFixed(6)),
      reasons:unique(reasons),
      isTruth:false
    };
  }
}
