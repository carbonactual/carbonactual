export type UncertaintyKind = 'UNKNOWN' | 'AMBIGUITY' | 'CONTRADICTION' | 'PROVISIONAL' | 'STALE' | 'MISSING_EVIDENCE' | 'MODEL_LIMITATION';

export interface UncertaintyRecord {
  uncertaintyId: string;
  kind: UncertaintyKind;
  statement: string;
  relatedRefs: string[];
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolutionStrategy: string;
  blocksExecution: boolean;
  provenance: Record<string, unknown>;
}

export interface UncertaintyAssessment {
  uncertaintyId: string;
  kind: UncertaintyKind;
  impact: UncertaintyRecord['impact'];
  blocksExecution: boolean;
  escalationRequired: boolean;
  reasons: string[];
  isTruth: false;
}

export class ABBAUncertaintyLedger {
  assess(record: UncertaintyRecord): UncertaintyAssessment {
    const reasons:string[]=[];
    if(!record.uncertaintyId.trim()) reasons.push('UNCERTAINTY_ID_REQUIRED');
    if(!record.statement.trim()) reasons.push('UNCERTAINTY_STATEMENT_REQUIRED');
    if(!record.resolutionStrategy.trim()) reasons.push('RESOLUTION_STRATEGY_REQUIRED');
    if(record.impact==='CRITICAL') reasons.push('CRITICAL_UNCERTAINTY');
    if(['CONTRADICTION','MISSING_EVIDENCE','UNKNOWN'].includes(record.kind)) reasons.push('EPISTEMIC_GAP');
    return {
      uncertaintyId: record.uncertaintyId,
      kind: record.kind,
      impact: record.impact,
      blocksExecution: record.blocksExecution || record.impact === 'CRITICAL' || record.kind === 'CONTRADICTION',
      escalationRequired: reasons.length>0,
      reasons,
      isTruth:false
    };
  }
}
