import { ABBAOperationalSafetyEnvelopeEngine, OperationalActionProfile, OperationalSafetyEnvelope, SafetyAssessment } from './operationalSafetyEnvelope';
import { ABBACircuitBreakerEngine, CircuitDecision, CircuitState } from './circuitBreakerEngine';

export interface AutonomousSafetyCheckInput {
  envelope: OperationalSafetyEnvelope;
  action: OperationalActionProfile;
  circuit?: CircuitState;
}

export interface AutonomousSafetyCheckResult {
  safety: SafetyAssessment;
  circuit?: CircuitDecision;
  proceedToAuthorityGate: boolean;
  executionAllowed: false;
}

export class ABBAAutonomousSafetyGuard {
  constructor(
    private readonly safetyEngine = new ABBAOperationalSafetyEnvelopeEngine(),
    private readonly circuitEngine = new ABBACircuitBreakerEngine()
  ) {}

  evaluate(input: AutonomousSafetyCheckInput): AutonomousSafetyCheckResult {
    const safety = this.safetyEngine.assess(input.envelope, input.action);
    const circuit = input.circuit ? this.circuitEngine.evaluate(input.circuit) : undefined;
    const circuitBlocks = circuit ? !circuit.allowProbe && circuit.state === 'OPEN' : false;
    return {
      safety,
      circuit,
      proceedToAuthorityGate: safety.disposition === 'SAFE' && !circuitBlocks,
      executionAllowed: false
    };
  }
}
