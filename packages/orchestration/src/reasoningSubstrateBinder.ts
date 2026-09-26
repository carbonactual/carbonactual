import type {
  AuthorityContext,
  ABBAAuthorityPolicyGate,
  GateResult
} from './authorityPolicyGate';
import type {
  CanonicalEventEnvelope,
  CanonicalEventWriter
} from './executionGateway';
import {
  ABBAReasoningAssuranceEngine,
  ReasoningArtifact,
  ReasoningArtifactType,
  ReasoningAssessment
} from './reasoningAssuranceEngine';

export type EpistemicCategory = ReasoningArtifactType;

export interface ReasoningStep {
  category: EpistemicCategory;
  claim: string;
  evidenceRef?: string;
  timestamp: string;
  artifactId?: string;
  basisRefs?: string[];
  sourceRefs?: string[];
  procedureRef?: string;
  authorityRef?: string;
  consentRef?: string;
  provenance?: Record<string, unknown>;
  confidence?: number;
}

export interface ReasoningChainAuditStore {
  append(input: Record<string, unknown>): Promise<string>;
}

export interface BindingEvaluationResult {
  chainId: string;
  success: boolean;
  blockerReason?: string;
  canonicalEventId?: string;
  gate?: GateResult;
  assessments: ReasoningAssessment[];
}

const CANONICAL_ORDER: EpistemicCategory[] = [
  'THEORY',
  'HYPOTHESIS',
  'OBSERVATION',
  'EVIDENCE',
  'RESULT',
  'CONCLUSION',
  'RECOMMENDATION',
  'DECISION'
];

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function toReasoningArtifact(step: ReasoningStep, index: number): ReasoningArtifact {
  return {
    artifactId: step.artifactId ?? `${step.category.toLowerCase()}_${index + 1}`,
    type: step.category,
    statement: step.claim,
    basisRefs: unique(step.basisRefs ?? (step.evidenceRef ? [`evidence:${step.evidenceRef}`] : [])),
    sourceRefs: step.sourceRefs ?? (step.evidenceRef ? [step.evidenceRef] : []),
    procedureRef: step.procedureRef,
    authorityRef: step.authorityRef,
    consentRef: step.consentRef,
    provenance: step.provenance ?? {},
    confidence: step.confidence
  };
}

export class SubstrateBinder {
  constructor(
    private readonly reasoningEngine: ABBAReasoningAssuranceEngine,
    private readonly authorityGate: ABBAAuthorityPolicyGate,
    private readonly auditStore: ReasoningChainAuditStore,
    private readonly canonicalEventWriter: CanonicalEventWriter
  ) {}

