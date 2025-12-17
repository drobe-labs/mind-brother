import React, { useState } from 'react';

/**
 * AmaniMemoji Component - Final Perfect Version
 * Shows full Memoji face without cropping
 */
const AmaniMemoji = ({ 
  size = 'md', 
  expression = 'neutral',
  animated = true 
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'hero';
  expression?: string;
  animated?: boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Larger sizes to show full face without cropping
  const sizeClasses = {
    sm: 'w-16 h-16',   // 64px
    md: 'w-20 h-20',   // 80px - Perfect for mood check-in
    lg: 'w-28 h-28',   // 112px
    xl: 'w-36 h-36',   // 144px
    '2xl': 'w-48 h-48', // 192px
    '3xl': 'w-64 h-64', // 256px
    '4xl': 'w-80 h-80', // 320px - Extra large hero
    'hero': 'w-96 h-96' // 384px - Maximum hero size
  };

  // Map expressions to actual file names in /public/ folder
  const expressionFiles: { [key: string]: string } = {
    // Mood-specific expressions
    great: '/amani-memoji-great.png',
    good: '/amani-memoji-good.png',
    okay: '/amani-memoji-okay.png',
    notGreat: '/amani-memoji-not-great.png',
    struggling: '/amani-memoji-struggling.png',
    
    // Breathing exercise expressions
    panicAnxiety: '/amani-memoji-panic-anxiety.png',
    overwhelmed: '/amani-memoji-overwhelmed.png',
    cantSleep: '/amani-memoji-cant-sleep.png',
    heartRacing: '/amani-memoji-heart-racing.png',
    needFocus: '/amani-memoji-need-focus.png',
    needGrounding: '/amani-memoji-need-grounding.png',
    
    // Aliases for easier use
    panic: '/amani-memoji-panic-anxiety.png',
    panicAttack: '/amani-memoji-panic-anxiety.png',
    sleepy: '/amani-memoji-cant-sleep.png',
    sleep: '/amani-memoji-cant-sleep.png',
    racing: '/amani-memoji-heart-racing.png',
    focus: '/amani-memoji-need-focus.png',
    grounding: '/amani-memoji-need-grounding.png',
    meditate: '/amani-memoji-need-grounding.png',
    
    // Fallback to original avatar
    neutral: '/amani-avatar.png'
  };

  // Get the file path for current expression
  const imagePath = expressionFiles[expression] || expressionFiles.neutral;

  // Fallback avatar if image fails
  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0`}>
        <span className="text-white font-bold text-2xl">A</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block flex-shrink-0">
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className={`${sizeClasses[size]} rounded-full bg-gray-300 animate-pulse relative z-10`} />
      )}
      
      {/* Memoji image - Full face visible, no cropping */}
      <img 
        src={imagePath}
        alt={`Amani - ${expression}`}
        className={`${sizeClasses[size]} object-contain relative z-10 transition-all duration-500 ${
          imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${animated ? 'hover:scale-105' : ''}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default AmaniMemoji;

