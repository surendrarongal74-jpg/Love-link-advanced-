import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useCoupleSpace } from './CoupleSpaceContext';
import { LiveNotificationItem, NotificationType } from '../types/notification';
import { sound } from '../lib/sound';
import { decryptData } from '../lib/encryption';

interface LiveNotificationContextType {
  notifications: LiveNotificationItem[];
  unreadCount: number;
  activeBanner: LiveNotificationItem | null;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  pushPermission: NotificationPermission;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  requestPushPermission: () => Promise<boolean>;
  dismissBanner: () => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearHistory: () => void;
  toggleSound: () => void;
  toggleVibrate: () => void;
  triggerNotification: (notif: Omit<LiveNotificationItem, 'id' | 'timestamp' | 'read'>) => void;
}

const LiveNotificationContext = createContext<LiveNotificationContextType | null>(null);

const STORAGE_PREFIX = 'lovelink_notifications_';
const SOUND_STORAGE_KEY = 'lovelink_notification_sound';
const VIBRATE_STORAGE_KEY = 'lovelink_notification_vibrate';

export const LiveNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();

  const [notifications, setNotifications] = useState<LiveNotificationItem[]>([]);
  const [activeBanner, setActiveBanner] = useState<LiveNotificationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SOUND_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(VIBRATE_STORAGE_KEY);
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });

  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const seenIdsRef = useRef<Set<string>>(new Set());
  const bannerTimerRef = useRef<any>(null);
  const prevPartnerMoodRef = useRef<string | undefined>(undefined);
  const prevGameStatusRef = useRef<string | undefined>(undefined);
  const listenerMountTimeRef = useRef<number>(Date.now());

  // Load cached notifications when space ID changes
  useEffect(() => {
    if (!space?.id) {
      setNotifications([]);
      return;
    }

    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${space.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNotifications(parsed.slice(0, 50));
          parsed.forEach((n: LiveNotificationItem) => seenIdsRef.current.add(n.id));
        }
      }
    } catch {
      // cache read failed
    }

    listenerMountTimeRef.current = Date.now();
  }, [space?.id]);

  // Persist notifications on change
  useEffect(() => {
    if (!space?.id) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${space.id}`, JSON.stringify(notifications.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [notifications, space?.id]);

  // Sync push permission state with browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      } catch {}
      if (next) sound.playMessageDing();
      return next;
    });
  }, []);

  const toggleVibrate = useCallback(() => {
    setVibrateEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem(VIBRATE_STORAGE_KEY, String(next));
      } catch {}
      if (next && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      return next;
    });
  }, []);

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        sound.playChime();
        try {
          new Notification('💕 Love Link Notifications Active', {
            body: 'You will receive instant alerts whenever your partner reaches out!',
            icon: '/favicon.ico',
          });
        } catch {}
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Notification permission error:', err);
      return false;
    }
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setActiveBanner(null);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearHistory = useCallback(() => {
    setNotifications([]);
    if (space?.id) {
      try {
        localStorage.removeItem(`${STORAGE_PREFIX}${space.id}`);
      } catch {}
    }
  }, [space?.id]);

  // Dispatch live notification (sound, vibration, toast banner, and web push)
  const triggerNotification = useCallback((item: Omit<LiveNotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: LiveNotificationItem = {
      ...item,
      id,
      timestamp: Date.now(),
      read: false,
    };

    // 1. Update state history
    setNotifications(prev => [fullItem, ...prev.filter(n => n.id !== fullItem.id)].slice(0, 50));

    // 2. Display in-app floating banner
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setActiveBanner(fullItem);
    bannerTimerRef.current = setTimeout(() => {
      setActiveBanner(null);
      bannerTimerRef.current = null;
    }, 6500);

    // 3. Audio feedback
    if (soundEnabled) {
      if (item.type === 'pulse') {
        sound.playLoveAlert();
      } else if (item.type === 'message' || item.type === 'voice' || item.type === 'image') {
        sound.playNotificationChime();
      } else {
        sound.playMessageDing();
      }
    }

    // 4. Physical vibration feedback
    if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      if (item.type === 'pulse') {
        navigator.vibrate([100, 80, 100, 80, 200]);
      } else {
        navigator.vibrate([80, 50, 80]);
      }
    }

    // 5. System Web Push / Desktop Notification (fires in background or foreground)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(fullItem.title, {
          body: fullItem.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: fullItem.type + '_' + fullItem.timestamp,
        });

        notif.onclick = () => {
          window.focus();
          if (fullItem.link) {
            window.location.hash = '';
            // dispatch custom event for react router navigation
            window.dispatchEvent(new CustomEvent('lovelink:navigate', { detail: fullItem.link }));
          }
          notif.close();
        };
      } catch (err) {
        console.warn('Native notification display failed:', err);
      }
    }
  }, [soundEnabled, vibrateEnabled]);

  // ==========================================
  // REAL-TIME FIRESTORE EVENT LISTENERS
  // ==========================================

  // 1. Real-time Messages listener (text, voice, image, heartbeat pulse, reactions)
  useEffect(() => {
    if (!space?.id || !userData?.id) return;

    const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
    const currentUserId = userData.id;
    const spaceId = space.id;

    const q = query(
      collection(db, `coupleSpaces/${spaceId}/messages`),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Process doc changes
      const changes = snapshot.docChanges();

      for (const change of changes) {
        if (change.type === 'added') {
          const docId = change.doc.id;
          const data = change.doc.data();

          // Check if it's already seen
          if (seenIdsRef.current.has(docId)) continue;
          seenIdsRef.current.add(docId);

          // Only trigger for partner's messages
          if (data.senderId === currentUserId) continue;

          // Check timestamp to avoid alerting on ancient historical messages on initial load
          const msgTime = data.createdAt || 0;
          const isFresh = msgTime >= (listenerMountTimeRef.current - 12000);
          if (!isFresh) continue;

          // Check message type & decryption
          let displayContent = data.content || '';
          let notifType: NotificationType = 'message';
          let title = `💌 ${partnerName}`;
          let preview = '';

          if (data.ciphertext && data.iv) {
            try {
              const decryptedStr = await decryptData(spaceId, data.ciphertext, data.iv);
              const payload = JSON.parse(decryptedStr);
              if (payload.type === 'voice') {
                notifType = 'voice';
                title = `🎙️ ${partnerName} sent a voice note`;
                preview = `Voice message (${payload.duration || 0}s) • Tap to listen`;
              } else if (payload.type === 'image') {
                notifType = 'image';
                title = `📷 ${partnerName} shared a photo`;
                preview = 'Tap to view romantic photo in chat';
              } else {
                displayContent = payload.content || '';
                if (displayContent.includes('heartbeat') || displayContent.includes('💓')) {
                  notifType = 'pulse';
                  title = `💓 Heartbeat from ${partnerName}!`;
                  preview = displayContent;
                } else {
                  preview = displayContent.length > 70 ? `${displayContent.substring(0, 70)}...` : displayContent;
                }
              }
            } catch {
              title = `🔒 ${partnerName} sent a secret message`;
              preview = 'Tap to decrypt and view in chat';
            }
          } else {
            // Plaintext message
            if (data.type === 'voice') {
              notifType = 'voice';
              title = `🎙️ ${partnerName} sent a voice note`;
              preview = `Voice message (${data.duration || 0}s) • Tap to listen`;
            } else if (data.type === 'image') {
              notifType = 'image';
              title = `📷 ${partnerName} shared a photo`;
              preview = 'Tap to view romantic photo in chat';
            } else if (displayContent.includes('heartbeat') || displayContent.includes('💓') || displayContent.includes('pulse')) {
              notifType = 'pulse';
              title = `💓 Heartbeat from ${partnerName}!`;
              preview = displayContent;
            } else {
              notifType = 'message';
              preview = displayContent.length > 70 ? `${displayContent.substring(0, 70)}...` : displayContent;
            }
          }

          triggerNotification({
            type: notifType,
            title,
            body: preview || 'New romantic message received',
            senderId: data.senderId,
            senderName: partnerName,
            link: '/chat',
            actionLabel: notifType === 'voice' ? 'Listen' : notifType === 'image' ? 'View Photo' : 'Reply',
          });
        }
      }
    }, (err) => {
      console.warn('Real-time message notification listener paused:', err);
    });

    return () => unsubscribe();
  }, [space?.id, userData?.id, partnerData?.displayName, triggerNotification]);

  // 2. Real-time Partner Mood Updates
  useEffect(() => {
    if (!partnerData?.id) return;
    const partnerName = partnerData.displayName?.split(' ')[0] || 'Partner';
    const currentMood = partnerData.mood;

    if (currentMood) {
      if (prevPartnerMoodRef.current && prevPartnerMoodRef.current !== currentMood) {
        triggerNotification({
          type: 'mood',
          title: `🥰 ${partnerName} updated their mood`,
          body: `Now feeling "${currentMood}". Check in and send some love!`,
          senderId: partnerData.id,
          senderName: partnerName,
          link: '/',
          actionLabel: 'Send Love',
        });
      }
      prevPartnerMoodRef.current = currentMood;
    }
  }, [partnerData?.id, partnerData?.mood, partnerData?.displayName, triggerNotification]);

  // 3. Real-time Daily Sync Questions & Games
  useEffect(() => {
    if (!space?.id || !userData?.id) return;
    const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
    const currentUserId = userData.id;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/games`),
      orderBy('createdAt', 'desc'),
      limit(2)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const game = change.doc.data();
        const isPartnerP1 = game.p1Id && game.p1Id !== currentUserId;
        const partnerAnswer = isPartnerP1 ? game.p1Answer : game.p2Answer;

        if (change.type === 'modified' || change.type === 'added') {
          // If partner just answered
          const gameKey = `${change.doc.id}_${partnerAnswer ? 'ans' : 'no'}_${game.status}`;
          if (partnerAnswer && prevGameStatusRef.current !== gameKey) {
            const isFresh = (game.updatedAt || game.createdAt || 0) >= (listenerMountTimeRef.current - 10000);
            if (isFresh && prevGameStatusRef.current) {
              triggerNotification({
                type: 'game',
                title: `🎉 ${partnerName} answered Daily Sync!`,
                body: game.status === 'completed' 
                  ? 'Both answers unlocked! See how your thoughts aligned.' 
                  : 'Your partner locked in their answer. Tap to sync up!',
                senderName: partnerName,
                link: '/game',
                actionLabel: 'View Question',
              });
            }
            prevGameStatusRef.current = gameKey;
          }
        }
      });
    }, (err) => {
      console.warn('Game notification listener paused:', err);
    });

    return () => unsubscribe();
  }, [space?.id, userData?.id, partnerData?.displayName, triggerNotification]);

  // 4. Real-time Memories, Surprise Notes & Love Vault Items
  useEffect(() => {
    if (!space?.id || !userData?.id) return;
    const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
    const currentUserId = userData.id;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/memories`),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const mem = change.doc.data();
          if (mem.creatorId && mem.creatorId !== currentUserId) {
            const memId = change.doc.id;
            if (seenIdsRef.current.has(memId)) return;
            seenIdsRef.current.add(memId);

            triggerNotification({
              type: 'surprise',
              title: `🎁 Surprise from ${partnerName}!`,
              body: mem.title ? `"${mem.title}" added to your memories & surprises.` : `A special love note was hidden for you.`,
              senderId: mem.creatorId,
              senderName: partnerName,
              link: '/memories',
              actionLabel: 'Open Memory',
            });
          }
        }
      });
    }, () => {});

    return () => unsubscribe();
  }, [space?.id, userData?.id, partnerData?.displayName, triggerNotification]);

  // 5. Real-time Shared Diary Entries
  useEffect(() => {
    if (!space?.id || !userData?.id) return;
    const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
    const currentUserId = userData.id;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/diaryEntries`),
      orderBy('date', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const entry = change.doc.data();
          if (entry.authorId && entry.authorId !== currentUserId) {
            const entryId = change.doc.id;
            if (seenIdsRef.current.has(entryId)) return;
            seenIdsRef.current.add(entryId);

            triggerNotification({
              type: 'diary',
              title: `📖 Shared Diary • ${partnerName}`,
              body: 'A new entry was written in your couple diary.',
              senderId: entry.authorId,
              senderName: partnerName,
              link: '/diary',
              actionLabel: 'Read Entry',
            });
          }
        }
      });
    }, () => {});

    return () => unsubscribe();
  }, [space?.id, userData?.id, partnerData?.displayName, triggerNotification]);

  // 6. Real-time Couple Reminders
  useEffect(() => {
    if (!space?.id || !userData?.id) return;
    const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
    const currentUserId = userData.id;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/reminders`),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const rem = change.doc.data();
          if (rem.creatorId && rem.creatorId !== currentUserId) {
            const remId = change.doc.id;
            if (seenIdsRef.current.has(remId)) return;
            seenIdsRef.current.add(remId);

            triggerNotification({
              type: 'reminder',
              title: `🔔 Couple Reminder • ${partnerName}`,
              body: rem.title ? `"${rem.title}" set for you both.` : 'A new romantic reminder was created.',
              senderId: rem.creatorId,
              senderName: partnerName,
              link: '/reminders',
              actionLabel: 'View Reminders',
            });
          }
        }
      });
    }, () => {});

    return () => unsubscribe();
  }, [space?.id, userData?.id, partnerData?.displayName, triggerNotification]);

  // 7. Real-time Truth or Dare & Who Loves More Games
  useEffect(() => {
    if (!space?.id || !userData?.id) return;
    const partnerName = partnerData?.displayName?.split(' ')[0] || 'Partner';
    const currentUserId = userData.id;

    const unsubTod = onSnapshot(doc(db, `coupleSpaces/${space.id}/todGameState/default`), (docSnap) => {
      if (docSnap.exists()) {
        const tod = docSnap.data();
        if (tod.currentTurn === currentUserId && tod.status === 'playing') {
          const fresh = (tod.updatedAt || 0) >= (listenerMountTimeRef.current - 8000);
          if (fresh) {
            const key = `tod_${tod.updatedAt}`;
            if (!seenIdsRef.current.has(key)) {
              seenIdsRef.current.add(key);
              triggerNotification({
                type: 'game',
                title: `🎲 Truth or Dare • Your Turn!`,
                body: `${partnerName} completed their move! Now it's your turn.`,
                senderName: partnerName,
                link: '/truth-or-dare',
                actionLabel: 'Play Move',
              });
            }
          }
        }
      }
    }, () => {});

    return () => unsubTod();
  }, [space?.id, userData?.id, partnerData?.displayName, triggerNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <LiveNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeBanner,
        soundEnabled,
        vibrateEnabled,
        pushPermission,
        isDrawerOpen,
        setIsDrawerOpen,
        requestPushPermission,
        dismissBanner,
        markAllAsRead,
        markAsRead,
        clearHistory,
        toggleSound,
        toggleVibrate,
        triggerNotification,
      }}
    >
      {children}
    </LiveNotificationContext.Provider>
  );
};

export const useLiveNotifications = () => {
  const context = useContext(LiveNotificationContext);
  if (!context) {
    throw new Error('useLiveNotifications must be used within a LiveNotificationProvider');
  }
  return context;
};
