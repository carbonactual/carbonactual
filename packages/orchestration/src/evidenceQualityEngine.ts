export type EvidenceKind =
  | 'DIRECT_SYSTEM'
  | 'EXTERNAL_PROVIDER'
  | 'HUMAN_ATTESTATION'
  | 'DERIVED_ANALYSIS'
  | 'PROVISIONAL';

export type EvidenceDisposition = 'ACCEPTED' | 'PROVISIONAL' | 'CONTESTED' | 'INSUFFICIENT';

export interface EvidenceItem {
  evidenceRef: string;
  kind: EvidenceKind;
  source: string;
  capturedAt: string;
  verified: boolean;
  integrityScore: number;
  supportsClaimRefs?: string[];
  contradictsClaimRefs?: string[];
}

export interface EvidenceAssessment {
  evidenceRef: string;
  disposition: EvidenceDisposition;
  integrityScore: number;
  reasons: string[];
  isTruth: false;
  requiresIndependentVerification: boolean;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class ABBAEvidenceQualityEngine {
  public assess(item: EvidenceItem): EvidenceAssessment {
    const integrity = clamp(item.integrityScore);
    const reasons: string[] = [];

    if (!item.evidenceRef.trim() || !item.source.trim()) reasons.push('EVIDENCE_IDENTITY_INCOMPLETE');
    if (!item.verified) reasons.push('EVIDENCE_NOT_VERIFIED');
    if (item.contradictsClaimRefs?.length) reasons.push('EVIDENCE_CONTRADICTS_CLAIMS');
    if (item.kind === 'EXTERNAL_PROVIDER') reasons.push('EXTERNAL_PROVIDER_REQUIRES_SOURCE_BOUNDARY');
    if (item.kind === 'DERIVED_ANALYSIS') reasons.push('DERIVED_ANALYSIS_IS_NOT_PRIMARY_OBSERVATION');
    if (item.kind === 'PROVISIONAL') reasons.push('PROVISIONAL_EVIDENCE_REQUIRES_REVIEW');

    const disposition: EvidenceDisposition =
      reasons.includes('EVIDENCE_IDENTITY_INCOMPLETE') || integrity < 0.25
        ? 'INSUFFICIENT'
        : item.contradictsClaimRefs?.length
          ? 'CONTESTED'
          : !item.verified || integrity < 0.75
            ? 'PROVISIONAL'
            : 'ACCEPTED';

    return {
      evidenceRef: item.evidenceRef,
      disposition,
      integrityScore: Number(integrity.toFixed(6)),
      reasons,
      isTruth: false,
      requiresIndependentVerification: disposition !== 'ACCEPTED'
    };
  }
}
