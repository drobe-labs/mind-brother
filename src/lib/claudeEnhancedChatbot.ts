// Claude Enhanced Chatbot Service
// Connects to the backend for AI-powered responses
//
// ⭐ CULTURAL PERSONALIZATION INTEGRATION:
// This service now accepts a culturalSystemPrompt parameter that provides
// culturally adaptive context for each user. When provided, it replaces the
// default system prompt to deliver personalized, culturally aware responses.
//
// ⭐ CULTURAL CRISIS DETECTION:
// Crisis detection now considers cultural context to avoid over-escalation
// while providing culturally relevant resources.

import { 
  detectCrisisWithCulturalContext, 
  getCulturalCrisisResponse,
  logCulturalCrisisAssessment,
  type CrisisAssessment 
} from './culturalCrisisDetection';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationFlow {
  currentStage: string;
  topic: string;
  emotionalIntensity: number;
}

interface CrisisMonitor {
  indicators: Array<{ indicator: string; timestamp: string; culturalContext?: string }>;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  lastCulturalAssessment?: CrisisAssessment;
}

interface UserState {
  lastMoodTrend?: string;
  emotionalHistory?: string[];
  sessionCount?: number;
}

interface PrioritizedContext {
  intentGuidance?: string;
  userProfile?: string;
  safetyNotes?: string;
  knowledgeContext?: string;
  recentConversation?: string;
  sessionSummary?: string;
}

export class ClaudeEnhancedChatbotService {
  private backendUrl: string;
  private MAX_RECENT_MESSAGES = 5;
  private userStates: Map<string, UserState> = new Map();
  private conversationFlows: Map<string, ConversationFlow> = new Map();
  private crisisMonitors: Map<string, CrisisMonitor> = new Map();

  constructor() {
    // Use environment variable or local network IP for mobile device testing
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://mind-brother-production.up.railway.app';
    console.log('🤖 ClaudeEnhancedChatbot initialized with backend:', this.backendUrl);
  }

