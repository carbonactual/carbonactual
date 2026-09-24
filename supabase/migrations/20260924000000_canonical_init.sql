-- Phase 1 initial live-state substrate for canonical contracts.
-- This migration is implementation infrastructure beneath HAPI World Canon and Carbon Actual contracts.
-- Direct client writes to consequential state/events are intentionally prohibited; the authenticated
-- control/API boundary is responsible for canonical validation before privileged persistence.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type_enum') THEN
    CREATE TYPE public.entity_type_enum AS ENUM (
      'HUMAN_AUTHORITY',
      'ORCHESTRATOR_ABBA',
      'HAPI_AGENT',
      'INSTITUTIONAL_BODY',
      'PRODUCT',
      'ASSET_OR_RESOURCE',
      'PLACE_OR_TERRITORY',
      'EVENT_OR_SESSION',
      'KNOWLEDGE_OR_MEDIA'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_status_enum') THEN
    CREATE TYPE public.entity_status_enum AS ENUM (
      'ACTIVE',
      'RESTRICTED',
      'SUSPENDED',
      'REVOKED',
      'PROVISIONAL',
      'HISTORICAL'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_state_enum') THEN
    CREATE TYPE public.agent_state_enum AS ENUM (
      'UNINITIALIZED',
      'REGISTERED',
      'PROVISIONED',
      'ACTIVE',
      'EXECUTING',
      'PAUSED',
      'TERMINATED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.entities (
  entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.entity_type_enum NOT NULL,
  handle TEXT NOT NULL UNIQUE,
  auth_user_id UUID UNIQUE,
  authority_level SMALLINT NOT NULL DEFAULT 0 CHECK (authority_level BETWEEN 0 AND 5),
  status public.entity_status_enum NOT NULL DEFAULT 'ACTIVE',
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.authority_grants (
  grant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grantor_entity_id UUID NOT NULL REFERENCES public.entities(entity_id),
  grantee_entity_id UUID NOT NULL REFERENCES public.entities(entity_id),
  scope JSONB NOT NULL DEFAULT '[]'::jsonb,
  policy_version TEXT NOT NULL,
  jurisdiction TEXT,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED','EXPIRED')),
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE IF NOT EXISTS public.hapi_agents (
  agent_id UUID PRIMARY KEY REFERENCES public.entities(entity_id),
  controller_entity_id UUID NOT NULL REFERENCES public.entities(entity_id),
  current_state public.agent_state_enum NOT NULL DEFAULT 'UNINITIALIZED',
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.canonical_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'agent_created',
    'agent_registered',
    'agent_capabilities_bound',
    'agent_activated',
    'agent_task_started',
    'agent_task_completed',
    'resource_consumed',
    'capability_used',
    'value_created',
    'value_transferred',
    'payment_received',
    'liability_created',
    'asset_created',
    'asset_consumed',
    'agent_contract_formed',
    'agent_contract_settled',
    'pulse_observed',
    'ledger_posted',
    'settlement_confirmed',
    'settlement_failed',
    'agent_suspended',
    'agent_terminated',
    'reconciliation_completed'
  )),
  actor_entity_id UUID NOT NULL REFERENCES public.entities(entity_id),
  principal_entity_id UUID REFERENCES public.entities(entity_id),
  subject_ref TEXT,
  authority_ref UUID REFERENCES public.authority_grants(grant_id),
  authority_signature TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  correlation_id TEXT,
  causation_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  schema_version TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB NOT NULL,
  pulse_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  pre_state_hash TEXT,
  post_state_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(entity_id),
  account_code TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL CHECK (account_type IN ('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','MEMORANDUM')),
  currency_or_unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESTRICTED','CLOSED')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id UUID NOT NULL UNIQUE REFERENCES public.canonical_events(event_id),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED','REVERSED','DISPUTED'))
);

