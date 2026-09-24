import { ABBACoreSupervisor } from './abbaCoreSupervisor';
import { ABBAEvidenceQualityEngine, EvidenceItem } from './evidenceQualityEngine';
import { buildCompletionProof, CompletionProof } from './completionProof';
import { ABBALiveSubstrateReconciler, LiveSubstrateBindingSpec } from './liveSubstrateReconciler';
import { ABBAReasoningAssuranceEngine, ReasoningArtifact, ReasoningAssessment } from './reasoningAssuranceEngine';
import { ABBAMissionIntelligencePack, MissionIntelligenceInput, MissionIntelligenceResult } from './missionIntelligencePack';
import { ABBAEvidenceSourceIntelligencePack, EvidenceSourceIntelligenceInput, EvidenceSourceIntelligenceResult } from './evidenceSourceIntelligencePack';
import { ABBAHumanCoordinationPack, HumanCoordinationInput, HumanCoordinationResult, HumanCoordinationStore } from './humanCoordinationPack';
import { ABBAUniversalKnowledgeMasteryPack, UniversalKnowledgeMasteryInput, UniversalKnowledgeMasteryResult } from './universalKnowledgeMasteryPack';
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
  knowledgeMasteryInput?: UniversalKnowledgeMasteryInput;
  evidenceSourceIntelligenceInput?: EvidenceSourceIntelligenceInput;
  humanCoordinationInput?: HumanCoordinationInput;
}

export interface ABBARuntimeCycleResult {
  cycle: ClosedLoopCycleResult;
  reconciliations: ReconciliationResult[];
  completionProof: CompletionProof;
  evidenceAssessments: ReturnType<ABBAEvidenceQualityEngine['assess']>[];
  reasoningAssessments: ReasoningAssessment[];
  missionIntelligence?: MissionIntelligenceResult;
  knowledgeMastery?: UniversalKnowledgeMasteryResult;
  evidenceSourceIntelligence?: EvidenceSourceIntelligenceResult;
  humanCoordination?: HumanCoordinationResult;
  humanCoordinationRequestIds: string[];
  humanDecisionIds: string[];
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
    private readonly knowledgeMasteryPack: ABBAUniversalKnowledgeMasteryPack,
    private readonly evidenceSourceIntelligencePack: ABBAEvidenceSourceIntelligencePack,
    private readonly humanCoordinationPack: ABBAHumanCoordinationPack,
    private readonly reconciliationWriter: ReconciliationWriter,
    private readonly completionWriter: CompletionProofWriter,
    private readonly humanCoordinationStore: HumanCoordinationStore | undefined = undefined
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
    const knowledgeMastery = input.knowledgeMasteryInput
      ? this.knowledgeMasteryPack.assess(input.knowledgeMasteryInput)
      : undefined;
    const evidenceSourceIntelligence = input.evidenceSourceIntelligenceInput
      ? this.evidenceSourceIntelligencePack.analyze(input.evidenceSourceIntelligenceInput)
      : undefined;
    const humanCoordination = input.humanCoordinationInput
      ? this.humanCoordinationPack.assess(input.humanCoordinationInput)
      : undefined;
    const humanCoordinationRequestIds: string[] = [];
    const humanDecisionIds: string[] = [];
    if (humanCoordination && input.humanCoordinationInput && this.humanCoordinationStore) {
      for (const request of input.humanCoordinationInput.requests) {
        humanCoordinationRequestIds.push(await this.humanCoordinationStore.recordRequest({
          requestId: request.requestId,
          correlationId: input.cycle.cycleId,
          requestType: request.type,
          humanRef: request.humanRef,
          objective: request.objective,
          contextRefs: request.contextRefs,
          evidenceRefs: request.evidenceRefs,
          decisionRequired: request.decisionRequired,
          expiresAt: request.expiresAt,
          status: request.status,
          minimumContext: request.minimumContext,
          provenance: { ...request.provenance, source: 'ABBARuntimeOrchestrator' },
          idempotencyKey: 'abba:human-request:' + request.requestId
        }));
      }
      for (const authorization of input.humanCoordinationInput.authorizations) {
        humanDecisionIds.push(await this.humanCoordinationStore.recordDecision({
          requestId: authorization.requestId,
          humanRef: authorization.humanRef,
          decisionType: authorization.decision,
          decisionPayload: { decisionRef: authorization.decisionRef, scope: authorization.scope },
          evidenceRefs: authorization.evidenceRefs,
          authorityRef: authorization.authorityRef,
          signatureRef: authorization.signatureRef,
          recordedBy: authorization.humanRef,
          decidedAt: authorization.decidedAt,
          provenance: { ...authorization.provenance, source: 'ABBARuntimeOrchestrator' },
          idempotencyKey: 'abba:human-decision:' + authorization.authorizationId
        }));
      }
    }
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
      ...(missionIntelligence?.stewardship.filter((item) => item.mitigationRequired).map((item) => `STEWARDSHIP_MITIGATION_REQUIRED:${item.impactId}`) ?? []),
      ...(knowledgeMastery?.mastery.filter((item) => !item.promotable && item.reasons.length > 0).map((item) => `MASTERY_ASSURANCE:${item.capabilityRef}:${item.reasons.join('|')}`) ?? []),
      ...(evidenceSourceIntelligence?.sources.filter((item) => !item.provenanceAccepted).map((item) => `SOURCE_PROVENANCE:${item.sourceId}:${item.reasons.join('|')}`) ?? []),
      ...(evidenceSourceIntelligence?.claims.filter((item) => !item.valid).map((item) => `EVIDENCE_CHAIN:${item.claimId}:${item.reasons.join('|')}`) ?? []),
      ...(evidenceSourceIntelligence?.observations.filter((item) => !item.accepted).map((item) => `EXTERNAL_OBSERVATION:${item.observationId}:${item.reasons.join('|')}`) ?? []),
      ...(humanCoordination?.blockingRequestIds.map((id) => `HUMAN_COORDINATION_REQUIRED:${id}`) ?? []),
      ...(humanCoordination?.authorizations.filter((item) => !item.valid).map((item) => `HUMAN_AUTHORIZATION_INVALID:${item.authorizationId}:${item.reasons.join('|')}`) ?? [])
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
        missionIntelligence,
        knowledgeMastery,
        evidenceSourceIntelligence,
        humanCoordination
      }
    });

    return {
      cycle: coreResult.cycle,
      reconciliations: coreResult.reconciliations,
      completionProof,
      evidenceAssessments,
      reasoningAssessments,
      missionIntelligence,
      knowledgeMastery,
      evidenceSourceIntelligence,
      humanCoordination,
      humanCoordinationRequestIds,
      humanDecisionIds,
      reconciliationRecordIds,
      completionProofRecordId
    };
  }
}
