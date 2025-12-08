import { mentalHealthKnowledge } from './knowledgeBase';

interface EmotionalContext {
  emotions: string[];
  intensity: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'recent' | 'ongoing' | 'past';
  sentiment: 'negative' | 'neutral' | 'positive' | 'mixed';
}

interface UserIntent {
  type: 'seeking_advice' | 'venting' | 'crisis' | 'validation' | 'information' | 'check_in';
  confidence: number;
  entities: string[];
}

interface ConversationContext {
  previousTopics: string[];
  emotionalHistory: EmotionalContext[];
  userPatterns: {
    commonStressors: string[];
    copingMentions: string[];
    supportSystemMentions: string[];
  };
}

interface RAGResult {
  content: string;
  category: string;
  relevanceScore: number;
}

export class AdvancedChatbotService {
  private conversationContext: Map<string, ConversationContext> = new Map();

  // Advanced sentiment analysis
  private analyzeSentiment(text: string): EmotionalContext {
    const lowerText = text.toLowerCase();
    
    // Emotion detection with intensity
    const emotions: string[] = [];
    let intensity: 'low' | 'medium' | 'high' = 'low';
    
    // Anxiety indicators
    if (lowerText.match(/\b(terrified|panicking|panic attack|can't breathe)\b/)) {
      emotions.push('severe_anxiety');
      intensity = 'high';
    } else if (lowerText.match(/\b(anxious|worried|nervous|stressed)\b/)) {
      emotions.push('anxiety');
      intensity = lowerText.match(/\b(very|really|extremely|so)\b/) ? 'high' : 'medium';
    }
    
    // Depression indicators
    if (lowerText.match(/\b(hopeless|worthless|empty|numb|can't feel)\b/)) {
      emotions.push('severe_depression');
      intensity = 'high';
    } else if (lowerText.match(/\b(sad|depressed|down|low|tired|exhausted)\b/)) {
      emotions.push('depression');
      intensity = lowerText.match(/\b(very|really|extremely|so)\b/) ? 'high' : 'medium';
    }
    
    // Anger indicators
    if (lowerText.match(/\b(furious|rage|hate|can't stand|fed up)\b/)) {
      emotions.push('anger');
      intensity = 'high';
    } else if (lowerText.match(/\b(angry|mad|frustrated|annoyed|irritated)\b/)) {
      emotions.push('frustration');
      intensity = 'medium';
    }
    
    // Loneliness indicators
    if (lowerText.match(/\b(alone|lonely|isolated|no one understands|no friends)\b/)) {
      emotions.push('loneliness');
      intensity = 'medium';
    }
    
    // Timeframe detection
    let timeframe: 'immediate' | 'recent' | 'ongoing' | 'past' = 'immediate';
    if (lowerText.match(/\b(lately|recently|past few|last week|these days)\b/)) {
      timeframe = 'recent';
    } else if (lowerText.match(/\b(always|constantly|for months|for years|since)\b/)) {
      timeframe = 'ongoing';
    } else if (lowerText.match(/\b(used to|before|back then|when I was)\b/)) {
      timeframe = 'past';
    }
    
    // Overall sentiment
    const positiveWords = lowerText.match(/\b(good|better|happy|hopeful|improving|grateful)\b/g)?.length || 0;
    const negativeWords = lowerText.match(/\b(bad|worse|awful|terrible|horrible|sad|angry|hopeless)\b/g)?.length || 0;
    
    let sentiment: 'negative' | 'neutral' | 'positive' | 'mixed' = 'neutral';
    if (negativeWords > positiveWords + 1) sentiment = 'negative';
    else if (positiveWords > negativeWords + 1) sentiment = 'positive';
    else if (positiveWords > 0 && negativeWords > 0) sentiment = 'mixed';
    
    return { emotions, intensity, timeframe, sentiment };
  }

  // Intent classification
  private classifyIntent(text: string, emotionalContext: EmotionalContext): UserIntent {
    const lowerText = text.toLowerCase();
    let type: UserIntent['type'] = 'check_in';
    let confidence = 0.5;
    const entities: string[] = [];
    
    // Crisis detection
    if (lowerText.match(/\b(suicide|kill myself|end it all|don't want to be here|hurt myself)\b/)) {
      type = 'crisis';
      confidence = 0.95;
      entities.push('self_harm');
    }
    
    // Job loss detection
    else if (lowerText.match(/\b(laid off|fired|terminated|lost my job|job loss|unemployed|let go|downsized)\b/)) {
      type = 'seeking_advice';
      confidence = 0.9;
      entities.push('job_loss');
    }
    
    // Seeking advice
    else if (lowerText.match(/\b(what should I|how do I|need advice|what would you|help me)\b/)) {
      type = 'seeking_advice';
      confidence = 0.8;
    }
    
    // Venting
    else if (lowerText.match(/\b(I just|need to tell|had to share|so frustrated|can't believe)\b/) || 
             emotionalContext.intensity === 'high') {
      type = 'venting';
      confidence = 0.7;
    }
    
    // Seeking validation
    else if (lowerText.match(/\b(am I wrong|is it normal|does this make sense|am I overreacting)\b/)) {
      type = 'validation';
      confidence = 0.8;
    }
    
    // Information seeking
    else if (lowerText.match(/\b(what is|tell me about|how does|why do)\b/)) {
      type = 'information';
      confidence = 0.7;
    }
    
    // Entity extraction
    if (lowerText.match(/\b(work|job|boss|colleague|office)\b/)) entities.push('workplace');
    if (lowerText.match(/\b(family|mom|dad|parent|sibling)\b/)) entities.push('family');
    if (lowerText.match(/\b(friend|relationship|partner|girlfriend|boyfriend)\b/)) entities.push('relationships');
    if (lowerText.match(/\b(school|college|university|teacher|student)\b/)) entities.push('education');
    if (lowerText.match(/\b(money|financial|bills|debt|budget)\b/)) entities.push('financial');
    
    return { type, confidence, entities };
  }

  // RAG functionality
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return commonWords.length / totalWords;
  }

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

  // Generate contextual response
  public generateResponse(
    userMessage: string, 
    userId: string, 
    conversationHistory: any[] = []
  ): string {
    const emotionalContext = this.analyzeSentiment(userMessage);
    const intent = this.classifyIntent(userMessage, emotionalContext);
    
    // Get or create user context
    let userContext = this.conversationContext.get(userId) || {
      previousTopics: [],
      emotionalHistory: [],
      userPatterns: {
        commonStressors: [],
        copingMentions: [],
        supportSystemMentions: []
      }
    };
    
    // Update context
    userContext.emotionalHistory.push(emotionalContext);
    if (userContext.emotionalHistory.length > 10) {
      userContext.emotionalHistory = userContext.emotionalHistory.slice(-10);
    }
    
    // Update patterns
    intent.entities.forEach(entity => {
      if (emotionalContext.sentiment === 'negative' && !userContext.userPatterns.commonStressors.includes(entity)) {
        userContext.userPatterns.commonStressors.push(entity);
      }
    });
    
    this.conversationContext.set(userId, userContext);
    
    return this.craftResponse(userMessage, emotionalContext, intent, userContext, conversationHistory);
  }

  private craftResponse(
    userMessage: string,
    emotional: EmotionalContext,
    intent: UserIntent,
    context: ConversationContext,
    history: any[]
  ): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Crisis response
    if (intent.type === 'crisis') {
      return this.getCrisisResponse();
    }
    
    // Retrieve relevant knowledge using RAG
    const relevantKnowledge = this.retrieveRelevantKnowledge(userMessage);
    
    // Build personalized response
    let response = this.getOpeningAcknowledgment(emotional, intent);
    response += ' ' + this.getMainContent(userMessage, emotional, intent, context);
    response += ' ' + this.getContextualQuestion(emotional, intent, context);
    
    // Add relevant knowledge if found
    if (relevantKnowledge.length > 0) {
      const knowledge = relevantKnowledge[0]; // Use the most relevant piece
      response += `\n\nHere's some additional information that might help: ${knowledge.content}`;
    }
    
    return response;
  }

  private getOpeningAcknowledgment(emotional: EmotionalContext, intent: UserIntent): string {
    if (emotional.intensity === 'high' && emotional.sentiment === 'negative') {
      return "I can hear how much pain you're in right now.";
    } else if (intent.type === 'venting') {
      return "Thank you for trusting me with this.";
    } else if (emotional.emotions.includes('loneliness')) {
      return "I want you to know that you're not alone in feeling this way.";
    } else if (emotional.emotions.includes('anger') || emotional.emotions.includes('frustration')) {
      return "It sounds like you're dealing with some really frustrating situations.";
    } else if (intent.type === 'validation') {
      return "Your feelings and experiences are completely valid.";
    } else {
      return "I appreciate you sharing this with me.";
    }
  }

  private getMainContent(
    userMessage: string,
    emotional: EmotionalContext,
    intent: UserIntent,
    context: ConversationContext
  ): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for cultural context - only when user explicitly mentions race/ethnicity as a factor
    const hasCulturalContext = lowerMessage.includes('because i\'m black') || 
      lowerMessage.includes('because i\'m a black man') || lowerMessage.includes('as a black man') ||
      lowerMessage.includes('because i\'m hispanic') || lowerMessage.includes('because i\'m latino') ||
      lowerMessage.includes('being black') || lowerMessage.includes('being a person of color') ||
      lowerMessage.includes('due to my race') || lowerMessage.includes('because of my color') ||
      lowerMessage.includes('racial discrimination') || lowerMessage.includes('racism against me') ||
      lowerMessage.includes('discriminated against') || lowerMessage.includes('microaggression');
    
    // Pattern recognition from user history
    const isRecurringStressor = intent.entities.some(entity => 
      context.userPatterns.commonStressors.includes(entity)
    );
    
    if (isRecurringStressor) {
      return "I notice this seems to be an ongoing challenge for you. " + this.getAdviceForRecurringIssue(intent.entities[0], hasCulturalContext);
    }
    
    // Emotional intensity-based responses
    if (emotional.intensity === 'high') {
      return this.getHighIntensityResponse(emotional.emotions[0], hasCulturalContext);
    } else if (intent.type === 'seeking_advice') {
      return this.getAdviceResponse(intent.entities, hasCulturalContext);
    } else if (intent.type === 'venting') {
      return this.getValidationResponse(emotional, hasCulturalContext);
    }
    
    return this.getGeneralSupportResponse(emotional, hasCulturalContext);
  }

  private getContextualQuestion(
    emotional: EmotionalContext,
    intent: UserIntent,
    context: ConversationContext
  ): string {
    if (intent.type === 'crisis') {
      return "Can you reach out to one of these crisis resources right now?";
    } else if (emotional.intensity === 'high') {
      return "What would feel most supportive for you right now?";
    } else if (intent.type === 'seeking_advice') {
      return "What approaches have you already tried, and how did they work for you?";
    } else if (intent.type === 'venting') {
      return "How long have you been carrying this weight?";
    } else if (emotional.emotions.includes('loneliness')) {
      return "When do you feel most connected to others?";
    } else if (intent.entities.includes('job_loss')) {
      return "What's been the hardest part about losing your job?";
    } else if (intent.entities.includes('workplace')) {
      return "How is this affecting your daily experience at work?";
    } else if (intent.entities.includes('relationships')) {
      return "How are these relationship dynamics impacting your well-being?";
    } else {
      return "What would be most helpful for you to explore right now?";
    }
  }

  // Helper methods for specific response types
  private getCrisisResponse(): string {
    return `🚨 CRISIS SUPPORT NEEDED 🚨

I'm very concerned about you right now. Your life has value and you don't have to go through this alone.

IMMEDIATE HELP:
📞 988 Suicide & Crisis Lifeline: Call or text 988
📱 Crisis Text Line: Text HOME to 741741
🆘 Emergency Services: Call 911

If you're not in immediate danger but need support:
• National Alliance on Mental Illness: 1-800-950-NAMI
• SAMHSA National Helpline: 1-800-662-4357

You matter, and there are people who want to help you through this difficult time. Can you reach out to one of these resources right now?`;
  }

  private getHighIntensityResponse(primaryEmotion: string, hasCulturalContext: boolean): string {
    const culturalAddition = hasCulturalContext ? " especially given the additional challenges you're facing around discrimination and cultural expectations" : "";
    
    switch (primaryEmotion) {
      case 'severe_anxiety':
        return `This level of anxiety can feel overwhelming${culturalAddition}. Right now, focus on your breathing - in for 4 counts, hold for 4, out for 6. You're safe in this moment.`;
      case 'severe_depression':
        return `These feelings of emptiness are so heavy${culturalAddition}. Even though it doesn't feel like it right now, this pain is not permanent.`;
      case 'anger':
        return `This anger makes complete sense given what you're going through${culturalAddition}. Your feelings are justified, and we can work through this together.`;
      default:
        return `What you're experiencing sounds incredibly difficult${culturalAddition}. You don't have to face this alone.`;
    }
  }

  private getAdviceForRecurringIssue(entity: string, hasCulturalContext: boolean): string {
    const culturalNote = hasCulturalContext ? " It's particularly challenging when discrimination adds another layer to these struggles." : "";
    
    switch (entity) {
      case 'job_loss':
        return `I notice you've mentioned job challenges before. Repeated job instability can be incredibly stressful and emotionally draining.${culturalNote} It might help to think about patterns and what support systems could help you through this transition.`;
      case 'workplace':
        return `Since workplace stress seems to be an ongoing pattern for you, it might be worth developing a longer-term strategy.${culturalNote}`;
      case 'relationships':
        return `I see that relationship challenges have come up before for you. These patterns often have deeper roots.${culturalNote}`;
      default:
        return `This seems to be a recurring source of stress in your life.${culturalNote}`;
    }
  }

  private getAdviceResponse(entities: string[], hasCulturalContext: boolean): string {
    if (entities.includes('job_loss')) {
      const culturalAddition = hasCulturalContext ? " I understand this can be especially challenging when facing discrimination or bias in the job market." : "";
      return `Losing a job is one of life's most stressful experiences, and feeling sad about it is completely natural. It can shake your sense of security and identity.${culturalAddition} While this is incredibly difficult right now, it can also be an opportunity for a fresh start. Have you been able to talk to anyone about how you're feeling about the job loss?`;
    }
    
    if (entities.includes('workplace')) {
      return "Workplace challenges can really weigh on you, especially when they affect your daily life and wellbeing. What's been the most difficult part of your work situation?";
    }
    
    if (entities.includes('relationships')) {
      return "Relationship challenges can be emotionally draining. Every relationship has its complexities. What aspect of your relationships feels most challenging right now?";
    }
    
    // More sophisticated advice based on entities and cultural context
    return "Based on what you've shared, here are some approaches that might help. What feels like the most pressing issue you'd like to work through?";
  }

  private getValidationResponse(emotional: EmotionalContext, hasCulturalContext: boolean): string {
    if (hasCulturalContext) {
      return "Your feelings are completely understandable, especially considering the unique challenges and pressures you're navigating.";
    }
    return "What you're feeling makes complete sense given your situation. These emotions are telling you something important.";
  }

  private getGeneralSupportResponse(emotional: EmotionalContext, hasCulturalContext: boolean): string {
    return "I hear you, and I want you to know that seeking support shows real strength.";
  }
}

export const advancedChatbot = new AdvancedChatbotService();
