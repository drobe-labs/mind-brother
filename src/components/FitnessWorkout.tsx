import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Trophy, Flame, RefreshCw, ArrowLeft } from 'lucide-react';

interface FitnessWorkoutProps {
  onBack?: () => void; // Callback to exit the module entirely
}

const FitnessWorkout = ({ onBack }: FitnessWorkoutProps) => {
  const [screen, setScreen] = useState('setup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentRep, setCurrentRep] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [repsPerExercise, setRepsPerExercise] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(30);
  const [countdown, setCountdown] = useState(3);
  const [showCountdown, setShowCountdown] = useState(false);
  const [totalRepsCompleted, setTotalRepsCompleted] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [isFirstExercise, setIsFirstExercise] = useState(true);
  
  // Voice system refs
  const audioCache = useRef(new Map());
  const hasSpokenRef = useRef<Record<string, boolean>>({});
  const isCurrentlySpeaking = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInitialized = useRef(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const useElevenLabs = useRef(true);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true); // Track if component is mounted

  // Cleanup function to stop all audio
  const stopAllAudio = () => {
    console.log('🛑 Stopping all audio...');
    
    // Stop any playing audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    
    // Cancel browser speech synthesis (important for cleanup!)
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Also cancel via ref
    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    
    isCurrentlySpeaking.current = false;
  };

  // Cleanup when component unmounts
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('🧹 FitnessWorkout unmounting - cleaning up audio');
      isMountedRef.current = false;
      stopAllAudio();
    };
  }, []);

  const exercises = [
    {
      name: 'Push-ups',
      voiceName: 'Push ups',
      instruction: 'Keep your body straight, chest to ground',
      restAfter: 30,
      targetMuscles: 'Chest, Arms, Core',
      midpointCue: 'Keep good form',
      midpointTime: 6
    },
    {
      name: 'Sit-ups',
      voiceName: 'Sit ups',
      instruction: 'Hands behind head, engage your core',
      restAfter: 30,
      targetMuscles: 'Abs, Core',
      midpointCue: 'Keep that core engaged',
      midpointTime: 7
    },
    {
      name: 'Jumping Jacks',
      voiceName: 'Jumping Jacks',
      instruction: 'Jump with arms overhead, land softly',
      restAfter: 30,
      targetMuscles: 'Full Body, Cardio',
      midpointCue: 'Land softly',
      midpointTime: 6
    },
    {
      name: 'Bodyweight Squats',
      voiceName: 'Squats',
      instruction: 'Keep chest up, knees over toes',
      restAfter: 45,
      targetMuscles: 'Legs, Glutes, Core',
      midpointCue: 'Chest up',
      midpointTime: 6
    }
  ];

  const currentExercise = exercises[currentExerciseIndex];

  // Initialize audio context and speech synthesis
  const initializeAudio = async () => {
    if (audioInitialized.current) return;
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      if (window.speechSynthesis) {
        speechSynthRef.current = window.speechSynthesis;
      }
      
      audioInitialized.current = true;
      console.log('✅ Audio initialized');
    } catch (e) {
      console.warn('Audio initialization failed:', e);
    }
  };

  // Play audio blob (ElevenLabs)
  const playAudioBlob = async (blob: Blob): Promise<void> => {
    // Don't play if component is unmounted
    if (!isMountedRef.current) {
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        // Track current audio for cleanup
        currentAudioRef.current = audio;
        
        audio.volume = 1.0;
        audio.preload = 'auto';
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          isCurrentlySpeaking.current = false;
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          isCurrentlySpeaking.current = false;
          reject(error);
        };

        // Final check before playing
        if (!isMountedRef.current) {
          URL.revokeObjectURL(audioUrl);
          resolve();
          return;
        }

        audio.play().catch(error => {
          URL.revokeObjectURL(audioUrl);
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
          isCurrentlySpeaking.current = false;
          reject(error);
        });
      } catch (error) {
        isCurrentlySpeaking.current = false;
        reject(error);
      }
    });
  };

  // Browser speech synthesis fallback - with male voice preference
  const speakWithBrowser = async (text: string): Promise<void> => {
    // Don't speak if component is unmounted
    if (!isMountedRef.current) return;
    
    return new Promise<void>((resolve, reject) => {
      const synth = speechSynthRef.current || window.speechSynthesis;
      
      if (!synth) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      try {
        if (synth.speaking) {
          synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to select a male voice
        const voices = synth.getVoices();
        const maleVoice = voices.find(voice => 
          voice.name.includes('Male') || 
          voice.name.includes('David') ||
          voice.name.includes('Daniel') ||
          voice.name.includes('James') ||
          voice.name.includes('Google US English Male') ||
          (voice.name.includes('English') && voice.name.toLowerCase().includes('male'))
        );
        
        if (maleVoice) {
          utterance.voice = maleVoice;
          console.log('🎤 Using male voice:', maleVoice.name);
        } else {
          // If no male voice found, at least lower the pitch
          utterance.pitch = 0.8;
          console.log('⚠️ No male voice found, using lower pitch');
        }
        
        utterance.rate = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          isCurrentlySpeaking.current = false;
          resolve();
        };

        utterance.onerror = (error) => {
          isCurrentlySpeaking.current = false;
          console.error('Browser speech error:', error);
          reject(error);
        };

        synth.speak(utterance);
      } catch (error) {
        isCurrentlySpeaking.current = false;
        reject(error);
      }
    });
  };

  // State for preloading
  const [isPreloading, setIsPreloading] = useState(false);

  // Generate speech via backend proxy
  const generateSpeech = async (text: string): Promise<Blob> => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://192.168.5.180:3001';
    
    const response = await fetch(`${backendUrl}/api/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_id: '6OzrBCQf8cjERkYgzSg8' // Workout voice
      })
    });

    if (!response.ok) {
      throw new Error(`TTS API failed: ${response.status}`);
    }

    return await response.blob();
  };

  // Pre-cache common workout phrases
  const precacheWorkoutCues = async (): Promise<boolean> => {
    const cuesToCache = [
      // Intro
      { text: "Hi! I'm your fitness coach! Let's get to work!", key: 'coach_intro' },
      // Initial workout countdown only
      { text: '3', key: 'countdown_3' },
      { text: '2', key: 'countdown_2' },
      { text: '1', key: 'countdown_1' },
      { text: 'Go!', key: 'go' },
      // Rest period announcement
      { text: 'Rest time! Great work!', key: 'rest_start' },
      // Motivation
      { text: 'Halfway there! Keep it up!', key: 'halfway' },
      { text: 'Last round! Give it everything!', key: 'last_round' },
      { text: 'Exercise complete! Good job!', key: 'exercise_complete' },
      { text: 'Workout complete! You crushed it!', key: 'workout_complete' },
      // Exercise-specific cues
      ...exercises.map((ex, i) => ({ text: `Get ready for ${ex.voiceName}!`, key: `exercise_${i}_ready` })),
      ...exercises.map((ex, i) => ({ text: ex.midpointCue, key: `exercise_${i}_midpoint` }))
    ];

    console.log('🔄 Pre-caching workout voice cues...');
    setIsPreloading(true);

    try {
      const results = await Promise.allSettled(
        cuesToCache.map(async ({ text, key }) => {
          if (!audioCache.current.has(key)) {
            const blob = await generateSpeech(text);
            audioCache.current.set(key, blob);
            console.log(`✅ Cached: ${key}`);
          }
        })
      );

      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`⚠️ ${failures.length} cues failed to cache`);
      }

      setIsPreloading(false);
      return failures.length < cuesToCache.length;
    } catch (error) {
      console.error('❌ Pre-cache failed:', error);
      setIsPreloading(false);
      return false;
    }
  };

  // Main speak function with backend proxy + Browser fallback
  const speak = async (text: string, cacheKey: string | null = null): Promise<void> => {
    // Don't speak if component is unmounted or voice is disabled
    if (!isMountedRef.current || !voiceEnabled) return;

    // Wait for any current speech to finish
    let waitCount = 0;
    while (isCurrentlySpeaking.current && waitCount < 100) {
      await new Promise(resolve => setTimeout(resolve, 50));
      waitCount++;
      // Check if unmounted while waiting
      if (!isMountedRef.current) return;
    }

    if (cacheKey && hasSpokenRef.current[cacheKey]) return;

    isCurrentlySpeaking.current = true;

    try {
      // Check cache first (instant playback)
      if (cacheKey && audioCache.current.has(cacheKey)) {
        const audioBlob = audioCache.current.get(cacheKey);
        // Check mounted before playing
        if (!isMountedRef.current) {
          isCurrentlySpeaking.current = false;
          return;
        }
        await playAudioBlob(audioBlob);
        hasSpokenRef.current[cacheKey] = true;
        return;
      }

      // Fetch from backend
      console.log('🎤 Fetching voice:', text.substring(0, 30) + '...');
      const audioBlob = await generateSpeech(text);
      
      // Check if still mounted after fetch
      if (!isMountedRef.current) {
        isCurrentlySpeaking.current = false;
        return;
      }
      
      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      if (cacheKey) {
        audioCache.current.set(cacheKey, audioBlob);
      }

      await playAudioBlob(audioBlob);
      
      if (cacheKey) {
        hasSpokenRef.current[cacheKey] = true;
      }

    } catch (error) {
      console.error('❌ TTS failed:', error);
      
      // Only fallback if still mounted
      if (!isMountedRef.current) {
        isCurrentlySpeaking.current = false;
        return;
      }
      
      console.log('🔄 Falling back to browser speech...');
      
      try {
        await speakWithBrowser(text);
      } catch (fallbackError) {
        console.error('❌ Both voice methods failed:', fallbackError);
        isCurrentlySpeaking.current = false;
      }
    }
  };

  // Whistle sound
  const playWhistle = () => {
    if (!soundEffectsEnabled) return;
    
    const whistleAudio = new Audio('/whistle.wav');
    whistleAudio.volume = 0.7;
    
    whistleAudio.play().catch(() => {
      playSynthesizedWhistle();
    });
  };

  const playSynthesizedWhistle = () => {
    try {
      const audioContext = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;
      
      const createTone = (freq: number, startTime: number, duration: number, volume: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      createTone(3520, now, 0.18, 0.35);
    } catch (e) {
      console.warn('Whistle sound failed:', e);
    }
  };

  // Clear all caches
  const clearAllCaches = () => {
    // Clear audio cache
    audioCache.current.clear();
    // Clear spoken refs
    hasSpokenRef.current = {};
    // Cancel any ongoing speech
    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }
    isCurrentlySpeaking.current = false;
    console.log('✅ All caches cleared');
  };

  // Clear all caches on component mount (only once)
  useEffect(() => {
    clearAllCaches();
    
    // Validate env vars
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Missing Supabase environment variables!');
      console.warn('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
      console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    } else {
      console.log('✅ Supabase environment variables configured');
    }
  }, []);

  // Non-blocking speak - fire and forget for workout cues
  const speakAsync = (text: string, cacheKey: string | null = null) => {
    speak(text, cacheKey).catch(console.error);
  };

  // Speak with interruption - stops current audio first
  const speakInterrupt = (text: string, cacheKey: string | null = null) => {
    // Stop any current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
    }
    isCurrentlySpeaking.current = false;
    hasSpokenRef.current = {}; // Reset spoken refs for fresh cues
    
    speak(text, cacheKey).catch(console.error);
  };

  // ✅ Start workout with coach intro
  const startWorkout = async () => {
    await initializeAudio();
    
    setIsFirstExercise(true);
    setScreen('ready');
    setShowCountdown(false);
    setCurrentExerciseIndex(0);
    setCurrentRound(1);
    setCurrentRep(0);
    
    // Pre-cache all voice cues for instant playback (prevents sync issues)
    if (voiceEnabled) {
      await precacheWorkoutCues();
    }
    
    // Wait for intro to finish before continuing
    await speak(
      "Hi! I'm your fitness coach! Let's get to work!",
      'coach_intro'
    );
    
    // Small pause after intro
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Wait for "Get ready" to finish before starting countdown
    await speak(`Get ready for ${exercises[0].voiceName}!`, 'exercise_0_ready');
    
    // Now run the countdown with proper voice sync
    setShowCountdown(true);
    
    // 3
    setCountdown(3);
    await speak('3', 'countdown_3');
    await new Promise(resolve => setTimeout(resolve, 700)); // Visual display time
    
    // 2
    setCountdown(2);
    await speak('2', 'countdown_2');
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // 1
    setCountdown(1);
    await speak('1', 'countdown_1');
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Go!
    setCountdown(0);
    speakAsync('Go!', 'go');
    if (soundEffectsEnabled) {
      playWhistle();
    }
    setShowCountdown(false);
    setScreen('workout');
    setCurrentRep(1);
  };

  // Note: Initial countdown is now handled sequentially in startWorkout() for better voice sync
  // This useEffect is kept for any future non-initial countdowns if needed

  // Rep progression - no voice during reps to avoid overlap
  useEffect(() => {
    if (screen === 'workout' && !isPaused && currentRep > 0 && currentRep < repsPerExercise) {
      const timer = setTimeout(() => {
        const nextRep = currentRep + 1;
        // Just update visual - no voice countdown during reps
        setCurrentRep(nextRep);
        setTotalRepsCompleted(prev => prev + 1);
      }, 2000); // 2 seconds per rep
      return () => clearTimeout(timer);
    }
  }, [screen, currentRep, isPaused, repsPerExercise, currentExerciseIndex, currentRound]);
  
  // Time-based midpoint coaching cues - only if not near end of exercise
  useEffect(() => {
    if (screen === 'workout' && !isPaused && currentRep < repsPerExercise - 3) {
      const cueTimer = setTimeout(() => {
        // Only speak if not too close to exercise end
        if (currentRep < repsPerExercise - 3) {
          const cue = currentExercise.midpointCue;
          speakAsync(cue, `midpoint_${currentRound}_${currentExerciseIndex}`);
        }
      }, currentExercise.midpointTime * 1000);
      
      return () => clearTimeout(cueTimer);
    }
  }, [screen, isPaused, currentExerciseIndex, currentRound]);

  // Exercise completion
  useEffect(() => {
    if (screen === 'workout' && currentRep === repsPerExercise) {
      setTotalRepsCompleted(prev => prev + 1);
      
      if (soundEffectsEnabled) {
        playWhistle();
      }
      
      // Use interrupt to ensure this plays clearly
      speakInterrupt('Exercise complete!', `complete_${currentRound}_${currentExerciseIndex}`);
      
      setTimeout(() => {
        const nextExerciseIndex = currentExerciseIndex + 1;
        
        if (nextExerciseIndex < exercises.length) {
          setIsFirstExercise(false);
          setCurrentExerciseIndex(nextExerciseIndex);
          setScreen('rest');
          setRestTimeRemaining(currentExercise.restAfter);
        } else if (currentRound < totalRounds) {
          speakInterrupt(`Round ${currentRound} complete!`, `round_${currentRound}_complete`);
          setCurrentRound(currentRound + 1);
          setCurrentExerciseIndex(0);
          setIsFirstExercise(false);
          setScreen('rest');
          setRestTimeRemaining(45);
        } else {
          speakInterrupt('Workout complete! Great job!', 'workout_complete');
          setScreen('complete');
        }
      }, 2500); // Slightly longer to let "Exercise complete" finish
    }
  }, [screen, currentRep, repsPerExercise, currentExerciseIndex, currentRound, totalRounds, soundEffectsEnabled]);

  // Note: Removed "Rest time!" announcement - "Exercise complete!" is sufficient

  // ✅ SIMPLIFIED: Rest timer - minimal voice, just whistle at end
  useEffect(() => {
    if (screen === 'rest' && restTimeRemaining > 0 && !isPaused) {
      const timer = setTimeout(() => {
        const nextExercise = exercises[currentExerciseIndex];
        const nextTime = restTimeRemaining - 1;
        
        // Update visual
        setRestTimeRemaining(nextTime);
        
        // Voice cue at 8 seconds - announce next exercise (uses interrupt)
        if (nextTime === 8) {
          speakInterrupt(`Get ready for ${nextExercise.voiceName}`, `ready_${currentRound}_${currentExerciseIndex}`);
        }
        
        // At 0 - just whistle and start (no voice countdown)
        if (nextTime === 0) {
          if (soundEffectsEnabled) {
            playWhistle();
          }
          // Transition to workout
          setScreen('workout');
          setCurrentRep(1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [screen, restTimeRemaining, isPaused, currentExerciseIndex, soundEffectsEnabled, currentRound]);

  // Skip rest
  const skipRest = () => {
    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }
    isCurrentlySpeaking.current = false;
    
    setScreen('workout');
    setCurrentRep(1);
    setRestTimeRemaining(0);
    
    if (voiceEnabled) {
      const nextExercise = exercises[currentExerciseIndex];
      speakAsync(`Starting ${nextExercise.voiceName}`, `skip_rest_${currentRound}_${currentExerciseIndex}`);
    }
  };

  // Skip exercise
  const skipExercise = () => {
    const nextExerciseIndex = currentExerciseIndex + 1;
    
    if (nextExerciseIndex < exercises.length) {
      setCurrentExerciseIndex(nextExerciseIndex);
      setScreen('rest');
      setRestTimeRemaining(currentExercise.restAfter);
      setCurrentRep(0);
    } else if (currentRound < totalRounds) {
      setCurrentRound(currentRound + 1);
      setCurrentExerciseIndex(0);
      setScreen('rest');
      setRestTimeRemaining(45);
      setCurrentRep(0);
    } else {
      setScreen('complete');
    }
  };

  // Reset workout
  const resetWorkout = () => {
    setScreen('setup');
    setCurrentExerciseIndex(0);
    setCurrentRound(1);
    setCurrentRep(0);
    setIsPaused(false);
    setTotalRepsCompleted(0);
    setIsFirstExercise(true);
    clearAllCaches();
  };

  // Handle back navigation based on current screen
  const handleBack = () => {
    if (screen === 'setup') {
      // On setup screen, exit the module entirely
      if (onBack) {
        onBack();
      }
    } else {
      // On any other screen, stop workout and go back to setup
      stopAllAudio();
      resetWorkout();
    }
  };

  // Setup Screen
  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 safe-area-inset">
        <div className="max-w-2xl mx-auto tablet-max-width">
          {/* Back Button - Exit module */}
          {onBack && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/70 hover:text-white mb-4 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">MB Home</span>
            </button>
          )}
          
          <div className="text-center mb-8">
            <div className="inline-block p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-4">
              <Flame className="text-white" size={48} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Mind Brother Fitness</h1>
            <p className="text-white/70 text-lg">Let's get that work in, bro</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Today's Workout</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {exercises.map((ex, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-1">{ex.name}</h3>
                  <p className="text-white/60 text-sm">{ex.targetMuscles}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl p-8 mb-8">
            <div className="mb-8">
              <label className="text-white font-semibold mb-4 block">Rounds</label>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setTotalRounds(Math.max(1, totalRounds - 1))}
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl text-white text-2xl font-bold"
                >
                  -
                </button>
                <div className="text-5xl font-bold text-white w-20 text-center">
                  {totalRounds}
                </div>
                <button
                  onClick={() => setTotalRounds(Math.min(10, totalRounds + 1))}
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl text-white text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-white font-semibold mb-4 block">Reps per Exercise</label>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setRepsPerExercise(Math.max(5, repsPerExercise - 5))}
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl text-white text-2xl font-bold"
                >
                  -
                </button>
                <div className="text-5xl font-bold text-white w-24 text-center">
                  {repsPerExercise}
                </div>
                <button
                  onClick={() => setRepsPerExercise(Math.min(50, repsPerExercise + 5))}
                  className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-xl text-white text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-2xl p-6 mb-4">
            <span className="text-white font-semibold">Voice Coaching</span>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`relative w-16 h-8 rounded-full transition-all ${
                voiceEnabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                voiceEnabled ? 'left-9' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-2xl p-6 mb-8">
            <span className="text-white font-semibold">Sound Effects (Whistle)</span>
            <button
              onClick={() => setSoundEffectsEnabled(!soundEffectsEnabled)}
              className={`relative w-16 h-8 rounded-full transition-all ${
                soundEffectsEnabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                soundEffectsEnabled ? 'left-9' : 'left-1'
              }`} />
            </button>
          </div>

          <button
            onClick={startWorkout}
            disabled={isPreloading}
            className="w-full py-8 rounded-2xl font-bold text-xl shadow-lg transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white hover:shadow-xl disabled:opacity-70 disabled:cursor-wait"
          >
            {isPreloading ? (
              <>
                <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Preparing Coach...
              </>
            ) : (
              <>
                <Play size={28} />
                Start Workout
              </>
            )}
          </button>

          <button
            onClick={clearAllCaches}
            className="w-full py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white mt-4"
          >
            <RefreshCw size={16} />
            Clear Cache
          </button>

          <div className="text-center text-white/50 text-sm mt-4">
            Total: {totalRounds * exercises.length * repsPerExercise} reps · ~{Math.ceil(totalRounds * 8)} minutes
          </div>
        </div>
      </div>
    );
  }

  // Ready/Countdown Screen
  if (screen === 'ready') {
    if (showCountdown && isFirstExercise) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center safe-area-inset">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-8">{currentExercise.name}</h2>
            <div className="text-9xl font-bold text-white mb-8 animate-pulse">
              {countdown > 0 ? countdown : 'GO!'}
            </div>
            <p className="text-xl text-white/70">{currentExercise.instruction}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center safe-area-inset">
        <div className="text-center">
          <div className="inline-block p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full mb-6 animate-pulse">
            <Flame className="text-white" size={64} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Get Ready!</h2>
          <p className="text-xl text-white/70">Your coach is preparing your workout...</p>
        </div>
      </div>
    );
  }

  // Workout Screen
  if (screen === 'workout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-6 safe-area-inset">
        <div className="max-w-5xl mx-auto tablet-max-width">
          {/* Back Button - Goes to setup screen */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-4 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to Move Your Body</span>
          </button>
          
          <div className="flex justify-between items-center mb-6">
            <div className="text-white">
              <div className="text-sm opacity-70">Round {currentRound} of {totalRounds}</div>
              <div className="text-2xl font-bold">{currentExercise.name}</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </button>
              <button
                onClick={skipExercise}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
              >
                <SkipForward size={24} />
              </button>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-3xl p-8 mb-6">
            <div className="text-center">
              <div className="text-9xl font-bold text-white mb-6 mt-8">
                {currentRep}
              </div>
              <div className="text-4xl text-white/60 mb-12">
                of {repsPerExercise}
              </div>
              
              <div className="bg-white/10 rounded-2xl p-6 max-w-md mx-auto mb-8">
                <div className="text-white/70 text-lg mb-4">Progress</div>
                <div className="w-full bg-white/20 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(currentRep / repsPerExercise) * 100}%` }}
                  />
                </div>
              </div>

              <div className="mt-12 text-white/60 italic text-xl">
                "{currentExercise.instruction}"
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {exercises.map((ex, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl text-center transition-all ${
                  idx === currentExerciseIndex
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white scale-105'
                    : idx < currentExerciseIndex
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-white/5 text-white/40'
                }`}
              >
                <div className="font-semibold text-sm">{ex.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Rest Screen
  if (screen === 'rest') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 safe-area-inset">
        {/* Back Button - Goes to setup screen */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Move Your Body</span>
        </button>
        
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Rest</h2>
          <div className="text-9xl font-bold text-white mb-12 mt-8">
            {restTimeRemaining}
          </div>
          <p className="text-2xl text-white/70 mb-12">
            Next: {exercises[currentExerciseIndex]?.name}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={skipRest}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-semibold"
            >
              Skip Rest
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete Screen
  if (screen === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-6 safe-area-inset">
        {/* Back Button - Goes to setup screen */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 py-2 px-3 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back to Move Your Body</span>
        </button>
        
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="max-w-2xl w-full tablet-max-width bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl text-center">
            <div className="inline-block p-6 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-6">
              <Trophy className="text-white" size={64} />
            </div>
          
          <h1 className="text-5xl font-bold text-white mb-4">Workout Complete!</h1>
          <p className="text-2xl text-white/80 mb-8">You crushed it, bro! 💪</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-2xl p-6">
              <div className="text-4xl font-bold text-white mb-2">{totalRounds}</div>
              <div className="text-white/60">Rounds</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6">
              <div className="text-4xl font-bold text-white mb-2">{totalRepsCompleted}</div>
              <div className="text-white/60">Total Reps</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6">
              <div className="text-4xl font-bold text-white mb-2">4</div>
              <div className="text-white/60">Exercises</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={resetWorkout}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-2xl font-bold flex items-center gap-2"
            >
              <RotateCcw size={20} />
              Do Another Workout
            </button>
          </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export { FitnessWorkout };
export default FitnessWorkout;