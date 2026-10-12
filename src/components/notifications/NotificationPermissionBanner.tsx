import React, { useState, useEffect } from 'react';
import { useLiveNotifications } from '../../contexts/LiveNotificationContext';
import { Bell, X, Heart } from 'lucide-react';
import { sound } from '../../lib/sound';

export const NotificationPermissionBanner: React.FC = () => {
  const { pushPermission, requestPushPermission } = useLiveNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem('lovelink_notif_banner_dismissed');
      if (isDismissed) setDismissed(true);
    } catch {}
  }, []);

  if (pushPermission === 'granted' || pushPermission === 'denied' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    sound.playPop();
    const granted = await requestPushPermission();
    if (!granted) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    sound.playPop();
    setDismissed(true);
    try {
      sessionStorage.setItem('lovelink_notif_banner_dismissed', 'true');
    } catch {}
  };

  return (
    <div className="mx-4 my-2.5 bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-rose-100/40 border border-rose-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-300">
          <Bell className="w-4 h-4 animate-bounce" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-gray-900 leading-tight">
            Enable Live Partner Notifications
          </h4>
          <p className="text-[11px] text-gray-600 truncate leading-tight mt-0.5">
            Get instant alerts when your partner messages or pings you 💕
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleEnable}
          className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-95 active:scale-95 text-white text-[11px] font-bold rounded-full shadow-xs transition"
        >
          Enable
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
