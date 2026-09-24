import { ABBAIntentResolutionEngine, IntentCandidate, ResolvedIntent } from './intentResolutionEngine';
import { ABBAMissionDecompositionEngine, MissionConstraint, MissionDecomposition, MissionTask } from './missionDecompositionEngine';
import { ABBAUncertaintyLedger, UncertaintyRecord, UncertaintyAssessment } from './uncertaintyLedger';
import { ABBAStewardshipImpactEngine, StewardshipImpact, StewardshipAssessment } from './stewardshipImpactEngine';
import { ABBACapabilityProvenanceEngine, CapabilityProvenanceRecord, CapabilityProvenanceAssessment } from './capabilityProvenanceEngine';
import { ABBAOutcomeSimulationEngine, OutcomeScenario, SimulationResult } from './outcomeSimulationEngine';

export interface MissionIntelligenceInput {
  intent: Omit<IntentCandidate, 'requiresHumanClarification' | 'ambiguityReasons'> & { alternatives?: Array<Partial<IntentCandidate>> };
  mission: {
    missionId: string;
    objective: string;
    successCriteria: string[];
    constraints: MissionConstraint[];
    assumptions?: string[];
    uncertainties?: string[];
    tasks: MissionTask[];
  };
  uncertainties: UncertaintyRecord[];
  stewardshipImpacts: StewardshipImpact[];
  capabilityProvenance: CapabilityProvenanceRecord[];
  scenarios?: OutcomeScenario[];
}

export interface MissionIntelligenceResult {
  intent: ResolvedIntent;
  decomposition: MissionDecomposition;
  uncertainties: UncertaintyAssessment[];
  stewardship: StewardshipAssessment[];
  capabilityProvenance: CapabilityProvenanceAssessment[];
  simulation?: SimulationResult;
  executionAllowed: false;
}

export class ABBAMissionIntelligencePack {
  constructor(
    private readonly intentEngine = new ABBAIntentResolutionEngine(),
    private readonly missionEngine = new ABBAMissionDecompositionEngine(),
    private readonly uncertaintyLedger = new ABBAUncertaintyLedger(),
    private readonly stewardshipEngine = new ABBAStewardshipImpactEngine(),
    private readonly capabilityProvenanceEngine = new ABBACapabilityProvenanceEngine(),
    private readonly simulationEngine = new ABBAOutcomeSimulationEngine()
  ) {}

  analyze(input: MissionIntelligenceInput): MissionIntelligenceResult {
    const intent = this.intentEngine.resolve(input.intent);
    const decomposition = this.missionEngine.decompose(input.mission);
    const uncertainties = this.uncertaintyLedger.assessMany(input.uncertainties);
    const stewardship = this.stewardshipEngine.assessMany(input.stewardshipImpacts);
    const capabilityProvenance = this.capabilityProvenanceEngine.assessMany(input.capabilityProvenance);
    const simulation = input.scenarios?.length
      ? this.simulationEngine.simulate({ simulationId: input.mission.missionId + ':simulation', scenarios: input.scenarios })
      : undefined;

    return { intent, decomposition, uncertainties, stewardship, capabilityProvenance, simulation, executionAllowed: false };
  }
}
