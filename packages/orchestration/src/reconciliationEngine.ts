export type ReconciliationStatus =
  | 'MATCHED'
  | 'MISMATCHED'
  | 'MISSING_CANONICAL'
  | 'MISSING_SUBSTRATE'
  | 'STALE'
  | 'DUPLICATE'
  | 'CONTESTED'
  | 'UNKNOWN';

export interface ReconciliationInput {
  canonicalRef: string;
  canonicalFingerprint?: string;
  substrateKind: string;
  substrateRef: string;
  substrateFingerprint?: string;
  canonicalUpdatedAt?: string;
  substrateUpdatedAt?: string;
  duplicateCount?: number;
  evidenceRefs: string[];
}

export interface ReconciliationResult {
  canonicalRef: string;
  substrateKind: string;
  substrateRef: string;
  status: ReconciliationStatus;
  reason: string;
  evidenceRefs: string[];
  repairRequired: boolean;
}

export interface RepairProposal {
  repairId: string;
  target: ReconciliationResult;
  action:
    | 'REFRESH_BINDING'
    | 'REBUILD_PROJECTION'
    | 'REPLAY_EVENTS'
    | 'DEDUPE_PROJECTION'
    | 'ESCALATE_CONFLICT'
    | 'REQUEST_HUMAN_REVIEW';
  authorityRequired: true;
  executionAllowed: false;
}

export class ABBAReconciliationEngine {
  public reconcile(input: ReconciliationInput): ReconciliationResult {
    const evidenceRefs = [...new Set(input.evidenceRefs)];
    const duplicateCount = input.duplicateCount ?? 0;

    if (duplicateCount > 1) {
      return {
        canonicalRef: input.canonicalRef,
        substrateKind: input.substrateKind,
        substrateRef: input.substrateRef,
        status: 'DUPLICATE',
        reason: 'MULTIPLE_SUBSTRATE_RECORDS_MATCH_CANONICAL_REFERENCE',
        evidenceRefs,
        repairRequired: true
      };
    }

    if (!input.substrateFingerprint) {
      return {
        canonicalRef: input.canonicalRef,
        substrateKind: input.substrateKind,
        substrateRef: input.substrateRef,
        status: 'MISSING_SUBSTRATE',
        reason: 'SUBSTRATE_FINGERPRINT_MISSING',
        evidenceRefs,
        repairRequired: true
      };
    }

    if (!input.canonicalFingerprint) {
      return {
        canonicalRef: input.canonicalRef,
        substrateKind: input.substrateKind,
        substrateRef: input.substrateRef,
        status: 'MISSING_CANONICAL',
        reason: 'CANONICAL_FINGERPRINT_MISSING',
        evidenceRefs,
        repairRequired: true
      };
    }

    if (input.canonicalUpdatedAt && input.substrateUpdatedAt) {
      const canonicalTime = Date.parse(input.canonicalUpdatedAt);
      const substrateTime = Date.parse(input.substrateUpdatedAt);
      if (Number.isFinite(canonicalTime) && Number.isFinite(substrateTime) && substrateTime < canonicalTime) {
        return {
          canonicalRef: input.canonicalRef,
          substrateKind: input.substrateKind,
          substrateRef: input.substrateRef,
          status: 'STALE',
          reason: 'SUBSTRATE_LAGS_CANONICAL_RECORD',
          evidenceRefs,
          repairRequired: true
        };
      }
    }

    if (input.canonicalFingerprint !== input.substrateFingerprint) {
      return {
        canonicalRef: input.canonicalRef,
        substrateKind: input.substrateKind,
        substrateRef: input.substrateRef,
        status: 'MISMATCHED',
        reason: 'CANONICAL_AND_SUBSTRATE_FINGERPRINTS_DIFFER',
        evidenceRefs,
        repairRequired: true
      };
    }

    return {
      canonicalRef: input.canonicalRef,
      substrateKind: input.substrateKind,
      substrateRef: input.substrateRef,
      status: 'MATCHED',
      reason: 'CANONICAL_AND_SUBSTRATE_RECORDS_RECONCILED',
      evidenceRefs,
      repairRequired: false
    };
  }

  public proposeRepair(result: ReconciliationResult): RepairProposal | null {
    if (!result.repairRequired) return null;

    const action =
      result.status === 'DUPLICATE'
        ? 'DEDUPE_PROJECTION'
        : result.status === 'MISMATCHED' || result.status === 'STALE'
          ? 'REBUILD_PROJECTION'
          : result.status === 'CONTESTED'
            ? 'ESCALATE_CONFLICT'
            : 'REFRESH_BINDING';

    return {
      repairId: `repair_${crypto.randomUUID()}`,
      target: result,
      action,
      authorityRequired: true,
      executionAllowed: false
    };
  }
}
