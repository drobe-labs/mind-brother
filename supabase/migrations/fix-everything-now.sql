-- ALL-IN-ONE FIX: Run this entire script in Supabase SQL Editor
-- This will fix RLS policies, create missing profiles, and set up auto-creation

-- ============================================
-- PART 1: FIX RLS POLICIES
-- ============================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create policy: Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy: Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON user_profiles
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy: Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 2: CREATE MISSING PROFILES
-- ============================================

-- Create profiles for users that don't have one
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
    -- Map 'individual' to 'user', otherwise use the value or default to 'user'
    CASE 
        WHEN au.raw_user_meta_data->>'user_type' = 'individual' THEN 'user'
        WHEN au.raw_user_meta_data->>'user_type' = 'professional' THEN 'professional'
        ELSE 'user'
    END,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL  -- Only insert for users without profiles
ON CONFLICT (user_id) DO NOTHING;  -- Skip if profile already exists

-- ============================================
-- PART 3: AUTO-CREATE PROFILES FOR FUTURE USERS
-- ============================================

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  -- Map 'individual' to 'user', otherwise use the value or default to 'user'
  v_user_type := CASE 
    WHEN NEW.raw_user_meta_data->>'user_type' = 'individual' THEN 'user'
    WHEN NEW.raw_user_meta_data->>'user_type' = 'professional' THEN 'professional'
    ELSE 'user'
  END;
  
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
  ON CONFLICT (user_id) DO NOTHING;  -- Prevent errors if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION: Check results
-- ============================================

-- Show all users and their profile status
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_created,
    CASE 
        WHEN up.user_id IS NULL THEN '❌ NO PROFILE' 
        ELSE '✅ HAS PROFILE' 
    END as profile_status,
    up.user_type,
    up.first_name,
    up.last_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- Show summary
SELECT 
    COUNT(CASE WHEN up.user_id IS NULL THEN 1 END) as missing_profiles,
    COUNT(CASE WHEN up.user_id IS NOT NULL THEN 1 END) as has_profiles,
    COUNT(*) as total_users
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id;

