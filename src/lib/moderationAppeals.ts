// Moderation Appeal System
// Allows users to contest moderation decisions and provides review workflow

import { supabase } from './supabase';

export interface ModerationAppeal {
  id: string;
  contentId: string;
  contentType: 'topic' | 'reply';
  userId: string;
  username?: string;
  moderationAction: 'blocked' | 'flagged' | 'removed';
  originalContent: string;
  originalReason: string;
  appealReason: string;
  status: 'pending' | 'under_review' | 'approved' | 'denied';
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNotes: string | null;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  autoModDecision: any; // Original AI decision
}

export interface AppealReviewDecision {
  appealId: string;
  decision: 'approve' | 'deny' | 'escalate';
  reviewerNotes: string;
  actionTaken: string;
  revisedModeration?: {
    newStatus: 'approved' | 'flagged' | 'blocked';
    newReason?: string;
  };
}

export interface AppealStats {
  totalAppeals: number;
  approved: number;
  denied: number;
  pending: number;
  falsePositiveRate: number;
  averageReviewTimeMinutes: number;
  approvalRate: number;
}

// In-memory storage (syncs with Supabase)
const appeals = new Map<string, ModerationAppeal>();
const appealStats: AppealStats = {
  totalAppeals: 0,
  approved: 0,
  denied: 0,
  pending: 0,
  falsePositiveRate: 0,
  averageReviewTimeMinutes: 0,
  approvalRate: 0,
};

// ============================================================================
// CREATE APPEAL
// ============================================================================

export async function createAppeal(params: {
  contentId: string;
  contentType: 'topic' | 'reply';
  userId: string;
  username?: string;
  moderationAction: 'blocked' | 'flagged' | 'removed';
  originalContent: string;
  originalReason: string;
  appealReason: string;
  autoModDecision: any;
}): Promise<ModerationAppeal> {
  const appealId = generateAppealId();
  
  const appeal: ModerationAppeal = {
    id: appealId,
    contentId: params.contentId,
    contentType: params.contentType,
    userId: params.userId,
    username: params.username,
    moderationAction: params.moderationAction,
    originalContent: params.originalContent,
    originalReason: params.originalReason,
    appealReason: params.appealReason,
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: null,
    createdAt: new Date(),
    priority: determinePriority(params),
    autoModDecision: params.autoModDecision,
  };
  
  appeals.set(appealId, appeal);
  appealStats.totalAppeals++;
  appealStats.pending++;
  
  console.log('📝 Appeal created:', {
    appealId,
    user: params.username || params.userId,
    action: params.moderationAction,
    priority: appeal.priority,
  });
  
  // Check for auto-approval
  const autoApproved = checkForAutoApproval(appeal);
  
  // Save to Supabase
  await saveAppealToSupabase(appeal);
  
  // If not auto-approved, notify moderators
  if (!autoApproved) {
    await notifyModeratorsOfAppeal(appeal);
  }
  
  return appeal;
}

// ============================================================================
// DETERMINE APPEAL PRIORITY
// ============================================================================

function determinePriority(params: {
  moderationAction: string;
  autoModDecision: any;
}): 'low' | 'medium' | 'high' {
  // Blocked content = high priority (user can't post)
  if (params.moderationAction === 'blocked') {
    return 'high';
  }
  
  // Removed content = medium priority (already removed)
  if (params.moderationAction === 'removed') {
    return 'medium';
  }
  
  // Flagged content = low priority (still visible)
  return 'low';
}

// ============================================================================
// REVIEW APPEAL
// ============================================================================

