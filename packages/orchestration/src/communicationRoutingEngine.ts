import type { CommunicationRequest, ChannelKind } from './communicationIntelligenceEngine';

export interface ChannelCandidate {
  channel: ChannelKind;
  available: boolean;
  supportedLanguageCodes: string[];
  supportedModalities: string[];
  deliveryReliability: number;
  costUnits: number;
  latencyMs: number;
  relationshipFit: number;
  privacyClasses: CommunicationRequest['dataClass'][];
  evidenceRefs: string[];
}

export interface CommunicationRouteDecision {
  communicationId: string;
  selectedChannel?: ChannelKind;
  fallbackChannels: ChannelKind[];
  reasons: string[];
  routeProposed: boolean;
  executionAllowed: false;
}

function clamp(v:number){return Math.max(0,Math.min(1,v));}

export class ABBACommunicationRoutingEngine {
  propose(request:CommunicationRequest, candidates:ChannelCandidate[]):CommunicationRouteDecision {
    const usable=candidates.filter(candidate =>
      candidate.available &&
      candidate.evidenceRefs.length>0 &&
      candidate.privacyClasses.includes(request.dataClass) &&
      (!request.languageCode || candidate.supportedLanguageCodes.includes(request.languageCode))
    );
    const ranked=[...usable].sort((a,b)=>{
      const sa=0.35*clamp(a.deliveryReliability)+0.25*clamp(a.relationshipFit)+0.2*(1-Math.min(1,a.latencyMs/10000))+0.2*(1-Math.min(1,a.costUnits/1000));
      const sb=0.35*clamp(b.deliveryReliability)+0.25*clamp(b.relationshipFit)+0.2*(1-Math.min(1,b.latencyMs/10000))+0.2*(1-Math.min(1,b.costUnits/1000));
      return sb-sa;
    });
    return {
      communicationId:request.communicationId,
      selectedChannel:ranked[0]?.channel,
      fallbackChannels:ranked.slice(1).map(item=>item.channel),
      reasons:ranked.length?['CHANNEL_ROUTE_PROPOSED']:['NO_PRIVACY_AND_LANGUAGE_COMPATIBLE_CHANNEL'],
      routeProposed:ranked.length>0,
      executionAllowed:false
    };
  }
}
