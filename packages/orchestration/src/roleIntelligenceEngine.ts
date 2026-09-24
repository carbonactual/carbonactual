export type RoleKind = 'OWNER' | 'ADMINISTRATOR' | 'DIRECTOR' | 'MANAGER' | 'OPERATOR' | 'ENGINEER' | 'AUDITOR' | 'RECONCILER' | 'REGULATOR' | 'ADVISOR' | 'MENTOR' | 'REVIEWER' | 'APPROVER' | 'CONTROLLER' | 'RECOVERY_LEAD' | 'SECURITY_LEAD' | 'OTHER';

export interface RoleAssignment {
  assignmentId:string;
  entityRef:string;
  role:RoleKind;
  scopeRefs:string[];
  responsibilityRefs:string[];
  capabilityRefs:string[];
  authorityRefs:string[];
  permissionRefs:string[];
  validFrom?:string;
  validUntil?:string;
  evidenceRefs:string[];
  provenance:Record<string,unknown>;
}

export interface RoleRequirement {
  requirementId:string;
  role:RoleKind;
  scopeRef:string;
  requiredResponsibilityRefs:string[];
  separationGroup?:string;
  minimumAssignments:number;
}

export interface RoleAssessment {
  assignmentId:string;
  valid:boolean;
  authorityInferred:false;
  conflicts:string[];
  responsibilityCoverage:number;
  reasons:string[];
}

export class ABBARoleIntelligenceEngine {
  assess(assignments:RoleAssignment[], requirements:RoleRequirement[]):RoleAssessment[] {
    const byEntity=new Map<string,RoleAssignment[]>();
    for(const assignment of assignments) {
      byEntity.set(assignment.entityRef,[...(byEntity.get(assignment.entityRef) ?? []),assignment]);
    }
    return assignments.map(assignment=>{
      const reasons:string[]=[];
      const conflicts:string[]=[];
      if(!assignment.assignmentId.trim()) reasons.push('ROLE_ASSIGNMENT_ID_REQUIRED');
      if(assignment.scopeRefs.length===0) reasons.push('ROLE_SCOPE_REQUIRED');
      if(assignment.evidenceRefs.length===0) reasons.push('ROLE_EVIDENCE_REQUIRED');

      for(const other of byEntity.get(assignment.entityRef) ?? []) {
        if(other.assignmentId===assignment.assignmentId) continue;
        if(other.scopeRefs.some(scope=>assignment.scopeRefs.includes(scope)) && assignment.role==='AUDITOR' && other.role==='OPERATOR') conflicts.push('SEGREGATION_OF_DUTIES_AUDITOR_OPERATOR_COLLISION');
        if(other.scopeRefs.some(scope=>assignment.scopeRefs.includes(scope)) && assignment.role==='APPROVER' && other.role==='OPERATOR') conflicts.push('SEGREGATION_OF_DUTIES_APPROVER_OPERATOR_COLLISION');
      }

      const scopedRequirements=requirements.filter(req=>assignment.scopeRefs.includes(req.scopeRef));
      const covered=scopedRequirements.reduce((sum,req)=>sum+(req.requiredResponsibilityRefs.length===0?1:Math.min(1,assignment.responsibilityRefs.filter(ref=>req.requiredResponsibilityRefs.includes(ref)).length/req.requiredResponsibilityRefs.length)),0);
      const responsibilityCoverage=scopedRequirements.length===0?1:Number((covered/scopedRequirements.length).toFixed(6));

      return {
        assignmentId:assignment.assignmentId,
        valid:reasons.every(reason=>!reason.endsWith('_REQUIRED')),
        authorityInferred:false,
        conflicts:[...new Set(conflicts)],
        responsibilityCoverage,
        reasons:[...new Set(reasons)]
      };
    });
  }
}
