import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, MessageCircle, ShoppingBag, Heart, Calendar, Sparkles, 
  Gamepad2, Palette, Coins, User, ShieldCheck, MapPin, Smile, Gift
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLiveNotifications } from '../contexts/LiveNotificationContext';
import { sound } from '../lib/sound';
import { motion } from 'motion/react';

export function SidebarNav() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { balance } = useLoveCoins();
  const { theme } = useTheme();
  const { notifications } = useLiveNotifications();
  const navigate = useNavigate();

  const unreadMessagesCount = notifications.filter(
    n => !n.read && (n.type === 'message' || n.type === 'voice' || n.type === 'image' || n.type === 'pulse')
  ).length;

  const links = [
    { to: '/', icon: Home, label: 'Home Sanctuary' },
    { to: '/loveverse/gifts', icon: Gift, label: 'Loveverse Gifts' },
    { to: '/chat', icon: MessageCircle, label: 'Couple Chat', badge: unreadMessagesCount },
    { to: '/playhouse', icon: Gamepad2, label: 'Playhouse Games' },
    { to: '/market', icon: ShoppingBag, label: 'Gifts & Shop' },
    { to: '/themes', icon: Palette, label: 'Loveverse Themes' },
    { to: '/memories', icon: Calendar, label: 'Shared Memories' },
    { to: '/game', icon: Heart, label: 'Daily Love Sync' },
    { to: '/map', icon: MapPin, label: 'Love Map Pins' },
    { to: '/aira', icon: Sparkles, label: 'AIRA Romantic AI' },
  ];

  return (
    <aside 
      aria-label="Desktop and Tablet Navigation"
      className="hidden md:flex flex-col md:w-20 lg:w-64 xl:w-72 border-r transition-colors duration-500 sticky top-0 h-screen select-none z-30"
      style={{
        backgroundColor: theme.colors.headerBg,
        borderColor: theme.colors.cardBorder
      }}
    >
      {/* Brand Header */}
      <div className="p-3 lg:p-5 border-b flex flex-col items-center lg:items-stretch" style={{ borderColor: theme.colors.cardBorder }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playHeartbeat();
              navigate('/');
            }}
            title="Love Link Sanctuary"
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm apple-press shrink-0"
            style={{ 
              backgroundColor: theme.colors.primary, 
              color: '#FFFFFF' 
            }}
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>
          <div className="hidden lg:block min-w-0">
            <h2 className="font-serif font-black text-lg tracking-tight leading-tight truncate">Love Link</h2>
            <div className="flex items-center gap-1.5 text-xs opacity-75">
              <span>{theme.decorations.symbol}</span>
              <span className="font-medium truncate max-w-[140px]">{theme.name}</span>
            </div>
          </div>
        </div>

        {/* Partner Connection Radar */}
        {partnerData && (
          <div 
            className="mt-3 lg:mt-4 p-2 lg:p-2.5 rounded-2xl border flex items-center justify-center lg:justify-between"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative">
                {partnerData.photoURL ? (
                  <img 
                    src={partnerData.photoURL} 
                    alt={partnerData.displayName || 'Partner'} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: theme.colors.primarySoft, color: theme.colors.primary }}
                  >
                    {partnerData.displayName ? partnerData.displayName[0].toUpperCase() : 'P'}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-xs font-bold truncate">{partnerData.displayName || 'Sweetheart'}</p>
                <p className="text-[10px] opacity-70 flex items-center gap-1">
                  <span>{partnerData.mood || 'Happy'}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 lg:px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => sound.playPop()}
            title={link.label}
            className="flex items-center justify-center lg:justify-between px-2.5 lg:px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all relative group apple-press"
            style={({ isActive }) => ({
              backgroundColor: isActive ? theme.colors.primarySoft : 'transparent',
              color: isActive ? theme.colors.primary : theme.colors.textMuted
            })}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <link.icon 
                    className={`w-5 h-5 lg:w-4 lg:h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'scale-110 font-bold' : ''
                    }`}
                    style={{ strokeWidth: isActive ? 2.5 : 2 }}
                  />
                  <span className="hidden lg:inline">{link.label}</span>
                </div>
                {Boolean(link.badge && link.badge > 0) && (
                  <span 
                    className="absolute top-1.5 right-1.5 lg:static px-1.5 lg:px-2 py-0.5 rounded-full text-[9px] lg:text-[10px] font-black text-white shadow-xs"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    {link.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Wallet & Theme Switcher */}
      <div 
        className="p-2 lg:p-4 border-t space-y-2"
        style={{ borderColor: theme.colors.cardBorder }}
      >
        <button
          onClick={() => {
            sound.playPop();
            navigate('/earn-coins');
          }}
          title={`Love Coins: ${balance}`}
          className="w-full flex items-center justify-center lg:justify-between p-2 lg:p-2.5 rounded-2xl border transition-all apple-press"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder
          }}
        >
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
            <span className="hidden lg:inline text-xs font-bold">Love Coins</span>
          </div>
          <span className="hidden lg:inline text-xs font-black" style={{ color: theme.colors.primary }}>
            {balance}
          </span>
        </button>

        <button
          onClick={() => {
            sound.playPop();
            navigate('/themes');
          }}
          title="Themes Gallery"
          className="w-full flex items-center justify-center gap-2 py-2 px-2 lg:px-3 rounded-2xl text-xs font-bold text-white transition-all shadow-xs apple-press"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span className="hidden lg:inline">Themes Gallery</span>
        </button>
      </div>
    </aside>
  );
}
