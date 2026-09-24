export interface ArtifactMigrationRequest {
  migrationId: string;
  sourceArtifactRef: string;
  targetArtifactRef: string;
  preserveHistory: boolean;
  preserveProvenance: boolean;
  destructive: boolean;
  evidenceRefs: string[];
  authorityRef?: string;
}

export interface ArtifactMigrationPlan {
  migrationId: string;
  allowed: boolean;
  requiresHumanReview: boolean;
  actions: Array<'COPY' | 'LINK_LINEAGE' | 'VERIFY_FINGERPRINT' | 'ARCHIVE_SOURCE' | 'DELETE_SOURCE' | 'ROLLBACK_POINT'>;
  reasons: string[];
  executionAllowed: false;
}

export class ABBAArtifactMigrationEngine {
  plan(request: ArtifactMigrationRequest): ArtifactMigrationPlan {
    const reasons:string[]=[];
    const actions:ArtifactMigrationPlan['actions']=['COPY','LINK_LINEAGE','VERIFY_FINGERPRINT','ROLLBACK_POINT'];

    if(request.evidenceRefs.length===0) reasons.push('MIGRATION_EVIDENCE_REQUIRED');
    if(!request.preserveHistory) reasons.push('HISTORY_PRESERVATION_REQUIRED');
    if(!request.preserveProvenance) reasons.push('PROVENANCE_PRESERVATION_REQUIRED');
    if(request.destructive) reasons.push('DESTRUCTIVE_MIGRATION_REQUIRES_EXPLICIT_HUMAN_REVIEW');
    if(request.destructive && request.authorityRef) actions.push('ARCHIVE_SOURCE');

    const allowed=!request.destructive && reasons.length===0;
    return {
      migrationId:request.migrationId,
      allowed,
      requiresHumanReview:request.destructive || reasons.length>0,
      actions,
      reasons,
      executionAllowed:false
    };
  }
}
