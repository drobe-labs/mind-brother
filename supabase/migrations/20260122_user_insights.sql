-- User Insights Migration for Mind Brother
-- Creates tables for storing mood check-ins and caching user insights

-- ============================================================================
-- MOOD CHECK-INS TABLE
-- Stores user's daily/periodic mood check-ins
-- ============================================================================

CREATE TABLE IF NOT EXISTS mood_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Mood data
    mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
    mood_label TEXT, -- e.g., 'great', 'good', 'okay', 'not_great', 'struggling'
    
    -- Optional context
    notes TEXT,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    anxiety_level INTEGER CHECK (anxiety_level >= 1 AND anxiety_level <= 5),
    
    -- Tags/factors
    factors JSONB DEFAULT '[]'::jsonb, -- e.g., ["work", "family", "sleep", "exercise"]
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    check_in_date DATE DEFAULT CURRENT_DATE,
    
    -- Ensure one check-in per day per user (optional - comment out if multiple allowed)
    -- CONSTRAINT unique_daily_checkin UNIQUE (user_id, check_in_date)
    
    CONSTRAINT mood_score_range CHECK (mood_score BETWEEN 1 AND 10)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_date ON mood_checkins(user_id, check_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_checkins_user_created ON mood_checkins(user_id, created_at DESC);

-- ============================================================================
-- USER INSIGHTS CACHE TABLE
-- Caches generated insights to avoid recalculation
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_insights_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_days INTEGER NOT NULL,
    
    -- Cached insights data
    insights_data JSONB NOT NULL,
    
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    
    -- Stats
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    average_mood DECIMAL(3,1),
    engagement_score INTEGER,
    
    -- Unique constraint per user/period
    CONSTRAINT unique_user_period UNIQUE (user_id, period_days)
);

-- Create index for cache lookups
CREATE INDEX IF NOT EXISTS idx_insights_cache_user ON user_insights_cache(user_id, period_days);
CREATE INDEX IF NOT EXISTS idx_insights_cache_expires ON user_insights_cache(expires_at);

-- ============================================================================
-- INSIGHT VIEWS TABLE
-- Tracks when users view their insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS insight_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- View details
    tab_viewed TEXT, -- 'overview', 'topics', 'emotions', 'growth', 'recommendations'
    period_days INTEGER,
    time_spent_seconds INTEGER,
    
    -- Metadata
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insight_views_user ON insight_views(user_id, viewed_at DESC);

-- ============================================================================
-- GROWTH MILESTONES TABLE
-- Tracks user growth achievements
-- ============================================================================

