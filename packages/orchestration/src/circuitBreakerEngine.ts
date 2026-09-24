export interface CircuitState {
  circuitId: string;
  consecutiveFailures: number;
  failureRate: number;
  threshold: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  openedAt?: string;
  lastTransitionAt: string;
  provenance: Record<string, unknown>;
}

export interface CircuitDecision {
  circuitId: string;
  state: CircuitState['state'];
  allowProbe: boolean;
  reasons: string[];
  executionAllowed: false;
}

export class ABBACircuitBreakerEngine {
  evaluate(state: CircuitState, now = new Date()): CircuitDecision {
    const reasons:string[]=[];
    if (state.failureRate >= state.threshold || state.consecutiveFailures >= 3) {
      reasons.push('FAILURE_THRESHOLD_REACHED');
    }

    if (state.state === 'OPEN') {
      reasons.push('CIRCUIT_OPEN');
      const openedAt = state.openedAt ? Date.parse(state.openedAt) : NaN;
      const cooldownElapsed = Number.isFinite(openedAt) && now.getTime() - openedAt >= 60_000;
      return {
        circuitId: state.circuitId,
        state: cooldownElapsed ? 'HALF_OPEN' : 'OPEN',
        allowProbe: cooldownElapsed,
        reasons,
        executionAllowed: false
      };
    }

    return {
      circuitId: state.circuitId,
      state: state.failureRate >= state.threshold ? 'OPEN' : state.state,
      allowProbe: state.failureRate < state.threshold,
      reasons,
      executionAllowed: false
    };
  }
}
