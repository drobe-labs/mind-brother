// Intelligent Chatbot with Claude-Powered Classification
// Combines smart classification with contextual response generation

import { classifyWithClaude, isCrisisQuickCheck, ClaudeClassificationResult } from './claudeClassifier';
import { smartChatbot } from './smartChatbot';
import { modernRAG } from './modernRAG';
import { responseGenerator } from './responseGenerator';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  classification?: ClaudeClassificationResult;
}

export class IntelligentChatbot {
  private conversationHistory: ChatMessage[] = [];
  
  /**
   * Main message handler with intelligent classification
   */
  async generateResponse(userMessage: string): Promise<{
    response: string;
    classification: ClaudeClassificationResult;
    ragDocuments?: any[];
  }> {
    
    // ===== STEP 1: QUICK CRISIS CHECK (for speed) =====
    if (isCrisisQuickCheck(userMessage)) {
      const classification: ClaudeClassificationResult = {
        category: 'CRISIS',
        subcategory: 'suicide',
        confidence: 1.0,
        reasoning: 'Quick check detected crisis keywords',
        emotional_intensity: 10,
        suggested_response: 'crisis_protocol'
      };
      
      const response = this.getCrisisResponse();
      
      // Add to history
      this.addToHistory('user', userMessage, classification);
      this.addToHistory('assistant', response);
      
      return { response, classification };
    }
    
    // ===== STEP 2: CLAUDE CLASSIFICATION =====
    console.log('🔍 Classifying message with Claude...');
    
    const classification = await classifyWithClaude(userMessage, {
      recentMessages: this.conversationHistory.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });
    
    console.log('📊 Classification result:', classification);
    
    // ===== STEP 3: RETRIEVE RELEVANT KNOWLEDGE (RAG) =====
    const ragDocuments = modernRAG.retrieveRelevantKnowledge(userMessage, 3);
    
    // ===== STEP 4: GENERATE CONTEXTUAL RESPONSE =====
    let response: string;
    
    // Route based on classification category
    switch (classification.category) {
      case 'CRISIS':
        response = this.getCrisisResponse();
        break;
        
      case 'EMPLOYMENT':
        response = this.getEmploymentResponse(classification, userMessage, ragDocuments);
        break;
        
      case 'RELATIONSHIP':
        response = this.getRelationshipResponse(classification, userMessage, ragDocuments);
        break;
        
      case 'MENTAL_HEALTH':
        response = this.getMentalHealthResponse(classification, userMessage, ragDocuments);
        break;
        
      case 'TECH_ISSUE':
        response = this.getTechIssueResponse();
        break;
        
      case 'GENERAL':
        response = this.getGeneralResponse(classification, userMessage);
        break;
        
      default:
        response = "I'm here to listen. What's on your mind?";
    }
    
    // ===== STEP 5: ADD TO CONVERSATION HISTORY =====
    this.addToHistory('user', userMessage, classification);
    this.addToHistory('assistant', response);
    
    return {
      response,
      classification,
      ragDocuments: ragDocuments.map(doc => ({
        category: doc.category,
        relevanceScore: doc.relevanceScore
      }))
    };
  }
  
  // ===== RESPONSE GENERATORS =====
  
  private getCrisisResponse(): string {
    return `I'm really concerned about what you've shared. Please know that you don't have to face this alone.

**Immediate Support:**
🆘 **National Suicide Prevention Lifeline**
📞 Call or text 988 (24/7)

🆘 **Crisis Text Line**
📱 Text HOME to 741741

🆘 **Black Emotional and Mental Health Collective (BEAM)**
📞 1-800-273-8255

You deserve support right now. Can you reach out to one of these resources or someone you trust?`;
  }
  
