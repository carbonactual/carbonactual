export type CommunicationIntent =
  | 'INFORM'
  | 'REQUEST'
  | 'CONFIRM'
  | 'CLARIFY'
  | 'NEGOTIATE'
  | 'ESCALATE'
  | 'NOTIFY'
  | 'TRANSACT'
  | 'SUPPORT'
  | 'EDUCATE';

export type ChannelKind =
  | 'CHAT'
  | 'EMAIL'
  | 'SMS'
  | 'VOICE'
  | 'VIDEO'
  | 'PUSH'
  | 'WEB'
  | 'SOCIAL'
  | 'LETTER'
  | 'IN_PERSON'
  | 'BROADCAST'
  | 'API'
  | 'AGENT_TO_AGENT';

export type DeliveryState =
  | 'UNSENT'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'ACKNOWLEDGED'
  | 'BOUNCED'
  | 'FAILED'
  | 'EXPIRED';

export interface CommunicationRequest {
  communicationId: string;
  senderRef: string;
  recipientRef: string;
  intent: CommunicationIntent;
  channel: ChannelKind;
  languageCode?: string;
  modality?: 'TEXT' | 'AUDIO' | 'VIDEO' | 'SIGNED' | 'BRAILLE' | 'VISUAL';
  subject?: string;
  contentRef: string;
  relationshipRef?: string;
  purpose: string;
  dataClass: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET';
  evidenceRefs: string[];
  authorityRef?: string;
  consentRef?: string;
  provenance: Record<string, unknown>;
}

export interface CommunicationAssessment {
  communicationId: string;
  valid: boolean;
  recipientResolved: boolean;
  relationshipResolved: boolean;
  privacyCompliant: boolean;
  authorityRequired: boolean;
  deliveryState: DeliveryState;
  reasons: string[];
  executionAllowed: false;
}

export class ABBACommunicationIntelligenceEngine {
  assess(request: CommunicationRequest, recipientExists: boolean, relationshipExists: boolean): CommunicationAssessment {
    const reasons:string[]=[];
    if(!request.communicationId.trim()) reasons.push('COMMUNICATION_ID_REQUIRED');
    if(!request.senderRef.trim()) reasons.push('COMMUNICATION_SENDER_REQUIRED');
    if(!request.recipientRef.trim()) reasons.push('COMMUNICATION_RECIPIENT_REQUIRED');
    if(!recipientExists) reasons.push('RECIPIENT_UNRESOLVED');
    if(request.contentRef.trim()==='') reasons.push('COMMUNICATION_CONTENT_REQUIRED');
    if(request.evidenceRefs.length===0) reasons.push('COMMUNICATION_EVIDENCE_REQUIRED');
    if(!relationshipExists && request.relationshipRef) reasons.push('RELATIONSHIP_UNRESOLVED');
    if(request.dataClass==='SECRET') reasons.push('SECRET_COMMUNICATION_REQUIRES_EXPLICIT_PRIVACY_ROUTE');
    if(['TRANSACT','REQUEST','NEGOTIATE','ESCALATE'].includes(request.intent) && !request.authorityRef) reasons.push('COMMUNICATION_AUTHORITY_CONTEXT_REQUIRED');
    return {
      communicationId:request.communicationId,
      valid:!reasons.includes('COMMUNICATION_ID_REQUIRED') &&
            !reasons.includes('COMMUNICATION_SENDER_REQUIRED') &&
            !reasons.includes('COMMUNICATION_RECIPIENT_REQUIRED') &&
            !reasons.includes('RECIPIENT_UNRESOLVED') &&
            !reasons.includes('COMMUNICATION_CONTENT_REQUIRED'),
      recipientResolved:recipientExists,
      relationshipResolved:!request.relationshipRef || relationshipExists,
      privacyCompliant:request.dataClass!=='SECRET' || !!request.consentRef,
      authorityRequired:['TRANSACT','REQUEST','NEGOTIATE','ESCALATE'].includes(request.intent),
      deliveryState:'UNSENT',
      reasons:[...new Set(reasons)],
      executionAllowed:false
    };
  }
}
