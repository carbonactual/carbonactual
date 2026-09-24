import { ABBAAuthorityPolicyGate } from './authorityPolicyGate';
import type { AuthorityContext, GateResult } from './authorityPolicyGate';
import { ABBAExecutionGateway } from './executionGateway';
import type { CanonicalEventEnvelope, GatedExecutionResult } from './executionGateway';

export interface GovernedActionRequest {
  authorityContext: AuthorityContext;
  actionId: string;
  payload: Record<string, unknown>;
  canonicalEvent: CanonicalEventEnvelope;
}

export interface GovernedActionResult {
  gate: GateResult;
  execution: GatedExecutionResult;
}

export class ABBAGovernedActionCoordinator {
  constructor(
    private readonly gate: ABBAAuthorityPolicyGate,
    private readonly executionGateway: ABBAExecutionGateway
  ) {}

  public async execute(request: GovernedActionRequest): Promise<GovernedActionResult> {
    const gate = await this.gate.evaluate(request.authorityContext);
    const execution = await this.executionGateway.execute({
      gateDecision: gate.decision,
      actionId: request.actionId,
      payload: request.payload,
      canonicalEvent: request.canonicalEvent
    });

    return { gate, execution };
  }
}
