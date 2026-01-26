-- Cultural Personalization System for Mind Brother
-- Enables culturally adaptive AI responses for Black and Brown men

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- User cultural profiles - stores cultural preferences and context
CREATE TABLE IF NOT EXISTS user_cultural_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Explicit preferences (from onboarding)
  cultural_background TEXT,
  age_range TEXT,
  communities TEXT[] DEFAULT '{}',
  communication_style TEXT,
  primary_concerns TEXT[] DEFAULT '{}',
  spiritual_preferences TEXT,
  
  -- Language preferences (especially for Latino/Caribbean users)
  language_preference JSONB DEFAULT NULL,
  -- Example: {"primary": "spanish", "secondary": "english", "acceptsMixedLanguage": true}
  
  -- Privacy and consent
  allows_personalization BOOLEAN DEFAULT TRUE,
  
  -- Inferred context (from conversations)
  inferred_context JSONB DEFAULT '{}'::jsonb,
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context signals detected from conversations
CREATE TABLE IF NOT EXISTS user_context_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id TEXT,
  signal_type TEXT NOT NULL,
  signal_value TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.50,
  -- Enhanced signal fields for richer context
  inferred_attribute TEXT,
  inferred_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to existing table if they don't exist (for existing deployments)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_context_signals' AND column_name = 'inferred_attribute') THEN
    ALTER TABLE user_context_signals ADD COLUMN inferred_attribute TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_context_signals' AND column_name = 'inferred_value') THEN
    ALTER TABLE user_context_signals ADD COLUMN inferred_value TEXT;
  END IF;
  -- Add language preference column to cultural profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_cultural_profiles' AND column_name = 'language_preference') THEN
    ALTER TABLE user_cultural_profiles ADD COLUMN language_preference JSONB DEFAULT NULL;
  END IF;
END $$;

-- Cultural content library - curated content for different backgrounds
CREATE TABLE IF NOT EXISTS cultural_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'affirmation', 'resource', 'tip', 'quote', 'exercise'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Targeting
  target_cultural_backgrounds TEXT[] DEFAULT NULL, -- NULL means all
  target_communities TEXT[] DEFAULT NULL, -- NULL means all
  target_concerns TEXT[] DEFAULT NULL, -- NULL means all
  
  -- Metadata
  author TEXT,
  source TEXT,
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_cultural_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================

DROP POLICY IF EXISTS "Users can manage own cultural profile" ON user_cultural_profiles;
DROP POLICY IF EXISTS "Users can view own cultural profile" ON user_cultural_profiles;
DROP POLICY IF EXISTS "Users can insert own cultural profile" ON user_cultural_profiles;
DROP POLICY IF EXISTS "Users can update own cultural profile" ON user_cultural_profiles;

DROP POLICY IF EXISTS "Users can view own context signals" ON user_context_signals;
DROP POLICY IF EXISTS "Users can insert own context signals" ON user_context_signals;

DROP POLICY IF EXISTS "Anyone can read active cultural content" ON cultural_content;
DROP POLICY IF EXISTS "Admins can manage cultural content" ON cultural_content;

-- ============================================
-- 4. CREATE POLICIES
-- ============================================

-- User cultural profiles policies
CREATE POLICY "Users can view own cultural profile" ON user_cultural_profiles
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cultural profile" ON user_cultural_profiles
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cultural profile" ON user_cultural_profiles
  FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Context signals policies
CREATE POLICY "Users can view own context signals" ON user_context_signals
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context signals" ON user_context_signals
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Cultural content policies
CREATE POLICY "Anyone can read active cultural content" ON cultural_content
  FOR SELECT TO authenticated 
  USING (is_active = TRUE);

-- ============================================
-- 5. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cultural_profiles_user ON user_cultural_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_cultural_profiles_background ON user_cultural_profiles(cultural_background);
CREATE INDEX IF NOT EXISTS idx_context_signals_user ON user_context_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_context_signals_type ON user_context_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_cultural_content_type ON cultural_content(content_type);
CREATE INDEX IF NOT EXISTS idx_cultural_content_active ON cultural_content(is_active);

-- ============================================
-- 6. INSERT SEED DATA - Culturally Relevant Content
-- ============================================

INSERT INTO cultural_content (content_type, title, content, target_cultural_backgrounds, target_communities, priority, is_active) VALUES

