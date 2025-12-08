// Human Handoff System
// Manages seamless transition from AI to human support

class HumanHandoffManager {
  constructor() {
    this.activeHandoffs = new Map(); // userId -> handoff info
    this.pendingTickets = [];
    this.assignedTickets = [];
    this.completedHandoffs = [];
  }
  
  /**
   * Initiate human handoff
   */
  async initiateHumanHandoff(userId, sessionId, reason, context = {}) {
    const timestamp = new Date();
    
    // Determine priority based on reason
    const priority = this.determinePriority(reason);
    
    // Get conversation history
    const conversation = context.conversation || { messages: [], classifications: [] };
    
    // Create conversation summary
    const summary = this.summarizeConversation(conversation);
    
    // Create handoff ticket
    const ticket = {
      ticketId: `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId,
      reason,
      priority,
      conversationSummary: summary,
      lastMessages: conversation.messages?.slice(-10) || [],
      classifications: conversation.classifications || [],
      sentiment: context.emotionalTrend?.slice(-5) || [],
      createdAt: timestamp,
      status: 'PENDING',
      assignedTo: null,
      estimatedWait: this.getEstimatedWait(priority),
      metadata: {
        totalMessages: conversation.messages?.length || 0,
        avgSentiment: this.calculateAvgSentiment(context.emotionalTrend || []),
        topCategories: this.getTopCategories(conversation.classifications || [])
      }
    };
    
    // Store active handoff
    this.activeHandoffs.set(userId, ticket);
    this.pendingTickets.push(ticket);
    
    console.log(`\n🤝 HUMAN HANDOFF INITIATED`);
    console.log(`   User: ${userId}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Priority: ${priority}`);
    console.log(`   Ticket ID: ${ticket.ticketId}`);
    console.log(`   Estimated wait: ${ticket.estimatedWait}`);
    
    // Notify appropriate team
    if (reason === 'CRISIS' || priority === 'URGENT') {
      await this.notifyEmergencyTeam(ticket);
    } else if (priority === 'HIGH') {
      await this.notifyModerationQueue(ticket);
    } else {
      await this.notifyGeneralSupport(ticket);
    }
    
    // TODO: Insert to database
    // await db.handoffs.insert(ticket);
    
    // Generate user-facing message
    const userMessage = this.generateHandoffMessage(reason, priority, ticket.estimatedWait);
    
    return {
      success: true,
      ticket: ticket,
      message: userMessage.message,
      estimatedWait: ticket.estimatedWait,
      crisisResources: (reason === 'CRISIS' || priority === 'URGENT') ? this.getCrisisResources() : null,
      displayMode: priority === 'URGENT' ? 'HANDOFF_URGENT' : 'HANDOFF_NORMAL'
    };
  }
  
  /**
   * Determine priority based on reason
   */
  determinePriority(reason) {
    const urgentReasons = ['CRISIS', 'SEVERE_DISTRESS', 'IMMEDIATE_DANGER', 'SELF_HARM'];
    const highReasons = ['MODERATE_CRISIS', 'REPEATED_ISSUES', 'ESCALATING', 'AI_LIMITATION'];
    
    if (urgentReasons.includes(reason)) {
      return 'URGENT';
    } else if (highReasons.includes(reason)) {
      return 'HIGH';
    } else {
      return 'MEDIUM';
    }
  }
  
  /**
   * Get estimated wait time based on priority
   */
  getEstimatedWait(priority) {
    switch (priority) {
      case 'URGENT':
        return '< 5 minutes';
      case 'HIGH':
        return '< 15 minutes';
      case 'MEDIUM':
        return '< 30 minutes';
      default:
        return '< 1 hour';
    }
  }
  
  /**
   * Summarize conversation for human counselor
   */
  summarizeConversation(conversation) {
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return 'No conversation history available.';
    }
    
    const messages = conversation.messages;
    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.role === 'user').length;
    
    // Get main topics
    const classifications = conversation.classifications || [];
    const topics = [...new Set(classifications.map(c => c.category))];
    
    // Get emotional trend
    const sentiment = conversation.emotionalTrend || [];
    const avgSentiment = sentiment.length > 0 
      ? (sentiment.reduce((sum, s) => sum + s, 0) / sentiment.length).toFixed(1)
      : 'N/A';
    
    // Get key issues mentioned
    const userMessageTexts = messages.filter(m => m.role === 'user').map(m => m.content);
    const keyIssues = this.extractKeyIssues(userMessageTexts);
    
    return {
      totalMessages,
      userMessages,
      topics: topics.join(', '),
      avgSentiment,
      keyIssues: keyIssues.join(', '),
      duration: this.calculateDuration(messages),
      recentContext: userMessageTexts.slice(-3).join(' | ')
    };
  }
  
  /**
   * Extract key issues from messages
   */
  extractKeyIssues(messages) {
    const keywords = {
      'work': ['job', 'work', 'career', 'employed', 'unemployment', 'laid off', 'fired'],
      'relationship': ['girlfriend', 'boyfriend', 'wife', 'husband', 'partner', 'relationship', 'divorce'],
      'family': ['family', 'parents', 'father', 'mother', 'kids', 'children'],
      'mental_health': ['depressed', 'anxiety', 'stressed', 'hopeless', 'overwhelmed'],
      'financial': ['money', 'bills', 'debt', 'financial', 'rent', 'mortgage'],
      'identity': ['black', 'race', 'racism', 'discrimination', 'microaggression']
    };
    
    const issues = new Set();
    const allText = messages.join(' ').toLowerCase();
    
    for (const [issue, terms] of Object.entries(keywords)) {
      if (terms.some(term => allText.includes(term))) {
        issues.add(issue);
      }
    }
    
    return Array.from(issues);
  }
  
  /**
   * Calculate conversation duration
   */
  calculateDuration(messages) {
    if (!messages || messages.length < 2) return 'N/A';
    
    const first = new Date(messages[0].timestamp);
    const last = new Date(messages[messages.length - 1].timestamp);
    const durationMs = last - first;
    const durationMin = Math.round(durationMs / 60000);
    
    return `${durationMin} minutes`;
  }
  
  /**
   * Calculate average sentiment
   */
  calculateAvgSentiment(emotionalTrend) {
    if (!emotionalTrend || emotionalTrend.length === 0) return 0;
    return (emotionalTrend.reduce((sum, s) => sum + s, 0) / emotionalTrend.length).toFixed(1);
  }
  
  /**
   * Get top categories
   */
  getTopCategories(classifications) {
    if (!classifications || classifications.length === 0) return [];
    
    const categoryCounts = {};
    for (const cls of classifications) {
      categoryCounts[cls.category] = (categoryCounts[cls.category] || 0) + 1;
    }
    
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }
  
  /**
   * Notify emergency team (URGENT)
   */
  async notifyEmergencyTeam(ticket) {
    console.log(`   🚨 EMERGENCY TEAM NOTIFIED (URGENT)`);
    console.log(`   Ticket: ${ticket.ticketId}`);
    console.log(`   Priority: ${ticket.priority}`);
    
    // TODO: Send actual notifications
    // await sendSMS(EMERGENCY_TEAM_PHONE, `URGENT: Handoff ${ticket.ticketId}`);
    // await sendSlackPing(EMERGENCY_CHANNEL, ticket);
    // await sendEmail(EMERGENCY_TEAM_EMAIL, ticket);
    // await triggerPagerDuty(ticket);
    
    return { success: true, channel: 'emergency', method: 'SMS + Slack + Email + PagerDuty' };
  }
  
  /**
   * Notify moderation queue (HIGH)
   */
  async notifyModerationQueue(ticket) {
    console.log(`   📋 MODERATION QUEUE NOTIFIED (HIGH)`);
    console.log(`   Ticket: ${ticket.ticketId}`);
    
    // TODO: Send actual notifications
    // await sendSlackMessage(MODERATION_CHANNEL, ticket);
    // await sendEmail(MODERATION_TEAM_EMAIL, ticket);
    
    return { success: true, channel: 'moderation', method: 'Slack + Email' };
  }
  
  /**
   * Notify general support (MEDIUM)
   */
  async notifyGeneralSupport(ticket) {
    console.log(`   💬 GENERAL SUPPORT NOTIFIED (MEDIUM)`);
    console.log(`   Ticket: ${ticket.ticketId}`);
    
    // TODO: Send actual notifications
    // await sendEmail(SUPPORT_TEAM_EMAIL, ticket);
    // await addToDashboard(ticket);
    
    return { success: true, channel: 'support', method: 'Email + Dashboard' };
  }
  
  /**
   * Generate handoff message for user
   */
  generateHandoffMessage(reason, priority, estimatedWait) {
    if (priority === 'URGENT') {
      return {
        message: `I want to make sure you get the best support right now. I'm connecting you with a human crisis counselor immediately.

**What happens next:**
• A trained counselor will be with you in ${estimatedWait}
• They can see our conversation to help you faster
• You'll get personalized, human support

**While you wait (${estimatedWait}):**
If you need immediate help, please:
• Call 988 (Suicide & Crisis Lifeline)
• Text "HELLO" to 741741 (Crisis Text Line)
• Call 911 if you're in immediate danger

I'm here with you until the counselor arrives. How are you doing right now?`,
        tone: 'urgent_supportive'
      };
    } else if (priority === 'HIGH') {
      return {
        message: `I want to make sure you get the support you deserve. I'm connecting you with a human counselor who can provide more personalized help.

**What happens next:**
• A counselor will join our conversation in ${estimatedWait}
• They can see our conversation history to understand your situation
• You'll get specialized support tailored to your needs

**Estimated wait time:** ${estimatedWait}

I'll stay here with you until they arrive. Is there anything you'd like me to know or pass along to the counselor?`,
        tone: 'supportive'
      };
    } else {
      return {
        message: `I think you'd benefit from talking with a human counselor who can provide more specialized support.

**What happens next:**
• A counselor will reach out to you in ${estimatedWait}
• They'll have access to our conversation
• You'll get personalized guidance

**Estimated wait time:** ${estimatedWait}

In the meantime, I'm still here to talk. What would you like to discuss?`,
        tone: 'helpful'
      };
    }
  }
  
  /**
   * Get crisis resources
   */
  getCrisisResources() {
    return {
      primary: {
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        text: 'Text "HELLO" to 741741',
        url: 'https://988lifeline.org',
        available: '24/7, free and confidential'
      },
      secondary: {
        name: 'Crisis Text Line',
        phone: null,
        text: 'Text "HELLO" to 741741',
        url: 'https://www.crisistextline.org',
        available: '24/7, text-based support'
      },
      emergency: {
        name: 'Emergency Services',
        phone: '911',
        text: null,
        url: null,
        available: 'Immediate danger only'
      }
    };
  }
  
  /**
   * Assign handoff to counselor
   */
  async assignHandoff(ticketId, counselorId, counselorName) {
    const ticket = this.pendingTickets.find(t => t.ticketId === ticketId);
    
    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }
    
    ticket.status = 'ASSIGNED';
    ticket.assignedTo = counselorId;
    ticket.assignedToName = counselorName;
    ticket.assignedAt = new Date();
    
    // Move to assigned
    this.pendingTickets = this.pendingTickets.filter(t => t.ticketId !== ticketId);
    this.assignedTickets.push(ticket);
    
    console.log(`✅ Handoff assigned: ${ticketId} → ${counselorName}`);
    
    return { success: true, ticket };
  }
  
  /**
   * Complete handoff
   */
  async completeHandoff(ticketId, outcome) {
    const ticket = this.assignedTickets.find(t => t.ticketId === ticketId);
    
    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }
    
    ticket.status = 'COMPLETED';
    ticket.completedAt = new Date();
    ticket.outcome = outcome;
    ticket.durationMinutes = Math.round((ticket.completedAt - ticket.createdAt) / 60000);
    
    // Move to completed
    this.assignedTickets = this.assignedTickets.filter(t => t.ticketId !== ticketId);
    this.completedHandoffs.push(ticket);
    
    // Remove from active handoffs
    this.activeHandoffs.delete(ticket.userId);
    
    console.log(`✅ Handoff completed: ${ticketId} (${ticket.durationMinutes} minutes)`);
    
    return { success: true, ticket };
  }
  
  /**
   * Get handoff statistics
   */
  getHandoffStats() {
    return {
      active: this.activeHandoffs.size,
      pending: this.pendingTickets.length,
      assigned: this.assignedTickets.length,
      completed: this.completedHandoffs.length,
      avgResponseTime: this.calculateAvgResponseTime(),
      priorityBreakdown: this.getPriorityBreakdown()
    };
  }
  
  /**
   * Calculate average response time
   */
  calculateAvgResponseTime() {
    const completed = this.completedHandoffs.filter(h => h.assignedAt);
    
    if (completed.length === 0) return 'N/A';
    
    const totalTime = completed.reduce((sum, h) => {
      return sum + (new Date(h.assignedAt) - new Date(h.createdAt));
    }, 0);
    
    const avgMs = totalTime / completed.length;
    const avgMin = Math.round(avgMs / 60000);
    
    return `${avgMin} minutes`;
  }
  
  /**
   * Get priority breakdown
   */
  getPriorityBreakdown() {
    const all = [...this.pendingTickets, ...this.assignedTickets];
    
    return {
      URGENT: all.filter(t => t.priority === 'URGENT').length,
      HIGH: all.filter(t => t.priority === 'HIGH').length,
      MEDIUM: all.filter(t => t.priority === 'MEDIUM').length
    };
  }
  
  /**
   * Get pending tickets (for dashboard)
   */
  getPendingTickets(priority = null) {
    if (priority) {
      return this.pendingTickets.filter(t => t.priority === priority);
    }
    return this.pendingTickets;
  }
}

// Singleton instance
let handoffManager = null;

/**
 * Get or create the handoff manager
 */
function getHandoffManager() {
  if (!handoffManager) {
    handoffManager = new HumanHandoffManager();
  }
  return handoffManager;
}

/**
 * Initiate handoff
 */
async function initiateHumanHandoff(userId, sessionId, reason, context = {}) {
  return getHandoffManager().initiateHumanHandoff(userId, sessionId, reason, context);
}

module.exports = {
  HumanHandoffManager,
  getHandoffManager,
  initiateHumanHandoff
};












