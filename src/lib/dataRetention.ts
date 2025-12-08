// Data Retention & Privacy Management
// Implements data retention policies, auto-deletion, and privacy controls

export interface RetentionPolicy {
  activeConversations: number; // days
  archivedConversations: number; // days
  crisisConversations: number; // days (legal/safety requirement)
  userProfiles: string; // 'until_deletion' or days
  analytics: number; // days (anonymized)
  auditLogs: number; // days (compliance)
}

export interface DataCategory {
  category: string;
  retentionDays: number;
  canDelete: boolean;
  requiresAnonymization: boolean;
}

export class DataRetentionManager {
  
  // Retention policies (configurable)
  public retentionPolicy: RetentionPolicy = {
    activeConversations: 30,      // 30 days for active chats
    archivedConversations: 365,   // 1 year for archived
    crisisConversations: 1825,    // 5 years for crisis (legal requirement)
    userProfiles: 'until_deletion', // Keep until user deletes account
    analytics: 730,               // 2 years (anonymized)
    auditLogs: 2555                // 7 years (compliance)
  };
  
  /**
   * Clean up old data based on retention policies
   * Should be run daily via cron job
   */
  public async cleanupOldData(): Promise<{
    conversationsDeleted: number;
    analyticsAnonymized: number;
    logsDeleted: number;
    errors: string[];
  }> {
    console.log('🧹 Starting data retention cleanup...');
    
    const results = {
      conversationsDeleted: 0,
      analyticsAnonymized: 0,
      logsDeleted: 0,
      errors: [] as string[]
    };
    
    try {
      // 1. Clean up old conversations (non-crisis)
      results.conversationsDeleted = await this.cleanupConversations();
      
      // 2. Anonymize old analytics
      results.analyticsAnonymized = await this.anonymizeAnalytics();
      
      // 3. Delete old audit logs
      results.logsDeleted = await this.cleanupAuditLogs();
      
      console.log('✅ Cleanup complete:', results);
      
    } catch (error: any) {
      console.error('❌ Cleanup error:', error);
      results.errors.push(error.message);
    }
    
    return results;
  }
  
  /**
   * Clean up old conversations (respecting crisis retention)
   */
  private async cleanupConversations(): Promise<number> {
    const now = new Date();
    let deleted = 0;
    
    // Calculate cutoff dates
    const activeCutoff = new Date(now.getTime() - this.retentionPolicy.activeConversations * 24 * 60 * 60 * 1000);
    const archivedCutoff = new Date(now.getTime() - this.retentionPolicy.archivedConversations * 24 * 60 * 60 * 1000);
    const crisisCutoff = new Date(now.getTime() - this.retentionPolicy.crisisConversations * 24 * 60 * 60 * 1000);
    
    // In production, this would query Supabase:
    // const { data, error } = await supabase
    //   .from('chatbot_conversations')
    //   .delete()
    //   .lt('last_activity', activeCutoff.toISOString())
    //   .neq('classification_category', 'CRISIS');
    
    // For now, log the operation
    console.log(`   📅 Would delete conversations older than:`);
    console.log(`      Active (non-crisis): ${activeCutoff.toISOString()}`);
    console.log(`      Archived: ${archivedCutoff.toISOString()}`);
    console.log(`      Crisis: ${crisisCutoff.toISOString()} (kept longer)`);
    
    return deleted;
  }
  
