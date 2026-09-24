import { ABBACommunicationIntelligenceEngine, CommunicationRequest, CommunicationAssessment } from './communicationIntelligenceEngine';
import { ABBACommunicationRoutingEngine, ChannelCandidate, CommunicationRouteDecision } from './communicationRoutingEngine';
import { ABBADeliveryOutcomeEngine, DeliveryReceipt, CommunicationOutcome } from './deliveryOutcomeEngine';

export interface CommunicationIntelligenceInput {
  requests: CommunicationRequest[];
  recipientsResolved: Record<string, boolean>;
  relationshipsResolved: Record<string, boolean>;
  channels: ChannelCandidate[];
  receipts: DeliveryReceipt[];
}

export interface CommunicationIntelligenceResult {
  assessments: CommunicationAssessment[];
  routes: CommunicationRouteDecision[];
  outcomes: CommunicationOutcome[];
  executionAllowed: false;
}

export class ABBACommunicationIntelligencePack {
  constructor(
    private readonly intelligence=new ABBACommunicationIntelligenceEngine(),
    private readonly routing=new ABBACommunicationRoutingEngine(),
    private readonly outcomes=new ABBADeliveryOutcomeEngine()
  ) {}

  assess(input:CommunicationIntelligenceInput):CommunicationIntelligenceResult {
    const assessments=input.requests.map(request=>this.intelligence.assess(
      request,
      input.recipientsResolved[request.recipientRef]===true,
      request.relationshipRef ? input.relationshipsResolved[request.relationshipRef]===true : true
    ));
    const routes=input.requests.map(request=>this.routing.propose(request,input.channels));
    const outcomes=input.receipts.map(receipt=>this.outcomes.assess(receipt));
    return { assessments,routes,outcomes,executionAllowed:false };
  }
}