  public async bindAndEmit(
    chainId: string,
    actorEntityId: string,
    objective: string,
    steps: ReasoningStep[],
    authorityContext: AuthorityContext,
    authoritySignature?: string
  ): Promise<BindingEvaluationResult> {
    const artifacts = steps.map(toReasoningArtifact);
    const assessments = this.reasoningEngine.assessMany(artifacts);
    const blockers: string[] = [];

    if (!chainId.trim()) blockers.push('CHAIN_ID_REQUIRED');
    if (!actorEntityId.trim()) blockers.push('ACTOR_ENTITY_ID_REQUIRED');
    if (!objective.trim()) blockers.push('OBJECTIVE_REQUIRED');
    if (steps.length === 0) blockers.push('REASONING_STEPS_REQUIRED');

    let highestIndex = -1;
    let sawDecision = false;

    for (const [index, step] of steps.entries()) {
      const currentIndex = CANONICAL_ORDER.indexOf(step.category);

      if (currentIndex < 0) {
        blockers.push(`UNKNOWN_EPISTEMIC_CATEGORY:${step.category}`);
        continue;
      }

      if (currentIndex < highestIndex) {
        blockers.push(
          `EPISTEMIC_VIOLATION:${step.category}:after-index:${highestIndex}`
        );
      }

      highestIndex = Math.max(highestIndex, currentIndex);

      if (step.category === 'DECISION') {
        sawDecision = true;
        if (index !== steps.length - 1) {
          blockers.push('DECISION_MUST_BE_TERMINAL_REASONING_STEP');
        }
        if (!step.authorityRef?.trim() || !step.consentRef?.trim()) {
          blockers.push('DECISION_GOVERNANCE_REFERENCES_REQUIRED');
        }
      }
    }

    blockers.push(
      ...assessments
        .filter((assessment) => !assessment.valid)
        .map((assessment) =>
          `REASONING_ARTIFACT_INVALID:${assessment.artifactId}:${assessment.reasons.join('|')}`
        )
    );

    if (sawDecision && !authoritySignature?.trim()) {
      blockers.push('AUTHORITY_GATE_MISSING_SIGNATURE');
    }

    const dedupedBlockers = unique(blockers);

    if (dedupedBlockers.length > 0) {
      const bindingId = await this.auditStore.append({
        chainId,
        actorEntityId,
        objective,
        epistemicSequence: artifacts,
        authorityVerified: false,
        authorityRef: authorityContext.authorityRef ?? null,
        consentRef: authorityContext.consentRef ?? null,
        authoritySignature: authoritySignature ?? null,
        gateDecision: 'NOT_EVALUATED',
        executionBlocked: true,
        blockingReason: dedupedBlockers.join('|'),
        idempotencyKey: `abba:reasoning-chain:${chainId}`,
        provenance: { source: 'SubstrateBinder' }
      });

      return {
        chainId,
        success: false,
        blockerReason: dedupedBlockers.join('|'),
        assessments
      };
    }

    const gate = await this.authorityGate.evaluate({
      ...authorityContext,
      authorityRef: authorityContext.authorityRef,
      consentRef: authorityContext.consentRef
    });

    if (gate.decision !== 'ALLOW') {
      await this.auditStore.append({
        chainId,
        actorEntityId,
        objective,
        epistemicSequence: artifacts,
        authorityVerified: false,
        authorityRef: authorityContext.authorityRef ?? null,
        consentRef: authorityContext.consentRef ?? null,
        authoritySignature: authoritySignature ?? null,
        gateDecision: gate.decision,
        executionBlocked: true,
        blockingReason: gate.reasons.join('|') || gate.decision,
        idempotencyKey: `abba:reasoning-chain:${chainId}`,
        provenance: { source: 'SubstrateBinder' }
      });

      return {
        chainId,
        success: false,
        blockerReason: gate.reasons.join('|') || gate.decision,
        gate,
        assessments
      };
    }

    const canonicalEvent: CanonicalEventEnvelope = {
      eventType: 'abba_reasoning_bound',
      actorEntityId,
      principalEntityId: authorityContext.principalEntityId,
      authorityRef: authorityContext.authorityRef ?? '',
      authoritySignature: authoritySignature ?? '',
      correlationId: authorityContext.correlationId,
      idempotencyKey: `reasoning_${chainId}`,
      schemaVersion: '1.0.0',
      policyVersion: authorityContext.policyVersion,
      provenance: {
        source: 'SubstrateBinder',
        reasoningChainId: chainId,
        reasoningAssessments: assessments
      },
      payload: {
        chainId,
        objective,
        stepCount: steps.length,
        epistemicSequence: steps.map((step) => step.category)
      },
      pulseImpact: {}
    };

    const canonicalEventId = await this.canonicalEventWriter.append(canonicalEvent);

    await this.auditStore.append({
      chainId,
      actorEntityId,
      objective,
      epistemicSequence: artifacts,
      authorityVerified: true,
      authorityRef: authorityContext.authorityRef ?? null,
      consentRef: authorityContext.consentRef ?? null,
      authoritySignature: authoritySignature ?? null,
      gateDecision: gate.decision,
      executionBlocked: false,
      canonicalEventId,
      idempotencyKey: `abba:reasoning-chain:${chainId}`,
      provenance: { source: 'SubstrateBinder' }
    });

    return {
      chainId,
      success: true,
      canonicalEventId,
      gate,
      assessments
    };
  }
}
