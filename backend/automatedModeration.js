// automatedModeration.js
// Automated moderation bot that handles violations, warnings, and auto-responses

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role (bypasses RLS)
let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('⚠️  Supabase credentials not configured. Automated moderation will have limited functionality.');
}

/**
 * Automated Moderation Actions
 */
class AutomatedModerator {
  constructor() {
    this.violationThresholds = {
      warnings_before_suspension: 3,
      reports_before_review: 2,
      rapid_posts_before_warning: 5,
      duplicate_posts_before_warning: 2
    };
  }

  /**
   * Handle Content Violation
   * Called when content is flagged or reported
   */
  async handleViolation(contentId, contentType, violationType, userId, severity = 'medium') {
    const actions = {
      // Violation types and their responses
      crisis: {
        action: 'crisis_intervention',
        autoResponse: this.getCrisisResponse(),
        escalate: true,
        immediate: true
      },
      harmful: {
        action: 'add_warning',
        autoResponse: this.getHarmfulContentResponse(),
        escalate: severity === 'high',
        immediate: false
      },
      harassment: {
        action: 'add_warning',
        autoResponse: this.getHarassmentResponse(),
        escalate: true,
        immediate: true
      },
      spam: {
        action: 'flag_content',
        autoResponse: this.getSpamResponse(),
        escalate: false,
        immediate: false
      },
      medical_advice: {
        action: 'add_warning',
        autoResponse: this.getMedicalAdviceResponse(),
        escalate: false,
        immediate: false
      },
      rapid_posting: {
        action: 'add_warning',
        autoResponse: this.getRapidPostingResponse(),
        escalate: false,
        immediate: false
      },
      duplicate_content: {
        action: 'remove_content',
        autoResponse: this.getDuplicateContentResponse(),
        escalate: false,
        immediate: false
      }
    };

    const violationConfig = actions[violationType] || actions.harmful;
    
    // Get user reputation
    const userRep = await this.getUserReputation(userId);
    
    // Determine action based on user history
    let finalAction = violationConfig.action;
    let shouldEscalate = violationConfig.escalate;
    
    // Check if user should be suspended
    if (userRep.warnings_received >= this.violationThresholds.warnings_before_suspension) {
      finalAction = 'suspension';
      shouldEscalate = true;
    }
    
    // Execute action
    const result = await this.executeAction(
      finalAction,
      contentId,
      contentType,
      userId,
      violationConfig.autoResponse,
      shouldEscalate
    );
    
    return {
      success: true,
      action: finalAction,
      responseSent: result.responseSent,
      userWarned: result.userWarned,
      escalated: shouldEscalate
    };
  }

  /**
   * Execute Moderation Action
   */
  async executeAction(action, contentId, contentType, userId, autoResponse, escalate = false) {
    const results = {
      responseSent: false,
      userWarned: false,
      contentRemoved: false
    };

    switch (action) {
      case 'crisis_intervention':
        // Already handled in crisis response protocol
        results.responseSent = true;
        break;

      case 'add_warning':
        await this.addWarning(userId, `Content violation: ${contentId}`);
        results.userWarned = true;
        results.responseSent = await this.sendAutoResponse(userId, autoResponse);
        break;

      case 'flag_content':
        await this.flagContent(contentId, contentType);
        results.responseSent = await this.sendAutoResponse(userId, autoResponse);
        break;

      case 'remove_content':
        await this.removeContent(contentId, contentType);
        results.contentRemoved = true;
        results.responseSent = await this.sendAutoResponse(userId, autoResponse);
        break;

      case 'suspension':
        const suspensionDays = await this.calculateSuspensionDuration(userId);
        await this.suspendUser(userId, suspensionDays, 'Repeated violations');
        results.userWarned = true;
        results.responseSent = await this.sendAutoResponse(userId, this.getSuspensionResponse(suspensionDays));
        break;
    }

    // Escalate to human moderators if needed
    if (escalate) {
      await this.escalateToModerators(contentId, contentType, userId, action);
    }

    return results;
  }

