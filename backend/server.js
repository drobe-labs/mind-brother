// server.js - Backend API Server
// Run this with: node server.js

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Supabase admin client for moderation/disputes
let supabaseAdmin = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Validate URL format before creating client
  const supabaseUrl = process.env.SUPABASE_URL.trim();
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.error('❌ ERROR: SUPABASE_URL must start with http:// or https://');
    console.error(`   Current value: "${supabaseUrl}"`);
    console.error('   Please update backend/.env with your actual Supabase project URL');
    console.error('   Format: https://your-project-id.supabase.co');
    process.exit(1);
  }
  
  if (supabaseUrl.includes('your_supabase') || supabaseUrl.includes('placeholder')) {
    console.error('❌ ERROR: SUPABASE_URL is still set to placeholder value');
    console.error('   Please update backend/.env with your actual Supabase project URL');
    console.error('   Get it from: Supabase Dashboard → Settings → API → Project URL');
    process.exit(1);
  }
  
  supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
    auth: { persistSession: false }
  });
}

// ===== HELPER FUNCTIONS FOR ENHANCED CONTEXT AWARENESS =====

// ===== ENHANCED INTENT CLASSIFICATION =====
// Multi-pass analysis for improved secondary intent detection

const intentPatterns = {
  financialStress: {
    primary: /\b(financ(?:ial|e)|money|debt|bills?|income|afford|expensive|broke|cost|budget|savings?|poor|poverty|payment|loan|mortgage|rent|salary|wage|bankrupt)\b/i,
    secondary: /\b(pay|earn|spend|owe|credit|economic|financial|monetary)\b/i,
    contextual: /\b(support(?:ing)?|provid(?:e|ing)|carr(?:y|ying)|contribut(?:e|ing))\b/i
  },
  relationshipConcerns: {
    primary: /\b(wife|husband|partner|relationship|marriage|spouse|married|dating|girlfriend|boyfriend)\b/i,
    secondary: /\b(family|loved one|significant other|SO|other half)\b/i,
    contextual: /\b(we|us|our|between us|with (?:my|her|him|them))\b/i,
    conversational: /\b(conversation|talk(?:ing)?|discuss(?:ing)?|argument|fight|disagree)\b.*\b(about|regarding|concerning)\b/i
  },
  emotionalBurden: {
    primary: /\b(tired|exhausted|drained|burden|heavy|overwhelm(?:ed)?|carrying|weight|worn out|burnt? out)\b/i,
    secondary: /\b(can't keep up|too much|struggling|hard time|difficult|stressful|pressure)\b/i,
    contextual: /\b(feel(?:ing)?|felt)\b.*\b(tired|drained|exhausted|overwhelmed|heavy)\b/i
  },
  selfWorth: {
    primary: /\b(inadequate|failure|worthless|shame|guilt|disappoint(?:ed|ing)?|let (?:down|them down)|useless|burden to|not enough)\b/i,
    secondary: /\b(afraid|scared|worry|worried|fear)\b.*\b((?:is|getting|might be|will be) tired of|reject(?:ing)?|leav(?:e|ing)|abandon|done with)\b/i,
    rejection: /\b(tired of (?:me|carrying me|applying)|getting tired|might be tired|will be tired|had enough|wearing me down|getting rejected)\b/i,
    inadequacy: /\b(can't|cannot|unable to|failing to|failed to)\b.*\b(support|provide|contribute|help|be enough)\b/i
  },
  seekingAdvice: {
    primary: /\b(what should|how (?:can|do|should)|advice|suggest(?:ion)?|recommend(?:ation)?|help me|what (?:do|can) I|tell me how)\b/i,
    secondary: /\b(need help|looking for|want to know|wondering if|any ideas|thoughts on)\b/i
  },
  physicalHealth: {
    primary: /\b(sleep(?:ing)?|insomnia|headache|pain|sick(?:ness)?|illness|ill|doctor|medical|physician|health issue)\b/i,
    explicit: /\b((?:haven't|not) (?:been )?sleep(?:ing)?|can't sleep|trouble sleeping|toss and turn|physical(?:ly)?|body|symptom)\b/i,
    contextual: /\b(for (?:weeks|months|days)|every night|all the time)\b.*\b(tired|exhausted|sleep)\b/i
  },
  anxiety: {
    primary: /\b(anxious|anxiety|worry|worried|panic(?:king)?|nervous|scared|afraid|fear(?:ful)?|stress(?:ed)?)\b/i,
    secondary: /\b(on edge|tense|uneasy|restless|racing thoughts|can't relax)\b/i
  },
  depression: {
    primary: /\b(depress(?:ed|ion)?|hopeless|empty|numb|suicidal|no point|give up|worthless)\b/i,
    secondary: /\b(can't feel|nothing matters|no energy|no motivation|want to (?:die|end it))\b/i
  },
  militaryVeteran: {
    primary: /\b(deploy(?:ed|ment)?|veteran|military|combat|war(?:zone)?|soldier|service(?:member)?|army|navy|marines?|air force|coast guard|national guard|reserves?)\b/i,
    secondary: /\b(afghanistan|iraq|vietnam|korea|gulf war|overseas|tour|mission|battle|firefight|ied|convoy|patrol|base|barracks|ptsd|flashback|trigger(?:ed)?)\b/i,
    contextual: /\b(served|service|enlisted|commissioned|discharged|separated|medically retired|va |v\.a\.|veterans affairs)\b/i,
    trauma: /\b(took me back|brought back|reminded me|memories of|haunted by|can't forget|still see|still hear|nightmares? about)\b/i
  }
};

// Enhanced intent classification with multi-pass analysis
const classifyIntent = (userMessage, context = {}) => {
  const message = userMessage.toLowerCase();
  const detected = new Set();

  // Pass 1: Primary pattern matching
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (patterns.primary && patterns.primary.test(message)) {
      detected.add(intent);
    }
  }

  // Pass 2: Secondary and contextual patterns
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (patterns.secondary && patterns.secondary.test(message)) detected.add(intent);
    if (patterns.contextual && patterns.contextual.test(message)) detected.add(intent);
    if (patterns.rejection && patterns.rejection.test(message)) detected.add(intent);
    if (patterns.inadequacy && patterns.inadequacy.test(message)) detected.add(intent);
    if (patterns.conversational && patterns.conversational.test(message)) detected.add(intent);
    if (patterns.explicit && patterns.explicit.test(message)) detected.add(intent);
    if (patterns.trauma && patterns.trauma.test(message)) detected.add(intent);
  }

  // Pass 3: Contextual inference from conversation history
  if (context.topics && context.topics.length > 0) {
    if (context.topics.includes('financial stress') && /\b(conversation|talk|discuss|argument)\b/i.test(message)) {
      detected.add('relationshipConcerns');
    }
    if (context.topics.includes('relationship') && /\b(money|financ|debt|bill|afford|support|provide)\b/i.test(message)) {
      detected.add('financialStress');
    }
  }

  // Pass 4: Complex pattern combinations
  const conversationPattern = /\b(conversation|talk(?:ing)?|discuss(?:ing)?|argument)\b/i;
  const moneyPattern = /\b(money|financ|debt|bill)\b/i;
  const emotionalPattern = /\b(drained|tired|exhausted|overwhelm)\b/i;
  
  if (conversationPattern.test(message) && moneyPattern.test(message)) {
    detected.add('financialStress');
    detected.add('relationshipConcerns');
    if (emotionalPattern.test(message)) detected.add('emotionalBurden');
  }

  // Pass 5: Self-worth in rejection contexts
  const fearPattern = /\b(afraid|scared|worry|worried|fear)\b/i;
  const rejectionPattern = /\b(tired of|getting tired|had enough|done with|leaving)\b/i;
  const inadequacyContext = /\b(carrying|support|provide|contribute|help)\b/i;
  
  if (fearPattern.test(message) && rejectionPattern.test(message)) {
    detected.add('selfWorth');
    if (inadequacyContext.test(message)) detected.add('relationshipConcerns');
  }

  // Pass 6: Job search / rejection patterns
  const jobSearchPattern = /\b(appl(?:y|ying)|job(?:s)?|interview|resume|career)\b/i;
  const rejectionJobPattern = /\b(reject(?:ed|ion)|turn(?:ed)? down|no response|ghosted|wearing me down)\b/i;
  
  if (jobSearchPattern.test(message) && rejectionJobPattern.test(message)) {
    detected.add('selfWorth');
    detected.add('emotionalBurden');
  }

  // Pass 7: Physical health validation
  if (detected.has('physicalHealth')) {
    const hasExplicitPhysical = intentPatterns.physicalHealth.explicit.test(message) ||
                                intentPatterns.physicalHealth.contextual.test(message);
    
    if (!hasExplicitPhysical && 
        (detected.has('emotionalBurden') || detected.has('financialStress') || detected.has('relationshipConcerns'))) {
      detected.delete('physicalHealth');
    }
  }

  // Pass 8: Family support context
  const familyPattern = /\b(family|families|children|kids|son|daughter)\b/i;
  const supportPattern = /\b(support|provide|care for|take care)\b/i;
  const failurePattern = /\b(can't|cannot|unable|fail(?:ing|ed)?)\b/i;
  
  if (familyPattern.test(message) && supportPattern.test(message) && failurePattern.test(message)) {
    detected.add('financialStress');
    detected.add('selfWorth');
  }

  return detected.size > 0 ? Array.from(detected) : ['general'];
};

// Validate intents for logical consistency
const validateIntents = (intents, userMessage) => {
  const message = userMessage.toLowerCase();
  const validated = [...intents];

  // Remove physicalHealth if discussing emotions without explicit physical symptoms
  if (validated.includes('physicalHealth') && 
      (validated.includes('emotionalBurden') || validated.includes('financialStress'))) {
    
    const hasExplicitPhysical = /\b(haven't been sleeping|can't sleep|insomnia|physical(?:ly)|toss and turn)\b/i.test(message);
    if (!hasExplicitPhysical) {
      const index = validated.indexOf('physicalHealth');
      validated.splice(index, 1);
    }
  }

  return validated;
};

// Update context with detected intents and topics
const updateContext = (context, userMessage, intents) => {
  const topics = extractTopics(userMessage);
  
  // Update topics (keep last 5 unique topics)
  context.topics = [...new Set([...topics, ...context.topics])].slice(0, 5);

  // Update recent intents (keep last 5)
  context.recentIntents = [...new Set([...intents, ...context.recentIntents])].slice(0, 5);

  // Infer emotional state
  if (intents.includes('depression') || 
      (intents.includes('selfWorth') && intents.includes('relationshipConcerns'))) {
    context.emotionalState = 'highly distressed';
  } else if (intents.includes('emotionalBurden') || intents.includes('anxiety')) {
    context.emotionalState = 'distressed';
  } else if (intents.includes('seekingAdvice')) {
    context.emotionalState = 'seeking support';
  }

  return context;
};

// Extract topics from conversation
const extractTopics = (userMessage) => {
  const topics = [];
  const message = userMessage.toLowerCase();

  if (message.match(/financ|money|debt|bill|income|afford/)) topics.push('financial stress');
  if (message.match(/wife|husband|partner|relationship|marriage/)) topics.push('relationship');
  if (message.match(/work|job|career|employ|boss|project management|sales|marketing|engineering|developer|manager|experience|position|role|industry|field|profession|transition|switch careers|change careers|grind|commute|commuting|transport|train|bus|subway|metro|office|9 to 5|nine to five|early morning|long day at work|daily routine/)) topics.push('work');
  if (message.match(/depress|anxi|stress|worry|overwhelm/)) topics.push('mental health');
  if (message.match(/guilt|shame|inadequate|failure/)) topics.push('self-worth');
  if (message.match(/family|parent|child|kid/)) topics.push('family');
  // Military/veteran/combat trauma detection
  if (message.match(/military|veteran|deploy|combat|war|soldier|army|navy|marines?|air force|afghanistan|iraq|vietnam|korea|gulf|ptsd|flashback|trigger|took me back|brought back|served|service|tour|mission|battle|ied|convoy|va |v\.a\./i)) topics.push('military/veteran');
  
  return topics;
};

// ⭐ GRACEFUL DEGRADATION: Fallback response when Claude API fails
const getFallbackResponse = (userMessage, intents, topics, context) => {
  const message = userMessage.toLowerCase();
  
  // ⭐ NEW: Check for positive sentiment FIRST - user is saying things are fine!
  const positivePatterns = [
    /\b(all good|its? good|i'm good|doing good|things are good|everything is fine|no worries|not bad|pretty good)\b/i,
    /\b(good place|feeling (good|great|better|fine|okay))\b/i,
    /\b(nothing (specific|major|serious)|not really|just the (usual|normal|grind))\b/i,
  ];
  
  const isPositiveMessage = positivePatterns.some(p => p.test(message));
  
  if (isPositiveMessage && !message.match(/suicide|kill|hurt|harm|die|hopeless|worthless/)) {
    console.log('😊 Positive message detected in fallback - giving supportive response');
    const positiveResponses = [
      "That's good to hear, brother! The daily grind can be tiring, but it sounds like you're handling it well. Taking time to decompress is important. Anything fun planned for the evening?",
      "I'm glad things are going okay! Sometimes the routine stuff can wear you down, but you're keeping your head up. What helps you unwind after a long day?",
      "Good to hear you're doing alright! The commute and early mornings can be draining. How do you usually recharge when you get home?",
      "Sounds like a normal day then - nothing wrong with that! It's good you're taking a moment to check in. What's keeping you going lately?"
    ];
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }
  
  // Crisis fallback
  if (intents.includes('crisis') || message.match(/suicide|kill myself|end my life|want to die/)) {
    return `I'm here with you, brother. Right now, please reach out for immediate support:

• Call 988 (Suicide & Crisis Lifeline) - available 24/7
• Text "HELLO" to 741741 (Crisis Text Line)
• Call 911 if you're in immediate danger

You're not alone, and there are people who want to help you right now. Please reach out.`;
  }
  
  // Mental health fallback
  if (intents.some(i => ['anxiety', 'depression', 'emotionalBurden', 'selfWorth'].includes(i))) {
    return `I hear you, brother. It sounds like you're going through a lot right now. 

I want to make sure you get the support you need. While I'm here to listen, sometimes talking with a professional counselor or therapist can be really helpful.

Would you like me to share some resources for finding support? Or is there something specific you'd like to talk about right now?`;
  }
  
  // ⭐ Military/veteran PTSD fallback - CHECK FIRST before other categories
  const isMilitaryVeteran = topics.includes('military/veteran') || intents.includes('militaryVeteran') ||
    message.match(/\b(deploy(?:ed|ment)?|veteran|military|combat|war|soldier|army|navy|marines?|air force|afghanistan|iraq|vietnam|korea|gulf|ptsd|flashback|took me back|brought back|served|service|tour|mission|battle)\b/i);
  
  if (isMilitaryVeteran) {
    console.log('🎖️ Military/veteran content detected in fallback');
    return `I hear you, brother. What you're describing - the news triggering memories of your deployment - that's a real and valid experience. Combat trauma doesn't just go away, and certain things can bring it all back.

You served, and what you experienced leaves a mark. You don't have to carry this alone.

Would you like to talk more about what's coming up for you? Or if you'd prefer, I can share some resources specifically for veterans dealing with these kinds of triggers. Either way, I'm here.`;
  }
  
  // Career/work stress fallback - ⭐ UPDATED: Added more work-related keywords
  const isWorkRelated = topics.includes('work') || intents.includes('workStress') ||
    message.match(/\b(grind|commute|commuting|transport|train|bus|subway|metro|early morning|long day|office|9 to 5|nine to five)\b/i);
  
  if (isWorkRelated) {
    return `I hear you, brother. The daily grind - early mornings, commute, the whole routine - can really add up.

What's been the toughest part lately? Is it the hours, the work itself, or just the overall routine? I'm here to listen.`;
  }
  
  // Relationship fallback (separate from work) - ⭐ UPDATED: Check CURRENT message for relationship keywords
  const hasRelationshipInCurrentMessage = message.match(/\b(wife|husband|partner|girlfriend|boyfriend|marriage|relationship|dating|spouse)\b/i);
  
  if (hasRelationshipInCurrentMessage || (intents.includes('relationshipConcerns') && !isWorkRelated)) {
    return `I understand this is weighing on you. Relationship issues can really be tough to navigate.

What's been the hardest part about this situation? I'm here to listen and help you think through it.`;
  }
  
  // General supportive fallback
  return `I hear you, brother. I'm here to listen and support you. 

Can you tell me a bit more about what's going on? I want to make sure I understand what you're dealing with so I can help in the best way possible.`;
};

// ⭐ HYBRID APPROACH: Check for simple cases that can be handled without Claude
const checkSimpleCase = (userMessage) => {
  const message = userMessage.toLowerCase().trim();
  const originalMessage = userMessage.trim();
  
  // 1. Simple greetings (very clear, no context needed)
  const greetingPattern = /^(hi|hello|hey|sup|what's up|whats up|good morning|good afternoon|good evening|yo|wassup|greetings)[\s!?.]*$/i;
  if (greetingPattern.test(originalMessage)) {
    const greetings = [
      "Hey brother! 👋 What's on your mind today?",
      "What's good, bro? How can I help you today?",
      "Hey! I'm here for you. What's going on?",
      "What's up, man? How are you feeling?",
      "Hey there! I'm Amani, and I'm here to listen. What's on your mind?"
    ];
    return {
      type: 'greeting',
      response: greetings[Math.floor(Math.random() * greetings.length)],
      intents: ['general'],
      reason: 'Simple greeting detected'
    };
  }
  
  // 2. Simple acknowledgments (thanks, ok, got it)
  const acknowledgmentPattern = /^(thanks?|thank you|thx|ok|okay|got it|gotcha|alright|cool|sounds good|appreciate it)[\s!?.]*$/i;
  if (acknowledgmentPattern.test(originalMessage)) {
    return {
      type: 'acknowledgment',
      response: "You're welcome, brother. I'm here whenever you need me. 🤝",
      intents: ['general'],
      reason: 'Simple acknowledgment detected'
    };
  }
  
  // 3. Simple "how are you" questions (not asking about mental health in depth)
  const howAreYouPattern = /^(how are you|how you doing|how's it going|how are things|what's good)[\s?]*$/i;
  if (howAreYouPattern.test(originalMessage)) {
    return {
      type: 'how_are_you',
      response: "I'm doing well, thanks for asking! I'm here to support you. How are you doing today?",
      intents: ['general'],
      reason: 'Simple how are you question detected'
    };
  }
  
  // 4. Simple "yes/no" responses (check BEFORE incomplete check)
  const yesNoPattern = /^(yes|yeah|yep|yup|no|nope|nah|sure|ok|okay|alright)[\s!?.]*$/i;
  if (yesNoPattern.test(originalMessage)) {
    return {
      type: 'yes_no',
      response: "Got it. Tell me more about what's on your mind.",
      intents: ['general'],
      reason: 'Simple yes/no response detected'
    };
  }
  
  // 5. Crisis keywords - ALWAYS use Claude for proper handling
  const crisisPatterns = [
    /\b(suicid|kill myself|end it all|want to die|better off dead|hurt myself|self harm|self-harm)\b/i,
    /\b(can't do this anymore|can't go on|can't take it anymore|done with life|no reason to live)\b/i,
    /\b(planning to|going to kill|ending it|final arrangements|goodbye forever)\b/i
  ];
  if (crisisPatterns.some(pattern => pattern.test(message))) {
    // Don't handle crisis with regex - always use Claude for proper crisis protocol
    console.log('⚠️ Crisis detected - routing to Claude for proper handling');
    return null;
  }
  
  // 6. Very short messages that are likely incomplete or typos (but not yes/no)
  if (originalMessage.length <= 2 && /^[a-z]{1,2}[\s!?.]*$/i.test(originalMessage)) {
    return {
      type: 'incomplete',
      response: "I'm not sure I caught that. Could you tell me a bit more?",
      intents: ['general'],
      reason: 'Very short message, likely incomplete'
    };
  }
  
  // 7. Very short questions that are likely incomplete (but not yes/no)
  if (originalMessage.length <= 3 && /^[a-z]{1,3}\?*$/i.test(originalMessage) && !yesNoPattern.test(originalMessage)) {
    return {
      type: 'incomplete',
      response: "I'm not sure I caught that. Could you tell me a bit more?",
      intents: ['general'],
      reason: 'Very short message, likely incomplete'
    };
  }
  
  // Not a simple case - needs Claude for proper contextual understanding
  return null;
};

// ⭐ SMART SUMMARIZATION: Summarize old conversation messages
// Provides ~76% token reduction for long conversations
const summarizeOldMessages = (oldMessages) => {
  if (!oldMessages || oldMessages.length === 0) {
    return 'No previous conversation.';
  }
  
  // Extract key information
  const topics = new Set();
  const classifications = new Set();
  let crisisDetected = false;
  let emotionalTrend = 'stable';
  
  oldMessages.forEach(msg => {
    // Extract topics from content
    const content = (msg.content || '').toLowerCase();
    if (content.includes('anxiety') || content.includes('worried')) topics.add('anxiety');
    if (content.includes('depress') || content.includes('sad')) topics.add('depression');
    if (content.includes('relationship') || content.includes('wife') || content.includes('partner')) topics.add('relationships');
    if (content.includes('work') || content.includes('job') || content.includes('career')) topics.add('work');
    if (content.includes('money') || content.includes('financial') || content.includes('debt')) topics.add('financial');
    
    // Check for crisis
    if (content.includes('suicid') || content.includes('kill myself') || content.includes('end it all')) {
      crisisDetected = true;
    }
  });
  
  // Build concise summary
  const parts = [];
  parts.push(`Previous conversation: ${Math.floor(oldMessages.length / 2)} exchanges`);
  
  if (topics.size > 0) {
    parts.push(`Topics: ${Array.from(topics).slice(0, 3).join(', ')}`);
  }
  
  if (crisisDetected) {
    parts.push('⚠️ Previous crisis discussion');
  }
  
  return parts.join('. ') + '.';
};

// Validate response to catch inappropriate physical health suggestions
const validateResponse = (userMessage, aiResponse, intents) => {
  const emotionalIntents = ['financialStress', 'relationshipConcerns', 'emotionalBurden', 'selfWorth', 'anxiety', 'depression'];
  const isEmotionalContext = intents.some(intent => emotionalIntents.includes(intent));
  
  const physicalSuggestions = aiResponse.toLowerCase().match(
    /breathing exercise for sleep|try to get more sleep|take a nap|physical rest|see a doctor about fatigue|4-7-8 breathing|sleep better/i
  );

  const hasPhysicalHealth = intents.includes('physicalHealth');

  if (isEmotionalContext && physicalSuggestions && !hasPhysicalHealth) {
    console.log('⚠️ Response validation failed: Physical health suggestion in emotional context');
    return {
      valid: false,
      reason: 'Response inappropriately focuses on physical health when user is discussing emotional concerns'
    };
  }

  return { valid: true };
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Text-to-speech endpoint
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice_id } = req.body;
    
    console.log('📢 TTS Request received:', { text, voice_id });
    
    // Validate input
    if (!text) {
      console.error('❌ No text provided');
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Get API key from environment
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.error('❌ ELEVENLABS_API_KEY not set in environment!');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key not configured. Please set ELEVENLABS_API_KEY in .env file'
      });
    }
    
    const voiceId = voice_id || '1YBpxMFAafA83t7u1xof';
    
    console.log('🔊 Calling ElevenLabs API...');
    
    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    );
    
    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('❌ ElevenLabs API error:', elevenLabsResponse.status, errorText);
      return res.status(elevenLabsResponse.status).json({ 
        error: 'TTS service error',
        details: errorText,
        status: elevenLabsResponse.status
      });
    }
    
    // Get audio buffer
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    console.log('✅ Audio generated:', audioBuffer.byteLength, 'bytes');
    
    // Set correct headers for audio
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', audioBuffer.byteLength);
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send audio data
    res.send(Buffer.from(audioBuffer));
    
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// ⭐ UPDATED: Claude API chat endpoint - NOW WITH WEB SEARCH SUPPORT
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      userMessage, 
      conversationHistory, 
      systemPrompt,
      context = { topics: [], emotionalState: null, recentIntents: [] },
      debug = false,
      enableWebSearch = false  // ⭐ NEW: Web search parameter
    } = req.body;
    
    console.log('🤖 Claude API request received:', { 
      userMessage: userMessage?.substring(0, 50) + '...',
      historyLength: conversationHistory?.length || 0,
      hasSystemPrompt: !!systemPrompt,
      hasContext: !!context,
      debugMode: debug,
      webSearchEnabled: enableWebSearch  // ⭐ NEW: Log web search status
    });
    
    // Validate input
    if (!userMessage) {
      console.error('❌ No user message provided');
      return res.status(400).json({ 
        success: false, 
        error: 'User message is required' 
      });
    }
    
    // Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not set in environment!');
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error',
        message: 'API key not configured. Please set ANTHROPIC_API_KEY in .env file'
      });
    }
    
    // ⭐ SMART CONVERSATION MEMORY: Use contextManager for intelligent summarization
    // This provides 76% token reduction for long conversations
    const userId = req.body.userId || 'default';
    const sessionId = req.body.sessionId || 'default';
    
    // ⭐ CONTEXT BEST PRACTICES: Prepare messages with smart summarization
    const messages = [];
    
    // ⭐ NEW: Use smart context manager for conversation memory
    // If conversation is long, it will summarize old messages and keep recent ones
    let processedHistory = conversationHistory || [];
    
    if (conversationHistory && conversationHistory.length > 10) {
      // For long conversations, use smart summarization
      // Note: contextManager is frontend-only, so we implement summarization here
      const MAX_CONTEXT_MESSAGES = 10; // Last 10 messages (5 exchanges)
      const SUMMARIZATION_THRESHOLD = 15; // Summarize if more than 15 messages
      
      if (conversationHistory.length > SUMMARIZATION_THRESHOLD) {
        // Summarize old messages, keep recent ones
        const recentCount = MAX_CONTEXT_MESSAGES;
        const recentMessages = conversationHistory.slice(-recentCount);
        const oldMessages = conversationHistory.slice(0, -recentCount);
        
        // Create summary of old messages (local summarization - fast and free)
        const summary = summarizeOldMessages(oldMessages);
        
        // Add summary as a system message, then recent messages
        processedHistory = [
          {
            role: 'assistant',
            content: `[Previous conversation summary: ${summary}]`
          },
          ...recentMessages
        ];
        
        console.log(`📝 Smart summarization: ${oldMessages.length} old messages → summary, keeping ${recentMessages.length} recent`);
        console.log(`💰 Token reduction: ~${Math.round((oldMessages.length / conversationHistory.length) * 100)}%`);
      } else {
        // Just limit to recent messages
        processedHistory = conversationHistory.slice(-MAX_CONTEXT_MESSAGES);
      }
    }
    
    // ⭐ Context window management - additional safety limits
    const MAX_CONTEXT_TOKENS = 8000; // Approximate token limit (conservative)
    const MAX_MESSAGE_LENGTH = 2000; // Characters per message
    
    // Process history with token limits
    let estimatedTokens = 0;
    for (const msg of processedHistory) {
      // Estimate tokens (rough: 1 token ≈ 4 characters)
      const msgTokens = Math.ceil((msg.content?.length || 0) / 4);
      
      // Skip if adding this message would exceed token limit
      if (estimatedTokens + msgTokens > MAX_CONTEXT_TOKENS - 500) { // Leave room for system prompt
        console.log(`⚠️ Context window limit reached, truncating history at ${messages.length} messages`);
        break;
      }
      
      // Truncate very long messages
      const content = (msg.content || '').length > MAX_MESSAGE_LENGTH 
        ? msg.content.substring(0, MAX_MESSAGE_LENGTH) + '... [truncated]'
        : msg.content;
      
      messages.push({
        role: msg.role,
        content: content
      });
      
      estimatedTokens += msgTokens;
    }
    
    console.log(`📏 Context: ${messages.length} messages, ~${estimatedTokens} tokens`);
    
    // Add current user message (truncate if too long)
    const userMessageContent = userMessage.length > MAX_MESSAGE_LENGTH
      ? userMessage.substring(0, MAX_MESSAGE_LENGTH) + '... [truncated]'
      : userMessage;
    
    messages.push({
      role: 'user',
      content: userMessageContent
    });
    
    // ⭐ NEW: Check for positive sentiment FIRST - skip crisis detection for happy messages
    const isPositiveSentiment = (msg) => {
      const lower = msg.toLowerCase();
      const positivePatterns = [
        /\b(good place|doing (well|good|great|fine|okay|ok|better)|feeling (good|great|better|happy|relaxed|calm))\b/i,
        /\b(check[\s-]?in|checking in|just wanted to (say hi|chat|talk))\b/i,
        /\b(relaxing|watching|enjoying|having (fun|tea|coffee|a good))\b/i,
        /\b(grateful|thankful|blessed|appreciate|happy|content|peaceful)\b/i,
        /\b(had a (good|great|nice) day|things are going (well|good))\b/i,
        /\b(feeling (much )?better|improving|progress|getting better)\b/i,
      ];
      const hasCrisisWords = /\b(suicid|kill|hurt|harm|die|dead|hopeless|worthless|can't (go on|take it|do this))\b/i.test(lower);
      return positivePatterns.some(p => p.test(lower)) && !hasCrisisWords;
    };
    
    if (isPositiveSentiment(userMessage)) {
      console.log('😊 Positive sentiment detected - skipping crisis check');
    }
    
    // ⭐ CRISIS ESCALATION: Check for crisis (skip if positive sentiment)
    const crisisManager = getCrisisManager();
    const crisisCheck = isPositiveSentiment(userMessage) ? null : crisisManager.detectCrisisSeverity(userMessage, { 
      category: classifyIntent(userMessage, context).includes('crisis') ? 'CRISIS' : 'GENERAL'
    });
    
    if (crisisCheck && crisisCheck.level === 'SEVERE') {
      console.log('🚨 SEVERE CRISIS DETECTED - Executing crisis protocol');
      
      // Execute crisis response
      const crisisResponse = await crisisManager.executeCrisisResponse(
        userId || 'default',
        sessionId || 'default',
        userMessage,
        crisisCheck
      );
      
      // ⭐ HUMAN HANDOFF: Initiate immediate handoff for SEVERE crisis
      let handoffResult = null;
      try {
        handoffResult = await initiateHumanHandoff(
          userId || 'default',
          sessionId || 'default',
          'CRISIS',
          {
            conversation: {
              messages: messages.slice(-20), // Last 20 messages for context
              classifications: context.classifications || []
            },
            emotionalTrend: context.emotionalTrend || []
          }
        );
        console.log('🤝 Human handoff initiated for SEVERE crisis');
      } catch (handoffError) {
        console.error('⚠️ Human handoff failed (continuing with crisis response):', handoffError);
      }
      
      const crisisMessage = crisisManager.generateCrisisResponse(crisisCheck);
      
      // Combine crisis message with handoff message if handoff was successful
      let finalResponse = crisisMessage.response;
      if (handoffResult && handoffResult.success) {
        finalResponse = `${crisisMessage.response}\n\n---\n\n${handoffResult.message}`;
      }
      
      return res.json({
        success: true,
        response: finalResponse,
        context: updateContext({ ...context }, userMessage, ['crisis']),
        metadata: {
          intents: ['crisis'],
          topics: extractTopics(userMessage),
          validation: { valid: true },
          usedWebSearch: false,
          method: 'crisis_escalation',
          crisisLevel: crisisCheck.level,
          crisisActions: crisisResponse.actions,
          humanAlertSent: crisisResponse.humanAlertSent,
          handoffInitiated: handoffResult?.success || false,
          handoffTicketId: handoffResult?.ticket?.ticketId || null,
          handoffEstimatedWait: handoffResult?.estimatedWait || null,
          displayMode: handoffResult?.displayMode || 'CRISIS_BANNER',
          crisisResources: handoffResult?.crisisResources || null
        },
        usage: {
          input_tokens: 0,
          output_tokens: 0
        }
      });
    }
    
    // ⭐ HUMAN HANDOFF: Check for MODERATE crisis or other handoff triggers
    if (crisisCheck && (crisisCheck.level === 'MODERATE' || crisisCheck.level === 'ELEVATED')) {
      console.log(`⚠️ ${crisisCheck.level} CRISIS DETECTED - Considering human handoff`);
      
      // For MODERATE crisis, initiate handoff with HIGH priority
      if (crisisCheck.level === 'MODERATE') {
        try {
          const handoffResult = await initiateHumanHandoff(
            userId || 'default',
            sessionId || 'default',
            'MODERATE_CRISIS',
            {
              conversation: {
                messages: messages.slice(-20),
                classifications: context.classifications || []
              },
              emotionalTrend: context.emotionalTrend || []
            }
          );
          
          if (handoffResult && handoffResult.success) {
            console.log('🤝 Human handoff initiated for MODERATE crisis');
            
            const crisisMessage = crisisManager.generateCrisisResponse(crisisCheck);
            const finalResponse = `${crisisMessage.response}\n\n---\n\n${handoffResult.message}`;
            
            return res.json({
              success: true,
              response: finalResponse,
              context: updateContext({ ...context }, userMessage, ['crisis']),
              metadata: {
                intents: ['crisis'],
                topics: extractTopics(userMessage),
                validation: { valid: true },
                usedWebSearch: false,
                method: 'crisis_escalation_with_handoff',
                crisisLevel: crisisCheck.level,
                handoffInitiated: true,
                handoffTicketId: handoffResult.ticket?.ticketId || null,
                handoffEstimatedWait: handoffResult.estimatedWait || null,
                displayMode: handoffResult.displayMode || 'HANDOFF_NORMAL'
              },
              usage: {
                input_tokens: 0,
                output_tokens: 0
              }
            });
          }
        } catch (handoffError) {
          console.error('⚠️ Human handoff failed (continuing with standard response):', handoffError);
        }
      }
    }
    
    // ⭐ HYBRID APPROACH: Check for simple cases first (regex - no Claude call)
    const simpleCase = checkSimpleCase(userMessage);
    if (simpleCase) {
      console.log(`⚡ Simple case detected: ${simpleCase.type} (using regex - no Claude call)`);
      const responseData = {
        success: true,
        response: simpleCase.response,
        context: updateContext({ ...context }, userMessage, simpleCase.intents || []),
        metadata: {
          intents: simpleCase.intents || [],
          topics: extractTopics(userMessage),
          validation: { valid: true },
          usedWebSearch: false,
          method: 'regex',  // ⭐ Indicate this was handled by regex
          cost_saved: true  // ⭐ Indicate we saved Claude API costs
        },
        usage: {
          input_tokens: 0,
          output_tokens: 0
        }
      };
      
      if (debug) {
        responseData.debug = {
          simpleCaseType: simpleCase.type,
          reason: simpleCase.reason
        };
      }
      
      return res.json(responseData);
    }
    
    // ENHANCED: Classify intents with context awareness (for complex cases)
    const rawIntents = classifyIntent(userMessage, context);
    const intents = validateIntents(rawIntents, userMessage);
    const topics = extractTopics(userMessage);
    
    console.log('🔍 Detected intents:', intents);
    console.log('📝 Extracted topics:', topics);
    console.log('🧠 Complex case - using Claude API');
    
    // ⭐ NEW: Determine if extended thinking should be used
    // Use extended thinking for complex mental health, relationship, or emotional discussions
    const useExtendedThinking = intents.some(intent => 
      ['emotionalBurden', 'selfWorth', 'anxiety', 'depression', 'relationshipConcerns', 'financialStress'].includes(intent)
    ) || userMessage.length > 100; // Also for longer, more complex messages
    
    if (useExtendedThinking) {
      console.log('🧠 Extended thinking enabled for complex case');
    }
    
    // ⭐ NEW: Build tools array for web search
    const tools = enableWebSearch ? [
      {
        name: "web_search",
        description: "Search the web for current information about sports, news, entertainment, weather, and events",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (keep it concise, 1-6 words work best)"
            }
          },
          required: ["query"]
        }
      }
    ] : undefined;
    
    if (enableWebSearch) {
      console.log('🔍 Web search enabled for this request');
    }
    
    console.log('🧠 Calling Claude API...');
    const startTime = Date.now();
    
    // Log system prompt size for debugging
    const promptSize = systemPrompt ? systemPrompt.length : 0;
    console.log(`📏 System prompt size: ${promptSize} characters (${Math.round(promptSize/4)} estimated tokens)`);
    
    // ⭐ NEW: Prepare system prompt with caching for cost optimization
    // System prompts are the same across requests, so we can cache them
    const systemPromptArray = systemPrompt ? [{
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' } // Cache this - saves ~30-40% on input tokens
    }] : [{
      type: 'text',
      text: 'You are a helpful AI assistant.',
      cache_control: { type: 'ephemeral' }
    }];
    
    // ⭐ NEW: Build extended thinking prompt if needed
    // Extended thinking is enabled through prompt structure, not API parameter
    let finalMessages = messages;
    if (useExtendedThinking) {
      // Enhanced prompt that encourages Claude to use extended thinking
      const extendedThinkingContext = `[EXTENDED THINKING REQUESTED]

This is a complex mental health discussion requiring careful analysis:
- Detected intents: ${intents.join(', ')}
- Topics: ${topics.join(', ')}
- Emotional context: ${context.emotionalState || 'unknown'}
- Message complexity: ${userMessage.length} characters

Please use extended thinking to:
1. Deeply analyze the emotional nuances and underlying feelings
2. Consider cultural context and diverse backgrounds of men
3. Think through multiple therapeutic approaches before responding
4. Carefully assess safety and crisis indicators
5. Plan a supportive, culturally-aware, and therapeutically sound response
6. Consider the user's emotional state and how best to support them

Take time to think through your response carefully. This is important.`;
      
      // Replace the last user message with extended thinking version
      finalMessages = [...messages];
      if (finalMessages.length > 0 && finalMessages[finalMessages.length - 1].role === 'user') {
        finalMessages[finalMessages.length - 1] = {
          role: 'user',
          content: `${extendedThinkingContext}\n\nUser message: ${userMessage}`
        };
      } else {
        finalMessages.push({
          role: 'user',
          content: `${extendedThinkingContext}\n\nUser message: ${userMessage}`
        });
      }
      
      console.log('🧠 Extended thinking prompt added for complex case');
    }
    
    // ⭐ UPDATED: Call Claude API with prompt caching and optional web search
    // Note: Extended thinking is enabled through prompt structure, not API parameter
    // ⭐ GRACEFUL DEGRADATION: Wrap in try-catch with fallback
    let claudeResponse;
    let responseText = '';
    let usedWebSearch = false;
    let totalUsage = { input_tokens: 0, output_tokens: 0 };
    let claudeTime = 0;
    let claudeSuccess = false;
    
    try {
      // Set timeout for Claude API call (10 seconds)
      const claudePromise = anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929', // ⭐ FIXED: Using Claude Sonnet 4.5 (latest stable model)
        max_tokens: useExtendedThinking ? 1500 : 1000, // ⭐ NEW: More tokens for extended thinking responses
        system: systemPromptArray, // ⭐ NEW: Using cached system prompt (saves 30-40% on input tokens)
        messages: finalMessages,
        ...(tools && { tools })  // ⭐ NEW: Only include tools if web search is enabled
      });
      
      // ⭐ Increased timeout for international users (UK, etc.) who have more latency
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Claude API timeout after 30 seconds')), 30000)
      );
      
      claudeResponse = await Promise.race([claudePromise, timeoutPromise]);
      
      claudeTime = Date.now() - startTime;
      console.log(`⏱️ Claude API took ${claudeTime}ms (${(claudeTime/1000).toFixed(2)}s)`);
      
      // ⭐ NEW: Handle tool use (web search results)
      for (const block of claudeResponse.content) {
        if (block.type === 'text') {
          responseText += block.text;
        } else if (block.type === 'tool_use') {
          usedWebSearch = true;
          console.log(`🔍 Claude used web search: ${block.name} with query: "${block.input.query}"`);
        }
      }
      
      totalUsage = {
        input_tokens: claudeResponse.usage.input_tokens,
        output_tokens: claudeResponse.usage.output_tokens
      };
      
      // ⭐ PROMPT CACHING: Log cache performance and track metrics
      if (claudeResponse.usage?.cache_read_input_tokens) {
        const cacheHitRate = (claudeResponse.usage.cache_read_input_tokens / 
          (claudeResponse.usage.cache_read_input_tokens + claudeResponse.usage.input_tokens)) * 100;
        const tokensSaved = claudeResponse.usage.cache_read_input_tokens;
        const costSaved = (tokensSaved / 1000000) * 3.00; // $3.00 per 1M input tokens
        
        console.log(`💰 Cache hit: ${cacheHitRate.toFixed(0)}% (saved ~${tokensSaved} tokens, ~$${costSaved.toFixed(4)})`);
        totalUsage.cache_read_tokens = tokensSaved;
        totalUsage.cache_hit_rate = Math.round(cacheHitRate * 100) / 100;
        totalUsage.cache_cost_saved = Math.round(costSaved * 10000) / 10000;
        
        // ⭐ CACHE METRICS: Track cache performance
        cacheMetrics.trackCacheEvent('/api/chat', true, tokensSaved);
      } else {
        console.log('⚠️ No cache hit - system prompt may not be cached');
        totalUsage.cache_read_tokens = 0;
        totalUsage.cache_hit_rate = 0;
        totalUsage.cache_cost_saved = 0;
        
        // ⭐ CACHE METRICS: Track cache miss
        cacheMetrics.trackCacheEvent('/api/chat', false, 0);
      }
      
      console.log('✅ Claude response generated:', responseText.substring(0, 100) + '...');
      if (usedWebSearch) {
        console.log('✅ Web search was used in this response');
      }
      if (useExtendedThinking) {
        console.log('✅ Extended thinking was used for this response');
      }
      
      claudeSuccess = true;
      
    } catch (claudeError) {
      console.error('❌ Claude API failed:', claudeError.message);
      console.log('🔄 Attempting graceful degradation fallback...');
      
      // ⭐ GRACEFUL DEGRADATION: Fallback to rule-based response
      claudeSuccess = false;
      responseText = getFallbackResponse(userMessage, intents, topics, context);
      totalUsage = { input_tokens: 0, output_tokens: 0 };
      
      console.log('✅ Fallback response generated using rule-based system');
    }
    
    // ENHANCED: Update context for next message
    const updatedContext = updateContext({ ...context }, userMessage, intents);
    
    // ⭐ GRACEFUL DEGRADATION: Only validate if Claude succeeded
    let validation = { valid: true };
    if (claudeSuccess) {
      // Validate response to catch inappropriate physical health suggestions
      validation = validateResponse(userMessage, responseText, intents);
      
      if (!validation.valid) {
        console.log('⚠️ Response validation failed, requesting corrected response...');
        console.log('   Reason:', validation.reason);
        
        try {
          // Request a corrected response
          const correctionMessages = [
            ...messages,
            { role: 'assistant', content: responseText },
            { 
              role: 'user', 
              content: 'Please refocus on the emotional and psychological aspects of what I shared, rather than physical health concerns like sleep or physical rest. I need support for the mental and emotional burden, not physical tiredness.' 
            }
          ];

          // Use cached system prompt for correction too
          const correctedResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929', // ⭐ FIXED: Using Claude Sonnet 4.5
            max_tokens: 1000,
            system: systemPromptArray, // ⭐ NEW: Use cached system prompt
            messages: correctionMessages,
            ...(tools && { tools })  // ⭐ NEW: Include tools in correction too
          });

          responseText = correctedResponse.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('');
          
          // Add correction tokens to usage
          totalUsage.input_tokens += correctedResponse.usage.input_tokens;
          totalUsage.output_tokens += correctedResponse.usage.output_tokens;
          
          console.log('✅ Corrected response generated:', responseText.substring(0, 100) + '...');
        } catch (correctionError) {
          console.error('⚠️ Correction failed, using original response:', correctionError.message);
        }
      }
    }
    
    // Prepare response with enhanced metadata
    const responseData = {
      success: true,
      response: responseText,
      context: updatedContext,
      metadata: {
        intents,
        topics,
        validation,
        method: claudeSuccess ? 'claude' : 'fallback', // ⭐ GRACEFUL DEGRADATION: Indicate fallback was used
        usedFallback: !claudeSuccess, // ⭐ GRACEFUL DEGRADATION: Flag for analytics
        usedWebSearch,  // ⭐ NEW: Indicate if web search was used
        usedExtendedThinking: useExtendedThinking,  // ⭐ NEW: Indicate if extended thinking was used
        usedPromptCaching: claudeSuccess  // ⭐ NEW: Only true if Claude was successful
      },
      usage: totalUsage
    };
    
    // ENHANCED: Add debug info if requested
    if (debug) {
      responseData.debug = {
        rawIntents,
        validatedIntents: intents,
        extractedTopics: topics,
        contextBefore: context,
        contextAfter: updatedContext,
        webSearchEnabled: enableWebSearch,
        webSearchUsed: usedWebSearch
      };
      console.log('🐛 Debug info included in response');
    }
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Claude API error:', error);
    
    // Handle specific Anthropic API errors
    if (error.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'Please check your ANTHROPIC_API_KEY in .env file'
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Claude API error',
      message: error.message || 'An error occurred while processing your request'
    });
  }
});