CREATE TABLE IF NOT EXISTS public.ledger_lines (
  line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.ledger_entries(entry_id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES public.ledger_accounts(account_id),
  side TEXT NOT NULL CHECK (side IN ('DEBIT','CREDIT')),
  amount NUMERIC(38,18) NOT NULL CHECK (amount > 0),
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pulse_observations (
  pulse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  measurement_scope TEXT NOT NULL,
  v_created NUMERIC(38,18) NOT NULL DEFAULT 0,
  c_consumed NUMERIC(38,18) NOT NULL DEFAULT 0,
  n_active_agents INTEGER NOT NULL DEFAULT 0 CHECK (n_active_agents >= 0),
  t_velocity NUMERIC(38,18) NOT NULL DEFAULT 0,
  pulse_score NUMERIC(38,18),
  methodology_version TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION public.prevent_canonical_event_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Canonical events are immutable; use a compensating/reversal event.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_canonical_event_mutation ON public.canonical_events;
CREATE TRIGGER trg_prevent_canonical_event_mutation
BEFORE UPDATE OR DELETE ON public.canonical_events
FOR EACH ROW EXECUTE FUNCTION public.prevent_canonical_event_mutation();

CREATE OR REPLACE FUNCTION public.enforce_balanced_ledger_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
DECLARE
  v_entry_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.entry_id ELSE NEW.entry_id END;
  v_unbalanced_units TEXT;
BEGIN
  SELECT string_agg(unit, ', ' ORDER BY unit)
  INTO v_unbalanced_units
  FROM (
    SELECT unit
    FROM public.ledger_lines
    WHERE entry_id = v_entry_id
    GROUP BY unit
    HAVING COALESCE(SUM(amount) FILTER (WHERE side='DEBIT'),0)
        <> COALESCE(SUM(amount) FILTER (WHERE side='CREDIT'),0)
       OR COUNT(*) FILTER (WHERE side='DEBIT') = 0
       OR COUNT(*) FILTER (WHERE side='CREDIT') = 0
  ) u;

  IF v_unbalanced_units IS NOT NULL THEN
    RAISE EXCEPTION 'Ledger entry % is not balanced by unit: %', v_entry_id, v_unbalanced_units;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$;

DROP TRIGGER IF EXISTS trg_enforce_balanced_ledger_entry ON public.ledger_lines;
CREATE CONSTRAINT TRIGGER trg_enforce_balanced_ledger_entry
AFTER INSERT OR UPDATE OR DELETE ON public.ledger_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.enforce_balanced_ledger_entry();

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authority_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hapi_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_observations ENABLE ROW LEVEL SECURITY;

-- Default-deny consequential writes. Privileged server-side control functions may operate
-- with an appropriate service identity; clients do not receive a direct-write pathway.
DROP POLICY IF EXISTS entities_select_authenticated ON public.entities;
CREATE POLICY entities_select_authenticated
  ON public.entities FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS agents_select_authenticated ON public.hapi_agents;
CREATE POLICY agents_select_authenticated
  ON public.hapi_agents FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS events_select_authenticated ON public.canonical_events;
CREATE POLICY events_select_authenticated
  ON public.canonical_events FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS pulse_select_authenticated ON public.pulse_observations;
CREATE POLICY pulse_select_authenticated
  ON public.pulse_observations FOR SELECT
  TO authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.entities FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.authority_grants FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.hapi_agents FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.canonical_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.ledger_accounts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.ledger_entries FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.ledger_lines FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.pulse_observations FROM anon, authenticated;

-- Even the privileged API identity uses the canonical RPC for consequential writes.
REVOKE INSERT, UPDATE, DELETE ON public.entities FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.authority_grants FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.hapi_agents FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.canonical_events FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.ledger_accounts FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.ledger_entries FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.ledger_lines FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.pulse_observations FROM service_role;

COMMENT ON TABLE public.canonical_events IS 'Append-only canonical occurrence/evidence index. Direct client mutation is prohibited.';
COMMENT ON TABLE public.ledger_entries IS 'Double-entry posting header linked to one canonical event.';
COMMENT ON TABLE public.ledger_lines IS 'Double-entry debit/credit lines; posting must balance.';


CREATE OR REPLACE FUNCTION public.validate_canonical_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_consequential BOOLEAN := NEW.event_type IN (
    'agent_created',
    'agent_terminated',
    'agent_suspended',
    'agent_activated',
    'agent_capabilities_bound',
    'agent_registered',
    'agent_task_started',
    'agent_task_completed',
    'value_transferred',
    'payment_received',
    'liability_created',
    'asset_created',
    'asset_consumed',
    'agent_contract_formed',
    'agent_contract_settled',
    'ledger_posted',
    'settlement_confirmed',
    'settlement_failed',
    'reconciliation_completed'
  );
BEGIN
  IF v_consequential AND (NEW.authority_ref IS NULL OR NEW.authority_signature IS NULL OR length(NEW.authority_signature) = 0) THEN
    RAISE EXCEPTION 'CONSEQUENTIAL_EVENT_REQUIRES_AUTHORITY';
  END IF;

  IF NEW.authority_ref IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.authority_grants g
    WHERE g.grant_id = NEW.authority_ref
      AND g.grantee_entity_id = NEW.actor_entity_id
      AND g.status = 'ACTIVE'
      AND g.valid_from <= NEW.timestamp
      AND (g.valid_until IS NULL OR g.valid_until > NEW.timestamp)
  ) THEN
    RAISE EXCEPTION 'AUTHORITY_GRANT_INVALID_OR_EXPIRED';
  END IF;

  IF NEW.schema_version IS NULL OR length(trim(NEW.schema_version)) = 0 THEN
    RAISE EXCEPTION 'SCHEMA_VERSION_REQUIRED';
  END IF;

  IF NEW.provenance IS NULL THEN
    RAISE EXCEPTION 'PROVENANCE_REQUIRED';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_canonical_event ON public.canonical_events;
CREATE TRIGGER trg_validate_canonical_event
BEFORE INSERT ON public.canonical_events
FOR EACH ROW EXECUTE FUNCTION public.validate_canonical_event();


-- Canonical event audit records are append-only. Corrections are represented by
-- compensating/reversal events rather than mutations to historical events.
