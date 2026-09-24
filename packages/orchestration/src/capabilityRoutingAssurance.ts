import { ABBACapabilityBenchmarkEngine, CapabilityCandidate, CapabilityBenchmarkResult } from './capabilityBenchmarkEngine';
import { ABBAProviderHealthEngine, ProviderHealthSnapshot, ProviderHealthAssessment } from './providerHealthEngine';
import { ABBAProviderFallbackEngine, ProviderRouteCandidate, ProviderRouteDecision } from './providerFallbackEngine';

export interface CapabilityRouteInput {
  capabilityRef: string;
  candidates: CapabilityCandidate[];
  health: ProviderHealthSnapshot[];
  benchmarkCriteria?: Record<string, number>;
}

export interface CapabilityRouteResult {
  capabilityRef: string;
  benchmark: CapabilityBenchmarkResult;
  health: ProviderHealthAssessment[];
  route: ProviderRouteDecision;
  executionAllowed: false;
}

export class ABBACapabilityRoutingAssurance {
  constructor(
    private readonly benchmarkEngine = new ABBACapabilityBenchmarkEngine(),
    private readonly healthEngine = new ABBAProviderHealthEngine(),
    private readonly fallbackEngine = new ABBAProviderFallbackEngine()
  ) {}

  propose(input: CapabilityRouteInput): CapabilityRouteResult {
    const benchmark = this.benchmarkEngine.benchmark(input.candidates, input.benchmarkCriteria);
    const health = input.health.map(snapshot => this.healthEngine.assess(snapshot));

    const byProvider = new Map(health.map(item => [item.providerRef, item]));
    const routeCandidates: ProviderRouteCandidate[] = benchmark.orderedCandidateIds.map((candidateId, index) => {
      const candidate = input.candidates.find(item => item.candidateId === candidateId);
      const healthAssessment = candidate ? byProvider.get(candidate.providerRef) : undefined;
      return {
        providerRef: candidate?.providerRef ?? '',
        capabilityRef: input.capabilityRef,
        benchmarkRank: index + 1,
        healthStatus: healthAssessment?.status ?? 'STALE',
        authorityEligible: false
      };
    });

    const route = this.fallbackEngine.propose(routeCandidates);
    return { capabilityRef: input.capabilityRef, benchmark, health, route, executionAllowed: false };
  }
}
