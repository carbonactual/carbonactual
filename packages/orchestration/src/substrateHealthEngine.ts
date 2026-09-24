export type SubstrateHealthStatus = 'READY' | 'DEGRADED' | 'BLOCKED';

export interface SubstrateRequirement {
  canonicalConcept: string;
  substrateRef: string;
  ingressRef?: string;
  exists: boolean;
  rlsEnabled: boolean;
  directClientWriteAllowed: boolean;
  privilegedIngressAvailable: boolean;
  duplicateSemanticSurface: boolean;
  provenance: Record<string, unknown>;
}

export interface SubstrateHealthAssessment {
  canonicalConcept: string;
  substrateRef: string;
  status: SubstrateHealthStatus;
  reasons: string[];
  executionTechnicalReady: boolean;
}

export interface SubstrateHealthSnapshot {
  assessedAt: string;
  overall: SubstrateHealthStatus;
  assessments: SubstrateHealthAssessment[];
  blockingConcepts: string[];
  executionTechnicalReady: boolean;
}

export class ABBASubstrateHealthEngine {
  assess(requirement: SubstrateRequirement): SubstrateHealthAssessment {
    const reasons:string[] = [];
    if(!requirement.exists) reasons.push('SUBSTRATE_NOT_FOUND');
    if(!requirement.rlsEnabled) reasons.push('RLS_NOT_ENABLED');
    if(requirement.directClientWriteAllowed) reasons.push('DIRECT_CLIENT_WRITE_OPEN');
    if(!requirement.privilegedIngressAvailable) reasons.push('PRIVILEGED_INGRESS_MISSING');
    if(requirement.duplicateSemanticSurface) reasons.push('DUPLICATE_SEMANTIC_SURFACE');
    if(!requirement.ingressRef) reasons.push('SUBSTRATE_INGRESS_UNMAPPED');

    const hardBlock = reasons.some(reason => [
      'SUBSTRATE_NOT_FOUND',
      'DIRECT_CLIENT_WRITE_OPEN',
      'PRIVILEGED_INGRESS_MISSING',
      'DUPLICATE_SEMANTIC_SURFACE',
      'SUBSTRATE_INGRESS_UNMAPPED'
    ].includes(reason));

    const status:SubstrateHealthStatus = hardBlock ? 'BLOCKED' : reasons.length ? 'DEGRADED' : 'READY';
    return {
      canonicalConcept: requirement.canonicalConcept,
      substrateRef: requirement.substrateRef,
      status,
      reasons,
      executionTechnicalReady: status === 'READY'
    };
  }

  snapshot(requirements: SubstrateRequirement[], assessedAt = new Date().toISOString()): SubstrateHealthSnapshot {
    const assessments=requirements.map(requirement=>this.assess(requirement));
    const blockingConcepts=assessments.filter(item=>item.status==='BLOCKED').map(item=>item.canonicalConcept);
    const overall = blockingConcepts.length
      ? 'BLOCKED'
      : assessments.some(item=>item.status==='DEGRADED')
        ? 'DEGRADED'
        : 'READY';
    return {
      assessedAt,
      overall,
      assessments,
      blockingConcepts,
      executionTechnicalReady: overall === 'READY'
    };
  }
}
