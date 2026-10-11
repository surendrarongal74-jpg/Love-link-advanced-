import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DILEMMAS = [
  {
    optionA: 'Spend every weekend together exploring new cities',
    optionB: 'Have an ultra-luxurious home cinema setup and stay in every weekend'
  },
  {
    optionA: 'Always know what your partner is thinking at any moment',
    optionB: 'Always know the exact gift that will make them cry tears of joy'
  },
  {
    optionA: 'Be able to teleport anywhere on Earth for a 2-hour date',
    optionB: 'Freeze time for 24 hours so the two of you get an uninterrupted day off'
  },
  {
    optionA: 'Cook a 5-course gourmet meal together from scratch every night',
    optionB: 'Have an endless unlimited budget for dining at any romantic restaurant'
  },
  {
    optionA: 'Live in a picturesque seaside villa overlooking dolphins',
    optionB: 'Live in a secluded mountain chalet with a warm cedar hot tub'
  }
];

interface WYRState {
  dilemmaIndex: number;
  picks: Record<string, 'A' | 'B'>;
}

export function WouldYouRatherGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<WYRState | null>(null);
  const navigate = useNavigate();

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'would-you-rather') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            setGameState(JSON.parse(data.data));
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        const init: WYRState = {
          dilemmaIndex: 0,
          picks: {}
        };
        setDoc(docRef, {
          id: 'would-you-rather',
          coupleSpaceId: space?.id || '',
          gameType: 'would-you-rather',
          status: 'playing',
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/would-you-rather`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/would-you-rather`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const current = DILEMMAS[(gameState?.dilemmaIndex || 0) % DILEMMAS.length];
  const myPick = userData?.id ? gameState?.picks?.[userData.id] : undefined;
  const partnerPick = partnerData?.id ? gameState?.picks?.[partnerData.id] : undefined;

  const isBothPicked = Boolean(myPick && partnerPick);

  const handlePick = (choice: 'A' | 'B') => {
    if (!docRef || !gameState || !userData?.id || myPick) return;
    sound.playPop();

    const newPicks = {
      ...(gameState.picks || {}),
      [userData.id]: choice
    };

    if (partnerData?.id && newPicks[partnerData.id]) {
      sound.playSuccess();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }

    const updated: WYRState = {
      ...gameState,
      picks: newPicks
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      updatedAt: Date.now()
    }).catch(console.error);
  };

  const handleNext = () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    const nextIdx = (gameState.dilemmaIndex + 1) % DILEMMAS.length;
    const init: WYRState = {
      dilemmaIndex: nextIdx,
      picks: {}
    };
    updateDoc(docRef, {
      data: JSON.stringify(init),
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-fuchsia-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-rose-600 flex items-center justify-center text-xl shadow-xs text-white">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                Dilemma #{((gameState?.dilemmaIndex || 0) % DILEMMAS.length) + 1}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Pick your scenario and see if you match!</p>
          </div>
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 border border-fuchsia-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Next Dilemma</span>
        </button>
      </div>

      {/* 2 Big Choice Cards */}
      <div className="space-y-3">
        {/* Option A */}
        <button
          onClick={() => handlePick('A')}
          disabled={Boolean(myPick)}
          className={`w-full p-5 rounded-3xl border-2 text-left transition-all active:scale-[0.98] ${
            myPick === 'A'
              ? 'bg-fuchsia-600 text-white border-fuchsia-700 shadow-md'
              : 'bg-white hover:bg-fuchsia-50/50 text-gray-900 border-fuchsia-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-fuchsia-400">
              Option A
            </span>
            {myPick === 'A' && <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">Your Choice</span>}
          </div>
          <p className="font-serif text-sm font-bold leading-relaxed">{current.optionA}</p>
        </button>

        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
          <span className="w-12 h-px bg-gray-200" />
          <span>OR</span>
          <span className="w-12 h-px bg-gray-200" />
        </div>

        {/* Option B */}
        <button
          onClick={() => handlePick('B')}
          disabled={Boolean(myPick)}
          className={`w-full p-5 rounded-3xl border-2 text-left transition-all active:scale-[0.98] ${
            myPick === 'B'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md'
              : 'bg-white hover:bg-rose-50/50 text-gray-900 border-rose-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400">
              Option B
            </span>
            {myPick === 'B' && <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">Your Choice</span>}
          </div>
          <p className="font-serif text-sm font-bold leading-relaxed">{current.optionB}</p>
        </button>
      </div>

      {/* Match Outcome Box */}
      {isBothPicked && (
        <div className="bg-white rounded-3xl p-5 border border-fuchsia-200 shadow-lg text-center space-y-3">
          <div className="text-2xl">
            {myPick === partnerPick ? '💖 100% Match!' : '✨ Different Perspectives!'}
          </div>
          <p className="text-xs text-gray-700">
            {myPick === partnerPick
              ? `You both chose Option ${myPick}! Soulmate synergy confirmed!`
              : `You picked Option ${myPick}, while ${partnerData?.displayName || 'partner'} picked Option ${partnerPick}.`}
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-xl text-xs font-bold border border-fuchsia-200 inline-flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discuss this in Chat</span>
          </button>
        </div>
      )}
    </div>
  );
}
