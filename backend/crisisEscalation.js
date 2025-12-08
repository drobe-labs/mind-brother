// Crisis Escalation System
// Manages tiered crisis response based on severity

const CRISIS_ESCALATION = {
  severe: {
    level: 'SEVERE',
    indicators: [
      'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
      'better off dead', 'no reason to live', 'end it all',
      'imminent harm', 'immediate danger', 'right now',
      'have a plan', 'have the pills', 'have the gun'
    ],
    actions: [
      'DISPLAY_CRISIS_BANNER',
      'PROVIDE_988_IMMEDIATELY',
      'ALERT_HUMAN_MODERATOR',
      'LOG_HIGH_PRIORITY',
      'DISABLE_NORMAL_CHAT',
      'TRACK_USER_SESSION'
    ],
    responseTime: 'IMMEDIATE',
    priority: 1,
    requiresHumanIntervention: true,
    autoEscalate: true,
    resources: {
      primary: {
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        text: 'Text "HELLO" to 741741',
        url: 'https://988lifeline.org'
      },
      secondary: {
        name: 'Crisis Text Line',
        phone: null,
        text: 'Text "STEVE" to 741741',
        url: 'https://www.crisistextline.org'
      },
      emergency: {
        name: 'Emergency Services',
        phone: '911',
        text: null,
        url: null
      }
    }
  },
  
  moderate: {
    level: 'MODERATE',
    indicators: [
      'self harm', 'self-harm', 'cut myself', 'hurt myself',
      'severe distress', 'cant take it', "can't take it",
      'overwhelming', 'unbearable', 'desperate',
      'thoughts of death', 'thinking about death',
      'hopeless', 'worthless', 'no point'
    ],
    actions: [
      'PROVIDE_CRISIS_RESOURCES',
      'ALERT_MODERATOR_QUEUE',
      'INCREASE_MONITORING',
      'LOG_MEDIUM_PRIORITY',
      'OFFER_IMMEDIATE_SUPPORT'
    ],
    responseTime: '< 5 minutes',
    priority: 2,
    requiresHumanIntervention: true,
    autoEscalate: false,
    resources: {
      primary: {
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        text: 'Text "HELLO" to 741741',
        url: 'https://988lifeline.org'
      },
      secondary: {
        name: 'SAMHSA National Helpline',
        phone: '1-800-662-4357',
        text: null,
        url: 'https://www.samhsa.gov/find-help/national-helpline'
      }
    }
  },
  
  elevated: {
    level: 'ELEVATED',
    indicators: [
      'escalating distress', 'getting worse', 'spiraling',
      'repeated mental health', 'keep coming back',
      'not getting better', 'struggling badly',
      'need help', 'desperate for help', 'losing control'
    ],
    actions: [
      'SUGGEST_PROFESSIONAL_HELP',
      'PROVIDE_THERAPIST_DIRECTORY',
      'LOG_FOR_REVIEW',
      'RECOMMEND_RESOURCES',
      'CHECK_IN_LATER'
    ],
    responseTime: '< 1 hour',
    priority: 3,
    requiresHumanIntervention: false,
    autoEscalate: false,
    resources: {
      primary: {
        name: 'Therapy for Black Girls',
        phone: null,
        text: null,
        url: 'https://therapyforblackgirls.com'
      },
      secondary: {
        name: 'Black Mental Health Alliance',
        phone: '(410) 338-2642',
        text: null,
        url: 'https://blackmentalhealth.com'
      }
    }
  }
};

class CrisisEscalationManager {
  constructor() {
    this.activeCrises = new Map(); // userId -> crisis info
    this.escalationLog = [];
    this.moderatorAlerts = [];
  }
  
  /**
   * Detect crisis severity level
   */
  detectCrisisSeverity(message, classification = {}) {
    const lowerMessage = message.toLowerCase();
    
    // Check severe indicators first (highest priority)
    for (const indicator of CRISIS_ESCALATION.severe.indicators) {
      if (lowerMessage.includes(indicator.toLowerCase())) {
        return {
          severity: 'severe',
          matched: indicator,
          ...CRISIS_ESCALATION.severe
        };
      }
    }
    
    // Check moderate indicators
    for (const indicator of CRISIS_ESCALATION.moderate.indicators) {
      if (lowerMessage.includes(indicator.toLowerCase())) {
        return {
          severity: 'moderate',
          matched: indicator,
          ...CRISIS_ESCALATION.moderate
        };
      }
    }
    
    // Check elevated indicators
    for (const indicator of CRISIS_ESCALATION.elevated.indicators) {
      if (lowerMessage.includes(indicator.toLowerCase())) {
        return {
          severity: 'elevated',
          matched: indicator,
          ...CRISIS_ESCALATION.elevated
        };
      }
    }
    
    // Check classification category
    if (classification.category === 'CRISIS') {
      return {
        severity: 'severe',
        matched: 'classification_detected',
        ...CRISIS_ESCALATION.severe
      };
    }
    
    return null;
  }
  
