-- Create Missing Profiles for Existing Users
-- This fixes the issue where users were created in auth.users but not in user_profiles

-- First, let's see which users are missing profiles
SELECT 
    au.id as user_id,
    au.email,
    au.created_at as user_created,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    CASE 
        WHEN up.user_id IS NULL THEN '❌ NO PROFILE' 
        ELSE '✅ HAS PROFILE' 
    END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC;

-- Create profiles for users that don't have one
-- This will only insert for users without profiles (thanks to LEFT JOIN WHERE NULL)
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
WHERE up.user_id IS NULL;  -- Only insert for users without profiles

-- Verify all users now have profiles
SELECT 
    COUNT(CASE WHEN up.user_id IS NULL THEN 1 END) as missing_profiles,
    COUNT(CASE WHEN up.user_id IS NOT NULL THEN 1 END) as has_profiles,
    COUNT(*) as total_users
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id;

-- Show the newly created profiles
SELECT 
    user_id,
    email,
    first_name,
    last_name,
    user_type,
    created_at,
    updated_at
FROM user_profiles
ORDER BY updated_at DESC
LIMIT 10;



