-- ============================================
-- VERIFY USER_PROFILES TABLE SETUP
-- ============================================

-- 1. Check if user_profiles table exists and show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

-- 3. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth';

-- 4. Check if the function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- ============================================
-- FIX: Ensure username column exists
-- ============================================

-- Add username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT;
        CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_key ON user_profiles(username);
    END IF;
END $$;

-- Add age_range column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'age_range'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN age_range TEXT;
    END IF;
END $$;

-- Add phone_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN phone_number TEXT;
    END IF;
END $$;


