import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveNotifications } from '../../contexts/LiveNotificationContext';
import { 
  X, Bell, BellOff, Volume2, VolumeX, Smartphone, CheckCheck, 
  Trash2, MessageCircle, Heart, Mic, Image as ImageIcon, Gift, 
  BookOpen, Gamepad2, Sparkles, ChevronRight, Check
} from 'lucide-react';
import { sound } from '../../lib/sound';

export const NotificationDrawer: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    isDrawerOpen, 
    setIsDrawerOpen, 
    soundEnabled, 
    toggleSound, 
    vibrateEnabled, 
    toggleVibrate, 
    pushPermission, 
    requestPushPermission, 
    markAllAsRead, 
    markAsRead, 
    clearHistory 
  } = useLiveNotifications();

  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const handleItemClick = (link?: string, id?: string) => {
    sound.playPop();
    if (id) markAsRead(id);
    setIsDrawerOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.max(0, Date.now() - timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pulse':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'voice':
        return <Mic className="w-4 h-4 text-purple-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'surprise':
        return <Gift className="w-4 h-4 text-amber-500" />;
      case 'diary':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'reminder':
        return <Bell className="w-4 h-4 text-indigo-500" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-pink-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-rose-500" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop();
            setIsDrawerOpen(false);
          }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative bg-white rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border-t border-rose-100 z-10"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-rose-100/80 bg-rose-50/50">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-300/50">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-lg leading-tight">
                    Live Alerts
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {unreadCount > 0 ? `${unreadCount} new alerts from partner` : 'Real-time partner updates'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      sound.playPop();
                      markAllAsRead();
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-100 rounded-full text-xs font-semibold flex items-center gap-1 transition"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    sound.playPop();
                    setIsDrawerOpen(false);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Preference Controls */}
            <div className="flex items-center gap-2 pt-1 pb-1 overflow-x-auto no-scrollbar">
              <button
                onClick={toggleSound}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition border ${
                  soundEnabled 
                    ? 'bg-rose-100/80 text-rose-700 border-rose-200' 
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={toggleVibrate}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition border ${
                  vibrateEnabled 
                    ? 'bg-rose-100/80 text-rose-700 border-rose-200' 
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Vibrate {vibrateEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {pushPermission !== 'granted' ? (
                <button
                  onClick={async () => {
                    await requestPushPermission();
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Enable Push</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Push Active</span>
                </span>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-rose-50">
            {notifications.length === 0 ? (
              <div className="py-16 text-center px-6">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="font-serif font-bold text-gray-800 text-base mb-1">
                  All caught up!
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  As soon as your partner sends a message, voice note, photo, or heartbeat pulse, you will be notified live right here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item.link, item.id)}
                  className={`py-3 px-3 rounded-2xl flex items-start gap-3 cursor-pointer transition active:scale-[0.99] hover:bg-rose-50/60 ${
                    !item.read ? 'bg-rose-50/40 font-medium' : 'opacity-85'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-100 to-pink-100 flex items-center justify-center shrink-0 border border-rose-200/50 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-600 line-clamp-2 leading-snug">
                      {item.body}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 self-center" />
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-rose-100/80 bg-gray-50/50 flex justify-between items-center px-6">
              <span className="text-[11px] text-gray-400 font-medium">
                {notifications.length} recent notification{notifications.length === 1 ? '' : 's'}
              </span>
              <button
                onClick={() => {
                  sound.playPop();
                  clearHistory();
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear history</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
