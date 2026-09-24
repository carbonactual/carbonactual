import { ABBASubstrateHealthEngine, SubstrateRequirement, SubstrateHealthSnapshot } from './substrateHealthEngine';

export interface SubstrateReadinessDecision {
  snapshot: SubstrateHealthSnapshot;
  decision: 'PROCEED_TO_AUTHORITY_GATE' | 'HOLD_FOR_SUBSTRATE_REPAIR';
  reasons: string[];
  executionAllowed: false;
}

export class ABBASubstrateReadinessGate {
  constructor(private readonly healthEngine = new ABBASubstrateHealthEngine()) {}

  evaluate(requirements: SubstrateRequirement[]): SubstrateReadinessDecision {
    const snapshot=this.healthEngine.snapshot(requirements);
    return {
      snapshot,
      decision: snapshot.executionTechnicalReady ? 'PROCEED_TO_AUTHORITY_GATE' : 'HOLD_FOR_SUBSTRATE_REPAIR',
      reasons: snapshot.blockingConcepts.length
        ? snapshot.blockingConcepts.map(concept=>'SUBSTRATE_REPAIR_REQUIRED:'+concept)
        : snapshot.assessments.flatMap(item=>item.reasons.map(reason=>item.canonicalConcept+':'+reason)),
      executionAllowed:false
    };
  }
}
