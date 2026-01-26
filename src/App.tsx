import { useEffect, useState, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';

// Conditionally import CapacitorApp - type-safe approach
type CapacitorAppType = {
  addListener: (event: string, callback: (data: any) => void) => { remove: () => void };
} | null;

let CapacitorApp: CapacitorAppType = null;
try {
  // Dynamic require to handle cases where @capacitor/app may not be installed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const appModule = require('@capacitor/app');
  CapacitorApp = appModule.App || null;
} catch (e) {
  // Package not available - listeners will be disabled
  console.log('📱 @capacitor/app not available, app state listeners disabled');
  CapacitorApp = null;
}

// Utility function to update user profile name (can be called from browser console)
(window as any).updateMyProfileName = async (firstName: string, lastName?: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.error('No user session found');
      return;
    }
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        first_name: firstName,
        last_name: lastName || null
      })
      .eq('user_id', session.user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
    } else {
      console.log('✅ Profile updated successfully:', data);
      // Reload the page to see the changes
      window.location.reload();
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import { ChatbotWeb } from './components/ChatbotWeb';
import { GuidedBreathing } from './components/GuidedBreathing';
import { FitnessWorkout } from './components/FitnessWorkout';
import Journal from './components/Journal';
import Resources from './components/Resources';
import FeelingCheckIn from './components/FeelingCheckIn';
import DailyMotivation from './components/DailyMotivation';
import Exercise from './components/Exercise';
import Discussions from './components/Discussions';
import NotificationSettings from './components/NotificationSettings';
import TermsOfService from './components/TermsOfService';
import PrivacyNotice from './components/PrivacyNotice';
import CrisisDisclaimer from './components/CrisisDisclaimer';
import BetaTesterAgreement from './components/BetaTesterAgreement';
import ProfessionalAgreement from './components/ProfessionalAgreement';
import CommunityGuidelines from './components/CommunityGuidelines';
import AuthFlow from './components/auth/AuthFlow';
import WelcomeToast from './components/WelcomeToast';
import AnalyticsDashboard from './components/Analytics Dashboard';
import AccountSettings from './components/AccountSettings';
import CulturalPreferencesSettings from './components/CulturalPreferencesSettings';
import CulturalOnboarding from './components/CulturalOnboarding';
import CulturalContentAdmin from './components/CulturalContentAdmin';
import PeerSupport from './components/PeerSupport';
import CulturalAnalyticsDashboard from './components/CulturalAnalyticsDashboard';
import UserInsightsDashboard from './components/UserInsightsDashboard';
import { getUserCulturalProfile } from './lib/culturalPersonalizationService';
// ModeratorDashboard removed from mobile - web-only for admins
// import ModeratorDashboard from './components/ModeratorDashboard';
import type { UserSignupData, ProfessionalSignupData, SignInData } from './types/auth.types';

type ViewType = 
  | 'home' 
  | 'dashboard' 
  | 'chatbot'
  | 'account-settings' 
  | 'breathing' 
  | 'workout' 
  | 'journal' 
  | 'resources' 
  | 'checkin' 
  | 'motivation' 
  | 'exercise' 
  | 'discussions'
  | 'settings'
  | 'account-settings'
  | 'cultural-settings'
  | 'cultural-admin'
  | 'cultural-analytics'
  | 'peer-support'
  | 'insights'
  | 'analytics'
  | 'terms'
  | 'privacy'
  | 'crisis'
  | 'beta'
  | 'professional'
  | 'guidelines'
  | 'auth';

// Helper function to get display name from profile
const getDisplayName = (profile: any): string => {
  if (!profile) {
    console.log('getDisplayName: No profile provided');
    return 'Brother';
  }
  
  console.log('getDisplayName: Profile data:', {
    first_name: profile.first_name,
    last_name: profile.last_name,
    username: profile.username,
    first_name_type: typeof profile.first_name,
    first_name_length: profile.first_name?.length
  });
  
  // First, try first_name - check for both null/undefined and empty strings
  if (profile.first_name && profile.first_name.trim().length > 0) {
    const firstName = profile.first_name.trim();
    // If first_name contains a space, extract just the first part (e.g., "Dennis Roberson" -> "Dennis")
    const nameParts = firstName.split(/\s+/);
    const displayName = nameParts[0];
    console.log('getDisplayName: Using first_name:', displayName, '(from:', firstName, ')');
    return displayName;
  }
  
  // If username exists and doesn't look like a generated one, try to extract first name
  if (profile.username && !profile.username.startsWith('user_')) {
    // If username contains a space, take the first part as the first name
    const nameParts = profile.username.trim().split(/\s+/);
    if (nameParts.length > 0 && nameParts[0]) {
      console.log('getDisplayName: Using first part of username:', nameParts[0]);
      return nameParts[0];
    }
    // If no space, use the whole username if it's reasonable
    console.log('getDisplayName: Using full username:', profile.username);
    return profile.username;
  }
  
  console.log('getDisplayName: Falling back to "Brother"');
  return 'Brother';
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [deepLinkTopicId, setDeepLinkTopicId] = useState<string | null>(null);
  const [deepLinkReplyId, setDeepLinkReplyId] = useState<string | null>(null);
  
  // ⭐ CULTURAL ONBOARDING: Track onboarding state
  const [showCulturalOnboarding, setShowCulturalOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  
  // ✅ Prevent infinite auth loop
  const isInitialMount = useRef(true);

  // ⭐ CULTURAL ONBOARDING: Check if user needs to complete onboarding
  useEffect(() => {
    if (user?.id && !loading) {
      checkOnboardingStatus();
    } else if (!user) {
      // No user, skip onboarding check
      setCheckingOnboarding(false);
    }
  }, [user?.id, loading]);

  const checkOnboardingStatus = async () => {
    if (!user?.id) {
      setCheckingOnboarding(false);
      return;
    }

    try {
      console.log('🌍 Checking cultural onboarding status for user:', user.id);
      const culturalProfile = await getUserCulturalProfile(user.id);
      
      // Show onboarding if:
      // 1. No profile exists, OR
      // 2. Profile exists but not completed and not skipped
      if (!culturalProfile || (!culturalProfile.onboarding_completed && !culturalProfile.onboarding_skipped)) {
        console.log('📋 User needs to complete cultural onboarding');
        setShowCulturalOnboarding(true);
      } else {
        console.log('✅ User has completed or skipped cultural onboarding');
        setShowCulturalOnboarding(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Don't block app on error - let user proceed
      setShowCulturalOnboarding(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  // Check for pending deep link from notification tap (cold start)
  useEffect(() => {
    const checkDeepLink = () => {
      try {
        // Check localStorage for pending deep link
        const stored = localStorage.getItem('pendingDeepLink');
        if (stored) {
          const data = JSON.parse(stored);
          // Only use if less than 60 seconds old
          if (Date.now() - data.timestamp < 60000) {
            console.log('🔗 Found pending deep link:', data);
            localStorage.removeItem('pendingDeepLink');
            
            if (data.topicId) {
              setDeepLinkTopicId(data.topicId);
            }
            if (data.replyId) {
              setDeepLinkReplyId(data.replyId);
            }
            if (data.view) {
              setCurrentView(data.view as ViewType);
            }
            return true;
          } else {
            console.log('🔗 Deep link expired, removing');
            localStorage.removeItem('pendingDeepLink');
          }
        }
        return false;
      } catch (e) {
        console.log('Deep link check error:', e);
        return false;
      }
    };
    
    // Listen for navigation events (from native or push service)
    const handleNotificationNavigation = (event: CustomEvent) => {
      console.log('🧭 Received notification-navigation event:', event.detail);
      const { view, topicId, replyId } = event.detail || {};
      if (view === 'discussions' && topicId) {
        setDeepLinkTopicId(topicId);
        if (replyId) setDeepLinkReplyId(replyId);
        setCurrentView('discussions');
      } else if (view) {
        setCurrentView(view as ViewType);
      }
    };
    
    // Listen for app resume/visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App became visible, checking for pending deep links...');
        setTimeout(checkDeepLink, 100);
        setTimeout(checkDeepLink, 500);
        setTimeout(checkDeepLink, 1500);
      }
    };
    
    // Listen for focus events (another way to detect app activation)
    const handleFocus = () => {
      console.log('📱 Window focused, checking for pending deep links...');
      setTimeout(checkDeepLink, 100);
    };
    
    window.addEventListener('notification-navigation', handleNotificationNavigation as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Check immediately and multiple times on startup
    checkDeepLink();
    const timer1 = setTimeout(checkDeepLink, 500);
    const timer2 = setTimeout(checkDeepLink, 1500);
    const timer3 = setTimeout(checkDeepLink, 3000);
    
    // Also poll periodically for the first 30 seconds
    const pollInterval = setInterval(() => {
      checkDeepLink();
    }, 2000);
    
    // Stop polling after 30 seconds
    const stopPolling = setTimeout(() => {
      clearInterval(pollInterval);
    }, 30000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(stopPolling);
      clearInterval(pollInterval);
      window.removeEventListener('notification-navigation', handleNotificationNavigation as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Loading timeout - forcing app to render');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    checkAuth();

    // Listen for auth changes
    // IMPORTANT: Skip ALL events during initial mount to avoid React error #321
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
      
      // ✅ CRITICAL: Skip ALL events during initial mount - let checkAuth handle it
      // This prevents React error #321 (updating state during render)
      if (isInitialMount.current) {
        console.log(`⏭️ Skipping ${_event} during initial mount - handled by checkAuth`);
        return;
      }
      
      // Handle email confirmation - defer ALL state updates to avoid React error #321
      if (_event === 'SIGNED_IN' && session) {
        console.log('User signed in via email confirmation');
        // Defer ALL state updates to avoid React error #321
        setTimeout(() => {
          setUser(session.user);
          setCurrentView('home');
        }, 100);
      }
      
      // ✅ Only call checkAuth on real auth changes, not initial mount
      setTimeout(() => {
        checkAuth();
      }, 100);
    });

    // Listen for navigation events from notifications
    const handleNavigateToView = (event: Event) => {
      const customEvent = event as CustomEvent;
      const view = customEvent.detail?.view;
      console.log('📱 Received navigateToView event:', view, customEvent.detail);
      
      if (view && ['checkin', 'chatbot', 'journal', 'home', 'dashboard'].includes(view)) {
        console.log('📱 ✅ Navigating to view from notification:', view);
        // Use setTimeout to ensure state update happens after render
        setTimeout(() => {
          setCurrentView(view as ViewType);
        }, 0);
      } else {
        console.log('📱 ⚠️ Invalid view or view not in allowed list:', view);
      }
    };

    window.addEventListener('navigateToView', handleNavigateToView);
    console.log('✅ Added navigateToView event listener');
    
    // Cleanup function
    // Note: appStateListener and appUrlListener are cleaned up in their own useEffect
    return () => {
      window.removeEventListener('navigateToView', handleNavigateToView as EventListener);
      if (subscription) {
        subscription.unsubscribe();
      }
      clearTimeout(loadingTimeout);
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Separate useEffect for pending navigation check (for iOS cold start)
  // This must be a separate useEffect to avoid nested hooks violation
  useEffect(() => {
    // Only check after app is fully loaded
    if (!loading) {
      const checkPendingNav = () => {
        try {
          const pendingNav = localStorage.getItem('pendingNavigation');
          if (pendingNav === 'checkin') {
            console.log('📱 ✅ Found pending navigation, navigating to check-in...');
            localStorage.removeItem('pendingNavigation');
            // Use setTimeout to ensure state update happens after render
            setTimeout(() => {
              console.log('📱 Executing navigation to check-in from pending nav...');
              setCurrentView('checkin');
            }, 100);
          }
        } catch (e) {
          console.log('Could not check localStorage on mount:', e);
        }
      };
      
      // Check immediately
      checkPendingNav();
      
      // Also check after delays (in case notification handler sets it)
      const timeout1 = setTimeout(checkPendingNav, 500);
      const timeout2 = setTimeout(checkPendingNav, 1500);
      const timeout3 = setTimeout(checkPendingNav, 3000);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
      };
    }
  }, [loading]);
  
  // Expose test function for debugging
  useEffect(() => {
    (window as any).testNavigateToCheckIn = () => {
      console.log('🧪 Testing navigation to check-in from window function...');
      setCurrentView('checkin');
    };
    
    // Expose comprehensive notification diagnostic function
    (window as any).diagnoseNotifications = async () => {
      console.log('🔍 ========================================');
      console.log('🔍 NOTIFICATION DIAGNOSTIC REPORT');
      console.log('🔍 ========================================');
      
      try {
        // Import notification service
        const { notificationService } = await import('./lib/notificationService');
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const { Capacitor } = await import('@capacitor/core');
        
        const diagnostics: any = {
          timestamp: new Date().toISOString(),
          platform: Capacitor.getPlatform(),
          isNative: Capacitor.isNativePlatform(),
        };
        
        // 1. Check permissions
        console.log('\n📱 1. PERMISSION STATUS');
        console.log('----------------------------------------');
        try {
          const permissions = await LocalNotifications.checkPermissions();
          diagnostics.permissions = permissions;
          console.log('Permissions:', permissions);
          
          if (permissions.display === 'granted') {
            console.log('✅ Notification permission: GRANTED');
          } else if (permissions.display === 'denied') {
            console.log('❌ Notification permission: DENIED');
          } else {
            console.log('⚠️ Notification permission: PROMPT (not yet requested)');
          }
        } catch (e) {
          console.error('❌ Error checking permissions:', e);
          diagnostics.permissionsError = String(e);
        }
        
        // 2. Check pending notifications
        console.log('\n📋 2. PENDING NOTIFICATIONS');
        console.log('----------------------------------------');
        try {
          const pending = await LocalNotifications.getPending();
          diagnostics.pending = pending;
          console.log('Total pending notifications:', pending?.notifications?.length || 0);
          
          if (pending?.notifications && pending.notifications.length > 0) {
            console.log('✅ Found', pending.notifications.length, 'pending notification(s):');
            pending.notifications.forEach((n: any, index: number) => {
              console.log(`  ${index + 1}. ID: ${n.id}`);
              console.log(`     Title: "${n.title}"`);
              console.log(`     Body: "${n.body}"`);
              console.log(`     Schedule:`, n.schedule);
              console.log(`     Channel ID: ${n.channelId || 'default'}`);
              console.log(`     Priority: ${n.priority || 'default'}`);
            });
          } else {
            console.log('⚠️ NO PENDING NOTIFICATIONS - This means notifications are not scheduled!');
          }
        } catch (e) {
          console.error('❌ Error getting pending notifications:', e);
          diagnostics.pendingError = String(e);
        }
        
        // 3. Check notification service status
        console.log('\n⚙️  3. NOTIFICATION SERVICE STATUS');
        console.log('----------------------------------------');
        try {
          const status = await notificationService.getNotificationStatus();
          diagnostics.serviceStatus = status;
          console.log('Service Status:', status);
          console.log('Permission:', status.permission ? '✅ Granted' : '❌ Denied');
          console.log('Is Native:', status.isNative);
          console.log('Platform:', status.platform);
          console.log('Scheduled Count:', status.scheduledCount);
          
          if (status.scheduled && status.scheduled.length > 0) {
            console.log('Scheduled Notifications:');
            status.scheduled.forEach((n: any) => {
              console.log(`  - ${n.type}: ${n.time} (${n.enabled ? 'enabled' : 'disabled'})`);
            });
          } else {
            console.log('⚠️ No scheduled notifications in service');
          }
        } catch (e) {
          console.error('❌ Error getting service status:', e);
          diagnostics.serviceStatusError = String(e);
        }
        
        // 4. Check user profile notification settings
        console.log('\n👤 4. USER PROFILE NOTIFICATION SETTINGS');
        console.log('----------------------------------------');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile, error } = await supabase
              .from('user_profiles')
              .select('notifications_enabled, morning_notifications, checkin_notifications, evening_notifications, notification_time_morning, notification_time_checkin, notification_time_evening')
              .eq('user_id', session.user.id)
              .single();
            
            if (error) {
              console.error('❌ Error fetching profile:', error);
              diagnostics.profileError = error.message;
            } else if (profile) {
              diagnostics.profile = profile;
              console.log('Profile Notification Settings:');
              console.log('  Notifications Enabled:', profile.notifications_enabled ? '✅ Yes' : '❌ No');
              console.log('  Morning:', profile.morning_notifications ? `✅ ${profile.notification_time_morning || 'N/A'}` : '❌ Disabled');
              console.log('  Check-in:', profile.checkin_notifications ? `✅ ${profile.notification_time_checkin || 'N/A'}` : '❌ Disabled');
              console.log('  Evening:', profile.evening_notifications ? `✅ ${profile.notification_time_evening || 'N/A'}` : '❌ Disabled');
            } else {
              console.log('⚠️ No profile found');
            }
          } else {
            console.log('⚠️ No user session found');
            diagnostics.noSession = true;
          }
        } catch (e) {
          console.error('❌ Error checking profile:', e);
          diagnostics.profileError = String(e);
        }
        
        // 5. Platform-specific checks
        if (Capacitor.getPlatform() === 'android') {
          console.log('\n🤖 5. ANDROID-SPECIFIC CHECKS');
          console.log('----------------------------------------');
          console.log('Platform: Android');
          console.log('Note: Check Android system settings for:');
          console.log('  - Battery optimization (should be disabled)');
          console.log('  - Do Not Disturb settings');
          console.log('  - App notification settings');
          console.log('  - Notification channel "Mind Brother" importance level');
        } else if (Capacitor.getPlatform() === 'ios') {
          console.log('\n🍎 6. IOS-SPECIFIC CHECKS');
          console.log('----------------------------------------');
          console.log('Platform: iOS');
          console.log('Note: Check iOS settings for:');
          console.log('  - Notification permissions');
          console.log('  - Do Not Disturb');
          console.log('  - Screen Time restrictions');
        }
        
        // 6. Summary and recommendations
        console.log('\n📊 DIAGNOSTIC SUMMARY');
        console.log('----------------------------------------');
        const hasPermission = diagnostics.permissions?.display === 'granted';
        const hasPending = (diagnostics.pending?.notifications?.length || 0) > 0;
        const hasScheduled = (diagnostics.serviceStatus?.scheduledCount || 0) > 0;
        const profileEnabled = diagnostics.profile?.notifications_enabled === true;
        
        console.log('✅ Permission Granted:', hasPermission ? 'YES' : 'NO');
        console.log('✅ Pending Notifications:', hasPending ? `YES (${diagnostics.pending.notifications.length})` : 'NO');
        console.log('✅ Scheduled in Service:', hasScheduled ? `YES (${diagnostics.serviceStatus.scheduledCount})` : 'NO');
        console.log('✅ Profile Enabled:', profileEnabled ? 'YES' : 'NO');
        
        if (!hasPermission) {
          console.log('\n⚠️ RECOMMENDATION: Request notification permission first');
        }
        if (hasScheduled && !hasPending) {
          console.log('\n⚠️ RECOMMENDATION: Notifications are configured but not scheduled. Try re-enabling notifications.');
        }
        if (profileEnabled && !hasScheduled) {
          console.log('\n⚠️ RECOMMENDATION: Profile shows enabled but service has no scheduled notifications. Service may need to reload settings.');
        }
        
        console.log('\n🔍 ========================================');
        console.log('🔍 END DIAGNOSTIC REPORT');
        console.log('🔍 ========================================\n');
        
        // Return diagnostics object for programmatic access
        return diagnostics;
      } catch (error) {
        console.error('❌ Fatal error in diagnostic function:', error);
        return {
          error: String(error),
          timestamp: new Date().toISOString()
        };
      }
    };
    
    // Cleanup
    return () => {
      delete (window as any).testNavigateToCheckIn;
      delete (window as any).diagnoseNotifications;
    };
  }, []);
  
  // Listen for app state changes (when app becomes active from notification)
  useEffect(() => {
    let appStateListener: { remove: () => void } | null = null;
    let appUrlListener: { remove: () => void } | null = null;
    
    if (Capacitor.isNativePlatform() && CapacitorApp && typeof CapacitorApp.addListener === 'function') {
      try {
        appStateListener = CapacitorApp.addListener('appStateChange', async (state: { isActive: boolean }) => {
          console.log('📱 App state changed:', state.isActive);
          if (state.isActive && !loading) {
            // Check if there's a pending navigation from a notification tap
            try {
              // Check localStorage first (for Android/web)
              const pendingNav = localStorage.getItem('pendingNavigation');
              
              // For iOS, the AppDelegate stores in UserDefaults
              // The JavaScript notification handler should also fire and set localStorage
              // If not, we check here as a fallback
              
              if (pendingNav === 'checkin') {
                console.log('📱 ✅ Found pending navigation to check-in, navigating now...');
                localStorage.removeItem('pendingNavigation');
                // Use setTimeout to ensure we're not updating during render
                setTimeout(() => {
                  console.log('📱 Executing navigation to check-in...');
                  setCurrentView('checkin');
                }, 500);
                return;
              }
              
              // Check for unread notifications when app becomes active
              console.log('📬 Checking for unread notifications on app resume...');
              const { notificationService } = await import('./lib/notificationService');
              const unreadCount = await notificationService.checkAndDisplayUnreadNotifications();
              if (unreadCount > 0) {
                console.log(`📬 Found and displayed ${unreadCount} unread notifications`);
              }
            } catch (e) {
              console.log('Could not check navigation storage or notifications:', e);
            }
          }
        });
      } catch (e) {
        console.warn('⚠️ Could not set up appStateChange listener:', e);
      }
      
      // Also check immediately when listener is set up (but only after loading is complete)
      // Use a delayed check to avoid React error #321
      setTimeout(() => {
        if (!loading) {
          try {
            const pendingNav = localStorage.getItem('pendingNavigation');
            
            // For iOS, the JavaScript notification handler should set localStorage
            // If it doesn't, the AppDelegate has already stored in UserDefaults
            // We'll check on app state change as a fallback
            
            if (pendingNav === 'checkin') {
              console.log('📱 ✅ Found pending navigation on listener setup, navigating...');
              localStorage.removeItem('pendingNavigation');
              setTimeout(() => {
                setCurrentView('checkin');
              }, 500);
            }
          } catch (e) {
            console.log('Could not check navigation storage on setup:', e);
          }
        }
      }, 1000);
      
      // Listen for app URL open (if notification opens app with URL)
      try {
        if (CapacitorApp && typeof CapacitorApp.addListener === 'function') {
          appUrlListener = CapacitorApp.addListener('appUrlOpen', (data: { url: string }) => {
            console.log('📱 App opened from URL:', data.url);
            if (data.url.includes('checkin') || data.url.includes('check-in')) {
              console.log('📱 ✅ Navigating to check-in from URL');
              setCurrentView('checkin');
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ Could not set up appUrlOpen listener:', e);
      }
    } else {
      console.log('📱 App listeners not available (not native platform or App not loaded)');
    }
    
    return () => {
      if (appStateListener) {
        appStateListener.remove();
      }
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, [loading]);

  const checkAuth = async () => {
    try {
      console.log('🔍 Starting auth check...');
      // Note: Pending navigation check is handled in useEffect to avoid React error #321
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.id);
      
      // Defer state update to avoid React error #321
      // Use setTimeout to ensure it's after render completes
      setTimeout(() => {
        setUser(session?.user ?? null);
      }, 0);

      if (session?.user) {
        // Log auth user metadata to see if name is stored there
        console.log('Auth user metadata:', session.user.user_metadata);
        console.log('Auth user raw_user_meta_data:', session.user.user_metadata);
        
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
        } else if (profileData) {
          console.log('=== PROFILE DEBUG INFO ===');
          console.log('Profile loaded:', profileData);
          console.log('Profile first_name:', profileData.first_name);
          console.log('Profile last_name:', profileData.last_name);
          console.log('Profile username:', profileData.username);
          console.log('All profile keys:', Object.keys(profileData));
          console.log('Full profile JSON:', JSON.stringify(profileData, null, 2));
          console.log('Auth user metadata:', session?.user?.user_metadata);
          console.log('Auth user raw_user_meta_data:', session?.user?.user_metadata);
          
          // Check if first_name is missing - try to get it from various sources
          let finalProfileData = profileData;
          
          if (!profileData.first_name || (typeof profileData.first_name === 'string' && profileData.first_name.trim() === '')) {
            console.log('⚠️ first_name is missing or empty, attempting to find it...');
            
            // Try auth metadata first
            const metadata = session?.user?.user_metadata;
            let firstNameToUse = null;
            let lastNameToUse = null;
            
            if (metadata) {
              console.log('Checking auth metadata for name...', metadata);
              firstNameToUse = metadata.first_name || 
                              metadata.firstName ||
                              (metadata.full_name ? metadata.full_name.split(' ')[0] : null) ||
                              (metadata.name ? metadata.name.split(' ')[0] : null);
              
              lastNameToUse = metadata.last_name || 
                             metadata.lastName ||
                             (metadata.full_name ? metadata.full_name.split(' ').slice(1).join(' ') : null) ||
                             (metadata.name ? metadata.name.split(' ').slice(1).join(' ') : null);
            }
            
            // If we found a name, update the profile
            if (firstNameToUse) {
              console.log('✅ Found name in metadata, updating profile:', { firstNameToUse, lastNameToUse });
              console.log('🔧 Attempting to update user_profiles with:', {
                user_id: session.user.id,
                first_name: firstNameToUse,
                last_name: lastNameToUse
              });
              
              const updatePayload = { 
                first_name: firstNameToUse,
                last_name: lastNameToUse || null
              };
              
              console.log('🔧 Update payload:', updatePayload);
              
              const { error: updateError, data: updatedData } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('user_id', session.user.id)
                .select()
                .single();
              
              if (updateError) {
                console.error('❌ Error updating profile:', updateError);
                console.error('❌ Error code:', updateError.code);
                console.error('❌ Error message:', updateError.message);
                console.error('❌ Error details:', updateError.details);
                console.error('❌ Error hint:', updateError.hint);
              } else {
                console.log('✅ Profile update response:', updatedData);
                console.log('✅ Updated first_name:', updatedData?.first_name);
                console.log('✅ Updated first_name type:', typeof updatedData?.first_name);
                console.log('✅ Updated first_name value:', JSON.stringify(updatedData?.first_name));
                
                // If the update didn't actually save, try a direct approach
                if (!updatedData?.first_name || updatedData.first_name === null) {
                  console.warn('⚠️ Update returned null first_name, trying alternative approach...');
                  // Try updating via RPC or direct SQL if available
                  // For now, just use the metadata values directly
                  finalProfileData = {
                    ...profileData,
                    first_name: firstNameToUse,
                    last_name: lastNameToUse || null
                  };
                  console.log('✅ Using metadata values directly in profile:', finalProfileData);
                } else {
                  // Use the updated data
                  finalProfileData = updatedData;
                  console.log('✅ finalProfileData.first_name after update:', finalProfileData.first_name);
                }
                console.log('✅ getDisplayName test with updated data:', getDisplayName(finalProfileData));
              }
            } else {
              console.log('⚠️ Could not find name in metadata. Profile needs manual update.');
              console.log('💡 To fix: Run this SQL in Supabase:');
              console.log(`UPDATE user_profiles SET first_name = 'Dennis', last_name = 'Roberson' WHERE user_id = '${session.user.id}';`);
            }
          }
          
          console.log('Final profile data first_name:', finalProfileData.first_name);
          console.log('Final display name will be:', getDisplayName(finalProfileData));
          console.log('=== END PROFILE DEBUG ===');
          
          // ✅ Initialize notification service if notifications are enabled
          if (finalProfileData.notifications_enabled) {
            console.log('🔔 Notifications enabled in profile, initializing service...');
            try {
              const { notificationService } = await import('./lib/notificationService');
              await notificationService.loadUserNotificationSettings();
              console.log('✅ Notification service initialized successfully');
              
              // Check for unread notifications (mentions, replies, etc.)
              console.log('📬 Checking for unread notifications...');
              const unreadCount = await notificationService.checkAndDisplayUnreadNotifications();
              if (unreadCount > 0) {
                console.log(`📬 Displayed ${unreadCount} unread notifications`);
              }
            } catch (error) {
              console.error('❌ Error initializing notification service:', error);
            }
          } else {
            console.log('🔕 Notifications disabled in profile, skipping service initialization');
          }
          
          // ✅ Initialize push notification service for real-time push notifications
          try {
            console.log('🔥 Initializing push notification service...');
            const { pushNotificationService } = await import('./lib/pushNotificationService');
            await pushNotificationService.initialize(session.user.id);
            
            // Register navigation callback for deep linking from notifications
            pushNotificationService.setNavigationCallback((view, data) => {
              console.log('🧭 Push notification navigation:', view, data);
              if (view === 'discussions') {
                if (data?.topicId) {
                  setDeepLinkTopicId(data.topicId);
                }
                if (data?.replyId) {
                  setDeepLinkReplyId(data.replyId);
                }
              }
              setCurrentView(view as ViewType);
            });
            
            console.log('✅ Push notification service initialized');
          } catch (error) {
            console.error('❌ Error initializing push notification service:', error);
          }
          
          // Defer state update to avoid React error #321
          setTimeout(() => {
            setProfile(finalProfileData);
          }, 0);
          
          // ✅ Navigate to home (original landing page) on initial load or if coming from auth
          // Use setTimeout to avoid React error #321 (updating during render)
          // Use longer delay to ensure render is complete
          if (isInitialMount.current || currentView === 'auth') {
            setTimeout(() => {
              setCurrentView('home');
            }, 100);
          }
        }
      } else {
        // Defer state update to avoid React error #321
        requestAnimationFrame(() => {
          setProfile(null);
          
          // ✅ Only navigate to home if user was logged out (not initial load)
          if (!isInitialMount.current && currentView === 'dashboard') {
            setCurrentView('home');
          }
        });
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      // Ensure app renders even on error
      console.log('✅ Auth check failed, but app will still render');
    } finally {
      setLoading(false);
      isInitialMount.current = false;
      console.log('✅ Auth check completed, loading set to false');
    }
  };

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleLogout = async () => {
    try {
      // Clear push token before logout
      if (user?.id) {
        try {
          const { pushNotificationService } = await import('./lib/pushNotificationService');
          await pushNotificationService.clearToken(user.id);
        } catch (e) {
          console.log('Could not clear push token:', e);
        }
      }
      
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setCurrentView('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle user sign in
  const handleUserSignIn = async (data: SignInData) => {
    try {
      console.log('🔐 Attempting sign in for:', data.email);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('📧 Auth response:', { 
        user: authData?.user?.id, 
        session: authData?.session ? 'exists' : 'none',
        error: error?.message 
      });

      if (error) {
        console.error('❌ Auth error:', error);
        throw error;
      }
      
      if (authData.user) {
        console.log('✅ User authenticated:', authData.user.email);
        console.log('📧 Email confirmed:', authData.user.email_confirmed_at);
        
        // Fetch the profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        console.log('👤 Profile fetch:', { 
          profileData, 
          profileError: profileError?.message 
        });
        
        if (profileData) {
          console.log('👤 Profile details:', {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            username: profileData.username,
            first_name_type: typeof profileData.first_name,
            first_name_value: JSON.stringify(profileData.first_name),
            all_keys: Object.keys(profileData)
          });
          console.log('👤 Display name will be:', getDisplayName(profileData));
        }

        if (!profileData) {
          console.warn('⚠️ No profile found, creating one...');
          // Create profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              email: authData.user.email,
              first_name: authData.user.user_metadata?.first_name || '',
              last_name: authData.user.user_metadata?.last_name || '',
              user_type: 'user',
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Profile creation error:', createError);
          } else {
            console.log('✅ Profile created:', newProfile);
          }

          setUser(authData.user);
          setProfile(newProfile);
          setCurrentView('home');
          
          // Show welcome back message
          setIsNewUser(false);
          setShowWelcome(true);
        } else {
          setUser(authData.user);
          setProfile(profileData);
          setCurrentView('home');
          
          // Show welcome back message
          setIsNewUser(false);
          setShowWelcome(true);
          
          console.log('🎉 Sign in successful!');
        }
      }
    } catch (err: any) {
      console.error('❌ Sign in error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Sign in failed: ';
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage += 'Incorrect email or password. Please check your credentials and try again.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage += 'Please confirm your email address before signing in. Check your inbox for the confirmation link.';
      } else if (err.message?.includes('Email rate limit exceeded')) {
        errorMessage += 'Too many attempts. Please wait a few minutes and try again.';
      } else {
        errorMessage += err.message || 'Unknown error. Please try again.';
      }
      
      alert(errorMessage);
      throw err;
    }
  };

  // Handle user sign up
  const handleUserSignUp = async (data: UserSignupData) => {
    try {
      console.log('Starting signup process...');
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: 'user'
          }
        }
      });

      console.log('Auth signup response:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      if (authData.user) {
        console.log('User created, waiting for profile trigger...');
        
        // Wait longer for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        console.log('Profile check:', { existingProfile, checkError });

        // If profile doesn't exist, create it manually
        if (!existingProfile) {
          console.log('Profile not found, creating manually...');
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              email: data.email,
              first_name: data.firstName,
              last_name: data.lastName,
              username: data.username || `user_${authData.user.id.slice(0, 8)}`,
              user_type: 'user',
              age_range: data.ageRange,
              phone_number: data.phoneNumber,
            })
            .select()
            .single();

          console.log('Manual profile creation:', { newProfile, insertError });

          if (insertError) {
            console.error('Profile creation error:', insertError);
            throw new Error(`Database error: ${insertError.message}`);
          }

          setUser(authData.user);
          setProfile(newProfile);
          setCurrentView('home');
          
          // Show welcome message for new user
          setIsNewUser(true);
          setShowWelcome(true);
        } else {
          // Profile exists, update it with additional info
          console.log('Profile exists, updating...');
          const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update({
              username: data.username || existingProfile.username,
              age_range: data.ageRange,
              phone_number: data.phoneNumber,
            })
            .eq('user_id', authData.user.id)
            .select()
            .single();

          console.log('Profile update:', { updatedProfile, updateError });

          if (updateError) {
            console.error('Profile update error:', updateError);
          }

          setUser(authData.user);
          setProfile(updatedProfile || existingProfile);
          setCurrentView('home');
          
          // Show welcome message for new user
          setIsNewUser(true);
          setShowWelcome(true);
        }

        console.log('Signup completed successfully!');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      alert(`Signup failed: ${err.message || 'Unknown error'}`);
      throw err;
    }
  };

  // Handle professional sign up
  const handleProfessionalSignUp = async (data: ProfessionalSignupData) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: 'professional'
          }
        }
      });

      if (authError) throw authError;
      
      if (authData.user) {
        // Profile will be auto-created by trigger, update with professional info
        // Note: You'll need to add these columns to user_profiles table if they don't exist
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            phone_number: data.phoneNumber,
            // Add professional fields only if they exist in your schema
            // For now, just using basic fields
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.error('Professional profile update error:', profileError);
        }

        // TODO: Store professional data (license info, credentials, etc.) 
        // in a separate 'professional_profiles' table or add columns to user_profiles
        // For now, just log the data
        console.log('Professional data to store:', {
          userId: authData.user.id,
          professionalTitle: data.professionalTitle,
          primaryCredential: data.primaryCredential,
          licenseInfo: {
            type: data.licenseType,
            number: data.licenseNumber,
            state: data.licenseState,
            expiration: data.licenseExpirationDate,
          },
          practiceType: data.practiceType,
          yearsInPractice: data.yearsInPractice,
          specializations: data.specializations,
          ageGroupsServed: data.ageGroupsServed,
          bio: data.bio,
        });

        // Show success message about pending approval
        alert('Application submitted! Your professional account will be reviewed within 1-3 business days. You\'ll receive an email notification once approved.');
        
        setUser(authData.user);
        setCurrentView('home');
      }
    } catch (err: any) {
      console.error('Professional signup error:', err);
      alert(`Signup failed: ${err.message || 'Unknown error'}`);
      throw err;
    }
  };

  const renderBackButton = () => (
    <div className="p-4 safe-area-top bg-gray-50 sticky top-0 z-50" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)' }}>
      <button
        onClick={() => setCurrentView('home')}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <span>←</span> MB Home
      </button>
    </div>
  );

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-2xl">✊</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Mind Brother...</p>
        </div>
      </div>
    );
  }

  // ⭐ CULTURAL ONBOARDING: Show onboarding for authenticated users who haven't completed it
  if (user && checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-2xl">✊</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your experience...</p>
        </div>
      </div>
    );
  }

  // ⭐ CULTURAL ONBOARDING: Show onboarding flow if user needs to complete it
  if (user && showCulturalOnboarding) {
    return (
      <CulturalOnboarding
        userId={user.id}
        onComplete={() => {
          console.log('✅ Cultural onboarding completed');
          setShowCulturalOnboarding(false);
        }}
      />
    );
  }

  // Dashboard view (authenticated)
  if (user && currentView === 'dashboard') {
    return <Dashboard onLogout={handleLogout} />;
  }

  // Landing page (home)
  if (currentView === 'home') {
    try {
      return (
        <>
          <LandingPage onNavigate={handleNavigate} user={user} profile={profile} onLogout={handleLogout} />
          {showWelcome && profile && (
            <WelcomeToast 
              name={getDisplayName(profile)}
              isNewUser={isNewUser}
              onClose={() => setShowWelcome(false)}
            />
          )}
        </>
      );
    } catch (error) {
      console.error('❌ Error rendering LandingPage:', error);
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">There was an error loading the app. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
  }

  // Authentication flow
  if (currentView === 'auth') {
    return (
      <AuthFlow
        onUserSignIn={handleUserSignIn}
        onUserSignUp={handleUserSignUp}
        onProfessionalSignUp={handleProfessionalSignUp}
        onBack={() => setCurrentView('home')}
      />
    );
  }

  // Chatbot
  if (currentView === 'chatbot') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <ChatbotWeb user={user} profile={profile} />
      </div>
    );
  }

  // Guided Breathing - Component handles its own back navigation
  if (currentView === 'breathing') {
    return (
      <GuidedBreathing onBack={() => handleNavigate('home')} />
    );
  }

  // Fitness Workout - Component handles its own back navigation
  if (currentView === 'workout') {
    return (
      <FitnessWorkout onBack={() => handleNavigate('home')} />
    );
  }

  // Journal
  if (currentView === 'journal') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Journal />
      </div>
    );
  }

  // Resources
  if (currentView === 'resources') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Resources />
      </div>
    );
  }

  // Feeling Check-in
  if (currentView === 'checkin') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <FeelingCheckIn 
          onNavigateToChat={() => setCurrentView('chatbot')}
          onNavigateToJournal={() => setCurrentView('journal')}
        />
      </div>
    );
  }

  // Daily Motivation
  if (currentView === 'motivation') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <DailyMotivation />
      </div>
    );
  }

  // Exercise
  if (currentView === 'exercise') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Exercise />
      </div>
    );
  }

  // Discussions
  if (currentView === 'discussions') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <Discussions 
          initialTopicId={deepLinkTopicId}
          initialReplyId={deepLinkReplyId}
          onTopicViewed={() => {
            setDeepLinkTopicId(null);
            setDeepLinkReplyId(null);
          }}
        />
      </div>
    );
  }

  // Notification Settings
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <NotificationSettings userId={user?.id || ''} onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Account Settings (Password/Username)
  if (currentView === 'account-settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <AccountSettings 
          user={user} 
          profile={profile} 
          onClose={() => setCurrentView('home')}
          onProfileUpdate={async () => {
            // Refresh profile after update
            if (user) {
              const { data } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
              if (data) setProfile(data);
            }
          }}
        />
      </div>
    );
  }

  // Cultural Preferences Settings
  if (currentView === 'cultural-settings') {
    return (
      <div className="min-h-screen">
        {renderBackButton()}
        <CulturalPreferencesSettings 
          userId={user?.id || ''} 
          onClose={() => setCurrentView('home')}
        />
      </div>
    );
  }

  // Cultural Content Admin (Admin Only)
  if (currentView === 'cultural-admin') {
    return (
      <div className="min-h-screen">
        {renderBackButton()}
        <CulturalContentAdmin 
          onClose={() => setCurrentView('home')}
        />
      </div>
    );
  }

  // Cultural Analytics Dashboard (Admin Only)
  if (currentView === 'cultural-analytics') {
    return (
      <div className="min-h-screen">
        {renderBackButton()}
        <CulturalAnalyticsDashboard 
          onClose={() => setCurrentView('home')}
        />
      </div>
    );
  }

  // Peer Support
  if (currentView === 'peer-support') {
    return (
      <div className="min-h-screen">
        {renderBackButton()}
        <PeerSupport 
          userId={user?.id || ''}
          onClose={() => setCurrentView('home')}
        />
      </div>
    );
  }

  // User Insights Dashboard
  if (currentView === 'insights') {
    return (
      <UserInsightsDashboard 
        onBack={() => setCurrentView('home')}
      />
    );
  }

  // Analytics Dashboard
  if (currentView === 'analytics') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <AnalyticsDashboard />
      </div>
    );
  }

  // Terms of Service
  if (currentView === 'terms') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <TermsOfService onClose={() => setCurrentView('home')} showFullTerms={true} />
      </div>
    );
  }

  // Privacy Policy
  if (currentView === 'privacy') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <PrivacyNotice showFullNotice={true} onAccept={() => setCurrentView('home')} />
      </div>
    );
  }

  // Crisis Disclaimer
  if (currentView === 'crisis') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <CrisisDisclaimer onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Beta Tester Agreement
  if (currentView === 'beta') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <BetaTesterAgreement onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Professional Agreement
  if (currentView === 'professional') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <ProfessionalAgreement onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Community Guidelines
  if (currentView === 'guidelines') {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderBackButton()}
        <CommunityGuidelines onClose={() => setCurrentView('home')} />
      </div>
    );
  }

  // Moderator Dashboard - Removed from mobile app (web-only for admins)

  // Default fallback
  return <LandingPage onNavigate={handleNavigate} />;
}

export default App;