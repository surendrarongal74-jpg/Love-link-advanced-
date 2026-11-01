import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Dices, Wand2, Compass } from 'lucide-react';

interface DateRouletteWheelProps {
  isRolling: boolean;
  onRoll: () => void;
  disabled?: boolean;
}

const EMOJI_CYCLES = ['🎲', '🕯️', '🍷', '🍜', '🎷', '🌙', '🎡', '🍕', '✨', '🍨', '🎨', '⛵', '🥂', '🍿'];

export const DateRouletteWheel: React.FC<DateRouletteWheelProps> = ({
  isRolling,
  onRoll,
  disabled = false,
}) => {
  const [displayEmoji, setDisplayEmoji] = useState('🎲');

  useEffect(() => {
    if (!isRolling) return;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * EMOJI_CYCLES.length);
      setDisplayEmoji(EMOJI_CYCLES[randomIdx]);
    }, 90);

    return () => clearInterval(interval);
  }, [isRolling]);

  return (
    <div className="flex flex-col items-center justify-center py-4 select-none">
      {/* Outer Glowing Ring */}
      <div className="relative group">
        <motion.div
          animate={
            isRolling
              ? {
                  rotate: 360,
                  scale: [1, 1.08, 1],
                  borderColor: ['#ec4899', '#a855f7', '#38bdf8', '#fbbf24', '#ec4899'],
                }
              : { rotate: 0 }
          }
          transition={
            isRolling
              ? { rotate: { repeat: Infinity, duration: 1.2, ease: 'linear' }, scale: { repeat: Infinity, duration: 0.8 } }
              : { duration: 0.3 }
          }
          className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-dashed border-pink-400/60 p-2.5 flex items-center justify-center bg-gradient-to-tr from-purple-950/80 via-slate-900/90 to-pink-950/80 shadow-2xl relative"
        >
          {/* Inner Core Ball */}
          <motion.div
            animate={isRolling ? { scale: [0.95, 1.05, 0.95] } : { scale: 1 }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            className="w-full h-full rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-4xl sm:text-5xl shadow-inner border border-white/30"
          >
            <span>{isRolling ? displayEmoji : '🎲'}</span>
          </motion.div>

          {/* Orbiting Sparkles */}
          {isRolling && (
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="w-3 h-3 rounded-full bg-amber-300 absolute -top-1 left-1/2 -translate-x-1/2 shadow-lg shadow-amber-300/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-pink-300 absolute -bottom-1 left-1/2 -translate-x-1/2 shadow-lg shadow-pink-300/80" />
            </motion.div>
          )}
        </motion.div>

        {/* Ambient Halo Glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full blur-xl opacity-35 group-hover:opacity-60 transition duration-500 -z-10" />
      </div>

      {/* Primary Trigger Button */}
      <div className="mt-5 text-center">
        <button
          onClick={onRoll}
          disabled={disabled || isRolling}
          className={`px-8 py-4 rounded-3xl font-black text-sm tracking-wide uppercase transition-all shadow-2xl flex items-center gap-2.5 mx-auto ${
            isRolling || disabled
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-pink-500/30 hover:scale-105 active:scale-95 border border-white/20'
          }`}
        >
          {isRolling ? (
            <>
              <Wand2 className="w-5 h-5 animate-spin" />
              <span>Consulting City Stars...</span>
            </>
          ) : (
            <>
              <Dices className="w-5 h-5 animate-bounce" />
              <span>Roll Random Date Night! 🎲</span>
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 mt-2 font-medium">
          {isRolling ? 'Discovering hidden gems & local romantic spots...' : 'Overcoming decision fatigue with 1 tap'}
        </p>
      </div>
    </div>
  );
};
