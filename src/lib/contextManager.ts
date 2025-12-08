// Context Window Manager
// Manages conversation history with short/medium/long-term memory
// Implements smart summarization to prevent token overflow

export interface ContextWindow {
  shortTerm: number;  // Last N messages for immediate context
  mediumTerm: number; // Last N for pattern detection
  longTerm: number;   // Last N kept in memory (total)
  summarizationThreshold: number; // Summarize if more than this many messages
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  classification?: any;
  emotionalIntensity?: number;
}

export class ContextManager {
  
  // Configurable context window sizes
  public contextWindow: ContextWindow = {
    shortTerm: 5,    // Last 5 messages (immediate context for next response)
    mediumTerm: 10,  // Last 10 messages (pattern detection, topic tracking)
    longTerm: 20,    // Last 20 messages (kept in memory, older pruned)
    summarizationThreshold: 15 // Summarize if more than 15 messages
  };
  
  // Conversation summaries (keyed by userId_sessionId)
  private conversationSummaries: Map<string, string> = new Map();
  
  // Conversation storage (keyed by userId_sessionId)
  private conversations: Map<string, ConversationMessage[]> = new Map();
  
  /**
   * Add message to conversation history
   */
  public addMessage(
    userId: string,
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: { classification?: any; emotionalIntensity?: number }
  ): void {
    const key = `${userId}_${sessionId}`;
    
    if (!this.conversations.has(key)) {
      this.conversations.set(key, []);
    }
    
    const conversation = this.conversations.get(key)!;
    
    conversation.push({
      role,
      content,
      timestamp: new Date(),
      classification: metadata?.classification,
      emotionalIntensity: metadata?.emotionalIntensity
    });
    
    // Prune if exceeds long-term window
    if (conversation.length > this.contextWindow.longTerm * 2) { // *2 for user+assistant pairs
      const keepCount = this.contextWindow.longTerm * 2;
      this.conversations.set(key, conversation.slice(-keepCount));
    }
  }
  
  /**
   * Get short-term context (last 5 messages)
   * Use for: Immediate response generation
   */
  public getShortTermContext(userId: string, sessionId: string): ConversationMessage[] {
    const key = `${userId}_${sessionId}`;
    const conversation = this.conversations.get(key) || [];
    return conversation.slice(-this.contextWindow.shortTerm * 2); // *2 for pairs
  }
  
  /**
   * Get medium-term context (last 10 messages)
   * Use for: Pattern detection, topic consistency
   */
  public getMediumTermContext(userId: string, sessionId: string): ConversationMessage[] {
    const key = `${userId}_${sessionId}`;
    const conversation = this.conversations.get(key) || [];
    return conversation.slice(-this.contextWindow.mediumTerm * 2);
  }
  
  /**
   * Get full long-term context (last 20 messages)
   * Use for: Session summaries, comprehensive analysis
   */
  public getLongTermContext(userId: string, sessionId: string): ConversationMessage[] {
    const key = `${userId}_${sessionId}`;
    return this.conversations.get(key) || [];
  }
  
