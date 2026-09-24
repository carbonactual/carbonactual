export interface DeliveryReceipt {
  communicationId: string;
  channel: string;
  state: 'SENT' | 'DELIVERED' | 'BOUNCED' | 'FAILED' | 'EXPIRED';
  providerMessageRef?: string;
  observedAt: string;
  evidenceRefs: string[];
  providerAcknowledged?: boolean;
  recipientAcknowledged?: boolean;
  provenance: Record<string, unknown>;
}

export interface CommunicationOutcome {
  communicationId: string;
  deliveryState: DeliveryReceipt['state'];
  providerAcknowledged: boolean;
  recipientAcknowledged: boolean;
  completed: boolean;
  evidenceComplete: boolean;
  reasons: string[];
  isTruth: false;
}

export class ABBADeliveryOutcomeEngine {
  assess(receipt:DeliveryReceipt):CommunicationOutcome {
    const reasons:string[]=[];
    if(receipt.evidenceRefs.length===0) reasons.push('DELIVERY_EVIDENCE_REQUIRED');
    if(receipt.state==='FAILED') reasons.push('DELIVERY_FAILED');
    if(receipt.state==='BOUNCED') reasons.push('DELIVERY_BOUNCED');
    if(receipt.recipientAcknowledged!==true) reasons.push('RECIPIENT_ACKNOWLEDGEMENT_NOT_ESTABLISHED');
    const completed=receipt.state==='DELIVERED' && receipt.recipientAcknowledged===true;
    return {
      communicationId:receipt.communicationId,
      deliveryState:receipt.state,
      providerAcknowledged:receipt.providerAcknowledged===true,
      recipientAcknowledged:receipt.recipientAcknowledged===true,
      completed,
      evidenceComplete:receipt.evidenceRefs.length>0,
      reasons:[...new Set(reasons)],
      isTruth:false
    };
  }
}
