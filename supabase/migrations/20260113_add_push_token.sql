-- Add push_token column to user_profiles for FCM push notifications
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_push_token 
ON user_profiles(push_token) 
WHERE push_token IS NOT NULL;


