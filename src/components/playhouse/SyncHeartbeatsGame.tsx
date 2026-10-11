import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Heart, Activity, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface PulseState {
  taps: Record<string, number>; // userId -> timestamp
  resonance: number;
  streak: number;
  lastSyncAt: number;
}

export function SyncHeartbeatsGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [pulseState, setPulseState] = useState<PulseState | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'sync-pulse') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            setPulseState(JSON.parse(data.data));
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        const init: PulseState = {
          taps: {},
          resonance: 75,
          streak: 0,
          lastSyncAt: Date.now()
        };
        setDoc(docRef, {
          id: 'sync-pulse',
          coupleSpaceId: space?.id || '',
          gameType: 'sync-pulse',
          status: 'playing',
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/sync-pulse`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/sync-pulse`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const handlePulseTap = () => {
    if (!docRef || !pulseState || !userData?.id) return;
    sound.heartbeat();
    setIsPressing(true);
    setTimeout(() => setIsPressing(false), 250);

    const now = Date.now();
    const partnerTapTime = partnerData?.id ? (pulseState.taps[partnerData.id] || 0) : 0;
    const diff = Math.abs(now - partnerTapTime);

    let nextResonance = pulseState.resonance;
    let nextStreak = pulseState.streak;

    // If tapped within 1.2s of partner
    if (partnerTapTime > 0 && diff < 1200) {
      nextResonance = Math.min(100, nextResonance + 5);
      nextStreak += 1;
      sound.playSuccess();
      if (nextResonance === 100) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    } else {
      nextResonance = Math.max(50, nextResonance - 2);
    }

    const updated: PulseState = {
      taps: {
        ...pulseState.taps,
        [userData.id]: now
      },
      resonance: nextResonance,
      streak: nextStreak,
      lastSyncAt: now
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      updatedAt: now
    }).catch(console.error);
  };

  const partnerIsTouching = Boolean(
    partnerData?.id && 
    pulseState?.taps[partnerData.id] && 
    (Date.now() - pulseState.taps[partnerData.id]) < 2000
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-rose-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-xl shadow-xs text-white">
            💓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">Heart Resonance: {pulseState?.resonance || 75}%</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Streak: {pulseState?.streak || 0}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Tap together simultaneously to sync frequencies!</p>
          </div>
        </div>
      </div>

      {/* Synchronized Pulsing Chamber */}
      <div className="bg-gradient-to-b from-rose-950 via-slate-900 to-black rounded-3xl p-8 text-center text-white relative overflow-hidden shadow-2xl space-y-6">
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest">Live Bio-Resonance Sensor</span>
          <h2 className="text-lg font-bold font-serif text-white">Feel Each Other's Touch</h2>
          <p className="text-xs text-rose-200/80">
            {partnerIsTouching ? (
              <span className="text-emerald-400 font-bold animate-pulse">✨ {partnerData?.displayName || 'Partner'} is touching the heart right now!</span>
            ) : (
              `Tap the heart to send a pulse to ${partnerData?.displayName || 'partner'}`
            )}
          </p>
        </div>

        {/* Giant Interactive Pulse Heart */}
        <div className="relative flex items-center justify-center py-6">
          <motion.div
            animate={{ scale: isPressing ? 1.25 : [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="w-36 h-36 rounded-full bg-rose-500/20 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            onClick={handlePulseTap}
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-[0_0_50px_rgba(244,63,94,0.6)]">
              <Heart className={`w-14 h-14 text-white fill-white transition-transform ${isPressing ? 'scale-110' : ''}`} />
            </div>
          </motion.div>
        </div>

        {/* Resonance Gauge */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-xs text-rose-300 font-semibold px-2">
            <span>Harmony Level</span>
            <span>{pulseState?.resonance || 75}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5 border border-white/20">
            <div
              className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${pulseState?.resonance || 75}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
