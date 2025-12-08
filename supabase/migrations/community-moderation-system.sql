-- ============================================
-- COMMUNITY MODERATION SYSTEM SETUP
-- Creates tables for moderation, reputation, behavior tracking, and crisis response
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USER REPUTATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_reputation (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scores
  reputation_score INTEGER DEFAULT 100 CHECK (reputation_score >= 0 AND reputation_score <= 200),
  trust_level VARCHAR(20) DEFAULT 'new' CHECK (trust_level IN ('new', 'member', 'trusted', 'at-risk', 'restricted')),
  
  -- Positive metrics
  helpful_posts_count INTEGER DEFAULT 0,
  supportive_comments_count INTEGER DEFAULT 0,
  helpful_reactions_received INTEGER DEFAULT 0,
  
  -- Negative metrics
  warnings_received INTEGER DEFAULT 0,
  content_removed_count INTEGER DEFAULT 0,
  reports_received INTEGER DEFAULT 0,
  reports_upheld INTEGER DEFAULT 0,
  suspensions_count INTEGER DEFAULT 0,
  
  -- Crisis tracking
  crisis_posts_count INTEGER DEFAULT 0,
  last_crisis_post_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_banned BOOLEAN DEFAULT FALSE,
  ban_expires_at TIMESTAMP WITH TIME ZONE,
  ban_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for trust level filtering
CREATE INDEX IF NOT EXISTS idx_user_reputation_trust_level ON user_reputation(trust_level);
CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(reputation_score);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_reputation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_reputation_timestamp ON user_reputation;
CREATE TRIGGER update_user_reputation_timestamp
BEFORE UPDATE ON user_reputation
FOR EACH ROW
EXECUTE FUNCTION update_user_reputation_updated_at();

-- Initialize reputation for existing users
INSERT INTO user_reputation (user_id, reputation_score, trust_level)
SELECT id, 100, 'member'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_reputation)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 2. CONTENT REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('topic', 'reply')),
  
  -- Report details
  report_reason VARCHAR(50) NOT NULL CHECK (report_reason IN (
    'crisis', 'harmful', 'harassment', 'spam', 'trigger_warning', 
    'medical_advice', 'off_topic', 'hate_speech', 'personal_info', 'other'
  )),
  report_details TEXT,
  priority_level VARCHAR(10) DEFAULT 'P3' CHECK (priority_level IN ('P0', 'P1', 'P2', 'P3')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Resolution
  action_taken VARCHAR(50),
  moderator_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_priority ON content_reports(priority_level);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, reported_content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at);

