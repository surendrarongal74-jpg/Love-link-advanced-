import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, X, CheckCircle2, Send, PawPrint, Box, Layers } from 'lucide-react';
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

export function KittyLetterExperience({ gift, isPreview, onRespond, onClose }: Props) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    gift.recipientResponse?.answer || null
  );
  const [hasResponded, setHasResponded] = useState(!!gift.recipientResponse);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creatorName = gift.creatorName || 'Your Love';
  const recipientName = gift.recipientName || 'Sweetheart';
  const message = gift.content?.message || 'Just a tiny reminder that you are the sweetest, kindest person in the whole universe. My heart purrs whenever you are around! 🐾❤️';
  const question = gift.content?.question || 'Will you accept this warm delivery of endless cuddles?';
  const choices = gift.content?.answerChoices?.length
    ? gift.content.answerChoices
    : ['Accept with a huge cuddle! 🤗', 'Paw-mise to love you forever! 🐾', 'You made my whole day! 💖'];

  const handleOpenEnvelope = () => {
    sound.playPop();
    setIsOpen(true);
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#F472B6', '#FBBF24', '#FFF']
    });
  };

  const handleSelectAnswer = async (choice: string) => {
    setSelectedAnswer(choice);
    sound.playHeartbeat();
    confetti({
      particleCount: 70,
      spread: 80,
      colors: ['#F472B6', '#E8547A', '#FFF6F9']
    });

    if (onRespond && !isPreview) {
      setIsSubmitting(true);
      try {
        await onRespond({
          answer: choice,
          respondedAt: Date.now(),
          reactionEmoji: '🐾'
        });
        setHasResponded(true);
      } catch (err) {
        console.error('Error submitting kitty letter response:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-pink-100 via-rose-50 to-purple-100 overflow-hidden flex flex-col select-none text-slate-800">
      {/* Top Header */}
      <div className="relative z-30 p-4 flex items-center justify-between border-b border-pink-200/60 bg-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐱</span>
          <div>
            <h1 className="text-sm font-serif font-black text-rose-950">Kitty Letter Delivery</h1>
            <p className="text-[10px] text-pink-500 font-bold">
              {viewMode === '3d' ? 'Interactive 3D Kitten Room' : 'Special Love Courier'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-rose-800 border border-pink-300 transition-all text-xs flex items-center gap-1.5 shadow-xs active:scale-95"
            title="Toggle between 3D Kitty and 2D Card"
          >
            {viewMode === '3d' ? (
              <Box className="w-3.5 h-3.5 text-pink-600" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {viewMode === '3d' ? '3D Kitty' : '2D Card'}
            </span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/70 hover:bg-white text-rose-700 transition-colors shadow-xs"
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
            experienceName="Kitty Letter"
          >
            <Loveverse3DViewer
              gift={gift}
              onInteract={(action) => {
                if (action === 'open_letter') {
                  handleOpenEnvelope();
                } else {
                  sound.playPop();
                  confetti({
                    particleCount: 30,
                    spread: 60,
                    colors: ['#FF80AB', '#FFF'],
                  });
                }
              }}
              onSwitchTo2D={() => setViewMode('2d')}
            />
          </ExperienceErrorBoundary>

          {/* Quick CTA Button in 3D */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={handleOpenEnvelope}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce transition-transform active:scale-95 border border-white/40 cursor-pointer"
            >
              <span>🐾</span>
              <span>Open Love Letter</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Main 2D Courier & Letter */
        <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto w-full py-8 overflow-y-auto">
          {!isOpen ? (
            /* Sealed Envelope with Cute Kitten Messenger */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6 flex flex-col items-center"
            >
              {/* Animated Kitten Delivering the Letter */}
              <div className="relative">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                  className="text-8xl md:text-9xl filter drop-shadow-xl"
                >
                  🐱
                </motion.div>
                <div className="absolute -bottom-2 -right-2 text-4xl animate-bounce">
                  💌
                </div>
              </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-rose-200/80 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
                Paws Courier Service
              </span>
              <h2 className="font-serif font-black text-2xl md:text-3xl text-rose-950">
                You have a special letter!
              </h2>
              <p className="text-xs text-rose-600 mt-1">
                Handcrafted with love by {creatorName} for {recipientName}
              </p>
            </div>

            {/* Tap-to-Break Wax Seal Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenEnvelope}
              className="py-4 px-8 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white font-serif font-bold text-base shadow-xl shadow-rose-300/60 flex items-center gap-3 cursor-pointer"
            >
              <span className="text-xl">🐾</span>
              Break the Seal & Open
              <Sparkles className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ) : (
          /* Unfolded Parchment Letter */
          <motion.div
            initial={{ scale: 0.85, opacity: 0, rotate: -2 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="w-full bg-[#FFFDF9] rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-rose-200 relative overflow-hidden"
          >
            {/* Paw Stamps */}
            <div className="absolute top-3 right-4 text-rose-300/40 text-4xl select-none pointer-events-none">
              🐾
            </div>
            <div className="absolute bottom-3 left-4 text-rose-300/30 text-3xl select-none pointer-events-none">
              🐾
            </div>

            <div className="space-y-4">
              <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-400 tracking-wider">
                    From {creatorName}'s Heart
                  </span>
                  <h3 className="font-serif font-black text-xl text-rose-950">
                    My Dearest {recipientName},
                  </h3>
                </div>
                <span className="text-3xl">🐱❤️</span>
              </div>

              {/* Letter Parchment Note */}
              <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100/80">
                <p className="font-serif text-sm md:text-base text-rose-900 leading-relaxed italic">
                  "{message}"
                </p>
              </div>

              {/* Question */}
              <div className="pt-2 text-center space-y-3">
                <h4 className="font-serif font-black text-base md:text-lg text-rose-950">
                  {question}
                </h4>

                <div className="space-y-2">
                  {choices.map((choice, idx) => {
                    const isSelected = selectedAnswer === choice;
                    return (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectAnswer(choice)}
                        disabled={isSubmitting}
                        className={`w-full py-3 px-4 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-between transition-all border ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-lg shadow-pink-300/50'
                            : 'bg-white hover:bg-pink-50 text-rose-950 border-pink-200'
                        }`}
                      >
                        <span>{choice}</span>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 fill-white text-pink-500 shrink-0" />
                        ) : (
                          <PawPrint className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {hasResponded && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Cuddles delivered back to {creatorName}!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    )}

      {/* 3D Mode Letter Modal Overlay */}
      <AnimatePresence>
        {viewMode === '3d' && isOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#FFFDF9] rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-rose-200 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-pink-100 hover:bg-pink-200 flex items-center justify-center text-rose-700 transition-colors"
                title="Close Letter"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-400 tracking-wider">
                      From {creatorName}'s Heart
                    </span>
                    <h3 className="font-serif font-black text-xl text-rose-950">
                      My Dearest {recipientName},
                    </h3>
                  </div>
                  <span className="text-3xl">🐱❤️</span>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <p className="font-serif text-sm md:text-base text-rose-900 leading-relaxed italic">
                    "{message}"
                  </p>
                </div>

                <div className="pt-2 text-center space-y-3">
                  <h4 className="font-serif font-black text-base md:text-lg text-rose-950">
                    {question}
                  </h4>

                  <div className="space-y-2">
                    {choices.map((choice, idx) => {
                      const isSelected = selectedAnswer === choice;
                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectAnswer(choice)}
                          disabled={isSubmitting}
                          className={`w-full py-3 px-4 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-between transition-all border ${
                            isSelected
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white border-transparent shadow-lg shadow-pink-300/50'
                              : 'bg-white hover:bg-pink-50 text-rose-950 border-pink-200'
                          }`}
                        >
                          <span>{choice}</span>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 fill-white text-pink-500 shrink-0" />
                          ) : (
                            <PawPrint className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {hasResponded && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Cuddles delivered back to {creatorName}!
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
