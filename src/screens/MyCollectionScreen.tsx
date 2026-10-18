import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { BottomNav } from '../components/BottomNav';
import { 
  ArrowLeft, Palette, Award, Gift, Clock, Check, 
  Sparkles, Coins, ShieldCheck, Heart, RefreshCw, Eye,
  Send, ChevronRight, Play, ShoppingBag, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { THEMES_LIST, getStoredTheme } from '../lib/themeEngine';
import { SHOP_CATALOG, ShopItem } from '../types/coins';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import { triggerHeartBurstConfetti } from '../lib/celebrationEffects';
import { LOVEVERSE_ASSETS } from '../assets/loveverseAssets';

type MainTab = 'owned' | 'gifts' | 'history';
type CategoryFilter = 'themes' | 'badges' | 'frames' | 'special';

export function MyCollectionScreen() {
  const { wallet, inventory, transactions, setActiveTheme, setEquippedBadge } = useLoveCoins();
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [mainTab, setMainTab] = useState<MainTab>('owned');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('themes');
  const [giftFilter, setGiftFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [spaceGifts, setSpaceGifts] = useState<any[]>([]);
  const [replayGift, setReplayGift] = useState<any | null>(null);

  // Subscribe to real-time space virtual gifts
  useEffect(() => {
    if (!space?.id) return;
    const giftsRef = collection(db, `coupleSpaces/${space.id}/virtualGifts`);
    const unsub = onSnapshot(giftsRef, (snap) => {
      const items: any[] = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSpaceGifts(items);
    }, (err) => {
      console.warn('Realtime gifts query note:', err);
    });
    return () => unsub();
  }, [space?.id]);

  const ownedThemeIds = inventory?.ownedThemes || ['theme_cloud_romance', 'theme_blush_romance'];
  const currentActiveTheme = inventory?.activeTheme || getStoredTheme();
  const ownedBadgeIds = inventory?.ownedBadges || [];
  const equippedBadgeId = inventory?.equippedBadge || '';

  const handleSelectTheme = (themeId: string) => {
    if (!ownedThemeIds.includes(themeId)) {
      sound.pop();
      navigate('/market');
      return;
    }
    sound.tap();
    setActiveTheme(themeId);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handleSelectBadge = (badgeId: string) => {
    sound.tap();
    if (equippedBadgeId === badgeId) {
      setEquippedBadge('');
    } else {
      setEquippedBadge(badgeId);
      confetti({ particleCount: 30, spread: 50 });
    }
  };

  const handleReplayGift = (gift: any) => {
    triggerHeartBurstConfetti(0.5, 0.45);
    setReplayGift(gift);
  };

  // Filter items in My Collection
  const ownedThemes = THEMES_LIST.filter(t => ownedThemeIds.includes(t.id));
  const unownedThemes = THEMES_LIST.filter(t => !ownedThemeIds.includes(t.id));

  const badgesCatalog = SHOP_CATALOG.filter(i => i.category === 'badges' && i.subCategory !== 'Frames');
  const framesCatalog = SHOP_CATALOG.filter(i => i.category === 'badges' && i.subCategory === 'Frames');
  const specialCatalog = SHOP_CATALOG.filter(i => i.category === 'game_packs');

  // Combined gifts list
  const displayedGifts = useMemo(() => {
    let list: any[] = [];
    if (spaceGifts.length > 0) {
      list = spaceGifts;
    } else {
      list = transactions
        .filter(t => t.type === 'virtual_gift')
        .map(t => ({
          id: t.id,
          giftName: t.description.replace('Sent Gift: ', ''),
          giftId: t.referenceId,
          createdAt: t.createdAt,
          cost: Math.abs(t.amount),
          senderId: userData?.id,
          recipientId: partnerData?.id,
          note: ''
        }));
    }

    if (giftFilter === 'received') {
      return list.filter(g => g.senderId !== userData?.id);
    }
    if (giftFilter === 'sent') {
      return list.filter(g => g.senderId === userData?.id);
    }
    return list;
  }, [spaceGifts, transactions, giftFilter, userData?.id, partnerData?.id]);

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#2B1A2E] pb-32 select-none font-sans overflow-y-auto">
      {/* Top Header */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-30 border-b border-rose-100/80 px-4 py-3.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                sound.tap();
                navigate(-1);
              }}
              className="w-9 h-9 rounded-2xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold font-serif leading-tight">My Collection</h1>
              <p className="text-[11px] text-[#9B7A87]">Equip themes, badges & review gifts</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.tap();
              navigate('/market');
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Store</span>
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Collection Stats Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 border border-rose-100 text-center shadow-2xs">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight block">Balance</span>
            <span className="font-extrabold text-sm text-amber-600 flex items-center justify-center gap-1 mt-0.5">
              <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{wallet?.balance ?? 50}</span>
            </span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-rose-100 text-center shadow-2xs">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight block">Total Earned</span>
            <span className="font-extrabold text-sm text-rose-600 block mt-0.5">
              {wallet?.totalEarned ?? 50}
            </span>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-rose-100 text-center shadow-2xs">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight block">Total Spent</span>
            <span className="font-extrabold text-sm text-purple-600 block mt-0.5">
              {wallet?.totalSpent ?? 0}
            </span>
          </div>
        </div>

        {/* Primary Segmented Tabs: Owned Items | Gift History | Coin Activity */}
        <div className="flex bg-rose-100/50 p-1 rounded-2xl border border-rose-200/60">
          {[
            { id: 'owned', label: 'Owned Items' },
            { id: 'gifts', label: 'Gift History' },
            { id: 'history', label: 'Coin Activity' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.tap();
                setMainTab(tab.id as MainTab);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                mainTab === tab.id
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-[#9B7A87] hover:text-rose-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Filters when in "Owned Items" */}
        {mainTab === 'owned' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'themes', label: 'Themes' },
              { id: 'badges', label: 'Badges' },
              { id: 'frames', label: 'Frames' },
              { id: 'special', label: 'Special Features' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.tap();
                  setCategoryFilter(cat.id as CategoryFilter);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                  categoryFilter === cat.id
                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                    : 'bg-white text-gray-500 border border-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* ========================================================= */}
        {/* OWNED ITEMS CONTENT                                       */}
        {/* ========================================================= */}
        {mainTab === 'owned' && (
          <div className="space-y-3">
            {/* 1. THEMES TAB */}
            {categoryFilter === 'themes' && (
              <div className="space-y-3">
                <div className="text-[11px] text-[#9B7A87] px-1 flex items-center justify-between">
                  <span>Equip an unlocked theme to transform app & chat colors.</span>
                  <span className="font-bold text-rose-500">{ownedThemes.length} Owned</span>
                </div>

                <div className="space-y-2.5">
                  {ownedThemes.map(theme => {
                    const isActive = currentActiveTheme === theme.id;
                    return (
                      <div
                        key={theme.id}
                        className={`bg-white rounded-3xl p-3 border transition-all flex items-center justify-between ${
                          isActive 
                            ? 'border-emerald-400 shadow-md ring-2 ring-emerald-200' 
                            : 'border-rose-100 hover:border-rose-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-gradient-to-tr from-pink-100 to-purple-100 shrink-0">
                            {theme.image ? (
                              <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🎨</div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xs text-[#2B1A2E]">{theme.name}</h3>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#9B7A87] mt-0.5 leading-snug line-clamp-1">
                              {theme.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectTheme(theme.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Use'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Unlocked / Available Themes Teaser */}
                {unownedThemes.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-[#9B7A87] tracking-wider px-1 block mb-2">
                      Available in Loveverse Store
                    </span>
                    <div className="space-y-2">
                      {unownedThemes.map(theme => (
                        <div 
                          key={theme.id}
                          onClick={() => navigate('/market')}
                          className="bg-white/60 rounded-2xl p-2.5 border border-dashed border-rose-200 flex items-center justify-between cursor-pointer hover:bg-white transition-all opacity-80 hover:opacity-100"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-rose-50 shrink-0">
                              <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-[#2B1A2E]">{theme.name}</h4>
                              <span className="text-[10px] text-amber-600 font-bold">{theme.cost} Coins</span>
                            </div>
                          </div>
                          <span className="text-xs text-rose-500 font-bold">Unlock →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. BADGES TAB */}
            {categoryFilter === 'badges' && (
              <div className="space-y-3">
                <p className="text-xs text-[#9B7A87] px-1">
                  Equip an earned crest to display beside your nickname across chat and home.
                </p>

                <div className="space-y-2">
                  {badgesCatalog.map(badge => {
                    const isOwned = ownedBadgeIds.includes(badge.id);
                    const isEquipped = equippedBadgeId === badge.id;

                    return (
                      <div
                        key={badge.id}
                        className={`bg-white rounded-3xl p-3 border transition-all flex items-center justify-between ${
                          isEquipped
                            ? 'border-amber-400 ring-2 ring-amber-200 shadow-md'
                            : isOwned
                            ? 'border-rose-100 hover:border-rose-200 shadow-2xs'
                            : 'border-dashed border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-amber-50 shadow-inner shrink-0 flex items-center justify-center p-1">
                            {badge.image ? (
                              <img src={badge.image} alt={badge.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <span className="text-2xl">{badge.icon}</span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xs text-[#2B1A2E]">{badge.name}</h3>
                              {isEquipped && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold uppercase">
                                  Equipped
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#9B7A87] leading-tight mt-0.5">
                              {badge.badgeLabel || badge.description}
                            </p>
                          </div>
                        </div>

                        {isOwned ? (
                          <button
                            onClick={() => handleSelectBadge(badge.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                              isEquipped
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {isEquipped ? 'Unequip' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/market')}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                          >
                            Unlock
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. FRAMES TAB */}
            {categoryFilter === 'frames' && (
              <div className="space-y-3">
                <p className="text-xs text-[#9B7A87] px-1">
                  Display high-end 3D baroque frames around your profile and photo memories.
                </p>

                <div className="space-y-2">
                  {framesCatalog.map(frame => {
                    const isOwned = ownedBadgeIds.includes(frame.id);
                    const isEquipped = equippedBadgeId === frame.id;

                    return (
                      <div
                        key={frame.id}
                        className={`bg-white rounded-3xl p-3 border transition-all flex items-center justify-between ${
                          isEquipped
                            ? 'border-amber-400 ring-2 ring-amber-200 shadow-md'
                            : isOwned
                            ? 'border-rose-100 hover:border-rose-200 shadow-2xs'
                            : 'border-dashed border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-rose-50 shrink-0">
                            <img src={frame.image} alt={frame.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xs text-[#2B1A2E]">{frame.name}</h3>
                              {isEquipped && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-extrabold uppercase">
                                  Equipped
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#9B7A87] leading-tight mt-0.5">
                              {frame.description}
                            </p>
                          </div>
                        </div>

                        {isOwned ? (
                          <button
                            onClick={() => handleSelectBadge(frame.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                              isEquipped
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {isEquipped ? 'Unequip' : 'Equip'}
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/market')}
                            className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shrink-0"
                          >
                            Unlock
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. SPECIAL FEATURES */}
            {categoryFilter === 'special' && (
              <div className="space-y-3">
                <p className="text-xs text-[#9B7A87] px-1">
                  Active game expansions, truth-or-dare packs, and date adventure packages.
                </p>

                <div className="space-y-2">
                  {specialCatalog.map(pack => {
                    const isOwned = inventory?.ownedGamePacks?.includes(pack.id);
                    return (
                      <div
                        key={pack.id}
                        className="bg-white rounded-3xl p-3 border border-rose-100 shadow-2xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-rose-50 shrink-0">
                            <img src={pack.image} alt={pack.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-[#2B1A2E]">{pack.name}</h3>
                            <p className="text-[10px] text-[#9B7A87] leading-tight mt-0.5">
                              {pack.description}
                            </p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOwned ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isOwned ? 'Active' : `${pack.cost} Coins`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GIFT SHOWCASE TAB (Received & Sent)                       */}
        {/* ========================================================= */}
        {mainTab === 'gifts' && (
          <div className="space-y-3">
            {/* Sub-tabs: All | Received | Sent */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-rose-100/90 shadow-2xs">
                {[
                  { id: 'all', label: 'All Gifts' },
                  { id: 'received', label: 'Received' },
                  { id: 'sent', label: 'Sent by You' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      sound.tap();
                      setGiftFilter(filter.id as any);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      giftFilter === filter.id
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-[#9B7A87] hover:text-rose-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-bold text-rose-500 px-1">
                {displayedGifts.length} Keepsakes
              </span>
            </div>

            {displayedGifts.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-rose-100 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 flex items-center justify-center text-3xl">
                  🎁
                </div>
                <h4 className="font-serif font-black text-sm text-[#2B1A2E]">
                  {giftFilter === 'received' ? 'No gifts received yet' : 'No gifts sent yet'}
                </h4>
                <p className="text-xs text-[#9B7A87] max-w-[240px] mx-auto">
                  Surprise your partner with roses, a cuddly teddy, or starlit fireworks from the market.
                </p>
                <button
                  onClick={() => navigate('/market')}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md hover:brightness-105 transition-all"
                >
                  Explore Gift Garden
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedGifts.map(gift => {
                  const itemMeta = SHOP_CATALOG.find(i => 
                    i.id === gift.giftId || i.name.toLowerCase() === gift.giftName?.toLowerCase()
                  );
                  const giftImage = itemMeta?.image || LOVEVERSE_ASSETS.gifts.singleRose;
                  const isFromPartner = gift.senderId !== userData?.id;

                  return (
                    <div
                      key={gift.id}
                      className="bg-white rounded-3xl p-3.5 border border-rose-100 shadow-2xs space-y-2.5 transition-all hover:border-rose-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-13 h-13 rounded-2xl overflow-hidden bg-rose-50/70 border border-rose-100 shrink-0 shadow-inner">
                            <img 
                              src={giftImage} 
                              alt={gift.giftName} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-xs text-[#2B1A2E] leading-tight">
                                {gift.giftName || 'Virtual Surprise'}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                isFromPartner
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200/60'
                                  : 'bg-purple-100 text-purple-700 border border-purple-200/60'
                              }`}>
                                {isFromPartner ? `From ${partnerData?.displayName || 'Partner'}` : 'Sent by You'}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#9B7A87] block mt-0.5">
                              {new Date(gift.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReplayGift({ ...gift, image: giftImage })}
                          className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold border border-rose-200/80 flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                        >
                          <Play className="w-2.5 h-2.5 fill-rose-600" />
                          <span>Replay</span>
                        </button>
                      </div>

                      {/* Personal Note if present */}
                      {gift.note && (
                        <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-2.5 text-xs text-[#2B1A2E] flex items-start gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0 mt-0.5" />
                          <p className="italic leading-snug">"{gift.note}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* COIN ACTIVITY LEDGER TAB                                  */}
        {/* ========================================================= */}
        {mainTab === 'history' && (
          <div className="space-y-3">
            <div className="text-[11px] text-[#9B7A87] px-1 flex items-center justify-between">
              <span>Authoritative audit ledger of earned and spent Love Coins.</span>
              <span className="font-bold text-purple-600">{transactions.length} Entries</span>
            </div>

            {transactions.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-rose-100 text-center space-y-2">
                <span className="text-3xl block">🪙</span>
                <h4 className="font-serif font-black text-sm text-[#2B1A2E]">No activity yet</h4>
                <p className="text-xs text-[#9B7A87]">
                  Complete daily romance quests or partner challenges to earn your first coins!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map(tx => {
                  const isEarning = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-2xl p-3 border border-rose-100/80 shadow-2xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isEarning ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isEarning ? '+' : '-'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#2B1A2E] leading-tight">
                            {tx.description}
                          </p>
                          <span className="text-[10px] text-[#9B7A87]">
                            {new Date(tx.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <span className={`font-black text-xs ${
                        isEarning ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isEarning ? `+${tx.amount}` : tx.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating 3D Replay Celebration Overlay */}
      {replayGift && (
        <div 
          onClick={() => setReplayGift(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 border border-rose-200 shadow-2xl text-center space-y-4 max-w-xs w-full relative overflow-hidden"
          >
            <button
              onClick={() => setReplayGift(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-50 text-gray-500 hover:text-rose-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] uppercase font-extrabold tracking-widest text-rose-500 block">
              Loveverse Keepsake Replay
            </span>

            {/* 3D Gift Artwork Container with Glowing Rings */}
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-rose-300 to-amber-200 blur-xl opacity-70 animate-pulse" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden border-2 border-white shadow-xl bg-rose-50">
                <img 
                  src={replayGift.image || LOVEVERSE_ASSETS.gifts.singleRose} 
                  alt={replayGift.giftName} 
                  className="w-full h-full object-cover scale-105"
                />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-black text-lg text-[#2B1A2E] leading-tight">
                {replayGift.giftName || replayGift.description}
              </h3>
              <p className="text-xs text-rose-600 font-semibold">
                {replayGift.senderId === userData?.id 
                  ? `Sent with love to ${partnerData?.displayName || 'partner'}`
                  : `Gift from ${partnerData?.displayName || 'your partner'}`
                }
              </p>
            </div>

            {replayGift.note && (
              <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-3 text-xs italic text-gray-800 leading-relaxed shadow-inner">
                "{replayGift.note}"
              </div>
            )}

            <button
              onClick={() => setReplayGift(null)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-300/40 hover:opacity-95 active:scale-95 transition-all"
            >
              Keep in Heart ❤️
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
