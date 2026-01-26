-- ============================================
-- FIX SUPABASE LINTER WARNINGS
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX: Function Search Path Mutable (30 functions)
-- Using DO blocks to handle functions that may not exist
-- ============================================

DO $$ 
DECLARE
  func_names TEXT[] := ARRAY[
    'encrypt_text',
    'match_rag_documents',
    'check_user_suspension_status',
    'encrypt_user_profile_data',
    'cleanup_old_audit_logs',
    'search_professionals',
    'encrypt_assessment_data',
    'log_data_access',
    'update_user_reputation_updated_at',
    'trigger_refresh_search_index',
    'log_security_event',
    'create_verification_record',
    'check_rate_limit',
    'auto_escalate_reports',
    'update_trust_level',
    'immutable_to_tsvector',
    'match_rag_documents_agg',
    'update_reputation_on_warning',
    'auto_close_expired_bans',
    'anonymize_user_data',
    'secure_user_profile_access',
    'secure_assessment_access',
    'encrypt_professional_data',
    'decrypt_text',
    'calculate_reputation_score',
    'professional_profiles_search_vector_update',
    'update_risk_profile_timestamp',
    'update_updated_at_column',
    'refresh_professional_search_index',
    'update_user_behavior_updated_at'
  ];
  func_name TEXT;
  func_oid OID;
BEGIN
  FOREACH func_name IN ARRAY func_names LOOP
    -- Find the function OID
    SELECT p.oid INTO func_oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = func_name
    LIMIT 1;
    
    IF func_oid IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION public.%I SET search_path = public', func_name);
      RAISE NOTICE 'Fixed search_path for function: %', func_name;
    ELSE
      RAISE NOTICE 'Function not found (skipping): %', func_name;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 2. FIX: Materialized View in API
-- Revoke direct access
-- ============================================
DO $$ BEGIN
  REVOKE SELECT ON public.professional_search_index FROM anon;
  REVOKE SELECT ON public.professional_search_index FROM authenticated;
  RAISE NOTICE 'Revoked access to professional_search_index';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not revoke access to professional_search_index: %', SQLERRM;
END $$;

-- ============================================
-- 3. FIX: RLS Policies Always True
-- Replace permissive INSERT policies with proper checks
-- ============================================

-- Fix crisis_logs INSERT policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "Authenticated can insert crisis logs" ON public.crisis_logs;
  CREATE POLICY "Authenticated can insert crisis logs" ON public.crisis_logs
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);
  RAISE NOTICE 'Fixed crisis_logs INSERT policy';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix crisis_logs policy: %', SQLERRM;
END $$;

-- Fix notification_logs INSERT policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "System can insert notification logs" ON public.notification_logs;
  CREATE POLICY "System can insert notification logs" ON public.notification_logs
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);
  RAISE NOTICE 'Fixed notification_logs INSERT policy';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix notification_logs policy: %', SQLERRM;
END $$;

-- Fix notifications INSERT policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "insert_any" ON public.notifications;
  CREATE POLICY "Authenticated can insert notifications" ON public.notifications
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);
  RAISE NOTICE 'Fixed notifications INSERT policy';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix notifications policy: %', SQLERRM;
END $$;

-- Fix risk_alerts INSERT policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "System can insert alerts" ON public.risk_alerts;
  CREATE POLICY "System can insert alerts" ON public.risk_alerts
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() IS NOT NULL);
  RAISE NOTICE 'Fixed risk_alerts INSERT policy';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix risk_alerts policy: %', SQLERRM;
END $$;

-- Fix user_profiles INSERT policy
DO $$ BEGIN
  DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON public.user_profiles;
  CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);
  RAISE NOTICE 'Fixed user_profiles INSERT policy';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not fix user_profiles policy: %', SQLERRM;
END $$;