export async function reviewAppeal(decision: AppealReviewDecision): Promise<ModerationAppeal | null> {
  const appeal = appeals.get(decision.appealId);
  
  if (!appeal) {
    console.error('Appeal not found:', decision.appealId);
    return null;
  }
  
  // Update appeal status
  appeal.status = decision.decision === 'escalate' ? 'under_review' :
                 decision.decision === 'approve' ? 'approved' : 'denied';
  appeal.reviewedBy = decision.reviewerNotes.includes('Auto-approved') ? 'system' : 'moderator';
  appeal.reviewedAt = new Date();
  appeal.reviewNotes = decision.reviewerNotes;
  
  // Update stats
  appealStats.pending--;
  if (appeal.status === 'approved') {
    appealStats.approved++;
    // Record as learning data
    recordModerationLearning(appeal);
  } else if (appeal.status === 'denied') {
    appealStats.denied++;
    recordModerationLearning(appeal);
  }
  
  // Calculate false positive rate
  if (appealStats.approved + appealStats.denied > 0) {
    appealStats.falsePositiveRate = 
      (appealStats.approved / (appealStats.approved + appealStats.denied)) * 100;
    appealStats.approvalRate = appealStats.falsePositiveRate;
  }
  
  // Calculate average review time
  appealStats.averageReviewTimeMinutes = calculateAverageReviewTime();
  
  appeals.set(decision.appealId, appeal);
  
  console.log('✅ Appeal reviewed:', {
    appealId: decision.appealId,
    decision: decision.decision,
    status: appeal.status,
  });
  
  // Update Supabase
  await updateAppealInSupabase(appeal);
  
  // If approved, restore the content
  if (appeal.status === 'approved' && decision.revisedModeration) {
    await restoreContent(appeal, decision.revisedModeration);
  }
  
  // Notify user of decision
  await notifyUserOfDecision(appeal);
  
  return appeal;
}

// ============================================================================
// RESTORE CONTENT (on appeal approval)
// ============================================================================

async function restoreContent(
  appeal: ModerationAppeal, 
  revisedModeration: { newStatus: string; newReason?: string }
): Promise<void> {
  const tableName = appeal.contentType === 'topic' ? 'discussion_topics' : 'discussion_replies';
  
  try {
    const { error } = await supabase
      .from(tableName)
      .update({
        auto_mod_status: revisedModeration.newStatus,
        is_removed: false,
        removed_at: null,
        removed_by: null,
      })
      .eq('id', appeal.contentId);
    
    if (error) {
      console.error('Error restoring content:', error);
    } else {
      console.log(`✅ Content restored: ${appeal.contentId}`);
    }
  } catch (err) {
    console.error('Error restoring content:', err);
  }
}

// ============================================================================
// GET PENDING APPEALS
// ============================================================================

export function getPendingAppeals(
  priority?: 'low' | 'medium' | 'high'
): ModerationAppeal[] {
  let pendingAppeals = Array.from(appeals.values())
    .filter(a => a.status === 'pending' || a.status === 'under_review');
  
  if (priority) {
    pendingAppeals = pendingAppeals.filter(a => a.priority === priority);
  }
  
  // Sort by priority (high first) and then by creation date
  pendingAppeals.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    return a.createdAt.getTime() - b.createdAt.getTime(); // Oldest first within priority
  });
  
  return pendingAppeals;
}

// ============================================================================
// GET APPEAL BY ID
// ============================================================================

export function getAppealById(appealId: string): ModerationAppeal | null {
  return appeals.get(appealId) || null;
}

// ============================================================================
// GET APPEALS BY USER
// ============================================================================

