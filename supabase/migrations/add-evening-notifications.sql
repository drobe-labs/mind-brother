-- Add evening notification fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS evening_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_time_evening VARCHAR(5) DEFAULT '20:00';

-- Update existing users to have evening notifications disabled by default
UPDATE user_profiles 
SET evening_notifications = false, notification_time_evening = '20:00'
WHERE evening_notifications IS NULL OR notification_time_evening IS NULL;

-- Create device_tokens table for mobile push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT,
  app_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, device_token)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);

-- Enable RLS
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_tokens
CREATE POLICY "Users can view their own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device tokens"
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();



