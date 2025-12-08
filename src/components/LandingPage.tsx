import React, { useState } from 'react';

type ViewType = 
  | 'home' 
  | 'dashboard' 
  | 'chatbot' 
  | 'breathing' 
  | 'workout' 
  | 'journal' 
  | 'resources' 
  | 'checkin' 
  | 'motivation' 
  | 'exercise' 
  | 'discussions'
  | 'settings'
  | 'terms'
  | 'privacy'
  | 'crisis'
  | 'beta'
  | 'professional'
  | 'guidelines'
  | 'auth';

interface LandingPageProps {
  onNavigate: (section: ViewType) => void;
  user?: any;
  profile?: any;
  onLogout?: () => void;
}

export default function LandingPage({ onNavigate, user, profile, onLogout }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'checkin', label: 'How are you feeling?', description: 'Daily Check-in' },
    { id: 'chatbot', label: 'Chat with Amani', description: 'Your Personal Support Companion' },
    { id: 'breathing', label: 'Guided Breathing', description: 'Quick Relief' },
    { id: 'exercise', label: 'Move Your Body', description: 'Guided Exercise' },
    { id: 'journal', label: 'Personal Journal', description: 'Reflection Space' },
    { id: 'motivation', label: 'Daily Inspiration', description: 'Your Daily Boost' },
    { id: 'discussions', label: 'The Village', description: 'Connect with Others' },
    { id: 'resources', label: 'Get Professional Support', description: 'Find Professional Help' }
  ];

  const handleMenuItemClick = (sectionId: string) => {
    setIsMenuOpen(false);
    // Type assertion is safe here because menuItems only contain valid ViewType values
    onNavigate(sectionId as ViewType);
  };

  return (
    <div className="min-h-screen relative overflow-hidden safe-area-inset" style={{background: 'linear-gradient(135deg, #1a1a2e 0%, #4470AD 50%, #233C67 100%)'}}>
      {/* Background pattern/texture */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.1) 2px, transparent 2px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed right-6 z-50 bg-white bg-opacity-10 backdrop-blur-md rounded-full p-3 hover:bg-opacity-20 transition-all duration-300 border border-white border-opacity-20"
        style={{ top: 'max(calc(env(safe-area-inset-top, 0px) + 1.5rem), 3.5rem)' }}
        aria-label="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block w-5 h-0.5 bg-white transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'}`}></span>
          <span className={`block w-5 h-0.5 bg-white mt-1 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`block w-5 h-0.5 bg-white mt-1 transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-0'}`}></span>
        </div>
      </button>

      {/* Slide-out Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 backdrop-blur-xl transform transition-transform duration-300 ease-in-out z-40 border-l border-white border-opacity-10 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{backgroundColor: '#233C67'}}>
        <div className="h-full overflow-y-auto">
          <div className="p-8" style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 4rem), 6rem)' }}>
            {/* User Greeting */}
            {user && profile && (
              <div className="mb-6 pb-6 border-b border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {profile.first_name ? profile.first_name.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <div>
                    <p className="text-white/60 text-xs">Welcome back,</p>
                    <p className="text-white font-semibold text-lg">
                      {(profile.first_name && profile.first_name.trim().length > 0) 
                        ? profile.first_name.trim()
                        : (profile.username && !profile.username.startsWith('user_') 
                          ? profile.username.trim().split(/\s+/)[0] || 'Brother' 
                          : 'Brother')}!
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <nav className="space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  className="w-full text-left p-4 rounded-lg bg-white bg-opacity-5 hover:bg-opacity-10 transition-all duration-200 border border-white border-opacity-10 hover:border-opacity-20 group"
                >
                  <div>
                    <h3 className="text-white font-medium text-lg group-hover:text-blue-200 transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-gray-300 text-sm font-normal mt-1">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Sign In / Sign Out Button */}
          {user ? (
            <button
              onClick={() => {
                setIsMenuOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full mt-8 p-4 rounded-lg transition-all duration-200 text-white font-medium"
              style={{ backgroundColor: '#ef4444' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Sign Out</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => handleMenuItemClick('auth')}
              className="w-full mt-8 p-4 rounded-lg transition-all duration-200 text-white font-medium"
              style={{ backgroundColor: '#4470AD' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A5F9A'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4470AD'}
            >
              <div className="flex items-center justify-center space-x-2">
                <span>🔐</span>
                <span>Sign In / Sign Up</span>
              </div>
            </button>
          )}

          {/* Contact Us Button */}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              // Contact Us can be handled separately or navigate to a contact page
              window.location.href = 'mailto:support@mindbrother.com';
            }}
            className="w-full mt-4 p-4 rounded-lg transition-all duration-200 text-white font-medium"
            style={{ backgroundColor: '#4470AD' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A5F9A'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4470AD'}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>📧</span>
              <span>Contact Us</span>
            </div>
          </button>

          {/* Legal & Community Links */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <h4 className="text-white/80 font-semibold mb-3 text-sm uppercase tracking-wide">Legal & Community</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate('guidelines');
                }}
                className="w-full text-left text-white/70 hover:text-white text-sm transition-colors"
              >
                Community Guidelines
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate('terms');
                }}
                className="w-full text-left text-white/70 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigate('privacy');
                }}
                className="w-full text-left text-white/70 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Crisis Support */}
          <div className="mt-8 p-4 rounded-lg bg-red-600 bg-opacity-20 border border-red-500 border-opacity-30">
            <h4 className="text-red-200 font-semibold mb-2">🚨 Crisis Support</h4>
            <a
              href="tel:988"
              className="text-red-200 text-sm hover:text-white transition-colors block mb-2"
            >
              Call 988 Crisis Line - Available 24/7
            </a>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onNavigate('crisis');
              }}
              className="text-red-200 text-sm hover:text-white transition-colors underline"
            >
              View Crisis Resources
            </button>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-8 tablet-container">
        {/* Logo Section */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Mind Brother
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light">
            Mental Health Support for Men
          </p>
        </div>

        {/* Animation Container */}
        <div className="w-full max-w-lg h-64 bg-transparent rounded-lg flex items-center justify-center mb-12">
          {/* Placeholder for your animation */}
          <div className="text-gray-400 text-lg">
            {/* Your animation will go here */}
            <div className="animate-pulse">
              Animation Placeholder
            </div>
          </div>
        </div>

        {/* Subtle Call to Action */}
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">
            Your journey to better mental health starts here
          </p>
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <span>Tap the menu</span>
            <span className="animate-bounce">☰</span>
            <span>to explore</span>
          </div>
        </div>
      </div>

      {/* Footer with Legal Links */}
      <div className="absolute left-0 right-0 safe-area-bottom" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
        <div className="flex flex-col items-center space-y-2">
          {/* Bottom Indicator */}
          <div className="flex space-x-2 mb-2">
            <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-white bg-opacity-30 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
          
          {/* Legal & Community Links */}
          <div className="flex items-center space-x-4 text-white/60 text-xs flex-wrap justify-center">
            <button
              onClick={() => onNavigate('guidelines')}
              className="hover:text-white transition-colors"
            >
              Community Guidelines
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
