-- Content Recommendation System for Mind Brother
-- Personalized article and resource recommendations based on cultural profile and concerns

-- ============================================
-- 1. EXTEND CULTURAL_CONTENT TABLE
-- ============================================

-- Add columns if they don't exist
DO $$ 
BEGIN
  -- URL for external content
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'url') THEN
    ALTER TABLE cultural_content ADD COLUMN url TEXT;
  END IF;
  
  -- Full body content for articles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'body') THEN
    ALTER TABLE cultural_content ADD COLUMN body TEXT;
  END IF;
  
  -- Image URL for thumbnails
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'image_url') THEN
    ALTER TABLE cultural_content ADD COLUMN image_url TEXT;
  END IF;
  
  -- Estimated reading time in minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'reading_time') THEN
    ALTER TABLE cultural_content ADD COLUMN reading_time INTEGER;
  END IF;
  
  -- Tags for better categorization (JSONB to match existing schema)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'tags') THEN
    ALTER TABLE cultural_content ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Author name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'author') THEN
    ALTER TABLE cultural_content ADD COLUMN author TEXT;
  END IF;
  
  -- Source publication/website
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'source') THEN
    ALTER TABLE cultural_content ADD COLUMN source TEXT;
  END IF;
  
  -- Language of content
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'language') THEN
    ALTER TABLE cultural_content ADD COLUMN language TEXT DEFAULT 'english';
  END IF;
  
  -- Engagement metrics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'view_count') THEN
    ALTER TABLE cultural_content ADD COLUMN view_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'click_count') THEN
    ALTER TABLE cultural_content ADD COLUMN click_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultural_content' AND column_name = 'save_count') THEN
    ALTER TABLE cultural_content ADD COLUMN save_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- 2. CREATE CONTENT INTERACTION TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS content_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES cultural_content(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'click', 'complete', 'save', 'share', 'dismiss')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_content_interactions_user 
  ON content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_content 
  ON content_interactions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type 
  ON content_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_content_interactions_created 
  ON content_interactions(created_at DESC);

-- ============================================
-- 3. CREATE SAVED CONTENT TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS saved_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES cultural_content(id) ON DELETE CASCADE NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_content_user 
  ON saved_content(user_id);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;

-- Content interactions - users can only see/create their own
CREATE POLICY "Users can view their own content interactions"
  ON content_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create content interactions"
  ON content_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Saved content - users can manage their own
CREATE POLICY "Users can view their saved content"
  ON saved_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save content"
  ON saved_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete saved content"
  ON saved_content FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. PERSONALIZED CONTENT FUNCTION
-- ============================================

