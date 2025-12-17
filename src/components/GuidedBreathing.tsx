import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ArrowLeft, Wind } from 'lucide-react';
import AmaniMemoji from './AmaniMemoji';
import './GuidedBreathing.css';

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale' | 'rest';

interface BreathingTechnique {
  id: string;
  name: string;
  shortName: string;
  helpsWith: string;
  memoji: string;
  inhale: number;
  hold: number;
  exhale: number;
  rest: number;
  cycles: number;
}

const techniques: BreathingTechnique[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    shortName: 'Box',
    helpsWith: 'Stress & Focus',
    memoji: 'needFocus',
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
    cycles: 4
  },
  {
    id: 'fourSevenEight',
    name: '4-7-8 Relaxation',
    shortName: '4-7-8',
    helpsWith: 'Anxiety & Sleep',
    memoji: 'cantSleep',
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 2,
    cycles: 4
  },
  {
    id: 'panic',
    name: 'Panic Relief',
    shortName: 'Panic',
    helpsWith: 'Panic Attacks',
    memoji: 'panicAnxiety',
    inhale: 4,
    hold: 2,
    exhale: 6,
    rest: 2,
    cycles: 6
  },
  {
    id: 'extended',
    name: '3-6 Extended Exhale',
    shortName: '3-6',
    helpsWith: 'Overwhelm',
    memoji: 'overwhelmed',
    inhale: 3,
    hold: 0,
    exhale: 6,
    rest: 2,
    cycles: 5
  },
  {
    id: 'belly',
    name: 'Belly Breathing',
    shortName: 'Belly',
    helpsWith: 'Grounding',
    memoji: 'needGrounding',
    inhale: 4,
    hold: 2,
    exhale: 4,
    rest: 2,
    cycles: 5
  },
  {
    id: 'equal',
    name: 'Equal Breathing',
    shortName: 'Equal',
    helpsWith: 'Daily Calm',
    memoji: 'okay',
    inhale: 4,
    hold: 0,
    exhale: 4,
    rest: 2,
    cycles: 6
  },
  {
    id: 'heartRacing',
    name: 'Heart Calming',
    shortName: 'Heart',
    helpsWith: 'Racing Heart',
    memoji: 'heartRacing',
    inhale: 5,
    hold: 3,
    exhale: 7,
    rest: 3,
    cycles: 4
  },
  {
    id: 'simple',
    name: 'Simple Breath',
    shortName: 'Simple',
    helpsWith: 'Beginners',
    memoji: 'good',
    inhale: 3,
    hold: 0,
    exhale: 3,
    rest: 2,
    cycles: 5
  }
];

interface GuidedBreathingProps {
  initialExercise?: string;
}

