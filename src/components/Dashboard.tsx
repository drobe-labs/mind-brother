import React from 'react';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Mind Brother</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={onLogout}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="py-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Welcome to Mind Brother
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Your personal mental health companion
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {/* Daily Check-in */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">❤️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                How are you feeling?
              </h3>
              <p className="text-gray-600 text-sm">
                Daily Check-in - Track your mood and emotions
              </p>
            </div>

            {/* Chat with Amani */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chat with Amani
              </h3>
              <p className="text-gray-600 text-sm">
                Your Personal Support Companion
              </p>
            </div>

            {/* Guided Breathing */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">🫁</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Guided Breathing
              </h3>
              <p className="text-gray-600 text-sm">
                Quick Relief - Calm your mind and body
              </p>
            </div>

            {/* Move Your Body */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">💪</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Move Your Body
              </h3>
              <p className="text-gray-600 text-sm">
                Guided Exercise - Physical wellness
              </p>
            </div>

            {/* Personal Journal */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Personal Journal
              </h3>
              <p className="text-gray-600 text-sm">
                Reflection Space - Express your thoughts
              </p>
            </div>

            {/* Daily Inspiration */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Daily Inspiration
              </h3>
              <p className="text-gray-600 text-sm">
                Your Daily Boost - Motivational content
              </p>
            </div>

            {/* The Village */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">🏘️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                The Village
              </h3>
              <p className="text-gray-600 text-sm">
                Connect with Others - Community support
              </p>
            </div>

            {/* Get Professional Support */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-4xl mb-3">🏥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Professional Support
              </h3>
              <p className="text-gray-600 text-sm">
                Find Professional Help - Connect with therapists
              </p>
            </div>
          </div>

          {/* About Amani Section */}
          <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Meet Amani - Your AI Mental Health Companion
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Amani</strong> (Swahili for "peace") is your culturally-aware AI companion, designed specifically for Black men's mental health journey.
                </p>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-lg mb-3">What Amani Can Do:</h4>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Provides 24/7 emotional support and active listening</li>
                    <li>Offers culturally-relevant coping strategies</li>
                    <li>Helps you process difficult emotions in a safe space</li>
                    <li>Recognizes when professional help is needed</li>
                    <li>Maintains complete privacy and confidentiality</li>
                    <li>Encourages professional help when appropriate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