-- Drop existing function first to allow return type changes
DROP FUNCTION IF EXISTS get_personalized_content(UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION get_personalized_content(
  p_user_id UUID,
  p_content_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  title TEXT,
  content TEXT,
  url TEXT,
  image_url TEXT,
  reading_time INTEGER,
  tags JSONB,
  target_cultural_backgrounds JSONB,
  target_communities JSONB,
  target_concerns JSONB,
  author TEXT,
  source TEXT,
  language TEXT,
  priority INTEGER,
  match_score INTEGER,
  match_reasons TEXT[]
) AS $$
DECLARE
  v_cultural_background TEXT;
  v_communities JSONB;
  v_concerns JSONB;
  v_language TEXT;
BEGIN
  -- Get user's cultural profile
  SELECT 
    ucp.cultural_background,
    ucp.communities,
    ucp.primary_concerns,
    COALESCE(ucp.language_preference->>'primary', 'english')
  INTO v_cultural_background, v_communities, v_concerns, v_language
  FROM user_cultural_profiles ucp
  WHERE ucp.user_id = p_user_id;
  
  -- Return personalized content with match scoring
  RETURN QUERY
  SELECT 
    cc.id,
    cc.content_type,
    cc.title,
    cc.content,
    cc.url,
    cc.image_url,
    cc.reading_time,
    cc.tags,
    cc.target_cultural_backgrounds,
    cc.target_communities,
    cc.target_concerns,
    cc.author,
    cc.source,
    cc.language,
    cc.priority,
    -- Calculate match score
    (
      cc.priority +
      -- Cultural background match (+30)
      CASE WHEN v_cultural_background IS NOT NULL 
           AND cc.target_cultural_backgrounds @> to_jsonb(ARRAY[v_cultural_background])
           THEN 30 ELSE 0 END +
      -- Community overlap (up to +30)
      CASE WHEN v_communities IS NOT NULL 
           AND jsonb_typeof(cc.target_communities) = 'array'
           AND jsonb_typeof(v_communities) = 'array'
           AND EXISTS (
             SELECT 1 FROM jsonb_array_elements_text(cc.target_communities) tc
             WHERE tc IN (SELECT jsonb_array_elements_text(v_communities))
           )
           THEN 30 ELSE 0 END +
      -- Concern overlap (up to +40)
      CASE WHEN v_concerns IS NOT NULL 
           AND jsonb_typeof(cc.target_concerns) = 'array'
           AND jsonb_typeof(v_concerns) = 'array'
           AND EXISTS (
             SELECT 1 FROM jsonb_array_elements_text(cc.target_concerns) tc
             WHERE tc IN (SELECT jsonb_array_elements_text(v_concerns))
           )
           THEN 40 ELSE 0 END +
      -- Language match (+10)
      CASE WHEN cc.language = v_language THEN 10 ELSE 0 END
    )::INTEGER AS match_score,
    -- Build match reasons array
    ARRAY_REMOVE(ARRAY[
      CASE WHEN v_cultural_background IS NOT NULL 
           AND cc.target_cultural_backgrounds @> to_jsonb(ARRAY[v_cultural_background])
           THEN 'Matches your cultural background' END,
      CASE WHEN v_communities IS NOT NULL 
           AND jsonb_typeof(cc.target_communities) = 'array'
           AND jsonb_typeof(v_communities) = 'array'
           AND EXISTS (
             SELECT 1 FROM jsonb_array_elements_text(cc.target_communities) tc
             WHERE tc IN (SELECT jsonb_array_elements_text(v_communities))
           )
           THEN 'Relevant to your communities' END,
      CASE WHEN v_concerns IS NOT NULL 
           AND jsonb_typeof(cc.target_concerns) = 'array'
           AND jsonb_typeof(v_concerns) = 'array'
           AND EXISTS (
             SELECT 1 FROM jsonb_array_elements_text(cc.target_concerns) tc
             WHERE tc IN (SELECT jsonb_array_elements_text(v_concerns))
           )
           THEN 'Addresses your concerns' END,
      CASE WHEN cc.language = v_language AND v_language != 'english'
           THEN 'Available in your preferred language' END
    ], NULL) AS match_reasons
  FROM cultural_content cc
  WHERE cc.is_active = TRUE
    AND (p_content_type IS NULL OR cc.content_type = p_content_type)
    -- Exclude content user has dismissed
    AND NOT EXISTS (
      SELECT 1 FROM content_interactions ci
      WHERE ci.content_id = cc.id
        AND ci.user_id = p_user_id
        AND ci.interaction_type = 'dismiss'
    )
  ORDER BY match_score DESC, cc.priority DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. INCREMENT ENGAGEMENT FUNCTION
-- ============================================

-- Drop existing function first to allow changes
DROP FUNCTION IF EXISTS increment_content_engagement(UUID, TEXT);

CREATE OR REPLACE FUNCTION increment_content_engagement(
  p_content_id UUID,
  p_interaction_type TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_interaction_type = 'view' THEN
    UPDATE cultural_content SET view_count = view_count + 1 WHERE id = p_content_id;
  ELSIF p_interaction_type = 'click' THEN
    UPDATE cultural_content SET click_count = click_count + 1 WHERE id = p_content_id;
  ELSIF p_interaction_type = 'save' THEN
    UPDATE cultural_content SET save_count = save_count + 1 WHERE id = p_content_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. CONTENT ANALYTICS FUNCTION
-- ============================================

-- Drop existing function first to allow return type changes
DROP FUNCTION IF EXISTS get_content_analytics(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_content_analytics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_views', (
      SELECT COUNT(*) FROM content_interactions 
      WHERE interaction_type = 'view' 
        AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'total_clicks', (
      SELECT COUNT(*) FROM content_interactions 
      WHERE interaction_type = 'click' 
        AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'total_saves', (
      SELECT COUNT(*) FROM content_interactions 
      WHERE interaction_type = 'save' 
        AND created_at BETWEEN p_start_date AND p_end_date
    ),
    'top_content', (
      SELECT json_agg(top_content)
      FROM (
        SELECT 
          cc.id,
          cc.title,
          cc.content_type,
          COUNT(ci.id) as interactions
        FROM cultural_content cc
        LEFT JOIN content_interactions ci ON cc.id = ci.content_id
          AND ci.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY cc.id, cc.title, cc.content_type
        ORDER BY interactions DESC
        LIMIT 10
      ) top_content
    ),
    'by_content_type', (
      SELECT json_object_agg(content_type, count)
      FROM (
        SELECT cc.content_type, COUNT(ci.id) as count
        FROM cultural_content cc
        LEFT JOIN content_interactions ci ON cc.id = ci.content_id
          AND ci.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY cc.content_type
      ) type_counts
    ),
    'engagement_by_concern', (
      SELECT json_object_agg(concern, count)
      FROM (
        SELECT unnest(cc.target_concerns) as concern, COUNT(ci.id) as count
        FROM cultural_content cc
        JOIN content_interactions ci ON cc.id = ci.content_id
          AND ci.created_at BETWEEN p_start_date AND p_end_date
        GROUP BY concern
        ORDER BY count DESC
        LIMIT 10
      ) concern_counts
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. SEED CURATED CONTENT
-- ============================================

-- Insert curated content for different topics

-- Code-switching article
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns, 
  reading_time, priority, is_active
) VALUES (
  'resource',
  'The Exhaustion of Code-Switching: A Black Man''s Guide to Preserving Your Authentic Self',
  'Navigating between professional and personal identities takes a toll. Here''s how to stay true to yourself while succeeding in spaces that weren''t designed for you.',
  '["code-switching", "workplace", "identity", "authenticity"]'::jsonb,
  '["black_african_american", "african", "caribbean"]'::jsonb,
  '["work_career", "identity_questions", "stress"]'::jsonb,
  8,
  90,
  TRUE
) ON CONFLICT DO NOTHING;

-- Anxiety grounding exercise
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns,
  reading_time, priority, is_active
) VALUES (
  'tip',
  '5-4-3-2-1 Grounding Exercise',
  'A quick grounding technique for moments when anxiety feels overwhelming. Look around and name: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste. This brings you back to the present moment.',
  '["anxiety", "grounding", "exercise", "quick"]'::jsonb,
  '[]'::jsonb,
  '["anxiety", "stress", "trauma_ptsd"]'::jsonb,
  3,
  95,
  TRUE
) ON CONFLICT DO NOTHING;

-- Depression article
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns,
  reading_time, priority, is_active
) VALUES (
  'resource',
  'More Than Just "Being Down": Understanding Depression in Men of Color',
  'Depression looks different for many men. It might show up as irritability, anger, or physical symptoms rather than sadness. Learn to recognize the signs and find culturally affirming support that meets you where you are.',
  '["depression", "mental-health", "awareness"]'::jsonb,
  '["black_african_american", "latino_hispanic", "asian"]'::jsonb,
  '["depression", "mental_health_stigma"]'::jsonb,
  12,
  90,
  TRUE
) ON CONFLICT DO NOTHING;

-- Fatherhood article
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns, target_communities,
  reading_time, priority, is_active
) VALUES (
  'resource',
  'Being the Dad You Needed: Breaking Cycles of Absent Fatherhood',
  'For Black and Brown fathers working to be present in ways their own fathers couldn''t be. You''re not just raising children—you''re healing generational wounds.',
  '["fatherhood", "family", "healing", "cycles"]'::jsonb,
  '["black_african_american", "latino_hispanic"]'::jsonb,
  '["family_dynamics", "relationships"]'::jsonb,
  '["fathers"]'::jsonb,
  15,
  92,
  TRUE
) ON CONFLICT DO NOTHING;

-- Anger management exercise
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns,
  reading_time, priority, is_active
) VALUES (
  'tip',
  'The STOP Technique: Pause Before You React',
  'When anger rises: S-Stop what you''re doing. T-Take a deep breath. O-Observe your thoughts and feelings without judgment. P-Proceed with awareness. This creates space between stimulus and response.',
  '["anger", "exercise", "management"]'::jsonb,
  '[]'::jsonb,
  '["anger_management"]'::jsonb,
  4,
  90,
  TRUE
) ON CONFLICT DO NOTHING;

