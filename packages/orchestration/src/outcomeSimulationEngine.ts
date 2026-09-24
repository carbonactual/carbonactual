export interface ScenarioVariable { name: string; baseline: number; low?: number; high?: number; unit?: string; }
export interface OutcomeScenario { scenarioId: string; label: string; variables: ScenarioVariable[]; expectedEffects: string[]; downsideRisks: string[]; assumptions: string[]; evidenceRefs: string[]; }
export interface SimulationResult {
  simulationId: string;
  scenarios: OutcomeScenario[];
  sensitivity: Array<{ variable: string; direction: 'LOWER' | 'HIGHER'; consequence: string }>;
  analysisOnly: true;
  isEvidenceOfFutureOutcome: false;
}

export class ABBAOutcomeSimulationEngine {
  simulate(input: { simulationId: string; scenarios: OutcomeScenario[] }): SimulationResult {
    const sensitivity = input.scenarios.flatMap((scenario) => scenario.variables.flatMap((variable) => [
      { variable: variable.name, direction: 'LOWER' as const, consequence: scenario.scenarioId + ':' + variable.name + ':lower-range analysis' },
      { variable: variable.name, direction: 'HIGHER' as const, consequence: scenario.scenarioId + ':' + variable.name + ':higher-range analysis' }
    ]));
    return { simulationId: input.simulationId, scenarios: input.scenarios, sensitivity, analysisOnly: true, isEvidenceOfFutureOutcome: false };
  }
}
