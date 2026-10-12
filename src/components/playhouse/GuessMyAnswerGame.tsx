import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { generateAiraGameContent } from '../../lib/ai';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Lock, Unlock, CheckCircle2, Heart, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionCard {
  question: string;
  category: 'Romantic' | 'Quirky' | 'Deep' | 'Naughty';
  options: string[];
}

const FALLBACK_CARDS: QuestionCard[] = [
  {
    question: 'Where would our dream spontaneous weekend getaway be?',
    category: 'Romantic',
    options: ['Cozy mountain cabin with fireplace', 'Secluded sunlit tropical beach', 'Vibrant cultural city boutique hotel', 'Scenic lakeside glamping tent']
  },
  {
    question: 'What is our ultimate comfort dinner together?',
    category: 'Quirky',
    options: ['Fresh handmade pasta & red wine', 'Late-night hot cheesy pizza & movies', 'Street tacos & cold drinks', 'Fancy sushi tasting menu']
  },
  {
    question: 'Which sweet trait made you fall in love the hardest?',
    category: 'Deep',
    options: ['Your warm contagious laugh', 'The way you care for people', 'Your deep soothing eyes', 'Your playful silly sense of humor']
  },
  {
    question: 'If we had an entire free Sunday with zero phones, what are we doing?',
    category: 'Romantic',
    options: ['Cuddling in bed all morning & reading', 'Exploring a hidden hiking trail', 'Cooking a lavish meal together', 'Road trip with no destination']
  },
  {
    question: 'What is the absolute best way to kiss you?',
    category: 'Naughty',
    options: ['Slow gentle forehead kiss', 'Passionate neck kiss unexpectedly', 'Deep romantic kiss in the rain', 'Playful lingering kiss before sleep']
  }
];

interface GuessAnswerState {
  level: number;
  currentCard: QuestionCard;
  userChoices: Record<string, { myAnswer: string; predictedPartnerAnswer: string }>;
  revealed: boolean;
  score: number;
}