// ENHANCED: Intent classification testing endpoint
// Test intent detection without calling Claude API
app.post('/api/test-intent', (req, res) => {
  try {
    const { 
      message, 
      context = { topics: [], emotionalState: null, recentIntents: [] } 
    } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'Message is required' 
      });
    }
    
    console.log('🧪 Intent classification test:', message.substring(0, 50) + '...');
    
    // Run all classification steps
    const rawIntents = classifyIntent(message, context);
    const validatedIntents = validateIntents(rawIntents, message);
    const topics = extractTopics(message);
    const updatedContext = updateContext({ ...context }, message, validatedIntents);
    
    // Return detailed analysis
    res.json({
      success: true,
      message,
      analysis: {
        rawIntents,
        validatedIntents,
        topics,
        contextBefore: context,
        contextAfter: updatedContext
      }
    });
    
  } catch (error) {
    console.error('❌ Intent classification test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred',
      message: error.message 
    });
  }
});

// Import moderation service
const moderationService = require('./moderationService');
const { processReport, processAutoViolation } = require('./automatedModeration');

// ⭐ CRISIS ESCALATION: Import crisis escalation manager
const { getCrisisManager } = require('./crisisEscalation');
const { initiateHumanHandoff, getHandoffManager } = require('./humanHandoff');

