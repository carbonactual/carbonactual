export interface Responsibility {
  responsibilityId:string;
  statement:string;
  scopeRef:string;
  evidenceRequired:boolean;
  dualControlRequired:boolean;
  ownerRole?:string;
  backupRole?:string;
  provenance:Record<string,unknown>;
}

export interface AccountabilityCheck {
  responsibilityId:string;
  ownerAssigned:boolean;
  backupAssigned:boolean;
  evidenceCoverage:boolean;
  dualControlSatisfied:boolean;
  gap:'NONE' | 'OWNER_MISSING' | 'BACKUP_MISSING' | 'EVIDENCE_GAP' | 'DUAL_CONTROL_GAP';
  reasons:string[];
  authorityGranted:false;
}

export class ABBAAccountabilityEngine {
  check(
    responsibility:Responsibility,
    assignments:Array<{role:string;scopeRefs:string[];responsibilityRefs:string[]}>
  ):AccountabilityCheck {
    const scoped=assignments.filter(item=>item.scopeRefs.includes(responsibility.scopeRef));
    const ownerAssigned=!!responsibility.ownerRole && scoped.some(item=>item.role===responsibility.ownerRole && item.responsibilityRefs.includes(responsibility.responsibilityId));
    const backupAssigned=!!responsibility.backupRole && scoped.some(item=>item.role===responsibility.backupRole && item.responsibilityRefs.includes(responsibility.responsibilityId));
    const evidenceCoverage=!responsibility.evidenceRequired || scoped.length>0;
    const roles=new Set(scoped.map(item=>item.role).filter(role=>role===responsibility.ownerRole || role===responsibility.backupRole));
    const dualControlSatisfied=!responsibility.dualControlRequired || roles.size>=2;
    const reasons:string[]=[];
    let gap:AccountabilityCheck['gap']='NONE';
    if(!ownerAssigned){gap='OWNER_MISSING';reasons.push('RESPONSIBILITY_OWNER_MISSING');}
    else if(responsibility.backupRole && !backupAssigned){gap='BACKUP_MISSING';reasons.push('RESPONSIBILITY_BACKUP_MISSING');}
    else if(!evidenceCoverage){gap='EVIDENCE_GAP';reasons.push('RESPONSIBILITY_EVIDENCE_GAP');}
    else if(!dualControlSatisfied){gap='DUAL_CONTROL_GAP';reasons.push('DUAL_CONTROL_REQUIRED');}
    return {responsibilityId:responsibility.responsibilityId,ownerAssigned,backupAssigned,evidenceCoverage,dualControlSatisfied,gap,reasons,authorityGranted:false};
  }
}
