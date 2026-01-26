-- Moderation Appeals Tables
-- Created: 2026-01-13
-- Purpose: Allow users to appeal moderation decisions and track false positives

-- ============================================================================
-- MODERATION APPEALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_appeals (
    id TEXT PRIMARY KEY,
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('topic', 'reply')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    username TEXT,
    moderation_action TEXT NOT NULL CHECK (moderation_action IN ('blocked', 'flagged', 'removed')),
    original_content TEXT NOT NULL,
    original_reason TEXT NOT NULL,
    appeal_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'denied')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    auto_mod_decision JSONB DEFAULT '{}',
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for moderation_appeals
CREATE INDEX IF NOT EXISTS idx_appeals_user_id ON moderation_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_content_id ON moderation_appeals(content_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON moderation_appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_priority ON moderation_appeals(priority);
CREATE INDEX IF NOT EXISTS idx_appeals_pending ON moderation_appeals(status, priority) 
    WHERE status IN ('pending', 'under_review');
CREATE INDEX IF NOT EXISTS idx_appeals_created ON moderation_appeals(created_at DESC);

-- Enable RLS
ALTER TABLE moderation_appeals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for moderation_appeals
DROP POLICY IF EXISTS "Users can view own appeals" ON moderation_appeals;
DROP POLICY IF EXISTS "Users can create own appeals" ON moderation_appeals;
DROP POLICY IF EXISTS "Moderators can view all appeals" ON moderation_appeals;
DROP POLICY IF EXISTS "Moderators can update appeals" ON moderation_appeals;

-- Users can view their own appeals
CREATE POLICY "Users can view own appeals" ON moderation_appeals
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can create appeals
CREATE POLICY "Users can create own appeals" ON moderation_appeals
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Moderators can view all appeals
CREATE POLICY "Moderators can view all appeals" ON moderation_appeals
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'moderator'
        )
    );

-- Moderators can update appeals (review)
CREATE POLICY "Moderators can update appeals" ON moderation_appeals
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'moderator'
        )
    );

-- ============================================================================
-- MODERATION LEARNING TABLE (for AI improvement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_learning (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern TEXT NOT NULL,
    pattern_type TEXT DEFAULT 'word' CHECK (pattern_type IN ('word', 'phrase', 'regex')),
    original_decision TEXT NOT NULL,
    correct_decision TEXT NOT NULL CHECK (correct_decision IN ('true_positive', 'false_positive')),
    frequency INTEGER DEFAULT 1,
    examples JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pattern)
);

-- Indexes for moderation_learning
CREATE INDEX IF NOT EXISTS idx_learning_pattern ON moderation_learning(pattern);
CREATE INDEX IF NOT EXISTS idx_learning_decision ON moderation_learning(correct_decision);
CREATE INDEX IF NOT EXISTS idx_learning_frequency ON moderation_learning(frequency DESC);

-- Enable RLS
ALTER TABLE moderation_learning ENABLE ROW LEVEL SECURITY;

-- Only moderators can access learning data
DROP POLICY IF EXISTS "Moderators can view learning data" ON moderation_learning;
DROP POLICY IF EXISTS "System can insert learning data" ON moderation_learning;
DROP POLICY IF EXISTS "System can update learning data" ON moderation_learning;

CREATE POLICY "Moderators can view learning data" ON moderation_learning
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.user_type = 'moderator'
        )
    );

CREATE POLICY "System can insert learning data" ON moderation_learning
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "System can update learning data" ON moderation_learning
    FOR UPDATE TO authenticated
    USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_appeal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appeals
DROP TRIGGER IF EXISTS trigger_appeal_updated ON moderation_appeals;
CREATE TRIGGER trigger_appeal_updated
    BEFORE UPDATE ON moderation_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_appeal_timestamp();

-- Trigger for learning
DROP TRIGGER IF EXISTS trigger_learning_updated ON moderation_learning;
CREATE TRIGGER trigger_learning_updated
    BEFORE UPDATE ON moderation_learning
    FOR EACH ROW
    EXECUTE FUNCTION update_appeal_timestamp();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Appeal queue summary
CREATE OR REPLACE VIEW appeal_queue_summary AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'under_review') as under_review_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'denied') as denied_count,
    COUNT(*) FILTER (WHERE priority = 'high' AND status IN ('pending', 'under_review')) as high_priority_pending,
    COUNT(*) FILTER (WHERE priority = 'medium' AND status IN ('pending', 'under_review')) as medium_priority_pending,
    COUNT(*) FILTER (WHERE priority = 'low' AND status IN ('pending', 'under_review')) as low_priority_pending,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / 
         NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'denied')), 0)) * 100,
        2
    ) as false_positive_rate,
    AVG(
        EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 60
    ) FILTER (WHERE reviewed_at IS NOT NULL) as avg_review_time_minutes
FROM moderation_appeals
WHERE created_at > NOW() - INTERVAL '30 days';

-- View: False positive patterns
CREATE OR REPLACE VIEW false_positive_patterns AS
SELECT 
    pattern,
    frequency,
    correct_decision,
    examples,
    updated_at
FROM moderation_learning
WHERE correct_decision = 'false_positive'
AND frequency >= 2
ORDER BY frequency DESC
LIMIT 100;

-- View: Appeals by day (for analytics)
CREATE OR REPLACE VIEW appeals_by_day AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_appeals,
    COUNT(*) FILTER (WHERE status = 'approved') as approved,
    COUNT(*) FILTER (WHERE status = 'denied') as denied,
    COUNT(*) FILTER (WHERE status = 'pending') as still_pending
FROM moderation_appeals
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON appeal_queue_summary TO authenticated;
GRANT SELECT ON false_positive_patterns TO authenticated;
GRANT SELECT ON appeals_by_day TO authenticated;


