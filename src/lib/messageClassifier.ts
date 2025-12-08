// Multi-Step Message Classification Architecture
// Replaces single-pass regex with intelligent decision tree

import { modernRAG } from './modernRAG';

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-1
  context: {
    isResponseToQuestion: boolean;
    previousTopic?: string;
    emotionalIntensity?: number; // 1-10
  };
  suggestedResponse: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface ConversationContext {
  recentMessages: Array<{ role: string; content: string }>;
  userProfile?: {
    recurringTopics?: string[];
    emotionalBaseline?: string;
    previousCrises?: boolean;
  };
}

export class MessageClassifier {
  
  // Confidence thresholds for different categories
  private confidenceThresholds = {
    crisis: 0.75,        // Lower = more sensitive to crisis (can't afford to miss)
    employment: 0.85,    // Standard confidence for job/work issues
    mentalHealth: 0.80,  // Slightly lower for mental health (be supportive)
    relationship: 0.85,  // Standard confidence for relationship issues
    tech: 0.90           // Higher = only very clear tech issues (avoid false positives)
  };
  
  /**
   * Main classification method - multi-step decision tree
   */
  public classifyMessage(
    userMessage: string,
    conversationContext: ConversationContext = { recentMessages: [] }
  ): ClassificationResult {
    
    // STEP 1: CRISIS CHECK (ALWAYS FIRST - CAN'T AFFORD TO MISS)
    const crisisCheck = this.detectCrisis(userMessage, conversationContext);
    if (crisisCheck.isCrisis) {
      return {
        category: 'CRISIS',
        subcategory: crisisCheck.type,
        priority: 'URGENT',
        confidence: crisisCheck.confidence,
        context: {
          isResponseToQuestion: false,
          emotionalIntensity: 10
        },
        suggestedResponse: 'crisis_protocol'
      };
    }
    
    // STEP 2: GET CONVERSATION CONTEXT
    const lastAmaniMessage = this.getLastBotMessage(conversationContext.recentMessages);
    const isResponseToOurQuestion = this.isResponseToQuestion(userMessage, lastAmaniMessage);
    
    // STEP 3: DISAMBIGUATE COMMON AMBIGUOUS PHRASES
    const disambiguated = {
      notWorking: this.disambiguateNotWorking(userMessage, conversationContext),
      notGood: this.disambiguateDistress(userMessage, isResponseToOurQuestion),
      cantDoThis: this.disambiguateCantDoThis(userMessage, conversationContext)
    };
    
    // STEP 4: CHECK HIGH-PRIORITY CATEGORIES (IN ORDER)
    
    // Employment issues (job loss, unemployment)
    if (disambiguated.notWorking === 'EMPLOYMENT' || this.isEmploymentIssue(userMessage)) {
      return {
        category: 'EMPLOYMENT',
        subcategory: this.detectEmploymentSubcategory(userMessage),
        priority: 'HIGH',
        confidence: 0.9,
        context: {
          isResponseToQuestion: isResponseToOurQuestion.isResponse,
          emotionalIntensity: this.estimateIntensity(userMessage)
        },
        suggestedResponse: 'job_loss_support'
      };
    }
    
    // Relationship issues
    if (this.isRelationshipIssue(userMessage)) {
      return {
        category: 'RELATIONSHIP',
        subcategory: this.detectRelationshipSubcategory(userMessage),
        priority: 'HIGH',
        confidence: 0.85,
        context: {
          isResponseToQuestion: isResponseToOurQuestion.isResponse,
          emotionalIntensity: this.estimateIntensity(userMessage)
        },
        suggestedResponse: 'relationship_support'
      };
    }
    
    // Mental health symptoms (depression, anxiety)
    if (disambiguated.notGood === 'DISTRESS' || this.isMentalHealthSymptom(userMessage)) {
      const subcategory = this.detectMentalHealthSubcategory(userMessage);
      return {
        category: 'MENTAL_HEALTH',
        subcategory,
        priority: subcategory === 'severe_depression' ? 'HIGH' : 'MEDIUM',
        confidence: 0.8,
        context: {
          isResponseToQuestion: isResponseToOurQuestion.isResponse,
          emotionalIntensity: this.estimateIntensity(userMessage)
        },
        suggestedResponse: `${subcategory}_support`
      };
    }
    
    // Treatment not working
    if (disambiguated.notWorking === 'THERAPY') {
      return {
        category: 'TREATMENT_EFFECTIVENESS',
        subcategory: this.detectTreatmentType(userMessage),
        priority: 'MEDIUM',
        confidence: 0.9,
        context: {
          isResponseToQuestion: isResponseToOurQuestion.isResponse,
          emotionalIntensity: this.estimateIntensity(userMessage)
        },
        suggestedResponse: 'treatment_adjustment'
      };
    }
    
    // Self-doubt / role struggles
    if (disambiguated.cantDoThis === 'SELF_DOUBT') {
      return {
        category: 'SELF_DOUBT',
        subcategory: this.detectRoleType(userMessage),
        priority: 'MEDIUM',
        confidence: 0.85,
        context: {
          isResponseToQuestion: isResponseToOurQuestion.isResponse,
          emotionalIntensity: this.estimateIntensity(userMessage)
        },
        suggestedResponse: 'self_doubt_support'
      };
    }
    
    // Tech issues (lowest priority - most likely false positive)
    if (disambiguated.notWorking === 'TECH') {
      return {
        category: 'TECH_SUPPORT',
        subcategory: 'app_malfunction',
        priority: 'LOW',
        confidence: 0.7,
        context: {
          isResponseToQuestion: isResponseToOurQuestion.isResponse,
          emotionalIntensity: 1
        },
        suggestedResponse: 'tech_support'
      };
    }
    
    // STEP 5: GENERAL CONVERSATION
    const sentiment = this.analyzeSentiment(userMessage);
    return {
      category: 'GENERAL',
      subcategory: sentiment,
      priority: 'LOW',
      confidence: 0.5,
      context: {
        isResponseToQuestion: isResponseToOurQuestion.isResponse,
        emotionalIntensity: this.estimateIntensity(userMessage)
      },
      suggestedResponse: 'general_support'
    };
  }
  