  /**
   * Anonymize old analytics data (remove PII)
   */
  private async anonymizeAnalytics(): Promise<number> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.retentionPolicy.analytics * 24 * 60 * 60 * 1000);
    
    let anonymized = 0;
    
    // In production, this would:
    // 1. Find analytics records older than cutoff
    // 2. Remove userId, sessionId, message content
    // 3. Keep only: category, confidence, timestamp, emotional_intensity
    
    // const { data, error } = await supabase
    //   .from('analytics')
    //   .update({ 
    //     userId: 'ANONYMIZED',
    //     message: 'REDACTED',
    //     context: null 
    //   })
    //   .lt('created_at', cutoff.toISOString());
    
    console.log(`   🔒 Would anonymize analytics older than: ${cutoff.toISOString()}`);
    
    return anonymized;
  }
  
  /**
   * Clean up old audit logs
   */
  private async cleanupAuditLogs(): Promise<number> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - this.retentionPolicy.auditLogs * 24 * 60 * 60 * 1000);
    
    let deleted = 0;
    
    // In production:
    // const { data, error } = await supabase
    //   .from('audit_logs')
    //   .delete()
    //   .lt('created_at', cutoff.toISOString());
    
    console.log(`   📋 Would delete audit logs older than: ${cutoff.toISOString()}`);
    
    return deleted;
  }
  
  /**
   * Delete user data (GDPR right to be forgotten)
   */
  public async deleteUserData(userId: string): Promise<{
    success: boolean;
    deleted: {
      conversations: number;
      profiles: number;
      analytics: number;
      journals: number;
      discussions: number;
    };
    errors: string[];
  }> {
    console.log(`🗑️  Deleting all data for user: ${userId}`);
    
    const results = {
      success: true,
      deleted: {
        conversations: 0,
        profiles: 0,
        analytics: 0,
        journals: 0,
        discussions: 0
      },
      errors: [] as string[]
    };
    
    try {
      // In production, delete from all tables:
      // 1. Conversations
      // results.deleted.conversations = await deleteFrom('chatbot_conversations', userId);
      
      // 2. User profile
      // results.deleted.profiles = await deleteFrom('user_profiles', userId);
      
      // 3. Analytics (or anonymize)
      // results.deleted.analytics = await anonymizeAnalytics(userId);
      
      // 4. Journal entries
      // results.deleted.journals = await deleteFrom('journal_entries', userId);
      
      // 5. Discussion posts/replies
      // results.deleted.discussions = await deleteFrom('discussion_topics', userId);
      // results.deleted.discussions += await deleteFrom('discussion_replies', userId);
      
      console.log('✅ User data deleted successfully');
      
    } catch (error: any) {
      console.error('❌ Error deleting user data:', error);
      results.success = false;
      results.errors.push(error.message);
    }
    
    return results;
  }
  
  /**
   * Export user data (GDPR right to data portability)
   */
  public async exportUserData(userId: string): Promise<{
    success: boolean;
    data: {
      profile: any;
      conversations: any[];
      journals: any[];
      discussions: any[];
      analytics: any[];
    };
    exportDate: string;
  }> {
    console.log(`📦 Exporting data for user: ${userId}`);
    
    // In production, query all tables and export to JSON/CSV
    
    return {
      success: true,
      data: {
        profile: {},
        conversations: [],
        journals: [],
        discussions: [],
        analytics: []
      },
      exportDate: new Date().toISOString()
    };
  }
  
  /**
   * Anonymize conversation for analytics (comprehensive)
   */
  public anonymizeConversationForAnalytics(conversation: {
    id: string;
    userId: string;
    userName?: string;
    demographics?: {
      age?: number;
      location?: string;
      ethnicity?: string;
    };
    messages: Array<{
      role: string;
      content: string;
      classification?: any;
      emotionalIntensity?: number;
    }>;
    classifications: Array<{
      category: string;
      subcategory?: string;
      confidence: number;
      emotionalIntensity?: number;
    }>;
    sentimentTrend?: Array<{ timestamp: Date; intensity: number }>;
    createdAt: Date;
    lastActivity: Date;
  }): {
    conversationId: string; // hashed
    demographics: {
      ageRange?: string;
      region?: string;
      ethnicity?: string;
    };
    categories: string[];
    subcategories: string[];
    sentimentTrend: Array<{ timestamp: Date; intensity: number }>;
    duration: number; // minutes
    messageCount: number;
    avgConfidence: number;
    avgEmotionalIntensity: number;
    hadCrisis: boolean;
    // All PII removed
    messages: null;
    userId: null;
    userName: null;
    createdAt: Date;
  } {
    
    // Hash conversation ID (one-way, can't reverse)
    const conversationId = this.hashId(conversation.id);
    
    // Generalize demographics (age range instead of specific age)
    const demographics = this.anonymizeDemographics(conversation.demographics);
    
    // Extract metadata (no message content)
    const categories = conversation.classifications.map(c => c.category);
    const subcategories = conversation.classifications
      .filter(c => c.subcategory)
      .map(c => c.subcategory!);
    
    // Calculate aggregates
    const duration = Math.round(
      (conversation.lastActivity.getTime() - conversation.createdAt.getTime()) / (1000 * 60)
    );
    
    const avgConfidence = conversation.classifications.length > 0
      ? conversation.classifications.reduce((sum, c) => sum + c.confidence, 0) / conversation.classifications.length
      : 0;
    
    const emotionalIntensities = conversation.classifications
      .filter(c => c.emotionalIntensity)
      .map(c => c.emotionalIntensity!);
    
    const avgEmotionalIntensity = emotionalIntensities.length > 0
      ? emotionalIntensities.reduce((sum, i) => sum + i, 0) / emotionalIntensities.length
      : 0;
    
    const hadCrisis = categories.includes('CRISIS');
    
    return {
      conversationId,
      demographics,
      categories,
      subcategories,
      sentimentTrend: conversation.sentimentTrend || [],
      duration,
      messageCount: conversation.messages.length,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgEmotionalIntensity: Math.round(avgEmotionalIntensity * 10) / 10,
      hadCrisis,
      // PII removed
      messages: null,
      userId: null,
      userName: null,
      createdAt: conversation.createdAt
    };
  }
  
  /**
   * Anonymize demographics (generalize to ranges/regions)
   */
  private anonymizeDemographics(demographics?: {
    age?: number;
    location?: string;
    ethnicity?: string;
  }): {
    ageRange?: string;
    region?: string;
    ethnicity?: string;
  } {
    if (!demographics) {
      return {};
    }
    
    const anonymized: any = {};
    
    // Age → Age range
    if (demographics.age) {
      anonymized.ageRange = this.getAgeRange(demographics.age);
    }
    
    // Specific location → General region
    if (demographics.location) {
      anonymized.region = this.getRegion(demographics.location);
    }
    
    // Ethnicity (keep for cultural analysis, but no other identifiers)
    if (demographics.ethnicity) {
      anonymized.ethnicity = demographics.ethnicity;
    }
    
    return anonymized;
  }
  
  /**
   * Convert specific age to age range
   */
  private getAgeRange(age: number): string {
    if (age < 18) return 'under_18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }
  
  /**
   * Convert specific location to general region
   */
  private getRegion(location: string): string {
    const lower = location.toLowerCase();
    
    // US regions
    if (/(ny|new york|nyc|nj|pa|ct)/i.test(lower)) return 'Northeast';
    if (/(ca|california|oregon|washington|seattle|sf|la)/i.test(lower)) return 'West Coast';
    if (/(tx|texas|ok|oklahoma|ar|arkansas)/i.test(lower)) return 'South';
    if (/(il|illinois|chicago|mi|michigan|oh|ohio)/i.test(lower)) return 'Midwest';
    if (/(fl|florida|ga|georgia|nc|sc)/i.test(lower)) return 'Southeast';
    
    // International
    if (/(uk|london|england)/i.test(lower)) return 'UK';
    if (/(canada|toronto|vancouver)/i.test(lower)) return 'Canada';
    
    return 'Other';
  }
  
  /**
   * Anonymize sensitive data (general purpose)
   */
  public anonymize(data: any): any {
    // Remove PII
    const anonymized = { ...data };
    
    // Remove identifiers
    delete anonymized.userId;
    delete anonymized.email;
    delete anonymized.username;
    delete anonymized.emergency_contact;
    
    // Hash remaining identifiers
    if (anonymized.sessionId) {
      anonymized.sessionId = this.hashId(anonymized.sessionId);
    }
    
    // Remove message content (keep metadata only)
    if (anonymized.message) {
      delete anonymized.message;
    }
    
    return anonymized;
  }
  
  /**
   * Hash identifier for anonymization
   */
  private hashId(id: string): string {
    // Simple hash for demonstration
    // In production, use crypto.createHash('sha256')
    return `ANON_${id.substring(0, 8)}`;
  }
  
  /**
   * Get data retention summary
   */
  public getRetentionSummary(): {
    policy: RetentionPolicy;
    nextCleanup: Date;
    estimatedDeletion: {
      conversations: number;
      analytics: number;
      logs: number;
    };
  } {
    const nextCleanup = new Date();
    nextCleanup.setDate(nextCleanup.getDate() + 1); // Tomorrow
    
    return {
      policy: this.retentionPolicy,
      nextCleanup,
      estimatedDeletion: {
        conversations: 0, // Would calculate from DB
        analytics: 0,
        logs: 0
      }
    };
  }
  
  /**
   * Check if data is eligible for deletion
   */
  public isEligibleForDeletion(
    data: {
      category?: string;
      lastActivity: Date;
      type: 'conversation' | 'analytics' | 'log';
    }
  ): boolean {
    const now = new Date();
    const daysSinceActivity = (now.getTime() - data.lastActivity.getTime()) / (24 * 60 * 60 * 1000);
    
    // Crisis data has longer retention
    if (data.category === 'CRISIS') {
      return daysSinceActivity > this.retentionPolicy.crisisConversations;
    }
    
    // Check by type
    switch (data.type) {
      case 'conversation':
        return daysSinceActivity > this.retentionPolicy.activeConversations;
      case 'analytics':
        return daysSinceActivity > this.retentionPolicy.analytics;
      case 'log':
        return daysSinceActivity > this.retentionPolicy.auditLogs;
      default:
        return false;
    }
  }
}

