import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import ProfessionalSignupForm from './ProfessionalSignupForm';
import type { SignInData, ProfessionalSignupData } from '../../types/auth.types';

interface ProfessionalSignInUpProps {
  onSignIn?: (data: SignInData) => Promise<void>;
  onSignUp?: (data: ProfessionalSignupData) => Promise<void>;
}

export default function ProfessionalSignInUp({ onSignIn, onSignUp }: ProfessionalSignInUpProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In Form State
  const [signInData, setSignInData] = useState<SignInData>({
    email: '',
    password: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (onSignIn) {
        await onSignIn(signInData);
      } else {
        // Default behavior - implement your Supabase auth here
        console.log('Professional sign in with:', signInData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: ProfessionalSignupData) => {
    setError(null);
    setLoading(true);

    try {
      if (onSignUp) {
        await onSignUp(data);
      } else {
        // Default behavior - implement your Supabase professional signup here
        console.log('Professional sign up with:', data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create professional account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('signin')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            mode === 'signin'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            mode === 'signup'
              ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* SIGN IN FORM */}
      {mode === 'signin' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Professional Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                required
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                placeholder="dr.smith@practice.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="password"
                required
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                // For now, show an alert. You can implement a full forgot password flow here if needed
                const email = prompt('Enter your email address to reset your password:');
                if (email) {
                  import('../../lib/authHandlers').then(({ handlePasswordReset }) => {
                    handlePasswordReset(email)
                      .then(() => alert('Password reset email sent! Please check your inbox.'))
                      .catch((err) => alert('Error: ' + err.message));
                  });
                }
              }}
              className="text-orange-400 hover:text-orange-300 text-sm transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {/* SIGN UP FORM - Multi-step professional signup */}
      {mode === 'signup' && (
        <ProfessionalSignupForm onSubmit={handleSignUp} loading={loading} />
      )}
    </div>
  );
}

