// src/pages/VerificationRejected.tsx
// Professional verification rejected status page

import { useState } from 'react';
import { XCircle, Mail, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { handleSignOut } from '../lib/authHandlers';

interface VerificationRejectedProps {
  profile?: any;
}

export default function VerificationRejected({ profile }: VerificationRejectedProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const handleContactSupport = () => {
    window.location.href = 'mailto:verification@mindbrother.com?subject=Verification Appeal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-block p-4 bg-red-500/20 rounded-full mb-6">
            <XCircle size={48} className="text-red-400" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Application Not Approved
          </h1>
          
          {/* Subtitle */}
          <p className="text-white/70 text-lg mb-8">
            We're unable to approve your professional application at this time.
          </p>

          {/* Status Badge */}
          <div className="inline-block bg-red-500/20 border border-red-500/30 rounded-full px-6 py-2 mb-8">
            <span className="text-red-400 font-semibold">
              Application Rejected
            </span>
          </div>

          {/* Reason */}
          {profile?.verification_notes && (
            <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FileText size={20} />
                Reason for Rejection
              </h2>
              <p className="text-white/80">
                {profile.verification_notes}
              </p>
            </div>
          )}

          {/* Common Reasons */}
          <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-white font-semibold mb-4">Common Reasons for Rejection</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white/90 font-medium">License Verification Failed</p>
                  <p className="text-white/60">
                    We were unable to verify your license with the state licensing board
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white/90 font-medium">Incomplete Documentation</p>
                  <p className="text-white/60">
                    Required documents were missing or unclear
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white/90 font-medium">Expired License</p>
                  <p className="text-white/60">
                    Your professional license has expired
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white/90 font-medium">Background Check Issues</p>
                  <p className="text-white/60">
                    Background check revealed disqualifying information
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <AlertCircle className="text-orange-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white/90 font-medium">Insurance Verification Failed</p>
                  <p className="text-white/60">
                    Unable to verify professional liability insurance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What You Can Do */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 text-left">
            <h2 className="text-white font-semibold mb-4">What You Can Do</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <ArrowRight className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-white/90 font-medium mb-1">Appeal the Decision</p>
                  <p className="text-white/70 text-sm">
                    If you believe there was an error, contact our verification team to appeal
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ArrowRight className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-white/90 font-medium mb-1">Update Your Information</p>
                  <p className="text-white/70 text-sm">
                    Correct any errors in your license information or credentials
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ArrowRight className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-white/90 font-medium mb-1">Renew Your License</p>
                  <p className="text-white/70 text-sm">
                    If your license has expired, renew it with your state board
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ArrowRight className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-white/90 font-medium mb-1">Resubmit Application</p>
                  <p className="text-white/70 text-sm">
                    After addressing the issues, you may resubmit your application
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={handleContactSupport}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Mail size={20} />
              Contact Verification Team
            </button>

            <button
              onClick={handleSignOutClick}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>

          {/* Contact Info */}
          <div className="text-center">
            <p className="text-white/60 text-sm mb-2">Need Help?</p>
            <a 
              href="mailto:verification@mindbrother.com" 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              verification@mindbrother.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}








