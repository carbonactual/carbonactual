import { ABBAWorkspaceIntelligenceEngine, WorkspaceArtifact, WorkspaceAssessment } from './workspaceIntelligenceEngine';
import { ABBAArtifactMigrationEngine, ArtifactMigrationRequest, ArtifactMigrationPlan } from './artifactMigrationEngine';
import { ABBAWorkspaceRecoveryEngine, WorkspaceRecoveryRequest, WorkspaceRecoveryPlan } from './workspaceRecoveryEngine';

export interface WorkspaceArtifactIntelligenceInput {
  artifacts: WorkspaceArtifact[];
  evidenceRefs: string[];
  migrations: ArtifactMigrationRequest[];
  recoveries: WorkspaceRecoveryRequest[];
}

export interface WorkspaceArtifactIntelligenceResult {
  workspace: WorkspaceAssessment;
  migrations: ArtifactMigrationPlan[];
  recoveries: WorkspaceRecoveryPlan[];
  executionAllowed: false;
}

export class ABBAWorkspaceArtifactIntelligencePack {
  constructor(
    private readonly workspaceEngine=new ABBAWorkspaceIntelligenceEngine(),
    private readonly migrationEngine=new ABBAArtifactMigrationEngine(),
    private readonly recoveryEngine=new ABBAWorkspaceRecoveryEngine()
  ) {}

  analyze(input:WorkspaceArtifactIntelligenceInput):WorkspaceArtifactIntelligenceResult {
    return {
      workspace:this.workspaceEngine.assess(input.artifacts,input.evidenceRefs),
      migrations:input.migrations.map(item=>this.migrationEngine.plan(item)),
      recoveries:input.recoveries.map(item=>this.recoveryEngine.plan(item)),
      executionAllowed:false
    };
  }
}
