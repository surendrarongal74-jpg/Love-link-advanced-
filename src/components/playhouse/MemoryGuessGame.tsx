import React, { useState } from 'react';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { Sparkles, HelpCircle, CheckCircle, RefreshCw, Key, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MemoryRiddle {
  id: string;
  category: string;
  clues: string[];
  question: string;
  options: string[];
  correctAnswerIndex: number;
  funFact: string;
}

const MEMORY_RIDDLES: MemoryRiddle[] = [
  {
    id: 'mem_1',
    category: 'The First Spark',
    clues: [
      'Clue 1: It happened within our first few dates.',
      'Clue 2: Both of us were slightly nervous, but neither wanted the night to end.',
      'Clue 3: Food was involved, and someone spilled a drop of drink while laughing.'
    ],
    question: 'Where did our first unforgettable deep conversation take place?',
    options: [
      'At a quiet corner booth in a cozy pasta restaurant',
      'Sitting on the car hood watching city skyline lights',
      'Walking down the park path under fairy lights',
      'While getting iced lattes at the local cafe'
    ],
    correctAnswerIndex: 1,
    funFact: 'That conversation lasted almost 3 hours without either of us checking the clock!'
  },
  {
    id: 'mem_2',
    category: 'The Inside Joke',
    clues: [
      'Clue 1: A funny misunderstanding during grocery shopping.',
      'Clue 2: Involves an item that looked like something completely different.',
      'Clue 3: We still burst out laughing whenever we walk down that aisle.'
    ],
    question: 'What grocery item triggered our longest laughing fit?',
    options: [
      'The funny-shaped imported potato',
      'A carton of oddly named herbal tea',
      'The giant stuffed bear sitting in the seasonal aisle',
      'A pineapple with sunglasses on sale'
    ],
    correctAnswerIndex: 0,
    funFact: 'We took a photo of it and kept it as a chat sticker for months!'
  },
  {
    id: 'mem_3',
    category: 'The Rainy Day Rescue',
    clues: [
      'Clue 1: Sudden downpour with zero umbrella in sight.',
      'Clue 2: We dashed under an awning soaked from head to toe.',
      'Clue 3: Ended up sharing a hot soup or dessert to dry off.'
    ],
    question: 'What did we end up doing after getting completely caught in the rain?',
    options: [
      'Drying our jackets with hand dryers and laughing hysterically',
      'Splashing in puddles like children without caring',
      'Running into a tiny bookstore to stay warm',
      'Ordering hot churros and chocolate on the porch'
    ],
    correctAnswerIndex: 1,
    funFact: 'One of the most cinematic moments of our relationship!'
  }
];

export function MemoryGuessGame() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [unlockedCluesCount, setUnlockedCluesCount] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const riddle = MEMORY_RIDDLES[currentIdx];

  const handleRevealNextClue = () => {
    sound.tap();
    if (unlockedCluesCount < riddle.clues.length) {
      setUnlockedCluesCount(prev => prev + 1);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);

    if (idx === riddle.correctAnswerIndex) {
      sound.playSuccess();
      setScore(prev => prev + (4 - unlockedCluesCount) * 10);
      triggerHeartBurstConfetti(0.5, 0.45);
    } else {
      sound.pop();
    }
  };

  const handleNextRiddle = () => {
    sound.tap();
    if (currentIdx < MEMORY_RIDDLES.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setUnlockedCluesCount(1);
      setSelectedAnswer(null);
    } else {
      setGameOver(true);
    }
  };

  const handleRestart = () => {
    sound.tap();
    setCurrentIdx(0);
    setUnlockedCluesCount(1);
    setSelectedAnswer(null);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-4 font-sans">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Memory Vault Clues</span>
        </div>
        <h3 className="font-serif font-black text-lg text-gray-900">
          Memory Guess Mystery
        </h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Read the subtle clues about our milestones and guess the exact memory before time runs out!
        </p>
      </div>

      {!gameOver ? (
        <div className="space-y-4">
          {/* Header Score & Category */}
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              {riddle.category}
            </span>
            <span className="text-rose-600 font-black">
              Score: {score} Pts
            </span>
          </div>

          {/* Clues Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 to-purple-50/60 border border-rose-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <Key className="w-3 h-3" /> Clues Unlocked: {unlockedCluesCount} / {riddle.clues.length}
              </span>
              {unlockedCluesCount < riddle.clues.length && (
                <button
                  onClick={handleRevealNextClue}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-700 underline"
                >
                  Reveal Next Clue (-5 pts)
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {riddle.clues.slice(0, unlockedCluesCount).map((clue, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-gray-700 font-medium bg-white/70 p-2 rounded-xl border border-rose-100/60"
                >
                  {clue}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-sm text-gray-900">
              {riddle.question}
            </h4>
          </div>

          {/* Answer Options */}
          <div className="space-y-2">
            {riddle.options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === riddle.correctAnswerIndex;
              let btnClass = 'border-gray-200 bg-gray-50/60 text-gray-800 hover:bg-rose-50/50';

              if (selectedAnswer !== null) {
                if (isCorrect) {
                  btnClass = 'border-emerald-300 bg-emerald-50 text-emerald-900 font-bold';
                } else if (isSelected) {
                  btnClass = 'border-rose-300 bg-rose-50 text-rose-800 line-through';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={selectedAnswer !== null}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full p-3.5 rounded-2xl text-left border text-xs transition-all flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  {selectedAnswer !== null && isCorrect && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {selectedAnswer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2"
            >
              <p className="text-xs text-gray-700 italic">
                "{riddle.funFact}"
              </p>
              <button
                onClick={handleNextRiddle}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs"
              >
                {currentIdx < MEMORY_RIDDLES.length - 1 ? 'Next Memory Clue' : 'See Final Score'}
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        /* Game Over Screen */
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl">
            🏆
          </div>
          <div>
            <h4 className="font-serif font-black text-lg text-gray-900">
              Memory Master: {score} Points!
            </h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
              You know the intimate details of your couple journey by heart!
            </p>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Play Another Round</span>
          </button>
        </div>
      )}
    </div>
  );
}
