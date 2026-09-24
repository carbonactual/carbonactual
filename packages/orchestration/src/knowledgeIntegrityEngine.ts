export type KnowledgeAtomKind =
  | 'WORD' | 'SENSE' | 'DEFINITION' | 'GRAMMAR_RULE' | 'LANGUAGE_PATTERN' | 'QUOTE' | 'IDIOM' | 'SLANG'
  | 'CODE' | 'SIGNAL' | 'RIDDLE' | 'JOKE' | 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'MAP' | 'DATASET'
  | 'DOCUMENT' | 'FILE' | 'FOLDER' | 'REPOSITORY' | 'COURSE' | 'LESSON' | 'EXAM' | 'PROCEDURE' | 'POLICY'
  | 'STANDARD' | 'RESEARCH' | 'THEORY' | 'HYPOTHESIS' | 'CASE_STUDY' | 'MODEL' | 'METHOD' | 'SPECIFICATION'
  | 'LAW' | 'REGULATION' | 'TRANSACTIONAL_RECORD' | 'MEDIA' | 'CULTURAL_OBJECT';

export type KnowledgeSourceKind =
  | 'PRIMARY_OFFICIAL' | 'PRIMARY_RESEARCH' | 'ACADEMIC' | 'STANDARD_BODY'
  | 'PRACTITIONER' | 'COMMUNITY' | 'USER_PROVIDED' | 'MODEL_DERIVED' | 'UNKNOWN';

export interface KnowledgeAtom {
  atomId: string;
  kind: KnowledgeAtomKind;
  label: string;
  contentRef: string;
  languageCode?: string;
  modality?: string;
  sourceKind: KnowledgeSourceKind;
  sourceRefs: string[];
  observedAt?: string;
  validFrom?: string;
  validUntil?: string;
  supersedes?: string[];
  contradicts?: string[];
  provenance: Record<string, unknown>;
}

export interface KnowledgeAssessment {
  atomId: string;
  sourceKind: KnowledgeSourceKind;
  sourceProvenanceAccepted: boolean;
  stale: boolean;
  contradictory: boolean;
  promotionStatus: 'PROVISIONAL' | 'SUPPORTED' | 'CONTESTED';
  isTruth: false;
  reasons: string[];
}

function unique(values:string[]){return [...new Set(values.map(v=>v.trim()).filter(Boolean))];}

export class ABBAKnowledgeIntegrityEngine {
  assess(atom: KnowledgeAtom, now = new Date()): KnowledgeAssessment {
    const reasons:string[]=[];
    const until = atom.validUntil ? Date.parse(atom.validUntil) : Number.NaN;
    const stale = Number.isFinite(until) && until < now.getTime();
    const contradictory = (atom.contradicts?.length ?? 0) > 0;
    if (!atom.atomId.trim()) reasons.push('ATOM_ID_REQUIRED');
    if (!atom.label.trim()) reasons.push('ATOM_LABEL_REQUIRED');
    if (!atom.contentRef.trim()) reasons.push('ATOM_CONTENT_REF_REQUIRED');
    if (atom.sourceRefs.length === 0) reasons.push('SOURCE_REFERENCE_REQUIRED');
    if (atom.sourceKind === 'UNKNOWN') reasons.push('UNKNOWN_SOURCE_PROVENANCE');
    if (atom.sourceKind === 'MODEL_DERIVED') reasons.push('MODEL_DERIVED_REQUIRES_EXTERNAL_SUPPORT');
    if (stale) reasons.push('KNOWLEDGE_STALE');
    if (contradictory) reasons.push('KNOWLEDGE_CONTESTED');
    const promotionStatus = contradictory
      ? 'CONTESTED'
      : reasons.some(r => ['UNKNOWN_SOURCE_PROVENANCE','MODEL_DERIVED_REQUIRES_EXTERNAL_SUPPORT','SOURCE_REFERENCE_REQUIRED'].includes(r))
        ? 'PROVISIONAL'
        : 'SUPPORTED';
    return {
      atomId: atom.atomId,
      sourceKind: atom.sourceKind,
      sourceProvenanceAccepted: !reasons.includes('UNKNOWN_SOURCE_PROVENANCE') && !reasons.includes('SOURCE_REFERENCE_REQUIRED'),
      stale,
      contradictory,
      promotionStatus,
      isTruth: false,
      reasons: unique(reasons)
    };
  }
}

export function knowledgeGraphFingerprint(atoms: KnowledgeAtom[]): string {
  const material = atoms
    .map(atom => ({ atomId:atom.atomId, kind:atom.kind, label:atom.label, contentRef:atom.contentRef, sourceRefs:unique(atom.sourceRefs).sort(), supersedes:unique(atom.supersedes ?? []).sort(), contradicts:unique(atom.contradicts ?? []).sort() }))
    .sort((a,b)=>a.atomId.localeCompare(b.atomId));
  return JSON.stringify(material);
}
