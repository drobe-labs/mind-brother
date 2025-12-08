import { supabase } from './supabase';
import { mentalHealthKnowledge, amaniWordsOfWisdom } from './knowledgeBase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface RAGResult {
  content: string;
  category: string;
  relevanceScore: number;
}

export class ChatbotService {
  private responseTemplates: { [key: string]: string[] };

  constructor() {
    // Pre-built response templates for common topics
    this.responseTemplates = {
      anxiety: [
        "I hear that you're feeling anxious. That's completely understandable - anxiety is your body's natural response to stress. Some techniques that can help include deep breathing exercises, grounding techniques (like naming 5 things you can see, 4 you can hear, etc.). What situations tend to trigger your anxiety most?",
        "Anxiety can feel overwhelming, and it's important to acknowledge that your feelings are valid. Building a good support network and practicing coping techniques can really help. What does anxiety feel like for you when it shows up?"
      ],
      depression: [
        "Thank you for sharing that with me. Depression can manifest differently in men, often showing up as anger, irritability, or physical symptoms rather than sadness. Recognizing what you're going through takes courage. What do you think might be contributing to these feelings?",
        "I hear you, and what you're experiencing is real and valid. Sometimes depression can feel confusing when we can't pinpoint exactly why we feel this way. What has your day-to-day experience been like lately?"
      ],
      stress: [
        "Stress can really build up and affect us in so many ways. Consider incorporating stress management techniques that work for you - whether that's through music, community connections, spiritual practices, or physical activity. What kinds of things usually help you feel more calm?",
        "Managing stress effectively is crucial for your mental health. Some practical techniques include progressive muscle relaxation, mindfulness meditation, regular exercise, and maintaining connections with your support system. What are the main sources of stress you're dealing with right now?"
      ],
      work: [
        "Workplace stress can really impact your overall well-being. Whether it's workload, relationships with colleagues, or feeling undervalued, these challenges are real. What specific aspects of your work situation are bothering you most?",
        "Work challenges can be exhausting, especially when they affect your sense of worth or security. Consider using any employee assistance programs if available, finding mentors or allies, and developing coping strategies that protect your mental health. What would make your work environment feel more supportive?"
      ],
      relationships: [
        "Healthy relationships require open communication, mutual respect, and understanding. Whether with family, friends, or partners, relationships can sometimes be challenging. What relationship situations are you finding most difficult right now?",
        "Building and maintaining strong relationships is important for mental health. This includes setting healthy boundaries, communicating your needs clearly, and finding people who support you. What kind of support do you feel like you need most in your relationships?"
      ],
      support: [
        "Building a strong support system is so important. This can include family, friends, community organizations, mentors, or support groups where you can connect with others who understand what you're going through. What kind of support feels most helpful to you?",
        "You don't have to go through this alone. Consider reaching out to community organizations, support groups, or even online communities where you can connect with others. Professional therapy can also be incredibly helpful. What would feel like the most comfortable first step for you?"
      ],
      lgbtq: [
        "Coming out is a deeply personal journey, and it's completely normal to feel scared. Your feelings are valid, and you deserve love and acceptance for who you are. Have you thought about starting with someone you trust most?",
        "I hear you, and what you're going through takes courage. Coming out can be especially complex as a man of color, with intersecting identities to navigate. You know your family best - what feels safest for you right now?",
        "That's a big step you're considering, and it's understandable to feel scared. Your identity is valid and deserves respect. Would it help to talk through your concerns or explore some support resources?",
        "Coming out is your choice and your timeline. It's okay to feel nervous - this shows how much your family means to you. What support do you have right now, and what would help you feel more confident?"
      ],
      greeting: [
        "Hello! I'm Amani, your AI mental health companion. I'm here to listen and support you. How are you feeling today?",
        "Hi there! It's good to connect with you. I'm here to provide support and guidance whenever you need it. What's on your mind?",
        "Hey! I'm glad you reached out. I'm here to help you navigate whatever you're going through. How can I support you today?"
      ],
      general: [
        "What are you worried about?",
        "I'm here to listen. What's on your mind?",
        "Tell me more about what's bothering you.",
        "What's been weighing on you lately?"
      ]
    };
  }

