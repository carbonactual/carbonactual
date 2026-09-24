import { ABBACoreSupervisor } from './abbaCoreSupervisor';
import { ABBAEvidenceQualityEngine, EvidenceItem } from './evidenceQualityEngine';
import { buildCompletionProof, CompletionProof } from './completionProof';
import { ABBALiveSubstrateReconciler, LiveSubstrateBindingSpec } from './liveSubstrateReconciler';
import type { ABBAJobDefinition, ABBAControlCycle } from './abbaSupervisor';
import type { DecisionSet, FollowOnJob } from './continuationEngine';
import type { ClosedLoopObjective, ClosedLoopCycleResult } from './closedLoopRuntime';
import type { TelemetrySignal } from './feedbackEngine';
import type { ReconciliationResult } from './reconciliationEngine';

export interface ReconciliationWriter {
  append(input: Record<string, unknown>): Promise<string>;
}

export interface CompletionProofWriter {
  append(input: Record<string, unknown>): Promise<string>;
}

export interface ABBARuntimeCycleInput {
  cycle: ABBAControlCycle;
  signals: TelemetrySignal[];
  objective: ClosedLoopObjective;
  jobDefinitions: ABBAJobDefinition[];
  decisionSet: DecisionSet;
  followOnJobs: FollowOnJob[];
  substrateSpecs: LiveSubstrateBindingSpec[];
  evidenceItems?: EvidenceItem[];
}

export interface ABBARuntimeCycleResult {
  cycle: ClosedLoopCycleResult;
  reconciliations: ReconciliationResult[];
  completionProof: CompletionProof;
  evidenceAssessments: ReturnType<ABBAEvidenceQualityEngine['assess']>[];
  reconciliationRecordIds: string[];
  completionProofRecordId: string;
}

export class ABBARuntimeOrchestrator {
  constructor(
    private readonly coreSupervisor: ABBACoreSupervisor,
    private readonly substrateReconciler: ABBAInternationalSubstrateReconciler,
    private readonly evidenceEngine: ABBAEvidenceQualityEngine,
    private readonly reconciliationWriter: ReconciliationWriter,
    private readonly completionWriter: CompletionProofWriter
  ) {}

  public async run(input: ABBARuntimeCycleInput): Promise<ABBARuntimeCycleResult> {
    const substrateObservations = await this.substrateReconciler.scan(input.substrateSpecs);
    const coreResult = await this.coreSupervisor.observeAndSteer(
      input.cycle,
      input.signals,
      input.objective,
      input.jobDefinitions,
      input.decisionSet,
      input.followOnJobs,
      substrateObservations.map((item) => item.reconciliation)
    );

    const reconciliationRecordIds: string[] = [];
    for (const reconciliation of coreResult.reconciliations) {
      reconciliationRecordIds.push(await this.reconciliationWriter.append({
        cycleId: input.cycle.cycleId,
        canonicalRef: reconciliation.canonicalRef,
        substrateKind: reconciliation.substrateKind,
        substrateRef: reconciliation.substrateRef,
        status: reconciliation.status,
        reason: reconciliation.reason,
        evidenceRefs: reconciliation.evidenceRefs,
        repairRequired: reconciliation.repairRequired,
        provenance: { source: 'ABBARuntimeOrchestrator' }
      }));
    }

    const evidenceAssessments = (input.evidenceItems ?? []).map((item) => this.evidenceEngine.assess(item));
    const evidenceComplete =
      input.evidenceItems !== undefined &&
      input.evidenceItems.length > 0 &&
      evidenceAssessments.every((assessment) => assessment.disposition === 'ACCEPTED');

    const reconciliationComplete =
      substrateObservations.length === input.substrateSpecs.length &&
      coreResult.reconciliations.length === input.substrateSpecs.length &&
      coreResult.reconciliations.every((item) => item.status === 'MATCHED' && !item.repairRequired);

    const blockers = [
      ...coreResult.repairs.map((repair) => `REPAIR_REQUIRED:${repair.action}`),
      ...coreResult.cycle.failures.map((failure) => `CYCLE_FAILURE:${failure.stage}:${failure.reason}`)
    ];

    const completionProof = await buildCompletionProof({
      cycleId: input.cycle.cycleId,
      objective: input.objective.objective,
      evidenceRefs: evidenceAssessments.map((item) => item.evidenceRef),
      evidenceComplete,
      reconciliationComplete,
      outstandingJobIds: coreResult.continuation.nextJobIds,
      blockers,
      terminalReason: coreResult.continuation.reason
    });

    const completionProofRecordId = await this.completionWriter.append({
      cycleId: completionProof.cycleId,
      objective: completionProof.objective,
      completionStatus: completionProof.status,
      evidenceComplete: completionProof.evidenceComplete,
      reconciliationComplete: completionProof.reconciliationComplete,
      outstandingJobIds: completionProof.outstandingJobIds,
      blockers: completionProof.blockers,
      terminalReason: completionProof.terminalReason,
      proofFingerprint: completionProof.proofFingerprint,
      provenance: { source: 'ABBARuntimeOrchestrator', proofId: completionProof.proofId }
    });

    return {
      cycle: coreResult.cycle,
      reconciliations: coreResult.reconciliations,
      completionProof,
      evidenceAssessments,
      reconciliationRecordIds,
      completionProofRecordId
    };
  }
}
