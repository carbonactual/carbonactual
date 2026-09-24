export type CompetencyLevel = 'FOUNDATION' | 'PRACTICE' | 'PROFESSIONAL' | 'SPECIALIST' | 'MASTER' | 'EMERITUS';
export type CertificationStatus = 'REQUESTED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED';

export interface LearningEvidence {
  evidenceId: string;
  evidenceType: 'COURSE' | 'ASSESSMENT' | 'PRACTICE' | 'PROJECT' | 'EXAM' | 'DIPLOMA' | 'DEGREE' | 'PROFESSIONAL_CREDENTIAL' | 'OTHER';
  capabilityRef: string;
  artifactRefs: string[];
  provenance: Record<string, unknown>;
  observedAt: string;
}

export interface CertificationRequest {
  requestId: string;
  capabilityRef: string;
  targetLevel: CompetencyLevel;
  evidence: LearningEvidence[];
}

export interface CertificationResult {
  requestId: string;
  status: CertificationStatus;
  issuer: string;
  credentialRef?: string;
  verificationEvidenceRefs: string[];
  reason?: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface CertificationProvider {
  issuerId: string;
  verify(request: CertificationRequest): Promise<CertificationResult>;
}

export interface CompetencyState {
  capabilityRef: string;
  level: CompetencyLevel;
  certificationStatus: CertificationStatus;
  confidence: number;
  credentialRef?: string;
  issuerRef?: string;
  evidenceRefs: string[];
  provenance: Record<string, unknown>;
}

const levelRank: Record<CompetencyLevel, number> = {
  FOUNDATION: 1,
  PRACTICE: 2,
  PROFESSIONAL: 3,
  SPECIALIST: 4,
  MASTER: 5,
  EMERITUS: 6
};

export class ABBACertificationEngine {
  constructor(private readonly provider: CertificationProvider) {}

  public buildRequest(
    capabilityRef: string,
    targetLevel: CompetencyLevel,
    evidence: LearningEvidence[]
  ): CertificationRequest {
    if (!evidence.length) throw new Error('CERTIFICATION_EVIDENCE_REQUIRED');
    return {
      requestId: `cert_request_${crypto.randomUUID()}`,
      capabilityRef,
      targetLevel,
      evidence
    };
  }

  public async verify(request: CertificationRequest): Promise<CertificationResult> {
    const result = await this.provider.verify(request);

    if (result.status !== 'VERIFIED') {
      return {
        ...result,
        status: result.status === 'EXPIRED' ? 'EXPIRED' : 'REJECTED'
      };
    }

    if (result.issuer === 'ABBA') {
      return {
        ...result,
        status: 'REJECTED',
        reason: 'SELF_CERTIFICATION_FORBIDDEN'
      };
    }

    return result;
  }

  public applyResult(
    previous: CompetencyState | null,
    result: CertificationResult,
    request: CertificationRequest
  ): CompetencyState {
    const priorRank = previous ? levelRank[previous.level] : 0;
    const requestedRank = levelRank[request.targetLevel];
    const verified = result.status === 'VERIFIED';

    const level = verified && requestedRank >= priorRank
      ? request.targetLevel
      : previous?.level ?? 'FOUNDATION';

    return {
      capabilityRef: request.capabilityRef,
      level,
      certificationStatus: result.status,
      confidence: verified ? 1 : previous?.confidence ?? 0,
      credentialRef: result.credentialRef ?? previous?.credentialRef,
      issuerRef: verified ? result.issuer : previous?.issuerRef,
      evidenceRefs: [...new Set([
        ...(previous?.evidenceRefs ?? []),
        ...request.evidence.flatMap((item) => item.artifactRefs),
        ...result.verificationEvidenceRefs
      ])],
      provenance: {
        ...(previous?.provenance ?? {}),
        certificationRequestId: request.requestId,
        certificationIssuer: result.issuer,
        certificationReason: result.reason
      }
    };
  }

  public nextLearningLevel(state: CompetencyState): CompetencyLevel | null {
    const next = Object.entries(levelRank).find(([, rank]) => rank === levelRank[state.level] + 1);
    return next ? (next[0] as CompetencyLevel) : null;
  }
}
