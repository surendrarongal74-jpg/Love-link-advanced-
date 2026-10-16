import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Heart, Calendar, Sparkles, ShoppingBag } from 'lucide-react';
import { sound } from '../lib/sound';
import { useLiveNotifications } from '../contexts/LiveNotificationContext';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications } = useLiveNotifications();

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
    <div className="fixed bottom-0 w-full left-0 right-0 z-40 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="bg-white/95 backdrop-blur-2xl border border-rose-100 flex justify-around items-center px-1.5 py-1.5 rounded-full shadow-2xl shadow-rose-300/40 pointer-events-auto max-w-sm mx-auto">
        {navItems.map((item) => (
          <NavLink 
            key={item.to}
            to={item.to}
            onClick={() => sound.playPop()}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all relative ${
                isActive ? 'text-rose-600 font-bold' : 'text-rose-400/80 hover:text-rose-600 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div 
                    className="absolute inset-0 bg-rose-100/70 rounded-full -z-10 shadow-2xs"
                  />
                )}
                <div className="relative">
                  <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-xs animate-pulse">
                      {item.badge! > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
