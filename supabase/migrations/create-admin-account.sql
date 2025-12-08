-- ============================================
-- CREATE ADMIN ACCOUNT
-- Run this in Supabase SQL Editor
-- ============================================
-- 
-- METHOD 1: Update existing user to admin (RECOMMENDED)
-- Replace 'your-email@example.com' with your actual email
-- ============================================

UPDATE user_profiles 
SET user_type = 'admin',
    updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT 
  user_id,
  email,
  first_name,
  last_name,
  user_type,
  created_at
FROM user_profiles
WHERE email = 'your-email@example.com';

-- ============================================
-- METHOD 2: Create new admin user via Supabase Dashboard
-- ============================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Enter:
--    - Email: admin@mindbrother.com (or your preferred email)
--    - Password: (choose a secure password)
--    - Auto Confirm User: ✅ (check this)
-- 4. Click "Create user"
-- 5. Then run this SQL (replace with the email you used):
-- ============================================

-- After creating the user in the dashboard, run this:
-- UPDATE user_profiles 
-- SET user_type = 'admin',
--     username = COALESCE(username, 'admin'),
--     first_name = COALESCE(first_name, 'Admin'),
--     last_name = COALESCE(last_name, 'User'),
--     updated_at = NOW()
-- WHERE email = 'admin@mindbrother.com';

-- Initialize reputation if it doesn't exist
-- INSERT INTO user_reputation (user_id, reputation_score, trust_level)
-- SELECT 
--   user_id,
--   1000,
--   'trusted'
-- FROM user_profiles
-- WHERE email = 'admin@mindbrother.com'
--   AND user_type = 'admin'
-- ON CONFLICT (user_id) DO NOTHING;

