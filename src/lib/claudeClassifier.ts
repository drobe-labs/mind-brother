// Claude-Powered Message Classification
// Uses Claude's intelligence for disambiguation instead of brittle regex

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface ClaudeClassificationResult {
  category: 'CRISIS' | 'EMPLOYMENT' | 'RELATIONSHIP' | 'MENTAL_HEALTH' | 'TECH_ISSUE' | 'GENERAL';
  subcategory?: string;
  confidence: number; // 0-1
  reasoning: string;
  ambiguous_phrase?: string;
  disambiguation?: string;
  emotional_intensity?: number; // 1-10
  suggested_response?: string;
  method?: string; // 'claude' | 'fallback'
}

export interface ValidationError {
  field: string;
  error: string;
  value?: any;
}

export interface ConversationContext {
  recentMessages: Array<{ role: string; content: string }>;
  userProfile?: {
    recurringTopics?: string[];
    emotionalBaseline?: string;
  };
}

/**
 * Validate Claude's response structure and values
 */
function validateClaudeResponse(response: any, userMessage: string): {
  isValid: boolean;
  errors: ValidationError[];
  sanitized?: ClaudeClassificationResult;
} {
  const errors: ValidationError[] = [];
  
  // Check if response exists
  if (!response || typeof response !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'response', error: 'Response is null or not an object' }]
    };
  }
  
  // Validate category (REQUIRED)
  const validCategories = ['CRISIS', 'EMPLOYMENT', 'RELATIONSHIP', 'MENTAL_HEALTH', 'TECH_ISSUE', 'GENERAL'];
  if (!response.category) {
    errors.push({ field: 'category', error: 'Missing required field', value: response.category });
  } else if (!validCategories.includes(response.category)) {
    errors.push({ 
      field: 'category', 
      error: `Invalid category. Must be one of: ${validCategories.join(', ')}`, 
      value: response.category 
    });
  }
  
  // Validate confidence (REQUIRED)
  if (response.confidence === undefined || response.confidence === null) {
    errors.push({ field: 'confidence', error: 'Missing required field', value: response.confidence });
  } else if (typeof response.confidence !== 'number') {
    errors.push({ field: 'confidence', error: 'Must be a number', value: response.confidence });
  } else if (response.confidence < 0 || response.confidence > 1) {
    errors.push({ field: 'confidence', error: 'Must be between 0 and 1', value: response.confidence });
  }
  
  // Validate reasoning (REQUIRED)
  if (!response.reasoning || typeof response.reasoning !== 'string') {
    errors.push({ field: 'reasoning', error: 'Missing or invalid reasoning', value: response.reasoning });
  }
  
  // Validate emotional_intensity (OPTIONAL)
  if (response.emotional_intensity !== undefined) {
    if (typeof response.emotional_intensity !== 'number') {
      errors.push({ field: 'emotional_intensity', error: 'Must be a number', value: response.emotional_intensity });
    } else if (response.emotional_intensity < 1 || response.emotional_intensity > 10) {
      errors.push({ field: 'emotional_intensity', error: 'Must be between 1 and 10', value: response.emotional_intensity });
    }
  }
  
  // If there are errors, return invalid
  if (errors.length > 0) {
    console.error('❌ Claude response validation failed:', errors);
    return { isValid: false, errors };
  }
  
  // Sanitize and return valid response
  const sanitized: ClaudeClassificationResult = {
    category: response.category,
    subcategory: response.subcategory || undefined,
    confidence: Math.min(Math.max(response.confidence, 0), 1), // Clamp to [0, 1]
    reasoning: response.reasoning,
    ambiguous_phrase: response.ambiguous_phrase || undefined,
    disambiguation: response.disambiguation || undefined,
    emotional_intensity: response.emotional_intensity 
      ? Math.min(Math.max(Math.round(response.emotional_intensity), 1), 10) // Clamp to [1, 10]
      : undefined,
    suggested_response: response.suggested_response || undefined,
    method: 'claude'
  };
  
  return { isValid: true, errors: [], sanitized };
}

/**
 * Create fallback classification when Claude fails
 */
