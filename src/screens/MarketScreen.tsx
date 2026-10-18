import React, { useState, useMemo } from 'react';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { 
  Sparkles, Coins, Gift, Palette, Award, Gamepad2, 
  Send, Heart, Plus, Eye, Phone, Video, X, Play,
  Search, ArrowLeft, Check, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SHOP_CATALOG, ShopItem } from '../types/coins';
import { THEMES_LIST, getStoredTheme } from '../lib/themeEngine';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { LOVEVERSE_ASSETS } from '../assets/loveverseAssets';

type MarketSection = 'all' | 'gifts' | 'themes' | 'badges' | 'game_packs';

export function MarketScreen() {
  const { wallet, inventory, spendCoins, sendGift, setActiveTheme, setEquippedBadge } = useLoveCoins();
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<MarketSection>('all');
  const [giftSubCategory, setGiftSubCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [selectedGift, setSelectedGift] = useState<ShopItem | null>(null);
  const [giftNote, setGiftNote] = useState('');
  const [selectedThemePreview, setSelectedThemePreview] = useState<any | null>(null);
  const [selectedItemToBuy, setSelectedItemToBuy] = useState<ShopItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const balance = wallet?.balance ?? 50;
  const activeThemeId = inventory?.activeTheme || getStoredTheme();

  // Filter items without any duplicates
  const displayedItems = useMemo(() => {
    let list = SHOP_CATALOG;
    if (activeSection !== 'all') {
      list = list.filter(item => item.category === activeSection);
    }
    if (activeSection === 'gifts' && giftSubCategory !== 'All') {
      list = list.filter(item => item.subCategory === giftSubCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeSection, giftSubCategory, searchQuery]);

  const isItemOwned = (item: ShopItem) => {
    if (!inventory) return false;
    if (item.category === 'themes') return inventory.ownedThemes?.includes(item.id) || item.cost === 0;
    if (item.category === 'badges') {
      if (item.id === 'token_streak_freeze') return (inventory.streakFreezeTokens || 0) > 0;
      return inventory.ownedBadges?.includes(item.id);
    }
    if (item.category === 'game_packs') return inventory.ownedGamePacks?.includes(item.id);
    return false;
  };

  const handleOpenGiftModal = (item: ShopItem) => {
    sound.tap();
    setSelectedGift(item);
    setGiftNote('');
    setFeedbackMsg(null);
  };

  const handleConfirmSendGift = async () => {
    if (!selectedGift) return;
    if (balance < selectedGift.cost) {
      sound.pop();
      setFeedbackMsg({ 
        text: `You need ${selectedGift.cost - balance} more Love Coins! Tap '+' to earn coins.`, 
        error: true 
      });
      return;
    }

    setIsProcessing(true);
    setFeedbackMsg(null);
    try {
      const res = await sendGift(
        selectedGift.id,
        selectedGift.name,
        selectedGift.cost,
        partnerData?.id,
        giftNote
      );

      if (!res.success) {
        setFeedbackMsg({ text: res.error || 'Failed to deliver gift.', error: true });
      } else {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 }
        });
        setFeedbackMsg({ 
          text: `Surprise delivered! "${selectedGift.name}" sent to ${partnerData?.displayName || 'your partner'} ❤️` 
        });
        setTimeout(() => {
          setSelectedGift(null);
          setFeedbackMsg(null);
        }, 2200);
      }
    } catch {
      setFeedbackMsg({ text: 'Error sending gift. Please check connection.', error: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenPurchase = (item: ShopItem) => {
    sound.tap();
    if (item.category === 'themes') {
      const themeDef = THEMES_LIST.find(t => t.id === item.id);
      setSelectedThemePreview(themeDef || item);
    } else {
      setSelectedItemToBuy(item);
    }
    setFeedbackMsg(null);
  };

  const handleConfirmPurchase = async (item: ShopItem) => {
    if (balance < item.cost) {
      sound.pop();
      setFeedbackMsg({ 
        text: `You need ${item.cost - balance} more coins. Complete daily quests to earn!`, 
        error: true 
      });
      return;
    }

    setIsProcessing(true);
    setFeedbackMsg(null);
    try {
      const res = await spendCoins(item.id, item.category, item.cost);
      if (!res.success) {
        setFeedbackMsg({ text: res.error || 'Could not complete unlock.', error: true });
      } else {
        confetti({
          particleCount: 50,
          spread: 70
        });
        setFeedbackMsg({ text: `Successfully unlocked ${item.name}! ✨` });
        
        if (item.category === 'themes') {
          setActiveTheme(item.id);
        }
        
        setTimeout(() => {
          setSelectedItemToBuy(null);
          setSelectedThemePreview(null);
          setFeedbackMsg(null);
        }, 1600);
      }
    } catch {
      setFeedbackMsg({ text: 'Transaction failed. Please try again.', error: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const categoryCounts = useMemo(() => {
    return {
      all: SHOP_CATALOG.length,
      gifts: SHOP_CATALOG.filter(i => i.category === 'gifts').length,
      themes: SHOP_CATALOG.filter(i => i.category === 'themes').length,
      badges: SHOP_CATALOG.filter(i => i.category === 'badges').length,
      game_packs: SHOP_CATALOG.filter(i => i.category === 'game_packs').length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#2B1A2E] pb-32 font-sans select-none overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-rose-100/90 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.tap();
                navigate('/');
              }}
              className="w-9 h-9 rounded-2xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-colors shrink-0"
              title="Return to Space"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif font-black text-base text-[#2B1A2E] tracking-tight">
                  Loveverse Market
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700">
                  Shop
                </span>
              </div>
              <p className="text-[10px] text-[#9B7A87] font-medium leading-none">
                Send surprises & personalize your space
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* My Collection link */}
            <button
              onClick={() => {
                sound.tap();
                navigate('/my-collection');
              }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-100"
            >
              Collection
            </button>

            {/* Live Coin Balance Pill */}
            <button
              onClick={() => {
                sound.tap();
                navigate('/earn-coins');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-sm shadow-amber-300/40 hover:brightness-105 active:scale-95 transition-all"
              title="View and Earn Love Coins"
            >
              <Coins className="w-3.5 h-3.5 fill-white text-white drop-shadow-xs" />
              <span className="font-extrabold text-xs tracking-tight">
                {balance.toLocaleString()}
              </span>
              <div className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center ml-0.5">
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Subtle Welcome Hero Bar */}
        <div className="relative rounded-2xl overflow-hidden p-4 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-md shadow-rose-200/50">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-pink-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Couple Rewards & Surprises
              </span>
              <h2 className="text-base font-serif font-black mt-0.5 leading-tight">
                Romantic Gifts, Themes & Keepsakes
              </h2>
              <p className="text-[11px] text-white/90 mt-0.5">
                Each gift delivers directly with sound & confetti to your partner's screen.
              </p>
            </div>
            <button
              onClick={() => {
                sound.tap();
                navigate('/earn-coins');
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-rose-600 text-xs font-bold shadow hover:bg-rose-50 active:scale-95 transition-all shrink-0 ml-3"
            >
              Earn Coins
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gifts, themes, or frames..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-rose-100 rounded-2xl text-xs text-[#2B1A2E] placeholder:text-gray-400 focus:outline-hidden focus:border-rose-400 transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Tabs (Segmented Buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {[
            { id: 'all', label: `All (${categoryCounts.all})` },
            { id: 'gifts', label: `Virtual Gifts (${categoryCounts.gifts})` },
            { id: 'themes', label: `App Themes (${categoryCounts.themes})` },
            { id: 'badges', label: `Frames & Badges (${categoryCounts.badges})` },
            { id: 'game_packs', label: `Game Decks (${categoryCounts.game_packs})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.tap();
                setActiveSection(tab.id as MarketSection);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeSection === tab.id
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-300/40'
                  : 'bg-white text-[#9B7A87] border border-rose-100 hover:text-rose-600 hover:border-rose-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Category Filter (Only for Virtual Gifts) */}
        {activeSection === 'gifts' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            {['All', 'Romantic Classics', 'Cuddle Corner', 'Dreamy Surprises', 'Celestial Gifts'].map(sub => (
              <button
                key={sub}
                onClick={() => {
                  sound.tap();
                  setGiftSubCategory(sub);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-all ${
                  giftSubCategory === sub
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 font-bold'
                    : 'bg-white text-gray-500 border border-gray-200 hover:text-gray-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Section Heading & Result Count */}
        <div className="flex items-center justify-between text-xs text-[#9B7A87] px-1">
          <span className="font-medium">
            Showing <strong className="text-[#2B1A2E]">{displayedItems.length}</strong> items
          </span>
          <span className="text-[11px]">
            {activeSection === 'gifts' ? 'Delivered straight to chat' : 'Instant account unlock'}
          </span>
        </div>

        {/* Products Grid (Clean, Zero Duplicates, Every Item Distinct) */}
        {displayedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-rose-100 p-6 space-y-2">
            <Gift className="w-10 h-10 text-rose-300 mx-auto" />
            <h4 className="font-bold text-sm text-[#2B1A2E]">No items match your search</h4>
            <p className="text-xs text-[#9B7A87]">Try searching for something else or reset your filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveSection('all');
                setGiftSubCategory('All');
              }}
              className="mt-2 text-xs font-bold text-rose-600 underline"
            >
              View all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedItems.map(item => {
              const owned = isItemOwned(item);
              const isTheme = item.category === 'themes';
              const isGift = item.category === 'gifts';
              const isActiveTheme = isTheme && activeThemeId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3 border border-rose-100 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  {/* Image Container with Badges */}
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-rose-50/50 relative mb-2.5 flex items-center justify-center border border-rose-50">
                    {/* Animated Tag */}
                    {item.isAnimated && (
                      <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-bold flex items-center gap-0.5 shadow-xs">
                        <Play className="w-2 h-2 fill-white" />
                        Live FX
                      </span>
                    )}

                    {/* Category Label */}
                    <span className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-white text-[9px] font-medium">
                      {isGift ? 'Gift' : isTheme ? 'Theme' : item.category === 'badges' ? 'Badge' : 'Deck'}
                    </span>

                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-4xl">{item.icon}</div>
                    )}

                    {/* Quick Preview Eye for Themes */}
                    {isTheme && (
                      <button
                        onClick={() => handleOpenPurchase(item)}
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md shadow-xs flex items-center justify-center text-gray-700 hover:text-rose-600 transition-colors"
                        title="Preview Theme"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-[#2B1A2E] leading-tight line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-[#9B7A87] mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-rose-50">
                      {/* Price Tag */}
                      <div className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        <span className="font-black text-xs text-[#2B1A2E]">
                          {item.cost === 0 ? 'Free' : item.cost}
                        </span>
                      </div>

                      {/* Action Button */}
                      {isGift ? (
                        <button
                          onClick={() => handleOpenGiftModal(item)}
                          className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-bold shadow-2xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>
                      ) : owned ? (
                        isTheme ? (
                          <button
                            onClick={() => {
                              sound.tap();
                              setActiveTheme(item.id);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                              isActiveTheme
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {isActiveTheme ? 'Active' : 'Equip'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            Owned
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => handleOpenPurchase(item)}
                          className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold border border-rose-200 transition-colors"
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* SEND VIRTUAL GIFT MODAL / SHEET                           */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedGift && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedGift(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                  Deliver Surprise to Partner
                </span>
                <h3 className="font-serif font-black text-xl text-[#2B1A2E] mt-0.5">
                  {selectedGift.name}
                </h3>
              </div>

              {/* Big 3D Gift Artwork Display */}
              <div className="mt-4 relative rounded-2xl overflow-hidden aspect-[4/3] bg-gradient-to-tr from-pink-50 via-rose-50 to-purple-50 shadow-inner flex items-center justify-center p-3 border border-rose-100">
                {selectedGift.image ? (
                  <img 
                    src={selectedGift.image} 
                    alt={selectedGift.name} 
                    className="w-full h-full object-cover rounded-xl shadow-md"
                  />
                ) : (
                  <div className="text-6xl">{selectedGift.icon}</div>
                )}

                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{selectedGift.cost} Coins</span>
                </div>
              </div>

              <p className="text-xs text-center text-[#9B7A87] mt-3 px-2 leading-relaxed">
                {selectedGift.description}
              </p>

              {/* Recipient Display */}
              <div className="mt-4 bg-rose-50/80 rounded-2xl p-3 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-sm">
                    {partnerData?.displayName?.charAt(0) || '❤️'}
                  </div>
                  <div>
                    <span className="text-[10px] text-[#9B7A87] uppercase font-bold block">Deliver To</span>
                    <span className="font-bold text-xs text-[#2B1A2E]">
                      {partnerData?.displayName || 'Connected Partner'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#9B7A87] uppercase font-bold block">Your Balance</span>
                  <span className={`font-bold text-xs ${balance < selectedGift.cost ? 'text-red-500' : 'text-emerald-600'}`}>
                    {balance} Coins
                  </span>
                </div>
              </div>

              {/* Optional Personal Love Message Note */}
              <div className="mt-3">
                <label className="text-[11px] font-bold text-[#2B1A2E] flex justify-between">
                  <span>Add a whisper message (optional)</span>
                  <span className="text-gray-400 font-normal">{giftNote.length}/100</span>
                </label>
                <textarea
                  value={giftNote}
                  maxLength={100}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder="Leave a sweet whispered note that appears with the gift..."
                  className="w-full mt-1 p-3 rounded-2xl border border-rose-200 text-xs text-[#2B1A2E] focus:outline-hidden focus:border-rose-400 resize-none h-16 bg-white"
                />
              </div>

              {/* Delivery info */}
              <div className="mt-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 p-2.5 rounded-xl border border-rose-100 flex items-center gap-2 text-rose-700 text-[11px]">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  Delivers instantly into your partner's chat with magical particle animation and sound!
                </span>
              </div>

              {/* Feedback Message */}
              {feedbackMsg && (
                <div className={`mt-3 p-2.5 rounded-xl text-xs font-semibold text-center ${
                  feedbackMsg.error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {feedbackMsg.text}
                </div>
              )}

              {/* Action Button */}
              <div className="mt-4">
                <button
                  disabled={isProcessing}
                  onClick={handleConfirmSendGift}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-300/50 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Delivering Surprise...' : `Send for ${selectedGift.cost} Coins`}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* THEME PREVIEW & UNLOCK MODAL                              */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedThemePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedThemePreview(null)}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Mock Chat Screen Header */}
              <div 
                className="p-3 text-white flex items-center justify-between"
                style={{ backgroundColor: selectedThemePreview.primary || '#E8547A' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {partnerData?.displayName?.charAt(0) || '❤️'}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">{partnerData?.displayName || 'My Love'} 💕</h4>
                    <span className="text-[9px] text-white/80">Online</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Phone className="w-3.5 h-3.5" />
                  <Video className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Live Interactive Chat Mockup with the Theme Wallpaper */}
              <div 
                className="aspect-[4/3] w-full p-4 flex flex-col justify-between relative bg-cover bg-center overflow-hidden"
                style={{ 
                  backgroundImage: selectedThemePreview.image ? `url(${selectedThemePreview.image})` : undefined,
                  backgroundColor: selectedThemePreview.bgLight || '#FFF8FA'
                }}
              >
                <div className="space-y-2">
                  <div className="flex justify-start">
                    <div className="bg-white/95 backdrop-blur-xs p-2 rounded-2xl rounded-tl-none shadow-2xs text-[11px] max-w-[200px] text-gray-800">
                      This theme looks so dreamy! ✨
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div 
                      className="p-2 rounded-2xl rounded-tr-none shadow-2xs text-[11px] max-w-[200px] text-white"
                      style={{ backgroundColor: selectedThemePreview.primary || '#E8547A' }}
                    >
                      Our own magical Loveverse space ❤️
                    </div>
                  </div>
                </div>

                {/* Mock input bar */}
                <div className="bg-white/90 backdrop-blur-xs rounded-full px-3 py-1.5 flex items-center justify-between border border-white/60 text-gray-400 text-[10px]">
                  <span>Type a message...</span>
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                    style={{ backgroundColor: selectedThemePreview.primary || '#E8547A' }}
                  >
                    <Send className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>

              {/* Theme Details and Action */}
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif font-black text-base text-[#2B1A2E]">
                      {selectedThemePreview.name}
                    </h4>
                    <p className="text-[11px] text-[#9B7A87]">
                      {selectedThemePreview.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-black text-sm text-[#2B1A2E]">
                      <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span>{selectedThemePreview.cost === 0 ? 'Free' : selectedThemePreview.cost}</span>
                    </div>
                  </div>
                </div>

                {feedbackMsg && (
                  <div className={`mt-2 p-2 rounded-xl text-xs font-semibold text-center ${
                    feedbackMsg.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {feedbackMsg.text}
                  </div>
                )}

                <div className="mt-4">
                  {isItemOwned(selectedThemePreview) ? (
                    <button
                      onClick={() => {
                        sound.tap();
                        setActiveTheme(selectedThemePreview.id);
                        setSelectedThemePreview(null);
                      }}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                    >
                      {activeThemeId === selectedThemePreview.id ? 'Currently Active' : 'Equip Theme'}
                    </button>
                  ) : (
                    <button
                      disabled={isProcessing}
                      onClick={() => handleConfirmPurchase(selectedThemePreview)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all"
                    >
                      {isProcessing ? 'Unlocking...' : `Unlock Theme (${selectedThemePreview.cost} Coins)`}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* GENERAL PURCHASE MODAL (Badges, Frames, Game Packs)       */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedItemToBuy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedItemToBuy(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-md bg-rose-50 mb-3 flex items-center justify-center">
                  {selectedItemToBuy.image ? (
                    <img src={selectedItemToBuy.image} alt={selectedItemToBuy.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{selectedItemToBuy.icon}</span>
                  )}
                </div>

                <h3 className="font-serif font-black text-lg text-[#2B1A2E]">
                  {selectedItemToBuy.name}
                </h3>
                <p className="text-xs text-[#9B7A87] mt-1">
                  {selectedItemToBuy.description}
                </p>

                <div className="mt-4 p-3 rounded-2xl bg-rose-50 flex items-center justify-between border border-rose-100">
                  <span className="text-xs text-[#9B7A87] font-medium">Unlock Price</span>
                  <div className="flex items-center gap-1 font-black text-sm text-[#2B1A2E]">
                    <Coins className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{selectedItemToBuy.cost} Coins</span>
                  </div>
                </div>

                {feedbackMsg && (
                  <div className={`mt-3 p-2 rounded-xl text-xs font-semibold text-center ${
                    feedbackMsg.error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {feedbackMsg.text}
                  </div>
                )}

                <div className="mt-4">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleConfirmPurchase(selectedItemToBuy)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isProcessing ? 'Confirming...' : `Unlock for ${selectedItemToBuy.cost} Coins`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