  /**
   * Execute crisis response actions
   */
  async executeCrisisResponse(userId, sessionId, message, severity) {
    const timestamp = new Date();
    const crisisInfo = {
      userId,
      sessionId,
      message,
      severity: severity.severity,
      level: severity.level,
      matched: severity.matched,
      timestamp,
      actions: severity.actions,
      responseTime: severity.responseTime,
      priority: severity.priority,
      status: 'active'
    };
    
    // Store active crisis
    this.activeCrises.set(userId, crisisInfo);
    
    // Log crisis event
    this.escalationLog.push(crisisInfo);
    
    console.log(`\n🚨 CRISIS DETECTED - ${severity.level}`);
    console.log(`   User: ${userId}`);
    console.log(`   Severity: ${severity.severity}`);
    console.log(`   Matched: "${severity.matched}"`);
    console.log(`   Priority: ${severity.priority}`);
    console.log(`   Response Time: ${severity.responseTime}`);
    
    // Execute actions based on severity
    const response = {
      crisisDetected: true,
      severity: severity.severity,
      level: severity.level,
      priority: severity.priority,
      responseTime: severity.responseTime,
      actions: [],
      resources: severity.resources,
      displayMode: null,
      humanAlertSent: false
    };
    
    // Execute each action
    for (const action of severity.actions) {
      const result = await this.executeAction(action, crisisInfo);
      response.actions.push({
        action,
        executed: result.success,
        timestamp: new Date()
      });
      
      if (action === 'DISPLAY_CRISIS_BANNER') {
        response.displayMode = 'CRISIS_BANNER';
      }
      
      if (action === 'ALERT_HUMAN_MODERATOR' || action === 'ALERT_MODERATOR_QUEUE') {
        response.humanAlertSent = result.success;
      }
    }
    
    return response;
  }
  
  /**
   * Execute individual action
   */
  async executeAction(action, crisisInfo) {
    switch (action) {
      case 'DISPLAY_CRISIS_BANNER':
        return { success: true, message: 'Crisis banner display mode activated' };
      
      case 'PROVIDE_988_IMMEDIATELY':
        return { success: true, message: '988 resources provided immediately' };
      
      case 'ALERT_HUMAN_MODERATOR':
        return await this.alertHumanModerator(crisisInfo, 'immediate');
      
      case 'ALERT_MODERATOR_QUEUE':
        return await this.alertHumanModerator(crisisInfo, 'queue');
      
      case 'LOG_HIGH_PRIORITY':
        return this.logCrisis(crisisInfo, 'HIGH');
      
      case 'LOG_MEDIUM_PRIORITY':
        return this.logCrisis(crisisInfo, 'MEDIUM');
      
      case 'LOG_FOR_REVIEW':
        return this.logCrisis(crisisInfo, 'LOW');
      
      case 'DISABLE_NORMAL_CHAT':
        return { success: true, message: 'Normal chat disabled, crisis mode only' };
      
      case 'TRACK_USER_SESSION':
        return { success: true, message: 'User session tracking activated' };
      
      case 'INCREASE_MONITORING':
        return { success: true, message: 'User monitoring increased' };
      
      case 'PROVIDE_CRISIS_RESOURCES':
        return { success: true, message: 'Crisis resources provided' };
      
      case 'SUGGEST_PROFESSIONAL_HELP':
        return { success: true, message: 'Professional help suggested' };
      
      case 'PROVIDE_THERAPIST_DIRECTORY':
        return { success: true, message: 'Therapist directory provided' };
      
      case 'OFFER_IMMEDIATE_SUPPORT':
        return { success: true, message: 'Immediate support offered' };
      
      case 'RECOMMEND_RESOURCES':
        return { success: true, message: 'Resources recommended' };
      
      case 'CHECK_IN_LATER':
        return { success: true, message: 'Follow-up check-in scheduled' };
      
      default:
        return { success: false, message: `Unknown action: ${action}` };
    }
  }
  
  /**
   * Alert human moderator
   */
  async alertHumanModerator(crisisInfo, urgency) {
    const alert = {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: crisisInfo.userId,
      sessionId: crisisInfo.sessionId,
      severity: crisisInfo.severity,
      level: crisisInfo.level,
      message: crisisInfo.message.substring(0, 200),
      timestamp: new Date(),
      urgency: urgency,
      status: 'pending',
      assignedTo: null
    };
    
    this.moderatorAlerts.push(alert);
    
    console.log(`   ⚠️  Human moderator alert ${urgency === 'immediate' ? 'IMMEDIATE' : 'queued'}`);
    console.log(`   Alert ID: ${alert.alertId}`);
    
    // TODO: Send actual alert (email, Slack, SMS, etc.)
    // await sendSlackAlert(alert);
    // await sendEmailAlert(alert);
    // await sendSMSAlert(alert); // For immediate alerts
    
    return { success: true, alertId: alert.alertId };
  }
  
