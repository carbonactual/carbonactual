import type { ReconciliationInput } from './reconciliationEngine';
import type { SubstrateBinding } from './abbaSupervisor';
import type { SupabaseTableReader } from './supabaseRuntimeAdapters';

export interface LiveSubstrateBindingSpec {
  canonicalRef: string;
  substrateKind: SubstrateBinding['substrateKind'];
  substrateRef: string;
  identityColumns: string[];
  canonicalFingerprint?: string;
  lookup?: Record<string, string>;
}

export interface LiveSubstrateObservation {
  binding: LiveSubstrateBindingSpec;
  rowsObserved: number;
  substrateFingerprint?: string;
  reconciliation: ReconciliationInput;
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).sort().join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([key,item]) => JSON.stringify(key)+':'+stable(item)).join(',')}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(rows: Array<Record<string, unknown>>, identityColumns: string[]): string | undefined {
  if (!rows.length) return undefined;
  const normalized = rows.map((row) => {
    const identity = Object.fromEntries(identityColumns.map((column) => [column, row[column] ?? null]));
    return identity;
  });
  return stable(normalized.sort((a,b) => stable(a).localeCompare(stable(b))));
}

export class ABBALiveSubstrateReconciler {
  constructor(private readonly reader: SupabaseTableReader) {}

  async scan(specs: LiveSubstrateBindingSpec[]): Promise<LiveSubstrateObservation[]> {
    const observations: LiveSubstrateObservation[] = [];

    for (const binding of specs) {
      try {
        const rows = await this.reader.select(binding.substrateRef, { limit: 1000, filters: binding.lookup });
        const substrateFingerprint = fingerprint(rows, binding.identityColumns);
        observations.push({
          binding,
          rowsObserved: rows.length,
          substrateFingerprint,
          reconciliation: {
            canonicalRef: binding.canonicalRef,
            canonicalFingerprint: binding.canonicalFingerprint,
            substrateKind: binding.substrateKind,
            substrateRef: binding.substrateRef,
            substrateFingerprint,
            duplicateCount: binding.lookup && rows.length > 1 ? rows.length : undefined,
            evidenceRefs: [`substrate-scan:${binding.substrateRef}`]
          }
        });
      } catch (error) {
        observations.push({
          binding,
          rowsObserved: 0,
          reconciliation: {
            canonicalRef: binding.canonicalRef,
            canonicalFingerprint: binding.canonicalFingerprint,
            substrateKind: binding.substrateKind,
            substrateRef: binding.substrateRef,
            evidenceRefs: [`substrate-scan-error:${binding.substrateRef}`],
            readError: error instanceof Error ? error.message : 'SUBSTRATE_READ_FAILED'
          }
        });
      }
    }

    return observations;
  }
}
