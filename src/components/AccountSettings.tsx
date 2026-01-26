import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { handleChangePassword, handleChangeUsername } from '../lib/authHandlers';

interface AccountSettingsProps {
  user: any;
  profile: any;
  onClose: () => void;
  onProfileUpdate?: () => void;
}

export default function AccountSettings({ user, profile, onClose, onProfileUpdate }: AccountSettingsProps) {
  const [activeTab, setActiveTab] = useState<'password' | 'username'>('password');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Username change state
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      await handleChangePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);
    
    if (!newUsername || newUsername.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return;
    }
    
    if (newUsername.toLowerCase() === profile?.username?.toLowerCase()) {
      setUsernameError('Username is the same as current username');
      return;
    }
    
    setUsernameLoading(true);
    
    try {
      const result = await handleChangeUsername(newUsername);
      setUsernameSuccess(true);
      
      // Trigger profile update callback
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUsernameSuccess(false);
      }, 3000);
    } catch (error: any) {
      setUsernameError(error.message || 'Failed to change username');
    } finally {
      setUsernameLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('password')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'password'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('username')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'username'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Change Username
            </button>
          </div>
        </div>

        {/* Password Change Form */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your password must be at least 8 characters long and contain uppercase, lowercase, and numbers.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  Password changed successfully!
                </div>
              )}
              
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {passwordLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {/* Username Change Form */}
        {activeTab === 'username' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Username</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your username must be at least 3 characters long and can only contain letters, numbers, and underscores.
            </p>
            
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <label htmlFor="currentUsername" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Username
                </label>
                <input
                  type="text"
                  id="currentUsername"
                  value={profile?.username || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700 mb-2">
                  New Username
                </label>
                <input
                  type="text"
                  id="newUsername"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  minLength={3}
                  pattern="[a-zA-Z0-9_]+"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only letters, numbers, and underscores allowed
                </p>
              </div>
              
              {usernameError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {usernameError}
                </div>
              )}
              
              {usernameSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  Username changed successfully!
                </div>
              )}
              
              <button
                type="submit"
                disabled={usernameLoading}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {usernameLoading ? 'Changing Username...' : 'Change Username'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


