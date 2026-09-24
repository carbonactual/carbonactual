import type { CanonicalEventEnvelope } from './executionGateway';
import { ABBAReasoningAssuranceEngine, ReasoningArtifact } from './reasoningAssuranceEngine';

export interface ReasoningSubstrateStep {
  artifact: ReasoningArtifact;
  verifiedByAuthority?: boolean;
  blockerDetected?: boolean;
}

export interface SubstrateBindingResult {
  reasoningChainId: string;
  isBoundToSubstrate: boolean;
  substrateBindingStatus: 'READY_FOR_GOVERNANCE' | 'BLOCKED';
  canonicalEventDraft?: CanonicalEventEnvelope;
  blockingReasons: string[];
  artifactAssessments: ReturnType<ABBAReasoningAssuranceEngine['assessMany']>;
  executionAllowed: false;
}

function unique(values:string[]):string[]{ return [...new Set(values.map(v=>v.trim()).filter(Boolean))]; }

const allowedTransition: Record<ReasoningArtifact['type'], ReasoningArtifact['type'][]> = {
  THEORY: ['THEORY','HYPOTHESIS','OBSERVATION','EVIDENCE','CONCLUSION'],
  HYPOTHESIS: ['HYPOTHESIS','OBSERVATION','EVIDENCE','RESULT','CONCLUSION'],
  OBSERVATION: ['OBSERVATION','EVIDENCE','RESULT','CONCLUSION'],
  EVIDENCE: ['EVIDENCE','RESULT','CONCLUSION'],
  RESULT: ['RESULT','CONCLUSION'],
  CONCLUSION: ['CONCLUSION','RECOMMENDATION'],
  RECOMMENDATION: ['RECOMMENDATION','DECISION'],
  DECISION: ['DECISION']
};

export class ABBASubstrateBinder {
  constructor(
    private readonly reasoningEngine: ABBAReasoningAssuranceEngine = new ABBAReasoningAssuranceEngine()
  ) {}

  public prepareCanonicalEvent(
    reasoningChainId: string,
    steps: ReasoningSubstrateStep[],
    context: {
      actorEntityId: string;
      authorityRef: string;
      authoritySignature: string;
      correlationId: string;
      idempotencyKey: string;
      schemaVersion: string;
      policyVersion: string;
      pulseImpact: Record<string, unknown>;
      provenance?: Record<string, unknown>;
      eventType: string;
    }
  ): SubstrateBindingResult {
    const assessments = this.reasoningEngine.assessMany(steps.map(step => step.artifact));
    const blockingReasons:string[] = [];

    if (!reasoningChainId.trim()) blockingReasons.push('REASONING_CHAIN_ID_REQUIRED');
    if (steps.length === 0) blockingReasons.push('REASONING_STEPS_REQUIRED');
    if (steps.some(step => step.blockerDetected)) blockingReasons.push('ACTIVE_REASONING_BLOCKER');

    for (let index=1; index<steps.length; index+=1) {
      const previous = steps[index-1].artifact.type;
      const current = steps[index].artifact.type;
      if (!allowedTransition[previous].includes(current)) {
        blockingReasons.push('INVALID_REASONING_TRANSITION:' + previous + '->' + current);
      }
    }

    if (assessments.some(item => !item.valid)) {
      blockingReasons.push(
        ...assessments.filter(item => !item.valid)
          .map(item => 'REASONING_ARTIFACT_INVALID:' + item.artifactId + ':' + item.reasons.join('|'))
      );
    }

    const decision = steps.find(step => step.artifact.type === 'DECISION');
    if (decision) {
      if (!steps.some(step => step.artifact.type === 'RECOMMENDATION')) {
        blockingReasons.push('DECISION_REQUIRES_RECOMMENDATION_BASIS');
      }
      if (!decision.artifact.authorityRef?.trim() || !decision.artifact.consentRef?.trim()) {
        blockingReasons.push('DECISION_GOVERNANCE_REFERENCES_REQUIRED');
      }
      if (!decision.verifiedByAuthority) {
        blockingReasons.push('DECISION_AUTHORITY_VERIFICATION_REQUIRED');
      }
    }

    const deduped = unique(blockingReasons);
    if (deduped.length > 0) {
      return {
        reasoningChainId,
        isBoundToSubstrate: false,
        substrateBindingStatus: 'BLOCKED',
        blockingReasons: deduped,
        artifactAssessments: assessments,
        executionAllowed: false
      };
    }

    const last = steps.at(-1)?.artifact;
    const canonicalEventDraft: CanonicalEventEnvelope = {
      eventType: context.eventType,
      actorEntityId: context.actorEntityId,
      authorityRef: context.authorityRef,
      authoritySignature: context.authoritySignature,
      correlationId: context.correlationId,
      idempotencyKey: context.idempotencyKey,
      schemaVersion: context.schemaVersion,
      policyVersion: context.policyVersion,
      provenance: {
        ...(context.provenance ?? {}),
        reasoningChainId,
        reasoningArtifacts: steps.map(step => ({
          artifactId: step.artifact.artifactId,
          type: step.artifact.type,
          basisRefs: step.artifact.basisRefs,
          confidence: step.artifact.confidence ?? null
        })),
        substrateBinding: 'ABBA_SUBSTRATE_BINDER'
      },
      payload: {
        reasoningChainId,
        terminalReasoningArtifactId: last?.artifactId ?? null,
        terminalReasoningType: last?.type ?? null
      },
      pulseImpact: context.pulseImpact
    };

    return {
      reasoningChainId,
      isBoundToSubstrate: true,
      substrateBindingStatus: 'READY_FOR_GOVERNANCE',
      canonicalEventDraft,
      blockingReasons: [],
      artifactAssessments: assessments,
      executionAllowed: false
    };
  }
}