  private getUserState(userId: string): UserState {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        lastMoodTrend: 'neutral',
        emotionalHistory: [],
        sessionCount: 0
      });
    }
    return this.userStates.get(userId)!;
  }

  private getConversationFlow(userId: string): ConversationFlow {
    if (!this.conversationFlows.has(userId)) {
      this.conversationFlows.set(userId, {
        currentStage: 'greeting',
        topic: 'general',
        emotionalIntensity: 0
      });
    }
    return this.conversationFlows.get(userId)!;
  }

  private getCrisisMonitor(userId: string): CrisisMonitor {
    if (!this.crisisMonitors.has(userId)) {
      this.crisisMonitors.set(userId, {
        indicators: [],
        riskLevel: 'none'
      });
    }
    return this.crisisMonitors.get(userId)!;
  }

  private getStageGuidance(flow: ConversationFlow): string {
    const stageGuidance: Record<string, string> = {
      greeting: 'User just started. Be warm and welcoming.',
      exploration: 'User is opening up. Listen actively and ask clarifying questions.',
      support: 'Provide empathetic support and validation.',
      action: 'Help user identify actionable steps.',
      closing: 'Summarize and encourage.'
    };
    return stageGuidance[flow.currentStage] || '';
  }

  private getMoodTrendGuidance(trend?: string): string {
    if (!trend) return '';
    const trendGuidance: Record<string, string> = {
      improving: 'User mood is improving. Acknowledge progress.',
      declining: 'User mood is declining. Be extra supportive.',
      stable: 'User mood is stable. Continue current approach.',
      neutral: ''
    };
    return trendGuidance[trend] || '';
  }

  private getCrisisGuidance(monitor: CrisisMonitor): string {
    if (monitor.riskLevel === 'none' || monitor.riskLevel === 'low') return '';
    return `IMPORTANT: Crisis risk level is ${monitor.riskLevel}. Prioritize safety and provide crisis resources if needed.`;
  }

  private getContextualTherapeuticTools(patterns: string[], lastEmotion?: string): string {
    return `Consider using: active listening, validation, open-ended questions, and gentle reframing when appropriate.`;
  }

  /**
   * Quick crisis check for initial screening before cultural context analysis
   */
  /**
   * Detect clearly positive/neutral messages that should NOT trigger crisis mode
   * This helps prevent false positives when users are doing well
   */
  private isPositiveSentiment(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Positive indicators
    const positivePatterns = [
      /\b(good place|doing (well|good|great|fine|okay|ok|better)|feeling (good|great|better|happy|relaxed|calm))\b/i,
      /\b(check[\s-]?in|checking in|just wanted to (say hi|chat|talk))\b/i,
      /\b(relaxing|watching|enjoying|having (fun|tea|coffee|a good))\b/i,
      /\b(grateful|thankful|blessed|appreciate|happy|content|peaceful)\b/i,
      /\b(had a (good|great|nice) day|things are going (well|good))\b/i,
      /\b(feeling (much )?better|improving|progress|getting better)\b/i,
    ];
    
    // If message contains positive patterns AND doesn't contain crisis indicators
    const hasPositive = positivePatterns.some(p => p.test(lowerMessage));
    const hasCrisisWords = /\b(suicid|kill|hurt|harm|die|dead|hopeless|worthless|can't (go on|take it|do this))\b/i.test(lowerMessage);
    
    return hasPositive && !hasCrisisWords;
  }

  private quickCrisisCheck(message: string): {
    detected: boolean;
    type: string;
    confidence: number;
    severity: number;
  } {
    const lowerMessage = message.toLowerCase();
    
    // ⭐ NEW: Check for positive sentiment FIRST - skip crisis check for clearly positive messages
    if (this.isPositiveSentiment(message)) {
      console.log('😊 Positive sentiment detected - skipping crisis check');
      return { detected: false, type: 'positive', confidence: 0, severity: 0 };
    }
    
    // Critical: Explicit suicidal statements (highest priority)
    if (/\b(suicide|kill myself|want to die|end my life|end it all|going to kill myself|planning to kill myself)\b/i.test(message)) {
      return { detected: true, type: 'suicide', confidence: 1.0, severity: 5 };
    }
    
    // Critical: Planning/preparation indicators
    if (/\b(have\s+a\s+plan|set\s+a\s+date|wrote\s+goodbye|saying\s+goodbye|final\s+arrangements|gave\s+away\s+my\s+things)\b/i.test(message)) {
      return { detected: true, type: 'suicide', confidence: 1.0, severity: 5 };
    }
    
    // Critical: Finality language
    if (/\b(goodbye\s+forever|this\s+is\s+goodbye|won't\s+see\s+me\s+again|this\s+is\s+the\s+end)\b/i.test(message)) {
      return { detected: true, type: 'suicide', confidence: 0.95, severity: 5 };
    }
    
    // High: Self-harm
    if (/\b(hurt myself|self harm|self-harm|cutting|overdose)\b/i.test(message)) {
      return { detected: true, type: 'self_harm', confidence: 1.0, severity: 4 };
    }
    
    // High: Burden beliefs (strong suicide predictor)
    if (/\b(better\s+off\s+without\s+me|burden\s+to\s+everyone|nobody\s+would\s+miss)\b/i.test(message)) {
      return { detected: true, type: 'suicide', confidence: 0.95, severity: 4 };
    }
    
    // Medium: Despair (may need cultural context to interpret)
    if (/\b(can't do this anymore|can't go on|can't take it anymore)\b/i.test(message)) {
      return { detected: true, type: 'despair', confidence: 0.8, severity: 3 };
    }
    
    // Medium: Hopelessness
    if (/\b(no point (in )?living|no reason to live|don't want to (be here|live))\b/i.test(message)) {
      return { detected: true, type: 'despair', confidence: 0.85, severity: 4 };
    }
    
    return { detected: false, type: 'none', confidence: 0, severity: 0 };
  }

  public async generateResponse(
    userMessage: string,
    userId: string = 'default',
    currentMessages: ChatMessage[] = [],
    userName?: string | null,
    culturalSystemPrompt?: string // ⭐ NEW: Cultural context from user's profile
  ): Promise<string> {
    
    try {
      const flow = this.getConversationFlow(userId);
      const crisisMonitor = this.getCrisisMonitor(userId);
      const userState = this.getUserState(userId);
      
      // ⭐ CULTURAL CRISIS DETECTION: Check for crisis with cultural context
      const baseCrisisCheck = this.quickCrisisCheck(userMessage);
      let culturalCrisisAssessment: CrisisAssessment | null = null;
      
      // ⭐ NEW: Clear crisis state when user shows positive sentiment
      if (baseCrisisCheck.type === 'positive' || this.isPositiveSentiment(userMessage)) {
        console.log('😊 User showing positive sentiment - clearing crisis monitoring state');
        crisisMonitor.riskLevel = 'none';
        crisisMonitor.indicators = []; // Clear old indicators
        // Don't run cultural crisis detection for positive messages
      } else if (baseCrisisCheck.detected || culturalSystemPrompt) {
        // Use cultural-aware crisis detection
        try {
          culturalCrisisAssessment = await detectCrisisWithCulturalContext(
            userMessage,
            userId,
            baseCrisisCheck.detected ? {
              isCrisis: true,
              type: baseCrisisCheck.type,
              confidence: baseCrisisCheck.confidence,
              severity: baseCrisisCheck.severity
            } : undefined
          );
          
          crisisMonitor.lastCulturalAssessment = culturalCrisisAssessment;
          
          // Update crisis monitor with cultural context
          if (culturalCrisisAssessment.isCrisis) {
            crisisMonitor.indicators.push({
              indicator: culturalCrisisAssessment.type,
              timestamp: new Date().toISOString(),
              culturalContext: culturalCrisisAssessment.context || undefined
            });
            
            // Map severity to risk level
            if (culturalCrisisAssessment.severity >= 5) {
              crisisMonitor.riskLevel = 'critical';
            } else if (culturalCrisisAssessment.severity >= 4) {
              crisisMonitor.riskLevel = 'high';
            } else if (culturalCrisisAssessment.severity >= 3) {
              crisisMonitor.riskLevel = 'medium';
            } else if (culturalCrisisAssessment.severity >= 2) {
              crisisMonitor.riskLevel = 'low';
            }
            
            // Log for audit trail
            await logCulturalCrisisAssessment(
              userId,
              `session_${Date.now()}`,
              culturalCrisisAssessment,
              baseCrisisCheck.severity
            );
            
            console.log('🚨 Cultural crisis assessment:', {
              severity: culturalCrisisAssessment.severity,
              type: culturalCrisisAssessment.type,
              context: culturalCrisisAssessment.context,
              adjustmentReason: culturalCrisisAssessment.adjustmentReason
            });
          }
        } catch (error) {
          console.error('⚠️ Cultural crisis detection error:', error);
          // Fall back to base crisis detection
        }
      }
      
      // If critical crisis detected, provide immediate response with cultural resources
      if (culturalCrisisAssessment?.isCrisis && culturalCrisisAssessment.severity >= 4) {
        console.log('🚨 Critical crisis detected - providing immediate culturally-aware response');
        
        // Get the cultural crisis response
        const crisisResponse = getCulturalCrisisResponse(
          culturalCrisisAssessment,
          null // Profile will be fetched inside the function
        );
        
        return {
          response: crisisResponse,
          metadata: {
            isCrisis: true,
            crisisAssessment: culturalCrisisAssessment,
            crisisResources: culturalCrisisAssessment.resources.slice(0, 3)
          }
        } as any;
      }
      
      // ⭐ CULTURAL PERSONALIZATION: Use culturally adaptive prompt if provided
      let systemPrompt: string;
      
      if (culturalSystemPrompt && culturalSystemPrompt.trim().length > 0) {
        // Use the culturally adaptive system prompt
        console.log('🌍 Using culturally adaptive system prompt:', culturalSystemPrompt.length, 'characters');
        systemPrompt = culturalSystemPrompt;
        
        // Add cultural crisis context if detected
        if (culturalCrisisAssessment && culturalCrisisAssessment.context) {
          systemPrompt += `\n\n--- CULTURAL CONTEXT DETECTED ---`;
          systemPrompt += `\nContext: ${culturalCrisisAssessment.context}`;
          if (culturalCrisisAssessment.culturalConsiderations?.length) {
            systemPrompt += `\nConsiderations: ${culturalCrisisAssessment.culturalConsiderations.join('; ')}`;
          }
        }
        
        // Append dynamic context (conversation flow, crisis monitoring, etc.)
        systemPrompt += `\n\n--- CURRENT SESSION CONTEXT ---`;
        systemPrompt += `\n${this.getStageGuidance(flow)}`;
        systemPrompt += `\nCurrent stage: ${flow.currentStage} | Topic: ${flow.topic}`;
        
        if (userState.lastMoodTrend) {
          systemPrompt += `\n${this.getMoodTrendGuidance(userState.lastMoodTrend)}`;
        }
        
        if (crisisMonitor.indicators.length > 0) {
          systemPrompt += `\n\n--- CRISIS MONITORING ---`;
          systemPrompt += `\n${this.getCrisisGuidance(crisisMonitor)}`;
        }
        
        systemPrompt += `\n\n${this.getContextualTherapeuticTools([], userState.emotionalHistory?.slice(-1)[0])}`;
        
      } else {
        // Fallback to default system prompt
        console.log('📝 Using default system prompt (no cultural context)');
        systemPrompt = this.getDefaultSystemPrompt(userName, flow, crisisMonitor, userState);
      }

      // Get recent conversation for API call (only last 5 exchanges to save tokens)
      const recentHistory = currentMessages.slice(-this.MAX_RECENT_MESSAGES * 2);
      
      console.log(`🔗 Calling backend at: ${this.backendUrl}/api/chat`);
      console.log(`📤 Sending message: ${userMessage.substring(0, 50)}...`);
      
      const response = await fetch(`${this.backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          conversationHistory: recentHistory,
          systemPrompt,
          enableWebSearch: true
        })
      });

      if (!response.ok) {
        console.error(`❌ Backend API error: ${response.status} ${response.statusText}`);
        throw new Error(`Backend API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.response) {
        // Update conversation flow based on response
        this.updateConversationFlow(userId, userMessage, data.response);
        
        return {
          response: data.response,
          metadata: data.metadata || {},
          usage: data.usage || {}
        } as any;
      }
      
      throw new Error('Invalid response from backend');

    } catch (error) {
      console.error('❌ Error generating response:', error);
      // Graceful degradation: Return fallback message
      return "I'm having trouble connecting right now, but I'm here for you. Can you tell me what's on your mind?";
    }
  }

  /**
   * ⭐ NEW METHOD: Get default system prompt (used when no cultural context available)
   */
  private getDefaultSystemPrompt(
    userName: string | null | undefined,
    flow: ConversationFlow,
    crisisMonitor: CrisisMonitor,
    userState: UserState
  ): string {
    return `You are Amani, a culturally-competent AI mental health companion specifically designed to support men on their mental health journey.

CORE IDENTITY:
- Name: Amani (means "peace" in Swahili)
- Role: Supportive mental health companion, NOT a therapist
- Tone: Warm, authentic, culturally aware, like talking to a wise older brother

COMMUNICATION STYLE:
- Use natural, conversational language
- Be empathetic and validating
- Avoid clinical jargon unless explaining something
- Reference shared cultural experiences when appropriate
- Keep responses concise but meaningful (2-4 paragraphs max)

SAFETY PROTOCOLS:
- If user expresses suicidal thoughts or self-harm, IMMEDIATELY provide crisis resources
- Crisis resources: 988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741)
- Always prioritize user safety over conversation flow

${userName ? `The user's name is ${userName}. Use it occasionally to personalize the conversation.` : ''}

${this.getStageGuidance(flow)}
Current stage: ${flow.currentStage} | Topic: ${flow.topic}

${this.getMoodTrendGuidance(userState.lastMoodTrend)}

${crisisMonitor.indicators.length > 0 ? '--- CRISIS MONITORING ---\n' + this.getCrisisGuidance(crisisMonitor) : ''}

${this.getContextualTherapeuticTools([], userState.emotionalHistory?.slice(-1)[0])}

Be real, culturally aware, and genuinely helpful. Keep it brief unless the situation demands more.`;
  }

  private updateConversationFlow(userId: string, userMessage: string, assistantResponse: string): void {
    const flow = this.getConversationFlow(userId);
    
    // Simple stage progression
    if (flow.currentStage === 'greeting') {
      flow.currentStage = 'exploration';
    }
    
    // Detect topic from message
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
      flow.topic = 'anxiety';
    } else if (lowerMessage.includes('depress') || lowerMessage.includes('sad') || lowerMessage.includes('hopeless')) {
      flow.topic = 'depression';
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('overwhelm')) {
      flow.topic = 'stress';
    } else if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) {
      flow.topic = 'work';
    } else if (lowerMessage.includes('relationship') || lowerMessage.includes('partner') || lowerMessage.includes('family')) {
      flow.topic = 'relationships';
    }
    
    // Check for crisis indicators
    const crisisKeywords = ['suicide', 'kill myself', 'want to die', 'end it all', 'self harm', 'hurt myself'];
    if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
      const monitor = this.getCrisisMonitor(userId);
      monitor.indicators.push({ indicator: 'crisis_keyword', timestamp: new Date().toISOString() });
      monitor.riskLevel = 'high';
    }
    
    this.conversationFlows.set(userId, flow);
  }

  // Method to reset conversation for a user
  public resetConversation(userId: string): void {
    this.userStates.delete(userId);
    this.conversationFlows.delete(userId);
    this.crisisMonitors.delete(userId);
    console.log(`🔄 Conversation reset for user: ${userId}`);
  }
}

export const claudeEnhancedChatbot = new ClaudeEnhancedChatbotService();