-- ============================================
-- MANUALLY CONFIRM YOUR EMAIL
-- ============================================

-- STEP 1: Replace 'YOUR_EMAIL_HERE' with your actual email
-- STEP 2: Run this entire script in Supabase SQL Editor

-- Confirm the email for your user
UPDATE auth.users 
SET 
    confirmed_at = NOW(), 
    email_confirmed_at = NOW()
WHERE email = 'YOUR_EMAIL_HERE';  -- ⚠️ REPLACE THIS WITH YOUR EMAIL

-- Verify it worked
SELECT 
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN '✅ EMAIL CONFIRMED - You can sign in now!'
        ELSE '❌ Still not confirmed - check the email above'
    END as status
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';  -- ⚠️ REPLACE THIS WITH YOUR EMAIL


