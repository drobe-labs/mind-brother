import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    loadPreferences();
  }, [userId]);

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

  const updatePreference = (field: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(preferences)
        .eq('user_id', userId);

      if (error) throw error;

      onClose();
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
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

            {preferences.notifications_enabled && (
              <div className="space-y-4">
                {/* Morning Notifications */}
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.morning_notifications}
                      onChange={(e) => updatePreference('morning_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Morning motivation (8:00 AM)
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7">
                    Daily motivational quotes and encouragement
                  </p>
                  {preferences.morning_notifications && (
                    <div className="ml-7 mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time:</label>
                      <input
                        type="time"
                        value={preferences.notification_time_morning}
                        onChange={(e) => updatePreference('notification_time_morning', e.target.value)}
                        className="p-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Check-in Notifications */}
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.checkin_notifications}
                      onChange={(e) => updatePreference('checkin_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Daily check-in (1:00 PM)
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7">
                    "Just checking in. How are you brother?" with quick response options
                  </p>
                  {preferences.checkin_notifications && (
                    <div className="ml-7 mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time:</label>
                      <input
                        type="time"
                        value={preferences.notification_time_checkin}
                        onChange={(e) => updatePreference('notification_time_checkin', e.target.value)}
                        className="p-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Evening Notifications */}
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.evening_notifications}
                      onChange={(e) => updatePreference('evening_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Evening encouragement (8:00 PM)
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7">
                    Words of encouragement and motivation to end your day on a positive note
                  </p>
                  {preferences.evening_notifications && (
                    <div className="ml-7 mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time:</label>
                      <input
                        type="time"
                        value={preferences.notification_time_evening}
                        onChange={(e) => updatePreference('notification_time_evening', e.target.value)}
                        className="p-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Discussion Notifications */}
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.discussion_notifications}
                      onChange={(e) => updatePreference('discussion_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Discussion replies
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7">
                    Get notified when someone replies to your discussion topics
                  </p>
                </div>

                {/* Mention Notifications */}
                <div>
                  <label className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={preferences.mention_notifications}
                      onChange={(e) => updatePreference('mention_notifications', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mentions
                    </span>
                  </label>
                  <p className="text-xs text-gray-600 ml-7">
                    Get notified when someone mentions you in discussions
                  </p>
                </div>
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









