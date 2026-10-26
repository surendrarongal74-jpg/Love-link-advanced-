import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, X, CheckCircle2, Box, Layers } from 'lucide-react';
import { DigitalGift, RecipientGiftResponse } from '../../types/digitalGifts';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Loveverse3DViewer } from './3d/Loveverse3DViewer';
import { ExperienceErrorBoundary } from './3d/ExperienceErrorBoundary';

interface Props {
  gift: DigitalGift;
  isPreview?: boolean;
  onRespond?: (response: RecipientGiftResponse) => Promise<void>;
  onClose?: () => void;
}

export function SakuraNightExperience({ gift, isPreview, onRespond, onClose }: Props) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    gift.recipientResponse?.answer || null
  );
  const [hasResponded, setHasResponded] = useState(!!gift.recipientResponse);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creatorName = gift.creatorName || 'Your Love';
  const recipientName = gift.recipientName || 'My Beloved';
  const message = gift.content?.message || 'Just as cherry blossoms make the world softer and more beautiful, your love has transformed my whole life.';
  const question = gift.content?.question || 'Under these moonlit blossoms, will you promise your heart to me once more?';
  const choices = gift.content?.answerChoices?.length
    ? gift.content.answerChoices
    : ['Forever and always! 🌸', 'My heart has always been yours! 🌙', 'Yes, a million times! 💖'];

  const handleSelectChoice = async (choice: string) => {
    setSelectedAnswer(choice);
    sound.playHeartbeat();

    // Cherry blossom petal storm confetti
    confetti({
      particleCount: 80,
      spread: 90,
      colors: ['#F472B6', '#FB7185', '#FFF1F2', '#FECDD3']
    });

    if (onRespond && !isPreview) {
      setIsSubmitting(true);
      try {
        await onRespond({
          answer: choice,
          respondedAt: Date.now(),
          reactionEmoji: '🌸'
        });
        setHasResponded(true);
      } catch (err) {
        console.error('Error submitting sakura response:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 overflow-hidden flex flex-col select-none text-white">
      {/* Anime Night Sky Backdrop */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-indigo-950 via-purple-950 to-pink-950" />

      {/* Header */}
      <div className="relative z-30 p-4 flex items-center justify-between border-b border-purple-900/40 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <div>
            <h1 className="text-sm font-serif font-black text-pink-100">Sakura Night</h1>
            <p className="text-[10px] text-pink-300">
              {viewMode === '3d' ? '3D Moonlit Sanctuary' : 'Anime Moonlit Invitation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-pink-200 border border-pink-400/30 transition-all text-xs flex items-center gap-1.5 active:scale-95"
            title="Toggle between 3D Garden and 2D Scroll"
          >
            {viewMode === '3d' ? (
              <Box className="w-3.5 h-3.5 text-pink-400" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-rose-300" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {viewMode === '3d' ? '3D Garden' : '2D Scroll'}
            </span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3D vs 2D Body */}
      {viewMode === '3d' ? (
        <div className="relative flex-1 w-full h-full overflow-hidden">
          <ExperienceErrorBoundary
            fallbackTo2D={() => setViewMode('2d')}
            experienceName="Sakura Night"
          >
            <Loveverse3DViewer
              gift={gift}
              onInteract={(action) => {
                sound.playHeartbeat();
                setIsLetterOpen(true);
              }}
              onSwitchTo2D={() => setViewMode('2d')}
            />
          </ExperienceErrorBoundary>

          {/* Quick CTA in 3D */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setIsLetterOpen(true)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce transition-transform active:scale-95 border border-pink-300/40 cursor-pointer"
            >
              <span>🌸</span>
              <span>Open Romantic Scroll</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Main 2D Experience */
        <div className="relative flex-1 overflow-y-auto flex flex-col items-center justify-center p-4">
          {/* Luminous Crescent Moon */}
          <div className="fixed top-16 right-8 w-24 h-24 md:w-36 md:h-36 rounded-full shadow-[0_0_80px_rgba(253,224,71,0.3)] pointer-events-none">
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-100 to-yellow-200" />
            <div className="absolute top-2 right-4 w-20 h-20 md:w-32 md:h-32 rounded-full bg-indigo-950" />
          </div>

          {/* Falling Sakura Petals Animation */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: `${(i * 13) % 100}vw`, rotate: 0 }}
                animate={{
                  y: '105vh',
                  x: `${((i * 13) + (i % 2 === 0 ? 15 : -15)) % 100}vw`,
                  rotate: 360,
                }}
                transition={{
                  repeat: Infinity,
                  duration: 8 + (i % 6),
                  delay: (i * 0.5) % 5,
                  ease: 'linear',
                }}
                className="absolute text-pink-300/70 text-lg md:text-xl drop-shadow-sm select-none"
              >
                🌸
              </motion.div>
            ))}
          </div>

          <main className="relative z-20 max-w-lg mx-auto w-full py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="text-6xl md:text-7xl filter drop-shadow-[0_8px_16px_rgba(244,114,182,0.4)]">
                ⛩️🌸
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-pink-300 bg-purple-900/60 px-3 py-1 rounded-full border border-pink-500/30">
                {creatorName} & {recipientName}
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-stone-900/90 rounded-3xl p-6 md:p-8 shadow-2xl border border-pink-500/40 text-stone-100 space-y-5"
            >
              <div className="text-center">
                <h2 className="font-serif font-black text-2xl text-pink-200">
                  Dearest {recipientName},
                </h2>
              </div>

              <div className="p-5 rounded-2xl bg-purple-950/60 border border-pink-500/20 shadow-inner">
                <p className="font-serif text-sm md:text-base text-pink-100 leading-relaxed italic text-center">
                  "{message}"
                </p>
              </div>

              <div className="pt-2 text-center space-y-3">
                <h3 className="font-serif font-black text-lg text-pink-100">
                  {question}
                </h3>

                <div className="space-y-2">
                  {choices.map((choice, idx) => {
                    const isSelected = selectedAnswer === choice;
                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectChoice(choice)}
                        disabled={isSubmitting}
                        className={`w-full py-3 px-4 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-between transition-all border ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/40'
                            : 'bg-stone-800/80 hover:bg-stone-800 text-pink-100 border-pink-900/60'
                        }`}
                      >
                        <span>{choice}</span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 fill-white text-pink-500 shrink-0" />
                        ) : (
                          <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {hasResponded && (
                  <div className="p-3 bg-pink-950/60 border border-pink-500/40 rounded-xl text-pink-200 text-xs font-bold flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    Your promise has been bound under the cherry blossoms!
                  </div>
                )}
              </div>
            </motion.div>
          </main>
        </div>
      )}

      {/* 3D Mode Scroll Modal Overlay */}
      <AnimatePresence>
        {viewMode === '3d' && isLetterOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-stone-900/95 rounded-3xl p-6 md:p-8 shadow-2xl border border-pink-500/40 text-stone-100 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsLetterOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-pink-950/60 hover:bg-pink-900 text-pink-300 flex items-center justify-center transition-colors"
                title="Close Scroll"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400 bg-purple-950/80 px-3 py-1 rounded-full border border-pink-500/20">
                    Sakura Moonlit Vow
                  </span>
                  <h2 className="font-serif font-black text-2xl text-pink-200 mt-2">
                    Dearest {recipientName},
                  </h2>
                </div>

                <div className="p-5 rounded-2xl bg-purple-950/70 border border-pink-500/30 shadow-inner">
                  <p className="font-serif text-sm md:text-base text-pink-100 leading-relaxed italic text-center">
                    "{message}"
                  </p>
                </div>

                <div className="pt-2 text-center space-y-3">
                  <h3 className="font-serif font-black text-lg text-pink-100">
                    {question}
                  </h3>

                  <div className="space-y-2">
                    {choices.map((choice, idx) => {
                      const isSelected = selectedAnswer === choice;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectChoice(choice)}
                          disabled={isSubmitting}
                          className={`w-full py-3 px-4 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-between transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/40'
                              : 'bg-stone-800/80 hover:bg-stone-800 text-pink-100 border-pink-900/60'
                          }`}
                        >
                          <span>{choice}</span>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 fill-white text-pink-500 shrink-0" />
                          ) : (
                            <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {hasResponded && (
                    <div className="p-3 bg-pink-950/60 border border-pink-500/40 rounded-xl text-pink-200 text-xs font-bold flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400" />
                      Your promise has been bound under the cherry blossoms!
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
