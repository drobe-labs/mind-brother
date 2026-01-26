import { supabase } from './supabase';
import { dailyMotivationQuotes } from './mentalHealthResources';
import { getTodaysAffirmation, getRandomAffirmation } from './affirmations';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

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
  private isNative: boolean = false;
  private platform: 'ios' | 'android' | 'web' = 'web';

  private constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    // Initialize asynchronously to avoid blocking module loading
    // Use setTimeout to defer initialization to next event loop
    setTimeout(() => {
      this.initializeService().catch(err => {
        console.error('❌ Failed to initialize notification service:', err);
      });
    }, 0);
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeService() {
    try {
      // Wait a bit to ensure Capacitor is fully initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check permissions based on platform
      if (this.isNative) {
        try {
          // Native iOS/Android - use Capacitor LocalNotifications
          // Check if LocalNotifications is available
          if (!LocalNotifications) {
            console.warn('⚠️ LocalNotifications plugin not available');
            return;
          }
          
          const permission = await LocalNotifications.checkPermissions();
          this.notificationPermission = permission?.display === 'granted';
          console.log('📱 Notification permission status:', permission?.display);
          
          // Create notification channel for Android (must be done before scheduling)
          try {
            if (this.platform === 'android' && LocalNotifications.createChannel) {
              await LocalNotifications.createChannel({
                id: 'mind-brother-notifications',
                name: 'Mind Brother',
                description: 'Daily motivation and check-ins',
                importance: 5, // MAX importance for heads-up notifications
                sound: 'default',
                vibration: true,
                visibility: 1, // Public
                lights: true,
                lightColor: '#4F46E5'
              });
              console.log('✅ Notification channel created');
            }
          } catch (channelError) {
            console.warn('⚠️ Channel creation error (may already exist):', channelError);
          }
        } catch (nativeError) {
          console.error('❌ Error with native notifications:', nativeError);
          // Don't crash - just log and continue
        }
      } else {
        // Web - use browser Notification API
        if ('Notification' in window) {
          this.notificationPermission = Notification.permission === 'granted';
        }
      }

      // Set up notification handler IMMEDIATELY (before user login)
      // This ensures taps are handled even if user isn't logged in yet
      this.setupNotificationActionHandler();
      console.log('✅ Notification action handler set up (early)');
      
      // Load user from Supabase (don't let this block initialization)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          this.userId = user.id;
          await this.loadUserNotificationSettings();
        }
      } catch (authError) {
        console.warn('⚠️ Could not load user for notifications:', authError);
        // Continue without user - notifications can be set up later
      }
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      // Don't throw - allow app to continue loading
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        // Native iOS/Android
        // First check current permission
        const currentPermission = await LocalNotifications.checkPermissions();
        console.log('📱 Current notification permission:', currentPermission);
        
        // For iOS, we need alert permission specifically
        if (this.platform === 'ios') {
          // iOS returns 'display' which should be 'granted' for alerts
          if (currentPermission.display === 'granted') {
            this.notificationPermission = true;
            console.log('✅ iOS notification permission already granted');
            return true;
          }
        } else {
          // Android
          if (currentPermission.display === 'granted') {
            this.notificationPermission = true;
            return true;
          }
        }
        
        // Request permission
        const permission = await LocalNotifications.requestPermissions();
        console.log('📱 Requested notification permission result:', permission);
        
        // iOS needs 'display' to be 'granted', Android also uses 'display'
        this.notificationPermission = permission.display === 'granted';
        
        if (this.platform === 'ios') {
          console.log('📱 iOS permission details:', {
            display: permission.display,
            alert: (permission as any).alert,
            sound: (permission as any).sound,
            badge: (permission as any).badge
          });
        }
        
        // Create channel if permission granted (Android only)
        if (this.notificationPermission && this.platform === 'android') {
          try {
            await LocalNotifications.createChannel({
              id: 'mind-brother-notifications',
              name: 'Mind Brother',
              description: 'Daily motivation and check-ins',
              importance: 5,
              sound: 'default',
              vibration: true,
              visibility: 1,
              lights: true,
              lightColor: '#4F46E5'
            });
            console.log('✅ Notification channel created');
          } catch (e) {
            console.warn('⚠️ Channel creation note:', e);
          }
        }
        
        return this.notificationPermission;
      } else {
        // Web
        if (!('Notification' in window)) {
          console.log('❌ This browser does not support notifications');
          return false;
        }
        const permission = await Notification.requestPermission();
        this.notificationPermission = permission === 'granted';
        console.log('📱 Web notification permission:', permission);
        return this.notificationPermission;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  async loadUserNotificationSettings() {
    if (!this.userId) {
      console.warn('⚠️ Cannot load settings: userId is null');
      return;
    }

    try {
      console.log('📥 Loading notification settings for user:', this.userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('notifications_enabled, morning_notifications, checkin_notifications, evening_notifications, notification_time_morning, notification_time_checkin, notification_time_evening')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        console.error('❌ Error loading notification settings:', error);
        return;
      }

      console.log('📋 Profile loaded:', {
        notifications_enabled: profile?.notifications_enabled,
        morning: profile?.morning_notifications,
        checkin: profile?.checkin_notifications,
        evening: profile?.evening_notifications
      });

      if (profile && profile.notifications_enabled) {
        console.log('✅ Notifications enabled - setting up scheduled notifications');
        this.scheduledNotifications = [];
        
        if (profile.morning_notifications) {
          this.scheduledNotifications.push({
            id: 'morning',
            type: 'morning',
            time: profile.notification_time_morning || '08:00',
            enabled: true
          });
          console.log('  ✅ Added morning notification:', profile.notification_time_morning || '08:00');
        }

        if (profile.checkin_notifications) {
          this.scheduledNotifications.push({
            id: 'checkin',
            type: 'checkin',
            time: profile.notification_time_checkin || '13:00',
            enabled: true
          });
          console.log('  ✅ Added check-in notification:', profile.notification_time_checkin || '13:00');
        }

        if (profile.evening_notifications) {
          this.scheduledNotifications.push({
            id: 'evening',
            type: 'evening',
            time: profile.notification_time_evening || '20:00',
            enabled: true
          });
          console.log('  ✅ Added evening notification:', profile.notification_time_evening || '20:00');
        }

        console.log(`📅 Total scheduled notifications: ${this.scheduledNotifications.length}`);
        this.startNotificationScheduler();
      } else {
        console.log('⚠️ Notifications disabled in profile or profile not found');
        this.scheduledNotifications = [];
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
    }
  }

  private startNotificationScheduler() {
    // Cancel all existing scheduled notifications first
    this.cancelAllScheduledNotifications();
    
    // Schedule actual notifications for each enabled notification
    this.scheduleAllNotifications();
  }

  private async scheduleAllNotifications() {
    if (!this.notificationPermission || this.scheduledNotifications.length === 0) {
      console.log('⚠️ Cannot schedule: permission or notifications missing');
      return;
    }

    // Ensure channel exists (Android only)
    if (this.isNative && this.platform === 'android') {
      try {
        await LocalNotifications.createChannel({
          id: 'mind-brother-notifications',
          name: 'Mind Brother',
          description: 'Daily motivation and check-ins',
          importance: 5, // MAX for heads-up
          sound: 'default',
          vibration: true,
          visibility: 1,
          lights: true,
          lightColor: '#4F46E5'
        });
      } catch (e) {
        // Channel may already exist
      }
    }

    const notificationsToSchedule: any[] = [];

    for (const notification of this.scheduledNotifications) {
      if (!notification.enabled) continue;

      // Parse time (HH:MM format)
      const [hours, minutes] = notification.time.split(':').map(Number);

      // Get notification content based on type
      let title = '';
      let body = '';
      
      if (notification.type === 'morning') {
        const useAffirmation = Math.random() > 0.5;
        if (useAffirmation) {
          const todaysAffirmation = getTodaysAffirmation();
          body = `${todaysAffirmation.affirmation} - Win the day!`;
          title = `Good morning brother! 💪`;
        } else {
          const randomQuote = dailyMotivationQuotes[Math.floor(Math.random() * dailyMotivationQuotes.length)];
          body = `${randomQuote} - Win the day!`;
          title = 'Good morning brother! 💪';
        }
      } else if (notification.type === 'checkin') {
        title = 'Just checking in 🤝';
        body = 'How are you feeling today, brother? Tap to check in.';
      } else if (notification.type === 'evening') {
        const useAffirmation = Math.random() > 0.5;
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
          body = `${randomAffirmation.affirmation} - You've got this, brother. Rest well.`;
          title = `Evening encouragement 🌙`;
        } else {
          const randomEncouragement = eveningEncouragements[Math.floor(Math.random() * eveningEncouragements.length)];
          body = `${randomEncouragement} - Take care of yourself tonight.`;
          title = 'Evening encouragement 🌙';
        }
      }

      // Create notification ID based on type (so we can cancel/replace)
      const notificationId = this.getNotificationIdForType(notification.type);

      // Build notification object - iOS and Android have different requirements
      const notificationObj: any = {
        id: notificationId,
        title: String(title || 'Mind Brother'),
        body: String(body || ''),
        sound: 'default',
        extra: {
          type: notification.type
        },
        // Also add to data for iOS compatibility
        data: {
          type: notification.type
        }
      };

      // Use 'on' with hour/minute for timezone-aware daily scheduling
      // This ensures the notification fires at the correct LOCAL time regardless of timezone
      // The 'on' property uses device-local time, not UTC
      
      console.log(`📅 Scheduling ${notification.type} for daily at ${hours}:${minutes.toString().padStart(2, '0')} (device local time)`);
      console.log(`📅 Current device time: ${new Date().toLocaleTimeString()}`);
      console.log(`📅 Device timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      
      if (this.platform === 'ios') {
        // iOS: Use 'on' with hour/minute - this is timezone-aware on the device
        notificationObj.schedule = {
          on: {
            hour: hours,
            minute: minutes
          },
          repeats: true,
          allowWhileIdle: true
        };
        console.log(`📅 iOS: Scheduled with on: { hour: ${hours}, minute: ${minutes} }, repeats: true`);
      } else {
        // Android: Use 'on' with hour/minute for reliable daily repeating
        // This format respects the device's local timezone
        notificationObj.schedule = {
          on: {
            hour: hours,
            minute: minutes
          },
          repeats: true,
          allowWhileIdle: true
        };
        
        // Android-specific properties
        notificationObj.smallIcon = 'ic_stat_icon_config_sample';
        notificationObj.iconColor = '#4F46E5';
        notificationObj.channelId = 'mind-brother-notifications';
        notificationObj.priority = 2;
        notificationObj.visibility = 1;
        
        console.log(`📅 Android: Scheduled with on: { hour: ${hours}, minute: ${minutes} }, repeats: true`);
      }

      // Ensure title and body are not empty
      if (!notificationObj.title || notificationObj.title.trim() === '') {
        notificationObj.title = 'Mind Brother';
      }
      if (!notificationObj.body || notificationObj.body.trim() === '') {
        notificationObj.body = 'You have a new notification';
      }

      notificationsToSchedule.push(notificationObj);

      console.log(`✅ Prepared ${notification.type} notification for daily at ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} (local time)`);
    }

    if (notificationsToSchedule.length > 0) {
      try {
        const result = await LocalNotifications.schedule({
          notifications: notificationsToSchedule
        });
        console.log(`✅ Scheduled ${notificationsToSchedule.length} notification(s)`, result);
        
        // ✅ VERIFY: Check pending notifications after scheduling
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for processing
          const pending = await LocalNotifications.getPending();
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          console.log('📋 ========== SCHEDULED NOTIFICATIONS ==========');
          console.log(`📋 Total pending: ${pending?.notifications?.length || 0}`);
          console.log(`📋 Device timezone: ${timezone}`);
          
          if (pending?.notifications) {
            notificationsToSchedule.forEach(notif => {
              const found = pending.notifications.find((n: any) => n.id === notif.id);
              if (found) {
                const schedule = found.schedule;
                let timeStr = 'unknown';
                if (schedule?.on) {
                  const h = schedule.on.hour?.toString().padStart(2, '0') || '??';
                  const m = schedule.on.minute?.toString().padStart(2, '0') || '??';
                  timeStr = `${h}:${m} daily`;
                } else if (schedule?.at) {
                  timeStr = new Date(schedule.at).toLocaleString();
                }
                console.log(`✅ ${notif.extra?.type?.toUpperCase()}: Will fire at ${timeStr} (${timezone})`);
              } else {
                console.warn(`⚠️ ${notif.extra?.type?.toUpperCase()}: NOT found in pending list!`);
              }
            });
          }
          console.log('📋 ============================================');
        } catch (verifyError) {
          console.warn('Could not verify pending notifications:', verifyError);
        }
      } catch (error) {
        console.error('❌ Error scheduling notifications:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
      }
    } else {
      console.warn('⚠️ No notifications to schedule');
    }
  }

  private getNotificationIdForType(type: 'morning' | 'checkin' | 'evening'): number {
    // Use consistent IDs so we can cancel/replace
    const ids = { morning: 1001, checkin: 1002, evening: 1003 };
    return ids[type];
  }

  private async cancelAllScheduledNotifications() {
    if (this.isNative) {
      try {
        // Cancel the specific notification IDs we use
        await LocalNotifications.cancel({
          notifications: [
            { id: 1001 }, // morning
            { id: 1002 }, // checkin
            { id: 1003 }  // evening
          ]
        });
        console.log('🗑️ Cancelled existing scheduled notifications');
      } catch (error) {
        console.warn('Could not cancel notifications:', error);
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
    try {
      // Get today's affirmation (deterministic) or random quote
      const useAffirmation = Math.random() > 0.5; // 50% chance of affirmation vs quote
      
      let content: string;
      let title: string;
      
      if (useAffirmation) {
        const todaysAffirmation = getTodaysAffirmation();
        // iOS doesn't like \n in notifications, use space instead
        content = `${todaysAffirmation.affirmation} - Win the day!`;
        title = `Good morning brother! 💪`;
      } else {
        const randomQuote = dailyMotivationQuotes[Math.floor(Math.random() * dailyMotivationQuotes.length)];
        // iOS doesn't like \n in notifications, use space instead
        content = `${randomQuote} - Win the day!`;
        title = 'Good morning brother! 💪';
      }
      
      if (this.isNative) {
        // ✅ iOS/Android - Use Capacitor LocalNotifications
        // Ensure title and body are valid strings
        const notificationTitle = String(title || 'Mind Brother').trim();
        const notificationBody = String(content || '').trim();
        
        console.log('📱 Preparing notification:', {
          platform: this.platform,
          title: notificationTitle,
          body: notificationBody,
          titleLength: notificationTitle.length,
          bodyLength: notificationBody.length,
          permission: this.notificationPermission
        });
        
        // Ensure channel exists (Android only - iOS doesn't use channels)
        if (this.platform === 'android') {
          try {
            await LocalNotifications.createChannel({
              id: 'mind-brother-notifications',
              name: 'Mind Brother',
              description: 'Daily motivation and check-ins',
              importance: 5, // MAX importance for heads-up notifications
              sound: 'default',
              vibration: true,
              visibility: 1, // Public visibility
              lights: true,
              lightColor: '#4F46E5'
            });
          } catch (e) {
            // Channel may already exist, that's okay
          }
        }
        
        if (!notificationTitle || !notificationBody) {
          console.error('❌ Notification title or body is empty:', { title: notificationTitle, body: notificationBody });
          return;
        }

        const notificationId = Date.now();
        
        // Build notification - iOS and Android have different properties
        const notificationPayload: any = {
          id: notificationId,
          title: notificationTitle,
          body: notificationBody,
          sound: 'default',
          extra: {
            type: 'morning'
          },
          data: {
            type: 'morning'
          }
        };

        // For immediate notifications, schedule for very soon
        if (this.platform === 'ios') {
          // iOS - schedule for 2 seconds in the future for reliability
          // iOS needs time to process and display notifications, especially when app is in foreground
          const scheduleTime = new Date(Date.now() + 2000); // 2 seconds
          notificationPayload.schedule = {
            at: scheduleTime
          };
          console.log('📅 iOS scheduling notification for:', scheduleTime.toISOString());
          console.log('📅 Current time:', new Date().toISOString());
          console.log('📅 Will appear in:', scheduleTime.getTime() - Date.now(), 'ms');
        } else {
          // Android - can be faster
          notificationPayload.schedule = { 
            at: new Date(Date.now() + 500), // 500ms for Android
            allowWhileIdle: true
          };
          notificationPayload.smallIcon = 'ic_stat_icon_config_sample';
          notificationPayload.iconColor = '#4F46E5';
          notificationPayload.channelId = 'mind-brother-notifications';
          notificationPayload.priority = 2;
          notificationPayload.visibility = 1;
        }

        console.log('📤 Sending notification payload:', JSON.stringify(notificationPayload, null, 2));
        
        try {
          const result = await LocalNotifications.schedule({
            notifications: [notificationPayload]
          });
          console.log('✅ Notification scheduled successfully:', result);
          
          // Verify notification was scheduled (iOS)
          if (this.platform === 'ios') {
            try {
              // Wait a moment for iOS to process
              await new Promise(resolve => setTimeout(resolve, 500));
              
              const pending = await LocalNotifications.getPending();
              console.log('📋 Total pending notifications:', pending?.notifications?.length || 0);
              
              if (pending?.notifications) {
                const scheduled = pending.notifications.find((n: any) => n.id === notificationId);
                if (scheduled) {
                  console.log('✅ iOS notification confirmed in pending list');
                  console.log('📅 Scheduled for:', scheduled.schedule?.at || 'unknown');
                } else {
                  console.warn('⚠️ iOS notification not found in pending list');
                  console.log('📋 Available notification IDs:', pending.notifications.map((n: any) => n.id));
                }
              } else {
                console.warn('⚠️ No pending notifications found');
              }
            } catch (e) {
              console.warn('Could not verify pending notifications:', e);
            }
          }
        } catch (scheduleError) {
          console.error('❌ Error scheduling notification:', scheduleError);
          throw scheduleError;
        }
      } else {
        // Web - Use browser Notification API
        const notification = new Notification(title, {
          body: content,
          icon: '/notification-icon.png',
          badge: '/badge-icon.png',
          tag: 'morning-motivation',
          requireInteraction: false,
          silent: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
      }
    } catch (error) {
      console.error('❌ Error sending morning notification:', error);
    }
  }

  private async sendCheckinNotification() {
    try {
      const title = 'Just checking in 🤝';
      const content = 'How are you feeling today, brother? Tap to check in.';

      if (this.isNative) {
        // ✅ iOS/Android - Use Capacitor LocalNotifications
        // Ensure channel exists (Android) - Use MAX importance for heads-up
        try {
          await LocalNotifications.createChannel({
            id: 'mind-brother-notifications',
            name: 'Mind Brother',
            description: 'Daily motivation and check-ins',
            importance: 5, // MAX importance for heads-up
            sound: 'default',
            vibration: true,
            visibility: 1,
            lights: true,
            lightColor: '#4F46E5'
          });
        } catch (e) {
          // Channel may already exist
        }
        
        // Ensure title and body are valid
        const notificationTitle = String(title || 'Mind Brother').trim();
        const notificationBody = String(content || '').trim();
        
        if (!notificationTitle || !notificationBody) {
          console.error('❌ Notification title or body is empty');
          return;
        }

        const notificationId = Date.now();
        
        const notificationPayload: any = {
          id: notificationId,
          title: notificationTitle,
          body: notificationBody,
          sound: 'default',
          extra: {
            type: 'checkin'
          },
          // Also add to data for iOS compatibility
          data: {
            type: 'checkin'
          }
        };

        if (this.platform === 'ios') {
          const scheduleTime = new Date(Date.now() + 2000); // 2 seconds for reliability
          notificationPayload.schedule = {
            at: scheduleTime
          };
          console.log('📅 iOS scheduling check-in notification for:', scheduleTime.toISOString());
        } else {
          notificationPayload.schedule = { 
            at: new Date(Date.now() + 100),
            allowWhileIdle: true
          };
          notificationPayload.smallIcon = 'ic_stat_icon_config_sample';
          notificationPayload.iconColor = '#4F46E5';
          notificationPayload.channelId = 'mind-brother-notifications';
          notificationPayload.priority = 2;
          notificationPayload.visibility = 1;
        }

        console.log('📤 Sending check-in notification payload:', JSON.stringify(notificationPayload, null, 2));
        
        const result = await LocalNotifications.schedule({
          notifications: [notificationPayload]
        });
        console.log('✅ Check-in notification scheduled:', result);
      } else {
        // Web
        const notification = new Notification(title, {
          body: content,
          icon: '/notification-icon.png',
          badge: '/badge-icon.png',
          tag: 'daily-checkin',
          requireInteraction: true,
          silent: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          window.location.href = '/checkin';
        };
      }
    } catch (error) {
      console.error('❌ Error sending check-in notification:', error);
    }
  }

  private async sendEveningEncouragement() {
    try {
      // Get evening encouragement - mix of affirmations and quotes
      const useAffirmation = Math.random() > 0.5;
      
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
        // Remove newlines for iOS
        content = `${randomAffirmation.affirmation} - You've got this, brother. Rest well.`;
        title = `Evening encouragement 🌙`;
      } else {
        const randomEncouragement = eveningEncouragements[Math.floor(Math.random() * eveningEncouragements.length)];
        // Remove newlines for iOS
        content = `${randomEncouragement} - Take care of yourself tonight.`;
        title = 'Evening encouragement 🌙';
      }
      
      if (this.isNative) {
        // ✅ iOS/Android - Use Capacitor LocalNotifications
        // Ensure channel exists (Android) - Use MAX importance for heads-up
        try {
          await LocalNotifications.createChannel({
            id: 'mind-brother-notifications',
            name: 'Mind Brother',
            description: 'Daily motivation and check-ins',
            importance: 5, // MAX importance for heads-up
            sound: 'default',
            vibration: true,
            visibility: 1,
            lights: true,
            lightColor: '#4F46E5'
          });
        } catch (e) {
          // Channel may already exist
        }
        
        // Ensure title and body are valid
        const notificationTitle = String(title || 'Mind Brother').trim();
        const notificationBody = String(content || '').trim();
        
        if (!notificationTitle || !notificationBody) {
          console.error('❌ Notification title or body is empty');
          return;
        }

        const notificationId = Date.now();
        
        const notificationPayload: any = {
          id: notificationId,
          title: notificationTitle,
          body: notificationBody,
          sound: 'default',
          extra: {
            type: 'evening'
          },
          data: {
            type: 'evening'
          }
        };

        if (this.platform === 'ios') {
          const scheduleTime = new Date(Date.now() + 2000); // 2 seconds for reliability
          notificationPayload.schedule = {
            at: scheduleTime
          };
          console.log('📅 iOS scheduling check-in notification for:', scheduleTime.toISOString());
        } else {
          notificationPayload.schedule = { 
            at: new Date(Date.now() + 100),
            allowWhileIdle: true
          };
          notificationPayload.smallIcon = 'ic_stat_icon_config_sample';
          notificationPayload.iconColor = '#4F46E5';
          notificationPayload.channelId = 'mind-brother-notifications';
          notificationPayload.priority = 2;
          notificationPayload.visibility = 1;
        }

        console.log('📤 Sending evening notification payload:', JSON.stringify(notificationPayload, null, 2));
        
        const result = await LocalNotifications.schedule({
          notifications: [notificationPayload]
        });
        console.log('✅ Evening notification scheduled:', result);
      } else {
        // Web
        const notification = new Notification(title, {
          body: content,
          icon: '/notification-icon.png',
          badge: '/badge-icon.png',
          tag: 'evening-encouragement',
          requireInteraction: false,
          silent: false
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 10000);
      }
    } catch (error) {
      console.error('❌ Error sending evening notification:', error);
    }
  }

  // Handle notification action responses
  setupNotificationActionHandler() {
    try {
      console.log('🔧 Setting up notification action handler...');
      console.log('🔧 Platform:', this.platform, 'isNative:', this.isNative);
      
      if (this.isNative) {
        // iOS/Android - Listen for notification taps
        // Check if LocalNotifications is available
        if (!LocalNotifications) {
          console.warn('⚠️ LocalNotifications not available, skipping handler setup');
          return;
        }
        
        // Remove any existing listeners first to avoid duplicates
        try {
          LocalNotifications.removeAllListeners();
        } catch (e) {
          console.log('No existing listeners to remove');
        }
        
        LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
        console.log('📱 ========== NOTIFICATION TAPPED ==========');
        console.log('📱 Notification tapped:', notificationAction);
        console.log('📱 Full notification object:', JSON.stringify(notificationAction, null, 2));
        
        const notification = notificationAction.notification;
        
        // Check multiple possible locations for the type
        // Capacitor might put it in different places depending on platform
        const notificationData = (notification as any).data;
        const notificationExtra = notification.extra || (notification as any).extra;
        
        let notificationType = notificationExtra?.type || 
                                notificationData?.type ||
                                (notificationExtra as any)?.type ||
                                notificationData?.type ||
                                notificationAction.actionId || 
                                (notificationAction as any).actionId;
        
        // If type not found in extra/data, check title and body (like AppDelegate does)
        if (!notificationType) {
          const title = notification.title?.toLowerCase() || '';
          const body = notification.body?.toLowerCase() || '';
          
          if (title.includes('checking in') || body.includes('check in')) {
            notificationType = 'checkin';
          } else if (title.includes('morning') || body.includes('win the day')) {
            notificationType = 'morning';
          } else if (title.includes('evening') || body.includes('rest well')) {
            notificationType = 'evening';
          }
        }
        
        console.log('📱 Notification type found:', notificationType);
        console.log('📱 Notification extra:', notificationExtra);
        console.log('📱 Notification data:', notificationData);
        console.log('📱 Notification ID:', notification.id);
        console.log('📱 Notification title:', notification.title);
        console.log('📱 Notification body:', notification.body);
        
        // Check if it's a check-in notification by ID (1002), type, title, or body
        const isCheckinNotification = notificationType === 'checkin' ||
                                     notification.id === 1002 ||
                                     notification.title?.toLowerCase().includes('checking in') ||
                                     notification.body?.toLowerCase().includes('check in');
        
        console.log('📱 Is check-in notification?', isCheckinNotification);
        
        // Navigate based on notification type
        if (isCheckinNotification) {
          console.log('📱 ✅ CHECK-IN NOTIFICATION DETECTED - Navigating...');
          
          // Store navigation intent in localStorage (works even if app was closed)
          try {
            localStorage.setItem('pendingNavigation', 'checkin');
            console.log('📱 Stored navigation intent in localStorage');
          } catch (e) {
            console.warn('Could not store in localStorage:', e);
          }
          
          // Note: iOS AppDelegate also stores in UserDefaults, but we can't read it from JS
          // The JavaScript handler should fire and set localStorage, which we check in App.tsx
          
          // Method 1: Store in localStorage immediately (works even if app was closed)
          try {
            localStorage.setItem('pendingNavigation', 'checkin');
            console.log('📱 Stored navigation intent in localStorage');
          } catch (e) {
            console.warn('Could not store in localStorage:', e);
          }
          
          // Method 2: Custom event (primary method) - try multiple times to ensure it works
          const tryNavigate = () => {
            try {
              const navigateEvent = new CustomEvent('navigateToView', {
                detail: { view: 'checkin' },
                bubbles: true,
                cancelable: true
              });
              const dispatched = window.dispatchEvent(navigateEvent);
              console.log('📱 Dispatched navigateToView event, defaultPrevented:', navigateEvent.defaultPrevented);
              console.log('📱 Event dispatched successfully:', dispatched);
              
              // Also try calling window function directly
              if ((window as any).testNavigateToCheckIn) {
                console.log('📱 Also calling window.testNavigateToCheckIn...');
                try {
                  (window as any).testNavigateToCheckIn();
                } catch (e) {
                  console.error('❌ Error calling testNavigateToCheckIn:', e);
                }
              }
            } catch (e) {
              console.error('❌ Error dispatching event:', e);
            }
          };
          
          // Try immediately
          tryNavigate();
          
          // Try again after delays to ensure app is ready
          setTimeout(tryNavigate, 300);
          setTimeout(tryNavigate, 1000);
          setTimeout(tryNavigate, 2000);
          
          // Method 3: Direct window location (for web/fallback)
          if (!this.isNative) {
            console.log('📱 Web platform - using window.location');
            window.location.href = '/checkin';
          }
          
          console.log('📱 ========== NAVIGATION ATTEMPTED ==========');
          return; // Don't show alert for check-in, just navigate
        }
        
        // For other notification types, show content
        if (notification.title && notification.body) {
          // Display the motivational content in an alert or custom modal
          this.displayNotificationContent(notification.title, notification.body);
        }
      });

        // Also listen for notifications received while app is open
        try {
          LocalNotifications.addListener('localNotificationReceived', async (notification) => {
            console.log('📬 Notification received while app open:', notification);
            // If it's a check-in notification received while app is open, we could navigate
            // But usually we wait for the tap (localNotificationActionPerformed)
          });
        } catch (listenerError) {
          console.warn('⚠️ Could not set up notification received listener:', listenerError);
        }
        
        // Note: App state change handling is done in App.tsx to avoid build issues
        
        console.log('✅ Notification action handler set up successfully');
        
        // Expose test function to manually trigger navigation (for debugging)
        (window as any).testNavigateToCheckIn = () => {
          console.log('🧪 Testing navigation to check-in...');
          const navigateEvent = new CustomEvent('navigateToView', {
            detail: { view: 'checkin' },
            bubbles: true,
            cancelable: true
          });
          window.dispatchEvent(navigateEvent);
          console.log('🧪 Navigation event dispatched');
        };
      } else {
        // Web - Service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', async (event) => {
            if (event.data.type === 'NOTIFICATION_ACTION') {
              await this.handleNotificationAction(event.data.action, event.data.notificationTag);
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error setting up notification action handler:', error);
      // Don't throw - allow app to continue loading
    }
  }

  // Display notification content in the app
  private displayNotificationContent(title: string, body: string) {
    // Create a custom event that the app can listen to
    const event = new CustomEvent('showNotificationContent', {
      detail: { title, body }
    });
    window.dispatchEvent(event);
    
    // Also show a simple alert for immediate feedback
    // (You can replace this with a beautiful modal later)
    setTimeout(() => {
      alert(`${title}\n\n${body}`);
    }, 300);
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
        .gte('sent_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    }

    // Send positive feedback notification
    if (this.notificationPermission) {
      if (this.isNative) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: 'Great to hear! 😊',
            body: 'Enjoy your day, brother!',
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default'
          }]
        });
      } else {
        const notification = new Notification('Great to hear! 😊', {
          body: 'Enjoy your day, brother!',
          icon: '/notification-icon.png',
          tag: 'positive-response',
          requireInteraction: false
        });
        setTimeout(() => notification.close(), 5000);
      }
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
      if (this.isNative) {
        await LocalNotifications.schedule({
          notifications: [{
            id: Date.now(),
            title: 'I\'m here for you 🤝',
            body: 'Let\'s talk with Amani about what\'s going on.',
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default'
          }]
        });
      } else {
        const notification = new Notification('I\'m here for you 🤝', {
          body: 'Let\'s talk with Amani about what\'s going on.',
          icon: '/notification-icon.png',
          tag: 'support-response',
          requireInteraction: false
        });
        setTimeout(() => notification.close(), 7000);
      }
    }
  }

  // Public methods for managing notifications
  async enableNotifications(userId: string): Promise<boolean> {
    this.userId = userId;
    const hasPermission = await this.requestPermission();
    
    if (hasPermission) {
      // Create notification channel (Android only - iOS doesn't use channels)
      if (this.isNative && this.platform === 'android') {
        await LocalNotifications.createChannel({
          id: 'mind-brother-notifications',
          name: 'Mind Brother',
          description: 'Daily motivation and check-ins',
          importance: 5, // MAX importance for heads-up notifications
          sound: 'default',
          vibration: true,
          visibility: 1, // Public
          lights: true,
          lightColor: '#4F46E5'
        });
      }
      
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
    if (!this.userId) {
      console.error('❌ Cannot update settings: userId is null');
      return;
    }

    try {
      console.log('💾 NotificationService: Updating settings:', settings);
      
      const { data, error } = await supabase
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
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating notification settings in database:', error);
        throw error;
      }

      console.log('✅ Database updated successfully:', data);
      console.log('📋 notifications_enabled value:', data?.notifications_enabled);

      // Reload settings - this will schedule notifications if enabled
      await this.loadUserNotificationSettings();
      
      console.log('✅ Settings reloaded. Scheduled notifications:', this.scheduledNotifications.length);
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      throw error; // Re-throw so caller knows it failed
    }
  }

  // Send immediate notification (for testing or manual triggers)
  async sendTestNotification(type: 'morning' | 'checkin' | 'evening') {
    try {
      // Re-check permissions
      if (this.isNative) {
        const permission = await LocalNotifications.checkPermissions();
        this.notificationPermission = permission.display === 'granted';
        if (!this.notificationPermission) {
          console.log('❌ Notification permission not granted. Current status:', permission.display);
          const requested = await LocalNotifications.requestPermissions();
          this.notificationPermission = requested.display === 'granted';
          if (!this.notificationPermission) {
            console.log('❌ Permission denied after request');
            return false;
          }
        }
      } else {
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          this.notificationPermission = permission === 'granted';
          if (!this.notificationPermission) {
            console.log('❌ Web notification permission denied');
            return false;
          }
        }
      }

      console.log(`📱 Sending test notification: ${type}, permission: ${this.notificationPermission}, platform: ${this.platform}`);
      
      // For iOS, ensure we have proper permissions
      if (this.platform === 'ios') {
        const permission = await LocalNotifications.checkPermissions();
        console.log('📱 iOS permission details:', permission);
        
        if (permission.display !== 'granted') {
          console.log('⚠️ iOS notification permission not granted, requesting...');
          const requested = await LocalNotifications.requestPermissions();
          console.log('📱 iOS permission request result:', requested);
          this.notificationPermission = requested.display === 'granted';
          
          if (!this.notificationPermission) {
            console.error('❌ iOS notification permission denied');
            return false;
          }
        }
      }
      
      await this.sendScheduledNotification(type);
      console.log('✅ Test notification scheduled successfully');
      
      // For iOS, verify the notification was scheduled
      if (this.platform === 'ios') {
        setTimeout(async () => {
          try {
            const pending = await LocalNotifications.getPending();
            const count = pending?.notifications?.length || 0;
            console.log('📋 iOS pending notifications after test:', count);
            
            if (count === 0) {
              console.warn('⚠️ No pending notifications found - notification may not have been scheduled');
            } else {
              console.log('✅ Notification is scheduled and will appear in 1-2 seconds');
            }
          } catch (e) {
            console.warn('Could not check pending:', e);
          }
        }, 500);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }

  // Get notification status
  async getNotificationStatus() {
    // Refresh permission status
    if (this.isNative) {
      const permission = await LocalNotifications.checkPermissions();
      this.notificationPermission = permission.display === 'granted';
      
      // Get pending notifications for debugging
      try {
        const pending = await LocalNotifications.getPending();
        console.log('📋 Pending notifications:', pending?.notifications?.length || 0);
      } catch (e) {
        console.warn('Could not get pending notifications:', e);
      }
    } else {
      if ('Notification' in window) {
        this.notificationPermission = Notification.permission === 'granted';
      }
    }
    
    return {
      permission: this.notificationPermission,
      scheduled: this.scheduledNotifications,
      userId: this.userId,
      isNative: this.isNative,
      platform: this.platform,
      scheduledCount: this.scheduledNotifications.length
    };
  }
  
  // Debug method to check all notification settings
  async debugNotificationStatus() {
    const status = await this.getNotificationStatus();
    const now = new Date();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log('🔍 ========== NOTIFICATION DEBUG ==========');
    console.log('🔍 Notification Debug Status:', {
      ...status,
      currentLocalTime: now.toLocaleTimeString(),
      currentDate: now.toLocaleDateString(),
      timezone: timezone,
      timezoneOffset: `UTC${now.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(now.getTimezoneOffset() / 60)}`,
      scheduledTimes: this.scheduledNotifications.map(n => `${n.type}: ${n.time} (local)`)
    });
    
    console.log('🕐 Your scheduled notification times (in YOUR local timezone):');
    this.scheduledNotifications.forEach(n => {
      console.log(`   • ${n.type.charAt(0).toUpperCase() + n.type.slice(1)}: ${n.time} ${timezone}`);
    });
    
    if (this.isNative) {
      try {
        const pending = await LocalNotifications.getPending();
        console.log('📋 Pending notifications:', pending);
        console.log('📋 Total pending:', pending?.notifications?.length || 0);
        
        if (pending?.notifications && pending.notifications.length > 0) {
          console.log('📋 Pending notification details:');
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          pending.notifications.forEach((n: any, index: number) => {
            console.log(`  ${index + 1}. ID: ${n.id}, Title: ${n.title}`);
            if (n.schedule?.on) {
              const hour = n.schedule.on.hour?.toString().padStart(2, '0') || '??';
              const minute = n.schedule.on.minute?.toString().padStart(2, '0') || '??';
              console.log(`     ⏰ Scheduled for: ${hour}:${minute} daily (${timezone})`);
              console.log(`     🔁 Repeats: ${n.schedule.repeats ? 'Yes' : 'No'}`);
            } else if (n.schedule?.at) {
              const scheduleDate = new Date(n.schedule.at);
              console.log(`     ⏰ Scheduled for: ${scheduleDate.toLocaleString()} (${timezone})`);
            } else {
              console.log(`     Schedule:`, n.schedule);
            }
            console.log(`     Channel: ${n.channelId || 'default'}`);
          });
        } else {
          console.warn('⚠️ No pending notifications found!');
          console.warn('⚠️ This means notifications are not scheduled.');
          console.warn('⚠️ Check that notifications are enabled in settings.');
        }
      } catch (e) {
        console.error('Error getting pending:', e);
      }
      
      // Also check permissions
      try {
        const permissions = await LocalNotifications.checkPermissions();
        console.log('📱 Notification permissions:', permissions);
      } catch (e) {
        console.error('Error checking permissions:', e);
      }
    }
    
    return status;
  }
  // Check for unread notifications from database and display as local notifications
  async checkAndDisplayUnreadNotifications(): Promise<number> {
    if (!this.userId) {
      console.log('📭 Cannot check notifications: no user ID');
      return 0;
    }

    // Skip if we just handled a push notification tap (within last 10 seconds)
    // This prevents duplicate local notifications after tapping a push
    const lastPushTap = parseInt(localStorage.getItem('lastNotificationTap') || '0', 10);
    const timeSinceLastTap = Date.now() - lastPushTap;
    if (timeSinceLastTap < 10000) {
      console.log('📭 Skipping unread check - just handled a push notification tap');
      return 0;
    }
    
    // Skip if we just received a push notification (within last 10 seconds)
    // This prevents duplicate local notifications when a push arrives
    const lastPushReceived = parseInt(localStorage.getItem('lastPushReceived') || '0', 10);
    const timeSinceLastPush = Date.now() - lastPushReceived;
    if (timeSinceLastPush < 10000) {
      console.log('📭 Skipping unread check - just received a push notification');
      return 0;
    }

    try {
      console.log('📬 Checking for unread notifications for user:', this.userId);
      
      // Get unread notifications from database
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', this.userId)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Error fetching notifications:', error);
        return 0;
      }

      if (!notifications || notifications.length === 0) {
        console.log('📭 No unread notifications');
        return 0;
      }

      console.log(`📬 Found ${notifications.length} unread notifications`);

      // Display each notification as a local notification
      for (const notif of notifications) {
        if (this.isNative && this.notificationPermission) {
          try {
            const notificationId = Math.abs(notif.id.hashCode?.() || Date.now() + Math.random() * 1000);
            
            await LocalNotifications.schedule({
              notifications: [{
                id: Math.floor(notificationId % 2147483647), // Ensure valid int32
                title: notif.title || 'New Notification',
                body: notif.message || '',
                schedule: { at: new Date(Date.now() + 500) }, // Show in 0.5 seconds
                sound: 'default',
                smallIcon: 'ic_stat_notification',
                largeIcon: 'ic_launcher',
                channelId: 'mind-brother-notifications',
                extra: {
                  type: notif.type,
                  topic_id: notif.data?.topic_id,
                  notification_id: notif.id
                }
              }]
            });
            console.log('✅ Displayed notification:', notif.title);
          } catch (err) {
            console.error('❌ Error displaying notification:', err);
          }
        } else if (!this.isNative && 'Notification' in window && Notification.permission === 'granted') {
          // Web notification
          new Notification(notif.title || 'New Notification', {
            body: notif.message || '',
            icon: '/notification-icon.png',
            tag: `notification-${notif.id}`
          });
        }

        // Mark notification as read after displaying
        await supabase
          .from('notifications')
          .update({ read: true, read_at: new Date().toISOString() })
          .eq('id', notif.id);
      }

      return notifications.length;
    } catch (error) {
      console.error('❌ Error checking notifications:', error);
      return 0;
    }
  }

  // Send an immediate local notification (for mentions, replies, etc.)
  async sendImmediateNotification(title: string, body: string, data?: Record<string, any>): Promise<boolean> {
    try {
      console.log('📤 Sending immediate notification:', title);

      if (this.isNative && this.notificationPermission) {
        const notificationId = Math.floor(Date.now() % 2147483647);
        
        await LocalNotifications.schedule({
          notifications: [{
            id: notificationId,
            title,
            body,
            schedule: { at: new Date(Date.now() + 500) },
            sound: 'default',
            smallIcon: 'ic_stat_notification',
            largeIcon: 'ic_launcher',
            channelId: 'mind-brother-notifications',
            extra: data || {}
          }]
        });
        console.log('✅ Immediate notification scheduled');
        return true;
      } else if (!this.isNative && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/notification-icon.png'
        });
        return true;
      }

      console.log('⚠️ Cannot send notification: no permission or not native');
      return false;
    } catch (error) {
      console.error('❌ Error sending immediate notification:', error);
      return false;
    }
  }
}