-- Affirmations for Black and Brown men
('affirmation', 'Strength in Vulnerability', 
 'Your willingness to face your emotions takes more courage than hiding them. Real strength is showing up authentically, even when it''s hard.',
 ARRAY['African American', 'African', 'Caribbean'], NULL, 10, TRUE),

('affirmation', 'Generational Healing', 
 'You are not just healing yourself—you are breaking cycles and creating new possibilities for those who come after you.',
 ARRAY['African American', 'African', 'Caribbean', 'Latino/Hispanic'], NULL, 10, TRUE),

('affirmation', 'Code-Switching Recognition', 
 'The energy it takes to navigate different spaces is real. Your exhaustion from code-switching is valid. You deserve spaces where you can just be yourself.',
 ARRAY['African American', 'African', 'Caribbean', 'Latino/Hispanic'], NULL, 9, TRUE),

('affirmation', 'Cultural Pride', 
 'Your culture, your history, your ancestors—they are sources of strength. You carry generations of resilience within you.',
 ARRAY['African American', 'African', 'Caribbean', 'Latino/Hispanic'], NULL, 9, TRUE),

-- Veteran-specific content
('affirmation', 'Veteran Transition', 
 'Transitioning from military to civilian life is one of the hardest things you''ll do. Be patient with yourself. Your service matters, and so does your healing.',
 NULL, ARRAY['Veteran/Military'], 10, TRUE),

('resource', 'Veterans Crisis Line', 
 'Call 988, then press 1, or text 838255. Available 24/7 for veterans and their families.',
 NULL, ARRAY['Veteran/Military'], 10, TRUE),

-- LGBTQ+ specific content
('affirmation', 'Authentic Self', 
 'Living authentically as a Black queer man takes courage. Your identity is not a contradiction—it''s the full, beautiful expression of who you are.',
 ARRAY['African American', 'African', 'Caribbean'], ARRAY['LGBTQ+'], 10, TRUE),

-- Faith-based content
('affirmation', 'Faith and Mental Health', 
 'Your faith and mental health journey can walk together. Seeking help is not a lack of faith—it''s wisdom. God works through therapists, counselors, and community too.',
 NULL, ARRAY['Faith-based'], 9, TRUE),

-- Formerly incarcerated
('affirmation', 'Second Chances', 
 'Your past does not define your future. You''ve survived things that would break most people. That strength is still in you.',
 NULL, ARRAY['Formerly incarcerated'], 10, TRUE),

('resource', 'Reentry Support', 
 'National Reentry Resource Center: nationalreentryresourcecenter.org - Housing, employment, and support for those rebuilding after incarceration.',
 NULL, ARRAY['Formerly incarcerated'], 10, TRUE),

-- General mental health tips
('tip', 'Grounding Technique', 
 '5-4-3-2-1 Grounding: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. This brings you back to the present moment.',
 NULL, NULL, 8, TRUE),

('tip', 'Box Breathing', 
 'Box breathing for stress: Breathe in for 4 counts, hold for 4, breathe out for 4, hold for 4. Repeat 4 times. This activates your calm response.',
 NULL, NULL, 8, TRUE),

('quote', 'James Baldwin on Healing', 
 '"Not everything that is faced can be changed, but nothing can be changed until it is faced." - James Baldwin',
 ARRAY['African American', 'African', 'Caribbean'], NULL, 7, TRUE),

('quote', 'Maya Angelou on Courage', 
 '"Courage is the most important of all the virtues because without courage, you can''t practice any other virtue consistently." - Maya Angelou',
 ARRAY['African American', 'African', 'Caribbean'], NULL, 7, TRUE)

ON CONFLICT DO NOTHING;

-- ============================================
-- 7. CREATE FUNCTION TO UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_cultural_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cultural_profile_timestamp ON user_cultural_profiles;
CREATE TRIGGER trigger_update_cultural_profile_timestamp
  BEFORE UPDATE ON user_cultural_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_cultural_profile_timestamp();

DROP TRIGGER IF EXISTS trigger_update_cultural_content_timestamp ON cultural_content;
CREATE TRIGGER trigger_update_cultural_content_timestamp
  BEFORE UPDATE ON cultural_content
  FOR EACH ROW
  EXECUTE FUNCTION update_cultural_profile_timestamp();

