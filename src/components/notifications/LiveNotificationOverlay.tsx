import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveNotifications } from '../../contexts/LiveNotificationContext';
import { 
  MessageCircle, Heart, Mic, Image as ImageIcon, Sparkles, 
  Gift, BookOpen, Bell, Gamepad2, X, ChevronRight, Volume2
} from 'lucide-react';
import { sound } from '../../lib/sound';

export const LiveNotificationOverlay: React.FC = () => {
  const { activeBanner, dismissBanner, markAsRead } = useLiveNotifications();
  const navigate = useNavigate();

  // Listen for custom navigation event from system notification clicks
  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        navigate(customEvent.detail);
      }
    };
    window.addEventListener('lovelink:navigate', handleNav);
    return () => window.removeEventListener('lovelink:navigate', handleNav);
  }, [navigate]);

  if (!activeBanner) return null;

  const handleActionClick = () => {
    sound.playPop();
    markAsRead(activeBanner.id);
    dismissBanner();
    if (activeBanner.link) {
      navigate(activeBanner.link);
    }
  };

  const getIcon = () => {
    switch (activeBanner.type) {
      case 'pulse':
        return <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-ping" />;
      case 'voice':
        return <Mic className="w-5 h-5 text-purple-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'surprise':
        return <Gift className="w-5 h-5 text-amber-500" />;
      case 'diary':
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-indigo-500" />;
      case 'game':
        return <Gamepad2 className="w-5 h-5 text-pink-500" />;
      default:
        return <MessageCircle className="w-5 h-5 text-rose-500" />;
    }
  };

  const getGradient = () => {
    switch (activeBanner.type) {
      case 'pulse':
        return 'from-rose-500/15 to-pink-500/15 border-rose-300';
      case 'voice':
        return 'from-purple-500/15 to-pink-500/15 border-purple-200';
      case 'surprise':
        return 'from-amber-500/15 to-rose-500/15 border-amber-200';
      default:
        return 'from-rose-500/10 to-pink-500/10 border-rose-200';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -45, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="fixed top-3 left-0 right-0 z-[200] max-w-md mx-auto px-3 pointer-events-none"
      >
        <div 
          onClick={handleActionClick}
          className={`pointer-events-auto cursor-pointer bg-white/95 backdrop-blur-2xl rounded-3xl p-3.5 shadow-2xl shadow-rose-950/15 border ${getGradient()} flex items-center gap-3 relative overflow-hidden group hover:scale-[1.01] active:scale-[0.99] transition-all`}
        >
          {/* Subtle animated shine bar */}
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 to-pink-500 rounded-l-3xl" />

          {/* Icon Badge */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-100 to-pink-50 flex items-center justify-center shrink-0 shadow-inner border border-rose-200/60 relative">
            {getIcon()}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          </div>

          {/* Content details */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <h4 className="font-bold text-gray-900 text-xs truncate leading-tight flex items-center gap-1.5">
                <span>{activeBanner.title}</span>
                <span className="text-[9px] px-1.5 py-0.2 font-semibold bg-rose-100 text-rose-700 rounded-full uppercase tracking-wider">
                  Live
                </span>
              </h4>
              <span className="text-[10px] text-gray-400 shrink-0">Just now</span>
            </div>
            <p className="text-[12px] text-gray-600 line-clamp-1 leading-snug font-medium">
              {activeBanner.body}
            </p>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleActionClick();
              }}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-[11px] shadow-sm hover:opacity-95 active:scale-95 transition flex items-center gap-0.5"
            >
              <span>{activeBanner.actionLabel || 'View'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playPop();
                dismissBanner();
              }}
              className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center transition active:scale-90"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Animated 6-second progress bar */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 6.5, ease: 'linear' }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-400 to-pink-500 origin-left"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
