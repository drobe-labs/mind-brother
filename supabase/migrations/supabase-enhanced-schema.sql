-- Enhanced Mind Brother Database Schema
-- Run these commands in your Supabase SQL Editor

-- 1. Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('individual', 'professional')),
  
  -- Individual user fields
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  pronouns TEXT,
  phone_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  emergency_consent BOOLEAN DEFAULT FALSE,
  
  -- Professional user fields
  practice_name TEXT,
  license_type TEXT,
  license_number TEXT,
  license_state TEXT,
  specialties TEXT[],
  years_experience INTEGER,
  bio TEXT,
  website_url TEXT,
  office_address TEXT,
  office_phone TEXT,
  insurance_accepted TEXT[],
  session_types TEXT[], -- in-person, virtual, both
  availability_hours JSONB,
  
  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT FALSE,
  morning_notifications BOOLEAN DEFAULT TRUE,
  checkin_notifications BOOLEAN DEFAULT TRUE,
  notification_time_morning TIME DEFAULT '08:00:00',
  notification_time_checkin TIME DEFAULT '13:00:00',
  
  -- Profile settings
  profile_image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(user_id)
);

-- 2. Create notification_logs table to track sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL, -- morning, checkin, crisis
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'sent', -- sent, delivered, failed
  response TEXT, -- for checkin responses
  response_timestamp TIMESTAMP WITH TIME ZONE
);

-- 3. Create mood_checkins table for notification responses
CREATE TABLE IF NOT EXISTS mood_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 5),
  mood_emoji TEXT,
  response_type TEXT, -- thumbs_up, thumbs_down, full_checkin
  note TEXT,
  triggered_by TEXT DEFAULT 'notification', -- notification, manual, chatbot
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create professional_availability table
CREATE TABLE IF NOT EXISTS professional_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_created_at ON mood_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_professional_availability_professional_id ON professional_availability(professional_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies

-- User profiles - users can read/update their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public can view verified professional profiles
CREATE POLICY "Public can view verified professionals" ON user_profiles
  FOR SELECT USING (user_type = 'professional' AND is_verified = true AND is_active = true);

-- Notification logs - users can view their own logs
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Mood checkins - users can manage their own checkins
CREATE POLICY "Users can manage their own mood checkins" ON mood_checkins
  FOR ALL USING (auth.uid() = user_id);

-- Professional availability - professionals can manage their own availability
CREATE POLICY "Professionals can manage their own availability" ON professional_availability
  FOR ALL USING (auth.uid() = professional_id);

-- Public can view professional availability
CREATE POLICY "Public can view professional availability" ON professional_availability
  FOR SELECT USING (true);

-- 8. Create functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert some sample professional data (optional)
-- You can uncomment and modify these for testing
/*
INSERT INTO auth.users (id, email) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'dr.smith@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO user_profiles (
  user_id, user_type, first_name, last_name, practice_name, 
  license_type, license_number, license_state, specialties, 
  years_experience, bio, is_verified, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001', 
  'professional',
  'Dr. Sarah',
  'Smith',
  'Culturally Conscious Therapy',
  'LCSW',
  'SW123456',
  'CA',
  ARRAY['Trauma', 'Anxiety', 'Depression', 'Cultural Issues'],
  8,
  'Specializing in culturally competent therapy for men of color. Trauma-informed care with a focus on systemic issues.',
  true,
  true
);
*/

