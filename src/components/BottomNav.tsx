import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Heart, Calendar, Sparkles, ShoppingBag } from 'lucide-react';
import { sound } from '../lib/sound';
import { useLiveNotifications } from '../contexts/LiveNotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';

export function BottomNav() {
  const { notifications } = useLiveNotifications();
  const { theme } = useTheme();

  const unreadMessagesCount = notifications.filter(
    n => !n.read && (n.type === 'message' || n.type === 'voice' || n.type === 'image' || n.type === 'pulse')
  ).length;

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/chat', icon: MessageCircle, label: 'Chat', badge: unreadMessagesCount },
    { to: '/market', icon: ShoppingBag, label: 'Market' },
    { to: '/game', icon: Heart, label: 'Sync' },
    { to: '/memories', icon: Calendar, label: 'Memories' },
    { to: '/aira', icon: Sparkles, label: 'AIRA' },
  ];

  return (
    <nav 
      aria-label="Primary Mobile Navigation"
      className="md:hidden fixed bottom-0 w-full left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
    >
      <div 
        className="backdrop-blur-2xl border flex justify-around items-center px-1.5 py-1.5 rounded-full shadow-xl pointer-events-auto max-w-sm mx-auto transition-colors duration-500"
        style={{
          backgroundColor: theme.colors.navBg,
          borderColor: theme.colors.cardBorder,
          boxShadow: theme.colors.cardShadow
        }}
      >
        {navItems.map((item) => (
          <NavLink 
            key={item.to}
            to={item.to}
            onClick={() => sound.playPop()}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all relative min-h-[44px] min-w-[44px]"
            style={({ isActive }) => ({
              color: isActive ? theme.colors.navActive : theme.colors.textMuted
            })}
          >
            {({ isActive }) => (
              <motion.div 
                whileTap={{ scale: 0.92 }}
                className="flex flex-col items-center justify-center relative w-full"
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 -inset-x-1.5 -inset-y-1 rounded-full -z-10 shadow-2xs"
                    style={{
                      backgroundColor: theme.colors.primarySoft
                    }}
                  />
                )}
                <div className="relative">
                  <item.icon 
                    className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 font-bold' : ''}`}
                    style={{ strokeWidth: isActive ? 2.5 : 2 }}
                  />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span 
                      className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-xs animate-pulse"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      {item.badge! > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span 
                  className={`text-[10px] mt-0.5 leading-none transition-colors ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
