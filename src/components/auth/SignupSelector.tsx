import { ArrowRight } from 'lucide-react';

interface SignupSelectorProps {
  onSelectUserSignup: () => void;
  onSelectProfessionalSignup: () => void;
}

export default function SignupSelector({ onSelectUserSignup, onSelectProfessionalSignup }: SignupSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 overflow-y-auto safe-area-inset">
      <div className="min-h-screen flex flex-col justify-center p-4 py-8">
        <div className="max-w-5xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-12 safe-area-top">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Join Mind Brother
          </h1>
          <p className="text-xl text-white/80">
            Choose the account type that's right for you
          </p>
        </div>

        {/* Two Options */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Regular User Card */}
          <button
            onClick={onSelectUserSignup}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-32 h-32 bg-blue-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden">
                <img 
                  src="/amani-memoji-user.png" 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
              <ArrowRight className="text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" size={24} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              I'm a User
            </h2>
            <p className="text-white/70 mb-6">
              Looking for mental health support, self-help tools, and community resources
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Access AI chatbot companion</span>
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Guided breathing & fitness tools</span>
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Private journaling space</span>
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Community discussions</span>
              </div>
            </div>

            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-lg">
              <span className="text-blue-300 font-medium text-sm">Sign up in 60 seconds →</span>
            </div>
          </button>

          {/* Professional Card */}
          <button
            onClick={onSelectProfessionalSignup}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all group text-left"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-32 h-32 bg-green-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden">
                <img 
                  src="/amani-memoji-professional.png" 
                  alt="Mental Health Professional" 
                  className="w-full h-full object-cover"
                />
              </div>
              <ArrowRight className="text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all" size={24} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              I'm a Mental Health Professional
            </h2>
            <p className="text-white/70 mb-6">
              Licensed therapist, counselor, psychologist, or psychiatrist looking to connect with clients
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Verified professional badge</span>
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Directory listing</span>
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Client messaging tools</span>
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <span className="mr-2">✓</span>
                <span>Analytics dashboard</span>
              </div>
            </div>

            <div className="inline-flex items-center px-4 py-2 bg-green-500/20 rounded-lg">
              <span className="text-green-300 font-medium text-sm">Professional signup →</span>
            </div>

            <p className="text-white/40 text-xs mt-4">
              ⏱️ Approval time: 1-3 business days
            </p>
          </button>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-white/60 text-sm">
            Already have an account?{' '}
            <button 
              onClick={onSelectUserSignup}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Sign In
            </button>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