  private getEmploymentResponse(
    classification: ClaudeClassificationResult,
    userMessage: string,
    ragDocs: any[]
  ): string {
    const { subcategory, emotional_intensity } = classification;
    
    // High emotional intensity (feeling like a burden)
    if (subcategory === 'feeling_like_burden' || emotional_intensity >= 7) {
      return `That sounds incredibly heavy to carry. Losing work isn't just about money—it hits our sense of worth and identity, especially when we feel responsible for others.

What you're feeling is real and valid. Many men struggle with this same weight.

What's been the hardest part for you?`;
    }
    
    // Job seeking
    if (subcategory === 'job_seeking') {
      return `The job search can be draining, especially when each rejection feels personal.

You're putting yourself out there, and that takes courage. What kind of support would help you most right now?`;
    }
    
    // Financial stress
    if (subcategory === 'financial_stress') {
      return `Financial pressure can feel suffocating. It's hard to think clearly when you're worried about making ends meet.

What's your biggest financial concern right now?`;
    }
    
    // General employment stress
    return `Work challenges can really wear us down. What's going on?`;
  }
  
  private getRelationshipResponse(
    classification: ClaudeClassificationResult,
    userMessage: string,
    ragDocs: any[]
  ): string {
    const { subcategory } = classification;
    
    // Infidelity
    if (subcategory === 'infidelity') {
      return `That kind of betrayal cuts deep. Trust is everything in a relationship, and when it's broken, it shakes your whole world.

How are you processing this right now?`;
    }
    
    // Fatherhood struggles
    if (subcategory === 'fatherhood') {
      return `Being a father comes with pressure to be perfect, but the truth is, every parent struggles. Doubting yourself doesn't mean you're failing—it often means you care deeply.

What specifically has you feeling this way?`;
    }
    
    // Breakup/divorce
    if (subcategory === 'breakup') {
      return `Endings are painful, even when we know they're necessary. Grief isn't linear.

How are you coping with this?`;
    }
    
    // General relationship
    return `Relationship struggles can feel isolating. What's been going on?`;
  }
  
  private getMentalHealthResponse(
    classification: ClaudeClassificationResult,
    userMessage: string,
    ragDocs: any[]
  ): string {
    const { subcategory, emotional_intensity } = classification;
    
    // Severe depression
    if (subcategory === 'severe_depression' || emotional_intensity >= 8) {
      return `What you're going through sounds really tough. Depression can make everything feel heavy and hopeless.

You're not alone in this. What's been weighing on you most?`;
    }
    
    // Moderate depression
    if (subcategory === 'moderate_depression') {
      return `That emptiness is real. Depression doesn't always scream—sometimes it just quietly drains you.

When did you start feeling this way?`;
    }
    
    // Anxiety
    if (subcategory?.includes('anxiety')) {
      return `Anxiety can feel like your mind won't stop running. It's exhausting.

What's been triggering these feelings for you?`;
    }
    
    // Self-esteem
    if (subcategory === 'self_esteem') {
      return `Those thoughts about not being enough can be relentless. They're often louder than the truth.

What's making you feel this way?`;
    }
    
    // General mental health
    return `It sounds like you're going through something difficult. Want to talk about it?`;
  }
  
  private getTechIssueResponse(): string {
    return `Sorry about that! Can you tell me what went wrong? I'll do my best to help or get you to the right support.`;
  }
  
  private getGeneralResponse(
    classification: ClaudeClassificationResult,
    userMessage: string
  ): string {
    const { subcategory } = classification;
    
    // Greeting
    if (subcategory === 'greeting') {
      return `Hey, I'm here for you. How are you doing today?`;
    }
    
    // Positive emotion
    if (subcategory === 'positive') {
      return `That's good to hear! What's been going well?`;
    }
    
    // Gratitude
    if (subcategory === 'gratitude') {
      return `You're welcome. I'm here whenever you need to talk.`;
    }
    
    // Casual
    return `I'm here to listen. What's on your mind?`;
  }
  
  // ===== CONVERSATION MANAGEMENT =====
  
  private addToHistory(
    role: 'user' | 'assistant',
    content: string,
    classification?: ClaudeClassificationResult
  ): void {
    this.conversationHistory.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      classification
    });
    
    // Keep last 20 messages to avoid memory bloat
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }
  
  public getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }
  
  public clearHistory(): void {
    this.conversationHistory = [];
  }
  
  public getLastClassification(): ClaudeClassificationResult | null {
    for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
      if (this.conversationHistory[i].classification) {
        return this.conversationHistory[i].classification;
      }
    }
    return null;
  }
}

// Export singleton instance
export const intelligentChatbot = new IntelligentChatbot();

