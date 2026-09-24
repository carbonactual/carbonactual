export type ContinuationSelection = 'EXPLICIT_OPTIONS' | 'CHOOSE_ALL_AND_CONTINUE';

export interface DecisionOption {
  optionId: string;
  label: string;
  objectiveContribution: string;
  eligible: boolean;
  dependencies?: string[];
  requiredCapabilities?: string[];
  riskClass?: 'LOW' | 'MEDIUM' | 'HIGH';
  authorityRequired?: boolean;
}

export interface FollowOnJob {
  jobId: string;
  title: string;
  reason: string;
  dependsOn: string[];
  requiredCapabilities?: string[];
  riskClass?: 'LOW' | 'MEDIUM' | 'HIGH';
  authorityRequired: true;
  source: 'UNMET_OBJECTIVE' | 'DEPENDENCY' | 'ANOMALY' | 'OUTCOME' | 'RESOURCE' | 'VALUE_FEEDBACK' | 'USER_DEMAND';
}

export interface DecisionSet {
  decisionId: string;
  objective: string;
  options: DecisionOption[];
  allowChooseAll: true;
}

export interface ContinuationPlan {
  decisionId: string;
  selectionMode: ContinuationSelection;
  selectedOptionIds: string[];
  orderedJobs: FollowOnJob[];
  recommendations: FollowOnJob[];
  authorizationRequired: true;
  stopCondition:
    | 'OBJECTIVE_COMPLETE'
    | 'NO_ELIGIBLE_NEXT_JOB'
    | 'AWAITING_HUMAN_AUTHORIZATION'
    | 'MISSING_REQUIRED_EVIDENCE'
    | 'POLICY_DENIED'
    | 'RESOURCE_EXHAUSTED'
    | 'SAFETY_OR_RISK_BOUNDARY'
    | 'REPEATED_NO_PROGRESS'
    | 'EXPLICIT_HUMAN_STOP';
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

function compareJobs(left: FollowOnJob, right: FollowOnJob): number {
  const riskRank = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  const leftRisk = riskRank[left.riskClass ?? 'LOW'];
  const rightRisk = riskRank[right.riskClass ?? 'LOW'];
  if (leftRisk !== rightRisk) return leftRisk - rightRisk;
  return left.jobId.localeCompare(right.jobId);
}

function orderByDependencies(jobs: FollowOnJob[]): FollowOnJob[] {
  const byId = new Map(jobs.map((job) => [job.jobId, job]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: FollowOnJob[] = [];

  const visit = (job: FollowOnJob): void => {
    if (visited.has(job.jobId)) return;
    if (visiting.has(job.jobId)) throw new Error(`DEPENDENCY_CYCLE:${job.jobId}`);
    visiting.add(job.jobId);

    for (const dependencyId of dedupe(job.dependsOn)) {
      const dependency = byId.get(dependencyId);
      if (dependency) visit(dependency);
    }

    visiting.delete(job.jobId);
    visited.add(job.jobId);
    ordered.push(job);
  };

  for (const job of [...jobs].sort(compareJobs)) visit(job);
  return ordered;
}

export class ABBAContinuationEngine {
  constructor(private readonly controlPlaneId = 'ABBA_PRIMARY_CONTROL_PLANE') {}

  public buildPlan(
    decisionSet: DecisionSet,
    selection: ContinuationSelection,
    followOnCandidates: FollowOnJob[] = []
  ): ContinuationPlan {
    const selected = selection === 'CHOOSE_ALL_AND_CONTINUE'
      ? decisionSet.options.filter((option) => option.eligible)
      : decisionSet.options.filter((option) => option.eligible);

    const selectedJobs: FollowOnJob[] = selected.map((option) => ({
      jobId: `option:${option.optionId}`,
      title: option.label,
      reason: option.objectiveContribution,
      dependsOn: option.dependencies ?? [],
      requiredCapabilities: option.requiredCapabilities,
      riskClass: option.riskClass ?? 'LOW',
      authorityRequired: true,
      source: 'USER_DEMAND'
    }));

    const recommendations = followOnCandidates
      .filter((job) => job.jobId && job.title)
      .filter((job, index, all) => all.findIndex((item) => item.jobId === job.jobId) === index);

    const allJobs = [...selectedJobs, ...recommendations]
      .filter((job, index, jobs) => jobs.findIndex((item) => item.jobId === job.jobId) === index);

    const orderedJobs = orderByDependencies(allJobs);

    return {
      decisionId: decisionSet.decisionId,
      selectionMode: selection,
      selectedOptionIds: selected.map((option) => option.optionId),
      orderedJobs,
      recommendations,
      authorizationRequired: true,
      stopCondition: orderedJobs.length ? 'NO_ELIGIBLE_NEXT_JOB' : 'NO_ELIGIBLE_NEXT_JOB'
    };
  }

  public recommendFollowOnJobs(
    completedJob: FollowOnJob,
    signals: Array<{ type: FollowOnJob['source']; reason: string; jobId: string; title: string; dependsOn?: string[] }>
  ): FollowOnJob[] {
    return signals
      .filter((signal) => signal.jobId && signal.title)
      .map((signal) => ({
        jobId: signal.jobId,
        title: signal.title,
        reason: signal.reason,
        dependsOn: dedupe([completedJob.jobId, ...(signal.dependsOn ?? [])]),
        authorityRequired: true,
        source: signal.type
      }));
  }

  public shouldStop(plan: ContinuationPlan, blockers: string[] = []): boolean {
    return plan.orderedJobs.length === 0 || blockers.length > 0;
  }
}

export { orderByDependencies };
