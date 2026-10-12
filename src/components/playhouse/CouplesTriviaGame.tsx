import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { generateAiraGameContent } from '../../lib/ai';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Trophy, CheckCircle2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_QUESTIONS = [
  {
    q: 'What is my favorite comfort food on a gloomy day?',
    options: ['Creamy mac and cheese', 'Spicy hot ramen noodles', 'Cheesy loaded pizza', 'Warm chocolate fudge brownies'],
    correct: 1
  },
  {
    q: 'What time was our first official date?',
    options: ['Brunch around 11:30 AM', 'Coffee meetup at 3:00 PM', 'Dinner reservation at 7:30 PM', 'Late night drinks at 9:00 PM'],
    correct: 2
  },
  {
    q: 'What is the habit I do whenever I am nervous or thinking deeply?',
    options: ['Bite my lip or play with hair', 'Tap my feet rapidly', 'Check my phone repeatedly', 'Fidget with my keys or ring'],
    correct: 0
  },
  {
    q: 'Where did we take our very first cute selfie together?',
    options: ['In the car driving', 'At a scenic park or viewpoint', 'At the cozy cafe table', 'In an elevator mirror'],
    correct: 2
  }
];

interface TriviaItem {
  q: string;
  options: string[];
  correct: number;
}

interface TriviaState {
  level: number;
  currentTrivia: TriviaItem;
  userAnswers: Record<string, number>; // userId -> option index
  scores: Record<string, number>;
  revealed: boolean;
}

export function CouplesTriviaGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<TriviaState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'couples-trivia') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            setGameState(JSON.parse(data.data));
          } catch (e) {
            console.error('CouplesTrivia parsing error:', e);
          }
        }
      } else {
        const init: TriviaState = {
          level: 1,
          currentTrivia: FALLBACK_QUESTIONS[0],
          userAnswers: {},
          scores: {},
          revealed: false
        };
        setDoc(docRef, {
          id: 'couples-trivia',
          coupleSpaceId: space?.id || '',
          gameType: 'couples-trivia',
          status: 'playing',
          round: 1,
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/couples-trivia`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/couples-trivia`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const currentQ = gameState?.currentTrivia || FALLBACK_QUESTIONS[0];
  const myPick = userData?.id ? gameState?.userAnswers?.[userData.id] : undefined;
  const partnerPick = partnerData?.id ? gameState?.userAnswers?.[partnerData.id] : undefined;

  const handlePick = (idx: number) => {
    if (!docRef || !gameState || !userData?.id || myPick !== undefined) return;
    sound.playPop();

    const newAnswers = {
      ...(gameState.userAnswers || {}),
      [userData.id]: idx
    };

    const isPartnerLocked = partnerData?.id && newAnswers[partnerData.id] !== undefined;
    let nextScores = { ...(gameState.scores || {}) };

    if (isPartnerLocked) {
      sound.playSuccess();
      if (idx === currentQ.correct) {
        nextScores[userData.id] = (nextScores[userData.id] || 0) + 10;
      }
      if (newAnswers[partnerData.id] === currentQ.correct) {
        nextScores[partnerData.id] = (nextScores[partnerData.id] || 0) + 10;
      }
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
    }

    const updated: TriviaState = {
      ...gameState,
      userAnswers: newAnswers,
      scores: nextScores,
      revealed: Boolean(isPartnerLocked)
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: isPartnerLocked ? 'revealed' : 'playing',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  const handleNextLevel = async () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    setIsGenerating(true);

    const nextLevel = (gameState.level || 1) + 1;
    let nextQ: TriviaItem = FALLBACK_QUESTIONS[nextLevel % FALLBACK_QUESTIONS.length];

    try {
      const airaItem = await generateAiraGameContent<TriviaItem>('couples-trivia', nextLevel);
      if (airaItem?.q && Array.isArray(airaItem?.options) && typeof airaItem?.correct === 'number') {
        nextQ = airaItem;
      }
    } catch (e) {
      console.warn('AIRA generation failed for trivia:', e);
    } finally {
      setIsGenerating(false);
    }

    const updated: TriviaState = {
      level: nextLevel,
      currentTrivia: nextQ,
      userAnswers: {},
      scores: gameState.scores || {},
      revealed: false
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: 'playing',
      round: nextLevel,
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-blue-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl shadow-xs text-white">
            👑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                Trivia Level {gameState?.level || 1}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Unlimited by AIRA
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Scores: You ({gameState?.scores?.[userData?.id || ''] || 0}) • {partnerData?.displayName || 'Partner'} ({gameState?.scores?.[partnerData?.id || ''] || 0})
            </p>
          </div>
        </div>

        <button
          onClick={handleNextLevel}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{isGenerating ? 'AIRA Level...' : 'Next Level'}</span>
        </button>
      </div>

      {/* Question Card */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-3xl p-5 border border-blue-200 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Level {gameState?.level || 1} Challenge</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">10 pts</span>
        </div>
        
        <h2 className="text-base font-bold font-serif text-gray-900 text-center leading-snug">
          "{currentQ.q}"
        </h2>

        <div className="grid grid-cols-1 gap-2 pt-2">
          {currentQ.options.map((opt, idx) => {
            const isSelected = myPick === idx;
            const isPartnerSelected = partnerPick === idx;
            const isCorrect = idx === currentQ.correct;

            return (
              <button
                key={opt}
                disabled={myPick !== undefined}
                onClick={() => handlePick(idx)}
                className={`p-3.5 rounded-xl text-left text-xs font-medium border transition-all relative ${
                  gameState?.revealed && isCorrect
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold'
                    : isSelected
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-semibold'
                    : 'bg-white hover:bg-blue-50 text-gray-800 border-blue-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {gameState?.revealed && (
                    <span className="flex items-center gap-1 text-[10px]">
                      {isCorrect && <span>✅ Correct</span>}
                      {isPartnerSelected && <span className="bg-white/20 px-1.5 py-0.5 rounded">Partner Pick</span>}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {myPick !== undefined && !gameState?.revealed && (
          <p className="text-xs text-center text-blue-600 font-semibold animate-pulse">
            Your answer is locked! Waiting for {partnerData?.displayName || 'partner'} to answer...
          </p>
        )}

        {gameState?.revealed && (
          <div className="pt-2 text-center">
            <button
              onClick={handleNextLevel}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md active:scale-95 transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'AIRA Generating Level...' : `Continue to Level ${(gameState?.level || 1) + 1}`}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
