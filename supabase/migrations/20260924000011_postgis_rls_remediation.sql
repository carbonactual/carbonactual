-- Phase 10.1: safe PostGIS spatial_ref_sys RLS remediation.
-- Non-destructive: preserves public read access while enabling RLS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'spatial_ref_sys'
  ) THEN
    ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'spatial_ref_sys'
        AND policyname = 'Allow public read-only access to spatial_ref_sys'
    ) THEN
      CREATE POLICY "Allow public read-only access to spatial_ref_sys"
        ON public.spatial_ref_sys
        FOR SELECT
        TO PUBLIC
        USING (true);
    END IF;
  END IF;
END
$$;
