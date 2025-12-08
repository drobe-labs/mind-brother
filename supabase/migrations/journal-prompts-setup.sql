-- Journal Prompts Setup
-- This file contains comprehensive journal prompts for mental health journaling

-- First, let's ensure the journal_prompts table has the correct structure
CREATE TABLE IF NOT EXISTS journal_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  prompt TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(20) DEFAULT 'beginner',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE journal_prompts ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DROP POLICY IF EXISTS "Anyone can view journal prompts" ON journal_prompts;
CREATE POLICY "Anyone can view journal prompts" ON journal_prompts
  FOR SELECT USING (true);

-- Clear existing prompts and insert comprehensive new ones
DELETE FROM journal_prompts;

-- Insert comprehensive journal prompts
INSERT INTO journal_prompts (title, prompt, category, difficulty_level) VALUES

-- GRATITUDE & POSITIVITY
('Three Good Things', 'What are three things you''re grateful for today? No matter how small, write them down and reflect on why they matter to you.', 'gratitude', 'beginner'),
('Gratitude Letter', 'Write a letter of gratitude to someone who has made a positive impact on your life. You don''t have to send it, but express your appreciation fully.', 'gratitude', 'intermediate'),
('Daily Wins', 'What are three small wins or accomplishments you had today? Celebrate these moments, no matter how minor they seem.', 'gratitude', 'beginner'),
('Appreciation Practice', 'Think of someone in your life right now. What specific qualities do you appreciate about them? Write about how they''ve enriched your life.', 'gratitude', 'beginner'),
('Silver Linings', 'Even on difficult days, there are often silver linings. What positive aspects can you find in today''s challenges?', 'gratitude', 'intermediate'),

-- SELF-REFLECTION & GROWTH
('Daily Reflection', 'How did you show up for yourself today? What choices did you make that aligned with your values?', 'self_reflection', 'beginner'),
('Growth Moment', 'Describe a moment today when you felt proud of yourself. What did you do that made you feel this way?', 'self_reflection', 'beginner'),
('Self-Discovery', 'What did you learn about yourself today? This could be about your reactions, preferences, strengths, or areas for growth.', 'self_reflection', 'intermediate'),
('Values Check', 'What values are most important to you right now? How did you honor these values today?', 'self_reflection', 'intermediate'),
('Personal Growth', 'What is one area where you''d like to grow? What small step could you take tomorrow toward this growth?', 'self_reflection', 'intermediate'),
('Identity Exploration', 'How do you see yourself today? How has your self-perception changed over the past year?', 'self_reflection', 'advanced'),

-- EMOTIONS & FEELINGS
('Emotional Weather', 'If your emotions today were weather, what would it be like? Sunny, stormy, cloudy, or mixed? Describe the emotional climate of your day.', 'emotions', 'beginner'),
('Feeling Inventory', 'What emotion did you feel most strongly today? Where did you feel it in your body? What triggered it?', 'emotions', 'beginner'),
('Emotional Processing', 'Is there an emotion you''ve been avoiding or pushing away? What would happen if you allowed yourself to fully feel it?', 'emotions', 'intermediate'),
('Mood Patterns', 'What patterns do you notice in your moods lately? Are there certain times of day, situations, or thoughts that affect how you feel?', 'emotions', 'intermediate'),
('Emotional Needs', 'What emotional needs do you have right now that aren''t being met? How could you better care for yourself emotionally?', 'emotions', 'advanced'),

-- CHALLENGES & RESILIENCE
('Challenge Response', 'What challenge did you face today, and how did you handle it? What would you do differently next time?', 'challenges', 'beginner'),
('Resilience Building', 'Think of a difficult time you''ve overcome. What strengths did you discover in yourself during that period?', 'challenges', 'intermediate'),
('Problem-Solving', 'What''s one problem you''re currently facing? Brainstorm three different approaches you could take to address it.', 'challenges', 'intermediate'),
('Stress Management', 'What are your current stress triggers? What healthy coping strategies work best for you?', 'challenges', 'intermediate'),
('Overcoming Obstacles', 'Write about a time when you thought you couldn''t handle something, but you did. What got you through it?', 'challenges', 'advanced'),

-- RELATIONSHIPS & CONNECTIONS
('Relationship Appreciation', 'Write about a person who made a positive impact on your day. What did they do, and how did it make you feel?', 'relationships', 'beginner'),
('Communication Reflection', 'How did you communicate with others today? Were there any conversations that went particularly well or poorly?', 'relationships', 'intermediate'),
('Boundary Setting', 'Are there any relationships in your life where you need to set better boundaries? What would healthy boundaries look like?', 'relationships', 'intermediate'),
('Support System', 'Who are the people in your life you can count on? How do they support you, and how do you support them?', 'relationships', 'beginner'),
('Conflict Resolution', 'Is there any tension or conflict in your relationships right now? How might you approach resolving it?', 'relationships', 'advanced'),

