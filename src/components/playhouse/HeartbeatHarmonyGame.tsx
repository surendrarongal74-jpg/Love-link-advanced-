import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { generateAiraGameContent } from '../../lib/ai';
import confetti from 'canvas-confetti';
import { Heart, Activity, Sparkles, RefreshCw, Wand2, Music2, Flame, Award, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RhythmTrack {
  songTitle: string;
  artistStyle: string;
  bpm: number;
  lyricCue: string;
  targetSyncPercent: number;
  romanticReward: string;
}

const FALLBACK_TRACKS: RhythmTrack[] = [
  {
    songTitle: "Midnight Starlight Waltz",
    artistStyle: "Dreamy Lo-fi Acoustic",
    bpm: 72,
    lyricCue: "Two hearts beating in a crowded room...",
    targetSyncPercent: 85,
    romanticReward: "10-minute foot massage & slow dance"
  },
  {
    songTitle: "Electric Sunset Groove",
    artistStyle: "Upbeat Indie Pop",
    bpm: 96,
    lyricCue: "I can feel your pulse through the telephone wire...",
    targetSyncPercent: 90,
    romanticReward: "Spontaneous ice cream parlor date"
  },
  {
    songTitle: "Cosmic Heart Pulse",
    artistStyle: "Synthwave Romance",
    bpm: 110,
    lyricCue: "Synchronize the frequency, don't let go...",
    targetSyncPercent: 92,
    romanticReward: "Breakfast in bed with warm croissants"
  }
];

interface HarmonyGameState {
  level: number;
  currentTrack: RhythmTrack;
  taps: Record<string, number>; // userId -> timestamp
  scores: Record<string, number>; // userId -> individual score
  syncPercentage: number;
  comboStreak: number;
  status: 'playing' | 'synced' | 'cleared';
  lastTapDiffMs?: number | null;
}

export function HeartbeatHarmonyGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<HarmonyGameState | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [isGeneratingLevel, setIsGeneratingLevel] = useState(false);
  const [beatPulse, setBeatPulse] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'rhythm-sync') : null;

  // Synthesize musical harmonic beep on tempo
  const playHarmonicTone = (freq: number = 440, type: OscillatorType = 'sine') => {
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (!audioCtxRef.current) return;

      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.35);
    } catch {
      sound.heartbeat();
    }
  };

  // Metronome beat interval based on current BPM
  useEffect(() => {
    const bpm = gameState?.currentTrack?.bpm || 75;
    const intervalMs = Math.round((60 / bpm) * 1000);

    const interval = setInterval(() => {
      setBeatPulse(prev => !prev);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [gameState?.currentTrack?.bpm]);

  // Firestore sync listener
  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            setGameState(JSON.parse(data.data));
          } catch (e) {
            console.error('Rhythm parse error:', e);
          }
        }
      } else {
        const init: HarmonyGameState = {
          level: 1,
          currentTrack: FALLBACK_TRACKS[0],
          taps: {},
          scores: {},
          syncPercentage: 70,
          comboStreak: 0,
          status: 'playing'
        };
        setDoc(docRef, {
          id: 'rhythm-sync',
          coupleSpaceId: space?.id || '',
          gameType: 'rhythm-sync',
          status: 'playing',
          round: 1,
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/rhythm-sync`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/rhythm-sync`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const currentTrack = gameState?.currentTrack || FALLBACK_TRACKS[0];

  const handlePulseTap = () => {
    if (!docRef || !gameState || !userData?.id) return;
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 200);

    const now = Date.now();
    const partnerTap = partnerData?.id ? (gameState.taps[partnerData.id] || 0) : 0;
    const diffMs = Math.abs(now - partnerTap);

    let nextSync = gameState.syncPercentage || 70;
    let nextStreak = gameState.comboStreak || 0;
    let nextStatus: 'playing' | 'synced' | 'cleared' = gameState.status;

    // Harmonic feedback
    if (partnerTap > 0 && diffMs <= 350) {
      // Perfect Sync!
      playHarmonicTone(587.33, 'triangle'); // D5 note
      nextSync = Math.min(100, nextSync + 8);
      nextStreak += 1;
      if (nextSync >= currentTrack.targetSyncPercent) {
        nextStatus = 'cleared';
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        sound.success();
      }
    } else if (partnerTap > 0 && diffMs <= 850) {
      // Good Sync!
      playHarmonicTone(440, 'sine'); // A4 note
      nextSync = Math.min(100, nextSync + 4);
      nextStreak += 1;
    } else {
      // Solo tap / off-beat
      playHarmonicTone(329.63, 'sine'); // E4 note
      nextSync = Math.max(50, nextSync - 2);
      nextStreak = 0;
    }

    const updated: HarmonyGameState = {
      ...gameState,
      taps: {
        ...gameState.taps,
        [userData.id]: now
      },
      scores: {
        ...gameState.scores,
        [userData.id]: (gameState.scores?.[userData.id] || 0) + 10
      },
      syncPercentage: nextSync,
      comboStreak: nextStreak,
      status: nextStatus,
      lastTapDiffMs: partnerTap > 0 ? diffMs : null
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: nextStatus,
      updatedAt: now
    }).catch(console.error);
  };

  // Next level via AIRA endless generator
  const handleNextAiraLevel = async () => {
    if (!docRef || !gameState) return;
    sound.chime();
    setIsGeneratingLevel(true);

    const nextLevelNum = (gameState.level || 1) + 1;
    let nextTrack: RhythmTrack = FALLBACK_TRACKS[(nextLevelNum - 1) % FALLBACK_TRACKS.length];

    try {
      const airaLevel = await generateAiraGameContent<RhythmTrack>('rhythm-sync', nextLevelNum);
      if (airaLevel?.songTitle && airaLevel?.bpm) {
        nextTrack = airaLevel;
      }
    } catch (e) {
      console.warn('AIRA rhythm generation failed, using fallback:', e);
    } finally {
      setIsGeneratingLevel(false);
    }

    const updated: HarmonyGameState = {
      level: nextLevelNum,
      currentTrack: nextTrack,
      taps: {},
      scores: gameState.scores || {},
      syncPercentage: 70,
      comboStreak: 0,
      status: 'playing',
      lastTapDiffMs: null
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: 'playing',
      round: nextLevelNum,
      updatedAt: Date.now()
    }).catch(console.error);
  };

  const partnerIsTappingNow = Boolean(
    partnerData?.id &&
    gameState?.taps[partnerData.id] &&
    (Date.now() - gameState.taps[partnerData.id]) < 1800
  );

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-rose-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-xl shadow-xs text-white">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                Symphony Level {gameState?.level || 1}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500" />
                <span>{gameState?.comboStreak || 0}x Sync Combo</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium truncate max-w-[210px]">
              {currentTrack.songTitle} • {currentTrack.bpm} BPM
            </p>
          </div>
        </div>

        <button
          onClick={handleNextAiraLevel}
          disabled={isGeneratingLevel}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
        >
          {isGeneratingLevel ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          <span>{isGeneratingLevel ? 'AIRA...' : 'Next Track'}</span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="bg-gradient-to-b from-rose-950 via-slate-900 to-black rounded-3xl p-6 text-center text-white relative overflow-hidden shadow-2xl space-y-5">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">
              Level {gameState?.level || 1} • {currentTrack.artistStyle}
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-white">
            "{currentTrack.lyricCue}"
          </h2>
          <p className="text-xs text-rose-200/80">
            {partnerIsTappingNow ? (
              <span className="text-emerald-400 font-bold animate-pulse flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{partnerData?.displayName || 'Partner'} is tapping the beat right now!</span>
              </span>
            ) : (
              `Tap the pulse heart together within the ${currentTrack.bpm} BPM rhythm window`
            )}
          </p>
        </div>

        {/* Visual Waveform Frequency Bar */}
        <div className="flex items-center justify-center gap-1 py-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: beatPulse ? [8, 28, 12][i % 3] : [14, 6, 20][i % 3],
                opacity: beatPulse ? 0.9 : 0.4
              }}
              transition={{ duration: 0.3 }}
              className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 to-pink-300"
            />
          ))}
        </div>

        {/* Interactive Center Heart Pulsing Drum */}
        <div className="relative flex items-center justify-center py-4">
          <motion.div
            animate={{
              scale: isPressing ? 1.25 : beatPulse ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="w-40 h-40 rounded-full bg-rose-500/20 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            onClick={handlePulseTap}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-rose-600 via-pink-500 to-red-500 flex items-center justify-center shadow-[0_0_60px_rgba(244,63,94,0.65)] relative">
              <Heart className={`w-16 h-16 text-white fill-white transition-transform ${isPressing ? 'scale-115' : ''}`} />
              
              {/* Partner presence ring */}
              {partnerIsTappingNow && (
                <span className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-75" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Live Resonance Level Meter */}
        <div className="space-y-2 relative z-10 pt-2">
          <div className="flex justify-between text-xs text-rose-300 font-semibold px-2">
            <span>Bio-Resonance: {gameState?.syncPercentage || 70}%</span>
            <span>Target Goal: {currentTrack.targetSyncPercent}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/20">
            <div
              className="bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${gameState?.syncPercentage || 70}%` }}
            />
          </div>
        </div>

        {/* Level Cleared Victory Drawer */}
        <AnimatePresence>
          {gameState?.status === 'cleared' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-4 text-emerald-200 text-center space-y-2"
            >
              <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-sm">
                <Award className="w-5 h-5" />
                <span>Track Harmony Unlocked!</span>
              </div>
              <p className="text-xs text-white font-medium">
                Reward Earned: <strong>{currentTrack.romanticReward}</strong>
              </p>
              <button
                onClick={handleNextAiraLevel}
                disabled={isGeneratingLevel}
                className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingLevel ? 'AIRA Composing...' : `Next Track • Level ${(gameState?.level || 1) + 1}`}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
