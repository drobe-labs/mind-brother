// Audit logging service for Mind Brother
import { supabase } from './supabase';

export interface AuditLogEntry {
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

class AuditService {
  private isEnabled: boolean = true;

  // Enable/disable audit logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Get client IP and user agent
  private getClientInfo(): { ip_address?: string; user_agent?: string } {
    if (typeof window === 'undefined') return {};
    
    return {
      user_agent: navigator.userAgent,
      // Note: In production, you'd get IP from server-side
      ip_address: undefined
    };
  }

  // Log an audit entry
  async log(entry: AuditLogEntry): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const clientInfo = this.getClientInfo();
      
      const auditEntry = {
        user_id: entry.user_id,
        action: entry.action,
        table_name: entry.table_name,
        record_id: entry.record_id,
        details: entry.details ? JSON.stringify(entry.details) : null,
        ip_address: entry.ip_address || clientInfo.ip_address,
        user_agent: entry.user_agent || clientInfo.user_agent,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert(auditEntry);

      if (error) {
        console.error('Audit logging failed:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Log user authentication events
  async logAuth(action: 'login' | 'logout' | 'signup' | 'password_reset', userId?: string, details?: any): Promise<void> {
    await this.log({
      user_id: userId,
      action: `auth_${action}`,
      details: details
    });
  }

  // Log data access events
  async logDataAccess(action: 'create' | 'read' | 'update' | 'delete', tableName: string, recordId?: string, userId?: string, details?: any): Promise<void> {
    await this.log({
      user_id: userId,
      action: `data_${action}`,
      table_name: tableName,
      record_id: recordId,
      details: details
    });
  }

  // Log security events
  async logSecurity(event: 'rate_limit' | 'invalid_input' | 'suspicious_activity' | 'data_export' | 'data_deletion', userId?: string, details?: any): Promise<void> {
    await this.log({
      user_id: userId,
      action: `security_${event}`,
      details: details
    });
  }

  // Log user actions
  async logUserAction(action: string, userId?: string, details?: any): Promise<void> {
    await this.log({
      user_id: userId,
      action: `user_${action}`,
      details: details
    });
  }

  // Log system events
  async logSystem(event: string, details?: any): Promise<void> {
    await this.log({
      action: `system_${event}`,
      details: details
    });
  }

  // Get audit logs for a user (admin only)
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  // Get recent security events
  async getSecurityEvents(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .like('action', 'security_%')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch security events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching security events:', error);
      return [];
    }
  }

  // Clean up old audit logs (run periodically)
  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Failed to cleanup old audit logs:', error);
      } else {
        console.log(`Cleaned up audit logs older than ${daysToKeep} days`);
      }
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
    }
  }
}

// Export singleton instance
export const auditService = new AuditService();

// Helper functions for common audit scenarios
export const auditHelpers = {
  // Log journal entry creation
  logJournalEntryCreated: (userId: string, entryId: string, moodRating: number) => {
    auditService.logDataAccess('create', 'journal_entries', entryId, userId, {
      mood_rating: moodRating,
      timestamp: new Date().toISOString()
    });
  },

  // Log journal entry updated
  logJournalEntryUpdated: (userId: string, entryId: string, changes: any) => {
    auditService.logDataAccess('update', 'journal_entries', entryId, userId, {
      changes: changes,
      timestamp: new Date().toISOString()
    });
  },

  // Log discussion topic created
  logDiscussionCreated: (userId: string, topicId: string, category: string) => {
    auditService.logDataAccess('create', 'discussion_topics', topicId, userId, {
      category: category,
      timestamp: new Date().toISOString()
    });
  },

  // Log user profile update
  logProfileUpdated: (userId: string, changes: any) => {
    auditService.logDataAccess('update', 'user_profiles', userId, userId, {
      changes: changes,
      timestamp: new Date().toISOString()
    });
  },

  // Log data export
  logDataExport: (userId: string, dataType: string) => {
    auditService.logSecurity('data_export', userId, {
      data_type: dataType,
      timestamp: new Date().toISOString()
    });
  },

  // Log data deletion
  logDataDeletion: (userId: string, dataType: string, recordId?: string) => {
    auditService.logSecurity('data_deletion', userId, {
      data_type: dataType,
      record_id: recordId,
      timestamp: new Date().toISOString()
    });
  },

  // Log rate limit exceeded
  logRateLimitExceeded: (userId: string, action: string) => {
    auditService.logSecurity('rate_limit', userId, {
      action: action,
      timestamp: new Date().toISOString()
    });
  },

  // Log invalid input attempt
  logInvalidInput: (userId: string, inputType: string, details: any) => {
    auditService.logSecurity('invalid_input', userId, {
      input_type: inputType,
      details: details,
      timestamp: new Date().toISOString()
    });
  }
};





