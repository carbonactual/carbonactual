-- Phase 10.2: align reasoning binding event identity with the existing omnii_events text identifier.
-- Additive schema correction after the initial binding migration.
ALTER TABLE public.abba_reasoning_substrate_bindings
ALTER COLUMN canonical_event_id TYPE text
USING canonical_event_id::text;
