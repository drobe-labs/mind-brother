-- Add username and notification fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS discussion_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mention_notifications BOOLEAN DEFAULT true;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Update existing users to have default notification settings
UPDATE user_profiles 
SET discussion_notifications = true, mention_notifications = true 
WHERE discussion_notifications IS NULL OR mention_notifications IS NULL;






