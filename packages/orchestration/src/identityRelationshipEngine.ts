export type IdentityFacet = 'ACTUAL' | 'LEGAL' | 'OPERATIONAL' | 'ECONOMIC' | 'DIGITAL' | 'RELATIONSHIP';
export type RelationshipKind = 'OWNER' | 'ADMINISTRATOR' | 'DELEGATE' | 'EMPLOYEE' | 'CUSTOMER' | 'SUPPLIER' | 'PARTNER' | 'MEMBER' | 'GUARDIAN' | 'DEPENDENT' | 'OBSERVER' | 'OTHER';
export type DataClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET';

export interface IdentityRecord {
  identityRef: string;
  entityRef: string;
  facet: IdentityFacet;
  status: 'VERIFIED' | 'PROVISIONAL' | 'CONTESTED' | 'REVOKED';
  sourceRefs: string[];
  evidenceRefs: string[];
  provenance: Record<string, unknown>;
}

export interface RelationshipRecord {
  relationshipId: string;
  subjectRef: string;
  relatedRef: string;
  kind: RelationshipKind;
  scope: string[];
  validFrom?: string;
  validUntil?: string;
  evidenceRefs: string[];
  provenance: Record<string, unknown>;
}

export interface IdentityRelationshipAssessment {
  identityRef: string;
  entityRef: string;
  facet: IdentityFacet;
  identityAccepted: boolean;
  relationshipAccepted: boolean;
  authorityInferred: false;
  permissionInferred: false;
  reasons: string[];
}

export class ABBAIdentityRelationshipEngine {
  assess(identity: IdentityRecord, relationship?: RelationshipRecord, now=new Date()): IdentityRelationshipAssessment {
    const reasons:string[]=[];
    if(!identity.identityRef.trim()) reasons.push('IDENTITY_REF_REQUIRED');
    if(!identity.entityRef.trim()) reasons.push('ENTITY_REF_REQUIRED');
    if(identity.sourceRefs.length===0) reasons.push('IDENTITY_SOURCE_REQUIRED');
    if(identity.evidenceRefs.length===0) reasons.push('IDENTITY_EVIDENCE_REQUIRED');
    if(identity.status==='REVOKED') reasons.push('IDENTITY_REVOKED');
    if(identity.status==='CONTESTED') reasons.push('IDENTITY_CONTESTED');

    let relationshipAccepted=false;
    if(relationship){
      if(relationship.subjectRef!==identity.entityRef && relationship.relatedRef!==identity.entityRef) reasons.push('RELATIONSHIP_ENTITY_MISMATCH');
      if(relationship.evidenceRefs.length===0) reasons.push('RELATIONSHIP_EVIDENCE_REQUIRED');
      if(relationship.validUntil && Date.parse(relationship.validUntil)<=now.getTime()) reasons.push('RELATIONSHIP_EXPIRED');
      relationshipAccepted=!reasons.some(reason=>[
        'RELATIONSHIP_ENTITY_MISMATCH','RELATIONSHIP_EVIDENCE_REQUIRED','RELATIONSHIP_EXPIRED'
      ].includes(reason));
    }

    return {
      identityRef:identity.identityRef,
      entityRef:identity.entityRef,
      facet:identity.facet,
      identityAccepted:!reasons.some(reason=>[
        'IDENTITY_REF_REQUIRED','ENTITY_REF_REQUIRED','IDENTITY_SOURCE_REQUIRED','IDENTITY_EVIDENCE_REQUIRED','IDENTITY_REVOKED','IDENTITY_CONTESTED'
      ].includes(reason)),
      relationshipAccepted,
      authorityInferred:false,
      permissionInferred:false,
      reasons:[...new Set(reasons)]
    };
  }
}