export function getAppealsByUser(userId: string): ModerationAppeal[] {
  return Array.from(appeals.values())
    .filter(a => a.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============================================================================
// GET APPEAL STATS
// ============================================================================

export function getAppealStats(): AppealStats {
  return {
    ...appealStats,
    averageReviewTimeMinutes: calculateAverageReviewTime(),
  };
}

// ============================================================================
// CALCULATE AVERAGE REVIEW TIME
// ============================================================================

function calculateAverageReviewTime(): number {
  const reviewedAppeals = Array.from(appeals.values())
    .filter(a => a.reviewedAt !== null);
  
  if (reviewedAppeals.length === 0) return 0;
  
  const totalTime = reviewedAppeals.reduce((sum, appeal) => {
    const reviewTime = appeal.reviewedAt!.getTime() - appeal.createdAt.getTime();
    return sum + reviewTime;
  }, 0);
  
  return Math.round(totalTime / reviewedAppeals.length / 1000 / 60); // Return in minutes
}

// ============================================================================
// CHECK IF USER CAN APPEAL
// ============================================================================

export function canUserAppeal(userId: string, contentId: string): {
  allowed: boolean;
  reason?: string;
} {
  // Check if user has already appealed this content
  const existingAppeal = Array.from(appeals.values())
    .find(a => a.userId === userId && a.contentId === contentId);
  
  if (existingAppeal) {
    return {
      allowed: false,
      reason: 'You have already submitted an appeal for this content',
    };
  }
  
  // Check if user has too many pending appeals
  const userPendingAppeals = Array.from(appeals.values())
    .filter(a => a.userId === userId && a.status === 'pending');
  
  if (userPendingAppeals.length >= 3) {
    return {
      allowed: false,
      reason: 'You have too many pending appeals. Please wait for reviews to complete.',
    };
  }
  
  return { allowed: true };
}

// ============================================================================
// AUTO-APPROVE OBVIOUS FALSE POSITIVES
// ============================================================================

export function checkForAutoApproval(appeal: ModerationAppeal): boolean {
  // Define patterns that are likely false positives
  const falsePositiveIndicators: Record<string, RegExp[]> = {
    // Educational/awareness content
    educational: [
      /i'm\s+writing\s+(?:a|an|about)/gi,
      /raising\s+awareness\s+(?:about|for)/gi,
      /education(?:al)?\s+(?:content|post|article|purpose)/gi,
      /learning\s+about/gi,
      /research(?:ing)?\s+(?:on|about)/gi,
      /documentary\s+(?:about|on)/gi,
      /school\s+(?:project|assignment|paper)/gi,
    ],
    
    // Quotes or references
    quoted: [
      /someone\s+(?:told|said)\s+(?:me|to\s+me)/gi,
      /i\s+(?:read|heard)\s+(?:that|about)/gi,
      /(?:in|from)\s+the\s+(?:article|book|news|story)/gi,
      /(?:according|referring)\s+to/gi,
      /(?:quoting|quoted|quote\s+from)/gi,
    ],
    
    // Help-seeking (not harmful)
    helpSeeking: [
      /how\s+(?:can|do)\s+i\s+help\s+(?:someone|a\s+friend|my\s+friend)/gi,
      /(?:my|a)\s+friend\s+(?:is|has\s+been)/gi,
      /worried\s+about\s+(?:someone|my|a)/gi,
      /support(?:ing)?\s+(?:someone|a\s+friend)/gi,
      /what\s+(?:can|should)\s+i\s+(?:do|say)/gi,
    ],
    
    // Progress/recovery talk
    recovery: [
      /\d+\s+(?:days?|weeks?|months?|years?)\s+(?:clean|sober|free)/gi,
      /(?:recovering|recovery)\s+from/gi,
      /(?:overcame|overcome|overcoming)/gi,
      /(?:getting|got)\s+(?:help|better|through)/gi,
      /(?:no\s+longer|don't|stopped)\s+(?:feel|feeling|think)/gi,
    ],
    
    // Asking for resources (not method-seeking)
    resourceSeeking: [
      /(?:hotline|helpline|crisis\s+line|support\s+group)/gi,
      /(?:therapist|counselor|psychologist|psychiatrist)/gi,
      /(?:where|how)\s+(?:can|do)\s+i\s+(?:find|get)\s+help/gi,
      /(?:recommend|suggestion)\s+(?:for|of)\s+(?:a\s+)?(?:therapist|help)/gi,
    ],
  };
  
  for (const [category, patterns] of Object.entries(falsePositiveIndicators)) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0; // Reset regex state
      if (pattern.test(appeal.originalContent)) {
        console.log(`🤖 Auto-approving appeal ${appeal.id} - detected ${category} pattern`);
        
        // Use setTimeout to avoid blocking
        setTimeout(() => {
          reviewAppeal({
            appealId: appeal.id,
            decision: 'approve',
            reviewerNotes: `Auto-approved: Detected ${category} pattern - likely false positive`,
            actionTaken: 'Content restored automatically',
            revisedModeration: {
              newStatus: 'approved',
              newReason: 'False positive - educational/contextual content',
            },
          });
        }, 100);
        
        return true;
      }
    }
  }
  
  return false;
}

// ============================================================================
// GENERATE APPEAL RESPONSE MESSAGE
// ============================================================================

export function generateAppealResponse(appeal: ModerationAppeal): string {
  if (appeal.status === 'approved') {
    return `
✅ **Appeal Approved**

Your appeal has been reviewed and approved. Your content has been restored.

**Reviewer Notes:**
${appeal.reviewNotes || 'Your content was incorrectly flagged. We apologize for the inconvenience.'}

Thank you for your patience.
`;
  } else if (appeal.status === 'denied') {
    return `
❌ **Appeal Denied**

After careful review, we've determined that the moderation action was appropriate.

**Reason:**
${appeal.reviewNotes || appeal.originalReason}

If you believe this decision was made in error, please contact our support team.
`;
  } else if (appeal.status === 'under_review') {
    return `
🔍 **Appeal Under Review**

Your appeal has been escalated to our moderation team for detailed review.

**Expected Response Time:** 24-48 hours

We'll notify you once a decision has been made.
`;
  } else {
    const position = getPendingAppeals().findIndex(a => a.id === appeal.id) + 1;
    return `
⏳ **Appeal Pending**

Your appeal has been received and is waiting for review.

**Current Position:** ${position > 0 ? position : 'In queue'}

**Expected Response Time:** 12-24 hours

Thank you for your patience.
`;
  }
}

// ============================================================================
// SUPABASE INTEGRATION
// ============================================================================

async function saveAppealToSupabase(appeal: ModerationAppeal): Promise<void> {
  try {
    const { error } = await supabase
      .from('moderation_appeals')
      .insert({
        id: appeal.id,
        content_id: appeal.contentId,
        content_type: appeal.contentType,
        user_id: appeal.userId,
        username: appeal.username,
        moderation_action: appeal.moderationAction,
        original_content: appeal.originalContent,
        original_reason: appeal.originalReason,
        appeal_reason: appeal.appealReason,
        status: appeal.status,
        priority: appeal.priority,
        auto_mod_decision: appeal.autoModDecision,
        created_at: appeal.createdAt.toISOString(),
      });

    if (error && !error.message.includes('does not exist')) {
      console.warn('⚠️ Error saving appeal:', error);
    }
  } catch (err) {
    console.debug('Appeal save skipped:', err);
  }
}

async function updateAppealInSupabase(appeal: ModerationAppeal): Promise<void> {
  try {
    const { error } = await supabase
      .from('moderation_appeals')
      .update({
        status: appeal.status,
        reviewed_by: appeal.reviewedBy,
        reviewed_at: appeal.reviewedAt?.toISOString(),
        review_notes: appeal.reviewNotes,
      })
      .eq('id', appeal.id);

    if (error && !error.message.includes('does not exist')) {
      console.warn('⚠️ Error updating appeal:', error);
    }
  } catch (err) {
    console.debug('Appeal update skipped:', err);
  }
}

async function notifyModeratorsOfAppeal(appeal: ModerationAppeal): Promise<void> {
  try {
    // Get moderator user IDs
    const { data: moderators } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_type', 'moderator');

    if (!moderators || moderators.length === 0) {
      console.log('📭 No moderators to notify');
      return;
    }

    const priorityEmoji = appeal.priority === 'high' ? '🔴' : 
                          appeal.priority === 'medium' ? '🟡' : '🟢';

    // Create notifications for each moderator
    const notifications = moderators.map(mod => ({
      user_id: mod.user_id,
      type: 'moderation',
      title: `${priorityEmoji} New Appeal (${appeal.priority} priority)`,
      message: `User ${appeal.username || appeal.userId} has appealed a ${appeal.moderationAction} decision.\n\nReason: ${appeal.appealReason}`,
      data: {
        appeal_id: appeal.id,
        content_type: appeal.contentType,
        content_id: appeal.contentId,
      },
      read: false,
    }));

    await supabase.from('notifications').insert(notifications);

    console.log(`📢 Notified ${moderators.length} moderator(s) of appeal`);
  } catch (err) {
    console.warn('⚠️ Error notifying moderators:', err);
  }
}

async function notifyUserOfDecision(appeal: ModerationAppeal): Promise<void> {
  try {
    const statusEmoji = appeal.status === 'approved' ? '✅' : 
                        appeal.status === 'denied' ? '❌' : '🔍';
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: appeal.userId,
        type: 'moderation',
        title: `${statusEmoji} Appeal ${appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}`,
        message: generateAppealResponse(appeal).replace(/[*_]/g, '').trim().substring(0, 200),
        data: {
          appeal_id: appeal.id,
          status: appeal.status,
        },
        read: false,
      });

    if (error && !error.message.includes('does not exist')) {
      console.warn('⚠️ Error notifying user:', error);
    }
  } catch (err) {
    console.debug('User notification skipped:', err);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateAppealId(): string {
  return `appeal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// EXPORT FOR MODERATOR DASHBOARD
// ============================================================================

export function getAppealQueueSummary() {
  const pending = getPendingAppeals();
  
  return {
    total: pending.length,
    high: pending.filter(a => a.priority === 'high').length,
    medium: pending.filter(a => a.priority === 'medium').length,
    low: pending.filter(a => a.priority === 'low').length,
    oldestAppeal: pending.length > 0 ? pending[0].createdAt : null,
    stats: getAppealStats(),
  };
}

// ============================================================================
// LEARNING FROM APPEALS (Improve AI)
// ============================================================================

export interface ModerationLearning {
  pattern: string;
  originalDecision: string;
  correctDecision: string;
  frequency: number;
  examples: string[];
  lastUpdated: Date;
}

const learningData: ModerationLearning[] = [];

export function recordModerationLearning(appeal: ModerationAppeal): void {
  if (appeal.status !== 'approved' && appeal.status !== 'denied') return;
  
  // Extract significant words/phrases from the content
  const content = appeal.originalContent.toLowerCase();
  const words = content
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  // Also extract 2-word phrases
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }
  
  const tokens = [...new Set([...words, ...phrases])];
  
  for (const token of tokens) {
    let learning = learningData.find(l => l.pattern === token);
    
    if (!learning) {
      learning = {
        pattern: token,
        originalDecision: appeal.moderationAction,
        correctDecision: appeal.status === 'approved' ? 'false_positive' : 'true_positive',
        frequency: 0,
        examples: [],
        lastUpdated: new Date(),
      };
      learningData.push(learning);
    }
    
    // Update based on appeal outcome
    if (appeal.status === 'approved') {
      learning.correctDecision = 'false_positive';
    }
    
    learning.frequency++;
    learning.lastUpdated = new Date();
    
    if (learning.examples.length < 5) {
      learning.examples.push(appeal.originalContent.substring(0, 100));
    }
  }
  
  console.log(`📊 Recorded learning from appeal ${appeal.id}: ${tokens.length} patterns`);
}

export function getModerationLearningInsights(): ModerationLearning[] {
  return learningData
    .filter(l => l.frequency >= 3) // Only patterns that appear 3+ times
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 50); // Top 50 patterns
}

export function getFalsePositivePatterns(): string[] {
  return learningData
    .filter(l => l.correctDecision === 'false_positive' && l.frequency >= 2)
    .map(l => l.pattern);
}

// ============================================================================
// LOAD APPEALS FROM SUPABASE (on startup)
// ============================================================================

export async function loadAppealsFromSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('moderation_appeals')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false });

    if (error) {
      if (!error.message.includes('does not exist')) {
        console.warn('⚠️ Error loading appeals:', error);
      }
      return;
    }

    if (data) {
      // Reset stats
      appealStats.totalAppeals = 0;
      appealStats.approved = 0;
      appealStats.denied = 0;
      appealStats.pending = 0;
      
      for (const row of data) {
        const appeal: ModerationAppeal = {
          id: row.id,
          contentId: row.content_id,
          contentType: row.content_type,
          userId: row.user_id,
          username: row.username,
          moderationAction: row.moderation_action,
          originalContent: row.original_content,
          originalReason: row.original_reason,
          appealReason: row.appeal_reason,
          status: row.status,
          reviewedBy: row.reviewed_by,
          reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
          reviewNotes: row.review_notes,
          createdAt: new Date(row.created_at),
          priority: row.priority,
          autoModDecision: row.auto_mod_decision,
        };
        
        appeals.set(appeal.id, appeal);
        appealStats.totalAppeals++;
        
        if (appeal.status === 'pending' || appeal.status === 'under_review') {
          appealStats.pending++;
        } else if (appeal.status === 'approved') {
          appealStats.approved++;
        } else if (appeal.status === 'denied') {
          appealStats.denied++;
        }
      }
      
      // Calculate rates
      if (appealStats.approved + appealStats.denied > 0) {
        appealStats.falsePositiveRate = 
          (appealStats.approved / (appealStats.approved + appealStats.denied)) * 100;
        appealStats.approvalRate = appealStats.falsePositiveRate;
      }
      
      console.log(`📊 Loaded ${data.length} appeals from Supabase`);
    }
  } catch (err) {
    console.debug('Appeals load skipped:', err);
  }
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export function getAppealSystemConfig() {
  return {
    maxPendingAppealsPerUser: 3,
    autoApprovalEnabled: true,
    priorityLevels: ['low', 'medium', 'high'],
    falsePositivePatternsCount: getFalsePositivePatterns().length,
    learningDataCount: learningData.length,
  };
}


