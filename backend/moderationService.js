// moderationService.js
// Community Moderation Service with AI Analysis, Pattern Detection, and Crisis Response

const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * AI-Powered Content Analysis
 * Uses Claude API for nuanced content safety detection
 */
async function analyzeContentSafety(content, contentType = 'topic') {
  try {
    const prompt = `You are a content safety moderator for a mental health support community.

Analyze this ${contentType} for:
1. Crisis indicators (suicide risk, immediate danger)
2. Harmful advice (medical advice, dangerous suggestions)
3. Bullying or harassment
4. Content that needs trigger warning but doesn't have one
5. Overall tone (supportive vs harmful)

${contentType === 'topic' ? 'Post Title: ' : 'Reply Content: '}${content}

Respond with JSON only:
{
  "riskLevel": "none|low|medium|high|critical",
  "concerns": ["concern1", "concern2"],
  "needsTriggerWarning": true/false,
  "suggestedTriggerWarning": "TW: topic",
  "recommendedAction": "none|flag|remove|crisis_response",
  "reasoning": "brief explanation"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const analysisText = response.content[0].text;
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      analysis: {
        ...analysis,
        analyzedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      success: false,
      error: error.message,
      analysis: {
        riskLevel: 'medium', // Default to medium if analysis fails
        concerns: ['AI analysis unavailable'],
        needsTriggerWarning: false,
        recommendedAction: 'flag'
      }
    };
  }
}

/**
 * Pattern Detection: Duplicate Content
 */
function detectDuplicateContent(content, recentHashes = []) {
  // Simple hash-based duplicate detection
  const contentHash = createContentHash(content);
  
  if (recentHashes.includes(contentHash)) {
    return {
      isDuplicate: true,
      hash: contentHash
    };
  }
  
  return {
    isDuplicate: false,
    hash: contentHash
  };
}

function createContentHash(content) {
  // Normalize content: lowercase, remove punctuation, trim whitespace
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100); // First 100 chars for hash
  
  // Simple hash (for production, use crypto)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

/**
 * Pattern Detection: Rapid Posting
 */
function detectRapidPosting(postCount, timeWindowMinutes = 60) {
  const POST_LIMIT = 5; // Max 5 posts per hour
  
  if (postCount >= POST_LIMIT) {
    return {
      isRapid: true,
      postsCount: postCount,
      limit: POST_LIMIT,
      windowMinutes: timeWindowMinutes
    };
  }
  
  return {
    isRapid: false,
    postsCount: postCount,
    limit: POST_LIMIT
  };
}

/**
 * Crisis Response Protocol
 * Returns timeline and actions for crisis response
 */
function generateCrisisResponse(riskLevel, detectedAt) {
  const now = new Date(detectedAt || new Date());
  
  const timelines = {
    critical: {
      // Immediate (0-2 min)
      immediateActions: [
        { action: 'alert_moderator', time: now },
        { action: 'add_crisis_resources', time: now }
      ],
      // Urgent (2-5 min)
      urgentActions: [
        { action: 'send_direct_message', time: new Date(now.getTime() + 2 * 60000) }
      ],
      // Follow-up (5-15 min)
      followUpActions: [
        { action: 'check_response', time: new Date(now.getTime() + 5 * 60000) },
        { action: 'escalate_if_no_response', time: new Date(now.getTime() + 15 * 60000) }
      ]
    },
    high: {
      immediateActions: [
        { action: 'add_crisis_resources', time: now }
      ],
      urgentActions: [
        { action: 'send_direct_message', time: new Date(now.getTime() + 15 * 60000) }
      ],
      followUpActions: [
        { action: 'check_response', time: new Date(now.getTime() + 60 * 60000) }
      ]
    },
    medium: {
      immediateActions: [
        { action: 'flag_for_review', time: now }
      ],
      urgentActions: [],
      followUpActions: [
        { action: 'moderator_comment', time: new Date(now.getTime() + 4 * 60 * 60000) }
      ]
    }
  };
  
  return timelines[riskLevel] || timelines.medium;
}

/**
 * Determine Report Priority
 */
function determineReportPriority(reason, reportCount = 1, userHistory = {}) {
  // P0: Critical (Immediate Response)
  if (reason === 'crisis' || reportCount >= 3) {
    return 'P0';
  }
  
  // P1: High Priority (1 hour)
  if (reason === 'harmful' || reason === 'harassment' || reportCount >= 2 || userHistory.warnings > 0) {
    return 'P1';
  }
  
  // P2: Medium Priority (4 hours)
  if (reason === 'trigger_warning' || reason === 'spam' || userHistory.reports > 0) {
    return 'P2';
  }
  
  // P3: Low Priority (24 hours)
  return 'P3';
}

module.exports = {
  analyzeContentSafety,
  detectDuplicateContent,
  detectRapidPosting,
  generateCrisisResponse,
  determineReportPriority,
  createContentHash
};






