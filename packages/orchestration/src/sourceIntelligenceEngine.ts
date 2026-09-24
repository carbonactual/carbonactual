export type SourceKind =
  | 'PRIMARY_OFFICIAL'
  | 'PRIMARY_RESEARCH'
  | 'STANDARD_BODY'
  | 'ACADEMIC'
  | 'PROFESSIONAL'
  | 'COMMUNITY'
  | 'USER_PROVIDED'
  | 'MODEL_DERIVED'
  | 'UNKNOWN';

export interface SourceRecord {
  sourceId: string;
  locator: string;
  kind: SourceKind;
  publisherRef?: string;
  capturedAt: string;
  publishedAt?: string;
  validUntil?: string;
  authorityBasis?: string[];
  independenceGroup?: string;
  integrityVerified: boolean;
  provenance: Record<string, unknown>;
}

export interface SourceAssessment {
  sourceId: string;
  provenanceAccepted: boolean;
  freshness: 'CURRENT' | 'STALE' | 'UNKNOWN';
  independenceGroup?: string;
  authorityStrength: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  reasons: string[];
  isTruth: false;
}

export class ABBASourceIntelligenceEngine {
  assess(source: SourceRecord, now = new Date()): SourceAssessment {
    const reasons:string[]=[];
    if(!source.sourceId.trim()) reasons.push('SOURCE_ID_REQUIRED');
    if(!source.locator.trim()) reasons.push('SOURCE_LOCATOR_REQUIRED');
    if(source.kind==='UNKNOWN') reasons.push('UNKNOWN_SOURCE_KIND');
    if(source.kind==='MODEL_DERIVED') reasons.push('MODEL_DERIVED_SOURCE');
    if(!source.integrityVerified) reasons.push('SOURCE_INTEGRITY_UNVERIFIED');

    const validUntil = source.validUntil ? Date.parse(source.validUntil) : NaN;
    const freshness = Number.isFinite(validUntil)
      ? validUntil < now.getTime() ? 'STALE' as const : 'CURRENT' as const
      : 'UNKNOWN' as const;
    if(freshness==='STALE') reasons.push('SOURCE_STALE');

    const authorityStrength =
      source.kind==='PRIMARY_OFFICIAL' || source.kind==='PRIMARY_RESEARCH' || source.kind==='STANDARD_BODY'
        ? 'HIGH' as const
        : source.kind==='ACADEMIC' || source.kind==='PROFESSIONAL'
          ? 'MEDIUM' as const
          : source.kind==='UNKNOWN' || source.kind==='MODEL_DERIVED'
            ? 'UNKNOWN' as const
            : 'LOW' as const;

    return {
      sourceId:source.sourceId,
      provenanceAccepted: !reasons.some(reason => [
        'SOURCE_ID_REQUIRED',
        'SOURCE_LOCATOR_REQUIRED',
        'UNKNOWN_SOURCE_KIND'
      ].includes(reason)),
      freshness,
      independenceGroup:source.independenceGroup,
      authorityStrength,
      reasons,
      isTruth:false
    };
  }

  assessMany(sources: SourceRecord[], now = new Date()): SourceAssessment[] {
    return sources.map(source => this.assess(source, now));
  }
}
