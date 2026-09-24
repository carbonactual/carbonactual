export type MasteryState =
  | 'UNASSESSED' | 'LEARNING' | 'PRACTICED' | 'ASSESSED' | 'VERIFICATION_REQUESTED'
  | 'VERIFIED' | 'CERTIFIED' | 'STALE' | 'SUPERSEDED';

export interface MasteryRecord {
  capabilityRef: string;
  level: 'FOUNDATION' | 'PRACTICE' | 'PROFESSIONAL' | 'SPECIALIST' | 'MASTER' | 'EMERITUS';
  state: MasteryState;
  evidenceRefs: string[];
  credentialRefs: string[];
  issuerRefs: string[];
  lastAssessedAt?: string;
  nextReassessmentAt?: string;
  provenance: Record<string, unknown>;
}

export interface MasteryAssessment {
  capabilityRef: string;
  currentState: MasteryState;
  currentLevel: MasteryRecord['level'];
  promotable: boolean;
  externalVerificationRequired: boolean;
  decayDetected: boolean;
  reasons: string[];
  grantsAuthority: false;
}

const order = ['FOUNDATION','PRACTICE','PROFESSIONAL','SPECIALIST','MASTER','EMERITUS'];

export class ABBAMasteryEngine {
  assess(record: MasteryRecord, now = new Date()): MasteryAssessment {
    const reasons:string[]=[];
    if(record.evidenceRefs.length===0) reasons.push('MASTERY_EVIDENCE_REQUIRED');
    const decayDetected = !!record.nextReassessmentAt && Date.parse(record.nextReassessmentAt) < now.getTime();
    if(decayDetected) reasons.push('MASTERY_REASSESSMENT_DUE');
    const externalVerificationRequired = order.indexOf(record.level) >= order.indexOf('MASTER');
    if(externalVerificationRequired && record.credentialRefs.length===0) reasons.push('EXTERNAL_CREDENTIAL_REQUIRED');
    if(record.state==='SUPERSEDED') reasons.push('MASTERY_SUPERSEDED');
    if(record.state==='STALE') reasons.push('MASTERY_STALE');
    return {
      capabilityRef: record.capabilityRef,
      currentState: record.state,
      currentLevel: record.level,
      promotable:
        record.state !== 'SUPERSEDED' &&
        record.evidenceRefs.length > 0 &&
        (!externalVerificationRequired || record.credentialRefs.length > 0),
      externalVerificationRequired,
      decayDetected,
      reasons,
      grantsAuthority: false
    };
  }
}
