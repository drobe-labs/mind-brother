-- Complete Mind Brother Database Setup
-- Run this entire file in your Supabase SQL Editor

-- 1. Create all necessary tables first
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  user_type VARCHAR(20) CHECK (user_type IN ('individual', 'professional')) DEFAULT 'individual',
  professional_title VARCHAR(100),
  professional_license VARCHAR(100),
  practice_name VARCHAR(200),
  practice_address TEXT,
  years_experience INTEGER,
  specializations TEXT[],
  bio TEXT,
  profile_picture_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discussion_notifications BOOLEAN DEFAULT true,
  mention_notifications BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT NOT NULL,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  mood_emoji VARCHAR(10),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES discussion_topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussion_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES discussion_topics(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(topic_id, user_id),
  UNIQUE(reply_id, user_id)
);

CREATE TABLE IF NOT EXISTS mood_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5) NOT NULL,
  mood_emoji VARCHAR(10),
  notes TEXT,
  checkin_type VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS journal_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_user_id ON discussion_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_category ON discussion_topics(category);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_created_at ON discussion_topics(created_at);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_topic_id ON discussion_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_user_id ON discussion_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_created_at ON mood_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies

-- User Profiles Policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Journal Entries Policies
CREATE POLICY "Users can view their own journal entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries" ON journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" ON journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" ON journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Discussion Topics Policies
CREATE POLICY "Anyone can view discussion topics" ON discussion_topics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussion topics" ON discussion_topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussion topics" ON discussion_topics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussion topics" ON discussion_topics
  FOR DELETE USING (auth.uid() = user_id);

-- Discussion Replies Policies
CREATE POLICY "Anyone can view discussion replies" ON discussion_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussion replies" ON discussion_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussion replies" ON discussion_replies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussion replies" ON discussion_replies
  FOR DELETE USING (auth.uid() = user_id);

-- Discussion Reactions Policies
CREATE POLICY "Anyone can view discussion reactions" ON discussion_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reactions" ON discussion_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON discussion_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Mood Check-ins Policies
CREATE POLICY "Users can view their own mood check-ins" ON mood_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood check-ins" ON mood_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood check-ins" ON mood_checkins
  FOR UPDATE USING (auth.uid() = user_id);

-- Notification Logs Policies
CREATE POLICY "Users can view their own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- Journal Prompts Policies (public read, admin write)
CREATE POLICY "Anyone can view journal prompts" ON journal_prompts
  FOR SELECT USING (true);

-- Audit Logs Policies (admin only for now)
CREATE POLICY "Only service role can access audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- 5. Insert some sample journal prompts
INSERT INTO journal_prompts (prompt_text, category, difficulty_level) VALUES
('What are three things you''re grateful for today?', 'gratitude', 'easy'),
('Describe a moment today when you felt proud of yourself.', 'self_reflection', 'easy'),
('What challenge did you face today, and how did you handle it?', 'challenges', 'medium'),
('Write about a person who made a positive impact on your day.', 'relationships', 'easy'),
('What emotion did you feel most strongly today, and why?', 'emotions', 'medium'),
('Describe something new you learned about yourself today.', 'self_discovery', 'medium'),
('What would you tell your past self from one year ago?', 'reflection', 'hard'),
('Write about a goal you''re working toward and your progress.', 'goals', 'medium'),
('What made you smile or laugh today?', 'positivity', 'easy'),
('Describe a moment when you felt completely at peace.', 'mindfulness', 'medium')
ON CONFLICT DO NOTHING;

-- 6. Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_topics_updated_at BEFORE UPDATE ON discussion_topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussion_replies_updated_at BEFORE UPDATE ON discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to update reply count on discussion topics
CREATE OR REPLACE FUNCTION update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE discussion_topics 
        SET reply_count = reply_count + 1, last_reply_at = NEW.created_at
        WHERE id = NEW.topic_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE discussion_topics 
        SET reply_count = reply_count - 1
        WHERE id = OLD.topic_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 9. Create trigger for reply count updates
CREATE TRIGGER update_reply_count_trigger
    AFTER INSERT OR DELETE ON discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_topic_reply_count();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Success message
SELECT 'Database setup completed successfully! All tables created with RLS policies.' as status;