-- GOALS & ASPIRATIONS
('Goal Progress', 'What goal are you working toward right now? What progress have you made, and what''s your next step?', 'goals', 'beginner'),
('Dream Exploration', 'If you could do anything without fear of failure, what would you do? What''s stopping you from pursuing it?', 'goals', 'intermediate'),
('Future Self', 'Write a letter to your future self one year from now. What do you hope to have accomplished? What advice would you give yourself?', 'goals', 'intermediate'),
('Life Vision', 'What does your ideal life look like in five years? What steps can you take now to move toward that vision?', 'goals', 'advanced'),
('Small Steps', 'What''s one small action you can take tomorrow that would move you closer to a goal or dream?', 'goals', 'beginner'),

-- MINDFULNESS & PRESENCE
('Present Moment', 'Describe a moment today when you felt completely present and engaged. What were you doing? How did it feel?', 'mindfulness', 'beginner'),
('Mindful Observation', 'Look around your current environment. What do you see, hear, smell, or feel right now? Write about your sensory experience.', 'mindfulness', 'beginner'),
('Breath Awareness', 'Take three deep breaths and notice how your body feels. Write about any tension, relaxation, or sensations you notice.', 'mindfulness', 'beginner'),
('Digital Detox', 'How did you use technology today? Did it enhance or detract from your well-being? What would a healthier relationship with technology look like?', 'mindfulness', 'intermediate'),
('Nature Connection', 'When did you last spend time in nature? How does being in natural settings affect your mood and well-being?', 'mindfulness', 'beginner'),

-- SELF-CARE & WELLNESS
('Self-Care Check', 'How did you care for yourself today? What self-care practices make you feel most refreshed and recharged?', 'self_care', 'beginner'),
('Energy Management', 'What activities give you energy, and what drains you? How can you better balance these in your daily life?', 'self_care', 'intermediate'),
('Body Awareness', 'How is your body feeling today? What does it need from you right now - rest, movement, nourishment, or something else?', 'self_care', 'beginner'),
('Sleep Reflection', 'How has your sleep been lately? What factors affect your sleep quality, and what could you do to improve it?', 'self_care', 'intermediate'),
('Stress Relief', 'What activities help you feel calm and centered? How can you incorporate more of these into your routine?', 'self_care', 'beginner'),

-- CREATIVITY & EXPRESSION
('Creative Expression', 'How did you express your creativity today? If not, what creative activity would you like to try?', 'creativity', 'beginner'),
('Artistic Inspiration', 'What inspires you creatively? Write about a piece of art, music, writing, or other creative work that moved you recently.', 'creativity', 'intermediate'),
('Imagination Play', 'If you could create anything without limitations, what would you make? Describe it in detail.', 'creativity', 'beginner'),
('Creative Blocks', 'Are you experiencing any creative blocks right now? What might be causing them, and how could you work through them?', 'creativity', 'intermediate'),

-- FORGIVENESS & HEALING
('Self-Forgiveness', 'Is there something you''re holding against yourself? What would it feel like to offer yourself forgiveness?', 'healing', 'advanced'),
('Letting Go', 'What are you holding onto that no longer serves you? What would it feel like to release it?', 'healing', 'intermediate'),
('Healing Journey', 'What does healing mean to you? What steps are you taking on your healing journey?', 'healing', 'intermediate'),
('Inner Child', 'What would you tell your younger self if you could? What does your inner child need to hear right now?', 'healing', 'advanced'),

-- IDENTITY & PURPOSE
('Identity Exploration', 'How do you define yourself? What roles, values, and characteristics make up your identity?', 'identity', 'intermediate'),
('Purpose Reflection', 'What gives your life meaning and purpose? How are you living in alignment with your purpose?', 'identity', 'advanced'),
('Cultural Identity', 'How does your cultural background influence who you are? What aspects of your culture are most important to you?', 'identity', 'intermediate'),
('Values Alignment', 'What are your core values? How are you living in alignment with these values, and where might you need to make adjustments?', 'identity', 'intermediate'),

-- FEAR & ANXIETY
('Fear Exploration', 'What are you most afraid of right now? What would you do if you weren''t afraid?', 'anxiety', 'intermediate'),
('Anxiety Patterns', 'When do you feel most anxious? What thoughts, situations, or triggers contribute to your anxiety?', 'anxiety', 'intermediate'),
('Courage Practice', 'What''s one small thing you could do that scares you but would be good for you? How might you work up to it?', 'anxiety', 'intermediate'),
('Worry Management', 'What are you worrying about most right now? What''s within your control, and what isn''t?', 'anxiety', 'beginner'),

-- JOY & PLEASURE
('Joy Moments', 'What brought you joy today? How can you create more moments like this in your life?', 'joy', 'beginner'),
('Simple Pleasures', 'What are the simple things in life that bring you happiness? How can you appreciate them more?', 'joy', 'beginner'),
('Laughter Medicine', 'What made you smile or laugh today? How does humor help you cope with life''s challenges?', 'joy', 'beginner'),
('Happiness Habits', 'What daily habits contribute to your happiness? What new habits could you try?', 'joy', 'intermediate');

-- Success message
SELECT 'Journal prompts setup completed successfully!' as message;