-- ============================================
-- 3. MODERATION LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS moderation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'remove_post', 'remove_reply', 'warning', 'suspension', 'ban', 
    'add_trigger_warning', 'dismiss_report', 'crisis_intervention', 
    'edit_content', 'add_crisis_resources'
  )),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_content_id UUID,
  content_type VARCHAR(20) CHECK (content_type IN ('topic', 'reply')),
  
  -- Details
  reason TEXT,
  notes TEXT,
  
  -- Audit trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_moderator ON moderation_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_target_user ON moderation_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_action ON moderation_log(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created ON moderation_log(created_at);

-- ============================================
-- 4. USER BEHAVIOR TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_behavior_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Pattern tracking
  posts_in_last_hour INTEGER DEFAULT 0,
  posts_in_last_day INTEGER DEFAULT 0,
  last_post_at TIMESTAMP WITH TIME ZONE,
  
  -- Duplicate detection
  recent_post_hashes TEXT[], -- Array of content hashes for duplicate detection
  
  -- Behavior flags
  rapid_posting_detected BOOLEAN DEFAULT FALSE,
  duplicate_content_detected BOOLEAN DEFAULT FALSE,
  spam_pattern_detected BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index for behavior analysis
CREATE INDEX IF NOT EXISTS idx_user_behavior_user_id ON user_behavior_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_rapid_posting ON user_behavior_tracking(rapid_posting_detected);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_behavior_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_behavior_timestamp ON user_behavior_tracking;
CREATE TRIGGER update_user_behavior_timestamp
BEFORE UPDATE ON user_behavior_tracking
FOR EACH ROW
EXECUTE FUNCTION update_user_behavior_updated_at();

-- ============================================
-- 5. CRISIS RESPONSE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crisis_response_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('topic', 'reply')),
  
  -- Risk assessment
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('moderate', 'elevated', 'high', 'critical')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Response timeline
  resources_added_at TIMESTAMP WITH TIME ZONE,
  message_sent_at TIMESTAMP WITH TIME ZONE,
  follow_up_scheduled_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- User response
  user_responded BOOLEAN DEFAULT FALSE,
  user_responded_at TIMESTAMP WITH TIME ZONE,
  response_content TEXT,
  
  -- Outcome
  resolution_status VARCHAR(20) DEFAULT 'open' CHECK (resolution_status IN ('open', 'monitoring', 'resolved', 'escalated')),
  resolution_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crisis_response_user ON crisis_response_log(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_response_status ON crisis_response_log(resolution_status);
CREATE INDEX IF NOT EXISTS idx_crisis_response_risk ON crisis_response_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_crisis_response_created ON crisis_response_log(created_at);

-- ============================================
-- 6. ADD MODERATION COLUMNS TO DISCUSSION TABLES
-- ============================================

-- Add moderation columns to discussion_topics if they don't exist
DO $$ 
BEGIN
  -- Auto-moderation status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'auto_mod_status') THEN
    ALTER TABLE discussion_topics ADD COLUMN auto_mod_status VARCHAR(20) DEFAULT 'approved' CHECK (auto_mod_status IN ('approved', 'flagged', 'blocked', 'review'));
  END IF;
  
  -- Risk level
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'risk_level') THEN
    ALTER TABLE discussion_topics ADD COLUMN risk_level VARCHAR(20) DEFAULT 'none' CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical'));
  END IF;
  
  -- Moderation metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'is_removed') THEN
    ALTER TABLE discussion_topics ADD COLUMN is_removed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'removed_at') THEN
    ALTER TABLE discussion_topics ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'removed_by') THEN
    ALTER TABLE discussion_topics ADD COLUMN removed_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'report_count') THEN
    ALTER TABLE discussion_topics ADD COLUMN report_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'crisis_resources_added') THEN
    ALTER TABLE discussion_topics ADD COLUMN crisis_resources_added BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- AI analysis metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'ai_analysis_json') THEN
    ALTER TABLE discussion_topics ADD COLUMN ai_analysis_json JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'ai_analyzed_at') THEN
    ALTER TABLE discussion_topics ADD COLUMN ai_analyzed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add same moderation columns to discussion_replies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'auto_mod_status') THEN
    ALTER TABLE discussion_replies ADD COLUMN auto_mod_status VARCHAR(20) DEFAULT 'approved' CHECK (auto_mod_status IN ('approved', 'flagged', 'blocked', 'review'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'risk_level') THEN
    ALTER TABLE discussion_replies ADD COLUMN risk_level VARCHAR(20) DEFAULT 'none' CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'is_removed') THEN
    ALTER TABLE discussion_replies ADD COLUMN is_removed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'removed_at') THEN
    ALTER TABLE discussion_replies ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'removed_by') THEN
    ALTER TABLE discussion_replies ADD COLUMN removed_by UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'report_count') THEN
    ALTER TABLE discussion_replies ADD COLUMN report_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'crisis_resources_added') THEN
    ALTER TABLE discussion_replies ADD COLUMN crisis_resources_added BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'ai_analysis_json') THEN
    ALTER TABLE discussion_replies ADD COLUMN ai_analysis_json JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'ai_analyzed_at') THEN
    ALTER TABLE discussion_replies ADD COLUMN ai_analyzed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add helpful_count if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_replies' AND column_name = 'helpful_count') THEN
    ALTER TABLE discussion_replies ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 7. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_response_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CREATE RLS POLICIES
-- ============================================

-- User Reputation: Users can read their own, moderators can read all
DROP POLICY IF EXISTS "Users can view own reputation" ON user_reputation;
CREATE POLICY "Users can view own reputation" ON user_reputation
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Moderators can view all reputation" ON user_reputation;
CREATE POLICY "Moderators can view all reputation" ON user_reputation
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

