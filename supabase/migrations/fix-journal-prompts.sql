-- Fix journal_prompts table schema to match TypeScript interface

-- Drop existing table if it exists
DROP TABLE IF EXISTS journal_prompts;

-- Create table with correct schema
CREATE TABLE journal_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'beginner',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing prompts
CREATE POLICY "Anyone can view journal prompts" ON journal_prompts
  FOR SELECT USING (true);

-- Insert sample data
INSERT INTO journal_prompts (title, prompt, category, difficulty_level) VALUES
('Three Good Things', 'What are three things you''re grateful for today?', 'gratitude', 'beginner'),
('Proud Moment', 'Describe a moment today when you felt proud of yourself.', 'self_reflection', 'beginner'),
('Daily Challenge', 'What challenge did you face today, and how did you handle it?', 'challenges', 'intermediate'),
('Positive Impact', 'Write about a person who made a positive impact on your day.', 'relationships', 'beginner'),
('Strongest Emotion', 'What emotion did you feel most strongly today, and why?', 'emotions', 'intermediate'),
('Self Discovery', 'Describe something new you learned about yourself today.', 'self_discovery', 'intermediate'),
('Letter to Past Self', 'What would you tell your past self from one year ago?', 'reflection', 'advanced'),
('Goal Progress', 'Write about a goal you''re working toward and your progress.', 'goals', 'intermediate'),
('Smile or Laugh', 'What made you smile or laugh today?', 'positivity', 'beginner'),
('Peaceful Moment', 'Describe a moment when you felt completely at peace.', 'mindfulness', 'intermediate')
ON CONFLICT DO NOTHING;






