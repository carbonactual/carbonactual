export type LearningStatus = 'OBSERVED' | 'PROVISIONAL' | 'CANDIDATE_FOR_PROMOTION' | 'REJECTED';

export interface LearningObservation {
  observationId: string;
  capabilityRef: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  evidenceRefs: string[];
  provenance: Record<string, unknown>;
  occurredAt: string;
  context: Record<string, unknown>;
}

export interface LearningUpdate {
  learningId: string;
  capabilityRef: string;
  status: LearningStatus;
  confidence: number;
  evidenceRefs: string[];
  provenance: Record<string, unknown>;
  changes: Record<string, unknown>;
  certificationRequired: boolean;
}

export interface CertificationAuthority {
  verify(update: LearningUpdate): Promise<{
    verified: boolean;
    authorityRef?: string;
    credentialRef?: string;
    reason?: string;
  }>;
}

export class ABBALearningEngine {
  constructor(private readonly certificationAuthority?: CertificationAuthority) {}

  public createLearningUpdate(observation: LearningObservation): LearningUpdate {
    const confidence = observation.outcome === 'SUCCESS'
      ? 0.75
      : observation.outcome === 'PARTIAL'
        ? 0.5
        : 0.25;

    return {
      learningId: `learning_${crypto.randomUUID()}`,
      capabilityRef: observation.capabilityRef,
      status: confidence >= 0.75 ? 'CANDIDATE_FOR_PROMOTION' : 'PROVISIONAL',
      confidence,
      evidenceRefs: [...new Set(observation.evidenceRefs)],
      provenance: {
        ...observation.provenance,
        sourceObservationId: observation.observationId
      },
      changes: {
        outcome: observation.outcome,
        context: observation.context
      },
      certificationRequired: confidence >= 0.75
    };
  }

  public async certify(update: LearningUpdate): Promise<LearningUpdate> {
    if (!update.certificationRequired || !this.certificationAuthority) return update;

    const result = await this.certificationAuthority.verify(update);
    if (!result.verified) {
      return {
        ...update,
        status: 'PROVISIONAL',
        certificationRequired: true,
        provenance: {
          ...update.provenance,
          certificationStatus: 'UNVERIFIED',
          certificationReason: result.reason
        }
      };
    }

    return {
      ...update,
      status: 'OBSERVED',
      provenance: {
        ...update.provenance,
        certificationStatus: 'VERIFIED',
        authorityRef: result.authorityRef,
        credentialRef: result.credentialRef
      }
    };
  }
}
