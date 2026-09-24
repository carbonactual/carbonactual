export type CompletionProofStatus = 'COMPLETE' | 'INCOMPLETE' | 'BLOCKED' | 'WAITING_AUTHORIZATION';

export interface CompletionProofInput {
  cycleId: string;
  objective: string;
  evidenceRefs: string[];
  evidenceComplete: boolean;
  reconciliationComplete: boolean;
  outstandingJobIds: string[];
  blockers: string[];
  terminalReason?: string;
}

export interface CompletionProof {
  proofId: string;
  cycleId: string;
  objective: string;
  status: CompletionProofStatus;
  evidenceRefs: string[];
  evidenceComplete: boolean;
  reconciliationComplete: boolean;
  outstandingJobIds: string[];
  blockers: string[];
  terminalReason?: string;
  proofFingerprint: string;
  createdAt: string;
  isAuthorityGrant: false;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).sort().join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => JSON.stringify(key)+':'+stable(item)).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2,'0')).join('');
}

export async function buildCompletionProof(input: CompletionProofInput): Promise<CompletionProof> {
  const evidenceRefs = [...new Set(input.evidenceRefs)].sort();
  const outstandingJobIds = [...new Set(input.outstandingJobIds)].sort();
  const blockers = [...new Set(input.blockers)].sort();

  const status: CompletionProofStatus =
    blockers.length > 0
      ? blockers.some((blocker) => /authorization/i.test(blocker))
        ? 'WAITING_AUTHORIZATION'
        : 'BLOCKED'
      : input.evidenceComplete && input.reconciliationComplete && outstandingJobIds.length === 0
        ? 'COMPLETE'
        : 'INCOMPLETE';

  const material = stable({
    cycleId: input.cycleId,
    objective: input.objective,
    evidenceRefs,
    evidenceComplete: input.evidenceComplete,
    reconciliationComplete: input.reconciliationComplete,
    outstandingJobIds,
    blockers,
    terminalReason: input.terminalReason ?? null,
    status
  });

  return {
    proofId: crypto.randomUUID(),
    cycleId: input.cycleId,
    objective: input.objective,
    status,
    evidenceRefs,
    evidenceComplete: input.evidenceComplete,
    reconciliationComplete: input.reconciliationComplete,
    outstandingJobIds,
    blockers,
    terminalReason: input.terminalReason,
    proofFingerprint: await sha256(material),
    createdAt: new Date().toISOString(),
    isAuthorityGrant: false
  };
}
