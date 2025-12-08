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
  if (message.match(/work|job|career|employ|boss/)) topics.push('work');
  if (message.match(/depress|anxi|stress|worry|overwhelm/)) topics.push('mental health');
  if (message.match(/guilt|shame|inadequate|failure/)) topics.push('self-worth');
  if (message.match(/family|parent|child|kid/)) topics.push('family');
  
  return topics;
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

// Claude API chat endpoint - ENHANCED with context tracking
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      userMessage, 
      conversationHistory, 
      systemPrompt,
      context = { topics: [], emotionalState: null, recentIntents: [] },
      debug = false 
    } = req.body;
    
    console.log('🤖 Claude API request received:', { 
      userMessage: userMessage?.substring(0, 50) + '...',
      historyLength: conversationHistory?.length || 0,
      hasSystemPrompt: !!systemPrompt,
      hasContext: !!context,
      debugMode: debug
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
    
    // Prepare messages for Claude
    const messages = [];
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    // ENHANCED: Classify intents with context awareness
    const rawIntents = classifyIntent(userMessage, context);
    const intents = validateIntents(rawIntents, userMessage);
    const topics = extractTopics(userMessage);
    
    console.log('🔍 Detected intents:', intents);
    console.log('📝 Extracted topics:', topics);
    
    console.log('🧠 Calling Claude API...');
    const startTime = Date.now();
    
    // Log system prompt size for debugging
    const promptSize = systemPrompt ? systemPrompt.length : 0;
    console.log(`📏 System prompt size: ${promptSize} characters (${Math.round(promptSize/4)} estimated tokens)`);
    
    // Call Claude API
    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Claude Sonnet 4.5 (latest model)
      max_tokens: 1000,
      system: systemPrompt || 'You are a helpful AI assistant.',
      messages: messages
    });
    
    const claudeTime = Date.now() - startTime;
    console.log(`⏱️ Claude API took ${claudeTime}ms (${(claudeTime/1000).toFixed(2)}s)`);
    
    let responseText = claudeResponse.content[0].text;
    let totalUsage = {
      input_tokens: claudeResponse.usage.input_tokens,
      output_tokens: claudeResponse.usage.output_tokens
    };
    
    console.log('✅ Claude response generated:', responseText.substring(0, 100) + '...');
    
    // ENHANCED: Update context for next message
    const updatedContext = updateContext({ ...context }, userMessage, intents);
    
    // Validate response to catch inappropriate physical health suggestions
    const validation = validateResponse(userMessage, responseText, intents);
    
    if (!validation.valid) {
      console.log('⚠️ Response validation failed, requesting corrected response...');
      console.log('   Reason:', validation.reason);
      
      // Request a corrected response
      const correctionMessages = [
        ...messages,
        { role: 'assistant', content: responseText },
        { 
          role: 'user', 
          content: 'Please refocus on the emotional and psychological aspects of what I shared, rather than physical health concerns like sleep or physical rest. I need support for the mental and emotional burden, not physical tiredness.' 
        }
      ];

      const correctedResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1000,
        system: systemPrompt || 'You are a helpful AI assistant.',
        messages: correctionMessages
      });

      responseText = correctedResponse.content[0].text;
      
      // Add correction tokens to usage
      totalUsage.input_tokens += correctedResponse.usage.input_tokens;
      totalUsage.output_tokens += correctedResponse.usage.output_tokens;
      
      console.log('✅ Corrected response generated:', responseText.substring(0, 100) + '...');
    }
    
    // Prepare response with enhanced metadata
    const responseData = {
      success: true,
      response: responseText,
      context: updatedContext, // ENHANCED: Return updated context for next message
      metadata: {
        intents,
        topics,
        validation
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
        contextAfter: updatedContext
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend API is running',
    elevenLabsConfigured: !!process.env.ELEVENLABS_API_KEY,
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔊 Text-to-speech endpoint: http://localhost:${PORT}/api/text-to-speech`);
  console.log(`🤖 Claude chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🧪 Intent testing endpoint: http://localhost:${PORT}/api/test-intent`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 ElevenLabs API Key configured: ${!!process.env.ELEVENLABS_API_KEY ? '✅ Yes' : '❌ No - Please set in .env'}`);
  console.log(`🧠 Anthropic API Key configured: ${!!process.env.ANTHROPIC_API_KEY ? '✅ Yes' : '❌ No - Please set in .env'}`);
  console.log(`🗄️  Supabase configured: ${!!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? '✅ Yes' : '❌ No - Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'}`);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(`🤖 Automated moderation: ✅ Enabled`);
  } else {
    console.log(`🤖 Automated moderation: ⚠️  Limited (add Supabase credentials to enable full functionality)`);
  }
});