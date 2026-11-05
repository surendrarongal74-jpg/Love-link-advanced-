import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useLiveNotifications } from '../contexts/LiveNotificationContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { generateRandomDateNight } from '../lib/gemini';
import { RandomDateNightCard } from '../components/dateGenerator/RandomDateNightCard';
import { DateRouletteWheel } from '../components/dateGenerator/DateRouletteWheel';
import { RandomDateNightData, SavedDateNightDoc } from '../types/randomDate';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Dices,
  Sparkles,
  MapPin,
  Sliders,
  Heart,
  Calendar,
  Compass,
  CheckCircle2,
  Trash2,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
  RotateCcw,
  Plus
} from 'lucide-react';

const POPULAR_CITIES = [
  'New York, NY',
  'San Francisco, CA',
  'Chicago, IL',
  'Austin, TX',
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Los Angeles, CA',
  'Seattle, WA',
  'Miami, FL',
];

const SETTING_OPTIONS = [
  { id: 'in_the_city', label: 'In The City', icon: '🏙️' },
  { id: 'hidden_gems', label: 'Hidden Gems & Speakeasies', icon: '🗝️' },
  { id: 'rooftop_nightlife', label: 'Rooftops & Nightlife', icon: '🍸' },
  { id: 'nature_scenic', label: 'Nature & Waterfront Views', icon: '🌊' },
  { id: 'arts_culture', label: 'Arts, Vinyl & Culture', icon: '🎷' },
  { id: 'sweet_tooth', label: 'Dessert & Late-Night Bites', icon: '🍨' },
  { id: 'cozy_home', label: 'Cozy At-Home Transformation', icon: '🛋️' },
];

const VIBE_OPTIONS = [
  { id: 'Romantic & Dimly Lit', label: 'Romantic & Dimly Lit 🕯️' },
  { id: 'Playful & Game Night', label: 'Playful & Competitive 🎯' },
  { id: 'Foodie & Craft Drinks', label: 'Foodie & Craft Drinks 🍜' },
  { id: 'Adventurous & Spontaneous', label: 'Adventurous & Wild 🎢' },
  { id: 'Late-Night Whispers', label: 'Late-Night Whispers 🌙' },
  { id: 'Relaxing & Zen', label: 'Relaxing & Cozy 🌿' },
];

const BUDGET_OPTIONS = [
  { id: 'Free / Budget-Friendly ($)', label: 'Free / Budget ($)', symbol: '$' },
  { id: 'Casual Fun ($$)', label: 'Date Night ($$)', symbol: '$$' },
  { id: 'Splurge & Treat Ourselves ($$$)', label: 'Fancy Splurge ($$$)', symbol: '$$$' },
];

