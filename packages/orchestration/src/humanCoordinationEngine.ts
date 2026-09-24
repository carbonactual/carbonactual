export type HumanCoordinationRequestType =
  | 'CLARIFICATION'
  | 'AUTHORIZATION'
  | 'CONSENT'
  | 'REVIEW'
  | 'ESCALATION'
  | 'NOTIFICATION';

export type HumanCoordinationStatus =
  | 'REQUESTED'
  | 'ACKNOWLEDGED'
  | 'RECEIVED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'RESOLVED'
  | 'CANCELLED';

export interface HumanCoordinationRequest {
  requestId: string;
  type: HumanCoordinationRequestType;
  humanRef: string;
  objective: string;
  contextRefs: string[];
  evidenceRefs: string[];
  decisionRequired: boolean;
  expiresAt: string;
  status: HumanCoordinationStatus;
  minimumContext: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface HumanCoordinationAssessment {
  requestId: string;
  valid: boolean;
  blocking: boolean;
  status: HumanCoordinationStatus;
  reasons: string[];
  canResolveAutomatically: false;
  humanAuthorityRequired: boolean;
}

export class ABBAHumanCoordinationEngine {
  assess(request: HumanCoordinationRequest, now = new Date()): HumanCoordinationAssessment {
    const reasons:string[]=[];
    if(!request.requestId.trim()) reasons.push('HUMAN_REQUEST_ID_REQUIRED');
    if(!request.humanRef.trim()) reasons.push('HUMAN_REF_REQUIRED');
    if(!request.objective.trim()) reasons.push('HUMAN_REQUEST_OBJECTIVE_REQUIRED');
    if(request.contextRefs.length===0) reasons.push('MINIMUM_CONTEXT_REQUIRED');
    if(request.decisionRequired && request.type==='AUTHORIZATION' && request.evidenceRefs.length===0) reasons.push('AUTHORIZATION_EVIDENCE_REQUIRED');
    const expiry=Date.parse(request.expiresAt);
    if(!Number.isFinite(expiry)) reasons.push('HUMAN_REQUEST_EXPIRY_INVALID');
    if(Number.isFinite(expiry) && expiry <= now.getTime()) reasons.push('HUMAN_REQUEST_EXPIRED');
    const blocking=request.type==='AUTHORIZATION' || request.type==='CONSENT' || request.type==='CLARIFICATION' || request.type==='REVIEW' || reasons.includes('HUMAN_REQUEST_EXPIRED');
    return {
      requestId:request.requestId,
      valid:reasons.every(reason=>![
        'HUMAN_REQUEST_ID_REQUIRED','HUMAN_REF_REQUIRED','HUMAN_REQUEST_OBJECTIVE_REQUIRED',
        'MINIMUM_CONTEXT_REQUIRED','AUTHORIZATION_EVIDENCE_REQUIRED','HUMAN_REQUEST_EXPIRY_INVALID'
      ].includes(reason)),
      blocking,
      status:request.status,
      reasons,
      canResolveAutomatically:false,
      humanAuthorityRequired:request.type==='AUTHORIZATION' || request.type==='CONSENT' || request.type==='CLARIFICATION' || request.type==='REVIEW'
    };
  }
}
