export interface ContextField {
  path: string;
  dataClass: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET';
  purposeTags: string[];
  valueRef: string;
}

export interface ContextRequest {
  requesterRef: string;
  purpose: string;
  allowedClasses: Array<ContextField['dataClass']>;
  requiredPaths: string[];
  authorityRef?: string;
  permissionRef?: string;
  consentRef?: string;
  evidenceRefs: string[];
}

export interface RoutedContext {
  allowed: ContextField[];
  redactedPaths: string[];
  blockedPaths: string[];
  reasons: string[];
  minimumContextApplied: true;
  secretsExposed: false;
  authorityGranted: false;
}

const classRank:Record<ContextField['dataClass'],number>={PUBLIC:0,INTERNAL:1,CONFIDENTIAL:2,RESTRICTED:3,SECRET:4};

export class ABBAMinimumContextRouter {
  route(fields: ContextField[], request: ContextRequest): RoutedContext {
    const allowedClasses=new Set(request.allowedClasses);
    const allowed:ContextField[]=[];
    const redactedPaths:string[]=[];
    const blockedPaths:string[]=[];
    const reasons:string[]=[];

    if(request.evidenceRefs.length===0) reasons.push('CONTEXT_EVIDENCE_REQUIRED');
    const required=new Set(request.requiredPaths);

    for(const field of fields){
      const explicitlyRequired=required.has(field.path);
      const purposeMatches=field.purposeTags.includes(request.purpose);
      const classAllowed=allowedClasses.has(field.dataClass);

      if(field.dataClass==='SECRET'){
        blockedPaths.push(field.path);
        reasons.push('SECRET_DATA_DEFAULT_BLOCK');
        continue;
      }

      if(explicitlyRequired && purposeMatches && classAllowed){
        allowed.push(field);
      } else if(explicitlyRequired){
        redactedPaths.push(field.path);
        if(!classAllowed) reasons.push('DATA_CLASS_NOT_ALLOWED:'+field.path);
        if(!purposeMatches) reasons.push('PURPOSE_NOT_ALLOWED:'+field.path);
      } else if(classRank[field.dataClass] > Math.max(...[...allowedClasses].map(item=>classRank[item]),0)){
        blockedPaths.push(field.path);
      } else {
        redactedPaths.push(field.path);
      }
    }

    if(request.permissionRef && !request.authorityRef) reasons.push('PERMISSION_WITHOUT_AUTHORITY_CONTEXT');
    if(request.consentRef && !request.authorityRef) reasons.push('CONSENT_WITHOUT_AUTHORITY_CONTEXT');

    return {
      allowed,
      redactedPaths:[...new Set(redactedPaths)],
      blockedPaths:[...new Set(blockedPaths)],
      reasons:[...new Set(reasons)],
      minimumContextApplied:true,
      secretsExposed:false,
      authorityGranted:false
    };
  }
}
