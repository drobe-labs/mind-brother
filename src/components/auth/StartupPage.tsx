import { useState } from 'react';
import UserSignInUp from './UserSignInUp';
import ProfessionalSignInUp from './ProfessionalSignInUp';
import type { SignInData, UserSignupData, ProfessionalSignupData } from '../../types/auth.types';

interface StartupPageProps {
  onUserSignIn?: (data: SignInData) => Promise<void>;
  onUserSignUp?: (data: UserSignupData) => Promise<void>;
  onProfessionalSignIn?: (data: SignInData) => Promise<void>;
  onProfessionalSignUp?: (data: ProfessionalSignupData) => Promise<void>;
}

export default function StartupPage({
  onUserSignIn,
  onUserSignUp,
  onProfessionalSignIn,
  onProfessionalSignUp
}: StartupPageProps) {
  const [activeMode, setActiveMode] = useState<'user' | 'professional'>('user');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col safe-area-inset">
      {/* Header */}
      <div className="w-full py-6 px-8 safe-area-top">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl overflow-hidden">
              <img 
                src="/amani-memoji-user.png" 
                alt="Mind Brother" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-3xl font-bold text-white">Mind Brother</h1>
          </div>
          
          {/* Mobile mode toggle */}
          <div className="md:hidden flex gap-2">
            <button
              onClick={() => setActiveMode('user')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeMode === 'user'
                  ? 'bg-white text-blue-900'
                  : 'bg-white/10 text-white'
              }`}
            >
              User
            </button>
            <button
              onClick={() => setActiveMode('professional')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeMode === 'professional'
                  ? 'bg-white text-blue-900'
                  : 'bg-white/10 text-white'
              }`}
            >
              Professional
            </button>
          </div>
        </div>
      </div>

      {/* Split Screen Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto p-4 gap-4">
        
        {/* USER SIDE */}
        <div className={`flex-1 ${activeMode === 'professional' ? 'hidden md:flex' : 'flex'} flex-col`}>
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 flex-1 flex flex-col">
            {/* User Header */}
            <div className="text-center mb-8">
              <div className="inline-block w-36 h-36 rounded-full mb-4 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-2">
                <img 
                  src="/amani-memoji-user.png" 
                  alt="User" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Find Your Peace</h2>
              <p className="text-white/70 text-lg">
                Access tools, guidance, and support for your mental health journey
              </p>
            </div>

            {/* User Sign In/Up Component */}
            <UserSignInUp 
              onSignIn={onUserSignIn}
              onSignUp={onUserSignUp}
            />

            {/* User Benefits */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-white font-semibold mb-4">What You Get:</h3>
              <ul className="space-y-3 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>24/7 AI-powered mental health chatbot</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Guided breathing & meditation exercises</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Personalized workout programs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Connect with verified mental health professionals</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* DIVIDER - Desktop only */}
        <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* PROFESSIONAL SIDE */}
        <div className={`flex-1 ${activeMode === 'user' ? 'hidden md:flex' : 'flex'} flex-col`}>
          <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 flex-1 flex flex-col">
            {/* Professional Header */}
            <div className="text-center mb-8">
              <div className="inline-block w-36 h-36 rounded-full mb-4 overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 p-2">
                <img 
                  src="/amani-memoji-professional.png" 
                  alt="Professional" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Help Others Heal</h2>
              <p className="text-white/70 text-lg">
                Join our network of verified mental health professionals
              </p>
            </div>

            {/* Professional Sign In/Up Component */}
            <ProfessionalSignInUp 
              onSignIn={onProfessionalSignIn}
              onSignUp={onProfessionalSignUp}
            />

            {/* Professional Benefits */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <h3 className="text-white font-semibold mb-4">Professional Benefits:</h3>
              <ul className="space-y-3 text-white/80 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Verified professional directory listing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Connect with clients seeking support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Professional dashboard & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-0.5">✓</span>
                  <span>Secure messaging & appointment system</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full py-6 px-8 text-center text-white/50 text-sm">
        <p>© 2025 Mind Brother. Your mental health matters.</p>
      </div>
    </div>
  );
}

