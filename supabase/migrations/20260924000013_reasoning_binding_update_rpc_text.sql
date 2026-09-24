-- Phase 10.3: align installed reasoning binding update RPC with text event identity.
CREATE OR REPLACE FUNCTION public.update_abba_reasoning_substrate_binding(p_binding jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := nullif(p_binding->>'bindingId','')::uuid;
  v_next text := nullif(p_binding->>'bindingStatus','');
  v_current text;
BEGIN
  IF v_id IS NULL OR v_next IS NULL THEN
    RAISE EXCEPTION 'INVALID_ABBA_REASONING_BINDING_UPDATE';
  END IF;

  SELECT binding_status INTO v_current
  FROM public.abba_reasoning_substrate_bindings
  WHERE binding_id = v_id
  FOR UPDATE;

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'ABBA_REASONING_BINDING_NOT_FOUND';
  END IF;

  IF v_current = v_next THEN
    NULL;
  ELSIF v_current = 'PREPARED' AND v_next IN ('GATED','BLOCKED','RECOVERY_REQUIRED','EXECUTED') THEN
    NULL;
  ELSIF v_current = 'GATED' AND v_next IN ('EXECUTED','BLOCKED','RECOVERY_REQUIRED') THEN
    NULL;
  ELSIF v_current IN ('EXECUTED','BLOCKED','RECOVERY_REQUIRED') THEN
    RAISE EXCEPTION 'ABBA_REASONING_BINDING_STATUS_REGRESSION:%:%', v_current, v_next;
  ELSE
    RAISE EXCEPTION 'ABBA_REASONING_BINDING_TRANSITION_NOT_ALLOWED:%:%', v_current, v_next;
  END IF;

  UPDATE public.abba_reasoning_substrate_bindings
  SET binding_status = v_next,
      canonical_event_id = coalesce(nullif(p_binding->>'canonicalEventId',''), canonical_event_id),
      blocking_reasons = CASE
        WHEN p_binding ? 'blockingReasons'
        THEN ARRAY(SELECT value FROM jsonb_array_elements_text(coalesce(p_binding->'blockingReasons','[]'::jsonb)))
        ELSE blocking_reasons
      END,
      updated_at = now()
  WHERE binding_id = v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_abba_reasoning_substrate_binding(jsonb)
  FROM public, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_abba_reasoning_substrate_binding(jsonb)
  TO service_role;
