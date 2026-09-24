import { ABBASourceIntelligenceEngine, SourceRecord, SourceAssessment } from './sourceIntelligenceEngine';
import { ABBAEvidenceChainEngine, EvidenceClaim, EvidenceChainAssessment } from './evidenceChainEngine';
import { ABBAExternalObservationEngine, ExternalObservationEnvelope, ExternalObservationAssessment } from './externalObservationEngine';

export interface EvidenceSourceIntelligenceInput {
  sources: SourceRecord[];
  claims: EvidenceClaim[];
  observations: ExternalObservationEnvelope[];
}

export interface EvidenceSourceIntelligenceResult {
  sources: SourceAssessment[];
  claims: EvidenceChainAssessment[];
  observations: ExternalObservationAssessment[];
  executionAllowed: false;
}

export class ABBAEvidenceSourceIntelligencePack {
  constructor(
    private readonly sourceEngine = new ABBASourceIntelligenceEngine(),
    private readonly chainEngine = new ABBAEvidenceChainEngine(),
    private readonly observationEngine = new ABBAExternalObservationEngine()
  ) {}

  analyze(input: EvidenceSourceIntelligenceInput): EvidenceSourceIntelligenceResult {
    const sources = this.sourceEngine.assessMany(input.sources);
    const sourceIndexes = sources.map(source => ({
      sourceId: source.sourceId,
      independenceGroup: source.independenceGroup,
      provenanceAccepted: source.provenanceAccepted
    }));
    const claims = input.claims.map(claim => this.chainEngine.assess(claim, sourceIndexes));
    const observations = input.observations.map(observation => {
      const source = sources.find(item => item.sourceId === observation.source.sourceId);
      return this.observationEngine.accept(observation, {
        provenanceAccepted: source?.provenanceAccepted ?? false,
        freshness: source?.freshness ?? 'UNKNOWN'
      });
    });
    return { sources, claims, observations, executionAllowed:false };
  }
}