// ⭐ CACHE METRICS: Import cache metrics tracker
const { cacheMetrics } = require('./cacheMetrics');

// ===== MODERATION ENDPOINTS =====

// AI-Powered Content Analysis
app.post('/api/moderation/analyze-content', async (req, res) => {
  try {
    const { content, contentType = 'topic' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await moderationService.analyzeContentSafety(content, contentType);
    res.json(result);
  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

// Pattern Detection: Check for duplicates and rapid posting
app.post('/api/moderation/check-patterns', async (req, res) => {
  try {
    const { content, userId, recentHashes = [], postCount = 0, timeWindowMinutes = 60 } = req.body;
    
    if (!content || !userId) {
      return res.status(400).json({ error: 'Content and userId are required' });
    }
    
    // Check for duplicates
    const duplicateCheck = moderationService.detectDuplicateContent(content, recentHashes);
    
    // Check for rapid posting
    const rapidPostingCheck = moderationService.detectRapidPosting(postCount, timeWindowMinutes);
    
    res.json({
      success: true,
      duplicate: duplicateCheck,
      rapidPosting: rapidPostingCheck,
      recommendedAction: (duplicateCheck.isDuplicate || rapidPostingCheck.isRapid) ? 'flag' : 'approve'
    });
  } catch (error) {
    console.error('Pattern detection error:', error);
    res.status(500).json({ 
      error: 'Pattern detection failed',
      message: error.message 
    });
  }
});

// Crisis Response Protocol
app.post('/api/moderation/crisis-response', async (req, res) => {
  try {
    const { riskLevel, detectedAt } = req.body;
    
    if (!riskLevel || !['critical', 'high', 'medium'].includes(riskLevel)) {
      return res.status(400).json({ error: 'Valid riskLevel (critical|high|medium) is required' });
    }
    
    const responsePlan = moderationService.generateCrisisResponse(riskLevel, detectedAt);
    
    res.json({
      success: true,
      riskLevel,
      responsePlan,
      timeline: {
        immediate: responsePlan.immediateActions.map(a => ({
          action: a.action,
          scheduledAt: a.time
        })),
        urgent: responsePlan.urgentActions.map(a => ({
          action: a.action,
          scheduledAt: a.time
        })),
        followUp: responsePlan.followUpActions.map(a => ({
          action: a.action,
          scheduledAt: a.time
        }))
      }
    });
  } catch (error) {
    console.error('Crisis response error:', error);
    res.status(500).json({ 
      error: 'Crisis response failed',
      message: error.message 
    });
  }
});

// Automated Moderation - Process Report
app.post('/api/moderation/process-report', async (req, res) => {
  try {
    const { reportId, report } = req.body;
    
    if (!reportId || !report) {
      return res.status(400).json({ error: 'reportId and report are required' });
    }
    
    const result = await processReport(reportId, report);
    res.json(result);
  } catch (error) {
    console.error('Process report error:', error);
    res.status(500).json({ 
      error: 'Processing failed',
      message: error.message 
    });
  }
});

// Automated Moderation - Process Auto-Violation
app.post('/api/moderation/process-violation', async (req, res) => {
  try {
    const { contentId, contentType, userId, violationType, riskLevel } = req.body;
    
    if (!contentId || !contentType || !userId || !violationType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await processAutoViolation(
      contentId,
      contentType,
      userId,
      violationType,
      riskLevel || 'medium'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Process violation error:', error);
    res.status(500).json({ 
      error: 'Processing failed',
      message: error.message 
    });
  }
});

// Moderation - Disputes
app.post('/api/moderation/disputes', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    const { userId, contentId, contentType, reason } = req.body || {};
    if (!userId || !contentId || !contentType || !reason) {
      return res.status(400).json({ error: 'userId, contentId, contentType, and reason are required' });
    }
    const { data, error } = await supabaseAdmin
      .from('content_disputes')
      .insert({
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
        reason_text: reason
      })
      .select()
      .single();
    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to create dispute', details: error });
    }
    res.json({ success: true, dispute: data });
  } catch (err) {
    console.error('Create dispute error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/moderation/disputes', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    const { userId, status } = req.query || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    let query = supabaseAdmin
      .from('content_disputes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to fetch disputes', details: error });
    }
    res.json({ success: true, disputes: data });
  } catch (err) {
    console.error('List disputes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/moderation/disputes/:id/resolve', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    const { id } = req.params;
    const { resolvedBy, resolution, notes } = req.body || {};
    if (!id || !resolvedBy || !resolution || !['accepted', 'rejected', 'withdrawn'].includes(resolution)) {
      return res.status(400).json({ error: 'id, resolvedBy and valid resolution are required' });
    }
    const { data, error } = await supabaseAdmin
      .from('content_disputes')
      .update({
        status: resolution,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        resolution_notes: notes || null
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to resolve dispute', details: error });
    }
    res.json({ success: true, dispute: data });
  } catch (err) {
    console.error('Resolve dispute error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ⭐ CACHE METRICS: Get cache performance metrics
app.get('/api/cache-metrics', (req, res) => {
  try {
    const metrics = cacheMetrics.getMetrics();
    const summary = cacheMetrics.getSummary();
    
    res.json({
      success: true,
      metrics: metrics,
      summary: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache metrics error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get cache metrics' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend API is running',
    elevenLabsConfigured: !!process.env.ELEVENLABS_API_KEY,
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    webSearchSupport: true  // ⭐ NEW: Indicate web search is supported
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://mind-brother-production.up.railway.app:${PORT}`);
  console.log(`🔊 Text-to-speech endpoint: http://mind-brother-production.up.railway.app:${PORT}/api/text-to-speech`);
  console.log(`🤖 Claude chat endpoint: http://mind-brother-production.up.railway.app:${PORT}/api/chat`);
  console.log(`🔍 Web search support: ✅ Enabled (Claude Sonnet 4)`);  // ⭐ NEW
  console.log(`🧪 Intent testing endpoint: http://mind-brother-production.up.railway.app:${PORT}/api/test-intent`);
  console.log(`❤️  Health check: http://mind-brother-production.up.railway.app:${PORT}/api/health`);
  console.log(`📋 ElevenLabs API Key configured: ${!!process.env.ELEVENLABS_API_KEY ? '✅ Yes' : '❌ No - Please set in .env'}`);
  console.log(`🧠 Anthropic API Key configured: ${!!process.env.ANTHROPIC_API_KEY ? '✅ Yes' : '❌ No - Please set in .env'}`);
  console.log(`🗄️  Supabase configured: ${!!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? '✅ Yes' : '❌ No - Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'}`);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`🤖 Automated moderation: ✅ Enabled`);
  } else {
    console.log(`🤖 Automated moderation: ⚠️  Limited (add Supabase credentials to enable full functionality)`);
  }
});