import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { Heart, Sparkles, Award, ArrowRight, RotateCcw, Check, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizQuestion {
  id: number;
  question: string;
  category: string;
  options: string[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is your idea of the absolute dream couple getaway?",
    category: "Travel & Dreams",
    options: [
      "Cozy cabin in misty snow-capped mountains with hot cocoa",
      "Overwater glass bungalow on a secluded turquoise beach",
      "Historic European cobblestone streets, bakeries & museums",
      "Stargazing road trip in a vintage camper van"
    ]
  },
  {
    id: 2,
    question: "When you have had a long stressful day, what comforts you most?",
    category: "Comfort Languages",
    options: [
      "A quiet, tight embrace without needing to talk",
      "Ordering our favorite comfort takeout and watching a cozy movie",
      "Having my partner listen attentively while I vent",
      "A surprise sweet treat or warm cup of tea brought to me"
    ]
  },
  {
    id: 3,
    question: "Which milestone memory together gives you the warmest butterfly feeling?",
    category: "Memories & Milestones",
    options: [
      "Our very first awkward, beautiful date",
      "The first time we laughed so hard our stomachs hurt",
      "A late-night heartfelt conversation where we bared our souls",
      "The quiet moment we just looked at each other and knew"
    ]
  },
  {
    id: 4,
    question: "What spontaneous romantic gesture makes your heart melt fastest?",
    category: "Daily Love Language",
    options: [
      "Finding an unexpected handwritten love note in my bag",
      "Getting my favorite coffee or snack unprompted",
      "A spontaneous forehead kiss and holding hands while walking",
      "Having dinner made or chores handled so I can relax"
    ]
  },
  {
    id: 5,
    question: "What is our greatest couple superpower?",
    category: "Couple Strength",
    options: [
      "Unmatched comedic timing and laughing through tough times",
      "Deep emotional trust and always hearing each other out",
      "Unconditional loyalty and being each other's #1 cheerleader",
      "Unspoken telepathic intuition and knowing what the other needs"
    ]
  }
];

export function LoveQuizGame() {
  const { userData } = useAuth();
  const { partnerData } = useCoupleSpace();
  const { theme } = useTheme();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [partnerPredictions, setPartnerPredictions] = useState<Record<number, string>>({});
  const [stage, setStage] = useState<'my-answers' | 'predict-partner' | 'results'>('my-answers');

  const currentQ = QUIZ_QUESTIONS[currentIndex];

  const handleSelectAnswer = (option: string) => {
    sound.tap();
    if (stage === 'my-answers') {
      const nextAnswers = { ...answers, [currentQ.id]: option };
      setAnswers(nextAnswers);

      if (currentIndex < QUIZ_QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Move to partner predictions
        sound.playSuccess();
        setStage('predict-partner');
        setCurrentIndex(0);
      }
    } else if (stage === 'predict-partner') {
      const nextPredictions = { ...partnerPredictions, [currentQ.id]: option };
      setPartnerPredictions(nextPredictions);

      if (currentIndex < QUIZ_QUESTIONS.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Reveal results
        sound.playSuccess();
        triggerHeartBurstConfetti(0.5, 0.45);
        setStage('results');
      }
    }
  };

  const handleRestart = () => {
    sound.tap();
    setCurrentIndex(0);
    setAnswers({});
    setPartnerPredictions({});
    setStage('my-answers');
  };

  return (
    <div 
      className="p-5 rounded-3xl border shadow-sm space-y-5 font-sans transition-colors duration-500"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderColor: theme.colors.cardBorder
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: theme.colors.primary }}>
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Couple Intimacy Quiz</span>
          </div>
          <h3 className="font-serif font-black text-lg">Love Quiz</h3>
        </div>

        {stage !== 'results' && (
          <div 
            className="px-3 py-1 rounded-full text-xs font-bold border"
            style={{
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.cardBorder,
              color: theme.colors.primary
            }}
          >
            <span>Q{currentIndex + 1} of {QUIZ_QUESTIONS.length}</span>
          </div>
        )}
      </div>

      {stage !== 'results' ? (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
                backgroundColor: theme.colors.primary
              }}
            />
          </div>

          {/* Mode Banner */}
          <div 
            className="p-2.5 rounded-2xl border text-xs font-bold text-center"
            style={{
              backgroundColor: stage === 'my-answers' ? theme.colors.primarySoft : theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
              color: theme.colors.textMain
            }}
          >
            {stage === 'my-answers' ? (
              <span>Step 1: Choose your honest personal preference</span>
            ) : (
              <span>Step 2: Predict what <strong>{partnerData?.displayName || 'your partner'}</strong> would choose!</span>
            )}
          </div>

          {/* Question Card */}
          <div 
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: theme.colors.screenBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">
              {currentQ.category}
            </span>
            <h4 className="font-serif text-sm font-bold leading-relaxed" style={{ color: theme.colors.textMain }}>
              {currentQ.question}
            </h4>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectAnswer(opt)}
                className="w-full p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all hover:shadow-xs flex items-center justify-between"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder,
                  color: theme.colors.textMain
                }}
              >
                <span>{opt}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-40 shrink-0 ml-2" />
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        /* Results View */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div 
            className="p-5 rounded-3xl border text-center space-y-2 shadow-xs"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primarySoft} 0%, ${theme.colors.cardBg} 100%)`,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center shadow-xs" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-black text-base" style={{ color: theme.colors.textMain }}>
              Quiz Responses Completed!
            </h4>
            <p className="text-xs opacity-80 max-w-xs mx-auto">
              You’ve answered all 5 intimacy questions and logged your predictions for {partnerData?.displayName || 'your partner'}.
            </p>
          </div>

          {/* Summary Breakdown */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider opacity-60">Your Couple Answers</h5>
            {QUIZ_QUESTIONS.map(q => (
              <div 
                key={q.id}
                className="p-3 rounded-2xl border text-xs space-y-1"
                style={{
                  backgroundColor: theme.colors.screenBg,
                  borderColor: theme.colors.cardBorder
                }}
              >
                <p className="font-bold text-[11px] opacity-75">{q.question}</p>
                <div className="flex flex-col gap-0.5 text-[11px]">
                  <span style={{ color: theme.colors.primary }}>
                    <strong>Your Choice:</strong> {answers[q.id]}
                  </span>
                  <span className="opacity-80">
                    <strong>Predicted for Partner:</strong> {partnerPredictions[q.id]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleRestart}
            className="w-full py-3 rounded-2xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 hover:brightness-105"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Love Quiz</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
