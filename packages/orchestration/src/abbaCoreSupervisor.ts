import { ABBAClosedLoopRuntime } from './closedLoopRuntime';
import { ABBAContinuationEngine } from './continuationEngine';
import { ABBAJobSupervisor } from './abbaSupervisor';
import { ABBAReconciliationEngine } from './reconciliationEngine';
import type { ABBAJobDefinition, ABBAControlCycle, ABBAContinuationDecision } from './abbaSupervisor';
import type { ClosedLoopCycleResult, ClosedLoopObjective } from './closedLoopRuntime';
import type { TelemetrySignal } from './feedbackEngine';
import type { ContinuationPlan, DecisionSet, FollowOnJob } from './continuationEngine';
import type { ReconciliationInput, ReconciliationResult, RepairProposal } from './reconciliationEngine';

export interface ABBACoreSupervisorResult {
  cycle: ClosedLoopCycleResult;
  continuation: ABBAContinuationDecision;
  continuationPlan?: ContinuationPlan;
  reconciliations: ReconciliationResult[];
  repairs: RepairProposal[];
}

export class ABBACoreSupervisor {
  constructor(
    private readonly runtime: ABBAClosedLoopRuntime,
    private readonly continuation: ABBAContinuationEngine,
    private readonly jobs: ABBAJobSupervisor,
    private readonly reconciliation: ABBAReconciliationEngine
  ) {}

  public async observeAndSteer(
    cycle: ABBAControlCycle,
    signals: TelemetrySignal[],
    objective: ClosedLoopObjective,
    jobDefinitions: ABBAJobDefinition[],
    decisionSet: DecisionSet,
    followOnJobs: FollowOnJob[],
    reconciliationInputs: ReconciliationInput[] = []
  ): Promise<ABBACoreSupervisorResult> {
    const cycleResult = await this.runtime.executeObservationCycle(signals, objective);

    const continuationDecision = await this.jobs.reconcileCycle(
      cycle,
      jobDefinitions,
      cycleResult.failures
    );

    const continuationPlan = continuationDecision.action === 'CONTINUE'
      ? this.continuation.buildPlan(
          decisionSet,
          'CHOOSE_ALL_AND_CONTINUE',
          followOnJobs
        )
      : undefined;

    const reconciliations = reconciliationInputs.map((input) => this.reconciliation.reconcile(input));
    const repairs = reconciliations
      .map((result) => this.reconciliation.proposeRepair(result))
      .filter((proposal): proposal is RepairProposal => proposal !== null);

    return {
      cycle: cycleResult,
      continuation: continuationDecision,
      continuationPlan,
      reconciliations,
      repairs
    };
  }
}
