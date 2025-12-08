-- ============================================
-- DISABLE TRIGGER - Let app handle profile creation
-- ============================================

-- Drop the trigger so it doesn't interfere
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function for now, just in case
-- DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Ensure RLS policies allow user profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
CREATE POLICY "Service role can insert profiles" ON user_profiles
FOR INSERT 
WITH CHECK (true);

SELECT 'Trigger disabled - app will handle profile creation' as status;


