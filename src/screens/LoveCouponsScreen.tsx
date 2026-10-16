import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { db } from '../lib/firebase';
import { 
  collection, query, onSnapshot, doc, setDoc, updateDoc, deleteDoc, orderBy 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { sound } from '../lib/sound';
import { generateAiraLoveCoupons, LoveCouponIdea } from '../lib/ai';
import { BottomNav } from '../components/BottomNav';
import confetti from 'canvas-confetti';
import { 
  Gift, Sparkles, Heart, Plus, Wand2, CheckCircle2, 
  Clock, Flame, ChevronLeft, Tag, Info, Trophy, 
  Send, RefreshCw, X, Award, Smile, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export interface LoveCoupon {
  id: string;
  coupleSpaceId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  category: 'Sweet Gestures' | 'Romantic Dates' | 'Playful Favors' | 'Custom Wagers' | string;
  tokenCost: number;
  emoji: string;
  status: 'available' | 'claimed' | 'redeemed';
  description?: string;
  terms?: string;
  redeemedBy?: string;
  redeemedAt?: number;
  createdAt: number;
  updatedAt: number;
}

const STARTER_COUPONS: Omit<LoveCoupon, 'id' | 'coupleSpaceId' | 'creatorId' | 'creatorName' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "15-Minute Unconditional Back & Neck Rub",
    description: "Full focus, soothing lotion, and relaxing vibes whenever requested.",
    category: "Sweet Gestures",
    tokenCost: 60,
    emoji: "💆",
    status: "available",
    terms: "Redeemable anytime on the couch or before bedtime."
  },
  {
    title: "Pass: You Choose Whatever We Watch Tonight",
    description: "Zero complaints, full popcorn, and your favorite movie or series.",
    category: "Playful Favors",
    tokenCost: 50,
    emoji: "🎬",
    status: "available",
    terms: "Valid for one complete movie or TV binge evening."
  },
  {
    title: "Spontaneous Ice Cream & Late Night Drive",
    description: "Windows down, curated playlist, and favorite scoops under the stars.",
    category: "Romantic Dates",
    tokenCost: 120,
    emoji: "🍦",
    status: "available",
    terms: "Can be cashed in on any weekday or weekend night."
  },
  {
    title: "Warm Breakfast in Bed on Sunday Morning",
    description: "Hot coffee/tea, fluffy pancakes or eggs, and breakfast served right to bed.",
    category: "Sweet Gestures",
    tokenCost: 150,
    emoji: "☕",
    status: "available",
    terms: "Redeemable on the weekend with sleepy cuddles included."
  },
  {
    title: "One Free Chore Pass (Dishes or Laundry)",
    description: "Your partner takes full responsibility for one household chore.",
    category: "Playful Favors",
    tokenCost: 80,
    emoji: "🫧",
    status: "available",
    terms: "Instant immunity from one specified chore duty."
  },
  {
    title: "Spontaneous 30-Minute Slow Dance in the Kitchen",
    description: "Candles lit, your favorite romantic song playing on repeat.",
    category: "Romantic Dates",
    tokenCost: 100,
    emoji: "💃",
    status: "available",
    terms: "Just the two of us holding each other close."
  }
];

const CATEGORIES = ['All', 'Sweet Gestures', 'Romantic Dates', 'Playful Favors', 'Custom Wagers'] as const;

