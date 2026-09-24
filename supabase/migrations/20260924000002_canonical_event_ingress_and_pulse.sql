-- Privileged canonical event ingress + independent Pulse observation calculation.
-- Only the authenticated server-side control boundary should be granted execute access.
CREATE OR REPLACE FUNCTION public.append_canonical_event(p_event jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_idempotency text := nullif(p_event->>'idempotencyKey','');
  v_actor uuid := nullif(p_event->>'actorEntityId','')::uuid;
  v_principal uuid := nullif(p_event->>'principalEntityId','')::uuid;
  v_authority uuid := nullif(p_event->>'authorityRef','')::uuid;
  v_timestamp timestamptz := coalesce((p_event->>'timestamp')::timestamptz, now());
  v_signature text := nullif(p_event->>'authoritySignature','');
BEGIN
  IF v_actor IS NULL OR v_idempotency IS NULL OR p_event->>'eventType' IS NULL
     OR p_event->>'schemaVersion' IS NULL OR p_event->'provenance' IS NULL THEN
    RAISE EXCEPTION 'INVALID_CANONICAL_EVENT_ENVELOPE';
  END IF;

  IF v_signature IS NULL OR length(v_signature) = 0 THEN
    RAISE EXCEPTION 'AUTHORITY_SIGNATURE_REQUIRED';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.entities e
    WHERE e.entity_id = v_actor AND e.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'ACTIVE_ACTOR_REQUIRED';
  END IF;

  IF v_authority IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.authority_grants g
    WHERE g.grant_id = v_authority
      AND g.grantee_entity_id = v_actor
      AND g.status = 'ACTIVE'
      AND g.valid_from <= v_timestamp
      AND (g.valid_until IS NULL OR g.valid_until > v_timestamp)
  ) THEN
    RAISE EXCEPTION 'AUTHORITY_GRANT_INVALID_OR_EXPIRED';
  END IF;

  SELECT event_id INTO v_event_id
  FROM public.canonical_events
  WHERE idempotency_key = v_idempotency;

  IF v_event_id IS NOT NULL THEN
    RETURN v_event_id;
  END IF;

  BEGIN
    INSERT INTO public.canonical_events (
      event_id,
      event_type,
      actor_entity_id,
      principal_entity_id,
      subject_ref,
      authority_ref,
      authority_signature,
      timestamp,
      correlation_id,
      causation_id,
      idempotency_key,
      schema_version,
      policy_version,
      provenance,
      evidence_ref,
      payload,
      pulse_impact,
      pre_state_hash,
      post_state_hash
    )
    VALUES (
      coalesce(nullif(p_event->>'eventId','')::uuid, gen_random_uuid()),
      p_event->>'eventType',
      v_actor,
      v_principal,
      p_event->>'subjectRef',
      v_authority,
      v_signature,
      v_timestamp,
      p_event->>'correlationId',
      p_event->>'causationId',
      v_idempotency,
      p_event->>'schemaVersion',
      p_event->>'policyVersion',
      p_event->'provenance',
      p_event->>'evidenceRef',
      coalesce(p_event->'payload','{}'::jsonb),
      coalesce(p_event->'pulseImpact','{}'::jsonb),
      p_event->>'preStateHash',
      p_event->>'postStateHash'
    )
    RETURNING event_id INTO v_event_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT event_id INTO v_event_id
      FROM public.canonical_events
      WHERE idempotency_key = v_idempotency;
      IF v_event_id IS NULL THEN
        RAISE;
      END IF;
  END;

  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.append_canonical_event(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.append_canonical_event(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.calculate_pulse_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.n_active_agents <= 0 THEN
    NEW.pulse_score := NULL;
  ELSE
    NEW.pulse_score := ((NEW.v_created - NEW.c_consumed) * NEW.t_velocity)
      / NULLIF(log(2, NEW.n_active_agents + 1), 0);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calculate_pulse_score ON public.pulse_observations;
CREATE TRIGGER trg_calculate_pulse_score
BEFORE INSERT OR UPDATE OF v_created, c_consumed, n_active_agents, t_velocity
ON public.pulse_observations
FOR EACH ROW
EXECUTE FUNCTION public.calculate_pulse_score();
