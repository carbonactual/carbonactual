export type WorkspaceArtifactKind =
  | 'FILE' | 'FOLDER' | 'REPOSITORY' | 'BRANCH' | 'COMMIT' | 'PULL_REQUEST'
  | 'RELEASE' | 'DOCUMENT' | 'DATASET' | 'ASSET' | 'CONFIGURATION';

export type WorkspaceArtifactState =
  | 'ACTIVE' | 'ARCHIVED' | 'HISTORICAL' | 'DEPRECATED' | 'MIGRATED' | 'MISSING' | 'UNKNOWN';

export interface WorkspaceArtifact {
  artifactId: string;
  kind: WorkspaceArtifactKind;
  locator: string;
  canonicalRef?: string;
  parentRef?: string;
  sourceRef?: string;
  state: WorkspaceArtifactState;
  contentFingerprint?: string;
  lineageRefs: string[];
  provenance: Record<string, unknown>;
  lastObservedAt: string;
}

export interface WorkspaceFinding {
  findingId: string;
  kind: 'DUPLICATE' | 'ORPHAN' | 'STALE' | 'DIVERGED' | 'MISSING_PROVENANCE' | 'UNRESOLVED_LINEAGE' | 'UNSAFE_MIGRATION';
  artifactRefs: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidenceRefs: string[];
  repairOptions: string[];
  blocksDestructiveAction: boolean;
}

export interface WorkspaceAssessment {
  artifactCount: number;
  findings: WorkspaceFinding[];
  canonicalSurfaceCount: number;
  historicalSurfaceCount: number;
  duplicateFingerprintCount: number;
  destructiveActionAllowed: false;
  repairRequiresGovernance: true;
}

export class ABBAWorkspaceIntelligenceEngine {
  assess(artifacts: WorkspaceArtifact[], evidenceRefs: string[] = []): WorkspaceAssessment {
    const findings: WorkspaceFinding[] = [];
    const fingerprints = new Map<string, WorkspaceArtifact[]>();
    const canonical = new Set<string>();

    for (const artifact of artifacts) {
      if (artifact.canonicalRef) canonical.add(artifact.canonicalRef);
      if (artifact.contentFingerprint) {
        const current = fingerprints.get(artifact.contentFingerprint) ?? [];
        current.push(artifact);
        fingerprints.set(artifact.contentFingerprint, current);
      }
      if (artifact.lineageRefs.length === 0) {
        findings.push({
          findingId: 'lineage:' + artifact.artifactId,
          kind: 'UNRESOLVED_LINEAGE',
          artifactRefs: [artifact.artifactId],
          severity: 'HIGH',
          evidenceRefs,
          repairOptions: ['REQUEST_LINEAGE_RECONSTRUCTION'],
          blocksDestructiveAction: true
        });
      }
      if (!artifact.sourceRef && artifact.state !== 'HISTORICAL') {
        findings.push({
          findingId: 'provenance:' + artifact.artifactId,
          kind: 'MISSING_PROVENANCE',
          artifactRefs: [artifact.artifactId],
          severity: 'MEDIUM',
          evidenceRefs,
          repairOptions: ['REQUEST_PROVENANCE_CAPTURE'],
          blocksDestructiveAction: true
        });
      }
    }

    for (const [fingerprint, group] of fingerprints) {
      if (group.length > 1) {
        findings.push({
          findingId: 'duplicate:' + fingerprint,
          kind: 'DUPLICATE',
          artifactRefs: group.map(item => item.artifactId),
          severity: 'MEDIUM',
          evidenceRefs,
          repairOptions: ['COMPARE_LINEAGE','DEDUPE_PROJECTION','PRESERVE_HISTORICAL_SOURCE'],
          blocksDestructiveAction: true
        });
      }
    }

    return {
      artifactCount: artifacts.length,
      findings,
      canonicalSurfaceCount: canonical.size,
      historicalSurfaceCount: artifacts.filter(a => a.state === 'HISTORICAL' || a.state === 'ARCHIVED').length,
      duplicateFingerprintCount: [...fingerprints.values()].filter(group => group.length > 1).length,
      destructiveActionAllowed: false,
      repairRequiresGovernance: true
    };
  }
}
