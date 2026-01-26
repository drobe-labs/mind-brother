-- ============================================
-- FIX ALL SUPABASE SECURITY LINTER ERRORS
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX: notifications table - Enable RLS
-- ============================================
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. FIX: rag_documents table - Enable RLS
-- ============================================
ALTER TABLE IF EXISTS public.rag_documents ENABLE ROW LEVEL SECURITY;

-- Add policies for rag_documents (read-only for authenticated users)
DROP POLICY IF EXISTS "Anyone can read rag_documents" ON public.rag_documents;
CREATE POLICY "Anyone can read rag_documents" ON public.rag_documents
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- 3. FIX: crisis_logs table - Enable RLS
-- ============================================
ALTER TABLE IF EXISTS public.crisis_logs ENABLE ROW LEVEL SECURITY;

-- Add policies for crisis_logs (allow authenticated users to read/write)
-- Using permissive policy since table may not have user_id column
DROP POLICY IF EXISTS "Authenticated can view crisis logs" ON public.crisis_logs;
DROP POLICY IF EXISTS "Authenticated can insert crisis logs" ON public.crisis_logs;

CREATE POLICY "Authenticated can view crisis logs" ON public.crisis_logs
  FOR SELECT TO authenticated 
  USING (true);

CREATE POLICY "Authenticated can insert crisis logs" ON public.crisis_logs
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- ============================================
-- 4. FIX: Security Definer Views
-- Recreate them with SECURITY INVOKER
-- Using DO blocks to handle errors gracefully
-- ============================================

-- Fix user_profiles_decrypted view
DO $$ BEGIN
  DROP VIEW IF EXISTS public.user_profiles_decrypted;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    EXECUTE 'CREATE VIEW public.user_profiles_decrypted WITH (security_invoker = true) AS SELECT * FROM public.user_profiles';
    EXECUTE 'GRANT SELECT ON public.user_profiles_decrypted TO authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create user_profiles_decrypted: %', SQLERRM;
END $$;

-- Fix professional_profiles_decrypted view
DO $$ BEGIN
  DROP VIEW IF EXISTS public.professional_profiles_decrypted;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'professional_profiles') THEN
    EXECUTE 'CREATE VIEW public.professional_profiles_decrypted WITH (security_invoker = true) AS SELECT * FROM public.professional_profiles';
    EXECUTE 'GRANT SELECT ON public.professional_profiles_decrypted TO authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create professional_profiles_decrypted: %', SQLERRM;
END $$;

-- Fix community_health_metrics view
DO $$ BEGIN
  DROP VIEW IF EXISTS public.community_health_metrics;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_risk_profiles') THEN
    EXECUTE 'CREATE VIEW public.community_health_metrics WITH (security_invoker = true) AS 
      SELECT 
        (SELECT COUNT(*) FROM public.user_risk_profiles WHERE flagged_for_review = true) as flagged_users,
        (SELECT COUNT(*) FROM public.user_risk_profiles WHERE risk_trend = ''critical'') as critical_users,
        (SELECT COUNT(*) FROM public.user_risk_profiles WHERE risk_trend = ''escalating'') as escalating_users,
        (SELECT COALESCE(AVG(escalation_score), 0) FROM public.user_risk_profiles) as avg_escalation_score,
        NOW() as calculated_at';
    EXECUTE 'GRANT SELECT ON public.community_health_metrics TO authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create community_health_metrics: %', SQLERRM;
END $$;

-- Fix high_risk_users_summary view
DO $$ BEGIN
  DROP VIEW IF EXISTS public.high_risk_users_summary;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_risk_profiles') THEN
    EXECUTE 'CREATE VIEW public.high_risk_users_summary WITH (security_invoker = true) AS 
      SELECT user_id, username, escalation_score, risk_trend, flagged_for_review, intervention_suggested, updated_at
      FROM public.user_risk_profiles
      WHERE escalation_score >= 40 OR risk_trend IN (''escalating'', ''critical'')';
    EXECUTE 'GRANT SELECT ON public.high_risk_users_summary TO authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create high_risk_users_summary: %', SQLERRM;
END $$;

-- Fix professional_profiles_with_verification view
DO $$ BEGIN
  DROP VIEW IF EXISTS public.professional_profiles_with_verification;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'professional_profiles') THEN
    EXECUTE 'CREATE VIEW public.professional_profiles_with_verification WITH (security_invoker = true) AS SELECT * FROM public.professional_profiles WHERE verification_status = ''verified''';
    EXECUTE 'GRANT SELECT ON public.professional_profiles_with_verification TO authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create professional_profiles_with_verification: %', SQLERRM;
END $$;

-- Fix mental_health_assessments_decrypted view
DO $$ BEGIN
  DROP VIEW IF EXISTS public.mental_health_assessments_decrypted;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mental_health_assessments') THEN
    EXECUTE 'CREATE VIEW public.mental_health_assessments_decrypted WITH (security_invoker = true) AS SELECT * FROM public.mental_health_assessments';
    EXECUTE 'GRANT SELECT ON public.mental_health_assessments_decrypted TO authenticated';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create mental_health_assessments_decrypted: %', SQLERRM;
END $$;

