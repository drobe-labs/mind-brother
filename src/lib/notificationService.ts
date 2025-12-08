import { supabase } from './supabase';
import { dailyMotivationQuotes } from './mentalHealthResources';
import { getTodaysAffirmation, getRandomAffirmation } from './affirmations';

export interface NotificationPermission {
  granted: boolean;
  permission: NotificationPermission | string;
}

export interface ScheduledNotification {
  id: string;
  type: 'morning' | 'checkin' | 'evening';
  time: string;
  enabled: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private notificationPermission: boolean = false;
  private scheduledNotifications: ScheduledNotification[] = [];
  private userId: string | null = null;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeService() {
    // Check if browser supports notifications
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission === 'granted';
    }

    // Load user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.userId = user.id;
      await this.loadUserNotificationSettings();
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    this.notificationPermission = permission === 'granted';
    return this.notificationPermission;
  }

  async loadUserNotificationSettings() {
    if (!this.userId) return;

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('notifications_enabled, morning_notifications, checkin_notifications, evening_notifications, notification_time_morning, notification_time_checkin, notification_time_evening')
        .eq('user_id', this.userId)
        .single();

      if (profile && profile.notifications_enabled) {
        this.scheduledNotifications = [];
        
        if (profile.morning_notifications) {
          this.scheduledNotifications.push({
            id: 'morning',
            type: 'morning',
            time: profile.notification_time_morning || '08:00',
            enabled: true
          });
        }

        if (profile.checkin_notifications) {
          this.scheduledNotifications.push({
            id: 'checkin',
            type: 'checkin',
            time: profile.notification_time_checkin || '13:00',
            enabled: true
          });
        }

        if (profile.evening_notifications) {
          this.scheduledNotifications.push({
            id: 'evening',
            type: 'evening',
            time: profile.notification_time_evening || '20:00',
            enabled: true
          });
        }

        this.startNotificationScheduler();
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  private startNotificationScheduler() {
    // Check every minute for scheduled notifications
    setInterval(() => {
      this.checkScheduledNotifications();
    }, 60000); // 60 seconds

    // Also check immediately
    this.checkScheduledNotifications();
  }

  private async checkScheduledNotifications() {
    if (!this.notificationPermission || this.scheduledNotifications.length === 0) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const notification of this.scheduledNotifications) {
      if (notification.enabled && notification.time === currentTime) {
        await this.sendScheduledNotification(notification.type);
      }
    }
  }

  private async sendScheduledNotification(type: 'morning' | 'checkin' | 'evening') {
    if (!this.notificationPermission) return;

    try {
      if (type === 'morning') {
        await this.sendMorningMotivation();
      } else if (type === 'checkin') {
        await this.sendCheckinNotification();
      } else if (type === 'evening') {
        await this.sendEveningEncouragement();
      }

      // Log the notification
      if (this.userId) {
        await supabase
          .from('notification_logs')
          .insert({
            user_id: this.userId,
            notification_type: type,
            status: 'sent'
          });
      }
    } catch (error) {
      console.error('Error sending scheduled notification:', error);
    }
  }

  private async sendMorningMotivation() {
    // Get today's affirmation (deterministic) or random quote
    const useAffirmation = Math.random() > 0.5; // 50% chance of affirmation vs quote
    
    let content: string;
    let title: string;
    
    if (useAffirmation) {
      const todaysAffirmation = getTodaysAffirmation();
      content = `${todaysAffirmation.affirmation}\n\nWin the day!`;
      title = `Good morning brother! 💪\n[${todaysAffirmation.theme}]`;
    } else {
      const randomQuote = dailyMotivationQuotes[Math.floor(Math.random() * dailyMotivationQuotes.length)];
      content = `${randomQuote}\n\nWin the day!`;
      title = 'Good morning brother! 💪';
    }
    
    const notification = new Notification(title, {
      body: content,
      icon: '/notification-icon.png', // You'll need to add this icon
      badge: '/badge-icon.png',
      tag: 'morning-motivation',
      requireInteraction: false,
      silent: false,
      actions: [
        {
          action: 'view',
          title: 'Open Mind Brother'
        }
      ]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  private async sendCheckinNotification() {
    const notification = new Notification('Just checking in 🤝', {
      body: 'How are you brother?',
      icon: '/notification-icon.png',
      badge: '/badge-icon.png',
      tag: 'daily-checkin',
      requireInteraction: true,
      silent: false,
      actions: [
        {
          action: 'thumbs_up',
          title: '👍 Good'
        },
        {
          action: 'thumbs_down',
          title: '👎 Not great'
        }
      ]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Open the app
      window.location.href = '/checkin';
    };
  }

  private async sendEveningEncouragement() {
    // Get evening encouragement - mix of affirmations and quotes
    const useAffirmation = Math.random() > 0.5; // 50% chance of affirmation vs quote
    
    let content: string;
    let title: string;
    
    const eveningEncouragements = [
      "You made it through another day. That's strength, brother. 💪",
      "Rest well tonight. Tomorrow is a new opportunity to grow. 🌙",
      "You're doing better than you think. Keep going. ✨",
      "Every day you show up is a victory. Proud of you. 🙏",
      "You've got this. One day at a time. 💯",
      "Your journey matters. Keep moving forward. 🚀",
      "You're stronger than your struggles. Rest and recharge. ⚡",
      "Tomorrow is another chance to be your best self. Sleep well. 😴"
    ];
    
    if (useAffirmation) {
      const randomAffirmation = getRandomAffirmation();
      content = `${randomAffirmation.affirmation}\n\nYou've got this, brother. Rest well.`;
      title = `Evening encouragement 🌙\n[${randomAffirmation.theme}]`;
    } else {
      const randomEncouragement = eveningEncouragements[Math.floor(Math.random() * eveningEncouragements.length)];
      content = `${randomEncouragement}\n\nTake care of yourself tonight.`;
      title = 'Evening encouragement 🌙';
    }
    
    const notification = new Notification(title, {
      body: content,
      icon: '/notification-icon.png',
      badge: '/badge-icon.png',
      tag: 'evening-encouragement',
      requireInteraction: false,
      silent: false,
      actions: [
        {
          action: 'view',
          title: 'Open Mind Brother'
        }
      ]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }

  // Handle notification action responses
  setupNotificationActionHandler() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data.type === 'NOTIFICATION_ACTION') {
          await this.handleNotificationAction(event.data.action, event.data.notificationTag);
        }
      });
    }
  }

  private async handleNotificationAction(action: string, notificationTag: string) {
    if (notificationTag === 'daily-checkin') {
      if (action === 'thumbs_up') {
        await this.handleThumbsUpResponse();
      } else if (action === 'thumbs_down') {
        await this.handleThumbsDownResponse();
      }
    }
  }

  private async handleThumbsUpResponse() {
    // Log the positive response
    if (this.userId) {
      await supabase
        .from('mood_checkins')
        .insert({
          user_id: this.userId,
          response_type: 'thumbs_up',
          mood_rating: 4,
          mood_emoji: '👍',
          triggered_by: 'notification'
        });

      await supabase
        .from('notification_logs')
        .update({ response: 'thumbs_up', response_timestamp: new Date().toISOString() })
        .eq('user_id', this.userId)
        .eq('notification_type', 'checkin')
        .gte('sent_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes
    }

    // Send positive feedback notification
    if (this.notificationPermission) {
      const notification = new Notification('Great to hear! 😊', {
        body: 'Enjoy your day, brother!',
        icon: '/notification-icon.png',
        tag: 'positive-response',
        requireInteraction: false
      });

      setTimeout(() => notification.close(), 5000);
    }
  }

  private async handleThumbsDownResponse() {
    // Log the negative response
    if (this.userId) {
      await supabase
        .from('mood_checkins')
        .insert({
          user_id: this.userId,
          response_type: 'thumbs_down',
          mood_rating: 2,
          mood_emoji: '👎',
          triggered_by: 'notification'
        });

      await supabase
        .from('notification_logs')
        .update({ response: 'thumbs_down', response_timestamp: new Date().toISOString() })
        .eq('user_id', this.userId)
        .eq('notification_type', 'checkin')
        .gte('sent_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    }

    // Open Amani chatbot
    window.focus();
    window.location.href = '/chatbot?auto_start=true';
    
    // Send supportive notification
    if (this.notificationPermission) {
      const notification = new Notification('I\'m here for you 🤝', {
        body: 'Let\'s talk with Amani about what\'s going on.',
        icon: '/notification-icon.png',
        tag: 'support-response',
        requireInteraction: false
      });

      setTimeout(() => notification.close(), 7000);
    }
  }

  // Public methods for managing notifications
  async enableNotifications(userId: string): Promise<boolean> {
    this.userId = userId;
    const hasPermission = await this.requestPermission();
    
    if (hasPermission) {
      await this.loadUserNotificationSettings();
      this.setupNotificationActionHandler();
    }
    
    return hasPermission;
  }

  async updateNotificationSettings(settings: {
    enabled: boolean;
    morningEnabled: boolean;
    checkinEnabled: boolean;
    eveningEnabled: boolean;
    morningTime: string;
    checkinTime: string;
    eveningTime: string;
  }) {
    if (!this.userId) return;

    try {
      await supabase
        .from('user_profiles')
        .update({
          notifications_enabled: settings.enabled,
          morning_notifications: settings.morningEnabled,
          checkin_notifications: settings.checkinEnabled,
          evening_notifications: settings.eveningEnabled,
          notification_time_morning: settings.morningTime,
          notification_time_checkin: settings.checkinTime,
          notification_time_evening: settings.eveningTime
        })
        .eq('user_id', this.userId);

      // Reload settings
      await this.loadUserNotificationSettings();
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  }

  // Send immediate notification (for testing or manual triggers)
  async sendTestNotification(type: 'morning' | 'checkin' | 'evening') {
    if (!this.notificationPermission) {
      console.log('Notification permission not granted');
      return false;
    }

    await this.sendScheduledNotification(type);
    return true;
  }

  // Get notification status
  getNotificationStatus() {
    return {
      permission: this.notificationPermission,
      scheduled: this.scheduledNotifications,
      userId: this.userId
    };
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
