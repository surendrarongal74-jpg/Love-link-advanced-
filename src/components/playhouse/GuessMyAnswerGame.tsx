import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Lock, Unlock, CheckCircle2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionCard {
  id: string;
  question: string;
  category: 'Romantic' | 'Quirky' | 'Deep' | 'Naughty';
  options: string[];
}

const CARDS_DECK: QuestionCard[] = [
  {
    id: 'c1',
    question: 'Where would our dream spontaneous weekend getaway be?',
    category: 'Romantic',
    options: ['Cozy mountain cabin with fireplace', 'Secluded sunlit tropical beach', 'Vibrant cultural city boutique hotel', 'Scenic lakeside glamping tent']
  },
  {
    id: 'c2',
    question: 'What is our ultimate comfort dinner together?',
    category: 'Quirky',
    options: ['Fresh handmade pasta & red wine', 'Late-night hot cheesy pizza & movies', 'Street tacos & cold drinks', 'Fancy sushi tasting menu']
  },
  {
    id: 'c3',
    question: 'Which sweet trait made you fall in love the hardest?',
    category: 'Deep',
    options: ['Your warm contagious laugh', 'The way you care for people', 'Your deep soothing eyes', 'Your playful silly sense of humor']
  },
  {
    id: 'c4',
    question: 'If we had an entire free Sunday with zero phones, what are we doing?',
    category: 'Romantic',
    options: ['Cuddling in bed all morning & reading', 'Exploring a hidden hiking trail', 'Cooking a lavish meal together', 'Road trip with no destination']
  },
  {
    id: 'c5',
    question: 'What is the absolute best way to kiss you?',
    category: 'Naughty',
    options: ['Slow gentle forehead kiss', 'Passionate neck kiss unexpectedly', 'Deep romantic kiss in the rain', 'Playful lingering kiss before sleep']
  }
];

interface GuessAnswerState {
  cardIndex: number;
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
          cardIndex: 0,
          userChoices: {},
          revealed: false,
          score: 0
        };
        setDoc(docRef, {
          id: 'guess-answer',
          coupleSpaceId: space?.id || '',
          gameType: 'guess-answer',
          status: 'playing',
          data: JSON.stringify(init),
          scores: JSON.stringify({}),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/guess-answer`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/guess-answer`));

    return () => unsubscribe();
  }, [docRef, space?.id, userData?.id]);

  const currentCard = CARDS_DECK[(gameState?.cardIndex || 0) % CARDS_DECK.length];

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

    // If both users have locked in now, reveal automatically
    const willBothBeLocked = partnerData?.id && newUserChoices[partnerData.id];

    let bonusScore = gameState.score || 0;
    if (willBothBeLocked) {
      sound.playSuccess();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      // Check matching
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

  const handleNextCard = () => {
    if (!docRef || !gameState) return;
    sound.playPop();
    setSelectedMyAnswer('');
    setSelectedPartnerPrediction('');

    const nextIndex = (gameState.cardIndex + 1) % CARDS_DECK.length;
    const updated: GuessAnswerState = {
      cardIndex: nextIndex,
      userChoices: {},
      revealed: false,
      score: gameState.score || 0
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: 'playing',
      round: nextIndex + 1,
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
                Card #{((gameState?.cardIndex || 0) % CARDS_DECK.length) + 1}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Telepathy Points: <strong className="text-rose-600 font-bold">{gameState?.score || 0} XP</strong></p>
          </div>
        </div>

        <button
          onClick={handleNextCard}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Next Card</span>
        </button>
      </div>

      {/* Main Question Card */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-pink-50/50 rounded-3xl p-5 border border-rose-200 shadow-md space-y-4">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-widest">Question of Sync</span>
          <h2 className="text-base font-bold font-serif text-gray-900 leading-snug">
            "{currentCard.question}"
          </h2>
        </div>

        {/* Part 1: Your Choice */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Step 1: Your Honest Answer:</span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {currentCard.options.map((opt) => (
              <button
                key={opt}
                disabled={Boolean(myChoices && isRevealed)}
                onClick={() => { sound.playPop(); setSelectedMyAnswer(opt); }}
                className={`text-left p-3 rounded-xl text-xs font-medium border transition-all ${
                  selectedMyAnswer === opt
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                    : 'bg-white hover:bg-rose-50 text-gray-800 border-rose-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Part 2: Prediction of Partner */}
        <div className="space-y-2 pt-2 border-t border-rose-100">
          <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Step 2: Predict What {partnerData?.displayName || 'Partner'} Chose:</span>
          </p>
          <div className="grid grid-cols-1 gap-2">
            {currentCard.options.map((opt) => (
              <button
                key={opt}
                disabled={Boolean(myChoices && isRevealed)}
                onClick={() => { sound.playPop(); setSelectedPartnerPrediction(opt); }}
                className={`text-left p-3 rounded-xl text-xs font-medium border transition-all ${
                  selectedPartnerPrediction === opt
                    ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                    : 'bg-white hover:bg-purple-50 text-gray-800 border-rose-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Lock / Waiting Status */}
        {!myChoices ? (
          <button
            onClick={handleLockChoices}
            disabled={!selectedMyAnswer || !selectedPartnerPrediction}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Lock In My Secret Predictions</span>
          </button>
        ) : !isRevealed ? (
          <div className="bg-rose-100/70 text-rose-800 p-3.5 rounded-2xl text-xs text-center font-semibold flex items-center justify-center gap-2 animate-pulse">
            <Lock className="w-4 h-4 text-rose-600" />
            <span>Your answers are locked! Waiting for {partnerData?.displayName || 'partner'} to lock in...</span>
          </div>
        ) : null}
      </div>

      {/* Reveal Board */}
      <AnimatePresence>
        {isRevealed && partnerChoices && myChoices && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-5 border border-rose-200 shadow-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Synchronized Reveal!</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-100 space-y-2">
                <span className="font-bold text-rose-950 block">You</span>
                <p className="text-gray-600">Answer: <strong className="text-gray-900 block mt-0.5">{myChoices.myAnswer}</strong></p>
                <p className="text-gray-600">Predicted {partnerData?.displayName}: <strong className="text-purple-700 block mt-0.5">{myChoices.predictedPartnerAnswer}</strong></p>
              </div>

              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-100 space-y-2">
                <span className="font-bold text-purple-950 block">{partnerData?.displayName || 'Partner'}</span>
                <p className="text-gray-600">Answer: <strong className="text-gray-900 block mt-0.5">{partnerChoices.myAnswer}</strong></p>
                <p className="text-gray-600">Predicted You: <strong className="text-rose-700 block mt-0.5">{partnerChoices.predictedPartnerAnswer}</strong></p>
              </div>
            </div>

            {/* Match evaluation banner */}
            <div className="text-center p-3 rounded-2xl bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200">
              {myChoices.predictedPartnerAnswer === partnerChoices.myAnswer ? (
                <p className="text-xs font-bold text-rose-900">
                  🎉 Telepathic Match! You accurately predicted {partnerData?.displayName}'s heart! (+50 XP)
                </p>
              ) : (
                <p className="text-xs font-semibold text-rose-800">
                  A beautiful revelation! Now you know each other even better.
                </p>
              )}
            </div>

            <button
              onClick={handleNextCard}
              className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-colors"
            >
              Play Next Question Card
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
