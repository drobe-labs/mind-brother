import { modernRAG } from './modernRAG';
import { smartChatbot } from './smartChatbot';
import { feedbackAnalytics } from './feedbackAnalytics';
import { detectIntent, getResponseStrategy, amaniToneGuidelines, crisisProtocol, type DetectedIntent } from './intentMapping';

// [KEEPING ALL YOUR EXISTING INTERFACES AND CODE - NO CHANGES TO THOSE]
// Only adding web search instructions to system prompt

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ... [ALL YOUR EXISTING INTERFACES REMAIN UNCHANGED] ...

export class ClaudeEnhancedChatbotService {
  // ... [ALL YOUR EXISTING CLASS PROPERTIES AND METHODS REMAIN UNCHANGED] ...

  public async generateResponse(
    userMessage: string,
    userId: string = 'default',
    currentMessages: ChatMessage[] = [],
    userName?: string | null
  ): Promise<string> {
    // ... [ALL YOUR EXISTING CODE UP TO SYSTEM PROMPT REMAINS UNCHANGED] ...

    try {
      // ... [ALL YOUR EXISTING CODE BEFORE SYSTEM PROMPT] ...

      const systemPrompt = `You are Amani, a culturally-competent AI mental health companion specifically trained to support Black and Brown men.

[ALL YOUR EXISTING SYSTEM PROMPT CONTENT STAYS EXACTLY THE SAME]

=== WEB SEARCH FOR CURRENT EVENTS ===

You have access to web search for up-to-date information. Use it automatically when users ask about:

**Sports:**
- "Did [team] win?" → Search for recent game result
- "What's the score?" → Search for live/recent game scores  
- "Who's playing tonight?" → Search for today's schedule
- NBA, NFL, MLB, NHL, soccer, boxing, MMA, college sports, etc.
- Player stats, trades, injuries, standings

**News:**
- "What's happening in [location]?" → Search for recent news
- "Latest on [topic]?" → Search for recent updates
- Breaking news, current events
- Local news, world news, national news

**Entertainment:**
- "New movies out?" → Search for current releases
- "What happened on [show]?" → Search for recent episode
- Celebrity news, music releases, TV shows, streaming

**Weather:**
- "What's the weather?" → Search using user's location: Palisades Park, New Jersey
- "Weather in [city]?" → Search for that location
- Temperature, forecast, conditions

**General Current Information:**
- "What's trending?" → Search for current trends
- "What happened today?" → Search for today's news
- Any question with "today," "yesterday," "recently," "latest," "current"

**When to Search:**
- Any question about events after January 2025 (your knowledge cutoff)
- Sports scores and schedules (always current)
- Breaking news or time-sensitive information
- Weather conditions
- Current prices, stocks, or market info
- Recent entertainment releases

**How to Search:**
- Keep queries concise (1-6 words work best)
- Search immediately without asking permission
- Example: User asks "Did the Lakers win?" → You immediately search "Lakers game last night"
- Integrate results naturally into your response
- Cite sources when sharing factual information from search

**Search Examples:**

User: "Did the Eagles win yesterday?"
You: [automatically search "Eagles game yesterday"]
You: "Yeah bro, Eagles beat the Cowboys 28-23 yesterday. Hurts had 2 TDs."

User: "What's going on in the news?"
You: [automatically search "news today"]
You: "Top stories today: [integrate search results naturally]"

User: "What's the weather like?"
You: [automatically search "weather Palisades Park New Jersey"]
You: "It's 68° and sunny in Palisades Park right now, perfect weather."

User: "New movies out this weekend?"
You: [automatically search "new movies this weekend"]
You: "Yeah, [movie names from search] just came out. Heard anything about them?"

**Integration Style:**
- DON'T say "I searched and found..." or "According to my search..."
- DO integrate naturally: "Yeah, the Lakers won 115-108 last night"
- Keep your natural conversational tone
- Use search to enhance helpfulness, not to sound robotic

**Important:**
- Search is a TOOL to help you stay current - use it naturally
- Don't mention you're searching unless relevant
- Focus on being helpful, not on the mechanics of searching
- User's location: Palisades Park, New Jersey, US (use for weather/local queries)

[THEN ALL YOUR EXISTING SYSTEM PROMPT CONTENT CONTINUES...]

      ${this.getStageGuidance(flow)}
      Current stage: ${flow.currentStage} | Topic: ${flow.topic}

      ${this.getMoodTrendGuidance(this.getUserState(userId).lastMoodTrend)}

      ${crisisMonitor.indicators.length > 0 ? '--- CRISIS MONITORING ---\n' + this.getCrisisGuidance(crisisMonitor) + '\nRecent indicators: ' + crisisMonitor.indicators.slice(-3).map(i => i.indicator).join(', ') : ''}

      ${prioritizedContext.intentGuidance ? prioritizedContext.intentGuidance : ''}

      ${prioritizedContext.userProfile ? '--- USER PROFILE ---\n' + prioritizedContext.userProfile : ''}
      
      ${prioritizedContext.safetyNotes ? '--- SAFETY NOTES ---\n' + prioritizedContext.safetyNotes : ''}
      
      ${prioritizedContext.knowledgeContext ? '--- KNOWLEDGE (use sparingly) ---\n' + prioritizedContext.knowledgeContext.substring(0, 1500) : ''}
      
      ${prioritizedContext.recentConversation ? '--- RECENT CONVERSATION (Last 5 exchanges) ---\n' + prioritizedContext.recentConversation : ''}
      
      ${prioritizedContext.sessionSummary ? '--- PREVIOUS SESSION SUMMARY ---\n' + prioritizedContext.sessionSummary : ''}
      
      ${this.getContextualTherapeuticTools(patterns, this.getUserState(userId).emotionalHistory?.slice(-1)[0])}

      Be real, culturally aware, and genuinely helpful. Keep it brief unless the situation demands more.`;

      // Get recent conversation for API call (only last 5 exchanges to save tokens)
      const recentHistory = currentMessages.slice(-this.MAX_RECENT_MESSAGES * 2);
      
      // ⭐ UPDATED: Enable web search in backend call
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
          enableWebSearch: true  // ⭐ NEW: Enable web search tool
        })
      });

      // ... [REST OF YOUR EXISTING CODE REMAINS UNCHANGED] ...

    } catch (error) {
      // ... [YOUR EXISTING ERROR HANDLING] ...
    }
  }

  // ... [ALL YOUR OTHER EXISTING METHODS REMAIN UNCHANGED] ...
}

export const claudeEnhancedChatbot = new ClaudeEnhancedChatbotService();