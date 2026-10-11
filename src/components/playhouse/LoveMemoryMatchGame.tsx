import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Trophy, Heart } from 'lucide-react';
import { motion } from 'motion/react';

const ICONS = ['💖', '🌹', '💌', '💍', '🧸', '🥂', '🍰', '✨'];

interface CardItem {
  id: number;
  icon: string;
  matched: boolean;
}

interface MemoryMatchState {
  cards: CardItem[];
  flippedIndices: number[];
  currentTurn: string;
  matchesCount: Record<string, number>;
  status: 'playing' | 'completed';
}

function generateDeck(): CardItem[] {
  const full = [...ICONS, ...ICONS];
  // Shuffle
  for (let i = full.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [full[i], full[j]] = [full[j], full[i]];
  }
  return full.map((icon, id) => ({ id, icon, matched: false }));
}

export function LoveMemoryMatchGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<MemoryMatchState | null>(null);
  const [localFlipped, setLocalFlipped] = useState<number[]>([]);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'memory-match') : null;

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
        const initialDeck = generateDeck();
        const init: MemoryMatchState = {
          cards: initialDeck,
          flippedIndices: [],
          currentTurn: userData?.id || '',
          matchesCount: {},
          status: 'playing'
        };
        setDoc(docRef, {
          id: 'memory-match',
          coupleSpaceId: space?.id || '',
          gameType: 'memory-match',
          status: 'playing',
          currentTurn: userData?.id || '',
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/memory-match`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/memory-match`));

    return () => unsubscribe();
  }, [docRef, space?.id, userData?.id]);

  const isMyTurn = gameState?.currentTurn === userData?.id;

  const handleCardClick = (index: number) => {
    if (!docRef || !gameState || !isMyTurn || gameState.status === 'completed') return;
    if (gameState.cards[index].matched) return;
    if (localFlipped.includes(index) || localFlipped.length >= 2) return;

    sound.playPop();
    const newFlipped = [...localFlipped, index];
    setLocalFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const idx1 = newFlipped[0];
      const idx2 = newFlipped[1];
      const card1 = gameState.cards[idx1];
      const card2 = gameState.cards[idx2];

      const isMatch = card1.icon === card2.icon;

      setTimeout(() => {
        if (!gameState) return;
        let nextCards = [...gameState.cards];
        let nextMatches = { ...(gameState.matchesCount || {}) };
        let nextTurn = gameState.currentTurn;

        if (isMatch) {
          sound.playSuccess();
          nextCards[idx1].matched = true;
          nextCards[idx2].matched = true;
          const myId = userData?.id || 'me';
          nextMatches[myId] = (nextMatches[myId] || 0) + 1;
        } else {
          // Switch turn
          nextTurn = (partnerData?.id && nextTurn === userData?.id) ? partnerData.id : (userData?.id || '');
        }

        const allMatched = nextCards.every(c => c.matched);
        if (allMatched) {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        }

        const updated: MemoryMatchState = {
          ...gameState,
          cards: nextCards,
          flippedIndices: [],
          currentTurn: nextTurn,
          matchesCount: nextMatches,
          status: allMatched ? 'completed' : 'playing'
        };

        updateDoc(docRef, {
          data: JSON.stringify(updated),
          status: updated.status,
          currentTurn: nextTurn,
          updatedAt: Date.now()
        }).catch(console.error);

        setLocalFlipped([]);
      }, 900);
    }
  };

  const handleRestart = () => {
    if (!docRef) return;
    sound.playChime();
    const initialDeck = generateDeck();
    const init: MemoryMatchState = {
      cards: initialDeck,
      flippedIndices: [],
      currentTurn: userData?.id || '',
      matchesCount: {},
      status: 'playing'
    };
    updateDoc(docRef, {
      data: JSON.stringify(init),
      status: 'playing',
      currentTurn: userData?.id || '',
      updatedAt: Date.now()
    }).catch(console.error);
    setLocalFlipped([]);
  };

  return (
    <div className="space-y-4">
      {/* Header Turn Tracker */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-purple-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center text-xl shadow-xs text-white">
            🃏
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {isMyTurn ? 'Your Turn to Flip 🎯' : `${partnerData?.displayName || 'Partner'}'s Turn ⏳`}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Matches: You ({gameState?.matchesCount?.[userData?.id || ''] || 0}) • {partnerData?.displayName || 'Partner'} ({gameState?.matchesCount?.[partnerData?.id || ''] || 0})
            </p>
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>
      </div>

      {/* 4x4 Grid of Memory Tiles */}
      <div className="bg-white rounded-3xl p-4 border border-purple-100 shadow-md">
        <div className="grid grid-cols-4 gap-2.5">
          {gameState?.cards?.map((card, idx) => {
            const isFlipped = localFlipped.includes(idx) || card.matched;
            return (
              <motion.button
                key={card.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-2xl flex items-center justify-center text-2xl font-bold border-2 transition-all ${
                  card.matched
                    ? 'bg-emerald-50 border-emerald-300 opacity-90'
                    : isFlipped
                    ? 'bg-rose-50 border-rose-400 shadow-sm'
                    : 'bg-gradient-to-tr from-purple-100 to-pink-100 border-purple-200 hover:border-purple-400 cursor-pointer'
                }`}
              >
                {isFlipped ? card.icon : '💌'}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Completion Modal */}
      {gameState?.status === 'completed' && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white text-center shadow-lg space-y-2">
          <Trophy className="w-8 h-8 mx-auto text-amber-300" />
          <h3 className="font-bold text-sm">Board Cleared! Match Masters!</h3>
          <p className="text-xs text-purple-100">Every romantic token has been found together.</p>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-white text-purple-900 rounded-xl font-bold text-xs shadow-md"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