export function GuessMyAnswerGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<GuessAnswerState | null>(null);

  const [selectedMyAnswer, setSelectedMyAnswer] = useState<string>('');
  const [selectedPartnerPrediction, setSelectedPartnerPrediction] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'guess-answer') : null;

  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            const parsed = JSON.parse(data.data) as GuessAnswerState;
            setGameState(parsed);
            
            // Populate my previous choices if present
            if (userData?.id && parsed.userChoices?.[userData.id]) {
              setSelectedMyAnswer(parsed.userChoices[userData.id].myAnswer);
              setSelectedPartnerPrediction(parsed.userChoices[userData.id].predictedPartnerAnswer);
            }
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        const init: GuessAnswerState = {
          level: 1,
          currentCard: FALLBACK_CARDS[0],
          userChoices: {},
          revealed: false,
          score: 0
        };
        setDoc(docRef, {
          id: 'guess-answer',
          coupleSpaceId: space?.id || '',
          gameType: 'guess-answer',
          status: 'playing',
          round: 1,
          data: JSON.stringify(init),
          scores: JSON.stringify({}),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/guess-answer`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/guess-answer`));

    return () => unsubscribe();
  }, [docRef, space?.id, userData?.id]);

  const currentCard = gameState?.currentCard || FALLBACK_CARDS[0];
  const myChoices = userData?.id ? gameState?.userChoices?.[userData.id] : null;
  const partnerChoices = partnerData?.id ? gameState?.userChoices?.[partnerData.id] : null;

  const bothAnswered = Boolean(myChoices && partnerChoices);
  const isRevealed = gameState?.revealed || bothAnswered;

  const handleLockChoices = () => {
    if (!docRef || !gameState || !userData?.id || !selectedMyAnswer || !selectedPartnerPrediction) return;
    sound.playChime();

    const newUserChoices = {
      ...(gameState.userChoices || {}),
      [userData.id]: {
        myAnswer: selectedMyAnswer,
        predictedPartnerAnswer: selectedPartnerPrediction
      }
    };

    const willBothBeLocked = partnerData?.id && newUserChoices[partnerData.id];
    let bonusScore = gameState.score || 0;

    if (willBothBeLocked) {
      sound.playSuccess();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      const p1Answer = newUserChoices[userData.id].myAnswer;
      const p2PredictedP1 = newUserChoices[partnerData.id].predictedPartnerAnswer;
      if (p1Answer === p2PredictedP1) bonusScore += 50;

      const p2Answer = newUserChoices[partnerData.id].myAnswer;
      const p1PredictedP2 = newUserChoices[userData.id].predictedPartnerAnswer;
      if (p2Answer === p1PredictedP2) bonusScore += 50;
    }

    const updated: GuessAnswerState = {
      ...gameState,
      userChoices: newUserChoices,
      revealed: Boolean(willBothBeLocked),
      score: bonusScore
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: willBothBeLocked ? 'revealed' : 'playing',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  const handleNextLevel = async () => {
    if (!docRef || !gameState) return;
    sound.playPop();
    setIsGenerating(true);
    setSelectedMyAnswer('');
    setSelectedPartnerPrediction('');

    const nextLevel = (gameState.level || 1) + 1;
    let nextCard = FALLBACK_CARDS[nextLevel % FALLBACK_CARDS.length];

    try {
      const airaItem = await generateAiraGameContent<QuestionCard>('guess-answer', nextLevel);
      if (airaItem?.question && Array.isArray(airaItem?.options)) {
        nextCard = airaItem;
      }
    } catch (e) {
      console.warn('AIRA generation failed for guess-answer:', e);
    } finally {
      setIsGenerating(false);
    }

    const updated: GuessAnswerState = {
      level: nextLevel,
      currentCard: nextCard,
      userChoices: {},
      revealed: false,
      score: gameState.score || 0
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
      {/* Game Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-rose-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-xl shadow-xs text-white">
            💭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">Deck: {currentCard.category}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Level {gameState?.level || 1} • Infinite
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Telepathy Points: <strong className="text-rose-600 font-bold">{gameState?.score || 0} XP</strong></p>
          </div>
        </div>

        <button
          onClick={handleNextLevel}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          <span>{isGenerating ? 'AIRA Level...' : 'Next Level'}</span>
        </button>
      </div>

      {/* Main Question Card */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50/50 rounded-3xl p-5 border border-rose-200 shadow-md space-y-4">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">AIRA Question Level {gameState?.level || 1}</span>
          <h2 className="text-base font-bold font-serif text-gray-900 leading-snug">
            "{currentCard.question}"
          </h2>
        </div>

        {/* Part 1: Your Choice */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-extrabold">1</span>
            <span>What is YOUR honest answer?</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {currentCard.options.map((opt) => (
              <button
                key={opt}
                disabled={Boolean(myChoices)}
                onClick={() => { sound.playPop(); setSelectedMyAnswer(opt); }}
                className={`p-3 rounded-2xl text-left text-xs transition-all border ${
                  selectedMyAnswer === opt
                    ? 'bg-rose-500 text-white border-rose-600 font-semibold shadow-xs'
                    : 'bg-white hover:bg-rose-50/60 text-gray-800 border-rose-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Part 2: Predict Partner */}
        <div className="space-y-2 pt-2 border-t border-rose-100">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-extrabold">2</span>
            <span>Predict: What will {partnerData?.displayName || 'your partner'} choose?</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {currentCard.options.map((opt) => (
              <button
                key={opt}
                disabled={Boolean(myChoices)}
                onClick={() => { sound.playPop(); setSelectedPartnerPrediction(opt); }}
                className={`p-3 rounded-2xl text-left text-xs transition-all border ${
                  selectedPartnerPrediction === opt
                    ? 'bg-purple-600 text-white border-purple-700 font-semibold shadow-xs'
                    : 'bg-white hover:bg-purple-50/60 text-gray-800 border-purple-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Lock In Button */}
        {!myChoices ? (
          <button
            onClick={handleLockChoices}
            disabled={!selectedMyAnswer || !selectedPartnerPrediction}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold text-xs shadow-md disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Lock In Secret Prediction</span>
          </button>
        ) : !isRevealed ? (
          <div className="p-3.5 bg-rose-100/60 rounded-2xl text-center border border-rose-200">
            <p className="text-xs text-rose-700 font-semibold animate-pulse">
              🔒 Your answers are locked! Waiting for {partnerData?.displayName || 'partner'} to lock in...
            </p>
          </div>
        ) : null}

        {/* Both Revealed Results */}
        {isRevealed && partnerChoices && myChoices && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Cards Unlocked!
              </span>
              <span className="text-xs font-extrabold text-rose-600">+100 Telepathy XP</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <p className="font-bold text-rose-800">You Picked:</p>
                <p className="text-gray-700">{myChoices.myAnswer}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Partner predicted: <em>"{partnerChoices.predictedPartnerAnswer}"</em>{' '}
                  {myChoices.myAnswer === partnerChoices.predictedPartnerAnswer ? '✨ Match!' : '❌ Missed'}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100">
                <p className="font-bold text-purple-800">{partnerData?.displayName || 'Partner'} Picked:</p>
                <p className="text-gray-700">{partnerChoices.myAnswer}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  You predicted: <em>"{myChoices.predictedPartnerAnswer}"</em>{' '}
                  {partnerChoices.myAnswer === myChoices.predictedPartnerAnswer ? '✨ Match!' : '❌ Missed'}
                </p>
              </div>
            </div>

            <button
              onClick={handleNextLevel}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'AIRA Level...' : `Next Level ${(gameState?.level || 1) + 1}`}</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
