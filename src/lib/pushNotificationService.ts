import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabase';

// Navigation callback type
type NavigationCallback = (view: string, data?: { topicId?: string; replyId?: string }) => void;

class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;
  private currentToken: string | null = null;
  private currentUserId: string | null = null;
  private navigationCallback: NavigationCallback | null = null;
  private pendingNavigation: { view: string; data?: { topicId?: string; replyId?: string } } | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('📱 Push notifications not available on web');
      return;
    }

    this.currentUserId = userId;
    console.log('🔔 Initializing push notifications for user:', userId);
    
    // Store platform for later reference
    localStorage.setItem('capacitor_platform', Capacitor.getPlatform());

    try {
      // IMPORTANT: Add listeners BEFORE registering
      // This ensures we don't miss the registration event
      await this.setupListeners();
      
      // iOS: Set up listener for FCM token injection from native
      this.setupIOSTokenListener();
      
      // iOS: Also check immediately if token already exists in localStorage
      if (Capacitor.getPlatform() === 'ios') {
        await this.checkNativeFCMToken();
      }

      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      console.log('🔔 Current permission status:', permStatus.receive);

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
        console.log('🔔 Permission after request:', permStatus.receive);
      }

      if (permStatus.receive !== 'granted') {
        console.log('❌ Push notification permission not granted');
        return;
      }

      // Register for push notifications
      console.log('🔔 Calling PushNotifications.register()...');
      await PushNotifications.register();
      console.log('✅ PushNotifications.register() completed');

      this.isInitialized = true;
      console.log('✅ Push notification service initialized');

      // iOS fallback: Check for FCM token from native UserDefaults after a delay
      // Firebase stores the token there before Capacitor can intercept it
      if (Capacitor.getPlatform() === 'ios') {
        setTimeout(async () => {
          if (!this.currentToken && this.currentUserId) {
            console.log('🔍 iOS: Checking for FCM token from native storage...');
            await this.checkNativeFCMToken();
          }
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    }
  }

  // iOS fallback: Try to get FCM token from localStorage (injected by native code)
  private async checkNativeFCMToken(): Promise<void> {
    try {
      console.log('📱 iOS: Checking for FCM token in localStorage...');
      
      // Check if the native iOS code injected the token
      const iosFcmToken = localStorage.getItem('ios_fcm_token');
      
      if (iosFcmToken && this.currentUserId) {
        console.log('🔥 Found iOS FCM token in localStorage:', iosFcmToken.substring(0, 30) + '...');
        this.currentToken = iosFcmToken;
        await this.saveTokenToServer(this.currentUserId, iosFcmToken);
        // Clear after saving to prevent duplicate saves
        localStorage.removeItem('ios_fcm_token');
      } else if (!iosFcmToken) {
        console.log('⏳ iOS FCM token not yet in localStorage, will listen for event...');
      }
      
    } catch (error) {
      console.log('📱 Could not check native FCM token:', error);
    }
  }
  
  // Set up listener for iOS FCM token injection
  private setupIOSTokenListener(): void {
    if (Capacitor.getPlatform() !== 'ios') return;
    
    console.log('📱 iOS: Setting up FCM token listener...');
    
    window.addEventListener('fcm-token-received', async (event: any) => {
      const token = event.detail?.token;
      if (token && this.currentUserId) {
        console.log('🔥 Received iOS FCM token via event:', token.substring(0, 30) + '...');
        this.currentToken = token;
        await this.saveTokenToServer(this.currentUserId, token);
      }
    });
  }

  private async setupListeners(): Promise<void> {
    console.log('🔔 Setting up push notification listeners...');

    // Remove any existing listeners first
    await PushNotifications.removeAllListeners();

    // Listen for registration success
    await PushNotifications.addListener('registration', async (token: Token) => {
      console.log('🔥 =================================');
      console.log('🔥 Push registration success!');
      console.log('🔥 Token:', token.value);
      console.log('🔥 User ID:', this.currentUserId);
      console.log('🔥 =================================');
      
      this.currentToken = token.value;
      
      if (this.currentUserId) {
        await this.saveTokenToServer(this.currentUserId, token.value);
      } else {
        console.error('❌ No user ID available to save token');
      }
    });

    // Listen for registration errors
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ =================================');
      console.error('❌ Push registration ERROR!');
      console.error('❌ Error:', JSON.stringify(error));
      console.error('❌ =================================');
    });

    // Listen for push notifications received (foreground)
    await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('📬 Push notification received in foreground:', notification);
      
      // Mark that we just received a push notification (to prevent duplicate local notifications)
      localStorage.setItem('lastPushReceived', Date.now().toString());
      
      // Don't show in-app notification if we just handled a notification tap (within last 5 seconds)
      const lastTapTime = parseInt(localStorage.getItem('lastNotificationTap') || '0', 10);
      const timeSinceLastTap = Date.now() - lastTapTime;
      
      if (timeSinceLastTap < 5000) {
        console.log('📬 Skipping in-app notification - just handled a tap');
        return;
      }
      
      // Don't show in-app toast on iOS - the native banner already shows
      // Only show on Android where foreground notifications don't show banners
      const platform = localStorage.getItem('capacitor_platform') || 'unknown';
      if (platform === 'ios') {
        console.log('📬 iOS: Skipping in-app toast - native banner already shown');
        return;
      }
      
      // Show an in-app notification since FCM doesn't show banners when app is open
      this.showInAppNotification(notification);
    });

    // Listen for push notification action (user tapped notification)
    await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('👆 Push notification tapped:', action);
      console.log('👆 Notification data:', JSON.stringify(action.notification.data));
      
      // Mark that we just handled a notification tap (to prevent duplicate in-app notifications)
      localStorage.setItem('lastNotificationTap', Date.now().toString());
      
      const data = action.notification.data;
      
      // Handle both topic_id (from FCM) and topicId (alternate format)
      const topicId = data?.topic_id || data?.topicId;
      const replyId = data?.reply_id || data?.replyId;
      const notificationType = data?.type;
      
      console.log('👆 Parsed notification:', { type: notificationType, topicId, replyId });
      
      if (notificationType === 'mention' && topicId) {
        console.log('🧭 Navigating to Village with topic:', topicId, 'reply:', replyId);
        
        // Store in localStorage for cold start scenarios
        try {
          localStorage.setItem('pendingDeepLink', JSON.stringify({
            view: 'discussions',
            topicId: topicId,
            replyId: replyId || null,
            timestamp: Date.now()
          }));
          console.log('💾 Stored deep link in localStorage');
        } catch (e) {
          console.error('Failed to store deep link:', e);
        }
        
        this.navigate('discussions', { topicId, replyId });
        
        // Also dispatch event for immediate handling
        window.dispatchEvent(new CustomEvent('notification-navigation', {
          detail: { view: 'discussions', topicId, replyId }
        }));
      }
    });

    console.log('✅ Push notification listeners set up');
  }

  private async saveTokenToServer(userId: string, token: string): Promise<void> {
    try {
      console.log('💾 Saving push token to server for user:', userId);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ push_token: token })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error saving push token:', error);
      } else {
        console.log('✅ Push token saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving push token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    return this.currentToken;
  }

  // Set navigation callback from App.tsx
  setNavigationCallback(callback: NavigationCallback): void {
    console.log('🧭 Navigation callback registered');
    this.navigationCallback = callback;
    
    // If there's a pending navigation, execute it now
    if (this.pendingNavigation) {
      console.log('🧭 Executing pending navigation:', this.pendingNavigation);
      callback(this.pendingNavigation.view, this.pendingNavigation.data);
      this.pendingNavigation = null;
    }
  }

  // Navigate to a view (called when notification is tapped)
  private navigate(view: string, data?: { topicId?: string }): void {
    if (this.navigationCallback) {
      console.log('🧭 Navigating to:', view, data);
      this.navigationCallback(view, data);
    } else {
      // Store for later if callback not yet registered
      console.log('🧭 Storing pending navigation:', view, data);
      this.pendingNavigation = { view, data };
    }
  }

  // Get pending navigation (for app startup)
  getPendingNavigation(): { view: string; data?: { topicId?: string; replyId?: string } } | null {
    const pending = this.pendingNavigation;
    this.pendingNavigation = null;
    return pending;
  }

  // Check localStorage for pending deep link (for cold start)
  static checkPendingDeepLink(): { view: string; topicId: string; replyId?: string } | null {
    try {
      const stored = localStorage.getItem('pendingDeepLink');
      if (stored) {
        const data = JSON.parse(stored);
        // Only use if less than 30 seconds old
        if (Date.now() - data.timestamp < 30000) {
          console.log('🔗 Found pending deep link:', data);
          localStorage.removeItem('pendingDeepLink');
          return { view: data.view, topicId: data.topicId, replyId: data.replyId };
        } else {
          console.log('🔗 Deep link expired, removing');
          localStorage.removeItem('pendingDeepLink');
        }
      }
    } catch (e) {
      console.error('Error checking pending deep link:', e);
    }
    return null;
  }

  // Show in-app notification when push received in foreground
  private showInAppNotification(notification: PushNotificationSchema): void {
    const { title, body, data } = notification;
    
    // Create a toast-style notification element
    const toast = document.createElement('div');
    toast.id = 'push-notification-toast';
    toast.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(79, 70, 229, 0.4);
      z-index: 99999;
      max-width: 90%;
      min-width: 300px;
      cursor: pointer;
      animation: slideIn 0.3s ease;
    `;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes slideOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    
    toast.innerHTML = `
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">${title || 'New Notification'}</div>
      <div style="font-size: 14px; opacity: 0.9;">${body || ''}</div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Tap to view</div>
    `;
    
    // Handle tap
    toast.onclick = () => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
      
      // Navigate if it's a mention notification
      if (data?.type === 'mention' && data?.topic_id) {
        this.navigate('discussions', { 
          topicId: data.topic_id as string, 
          replyId: data.reply_id as string 
        });
      }
    };
    
    // Remove existing toast if any
    const existing = document.getElementById('push-notification-toast');
    if (existing) existing.remove();
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  async clearToken(userId: string): Promise<void> {
    try {
      // Clear token from server on logout
      await supabase
        .from('user_profiles')
        .update({ push_token: null })
        .eq('user_id', userId);
      
      this.currentToken = null;
      console.log('✅ Push token cleared');
    } catch (error) {
      console.error('❌ Error clearing push token:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();

// Export static method for checking pending deep links
export const checkPendingDeepLink = PushNotificationService.checkPendingDeepLink;

