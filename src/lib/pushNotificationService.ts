import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Request notification permissions and register device token
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    this.userId = userId;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: import.meta.env.VITE_EXPO_PROJECT_ID || undefined,
      });

      this.expoPushToken = tokenData.data;
      console.log('📱 Expo Push Token:', this.expoPushToken);

      // Save token to database
      await this.saveDeviceToken(this.expoPushToken, userId);

      // Set up notification listeners
      this.setupNotificationListeners();

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Save device token to Supabase
   */
  private async saveDeviceToken(token: string, userId: string) {
    try {
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      
      // Get or generate device ID
      const deviceId = await this.getDeviceId();

      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          device_token: token,
          platform: platform,
          device_id: deviceId,
          is_active: true,
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_token'
        });

      if (error) {
        console.error('Error saving device token:', error);
      } else {
        console.log('✅ Device token saved to database');
      }
    } catch (error) {
      console.error('Error in saveDeviceToken:', error);
    }
  }

  /**
   * Get or generate a device ID
   */
  private async getDeviceId(): Promise<string> {
    // Try to get from AsyncStorage or generate new one
    // For now, generate a simple ID
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
    });

    // Handle notification tap/response
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data?.type === 'checkin') {
        // Open check-in screen
        // You can use navigation here
      } else if (data?.type === 'morning' || data?.type === 'evening') {
        // Open app
      }
    });
  }

  /**
   * Unregister device token (on logout)
   */
  async unregister(userId: string) {
    if (!this.expoPushToken) return;

    try {
      const { error } = await supabase
        .from('device_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('device_token', this.expoPushToken);

      if (error) {
        console.error('Error unregistering device token:', error);
      } else {
        console.log('✅ Device token unregistered');
        this.expoPushToken = null;
      }
    } catch (error) {
      console.error('Error in unregister:', error);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title: string, body: string, trigger: Date) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();



