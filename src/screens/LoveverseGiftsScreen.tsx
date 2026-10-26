import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, Sparkles, Search, Plus, Filter, Heart, Play, Clock, 
  Send, CheckCircle2, ChevronRight, Share2, Coins, Eye, 
  RotateCcw, Trash2, Bookmark, Star, ArrowUpRight
} from 'lucide-react';
import { 
  DigitalGift, 
  DigitalGiftCategory, 
  DigitalGiftProductId, 
  DIGITAL_GIFT_PRODUCTS, 
  DigitalGiftProductMeta 
} from '../types/digitalGifts';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useTheme } from '../contexts/ThemeContext';
import { subscribeToCoupleDigitalGifts, deleteDigitalGift, submitGiftResponse } from '../lib/digitalGiftsService';
import { DigitalGiftCreatorModal } from '../components/digitalGifts/DigitalGiftCreatorModal';
import { DigitalGiftExperienceRenderer } from '../components/digitalGifts/DigitalGiftExperienceRenderer';
import { BottomNav } from '../components/BottomNav';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';

type TopTab = 'catalog' | 'received' | 'sent' | 'favorites';

export function LoveverseGiftsScreen() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { wallet } = useLoveCoins();
  const { theme } = useTheme();

  const [topTab, setTopTab] = useState<TopTab>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<DigitalGiftCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time Space Gifts List
  const [digitalGifts, setDigitalGifts] = useState<DigitalGift[]>([]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('loveverse_gift_favorites');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Modals & Active Experiences
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorProductId, setCreatorProductId] = useState<DigitalGiftProductId>('ever_tide');
  const [editingGift, setEditingGift] = useState<DigitalGift | null>(null);
  const [activeViewingGift, setActiveViewingGift] = useState<DigitalGift | null>(null);

  // Subscribe to gifts in current couple space
  useEffect(() => {
    if (!space?.id) return;
    const unsub = subscribeToCoupleDigitalGifts(space.id, (gifts) => {
      setDigitalGifts(gifts);
    });
    return () => unsub();
  }, [space?.id]);

  const toggleFavorite = (giftId: string) => {
    sound.tap();
    setFavorites(prev => {
      const updated = prev.includes(giftId) ? prev.filter(id => id !== giftId) : [...prev, giftId];
      try {
        localStorage.setItem('loveverse_gift_favorites', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleOpenCreator = (productId: DigitalGiftProductId) => {
    sound.tap();
    setCreatorProductId(productId);
    setEditingGift(null);
    setIsCreatorOpen(true);
  };

  const handleOpenExperience = (gift: DigitalGift) => {
    sound.playHeartbeat();
    setActiveViewingGift(gift);
  };

  const handleDeleteGift = async (gift: DigitalGift) => {
    if (!confirm(`Are you sure you want to delete "${gift.title}"?`)) return;
    sound.pop();
    if (space?.id) {
      await deleteDigitalGift(space.id, gift.id, gift.shareToken);
    }
  };

  const handleCopyShareLink = (gift: DigitalGift) => {
    sound.tap();
    const url = `${window.location.origin}/gift/${gift.shareToken || gift.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert(`Gift link copied to clipboard:\n${url}`);
    }).catch(() => {
      prompt('Copy this link to share your digital gift:', url);
    });
  };

  // Filter products for Catalog Tab
  const filteredProducts = useMemo(() => {
    return DIGITAL_GIFT_PRODUCTS.filter(p => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = 
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Filter Received Gifts (sent by partner)
  const receivedGifts = useMemo(() => {
    return digitalGifts.filter(g => g.creatorId !== userData?.id);
  }, [digitalGifts, userData?.id]);

  // Filter Sent Gifts (created by user)
  const sentGifts = useMemo(() => {
    return digitalGifts.filter(g => g.creatorId === userData?.id);
  }, [digitalGifts, userData?.id]);

  // Filter Favorite Gifts
  const favoriteGifts = useMemo(() => {
    return digitalGifts.filter(g => favorites.includes(g.id));
  }, [digitalGifts, favorites]);

  // Featured Gift of the Day
  const featuredGift = DIGITAL_GIFT_PRODUCTS[0]; // Ever Tide Island

  return (
    <div 
      className="min-h-screen pb-24 md:pb-16 transition-colors duration-500 font-sans select-none"
      style={{ backgroundColor: theme.colors.screenBg, color: theme.colors.textMain }}
    >
      {/* Active Experience Viewer (Full Screen) */}
      {activeViewingGift && (
        <DigitalGiftExperienceRenderer
          gift={activeViewingGift}
          isPreview={false}
          onRespond={async (resp) => {
            if (space?.id) {
              await submitGiftResponse(space.id, activeViewingGift.id, resp, activeViewingGift.shareToken);
              setActiveViewingGift(prev => prev ? { ...prev, recipientResponse: resp } : null);
            }
          }}
          onClose={() => setActiveViewingGift(null)}
        />
      )}

      {/* Gift Personalization Studio Modal */}
      {isCreatorOpen && (
        <DigitalGiftCreatorModal
          initialProductId={creatorProductId}
          initialGift={editingGift}
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          onGiftCreated={(newGift) => {
            setActiveViewingGift(newGift);
          }}
        />
      )}

      {/* Hero Atmosphere Banner */}
      <div 
        className="relative px-4 pt-6 pb-8 md:pt-10 md:pb-12 border-b overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #FFF6F9 0%, #FEE2E2 40%, #EDE9FE 100%)',
          borderColor: theme.colors.cardBorder
        }}
      >
        {/* Subtle decorative particles */}
        <div className="absolute top-2 right-10 text-4xl opacity-30 animate-pulse pointer-events-none">✨</div>
        <div className="absolute bottom-4 left-6 text-3xl opacity-20 pointer-events-none">💖</div>

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-300 text-rose-700 text-xs font-bold tracking-wide">
              <Gift className="w-3.5 h-3.5 text-rose-600" />
              <span>Loveverse Digital Gifts & Worlds</span>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-rose-950 tracking-tight">
              Personalized Romantic Universes
            </h1>
            <p className="text-xs sm:text-sm text-rose-800/90 max-w-xl leading-relaxed">
              Create and send animated 3D sunset islands, digital art galleries, moonlit Japanese blossom invitations, and interactive love letters to your partner.
            </p>
          </div>

          {/* Quick Create CTA Button */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCreator('ever_tide')}
              className="px-5 py-3 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-serif font-bold text-xs sm:text-sm shadow-lg shadow-rose-300/50 hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create a Digital Gift
            </button>

            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/80 border border-rose-200 text-xs font-bold text-amber-800 shadow-xs">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>{wallet?.balance ?? 50} Coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Tabs (Catalog, Received, Sent, Favorites) */}
        <div className="flex items-center justify-between border-b border-rose-100/80 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {[
              { id: 'catalog', label: 'All Experiences', count: DIGITAL_GIFT_PRODUCTS.length },
              { id: 'received', label: 'Received Gifts', count: receivedGifts.length },
              { id: 'sent', label: 'My Created & Sent', count: sentGifts.length },
              { id: 'favorites', label: 'Saved Favorites', count: favoriteGifts.length }
            ].map(tab => {
              const isActive = topTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.tap();
                    setTopTab(tab.id as TopTab);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-300/40'
                      : 'bg-white/80 text-rose-800 hover:bg-rose-100/60 border border-rose-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search experiences..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full border border-rose-200 bg-white text-xs text-rose-950 placeholder:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>

        {/* ===================== TAB 1: CATALOG ===================== */}
        {topTab === 'catalog' && (
          <div className="space-y-8">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'virtual_worlds', label: '🏝️ Virtual Worlds' },
                { id: 'animated_letters', label: '💌 Animated Love Letters' },
                { id: 'romantic_invitations', label: '🗼 Romantic Invitations' },
                { id: 'memory_archives', label: '🏛️ Memory Archives' }
              ].map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.tap();
                      setSelectedCategory(cat.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-rose-950 text-white shadow-xs'
                        : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Featured Gift of the Day Hero Showcase */}
            {selectedCategory === 'all' && !searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-3xl overflow-hidden p-6 md:p-8 border-2 border-rose-300 shadow-xl bg-gradient-to-br from-amber-50 via-rose-50 to-pink-100 flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                      Featured Gift of the Day
                    </span>
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Free Starter Experience
                    </span>
                  </div>

                  <h3 className="font-serif font-black text-2xl md:text-3xl text-rose-950 leading-tight">
                    {featuredGift.title}
                  </h3>

                  <p className="text-xs md:text-sm text-rose-900 leading-relaxed font-sans max-w-lg">
                    {featuredGift.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {featuredGift.features.slice(0, 3).map((feat, idx) => (
                      <span key={idx} className="text-[11px] font-medium bg-white/90 border border-rose-200 text-rose-800 px-2.5 py-0.5 rounded-full">
                        ✓ {feat}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => handleOpenCreator('ever_tide')}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/40 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Personalize This World
                    </button>

                    <button
                      onClick={() => {
                        setActiveViewingGift({
                          id: 'demo_ever_tide',
                          coupleSpaceId: space?.id || '',
                          creatorId: userData?.id || '',
                          creatorName: userData?.displayName || 'Your Love',
                          recipientName: partnerData?.displayName || 'My Beloved',
                          productId: 'ever_tide',
                          title: featuredGift.title,
                          theme: 'sunset_peach',
                          status: 'published',
                          isPublicShare: false,
                          content: featuredGift.defaultContent,
                          createdAt: Date.now(),
                          updatedAt: Date.now()
                        });
                      }}
                      className="px-4 py-2.5 rounded-full bg-white hover:bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Test Experience
                    </button>
                  </div>
                </div>

                {/* Illustrated Island Visual Asset */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-900 shadow-2xl flex items-center justify-center text-7xl select-none relative group shrink-0">
                  <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-xs" />
                  <span className="relative z-10 group-hover:scale-110 transition-transform">🏝️</span>
                  <div className="absolute bottom-2 right-2 text-2xl">🌅</div>
                </div>
              </motion.div>
            )}

            {/* Catalog Products Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-black text-lg text-rose-950">
                  Implemented Digital Gift Experiences ({filteredProducts.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map(product => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -4 }}
                    className="rounded-3xl border border-rose-200/90 bg-white p-5 shadow-lg shadow-rose-100/40 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-4xl p-3 rounded-2xl bg-rose-50 shadow-inner">
                          {product.icon}
                        </span>
                        <div className="text-right">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                            product.isFreeStarter
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {product.isFreeStarter ? 'Free Starter' : `${product.coinCost} Coins`}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                          {product.categoryLabel}
                        </span>
                        <h4 className="font-serif font-black text-base text-rose-950 mt-0.5">
                          {product.title}
                        </h4>
                        <p className="text-xs text-rose-800/80 line-clamp-3 mt-1.5 leading-relaxed font-sans">
                          {product.description}
                        </p>
                      </div>

                      {/* Theme Palettes preview */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-rose-400 font-bold">Themes:</span>
                        {product.themes.map(t => (
                          <div
                            key={t.id}
                            title={t.name}
                            style={{ backgroundColor: t.color }}
                            className="w-3.5 h-3.5 rounded-full ring-1 ring-white shadow-2xs"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-rose-100 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenCreator(product.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/30 hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Personalize
                      </button>

                      <button
                        onClick={() => {
                          setActiveViewingGift({
                            id: `demo_${product.id}`,
                            coupleSpaceId: space?.id || '',
                            creatorId: userData?.id || '',
                            creatorName: userData?.displayName || 'Your Love',
                            recipientName: partnerData?.displayName || 'My Beloved',
                            productId: product.id,
                            title: product.title,
                            theme: product.themes[0].id,
                            status: 'published',
                            isPublicShare: false,
                            content: product.defaultContent,
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                          });
                        }}
                        className="p-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Interactive Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: RECEIVED GIFTS ===================== */}
        {topTab === 'received' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-serif font-black text-lg text-rose-950">
                Gifts Received from {partnerData?.displayName || 'Your Partner'} ({receivedGifts.length})
              </h3>
              <p className="text-xs text-rose-700">
                Tap any gift to open, experience, and replay whenever your heart desires.
              </p>
            </div>

            {receivedGifts.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-rose-200 space-y-3">
                <Gift className="w-12 h-12 text-rose-300 mx-auto" />
                <h4 className="font-serif font-bold text-base text-rose-950">
                  No digital gifts received yet
                </h4>
                <p className="text-xs text-rose-600 max-w-sm mx-auto">
                  When {partnerData?.displayName || 'your partner'} personalizes and sends a digital gift, it will appear here permanently!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {receivedGifts.map(gift => (
                  <div
                    key={gift.id}
                    className="p-5 rounded-3xl border border-rose-200 bg-white shadow-md flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-rose-50 shadow-inner">
                          {DIGITAL_GIFT_PRODUCTS.find(p => p.id === gift.productId)?.icon || '🎁'}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                            From {gift.creatorName}
                          </span>
                          <h4 className="font-serif font-bold text-base text-rose-950">
                            {gift.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFavorite(gift.id)}
                        className="text-rose-400 hover:text-rose-600 p-1"
                        title="Bookmark"
                      >
                        <Bookmark className={`w-4 h-4 ${favorites.includes(gift.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    {gift.recipientResponse ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">You Responded:</span>
                        <p className="font-semibold text-emerald-950">"{gift.recipientResponse.answer}"</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
                        💌 Open this experience to send your romantic response!
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-rose-100">
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(gift.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => handleOpenExperience(gift)}
                        className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/30 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Open & Replay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: SENT GIFTS ===================== */}
        {topTab === 'sent' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-lg text-rose-950">
                  Gifts You Created & Sent ({sentGifts.length})
                </h3>
                <p className="text-xs text-rose-700">
                  Track your creations, view your partner's responses, and share links.
                </p>
              </div>

              <button
                onClick={() => handleOpenCreator('ever_tide')}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-300/40 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Gift
              </button>
            </div>

            {sentGifts.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-rose-200 space-y-3">
                <Send className="w-12 h-12 text-rose-300 mx-auto" />
                <h4 className="font-serif font-bold text-base text-rose-950">
                  No gifts sent yet
                </h4>
                <p className="text-xs text-rose-600 max-w-sm mx-auto">
                  Pick any of our 7 romantic experiences and surprise your partner today!
                </p>
                <button
                  onClick={() => handleOpenCreator('ever_tide')}
                  className="px-5 py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs shadow-md"
                >
                  Create Your First Gift
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sentGifts.map(gift => (
                  <div
                    key={gift.id}
                    className="p-5 rounded-3xl border border-rose-200 bg-white shadow-md flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-rose-50 shadow-inner">
                          {DIGITAL_GIFT_PRODUCTS.find(p => p.id === gift.productId)?.icon || '🎁'}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                            Sent to {gift.recipientName}
                          </span>
                          <h4 className="font-serif font-bold text-base text-rose-950">
                            {gift.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteGift(gift)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Delete Gift"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Partner Response Status */}
                    {gift.recipientResponse ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-emerald-800 font-bold">
                          <span>Partner Responded:</span>
                          <span>{gift.recipientResponse.reactionEmoji || '💖'}</span>
                        </div>
                        <p className="font-bold text-emerald-950">"{gift.recipientResponse.answer}"</p>
                        {gift.recipientResponse.note && (
                          <p className="text-xs text-emerald-900 italic font-serif">
                            "{gift.recipientResponse.note}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Awaiting partner's romantic answer...</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center justify-between border-t border-rose-100">
                      <button
                        onClick={() => handleCopyShareLink(gift)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share Link
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingGift(gift);
                            setCreatorProductId(gift.productId);
                            setIsCreatorOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleOpenExperience(gift)}
                          className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/30 flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" /> View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: FAVORITES ===================== */}
        {topTab === 'favorites' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-serif font-black text-lg text-rose-950">
                Saved & Favorite Digital Gifts ({favoriteGifts.length})
              </h3>
              <p className="text-xs text-rose-700">
                Your bookmarked keepsakes and digital gift moments.
              </p>
            </div>

            {favoriteGifts.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-rose-200 space-y-3">
                <Bookmark className="w-12 h-12 text-rose-300 mx-auto" />
                <h4 className="font-serif font-bold text-base text-rose-950">
                  No bookmarked gifts yet
                </h4>
                <p className="text-xs text-rose-600 max-w-sm mx-auto">
                  Tap the bookmark icon on any received or sent gift to keep it easily accessible here!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteGifts.map(gift => (
                  <div
                    key={gift.id}
                    className="p-5 rounded-3xl border border-rose-200 bg-white shadow-md flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2.5 rounded-2xl bg-rose-50 shadow-inner">
                          {DIGITAL_GIFT_PRODUCTS.find(p => p.id === gift.productId)?.icon || '🎁'}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                            {gift.creatorId === userData?.id ? `Created by you for ${gift.recipientName}` : `From ${gift.creatorName}`}
                          </span>
                          <h4 className="font-serif font-bold text-base text-rose-950">
                            {gift.title}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFavorite(gift.id)}
                        className="text-rose-500 p-1"
                      >
                        <Bookmark className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-rose-100">
                      <span className="text-[11px] text-gray-400 font-mono">
                        {new Date(gift.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => handleOpenExperience(gift)}
                        className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/30 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="z-20 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border-t border-rose-100/50 mt-12">
        <BottomNav />
      </div>
    </div>
  );
}
