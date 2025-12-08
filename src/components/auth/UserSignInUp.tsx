import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import type { UserSignupData, SignInData } from '../../types/auth.types';
import { handlePasswordReset } from '../../lib/authHandlers';

interface UserSignInUpProps {
  onSignIn?: (data: SignInData) => Promise<void>;
  onSignUp?: (data: UserSignupData) => Promise<void>;
}

export default function UserSignInUp({ onSignIn, onSignUp }: UserSignInUpProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  
  // Forgot password state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

  // Sign In Form State
  const [signInData, setSignInData] = useState<SignInData>({
    email: '',
    password: ''
  });

  // Sign Up Form State
  const [signUpData, setSignUpData] = useState<UserSignupData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    ageRange: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (onSignIn) {
        await onSignIn(signInData);
      } else {
        console.log('Sign in with:', signInData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (onSignUp) {
        await onSignUp(signUpData);
      } else {
        console.log('Sign up with:', signUpData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!forgotPasswordEmail) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Calling handlePasswordReset for:', forgotPasswordEmail);
      const result = await handlePasswordReset(forgotPasswordEmail);
      console.log('✅ Password reset result:', result);
      setSuccess(result.message || 'Password reset email sent! Please check your inbox (and spam folder) and follow the instructions to reset your password.');
      setForgotPasswordEmail('');
    } catch (err: any) {
      console.error('❌ Password reset failed:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack
      });
      setError(err.message || 'Failed to send password reset email. Please check your email address and try again.');
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
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            mode === 'signup'
              ? 'bg-blue-500 text-white shadow-lg'
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

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300 text-sm">
          {success}
        </div>
      )}

      {/* SIGN IN FORM */}
      {mode === 'signin' && (
        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* Password with Toggle */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type={showSignInPassword ? 'text' : 'password'}
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-11 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showSignInPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {/* Forgot Password */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setError(null);
                setSuccess(null);
              }}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD FORM */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setSuccess(null);
              setForgotPasswordEmail('');
            }}
            className="flex items-center gap-2 text-white/60 hover:text-white/80 text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </button>

          <div className="mb-4">
            <h3 className="text-white text-xl font-semibold mb-2">Reset Password</h3>
            <p className="text-white/60 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      {/* SIGN UP FORM */}
      {mode === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-blue-300 text-sm">✨ Sign up in 60 seconds</p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="text"
                  value={signUpData.firstName}
                  onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                  placeholder="John"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={signUpData.lastName}
                onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type="email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          {/* Password with Toggle */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
              <input
                type={showSignUpPassword ? 'text' : 'password'}
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 pl-11 pr-11 text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showSignUpPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-white/40 text-xs mt-1">At least 8 characters</p>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Age Range *
            </label>
            <select
              value={signUpData.ageRange}
              onChange={(e) => setSignUpData({ ...signUpData, ageRange: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="" className="bg-slate-800">Select age range</option>
              <option value="13-17" className="bg-slate-800">13-17</option>
              <option value="18-24" className="bg-slate-800">18-24</option>
              <option value="25-34" className="bg-slate-800">25-34</option>
              <option value="35-44" className="bg-slate-800">35-44</option>
              <option value="45-54" className="bg-slate-800">45-54</option>
              <option value="55-64" className="bg-slate-800">55-64</option>
              <option value="65+" className="bg-slate-800">65+</option>
            </select>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              required
              className="mt-1"
              id="terms"
            />
            <label htmlFor="terms" className="text-white/70 text-xs">
              I agree to the <a href="#" className="text-blue-400 underline">Terms of Service</a> and <a href="#" className="text-blue-400 underline">Privacy Policy</a>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p className="text-center text-white/50 text-xs">
            Optional: You can add username and phone number later in your profile
          </p>
        </form>
      )}
    </div>
  );
}