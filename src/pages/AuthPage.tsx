// src/pages/AuthPage.tsx
// Main authentication page that wraps StartupPage with Supabase handlers

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StartupPage from '../components/auth/StartupPage';
import {
  handleUserSignIn,
  handleUserSignUp,
  handleProfessionalSignIn,
  handleProfessionalSignUp
} from '../lib/authHandlers';
import type { SignInData, UserSignupData, ProfessionalSignupData } from '../types/auth.types';

export default function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ============================================
  // USER HANDLERS
  // ============================================

  const onUserSignIn = async (data: SignInData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await handleUserSignIn(data);
      console.log('User signed in:', result);
      
      // Navigate to user dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err; // Re-throw to let the component handle it
    } finally {
      setLoading(false);
    }
  };

  const onUserSignUp = async (data: UserSignupData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await handleUserSignUp(data);
      console.log('✅ User signed up successfully:', result);
      
      setSuccessMessage('Account created successfully! Welcome to Mind Brother!');
      
      // Small delay to show success message, then redirect to home
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('❌ Sign up error:', err);
      setError(err.message || 'Failed to create account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PROFESSIONAL HANDLERS
  // ============================================

  const onProfessionalSignIn = async (data: SignInData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await handleProfessionalSignIn(data);
      console.log('Professional signed in:', result);
      
      // Check verification status and navigate accordingly
      if (result.profile.verification_status === 'approved') {
        navigate('/professional/dashboard');
      } else if (result.profile.verification_status === 'pending') {
        navigate('/professional/pending-verification');
      } else if (result.profile.verification_status === 'rejected') {
        navigate('/professional/verification-rejected');
      } else {
        navigate('/professional/dashboard');
      }
    } catch (err: any) {
      console.error('Professional sign in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const onProfessionalSignUp = async (data: ProfessionalSignupData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await handleProfessionalSignUp(data);
      console.log('Professional signed up:', result);
      
      setSuccessMessage(
        result.message || 
        'Application submitted! We\'ll review your credentials within 1-3 business days.'
      );
      
      // Navigate to pending verification page
      setTimeout(() => {
        navigate('/professional/pending-verification');
      }, 2000);
    } catch (err: any) {
      console.error('Professional sign up error:', err);
      setError(err.message || 'Failed to create professional account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Global Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-top">
          {successMessage}
        </div>
      )}

      {/* Global Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-top">
          {error}
        </div>
      )}

      {/* Main Auth Page */}
      <StartupPage
        onUserSignIn={onUserSignIn}
        onUserSignUp={onUserSignUp}
        onProfessionalSignIn={onProfessionalSignIn}
        onProfessionalSignUp={onProfessionalSignUp}
      />
    </>
  );
}

