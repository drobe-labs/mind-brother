import React, { useState, useEffect } from 'react';
import { dailyMotivationQuotes } from '../lib/mentalHealthResources';
import { 
  therapeuticAffirmations, 
  getTodaysAffirmation, 
  getRandomAffirmation, 
  getAffirmationsByTheme,
  getAllThemes,
  Affirmation 
} from '../lib/affirmations';

export default function DailyMotivation() {
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null);
  const [currentQuote, setCurrentQuote] = useState('');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [themes] = useState<string[]>(getAllThemes());
  const [viewMode, setViewMode] = useState<'affirmations' | 'quotes'>('affirmations');

  useEffect(() => {
    // Get today's affirmation
    const todaysAffirmation = getTodaysAffirmation();
    setCurrentAffirmation(todaysAffirmation);

    // Get today's quote based on date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % dailyMotivationQuotes.length;
    setQuoteIndex(index);
    setCurrentQuote(dailyMotivationQuotes[index]);

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('motivation-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (text: string) => {
    const newFavorites = favorites.includes(text)
      ? favorites.filter(fav => fav !== text)
      : [...favorites, text];
    
    setFavorites(newFavorites);
    localStorage.setItem('motivation-favorites', JSON.stringify(newFavorites));
  };

  const getRandomAffirmationLocal = () => {
    const randomAffirmation = selectedTheme === 'all' 
      ? getRandomAffirmation()
      : getAffirmationsByTheme(selectedTheme)[Math.floor(Math.random() * getAffirmationsByTheme(selectedTheme).length)];
    setCurrentAffirmation(randomAffirmation);
  };

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * dailyMotivationQuotes.length);
    setQuoteIndex(randomIndex);
    setCurrentQuote(dailyMotivationQuotes[randomIndex]);
  };

  const shareContent = (text: string, type: 'affirmation' | 'quote') => {
    if (navigator.share) {
      navigator.share({
        title: 'Daily Motivation',
        text: `"${text}" - Mind Brother App`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`"${text}" - Mind Brother App`);
      alert(`${type === 'affirmation' ? 'Affirmation' : 'Quote'} copied to clipboard!`);
    }
  };

  const QuoteCard = ({ quote, isMain = false }: { quote: string; isMain?: boolean }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
      isMain ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : ''
    }`}>
      <blockquote className={`${isMain ? 'text-lg' : 'text-base'} text-gray-800 font-medium italic mb-6 leading-relaxed text-center`}>
        "{quote}"
      </blockquote>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <button
          onClick={() => toggleFavorite(quote)}
          className={`transition-colors ${
            favorites.includes(quote)
              ? 'text-red-500 hover:text-red-600'
              : 'text-gray-400 hover:text-red-500'
          }`}
          title={favorites.includes(quote) ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorites.includes(quote) ? '❤️' : '🤍'}
        </button>
        {isMain && (
          <span className="px-2 py-1 rounded-full text-xs" style={{backgroundColor: '#CCDBEE', color: '#233C67'}}>
            Motivational Quote
          </span>
        )}
      </div>
    </div>
  );

  const AffirmationCard = ({ affirmation, isMain = false }: { affirmation: Affirmation; isMain?: boolean }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
      isMain ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : ''
    }`}>
      <blockquote className={`${isMain ? 'text-lg' : 'text-base'} text-gray-800 font-medium italic mb-6 leading-relaxed text-center`}>
        "{affirmation.affirmation}"
      </blockquote>
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <button
          onClick={() => toggleFavorite(affirmation.affirmation)}
          className={`transition-colors ${
            favorites.includes(affirmation.affirmation)
              ? 'text-red-500 hover:text-red-600'
              : 'text-gray-400 hover:text-red-500'
          }`}
          title={favorites.includes(affirmation.affirmation) ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorites.includes(affirmation.affirmation) ? '❤️' : '🤍'}
        </button>
        {isMain && (
          <span className="px-2 py-1 rounded-full text-xs capitalize" style={{backgroundColor: '#CCDBEE', color: '#233C67'}}>
            {affirmation.theme.replace('_', ' ')}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Motivation</h1>
        <p className="text-gray-600 mb-4">
          Start your day with inspiration and encouragement!
        </p>
      </div>

      {/* Today's Inspiration */}
      <div className="mb-8">
        {viewMode === 'affirmations' && currentAffirmation ? (
          <AffirmationCard affirmation={currentAffirmation} isMain={true} />
        ) : (
          <QuoteCard quote={currentQuote} isMain={true} />
        )}
        
        <div className="flex justify-center mt-4">
          <button
            onClick={viewMode === 'affirmations' ? getRandomAffirmationLocal : getRandomQuote}
            className="text-white px-6 py-2 rounded-md transition-colors"
            style={{
              backgroundColor: '#4470AD',
              ':hover': { backgroundColor: '#3A5F9A' }
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3A5F9A'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4470AD'}
          >
            Get Random {viewMode === 'affirmations' ? 'Affirmation' : 'Quote'}
          </button>
        </div>
      </div>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Favorites ❤️</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((quote, index) => (
              <QuoteCard key={index} quote={quote} />
            ))}
          </div>
        </div>
      )}

      {/* All Content Section */}
      <div className="mb-8">
        <div className="mb-4 flex justify-between text-sm">
          <button
            onClick={() => { setViewMode('affirmations'); setShowAll(true); }}
            className="transition-colors hover:underline"
            style={{ color: '#4470AD' }}
          >
            Therapeutic Affirmations
          </button>
          <button
            onClick={() => { setViewMode('quotes'); setShowAll(true); }}
            className="transition-colors hover:underline"
            style={{ color: '#4470AD' }}
          >
            Motivational Quotes
          </button>
        </div>
        
        {showAll && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {viewMode === 'affirmations' ? (
              therapeuticAffirmations.map((affirmation) => (
                <AffirmationCard key={affirmation.id} affirmation={affirmation} />
              ))
            ) : (
              dailyMotivationQuotes.map((quote, index) => (
                <QuoteCard key={index} quote={quote} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Motivation Tips */}
      <div className="rounded-lg p-6" style={{backgroundColor: '#CCDBEE'}}>
        <h2 className="text-xl font-semibold mb-3" style={{color: '#233C67'}}>Tips for Daily Motivation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2" style={{color: '#233C67'}}>Morning Routine</h3>
            <ul className="text-sm space-y-1" style={{color: 'black'}}>
              <li>• Start with a positive affirmation</li>
              <li>• Read today's motivational quote</li>
              <li>• Take 5 deep breaths</li>
              <li>• Set one small intention for the day</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2" style={{color: '#233C67'}}>Throughout the Day</h3>
            <ul className="text-sm space-y-1" style={{color: 'black'}}>
              <li>• Return to your favorite quotes when struggling</li>
              <li>• Share encouragement with others</li>
              <li>• Practice self-compassion</li>
              <li>• Celebrate small wins</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded-md" style={{backgroundColor: '#B8C9E8'}}>
          <p className="text-sm" style={{color: '#233C67'}}>
            <strong>Remember:</strong> Progress isn't always linear. Be patient with yourself, and know that seeking support is a sign of strength, not weakness.
          </p>
        </div>
      </div>
    </div>
  );
}
