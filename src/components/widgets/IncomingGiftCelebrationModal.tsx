import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { SHOP_CATALOG } from '../../types/coins';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, X, Send, Gift, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SEEN_GIFTS_KEY = 'lovelink_seen_gifts_';

export function IncomingGiftCelebrationModal() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const navigate = useNavigate();

  const [activeGift, setActiveGift] = useState<any | null>(null);
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    if (!space?.id || !userData?.id) return;

    const seenStorageKey = `${SEEN_GIFTS_KEY}${space.id}_${userData.id}`;
    let seenGiftIds = new Set<string>();
    try {
      const stored = localStorage.getItem(seenStorageKey);
      if (stored) {
        seenGiftIds = new Set(JSON.parse(stored));
      }
    } catch {
      seenGiftIds = new Set();
    }

    const giftsQuery = query(
      collection(db, `coupleSpaces/${space.id}/virtualGifts`),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(
      giftsQuery,
      (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const gift = doc.data();
          const giftDocId = doc.id || gift.id;

          // Only process gifts meant for this user or sent by partner
          const isSender = gift.senderId === userData.id;
          if (isSender) return;

          // Check if already acknowledged
          if (seenGiftIds.has(giftDocId)) return;

          // Check if fresh (sent within the last 12 hours)
          const isRecent = Date.now() - (gift.createdAt || 0) < 12 * 3600 * 1000;
          if (isRecent) {
            seenGiftIds.add(giftDocId);
            try {
              localStorage.setItem(seenStorageKey, JSON.stringify(Array.from(seenGiftIds).slice(-30)));
            } catch {}

            // Trigger incoming gift modal
            setActiveGift({ ...gift, id: giftDocId });
            setIsOpened(false);
            sound.playLoveAlert();
          }
        });
      },
      (err) => {
        console.warn('Real-time virtual gift listener note:', err);
      }
    );

    return () => unsubscribe();
  }, [space?.id, userData?.id]);

  const handleOpenGift = () => {
    setIsOpened(true);
    triggerHeartBurstConfetti(0.5, 0.45);
  };

  const handleDismiss = () => {
    sound.tap();
    setActiveGift(null);
    setIsOpened(false);
  };

  const handleOpenChat = () => {
    sound.tap();
    setActiveGift(null);
    setIsOpened(false);
    navigate('/chat');
  };

  if (!activeGift) return null;

  // Find corresponding catalog item for high-res 3D artwork
  const catalogItem = SHOP_CATALOG.find((item) => item.id === activeGift.giftId);
  const giftImage = catalogItem?.image || activeGift.image;
  const giftIcon = catalogItem?.icon || '🎁';
  const partnerName = partnerData?.displayName?.split(' ')[0] || 'Your Partner';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="bg-gradient-to-b from-white via-[#FFF6F9] to-[#FFF0F5] w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-rose-200/80 relative text-center overflow-hidden"
        >
          {/* Subtle background glow effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-rose-600 text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>Loveverse Surprise</span>
          </div>

          <h3 className="font-serif font-black text-xl text-[#2B1A2E] leading-tight">
            Surprise from {partnerName}!
          </h3>
          <p className="text-xs text-[#9B7A87] mt-0.5">
            {isOpened ? 'Delivered straight to your little world' : 'A romantic gift is waiting for you'}
          </p>

          {!isOpened ? (
            /* Wrapped Gift Box Stage */
            <div className="my-6 space-y-4">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, -2, 2, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                onClick={handleOpenGift}
                className="w-40 h-40 mx-auto rounded-3xl bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 flex flex-col items-center justify-center text-white shadow-xl shadow-rose-300/50 cursor-pointer relative group border-4 border-white"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner mb-2 group-hover:scale-110 transition-transform">
                  🎁
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                  Tap to Open
                </span>
              </motion.div>

              <button
                onClick={handleOpenGift}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-rose-300/50 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <PartyPopper className="w-4 h-4 text-amber-300" />
                <span>Open Virtual Gift</span>
              </button>
            </div>
          ) : (
            /* Opened Gift Showcase Stage with Heart Burst Celebration */
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {/* 3D Gift Showcase Container */}
              <div 
                onClick={() => triggerHeartBurstConfetti(0.5, 0.45)}
                title="Tap for heart burst!"
                className="relative my-4 aspect-square w-48 mx-auto rounded-3xl overflow-hidden bg-gradient-to-tr from-pink-100 via-rose-50 to-purple-100 p-2 shadow-lg shadow-rose-200/60 border border-white cursor-pointer group"
              >
                {giftImage ? (
                  <img
                    src={giftImage}
                    alt={activeGift.giftName}
                    className="w-full h-full object-cover rounded-2xl shadow-inner group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl">
                    {giftIcon}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl pointer-events-none" />
                
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-rose-600 shadow-xs flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 fill-rose-500" />
                  <span>Tap for burst</span>
                </div>
              </div>

              <h4 className="font-serif font-black text-lg text-rose-600 tracking-tight">
                {activeGift.giftName || catalogItem?.name || 'A Special Gift'}
              </h4>

              {/* Partner's Whispered Note */}
              {activeGift.note ? (
                <div className="mt-3 px-4 py-3 rounded-2xl bg-white/90 border border-rose-200/60 shadow-xs text-xs text-[#2B1A2E] italic font-serif leading-relaxed">
                  "{activeGift.note}"
                </div>
              ) : (
                <p className="text-xs text-[#9B7A87] mt-1">
                  Sent with infinite warmth and love ❤️
                </p>
              )}

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={handleOpenChat}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-300/50 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Say Thank You in Chat</span>
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full py-2.5 rounded-xl bg-transparent text-[#9B7A87] hover:text-[#2B1A2E] text-xs font-semibold transition-colors"
                >
                  Keep in My Keepsakes
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
