export type ReasoningArtifactType =
  | 'THEORY'
  | 'HYPOTHESIS'
  | 'OBSERVATION'
  | 'EVIDENCE'
  | 'RESULT'
  | 'CONCLUSION'
  | 'RECOMMENDATION'
  | 'DECISION';

export interface ReasoningArtifact {
  artifactId: string;
  type: ReasoningArtifactType;
  statement: string;
  basisRefs: string[];
  sourceRefs?: string[];
  testPlanRefs?: string[];
  procedureRef?: string;
  authorityRef?: string;
  permissionRef?: string;
  consentRef?: string;
  provenance: Record<string, unknown>;
  confidence?: number;
}

export interface ReasoningAssessment {
  artifactId: string;
  type: ReasoningArtifactType;
  valid: boolean;
  reasons: string[];
  basisRefs: string[];
  confidence: number;
  executionAllowed: false;
  authorityRequired: true;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export class ABBAReasoningAssuranceEngine {
  public assess(artifact: ReasoningArtifact): ReasoningAssessment {
    const reasons: string[] = [];
    const basisRefs = unique(artifact.basisRefs ?? []);
    const sourceRefs = unique(artifact.sourceRefs ?? []);
    const testPlanRefs = unique(artifact.testPlanRefs ?? []);
    const hasStatement = artifact.statement.trim().length > 0;

    if (!artifact.artifactId.trim()) reasons.push('ARTIFACT_ID_REQUIRED');
    if (!hasStatement) reasons.push('ARTIFACT_STATEMENT_REQUIRED');
    if (!Array.isArray(artifact.basisRefs)) reasons.push('BASIS_REFS_REQUIRED');

    switch (artifact.type) {
      case 'THEORY':
        reasons.push('THEORY_IS_EXPLANATORY_MODEL_NOT_EVIDENCE');
        break;
      case 'HYPOTHESIS':
        if (testPlanRefs.length === 0) reasons.push('HYPOTHESIS_TEST_PLAN_REQUIRED');
        reasons.push('HYPOTHESIS_REMAINS_HYPOTHESIS');
        break;
      case 'OBSERVATION':
        if (sourceRefs.length === 0) reasons.push('OBSERVATION_SOURCE_REQUIRED');
        break;
      case 'EVIDENCE':
        if (sourceRefs.length === 0) reasons.push('EVIDENCE_SOURCE_REQUIRED');
        break;
      case 'RESULT':
        if (!artifact.procedureRef?.trim()) reasons.push('RESULT_PROCEDURE_REQUIRED');
        if (!basisRefs.some((ref) => ref.startsWith('evidence:'))) reasons.push('RESULT_EVIDENCE_BASIS_REQUIRED');
        break;
      case 'CONCLUSION':
        if (!basisRefs.some((ref) => ref.startsWith('result:') || ref.startsWith('evidence:'))) {
          reasons.push('CONCLUSION_RESULT_OR_EVIDENCE_BASIS_REQUIRED');
        }
        if (!basisRefs.some((ref) => ref.startsWith('reasoning:'))) reasons.push('CONCLUSION_REASONING_BASIS_REQUIRED');
        break;
      case 'RECOMMENDATION':
        if (!basisRefs.some((ref) => ref.startsWith('conclusion:'))) reasons.push('RECOMMENDATION_CONCLUSION_BASIS_REQUIRED');
        break;
      case 'DECISION':
        if (!artifact.authorityRef?.trim()) reasons.push('DECISION_AUTHORITY_REFERENCE_REQUIRED');
        if (!artifact.consentRef?.trim()) reasons.push('DECISION_CONSENT_REFERENCE_REQUIRED');
        break;
    }

    if (artifact.permissionRef && !artifact.authorityRef) reasons.push('PERMISSION_DOES_NOT_IMPLY_AUTHORITY');
    if (artifact.type === 'RECOMMENDATION') reasons.push('RECOMMENDATION_IS_NOT_AUTHORIZATION');
    if (artifact.type === 'DECISION') reasons.push('DECISION_REQUIRES_INDEPENDENT_GOVERNANCE_VALIDATION');

    const invalidBoundaryReasons = [
      'ARTIFACT_ID_REQUIRED',
      'ARTIFACT_STATEMENT_REQUIRED',
      'BASIS_REFS_REQUIRED',
      'HYPOTHESIS_TEST_PLAN_REQUIRED',
      'OBSERVATION_SOURCE_REQUIRED',
      'EVIDENCE_SOURCE_REQUIRED',
      'RESULT_PROCEDURE_REQUIRED',
      'RESULT_EVIDENCE_BASIS_REQUIRED',
      'CONCLUSION_RESULT_OR_EVIDENCE_BASIS_REQUIRED',
      'CONCLUSION_REASONING_BASIS_REQUIRED',
      'RECOMMENDATION_CONCLUSION_BASIS_REQUIRED',
      'DECISION_AUTHORITY_REFERENCE_REQUIRED',
      'DECISION_CONSENT_REFERENCE_REQUIRED',
      'PERMISSION_DOES_NOT_IMPLY_AUTHORITY',
    ];

    return {
      artifactId: artifact.artifactId,
      type: artifact.type,
      valid: reasons.every((reason) => !invalidBoundaryReasons.includes(reason)),
      reasons: unique(reasons),
      basisRefs,
      confidence: Number(clamp(artifact.confidence ?? 0).toFixed(6)),
      executionAllowed: false,
      authorityRequired: true
    };
  }

  public assessMany(artifacts: ReasoningArtifact[]): ReasoningAssessment[] {
    return artifacts.map((artifact) => this.assess(artifact));
  }
}
