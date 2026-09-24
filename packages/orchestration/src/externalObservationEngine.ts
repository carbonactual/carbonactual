import type { SourceRecord } from './sourceIntelligenceEngine';

export interface ExternalObservationEnvelope {
  observationId: string;
  source: SourceRecord;
  observedAt: string;
  subjectRef?: string;
  payload: Record<string, unknown>;
  evidenceRefs: string[];
  realityState: 'OBSERVED' | 'ACTUAL' | 'PLANNED' | 'SIMULATED' | 'ESTIMATED' | 'UNKNOWN';
  provenance: Record<string, unknown>;
}

export interface ExternalObservationAssessment {
  observationId: string;
  accepted: boolean;
  realityState: ExternalObservationEnvelope['realityState'];
  evidenceRefs: string[];
  reasons: string[];
  isTruth: false;
}

export class ABBAExternalObservationEngine {
  accept(envelope: ExternalObservationEnvelope, sourceAssessment: {provenanceAccepted:boolean; freshness:string}): ExternalObservationAssessment {
    const reasons:string[]=[];
    if(!envelope.observationId.trim()) reasons.push('OBSERVATION_ID_REQUIRED');
    if(envelope.evidenceRefs.length===0) reasons.push('OBSERVATION_EVIDENCE_REQUIRED');
    if(!sourceAssessment.provenanceAccepted) reasons.push('SOURCE_PROVENANCE_REJECTED');
    if(sourceAssessment.freshness==='STALE') reasons.push('SOURCE_STALE');
    return {
      observationId:envelope.observationId,
      accepted:reasons.length===0,
      realityState:envelope.realityState,
      evidenceRefs:[...new Set(envelope.evidenceRefs)],
      reasons,
      isTruth:false
    };
  }
}
