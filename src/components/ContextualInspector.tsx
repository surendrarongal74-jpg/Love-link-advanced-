import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Sparkles, Gift, Flame, Coins, Calendar, ChevronRight, 
  Palette, Battery, Smile, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useTheme } from '../contexts/ThemeContext';
import { sound } from '../lib/sound';
import { motion } from 'motion/react';

export function ContextualInspector() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { balance } = useLoveCoins();
  const { theme, activeThemeId } = useTheme();
  const navigate = useNavigate();

  // Calculate days together
  const daysTogether = React.useMemo(() => {
    if (!space?.anniversaryDate) return 1;
    try {
      const start = new Date(space.anniversaryDate).getTime();
      const now = Date.now();
      const diff = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
      return diff;
    } catch {
      return 1;
    }
  }, [space?.anniversaryDate]);

  if (!userData?.coupleSpaceId) {
    return null;
  }

  return (
    <aside 
      aria-label="Partner and Contextual Inspector"
      className="hidden xl:flex flex-col w-80 2xl:w-88 border-l sticky top-0 h-screen select-none z-20 overflow-y-auto px-5 py-6 gap-6 transition-colors duration-500"
      style={{
        backgroundColor: theme.colors.headerBg,
        borderColor: theme.colors.cardBorder
      }}
    >
      {/* Partner Live Presence Card */}
      <section 
        className="p-4 rounded-3xl border love-card-interactive relative overflow-hidden"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.cardBorder,
          boxShadow: theme.colors.cardShadow
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Live Connection
          </span>
          <button 
            onClick={() => {
              sound.playHeartbeat();
            }}
            title="Send Heartbeat Pulse"
            className="p-1.5 rounded-full hover:scale-110 active:scale-95 transition-transform apple-press"
            style={{ backgroundColor: theme.colors.primarySoft, color: theme.colors.primary }}
          >
            <Heart className="w-4 h-4 fill-current animate-pulse" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            {partnerData?.photoURL ? (
              <img 
                src={partnerData.photoURL} 
                alt={partnerData.displayName || 'Partner'} 
                className="w-14 h-14 rounded-2xl object-cover border-2"
                style={{ borderColor: theme.colors.primary }}
              />
            ) : (
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs"
                style={{ backgroundColor: theme.colors.primarySoft, color: theme.colors.primary }}
              >
                {partnerData?.displayName ? partnerData.displayName[0].toUpperCase() : 'P'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm truncate">{partnerData?.displayName || 'My Sweetheart'}</h3>
            <p className="text-xs opacity-75 flex items-center gap-1 mt-0.5">
              <Smile className="w-3.5 h-3.5 text-amber-500 inline" />
              <span className="truncate">{partnerData?.mood || 'Feeling Loved'}</span>
            </p>
            {partnerData?.batteryLevel !== undefined && (
              <div className="flex items-center gap-1.5 text-[11px] opacity-70 mt-1">
                <Battery className="w-3 h-3 text-emerald-500" />
                <span>{partnerData.batteryLevel}% battery</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Send Love Pulse */}
        <button
          onClick={() => {
            sound.playHeartbeat();
            navigate('/chat');
          }}
          className="mt-4 w-full py-2.5 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 apple-press"
          style={{
            backgroundColor: theme.colors.primarySoft,
            color: theme.colors.primary
          }}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Send Romantic Pulse</span>
        </button>
      </section>

      {/* Couple Relationship Journey */}
      <section 
        className="p-4 rounded-3xl border"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.cardBorder
        }}
      >
        <div className="flex items-center justify-between mb-3 text-xs font-bold">
          <span className="flex items-center gap-1.5 opacity-80">
            <Calendar className="w-4 h-4 text-rose-500" />
            Our Journey
          </span>
          <span className="text-rose-500 font-extrabold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-rose-500" />
            Day {daysTogether}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5">
            <span className="block text-[10px] opacity-60 uppercase font-semibold">Streak</span>
            <span className="text-base font-black text-rose-500">{space?.streakDays || 1} Days</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-black/20 border border-black/5 dark:border-white/5">
            <span className="block text-[10px] opacity-60 uppercase font-semibold">Love Coins</span>
            <span className="text-base font-black text-amber-500 flex items-center justify-center gap-1">
              <Coins className="w-3.5 h-3.5 fill-current" />
              {balance}
            </span>
          </div>
        </div>
      </section>

      {/* Active Theme Constellation */}
      <section 
        className="p-4 rounded-3xl border love-card-interactive cursor-pointer"
        onClick={() => {
          sound.playPop();
          navigate('/themes');
        }}
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.cardBorder
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-purple-500" />
            Active Theme
          </span>
          <ChevronRight className="w-4 h-4 opacity-50" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{theme.decorations.symbol}</div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold truncate">{theme.name}</h4>
            <p className="text-[11px] opacity-70 truncate">{theme.decorations.vibeTag}</p>
          </div>
        </div>
      </section>

      {/* Quick Virtual Gifts Action */}
      <section 
        className="p-4 rounded-3xl border text-center relative overflow-hidden"
        style={{
          backgroundColor: theme.colors.cardBg,
          borderColor: theme.colors.cardBorder
        }}
      >
        <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center mb-2"
          style={{ backgroundColor: theme.colors.primarySoft, color: theme.colors.primary }}>
          <Gift className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold">Surprise With a Gift</h4>
        <p className="text-[11px] opacity-70 mt-1 mb-3">Send eternal roses or celestial charms</p>
        <button
          onClick={() => {
            sound.playPop();
            navigate('/market');
          }}
          className="w-full py-2 px-3 rounded-2xl text-xs font-bold text-white shadow-sm apple-press"
          style={{ backgroundColor: theme.colors.primary }}
        >
          Open Gift Shop
        </button>
      </section>
    </aside>
  );
}
