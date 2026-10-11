import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Clock, 
  Sparkles, 
  Heart, 
  Plus, 
  Settings2, 
  Check, 
  X, 
  Eye, 
  Flame,
  LayoutGrid,
  Zap,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { QuickSnapData, QuickSnapModal } from './QuickSnapModal';
import { sound } from '../../lib/sound';

const WIDGET_ENABLED_KEY = 'lovelink_home_snap_widget_enabled';

export const QuickSnapWidget: React.FC = () => {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();

  // Widget activation state (stored in localStorage per device)
  const [isWidgetAdded, setIsWidgetAdded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(WIDGET_ENABLED_KEY);
      // Default enabled so users immediately see their interactive widget
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [activeSnap, setActiveSnap] = useState<QuickSnapData | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Toggle widget visibility
  const handleToggleWidget = (enabled: boolean) => {
    sound.tap();
    setIsWidgetAdded(enabled);
    try {
      localStorage.setItem(WIDGET_ENABLED_KEY, enabled.toString());
    } catch {}
  };

  // Real-time listener for the active quick snap in the couple space
  useEffect(() => {
    if (!space?.id) return;

    const snapDocRef = doc(db, `coupleSpaces/${space.id}/quickSnaps`, 'active');
    const unsubscribe = onSnapshot(snapDocRef, async (snapDoc) => {
      if (snapDoc.exists()) {
        const data = snapDoc.data() as QuickSnapData;
        const now = Date.now();

        // Check if expired
        if (data.expiresAt && data.expiresAt <= now) {
          // Snap expired, clean it up
          setActiveSnap(null);
          try {
            await deleteDoc(snapDocRef);
          } catch {}
        } else {
          setActiveSnap(data);
        }
      } else {
        setActiveSnap(null);
      }
    });

    return () => unsubscribe();
  }, [space?.id]);

  // Interval timer to update countdown and auto-disappear when time expires
  useEffect(() => {
    if (!activeSnap?.expiresAt) {
      setTimeLeftStr('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = activeSnap.expiresAt - now;

      if (diffMs <= 0) {
        // Disappeared!
        setActiveSnap(null);
        if (space?.id) {
          deleteDoc(doc(db, `coupleSpaces/${space.id}/quickSnaps`, 'active')).catch(() => {});
        }
        setTimeLeftStr('Expired');
        return;
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      if (hours > 0) {
        setTimeLeftStr(`${hours}h ${mins}m left`);
      } else if (mins > 0) {
        setTimeLeftStr(`${mins}m ${secs}s left`);
      } else {
        setTimeLeftStr(`${secs}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeSnap, space?.id]);

  const partnerFirstName = partnerData?.displayName?.split(' ')[0] || 'Partner';
  const isSenderMe = activeSnap?.senderId === userData?.id;

  // --- 1. WIDGET NOT YET ADDED CARD (Shows setup prompt) ---
  if (!isWidgetAdded) {
    return (
      <>
        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-100/60 rounded-3xl p-4.5 border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-rose-500 border border-rose-200/50">
                <LayoutGrid className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950">Quick Snap Widget</h4>
                <p className="text-[11px] text-rose-800/70">Add live disappearing photo widget to your screen</p>
              </div>
            </div>

            <button
              onClick={() => handleToggleWidget(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-300/40 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Widget</span>
            </button>
          </div>
        </div>

        <QuickSnapModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // --- 2. ACTIVE WIDGET DISPLAY ---
  return (
    <>
      <div className="bg-white rounded-[2rem] p-4.5 shadow-sm border border-rose-200/90 relative overflow-hidden group">
        {/* Top Header Row of Widget */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-2xs">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-gray-900 leading-tight">Couple Live Widget</h4>
                <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-md">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-gray-400">Instant snaps between you & {partnerFirstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Snap button */}
            <button
              onClick={() => {
                sound.tap();
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-bold shadow-sm shadow-rose-300/40 hover:opacity-95 active:scale-95 transition"
            >
              <Camera className="w-3 h-3" />
              <span>Send Snap</span>
            </button>

            {/* Widget settings dropdown toggle */}
            <button
              onClick={() => setShowConfig(prev => !prev)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition active:scale-95"
              title="Widget settings"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Optional Widget Config Row */}
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-2.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
          >
            <span className="text-gray-600 text-[11px]">Remove widget from Home screen?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleWidget(false)}
                className="text-[11px] font-bold text-red-500 hover:underline"
              >
                Hide Widget
              </button>
              <button
                onClick={() => setShowConfig(false)}
                className="text-[11px] font-semibold text-gray-500 hover:underline"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}

        {/* Content Display: Live Snap vs Empty State */}
        {activeSnap ? (
          /* ACTIVE SNAP CARD */
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] border border-rose-100 shadow-md">
            {/* The Snap Image */}
            <img
              src={activeSnap.imageUrl}
              alt="Partner Snap"
              onClick={() => setIsViewerOpen(true)}
              className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform duration-300"
            />

            {/* Top Badge: Sender & Disappearing Timer Countdown */}
            <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 text-white text-[10px] font-semibold border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isSenderMe ? 'Your Snap' : `${activeSnap.senderName}'s Snap`}</span>
              </div>

              {timeLeftStr && (
                <div className="bg-rose-950/80 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-white text-[10px] font-mono font-bold border border-rose-300/30 shadow-sm">
                  <Timer className="w-3 h-3 text-amber-300" />
                  <span>{timeLeftStr}</span>
                </div>
              )}
            </div>

            {/* Bottom Caption Overlay */}
            {activeSnap.caption && (
              <div className="absolute bottom-2 inset-x-2 bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-center">
                <p className="text-xs font-bold text-white drop-shadow truncate">
                  {activeSnap.caption}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* EMPTY WIDGET STATE */
          <div 
            onClick={() => {
              sound.tap();
              setIsModalOpen(true);
            }}
            className="rounded-2xl border-2 border-dashed border-rose-200 bg-gradient-to-b from-rose-50/50 to-white p-6 text-center cursor-pointer hover:bg-rose-50/80 transition-colors group/empty flex flex-col items-center justify-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 group-hover/empty:scale-110 transition-transform shadow-inner">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-950">No Active Snap Right Now</p>
              <p className="text-[11px] text-rose-800/60 mt-0.5">
                Tap here to take a picture, add stickers & beam it to {partnerFirstName}'s screen!
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-2xs border border-rose-100">
              <Plus className="w-3 h-3" />
              <span>Tap to Snap</span>
            </span>
          </div>
        )}
      </div>

      {/* Full Screen Lightbox Viewer for the Snap */}
      <AnimatePresence>
        {isViewerOpen && activeSnap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsViewerOpen(false)}
            className="fixed inset-0 z-[180] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-6"
          >
            <div className="w-full flex items-center justify-between text-white z-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center font-bold">
                  {activeSnap.senderName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{activeSnap.senderName}'s Snap</h4>
                  <p className="text-[10px] text-rose-300 font-mono">{timeLeftStr}</p>
                </div>
              </div>

              <button
                onClick={() => setIsViewerOpen(false)}
                className="p-2 text-white bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-auto max-w-sm w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative">
              <img
                src={activeSnap.imageUrl}
                alt="Quick Snap Full View"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
              {activeSnap.caption && (
                <div className="p-3 bg-black/70 backdrop-blur-md text-white text-center text-sm font-bold">
                  {activeSnap.caption}
                </div>
              )}
            </div>

            <p className="text-xs text-white/50 text-center">
              Disappears automatically when countdown expires
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Snap Camera Modal */}
      <QuickSnapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
