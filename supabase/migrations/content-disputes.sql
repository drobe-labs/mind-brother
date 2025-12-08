-- ============================================
-- CONTENT DISPUTES
-- Users can dispute moderation flags/removals
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS content_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('topic','reply')),
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','rejected','withdrawn')),
  reason_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_disputes_content ON content_disputes(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_disputes_user ON content_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_disputes_status ON content_disputes(status);

-- Enable RLS
ALTER TABLE content_disputes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can create their own disputes" ON content_disputes;
CREATE POLICY "Users can create their own disputes" ON content_disputes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own disputes" ON content_disputes;
CREATE POLICY "Users can view their own disputes" ON content_disputes
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Moderators can view all disputes" ON content_disputes;
CREATE POLICY "Moderators can view all disputes" ON content_disputes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin','moderator')
  )
);

DROP POLICY IF EXISTS "Moderators can resolve disputes" ON content_disputes;
CREATE POLICY "Moderators can resolve disputes" ON content_disputes
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin','moderator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND user_type IN ('admin','moderator')
  )
);