  /**
   * Get last user message
   */
  public getLastUserMessage(userId: string, sessionId: string): ConversationMessage | null {
    const conversation = this.getLongTermContext(userId, sessionId);
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].role === 'user') {
        return conversation[i];
      }
    }
    return null;
  }
  
  /**
   * Get last assistant message
   */
  public getLastAssistantMessage(userId: string, sessionId: string): ConversationMessage | null {
    const conversation = this.getLongTermContext(userId, sessionId);
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].role === 'assistant') {
        return conversation[i];
      }
    }
    return null;
  }
  
  /**
   * Detect recurring topics in medium-term context
   */
  public getRecurringTopics(userId: string, sessionId: string): string[] {
    const context = this.getMediumTermContext(userId, sessionId);
    const topics: { [key: string]: number } = {};
    
    context.forEach(msg => {
      if (msg.classification?.category) {
        topics[msg.classification.category] = (topics[msg.classification.category] || 0) + 1;
      }
    });
    
    // Return topics mentioned 3+ times
    return Object.entries(topics)
      .filter(([_, count]) => count >= 3)
      .map(([topic, _]) => topic);
  }
  
  /**
   * Get emotional trend (improving, stable, declining)
   */
  public getEmotionalTrend(userId: string, sessionId: string): 'improving' | 'stable' | 'declining' | 'unknown' {
    const context = this.getMediumTermContext(userId, sessionId);
    const userMessages = context.filter(msg => msg.role === 'user');
    
    if (userMessages.length < 3) {
      return 'unknown';
    }
    
    // Get emotional intensities
    const intensities = userMessages
      .map(msg => msg.emotionalIntensity || 5)
      .filter(i => i > 0);
    
    if (intensities.length < 3) {
      return 'unknown';
    }
    
    // Compare recent vs earlier
    const recent = intensities.slice(-3).reduce((a, b) => a + b) / 3;
    const earlier = intensities.slice(0, 3).reduce((a, b) => a + b) / 3;
    
    if (recent < earlier - 1) return 'improving'; // Intensity decreasing = improving
    if (recent > earlier + 1) return 'declining'; // Intensity increasing = declining
    return 'stable';
  }
  
  /**
   * Check if user is responding to a question
   */
  public isResponseToQuestion(userId: string, sessionId: string): boolean {
    const lastAssistant = this.getLastAssistantMessage(userId, sessionId);
    return lastAssistant ? lastAssistant.content.includes('?') : false;
  }
  
  /**
   * Get conversation summary
   */
  public getConversationSummary(userId: string, sessionId: string): {
    messageCount: number;
    duration: number; // minutes
    mainTopics: string[];
    emotionalTrend: string;
    avgEmotionalIntensity: number;
  } {
    const conversation = this.getLongTermContext(userId, sessionId);
    
    if (conversation.length === 0) {
      return {
        messageCount: 0,
        duration: 0,
        mainTopics: [],
        emotionalTrend: 'unknown',
        avgEmotionalIntensity: 0
      };
    }
    
    const userMessages = conversation.filter(msg => msg.role === 'user');
    const duration = (conversation[conversation.length - 1].timestamp.getTime() - 
                     conversation[0].timestamp.getTime()) / 1000 / 60; // minutes
    
    const topics = this.getRecurringTopics(userId, sessionId);
    const trend = this.getEmotionalTrend(userId, sessionId);
    
    const intensities = userMessages
      .map(msg => msg.emotionalIntensity || 5)
      .filter(i => i > 0);
    const avgIntensity = intensities.length > 0 
      ? intensities.reduce((a, b) => a + b) / intensities.length 
      : 5;
    
    return {
      messageCount: Math.floor(conversation.length / 2), // Pairs
      duration: Math.round(duration),
      mainTopics: topics,
      emotionalTrend: trend,
      avgEmotionalIntensity: Math.round(avgIntensity * 10) / 10
    };
  }
  
  /**
   * Clear conversation
   */
  public clearConversation(userId: string, sessionId: string): void {
    const key = `${userId}_${sessionId}`;
    this.conversations.delete(key);
  }
  
  /**
   * Get all active sessions for a user
   */
  public getUserSessions(userId: string): Array<{
    sessionId: string;
    messageCount: number;
    lastActivity: Date;
  }> {
    const sessions: Array<{
      sessionId: string;
      messageCount: number;
      lastActivity: Date;
    }> = [];
    
    for (const [key, conversation] of this.conversations.entries()) {
      if (key.startsWith(userId + '_')) {
        const sessionId = key.split('_')[1];
        sessions.push({
          sessionId,
          messageCount: Math.floor(conversation.length / 2),
          lastActivity: conversation[conversation.length - 1]?.timestamp || new Date()
        });
      }
    }
    
    return sessions;
  }
  
  /**
   * Adjust context window sizes
   */
  public setContextWindow(window: Partial<ContextWindow>): void {
    this.contextWindow = { ...this.contextWindow, ...window };
    console.log('✅ Context window updated:', this.contextWindow);
  }
  
  /**
   * Get current context window settings
   */
  public getContextWindow(): ContextWindow {
    return { ...this.contextWindow };
  }
  
  // ===== SMART SUMMARIZATION =====
  
  /**
   * Get context with smart summarization
   * If conversation is too long, summarize old messages and keep recent ones
   */
  public async getSmartContext(
    userId: string,
    sessionId: string,
    maxMessages: number = 10
  ): Promise<ConversationMessage[]> {
    const key = `${userId}_${sessionId}`;
    const conversation = this.conversations.get(key) || [];
    
    // If conversation is short enough, return as-is
    if (conversation.length <= this.contextWindow.summarizationThreshold) {
      return conversation.slice(-maxMessages * 2); // *2 for user+assistant pairs
    }
    
    // Otherwise, summarize old messages and return recent ones
    const recentCount = maxMessages * 2;
    const recentMessages = conversation.slice(-recentCount);
    const oldMessages = conversation.slice(0, -recentCount);
    
    // Get or create summary
    let summary = this.conversationSummaries.get(key);
    if (!summary || oldMessages.length > 0) {
      summary = await this.summarizeMessages(oldMessages);
      this.conversationSummaries.set(key, summary);
    }
    
    // Return summary + recent messages
    return [
      {
        role: 'assistant',
        content: `[Previous conversation summary: ${summary}]`,
        timestamp: new Date(oldMessages[oldMessages.length - 1]?.timestamp || new Date())
      },
      ...recentMessages
    ];
  }
  
  /**
   * Summarize old messages
   * Can use Claude API or local summarization
   */
  private async summarizeMessages(messages: ConversationMessage[]): Promise<string> {
    if (messages.length === 0) {
      return '';
    }
    
    // Try Claude summarization (if available)
    try {
      return await this.claudeSummarize(messages);
    } catch (error) {
      console.warn('Claude summarization failed, using local:', error);
      return this.localSummarize(messages);
    }
  }
  
  /**
   * Claude-powered summarization (accurate but costs tokens)
   */
  private async claudeSummarize(messages: ConversationMessage[]): Promise<string> {
    // Convert messages to text
    const conversation = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Amani'}: ${m.content}`)
      .join('\n');
    
    // This would call Claude API with summarization prompt
    // For now, return a structured local summary
    // In production: const summary = await callClaudeAPI(conversation);
    
    return this.localSummarize(messages);
  }
  
  /**
   * Local summarization (fast, free, but less accurate)
   */
  private localSummarize(messages: ConversationMessage[]): string {
    if (messages.length === 0) {
      return 'No previous conversation.';
    }
    
    // Extract key information
    const topics = new Set<string>();
    const crisisDetected = messages.some(m => 
      m.classification?.category === 'CRISIS'
    );
    
    messages.forEach(m => {
      if (m.classification?.category) {
        topics.add(m.classification.category);
      }
    });
    
    // Build summary
    const parts = [];
    parts.push(`Discussed ${messages.length / 2} topics`);
    
    if (topics.size > 0) {
      parts.push(`including ${Array.from(topics).join(', ').toLowerCase()}`);
    }
    
    if (crisisDetected) {
      parts.push('(⚠️ previous crisis discussion)');
    }
    
    // Add emotional trend
    const intensities = messages
      .filter(m => m.emotionalIntensity !== undefined)
      .map(m => m.emotionalIntensity!);
    
    if (intensities.length >= 2) {
      const first = intensities[0];
      const last = intensities[intensities.length - 1];
      
      if (last < first - 2) {
        parts.push('- user improved');
      } else if (last > first + 2) {
        parts.push('- user declined');
      }
    }
    
    return parts.join(' ');
  }
  
  /**
   * Get token count estimate (simple approximation)
   * ~4 chars = 1 token for English
   */
  public estimateTokenCount(userId: string, sessionId: string): number {
    const key = `${userId}_${sessionId}`;
    const conversation = this.conversations.get(key) || [];
    
    const totalChars = conversation.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }
  
  /**
   * Check if conversation needs summarization
   */
  public needsSummarization(userId: string, sessionId: string): boolean {
    const key = `${userId}_${sessionId}`;
    const conversation = this.conversations.get(key) || [];
    return conversation.length > this.contextWindow.summarizationThreshold;
  }
  
  /**
   * Force summarization for a conversation
   */
  public async forceSummarize(userId: string, sessionId: string): Promise<string> {
    const key = `${userId}_${sessionId}`;
    const conversation = this.conversations.get(key) || [];
    
    const summary = await this.summarizeMessages(conversation);
    this.conversationSummaries.set(key, summary);
    
    return summary;
  }
  
  /**
   * Clear summary (forces re-summarization on next call)
   */
  public clearSummary(userId: string, sessionId: string): void {
    const key = `${userId}_${sessionId}`;
    this.conversationSummaries.delete(key);
  }
}

// Export singleton instance
export const contextManager = new ContextManager();

