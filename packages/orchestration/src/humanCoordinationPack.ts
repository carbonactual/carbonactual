import { ABBAHumanCoordinationEngine, HumanCoordinationRequest, HumanCoordinationAssessment } from './humanCoordinationEngine';
import { ABBAConsentBoundary, ConsentRequest, ConsentDecision } from './consentBoundary';
import { ABBAHumanAuthorizationBoundary, HumanAuthorizationRecord, AuthorizationAssessment } from './humanAuthorizationBoundary';

export interface HumanCoordinationInput {
  requests: HumanCoordinationRequest[];
  consents: ConsentRequest[];
  authorizations: HumanAuthorizationRecord[];
}

export interface HumanCoordinationResult {
  requests: HumanCoordinationAssessment[];
  consents: ConsentDecision[];
  authorizations: AuthorizationAssessment[];
  blockingRequestIds: string[];
  executionAllowed: false;
}

export class ABBAHumanCoordinationPack {
  constructor(
    private readonly coordinationEngine=new ABBAHumanCoordinationEngine(),
    private readonly consentBoundary=new ABBAConsentBoundary(),
    private readonly authorizationBoundary=new ABBAHumanAuthorizationBoundary()
  ) {}

  assess(input: HumanCoordinationInput): HumanCoordinationResult {
    const requests=input.requests.map(request=>this.coordinationEngine.assess(request));
    const consents=input.consents.map(request=>this.consentBoundary.request(request));
    const authorizations=input.authorizations.map(record=>this.authorizationBoundary.assess(record));
    return {
      requests,
      consents,
      authorizations,
      blockingRequestIds:requests.filter(item=>item.blocking).map(item=>item.requestId),
      executionAllowed:false
    };
  }
}
