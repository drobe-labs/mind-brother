// Mental Health Chatbot - Clean API with userId and sessionId support
// Integrates classification, RAG, and response generation

import { intelligentChatbot } from './intelligentChatbot';
import { hybridClassifier } from './hybridClassifier';

export class MentalHealthChatbot {
  constructor() {
    // Session storage for conversation history
    this.sessions = new Map();
  }

  /**
   * Main method: Process a user message with userId and sessionId tracking
   * 
   * @param {string} userId - Unique user identifier
   * @param {string} sessionId - Conversation session identifier
   * @param {string} message - User's message
   * @returns {Promise<Object>} Response with classification metadata
   */
  async processMessage(userId, sessionId, message) {
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
      
      // Generate response using intelligent chatbot
      const { response, classification, ragDocuments } = 
        await intelligentChatbot.generateResponse(message);
      
      // Add to session history
      session.conversationHistory.push(
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response, timestamp: new Date(), classification }
      );
      
      // Keep last 20 messages only
      if (session.conversationHistory.length > 40) {
        session.conversationHistory = session.conversationHistory.slice(-40);
      }
      
      // Build response object
      const responseObject = {
        response: response,
        classification: {
          category: classification.category,
          subcategory: classification.subcategory,
          confidence: classification.confidence,
          emotional_intensity: classification.emotional_intensity,
          ambiguous_phrase: classification.ambiguous_phrase,
          disambiguation: classification.disambiguation
        },
        session: {
          userId: userId,
          sessionId: sessionId,
          messageCount: session.messageCount,
          conversationLength: session.conversationHistory.length / 2 // user+assistant pairs
        },
        metadata: {
          timestamp: new Date().toISOString(),
          ragDocumentsUsed: ragDocuments?.length || 0,
          processingTime: Date.now() // Will be calculated by caller
        }
      };
      
      console.log(`✅ Response generated:`);
      console.log(`   Category: ${classification.category}`);
      console.log(`   Confidence: ${classification.confidence}`);
      console.log(`   Session messages: ${session.messageCount}`);
      
      return responseObject;
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      // Return error response
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
          error: true
        }
      };
    }
  }
  
  /**
   * Get session history
   */
  getSession(userId, sessionId) {
    const sessionKey = `${userId}_${sessionId}`;
    return this.sessions.get(sessionKey) || null;
  }
  
  /**
   * Clear session
   */
  clearSession(userId, sessionId) {
    const sessionKey = `${userId}_${sessionId}`;
    this.sessions.delete(sessionKey);
  }
  
  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId) {
    const userSessions = [];
    for (const [key, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        userSessions.push({
          sessionId: session.sessionId,
          messageCount: session.messageCount,
          startedAt: session.startedAt,
          lastActivity: session.conversationHistory[session.conversationHistory.length - 1]?.timestamp
        });
      }
    }
    return userSessions;
  }
}

// Export singleton instance
export const mentalHealthChatbot = new MentalHealthChatbot();






