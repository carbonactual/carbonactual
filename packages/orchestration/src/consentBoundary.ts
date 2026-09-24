export interface ConsentRequest {
  consentId: string;
  humanRef: string;
  purpose: string;
  scope: string[];
  consequences: string[];
  expiresAt: string;
  evidenceRefs: string[];
  provenance: Record<string, unknown>;
}

export interface ConsentDecision {
  consentId: string;
  status: 'PENDING' | 'GRANTED' | 'DECLINED' | 'EXPIRED';
  recordedBy: string;
  recordedAt: string;
  scope: string[];
  evidenceRefs: string[];
  authorityRef?: string;
  isInferred: false;
}

export class ABBAConsentBoundary {
  request(input: ConsentRequest): ConsentDecision {
    return {
      consentId:input.consentId,
      status:'PENDING',
      recordedBy:'ABBA',
      recordedAt:new Date().toISOString(),
      scope:[...input.scope],
      evidenceRefs:[...input.evidenceRefs],
      isInferred:false
    };
  }

  acceptExternalDecision(decision: Omit<ConsentDecision,'isInferred'>): ConsentDecision {
    if (!decision.recordedBy.trim()) throw new Error('CONSENT_RECORDED_BY_REQUIRED');
    return { ...decision, isInferred:false };
  }
}
