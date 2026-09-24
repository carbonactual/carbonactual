export interface MissionConstraint {
  constraintId: string;
  type: 'TIME' | 'BUDGET' | 'DATA' | 'RISK' | 'LEGAL' | 'POLICY' | 'RESOURCE' | 'SCOPE' | 'HUMAN';
  statement: string;
  mandatory: boolean;
  provenance: Record<string, unknown>;
}

export interface MissionTask {
  taskId: string;
  objective: string;
  dependsOn: string[];
  requiredCapabilities: string[];
  requiredEvidence: string[];
  resourceRequirements: string[];
  authorityRequired: boolean;
  humanDecisionRequired: boolean;
}

export interface MissionDecomposition {
  missionId: string;
  objective: string;
  constraints: MissionConstraint[];
  successCriteria: string[];
  assumptions: string[];
  uncertainties: string[];
  tasks: MissionTask[];
  criticalPath: string[];
  unresolvedDependencies: string[];
  executionAllowed: false;
}

function unique(xs:string[]){return [...new Set(xs.map(x=>x.trim()).filter(Boolean))];}

export class ABBAMissionDecompositionEngine {
  decompose(input: {
    missionId: string;
    objective: string;
    successCriteria: string[];
    constraints: MissionConstraint[];
    assumptions?: string[];
    uncertainties?: string[];
    tasks: MissionTask[];
  }): MissionDecomposition {
    const tasks = input.tasks.map(task => ({
      ...task,
      dependsOn: unique(task.dependsOn),
      requiredCapabilities: unique(task.requiredCapabilities),
      requiredEvidence: unique(task.requiredEvidence),
      resourceRequirements: unique(task.resourceRequirements),
      authorityRequired: true,
      humanDecisionRequired: task.humanDecisionRequired || false
    }));

    const taskIds = new Set(tasks.map(t=>t.taskId));
    const unresolvedDependencies = unique(
      tasks.flatMap(t => t.dependsOn.filter(dep => !taskIds.has(dep)))
    );

    const incoming = new Map<string,number>(tasks.map(t=>[t.taskId,0]));
    for (const task of tasks) for (const dep of task.dependsOn) if (incoming.has(task.taskId) && incoming.has(dep)) incoming.set(task.taskId,(incoming.get(task.taskId) ?? 0)+1);

    const queue = tasks.filter(t=>incoming.get(t.taskId)===0).map(t=>t.taskId);
    const criticalPath:string[]=[];
    const seen=new Set<string>();
    while(queue.length){
      const id=queue.shift()!;
      if(seen.has(id)) continue;
      seen.add(id); criticalPath.push(id);
      for(const task of tasks.filter(t=>t.dependsOn.includes(id))){
        incoming.set(task.taskId,(incoming.get(task.taskId) ?? 1)-1);
        if(incoming.get(task.taskId)===0) queue.push(task.taskId);
      }
    }

    return {
      missionId: input.missionId,
      objective: input.objective,
      constraints: input.constraints,
      successCriteria: unique(input.successCriteria),
      assumptions: unique(input.assumptions ?? []),
      uncertainties: unique(input.uncertainties ?? []),
      tasks,
      criticalPath,
      unresolvedDependencies,
      executionAllowed: false
    };
  }
}
