// src/pages/PendingVerification.tsx
// Professional verification pending status page

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, Mail, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { handleSignOut } from '../lib/authHandlers';
import { useNavigate } from 'react-router-dom';

interface PendingVerificationProps {
  profile?: any;
}

export default function PendingVerification({ profile: initialProfile }: PendingVerificationProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVerificationStatus();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(loadVerificationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get updated profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        
        // If verification status changed, redirect
        if (profileData.verification_status === 'approved') {
          navigate('/professional/dashboard');
        } else if (profileData.verification_status === 'rejected') {
          navigate('/professional/verification-rejected');
        }
      }

      // Get verification details
      const { data: verificationData } = await supabase
        .from('professional_verifications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (verificationData) {
        setVerification(verificationData);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  const handleSignOutClick = async () => {
    setLoading(true);
    try {
      await handleSignOut();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not submitted yet';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-block p-4 bg-orange-500/20 rounded-full mb-6 animate-pulse">
            <Clock size={48} className="text-orange-400" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Application Under Review
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/70 text-lg mb-8">
            Thank you for applying to join Mind Brother, <strong>{profile?.first_name}</strong>!
          </p>

          {/* Status Badge */}
          <div className="inline-block bg-orange-500/20 border border-orange-500/30 rounded-full px-6 py-2 mb-8">
            <span className="text-orange-400 font-semibold capitalize">
              {profile?.verification_status || 'Pending'}
            </span>
          </div>
          
          {/* Timeline */}
          <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-white font-semibold mb-4 text-center">What happens next?</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-white/90 font-medium">Application Submitted</p>
                  <p className="text-white/50 text-sm">
                    {formatDate(profile?.verification_submitted_at)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className={`flex-shrink-0 mt-1 ${verification?.license_verified ? 'text-green-400' : 'text-orange-400'}`}>
                  {verification?.license_verified ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Clock size={20} />
                  )}
                </div>
                <div>
                  <p className="text-white/90 font-medium">License Verification</p>
                  <p className="text-white/50 text-sm">
                    {verification?.license_verified 
                      ? 'Verified with state licensing board' 
                      : 'We\'ll verify your license with the state board'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className={`flex-shrink-0 mt-1 ${verification?.documents_reviewed ? 'text-green-400' : 'text-orange-400'}`}>
                  {verification?.documents_reviewed ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Clock size={20} />
                  )}
                </div>
                <div>
                  <p className="text-white/90 font-medium">Document Review</p>
                  <p className="text-white/50 text-sm">
                    {verification?.documents_reviewed 
                      ? 'All documents approved' 
                      : 'Our team will review your documents'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className={`flex-shrink-0 mt-1 ${verification?.background_check_completed ? 'text-green-400' : 'text-orange-400'}`}>
                  {verification?.background_check_completed ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Clock size={20} />
                  )}
                </div>
                <div>
                  <p className="text-white/90 font-medium">Background Check</p>
                  <p className="text-white/50 text-sm">
                    {verification?.background_check_completed 
                      ? 'Background check cleared' 
                      : 'Standard background verification in progress'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="text-orange-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-white/90 font-medium">Email Notification</p>
                  <p className="text-white/50 text-sm">
                    You'll receive an email once approved (usually 1-3 business days)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="bg-white/5 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-white font-semibold mb-3">Your Application Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Professional Title:</span>
                <span className="text-white/90">{profile?.professional_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Credential:</span>
                <span className="text-white/90">{profile?.primary_credential}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">License State:</span>
                <span className="text-white/90">{profile?.license_state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">License Number:</span>
                <span className="text-white/90">{profile?.license_number}</span>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex gap-3 text-left">
            <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="text-white/90 mb-1">
                <strong>What's being verified?</strong>
              </p>
              <p className="text-white/70">
                We verify your professional license with your state licensing board, 
                review your credentials and documents, and conduct a standard background check 
                to ensure the safety and trust of our community.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={loadVerificationStatus}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              <FileText className="inline mr-2" size={18} />
              Refresh Status
            </button>
            
            <button
              onClick={handleSignOutClick}
              disabled={loading}
              className="w-full text-white/70 hover:text-white text-sm transition-all disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>

          {/* Contact */}
          <p className="text-white/50 text-xs mt-6">
            Questions? Contact us at{' '}
            <a href="mailto:verification@mindbrother.com" className="text-orange-400 hover:underline">
              verification@mindbrother.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

