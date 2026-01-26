// CommonJS Wrapper for Mental Health Chatbot
// Bridges ES modules (lib/) with CommonJS (backend/)

const Anthropic = require('@anthropic-ai/sdk');
const { queueClassification, queueCrisis, queueEngagement, getBatchProcessor } = require('./batchAnalytics.js');
const { findResources } = require('./smartResourceMatcher.js');
const { getFeedbackOptions } = require('./feedbackCollector.js');
const { getCrisisManager } = require('./crisisEscalation.js');

class MentalHealthChatbot {
  constructor(anthropicClient) {
    this.anthropic = anthropicClient;
    this.sessions = new Map();
    
    // Initialize batch analytics processor
    this.analyticsProcessor = getBatchProcessor({
      maxBatchSize: 10,      // Process every 10 events
      maxWaitTime: 5000,     // Or every 5 seconds
      retryAttempts: 3
    });
    
    console.log('✅ Batch analytics processor initialized');
  }

  /**
   * Process user message with userId and sessionId
   * This is the main API method matching your desired interface
   */
  async processMessage(userId, sessionId, message) {
    const startTime = Date.now();
    
    try {
      console.log(`\n🔍 Processing message for user ${userId}, session ${sessionId}`);
      console.log(`   Message: "${message.substring(0, 50)}..."`);
      
      // Get or create session
      const sessionKey = `${userId}_${sessionId}`;
      if (!this.sessions.has(sessionKey)) {
        this.sessions.set(sessionKey, {
          userId,
          sessionId,
          conversationHistory: [],
          startedAt: new Date(),
          messageCount: 0
        });
      }
      
      const session = this.sessions.get(sessionKey);
      session.messageCount++;
      
      // Step 1: Quick crisis check (regex - instant, free)
      const crisisCheck = this.checkCrisis(message);
      if (crisisCheck.isCrisis) {
        // Use crisis escalation manager
        const crisisManager = getCrisisManager();
        const crisisSeverity = crisisManager.detectCrisisSeverity(message, { category: 'CRISIS' });
        
        let response;
        let crisisLevel = 'severe';
        let crisisPriority = 1;
        let crisisActions = [];
        let humanAlertSent = false;
        
        if (crisisSeverity) {
          // Execute crisis response protocol
          const crisisResponse = await crisisManager.executeCrisisResponse(
            userId,
            sessionId,
            message,
            crisisSeverity
          );
          
          // Generate appropriate crisis message
          const crisisMessage = crisisManager.generateCrisisResponse(crisisSeverity);
          response = crisisMessage.response;
          crisisLevel = crisisSeverity.level;
          crisisPriority = crisisSeverity.priority;
          crisisActions = crisisResponse.actions;
          humanAlertSent = crisisResponse.humanAlertSent;
        } else {
          // Fallback to original crisis response
          response = this.getCrisisResponse();
        }
        
        const processingTime = Date.now() - startTime;
        
        // Log to session
        session.conversationHistory.push(
          { role: 'user', content: message, timestamp: new Date() },
          { role: 'assistant', content: response, timestamp: new Date(), classification: crisisCheck }
        );
        
        // Queue analytics (BATCHED - not immediate)
        queueCrisis(userId, sessionId, {
          severity: 10,
          level: crisisLevel,
          priority: crisisPriority,
          indicators: ['suicidal_language', 'self_harm'],
          responseProvided: 'crisis_hotline',
          escalated: true,
          actionsExecuted: crisisActions,
          humanAlertSent: humanAlertSent
        });
        
        queueClassification(userId, sessionId, {
          category: 'CRISIS',
          subcategory: 'suicide',
          confidence: 1.0,
          method: 'escalation_protocol',
          emotionalIntensity: 10,
          responseTime: processingTime,
          crisisLevel: crisisLevel,
          crisisPriority: crisisPriority
        });
        
        return {
          response: response,
          classification: {
            category: 'CRISIS',
            subcategory: 'suicide',
            confidence: 1.0,
            emotional_intensity: 10,
            method: 'escalation_protocol',
            crisisLevel: crisisLevel,
            crisisPriority: crisisPriority,
            humanAlertSent: humanAlertSent
          },
          session: {
            userId,
            sessionId,
            messageCount: session.messageCount
          },
          metadata: {
            timestamp: new Date().toISOString(),
            processingTime: processingTime,
            method: 'escalation_protocol',
            crisisActionsExecuted: crisisActions.length
          }
        };
      }
      
      // Step 2: Check if it's a clear case (regex - fast and free)
      const clearCase = this.checkClearCases(message);
      
      let classification, response;
      
      if (clearCase) {
        // Use regex classification (instant, free)
        classification = clearCase;
        response = this.generateResponse(classification, message);
        console.log(`   ⚡ Classified with regex: ${classification.category} (free)`);
      } else {
        // Step 3: Build classification prompt with conversation context
        const recentContext = session.conversationHistory
          .slice(-6) // Last 3 exchanges
          .map(msg => `${msg.role === 'user' ? 'User' : 'Amani'}: ${msg.content}`)
          .join('\n');
        
        const classificationPrompt = this.buildClassificationPrompt(message, recentContext);
        
        // Step 4: Call Claude for ambiguous classification (WITH CACHING!)
        console.log('   🧠 Calling Claude for classification...');
        const classificationResponse = await this.anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929", // Claude 3.5 Sonnet - most capable model
          max_tokens: 500,
          temperature: 0.3,
          system: [{
            type: "text",
            text: this.getClassificationSystemPrompt(), // CACHED! Same for all calls
            cache_control: { type: "ephemeral" }
          }],
          messages: [{ role: "user", content: classificationPrompt }]
        });
        
        // Log cache performance
        if (classificationResponse.usage?.cache_read_input_tokens) {
          const cacheHitRate = (classificationResponse.usage.cache_read_input_tokens / 
            (classificationResponse.usage.cache_read_input_tokens + classificationResponse.usage.input_tokens)) * 100;
          console.log(`   💰 Cache hit: ${cacheHitRate.toFixed(0)}% (saved ~${classificationResponse.usage.cache_read_input_tokens} tokens)`);
        }
        
        // Extract JSON from response (Claude sometimes wraps in ```json ... ```)
        let responseText = classificationResponse.content[0].text;
        const jsonMatch = responseText.match(/```json\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          responseText = jsonMatch[1];
        }
        
        classification = JSON.parse(responseText.trim());
        classification.method = 'claude';
        
        console.log(`   ✅ Classified as: ${classification.category} (${classification.confidence})`);
        
        // Step 5: Generate contextual response based on classification
        response = this.generateResponse(classification, message);
      }
      
      // Step 5: Store in session history
      session.conversationHistory.push(
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date(), classification }
      );
      
      // Keep history manageable
      if (session.conversationHistory.length > 40) {
        session.conversationHistory = session.conversationHistory.slice(-40);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Queue analytics (BATCHED - efficient!)
      queueClassification(userId, sessionId, {
        category: classification.category,
        subcategory: classification.subcategory,
        confidence: classification.confidence || 0.9,
        method: classification.method || 'claude',
        ambiguousPhrase: classification.ambiguous_phrase,
        emotionalIntensity: classification.emotional_intensity || 5,
        responseTime: processingTime
      });
      
      // Match relevant resources (FAST - pre-indexed!)
      const recommendedResources = findResources({
        category: classification.category,
        subcategory: classification.subcategory,
        emotional_intensity: classification.emotional_intensity,
        cultural_context: false // Can be enhanced based on user profile
      }, 3); // Top 3 resources
      
      // Generate unique message ID for feedback tracking
      const messageId = `msg_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Build response object
      const responseObject = {
        message_id: messageId,
        response: response,
        classification: {
          category: classification.category,
          subcategory: classification.subcategory || null,
          confidence: classification.confidence || 0.9,
          emotional_intensity: classification.emotional_intensity || 5,
          ambiguous_phrase: classification.ambiguous_phrase || null,
          disambiguation: classification.disambiguation || null,
          reasoning: classification.reasoning || 'Classification completed',
          method: classification.method || 'claude'
        },
        session: {
          userId: userId,
          sessionId: sessionId,
          messageCount: session.messageCount,
          conversationLength: Math.floor(session.conversationHistory.length / 2)
        },
        recommended_resources: recommendedResources.map(match => ({
          id: match.resource.id,
          title: match.resource.title,
          description: match.resource.description,
          type: match.resource.type,
          url: match.resource.url,
          phone: match.resource.phone,
          relevanceScore: match.relevanceScore,
          reason: match.reason
        })),
        feedback_options: getFeedbackOptions(),
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: processingTime,
          method: 'claude',
          cost_estimate: 0.002, // approximate
          resources_matched: recommendedResources.length
        }
      };
      
      console.log(`✅ Response generated in ${processingTime}ms`);
      
      return responseObject;
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      return {
        response: "I'm having trouble right now. Please try again.",
        error: {
          message: error.message,
          code: 'PROCESSING_ERROR'
        },
        session: {
          userId,
          sessionId
        },
        metadata: {
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          error: true
        }
      };
    }
  }
  
  // Crisis detection (regex - instant)
  checkCrisis(text) {
    const crisisPatterns = [
      /\b(suicid|kill myself|end it all|want to die|better off dead|rather be dead)\b/i,
      /\b(hurt myself|self harm|cutting)\b/i,
      /\b(can't do this anymore|can't go on|can't take it anymore)\b/i,
      /\b(don't want to (be here|live)|done with life|no reason to live|not worth living)\b/i,
      /\b(end my life|take my life|ending it)\b/i
    ];
    
    const isCrisis = crisisPatterns.some(pattern => pattern.test(text));
    return { isCrisis };
  }
  
  // Normalize slang and acronyms to standard English for better classification
  normalizeSlangAndAcronyms(text) {
    const slangMap = {
      // Common acronyms
      'brb': 'be right back',
      'lol': 'laughing',
      'idk': "i don't know",
      'idc': "i don't care",
      'smh': 'shaking my head',
      'tbh': 'to be honest',
      'imho': 'in my opinion',
      'imo': 'in my opinion',
      'fml': 'fuck my life', // frustration indicator
      'wtf': 'what the fuck', // confusion/frustration
      'nvm': 'never mind',
      'nm': 'nothing much',
      'ily': 'i love you',
      'hbd': 'happy birthday',
      'yolo': 'you only live once',
      'fomo': 'fear of missing out',
      
      // Urban slang (culturally relevant)
      'bet': 'okay agreed',
      'cap': 'lie',
      'no cap': 'no lie honestly',
      'deadass': 'seriously honestly',
      'lowkey': 'kind of secretly',
      'highkey': 'obviously very',
      'sus': 'suspicious',
      'lit': 'exciting great',
      'vibing': 'relaxing feeling good',
      'salty': 'upset bitter',
      'ghost': 'ignore disappear',
      'ghosting': 'ignoring',
      'shade': 'disrespect insult',
      'throwing shade': 'insulting',
      'tea': 'gossip drama',
      'spill the tea': 'tell me',
      'extra': 'over the top',
      'goat': 'greatest of all time',
      'w': 'win',
      'l': 'loss',
      'fam': 'friend brother',
      'bruh': 'bro dude',
      'bro': 'brother friend',
      'mood': 'i relate'
    };
    
    let normalized = text.toLowerCase();
    
    // Replace slang/acronyms with standard English
    for (const [slang, standard] of Object.entries(slangMap)) {
      const regex = new RegExp(`\\b${slang}\\b`, 'gi');
      normalized = normalized.replace(regex, standard);
    }
    
    return normalized;
  }
  
  // Check for clear cases (regex - fast, free, 80% of messages)
  checkClearCases(text) {
    // Normalize slang first for better detection
    const normalized = this.normalizeSlangAndAcronyms(text);
    
    // ⚠️ CRITICAL: Check if message contains crisis language FIRST
    // If it does, skip all other classifications and let crisis handler take over
    const hasCrisisLanguage = /\b(suicid|kill myself|end it all|want to die|better off dead|rather be dead|hurt myself|self harm|cutting|end my life|take my life|no reason to live|not worth living)\b/i.test(normalized);
    if (hasCrisisLanguage) {
      // Return null to force crisis check in main flow
      return null;
    }
    
    // Clear employment (explicit job loss)
    if (/\b(laid off|fired|terminated|lost my job|unemployed|jobless)\b/i.test(normalized)) {
      return {
        category: 'EMPLOYMENT',
        subcategory: 'job_loss',
        confidence: 0.95,
        emotional_intensity: 7,
        method: 'regex',
        reasoning: 'Explicit job loss language detected'
      };
    }
    
    // Clear relationship (explicit infidelity/breakup)
    if (/\b(girlfriend|boyfriend|wife|husband)\s+(is\s+)?(cheating|cheated)\b/i.test(normalized)) {
      return {
        category: 'RELATIONSHIP',
        subcategory: 'infidelity',
        confidence: 0.95,
        emotional_intensity: 9,
        method: 'regex',
        reasoning: 'Explicit infidelity mentioned'
      };
    }
    
    // Clear tech (explicit errors)
    if (/\b(error|bug|crash|glitch|freeze|frozen)\b/i.test(normalized)) {
      return {
        category: 'TECH_ISSUE',
        subcategory: 'app_error',
        confidence: 0.9,
        emotional_intensity: 2,
        method: 'regex',
        reasoning: 'Technical error mentioned'
      };
    }
    
    // Clear greetings (check original text for exact match)
    if (/^(hi|hello|hey|sup|what's up|good morning|good afternoon|yo|wassup)[\s!?.]*$/i.test(text)) {
      return {
        category: 'GENERAL',
        subcategory: 'greeting',
        confidence: 0.95,
        emotional_intensity: 3,
        method: 'regex',
        reasoning: 'Simple greeting detected'
      };
    }
    
    // Not a clear case - needs Claude
    return null;
  }
  
  // Crisis response
  getCrisisResponse() {
    return `🚨 CRISIS SUPPORT NEEDED 🚨

I'm very concerned about you right now. Your life has value and you don't have to go through this alone.

IMMEDIATE HELP:
📞 988 Suicide & Crisis Lifeline: Call or text 988
📱 Crisis Text Line: Text HOME to 741741  
🆘 Emergency Services: Call 911

You matter, and there are people who want to help you through this. Can you reach out to one of these resources right now?`;
  }
  
  /**
   * Get classification system prompt (CACHED to save 90% on tokens)
   * This prompt is the same for every classification call, so we cache it.
   */
  getClassificationSystemPrompt() {
    return `You are a mental health AI assistant specializing in message classification for men seeking mental health support.

**Categories:**
1. CRISIS - Suicidal thoughts, self-harm, immediate danger
2. EMPLOYMENT - Job loss, unemployment, workplace stress, career issues
3. RELATIONSHIP - Partner issues, family conflict, infidelity, dating
4. MENTAL_HEALTH - Depression, anxiety, emotional distress, trauma
5. IDENTITY - Race, masculinity, code-switching, cultural stigma, microaggressions
6. TECH_ISSUE - App malfunction, login problems, technical errors
7. GENERAL - Casual conversation, greetings, simple questions

**Slang & Acronym Understanding:**
Messages are pre-processed to normalize slang/acronyms. You'll receive:
- "idk" → "i don't know" (uncertainty/confusion)
- "tbh" → "to be honest" (candid admission)
- "fml" → "fuck my life" (frustration/distress)
- "no cap" → "no lie honestly" (emphasis/sincerity)
- "deadass" → "seriously honestly" (emphasis)
- "lowkey" → "kind of secretly" (understated feeling)
- "salty" → "upset bitter" (negative emotion)
- "ghosting" → "ignoring" (relationship issue)
- "vibing" → "relaxing feeling good" (positive state)
- "bruh/fam/bro" → "brother friend" (casual address)

**Critical Disambiguation Rules:**
- "I'm not working" + (wife/burden/money/bills) → EMPLOYMENT (job loss context)
- "therapy not working" → MENTAL_HEALTH (treatment effectiveness)
- "app not working" → TECH_ISSUE (technical problem)
- After "How are you?" + "not good/bad/terrible" → MENTAL_HEALTH (emotional check-in)
- "can't do this anymore" → CRISIS ⚠️ (immediate danger)
- "can't figure this out" → GENERAL (problem-solving)
- "not working" + (relationship/marriage context) → RELATIONSHIP
- Microaggressions, stereotypes, racial issues → IDENTITY

**Cultural Competency:**
- Recognize "angry Black man" stereotype
- Identify microaggressions (hair touching, "articulate", othering)
- Detect code-switching exhaustion
- Acknowledge cultural tax and tokenization
- Only mention race if user explicitly brings it up

**Response Format (JSON ONLY):**
{
  "category": "EMPLOYMENT",
  "subcategory": "job_loss",
  "confidence": 0.95,
  "reasoning": "User explicitly mentioned being laid off",
  "ambiguous_phrase": null,
  "disambiguation": null,
  "emotional_intensity": 8
}`;
  }

  /**
   * Build classification prompt with user message and context
   * This changes for every call (user message + conversation context)
   */
  buildClassificationPrompt(message, context) {
    return `**Current User Message:**
"${message}"

**Recent Conversation Context:**
${context || 'No previous conversation'}

**Your Task:**
Classify this message using the rules from your system prompt. Respond with ONLY valid JSON.`;
  }
  
  // Generate response based on classification
  generateResponse(classification, message) {
    const { category, subcategory, emotional_intensity } = classification;
    
    switch (category) {
      case 'CRISIS':
        return this.getCrisisResponse();
        
      case 'EMPLOYMENT':
        // Check for job loss specifically
        if (subcategory === 'job_loss' || subcategory === 'feeling_like_burden' || subcategory === 'laid_off' || subcategory === 'unemployment') {
          return `I'm really sorry to hear about your job loss. That's incredibly tough, and it's understandable to feel stressed and worried about how this impacts your family.

Losing a job isn't just about money—it can shake your sense of identity and worth, especially when you feel responsible for providing. What you're experiencing is valid.

How are you holding up with all of this?`;
        }
        
        // For general employment stress
        if (emotional_intensity >= 7) {
          return `Work challenges can be overwhelming, especially when they're affecting other parts of your life. 

What's been weighing on you most?`;
        }
        
        return `Work situations can be really stressful. What's going on with work for you?`;
        
      case 'RELATIONSHIP':
        if (subcategory === 'infidelity') {
          return `That kind of betrayal cuts deep. Trust is everything in a relationship, and when it's broken, it shakes your whole world.

How are you processing this right now?`;
        }
        return `Relationship struggles can feel isolating. What's been going on?`;
        
      case 'MENTAL_HEALTH':
        // Check for specific mental health conditions mentioned
        const messageLower = message.toLowerCase();
        
        // Anxiety-specific response
        if (subcategory === 'anxiety' || /\b(anxiety|anxious|panic|worried|stress)\b/i.test(message)) {
          return `Anxiety can feel overwhelming, like your mind is racing and you can't slow it down. It's real, and it's tough.

What's been triggering these feelings for you?`;
        }
        
        // Depression-specific response
        if (subcategory === 'depression' || /\b(depress|sad|hopeless|empty|numb)\b/i.test(message)) {
          return `Depression can make everything feel heavy and exhausting. Even getting through the day can feel like too much.

You're not alone in this. What's been weighing on you most?`;
        }
        
        // Trauma/PTSD response
        if (subcategory === 'trauma' || subcategory === 'ptsd' || /\b(trauma|ptsd|flashback|triggered)\b/i.test(message)) {
          return `Trauma can leave deep wounds that don't always heal easily. What you're experiencing is a natural response to something difficult.

How are you coping with these feelings?`;
        }
        
        // High emotional intensity (general)
        if (emotional_intensity >= 8) {
          return `What you're going through sounds really tough. These feelings are real and valid.

You're not alone in this. What's been weighing on you most?`;
        }
        
        // General mental health response
        return `It sounds like you're going through something difficult. Want to talk about what's been going on?`;
        
      case 'TECH_ISSUE':
        return `Sorry about that! Can you tell me what went wrong? I'll do my best to help.`;
        
      case 'GENERAL':
      default:
        return `I'm here to listen. What's on your mind?`;
    }
  }
  
  // Session management methods
  getSessionCount() {
    return this.sessions.size;
  }
  
  clearAllSessions() {
    this.sessions.clear();
  }
}

module.exports = { MentalHealthChatbot };

