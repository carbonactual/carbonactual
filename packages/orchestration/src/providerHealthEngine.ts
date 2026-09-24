export interface ProviderHealthSnapshot {
  providerRef: string;
  capabilityRef: string;
  observedAt: string;
  available: boolean;
  errorRate: number;
  latencyMs: number;
  consecutiveFailures: number;
  evidenceRefs: string[];
}

export interface ProviderHealthAssessment {
  providerRef: string;
  capabilityRef: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'STALE';
  reasons: string[];
  useForExecution: false;
}

export class ABBAProviderHealthEngine {
  assess(snapshot: ProviderHealthSnapshot, now = new Date()): ProviderHealthAssessment {
    const reasons:string[]=[];
    const ageMs=now.getTime()-Date.parse(snapshot.observedAt);
    if(ageMs>15*60*1000) reasons.push('HEALTH_SNAPSHOT_STALE');
    if(snapshot.errorRate>=0.2) reasons.push('HIGH_ERROR_RATE');
    if(snapshot.consecutiveFailures>=3) reasons.push('CONSECUTIVE_PROVIDER_FAILURES');
    if(!snapshot.available) reasons.push('PROVIDER_UNAVAILABLE');
    const status = reasons.includes('PROVIDER_UNAVAILABLE')
      ? 'UNAVAILABLE'
      : reasons.includes('HEALTH_SNAPSHOT_STALE')
        ? 'STALE'
        : reasons.length
          ? 'DEGRADED'
          : 'HEALTHY';
    return { providerRef:snapshot.providerRef, capabilityRef:snapshot.capabilityRef, status, reasons, useForExecution:false };
  }
}
