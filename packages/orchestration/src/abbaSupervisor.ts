import type { ClosedLoopFailure } from './closedLoopRuntime';

export type JobRunStatus =
  | 'READY'
  | 'RUNNING'
  | 'BLOCKED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRY_WAIT'
  | 'CANCELLED';

export interface ABBAJobDefinition {
  jobId: string;
  name: string;
  phase: string;
  dependsOn: string[];
  output: string;
}

export interface ABBAJobRun {
  cycleId: string;
  jobId: string;
  status: JobRunStatus;
  attempt: number;
  idempotencyKey: string;
  leasedBy?: string;
  leaseExpiresAt?: string;
  output?: Record<string, unknown>;
  error?: string;
}

export interface ABBAControlCycle {
  cycleId: string;
  objective: string;
  status: 'RUNNING' | 'WAITING_AUTHORIZATION' | 'BLOCKED' | 'COMPLETED' | 'STOPPED';
  terminalReason?: string;
}

export interface ABBAContinuationDecision {
  action: 'CONTINUE' | 'STOP' | 'WAIT';
  reason: string;
  nextJobIds: string[];
}

export interface JobRunStore {
  loadCycle(cycleId: string): Promise<ABBAControlCycle | null>;
  loadRuns(cycleId: string): Promise<ABBAJobRun[]>;
  upsertCycle(cycle: ABBAControlCycle): Promise<void>;
  upsertRun(run: ABBAJobRun): Promise<void>;
}

export interface SubstrateBinding {
  canonicalRef: string;
  substrateKind: 'LEGACY_ABBA' | 'PROCESS_TASK' | 'RUNTIME_RECORD' | 'ECONOMIC_RECORD' | 'CUSTOM';
  substrateRef: string;
  status: 'BOUND' | 'UNBOUND' | 'STALE' | 'CONTESTED';
  provenance: Record<string, unknown>;
}

export interface SubstrateBindingStore {
  find(canonicalRef: string): Promise<SubstrateBinding[]>;
  bind(binding: SubstrateBinding): Promise<void>;
}

export interface ABBAJobSupervisorOptions {
  maxAttempts?: number;
  leaseSeconds?: number;
}

export class ABBAJobSupervisor {
  private readonly maxAttempts: number;
  private readonly leaseSeconds: number;

  constructor(
    private readonly jobStore: JobRunStore,
    private readonly bindingStore: SubstrateBindingStore,
    options: ABBAJobSupervisorOptions = {}
  ) {
    this.maxAttempts = options.maxAttempts ?? 3;
    this.leaseSeconds = options.leaseSeconds ?? 120;
  }

  public async reconcileCycle(
    cycle: ABBAControlCycle,
    jobs: ABBAJobDefinition[],
    failures: ClosedLoopFailure[] = []
  ): Promise<ABBAContinuationDecision> {
    await this.jobStore.upsertCycle(cycle);
    const runs = await this.jobStore.loadRuns(cycle.cycleId);
    const failedJobIds = new Set(failures.map((failure) => failure.signalId));

    const completed = new Set(
      runs.filter((run) => run.status === 'SUCCEEDED').map((run) => run.jobId)
    );
    const active = runs.filter((run) => ['RUNNING', 'RETRY_WAIT'].includes(run.status));

    const blockedByFailure = failures.some((failure) =>
      ['PERSIST_OBSERVATION', 'PERSIST_RESPONSE', 'PERSIST_PROPOSAL', 'DISCOVER'].includes(failure.stage)
    );

    if (blockedByFailure) {
      await this.jobStore.upsertCycle({
        ...cycle,
        status: 'BLOCKED',
        terminalReason: 'DEPENDENCY_OR_PERSISTENCE_FAILURE'
      });
      return {
        action: 'STOP',
        reason: 'DEPENDENCY_OR_PERSISTENCE_FAILURE',
        nextJobIds: []
      };
    }

    if (active.length > 0) {
      return {
        action: 'CONTINUE',
        reason: 'ACTIVE_JOBS_REMAIN',
        nextJobIds: active.map((run) => run.jobId)
      };
    }

    const nextJobs = jobs.filter((job) =>
      !completed.has(job.jobId) &&
      !failedJobIds.has(job.jobId) &&
      job.dependsOn.every((dependency) => completed.has(dependency))
    );

    if (nextJobs.length > 0) {
      return {
        action: 'CONTINUE',
        reason: 'ELIGIBLE_DEPENDENT_JOBS_AVAILABLE',
        nextJobIds: nextJobs.map((job) => job.jobId)
      };
    }

    const unresolved = jobs.filter((job) => !completed.has(job.jobId));
    if (unresolved.length > 0) {
      await this.jobStore.upsertCycle({
        ...cycle,
        status: 'WAITING_AUTHORIZATION',
        terminalReason: 'UNRESOLVED_DEPENDENCIES_OR_AUTHORIZATION'
      });
      return {
        action: 'WAIT',
        reason: 'UNRESOLVED_DEPENDENCIES_OR_AUTHORIZATION',
        nextJobIds: unresolved.map((job) => job.jobId)
      };
    }

    await this.jobStore.upsertCycle({
      ...cycle,
      status: 'COMPLETED',
      terminalReason: 'OBJECTIVE_COMPLETE'
    });

    return {
      action: 'STOP',
      reason: 'OBJECTIVE_COMPLETE',
      nextJobIds: []
    };
  }

  public createReadyRun(cycleId: string, job: ABBAJobDefinition, attempt = 1): ABBAJobRun {
    return {
      cycleId,
      jobId: job.jobId,
      status: 'READY',
      attempt,
      idempotencyKey: `abba:job:${cycleId}:${job.jobId}`
    };
  }

  public claimRun(run: ABBAJobRun, workerId: string, now = new Date()): ABBAJobRun {
    const leaseExpiresAt = new Date(now.getTime() + this.leaseSeconds * 1000).toISOString();
    return {
      ...run,
      status: 'RUNNING',
      leasedBy: workerId,
      leaseExpiresAt
    };
  }

  public checkpointFailure(run: ABBAJobRun, error: string): ABBAJobRun {
    const nextAttempt = run.attempt + 1;
    if (nextAttempt > this.maxAttempts) {
      return { ...run, status: 'FAILED', error, attempt: run.attempt };
    }

    return {
      ...run,
      status: 'RETRY_WAIT',
      attempt: nextAttempt,
      error
    };
  }

  public async assertBinding(canonicalRef: string): Promise<SubstrateBinding[]> {
    return this.bindingStore.find(canonicalRef);
  }
}
