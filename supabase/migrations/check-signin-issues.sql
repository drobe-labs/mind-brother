-- ============================================
-- DIAGNOSE SIGN-IN ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Check if your user exists and email is confirmed
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    last_sign_in_at,
    CASE 
        WHEN confirmed_at IS NULL THEN '❌ EMAIL NOT CONFIRMED'
        ELSE '✅ EMAIL CONFIRMED'
    END as status
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'  -- REPLACE WITH YOUR EMAIL
ORDER BY created_at DESC;

-- 2. Check if profile exists for your user
SELECT 
    up.user_id,
    up.email,
    up.first_name,
    up.last_name,
    up.user_type,
    CASE 
        WHEN up.user_id IS NOT NULL THEN '✅ PROFILE EXISTS'
        ELSE '❌ NO PROFILE'
    END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'YOUR_EMAIL_HERE'  -- REPLACE WITH YOUR EMAIL
ORDER BY au.created_at DESC;

-- 3. Check RLS policies on user_profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 4. Test if you can select your own profile (simulate sign-in check)
-- This won't work in SQL editor, but shows the query being used
-- SELECT * FROM user_profiles WHERE user_id = 'YOUR_USER_ID_HERE';

-- 5. Show all authentication settings
SELECT 
    'Check these in Supabase Dashboard → Authentication → Providers → Email:' as instruction
UNION ALL
SELECT '- Enable email confirmations: Check if ON or OFF'
UNION ALL
SELECT '- Email confirmation redirect: Should match your app URL'
UNION ALL  
SELECT '- Site URL: Should be your app URL (http://192.168.5.156:5173 or similar)';

-- ============================================
-- QUICK FIX: Manually confirm email if stuck
-- ============================================
-- Uncomment the line below to manually confirm your email
-- UPDATE auth.users 
-- SET confirmed_at = NOW(), 
--     email_confirmed_at = NOW()
-- WHERE email = 'YOUR_EMAIL_HERE';  -- REPLACE WITH YOUR EMAIL