export function LoveCouponsScreen() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { wallet, spendCoins } = useLoveCoins();
  const navigate = useNavigate();
  
  const [coupons, setCoupons] = useState<LoveCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'redeemed'>('all');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiraModal, setShowAiraModal] = useState(false);
  const [isGeneratingAira, setIsGeneratingAira] = useState(false);
  const [airaSuggestions, setAiraSuggestions] = useState<LoveCouponIdea[]>([]);
  const [redeemConfirmCoupon, setRedeemConfirmCoupon] = useState<LoveCoupon | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<string>('Sweet Gestures');
  const [newTokenCost, setNewTokenCost] = useState<number>(75);
  const [newEmoji, setNewEmoji] = useState('💌');
  const [newTerms, setNewTerms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const streak = space?.streak || 1;
  // Authoritative Love Coins wallet balance (Action-earned only)
  const currentLoveTokens = wallet?.balance ?? 50;

  // Real-time Firestore query on couple's coupons
  useEffect(() => {
    if (!space?.id) return;

    const couponsQuery = query(
      collection(db, `coupleSpaces/${space.id}/loveCoupons`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(couponsQuery, async (snapshot) => {
      if (snapshot.empty && !snapshot.metadata.hasPendingWrites) {
        // Seed initial starter coupons
        if (userData?.id) {
          const now = Date.now();
          for (let i = 0; i < STARTER_COUPONS.length; i++) {
            const starter = STARTER_COUPONS[i];
            const couponId = `coupon_${now}_${i}`;
            const newDoc: Record<string, any> = {
              id: couponId,
              coupleSpaceId: space.id,
              creatorId: userData.id,
              creatorName: userData.displayName?.split(' ')[0] || 'Partner',
              title: starter.title,
              category: starter.category,
              tokenCost: starter.tokenCost,
              emoji: starter.emoji,
              status: starter.status,
              createdAt: now - (i * 1000),
              updatedAt: now - (i * 1000),
            };
            if (starter.description) newDoc.description = starter.description;
            if (starter.terms) newDoc.terms = starter.terms;

            await setDoc(doc(db, `coupleSpaces/${space.id}/loveCoupons`, couponId), newDoc).catch(console.error);
          }
        }
      } else {
        const fetched = snapshot.docs.map(d => d.data() as LoveCoupon);
        setCoupons(fetched);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space.id}/loveCoupons`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [space?.id, userData?.id]);

  // Handle Redeem coupon
  const handleRedeemCoupon = async (coupon: LoveCoupon) => {
    if (!space?.id || !userData?.id) return;

    if (currentLoveTokens < coupon.tokenCost) {
      sound.pop();
      alert(`You need ${coupon.tokenCost - currentLoveTokens} more Love Coins to redeem this coupon! Complete missions in Earn Coins.`);
      return;
    }

    sound.playCelebration();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24']
    });

    const now = Date.now();
    try {
      // Deduct coins atomically via backend transaction
      await spendCoins(coupon.id, 'coupon', coupon.tokenCost);

      const updatePayload: Record<string, any> = {
        status: 'redeemed',
        redeemedBy: userData.id,
        redeemedAt: now,
        updatedAt: now
      };
      await updateDoc(doc(db, `coupleSpaces/${space.id}/loveCoupons`, coupon.id), updatePayload);
      setRedeemConfirmCoupon(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/loveCoupons/${coupon.id}`);
    }
  };

  // Handle Create Custom Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space?.id || !userData?.id || !newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    sound.playChime();

    const now = Date.now();
    const couponId = `coupon_${now}_${userData.id}`;
    const payload: Record<string, any> = {
      id: couponId,
      coupleSpaceId: space.id,
      creatorId: userData.id,
      creatorName: userData.displayName?.split(' ')[0] || 'Partner',
      title: newTitle.trim(),
      category: newCategory,
      tokenCost: Number(newTokenCost) || 50,
      emoji: newEmoji || '💌',
      status: 'available',
      createdAt: now,
      updatedAt: now
    };

    if (newDesc.trim()) {
      payload.description = newDesc.trim();
    }
    if (newTerms.trim()) {
      payload.terms = newTerms.trim();
    }

    try {
      await setDoc(doc(db, `coupleSpaces/${space.id}/loveCoupons`, couponId), payload);
      sound.playSuccess();
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewTerms('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space.id}/loveCoupons/${couponId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate AIRA Coupons
  const handleOpenAiraConcierge = async () => {
    sound.playPop();
    setShowAiraModal(true);
    if (airaSuggestions.length === 0) {
      await fetchAiraCoupons();
    }
  };

  const fetchAiraCoupons = async () => {
    setIsGeneratingAira(true);
    try {
      const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
      const items = await generateAiraLoveCoupons(partnerName, selectedCategory, 'Quality Time');
      setAiraSuggestions(items);
      sound.playChime();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAira(false);
    }
  };

  // Add generated AIRA coupon directly to vault
  const handleAddAiraCoupon = async (idea: LoveCouponIdea) => {
    if (!space?.id || !userData?.id) return;
    sound.playChime();
    const now = Date.now();
    const couponId = `coupon_${now}_${userData.id}`;

    const payload: Record<string, any> = {
      id: couponId,
      coupleSpaceId: space.id,
      creatorId: userData.id,
      creatorName: userData.displayName?.split(' ')[0] || 'Partner',
      title: idea.title,
      category: idea.category || 'Sweet Gestures',
      tokenCost: idea.tokenCost || 75,
      emoji: idea.emoji || '💖',
      status: 'available',
      createdAt: now,
      updatedAt: now
    };

    if (idea.description) payload.description = idea.description;
    if (idea.terms) payload.terms = idea.terms;

    try {
      await setDoc(doc(db, `coupleSpaces/${space.id}/loveCoupons`, couponId), payload);
      sound.playSuccess();
      setAiraSuggestions(prev => prev.filter(c => c.title !== idea.title));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space.id}/loveCoupons/${couponId}`);
    }
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter(c => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'available' 
      ? c.status === 'available' 
      : c.status === 'redeemed';
    return matchesCategory && matchesStatus;
  });

  const availableCount = coupons.filter(c => c.status === 'available').length;
  const redeemedCount = coupons.filter(c => c.status === 'redeemed').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/80 via-pink-50/40 to-purple-50/50 pb-28 text-gray-800">
      {/* Top Header */}
      <div className="pt-6 px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            onClick={() => sound.playPop()}
            className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100/90 rounded-full text-rose-700 text-xs font-bold border border-rose-200 shadow-2xs">
            <Gift className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Love Rewards & Date Vault</span>
          </div>

          <button
            onClick={() => { sound.playPop(); setShowCreateModal(true); }}
            className="w-10 h-10 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center shadow-md shadow-rose-300/50 transition-all"
            title="Create Custom Coupon"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Token Wallet Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-rose-200/90 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white p-5">
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                ✨ Shared Couple Perks
              </span>
              <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-white/10">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{streak} Day Streak</span>
              </div>
            </div>

            <div>
              <div className="text-3xl font-serif font-black tracking-tight text-white flex items-center gap-2">
                <span>{currentLoveTokens}</span>
                <span className="text-xl text-amber-300 font-sans">🪙</span>
                <span className="text-xs uppercase tracking-wider font-sans font-bold text-rose-100 bg-white/15 px-2.5 py-0.5 rounded-full">
                  Love Sparks
                </span>
              </div>
              <p className="text-xs text-rose-100/90 pt-1">
                Earned from daily quiz questions, rhythm streaks, and memory logs. Redeemable for real couple perks!
              </p>
            </div>

            {/* Quick Action CTA Strip */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playPop();
                  navigate('/earn-coins');
                }}
                className="py-2.5 px-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Coins className="w-3.5 h-3.5 fill-amber-900" />
                <span>+ Earn Coins</span>
              </button>

              <button
                onClick={handleOpenAiraConcierge}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Wand2 className="w-3.5 h-3.5 text-rose-500" />
                <span>AIRA Concierge</span>
              </button>

              <button
                onClick={() => { sound.playPop(); setShowCreateModal(true); }}
                className="py-2.5 px-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center justify-center gap-1 border border-white/30 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Switcher & Category Filter Pills */}
        <div className="mt-4 space-y-2">
          {/* Status Segmented Control */}
          <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-2xl border border-rose-100 shadow-2xs">
            <button
              onClick={() => { sound.playPop(); setStatusFilter('all'); }}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                statusFilter === 'all' 
                  ? 'bg-rose-500 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({coupons.length})
            </button>
            <button
              onClick={() => { sound.playPop(); setStatusFilter('available'); }}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                statusFilter === 'available' 
                  ? 'bg-rose-500 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Available ({availableCount})
            </button>
            <button
              onClick={() => { sound.playPop(); setStatusFilter('redeemed'); }}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                statusFilter === 'redeemed' 
                  ? 'bg-rose-500 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Redeemed ({redeemedCount})
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { sound.playPop(); setSelectedCategory(cat); }}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white/80 text-gray-600 hover:bg-white border border-rose-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Coupons List */}
        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="bg-white rounded-3xl p-8 text-center text-rose-300 space-y-2 border border-rose-100">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-400" />
              <p className="text-xs font-bold">Unlocking Couple Vault...</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 space-y-3">
              <span className="text-4xl">💌</span>
              <div>
                <h3 className="font-serif font-bold text-base text-gray-800">No Coupons in this Category</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                  Gift a new romantic favor or tap AIRA Concierge to generate ideas tailored to your love story!
                </p>
              </div>
              <button
                onClick={handleOpenAiraConcierge}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-300/40"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Ask AIRA for Perks</span>
              </button>
            </div>
          ) : (
            filteredCoupons.map((coupon) => {
              const isRedeemed = coupon.status === 'redeemed';
              const isCreator = coupon.creatorId === userData?.id;

              return (
                <motion.div
                  key={coupon.id}
                  layout
                  className={`bg-white rounded-3xl p-4 border transition-all relative overflow-hidden shadow-sm hover:shadow-md ${
                    isRedeemed 
                      ? 'border-gray-200 opacity-75 bg-gray-50/60' 
                      : 'border-rose-100/90'
                  }`}
                >
                  {/* Stamp Graphic if Redeemed */}
                  {isRedeemed && (
                    <div className="absolute top-3 right-3 border-2 border-rose-400 text-rose-500 font-extrabold text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-lg rotate-12 bg-rose-50/80 shadow-2xs">
                      ✓ Redeemed
                    </div>
                  )}

                  <div className="flex items-start gap-3.5">
                    {/* Emoji Icon Container */}
                    <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-2xs ${
                      isRedeemed ? 'bg-gray-100 text-gray-400' : 'bg-rose-50 text-rose-500 border border-rose-100'
                    }`}>
                      {coupon.emoji}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 shrink-0">
                          {coupon.category}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5 shrink-0">
                          <span>🪙 {coupon.tokenCost}</span>
                        </span>
                      </div>

                      <h3 className={`font-serif font-bold text-sm leading-snug ${
                        isRedeemed ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {coupon.title}
                      </h3>

                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {coupon.description}
                        </p>
                      )}

                      {coupon.terms && (
                        <p className="text-[10px] text-gray-400 italic mt-1">
                          Rule: {coupon.terms}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-rose-50">
                        <span className="text-[10px] text-gray-400">
                          Gifted by <strong className="text-gray-600">{coupon.creatorName}</strong>
                        </span>

                        {!isRedeemed ? (
                          <button
                            onClick={() => { sound.playPop(); setRedeemConfirmCoupon(coupon); }}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-sm shadow-rose-300/40 active:scale-95 transition-all flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 fill-white" />
                            <span>Redeem Perk</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Cashed in</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal to Redeem */}
      <AnimatePresence>
        {redeemConfirmCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-rose-100 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 text-3xl flex items-center justify-center mx-auto shadow-sm">
                {redeemConfirmCoupon.emoji}
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  Redeem Romantic Perk
                </span>
                <h3 className="font-serif font-black text-lg text-gray-900 mt-2">
                  {redeemConfirmCoupon.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ready to cash this in with your partner? It will be stamped as redeemed in your shared vault.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setRedeemConfirmCoupon(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  Keep for Later
                </button>
                <button
                  onClick={() => handleRedeemCoupon(redeemConfirmCoupon)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold shadow-md shadow-rose-300/40 hover:from-rose-600 hover:to-pink-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Claim Now!</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AIRA Concierge Modal */}
      <AnimatePresence>
        {showAiraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-rose-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-gray-900">AIRA Perk Concierge</h3>
                    <p className="text-[10px] text-gray-400">AI-tailored romantic favors</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiraModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {isGeneratingAira ? (
                  <div className="py-12 text-center text-rose-400 space-y-2">
                    <RefreshCw className="w-7 h-7 animate-spin mx-auto text-rose-500" />
                    <p className="text-xs font-bold text-gray-700">AIRA is crafting bespoke perks...</p>
                    <p className="text-[11px] text-gray-400">Personalizing for your partner's love language</p>
                  </div>
                ) : airaSuggestions.length === 0 ? (
                  <div className="py-8 text-center space-y-2 text-xs text-gray-500">
                    <p>All perks added to your vault!</p>
                    <button
                      onClick={fetchAiraCoupons}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs"
                    >
                      Generate 4 More Perks
                    </button>
                  </div>
                ) : (
                  airaSuggestions.map((idea, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-start gap-3 hover:bg-rose-50 transition-colors"
                    >
                      <span className="text-2xl shrink-0">{idea.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-bold uppercase text-rose-600 bg-white px-2 py-0.5 rounded-md border border-rose-100">
                            {idea.category}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600">
                            🪙 {idea.tokenCost}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-gray-900 leading-snug">{idea.title}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">{idea.description}</p>
                        
                        <button
                          onClick={() => handleAddAiraCoupon(idea)}
                          className="mt-2.5 px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to Shared Vault</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-rose-100 flex items-center justify-between">
                <button
                  onClick={fetchAiraCoupons}
                  disabled={isGeneratingAira}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Ideas</span>
                </button>
                <button
                  onClick={() => setShowAiraModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Custom Coupon Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                    💌
                  </div>
                  <h3 className="font-serif font-bold text-base text-gray-900">Craft a Love Coupon</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Coupon Title *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 20-Minute Foot Massage & Tea"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 text-xs bg-white"
                    >
                      <option value="Sweet Gestures">Sweet Gestures</option>
                      <option value="Romantic Dates">Romantic Dates</option>
                      <option value="Playful Favors">Playful Favors</option>
                      <option value="Custom Wagers">Custom Wagers</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Emoji Icon</label>
                    <select
                      value={newEmoji}
                      onChange={(e) => setNewEmoji(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 text-xs bg-white"
                    >
                      <option value="💌">💌 Letter</option>
                      <option value="💆">💆 Massage</option>
                      <option value="☕">☕ Coffee</option>
                      <option value="🎬">🎬 Movie</option>
                      <option value="🍦">🍦 Ice Cream</option>
                      <option value="🫧">🫧 Bubble Bath</option>
                      <option value="💃">💃 Dance</option>
                      <option value="🍕">🍕 Pizza Date</option>
                      <option value="👑">👑 Royal Pass</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Description / Perks</label>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe what happens when redeemed..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Rules / Fine Print (Optional)</label>
                  <input
                    type="text"
                    maxLength={100}
                    value={newTerms}
                    onChange={(e) => setNewTerms(e.target.value)}
                    placeholder="e.g. Valid only on rainy weekends"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-rose-400 text-xs"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-300/40 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Gifting...' : 'Gift to Vault'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
