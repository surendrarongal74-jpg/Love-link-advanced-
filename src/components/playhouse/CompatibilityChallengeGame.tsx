import React, { useState } from 'react';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { Sparkles, Heart, CheckCircle2, RefreshCw, Star, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionDef {
  id: number;
  prompt: string;
  category: string;
  options: { label: string; vibe: string }[];
}

const QUESTIONS: QuestionDef[] = [
  {
    id: 1,
    prompt: "Our ideal spontaneous Friday evening together looks like:",
    category: "Date Style",
    options: [
      { label: "Cozy blanket fort, homemade popcorn & a movie marathon", vibe: "cozy" },
      { label: "Dressing up, visiting a trendy bistro & late dessert bar", vibe: "glam" },
      { label: "Cooking a new recipe together with wine and jazz", vibe: "foodie" },
      { label: "Spontaneous road trip or late night stargazing walk", vibe: "adventurous" }
    ]
  },
  {
    id: 2,
    prompt: "When one of us has had a long exhausting day, the best remedy is:",
    category: "Comfort Language",
    options: [
      { label: "Silent cuddling, a warm hug & back scratches", vibe: "touch" },
      { label: "Listening deeply while letting them vent uninterrupted", vibe: "listening" },
      { label: "Running a hot bath, bringing snacks & handling chores", vibe: "acts" },
      { label: "Making them laugh with silly jokes and funny memories", vibe: "humor" }
    ]
  },
  {
    id: 3,
    prompt: "Our shared travel dream for the next chapter is:",
    category: "Wanderlust",
    options: [
      { label: "A secluded seaside villa with turquoise waves & sunsets", vibe: "beach" },
      { label: "A misty mountain cabin with a fireplace & evergreen forests", vibe: "mountain" },
      { label: "An ancient historic city wandering cobblestone cafes", vibe: "culture" },
      { label: "A campervan road trip across breathtaking national parks", vibe: "nature" }
    ]
  },
  {
    id: 4,
    prompt: "The romantic gesture that melts your heart the fastest:",
    category: "Heartstrings",
    options: [
      { label: "A surprise handwritten love letter hidden in your bag", vibe: "words" },
      { label: "An unexpected gentle kiss on the forehead or temple", vibe: "tender" },
      { label: "Remembering a tiny detail you mentioned weeks ago", vibe: "thoughtful" },
      { label: "Planning a complete date without asking you to make decisions", vibe: "initiative" }
    ]
  },
  {
    id: 5,
    prompt: "In 10 years, our biggest couple milestone together will be:",
    category: "Future Dreams",
    options: [
      { label: "A cozy sanctuary home filled with laughter, plants & pets", vibe: "home" },
      { label: "A passport full of stamps from exploring the world together", vibe: "travel" },
      { label: "Total financial freedom and stress-free creative projects", vibe: "freedom" },
      { label: "A bond so unbreakable we still laugh like day one", vibe: "eternal" }
    ]
  }
];

export function CompatibilityChallengeGame() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [myAnswers, setMyAnswers] = useState<number[]>([]);
  const [partnerPredictedAnswers, setPartnerPredictedAnswers] = useState<number[]>([]);
  const [mode, setMode] = useState<'mine' | 'predict' | 'result'>('mine');

  const currentQ = QUESTIONS[currentQuestionIndex];

  const handleSelectAnswer = (optionIdx: number) => {
    sound.tap();
    if (mode === 'mine') {
      const updated = [...myAnswers, optionIdx];
      setMyAnswers(updated);
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Move to partner prediction mode
        setMode('predict');
        setCurrentQuestionIndex(0);
      }
    } else if (mode === 'predict') {
      const updated = [...partnerPredictedAnswers, optionIdx];
      setPartnerPredictedAnswers(updated);
      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Calculate result!
        setMode('result');
        sound.playSuccess();
        triggerHeartBurstConfetti(0.5, 0.45);
      }
    }
  };

  const handleRestart = () => {
    sound.tap();
    setCurrentQuestionIndex(0);
    setMyAnswers([]);
    setPartnerPredictedAnswers([]);
    setMode('mine');
  };

  // Calculate transparent match score
  let matchCount = 0;
  if (mode === 'result') {
    myAnswers.forEach((ans, i) => {
      if (ans === partnerPredictedAnswers[i]) {
        matchCount++;
      }
    });
  }
  const matchPercent = Math.round((matchCount / QUESTIONS.length) * 100);

  return (
    <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-4 font-sans">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Synchronicity Test</span>
        </div>
        <h3 className="font-serif font-black text-lg text-gray-900">
          Couple Compatibility Challenge
        </h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          {mode === 'mine' && "Step 1: Choose what YOU would pick."}
          {mode === 'predict' && "Step 2: Now predict what your PARTNER would pick!"}
          {mode === 'result' && "Your Couple Harmony & Intuition Score"}
        </p>
      </div>

      {mode !== 'result' ? (
        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
              <span className="text-rose-600">
                {mode === 'mine' ? 'Step 1: Your Preferences' : 'Step 2: Partner Prediction'}
              </span>
              <span>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
            </div>
            <div className="h-2 w-full bg-rose-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500">
              {currentQ.category}
            </span>
            <h4 className="font-serif font-bold text-sm text-gray-900 leading-snug">
              {currentQ.prompt}
            </h4>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(idx)}
                className="w-full p-3.5 rounded-2xl text-left border border-gray-150 hover:border-rose-300 bg-gray-50/50 hover:bg-rose-50/40 text-xs text-gray-800 font-medium transition-all flex items-center justify-between group active:scale-98"
              >
                <span>{opt.label}</span>
                <Heart className="w-4 h-4 text-gray-300 group-hover:text-rose-500 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-5 text-center py-2">
          {/* Big Score Dial */}
          <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-rose-500 to-purple-600 p-1 shadow-lg shadow-rose-300/40 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-3xl font-black font-serif text-rose-600">
                {matchPercent}%
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Intuition Match
              </span>
            </div>
          </div>

          <div className="space-y-1 max-w-xs mx-auto">
            <h4 className="font-serif font-black text-base text-gray-900">
              {matchPercent >= 80 ? "✨ Telepathic Soulmates!" : matchPercent >= 60 ? "💖 Harmonious Balance!" : "🌱 Growing Closer Everyday!"}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              You and your partner matched on {matchCount} out of {QUESTIONS.length} lifestyle & romance intuitions.
            </p>
          </div>

          {/* Disclaimer (Transparent, not claimed as scientific) */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/70 text-left flex items-start gap-2 text-amber-900 text-[11px]">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Fun Couple Quiz:</strong> This compatibility challenge measures shared intuitions and is designed for delightful dinner conversation, not clinical psychology!
            </p>
          </div>

          {/* Question breakdown */}
          <div className="space-y-2 text-left pt-2">
            <span className="text-xs font-bold text-gray-700 block">Question Breakdown:</span>
            {QUESTIONS.map((q, i) => {
              const isMatch = myAnswers[i] === partnerPredictedAnswers[i];
              return (
                <div key={q.id} className="p-3 rounded-xl border border-gray-150 bg-gray-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-800 block text-[11px]">{q.category}</span>
                    <span className="text-[10px] text-gray-500">Your: {q.options[myAnswers[i]]?.label.slice(0, 24)}...</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {isMatch ? '✓ Synced' : 'Different'}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
}