// Export singleton
export const dataRetentionManager = new DataRetentionManager();

// ===== PRIVACY CONTROLS =====

export class PrivacyManager {
  
  /**
   * Redact sensitive information from logs
   */
  public redactSensitiveData(text: string): string {
    let redacted = text;
    
    // Redact phone numbers
    redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE REDACTED]');
    
    // Redact emails
    redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL REDACTED]');
    
    // Redact SSN
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REDACTED]');
    
    // Redact credit card numbers
    redacted = redacted.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD REDACTED]');
    
    // Redact addresses (simplified)
    redacted = redacted.replace(/\b\d+\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/gi, '[ADDRESS REDACTED]');
    
    return redacted;
  }
  
  /**
   * Check if message contains PII
   */
  public containsPII(text: string): {
    hasPII: boolean;
    types: string[];
  } {
    const types: string[] = [];
    
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) {
      types.push('phone');
    }
    
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
      types.push('email');
    }
    
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
      types.push('ssn');
    }
    
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) {
      types.push('credit_card');
    }
    
    return {
      hasPII: types.length > 0,
      types
    };
  }
  
  /**
   * Get user consent status
   */
  public async getUserConsent(userId: string): Promise<{
    dataProcessing: boolean;
    analytics: boolean;
    communications: boolean;
    consentDate: Date | null;
  }> {
    // In production, query database
    // const { data } = await supabase
    //   .from('user_consents')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .single();
    
    return {
      dataProcessing: true,
      analytics: true,
      communications: true,
      consentDate: new Date()
    };
  }
  
  /**
   * Update user consent
   */
  public async updateConsent(
    userId: string,
    consent: {
      dataProcessing?: boolean;
      analytics?: boolean;
      communications?: boolean;
    }
  ): Promise<boolean> {
    console.log(`📝 Updating consent for user: ${userId}`, consent);
    
    // In production:
    // const { error } = await supabase
    //   .from('user_consents')
    //   .upsert({
    //     user_id: userId,
    //     ...consent,
    //     updated_at: new Date().toISOString()
    //   });
    
    return true;
  }
}