-- Veterans resource
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns, target_communities,
  url, priority, is_active
) VALUES (
  'resource',
  'Veterans Crisis Line Resources',
  'Immediate support for veterans in crisis. Available 24/7 with trained counselors who understand military experience.',
  '["veteran", "crisis", "support"]'::jsonb,
  '[]'::jsonb,
  '["trauma_ptsd"]'::jsonb,
  '["veteran"]'::jsonb,
  'https://veteranscrisisline.net',
  100,
  TRUE
) ON CONFLICT DO NOTHING;

-- Reentry resource
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns, target_communities,
  url, priority, is_active
) VALUES (
  'resource',
  'Clean Slate Toolkit: Expungement and Record Sealing',
  'State-by-state guide to clearing your record and opening doors that have been closed. Know your options.',
  '["reentry", "legal", "employment"]'::jsonb,
  '[]'::jsonb,
  '["work_career"]'::jsonb,
  '["formerly_incarcerated"]'::jsonb,
  'https://lac.org/toolkits/clean-slate',
  92,
  TRUE
) ON CONFLICT DO NOTHING;

-- Immigration resource
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns, target_communities,
  url, priority, is_active, language
) VALUES (
  'resource',
  'Know Your Rights: Immigration Edition / Conozca Sus Derechos',
  'Essential information about your rights during ICE encounters, at work, and at home. Available in English and Spanish.',
  '["immigration", "rights", "legal"]'::jsonb,
  '["latino_hispanic"]'::jsonb,
  '["anxiety", "stress"]'::jsonb,
  '["immigrant"]'::jsonb,
  'https://aclu.org/know-your-rights/immigrants-rights',
  95,
  TRUE,
  'english'
) ON CONFLICT DO NOTHING;

