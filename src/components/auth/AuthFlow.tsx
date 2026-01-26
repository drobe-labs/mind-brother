import { useState } from 'react';
import SignupSelector from './SignupSelector';
import UserSignInUp from './UserSignInUp';
import ProfessionalSignup from './ProfessionalSignup';
import type { UserSignupData, ProfessionalSignupData, SignInData } from '../../types/auth.types';

interface AuthFlowProps {
  onUserSignIn?: (data: SignInData) => Promise<void>;
  onUserSignUp?: (data: UserSignupData) => Promise<void>;
  onProfessionalSignUp?: (data: ProfessionalSignupData) => Promise<void>;
  onBack?: () => void;
}

export default function AuthFlow({ 
  onUserSignIn, 
  onUserSignUp, 
  onProfessionalSignUp,
  onBack 
}: AuthFlowProps) {
  const [flow, setFlow] = useState<'selector' | 'user' | 'professional'>('selector');

  // Handle user signup/signin flow
  if (flow === 'user') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-y-auto safe-area-inset">
        <div className="min-h-screen flex flex-col justify-center p-4 py-8">
          <div className="max-w-md w-full mx-auto">
            {/* Header */}
            <div className="text-center mb-8 safe-area-top">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Mind Brother
              </h1>
              <p className="text-white/80">Your mental wellness companion</p>
            </div>

            {/* Sign In/Up Form Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 md:p-8">
              <UserSignInUp 
                onSignIn={onUserSignIn}
                onSignUp={onUserSignUp}
              />
              
              {/* Back to Selector */}
              <div className="text-center mt-4">
                <button
                  onClick={() => setFlow('selector')}
                  className="text-white/60 hover:text-white/80 text-sm underline"
                >
                  ← Back to signup options
                </button>
              </div>
            </div>

            {/* Professional Link */}
            <div className="text-center mt-6 pb-8">
              <p className="text-white/60 text-sm">
                Are you a mental health professional?{' '}
                <button 
                  onClick={() => setFlow('professional')}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle professional signup flow
  if (flow === 'professional') {
    return (
      <ProfessionalSignup 
        onSignUp={onProfessionalSignUp}
        onBack={() => setFlow('selector')}
      />
    );
  }

  // Default: Show selector
  return (
    <SignupSelector 
      onSelectUserSignup={() => setFlow('user')}
      onSelectProfessionalSignup={() => setFlow('professional')}
    />
  );
}







