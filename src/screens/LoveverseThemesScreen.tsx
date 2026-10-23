import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, LOVEVERSE_THEMES, ThemeTokens } from '../contexts/ThemeContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { sound } from '../lib/sound';
import { BottomNav } from '../components/BottomNav';
import { 
  ChevronLeft, Sparkles, Check, Lock, Eye, Palette, 
  Coins, Heart, MessageCircle, User, Gamepad2, 
  Image, Settings, X, ArrowRight, ShieldCheck, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

type PreviewTab = 'home' | 'chat' | 'profile' | 'loveverse' | 'games' | 'memories' | 'settings';

export function LoveverseThemesScreen() {
  const navigate = useNavigate();
  const { theme, activeThemeId, previewThemeId, setPreviewTheme, applyTheme, unlockTheme, isThemeOwned } = useTheme();
  const { wallet } = useLoveCoins();
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();

  const [activePreviewTheme, setActivePreviewTheme] = useState<ThemeTokens | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('home');
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [confirmUnlockTheme, setConfirmUnlockTheme] = useState<ThemeTokens | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const themeList = Object.values(LOVEVERSE_THEMES);

  const handleOpenPreview = (themeDef: ThemeTokens) => {
    sound.tap();
    setActivePreviewTheme(themeDef);
    setPreviewTheme(themeDef.id);
  };

  const handleClosePreview = () => {
    sound.tap();
    setActivePreviewTheme(null);
    setPreviewTheme(null);
  };

  const handleApplyTheme = async (themeId: string) => {
    sound.playSuccess();
    await applyTheme(themeId);
    confetti({ particleCount: 50, spread: 70 });
    if (activePreviewTheme) {
      setActivePreviewTheme(null);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!confirmUnlockTheme) return;
    const target = confirmUnlockTheme;
    setUnlockingId(target.id);
    setErrorMessage(null);

    const res = await unlockTheme(target.id);
    setUnlockingId(null);

    if (res.success) {
      setConfirmUnlockTheme(null);
      confetti({ particleCount: 60, spread: 80 });
      if (activePreviewTheme) {
        setActivePreviewTheme(null);
      }
    } else {
      setErrorMessage(res.error || 'Could not unlock theme. Please verify coin balance.');
    }
  };

  return (
    <div 
      className="min-h-screen pb-32 transition-colors duration-500 font-sans"
      style={{
        backgroundColor: theme.colors.screenBg,
        color: theme.colors.textMain
      }}
    >
      {/* Top Header */}
      <header 
        className="sticky top-0 z-30 px-4 py-3.5 backdrop-blur-xl border-b transition-colors shadow-2xs flex items-center justify-between"
        style={{
          backgroundColor: theme.colors.headerBg,
          borderColor: theme.colors.cardBorder
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.tap();
              navigate(-1);
            }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all shadow-xs hover:scale-105 active:scale-95"
            style={{
              backgroundColor: theme.colors.primarySoft,
              color: theme.colors.primary
            }}
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold font-serif leading-tight">Loveverse Themes</h1>
              <span className="text-xs">{theme.decorations.symbol}</span>
            </div>
            <p className="text-[11px] opacity-75">Global visual universe for two</p>
          </div>
        </div>

        {/* Live Coin Balance Pill */}
        <div 
          onClick={() => navigate('/earn-coins')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-all"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder
          }}
        >
          <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span className="text-xs font-black" style={{ color: theme.colors.textMain }}>
            {wallet?.balance ?? 50}
          </span>
        </div>
      </header>

      {/* Hero Atmosphere Banner */}
      <div className="px-4 pt-4">
        <div 
          className="rounded-3xl p-5 relative overflow-hidden border shadow-sm transition-all"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primarySoft} 0%, ${theme.colors.cardBg} 100%)`,
            borderColor: theme.colors.cardBorder
          }}
        >
          <div className="relative z-10 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                style={{
                  backgroundColor: theme.colors.tagBg,
                  color: theme.colors.tagText
                }}
              >
                Active Universe
              </span>
              <span className="text-[11px] opacity-70">• {theme.decorations.vibeTag}</span>
            </div>
            <h2 className="text-xl font-serif font-black" style={{ color: theme.colors.textMain }}>
              {theme.name}
            </h2>
            <p className="text-xs leading-relaxed max-w-sm" style={{ color: theme.colors.textMuted }}>
              {theme.description}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-xl bg-white/40 border border-white/60">
                {theme.decorations.skyElement}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Themes Gallery List */}
      <div className="px-4 pt-5 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider opacity-75">
            Available Universes ({themeList.length})
          </span>
          <span className="text-[11px] font-medium opacity-65">Tap Preview to test</span>
        </div>

        <div className="space-y-4">
          {themeList.map((t) => {
            const isOwned = isThemeOwned(t.id);
            const isActive = activeThemeId === t.id;

            return (
              <motion.div
                key={t.id}
                whileHover={{ y: -2 }}
                className="rounded-3xl border overflow-hidden shadow-xs transition-all flex flex-col"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: isActive ? theme.colors.primary : theme.colors.cardBorder
                }}
              >
                {/* Visual Banner Preview */}
                <div className="relative h-40 w-full overflow-hidden bg-black/10">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xl">{t.decorations.symbol}</span>
                          <h3 className="font-serif font-bold text-base leading-tight drop-shadow-sm">
                            {t.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-white/90 drop-shadow-xs">
                          {t.subtitle}
                        </p>
                      </div>

                      {/* State Badge */}
                      {isActive ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white shadow-md flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> Active
                        </span>
                      ) : isOwned ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/30 backdrop-blur-md text-white border border-white/50">
                          Unlocked
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-md flex items-center gap-1">
                          <Lock className="w-3 h-3" /> {t.cost} Coins
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description & Action Bar */}
                <div className="p-4 space-y-3">
                  <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                    {t.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: theme.colors.cardBorder }}>
                    {/* Atmospheric Tag */}
                    <div className="flex items-center gap-1">
                      {t.decorations.iconPack.slice(0, 4).map((ic, i) => (
                        <span key={i} className="text-sm">{ic}</span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Live Full Preview Button */}
                      <button
                        onClick={() => handleOpenPreview(t)}
                        className="px-3.5 py-2 rounded-2xl text-xs font-bold border flex items-center gap-1.5 shadow-2xs hover:brightness-105 active:scale-95 transition-all"
                        style={{
                          backgroundColor: theme.colors.primarySoft,
                          color: theme.colors.primary,
                          borderColor: theme.colors.cardBorder
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {/* Apply or Unlock Button */}
                      {isActive ? (
                        <button
                          disabled
                          className="px-4 py-2 rounded-2xl text-xs font-bold opacity-60 bg-emerald-100 text-emerald-800 cursor-default"
                        >
                          Applied
                        </button>
                      ) : isOwned ? (
                        <button
                          onClick={() => handleApplyTheme(t.id)}
                          className="px-4 py-2 rounded-2xl text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
                          style={{
                            backgroundColor: theme.colors.primary
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            sound.tap();
                            setConfirmUnlockTheme(t);
                          }}
                          className="px-4 py-2 rounded-2xl text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-rose-500"
                        >
                          <Coins className="w-3.5 h-3.5 fill-current" />
                          <span>Unlock ({t.cost})</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULL SCREEN IMMERSIVE THEME PREVIEW MODAL                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {activePreviewTheme && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-md overflow-hidden"
          >
            {/* Top Preview Banner with Close & Action */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                      Live Preview Mode
                    </span>
                    <span className="font-bold text-xs">{activePreviewTheme.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Previewing styles without altering your account</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isThemeOwned(activePreviewTheme.id) ? (
                  <button
                    onClick={() => handleApplyTheme(activePreviewTheme.id)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Theme</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sound.tap();
                      setConfirmUnlockTheme(activePreviewTheme);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm flex items-center gap-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock ({activePreviewTheme.cost})</span>
                  </button>
                )}

                <button
                  onClick={handleClosePreview}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigable App Sections Selector */}
            <div className="bg-gray-900/90 border-b border-white/10 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {[
                { id: 'home', label: 'Home', icon: Heart },
                { id: 'chat', label: 'Chat', icon: MessageCircle },
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'loveverse', label: 'Loveverse', icon: Sparkles },
                { id: 'games', label: 'Games', icon: Gamepad2 },
                { id: 'memories', label: 'Memories', icon: Image },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map(sec => {
                const Icon = sec.icon;
                const isSelected = previewTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      sound.tap();
                      setPreviewTab(sec.id as PreviewTab);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      isSelected 
                        ? 'bg-white text-gray-900 shadow-xs' 
                        : 'text-gray-400 hover:text-white bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sec.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Interactive Preview Canvas Frame */}
            <div 
              className="flex-1 overflow-y-auto p-4 transition-colors duration-300"
              style={{
                backgroundColor: activePreviewTheme.colors.screenBg,
                color: activePreviewTheme.colors.textMain
              }}
            >
              {/* SECTION 1: HOME PREVIEW */}
              {previewTab === 'home' && (
                <div className="space-y-4 max-w-sm mx-auto">
                  {/* Hero Love Counter */}
                  <div 
                    className="rounded-3xl p-5 border shadow-sm space-y-3"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{activePreviewTheme.decorations.symbol}</span>
                        <div>
                          <h4 className="font-serif font-black text-sm">Two Hearts Sanctuary</h4>
                          <p className="text-[10px]" style={{ color: activePreviewTheme.colors.textMuted }}>
                            Day 142 of our shared journey
                          </p>
                        </div>
                      </div>
                      <span 
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: activePreviewTheme.colors.primarySoft,
                          color: activePreviewTheme.colors.primary
                        }}
                      >
                        Level 8
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider block font-bold" style={{ color: activePreviewTheme.colors.textMuted }}>
                          Daily Question
                        </span>
                        <p className="text-xs font-semibold mt-0.5">
                          What is a quiet moment with me you'll never forget?
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: activePreviewTheme.colors.primary }} />
                    </div>
                  </div>

                  {/* Mood Check & Love Streak */}
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className="rounded-3xl p-3.5 border shadow-2xs space-y-1"
                      style={{
                        backgroundColor: activePreviewTheme.colors.cardBg,
                        borderColor: activePreviewTheme.colors.cardBorder
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: activePreviewTheme.colors.textMuted }}>Mood Today</span>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-2xl">🥰</span>
                        <span className="text-xs font-bold">Deep in Love</span>
                      </div>
                    </div>

                    <div 
                      className="rounded-3xl p-3.5 border shadow-2xs space-y-1"
                      style={{
                        backgroundColor: activePreviewTheme.colors.cardBg,
                        borderColor: activePreviewTheme.colors.cardBorder
                      }}
                    >
                      <span className="text-[10px] font-bold" style={{ color: activePreviewTheme.colors.textMuted }}>Love Streak</span>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Flame className="w-5 h-5 text-amber-500 fill-amber-400" />
                        <span className="text-xs font-black">14 Days</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: CHAT PREVIEW */}
              {previewTab === 'chat' && (
                <div className="space-y-3 max-w-sm mx-auto">
                  {/* Chat Header Preview */}
                  <div 
                    className="p-3 rounded-2xl border flex items-center justify-between"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center font-bold text-xs text-rose-700">
                        P
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">{partnerData?.displayName || 'My Soulmate'}</h4>
                        <span className="text-[10px] text-emerald-500 font-semibold">• Online now</span>
                      </div>
                    </div>
                    <span className="text-base">{activePreviewTheme.decorations.symbol}</span>
                  </div>

                  {/* Messages */}
                  <div className="space-y-2.5 py-2">
                    <div className="flex flex-col items-start max-w-[80%]">
                      <div 
                        className="p-3 rounded-2xl rounded-bl-xs text-xs shadow-xs"
                        style={{
                          backgroundColor: activePreviewTheme.colors.bubblePartner,
                          color: activePreviewTheme.colors.bubblePartnerText
                        }}
                      >
                        Good morning, my love! I had the sweetest dream about our upcoming trip together 💕
                      </div>
                      <span className="text-[9px] mt-0.5 ml-1" style={{ color: activePreviewTheme.colors.textMuted }}>09:14 AM</span>
                    </div>

                    <div className="flex flex-col items-end ml-auto max-w-[80%]">
                      <div 
                        className="p-3 rounded-2xl rounded-br-xs text-xs shadow-xs"
                        style={{
                          background: activePreviewTheme.colors.bubbleMine,
                          color: activePreviewTheme.colors.bubbleMineText
                        }}
                      >
                        Tell me everything! I was just admiring our vision board and smiling thinking of you 🥰✨
                      </div>
                      <span className="text-[9px] mt-0.5 mr-1" style={{ color: activePreviewTheme.colors.textMuted }}>09:16 AM</span>
                    </div>
                  </div>

                  {/* Input bar preview */}
                  <div 
                    className="p-2 rounded-2xl border flex items-center gap-2"
                    style={{
                      backgroundColor: activePreviewTheme.colors.inputBg,
                      borderColor: activePreviewTheme.colors.inputBorder
                    }}
                  >
                    <span className="text-base px-1">🌹</span>
                    <input
                      disabled
                      placeholder="Type a sweet message..."
                      className="bg-transparent flex-1 text-xs outline-none"
                      style={{ color: activePreviewTheme.colors.textMain }}
                    />
                    <div 
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: activePreviewTheme.colors.primary }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 3: PROFILE PREVIEW */}
              {previewTab === 'profile' && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div 
                    className="rounded-3xl p-5 border text-center space-y-3"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <div className="w-18 h-18 mx-auto rounded-full p-1 border-2 border-dashed" style={{ borderColor: activePreviewTheme.colors.primary }}>
                      <div className="w-full h-full rounded-full bg-rose-100 flex items-center justify-center text-xl font-bold text-rose-700">
                        {userData?.displayName?.[0] || 'U'}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-sm">{userData?.displayName || 'Your Profile'}</h3>
                      <p className="text-[11px]" style={{ color: activePreviewTheme.colors.textMuted }}>
                        Partnered with {partnerData?.displayName || 'Soulmate'}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: activePreviewTheme.colors.primarySoft,
                          color: activePreviewTheme.colors.primary
                        }}
                      >
                        Quality Time
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Starlight Keeper Badge
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: LOVEVERSE PREVIEW */}
              {previewTab === 'loveverse' && (
                <div className="space-y-3 max-w-sm mx-auto">
                  <div 
                    className="rounded-3xl p-4 border space-y-2"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: activePreviewTheme.colors.primary }}>
                      Celestial Portals
                    </span>
                    <h3 className="font-serif font-bold text-sm">Romantic Destinations</h3>
                    <p className="text-xs" style={{ color: activePreviewTheme.colors.textMuted }}>
                      Starlit gift garden, shared vision constellation, and endless couple mini-games.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div 
                      className="p-3 rounded-2xl border"
                      style={{
                        backgroundColor: activePreviewTheme.colors.cardBg,
                        borderColor: activePreviewTheme.colors.cardBorder
                      }}
                    >
                      <span className="text-2xl">🌹</span>
                      <h4 className="font-bold text-xs mt-1">Gift Garden</h4>
                      <p className="text-[10px]" style={{ color: activePreviewTheme.colors.textMuted }}>12 3D Keepsakes</p>
                    </div>

                    <div 
                      className="p-3 rounded-2xl border"
                      style={{
                        backgroundColor: activePreviewTheme.colors.cardBg,
                        borderColor: activePreviewTheme.colors.cardBorder
                      }}
                    >
                      <span className="text-2xl">🏰</span>
                      <h4 className="font-bold text-xs mt-1">Playhouse</h4>
                      <p className="text-[10px]" style={{ color: activePreviewTheme.colors.textMuted }}>10 Co-op Games</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: GAMES PREVIEW */}
              {previewTab === 'games' && (
                <div className="space-y-3 max-w-sm mx-auto">
                  <div 
                    className="p-3.5 rounded-2xl border flex items-center justify-between"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎨</span>
                      <div>
                        <h4 className="font-bold text-xs">Draw It, Guess It</h4>
                        <p className="text-[10px]" style={{ color: activePreviewTheme.colors.textMuted }}>Live shared canvas guessing</p>
                      </div>
                    </div>
                    <span 
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: activePreviewTheme.colors.primary }}
                    >
                      Ready
                    </span>
                  </div>

                  <div 
                    className="p-3.5 rounded-2xl border flex items-center justify-between"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💭</span>
                      <div>
                        <h4 className="font-bold text-xs">Guess My Answer</h4>
                        <p className="text-[10px]" style={{ color: activePreviewTheme.colors.textMuted }}>Telepathic romantic sync</p>
                      </div>
                    </div>
                    <span 
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: activePreviewTheme.colors.primary }}
                    >
                      Ready
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION 6: MEMORIES PREVIEW */}
              {previewTab === 'memories' && (
                <div className="space-y-3 max-w-sm mx-auto">
                  <div 
                    className="rounded-3xl p-4 border space-y-2"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-serif">First Stargazing Date</span>
                      <span className="text-[10px]" style={{ color: activePreviewTheme.colors.textMuted }}>Oct 12</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: activePreviewTheme.colors.textMuted }}>
                      We sat under the blanket with warm cider and counted shooting stars together.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 7: SETTINGS PREVIEW */}
              {previewTab === 'settings' && (
                <div className="space-y-3 max-w-sm mx-auto">
                  <div 
                    className="p-3.5 rounded-2xl border flex items-center justify-between"
                    style={{
                      backgroundColor: activePreviewTheme.colors.cardBg,
                      borderColor: activePreviewTheme.colors.cardBorder
                    }}
                  >
                    <div>
                      <h4 className="font-bold text-xs">Active Theme</h4>
                      <p className="text-[10px]" style={{ color: activePreviewTheme.colors.textMuted }}>{activePreviewTheme.name}</p>
                    </div>
                    <span 
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: activePreviewTheme.colors.primarySoft,
                        color: activePreviewTheme.colors.primary
                      }}
                    >
                      Preview Mode
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* UNLOCK CONFIRMATION DIALOG MODAL                          */}
      {/* ========================================================= */}
      <AnimatePresence>
        {confirmUnlockTheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 text-gray-900 shadow-2xl border border-rose-100 space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-xs">
                {confirmUnlockTheme.decorations.symbol}
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-serif font-black text-base">
                  Unlock {confirmUnlockTheme.name}?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Spend <strong className="text-amber-600">{confirmUnlockTheme.cost} Love Coins</strong> to unlock this permanent universe for your couple space.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-gray-400">
                    Your Balance: <strong>{wallet?.balance ?? 50} Coins</strong>
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    sound.tap();
                    setConfirmUnlockTheme(null);
                    setErrorMessage(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={unlockingId !== null}
                  onClick={handleConfirmUnlock}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {unlockingId ? (
                    <span>Unlocking...</span>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5 fill-current" />
                      <span>Confirm Unlock</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