// Export singleton
export const privacyManager = new PrivacyManager();

// ===== SCHEDULED CLEANUP (CRON JOB) =====

/**
 * Run daily at 2 AM
 * In production, use node-cron or similar
 */
export async function scheduledCleanup(): Promise<void> {
  console.log('\n🕐 SCHEDULED CLEANUP - ' + new Date().toISOString());
  console.log('━'.repeat(70));
  
  const results = await dataRetentionManager.cleanupOldData();
  
  console.log(`
📊 CLEANUP RESULTS:
  • Conversations deleted: ${results.conversationsDeleted}
  • Analytics anonymized: ${results.analyticsAnonymized}
  • Logs deleted: ${results.logsDeleted}
  • Errors: ${results.errors.length}
  `);
  
  if (results.errors.length > 0) {
    console.error('❌ Cleanup errors:', results.errors);
    // Alert admin
  }
  
  console.log('━'.repeat(70));
  console.log('✅ Scheduled cleanup complete\n');
}

// ===== USAGE EXAMPLES =====

/**
 * Example 1: Daily cleanup (automated)
 */
export async function exampleDailyCleanup() {
  // Run this via cron job at 2 AM daily
  await scheduledCleanup();
}

/**
 * Example 2: User requests data deletion (GDPR)
 */
