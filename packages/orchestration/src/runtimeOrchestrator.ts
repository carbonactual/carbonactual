import { ABBACoreSupervisor } from './abbaCoreSupervisor';
import { ABBAEvidenceQualityEngine, EvidenceItem } from './evidenceQualityEngine';
import { buildCompletionProof, CompletionProof } from './completionProof';
import { ABBALiveSubstrateReconciler, LiveSubstrateBindingSpec } from './liveSubstrateReconciler';
import { ABBAReasoningAssuranceEngine, ReasoningArtifact, ReasoningAssessment } from './reasoningAssuranceEngine';
import { ABBAMissionIntelligencePack, MissionIntelligenceInput, MissionIntelligenceResult } from './missionIntelligencePack';
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
  reasoningArtifacts?: ReasoningArtifact[];
  missionIntelligenceInput?: MissionIntelligenceInput;
}

export interface ABBARuntimeCycleResult {
  cycle: ClosedLoopCycleResult;
  reconciliations: ReconciliationResult[];
  completionProof: CompletionProof;
  evidenceAssessments: ReturnType<ABBAEvidenceQualityEngine['assess']>[];
  reasoningAssessments: ReasoningAssessment[];
  missionIntelligence?: MissionIntelligenceResult;
  reconciliationRecordIds: string[];
  completionProofRecordId: string;
}

export class ABBARuntimeOrchestrator {
  constructor(
    private readonly coreSupervisor: ABBACoreSupervisor,
    private readonly substrateReconciler: ABBALiveSubstrateReconciler,
    private readonly evidenceEngine: ABBAEvidenceQualityEngine,
    private readonly reasoningEngine: ABBAReasoningAssuranceEngine,
    private readonly missionIntelligencePack: ABBAMissionIntelligencePack,
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
        idempotencyKey: `abba:reconciliation:${input.cycle.cycleId}:${reconciliation.canonicalRef}:${reconciliation.substrateKind}:${reconciliation.substrateRef}:${reconciliation.status}`,
        provenance: { source: 'ABBARuntimeOrchestrator' }
      }));
    }

    const evidenceAssessments = (input.evidenceItems ?? []).map((item) => this.evidenceEngine.assess(item));
    const reasoningAssessments = this.reasoningEngine.assessMany(input.reasoningArtifacts ?? []);
    const missionIntelligence = input.missionIntelligenceInput
      ? this.missionIntelligencePack.analyze(input.missionIntelligenceInput)
      : undefined;
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
      ...coreResult.cycle.failures.map((failure) => `CYCLE_FAILURE:${failure.stage}:${failure.reason}`),
      ...reasoningAssessments.filter((assessment) => !assessment.valid).map((assessment) => `REASONING_BOUNDARY:${assessment.artifactId}:${assessment.reasons.join('|')}`),
      ...(missionIntelligence?.intent.clarificationRequired ? ['INTENT_CLARIFICATION_REQUIRED'] : []),
      ...(missionIntelligence?.decomposition.unresolvedDependencies ?? []).map((dep) => `MISSION_DEPENDENCY_UNRESOLVED:${dep}`),
      ...(missionIntelligence?.uncertainties.filter((item) => item.blocksExecution).map((item) => `UNCERTAINTY_BLOCKER:${item.uncertaintyId}`) ?? []),
      ...(missionIntelligence?.stewardship.filter((item) => item.mitigationRequired).map((item) => `STEWARDSHIP_MITIGATION_REQUIRED:${item.impactId}`) ?? [])
    ];

    const completionProof = await buildCompletionProof({
      cycleId: input.cycle.cycleId,
      objective: input.objective.objective,
      evidenceRefs: [...evidenceAssessments.map((item) => item.evidenceRef), ...reasoningAssessments.map((item) => `reasoning:${item.artifactId}`)],
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
      provenance: {
        source: 'ABBARuntimeOrchestrator',
        proofId: completionProof.proofId,
        evidenceAssessments,
        reasoningAssessments,
        missionIntelligence
      }
    });

    return {
      cycle: coreResult.cycle,
      reconciliations: coreResult.reconciliations,
      completionProof,
      evidenceAssessments,
      reasoningAssessments,
      missionIntelligence,
      reconciliationRecordIds,
      completionProofRecordId
    };
  }
}
