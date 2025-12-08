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

  // Cleanup function to stop all audio
  const stopAllAudio = () => {
    // Stop any playing audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    
    // Cancel speech synthesis
    if (speechSynthRef.current) {
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
      stopAllAudio();
    };
  }, [initialExercise]);

  // Generate speech with ElevenLabs
  const generateSpeech = async (text: string): Promise<Blob> => {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = '1YBpxMFAafA83t7u1xof';
    
    abortControllerRef.current = new AbortController();
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.75,
        },
      }),
      signal: abortControllerRef.current.signal
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API failed: ${response.status}`);
    }

    return await response.blob();
  };

  const playAudioBlob = async (blob: Blob): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // Track current audio for cleanup
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        setIsSpeaking(false);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        setIsSpeaking(false);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  };

  const speakWithBrowser = async (text: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!speechSynthRef.current) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      if (speechSynthRef.current.speaking) {
        speechSynthRef.current.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        reject();
      };

      speechSynthRef.current.speak(utterance);
    });
  };

  const speak = async (text: string, cacheKey?: string): Promise<void> => {
    if (!voiceEnabled || !isRunningRef.current) return;

    setIsSpeaking(true);

    try {
      if (cacheKey && audioCache.current.has(cacheKey)) {
        const cachedBlob = audioCache.current.get(cacheKey)!;
        await playAudioBlob(cachedBlob);
        return;
      }

      const audioBlob = await generateSpeech(text);
      
      if (cacheKey) {
        audioCache.current.set(cacheKey, audioBlob);
      }
      
      await playAudioBlob(audioBlob);
      
    } catch (error) {
      console.error('❌ ElevenLabs failed:', error);
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
    
    // Intro - wait for this one
    await speak("Let's begin. Find a comfortable position and relax your shoulders.", 'intro');
    await delay(1500);

    for (let cycle = 1; cycle <= selectedTechnique.cycles; cycle++) {
      if (!isRunningRef.current) break;
      
      setCurrentCycle(cycle);
      
      // INHALE - speak and start timer simultaneously
      setPhase('inhale');
      speakAsync('Breathe in', 'inhale');
      await runTimer(selectedTechnique.inhale);
      
      if (!isRunningRef.current) break;
      
      // HOLD (if applicable)
      if (selectedTechnique.hold > 0) {
        setPhase('hold');
        speakAsync('Hold', 'hold');
        await runTimer(selectedTechnique.hold);
      }
      
      if (!isRunningRef.current) break;
      
      // EXHALE
      setPhase('exhale');
      speakAsync('Breathe out', 'exhale');
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
          {/* Header */}
          <div className="text-center mb-6 pt-4">
            <div className="inline-block mb-3">
              <AmaniMemoji expression="needGrounding" size="xl" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Guided Breathing</h1>
            <p 
              className="text-3xl text-red-500 mb-2 tracking-wider"
              style={{ 
                fontFamily: "'Creepster', cursive",
                textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255,0,0,0.3)'
              }}
            >
              DON'T CRASH OUT!
            </p>
            <p className="text-white/60 text-sm">What do you need help with?</p>
          </div>

          {/* Voice Toggle */}
          <div className="flex items-center justify-between bg-white/10 backdrop-blur rounded-xl p-3 mb-5">
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
                
                {/* Name */}
                <h3 className="font-semibold text-white text-sm leading-tight mb-1">
                  {technique.shortName}
                </h3>
                
                {/* Helps with */}
                <p className="text-white/60 text-xs">
                  {technique.helpsWith}
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
            className="w-full mt-4 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 bg-white text-[#233C67] hover:bg-white/90 hover:scale-[1.02]"
          >
            <Wind size={22} />
            Start Breathing
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
        {isSpeaking && (
          <div className="breathing-voice-indicator" style={{ background: 'rgba(68, 112, 173, 0.95)' }}>
            <div className="breathing-voice-wave">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>Amani speaking...</span>
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
