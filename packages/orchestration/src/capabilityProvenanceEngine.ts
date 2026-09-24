export type CapabilityProvenanceKind = 'CANONICAL_CONTRACT' | 'EXTERNAL_CERTIFICATION' | 'VERIFIED_PROVIDER' | 'OBSERVED_RUNTIME' | 'SELF_ASSERTED' | 'UNKNOWN';

export interface CapabilityProvenanceRecord {
  capabilityRef: string;
  entityRef: string;
  provenanceKind: CapabilityProvenanceKind;
  sourceRef: string;
  verifiedAt?: string;
  expiryAt?: string;
  evidenceRefs: string[];
  availability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  operationalRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CapabilityProvenanceAssessment {
  capabilityRef: string;
  entityRef: string;
  provenanceKind: CapabilityProvenanceKind;
  provenanceAccepted: boolean;
  availability: CapabilityProvenanceRecord['availability'];
  executionEligible: false;
  authorityEligible: false;
  permissionGranted: false;
  reasons: string[];
}

export class ABBACapabilityProvenanceEngine {
  assess(record: CapabilityProvenanceRecord): CapabilityProvenanceAssessment {
    const reasons: string[] = [];
    if (!record.capabilityRef.trim()) reasons.push('CAPABILITY_REF_REQUIRED');
    if (!record.entityRef.trim()) reasons.push('ENTITY_REF_REQUIRED');
    if (!record.sourceRef.trim()) reasons.push('PROVENANCE_SOURCE_REQUIRED');
    if (record.evidenceRefs.length === 0) reasons.push('CAPABILITY_PROVENANCE_EVIDENCE_REQUIRED');
    if (record.provenanceKind === 'UNKNOWN') reasons.push('UNKNOWN_PROVENANCE');
    if (record.provenanceKind === 'SELF_ASSERTED') reasons.push('SELF_ASSERTED_CAPABILITY_REQUIRES_INDEPENDENT_VERIFICATION');
    if (record.operationalRisk === 'CRITICAL') reasons.push('CRITICAL_CAPABILITY_RISK');
    if (record.availability === 'UNKNOWN') reasons.push('CAPABILITY_AVAILABILITY_UNKNOWN');
    return {
      capabilityRef: record.capabilityRef,
      entityRef: record.entityRef,
      provenanceKind: record.provenanceKind,
      provenanceAccepted: reasons.every((reason) => !['CAPABILITY_REF_REQUIRED','ENTITY_REF_REQUIRED','PROVENANCE_SOURCE_REQUIRED','CAPABILITY_PROVENANCE_EVIDENCE_REQUIRED','UNKNOWN_PROVENANCE'].includes(reason)),
      availability: record.availability,
      executionEligible: false,
      authorityEligible: false,
      permissionGranted: false,
      reasons
    };
  }

  assessMany(records: CapabilityProvenanceRecord[]): CapabilityProvenanceAssessment[] {
    return records.map((record) => this.assess(record));
  }
}
