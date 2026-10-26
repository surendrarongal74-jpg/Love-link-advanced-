import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, Heart, Send, CheckCircle2, X, RefreshCw, Box, Layers } from 'lucide-react';
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

export function EverTideIslandExperience({ gift, isPreview, onRespond, onClose }: Props) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBottleOpened, setIsBottleOpened] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(
    gift.recipientResponse?.answer || null
  );
  const [customNote, setCustomNote] = useState(gift.recipientResponse?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(!!gift.recipientResponse);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioIntervalRef = useRef<any>(null);

  // Synthesize peaceful ambient ocean waves using Web Audio API (zero external assets needed)
  const toggleAmbientAudio = () => {
    if (isPlayingAudio) {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Wave sound generator using filtered pink/white noise
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const playWave = () => {
          if (!audioContextRef.current) return;
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(280, ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 3);
          filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 6);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.01, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2.5);
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 6);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          noise.start();
          noise.stop(ctx.currentTime + 6.2);
        };

        playWave();
        audioIntervalRef.current = setInterval(playWave, 6000);
        setIsPlayingAudio(true);
      } catch (e) {
        console.warn('Audio synthesis note:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleSelectChoice = async (choice: string) => {
    setSelectedAnswer(choice);
    sound.playHeartbeat();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F2A7BE', '#E8547A', '#FFF6F9', '#FFD1DC']
    });

    if (onRespond && !isPreview) {
      setIsSubmitting(true);
      try {
        await onRespond({
          answer: choice,
          note: customNote,
          respondedAt: Date.now(),
          reactionEmoji: '💖'
        });
        setHasResponded(true);
      } catch (err) {
        console.error('Error submitting response:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCustomNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnswer || isSubmitting) return;
    if (onRespond && !isPreview) {
      setIsSubmitting(true);
      try {
        await onRespond({
          answer: selectedAnswer,
          note: customNote,
          respondedAt: Date.now(),
          reactionEmoji: '💌'
        });
        setHasResponded(true);
        sound.playSuccess();
      } catch (err) {
        console.error('Error updating note:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const creatorName = gift.creatorName || 'Your Love';
  const recipientName = gift.recipientName || 'My Soulmate';
  const question = gift.content?.question || 'Will you always be my favorite person to watch sunsets with?';
  const message = gift.content?.message || 'Across every ocean, my heart always finds its home right beside you.';
  const choices = gift.content?.answerChoices?.length
    ? gift.content.answerChoices
    : ['Yes, forever and ever! 💖', 'Always and unconditionally! ✨', 'You hold my heart! 🌊'];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 overflow-hidden flex flex-col select-none">
      {/* 3D vs 2D Environment Render */}
      {viewMode === '3d' ? (
        <ExperienceErrorBoundary
          fallbackTo2D={() => setViewMode('2d')}
          experienceName="Ever Tide Island"
        >
          <Loveverse3DViewer
            gift={gift}
            onInteract={(action) => {
              sound.playPop();
              setIsBottleOpened(true);
            }}
            onSwitchTo2D={() => setViewMode('2d')}
          />
        </ExperienceErrorBoundary>
      ) : (
        /* Classic Lightweight 2D View */
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-rose-900 to-amber-600 transition-colors duration-1000">
          {/* Twinkling Stars in Upper Sky */}
          <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none">
            {[...Array(24)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  top: `${(i * 17) % 45}%`,
                  left: `${(i * 29) % 95}%`,
                  opacity: 0.3 + (i % 5) * 0.15,
                  animationDuration: `${2 + (i % 4)}s`,
                  animationDelay: `${(i * 0.3) % 2}s`,
                }}
              />
            ))}
          </div>

          {/* Floating Clouds */}
          <motion.div
            animate={{ x: ['-10%', '110%'] }}
            transition={{ repeat: Infinity, duration: 45, ease: 'linear' }}
            className="absolute top-12 left-0 w-72 h-16 bg-white/10 blur-xl rounded-full pointer-events-none"
          />
          <motion.div
            animate={{ x: ['110%', '-10%'] }}
            transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
            className="absolute top-24 right-0 w-96 h-20 bg-rose-300/10 blur-2xl rounded-full pointer-events-none"
          />

          {/* The Golden Setting Sun */}
          <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-t from-amber-300 via-rose-400 to-amber-200 shadow-[0_0_90px_rgba(251,191,36,0.6)] animate-pulse" />
            <div className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full bg-amber-400/20 blur-3xl" />
          </div>

          {/* Flying Sky Banner Asking Question */}
          <motion.div
            initial={{ x: '-120%' }}
            animate={{ x: '120%' }}
            transition={{ repeat: Infinity, duration: 24, ease: 'easeInOut', repeatDelay: 6 }}
            onClick={() => setIsBottleOpened(true)}
            className="absolute top-16 md:top-20 z-20 cursor-pointer flex items-center gap-2 group"
          >
            <div className="text-2xl drop-shadow-md">✈️</div>
            <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg border border-rose-200/60 flex items-center gap-2 group-hover:scale-105 transition-transform">
              <span className="text-xs font-serif font-bold text-rose-950 truncate max-w-xs md:max-w-md">
                💌 For {recipientName}: "{question}"
              </span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                Tap to open
              </span>
            </div>
          </motion.div>

          {/* Rolling Ocean Horizon & Gradient Water */}
          <div className="absolute bottom-0 left-0 right-0 h-[48%] overflow-hidden">
            {/* Deep Water Base */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-600/70 via-rose-950 to-slate-950" />

            {/* Shimmering Sun Reflection on Water */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 md:w-48 h-full bg-gradient-to-b from-amber-300/40 via-amber-400/15 to-transparent blur-md" />

            {/* Wave Layer 1 */}
            <svg
              className="absolute top-0 left-0 right-0 w-[200%] h-12 text-rose-500/20 animate-[wave_12s_linear_infinite]"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
                fill="currentColor"
              />
            </svg>

            {/* Wave Layer 2 */}
            <svg
              className="absolute top-4 left-0 right-0 w-[200%] h-14 text-amber-500/15 animate-[wave_8s_linear_infinite]"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,20 C200,80 400,-20 600,40 C800,100 1000,-10 1200,30 L1200,120 L0,120 Z"
                fill="currentColor"
              />
            </svg>

            {/* Tropical Sandy Island Shoreline */}
            <div className="absolute bottom-0 left-0 right-0 h-40 md:h-52 bg-gradient-to-t from-stone-900 via-amber-950/80 to-transparent flex items-end justify-center px-4">
              <div className="absolute -left-6 bottom-4 md:left-6 md:bottom-8 text-5xl md:text-7xl opacity-90 filter drop-shadow-lg select-none pointer-events-none transform -rotate-12">
                🌴
              </div>
              <div className="absolute -right-6 bottom-6 md:right-8 md:bottom-10 text-5xl md:text-7xl opacity-90 filter drop-shadow-lg select-none pointer-events-none transform rotate-12">
                🌴
              </div>

              {/* Couple Avatars Sitting on the Shore */}
              <div className="relative z-10 flex flex-col items-center mb-6">
                <div className="mb-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-center shadow-lg">
                  <span className="text-[11px] font-serif font-black tracking-wider text-rose-200">
                    {creatorName} & {recipientName}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 text-4xl md:text-5xl filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    🧑‍🤝‍🧑
                  </motion.div>
                </div>
                <div className="text-[10px] text-amber-200/80 font-medium mt-1">
                  Ever Tide Sanctuary • Island for Two
                </div>
              </div>

              {/* Floating Message Bottle in the surf */}
              <motion.button
                animate={{ y: [0, -8, 0], rotate: [-4, 6, -4] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                onClick={() => {
                  sound.playPop();
                  setIsBottleOpened(true);
                }}
                className="absolute bottom-16 right-16 md:right-32 z-20 group cursor-pointer focus:outline-none"
                title="Open the message bottle"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-amber-400/30 blur-md group-hover:bg-rose-400/50 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center text-3xl group-hover:scale-125 transition-transform">
                    🍾
                  </div>
                  <div className="absolute -top-6 -left-6 bg-white/90 text-rose-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap animate-bounce">
                    Open Letter ✨
                  </div>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD Controls (Audio, 3D Toggle, Close, Title) */}
      <div className="relative z-30 p-4 flex items-center justify-between text-white pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-sm">
            🏝️
          </div>
          <div>
            <h1 className="text-sm font-serif font-bold text-white leading-tight">
              {gift.title || 'Ever Tide: Our Sunset Island'}
            </h1>
            <p className="text-[10px] text-rose-200">
              {viewMode === '3d' ? 'Interactive 3D World' : 'Lightweight 2D View'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <button
            onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
            className="px-2.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 text-xs flex items-center gap-1.5 border border-white/20"
            title="Toggle between 3D world and 2D view"
          >
            {viewMode === '3d' ? (
              <Box className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-rose-300" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {viewMode === '3d' ? '3D Active' : '2D Mode'}
            </span>
          </button>

          <button
            onClick={toggleAmbientAudio}
            className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95 text-xs flex items-center gap-1.5"
            title="Toggle soothing ocean soundscape"
          >
            {isPlayingAudio ? (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-75" />
            )}
            <span className="hidden sm:inline text-[11px] font-medium">
              {isPlayingAudio ? 'Waves' : 'Sound'}
            </span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95"
              title="Close Experience"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Letter Modal */}
      <AnimatePresence>
        {isBottleOpened && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#FFF6F9] rounded-3xl p-6 shadow-2xl border-2 border-rose-200 text-slate-900 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsBottleOpened(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2 mb-4">
                <span className="inline-block p-3 rounded-full bg-rose-100 text-rose-600 shadow-inner text-2xl">
                  💌
                </span>
                <span className="block text-[11px] font-extrabold tracking-widest uppercase text-rose-500">
                  A Letter from {creatorName}
                </span>
                <h3 className="font-serif font-black text-xl text-rose-950">
                  {gift.title}
                </h3>
              </div>

              {/* Heartfelt Note Body */}
              <div className="bg-white/80 p-4 rounded-2xl border border-rose-100 shadow-inner mb-5">
                <p className="font-serif text-sm md:text-base text-rose-900 leading-relaxed italic text-center">
                  "{message}"
                </p>
              </div>

              {/* The Grand Question */}
              <div className="text-center mb-5">
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                  Special Question
                </p>
                <h4 className="font-serif font-black text-lg text-rose-950">
                  {question}
                </h4>
              </div>

              {/* Interactive Answer Choices */}
              <div className="space-y-2.5 mb-5">
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
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-lg shadow-rose-300/50 scale-[1.02]'
                          : 'bg-white hover:bg-rose-50/80 text-rose-950 border-rose-200'
                      }`}
                    >
                      <span className="flex-1 text-left">{choice}</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 ml-2 fill-white text-rose-500 shrink-0" />
                      ) : (
                        <Heart className="w-3.5 h-3.5 ml-2 text-rose-300 shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Optional Sweet Response Note */}
              {selectedAnswer && (
                <form onSubmit={handleCustomNoteSubmit} className="space-y-3 pt-3 border-t border-rose-100">
                  <label className="block text-xs font-bold text-rose-800">
                    Add a whispered response note (optional):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="Write your sweet words back..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </div>
                </form>
              )}

              {/* Status footer */}
              {hasResponded && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Response recorded! Your partner can see your romantic answer.</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
