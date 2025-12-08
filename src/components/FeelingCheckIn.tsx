import React, { useState, useEffect } from 'react';
import { feelingCheckInOptions, moodPrompts } from '../lib/mentalHealthResources';
import AmaniMemoji from './AmaniMemoji';

interface MoodEntry {
  date: string;
  mood: number;
  note?: string;
  prompt?: string;
}

interface FeelingCheckInProps {
  onNavigateToChat?: () => void;
  onNavigateToJournal?: () => void;
}

export default function FeelingCheckIn({ onNavigateToChat, onNavigateToJournal }: FeelingCheckInProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  useEffect(() => {
    // Load mood history from localStorage
    const savedHistory = localStorage.getItem('mood-history');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setMoodHistory(history);
      
      // Check if user has already checked in today
      const today = new Date().toDateString();
      const todayEntry = history.find((entry: MoodEntry) => 
        new Date(entry.date).toDateString() === today
      );
      setHasCheckedInToday(!!todayEntry);
    }

    // Set random prompt
    const randomPrompt = moodPrompts[Math.floor(Math.random() * moodPrompts.length)];
    setCurrentPrompt(randomPrompt);
  }, []);

  const saveMoodEntry = () => {
    if (selectedMood === null) return;

    const newEntry: MoodEntry = {
      date: new Date().toISOString(),
      mood: selectedMood,
      note: note.trim(),
      prompt: currentPrompt
    };

    const updatedHistory = [newEntry, ...moodHistory];
    setMoodHistory(updatedHistory);
    localStorage.setItem('mood-history', JSON.stringify(updatedHistory));
    setHasCheckedInToday(true);
    
    // Reset form
    setNote('');
    
    // Show support modal for moods 1-3 (struggling, not great, ok)
    if (selectedMood <= 3) {
      setShowSupportModal(true);
    } else {
      // Success message for good moods
      alert('Thank you for checking in! Your mood has been recorded.');
    }
  };

  const getStreakDays = () => {
    if (moodHistory.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < moodHistory.length; i++) {
      const entryDate = new Date(moodHistory[i].date);
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getAverageMood = (days: number = 7) => {
    const recentEntries = moodHistory.slice(0, days);
    if (recentEntries.length === 0) return 0;
    
    const sum = recentEntries.reduce((acc, entry) => acc + entry.mood, 0);
    return (sum / recentEntries.length).toFixed(1);
  };

  const getMoodTrend = () => {
    if (moodHistory.length < 2) return 'neutral';
    
    const recent = moodHistory.slice(0, 3);
    const older = moodHistory.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return 'neutral';
    
    const recentAvg = recent.reduce((acc, entry) => acc + entry.mood, 0) / recent.length;
    const olderAvg = older.reduce((acc, entry) => acc + entry.mood, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  };

  const selectedMoodOption = feelingCheckInOptions.find(option => option.value === selectedMood);

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">How are you?</h1>
        <p className="text-gray-600 text-lg leading-relaxed">
          Take a moment to record how you're feeling today. Regular check-ins help track your mental health journey.
        </p>
      </div>

      {/* Today's Check-in */}
      <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
        {hasCheckedInToday ? (
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Today's Check-in Complete ✅</h2>
        ) : null}

        {!hasCheckedInToday ? (
          <>
            {/* Mood Selection */}
            <div className="mb-10">
              <p className="text-gray-600 text-base mb-6">Choose the option that best describes your current mood:</p>
              <div className="space-y-4 mb-10">
                {feelingCheckInOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedMood(option.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      selectedMood === option.value
                        ? 'bg-blue-50 ring-4 ring-blue-500 shadow-lg scale-[1.02]'
                        : 'bg-gray-50 hover:bg-gray-100 active:scale-[0.98]'
                    }`}
                  >
                    {/* Large Memoji on the left */}
                    <div className="flex-shrink-0">
                      <AmaniMemoji 
                        expression={option.expression}
                        size="lg"
                        animated={false}
                      />
                    </div>

                    {/* Label on the right */}
                    <div className={`text-left flex-grow transition-colors ${
                      selectedMood === option.value 
                        ? 'text-blue-600' 
                        : 'text-gray-700'
                    }`}>
                      <span className="text-xl font-semibold">
                        {option.label}
                      </span>
                    </div>

                    {/* Selection indicator */}
                    {selectedMood === option.value && (
                      <div className="flex-shrink-0">
                        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Reflection Prompt */}
            {selectedMood && (
              <div className="mb-6">
                <p className="text-gray-700 mb-3 font-medium">Reflection prompt:</p>
                <p className="text-gray-600 italic mb-4">"{currentPrompt}"</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Take a moment to reflect... (optional)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                />
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={saveMoodEntry}
              disabled={selectedMood === null}
              className={`w-full py-5 rounded-2xl font-semibold text-lg transition-all ${
                selectedMood !== null
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl active:scale-[0.99]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Save Check-in
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">Thanks for checking in today!</p>
            <p className="text-sm text-gray-500">Come back tomorrow for another check-in.</p>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg p-4" style={{backgroundColor: '#CCDBEE'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{color: '#4470AD'}}>Check-in Streak</p>
              <p className="text-2xl font-bold text-black">{getStreakDays()}</p>
              <p className="text-sm text-black">days</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg p-4" style={{backgroundColor: '#CCDBEE'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{color: '#4470AD'}}>7-Day Average</p>
              <p className="text-2xl font-bold text-black">{getAverageMood()}</p>
              <p className="text-sm text-black">out of 5</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg p-4" style={{backgroundColor: '#CCDBEE'}}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{color: '#4470AD'}}>Trend</p>
              <p className="text-lg font-bold capitalize text-black">{getMoodTrend()}</p>
              <p className="text-sm text-black">
                {getMoodTrend() === 'improving' && 'Getting better!'}
                {getMoodTrend() === 'declining' && 'Needs attention'}
                {getMoodTrend() === 'stable' && 'Steady progress'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mood History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Mood History</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-black hover:text-gray-700 transition-colors"
          >
            {showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>

        {showHistory && (
          <div className="space-y-3">
            {moodHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No mood entries yet. Start tracking your feelings!
              </p>
            ) : (
              moodHistory.slice(0, 14).map((entry, index) => {
                const option = feelingCheckInOptions.find(opt => opt.value === entry.mood);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AmaniMemoji 
                        expression={option?.expression}
                        size="sm"
                        animated={false}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option?.label}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {entry.note && (
                      <div className="max-w-md text-right">
                        <p className="text-sm text-gray-600 italic">"{entry.note}"</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="mt-8 rounded-lg p-6" style={{backgroundColor: '#CCDBEE'}}>
        <h2 className="text-xl font-semibold text-black mb-3">Tips for Better Mood Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-black mb-2">Be Consistent</h3>
            <p className="text-black text-sm">
              Try to check in at the same time each day for more accurate patterns.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-black mb-2">Be Honest</h3>
            <p className="text-black text-sm">
              There's no "right" mood to have. Be authentic about how you're feeling.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-black mb-2">Look for Patterns</h3>
            <p className="text-black text-sm">
              Notice what activities or situations tend to improve or worsen your mood.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-black mb-2">Seek Support</h3>
            <p className="text-black text-sm">
              If you notice concerning patterns, consider talking to Amani or a mental health professional.
            </p>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Thank you for checking in
              </h3>
              <p className="text-gray-600">
                I notice you might be going through a tough time. Would you like some support?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSupportModal(false);
                  if (onNavigateToChat) {
                    onNavigateToChat();
                  }
                }}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Chat with Amani
                <p className="text-sm text-blue-100 mt-1">Your personal AI mental health companion</p>
              </button>

              <button
                onClick={() => {
                  setShowSupportModal(false);
                  if (onNavigateToJournal) {
                    onNavigateToJournal();
                  }
                }}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Express yourself in your journal
                <p className="text-sm text-green-100 mt-1">Private space for thoughts and reflection</p>
              </button>

              <button
                onClick={() => setShowSupportModal(false)}
                className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Not right now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
