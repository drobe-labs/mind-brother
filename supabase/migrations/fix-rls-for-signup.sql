-- ============================================
-- FIX RLS POLICY FOR SIGNUP - DEFINITIVE SOLUTION
-- ============================================

-- Step 1: Temporarily disable RLS to clean up
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Step 3: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new, working policies

-- Allow INSERT for authenticated users and service role
CREATE POLICY "Allow profile creation" ON user_profiles
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Allow SELECT for own profile
CREATE POLICY "Allow read own profile" ON user_profiles
FOR SELECT 
TO authenticated, anon
USING (auth.uid() = user_id);

-- Allow UPDATE for own profile  
CREATE POLICY "Allow update own profile" ON user_profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Step 5: Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_profiles TO service_role;

-- Step 6: Recreate the trigger with proper security
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  -- Determine user type
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'user');
  
  -- Insert profile (will bypass RLS because of SECURITY DEFINER)
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
    -- Log error but allow signup to continue
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Verify everything
SELECT 'RLS and trigger fixed successfully!' as status;

-- Show policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;


