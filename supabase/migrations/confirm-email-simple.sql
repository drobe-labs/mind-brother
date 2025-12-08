-- ============================================
-- SIMPLE EMAIL CONFIRMATION
-- Replace 'your-email@example.com' with YOUR actual email
-- ============================================

UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';


