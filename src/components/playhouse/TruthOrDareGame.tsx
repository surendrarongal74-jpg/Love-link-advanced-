import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { Sparkles, Wine, RotateCw, CheckCircle, Heart, Flame, Wand2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TRUTHS = [
  "What was the exact moment you realized you had feelings for me?",
  "What is your absolute favorite memory of us together?",
  "What is one small, weird habit of mine that you secretly find adorable?",
  "What is a romantic fantasy or trip you dream of experiencing with me?",
  "What song immediately makes you think of me whenever you hear it?",
  "If you had to describe our relationship in 3 words, what would they be?",
  "What was your very first impression when we met?"
];

const DARES = [
  "Give your partner a 2-minute soothing shoulder massage right now.",
  "Look into your partner's eyes for 60 seconds without speaking or laughing.",
  "Send your partner the most romantic 20-word voice note you can record.",
  "Whisper your favorite secret pet name for them into their ear.",
  "Recreate the exact face you made when you first saw them.",
  "Take an adorable couple selfie together right now.",
  "Slow dance together to your favorite couple song for 1 minute."
];

export function TruthOrDareGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { theme } = useTheme();

  const [turnPlayer, setTurnPlayer] = useState<'you' | 'partner'>('you');
  const [choice, setChoice] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinDeg, setSpinDeg] = useState<number>(0);

  const handleSpinTurn = () => {
    if (isSpinning) return;
    sound.tap();
    setIsSpinning(true);
    setChoice(null);
    setPrompt('');

    const extraSpins = 360 * 4;
    const isNextMe = Math.random() > 0.5;
    const targetAngle = isNextMe ? 180 : 0;
    setSpinDeg(prev => prev + extraSpins + (targetAngle - (prev % 360)));

    setTimeout(() => {
      setIsSpinning(false);
      setTurnPlayer(isNextMe ? 'you' : 'partner');
      sound.playSuccess();
    }, 2400);
  };

  const handleSelectChoice = (type: 'truth' | 'dare') => {
    sound.tap();
    setChoice(type);
    const list = type === 'truth' ? TRUTHS : DARES;
    const item = list[Math.floor(Math.random() * list.length)];
    setPrompt(item);
  };

  const handleNewPrompt = () => {
    sound.tap();
    if (!choice) return;
    const list = choice === 'truth' ? TRUTHS : DARES;
    let nextItem = list[Math.floor(Math.random() * list.length)];
    while (nextItem === prompt && list.length > 1) {
      nextItem = list[Math.floor(Math.random() * list.length)];
    }
    setPrompt(nextItem);
  };

  const handleComplete = () => {
    sound.playSuccess();
    triggerHeartBurstConfetti(0.5, 0.45);
    setCompletedCount(prev => prev + 1);
    setChoice(null);
    setPrompt('');
    setTurnPlayer(turnPlayer === 'you' ? 'partner' : 'you');
  };

  return (
    <div 
      className="p-5 rounded-3xl border shadow-sm space-y-5 font-sans transition-colors duration-500"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderColor: theme.colors.cardBorder
      }}
    >
      {/* Game Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: theme.colors.primary }}>
            <Wine className="w-3.5 h-3.5" />
            <span>Romantic Bottle Spin</span>
          </div>
          <h3 className="font-serif font-black text-lg">Truth or Dare</h3>
        </div>

        <div 
          className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
          style={{
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.cardBorder,
            color: theme.colors.primary
          }}
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Completed: {completedCount}</span>
        </div>
      </div>

      {/* Interactive Spinning Bottle */}
      <div className="flex flex-col items-center justify-center py-4 relative">
        <div className="flex items-center justify-between w-full max-w-xs text-xs font-bold mb-4 opacity-80">
          <span className={turnPlayer === 'partner' ? 'font-black scale-105 transition-transform' : ''} style={{ color: theme.colors.textMain }}>
            {partnerData?.displayName || 'Partner'}
          </span>
          <span className={turnPlayer === 'you' ? 'font-black scale-105 transition-transform' : ''} style={{ color: theme.colors.primary }}>
            You
          </span>
        </div>

        {/* Spinning Bottle Visual */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div 
            className="absolute inset-0 rounded-full border-2 border-dashed opacity-30"
            style={{ borderColor: theme.colors.primary }}
          />

          <motion.div
            animate={{ rotate: spinDeg }}
            transition={{ duration: 2.4, ease: [0.15, 0.85, 0.35, 1] }}
            className="w-10 h-32 flex flex-col items-center justify-center relative cursor-pointer"
            onClick={handleSpinTurn}
          >
            {/* Bottle graphic */}
            <div 
              className="w-4 h-8 rounded-t-full shadow-xs"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div 
              className="w-8 h-20 rounded-2xl shadow-lg border-2 flex items-center justify-center"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.primary
              }}
            >
              <Heart className="w-4 h-4 fill-current" style={{ color: theme.colors.primary }} />
            </div>
          </motion.div>
        </div>

        {/* Spin CTA */}
        <button
          disabled={isSpinning}
          onClick={handleSpinTurn}
          className="mt-3 px-6 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 hover:brightness-105 active:scale-95"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'Spinning Destiny...' : 'Spin the Bottle!'}</span>
        </button>
      </div>

      {/* Turn Banner */}
      <div 
        className="p-3 rounded-2xl text-center border text-xs font-bold transition-all"
        style={{
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.cardBorder,
          color: theme.colors.textMain
        }}
      >
        <span>It's </span>
        <strong style={{ color: theme.colors.primary }}>
          {turnPlayer === 'you' ? 'Your' : `${partnerData?.displayName || 'Your partner'}'s`}
        </strong>
        <span> turn to choose!</span>
      </div>

      {/* Choice Buttons */}
      {!choice ? (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectChoice('truth')}
            className="p-4 rounded-2xl border text-center transition-all hover:shadow-md space-y-1.5"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="text-2xl">🗝️</div>
            <h4 className="font-bold text-sm" style={{ color: theme.colors.textMain }}>Truth</h4>
            <p className="text-[11px] opacity-70">Heartfelt deep confession</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectChoice('dare')}
            className="p-4 rounded-2xl border text-center transition-all hover:shadow-md space-y-1.5"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="text-2xl">🔥</div>
            <h4 className="font-bold text-sm" style={{ color: theme.colors.textMain }}>Dare</h4>
            <p className="text-[11px] opacity-70">Playful romantic action</p>
          </motion.button>
        </div>
      ) : (
        /* Prompt Reveal & Completion */
        <AnimatePresence mode="wait">
          <motion.div
            key={prompt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl border space-y-4"
            style={{
              backgroundColor: theme.colors.screenBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="flex items-center justify-between">
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
                style={{ backgroundColor: choice === 'truth' ? '#3B82F6' : theme.colors.primary }}
              >
                {choice.toUpperCase()}
              </span>

              <button
                onClick={handleNewPrompt}
                className="text-[11px] font-bold flex items-center gap-1 opacity-75 hover:opacity-100"
                style={{ color: theme.colors.primary }}
              >
                <Wand2 className="w-3 h-3" />
                <span>Shuffle Prompt</span>
              </button>
            </div>

            <p className="font-serif text-sm font-semibold leading-relaxed" style={{ color: theme.colors.textMain }}>
              "{prompt}"
            </p>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleComplete}
              className="w-full py-3 rounded-2xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 hover:brightness-105"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Completed & Switch Turn</span>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
