import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, X, Gift, RefreshCw, Calendar, Check } from 'lucide-react';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { useTheme } from '../../contexts/ThemeContext';
import { safeFormat } from '../../lib/dateUtils';
import { LoveButton } from './LoveButton';

export interface GiftUnwrapModalProps {
  gift: {
    id: string;
    giftId?: string;
    giftName?: string;
    name?: string;
    imageUrl?: string;
    image?: string;
    note?: string;
    message?: string;
    senderName?: string;
    senderId?: string;
    createdAt?: number | string | Date;
    cost?: number;
  } | null;
  onClose: () => void;
}

export function GiftUnwrapModal({ gift, onClose }: GiftUnwrapModalProps) {
  const { theme } = useTheme();
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  if (!gift) return null;

  const giftTitle = gift.giftName || gift.name || 'Eternal Rose';
  const giftMessage = gift.note || gift.message || 'Sent with pure, boundless love ❤️';
  const giftPhoto = gift.imageUrl || gift.image || 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80';

  const handleUnwrap = () => {
    sound.heartbeat();
    setIsShaking(true);

    setTimeout(() => {
      setIsShaking(false);
      setIsUnwrapped(true);
      sound.playSuccess();
      triggerHeartBurstConfetti(0.5, 0.45);
    }, 600);
  };

  const handleReplay = () => {
    sound.tap();
    setIsUnwrapped(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-sm rounded-[2.5rem] border p-6 text-center shadow-2xl overflow-hidden"
          style={{
            backgroundColor: theme?.colors?.cardBg || '#FFFFFF',
            borderColor: theme?.colors?.cardBorder || 'rgba(244, 114, 182, 0.3)',
            boxShadow: theme?.colors?.cardShadow || '0 20px 40px -10px rgba(244, 63, 94, 0.2)'
          }}
        >
          {/* Close trigger */}
          <button
            onClick={() => {
              sound.tap();
              onClose();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 opacity-70" />
          </button>

          {!isUnwrapped ? (
            /* Wrapped Present Box State */
            <div className="py-6 flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                Special Gift for You
              </span>
              <h3 className="font-serif font-black text-2xl mb-1 text-gray-900 dark:text-white">
                You Received a Gift!
              </h3>
              <p className="text-xs text-gray-500 mb-8 max-w-xs">
                A romantic token from your partner is waiting inside.
              </p>

              {/* 3D Animated Gift Box */}
              <motion.div
                animate={isShaking ? {
                  rotate: [-10, 10, -10, 10, -5, 5, 0],
                  scale: [1, 1.08, 0.95, 1.1, 1]
                } : {
                  y: [0, -8, 0],
                }}
                transition={isShaking ? {
                  duration: 0.6,
                  ease: 'easeInOut'
                } : {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                onClick={handleUnwrap}
                className="w-32 h-32 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 p-1 shadow-xl shadow-rose-300/40 cursor-pointer flex items-center justify-center relative group"
              >
                <div className="w-full h-full rounded-[1.4rem] bg-white/20 backdrop-blur-md flex flex-col items-center justify-center text-white relative overflow-hidden">
                  <Gift className="w-14 h-14 drop-shadow-md group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-90">
                    Tap to Open
                  </span>
                  {/* Ribbon cross */}
                  <div className="absolute inset-x-0 h-4 bg-white/30 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="absolute inset-y-0 w-4 bg-white/30 left-1/2 -translate-x-1/2 pointer-events-none" />
                </div>
              </motion.div>

              <div className="mt-8">
                <LoveButton
                  size="md"
                  onClick={handleUnwrap}
                  leftIcon={<Sparkles className="w-4 h-4 fill-current" />}
                >
                  Unwrap Romantic Surprise
                </LoveButton>
              </div>
            </div>
          ) : (
            /* Unwrapped & Revealed Gift State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="py-2 flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-lg border-2 border-white mb-4 relative bg-rose-50">
                <img
                  src={giftPhoto}
                  alt={giftTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                  Eternal
                </div>
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
                Delivered with Love
              </span>
              <h3 className="font-serif font-black text-xl text-gray-900 dark:text-white mb-2">
                {giftTitle}
              </h3>

              {/* Personal Message Card */}
              {giftMessage && (
                <div className="w-full p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 text-xs italic text-rose-900 dark:text-rose-200 mb-4 leading-relaxed">
                  "{giftMessage}"
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] opacity-60 mb-6">
                <Calendar className="w-3.5 h-3.5" />
                <span>Saved to your permanent couple gallery</span>
              </div>

              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={handleReplay}
                  className="p-2.5 rounded-2xl border border-rose-200 bg-white/80 hover:bg-white text-rose-600 transition-colors"
                  title="Replay opening"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <LoveButton
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    sound.tap();
                    onClose();
                  }}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Keep in Gallery
                </LoveButton>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
