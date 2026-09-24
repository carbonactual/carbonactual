import { ABBALanguageCapabilityEngine, LanguageCapability, LanguageCapabilityAssessment } from './languageCapabilityEngine';
import { ABBAKnowledgeIntegrityEngine, KnowledgeAtom, KnowledgeAssessment } from './knowledgeIntegrityEngine';
import { ABBAMasteryEngine, MasteryRecord, MasteryAssessment } from './masteryEngine';

export interface LearningPath {
  capabilityRef: string;
  targetLevel: MasteryRecord['level'];
  stages: Array<'DISCOVER' | 'ACQUIRE' | 'PRACTICE' | 'ASSESS' | 'VERIFY' | 'CERTIFY' | 'REASSESS'>;
  externalVerificationRequired: boolean;
  issuerRequired: boolean;
  provenance: Record<string, unknown>;
}

export interface UniversalKnowledgeMasteryInput {
  knowledgeAtoms: KnowledgeAtom[];
  languageCapabilities: LanguageCapability[];
  masteryRecords: MasteryRecord[];
}

export interface UniversalKnowledgeMasteryResult {
  knowledge: KnowledgeAssessment[];
  language: LanguageCapabilityAssessment[];
  mastery: MasteryAssessment[];
  learningPaths: LearningPath[];
  executionAllowed: false;
}

export class ABBAUniversalKnowledgeMasteryPack {
  constructor(
    private readonly knowledgeEngine = new ABBAKnowledgeIntegrityEngine(),
    private readonly languageEngine = new ABBALanguageCapabilityEngine(),
    private readonly masteryEngine = new ABBAMasteryEngine()
  ) {}

  assess(input: UniversalKnowledgeMasteryInput): UniversalKnowledgeMasteryResult {
    const knowledge = input.knowledgeAtoms.map(atom => this.knowledgeEngine.assess(atom));
    const language = input.languageCapabilities.map(capability => this.languageEngine.assess(capability));
    const mastery = input.masteryRecords.map(record => this.masteryEngine.assess(record));
    const learningPaths = input.masteryRecords.map(record => {
      const advanced = ['MASTER','EMERITUS'].includes(record.level);
      return {
        capabilityRef: record.capabilityRef,
        targetLevel: record.level,
        stages: ['DISCOVER','ACQUIRE','PRACTICE','ASSESS', ...(advanced ? ['VERIFY','CERTIFY','REASSESS'] : ['REASSESS'])],
        externalVerificationRequired: advanced,
        issuerRequired: advanced,
        provenance: { source: 'ABBAUniversalKnowledgeMasteryPack' }
      } as LearningPath;
    });
    return { knowledge, language, mastery, learningPaths, executionAllowed: false };
  }
}