const GuidedBreathing = ({ initialExercise }: GuidedBreathingProps) => {
  const [screen, setScreen] = useState<'select' | 'breathing' | 'complete'>('select');
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>(
    techniques.find(t => t.id === initialExercise) || techniques[0]
  );
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [timer, setTimer] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioCache = useRef<Map<string, Blob>>(new Map());
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true); // Track if component is mounted

  // Cleanup function to stop all audio
  const stopAllAudio = () => {
    console.log('🛑 GuidedBreathing: Stopping all audio...');
    
    // Stop any playing audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    
    // Cancel browser speech synthesis
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Also cancel via ref
    if (speechSynthRef.current && speechSynthRef.current.speaking) {
      speechSynthRef.current.cancel();
    }
    
    // Abort any pending fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsSpeaking(false);
    isRunningRef.current = false;
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
    }
    
    if (initialExercise) {
      const technique = techniques.find(t => t.id === initialExercise);
      if (technique) {
        setSelectedTechnique(technique);
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      console.log('🧹 GuidedBreathing unmounting - cleaning up audio');
      isMountedRef.current = false;
      stopAllAudio();
    };
  }, [initialExercise]);

  // Generate speech via backend proxy
  const generateSpeech = async (text: string): Promise<Blob> => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://mind-brother-production.up.railway.app';
    
    abortControllerRef.current = new AbortController();
    
    const response = await fetch(`${backendUrl}/api/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_id: '1YBpxMFAafA83t7u1xof'
      }),
      signal: abortControllerRef.current.signal
    });

    if (!response.ok) {
      throw new Error(`TTS API failed: ${response.status}`);
    }

    return await response.blob();
  };

  // Pre-cache all breathing cues for instant playback
  const [isPreloading, setIsPreloading] = useState(false);
  
  const precacheBreathingCues = async (): Promise<boolean> => {
    const cuesToCache = [
      { text: "Let's begin. Find a comfortable position and relax your shoulders.", key: 'intro' },
      { text: 'Breathe in', key: 'inhale' },
      { text: 'Hold', key: 'hold' },
      { text: 'Breathe out', key: 'exhale' },
      { text: 'Exercise complete. You did great.', key: 'complete' }
    ];

    console.log('🔄 Pre-caching breathing voice cues...');
    setIsPreloading(true);

    try {
      // Fetch all audio in parallel for faster loading
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
        console.warn(`⚠️ ${failures.length} cues failed to cache, will use browser speech`);
      }

      setIsPreloading(false);
      return failures.length < cuesToCache.length; // Success if at least some cached
    } catch (error) {
      console.error('❌ Pre-cache failed:', error);
      setIsPreloading(false);
      return false;
    }
  };

  const playAudioBlob = async (blob: Blob): Promise<void> => {
    // Don't play if component is unmounted
    if (!isMountedRef.current) {
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // Track current audio for cleanup
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        setIsSpeaking(false);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        setIsSpeaking(false);
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
        setIsSpeaking(false);
        reject(error);
      });
    });
  };

  const speakWithBrowser = async (text: string): Promise<void> => {
    // Don't speak if component is unmounted
    if (!isMountedRef.current) return;
    
    return new Promise<void>((resolve, reject) => {
      const synth = speechSynthRef.current || window.speechSynthesis;
      
      if (!synth) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      if (synth.speaking) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to select a male voice for consistency
      const voices = synth.getVoices();
      const maleVoice = voices.find(voice => 
        voice.name.includes('Male') || 
        voice.name.includes('David') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('James')
      );
      
      if (maleVoice) {
        utterance.voice = maleVoice;
      } else {
        utterance.pitch = 0.85; // Lower pitch if no male voice
      }
      
      utterance.rate = 0.85;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        reject();
      };

      synth.speak(utterance);
    });
  };

  const speak = async (text: string, cacheKey?: string): Promise<void> => {
    // Don't speak if unmounted, voice disabled, or not running
    if (!isMountedRef.current || !voiceEnabled || !isRunningRef.current) return;

    setIsSpeaking(true);

    try {
      if (cacheKey && audioCache.current.has(cacheKey)) {
        const cachedBlob = audioCache.current.get(cacheKey)!;
        // Check mounted before playing
        if (!isMountedRef.current) {
          setIsSpeaking(false);
          return;
        }
        await playAudioBlob(cachedBlob);
        return;
      }

      const audioBlob = await generateSpeech(text);
      
      // Check if still mounted after fetch
      if (!isMountedRef.current) {
        setIsSpeaking(false);
        return;
      }
      
      if (cacheKey) {
        audioCache.current.set(cacheKey, audioBlob);
      }
      
      await playAudioBlob(audioBlob);
      
    } catch (error) {
      console.error('❌ ElevenLabs failed:', error);
      
      // Only fallback if still mounted
      if (!isMountedRef.current) {
        setIsSpeaking(false);
        return;
      }
      
      try {
        await speakWithBrowser(text);
      } catch {
        setIsSpeaking(false);
      }
    }
  };

  // Simple delay that respects pause/stop
  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = () => {
        if (!isRunningRef.current) {
          resolve();
          return;
        }
        if (Date.now() - startTime >= ms) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  };

  // Fluid countdown timer using requestAnimationFrame
  const runTimer = async (seconds: number): Promise<void> => {
    setTimer(seconds);
    
    for (let i = seconds; i > 0; i--) {
      if (!isRunningRef.current) break;
      
      // Wait for pause to be lifted
      while (isPaused && isRunningRef.current) {
        await delay(100);
      }
      
      if (!isRunningRef.current) break;
      
      setTimer(i);
      await delay(1000);
    }
    setTimer(0);
  };

  // Speak without blocking - fire and forget for phase cues
  const speakAsync = (text: string, cacheKey?: string) => {
    speak(text, cacheKey).catch(console.error);
  };

  const startBreathing = async () => {
    isRunningRef.current = true;
    setScreen('breathing');
    setCurrentCycle(1);
    setPhase('idle');
    
    // Pre-cache all voice cues for instant playback (prevents sync issues)
    if (voiceEnabled) {
      await precacheBreathingCues();
    }
    
    // Intro - wait for this one
    await speak("Let's begin. Find a comfortable position and relax your shoulders.", 'intro');
    await delay(1500);

    for (let cycle = 1; cycle <= selectedTechnique.cycles; cycle++) {
      if (!isRunningRef.current) break;
      
      setCurrentCycle(cycle);
      
      // INHALE - speak first, small delay, then timer (better sync on mobile)
      setPhase('inhale');
      speakAsync('Breathe in', 'inhale');
      await delay(200); // Allow audio to start before timer
      await runTimer(selectedTechnique.inhale);
      
      if (!isRunningRef.current) break;
      
      // HOLD (if applicable)
      if (selectedTechnique.hold > 0) {
        setPhase('hold');
        speakAsync('Hold', 'hold');
        await delay(200);
        await runTimer(selectedTechnique.hold);
      }
      
      if (!isRunningRef.current) break;
      
      // EXHALE
      setPhase('exhale');
      speakAsync('Breathe out', 'exhale');
      await delay(200);
      await runTimer(selectedTechnique.exhale);
      
      if (!isRunningRef.current) break;
      
      // REST between cycles
      if (cycle < selectedTechnique.cycles && selectedTechnique.rest > 0) {
        setPhase('rest');
        await runTimer(selectedTechnique.rest);
      }
    }
    
    if (isRunningRef.current) {
      setPhase('idle');
      await speak('Exercise complete. You did great.', 'complete');
      await delay(1000);
      setScreen('complete');
    }
    
    isRunningRef.current = false;
  };

  const stopBreathing = () => {
    isRunningRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (speechSynthRef.current?.speaking) {
      speechSynthRef.current.cancel();
    }
    setPhase('idle');
    setTimer(0);
    setIsSpeaking(false);
  };

  const resetExercise = () => {
    stopBreathing();
    setScreen('select');
    setCurrentCycle(1);
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'rest': return 'Rest';
      default: return 'Ready';
    }
  };

  // Selection Screen - Brand Colors with 2x2 Grid
  if (screen === 'select') {
    return (
      <div 
        className="min-h-screen p-4 pb-24 safe-area-inset"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #4470AD 50%, #233C67 100%)' }}
      >
        <div className="max-w-lg mx-auto tablet-max-width">
          {/* Header - Compact layout with text directly under memoji */}
          <div className="text-center mb-1 pt-0">
            <div className="inline-block">
              <AmaniMemoji expression="needGrounding" size="hero" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-0">Guided Breathing</h1>
            <p 
              className="text-3xl text-red-500 mb-0 tracking-wider"
              style={{ 
                fontFamily: "'Creepster', cursive",
                textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255,0,0,0.3)'
              }}
            >
              DON'T CRASH OUT!
            </p>
            <p className="text-white/60 text-sm mb-2">What do you need help with?</p>
          </div>

          {/* Voice Toggle */}
          <div className="flex items-center justify-between bg-white/10 backdrop-blur rounded-xl p-3 mb-3">
            <div className="flex items-center gap-2">
              {voiceEnabled ? <Volume2 className="text-white/80" size={18} /> : <VolumeX className="text-white/40" size={18} />}
              <span className="text-white/80 text-sm font-medium">Voice Guidance</span>
            </div>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`relative w-12 h-6 rounded-full transition-all ${
                voiceEnabled ? 'bg-white/30' : 'bg-white/10'
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                voiceEnabled ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* 2x2 Square Grid */}
          <div className="grid grid-cols-2 gap-3">
            {techniques.map((technique) => (
              <div
                key={technique.id}
                onClick={() => setSelectedTechnique(technique)}
                className={`aspect-square bg-white/10 backdrop-blur rounded-2xl p-3 cursor-pointer transition-all flex flex-col items-center justify-center text-center border-2 ${
                  selectedTechnique.id === technique.id 
                    ? 'border-white/50 bg-white/20 scale-[1.02]' 
                    : 'border-transparent hover:border-white/20 hover:bg-white/15'
                }`}
              >
                {/* Memoji */}
                <div className="mb-2">
                  <AmaniMemoji expression={technique.memoji} size="lg" />
                </div>
                
                {/* Helps with (now first) */}
                <p className="font-semibold text-white text-sm leading-tight mb-1">
                  {technique.helpsWith}
                </p>
                
                {/* Name (now second) */}
                <p className="text-white/50 text-xs">
                  {technique.shortName}
                </p>
                
                {/* Selected indicator */}
                {selectedTechnique.id === technique.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#4470AD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected Info */}
          <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-4 text-center">
            <h3 className="text-white font-semibold mb-1">{selectedTechnique.name}</h3>
            <p className="text-white/60 text-xs">
              {selectedTechnique.inhale}s in
              {selectedTechnique.hold > 0 && ` · ${selectedTechnique.hold}s hold`}
              {` · ${selectedTechnique.exhale}s out`}
              {` · ${selectedTechnique.cycles} cycles`}
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={startBreathing}
            disabled={isPreloading}
            className="w-full mt-4 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 bg-white text-[#233C67] hover:bg-white/90 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-wait"
          >
            {isPreloading ? (
              <>
                <div className="w-5 h-5 border-2 border-[#233C67] border-t-transparent rounded-full animate-spin" />
                Preparing Voice...
              </>
            ) : (
              <>
                <Wind size={22} />
                Start Breathing
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Breathing Screen - Brand Colors
  if (screen === 'breathing') {
    return (
      <div 
        className="min-h-screen p-4 relative safe-area-inset"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #233C67 50%, #1a1a2e 100%)' }}
      >
        {/* Voice indicator */}
        {(isSpeaking || isPreloading) && (
          <div className="breathing-voice-indicator" style={{ background: 'rgba(68, 112, 173, 0.95)' }}>
            {isPreloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading voice...</span>
              </>
            ) : (
              <>
                <div className="breathing-voice-wave">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Amani speaking...</span>
              </>
            )}
          </div>
        )}

        {/* Voice toggle */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`breathing-voice-toggle ${voiceEnabled ? 'active' : ''}`}
          style={{ 
            borderColor: '#4470AD',
            color: voiceEnabled ? 'white' : '#4470AD',
            background: voiceEnabled ? '#4470AD' : 'white'
          }}
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {voiceEnabled ? 'Voice On' : 'Voice Off'}
        </button>

        <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[80vh]">
          {/* Technique name */}
          <div className="text-white/70 text-sm font-medium mb-2">
            {selectedTechnique.name}
          </div>
          
          {/* Cycle counter */}
          <div className="text-white/50 text-sm mb-6">
            Cycle {currentCycle} of {selectedTechnique.cycles}
          </div>

          {/* Breathing circle with memoji - key forces animation restart on phase change */}
          <div 
            key={`${phase}-${currentCycle}`}
            className={`breathing-circle ${phase}`}
            style={{ 
              background: 'linear-gradient(135deg, #4470AD 0%, #233C67 100%)',
              boxShadow: '0 10px 40px rgba(68, 112, 173, 0.4)',
              '--inhale-duration': `${selectedTechnique.inhale}s`,
              '--hold-duration': `${selectedTechnique.hold}s`,
              '--exhale-duration': `${selectedTechnique.exhale}s`,
              '--rest-duration': `${selectedTechnique.rest}s`,
            } as React.CSSProperties}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <AmaniMemoji expression={selectedTechnique.memoji} size="xl" />
            </div>
          </div>

          {/* Phase label */}
          <div className="text-3xl font-bold text-white mt-8 mb-2">
            {getPhaseLabel()}
          </div>

          {/* Timer - key forces animation restart on each number */}
          {timer > 0 && (
            <div 
              key={timer}
              className="text-6xl font-bold text-white/90 mb-4"
              style={{ animation: 'timerPulse 0.3s ease-out' }}
            >
              {timer}
            </div>
          )}

          {/* Instruction */}
          <div className="text-white/60 text-center max-w-sm text-lg">
            {phase === 'inhale' && 'Breathe in slowly through your nose'}
            {phase === 'hold' && 'Hold your breath gently'}
            {phase === 'exhale' && 'Breathe out slowly through your mouth'}
            {phase === 'rest' && 'Relax and prepare for the next breath'}
            {phase === 'idle' && 'Preparing...'}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs mt-8 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${(currentCycle / selectedTechnique.cycles) * 100}%`,
                background: 'linear-gradient(90deg, #4470AD 0%, #6B8FC7 100%)'
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            >
              {isPaused ? <Play size={28} /> : <Pause size={28} />}
            </button>
            <button
              onClick={resetExercise}
              className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-red-400 transition-all"
            >
              <RotateCcw size={28} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete Screen - Brand Colors
  if (screen === 'complete') {
    const totalTime = selectedTechnique.cycles * (selectedTechnique.inhale + selectedTechnique.hold + selectedTechnique.exhale + selectedTechnique.rest);
    
    return (
      <div 
        className="min-h-screen p-6 safe-area-inset"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #4470AD 50%, #233C67 100%)' }}
      >
        <div className="max-w-lg mx-auto tablet-max-width flex flex-col items-center justify-center min-h-[80vh] text-center">
          {/* Success memoji */}
          <div className="mb-6">
            <AmaniMemoji expression="great" size="xl" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">Great Job!</h2>
          <p className="text-white/60 mb-8">You completed your breathing exercise</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{selectedTechnique.cycles}</div>
              <div className="text-white/60 text-xs">Cycles</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}</div>
              <div className="text-white/60 text-xs">Duration</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-white">{selectedTechnique.shortName}</div>
              <div className="text-white/60 text-xs">Technique</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-center mt-8 w-full max-w-sm">
            <button
              onClick={startBreathing}
              className="flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-white text-[#233C67]"
            >
              <RotateCcw size={20} />
              Again
            </button>
            <button
              onClick={resetExercise}
              className="flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-white/10 text-white"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export { GuidedBreathing };
export default GuidedBreathing;