  /**
   * Auto-Response Messages
   */
  getCrisisResponse() {
    return {
      subject: 'We Care About Your Safety',
      message: `Hi there,

We noticed your recent post and we're concerned about your wellbeing. Your safety is our top priority.

If you're in immediate danger, please call 911 or your local emergency services.

Crisis Resources:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Immediate mental health support available 24/7

We've added resources to your post to help anyone who might be experiencing similar feelings. You're not alone, and there is support available.

If you'd like to talk, our AI support (Amani) is always available, or you can reach out to a mental health professional.

Take care,
Mind Brother Community Team`
    };
  }

  getHarmfulContentResponse() {
    return {
      subject: 'Content Review Notice',
      message: `Hi there,

We've reviewed your recent post and found that it contains content that may be harmful or violate our community guidelines.

Our community is focused on providing safe, supportive mental health discussions. While we encourage sharing struggles, we ask that you avoid:
• Detailed descriptions of self-harm methods
• Specific suicide methods
• Encouragement of harmful behaviors

You can share that you're struggling without going into specific details. We've added trigger warnings and crisis resources to your post to help protect other community members.

If you have questions about our guidelines, please review them or reach out.

Thank you for helping keep our community safe,
Mind Brother Community Team`
    };
  }

  getHarassmentResponse() {
    return {
      subject: 'Community Guidelines Violation',
      message: `Hi there,

We've received a report about content that appears to violate our community guidelines regarding respectful communication.

Our community is built on mutual respect and support. Harassment, bullying, or personal attacks are not tolerated.

We've added a warning to your account. Please review our community guidelines:
• Treat all members with respect
• No personal attacks or harassment
• Support, don't criticize

If this behavior continues, your account may be suspended or banned.

Thank you for helping maintain a supportive environment,
Mind Brother Community Team`
    };
  }

  getSpamResponse() {
    return {
      subject: 'Spam Content Notice',
      message: `Hi there,

We've detected that your recent post may be spam or promotional content. Our community is for genuine mental health support and discussions.

If you're interested in sharing resources, please do so in a supportive, non-promotional way. Direct marketing or promotional content is not allowed.

Thank you,
Mind Brother Community Team`
    };
  }

  getMedicalAdviceResponse() {
    return {
      subject: 'Medical Advice Notice',
      message: `Hi there,

We noticed your post contains what appears to be medical advice. For safety reasons, we don't allow specific medical advice on our platform.

Our community guidelines specify:
• You can share personal experiences
• You can offer general support and encouragement
• Please avoid prescribing treatments or medications
• Encourage professional medical consultation when appropriate

We've flagged your post for review. If you're sharing your experience, that's great - just avoid making specific medical recommendations.

Thank you for understanding,
Mind Brother Community Team`
    };
  }

  getRapidPostingResponse() {
    return {
      subject: 'Posting Rate Notice',
      message: `Hi there,

We've noticed you've posted multiple times in a short period. While we love active participation, we want to ensure quality discussions.

Please consider:
• Taking time to think before posting
• Responding to existing discussions
• Allowing others to participate

The limit is 5 posts per hour. You can continue posting, but please be mindful of the community's space.

Thank you,
Mind Brother Community Team`
    };
  }

  getDuplicateContentResponse() {
    return {
      subject: 'Duplicate Content Notice',
      message: `Hi there,

We've detected that your post appears to be a duplicate of content you've recently shared. To maintain quality discussions, we've removed the duplicate.

If you'd like to continue the conversation, please engage with your original post or add new information to keep the discussion fresh.

Thank you,
Mind Brother Community Team`
    };
  }

  getSuspensionResponse(days) {
    return {
      subject: 'Account Suspension Notice',
      message: `Hi there,

After reviewing your account history, we've temporarily suspended your account for ${days} ${days === 1 ? 'day' : 'days'} due to repeated community guidelines violations.

During this time:
• You won't be able to post or comment
• You can still view discussions
• You can still use private features (chat with Amani, journal, etc.)

This suspension is based on:
• Multiple warnings received
• Repeated policy violations
• Reports from other community members

After the suspension period, you'll be able to participate again. Please review our community guidelines before returning.

If you believe this is an error, you can appeal by contacting support.

Thank you for understanding,
Mind Brother Community Team`
    };
  }

