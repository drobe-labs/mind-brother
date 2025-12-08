-- Check what's in the user_profiles table for this user
SELECT 
  user_id,
  email,
  first_name,
  last_name,
  username,
  created_at
FROM user_profiles 
WHERE user_id = 'b9e57534-8751-4532-a23f-a5370d57b1da';

-- Update the profile with the name if needed
-- UPDATE user_profiles 
-- SET first_name = 'Dennis',
--     last_name = 'Roberson'
-- WHERE user_id = 'b9e57534-8751-4532-a23f-a5370d57b1da';
