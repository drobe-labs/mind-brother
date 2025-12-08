import React, { useState } from 'react';
import { FitnessWorkout } from './FitnessWorkout';

export default function Exercise() {
  const [showWorkout, setShowWorkout] = useState(false);

  if (showWorkout) {
    return <FitnessWorkout />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Move Your Body, Lift Your Mind</h1>
        
        {/* Guided Workout Section */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-8 mb-8 border border-orange-200">
          <div className="text-center">
            <div className="inline-block p-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Guided Workout</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Ready to get that work in? Our guided workout features voice coaching and customizable rounds perfect for building strength and boosting your mood.
            </p>
            <button
              onClick={() => setShowWorkout(true)}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Start Guided Workout
            </button>
            <div className="text-sm text-gray-500 mt-4">
              Push-ups • Sit-ups • Jumping Jacks • Squats
            </div>
          </div>
        </div>

        {/* Why Exercise Matters Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8 border border-blue-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Why Exercise Matters for Your Mind</h2>
            <p className="text-gray-700 leading-relaxed">
              Real talk: exercise changes your brain chemistry. It boosts serotonin, lowers stress hormones, and helps you sleep better—which means better moods. Beyond the science, moving your body gives you something you can control when everything else feels chaotic. It's a chance to clear negative thoughts, hit goals, and feel that rush of accomplishment. Whether you're solo or with others, every rep, every step, every breath is you taking care of yourself.
            </p>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exercise & Step Tips for Mental Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Start Small</h3>
              <p className="text-gray-700 text-sm">
                Even 10-15 minutes of movement can boost your mood. Aim for 2,000-3,000 steps to start.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Make It Fun</h3>
              <p className="text-gray-700 text-sm">
                Put on music, try dancing, or walk with friends. Enjoyment increases adherence.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Morning Movement</h3>
              <p className="text-gray-700 text-sm">
                Morning walks can set a positive tone for your entire day and improve sleep quality.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Track Progress</h3>
              <p className="text-gray-700 text-sm">
                Use your phone's step counter or fitness app. Seeing progress motivates continued effort.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Listen to Your Body</h3>
              <p className="text-gray-700 text-sm">
                Rest when needed. Gentle movement on tough days is better than no movement at all.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Find Your Why</h3>
              <p className="text-gray-700 text-sm">
                Connect exercise to what matters to you—better sleep, stress relief, or feeling strong.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}