import { ABBASubstrateBinder, ReasoningSubstrateStep, SubstrateBindingResult } from './reasoningSubstrateBinding';
import { ABBAAuthorityPolicyGate, AuthorityContext, GateResult } from './authorityPolicyGate';
import { ABBAExecutionGateway, GatedExecutionResult } from './executionGateway';

export interface ReasoningSubstrateBindingStore {
  append(input: Record<string, unknown>): Promise<string>;
  update(bindingId: string, update: Record<string, unknown>): Promise<void>;
}

export interface GovernedReasoningExecutionInput {
  reasoningChainId: string;
  steps: ReasoningSubstrateStep[];
  authorityContext: AuthorityContext;
  authoritySignature: string;
  eventType: string;
  actionId: string;
  actionPayload: Record<string, unknown>;
  pulseImpact: Record<string, unknown>;
  provenance?: Record<string, unknown>;
}

export interface GovernedReasoningExecutionResult {
  bindingId: string;
  preparation: SubstrateBindingResult;
  gate?: GateResult;
  execution?: GatedExecutionResult;
}

export class ABBAGovernedReasoningSubstrateBridge {
  constructor(
    private readonly binder: ABBASubstrateBinder,
    private readonly gate: ABBAAuthorityPolicyGate,
    private readonly executionGateway: ABBAExecutionGateway,
    private readonly bindingStore: ReasoningSubstrateBindingStore
  ) {}

  public async execute(input: GovernedReasoningExecutionInput): Promise<GovernedReasoningExecutionResult> {
    const preparation = this.binder.prepareCanonicalEvent(
      input.reasoningChainId,
      input.steps,
      {
        actorEntityId: input.authorityContext.principalEntityId,
        authorityRef: input.authorityContext.authorityRef ?? '',
        authoritySignature: input.authoritySignature,
        correlationId: input.authorityContext.correlationId,
        idempotencyKey: input.authorityContext.idempotencyKey,
        schemaVersion: '1.0.0',
        policyVersion: input.authorityContext.policyVersion,
        pulseImpact: input.pulseImpact,
        provenance: input.provenance,
        eventType: input.eventType
      }
    );

    const bindingId = await this.bindingStore.append({
      reasoningChainId: input.reasoningChainId,
      bindingStatus: preparation.isBoundToSubstrate ? 'PREPARED' : 'BLOCKED',
      artifactCount: input.steps.length,
      blockingReasons: preparation.blockingReasons,
      artifactAssessments: preparation.artifactAssessments,
      canonicalEventDraft: preparation.canonicalEventDraft,
      idempotencyKey: 'abba:reasoning-binding:' + input.authorityContext.idempotencyKey,
      provenance: { source: 'ABBAGovernedReasoningSubstrateBridge' }
    });

    if (!preparation.isBoundToSubstrate || !preparation.canonicalEventDraft) {
      return { bindingId, preparation };
    }

    const gate = await this.gate.evaluate(input.authorityContext);

    if (gate.decision !== 'ALLOW') {
      await this.bindingStore.update(bindingId, {
        bindingStatus: 'BLOCKED',
        blockingReasons: gate.reasons
      });
      return { bindingId, preparation, gate };
    }

    const execution = await this.executionGateway.execute({
      gateDecision: 'ALLOW',
      actionId: input.actionId,
      payload: input.actionPayload,
      canonicalEvent: preparation.canonicalEventDraft
    });

    await this.bindingStore.update(bindingId, {
      bindingStatus:
        execution.status === 'EXECUTED'
          ? 'EXECUTED'
          : execution.status === 'RECOVERY_REQUIRED'
            ? 'RECOVERY_REQUIRED'
            : 'BLOCKED',
      canonicalEventId: execution.canonicalEventId,
      blockingReasons: execution.reason ? [execution.reason] : []
    });

    return { bindingId, preparation, gate, execution };
  }
}
