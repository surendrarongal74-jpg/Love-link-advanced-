import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, X, ChevronDown, CheckCircle2, Star, Box, Layers } from 'lucide-react';
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

export function InfiniteLoveExperience({ gift, isPreview, onRespond, onClose }: Props) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    gift.recipientResponse?.answer || null
  );
  const [hasResponded, setHasResponded] = useState(!!gift.recipientResponse);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creatorName = gift.creatorName || 'Your Love';
  const recipientName = gift.recipientName || 'My Universe';
  const mainMessage = gift.content?.message || 'In a universe of billions of galaxies and infinite stars, finding you was the miracle of my lifetime.';
  const chapters = gift.content?.chapters?.length
    ? gift.content.chapters
    : [
        {
          id: 'chap_1',
          title: 'The First Spark',
          text: 'It started with a simple hello that quickly turned into conversations we never wanted to end.',
          order: 1
        },
        {
          id: 'chap_2',
          title: 'Falling Deeper',
          text: 'Every day revealed another reason why you are completely irreplaceable to me.',
          order: 2
        },
        {
          id: 'chap_3',
          title: 'To Infinity & Beyond',
          text: 'No matter where life takes us, my love for you expands with every heartbeat.',
          order: 3
        }
      ];

  const question = gift.content?.question || 'Will you travel across this infinite universe with me forever?';
  const choices = gift.content?.answerChoices?.length
    ? gift.content.answerChoices
    : ['To infinity and beyond! 🚀', 'My soul belongs with yours! ✨', 'Forever in your orbit! 💖'];

  const handleSelectChoice = async (choice: string) => {
    setSelectedAnswer(choice);
    sound.playHeartbeat();
    confetti({
      particleCount: 80,
      spread: 100,
      colors: ['#A855F7', '#EC4899', '#60A5FA', '#FFF']
    });

    if (onRespond && !isPreview) {
      setIsSubmitting(true);
      try {
        await onRespond({
          answer: choice,
          respondedAt: Date.now(),
          reactionEmoji: '🌌'
        });
        setHasResponded(true);
      } catch (err) {
        console.error('Error submitting infinite love response:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden select-none flex flex-col">
      {/* Deep Space Background with twinkling stars */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/40 via-slate-950 to-black" />

      {/* Top Header */}
      <div className="relative z-40 p-4 flex items-center justify-between border-b border-purple-900/30 bg-black/70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌌</span>
          <div>
            <h1 className="text-sm font-serif font-black text-purple-200">Infinite Love</h1>
            <p className="text-[10px] text-purple-400">
              {viewMode === '3d' ? '3D Cosmic Space Journey' : 'Cosmic Journey Letter'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 border border-purple-500/40 transition-all text-xs flex items-center gap-1.5 active:scale-95"
            title="Toggle between 3D Universe and 2D Scroll"
          >
            {viewMode === '3d' ? (
              <Box className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-pink-300" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {viewMode === '3d' ? '3D Cosmos' : '2D Scroll'}
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
            experienceName="Infinite Love"
          >
            <Loveverse3DViewer
              gift={gift}
              onInteract={(action) => {
                sound.playHeartbeat();
                setIsQuestionOpen(true);
              }}
              onSwitchTo2D={() => setViewMode('2d')}
            />
          </ExperienceErrorBoundary>

          {/* Quick CTA in 3D */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setIsQuestionOpen(true)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce transition-transform active:scale-95 border border-purple-400/40 cursor-pointer"
            >
              <span>💖</span>
              <span>Answer Cosmic Question</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* 2D Scrollable Cosmic Timeline */
        <div className="relative flex-1 overflow-y-auto">
          {/* Section 1: Cosmic Earth View Departure */}
          <section className="min-h-[85vh] flex flex-col items-center justify-center text-center p-6 relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative mb-6"
            >
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 shadow-[0_0_100px_rgba(59,130,246,0.5)] flex items-center justify-center text-6xl">
                🌍
              </div>
              <div className="absolute inset-0 rounded-full border border-purple-400/30 animate-ping" />
            </motion.div>

        <span className="text-xs font-mono uppercase tracking-widest text-purple-300 bg-purple-950/80 px-4 py-1 rounded-full border border-purple-800/60 mb-3">
          A Journey Dedicated to {recipientName}
        </span>

        <h2 className="font-serif font-black text-3xl md:text-5xl text-purple-100 max-w-xl">
          Beyond Every Star, I Choose You
        </h2>

        <p className="font-serif italic text-base md:text-lg text-purple-200/80 max-w-lg mt-3 leading-relaxed">
          "{mainMessage}"
        </p>

        <div className="mt-8 flex flex-col items-center gap-2 text-purple-400 text-xs font-mono animate-bounce">
          <span>Scroll down into the cosmos</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* Section 2: Cosmic Constellation Trail Chapters */}
      <section className="max-w-2xl mx-auto px-4 py-12 space-y-16 relative">
        {/* Glowing constellation spine line */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-rose-600 opacity-30 pointer-events-none" />

        {chapters.map((chap, idx) => (
          <motion.div
            key={chap.id || idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            className="relative z-10 p-6 md:p-8 rounded-3xl bg-stone-950/80 border border-purple-500/30 backdrop-blur-xl shadow-2xl text-center space-y-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 mx-auto flex items-center justify-center text-white text-sm font-black shadow-lg shadow-purple-500/50">
              <Star className="w-4 h-4 fill-white" />
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">
              Milestone Chapter {idx + 1}
            </span>

            <h3 className="font-serif font-black text-xl md:text-2xl text-pink-200">
              {chap.title}
            </h3>

            <p className="font-serif text-sm md:text-base text-purple-100/90 leading-relaxed italic max-w-md mx-auto">
              "{chap.text}"
            </p>
          </motion.div>
        ))}
      </section>

      {/* Section 3: Cosmic Finale Supernova Heart */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center text-center p-6 relative">
        <motion.div
          initial={{ scale: 0.9 }}
          whileInView={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl md:text-9xl filter drop-shadow-[0_0_50px_rgba(244,63,94,0.8)] mb-4"
        >
          💖
        </motion.div>

        <h3 className="font-serif font-black text-2xl md:text-3xl text-pink-100 mb-2">
          {question}
        </h3>

        <p className="text-xs text-purple-300 max-w-md mb-6">
          Presented by {creatorName} across time and space.
        </p>

        {/* Interactive Choices */}
        <div className="w-full max-w-md space-y-2.5">
          {choices.map((choice, idx) => {
            const isSelected = selectedAnswer === choice;
            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectChoice(choice)}
                disabled={isSubmitting}
                className={`w-full py-3.5 px-5 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-between transition-all border ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border-transparent shadow-xl shadow-purple-500/50'
                    : 'bg-stone-900/90 hover:bg-stone-800 text-purple-100 border-purple-800/60'
                }`}
              >
                <span>{choice}</span>
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 fill-white text-purple-600 shrink-0" />
                ) : (
                  <Heart className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                )}
              </motion.button>
            );
          })}
        </div>

        {hasResponded && (
          <div className="mt-4 p-3 bg-purple-950/80 border border-purple-500/50 rounded-xl text-purple-200 text-xs font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Your answer is recorded forever across the universe!
          </div>
        )}
      </section>
    </div>
  )}

  {/* 3D Cosmic Question Modal Overlay */}
  <AnimatePresence>
    {viewMode === '3d' && isQuestionOpen && (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-lg bg-stone-950/95 border border-purple-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white"
        >
          <button
            onClick={() => setIsQuestionOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-purple-950/80 hover:bg-purple-900 text-purple-300 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-500/40">
              💖
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 bg-purple-950 px-3 py-1 rounded-full border border-purple-800">
                Supernova Crystal Heart
              </span>
              <h3 className="font-serif font-black text-2xl text-purple-100 mt-2">
                For {recipientName}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/50 border border-purple-800/40">
              <p className="font-serif text-sm md:text-base text-purple-200 italic leading-relaxed">
                "{mainMessage}"
              </p>
            </div>

            <div className="pt-2 border-t border-purple-900/40 space-y-3">
              <h4 className="font-serif font-black text-base md:text-lg text-purple-100">
                {question}
              </h4>

              <div className="space-y-2">
                {choices.map((choice, idx) => {
                  const isSelected = selectedAnswer === choice;
                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectChoice(choice)}
                      disabled={isSubmitting}
                      className={`w-full py-3.5 px-5 rounded-2xl text-xs md:text-sm font-bold flex items-center justify-between transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border-transparent shadow-xl shadow-purple-500/50'
                          : 'bg-stone-900/90 hover:bg-stone-800 text-purple-100 border-purple-800/60'
                      }`}
                    >
                      <span>{choice}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 fill-white text-purple-600 shrink-0" />
                      ) : (
                        <Heart className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {hasResponded && (
                <div className="p-3 bg-purple-950/80 border border-purple-500/50 rounded-xl text-purple-200 text-xs font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Your answer is recorded forever across the universe!
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
