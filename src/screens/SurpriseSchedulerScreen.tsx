import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BottomNav } from '../components/BottomNav';
import { DateNightPlanCard } from '../components/surprise/DateNightPlanCard';
import { ActiveDateCompanionModal } from '../components/surprise/ActiveDateCompanionModal';
import { ConversationDeckModal } from '../components/surprise/ConversationDeckModal';
import { DateNightPlan, SurpriseUserPreferences, PastSurpriseSummary } from '../types/surprise';
import { generateDatePlan } from '../lib/gemini';
import { sound } from '../lib/sound';
import { safeFormat } from '../lib/dateUtils';
import confetti from 'canvas-confetti';
import {
  Send,
  Heart,
  Clock,
  Lock,
  Unlock,
  Gift,
  Sparkles,
  Music,
  MessageCircle,
  Calendar,
  Compass,
  Star,
  Plus,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
  Dices
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function SurpriseSchedulerScreen() {
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();
  const { refreshWallet } = useLoveCoins();

  // Active Tab: 'architect' (AI Generator) or 'vault' (Scheduled & History)
  const [activeTab, setActiveTab] = useState<'architect' | 'vault'>('architect');

  // Surprises state
  const [datePlans, setDatePlans] = useState<DateNightPlan[]>([]);
  const [legacySurprises, setLegacySurprises] = useState<any[]>([]);

  // Generator form state
  const [dateStyle, setDateStyle] = useState<string>('cozy_home');
  const [mood, setMood] = useState<string>('Romantic & Intimate');
  const [dietary, setDietary] = useState<string>('Artisanal Italian & Fine Wine');
  const [musicGenre, setMusicGenre] = useState<string>('Acoustic Indie & Singer-Songwriter');
  const [budget, setBudget] = useState<string>('Moderate ($$)');
  const [duration, setDuration] = useState<string>('2-3 Hours Evening Date');
  const [specialOccasion, setSpecialOccasion] = useState<string>('Just Because / Spontaneous');
  const [customNotes, setCustomNotes] = useState<string>('');

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<DateNightPlan | null>(null);

  // Delivery Modal State for Scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('19:30');

  // Legacy Text Message Surprise Modal State
  const [showLegacyModal, setShowLegacyModal] = useState(false);
  const [legacyMessage, setLegacyMessage] = useState('');
  const [legacyDate, setLegacyDate] = useState('');
  const [legacyTime, setLegacyTime] = useState('');

  // Active Date Companion Mode
  const [companionPlan, setCompanionPlan] = useState<DateNightPlan | null>(null);
  const [previewDeckPlan, setPreviewDeckPlan] = useState<DateNightPlan | null>(null);

  // Notification Toast
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');

  // Current timestamp tick for live countdowns
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const int = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(int);
  }, []);

  const partnerName = partnerData?.displayName || 'Your Love';
  const myName = userData?.displayName || 'You';

  // 1. Subscribe to Date Night Surprise Plans in coupleSpaces/{spaceId}/surprises
  useEffect(() => {
    if (!space?.id) return;

    const q = collection(db, `coupleSpaces/${space.id}/surprises`);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const plans = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as DateNightPlan[];

        plans.sort(
          (a, b) => new Date(b.deliverAt || b.createdAt).getTime() - new Date(a.deliverAt || a.createdAt).getTime()
        );
        setDatePlans(plans);

        // Check if any partner surprise just unlocked
        const partnerSurprises = plans.filter((p) => p.creatorId !== userData?.id);
        const unlockedJustNow = partnerSurprises.find((p) => {
          const dTime = new Date(p.deliverAt).getTime();
          return dTime <= Date.now() && Date.now() - dTime < 60000;
        });
        if (unlockedJustNow) {
          setNotificationText(`A Date Night Surprise from ${partnerName} has unlocked! 🎁✨`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 6000);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `coupleSpaces/${space.id}/surprises`);
      }
    );

    return () => unsubscribe();
  }, [space?.id, userData?.id, partnerName]);

  // 2. Subscribe to Legacy Text Message Surprises in coupleSpaces/{spaceId}/memories
  useEffect(() => {
    if (!space?.id) return;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/memories`),
      where('type', '==', 'surprise')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as any[];

        data.sort((a, b) => new Date(b.deliverAt).getTime() - new Date(a.deliverAt).getTime());
        setLegacySurprises(data);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `coupleSpaces/${space.id}/memories`);
      }
    );

    return () => unsubscribe();
  }, [space?.id]);

  // Extract past successful surprises (rated >= 4 or reviewed) for AI training input
  const pastSuccessfulSurprises: PastSurpriseSummary[] = useMemo(() => {
    return datePlans
      .filter((p) => (p.rating && p.rating >= 4) || (p.review && p.review.trim()))
      .map((p) => ({
        id: p.id,
        title: p.title,
        rating: p.rating || 5,
        review: p.review,
        dateStyle: p.style,
        mood: p.mood,
      }));
  }, [datePlans]);

  // Handle AI Date Plan Generation
  const handleGeneratePlan = async () => {
    if (!space?.id) return;
    sound.tap();
    setIsGenerating(true);

    try {
      const preferences: SurpriseUserPreferences = {
        dateStyle,
        mood,
        dietary,
        musicGenre,
        budget,
        duration,
        specialOccasion,
        customNotes,
      };

      const coupleHistory = {
        partnerName,
        userName: myName,
        anniversaryDate: space.anniversaryDate,
      };

      const planData = await generateDatePlan(preferences, coupleHistory, pastSuccessfulSurprises);

      const planWithMeta: DateNightPlan = {
        ...planData,
        id: `surprise_plan_${Date.now()}`,
        coupleSpaceId: space.id,
        creatorId: userData?.id || 'unknown',
        creatorName: myName,
        type: 'date_plan',
        style: (dateStyle as any) || 'cozy_home',
        mood,
        budget,
        duration,
        deliverAt: new Date().toISOString(), // Default: ready tonight
        isLocked: false,
        createdAt: new Date().toISOString(),
        userPreferencesUsed: preferences,
      };

      setGeneratedPlan(planWithMeta);
      sound.playSuccess();
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Failed to generate date plan:', err);
      alert('Could not generate date plan right now. Please try again!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Plan: either as immediate or scheduled surprise
  const handleSavePlan = async (isScheduled: boolean) => {
    if (!space?.id || !generatedPlan) return;
    sound.playPop();

    let deliverAt = new Date().toISOString();
    let isLocked = false;

    if (isScheduled) {
      if (!scheduleDate || !scheduleTime) {
        alert('Please choose a date and time for the surprise delivery.');
        return;
      }
      const targetTime = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
      if (targetTime <= Date.now()) {
        alert('Please choose a future date and time for the surprise reveal.');
        return;
      }
      deliverAt = new Date(targetTime).toISOString();
      isLocked = true;
    }

    const finalPlan: DateNightPlan = {
      ...generatedPlan,
      deliverAt,
      isLocked,
    };

    try {
      await setDoc(doc(db, `coupleSpaces/${space.id}/surprises`, finalPlan.id), finalPlan);
      sound.playSuccess();
      setGeneratedPlan(null);
      setShowScheduleModal(false);
      setActiveTab('vault');

      setNotificationText(
        isScheduled
          ? `Surprise date scheduled for ${safeFormat(deliverAt, 'MMM d, h:mm a')}! 🎁`
          : 'Date Night Plan saved & ready for tonight! 💖'
      );
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space.id}/surprises`);
    }
  };

  // Schedule Legacy Text Message Surprise
  const handleScheduleLegacyMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space?.id || !userData?.id || !legacyMessage.trim() || !legacyDate || !legacyTime) return;

    const deliverAtTime = new Date(`${legacyDate}T${legacyTime}`).getTime();
    if (deliverAtTime <= Date.now()) {
      alert('Please select a future date and time.');
      return;
    }

    const noteId = `surprise_${userData.id}_${Date.now()}`;
    const noteData = {
      id: noteId,
      coupleSpaceId: space.id,
      creatorId: userData.id,
      type: 'surprise',
      content: legacyMessage.trim(),
      deliverAt: new Date(deliverAtTime).toISOString(),
      date: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, `coupleSpaces/${space.id}/memories`, noteId), noteData);
      setLegacyMessage('');
      setLegacyDate('');
      setLegacyTime('');
      setShowLegacyModal(false);
      sound.playSuccess();
      setActiveTab('vault');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space.id}/memories`);
    }
  };

  // Toggle Activity Checklist in Date Night Plan
  const handleToggleActivity = async (planId: string, activityId: string) => {
    if (!space?.id) return;
    const plan = datePlans.find((p) => p.id === planId) || companionPlan;
    if (!plan) return;

    const updatedActivities = plan.activities.map((a) =>
      a.id === activityId ? { ...a, completed: !a.completed } : a
    );

    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/surprises`, plan.id), {
        activities: updatedActivities,
      });

      if (companionPlan && companionPlan.id === plan.id) {
        setCompanionPlan({ ...companionPlan, activities: updatedActivities });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/surprises`);
    }
  };

  // Collaborative Track Vote (Upvote/Heart a song)
  const handleVoteTrack = async (planId: string, trackId: string) => {
    if (!space?.id || !userData?.id) return;
    const plan = datePlans.find((p) => p.id === planId) || companionPlan;
    if (!plan) return;

    sound.playHeartbeat();
    const myId = userData.id;
    const updatedTracks = plan.playlist.tracks.map((t) => {
      if (t.id === trackId) {
        const votes = Array.isArray(t.upvotes) ? t.upvotes : [];
        const newVotes = votes.includes(myId) ? votes.filter((v) => v !== myId) : [...votes, myId];
        return { ...t, upvotes: newVotes };
      }
      return t;
    });

    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/surprises`, plan.id), {
        'playlist.tracks': updatedTracks,
      });

      if (companionPlan && companionPlan.id === plan.id) {
        setCompanionPlan({
          ...companionPlan,
          playlist: { ...companionPlan.playlist, tracks: updatedTracks },
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/surprises`);
    }
  };

  // Complete Date Night (Rating + Review + Rewards)
  const handleCompleteDate = async (planId: string, rating: number, review: string) => {
    if (!space?.id) return;
    const nowIso = new Date().toISOString();

    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/surprises`, planId), {
        isCompleted: true,
        completedAt: nowIso,
        rating,
        review,
      });

      // Award XP to couple space
      await updateDoc(doc(db, 'coupleSpaces', space.id), {
        xp: (space.xp || 0) + 100,
        lastInteractionAt: Date.now(),
      });

      await refreshWallet();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/surprises`);
    }
  };

  // Delete Date Plan
  const handleDeletePlan = async (planId: string) => {
    if (!space?.id || !confirm('Are you sure you want to delete this date plan?')) return;
    try {
      await deleteDoc(doc(db, `coupleSpaces/${space.id}/surprises`, planId));
      sound.tap();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupleSpaces/${space.id}/surprises`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 relative pb-24 md:pb-12">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/20 blur-[120px] rounded-full" />
      </div>

      {/* Top Header */}
      <div className="px-5 sm:px-8 pt-8 pb-4 z-10 shrink-0 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold mb-2">
              <Gift className="w-3.5 h-3.5 text-rose-400" />
              <span>SURPRISE SYSTEM & DATE NIGHT ARCHITECT</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-white flex items-center gap-2">
              Surprises & Dates <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1">
              AI-generated comprehensive date nights, curated conversation cards, playlists & time-capsule letters for {partnerName}.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/random-date"
              onClick={() => sound.tap()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 text-pink-200 font-semibold text-xs border border-pink-500/30 flex items-center gap-2 transition active:scale-95 shadow-md shadow-pink-500/5"
            >
              <Dices className="w-3.5 h-3.5 text-pink-400 animate-spin-slow" />
              <span>Date Roulette 🎲</span>
            </Link>
            <button
              onClick={() => {
                sound.tap();
                setShowLegacyModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 flex items-center gap-2 transition active:scale-95 shadow-md"
            >
              <Send className="w-3.5 h-3.5 text-pink-400" />
              <span>Secret Letter 💌</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 max-w-md">
          <button
            onClick={() => {
              sound.tap();
              setActiveTab('architect');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'architect'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Date Architect</span>
          </button>

          <button
            onClick={() => {
              sound.tap();
              setActiveTab('vault');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Surprises Vault ({datePlans.length + legacySurprises.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content View */}
      <div className="flex-1 px-5 sm:px-8 py-4 max-w-5xl mx-auto w-full z-10">
        {activeTab === 'architect' ? (
          /* TAB 1: AI DATE NIGHT ARCHITECT GENERATOR */
          <div className="space-y-6">
            {/* Past Surprises Learning Indicator */}
            {pastSuccessfulSurprises.length > 0 && (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/60 to-zinc-900 border border-purple-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Personalized by Past Successes</span>
                    <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                      {pastSuccessfulSurprises.length} high-rated dates
                    </span>
                  </span>
                  <p className="text-[11px] text-zinc-400 truncate">
                    AI will analyze your favorite past memories (e.g., "{pastSuccessfulSurprises[0].title}") to craft tailored activities and music!
                  </p>
                </div>
              </div>
            )}

            {/* Generator Form */}
            <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/80">
                <div>
                  <h2 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-pink-400" />
                    <span>Customize Your Surprise Date Night</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select your preferences and let AIRA architect the ultimate romantic experience.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                {/* 1. Date Style */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-2 block">
                    1. Date Style
                  </label>
                  <select
                    value={dateStyle}
                    onChange={(e) => setDateStyle(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-zinc-200 outline-none focus:border-rose-500 transition"
                  >
                    <option value="cozy_home">🏡 Cozy At-Home (Blanket Fort & Candles)</option>
                    <option value="virtual">💻 Virtual / Long-Distance (Synced Activities)</option>
                    <option value="outdoor">🌌 Outdoor Adventure & Stargazing</option>
                    <option value="in_person">🥂 Chic Evening Out & Hidden Gems</option>
                  </select>
                </div>

                {/* 2. Mood & Vibe */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-2 block">
                    2. Emotional Mood
                  </label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-zinc-200 outline-none focus:border-rose-500 transition"
                  >
                    <option value="Romantic & Intimate">💖 Romantic & Deeply Intimate</option>
                    <option value="Playful & Silly">✨ Playful, Fun & Laughter-Filled</option>
                    <option value="Deep & Soulful">🌌 Deep Soulful Reconnection</option>
                    <option value="Chic & Luxurious">👑 Chic, Fancy & Sophisticated</option>
                    <option value="Chill & Relaxed">🍵 Slow, Warm & Relaxed</option>
                  </select>
                </div>

                {/* 3. Food & Drink */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-2 block">
                    3. Culinary Flavour
                  </label>
                  <select
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-zinc-200 outline-none focus:border-rose-500 transition"
                  >
                    <option value="Artisanal Italian & Fine Wine">🍝 Artisanal Italian & Fine Wine</option>
                    <option value="Japanese Sushi & Matcha/Cocktails">🍣 Japanese Sushi & Crafted Cocktails</option>
                    <option value="Sweet Chocolate Fondue & Mocktails">🍓 Chocolate Fondue & Sweet Mocktails</option>
                    <option value="Homemade Gourmet Tacos & Sangria">🌮 Homemade Gourmet Tacos & Sangria</option>
                    <option value="Cozy Bakery Pastries & Warm Chai">☕ Warm Coffee, Bakery & Midnight Tea</option>
                    <option value="No Food / Pure Activities Only">🌿 Pure Activities Only (No Food)</option>
                  </select>
                </div>

                {/* 4. Collaborative Music Genre */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-2 block">
                    4. Music Vibe & Playlist
                  </label>
                  <select
                    value={musicGenre}
                    onChange={(e) => setMusicGenre(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-zinc-200 outline-none focus:border-rose-500 transition"
                  >
                    <option value="Acoustic Indie & Singer-Songwriter">🎸 Acoustic Indie & Warm Folk</option>
                    <option value="Lo-Fi Chillhop & Ambient Reverie">🎧 Cozy Lo-Fi Chillhop & Beats</option>
                    <option value="Classic Jazz & Velvet Soul">🎷 Midnight Jazz & Velvet Soul</option>
                    <option value="R&B Slow Jams & Modern Soul">🕯️ R&B Slow Jams & Mood</option>
                    <option value="Romantic Pop Ballads & Duets">🎹 Romantic Pop Anthems & Duets</option>
                    <option value="Dream Pop & Celestial Synthwave">🌌 Dream Pop & Starlight Melodies</option>
                  </select>
                </div>

                {/* 5. Budget */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-2 block">
                    5. Budget Range
                  </label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-zinc-200 outline-none focus:border-rose-500 transition"
                  >
                    <option value="Free / Budget-Friendly ($)">🌱 Zero Cost / Thoughtful DIY ($)</option>
                    <option value="Moderate ($$)">🎁 Moderate & Sweet ($$)</option>
                    <option value="Special Splurge ($$$)">💎 Special Occasion Splurge ($$$)</option>
                  </select>
                </div>

                {/* 6. Duration */}
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-2 block">
                    6. Target Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-zinc-200 outline-none focus:border-rose-500 transition"
                  >
                    <option value="1-Hour Micro Date">⚡ 1-Hour Micro Date</option>
                    <option value="2-3 Hours Evening Date">🌙 2-3 Hours Evening Date</option>
                    <option value="All-Night Weekend Escape">✨ All-Night Weekend Escape</option>
                  </select>
                </div>
              </div>

              {/* Special Occasion & Custom Wishes */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-1.5 block">
                    Occasion (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialOccasion}
                    onChange={(e) => setSpecialOccasion(e.target.value)}
                    placeholder="e.g. 6-Month Anniversary, Reconnecting after a busy week, Birthday surprise"
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-200 outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-1.5 block">
                    Special Couple Memories or Personal Details (Optional)
                  </label>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. We love stargazing, our first trip was to Kyoto, partner loves pasta and fairy lights..."
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-200 outline-none focus:border-rose-500 transition resize-none h-20"
                    maxLength={350}
                  />
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-6 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Generates itinerary, conversation deck & collaborative playlist</span>
                </span>

                <button
                  onClick={handleGeneratePlan}
                  disabled={isGenerating}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-bold text-sm shadow-xl shadow-rose-500/20 hover:opacity-95 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                  <span>{isGenerating ? 'Architecting Your Date Night...' : 'Generate Date Night Plan ✨'}</span>
                </button>
              </div>
            </div>

            {/* Generated Plan Interactive Preview */}
            {generatedPlan && (
              <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-pink-400 bg-pink-950/80 px-3 py-1 rounded-full border border-pink-700/40">
                      GENERATED DATE NIGHT SURPRISE
                    </span>
                    <h3 className="text-2xl font-black font-serif text-white mt-2">
                      {generatedPlan.title}
                    </h3>
                    <p className="text-sm font-serif italic text-pink-300 mt-1">
                      "{generatedPlan.tagline}"
                    </p>
                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed max-w-2xl">
                      {generatedPlan.overview}
                    </p>
                  </div>

                  {/* Top Action Pills */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Schedule as Surprise 🎁</span>
                    </button>

                    <button
                      onClick={() => handleSavePlan(false)}
                      className="w-full px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Save & Start Tonight 💖</span>
                    </button>
                  </div>
                </div>

                {/* Reasoning callout */}
                {generatedPlan.reasoningFromPastSurprises && (
                  <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
                    <Star className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <span><strong>Tailored with Memory Intelligence:</strong> {generatedPlan.reasoningFromPastSurprises}</span>
                  </div>
                )}

                {/* 1. Activities List */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>Itinerary of Activities</span>
                  </h4>
                  <div className="space-y-3">
                    {generatedPlan.activities.map((act, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-sm text-white">{act.name}</h5>
                          <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                            {act.timeEstimate}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{act.description}</p>
                        {act.sparkleTip && (
                          <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span><strong>Flourish:</strong> {act.sparkleTip}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Conversation Prompts Deck Preview */}
                <div className="p-5 rounded-3xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-pink-400" />
                      <span>Curated Conversation Prompts Deck ({generatedPlan.conversationPrompts.length} Questions)</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Warm-up, deep soul connection, nostalgia, and future dreams ready for your date.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      sound.tap();
                      setPreviewDeckPlan(generatedPlan);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Flip Through Deck</span>
                  </button>
                </div>

                {/* 3. Collaborative Playlist Preview */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-2 flex items-center gap-2">
                    <Music className="w-4 h-4 text-pink-400" />
                    <span>Soundtrack: {generatedPlan.playlist.playlistName}</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mb-3">{generatedPlan.playlist.vibeDescription}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {generatedPlan.playlist.tracks.map((t, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{t.title}</p>
                          <p className="text-[11px] text-pink-300 truncate">{t.artist} • {t.genre}</p>
                          <p className="text-[10px] text-zinc-400 italic truncate mt-0.5">📍 {t.idealMoment}</p>
                        </div>
                        <span className="text-xs text-zinc-600">🎵</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Secret Surprise Twist Preview */}
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-dashed border-purple-500/30">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 block mb-1">
                    Secret Micro-Surprise (Reveal to partner during the date)
                  </span>
                  <p className="text-xs text-purple-200 font-serif italic">"{generatedPlan.surpriseTwist}"</p>
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => setGeneratedPlan(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                  >
                    Discard & Re-generate
                  </button>

                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Lock as Mystery Surprise for Partner 🎁</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: SURPRISES VAULT & SCHEDULE (Date Plans + Legacy Letters) */
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-serif text-white">Your Couple Surprise Vault</h2>
                <p className="text-xs text-zinc-400">
                  Scheduled mystery dates, active date nights, and unlocked time-capsule letters.
                </p>
              </div>

              <button
                onClick={() => {
                  sound.tap();
                  setActiveTab('architect');
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Date Night</span>
              </button>
            </div>

            {/* Empty State */}
            {datePlans.length === 0 && legacySurprises.length === 0 && (
              <div className="bg-zinc-900/50 rounded-3xl p-12 text-center border border-zinc-800/60 border-dashed">
                <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-300">No Surprises Scheduled Yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-5">
                  Plan your first AI Date Night Surprise or leave a hidden future message for {partnerName}!
                </p>
                <button
                  onClick={() => {
                    sound.tap();
                    setActiveTab('architect');
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-pink-500/20"
                >
                  Architect Date Night ✨
                </button>
              </div>
            )}

            {/* Date Night Plans Grid */}
            {datePlans.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Date Night Experiences ({datePlans.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {datePlans.map((plan) => (
                    <DateNightPlanCard
                      key={plan.id}
                      plan={plan}
                      isCreator={plan.creatorId === userData?.id}
                      partnerName={partnerName}
                      now={now}
                      onOpenCompanion={(p) => setCompanionPlan(p)}
                      onDelete={handleDeletePlan}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Text Message Surprises */}
            {legacySurprises.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-pink-400" />
                  <span>Time-Capsule Love Letters ({legacySurprises.length})</span>
                </h3>

                <div className="space-y-3">
                  {legacySurprises.map((s, i) => {
                    const isMe = s.creatorId === userData?.id;
                    const unlockTime = new Date(s.deliverAt).getTime();
                    const isLocked = unlockTime > now && !isMe;
                    const hasPassed = unlockTime <= now;

                    return (
                      <motion.div
                        key={s.id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 rounded-3xl border relative overflow-hidden ${
                          isLocked
                            ? 'bg-zinc-900/80 border-zinc-800'
                            : isMe
                            ? 'bg-zinc-900/90 border-purple-500/30'
                            : 'bg-gradient-to-br from-rose-950/60 to-purple-950/60 border-rose-500/30 shadow-lg'
                        }`}
                      >
                        {isLocked && (
                          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs z-10 flex items-center justify-center">
                            <div className="bg-zinc-900/90 py-2 px-4 rounded-full border border-zinc-700/80 flex items-center gap-2 shadow-xl">
                              <Lock className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-bold text-zinc-300">
                                Unlocks at {safeFormat(s.deliverAt, 'h:mm a, MMM d')}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              isMe ? 'bg-purple-500/20 text-purple-300' : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {isMe ? 'Sent by you' : `From ${partnerName}`}
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                            {hasPassed ? <Unlock className="w-3 h-3 text-zinc-400" /> : <Clock className="w-3 h-3" />}
                            {safeFormat(s.deliverAt, 'h:mm a, MMM d')}
                          </span>
                        </div>

                        <p
                          className={`font-serif italic leading-relaxed text-sm ${
                            isLocked ? 'text-zinc-600 blur-[4px] select-none' : 'text-zinc-200'
                          }`}
                        >
                          "{s.content}"
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="z-20 bg-zinc-950 border-t border-zinc-800/50">
        <BottomNav />
      </div>

      {/* MODAL 1: Schedule Mystery Date Surprise Delivery */}
      {showScheduleModal && generatedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-purple-500/40 rounded-3xl p-6 shadow-2xl text-white">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white mb-3 shadow-lg">
              <Gift className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold font-serif text-center text-white">
              Schedule Mystery Reveal
            </h3>
            <p className="text-xs text-zinc-400 text-center mt-1">
              {partnerName} will see a locked surprise box with a live countdown timer until this moment arrives!
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1.5 block">
                  Reveal Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1.5 block">
                  Reveal Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                <span>The activities and playlist unlock automatically when the timer reaches zero.</span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePlan(true)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 hover:opacity-95"
                >
                  Lock & Schedule 🎁
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Secret Time-Capsule Letter (Legacy Surprises) */}
      {showLegacyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-pink-500/30 rounded-3xl p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-base font-serif text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-pink-400" />
                <span>Send a Secret Message to the Future</span>
              </h3>
              <button
                onClick={() => setShowLegacyModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleLegacyMessage} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1.5 block">
                  Hidden Letter Content
                </label>
                <textarea
                  value={legacyMessage}
                  onChange={(e) => setLegacyMessage(e.target.value)}
                  placeholder="I'll love you even more when you read this..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-200 outline-none focus:border-rose-500 resize-none h-24 placeholder:italic placeholder:text-zinc-600"
                  maxLength={500}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 block">
                    Unlock Date
                  </label>
                  <input
                    type="date"
                    value={legacyDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLegacyDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 block">
                    Unlock Time
                  </label>
                  <input
                    type="time"
                    value={legacyTime}
                    onChange={(e) => setLegacyTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-200 outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLegacyModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg"
                >
                  Seal Letter 💖
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Active Date Companion Full-Screen Mode */}
      {companionPlan && (
        <ActiveDateCompanionModal
          plan={companionPlan}
          partnerName={partnerName}
          currentUserId={userData?.id || 'unknown'}
          onClose={() => setCompanionPlan(null)}
          onToggleActivity={(actId) => handleToggleActivity(companionPlan.id, actId)}
          onVoteTrack={(trackId) => handleVoteTrack(companionPlan.id, trackId)}
          onCompleteDate={(rating, review) => handleCompleteDate(companionPlan.id, rating, review)}
        />
      )}

      {/* MODAL 4: Conversation Cards Deck Preview */}
      {previewDeckPlan && (
        <ConversationDeckModal
          prompts={previewDeckPlan.conversationPrompts}
          partnerName={partnerName}
          onClose={() => setPreviewDeckPlan(null)}
        />
      )}

      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 30, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
          >
            <div className="bg-zinc-900/95 backdrop-blur-xl border border-rose-500/40 px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border-b-4 border-b-rose-500 pointer-events-auto text-xs text-white">
              <Gift className="w-5 h-5 text-rose-400 animate-pulse shrink-0" />
              <span className="font-semibold">{notificationText}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