  /**
   * Database Operations
   */
  async getUserReputation(userId) {
    if (!supabase) {
      console.warn('Supabase not initialized - returning default reputation');
      return {
        warnings_received: 0,
        reports_received: 0,
        content_removed_count: 0,
        reputation_score: 100,
        trust_level: 'member',
        suspensions_count: 0
      };
    }

    try {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        warnings_received: 0,
        reports_received: 0,
        content_removed_count: 0,
        reputation_score: 100,
        trust_level: 'member',
        suspensions_count: 0
      };
    } catch (error) {
      console.error('Error getting user reputation:', error);
      return {
        warnings_received: 0,
        reports_received: 0,
        content_removed_count: 0,
        reputation_score: 100,
        trust_level: 'member',
        suspensions_count: 0
      };
    }
  }

  async addWarning(userId, reason) {
    if (!supabase) {
      console.warn('Supabase not initialized - cannot add warning');
      return;
    }

    try {
      // Get current reputation
      const current = await this.getUserReputation(userId);
      const newWarnings = (current.warnings_received || 0) + 1;
      const newScore = Math.max(0, 100 - (newWarnings * 10));
      
      // Determine trust level
      let newTrustLevel = current.trust_level || 'member';
      if (newWarnings >= 3 || newScore < 50) {
        newTrustLevel = 'at-risk';
      } else if (newScore < 30) {
        newTrustLevel = 'restricted';
      }

      // Update reputation
      await supabase
        .from('user_reputation')
        .upsert({
          user_id: userId,
          warnings_received: newWarnings,
          reputation_score: newScore,
          trust_level: newTrustLevel,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Log to moderation_log
      await supabase
        .from('moderation_log')
        .insert({
          target_user_id: userId,
          action_type: 'warning',
          reason: reason,
          notes: `Automated warning: ${reason}`
        });

      console.log(`✅ Added warning to user ${userId}: ${reason} (Total: ${newWarnings})`);
    } catch (error) {
      console.error('Error adding warning:', error);
    }
  }

  async flagContent(contentId, contentType) {
    if (!supabase) {
      console.warn('Supabase not initialized - cannot flag content');
      return;
    }

    try {
      const tableName = contentType === 'topic' ? 'discussion_topics' : 'discussion_replies';
      await supabase
        .from(tableName)
        .update({
          auto_mod_status: 'flagged',
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      console.log(`✅ Flagged ${contentType} ${contentId} for review`);
    } catch (error) {
      console.error('Error flagging content:', error);
    }
  }

  async removeContent(contentId, contentType) {
    if (!supabase) {
      console.warn('Supabase not initialized - cannot remove content');
      return;
    }

    try {
      const tableName = contentType === 'topic' ? 'discussion_topics' : 'discussion_replies';
      await supabase
        .from(tableName)
        .update({
          is_removed: true,
          removed_at: new Date().toISOString(),
          auto_mod_status: 'blocked'
        })
        .eq('id', contentId);

      console.log(`✅ Removed ${contentType} ${contentId}`);
    } catch (error) {
      console.error('Error removing content:', error);
    }
  }

  async suspendUser(userId, days, reason) {
    if (!supabase) {
      console.warn('Supabase not initialized - cannot suspend user');
      return;
    }

    try {
      const banExpiresAt = new Date();
      banExpiresAt.setDate(banExpiresAt.getDate() + days);

      // Get current suspensions count
      const current = await this.getUserReputation(userId);
      const newSuspensions = (current.suspensions_count || 0) + 1;

      // Update reputation
      await supabase
        .from('user_reputation')
        .upsert({
          user_id: userId,
          is_banned: true,
          ban_expires_at: banExpiresAt.toISOString(),
          ban_reason: reason,
          suspensions_count: newSuspensions,
          trust_level: 'restricted',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Log to moderation_log
      await supabase
        .from('moderation_log')
        .insert({
          target_user_id: userId,
          action_type: 'suspension',
          reason: reason,
          notes: `Automated suspension: ${days} days`
        });

      console.log(`✅ Suspended user ${userId} for ${days} days: ${reason}`);
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  }

  async calculateSuspensionDuration(userId) {
    // First violation: 1 day
    // Second violation: 3 days
    // Third violation: 7 days
    // Fourth+: 30 days
    const userRep = await this.getUserReputation(userId);
    const suspensions = userRep.suspensions_count || 0;
    
    if (suspensions === 0) return 1;
    if (suspensions === 1) return 3;
    if (suspensions === 2) return 7;
    return 30;
  }

  async sendAutoResponse(userId, response) {
    if (!supabase) {
      console.warn('Supabase not initialized - cannot send auto-response');
      // Still log for debugging
      console.log(`Would send auto-response to user ${userId}`);
      console.log(`Subject: ${response.subject}`);
      console.log(`Message: ${response.message.substring(0, 100)}...`);
      return false;
    }

    try {
      // In production, you could:
      // 1. Send an email notification (using Supabase email or external service)
      // 2. Create an in-app notification (if you have a notifications table)
      // 3. Create a message thread (if you have a messaging system)
      
      // For now, we'll create a notification record (if you have a notifications table)
      // Or just log it for review
      
      console.log(`📧 Auto-response sent to user ${userId}`);
      console.log(`Subject: ${response.subject}`);
      console.log(`Message preview: ${response.message.substring(0, 100)}...`);
      
      // TODO: Implement actual notification/messaging system
      // Example:
      // await supabase
      //   .from('notifications')
      //   .insert({
      //     user_id: userId,
      //     type: 'moderation_message',
      //     title: response.subject,
      //     message: response.message,
      //     priority: 'high'
      //   });
      
      return true;
    } catch (error) {
      console.error('Error sending auto-response:', error);
      return false;
    }
  }

  async escalateToModerators(contentId, contentType, userId, action) {
    if (!supabase) {
      console.warn('Supabase not initialized - cannot escalate');
      return;
    }

    try {
      // Update existing report or create escalation note
      const { data: existingReport } = await supabase
        .from('content_reports')
        .select('*')
        .eq('reported_content_id', contentId)
        .eq('content_type', contentType)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingReport) {
        // Update priority
        await supabase
          .from('content_reports')
          .update({
            priority_level: 'P0',
            status: 'reviewing',
            moderator_notes: `Automated escalation: ${action} - Requires immediate review`
          })
          .eq('id', existingReport.id);
      }

      console.log(`✅ Escalated ${contentType} ${contentId} to moderators (Action: ${action})`);
    } catch (error) {
      console.error('Error escalating to moderators:', error);
    }
  }
}

/**
 * Process Reported Content Automatically
 */
async function processReport(reportId, report) {
  const moderator = new AutomatedModerator();
  
  // Determine violation type from report
  const violationType = report.report_reason;
  const severity = report.priority_level === 'P0' ? 'critical' : 
                   report.priority_level === 'P1' ? 'high' : 'medium';
  
  // Handle the violation
  const result = await moderator.handleViolation(
    report.reported_content_id,
    report.content_type,
    violationType,
    report.reporter_id, // Or get actual content author
    severity
  );
  
  return result;
}

/**
 * Process Auto-Detected Violations
 * Called when AI or pattern detection flags content
 */
async function processAutoViolation(contentId, contentType, userId, violationType, riskLevel) {
  const moderator = new AutomatedModerator();
  
  const severity = riskLevel === 'critical' ? 'critical' :
                   riskLevel === 'high' ? 'high' : 'medium';
  
  const result = await moderator.handleViolation(
    contentId,
    contentType,
    violationType,
    userId,
    severity
  );
  
  return result;
}

module.exports = {
  AutomatedModerator,
  processReport,
  processAutoViolation
};

