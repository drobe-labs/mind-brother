-- Mental Health App Database Migrations
-- Run these commands in your Supabase SQL Editor

-- 1. Create knowledge_base table for RAG system
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  embedding VECTOR(1536), -- For OpenAI embeddings (when we add vector search later)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create chatbot_conversations table to store user conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies

-- Knowledge base can be read by authenticated users
CREATE POLICY "Knowledge base is readable by authenticated users" ON knowledge_base
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can read their own conversations
CREATE POLICY "Users can view their own conversations" ON chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert their own conversations" ON chatbot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations" ON chatbot_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_chatbot_conversations_updated_at BEFORE UPDATE ON chatbot_conversations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. Insert initial mental health knowledge base (sample data)
INSERT INTO knowledge_base (content, category, tags) VALUES
(
  'Anxiety is a natural response to stress, but persistent anxiety can impact daily life. For men of color, anxiety may be compounded by experiences of discrimination, economic stress, and cultural expectations of strength. Recognizing symptoms like racing thoughts, muscle tension, and restlessness is the first step toward managing anxiety effectively.',
  'anxiety',
  ARRAY['anxiety', 'stress', 'discrimination', 'symptoms']
),
(
  'Depression in men of color is often underdiagnosed due to stigma and different symptom presentations. Men may experience depression as anger, irritability, or physical symptoms rather than sadness. Cultural barriers and historical mistrust of healthcare systems can prevent seeking help, making community support and culturally competent care crucial.',
  'depression',
  ARRAY['depression', 'anger', 'stigma', 'cultural barriers', 'symptoms']
),
(
  'Effective stress management techniques include deep breathing exercises, progressive muscle relaxation, mindfulness meditation, and regular physical activity. For men of color, incorporating cultural practices like music, community gathering, or spiritual practices can enhance stress relief while honoring cultural identity.',
  'stress_management',
  ARRAY['stress', 'breathing', 'meditation', 'exercise', 'cultural practices']
),
(
  'If you''re experiencing thoughts of self-harm or suicide, please reach out immediately. Crisis resources include the 988 Suicide & Crisis Lifeline (call or text 988), Crisis Text Line (text HOME to 741741), or go to your nearest emergency room. The National Suicide Prevention Lifeline has Spanish-speaking counselors and resources for diverse communities.',
  'crisis_resources',
  ARRAY['crisis', 'suicide', 'emergency', 'hotline', 'immediate help']
),
(
  'Building strong support systems is crucial for mental health. This includes family, friends, community organizations, and peer support groups. For men of color, connecting with others who share similar experiences can provide validation and understanding. Consider joining support groups specifically for men of color or community organizations that focus on mental health.',
  'support_systems',
  ARRAY['support', 'community', 'peer groups', 'family', 'connections']
)
ON CONFLICT DO NOTHING;

-- 9. Grant necessary permissions (if needed)
-- These may already be handled by Supabase's default settings
-- GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- GRANT SELECT ON knowledge_base TO authenticated;
-- GRANT ALL ON chatbot_conversations TO authenticated;

