export interface WorkspaceRecoveryRequest {
  recoveryId: string;
  artifactRefs: string[];
  snapshotRef?: string;
  evidenceRefs: string[];
  targetState: 'RESTORE' | 'ROLLBACK' | 'RECONSTRUCT';
  preserveCurrentState: boolean;
  authorityRef?: string;
}

export interface WorkspaceRecoveryPlan {
  recoveryId: string;
  feasible: boolean;
  requiresHumanReview: boolean;
  steps: string[];
  reasons: string[];
  destructiveAllowed: false;
}

export class ABBAWorkspaceRecoveryEngine {
  plan(request: WorkspaceRecoveryRequest): WorkspaceRecoveryPlan {
    const reasons:string[]=[];
    const steps:string[]=['CAPTURE_CURRENT_STATE','VERIFY_SNAPSHOT_OR_LINEAGE','BUILD_RECOVERY_POINT'];
    if(request.evidenceRefs.length===0) reasons.push('RECOVERY_EVIDENCE_REQUIRED');
    if(!request.preserveCurrentState) reasons.push('CURRENT_STATE_PRESERVATION_REQUIRED');
    if(!request.snapshotRef) steps.push('RECONSTRUCT_FROM_LINEAGE');
    else steps.push('VERIFY_SNAPSHOT_INTEGRITY');
    steps.push('PROPOSE_RECOVERY','VERIFY_POST_RECOVERY_STATE','RECONCILE_PROVENANCE');
    return {
      recoveryId:request.recoveryId,
      feasible:reasons.length===0,
      requiresHumanReview:reasons.length>0,
      steps,
      reasons,
      destructiveAllowed:false
    };
  }
}
