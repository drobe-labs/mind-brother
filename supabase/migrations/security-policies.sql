-- Mind Brother Security Policies
-- Run this in your Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;

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

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs policies (admin only for now)
CREATE POLICY "Only service role can access audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_user_id ON discussion_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_user_id ON discussion_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_id ON mood_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);






