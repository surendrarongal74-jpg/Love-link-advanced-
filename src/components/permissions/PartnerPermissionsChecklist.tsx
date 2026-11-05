import React, { useState, useEffect } from 'react';
import { Mic, Bell, Camera, HardDrive, CheckCircle2, AlertCircle, ShieldCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playSound } from '../../lib/sound';

export interface PermissionStatus {
  microphone: boolean;
  notifications: boolean;
  cameraAndPhotos: boolean;
  localVault: boolean;
}

interface PartnerPermissionsChecklistProps {
  onStatusChange?: (allGranted: boolean, status: PermissionStatus) => void;
  className?: string;
  compact?: boolean;
}

const STORAGE_KEY = 'lovelink_device_permissions';

export const PartnerPermissionsChecklist: React.FC<PartnerPermissionsChecklistProps> = ({
  onStatusChange,
  className = '',
  compact = false,
}) => {
  const [status, setStatus] = useState<PermissionStatus>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      microphone: false,
      notifications: false,
      cameraAndPhotos: false,
      localVault: false,
    };
  });

  const [requesting, setRequesting] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Check existing browser permission status on mount
  useEffect(() => {
    async function checkBrowserStatus() {
      const updated: Partial<PermissionStatus> = {};

      // 1. Check Notification permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          updated.notifications = true;
        }
      }

      // 2. Check IndexedDB storage
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        updated.localVault = true;
      }

      // Check if navigator.permissions is available
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          // Check microphone
          const micQuery = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (micQuery.state === 'granted') {
            updated.microphone = true;
          }
        } catch {
          // not supported or blocked in some browsers
        }
      }

      if (Object.keys(updated).length > 0) {
        setStatus((prev) => {
          const next = { ...prev, ...updated };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      }
    }

    checkBrowserStatus();
  }, []);

  // Sync to parent
  useEffect(() => {
    const allGranted = status.microphone && status.notifications && status.cameraAndPhotos && status.localVault;
    if (onStatusChange) {
      onStatusChange(allGranted, status);
    }
  }, [status, onStatusChange]);

  const updatePermission = (key: keyof PermissionStatus, val: boolean) => {
    setStatus((prev) => {
      const next = { ...prev, [key]: val };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const denied = (what: string) =>
    setFeedbackMsg(`${what} was not allowed. That's okay: you can still use Love Link, and turn it on later in your browser's site settings.`);

  // Request Microphone (real browser prompt; only recorded as granted if the browser grants it)
  const requestMic = async () => {
    setRequesting('microphone');
    setFeedbackMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFeedbackMsg('This browser does not support voice recording.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      updatePermission('microphone', true);
      playSound('success');
      setFeedbackMsg('Microphone allowed for voice notes.');
    } catch {
      updatePermission('microphone', false);
      denied('Microphone access');
    } finally {
      setRequesting(null);
    }
  };

  // Request Notifications
  const requestNotifications = async () => {
    setRequesting('notifications');
    setFeedbackMsg(null);
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setFeedbackMsg('This browser does not support notifications.');
        return;
      }
      const perm = await Notification.requestPermission();
      updatePermission('notifications', perm === 'granted');
      if (perm === 'granted') {
        playSound('success');
        setFeedbackMsg('Notifications allowed for partner pings and messages.');
      } else {
        denied('Notifications');
      }
    } catch {
      updatePermission('notifications', false);
      denied('Notifications');
    } finally {
      setRequesting(null);
    }
  };

  // Request Camera (photos can always be picked from the gallery without this)
  const requestCameraAndPhotos = async () => {
    setRequesting('cameraAndPhotos');
    setFeedbackMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFeedbackMsg('This browser does not support the camera. You can still share photos from your gallery.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      updatePermission('cameraAndPhotos', true);
      playSound('success');
      setFeedbackMsg('Camera allowed.');
    } catch {
      updatePermission('cameraAndPhotos', false);
      denied('Camera access');
    } finally {
      setRequesting(null);
    }
  };

  // Offline cache uses IndexedDB, which needs no browser prompt.
  const requestLocalVault = () => {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      updatePermission('localVault', true);
      setFeedbackMsg('Offline cache enabled on this device.');
    } else {
      setFeedbackMsg('This browser does not support offline storage.');
    }
  };

  // Ask for each permission in turn, recording only what the browser actually grants.
  const grantAll = async () => {
    setRequesting('all');
    setFeedbackMsg(null);
    const next: PermissionStatus = { ...status };
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          next.microphone = true;
        } catch {
          next.microphone = false;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          next.cameraAndPhotos = true;
        } catch {
          next.cameraAndPhotos = false;
        }
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          next.notifications = (await Notification.requestPermission()) === 'granted';
        } catch {
          next.notifications = false;
        }
      }
      next.localVault = typeof window !== 'undefined' && 'indexedDB' in window;
      setStatus(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      const allowed = Object.values(next).filter(Boolean).length;
      setFeedbackMsg(
        allowed === 4
          ? 'All set on this device.'
          : `${allowed} of 4 allowed. Anything you skipped can be turned on later; Love Link still works without it.`
      );
    } finally {
      setRequesting(null);
    }
  };

  const grantedCount = Object.values(status).filter(Boolean).length;
  const allGranted = grantedCount === 4;

  const permissionItems = [
    {
      key: 'microphone' as const,
      icon: <Mic className="w-5 h-5 text-rose-500" />,
      title: 'Microphone (Voice Notes)',
      desc: 'Record voice whispers & audio notes shared with your partner',
      isGranted: status.microphone,
      action: requestMic,
      required: false,
    },
    {
      key: 'cameraAndPhotos' as const,
      icon: <Camera className="w-5 h-5 text-pink-500" />,
      title: 'Camera & Photo Media',
      desc: 'Share private photos, couple drawings, and avatars stored offline',
      isGranted: status.cameraAndPhotos,
      action: requestCameraAndPhotos,
      required: false,
    },
    {
      key: 'notifications' as const,
      icon: <Bell className="w-5 h-5 text-purple-500" />,
      title: 'Partner Alerts & Pings',
      desc: 'Get notified when your partner sends a love ping or daily answer',
      isGranted: status.notifications,
      action: requestNotifications,
      required: false,
    },
    {
      key: 'localVault' as const,
      icon: <HardDrive className="w-5 h-5 text-emerald-500" />,
      title: 'Offline Cache',
      desc: 'Keeps a copy of recent chats on this device so they load offline',
      isGranted: status.localVault,
      action: requestLocalVault,
      required: false,
    },
  ];

  return (
    <div className={`bg-white/90 backdrop-blur-xl rounded-3xl border border-rose-200/80 shadow-xl shadow-rose-200/40 p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-gray-900 text-base flex items-center gap-2">
              Device permissions (optional)
              {allGranted ? (
                <span className="text-[11px] font-sans font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  All allowed
                </span>
              ) : (
                <span className="text-[11px] font-sans font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  {grantedCount}/4 allowed
                </span>
              )}
            </h3>
            <p className="text-xs text-rose-500/90 font-medium">
              Ask now or later. Love Link works without them; some features (voice notes, alerts) need them.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-500 hover:text-gray-700 p-2.5 rounded-lg transition"
          aria-label={showDetails ? 'Hide permission details' : 'Show permission details'}
          aria-expanded={showDetails}
        >
          {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-rose-100 h-2 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${(grantedCount / 4) * 100}%` }}
        />
      </div>

      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </motion.div>
      )}

      {/* Permission Items */}
      {showDetails && (
        <div className="space-y-2.5 mb-4">
          {permissionItems.map((item) => (
            <div
              key={item.key}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                item.isGranted
                  ? 'bg-emerald-50/50 border-emerald-200/80'
                  : 'bg-rose-50/30 border-rose-100 hover:bg-rose-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.isGranted ? 'bg-white text-emerald-600 shadow-sm' : 'bg-white shadow-sm'
                  }`}
                >
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900">{item.title}</span>
                    <span className="text-[11px] text-gray-500 font-semibold">• Optional</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">{item.desc}</p>
                </div>
              </div>

              <div>
                {item.isGranted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Granted
                  </span>
                ) : (
                  <button
                    onClick={item.action}
                    disabled={requesting === item.key || requesting === 'all'}
                    className="min-h-11 text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-4 rounded-full shadow-sm shadow-rose-200 transition disabled:opacity-50"
                    aria-label={`Allow ${item.title}`}
                  >
                    {requesting === item.key ? 'Requesting...' : 'Allow'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grant All Button if not all granted */}
      {!allGranted && (
        <button
          onClick={grantAll}
          disabled={requesting === 'all'}
          className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-xs py-3 px-4 rounded-2xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          {requesting === 'all' ? 'Asking your browser…' : 'Ask for all permissions'}
        </button>
      )}

      {allGranted && !showDetails && (
        <div className="text-center py-1">
          <p className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            All permissions allowed on this device.
          </p>
        </div>
      )}
    </div>
  );
};
