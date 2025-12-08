-- ============================================
-- CLEANUP FAILED SIGNUP ATTEMPTS
-- ============================================

-- Step 1: Show all users and their profile status
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_created,
    au.confirmed_at,
    up.user_id as has_profile,
    up.first_name,
    up.last_name
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC
LIMIT 20;

-- Step 2: Find orphaned profiles (profiles without auth users)
SELECT 
    up.user_id,
    up.email,
    up.first_name,
    up.last_name,
    up.created_at
FROM public.user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- Step 3: DELETE orphaned profiles
-- Uncomment the line below to actually delete them
-- DELETE FROM public.user_profiles WHERE user_id IN (
--     SELECT up.user_id 
--     FROM public.user_profiles up
--     LEFT JOIN auth.users au ON up.user_id = au.id
--     WHERE au.id IS NULL
-- );

-- Step 4: Show test/failed users that you might want to delete
-- IMPORTANT: Replace 'your-test-email@example.com' with the email you're testing with
SELECT 
    au.id,
    au.email,
    au.created_at,
    'Run: DELETE FROM auth.users WHERE id = ''' || au.id || ''';' as delete_command
FROM auth.users au
WHERE au.email LIKE '%test%' 
   OR au.email LIKE '%example%'
   OR au.confirmed_at IS NULL  -- Unconfirmed users
ORDER BY au.created_at DESC;

-- Step 5: Clean up specific email (REPLACE WITH YOUR TEST EMAIL)
-- Uncomment and modify the email to delete a specific test user
/*
DO $$
DECLARE
    target_email TEXT := 'your-test-email@example.com';  -- CHANGE THIS
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NOT NULL THEN
        -- Delete profile first
        DELETE FROM public.user_profiles WHERE user_id = target_user_id;
        
        -- Delete auth user
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'Deleted user and profile for: %', target_email;
    ELSE
        RAISE NOTICE 'User not found: %', target_email;
    END IF;
END $$;
*/

SELECT 'Cleanup script ready - uncomment sections to delete data' as status;


