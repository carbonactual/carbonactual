export type SafetyDisposition = 'SAFE' | 'HOLD' | 'BLOCKED';

export interface OperationalSafetyEnvelope {
  envelopeId: string;
  actionClass: 'READ' | 'WRITE' | 'VALUE_MOVEMENT' | 'EXTERNAL_COMMUNICATION' | 'IDENTITY_CHANGE' | 'SECURITY_CHANGE' | 'IRREVERSIBLE';
  maxCostUnits: number;
  maxConcurrentExecutions: number;
  maxRetries: number;
  maxBlastRadius: number;
  maxDataEgressUnits: number;
  requiresReversibility: boolean;
  circuitBreakerThreshold: number;
  provenance: Record<string, unknown>;
}

export interface OperationalActionProfile {
  actionId: string;
  expectedCostUnits: number;
  expectedConcurrentExecutions: number;
  expectedRetries: number;
  expectedBlastRadius: number;
  expectedDataEgressUnits: number;
  reversible: boolean;
  priorFailureRate: number;
  circuitBreakerOpen: boolean;
  evidenceRefs: string[];
}

export interface SafetyAssessment {
  envelopeId: string;
  actionId: string;
  disposition: SafetyDisposition;
  reasons: string[];
  mitigations: string[];
  authorityRequired: true;
  executionAllowed: false;
}

function bounded(value:number){return Math.max(0,value);}

export class ABBAOperationalSafetyEnvelopeEngine {
  assess(envelope: OperationalSafetyEnvelope, action: OperationalActionProfile): SafetyAssessment {
    const reasons:string[]=[];
    const mitigations:string[]=[];
    if(action.evidenceRefs.length===0) reasons.push('SAFETY_EVIDENCE_REQUIRED');
    if(action.expectedCostUnits > bounded(envelope.maxCostUnits)) reasons.push('COST_CEILING_EXCEEDED');
    if(action.expectedConcurrentExecutions > bounded(envelope.maxConcurrentExecutions)) reasons.push('CONCURRENCY_CEILING_EXCEEDED');
    if(action.expectedRetries > bounded(envelope.maxRetries)) reasons.push('RETRY_CEILING_EXCEEDED');
    if(action.expectedBlastRadius > bounded(envelope.maxBlastRadius)) reasons.push('BLAST_RADIUS_CEILING_EXCEEDED');
    if(action.expectedDataEgressUnits > bounded(envelope.maxDataEgressUnits)) reasons.push('DATA_EGRESS_CEILING_EXCEEDED');
    if(envelope.requiresReversibility && !action.reversible) reasons.push('REVERSIBILITY_REQUIRED');
    if(action.circuitBreakerOpen) reasons.push('CIRCUIT_BREAKER_OPEN');
    if(action.priorFailureRate >= envelope.circuitBreakerThreshold) reasons.push('FAILURE_RATE_CIRCUIT_THRESHOLD_REACHED');

    if(reasons.includes('COST_CEILING_EXCEEDED')) mitigations.push('REDUCE_SCOPE_OR_REQUEST_NEW_BUDGET');
    if(reasons.includes('BLAST_RADIUS_CEILING_EXCEEDED')) mitigations.push('SPLIT_ACTION_INTO_SMALLER_BOUNDED_STEPS');
    if(reasons.includes('DATA_EGRESS_CEILING_EXCEEDED')) mitigations.push('MINIMIZE_OR_REDACT_DATA_EGRESS');
    if(reasons.includes('REVERSIBILITY_REQUIRED')) mitigations.push('ADD_COMPENSATING_OR_ROLLBACK_PATH');
    if(reasons.includes('CIRCUIT_BREAKER_OPEN') || reasons.includes('FAILURE_RATE_CIRCUIT_THRESHOLD_REACHED')) mitigations.push('HUMAN_REVIEW_OR_RECOVERY');

    const blockedReasons = reasons.filter(reason => [
      'SAFETY_EVIDENCE_REQUIRED','COST_CEILING_EXCEEDED','CONCURRENCY_CEILING_EXCEEDED',
      'RETRY_CEILING_EXCEEDED','BLAST_RADIUS_CEILING_EXCEEDED','DATA_EGRESS_CEILING_EXCEEDED',
      'REVERSIBILITY_REQUIRED','CIRCUIT_BREAKER_OPEN','FAILURE_RATE_CIRCUIT_THRESHOLD_REACHED'
    ].includes(reason));

    return {
      envelopeId:envelope.envelopeId,
      actionId:action.actionId,
      disposition:blockedReasons.length ? 'BLOCKED' : reasons.length ? 'HOLD' : 'SAFE',
      reasons,
      mitigations,
      authorityRequired:true,
      executionAllowed:false
    };
  }
}