export function RandomDateGeneratorScreen() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { refreshWallet } = useLoveCoins();
  const { triggerNotification } = useLiveNotifications();

  // Tab State: 'generator' | 'vault'
  const [activeTab, setActiveTab] = useState<'generator' | 'vault'>('generator');

  // Location State
  const [city, setCity] = useState<string>(() => {
    try {
      return localStorage.getItem('lovelink_user_city') || 'New York, NY';
    } catch {
      return 'New York, NY';
    }
  });
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Preference Filters State
  const [settingType, setSettingType] = useState('hidden_gems');
  const [vibe, setVibe] = useState('Romantic & Dimly Lit');
  const [budget, setBudget] = useState('Casual Fun ($$)');
  const [energyLevel, setEnergyLevel] = useState('Balanced & Fun');
  const [timeOfDay, setTimeOfDay] = useState('Tonight / Evening');
  const [dietary, setDietary] = useState('Craft Cocktails & Savory Bites');
  const [isWildcard, setIsWildcard] = useState(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Generation & Active Result State
  const [isRolling, setIsRolling] = useState(false);
  const [currentDateNight, setCurrentDateNight] = useState<RandomDateNightData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLockedIn, setIsLockedIn] = useState(false);

  // Saved Date Nights Vault State
  const [savedDates, setSavedDates] = useState<SavedDateNightDoc[]>([]);

  // Geolocation auto-detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    sound.pop();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          if (res.ok) {
            const data = await res.json();
            const detected =
              data.address?.city ||
              data.address?.town ||
              data.address?.county ||
              data.address?.state ||
              'My Location';
            const stateOrCountry = data.address?.state || data.address?.country || '';
            const fullLocation = stateOrCountry ? `${detected}, ${stateOrCountry}` : detected;
            setCity(fullLocation);
            localStorage.setItem('lovelink_user_city', fullLocation);
          }
        } catch (err) {
          console.warn('Reverse geocode error, using fallback:', err);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  // Listen to Saved Dates from Firestore
  useEffect(() => {
    if (!space?.id) return;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/dateNights`),
      orderBy('lockedInAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => docSnap.data() as SavedDateNightDoc);
        setSavedDates(docs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `coupleSpaces/${space.id}/dateNights`);
      }
    );

    return () => unsubscribe();
  }, [space?.id]);

  // Handle Roll Date Night
  const handleRoll = async () => {
    setIsRolling(true);
    setIsLockedIn(false);
    sound.playHeartbeat();

    try {
      localStorage.setItem('lovelink_user_city', city);
      const generated = await generateRandomDateNight(
        {
          city,
          neighborhood: neighborhood.trim() || undefined,
          settingType,
        },
        {
          vibe,
          budget,
          energyLevel,
          timeOfDay,
          dietary,
          wildcard: isWildcard,
        },
        {
          userName: userData?.displayName || 'Alex',
          partnerName: partnerData?.displayName || 'Taylor',
          pastDatesLiked: savedDates.filter((d) => (d.rating || 0) >= 4).map((d) => d.dateNight.title),
        }
      );

      setCurrentDateNight(generated);
      sound.playSuccess();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ec4899', '#f43f5e', '#a855f7', '#38bdf8', '#fbbf24'],
      });
    } catch (err) {
      console.error('Failed to roll random date:', err);
    } finally {
      setIsRolling(false);
    }
  };

  // Lock In Date Night into Firestore & Partner Notification
  const handleLockInDate = async (dateNight: RandomDateNightData) => {
    if (!space?.id || !userData?.id) return;
    setIsSaving(true);
    sound.chime();

    try {
      const docId = dateNight.id || `rdn_${Date.now()}`;
      const newDoc: SavedDateNightDoc = {
        id: docId,
        coupleSpaceId: space.id,
        creatorId: userData.id,
        creatorName: userData.displayName || 'You',
        status: 'planned',
        dateNight,
        lockedInAt: Date.now(),
      };

      await setDoc(doc(db, `coupleSpaces/${space.id}/dateNights`, docId), newDoc);

      // Refresh couple coin wallet
      try {
        await refreshWallet();
      } catch (_) {}

      // Trigger real-time partner notification
      triggerNotification({
        type: 'surprise',
        title: '🎲 Date Night Locked In!',
        body: `${userData.displayName || 'Your partner'} spun a date: "${dateNight.title}" in ${dateNight.locationAnchor}!`,
        senderId: userData.id,
        senderName: userData.displayName || 'Your partner',
        link: '/random-date',
      });

      setIsLockedIn(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `coupleSpaces/${space.id}/dateNights`);
    } finally {
      setIsSaving(false);
    }
  };

  // Mark Completed with Rating
  const handleToggleCompleted = async (dateDoc: SavedDateNightDoc, rating: number) => {
    if (!space?.id) return;
    sound.playPop();

    try {
      const newStatus = dateDoc.status === 'completed' ? 'planned' : 'completed';
      await updateDoc(doc(db, `coupleSpaces/${space.id}/dateNights`, dateDoc.id), {
        status: newStatus,
        rating: newStatus === 'completed' ? rating : 0,
        completedAt: newStatus === 'completed' ? Date.now() : null,
      });

      if (newStatus === 'completed') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/dateNights/${dateDoc.id}`);
    }
  };

  // Delete Date
  const handleDeleteDate = async (id: string) => {
    if (!space?.id) return;
    sound.pop();
    try {
      await deleteDoc(doc(db, `coupleSpaces/${space.id}/dateNights`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `coupleSpaces/${space.id}/dateNights/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative pb-28">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95 shadow"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Date Night Generator</span>
                <span className="text-2xl">🎲</span>
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/40">
                Gemini AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Unique, location-based spontaneous date adventures for couples
            </p>
          </div>
        </div>

        {/* Top Tabs: Generator vs Vault */}
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('generator');
              sound.pop();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span className="hidden sm:inline">Roulette</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('vault');
              sound.pop();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 relative ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Date Vault</span>
            {savedDates.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                {savedDates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1 flex flex-col">
        {activeTab === 'generator' ? (
          <div className="space-y-6">
            {/* Location & Quick Setting Control Bar */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Your Location:
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city or neighborhood (e.g. Austin, TX)"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                  <button
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 border border-slate-700/60 transition active:scale-95"
                    title="Detect Current City" aria-label="Detect Current City"
                  >
                    {isDetectingLocation ? '📍 Locating...' : '📍 Auto Detect'}
                  </button>
                </div>
              </div>

              {/* Popular City Quick-Select Chips */}
              <div className="pt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                  Quick Cities:
                </span>
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      localStorage.setItem('lovelink_user_city', c);
                      sound.pop();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition active:scale-95 ${
                      city === c
                        ? 'bg-pink-500/30 border border-pink-400 text-pink-200'
                        : 'bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Roulette Wheel Card */}
            <div className="bg-gradient-to-b from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-purple-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="max-w-md mx-auto">
                <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-block mb-2">
                  Cure Decision Fatigue
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Spontaneous Date Night Roulette
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Gemini analyzes real hidden gems, romantic spots, and atmosphere in <strong className="text-pink-300">{city}</strong>
                </p>

                <DateRouletteWheel
                  isRolling={isRolling}
                  onRoll={handleRoll}
                />
              </div>

              {/* Toggle Preference Filters Button */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-center">
                <button
                  onClick={() => {
                    setShowFiltersDrawer(!showFiltersDrawer);
                    sound.pop();
                  }}
                  className="px-4 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 border border-slate-700/60 transition active:scale-95 shadow"
                >
                  <Sliders className="w-3.5 h-3.5 text-pink-400" />
                  <span>Customize Vibe, Budget & Setting</span>
                  {showFiltersDrawer ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Expanded Preference Controls Drawer */}
              <AnimatePresence>
                {showFiltersDrawer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden text-left mt-4 pt-4 border-t border-slate-800 space-y-4"
                  >
                    {/* Setting Style */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Setting & Environment
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SETTING_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSettingType(opt.id);
                              sound.pop();
                            }}
                            className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition active:scale-95 text-left ${
                              settingType === opt.id
                                ? 'bg-pink-500/25 border-pink-400 text-white shadow-md'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className="text-base">{opt.icon}</span>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vibe Selection */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Mood & Vibe
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {VIBE_OPTIONS.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              setVibe(v.id);
                              sound.pop();
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                              vibe === v.id
                                ? 'bg-purple-600/30 border-purple-400 text-white font-bold'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget & Time of Day */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Budget */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Budget Category
                        </label>
                        <div className="flex gap-2">
                          {BUDGET_OPTIONS.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => {
                                setBudget(b.id);
                                sound.pop();
                              }}
                              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
                                budget === b.id
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                          Time of Day
                        </label>
                        <select
                          value={timeOfDay}
                          onChange={(e) => setTimeOfDay(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                        >
                          <option value="Tonight / Evening">Tonight / Evening (7PM - 10PM)</option>
                          <option value="Golden Hour / Sunset">Golden Hour / Sunset (5PM - 7PM)</option>
                          <option value="Late Night (9PM+)">Late Night (After 9PM)</option>
                          <option value="Weekend Afternoon Stroll">Weekend Afternoon</option>
                        </select>
                      </div>
                    </div>

                    {/* Wildcard Switch */}
                    <div className="pt-2 flex items-center justify-between p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30">
                      <div>
                        <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Wildcard Romance Twist</span>
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Allow Gemini to inject an unexpected, delightful surprise element
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setIsWildcard(!isWildcard);
                          sound.pop();
                        }}
                        className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                          isWildcard ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Generated Date Night Presentation Card */}
            {currentDateNight && (
              <div className="pt-2">
                <RandomDateNightCard
                  dateNight={currentDateNight}
                  onLockInDate={handleLockInDate}
                  onReroll={handleRoll}
                  isSaving={isSaving}
                  isLockedIn={isLockedIn}
                />
              </div>
            )}
          </div>
        ) : (
          /* Our Date Vault (Saved & Completed Dates) */
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Our Date Vault</span>
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  All dates generated and locked in for you and {partnerData?.displayName || 'your partner'}
                </p>
              </div>

              <button
                onClick={() => setActiveTab('generator')}
                className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Spin New Date</span>
              </button>
            </div>

            {savedDates.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-500/10 text-pink-400 flex items-center justify-center text-3xl mb-3">
                  🎲
                </div>
                <h4 className="text-base font-bold text-slate-200">No Dates Locked In Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Spin the Date Night Roulette to generate an unforgettable local evening and lock it into your couple vault!
                </p>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="mt-4 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs shadow-lg transition active:scale-95"
                >
                  Spin Your First Date Night! 🎲
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {savedDates.map((docItem) => {
                  const date = docItem.dateNight;
                  const isDone = docItem.status === 'completed';

                  return (
                    <motion.div
                      key={docItem.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-5 rounded-3xl border transition shadow-xl relative ${
                        isDone
                          ? 'bg-slate-900/60 border-emerald-500/30'
                          : 'bg-slate-900/90 border-purple-500/30'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{date.diceRollEmoji || '🎲'}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                            {date.vibe}
                          </span>
                          {isDone ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Upcoming
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const q = encodeURIComponent(date.mapQuery || `${date.mainActivity.name} ${date.locationAnchor}`);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
                            }}
                            className="p-1.5 rounded-xl bg-slate-800 text-indigo-300 hover:text-white transition"
                            title="Open in Maps"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteDate(docItem.id)}
                            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                            title="Remove from Vault"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-lg font-bold text-white">{date.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{date.tagline}</p>

                      <div className="mt-2.5 text-xs text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-300">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{date.locationAnchor}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          <strong>Activity:</strong> {date.mainActivity.name} • <strong>After:</strong> {date.secondaryActivity.name}
                        </div>
                      </div>

                      {/* Dare & Conversation highlights */}
                      <div className="mt-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5" />
                          <span>Spontaneity Dare: {date.spontaneityChallenge?.title}</span>
                        </span>
                        <span className="text-[11px] text-cyan-300 italic">
                          "{date.conversationCard?.question}"
                        </span>
                      </div>

                      {/* Completed / Star Rating Action Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400 font-medium">Rating:</span>
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              onClick={() => handleToggleCompleted(docItem, starVal)}
                              className={`p-0.5 transition ${
                                (docItem.rating || 0) >= starVal ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'
                              }`}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handleToggleCompleted(docItem, docItem.rating || 5)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isDone
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isDone ? 'Mark as Planned' : 'Mark Completed 💖'}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
