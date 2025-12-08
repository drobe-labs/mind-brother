// Response Generator with Custom Tone Settings
// Adjustable formality, empathy, directiveness, and cultural language

export interface ToneSettings {
  formality: 'casual' | 'balanced' | 'professional';
  empathyLevel: 'low' | 'medium' | 'high';
  directiveness: 'low' | 'moderate' | 'high'; // low = listening, high = advice
  culturalLanguage: 'none' | 'natural' | 'explicit';
}

export interface ResponseContext {
  category: string;
  subcategory?: string;
  emotionalIntensity: number;
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export class ResponseGenerator {
  
  // Default tone settings (customizable)
  public toneSettings: ToneSettings = {
    formality: 'casual',      // Conversational, authentic
    empathyLevel: 'high',     // Very empathetic for mental health
    directiveness: 'moderate', // Balance listening + guidance
    culturalLanguage: 'natural' // Only when user brings it up
  };
  
  /**
   * Generate response with tone-aware language
   */
  public generateResponse(context: ResponseContext): string {
    const { category, subcategory, emotionalIntensity, userMessage } = context;
    
    // Crisis always overrides tone settings
    if (category === 'CRISIS') {
      return this.getCrisisResponse();
    }
    
    // Generate base response by category
    let baseResponse = this.getBaseResponse(category, subcategory, emotionalIntensity, userMessage);
    
    // Apply tone adjustments
    baseResponse = this.applyTone(baseResponse, context);
    
    return baseResponse;
  }
  
  /**
   * Apply tone settings to response
   */
  private applyTone(response: string, context: ResponseContext): string {
    let tonedResponse = response;
    
    // 1. Apply formality
    tonedResponse = this.applyFormality(tonedResponse);
    
    // 2. Apply empathy level
    tonedResponse = this.applyEmpathy(tonedResponse, context.emotionalIntensity);
    
    // 3. Apply directiveness
    tonedResponse = this.applyDirectiveness(tonedResponse, context.category);
    
    // 4. Apply cultural language (if user mentioned race/ethnicity)
    tonedResponse = this.applyCulturalContext(tonedResponse, context.userMessage);
    
    return tonedResponse;
  }
  
  /**
   * Apply formality level
   */
  private applyFormality(response: string): string {
    switch (this.toneSettings.formality) {
      case 'casual':
        // Keep contractions, conversational language
        return response;
        
      case 'balanced':
        // Mix of casual and formal
        return response
          .replace(/can't/gi, 'cannot')
          .replace(/won't/gi, 'will not')
          .replace(/I'm/g, 'I am');
        
      case 'professional':
        // More formal language
        return response
          .replace(/can't/gi, 'cannot')
          .replace(/won't/gi, 'will not')
          .replace(/I'm/g, 'I am')
          .replace(/what's/gi, 'what is')
          .replace(/you're/gi, 'you are');
        
      default:
        return response;
    }
  }
  
  /**
   * Apply empathy level
   */
  private applyEmpathy(response: string, emotionalIntensity: number): string {
    const { empathyLevel } = this.toneSettings;
    
    // High emotional intensity always gets high empathy
    if (emotionalIntensity >= 8) {
      return this.addHighEmpathy(response);
    }
    
    switch (empathyLevel) {
      case 'low':
        // Minimal emotional language, focus on facts
        return response.replace(/That sounds (really )?tough/gi, 'I understand');
        
      case 'medium':
        // Standard empathy
        return response;
        
      case 'high':
        // Maximum empathy and validation
        return this.addHighEmpathy(response);
        
      default:
        return response;
    }
  }
  
  /**
   * Add high empathy language
   */
  private addHighEmpathy(response: string): string {
    // Already empathetic responses - keep as is
    if (response.includes('That sounds') || response.includes('I hear you')) {
      return response;
    }
    
    // Add empathetic opening if missing
    const empathyPhrases = [
      'That sounds really tough.',
      'I hear you.',
      'What you\'re going through is real.',
      'That must be really difficult.'
    ];
    
    const randomEmpathy = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
    return `${randomEmpathy} ${response}`;
  }
  
  /**
   * Apply directiveness level
   */
  private applyDirectiveness(response: string, category: string): string {
    const { directiveness } = this.toneSettings;
    
    // Crisis always gets high directiveness (clear instructions)
    if (category === 'CRISIS') {
      return response;
    }
    
    switch (directiveness) {
      case 'low':
        // Mostly questions, minimal advice
        // Replace statements with questions
        return this.convertToQuestions(response);
        
      case 'moderate':
        // Balance of listening and guidance (default)
        return response;
        
      case 'high':
        // More actionable advice
        return this.addActionableAdvice(response, category);
        
      default:
        return response;
    }
  }
  
  /**
   * Convert statements to questions (low directiveness)
   */
  private convertToQuestions(response: string): string {
    // If response doesn't end with a question, add one
    if (!response.includes('?')) {
      const questions = [
        'What would help you most right now?',
        'How are you feeling about this?',
        'What do you think would be helpful?',
        'Want to talk more about that?'
      ];
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      return `${response}\n\n${randomQuestion}`;
    }
    return response;
  }
  
  /**
   * Add actionable advice (high directiveness)
   */
  private addActionableAdvice(response: string, category: string): string {
    const advice: { [key: string]: string } = {
      'EMPLOYMENT': '\n\nConsider: Update your resume, reach out to your network, or explore temp work while searching.',
      'MENTAL_HEALTH': '\n\nTry: Deep breathing (4-7-8 technique), journaling your thoughts, or talking to someone you trust.',
      'RELATIONSHIP': '\n\nConsider: Having an honest conversation, setting boundaries, or seeking couples counseling.'
    };
    
    if (advice[category]) {
      return response + advice[category];
    }
    
    return response;
  }
  
  /**
   * Apply cultural context (only if user mentions it)
   */
  private applyCulturalContext(response: string, userMessage: string): string {
    const { culturalLanguage } = this.toneSettings;
    
    if (culturalLanguage === 'none') {
      return response;
    }
    
    // Check if user explicitly mentioned race/ethnicity/cultural context
    const hasCulturalContext = /\b(black|brown|person of color|poc|hispanic|latino|latina|african american|discrimination|racism|microaggression|code-switching)\b/i.test(userMessage);
    
    if (!hasCulturalContext) {
      // User didn't mention culture - don't add it
      return response;
    }
    
    // User mentioned cultural context
    switch (culturalLanguage) {
      case 'natural':
        // Acknowledge subtly
        return response.replace(
          /What you're (feeling|going through)/i,
          'What you\'re experiencing, especially given the cultural context you mentioned,'
        );
        
      case 'explicit':
        // More direct acknowledgment
        if (!response.includes('cultural') && !response.includes('discrimination')) {
          return `I hear the cultural and racial context in what you're sharing. ${response}`;
        }
        return response;
        
      default:
        return response;
    }
  }
  
  /**
   * Get base response by category
   */
  private getBaseResponse(category: string, subcategory: string | undefined, emotionalIntensity: number, userMessage: string): string {
    switch (category) {
      case 'EMPLOYMENT':
        return this.getEmploymentResponse(subcategory, emotionalIntensity);
        
      case 'RELATIONSHIP':
        return this.getRelationshipResponse(subcategory, emotionalIntensity);
        
      case 'MENTAL_HEALTH':
        return this.getMentalHealthResponse(subcategory, emotionalIntensity);
        
      case 'TECH_ISSUE':
        return this.getTechResponse();
        
      case 'GENERAL':
      default:
        return this.getGeneralResponse();
    }
  }
  
  // ===== CATEGORY-SPECIFIC RESPONSES =====
  
  private getCrisisResponse(): string {
    return `🚨 CRISIS SUPPORT NEEDED 🚨

I'm very concerned about you right now. Your life has value and you don't have to go through this alone.

IMMEDIATE HELP:
📞 988 Suicide & Crisis Lifeline: Call or text 988
📱 Crisis Text Line: Text HOME to 741741
🆘 Emergency Services: Call 911

You matter, and there are people who want to help you through this. Can you reach out to one of these resources right now?`;
  }
  
  private getEmploymentResponse(subcategory: string | undefined, intensity: number): string {
    if (subcategory === 'feeling_like_burden' || intensity >= 7) {
      return `That sounds incredibly heavy to carry. Losing work isn't just about money—it hits our sense of worth and identity, especially when we feel responsible for others.

What you're feeling is real and valid. Many men struggle with this same weight.

What's been the hardest part for you?`;
    }
    
    if (subcategory === 'job_seeking') {
      return `The job search can be draining, especially when each rejection feels personal.

You're putting yourself out there, and that takes courage. What kind of support would help you most right now?`;
    }
    
    return `Work challenges can really wear us down. What's going on?`;
  }
  
  private getRelationshipResponse(subcategory: string | undefined, intensity: number): string {
    if (subcategory === 'infidelity') {
      return `That kind of betrayal cuts deep. Trust is everything in a relationship, and when it's broken, it shakes your whole world.

How are you processing this right now?`;
    }
    
    if (subcategory === 'fatherhood') {
      return `Being a father comes with pressure to be perfect, but the truth is, every parent struggles. Doubting yourself doesn't mean you're failing—it often means you care deeply.

What specifically has you feeling this way?`;
    }
    
    return `Relationship struggles can feel isolating. What's been going on?`;
  }
  
  private getMentalHealthResponse(subcategory: string | undefined, intensity: number): string {
    if (intensity >= 8) {
      return `What you're going through sounds really tough. Depression can make everything feel heavy and hopeless.

You're not alone in this. What's been weighing on you most?`;
    }
    
    if (subcategory === 'depression' || subcategory === 'moderate_depression') {
      return `That emptiness is real. Depression doesn't always scream—sometimes it just quietly drains you.

When did you start feeling this way?`;
    }
    
    if (subcategory === 'anxiety' || subcategory?.includes('anxiety')) {
      return `Anxiety can feel like your mind won't stop running. It's exhausting.

What's been triggering these feelings for you?`;
    }
    
    return `It sounds like you're going through something difficult. Want to talk about it?`;
  }
  
  private getTechResponse(): string {
    return `Sorry about that! Can you tell me what went wrong? I'll do my best to help or get you to the right support.`;
  }
  
  private getGeneralResponse(): string {
    return `I'm here to listen. What's on your mind?`;
  }
  
  /**
   * Customize tone settings
   */
  public setTone(settings: Partial<ToneSettings>): void {
    this.toneSettings = { ...this.toneSettings, ...settings };
    console.log('✅ Tone settings updated:', this.toneSettings);
  }
  
  /**
   * Get current tone settings
   */
  public getTone(): ToneSettings {
    return { ...this.toneSettings };
  }
}

// Export singleton instance
export const responseGenerator = new ResponseGenerator();