-- Daily affirmation
INSERT INTO cultural_content (
  content_type, title, content, tags, target_cultural_backgrounds, target_concerns,
  priority, is_active
) VALUES (
  'affirmation',
  'Daily Affirmation for Black Men',
  'I am worthy of peace, joy, and love. My existence is not a threat. My emotions are valid. I am more than what others expect me to be. My ancestors survived so I could thrive.',
  '["affirmation", "self-worth", "daily"]'::jsonb,
  '["black_african_american"]'::jsonb,
  '["depression", "identity_questions", "mental_health_stigma"]'::jsonb,
  75,
  TRUE
) ON CONFLICT DO NOTHING;

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_personalized_content TO authenticated;
GRANT EXECUTE ON FUNCTION increment_content_engagement TO authenticated;
GRANT EXECUTE ON FUNCTION get_content_analytics TO authenticated;

-- ============================================
-- 10. COMMENTS
-- ============================================

COMMENT ON FUNCTION get_personalized_content IS 'Returns content personalized for user based on cultural profile and concerns';
COMMENT ON FUNCTION increment_content_engagement IS 'Increments engagement counters for content analytics';
COMMENT ON TABLE content_interactions IS 'Tracks user interactions with content for personalization';
COMMENT ON TABLE saved_content IS 'User saved/bookmarked content';
