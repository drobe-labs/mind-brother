-- Fix User Profile RLS Policies
-- Copy and paste this entire script into your Supabase SQL Editor

-- First, check if RLS is enabled and see current policies
-- (This is just for information - it won't cause errors)
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
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

-- Verify policies were created
SELECT 
    policyname, 
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual 
        ELSE 'No USING clause' 
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
        ELSE 'No WITH CHECK clause' 
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY cmd, policyname;



