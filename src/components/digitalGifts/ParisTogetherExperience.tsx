import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Heart, CheckCircle2, X, Sparkles, Send, Box, Layers } from 'lucide-react';
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

export function ParisTogetherExperience({ gift, isPreview, onRespond, onClose }: Props) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    gift.recipientResponse?.answer || null
  );
  const [customNote, setCustomNote] = useState(gift.recipientResponse?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(!!gift.recipientResponse);

  const creatorName = gift.creatorName || 'Your Love';
  const recipientName = gift.recipientName || 'My Beloved';
  const message = gift.content?.message || 'Pack your heart and let’s steal away into an unforgettable evening made just for the two of us.';
  const question = gift.content?.question || 'Will you join me for this special romantic rendezvous?';
  const location = gift.content?.location || 'Under the Golden Starlight (Our Special Place)';
  const date = gift.content?.date || 'This Saturday Evening • 7:30 PM';
  const choices = gift.content?.answerChoices?.length
    ? gift.content.answerChoices
    : ['Oui! A thousand times yes! 🗼', 'I would follow you anywhere! 🍷', 'Counting down every second! ✨'];

  const handleSelectChoice = async (choice: string) => {
    setSelectedAnswer(choice);
    sound.playHeartbeat();

    // Parisian Celebration Fireworks
    confetti({
      particleCount: 75,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#E8547A', '#F2A7BE', '#FBBF24', '#FFF6F9', '#818CF8']
    });

    if (onRespond && !isPreview) {
      setIsSubmitting(true);
      try {
        await onRespond({
          answer: choice,
          note: customNote,
          respondedAt: Date.now(),
          reactionEmoji: '🗼'
        });
        setHasResponded(true);
      } catch (err) {
        console.error('Error submitting response:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 overflow-hidden flex flex-col select-none">
      {/* Paris Twilight Sunset Backdrop */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-indigo-950 via-rose-950 to-amber-900/60" />

      {/* Floating Starlight Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-amber-200 rounded-full animate-ping"
            style={{
              top: `${(i * 19) % 70}%`,
              left: `${(i * 27) % 95}%`,
              animationDuration: `${3 + (i % 4)}s`,
              animationDelay: `${(i * 0.4) % 3}s`,
            }}
          />
        ))}
      </div>

      {/* Top Header */}
      <div className="relative z-30 p-4 flex items-center justify-between text-white border-b border-rose-900/40 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗼</span>
          <div>
            <h1 className="text-sm font-serif font-black text-rose-100">Paris Together</h1>
            <p className="text-[10px] text-rose-300">
              {viewMode === '3d' ? 'Interactive 3D Terrace' : 'Romantic Invitation'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-rose-400/30 transition-all text-xs flex items-center gap-1.5 active:scale-95"
            title="Toggle between 3D Terrace and 2D Ticket"
          >
            {viewMode === '3d' ? (
              <Box className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-rose-300" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {viewMode === '3d' ? '3D Terrace' : '2D Ticket'}
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
            experienceName="Paris Together"
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

          {/* Quick Floating Invitation CTA in 3D */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setIsLetterOpen(true)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce transition-transform active:scale-95 border border-white/30"
            >
              <span>💌</span>
              <span>Open RSVP Invitation</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Boarding Pass & Invitation Content (2D) */
        <main className="relative z-20 flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto w-full py-8 space-y-6 overflow-y-auto">
          {/* Eiffel Tower Silhouette Artwork */}
          <div className="relative text-center">
            <div className="w-28 h-28 md:w-36 md:h-36 mx-auto rounded-full bg-gradient-to-t from-amber-400/40 to-rose-400/20 blur-xl absolute inset-0" />
            <div className="relative text-7xl md:text-8xl drop-shadow-[0_12px_24px_rgba(232,84,122,0.5)]">
              🗼
            </div>
            <span className="text-xs font-serif font-extrabold tracking-widest text-amber-300 uppercase mt-2 inline-block">
              Une Soirée Romantique • Pour Deux
            </span>
          </div>

        {/* Vintage Parisian Boarding Pass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full bg-[#FFF6F9] rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-rose-200 text-slate-900 relative overflow-hidden"
        >
          {/* Decorative Stamp Accent */}
          <div className="absolute top-4 right-4 border-2 border-rose-300/80 rounded-xl px-2 py-1 text-[9px] font-mono font-black text-rose-500 uppercase tracking-widest transform rotate-6">
            Paris Pass • 1st Class
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                Special Invitation from {creatorName}
              </p>
              <h2 className="font-serif font-black text-2xl text-rose-950 mt-1">
                Dearest {recipientName},
              </h2>
            </div>

            {/* Invitation Message */}
            <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-inner">
              <p className="font-serif text-sm md:text-base text-rose-900 leading-relaxed italic">
                "{message}"
              </p>
            </div>

            {/* Date & Location Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/80 border border-rose-100">
                <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[9px] font-mono uppercase text-rose-400 font-bold">Rendezvous Date</span>
                  <span className="block text-xs font-bold text-rose-950 truncate">{date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/80 border border-rose-100">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[9px] font-mono uppercase text-rose-400 font-bold">Rendezvous Location</span>
                  <span className="block text-xs font-bold text-rose-950 truncate">{location}</span>
                </div>
              </div>
            </div>

            {/* The Big Question */}
            <div className="pt-4 border-t border-rose-100 text-center space-y-3">
              <h3 className="font-serif font-black text-lg text-rose-950">
                {question}
              </h3>

              {/* Interactive Answers */}
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
                          ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white border-transparent shadow-lg shadow-rose-300/60'
                          : 'bg-white hover:bg-rose-50 text-rose-950 border-rose-200'
                      }`}
                    >
                      <span>{choice}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 fill-white text-rose-500 shrink-0" />
                      ) : (
                        <Heart className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {hasResponded && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Your answer has been sent to {creatorName} with fireworks!
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    )}

      {/* 3D Invitation Modal Overlay */}
      <AnimatePresence>
        {viewMode === '3d' && isLetterOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#FFF6F9] rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-rose-200 text-slate-900 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsLetterOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-700 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider">
                    Invitation from {creatorName}
                  </p>
                  <h2 className="font-serif font-black text-2xl text-rose-950 mt-1">
                    Dearest {recipientName},
                  </h2>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-inner">
                  <p className="font-serif text-sm md:text-base text-rose-900 leading-relaxed italic">
                    "{message}"
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/80 border border-rose-100">
                    <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[9px] font-mono uppercase text-rose-400 font-bold">Rendezvous Date</span>
                      <span className="block text-xs font-bold text-rose-950 truncate">{date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50/80 border border-rose-100">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-[9px] font-mono uppercase text-rose-400 font-bold">Rendezvous Location</span>
                      <span className="block text-xs font-bold text-rose-950 truncate">{location}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-rose-100 text-center space-y-3">
                  <h3 className="font-serif font-black text-lg text-rose-950">
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
                              ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white border-transparent shadow-lg shadow-rose-300/60'
                              : 'bg-white hover:bg-rose-50 text-rose-950 border-rose-200'
                          }`}
                        >
                          <span>{choice}</span>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 fill-white text-rose-500 shrink-0" />
                          ) : (
                            <Heart className="w-3.5 h-3.5 text-rose-300 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {hasResponded && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Your answer has been sent to {creatorName} with fireworks!
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
