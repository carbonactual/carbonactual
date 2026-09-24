-- Carbon Actual HAPI agent state machine enforcement.
-- State changes are derived from accepted canonical events; callers do not write state directly.

CREATE OR REPLACE FUNCTION public.apply_agent_state_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current public.agent_state_enum;
  v_required_level SMALLINT;
  v_is_agent BOOLEAN;
BEGIN
  SELECT true, current_state
    INTO v_is_agent, v_current
  FROM public.hapi_agents
  WHERE agent_id = NEW.actor_entity_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  CASE NEW.event_type
    WHEN 'agent_registered' THEN
      v_required_level := 3;
      IF v_current <> 'UNINITIALIZED' THEN
        RAISE EXCEPTION 'INVALID_AGENT_TRANSITION: % -> REGISTERED', v_current;
      END IF;

    WHEN 'agent_capabilities_bound' THEN
      v_required_level := 3;
      IF v_current <> 'REGISTERED' THEN
        RAISE EXCEPTION 'INVALID_AGENT_TRANSITION: % -> PROVISIONED', v_current;
      END IF;

    WHEN 'agent_activated' THEN
      v_required_level := 2;
      IF v_current <> 'PROVISIONED' THEN
        RAISE EXCEPTION 'INVALID_AGENT_TRANSITION: % -> ACTIVE', v_current;
      END IF;

    WHEN 'agent_task_started' THEN
      v_required_level := 1;
      IF v_current <> 'ACTIVE' THEN
        RAISE EXCEPTION 'INVALID_AGENT_TRANSITION: % -> EXECUTING', v_current;
      END IF;

    WHEN 'agent_task_completed' THEN
      v_required_level := 1;
      IF v_current <> 'EXECUTING' THEN
        RAISE EXCEPTION 'INVALID_AGENT_TRANSITION: % -> ACTIVE', v_current;
      END IF;

    WHEN 'agent_suspended' THEN
      v_required_level := 2;
      IF v_current <> 'ACTIVE' THEN
        RAISE EXCEPTION 'INVALID_AGENT_TRANSITION: % -> PAUSED', v_current;
      END IF;

    WHEN 'agent_terminated' THEN
      v_required_level := 4;

    ELSE
      RETURN NEW;
  END CASE;

  IF NOT EXISTS (
    SELECT 1
    FROM public.entities e
    WHERE e.entity_id = NEW.actor_entity_id
      AND e.authority_level >= v_required_level
      AND e.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'AGENT_TRANSITION_AUTHORITY_LEVEL_REQUIRED: %', v_required_level;
  END IF;

  CASE NEW.event_type
    WHEN 'agent_registered' THEN
      UPDATE public.hapi_agents SET current_state = 'REGISTERED', updated_at = now() WHERE agent_id = NEW.actor_entity_id;
    WHEN 'agent_capabilities_bound' THEN
      UPDATE public.hapi_agents SET current_state = 'PROVISIONED', updated_at = now() WHERE agent_id = NEW.actor_entity_id;
    WHEN 'agent_activated' THEN
      UPDATE public.hapi_agents SET current_state = 'ACTIVE', updated_at = now() WHERE agent_id = NEW.actor_entity_id;
    WHEN 'agent_task_started' THEN
      UPDATE public.hapi_agents SET current_state = 'EXECUTING', updated_at = now() WHERE agent_id = NEW.actor_entity_id;
    WHEN 'agent_task_completed' THEN
      UPDATE public.hapi_agents SET current_state = 'ACTIVE', updated_at = now() WHERE agent_id = NEW.actor_entity_id;
    WHEN 'agent_suspended' THEN
      UPDATE public.hapi_agents SET current_state = 'PAUSED', updated_at = now() WHERE agent_id = NEW.actor_entity_id;
    WHEN 'agent_terminated' THEN
      UPDATE public.hapi_agents SET current_state = 'TERMINATED', updated_at = now() WHERE agent_id = NEW.actor_entity_id;
    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_agent_state_transition ON public.canonical_events;
CREATE TRIGGER trg_apply_agent_state_transition
AFTER INSERT ON public.canonical_events
FOR EACH ROW
EXECUTE FUNCTION public.apply_agent_state_transition();
