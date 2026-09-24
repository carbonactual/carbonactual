import { ABBARoleIntelligenceEngine, RoleAssignment, RoleRequirement, RoleAssessment } from './roleIntelligenceEngine';
import { ABBAAccountabilityEngine, Responsibility, AccountabilityCheck } from './accountabilityEngine';

export interface InstitutionalRoleIntelligenceInput {
  assignments:RoleAssignment[];
  requirements:RoleRequirement[];
  responsibilities:Responsibility[];
}

export interface InstitutionalRoleIntelligenceResult {
  roles:RoleAssessment[];
  accountability:AccountabilityCheck[];
  coverageGaps:string[];
  separationConflicts:string[];
  executionAllowed:false;
}

export class ABBAInstitutionalRoleIntelligencePack {
  constructor(
    private readonly roleEngine=new ABBARoleIntelligenceEngine(),
    private readonly accountabilityEngine=new ABBAAccountabilityEngine()
  ) {}

  analyze(input:InstitutionalRoleIntelligenceInput):InstitutionalRoleIntelligenceResult {
    const roles=this.roleEngine.assess(input.assignments,input.requirements);
    const accountability=input.responsibilities.map(responsibility =>
      this.accountabilityEngine.check(
        responsibility,
        input.assignments.map(assignment=>({role:assignment.role,scopeRefs:assignment.scopeRefs,responsibilityRefs:assignment.responsibilityRefs}))
      )
    );
    return {
      roles,
      accountability,
      coverageGaps:accountability.filter(item=>item.gap!=='NONE').map(item=>item.responsibilityId),
      separationConflicts:roles.flatMap(item=>item.conflicts),
      executionAllowed:false
    };
  }
}