  // ===== STEP 1: CRISIS DETECTION =====
  
  private detectCrisis(text: string, context: ConversationContext): {
    isCrisis: boolean;
    type: string;
    confidence: number;
  } {
    const patterns = modernRAG.detectPatterns(text);
    
    if (patterns.isCrisis) {
      // Determine crisis type and confidence
      const lowerText = text.toLowerCase();
      
      // CRITICAL: Preparation/Planning (Category 7) - IMMEDIATE RISK
      if (/\b(have\s+a\s+plan|set\s+a\s+date|wrote\s+goodbye|saying\s+goodbye|final\s+arrangements|gave\s+away\s+my\s+things|this\s+is\s+my\s+last\s+day)\b/i.test(text)) {
        return { isCrisis: true, type: 'suicide', confidence: 1.0 };
      }
      
      // CRITICAL: Finality language (Category 12) - IMMEDIATE RISK
      if (/\b(goodbye\s+forever|this\s+is\s+goodbye|won't\s+see\s+me\s+again|this\s+is\s+the\s+end)\b/i.test(text)) {
        return { isCrisis: true, type: 'suicide', confidence: 1.0 };
      }
      
      if (/\b(suicide|kill myself|want to die|end my life|end it all|better off dead|no reason to live|wish i was dead|going to kill myself|planning to kill myself)\b/i.test(text)) {
        return { isCrisis: true, type: 'suicide', confidence: 1.0 };
      }
      
      if (/\b(hurt myself|self harm|cutting|overdose)\b/i.test(text)) {
        return { isCrisis: true, type: 'self_harm', confidence: 1.0 };
      }
      
      // Burden beliefs (Category 4) - strong suicide predictor
      if (/\b(better\s+off\s+without\s+me|burden\s+to\s+everyone|nobody\s+would\s+miss)\b/i.test(text)) {
        return { isCrisis: true, type: 'suicide', confidence: 0.95 };
      }
      
      if (/\b(can't do this anymore|can't go on)\b/i.test(text)) {
        return { isCrisis: true, type: 'despair', confidence: 0.9 };
      }
      
      return { isCrisis: true, type: 'general_crisis', confidence: 0.85 };
    }
    
    return { isCrisis: false, type: 'none', confidence: 0 };
  }
  
  // ===== STEP 2: CONVERSATION CONTEXT =====
  
  private getLastBotMessage(messages: Array<{ role: string; content: string }>): string | null {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        return messages[i].content;
      }
    }
    return null;
  }
  
  private isResponseToQuestion(userMessage: string, lastBotMessage: string | null): {
    isResponse: boolean;
    questionType?: 'how_are_you' | 'what_happened' | 'open_ended' | 'clarification';
  } {
    if (!lastBotMessage) {
      return { isResponse: false };
    }
    
    const lastMsg = lastBotMessage.toLowerCase();
    
    // Did we ask "how are you"?
    if (/\b(how\s+are\s+you|how\s+you\s+doing|how's\s+it\s+going|feeling\s+today)\b/i.test(lastMsg)) {
      return { isResponse: true, questionType: 'how_are_you' };
    }
    
    // Did we ask "what happened" or "what's going on"?
    if (/\b(what\s+(happened|going\s+on|wrong|up)|tell\s+me\s+more)\b/i.test(lastMsg)) {
      return { isResponse: true, questionType: 'what_happened' };
    }
    
    // Did we ask any question?
    if (lastMsg.includes('?')) {
      return { isResponse: true, questionType: 'open_ended' };
    }
    
    return { isResponse: false };
  }
  
  // ===== STEP 3: DISAMBIGUATION =====
  
  private disambiguateNotWorking(text: string, context: ConversationContext): 'EMPLOYMENT' | 'TECH' | 'THERAPY' | 'NONE' {
    const lowerText = text.toLowerCase();
    
    // Check for "not working" phrase
    if (!/\b(not working|isn't working|won't work|doesn't work)\b/i.test(text)) {
      return 'NONE';
    }
    
    // Subject-based analysis
    if (/\b(i'm|i am|im|i've been)\s+not working\b/i.test(text)) {
      return 'EMPLOYMENT';
    }
    
    if (/\b(therapy|medication|treatment)\b.{0,20}(not working|isn't working)\b/i.test(text)) {
      return 'THERAPY';
    }
    
    if (/\b(app|site|website|button)\s+(is\s+)?(not working|broken)\b/i.test(text)) {
      return 'TECH';
    }
    
    // Context-based fallback
    const hasEmploymentWords = /\b(job|career|wife|family|burden|money)\b/i.test(text);
    const hasTechWords = /\b(app|site|website|login|browser)\b/i.test(text);
    
    if (hasEmploymentWords && !hasTechWords) return 'EMPLOYMENT';
    if (hasTechWords && !hasEmploymentWords) return 'TECH';
    if (hasEmploymentWords) return 'EMPLOYMENT'; // Employment wins
    
    return 'NONE';
  }
  
  private disambiguateDistress(text: string, isResponse: { isResponse: boolean; questionType?: string }): 'DISTRESS' | 'CASUAL' | 'UNCLEAR' {
    const distressWords = /\b(not\s+(good|great|well|okay|ok)|terrible|awful|struggling|rough|hard|tough)\b/i;
    
    if (!distressWords.test(text)) {
      return 'UNCLEAR';
    }
    
    // If responding to "how are you", it's definitely distress
    if (isResponse.isResponse && isResponse.questionType === 'how_are_you') {
      return 'DISTRESS';
    }
    
    // Short message with distress words = likely distress
    const wordCount = text.split(/\s+/).length;
    if (wordCount <= 5 && distressWords.test(text)) {
      return 'DISTRESS';
    }
    
    // Longer context needed
    return 'UNCLEAR';
  }
  
  private disambiguateCantDoThis(text: string, context: ConversationContext): 'CRISIS' | 'TASK' | 'SELF_DOUBT' | 'NONE' {
    if (!/\b(can't|cannot)\b/i.test(text)) {
      return 'NONE';
    }
    
    // Crisis indicators with "can't"
    if (/\b(can't|cannot)\s+(do\s+this|go\s+on|take\s+it)\s+(anymore|any\s+more)\b/i.test(text)) {
      return 'CRISIS';
    }
    
    if (/\b(can't|cannot)\s+go\s+on\b/i.test(text)) {
      return 'CRISIS';
    }
    
    // Role/identity struggles
    if (/\b(can't|cannot)\s+(be|handle)\s+(a\s+)?(good|better|enough)\b/i.test(text)) {
      return 'SELF_DOUBT';
    }
    
    if (/\b(can't|cannot)\s+(be|handle|do)\s+(this|a|my|the)\s+(job|relationship|father|parent)\b/i.test(text)) {
      return 'SELF_DOUBT';
    }
    
    // Task-specific
    if (/\b(can't|cannot)\s+(do|figure|solve)\s+(this|that|it)\s+(task|assignment|problem)\b/i.test(text)) {
      return 'TASK';
    }
    
    return 'NONE';
  }
  
  // ===== STEP 4: CATEGORY DETECTION =====
  
  private isEmploymentIssue(text: string): boolean {
    const patterns = modernRAG.detectPatterns(text);
    return patterns.isJobLoss || patterns.isWorkplace || patterns.isFinancial;
  }
  
  private isRelationshipIssue(text: string): boolean {
    const patterns = modernRAG.detectPatterns(text);
    return patterns.isRelationship || patterns.isFatherhood;
  }
  
  private isMentalHealthSymptom(text: string): boolean {
    const patterns = modernRAG.detectPatterns(text);
    return patterns.isDepression || patterns.isAnxiety || patterns.isTrauma || 
           patterns.isParanoia || patterns.isSelfEsteem || patterns.isLoneliness;
  }
  
  private isTechIssue(text: string, disambiguated: any): boolean {
    return disambiguated.notWorking === 'TECH';
  }
  
  // ===== SUBCATEGORY DETECTION =====
  
  private detectEmploymentSubcategory(text: string): string {
    const lower = text.toLowerCase();
    
    if (/\b(laid off|fired|terminated|lost my job)\b/i.test(text)) return 'job_loss';
    if (/\b(burden|guilty|worthless|failure)\b/i.test(text)) return 'job_loss_emotional';
    if (/\b(looking for|job search|interview|resume)\b/i.test(text)) return 'job_seeking';
    if (/\b(financial|money|bills|can't afford)\b/i.test(text)) return 'financial_stress';
    if (/\b(boss|colleague|workplace|office)\b/i.test(text)) return 'workplace_conflict';
    
    return 'general_employment';
  }
  
  private detectRelationshipSubcategory(text: string): string {
    const lower = text.toLowerCase();
    
    if (/\b(cheating|affair|infidelity|unfaithful)\b/i.test(text)) return 'infidelity';
    if (/\b(breakup|break up|divorce|split)\b/i.test(text)) return 'breakup';
    if (/\b(argument|fight|fighting|conflict)\b/i.test(text)) return 'conflict';
    if (/\b(distance|distant|disconnected|growing apart)\b/i.test(text)) return 'emotional_distance';
    if (/\b(father|dad|child|children|parenting)\b/i.test(text)) return 'fatherhood';
    
    return 'general_relationship';
  }
  
  private detectMentalHealthSubcategory(text: string): string {
    const patterns = modernRAG.detectPatterns(text);
    
    // Check severity for depression
    if (patterns.isDepression) {
      if (/\b(hopeless|worthless|suicide|die|end it)\b/i.test(text)) {
        return 'severe_depression';
      }
      if (/\b(can't get out of bed|no energy|empty|numb)\b/i.test(text)) {
        return 'moderate_depression';
      }
      return 'mild_depression';
    }
    
    if (patterns.isAnxiety) {
      if (/\b(panic|panic attack|can't breathe|racing)\b/i.test(text)) {
        return 'severe_anxiety';
      }
      return 'general_anxiety';
    }
    
    if (patterns.isTrauma) return 'trauma';
    if (patterns.isParanoia) return 'paranoia';
    if (patterns.isSelfEsteem) return 'self_esteem';
    if (patterns.isLoneliness) return 'loneliness';
    
    return 'general_mental_health';
  }
  
  private detectTreatmentType(text: string): string {
    if (/\b(medication|meds|antidepressant|pills)\b/i.test(text)) return 'medication';
    if (/\b(therapy|therapist|counseling)\b/i.test(text)) return 'therapy';
    if (/\b(coping|strategy|technique|exercise)\b/i.test(text)) return 'coping_strategy';
    return 'general_treatment';
  }
  
  private detectRoleType(text: string): string {
    if (/\b(father|dad|parent|parenting)\b/i.test(text)) return 'fatherhood';
    if (/\b(relationship|partner|husband|wife)\b/i.test(text)) return 'partnership';
    if (/\b(job|career|work)\b/i.test(text)) return 'professional';
    if (/\b(friend|friendship)\b/i.test(text)) return 'friendship';
    return 'general_role';
  }
  
  // ===== CONFIDENCE THRESHOLD CHECKING =====
  
  /**
   * Check if classification confidence meets the threshold for its category
   */
  private meetsConfidenceThreshold(category: string, confidence: number): boolean {
    const thresholds = this.confidenceThresholds;
    
    switch (category) {
      case 'CRISIS':
        return confidence >= thresholds.crisis;
      case 'EMPLOYMENT':
        return confidence >= thresholds.employment;
      case 'MENTAL_HEALTH':
        return confidence >= thresholds.mentalHealth;
      case 'RELATIONSHIP':
        return confidence >= thresholds.relationship;
      case 'TECH_ISSUE':
      case 'TECH_SUPPORT':
        return confidence >= thresholds.tech;
      default:
        return confidence >= 0.7; // General threshold
    }
  }
  
  /**
   * Get clarifying question when confidence is too low
   */
  private getClarifyingQuestion(category: string, confidence: number): string {
    if (!this.meetsConfidenceThreshold(category, confidence)) {
      return "Can you tell me more about what you mean by that? I want to make sure I understand you correctly.";
    }
    return '';
  }
  
  // ===== STEP 5: SENTIMENT ANALYSIS =====
  
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = /\b(good|great|better|happy|excited|grateful|thankful)\b/i;
    const negativeWords = /\b(bad|sad|terrible|awful|depressed|anxious|worried|stressed)\b/i;
    
    if (positiveWords.test(text) && !negativeWords.test(text)) return 'positive';
    if (negativeWords.test(text)) return 'negative';
    return 'neutral';
  }
  
  // ===== UTILITIES =====
  
  private estimateIntensity(text: string): number {
    const intensityMarkers = {
      'extremely': 10,
      'very': 9,
      'really': 8,
      'so': 7,
      'quite': 6,
      'somewhat': 4,
      'a bit': 3,
      'slightly': 2
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [marker, intensity] of Object.entries(intensityMarkers)) {
      if (lowerText.includes(marker)) {
        return intensity;
      }
    }
    
    // Check for crisis words = high intensity
    if (/\b(suicide|kill|die|end it|can't take it)\b/i.test(text)) {
      return 10;
    }
    
    // Default moderate intensity
    return 5;
  }
}

export const messageClassifier = new MessageClassifier();

