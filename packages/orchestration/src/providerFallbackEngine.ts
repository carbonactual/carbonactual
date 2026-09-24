export interface ProviderRouteCandidate {
  providerRef: string;
  capabilityRef: string;
  benchmarkRank: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'STALE';
  authorityEligible: false;
}

export interface ProviderRouteDecision {
  capabilityRef: string;
  routeStatus: 'ROUTE_PROPOSED' | 'NO_HEALTHY_PROVIDER';
  selectedProviderRef?: string;
  fallbackProviderRefs: string[];
  reasons: string[];
  executionAllowed: false;
}

export class ABBAProviderFallbackEngine {
  propose(candidates: ProviderRouteCandidate[]): ProviderRouteDecision {
    const usable=candidates.filter(c=>c.healthStatus==='HEALTHY' || c.healthStatus==='DEGRADED');
    const ordered=[...usable].sort((a,b)=>a.benchmarkRank-b.benchmarkRank);
    return {
      capabilityRef:candidates[0]?.capabilityRef ?? '',
      routeStatus: ordered.length ? 'ROUTE_PROPOSED' : 'NO_HEALTHY_PROVIDER',
      selectedProviderRef: ordered[0]?.providerRef,
      fallbackProviderRefs: ordered.slice(1).map(c=>c.providerRef),
      reasons: ordered.length ? ['BENCHMARK_AND_HEALTH_ROUTE_PROPOSAL'] : ['NO_USABLE_PROVIDER_HEALTH'],
      executionAllowed:false
    };
  }
}
