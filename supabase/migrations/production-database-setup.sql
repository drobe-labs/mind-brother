-- ============================================
-- PRODUCTION DATABASE SETUP FOR MIND BROTHER
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: CLEANUP ORPHANED DATA
-- ============================================

-- Delete orphaned profiles (profiles without auth users)
DELETE FROM public.user_profiles 
WHERE user_id IN (
    SELECT up.user_id 
    FROM public.user_profiles up
    LEFT JOIN auth.users au ON up.user_id = au.id
    WHERE au.id IS NULL
);

-- Delete unconfirmed users older than 24 hours (failed signups)
DELETE FROM auth.users
WHERE confirmed_at IS NULL 
AND created_at < NOW() - INTERVAL '24 hours';

-- ============================================
-- PART 2: ENSURE TABLE STRUCTURE
-- ============================================

-- Make sure all necessary columns exist
DO $$ 
BEGIN
    -- username column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT;
    END IF;

    -- age_range column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'age_range'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN age_range TEXT;
    END IF;

    -- phone_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN phone_number TEXT;
    END IF;

    -- bio column (for professionals)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'bio'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN bio TEXT;
    END IF;

    -- avatar_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Create unique index on username if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_key 
ON user_profiles(username) 
WHERE username IS NOT NULL;

-- ============================================
-- PART 3: SET UP PROPER RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Allow read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Create new, clean policies

-- 1. INSERT: Allow authenticated users to create their own profile
CREATE POLICY "Users can create their own profile" ON user_profiles
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. SELECT: Allow users to read their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 3. UPDATE: Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. SELECT: Allow public to view basic profile info (for community features)
CREATE POLICY "Public can view basic profile info" ON user_profiles
FOR SELECT 
TO authenticated, anon
USING (true);  -- Everyone can see profiles (for discussions, etc.)

-- ============================================
-- PART 4: CREATE AUTO-PROFILE TRIGGER
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER  -- Run with elevated privileges to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  -- Determine user type from metadata
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'user');
  
  -- Insert profile with data from auth metadata
  INSERT INTO public.user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_user_type,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PART 5: GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- ============================================
-- PART 6: CREATE PROFILES FOR EXISTING USERS
-- ============================================

-- Create profiles for any auth users that don't have them
INSERT INTO user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    created_at,
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    COALESCE(au.raw_user_meta_data->>'user_type', 'user'),
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- PART 7: VERIFICATION
-- ============================================

-- Show current setup status
SELECT 
    'Database setup complete!' as status,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM user_profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN user_profiles up ON au.id = up.user_id WHERE up.user_id IS NULL) as missing_profiles;

-- Show RLS policies
SELECT 
    policyname,
    cmd as operation,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK'
    END as check_clause
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Show trigger status
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'auth'
AND trigger_name = 'on_auth_user_created';


