export interface HumanAuthorizationRecord {
  authorizationId: string;
  humanRef: string;
  decisionRef: string;
  decision: 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  scope: string[];
  authorityRef?: string;
  signatureRef?: string;
  evidenceRefs: string[];
  decidedAt: string;
  expiresAt?: string;
  provenance: Record<string, unknown>;
}

export interface AuthorizationAssessment {
  authorizationId: string;
  valid: boolean;
  reasons: string[];
  mayBePresentedToAuthorityGate: boolean;
  grantsAuthority: false;
}

export class ABBAHumanAuthorizationBoundary {
  assess(record: HumanAuthorizationRecord, now = new Date()): AuthorizationAssessment {
    const reasons:string[]=[];
    if(!record.authorizationId.trim()) reasons.push('AUTHORIZATION_ID_REQUIRED');
    if(!record.humanRef.trim()) reasons.push('HUMAN_REF_REQUIRED');
    if(!record.decisionRef.trim()) reasons.push('DECISION_REF_REQUIRED');
    if(record.evidenceRefs.length===0) reasons.push('AUTHORIZATION_EVIDENCE_REQUIRED');
    if(record.decision!=='APPROVED') reasons.push('AUTHORIZATION_NOT_APPROVED');
    if(record.expiresAt && Date.parse(record.expiresAt)<=now.getTime()) reasons.push('AUTHORIZATION_EXPIRED');
    return {
      authorizationId:record.authorizationId,
      valid:reasons.length===0,
      reasons,
      mayBePresentedToAuthorityGate:reasons.length===0,
      grantsAuthority:false
    };
  }
}
