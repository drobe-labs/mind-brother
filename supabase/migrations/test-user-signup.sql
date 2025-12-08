-- Test User Signup - RLS Policy Check
-- Run this in your Supabase SQL Editor to ensure RLS policies allow profile creation

-- Check current RLS policies on user_profiles
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

-- If you see no INSERT policy or restrictive policies, run this:

-- Enable RLS (if not already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile" ON user_profiles
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow professionals and admins to read other profiles (if needed)
-- Uncomment if you need this:
-- CREATE POLICY "Professionals can read user profiles" ON user_profiles
-- FOR SELECT 
-- USING (
--   EXISTS (
--     SELECT 1 FROM user_profiles up 
--     WHERE up.user_id = auth.uid() 
--     AND up.user_type = 'professional'
--   )
-- );



