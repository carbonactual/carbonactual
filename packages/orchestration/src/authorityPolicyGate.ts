export type GateDecision = 'ALLOW' | 'DENY' | 'REQUIRE_HUMAN_AUTHORIZATION';

export interface AuthorityContext {
  principalEntityId: string;
  delegationRef?: string;
  authorityRef?: string;
  scope: string;
  jurisdiction: string;
  capability: string;
  policyVersion: string;
  intent: string;
  riskClass: 'LOW' | 'MEDIUM' | 'HIGH';
  correlationId: string;
  idempotencyKey: string;
  provenance: Record<string, unknown>;
  expiresAt: string;
  consentRef?: string;
}

export interface AuthorityEvaluation { eligible: boolean; reason?: string; }
export interface PolicyEvaluation { allowed: boolean; requiresHumanAuthorization?: boolean; reason?: string; }
export interface ConsentEvaluation { required: boolean; satisfied: boolean; reason?: string; }
export interface AuthorityEvaluator { evaluate(context: AuthorityContext): Promise<AuthorityEvaluation>; }
export interface PolicyEvaluator { evaluate(context: AuthorityContext): Promise<PolicyEvaluation>; }
export interface ConsentEvaluator { evaluate(context: AuthorityContext): Promise<ConsentEvaluation>; }

export interface GateResult {
  decision: GateDecision;
  authority: AuthorityEvaluation;
  policy: PolicyEvaluation;
  consent: ConsentEvaluation;
  reasons: string[];
  evaluatedAt: string;
}

const REQUIRED_STRING_FIELDS: Array<keyof AuthorityContext> = [
  'principalEntityId','scope','jurisdiction','capability','policyVersion','intent','correlationId','idempotencyKey','expiresAt'
];

export class ABBAAuthorityPolicyGate {
  constructor(
    private readonly authorityEvaluator: AuthorityEvaluator,
    private readonly policyEvaluator: PolicyEvaluator,
    private readonly consentEvaluator: ConsentEvaluator
  ) {}

  public async evaluate(context: AuthorityContext): Promise<GateResult> {
    const missing = REQUIRED_STRING_FIELDS.filter((field) => {
      const value = context[field];
      return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missing.length) {
      return {
        decision: 'DENY',
        authority: { eligible: false, reason: 'REQUIRED_AUTHORITY_CONTEXT_MISSING' },
        policy: { allowed: false, reason: 'REQUIRED_AUTHORITY_CONTEXT_MISSING' },
        consent: { required: true, satisfied: false, reason: 'REQUIRED_AUTHORITY_CONTEXT_MISSING' },
        reasons: missing.map((field) => `MISSING_${String(field).toUpperCase()}`),
        evaluatedAt: new Date().toISOString()
      };
    }

    const expiry = Date.parse(context.expiresAt);
    if (!Number.isFinite(expiry)) {
      return {
        decision: 'DENY',
        authority: { eligible: false, reason: 'AUTHORITY_EXPIRY_INVALID' },
        policy: { allowed: false, reason: 'AUTHORITY_EXPIRY_INVALID' },
        consent: { required: false, satisfied: true },
        reasons: ['AUTHORITY_EXPIRY_INVALID'],
        evaluatedAt: new Date().toISOString()
      };
    }

    if (expiry <= Date.now()) {
      return {
        decision: 'DENY',
        authority: { eligible: false, reason: 'AUTHORITY_CONTEXT_EXPIRED' },
        policy: { allowed: false, reason: 'AUTHORITY_CONTEXT_EXPIRED' },
        consent: { required: false, satisfied: true },
        reasons: ['AUTHORITY_CONTEXT_EXPIRED'],
        evaluatedAt: new Date().toISOString()
      };
    }

    if (!context.authorityRef) {
      return {
        decision: 'REQUIRE_HUMAN_AUTHORIZATION',
        authority: { eligible: false, reason: 'AUTHORITY_REFERENCE_REQUIRED' },
        policy: { allowed: false, requiresHumanAuthorization: true, reason: 'AUTHORITY_REFERENCE_REQUIRED' },
        consent: { required: true, satisfied: false, reason: 'AUTHORITY_REFERENCE_REQUIRED' },
        reasons: ['AUTHORITY_REFERENCE_REQUIRED'],
        evaluatedAt: new Date().toISOString()
      };
    }

    const [authority, policy, consent] = await Promise.all([
      this.authorityEvaluator.evaluate(context),
      this.policyEvaluator.evaluate(context),
      this.consentEvaluator.evaluate(context)
    ]);

    const reasons: string[] = [];
    if (!authority.eligible) reasons.push(authority.reason ?? 'AUTHORITY_NOT_ELIGIBLE');
    if (!policy.allowed) reasons.push(policy.reason ?? 'POLICY_DENIED');
    if (consent.required && !consent.satisfied) reasons.push(consent.reason ?? 'CONSENT_REQUIRED');

    if (!authority.eligible || !policy.allowed) {
      return { decision: 'DENY', authority, policy, consent, reasons, evaluatedAt: new Date().toISOString() };
    }

    if (policy.requiresHumanAuthorization || (consent.required && !consent.satisfied) || context.riskClass === 'HIGH') {
      if (context.riskClass === 'HIGH' && !policy.requiresHumanAuthorization) reasons.push('HIGH_RISK_HUMAN_REVIEW_REQUIRED');
      return { decision: 'REQUIRE_HUMAN_AUTHORIZATION', authority, policy, consent, reasons, evaluatedAt: new Date().toISOString() };
    }

    return { decision: 'ALLOW', authority, policy, consent, reasons: [], evaluatedAt: new Date().toISOString() };
  }
}