-- Content Reports: Users can create and view their own reports
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports" ON content_reports
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own reports" ON content_reports;
CREATE POLICY "Users can view own reports" ON content_reports
FOR SELECT TO authenticated
USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Moderators can view all reports" ON content_reports;
CREATE POLICY "Moderators can view all reports" ON content_reports
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

-- Moderation Log: Only moderators can view
DROP POLICY IF EXISTS "Moderators can view moderation log" ON moderation_log;
CREATE POLICY "Moderators can view moderation log" ON moderation_log
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

DROP POLICY IF EXISTS "Moderators can create moderation log" ON moderation_log;
CREATE POLICY "Moderators can create moderation log" ON moderation_log
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

-- User Behavior: Users can view their own, moderators can view all
DROP POLICY IF EXISTS "Users can view own behavior" ON user_behavior_tracking;
CREATE POLICY "Users can view own behavior" ON user_behavior_tracking
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Moderators can view all behavior" ON user_behavior_tracking;
CREATE POLICY "Moderators can view all behavior" ON user_behavior_tracking
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

-- Crisis Response: Moderators only (sensitive data)
DROP POLICY IF EXISTS "Moderators can manage crisis responses" ON crisis_response_log;
CREATE POLICY "Moderators can manage crisis responses" ON crisis_response_log
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin', 'moderator')
  )
);

-- ============================================
-- 9. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to calculate reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 100;
  helpful_count INTEGER;
  warnings_count INTEGER;
  removed_count INTEGER;
  reports_upheld_count INTEGER;
BEGIN
  SELECT 
    COALESCE(helpful_posts_count, 0) + COALESCE(supportive_comments_count, 0),
    COALESCE(warnings_received, 0),
    COALESCE(content_removed_count, 0),
    COALESCE(reports_upheld, 0)
  INTO helpful_count, warnings_count, removed_count, reports_upheld_count
  FROM user_reputation
  WHERE user_id = user_id_param;
  
  -- Base score adjustments
  score := score + (helpful_count * 2); -- +2 per helpful post/comment
  score := score - (warnings_count * 10); -- -10 per warning
  score := score - (removed_count * 15); -- -15 per removed content
  score := score - (reports_upheld_count * 5); -- -5 per upheld report
  
  -- Clamp between 0 and 200
  score := GREATEST(0, LEAST(200, score));
  
  RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trust level based on reputation
CREATE OR REPLACE FUNCTION update_trust_level(user_id_param UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  score INTEGER;
  days_since_join INTEGER;
  post_count INTEGER;
  new_trust_level VARCHAR(20);
BEGIN
  SELECT reputation_score, 
         EXTRACT(DAY FROM NOW() - created_at)::INTEGER,
         (SELECT COUNT(*) FROM discussion_topics WHERE user_id = user_id_param)
  INTO score, days_since_join, post_count
  FROM user_reputation
  WHERE user_id = user_id_param;
  
  -- Determine trust level
  IF score < 50 OR (SELECT warnings_received FROM user_reputation WHERE user_id = user_id_param) >= 3 THEN
    new_trust_level := 'at-risk';
  ELSIF score < 30 OR (SELECT is_banned FROM user_reputation WHERE user_id = user_id_param) THEN
    new_trust_level := 'restricted';
  ELSIF score >= 150 AND days_since_join >= 30 AND post_count >= 50 THEN
    new_trust_level := 'trusted';
  ELSIF days_since_join >= 7 AND post_count >= 10 THEN
    new_trust_level := 'member';
  ELSE
    new_trust_level := 'new';
  END IF;
  
  UPDATE user_reputation
  SET trust_level = new_trust_level
  WHERE user_id = user_id_param;
  
  RETURN new_trust_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. VERIFICATION
-- ============================================
SELECT 
  'Community Moderation System Setup Complete!' as status,
  (SELECT COUNT(*) FROM user_reputation) as reputation_records,
  (SELECT COUNT(*) FROM content_reports) as reports_count,
  (SELECT COUNT(*) FROM moderation_log) as moderation_actions,
  (SELECT COUNT(*) FROM user_behavior_tracking) as behavior_records;