  // Simple text similarity function (can be enhanced with embeddings later)
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
  }

  // Retrieve relevant knowledge based on user message
  private retrieveRelevantKnowledge(userMessage: string): RAGResult[] {
    const results: RAGResult[] = [];
    
    for (const knowledge of mentalHealthKnowledge) {
      const contentSimilarity = this.calculateSimilarity(userMessage, knowledge.content);
      const tagSimilarity = knowledge.tags.some(tag => 
        userMessage.toLowerCase().includes(tag.toLowerCase())
      ) ? 0.3 : 0;
      
      const relevanceScore = contentSimilarity + tagSimilarity;
      
      if (relevanceScore > 0.1) { // Threshold for relevance
        results.push({
          content: knowledge.content,
          category: knowledge.category,
          relevanceScore
        });
      }
    }
    
    // Sort by relevance and return top 3
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  }

  // Classify user message and get topic
  private classifyMessage(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Check for greetings first
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)$/i) || 
        lowerMessage.match(/^(hi|hello|hey)\s*(there|amani)?[.!]?$/i)) {
      return 'greeting';
    }
    
    // Check for LGBTQ+ related content first (more specific)
    if (lowerMessage.includes('gay') || lowerMessage.includes('lesbian') || lowerMessage.includes('bisexual') || 
        lowerMessage.includes('transgender') || lowerMessage.includes('queer') || lowerMessage.includes('lgbtq') ||
        lowerMessage.includes('coming out') || lowerMessage.includes('sexuality') || lowerMessage.includes('sexual orientation') ||
        (lowerMessage.includes('family') && (lowerMessage.includes('gay') || lowerMessage.includes('coming out')))) {
      return 'lgbtq';
    }
    
    // Check for specific mental health keywords
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('nervous') || lowerMessage.includes('panic')) {
      return 'anxiety';
    }
    if (lowerMessage.includes('depress') || lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('hopeless')) {
      return 'depression';
    }
    if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm') || lowerMessage.includes('pressure')) {
      return 'stress';
    }
    if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('office') || lowerMessage.includes('boss') || lowerMessage.includes('colleague')) {
      return 'work';
    }
    if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('dating')) {
      return 'relationships';
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('alone') || lowerMessage.includes('lonely')) {
      return 'support';
    }
    
    // Handle "worried" more carefully - only classify as anxiety if it's clearly anxiety-related
    if (lowerMessage.includes('worried')) {
      if (lowerMessage.includes('panic') || lowerMessage.includes('anxious') || lowerMessage.includes('can\'t stop') || lowerMessage.includes('constantly')) {
        return 'anxiety';
      }
      // Otherwise treat as general concern
      return 'general';
    }
    
    return 'general';
  }

  // Get response from chatbot with RAG
  async getChatResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Retrieve relevant knowledge
      const relevantKnowledge = this.retrieveRelevantKnowledge(userMessage);
      
      // Classify the message to get appropriate response template
      const topic = this.classifyMessage(userMessage);
      const templates = this.responseTemplates[topic] || this.responseTemplates.general;
      
      // Get a random response template
      const baseResponse = templates[Math.floor(Math.random() * templates.length)];
      
      // Add relevant knowledge if found
      let enhancedResponse = baseResponse;
      if (relevantKnowledge.length > 0) {
        const knowledge = relevantKnowledge[0]; // Use the most relevant piece
        enhancedResponse += `\n\nHere's some additional information that might help: ${knowledge.content}`;
      }
      
      return enhancedResponse;

    } catch (error) {
      console.error('Chatbot error:', error);
      return "I apologize, but I'm having trouble connecting right now. Your mental health is important, and if you're in crisis, please reach out to the 988 Suicide & Crisis Lifeline or your local emergency services.";
    }
  }

  // Save conversation to database
  async saveConversation(userId: string, messages: ChatMessage[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .upsert({
          user_id: userId,
          messages,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  // Load conversation from database
  async loadConversation(userId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('messages')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No conversation found, return empty array
          return [];
        }
        throw error;
      }

      return data?.messages || [];
    } catch (error) {
      console.error('Error loading conversation:', error);
      return [];
    }
  }

  // Detect if user needs crisis support
  isCrisisMessage(message: string): boolean {
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'end my life', 'not worth living',
      'hurt myself', 'self harm', 'cutting', 'overdose',
      'want to die', 'better off dead', 'no point living', 'no reason to live',
      'can\'t go on'
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get crisis response
  getCrisisResponse(): string {
    return `I'm very concerned about you right now. Your life has value and you don't have to go through this alone.

Please reach out for immediate help:
• 988 Suicide & Crisis Lifeline: Call or text 988
• Crisis Text Line: Text HOME to 741741
• Emergency Services: Call 911

If you're not in immediate danger but need support:
• National Alliance on Mental Illness: 1-800-950-NAMI
• SAMHSA National Helpline: 1-800-662-4357

You matter, and there are people who want to help you through this difficult time.`;
  }
}

export const chatbotService = new ChatbotService();