function createFallbackClassification(
  userMessage: string,
  error: string
): ClaudeClassificationResult {
  console.warn('⚠️  Using fallback classification due to:', error);
  
  // Use simple regex for basic fallback
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for crisis (ALWAYS highest priority)
  if (/\b(suicide|suicidal|kill myself|end it all|can't do this anymore|want to die)\b/i.test(lowerMessage)) {
    return {
      category: 'CRISIS',
      subcategory: 'unknown',
      confidence: 0.9,
      reasoning: 'Fallback: Crisis keywords detected',
      method: 'fallback',
      emotional_intensity: 10
    };
  }
  
  // Check for employment
  if (/\b(laid off|fired|job loss|unemployed|not working|burden)\b/i.test(lowerMessage)) {
    return {
      category: 'EMPLOYMENT',
      subcategory: 'unknown',
      confidence: 0.7,
      reasoning: 'Fallback: Employment keywords detected',
      method: 'fallback',
      emotional_intensity: 6
    };
  }
  
  // Check for mental health
  if (/\b(depressed|anxiety|anxious|sad|hopeless|stressed)\b/i.test(lowerMessage)) {
    return {
      category: 'MENTAL_HEALTH',
      subcategory: 'unknown',
      confidence: 0.7,
      reasoning: 'Fallback: Mental health keywords detected',
      method: 'fallback',
      emotional_intensity: 6
    };
  }
  
  // Check for tech issue
  if (/\b(error|bug|crash|broken|not loading|can't access)\b/i.test(lowerMessage)) {
    return {
      category: 'TECH_ISSUE',
      subcategory: 'unknown',
      confidence: 0.7,
      reasoning: 'Fallback: Tech keywords detected',
      method: 'fallback',
      emotional_intensity: 3
    };
  }
  
  // Default to GENERAL with low confidence
  return {
    category: 'GENERAL',
    subcategory: 'unknown',
    confidence: 0.5,
    reasoning: 'Fallback: No specific keywords detected',
    method: 'fallback',
    emotional_intensity: 5
  };
}

/**
 * Use Claude to intelligently classify user messages
 * This is MUCH better than regex for handling ambiguity
 * Now with comprehensive validation and fallback
 */
export async function classifyWithClaude(
  userMessage: string,
  context: ConversationContext = { recentMessages: [] }
): Promise<ClaudeClassificationResult> {
  
  // Build conversation context string
  const recentContext = context.recentMessages
    .slice(-3) // Last 3 messages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Amani'}: ${msg.content}`)
    .join('\n');
  
  const userProfileContext = context.userProfile 
    ? `User's recurring topics: ${context.userProfile.recurringTopics?.join(', ') || 'none yet'}`
    : '';
  
  // Build classification prompt
  const classificationPrompt = `You are a mental health AI assistant analyzing user messages to determine their primary concern.

**Current User Message:**
"${userMessage}"

**Recent Conversation Context:**
${recentContext || 'No previous conversation'}

${userProfileContext}

**Your Task:**
Classify this message into ONE primary category. Pay special attention to ambiguous phrases that could have multiple meanings.

**Categories:**
1. **CRISIS** - Suicidal thoughts, self-harm, immediate danger to self or others
   - Subcategories: suicide, self_harm, despair, abuse
   
2. **EMPLOYMENT** - Job loss, unemployment, career stress, financial pressure from lack of work
   - Subcategories: job_loss, job_seeking, financial_stress, workplace_conflict, feeling_like_burden
   
3. **RELATIONSHIP** - Partner issues, family conflict, infidelity, breakup, parenting struggles
   - Subcategories: infidelity, breakup, conflict, emotional_distance, fatherhood
   
4. **MENTAL_HEALTH** - Depression, anxiety, trauma, paranoia, emotional distress
   - Subcategories: severe_depression, moderate_depression, anxiety, trauma, paranoia, self_esteem
   
5. **TECH_ISSUE** - App malfunction, login problems, technical errors
   - Subcategories: app_error, login_issue, feature_broken
   
6. **GENERAL** - Casual conversation, greetings, check-ins, positive updates
   - Subcategories: greeting, positive, casual, gratitude

**Critical Disambiguation Rules:**

🔴 **"not working" detection:**
- "I'm not working" / "I haven't been working" → EMPLOYMENT (personal status)
- "therapy's not working" / "medication isn't working" → MENTAL_HEALTH (treatment ineffective)
- "the app is not working" / "login won't work" → TECH_ISSUE (system malfunction)
- Context clues: wife, burden, money, bills → EMPLOYMENT
- Context clues: button, screen, error, login → TECH_ISSUE

🔴 **"not good" / "not well" detection:**
- After "How are you feeling?" question → MENTAL_HEALTH (distress response)
- With emotional context (sad, depressed, struggling) → MENTAL_HEALTH
- Casual standalone "not bad" → GENERAL
- Short message under 5 words → likely MENTAL_HEALTH if negative

🔴 **"can't do this" detection:**
- "can't do this anymore" / "can't go on" → CRISIS (despair/suicide risk)
- "can't be a good father/partner/husband" → RELATIONSHIP or MENTAL_HEALTH (self-doubt about role)
- "can't figure this out" / "can't solve this problem" → GENERAL (task frustration)
- "can't do this job" → EMPLOYMENT (role struggle) OR MENTAL_HEALTH (self-doubt)

🔴 **"feeling down" detection:**
- "feeling down for weeks" / "been down for a while" → MENTAL_HEALTH (depression)
- "feeling down with a cold" / "down with the flu" → GENERAL (physical illness)
- "bit down today" / "feeling a little down" → GENERAL (casual mood)

🔴 **"I'm lost" detection:**
- "feel lost in life" / "don't know where I'm going" → MENTAL_HEALTH (existential crisis)
- "I'm lost, can't find the page" / "lost on this site" → TECH_ISSUE (navigation)
- "lost in this conversation" / "confused about what you mean" → GENERAL (confusion)

🔴 **"I'm broken" detection:**
- "feel broken inside" / "I'm emotionally broken" → MENTAL_HEALTH (emotional distress)
- "my phone is broken" / "laptop won't work" → TECH_ISSUE (device malfunction)
- "I think my arm is broken" / "injured" → GENERAL (physical injury)

🔴 **"I need help" detection:**
- "need help now, thinking of hurting myself" → CRISIS ⚠️
- "need help dealing with anxiety/depression" → MENTAL_HEALTH
- "need help logging in" / "can't access my account" → TECH_ISSUE
- "need help understanding this" → GENERAL (information request)

🔴 **"nothing works" detection:**
- "nothing works for me, I've tried everything" → MENTAL_HEALTH (depression/hopelessness)
- "nothing works on this site" / "buttons don't work" → TECH_ISSUE
- "none of these coping strategies work" → MENTAL_HEALTH (treatment ineffective)

🔴 **"I'm done" detection:**
- "I'm done with life" / "done living" → CRISIS ⚠️ (suicidal ideation)
- "I'm done with this job" / "can't take this job anymore" → EMPLOYMENT (burnout/frustration)
- "I'm done with my homework" / "finished my task" → GENERAL (task completion)

**Response Format (STRICT JSON):**
{
  "category": "EMPLOYMENT",
  "subcategory": "feeling_like_burden",
  "confidence": 0.95,
  "reasoning": "User said 'I'm not working and I'm afraid I'm a burden on my wife'. The phrase 'I'm not working' with context of wife and burden clearly indicates unemployment, not a tech issue. High emotional distress evident.",
  "ambiguous_phrase": "not working",
  "disambiguation": "employment (personal status) not tech issue",
  "emotional_intensity": 8,
  "suggested_response": "acknowledge_job_loss_and_burden_feelings"
}

**Important:**
- ALWAYS choose CRISIS if there's ANY indication of self-harm or suicide
- If user is responding to a question from Amani, factor that into classification
- Confidence should be 0.9+ for clear cases, 0.6-0.8 for ambiguous
- Emotional intensity: 10 = crisis, 8-9 = severe distress, 5-7 = moderate, 1-4 = mild
- Be culturally sensitive (user is a Black/Brown man in a mental health app)

Respond with ONLY the JSON object, no other text.`;

  try {
    // Call backend Claude API for classification
    const response = await fetch(`${BACKEND_URL}/api/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: classificationPrompt,
        userMessage,
        maxTokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Classification API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Claude's JSON response
    let claudeResponse;
    try {
      claudeResponse = JSON.parse(data.classification);
    } catch (parseError) {
      console.error('❌ Failed to parse Claude response as JSON:', parseError);
      return createFallbackClassification(userMessage, 'JSON parse error');
    }
    
    // Validate Claude's response
    const validation = validateClaudeResponse(claudeResponse, userMessage);
    
    if (!validation.isValid) {
      console.error('❌ Claude response validation failed:', validation.errors);
      console.error('   Raw response:', claudeResponse);
      return createFallbackClassification(
        userMessage, 
        `Validation failed: ${validation.errors.map(e => e.field).join(', ')}`
      );
    }
    
    // Return validated and sanitized response
    console.log('✅ Claude classification validated successfully');
    return validation.sanitized!;
    
  } catch (error) {
    console.error('❌ Claude classification failed:', error);
    
    // Fallback to basic pattern matching if Claude fails
    return createFallbackClassification(
      userMessage,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Quick check if a message is likely a crisis (for immediate routing)
 * This runs BEFORE full Claude classification for speed
 */
export function isCrisisQuickCheck(userMessage: string): boolean {
  const crisisKeywords = [
    'suicide', 'kill myself', 'want to die', 'end my life',
    'hurt myself', 'self harm', 'cutting', 'overdose',
    'can\'t do this anymore', 'can\'t go on', 'can\'t take it',
    'better off dead', 'no point living'
  ];
  
  const lower = userMessage.toLowerCase();
  return crisisKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Batch classification for analytics (classify multiple messages at once)
 */
export async function batchClassify(
  messages: string[],
  context: ConversationContext
): Promise<ClaudeClassificationResult[]> {
  // Process in parallel for speed
  const promises = messages.map(msg => classifyWithClaude(msg, context));
  return Promise.all(promises);
}

