export type IntentSource = 'EXPLICIT_HUMAN' | 'CANONICAL_EVENT' | 'GOVERNED_SYSTEM_SIGNAL' | 'DERIVED_CONTEXT';

export interface IntentCandidate {
  intentId: string;
  statement: string;
  source: IntentSource;
  subjectRefs: string[];
  constraints: string[];
  successCriteria: string[];
  ambiguityReasons: string[];
  confidence: number;
  requiresHumanClarification: boolean;
  provenance: Record<string, unknown>;
}

export interface ResolvedIntent {
  intentId: string;
  candidates: IntentCandidate[];
  selectedCandidateId?: string;
  clarificationRequired: boolean;
  resolutionBasis: string[];
  executionAllowed: false;
}

function clamp(v:number){return Math.max(0,Math.min(1,v));}
function unique(xs:string[]){return [...new Set(xs.map(x=>x.trim()).filter(Boolean))];}

export class ABBAIntentResolutionEngine {
  resolve(input: Omit<IntentCandidate,'requiresHumanClarification'|'ambiguityReasons'> & { alternatives?: Array<Partial<IntentCandidate>> }): ResolvedIntent {
    const candidates: IntentCandidate[] = [];
    const sourceCandidates = [input, ...(input.alternatives ?? [])];

    for (let i=0;i<sourceCandidates.length;i+=1) {
      const candidate = sourceCandidates[i];
      const ambiguityReasons = [
        ...(!candidate.statement?.trim() ? ['INTENT_STATEMENT_REQUIRED'] : []),
        ...(candidate.successCriteria?.length ? [] : ['SUCCESS_CRITERIA_REQUIRED']),
        ...(candidate.source === 'DERIVED_CONTEXT' ? ['INTENT_DERIVED_NOT_HUMAN_EXPLICIT'] : [])
      ];
      candidates.push({
        intentId: candidate.intentId ?? `intent_candidate_${i+1}`,
        statement: candidate.statement ?? '',
        source: candidate.source ?? 'DERIVED_CONTEXT',
        subjectRefs: unique(candidate.subjectRefs ?? []),
        constraints: unique(candidate.constraints ?? []),
        successCriteria: unique(candidate.successCriteria ?? []),
        ambiguityReasons,
        confidence: Number(clamp(candidate.confidence ?? 0).toFixed(6)),
        requiresHumanClarification: ambiguityReasons.length > 0 || sourceCandidates.length > 1,
        provenance: candidate.provenance ?? {}
      });
    }

    const explicit = candidates.filter(c => c.source === 'EXPLICIT_HUMAN' && !c.ambiguityReasons.length);
    const selected = explicit.length === 1 ? explicit[0] : undefined;

    return {
      intentId: input.intentId,
      candidates,
      selectedCandidateId: selected?.intentId,
      clarificationRequired: !selected || candidates.length !== 1,
      resolutionBasis: selected
        ? ['EXPLICIT_HUMAN_INTENT','SUCCESS_CRITERIA_PRESENT','NO_UNRESOLVED_AMBIGUITY']
        : ['AMBIGUITY_OR_MISSING_SUCCESS_CRITERIA_REQUIRES_CLARIFICATION'],
      executionAllowed: false
    };
  }
}
