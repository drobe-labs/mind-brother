-- Chatbot Feedback Learning System
-- Stores user feedback to improve AI responses over time

-- ============================================
-- 1. CREATE TABLES (with IF NOT EXISTS)
-- ============================================

-- Table to store individual message feedback
CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT NOT NULL,
  user_message TEXT NOT NULL DEFAULT '',
  ai_response TEXT NOT NULL DEFAULT '',
  rating TEXT NOT NULL CHECK (rating IN ('thumbs_up', 'thumbs_down')),
  feedback_text TEXT,
  topic TEXT,
  response_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store learned patterns from feedback
CREATE TABLE IF NOT EXISTS chatbot_learned_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('avoid', 'prefer', 'topic_guidance')),
  topic TEXT,
  pattern_description TEXT NOT NULL,
  example_bad_response TEXT,
  example_good_response TEXT,
  occurrence_count INT DEFAULT 1,
  confidence_score NUMERIC(3,2) DEFAULT 0.50,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store persistent chat history per user (may already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chatbot_conversations') THEN
    CREATE TABLE chatbot_conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb,
      last_topic TEXT,
      session_count INT DEFAULT 1,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE chatbot_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_learned_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS "Users can insert own feedback" ON chatbot_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON chatbot_feedback;
DROP POLICY IF EXISTS "Anyone can read learned patterns" ON chatbot_learned_patterns;
DROP POLICY IF EXISTS "Service role can manage patterns" ON chatbot_learned_patterns;
DROP POLICY IF EXISTS "Users can manage own conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON chatbot_conversations;
DROP POLICY IF EXISTS "Users can select own conversations" ON chatbot_conversations;

-- ============================================
-- 4. CREATE POLICIES
-- ============================================

-- Policies for chatbot_feedback
CREATE POLICY "Users can insert own feedback" ON chatbot_feedback
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback" ON chatbot_feedback
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Policies for chatbot_learned_patterns
CREATE POLICY "Anyone can read learned patterns" ON chatbot_learned_patterns
  FOR SELECT TO authenticated 
  USING (true);

-- Policies for chatbot_conversations (separate policies for each operation)
CREATE POLICY "Users can select own conversations" ON chatbot_conversations
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON chatbot_conversations
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chatbot_conversations
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_user ON chatbot_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_rating ON chatbot_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_chatbot_feedback_topic ON chatbot_feedback(topic);
CREATE INDEX IF NOT EXISTS idx_chatbot_learned_patterns_topic ON chatbot_learned_patterns(topic);
CREATE INDEX IF NOT EXISTS idx_chatbot_learned_patterns_active ON chatbot_learned_patterns(active);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user ON chatbot_conversations(user_id);

-- ============================================
-- 6. CREATE FUNCTION (with SECURITY DEFINER)
-- ============================================
CREATE OR REPLACE FUNCTION analyze_feedback_patterns()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  thumbs_down_threshold INT := 3;
  pattern_record RECORD;
BEGIN
  FOR pattern_record IN 
    SELECT 
      topic,
      COUNT(*) as down_count,
      array_agg(DISTINCT ai_response) as bad_responses
    FROM chatbot_feedback
    WHERE rating = 'thumbs_down'
      AND topic IS NOT NULL
    GROUP BY topic
    HAVING COUNT(*) >= thumbs_down_threshold
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM chatbot_learned_patterns 
      WHERE topic = pattern_record.topic 
      AND pattern_type = 'avoid'
    ) THEN
      INSERT INTO chatbot_learned_patterns (
        pattern_type,
        topic,
        pattern_description,
        example_bad_response,
        occurrence_count,
        confidence_score
      ) VALUES (
        'avoid',
        pattern_record.topic,
        'Users disliked responses on this topic. Review and improve.',
        pattern_record.bad_responses[1],
        pattern_record.down_count,
        LEAST(0.90, 0.50 + (pattern_record.down_count * 0.10))
      );
    ELSE
      UPDATE chatbot_learned_patterns
      SET 
        occurrence_count = occurrence_count + 1,
        confidence_score = LEAST(0.95, confidence_score + 0.05),
        updated_at = NOW()
      WHERE topic = pattern_record.topic AND pattern_type = 'avoid';
    END IF;
  END LOOP;
END;
$$;