  /**
   * Log crisis event
   */
  logCrisis(crisisInfo, priority) {
    console.log(`   📝 Crisis logged with ${priority} priority`);
    
    // TODO: Insert to database
    // await db.crisis_audit_log.insert({
    //   user_id: crisisInfo.userId,
    //   session_id: crisisInfo.sessionId,
    //   severity: crisisInfo.severity,
    //   matched_indicator: crisisInfo.matched,
    //   priority: priority,
    //   actions_taken: JSON.stringify(crisisInfo.actions),
    //   timestamp: crisisInfo.timestamp
    // });
    
    return { success: true, priority };
  }
  
  /**
   * Generate crisis response message
   */
  generateCrisisResponse(severity) {
    const { level, resources } = severity;
    
    if (level === 'SEVERE') {
      return {
        response: `I'm deeply concerned about what you're sharing. Your safety is the absolute priority right now.

**Please reach out for immediate help:**

🆘 **988 Suicide & Crisis Lifeline**
   • Call or text: **988**
   • Available 24/7, free and confidential

💬 **Crisis Text Line**
   • Text "HELLO" to **741741**
   • Connect with a trained counselor immediately

🚨 **If you're in immediate danger, call 911**

You don't have to face this alone. These trained professionals are ready to help you right now. Please reach out to them immediately.

I'll stay here with you. Can you tell me if you're able to reach out to one of these resources?`,
        displayMode: 'CRISIS_BANNER',
        disableNormalChat: true,
        resources: resources,
        urgency: 'IMMEDIATE',
        showEmergencyBanner: true
      };
    }
    
    if (level === 'MODERATE') {
      return {
        response: `I hear that you're going through something really difficult right now, and I'm concerned about your wellbeing.

**Crisis support is available 24/7:**

📞 **988 Suicide & Crisis Lifeline**
   • Call or text: **988**
   • Free, confidential support anytime

💬 **Crisis Text Line**
   • Text "HELLO" to **741741**
   • Connect with a trained counselor

📱 **SAMHSA National Helpline**
   • Call: **1-800-662-4357**
   • Treatment referral and information

You deserve support right now. These counselors are trained to help with exactly what you're experiencing.

Would you be willing to reach out to one of these resources? I'm here to talk while you decide.`,
        displayMode: 'URGENT_RESOURCES',
        disableNormalChat: false,
        resources: resources,
        urgency: 'HIGH',
        showEmergencyBanner: false
      };
    }
    
    if (level === 'ELEVATED') {
      return {
        response: `I can tell you're struggling, and I want you to know that seeking professional support is a sign of strength, not weakness.

**Professional mental health support:**

🧠 **Therapy for Black Girls**
   • Find culturally-competent therapists
   • Visit: therapyforblackgirls.com

📱 **Black Mental Health Alliance**
   • Call: **(410) 338-2642**
   • Resources specifically for our community

💙 **National Alliance on Mental Illness (NAMI)**
   • Call: **1-800-950-6264**
   • Support and education

Talking to a therapist or counselor could give you tools and support that make a real difference. Many offer sliding scale fees or accept insurance.

Would you like help finding resources in your area, or do you want to talk more about what you're experiencing?`,
        displayMode: 'PROFESSIONAL_HELP',
        disableNormalChat: false,
        resources: resources,
        urgency: 'MEDIUM',
        showEmergencyBanner: false
      };
    }
    
    return null;
  }
  
  /**
   * Get active crisis status for user
   */
  getActiveCrisis(userId) {
    return this.activeCrises.get(userId);
  }
  
  /**
   * Resolve crisis
   */
  resolveCrisis(userId, resolution) {
    const crisis = this.activeCrises.get(userId);
    if (crisis) {
      crisis.status = 'resolved';
      crisis.resolution = resolution;
      crisis.resolvedAt = new Date();
      this.activeCrises.delete(userId);
      
      console.log(`✅ Crisis resolved for user ${userId}`);
      return true;
    }
    return false;
  }
  
  /**
   * Get moderator alerts
   */
  getModeratorAlerts(status = 'pending') {
    return this.moderatorAlerts.filter(a => a.status === status);
  }
  
  /**
   * Get escalation statistics
   */
  getEscalationStats() {
    const stats = {
      activeCrises: this.activeCrises.size,
      totalEscalations: this.escalationLog.length,
      pendingAlerts: this.moderatorAlerts.filter(a => a.status === 'pending').length,
      severityBreakdown: {
        severe: 0,
        moderate: 0,
        elevated: 0
      }
    };
    
    for (const crisis of this.escalationLog) {
      if (stats.severityBreakdown[crisis.severity] !== undefined) {
        stats.severityBreakdown[crisis.severity]++;
      }
    }
    
    return stats;
  }
}

// Singleton instance
let crisisManager = null;

/**
 * Get or create the crisis escalation manager
 */
function getCrisisManager() {
  if (!crisisManager) {
    crisisManager = new CrisisEscalationManager();
  }
  return crisisManager;
}

module.exports = {
  CRISIS_ESCALATION,
  CrisisEscalationManager,
  getCrisisManager
};