// Export singleton instance - lazy initialization to prevent blocking
let _notificationServiceInstance: NotificationService | null = null;
let _notificationServiceStub: any = null;

// Create a stub that matches the interface
function createStub() {
  if (!_notificationServiceStub) {
    _notificationServiceStub = {
      requestPermission: async () => false,
      enableNotifications: async () => false,
      disableNotifications: async () => {},
      sendTestNotification: async () => false,
      updateNotificationSettings: async () => {},
      scheduleNotifications: async () => {},
      cancelAllNotifications: async () => {},
      sendScheduledNotification: async () => {},
      getNotificationStatus: async () => ({ enabled: false, permission: 'denied' }),
      loadUserNotificationSettings: async () => {},
      checkAndDisplayUnreadNotifications: async () => 0,
      sendImmediateNotification: async () => false,
    };
  }
  return _notificationServiceStub;
}

// Getter function that safely returns the service instance
function getNotificationService() {
  if (!_notificationServiceInstance) {
    try {
      _notificationServiceInstance = NotificationService.getInstance();
    } catch (error) {
      console.error('❌ Error creating notification service instance:', error);
      return createStub();
    }
  }
  return _notificationServiceInstance;
}

// Export as a getter object that proxies all method calls
export const notificationService = new Proxy({} as NotificationService, {
  get(_target, prop) {
    const service = getNotificationService();
    const value = (service as any)[prop];
    if (typeof value === 'function') {
      return value.bind(service);
    }
    return value;
  }
});