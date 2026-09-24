export interface PreflightCheck {
  name: string;
  passed: boolean;
  reason: string;
}

export interface DeploymentPreflightResult {
  passed: boolean;
  checks: PreflightCheck[];
}

const requiredFiles = [
  'supabase/migrations/20260924000005_abba_supervisor_and_substrate_bindings.sql',
  'supabase/migrations/20260924000006_abba_reconciliation_and_completion.sql',
  'supabase/migrations/20260924000007_abba_execution_attempt_ledger.sql',
  'supabase/migrations/20260924000008_abba_competency_and_certification.sql',
  'supabase/migrations/20260924000009_abba_phase6_runtime_assurance.sql',
  'supabase/migrations/20260924000010_reasoning_substrate_binding.sql',
  'supabase/migrations/20260924000011_postgis_rls_remediation.sql',
  'supabase/migrations/20260924000012_reasoning_binding_event_id_text.sql',
  'supabase/migrations/20260924000013_reasoning_binding_update_rpc_text.sql'
];

export function runDeploymentPreflight(files: Record<string, string>): DeploymentPreflightResult {
  const checks: PreflightCheck[] = [];

  const missing = requiredFiles.filter((path) => typeof files[path] !== 'string');
  checks.push({
    name: 'migration-frontier-present',
    passed: missing.length === 0,
    reason: missing.length ? `Missing: ${missing.join(', ')}` : 'All required staged migrations are present'
  });

  const migrationText = requiredFiles.map((path) => files[path] ?? '').join('\n');
  const destructive = /(^|\n)\s*(DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM)\b/i.test(migrationText);
  checks.push({
    name: 'no-destructive-ddl',
    passed: !destructive,
    reason: destructive ? 'Potential destructive SQL detected' : 'No destructive table/column/truncate/delete statement detected'
  });

  const requiredRlsTables = [
    'abba_control_cycles',
    'abba_job_runs',
    'abba_substrate_bindings',
    'abba_reconciliation_records',
    'abba_completion_checks',
    'abba_execution_attempts',
    'abba_completion_proofs',
    'abba_reasoning_substrate_bindings'
  ];

  const rlsComplete = requiredRlsTables.every((table) =>
    new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`).test(migrationText) ||
    new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`).test(files['supabase/migrations/20260924000005_abba_supervisor_and_substrate_bindings.sql'] ?? '')
  );

  checks.push({
    name: 'assurance-rls-posture',
    passed: rlsComplete,
    reason: rlsComplete ? 'Assurance tables declare RLS enablement' : 'One or more assurance tables lacks an explicit RLS enablement statement'
  });

  checks.push({
    name: 'canonical-write-boundary',
    passed: !/insert into public\.canonical_events/i.test(migrationText) && /append_canonical_event/i.test(migrationText + (files['packages/orchestration/src/supabaseRuntimeAdapters.ts'] ?? '')),
    reason: 'Canonical event writes remain through append_canonical_event'
  });

  return { passed: checks.every((check) => check.passed), checks };
}
