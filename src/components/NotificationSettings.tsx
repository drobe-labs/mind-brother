import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { LocalNotifications } from '@capacitor/local-notifications';

interface NotificationSettingsProps {
  userId: string;
  onClose: () => void;
}

interface NotificationPreferences {
  notifications_enabled: boolean;
  morning_notifications: boolean;
  checkin_notifications: boolean;
  evening_notifications: boolean;
  discussion_notifications: boolean;
  mention_notifications: boolean;
  notification_time_morning: string;
  notification_time_checkin: string;
  notification_time_evening: string;
}

export default function NotificationSettings({ userId, onClose }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifications_enabled: false,
    morning_notifications: true,
    checkin_notifications: true,
    evening_notifications: true,
    discussion_notifications: true,
    mention_notifications: true,
    notification_time_morning: '08:00',
    notification_time_checkin: '13:00',
    notification_time_evening: '20:00',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<any>(null);
  const [testingNotification, setTestingNotification] = useState<string | null>(null);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<string | null>(null);
  const [showDiagnosticResults, setShowDiagnosticResults] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkNotificationStatus();
  }, [userId]);

  const checkNotificationStatus = async () => {
    const status = await notificationService.getNotificationStatus();
    setNotificationStatus(status);
    console.log('📱 Notification status:', status);
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences({
          notifications_enabled: data.notifications_enabled || false,
          morning_notifications: data.morning_notifications || false,
          checkin_notifications: data.checkin_notifications || false,
          evening_notifications: data.evening_notifications || false,
          discussion_notifications: data.discussion_notifications || false,
          mention_notifications: data.mention_notifications || false,
          notification_time_morning: data.notification_time_morning || '08:00',
          notification_time_checkin: data.notification_time_checkin || '13:00',
          notification_time_evening: data.notification_time_evening || '20:00',
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('📱 Requesting notification permission...');
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        await notificationService.enableNotifications(userId);
        checkNotificationStatus();
        alert('✅ Notification permission granted! You can now enable notifications.');
      } else {
        alert('❌ Notification permission denied. Please enable notifications in your device settings.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      alert('Failed to request notification permission.');
    }
  };

  // ✅ NEW: Simple notification test
  const testSimpleNotification = async () => {
    try {
      console.log('🧪 Testing SIMPLE notification...');
      
      // Request permissions first
      const perm = await LocalNotifications.requestPermissions();
      console.log('Permission:', perm);
      
      if (perm.display !== 'granted') {
        alert('❌ Notification permission not granted!');
        return;
      }
      
      // Schedule a VERY simple notification
      const result = await LocalNotifications.schedule({
        notifications: [
          {
            id: 999,
            title: "Test Title",
            body: "Test Body Message - This is the content!",
            schedule: {
              at: new Date(Date.now() + 2000) // 2 seconds from now
            }
          }
        ]
      });
      
      console.log('✅ Scheduled:', result);
      alert('✅ Notification scheduled! Lock your phone NOW and wait 2 seconds.');
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert(`❌ Error: ${error}`);
    }
  };

  const updatePreference = (field: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Saving preferences:', preferences);
      console.log('💾 User ID:', userId);
      console.log('💾 Preferences object:', JSON.stringify(preferences, null, 2));
      
      // Validate that we have a userId
      if (!userId) {
        throw new Error('User ID is missing. Please log out and log back in.');
      }
      
      // Validate preferences object
      if (!preferences || typeof preferences !== 'object') {
        throw new Error('Invalid preferences data');
      }
      
      // Try to save all preferences first
      const { data, error } = await supabase
        .from('user_profiles')
        .update(preferences)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        
        // If error is about missing evening_notifications column, save without it
        if (error.code === 'PGRST204' && error.message?.includes('evening_notifications')) {
          console.log('⚠️ evening_notifications column missing, saving without evening fields...');
          
          const { evening_notifications, notification_time_evening, ...preferencesWithoutEvening } = preferences;
          
          const { data: retryData, error: retryError } = await supabase
            .from('user_profiles')
            .update(preferencesWithoutEvening)
            .eq('user_id', userId)
            .select()
            .single();
          
          if (retryError) {
            console.error('❌ Retry also failed:', retryError);
            throw retryError;
          }
          
          console.log('✅ Saved successfully without evening_notifications column');
          
          // Update notification service (set evening to false since column doesn't exist)
          try {
            await notificationService.updateNotificationSettings({
              enabled: preferences.notifications_enabled,
              morningEnabled: preferences.morning_notifications,
              checkinEnabled: preferences.checkin_notifications,
              eveningEnabled: false, // Column doesn't exist, so disable
              morningTime: preferences.notification_time_morning,
              checkinTime: preferences.notification_time_checkin,
              eveningTime: '20:00'
            });
          } catch (serviceError: any) {
            console.error('❌ Error updating notification service:', serviceError);
          }
          
          await checkNotificationStatus();
          alert('✅ Settings saved! (Note: Evening notifications column is missing in database. Morning and check-in notifications are enabled.)');
          onClose();
          return;
        }
        
        throw error;
      }

      console.log('✅ Database updated successfully:', data);
      console.log('📋 notifications_enabled:', data?.notifications_enabled);

      // Update notification service with new settings
      try {
        await notificationService.updateNotificationSettings({
          enabled: preferences.notifications_enabled,
          morningEnabled: preferences.morning_notifications,
          checkinEnabled: preferences.checkin_notifications,
          eveningEnabled: preferences.evening_notifications,
          morningTime: preferences.notification_time_morning,
          checkinTime: preferences.notification_time_checkin,
          eveningTime: preferences.notification_time_evening
        });
      } catch (serviceError: any) {
        console.error('❌ Error updating notification service:', serviceError);
        // Don't throw - database save succeeded, service update can fail separately
      }

      // Wait a moment for settings to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify the save worked by reading back from database
      const { data: verifyData, error: verifyError } = await supabase
        .from('user_profiles')
        .select('notifications_enabled, morning_notifications, checkin_notifications, evening_notifications')
        .eq('user_id', userId)
        .single();

      if (verifyError) {
        console.error('❌ Verification error:', verifyError);
      } else {
        console.log('✅ Verification - Saved values:', verifyData);
        if (verifyData?.notifications_enabled !== preferences.notifications_enabled) {
          console.error('❌ MISMATCH! Database value does not match what we tried to save!');
          alert('⚠️ Warning: Settings may not have saved correctly. Please check and try again.');
        }
      }

      // Refresh notification status to show updated state
      await checkNotificationStatus();
      
      alert('✅ Notification settings saved! Notifications will be scheduled automatically.');
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving notification preferences:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error keys:', error ? Object.keys(error) : 'no keys');
      console.error('❌ Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Extract error message properly - try multiple ways
      let errorMessage = 'Failed to save preferences.\n\n';
      let foundMessage = false;
      
      // Try different ways to extract the error message
      if (error?.message) {
        errorMessage += `Error: ${error.message}\n`;
        foundMessage = true;
      } else if (error?.error?.message) {
        errorMessage += `Error: ${error.error.message}\n`;
        foundMessage = true;
      } else if (typeof error === 'string') {
        errorMessage += `Error: ${error}\n`;
        foundMessage = true;
      } else if (error?.toString && error.toString() !== '[object Object]') {
        errorMessage += `Error: ${error.toString()}\n`;
        foundMessage = true;
      }
      
      // If we still don't have a message, try to stringify the whole thing
      if (!foundMessage) {
        try {
          const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
          if (errorStr && errorStr !== '{}' && errorStr !== 'null') {
            errorMessage += `Error Details:\n${errorStr}\n`;
          } else {
            errorMessage += `Error: Unknown error occurred\n`;
          }
        } catch (e) {
          errorMessage += `Error: Could not parse error object\n`;
        }
      }
      
      // Add error code if available
      if (error?.code) {
        errorMessage += `\nCode: ${error.code}`;
      }
      if (error?.error?.code) {
        errorMessage += `\nCode: ${error.error.code}`;
      }
      
      // Add details if available
      if (error?.details) {
        errorMessage += `\nDetails: ${error.details}`;
      }
      if (error?.hint) {
        errorMessage += `\nHint: ${error.hint}`;
      }
      
      // Check for common Supabase errors
      const errorText = errorMessage.toLowerCase();
      if (error?.code === 'PGRST116' || errorText.includes('permission denied') || errorText.includes('row-level security') || errorText.includes('rls')) {
        errorMessage += '\n\n⚠️ This is likely a database permissions (RLS) issue.';
      }
      if (errorText.includes('column') && errorText.includes('does not exist')) {
        errorMessage += '\n\n⚠️ A database column might be missing.';
      }
      if (errorText.includes('null value') || errorText.includes('not-null constraint')) {
        errorMessage += '\n\n⚠️ A required field is missing.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const testNotification = async (type: 'morning' | 'checkin' | 'evening') => {
    setTestingNotification(type);
    try {
      console.log(`🧪 Testing ${type} notification...`);
      
      // Before sending test notification, check pending notifications
      const pending = await LocalNotifications.getPending();
      console.log('📋 PENDING BEFORE TEST:', pending?.notifications?.length || 0);
      alert(`Pending notifications: ${pending?.notifications?.length || 0}`);
      
      // Then your existing test notification code...
      const success = await notificationService.sendTestNotification(type);
      
      if (success) {
        alert(`✅ ${type} notification scheduled! It will appear in 1-2 seconds. If the app is open, it will show as a banner at the top.`);
      } else {
        alert(`❌ Failed to send notification. Make sure notifications are enabled.`);
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      alert('Failed to send test notification.');
    } finally {
      setTestingNotification(null);
    }
  };

  const runDiagnostic = async () => {
    setRunningDiagnostic(true);
    setDiagnosticResults(null);
    setShowDiagnosticResults(false);
    
    try {
      // Check if diagnostic function exists
      if (typeof (window as any).diagnoseNotifications === 'function') {
        const result = await (window as any).diagnoseNotifications();
        
        // Format results for display
        let resultsText = '🔍 NOTIFICATION DIAGNOSTIC RESULTS\n';
        resultsText += '=====================================\n\n';
        
        // Permission Status
        resultsText += '📱 PERMISSION STATUS:\n';
        resultsText += `   Status: ${result.permissions?.display || 'Unknown'}\n`;
        resultsText += `   Granted: ${result.permissions?.display === 'granted' ? '✅ YES' : '❌ NO'}\n\n`;
        
        // Pending Notifications
        resultsText += '📋 PENDING NOTIFICATIONS:\n';
        const pendingCount = result.pending?.notifications?.length || 0;
        resultsText += `   Count: ${pendingCount}\n`;
        if (pendingCount > 0) {
          result.pending.notifications.forEach((n: any, index: number) => {
            resultsText += `   ${index + 1}. ID: ${n.id}, Title: "${n.title}"\n`;
            resultsText += `      Schedule: ${JSON.stringify(n.schedule)}\n`;
          });
        } else {
          resultsText += '   ⚠️ NO PENDING NOTIFICATIONS\n';
        }
        resultsText += '\n';
        
        // Service Status
        resultsText += '⚙️ SERVICE STATUS:\n';
        resultsText += `   Platform: ${result.platform || 'Unknown'}\n`;
        resultsText += `   Is Native: ${result.isNative ? 'Yes' : 'No'}\n`;
        resultsText += `   Scheduled Count: ${result.serviceStatus?.scheduledCount || 0}\n`;
        if (result.serviceStatus?.scheduled && result.serviceStatus.scheduled.length > 0) {
          resultsText += '   Scheduled Notifications:\n';
          result.serviceStatus.scheduled.forEach((n: any) => {
            resultsText += `     - ${n.type}: ${n.time} (${n.enabled ? 'enabled' : 'disabled'})\n`;
          });
        }
        resultsText += '\n';
        
        // Profile Settings
        if (result.profile) {
          resultsText += '👤 PROFILE SETTINGS:\n';
          resultsText += `   Notifications Enabled: ${result.profile.notifications_enabled ? '✅ Yes' : '❌ No'}\n`;
          resultsText += `   Morning: ${result.profile.morning_notifications ? `✅ ${result.profile.notification_time_morning || 'N/A'}` : '❌ Disabled'}\n`;
          resultsText += `   Check-in: ${result.profile.checkin_notifications ? `✅ ${result.profile.notification_time_checkin || 'N/A'}` : '❌ Disabled'}\n`;
          resultsText += `   Evening: ${result.profile.evening_notifications ? `✅ ${result.profile.notification_time_evening || 'N/A'}` : '❌ Disabled'}\n\n`;
        }
        
        // Summary
        resultsText += '📊 SUMMARY:\n';
        const hasPermission = result.permissions?.display === 'granted';
        const hasPending = pendingCount > 0;
        const hasScheduled = (result.serviceStatus?.scheduledCount || 0) > 0;
        const profileEnabled = result.profile?.notifications_enabled === true;
        
        resultsText += `   ✅ Permission: ${hasPermission ? 'GRANTED' : 'NOT GRANTED'}\n`;
        resultsText += `   ✅ Pending: ${hasPending ? `YES (${pendingCount})` : 'NO'}\n`;
        resultsText += `   ✅ Scheduled: ${hasScheduled ? `YES (${result.serviceStatus.scheduledCount})` : 'NO'}\n`;
        resultsText += `   ✅ Profile Enabled: ${profileEnabled ? 'YES' : 'NO'}\n\n`;
        
        // Recommendations
        resultsText += '💡 RECOMMENDATIONS:\n';
        if (!hasPermission) {
          resultsText += '   ⚠️ Request notification permission first\n';
        }
        if (!profileEnabled) {
          resultsText += '   ⚠️ CRITICAL: Enable notifications in your profile!\n';
          resultsText += '   → Toggle "Notifications Enabled" ON in this screen\n';
          resultsText += '   → Enable at least one notification type (Morning/Check-in/Evening)\n';
          resultsText += '   → Click "Save Preferences" to apply changes\n';
        }
        if (profileEnabled && hasScheduled && !hasPending) {
          resultsText += '   ⚠️ Notifications configured but not scheduled. Try saving settings again.\n';
        }
        if (profileEnabled && !hasScheduled) {
          resultsText += '   ⚠️ Profile shows enabled but service has no scheduled notifications.\n';
          resultsText += '   → Try disabling and re-enabling notifications in settings\n';
        }
        if (hasPermission && profileEnabled && hasPending && hasScheduled) {
          resultsText += '   ✅ Everything looks good! Notifications should be working.\n';
        }
        if (hasPermission && !profileEnabled) {
          resultsText += '   ✅ Permission is granted - enable notifications in settings above!\n';
        }
        
        setDiagnosticResults(resultsText);
        setShowDiagnosticResults(true);
        console.log('📊 Diagnostic result object:', result);
      } else {
        setDiagnosticResults('❌ Diagnostic function not available. Make sure the app is fully loaded.');
        setShowDiagnosticResults(true);
        console.error('diagnoseNotifications function not found on window object');
      }
    } catch (error) {
      const errorMsg = `❌ Error running diagnostic: ${error instanceof Error ? error.message : String(error)}`;
      setDiagnosticResults(errorMsg);
      setShowDiagnosticResults(true);
      console.error('Error running diagnostic:', error);
    } finally {
      setRunningDiagnostic(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">Loading preferences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* ✅ NEW: Diagnostic Tool */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <h3 className="text-sm font-bold text-blue-800 mb-2">🔍 Notification Diagnostic Tool</h3>
              <p className="text-xs text-blue-700 mb-3">
                Run a comprehensive diagnostic to check permissions, pending notifications, service status, and get recommendations.
              </p>
              <button
                onClick={runDiagnostic}
                disabled={runningDiagnostic}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {runningDiagnostic ? '🔄 Running Diagnostic...' : '🔍 RUN DIAGNOSTIC'}
              </button>
              <p className="text-xs text-blue-600 mt-2 font-medium">
                Results will appear below when complete.
              </p>
              
              {/* Diagnostic Results Display */}
              {showDiagnosticResults && diagnosticResults && (
                <div className="mt-4 bg-white border border-blue-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-blue-900">Diagnostic Results:</h4>
                    <button
                      onClick={() => {
                        setShowDiagnosticResults(false);
                        setDiagnosticResults(null);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {diagnosticResults}
                  </pre>
                  <button
                    onClick={() => {
                      // Copy to clipboard if possible
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(diagnosticResults);
                        alert('✅ Results copied to clipboard!');
                      } else {
                        alert('Copy functionality not available on this device.');
                      }
                    }}
                    className="mt-2 w-full px-3 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    📋 Copy Results
                  </button>
                </div>
              )}
            </div>

            {/* ✅ NEW: Quick Status Check Button */}
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
              <h3 className="text-sm font-bold text-purple-800 mb-2">🔍 Quick Status Check</h3>
              <p className="text-xs text-purple-700 mb-3">
                Instantly check if notifications are scheduled and permission status.
              </p>
              <button
                onClick={async () => {
                  try {
                    // Check permissions
                    const perms = await LocalNotifications.checkPermissions();
                    console.log('📱 Permissions:', perms);
                    
                    // Check pending notifications
                    const pending = await LocalNotifications.getPending();
                    console.log('📋 Pending notifications:', pending);
                    
                    // Format result
                    let message = '📱 NOTIFICATION STATUS\n\n';
                    message += `Permission: ${perms.display === 'granted' ? '✅ GRANTED' : '❌ DENIED'}\n`;
                    message += `Pending Count: ${pending?.notifications?.length || 0}\n\n`;
                    
                    if (pending?.notifications && pending.notifications.length > 0) {
                      message += 'Scheduled Notifications:\n';
                      pending.notifications.forEach((n: any, i: number) => {
                        message += `${i + 1}. ${n.title}\n`;
                        message += `   Time: ${JSON.stringify(n.schedule)}\n`;
                      });
                    } else {
                      message += '⚠️ NO NOTIFICATIONS SCHEDULED!\n\n';
                      message += 'This means:\n';
                      message += '• Notifications are not being scheduled\n';
                      message += '• Check if "Notifications Enabled" is ON\n';
                      message += '• Try saving settings again\n';
                    }
                    
                    alert(message);
                  } catch (error) {
                    console.error('Error checking status:', error);
                    alert(`❌ Error: ${error}`);
                  }
                }}
                className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔍 CHECK STATUS NOW
              </button>
              <p className="text-xs text-purple-600 mt-2 font-medium">
                Shows permission status and how many notifications are scheduled.
              </p>
            </div>

            {/* ✅ NEW: Simple Test Button */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <h3 className="text-sm font-bold text-green-800 mb-2">🧪 Basic Notification Test</h3>
              <p className="text-xs text-green-700 mb-3">
                This tests if iOS can show notifications at all. Lock your phone immediately after tapping!
              </p>
              <button
                onClick={testSimpleNotification}
                className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                🧪 TEST SIMPLE NOTIFICATION
              </button>
              <p className="text-xs text-green-600 mt-2 font-medium">
                Expected: "Test Title" with "Test Body Message - This is the content!"
              </p>
            </div>

            {/* Permission Status */}
            {notificationStatus && (
              <div className={`rounded-lg p-4 ${notificationStatus.permission ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {notificationStatus.permission ? '✅ Notifications Enabled' : '⚠️ Notifications Disabled'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Platform: {notificationStatus.platform || 'Unknown'}
                    </p>
                  </div>
                  {!notificationStatus.permission && (
                    <button
                      onClick={requestNotificationPermission}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Master Toggle */}
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.notifications_enabled}
                  onChange={(e) => updatePreference('notifications_enabled', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enable all notifications
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-7">
                Master switch for all notification types
              </p>
            </div>

            {preferences.notifications_enabled && notificationStatus?.permission && (
              <div className="space-y-4">
                {/* Morning Notifications */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.morning_notifications}
                      onChange={(e) => updatePreference('morning_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Morning motivation 💪
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7 mb-2">
                    Daily motivational quotes and affirmations to start your day
                  </p>
                  {preferences.morning_notifications && (
                    <>
                      <div className="ml-7 mt-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time:</label>
                        <input
                          type="time"
                          value={preferences.notification_time_morning}
                          onChange={(e) => updatePreference('notification_time_morning', e.target.value)}
                          className="p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="ml-7">
                        <button
                          onClick={() => testNotification('morning')}
                          disabled={testingNotification === 'morning'}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {testingNotification === 'morning' ? 'Sending...' : '🧪 Test Morning Notification'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Check-in Notifications */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.checkin_notifications}
                      onChange={(e) => updatePreference('checkin_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Daily check-in 🤝
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7 mb-2">
                    "Just checking in. How are you brother?"
                  </p>
                  {preferences.checkin_notifications && (
                    <>
                      <div className="ml-7 mt-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time:</label>
                        <input
                          type="time"
                          value={preferences.notification_time_checkin}
                          onChange={(e) => updatePreference('notification_time_checkin', e.target.value)}
                          className="p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="ml-7">
                        <button
                          onClick={() => testNotification('checkin')}
                          disabled={testingNotification === 'checkin'}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {testingNotification === 'checkin' ? 'Sending...' : '🧪 Test Check-in Notification'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Evening Notifications */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.evening_notifications}
                      onChange={(e) => updatePreference('evening_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Evening encouragement 🌙
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7 mb-2">
                    Words of encouragement to end your day on a positive note
                  </p>
                  {preferences.evening_notifications && (
                    <>
                      <div className="ml-7 mt-2 mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time:</label>
                        <input
                          type="time"
                          value={preferences.notification_time_evening}
                          onChange={(e) => updatePreference('notification_time_evening', e.target.value)}
                          className="p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="ml-7">
                        <button
                          onClick={() => testNotification('evening')}
                          disabled={testingNotification === 'evening'}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {testingNotification === 'evening' ? 'Sending...' : '🧪 Test Evening Notification'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Discussion Notifications */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.discussion_notifications}
                      onChange={(e) => updatePreference('discussion_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Discussion replies 💬
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7">
                    Get notified when someone replies to your discussion topics
                  </p>
                </div>

                {/* Mention Notifications */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.mention_notifications}
                      onChange={(e) => updatePreference('mention_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mentions 👤
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7">
                    Get notified when someone mentions you in discussions
                  </p>
                </div>
              </div>
            )}

            {/* Info Box if notifications disabled */}
            {preferences.notifications_enabled && !notificationStatus?.permission && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Please enable notification permissions to receive notifications. Tap the "Enable" button above.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}