CREATE TABLE IF NOT EXISTS growth_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Milestone details
    milestone_type TEXT NOT NULL, -- 'streak', 'growth_area', 'mood_improvement', 'engagement', 'topic_resolved'
    milestone_name TEXT NOT NULL,
    description TEXT,
    
    -- Value tracking
    value_achieved INTEGER,
    threshold_value INTEGER,
    
    -- Status
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    celebrated BOOLEAN DEFAULT FALSE, -- Has user seen/celebrated this?
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_user ON growth_milestones(user_id, achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_uncelebrated ON growth_milestones(user_id, celebrated) WHERE NOT celebrated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_milestones ENABLE ROW LEVEL SECURITY;

-- Mood check-ins policies
CREATE POLICY "Users can view their own mood check-ins"
ON mood_checkins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mood check-ins"
ON mood_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood check-ins"
ON mood_checkins FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood check-ins"
ON mood_checkins FOR DELETE
USING (auth.uid() = user_id);

-- Insights cache policies
CREATE POLICY "Users can view their own insights cache"
ON user_insights_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights cache"
ON user_insights_cache FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights cache"
ON user_insights_cache FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights cache"
ON user_insights_cache FOR DELETE
USING (auth.uid() = user_id);

-- Insight views policies
CREATE POLICY "Users can view their own insight views"
ON insight_views FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insight views"
ON insight_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Growth milestones policies
CREATE POLICY "Users can view their own milestones"
ON growth_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
ON growth_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones"
ON growth_milestones FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get cached insights or return null if expired/missing
CREATE OR REPLACE FUNCTION get_cached_insights(
    p_user_id UUID,
    p_period_days INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT insights_data INTO v_result
    FROM user_insights_cache
    WHERE user_id = p_user_id
      AND period_days = p_period_days
      AND expires_at > NOW();
    
    RETURN v_result;
END;
$$;

-- Function to cache insights
CREATE OR REPLACE FUNCTION cache_user_insights(
    p_user_id UUID,
    p_period_days INTEGER,
    p_insights JSONB,
    p_total_conversations INTEGER DEFAULT 0,
    p_total_messages INTEGER DEFAULT 0,
    p_average_mood DECIMAL DEFAULT NULL,
    p_engagement_score INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_insights_cache (
        user_id,
        period_days,
        period_start,
        period_end,
        insights_data,
        total_conversations,
        total_messages,
        average_mood,
        engagement_score,
        generated_at,
        expires_at
    )
    VALUES (
        p_user_id,
        p_period_days,
        CURRENT_DATE - p_period_days,
        CURRENT_DATE,
        p_insights,
        p_total_conversations,
        p_total_messages,
        p_average_mood,
        p_engagement_score,
        NOW(),
        NOW() + INTERVAL '24 hours'
    )
    ON CONFLICT (user_id, period_days)
    DO UPDATE SET
        insights_data = EXCLUDED.insights_data,
        total_conversations = EXCLUDED.total_conversations,
        total_messages = EXCLUDED.total_messages,
        average_mood = EXCLUDED.average_mood,
        engagement_score = EXCLUDED.engagement_score,
        period_start = EXCLUDED.period_start,
        period_end = EXCLUDED.period_end,
        generated_at = NOW(),
        expires_at = NOW() + INTERVAL '24 hours';
END;
$$;

-- Function to record a mood check-in
CREATE OR REPLACE FUNCTION record_mood_checkin(
    p_user_id UUID,
    p_mood_score INTEGER,
    p_mood_label TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_energy_level INTEGER DEFAULT NULL,
    p_sleep_quality INTEGER DEFAULT NULL,
    p_anxiety_level INTEGER DEFAULT NULL,
    p_factors JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_checkin_id UUID;
BEGIN
    INSERT INTO mood_checkins (
        user_id,
        mood_score,
        mood_label,
        notes,
        energy_level,
        sleep_quality,
        anxiety_level,
        factors
    )
    VALUES (
        p_user_id,
        p_mood_score,
        p_mood_label,
        p_notes,
        p_energy_level,
        p_sleep_quality,
        p_anxiety_level,
        p_factors
    )
    RETURNING id INTO v_checkin_id;
    
    -- Check for mood improvement milestone
    PERFORM check_mood_milestones(p_user_id);
    
    RETURN v_checkin_id;
END;
$$;

-- Function to check and award milestones
CREATE OR REPLACE FUNCTION check_mood_milestones(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak INTEGER;
    v_avg_mood DECIMAL;
    v_prev_avg_mood DECIMAL;
BEGIN
    -- Calculate current streak
    WITH daily_checkins AS (
        SELECT DISTINCT check_in_date
        FROM mood_checkins
        WHERE user_id = p_user_id
        ORDER BY check_in_date DESC
    ),
    streak_calc AS (
        SELECT check_in_date,
               check_in_date - (ROW_NUMBER() OVER (ORDER BY check_in_date DESC))::integer AS streak_group
        FROM daily_checkins
    )
    SELECT COUNT(*) INTO v_streak
    FROM streak_calc
    WHERE streak_group = (SELECT streak_group FROM streak_calc WHERE check_in_date = CURRENT_DATE);
    
    -- Award streak milestones
    IF v_streak >= 7 THEN
        INSERT INTO growth_milestones (user_id, milestone_type, milestone_name, description, value_achieved, threshold_value)
        VALUES (p_user_id, 'streak', '7-Day Streak', 'Checked in for 7 consecutive days', v_streak, 7)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF v_streak >= 30 THEN
        INSERT INTO growth_milestones (user_id, milestone_type, milestone_name, description, value_achieved, threshold_value)
        VALUES (p_user_id, 'streak', '30-Day Streak', 'Checked in for 30 consecutive days', v_streak, 30)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Calculate mood improvement
    SELECT AVG(mood_score) INTO v_avg_mood
    FROM mood_checkins
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL '7 days';
    
    SELECT AVG(mood_score) INTO v_prev_avg_mood
    FROM mood_checkins
    WHERE user_id = p_user_id
      AND created_at BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days';
    
    IF v_avg_mood IS NOT NULL AND v_prev_avg_mood IS NOT NULL AND v_avg_mood > v_prev_avg_mood + 1 THEN
        INSERT INTO growth_milestones (user_id, milestone_type, milestone_name, description, value_achieved)
        VALUES (p_user_id, 'mood_improvement', 'Mood Boost', 'Your average mood improved this week', ROUND(v_avg_mood)::INTEGER)
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$;

-- Function to get recent milestones for celebration
CREATE OR REPLACE FUNCTION get_uncelebrated_milestones(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    milestone_type TEXT,
    milestone_name TEXT,
    description TEXT,
    value_achieved INTEGER,
    achieved_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gm.id,
        gm.milestone_type,
        gm.milestone_name,
        gm.description,
        gm.value_achieved,
        gm.achieved_at
    FROM growth_milestones gm
    WHERE gm.user_id = p_user_id
      AND gm.celebrated = FALSE
    ORDER BY gm.achieved_at DESC;
END;
$$;

-- Function to mark milestone as celebrated
CREATE OR REPLACE FUNCTION celebrate_milestone(p_milestone_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE growth_milestones
    SET celebrated = TRUE
    WHERE id = p_milestone_id;
END;
$$;

-- Function to get mood trend summary
CREATE OR REPLACE FUNCTION get_mood_trend(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    check_date DATE,
    avg_mood DECIMAL,
    check_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        check_in_date AS check_date,
        ROUND(AVG(mood_score), 1) AS avg_mood,
        COUNT(*)::INTEGER AS check_count
    FROM mood_checkins
    WHERE user_id = p_user_id
      AND created_at > NOW() - (p_days || ' days')::INTERVAL
    GROUP BY check_in_date
    ORDER BY check_in_date;
END;
$$;

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_insights_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM user_insights_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

-- ============================================================================
-- SEED DATA: Sample milestones for reference
-- ============================================================================

-- Note: This is just for documentation/reference, actual milestones are created dynamically
COMMENT ON TABLE growth_milestones IS 'Milestone types:
- streak: Consecutive check-in days (7, 14, 30, 60, 90)
- growth_area: Progress in a growth area (self_awareness, boundary_setting, etc.)
- mood_improvement: Average mood improved week-over-week
- engagement: High engagement score maintained
- topic_resolved: A topic that was discussed less over time';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_cached_insights(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cache_user_insights(UUID, INTEGER, JSONB, INTEGER, INTEGER, DECIMAL, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_mood_checkin(UUID, INTEGER, TEXT, TEXT, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_mood_milestones(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_uncelebrated_milestones(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION celebrate_milestone(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_mood_trend(UUID, INTEGER) TO authenticated;