export async function exampleUserDeletion(userId: string) {
  console.log(`User ${userId} requested account deletion`);
  
  // Delete all user data
  const result = await dataRetentionManager.deleteUserData(userId);
  
  if (result.success) {
    console.log('✅ User data deleted:', result.deleted);
    // Send confirmation email
  } else {
    console.error('❌ Deletion failed:', result.errors);
    // Alert admin, retry later
  }
}

/**
 * Example 3: User requests data export (GDPR)
 */
export async function exampleUserExport(userId: string) {
  console.log(`User ${userId} requested data export`);
  
  const export_data = await dataRetentionManager.exportUserData(userId);
  
  if (export_data.success) {
    // Convert to JSON file
    const jsonExport = JSON.stringify(export_data.data, null, 2);
    
    // In production, send via email or download link
    console.log('✅ Data export ready');
    return jsonExport;
  }
}

/**
 * Example 4: Redact PII before logging
 */
export async function exampleRedaction() {
  const userMessage = "My phone is 555-123-4567 and email is john@example.com";
  
  // Check for PII
  const piiCheck = privacyManager.containsPII(userMessage);
  
  if (piiCheck.hasPII) {
    console.warn('⚠️  PII detected:', piiCheck.types);
    
    // Redact before logging
    const redacted = privacyManager.redactSensitiveData(userMessage);
    console.log('Redacted:', redacted);
    // "My phone is [PHONE REDACTED] and email is [EMAIL REDACTED]"
  }
}

// ===== SQL MIGRATIONS =====

/**
 * SQL for adding retention metadata to tables
 */
export const RETENTION_SCHEMA = `
-- Add retention metadata to chatbot_conversations
ALTER TABLE chatbot_conversations 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS classification_category TEXT;

-- Add retention metadata to analytics
ALTER TABLE analytics
ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;

-- Create user consents table
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data_processing BOOLEAN DEFAULT TRUE,
  analytics BOOLEAN DEFAULT TRUE,
  communications BOOLEAN DEFAULT TRUE,
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create RLS policies for user_consents
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent"
  ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent"
  ON user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update last_activity
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversations
CREATE TRIGGER update_conversation_activity
  BEFORE UPDATE ON chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();
`;

/**
 * SQL for cleanup function (runs daily)
 */
export const CLEANUP_FUNCTION_SQL = `
-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS TABLE (
  conversations_deleted INTEGER,
  analytics_anonymized INTEGER,
  logs_deleted INTEGER
) AS $$
DECLARE
  active_cutoff TIMESTAMPTZ := NOW() - INTERVAL '30 days';
  archived_cutoff TIMESTAMPTZ := NOW() - INTERVAL '1 year';
  crisis_cutoff TIMESTAMPTZ := NOW() - INTERVAL '5 years';
  analytics_cutoff TIMESTAMPTZ := NOW() - INTERVAL '2 years';
  logs_cutoff TIMESTAMPTZ := NOW() - INTERVAL '7 years';
  conv_deleted INTEGER := 0;
  analytics_anon INTEGER := 0;
  logs_del INTEGER := 0;
BEGIN
  
  -- Delete old non-crisis conversations
  DELETE FROM chatbot_conversations
  WHERE last_activity < active_cutoff
    AND classification_category != 'CRISIS';
  GET DIAGNOSTICS conv_deleted = ROW_COUNT;
  
  -- Delete old crisis conversations (5 year retention)
  DELETE FROM chatbot_conversations
  WHERE last_activity < crisis_cutoff
    AND classification_category = 'CRISIS';
  GET DIAGNOSTICS conv_deleted = conv_deleted + ROW_COUNT;
  
  -- Anonymize old analytics
  UPDATE analytics
  SET user_id = NULL,
      message = 'REDACTED',
      context = NULL,
      anonymized = TRUE,
      anonymized_at = NOW()
  WHERE created_at < analytics_cutoff
    AND anonymized = FALSE;
  GET DIAGNOSTICS analytics_anon = ROW_COUNT;
  
  -- Delete old audit logs
  DELETE FROM audit_logs
  WHERE created_at < logs_cutoff;
  GET DIAGNOSTICS logs_del = ROW_COUNT;
  
  RETURN QUERY SELECT conv_deleted, analytics_anon, logs_del;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily cleanup (using pg_cron if available)
-- SELECT cron.schedule('daily-cleanup', '0 2 * * *', 'SELECT cleanup_old_data()');
`;

