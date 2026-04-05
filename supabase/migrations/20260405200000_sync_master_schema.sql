-- ═══════════════════════════════════════════════════════════════════
-- Master Schema Alignment Sync (POWER SQL V1.0)
-- ═══════════════════════════════════════════════════════════════════
-- This migration ensures the database exactly matches the "Power SQL"
-- provided by the user, while adding the necessary 'details' column
-- to the reports table to support the high-fidelity UI.

-- 1. Create reports table if missing (Power SQL Version)
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reported_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text, -- Support for the "Describe what happened" box in UI
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'REVIEWED'::text, 'ACTIONED'::text, 'DISMISSED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  admin_notes text,
  CONSTRAINT reports_pkey PRIMARY KEY (id)
);

-- 2. Add RLS to reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated users can insert reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' AND policyname = 'Users can insert reports'
    ) THEN
        CREATE POLICY "Users can insert reports" ON public.reports
        FOR INSERT WITH CHECK (auth.uid() = (SELECT auth_id FROM public.users WHERE id = reporter_id));
    END IF;
END $$;

-- 4. Policy: Users can see their own reports
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reports' AND policyname = 'Users can see own reports'
    ) THEN
        CREATE POLICY "Users can see own reports" ON public.reports
        FOR SELECT USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = reporter_id));
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- ALIGNMENT COMPLETED
-- ═══════════════════════════════════════════════════════════════════
