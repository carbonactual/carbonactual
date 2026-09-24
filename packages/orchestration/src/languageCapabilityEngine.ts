export type LanguageCapabilityKind =
  | 'LISTEN' | 'SPEAK' | 'READ' | 'WRITE' | 'SIGN' | 'BRAILLE'
  | 'DICTIONARY' | 'SENSE_DISAMBIGUATION' | 'GRAMMAR' | 'IDIOM' | 'SLANG'
  | 'QUOTATION' | 'LITERATURE' | 'CULTURAL_CONTEXT' | 'CODE_SWITCHING' | 'TRANSLATION' | 'TRANSCRIPTION';

export interface LanguageCapability {
  capabilityId: string;
  languageCode: string;
  script?: string;
  modality: 'SPOKEN' | 'WRITTEN' | 'SIGNED' | 'BRAILLE' | 'SYMBOLIC' | 'PROGRAMMING' | 'TACTILE' | 'VISUAL' | 'AUDIOVISUAL';
  kind: LanguageCapabilityKind;
  coverage: string[];
  evidenceRefs: string[];
  level: 'FOUNDATION' | 'PRACTICE' | 'PROFESSIONAL' | 'SPECIALIST' | 'MASTER' | 'EMERITUS';
}

export interface LanguageCapabilityAssessment {
  capabilityId: string;
  valid: boolean;
  evidenceSufficient: boolean;
  certificationRequired: boolean;
  reasons: string[];
  operationalAuthority: false;
}

export class ABBALanguageCapabilityEngine {
  assess(capability: LanguageCapability): LanguageCapabilityAssessment {
    const reasons:string[]=[];
    if(!capability.capabilityId.trim()) reasons.push('LANGUAGE_CAPABILITY_ID_REQUIRED');
    if(!capability.languageCode.trim()) reasons.push('LANGUAGE_CODE_REQUIRED');
    if(capability.coverage.length===0) reasons.push('LANGUAGE_COVERAGE_REQUIRED');
    const evidenceSufficient = capability.evidenceRefs.length > 0;
    if(!evidenceSufficient) reasons.push('LANGUAGE_EVIDENCE_REQUIRED');
    const certificationRequired = ['MASTER','EMERITUS'].includes(capability.level);
    if(certificationRequired) reasons.push('EXTERNAL_VERIFICATION_REQUIRED_FOR_ADVANCED_MASTERY');
    return {
      capabilityId: capability.capabilityId,
      valid: reasons.every(r => !r.endsWith('_REQUIRED') || (r === 'EXTERNAL_VERIFICATION_REQUIRED_FOR_ADVANCED_MASTERY')),
      evidenceSufficient,
      certificationRequired,
      reasons,
      operationalAuthority: false
    };
  }
}
