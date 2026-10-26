import React, { useState, useEffect, useRef } from 'react';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { 
  Settings, MessageCircle, Gamepad2, CalendarHeart, Heart, Sparkles, MapPin, 
  BookOpen, Clock, Music, Gift, Bell, CheckCircle2, ChevronRight, Image as ImageIcon, 
  Video as VideoIcon, Camera, Flame, Smile, Lock, Unlock, Send, Volume2, Award,
  Phone, Video, Copy, Check, Compass, ShoppingBag, Coins, Palette
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useTheme } from '../contexts/ThemeContext';
import { SHOP_CATALOG } from '../types/coins';
import { WALLPAPER_PRESETS, getStoredWallpaper, applyWallpaper } from '../lib/themeEngine';
import { doc, updateDoc, addDoc, collection, query, orderBy, limit, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { LinkedCelebration } from '../components/LinkedCelebration';
import { analyzeMoodAndSuggestAction, generateDailyQuestion } from '../lib/ai';
import { DailyQuestionAttachmentPreview, QuestionAttachmentItem, processFileToAttachment } from '../components/DailyQuestionAttachmentPreview';
import { TermsAndConditionsModal } from '../components/legal/TermsAndConditionsModal';
import { DataRightsRequestModal } from '../components/legal/DataRightsRequestModal';
import { GoogleSearchConsoleModal } from '../components/seo/GoogleSearchConsoleModal';
import { PartnerPermissionsChecklist } from '../components/permissions/PartnerPermissionsChecklist';
import { CallPromptModal } from '../components/calling/CallPromptModal';
import { QuickSnapWidget } from '../components/widgets/QuickSnapWidget';
import { useCall } from '../contexts/CallContext';
import { useLiveNotifications } from '../contexts/LiveNotificationContext';
import { NotificationPermissionBanner } from '../components/notifications/NotificationPermissionBanner';
import { sound } from '../lib/sound';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_QUESTIONS = [
  "What's our favorite thing to do on a lazy Sunday?",
  "Where was our first kiss?",
  "What's my weirdest habit?",
  "What is the one thing I can't live without?",
  "Where do you see us in 5 years?",
  "What's your most cherished memory of us?",
  "What was the exact moment you realized you loved me?"
];

export function HomeScreen() {
  const { space, partnerData } = useCoupleSpace();
  const { userData, signOut } = useAuth();
  const { unreadCount, setIsDrawerOpen, triggerNotification } = useLiveNotifications();
  const { wallet, inventory } = useLoveCoins();
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();

  const equippedBadgeItem = SHOP_CATALOG.find(i => i.id === inventory?.equippedBadge);
  const isEquippedFrame = equippedBadgeItem?.subCategory?.includes('Frame') || equippedBadgeItem?.subCategory?.includes('Decorations') || equippedBadgeItem?.id.startsWith('frame_');
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [wasWaiting, setWasWaiting] = useState(!partnerData);
  const [showSettings, setShowSettings] = useState(false);
  const [showCallPrompt, setShowCallPrompt] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDataRightsModal, setShowDataRightsModal] = useState(false);
  const [showGscModal, setShowGscModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState(getStoredWallpaper());
  const [myMood, setMyMood] = useState<string>(userData?.mood || 'Happy');
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isAnalyzingMood, setIsAnalyzingMood] = useState(false);
  const lastAnalyzedMoodKeyRef = useRef<string>('');

  // Daily Question / Game State on Home
  const [activeGame, setActiveGame] = useState<any>(null);
  const [showQuickAnswer, setShowQuickAnswer] = useState(false);
  const [homeAnswerText, setHomeAnswerText] = useState('');
  const [homeAttachments, setHomeAttachments] = useState<QuestionAttachmentItem[]>([]);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  // Living Interaction Feedback
  const [heartbeatToast, setHeartbeatToast] = useState<string | null>(null);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

  const homePhotoRef = useRef<HTMLInputElement>(null);
  const homeVideoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData?.mood) setMyMood(userData.mood);
  }, [userData?.mood]);

  useEffect(() => {
    if (wasWaiting && partnerData) {
      setShowCelebration(true);
      setWasWaiting(false);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  }, [partnerData, wasWaiting]);

  // Listen to active Daily Sync question
  useEffect(() => {
    if (!space?.id) return;

    const q = query(
      collection(db, `coupleSpaces/${space.id}/games`),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setActiveGame({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActiveGame(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `coupleSpaces/${space.id}/games`));

    return unsubscribe;
  }, [space?.id]);

  const userMood = userData?.mood || 'Happy';
  const partnerMood = partnerData?.mood || 'Happy';

  useEffect(() => {
    if (userData && partnerData) {
      const moodKey = `${userMood}_${partnerMood}`;
      if (lastAnalyzedMoodKeyRef.current !== moodKey && !isAnalyzingMood) {
        lastAnalyzedMoodKeyRef.current = moodKey;
        generateMoodAction(userMood, partnerMood);
      }
    }
  }, [userMood, partnerMood, !!userData, !!partnerData]);
  
  if (showCelebration && partnerData) {
     return <LinkedCelebration partnerName={partnerData.displayName} />;
  }

  const handleDisconnect = async () => {
    if (!userData) return;
    try {
      await updateDoc(doc(db, 'users', userData.id), { coupleSpaceId: "" });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userData.id}`);
    }
  };

  const handleMoodSelect = async (mood: string) => {
    if (!userData) return;
    sound.playPop();
    setMyMood(mood);
    try {
       await updateDoc(doc(db, 'users', userData.id), { mood });
       generateMoodAction(mood, partnerData?.mood || 'Happy');
    } catch (e) {
       handleFirestoreError(e, OperationType.UPDATE, `users/${userData.id}`);
    }
  };

  const generateMoodAction = async (myM: string, partnerM: string) => {
    if (isAnalyzingMood) return;
    setIsAnalyzingMood(true);
    try {
       const suggestion = await analyzeMoodAndSuggestAction(myM, partnerM);
       setAiSuggestion(suggestion);
    } catch(err) {
       console.error("Failed to generate mood action", err);
    } finally {
       setIsAnalyzingMood(false);
    }
  };

  const handleSendMessageSuggestion = async () => {
     if (!aiSuggestion?.messageSuggestion || !space?.id || !userData?.id) return;
     sound.playChime();
     const messageData = {
        id: `msg_${Date.now()}_${userData.id}`,
        coupleSpaceId: space.id,
        senderId: userData.id,
        content: aiSuggestion.messageSuggestion,
        type: 'text',
        createdAt: Date.now()
      };
      try {
        await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), messageData);
        navigate('/chat');
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space.id}/messages`);
      }
  };

  // Real-time living heartbeat action
  const handleSendHeartbeat = async () => {
    sound.playHeartbeat();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 50, 80]);
    }

    // Spawn floating hearts
    const newHearts = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: 35 + Math.random() * 30
    }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => !newHearts.some(nh => nh.id === h.id)));
    }, 2000);

    setHeartbeatToast(`Sent a heartbeat pulse to ${partnerData?.displayName?.split(' ')[0]} 💓`);
    setTimeout(() => setHeartbeatToast(null), 3500);

    if (space?.id && userData?.id) {
      try {
        await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), {
          id: `msg_pulse_${Date.now()}_${userData.id}`,
          coupleSpaceId: space.id,
          senderId: userData.id,
          content: '💓 Sent a heartbeat pulse to you!',
          type: 'text',
          createdAt: Date.now()
        });
      } catch (e) {
        // silent pulse
      }
    }
  };

  // Quick love reaction
  const handleSendQuickReaction = async (reactionText: string) => {
    if (!space?.id || !userData?.id) return;
    sound.playChime();
    setHeartbeatToast(`Sent: "${reactionText}" 💌`);
    setTimeout(() => setHeartbeatToast(null), 3000);

    try {
      await addDoc(collection(db, `coupleSpaces/${space.id}/messages`), {
        id: `msg_${Date.now()}_${userData.id}`,
        coupleSpaceId: space.id,
        senderId: userData.id,
        content: reactionText,
        type: 'text',
        createdAt: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Home daily question files selected
  const handleHomeFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    sound.playPop();
    const newItems: QuestionAttachmentItem[] = [];
    for (let i = 0; i < files.length; i++) {
      if (homeAttachments.length + newItems.length >= 5) break;
      const item = await processFileToAttachment(files[i]);
      newItems.push(item);
    }
    setHomeAttachments(prev => [...prev, ...newItems].slice(0, 5));
    e.target.value = '';
  };

  const handleHomeRemoveAttachment = (id: string) => {
    setHomeAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Quick start question if none active
  const handleStartHomeQuestion = async () => {
    if (!space?.id || !userData?.id || !partnerData?.id || isGeneratingQuestion) return;
    setIsGeneratingQuestion(true);
    sound.playPop();
    let qText = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
    try {
      const msgsQuery = query(collection(db, `coupleSpaces/${space.id}/messages`), orderBy('createdAt', 'desc'), limit(15));
      const smap = await getDocs(msgsQuery);
      const chatHistory = smap.docs.reverse().map(d => `${d.data().senderId === userData.id ? 'Me' : 'Partner'}: ${d.data().content}`);
      qText = await generateDailyQuestion(chatHistory);
    } catch (e) {
      console.error(e);
    }

    const gameId = `game_${Date.now()}`;
    const gameData = {
      id: gameId,
      coupleSpaceId: space.id,
      type: 'guess_answer',
      status: 'playing',
      p1Id: userData.id,
      p2Id: partnerData.id,
      p1Answer: '',
      p2Answer: '',
      p1Attachments: [],
      p2Attachments: [],
      question: qText,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await setDoc(doc(db, `coupleSpaces/${space.id}/games`, gameId), gameData);
      setShowQuickAnswer(true);
      sound.playChime();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `coupleSpaces/${space.id}/games`);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  // Submit Answer from Home screen
  const handleSubmitHomeAnswer = async () => {
    if (!activeGame || (!homeAnswerText.trim() && homeAttachments.length === 0) || !space?.id || !userData) return;
    
    setIsSubmittingAnswer(true);
    sound.playChime();

    const isP1 = userData.id === activeGame.p1Id;
    const serializedAttachments = homeAttachments.map(a => ({
      id: a.id,
      type: a.type,
      url: a.url,
      name: a.name,
      size: a.size,
      duration: a.duration || 0
    }));

    const updateData: any = { updatedAt: Date.now() };
    if (isP1) {
      updateData.p1Answer = homeAnswerText.trim();
      updateData.p1Attachments = serializedAttachments;
    } else {
      updateData.p2Answer = homeAnswerText.trim();
      updateData.p2Attachments = serializedAttachments;
    }

    const otherPartnerAnswer = isP1 ? activeGame.p2Answer : activeGame.p1Answer;
    if (otherPartnerAnswer) {
      updateData.status = 'completed';
    }

    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/games`, activeGame.id), updateData);
      if (updateData.status === 'completed') {
        const newXp = (space.xp || 0) + 50;
        let newLevel = space.level || 1;
        if (newXp >= newLevel * 100) newLevel += 1;
        await updateDoc(doc(db, 'coupleSpaces', space.id), { xp: newXp, level: newLevel });
        sound.playSuccess();
      }
      setHomeAnswerText('');
      setHomeAttachments([]);
      setShowQuickAnswer(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `coupleSpaces/${space.id}/games`);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const [copiedWaitingCode, setCopiedWaitingCode] = useState(false);

  const handleCopyWaitingCode = async () => {
    if (!space?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(space.inviteCode);
      setCopiedWaitingCode(true);
      sound.playSuccess();
      setTimeout(() => setCopiedWaitingCode(false), 2500);
    } catch {
      // fallback
    }
  };

  if (!partnerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-rose-50 px-6 py-12 relative overflow-hidden font-sans">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center w-full max-w-sm border border-rose-100">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center animate-pulse mb-6 mx-auto shadow-inner">
            <Heart className="w-10 h-10 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-2xl font-bold text-rose-950 mb-3 font-serif">Waiting for Partner</h1>
          <p className="text-rose-900/60 font-medium mb-6 text-sm">Ask your partner to enter this code to link your private world.</p>
          
          <div className="bg-rose-50/70 border border-rose-200/80 px-5 py-4 rounded-2xl w-full mb-6 shadow-2xs flex items-center justify-between">
             <span className="font-mono font-bold text-3xl tracking-widest text-rose-600 select-all">{space?.inviteCode}</span>
             <button
               onClick={handleCopyWaitingCode}
               className="p-2.5 bg-white text-rose-500 rounded-xl hover:bg-rose-50 shadow-xs transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5"
               title="Copy invite code"
             >
               {copiedWaitingCode ? (
                 <>
                   <Check className="w-4 h-4 text-emerald-600" />
                   <span className="text-xs font-bold text-emerald-600">Copied</span>
                 </>
               ) : (
                 <Copy className="w-4 h-4" />
               )}
             </button>
          </div>

          <button 
            onClick={handleDisconnect}
            className="text-sm font-semibold text-rose-900/50 hover:text-rose-900 transition-colors mt-4"
          >
            Cancel & Go Back
          </button>
        </div>
      </div>
    );
  }

  // Days together calculation
  const spaceCreatedDate = space?.createdAt ? new Date(space.createdAt).getTime() : Date.now() - (86400000 * 159);
  const daysTogether = Math.max(1, Math.floor((Date.now() - spaceCreatedDate) / (1000 * 60 * 60 * 24)));
  const nextMilestone = daysTogether <= 100 ? 100 : daysTogether <= 200 ? 200 : daysTogether <= 365 ? 365 : Math.ceil(daysTogether / 100) * 100;
  const daysToMilestone = Math.max(1, nextMilestone - daysTogether);

  // Time of day greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const moods = [
    { label: 'Happy', emoji: '😊' },
    { label: 'Loved', emoji: '🥰' },
    { label: 'Excited', emoji: '🤩' },
    { label: 'Tired', emoji: '😴' },
    { label: 'Sad', emoji: '😢' },
    { label: 'Stressed', emoji: '😫' }
  ];

  // Daily Question status check
  const isP1 = userData?.id === activeGame?.p1Id;
  const myAnswer = isP1 ? activeGame?.p1Answer : activeGame?.p2Answer;
  const partnerAnswer = isP1 ? activeGame?.p2Answer : activeGame?.p1Answer;
  const isSyncCompleted = activeGame?.status === 'completed';

  return (
    <div 
      className="flex flex-col min-h-[100dvh] pb-32 font-sans relative overflow-x-hidden overflow-y-auto transition-colors duration-500"
      style={{
        backgroundColor: theme.colors.screenBg,
        color: theme.colors.textMain
      }}
    >
      {/* Floating Hearts Feedback */}
      {floatingHearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ opacity: 1, y: 0, scale: 0.6 }}
          animate={{ opacity: 0, y: -180, scale: 1.4 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="fixed z-50 pointer-events-none drop-shadow-md"
          style={{ 
            left: `${heart.x}%`, 
            top: '45%',
            color: theme.colors.primary,
            fill: theme.colors.primary
          }}
        >
          <Heart className="w-8 h-8 fill-current drop-shadow-md" />
        </motion.div>
      ))}

      {/* Heartbeat / Action Toast */}
      <AnimatePresence>
        {heartbeatToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 inset-x-0 mx-auto z-[150] w-fit max-w-xs text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 border"
            style={{
              backgroundColor: theme.isDark ? 'rgba(30, 20, 50, 0.95)' : 'rgba(40, 20, 35, 0.92)',
              borderColor: theme.colors.cardBorder
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
            <span className="truncate">{heartbeatToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Container */}
      <div 
        className="rounded-b-[2.5rem] shadow-sm px-6 pt-10 pb-7 border-b relative z-10 transition-colors duration-500"
        style={{
          backgroundColor: theme.colors.headerBg,
          borderColor: theme.colors.cardBorder
        }}
      >
        {/* Top Profile / Couple Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <span 
              className="text-[11px] font-bold uppercase tracking-widest mb-0.5 block"
              style={{ color: theme.colors.primary }}
            >
              {greeting}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 
                className="text-2xl font-serif font-bold tracking-tight leading-tight"
                style={{ color: theme.colors.textMain }}
              >
                {userData?.displayName?.split(' ')[0]} & {partnerData?.displayName?.split(' ')[0]}
              </h1>
              {equippedBadgeItem && !isEquippedFrame && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-rose-100 text-amber-900 border border-amber-200/80 shadow-2xs">
                  {equippedBadgeItem.badgeLabel || equippedBadgeItem.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playPop();
                setIsDrawerOpen(true);
              }}
              className="relative p-2.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-full transition-colors border border-rose-100 active:scale-95 shadow-2xs"
              title="Live Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                sound.tap();
                navigate('/market');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 shadow-2xs active:scale-95 transition-all text-xs font-bold"
              title="Love Link Market"
            >
              <Coins className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{wallet?.balance ?? 50}</span>
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setShowCallPrompt(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-semibold shadow-md shadow-rose-300/40 hover:opacity-95 active:scale-95 transition"
              title="Voice or Video Call"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-2.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors border border-gray-100 active:scale-95 shadow-2xs"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Living Relationship Connection & Presence Card */}
        <div className="bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-rose-100/40 border border-rose-200/80 rounded-3xl p-4.5 mb-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Partner Avatar with Frame and Breathing Halo */}
              <div className="relative">
                {isEquippedFrame && equippedBadgeItem?.image && (
                  <div className="absolute -inset-2.5 z-10 pointer-events-none">
                    <img 
                      src={equippedBadgeItem.image} 
                      alt={equippedBadgeItem.name} 
                      className="w-full h-full object-contain filter drop-shadow-md animate-pulse duration-1000" 
                    />
                  </div>
                )}
                <div className={`w-13 h-13 rounded-full ${isEquippedFrame ? 'ring-2 ring-amber-300/80' : 'bg-gradient-to-tr from-rose-400 to-pink-500'} p-0.5 shadow-md`}>
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-rose-600 font-serif text-lg">
                    {partnerData?.displayName?.charAt(0) || 'P'}
                  </div>
                </div>
                {/* Real-time Green Presence Indicator */}
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-2xs animate-pulse z-20" />
              </div>

              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-rose-950 text-sm leading-snug">
                    {partnerData?.displayName}
                  </h3>
                  {isEquippedFrame && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {equippedBadgeItem?.badgeLabel || 'Framed'}
                    </span>
                  )}
                  <span className="text-xs">
                    {partnerData?.mood === 'Loved' ? '🥰' : partnerData?.mood === 'Happy' ? '😊' : '💖'}
                  </span>
                </div>
                <p className="text-[11px] text-rose-800/70 font-medium mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Active in your space</span>
                  <span className="text-rose-300">•</span>
                  <span>Feeling {partnerMood}</span>
                </p>
              </div>
            </div>

            {/* Call and Heartbeat Touch Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  sound.playPop();
                  setShowCallPrompt(true);
                }}
                className="flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs hover:shadow-sm active:scale-90 transition-all font-semibold text-xs"
                title="Call partner"
              >
                <Phone className="w-3.5 h-3.5 text-rose-500" />
                <span>Call</span>
              </button>

              <button
                onClick={handleSendHeartbeat}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs hover:shadow-sm active:scale-90 transition-all font-semibold text-xs group"
                title="Send a real heartbeat pulse to your partner"
              >
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500 group-hover:scale-125 transition-transform" />
                <span>Touch</span>
              </button>
            </div>
          </div>

          {/* Living Days Milestone Bar */}
          <div className="mt-3.5 pt-3 border-t border-rose-200/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-rose-900 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-bold">{daysTogether} days</span> together
            </div>
            <div className="text-[11px] text-rose-600/80 font-medium bg-white/80 px-2.5 py-0.5 rounded-full border border-rose-100">
              {daysToMilestone} days to Day {nextMilestone} milestone
            </div>
          </div>
        </div>

        {/* Mood Selector */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">How are you feeling right now?</p>
            <span className="text-[11px] text-rose-500 font-semibold">{myMood}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
            {moods.map(({ label, emoji }) => (
              <button
                key={label}
                onClick={() => handleMoodSelect(label)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  myMood === label 
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 scale-102 border border-rose-600' 
                    : 'bg-gray-50 text-gray-700 hover:bg-rose-50/70 border border-gray-100'
                }`}
              >
                <span className="text-base">{emoji}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="px-5 mt-5 space-y-5">
        
        {/* Live Notification Permission Prompt */}
        <NotificationPermissionBanner />

        {/* QUICK SNAP LIVE WIDGET */}
        <QuickSnapWidget />

        {/* HERO RITUAL: The Daily Question of the Day */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-200/90 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-rose-100/60 to-transparent rounded-bl-full pointer-events-none" />

          {/* Card Top Label */}
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                Today's Couple Question
              </span>
            </div>

            {isSyncCompleted ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Synced Today
              </span>
            ) : partnerAnswer ? (
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse">
                <Lock className="w-3 h-3" /> {partnerData.displayName} answered!
              </span>
            ) : (
              <span className="text-[11px] text-gray-500 font-medium">Daily Ritual</span>
            )}
          </div>

          {/* Active Question Title */}
          {activeGame ? (
            <div>
              <h2 className="text-lg font-serif font-bold text-rose-950 mb-3 leading-snug">
                "{activeGame.question}"
              </h2>

              {/* Status / Preview */}
              {isSyncCompleted ? (
                <div className="bg-rose-50/60 rounded-2xl p-3.5 border border-rose-100 mb-3 text-xs text-rose-900 leading-relaxed">
                  <p className="line-clamp-2 italic mb-2">"{myAnswer}"</p>
                  <Link
                    to="/game"
                    className="inline-flex items-center gap-1 text-rose-600 font-bold hover:underline"
                  >
                    <span>View partner's answers & memories</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : myAnswer ? (
                <div className="bg-rose-50/70 rounded-2xl p-3.5 border border-rose-100 mb-3 text-xs text-rose-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Your answer is locked! Waiting for {partnerData.displayName}...</span>
                  </div>
                  <Link to="/game" className="font-bold text-rose-600 shrink-0 hover:underline">
                    View
                  </Link>
                </div>
              ) : !showQuickAnswer ? (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setShowQuickAnswer(true)}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-rose-300/40 hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Answer with photo/clip</span>
                  </button>
                  <Link
                    to="/game"
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors"
                  >
                    Open Sync
                  </Link>
                </div>
              ) : null}

              {/* Expandable Quick Answer Tray with Attachment Preview & Removal */}
              <AnimatePresence>
                {showQuickAnswer && !myAnswer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-rose-100"
                  >
                    <textarea
                      value={homeAnswerText}
                      onChange={(e) => setHomeAnswerText(e.target.value)}
                      placeholder="Write your answer... Add photos or video clips below"
                      className="w-full bg-rose-50/50 border border-rose-200/90 rounded-2xl p-3 text-xs text-rose-950 outline-none focus:ring-2 focus:ring-rose-300 resize-none min-h-[85px] mb-2 placeholder:text-rose-300"
                    />

                    {/* Media Attach Actions */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => homePhotoRef.current?.click()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium shadow-2xs active:scale-95 transition-all"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                        <span>Add Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => homeVideoRef.current?.click()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium shadow-2xs active:scale-95 transition-all"
                      >
                        <VideoIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Add Video clip</span>
                      </button>

                      <input 
                        ref={homePhotoRef}
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleHomeFilesSelected}
                        className="hidden" 
                      />
                      <input 
                        ref={homeVideoRef}
                        type="file" 
                        accept="video/*" 
                        multiple 
                        onChange={handleHomeFilesSelected}
                        className="hidden" 
                      />
                    </div>

                    {/* Dedicated Attachment Preview Component for Daily Question Input */}
                    <DailyQuestionAttachmentPreview
                      attachments={homeAttachments}
                      onRemoveAttachment={handleHomeRemoveAttachment}
                      onClearAll={() => setHomeAttachments([])}
                      onAddMore={() => homePhotoRef.current?.click()}
                      maxAttachments={5}
                    />

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickAnswer(false);
                          setHomeAttachments([]);
                          setHomeAnswerText('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitHomeAnswer}
                        disabled={isSubmittingAnswer || (!homeAnswerText.trim() && homeAttachments.length === 0)}
                        className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-xs rounded-xl shadow-md disabled:opacity-40 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        <span>{isSubmittingAnswer ? 'Locking...' : 'Lock Answer'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                No active daily question right now. Start today's sync ritual to unlock XP and deepen intimacy!
              </p>
              <button
                onClick={handleStartHomeQuestion}
                disabled={isGeneratingQuestion}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl text-xs shadow-md shadow-rose-300/40 hover:shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{isGeneratingQuestion ? 'Generating Question...' : 'Start Today\'s Daily Question'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Real Love Sparks: "Thinking of You" Reaction Tray */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 border border-rose-100 flex items-center justify-between gap-1 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-500/80 uppercase tracking-wider pl-1 shrink-0">
            Send to partner:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {[
              { label: 'Kiss', emoji: '💋', text: 'Sending you a sweet kiss 💋' },
              { label: 'Hug', emoji: '🫂', text: 'Giving you the biggest warm hug 🫂' },
              { label: 'Miss You', emoji: '🥺', text: 'Missing you so much right now 🥺' },
              { label: 'Smile', emoji: '✨', text: 'You made me smile today ✨' }
            ].map(item => (
              <button
                key={item.label}
                onClick={() => handleSendQuickReaction(item.text)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-900 active:scale-90 transition-all shadow-2xs whitespace-nowrap"
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Harmony Suggestion Card */}
        {aiSuggestion && (
          <div className="bg-gradient-to-br from-rose-400 to-pink-500 p-[1px] rounded-3xl shadow-[0_8px_30px_rgba(251,113,133,0.18)]">
            <div className="bg-white/95 backdrop-blur-xl p-5 rounded-3xl h-full">
               <div className="flex items-center gap-2 mb-3">
                 <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                   <Sparkles className="w-4 h-4 text-rose-500" />
                 </div>
                 <h3 className="font-bold text-gray-900 text-sm">Harmony Tip for {partnerData.displayName}</h3>
               </div>
               <div className="bg-rose-50/80 p-3.5 rounded-2xl mb-3 text-gray-700 italic text-xs border border-rose-100/50 leading-relaxed">
                 "{aiSuggestion.messageSuggestion}"
               </div>
               <button 
                 onClick={handleSendMessageSuggestion}
                 className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-rose-500/20 active:scale-[0.98] text-xs"
               >
                 Send this message
               </button>
            </div>
          </div>
        )}

        {/* Curated Living Relationship Portals */}
        <div className="space-y-4 pt-1">
          {/* Section 1: Daily Rituals */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Our Daily Connection</h2>
              <span className="text-[11px] text-rose-500 font-semibold">Live & Synced</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              <Link
                to="/chat"
                className="p-4 rounded-2xl border love-card-interactive apple-press flex items-center gap-3 group"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder,
                  boxShadow: theme.colors.cardShadow
                }}
              >
                <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Chat</h4>
                  <p className="text-[11px] text-gray-400">Private line</p>
                </div>
              </Link>

              <Link
                to="/game"
                className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Love Sync</h4>
                  <p className="text-[11px] text-rose-500 font-medium">Daily Question</p>
                </div>
              </Link>

              <Link
                to="/notes"
                className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Daily Notes</h4>
                  <p className="text-[11px] text-gray-400">Streak & love notes</p>
                </div>
              </Link>

              <Link
                to="/memories"
                className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CalendarHeart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Memories</h4>
                  <p className="text-[11px] text-gray-400">Photo & Story vault</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Section: Loveverse Digital Gifts & Interactive Experiences */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Digital Gifts & Worlds</h2>
              <span className="text-[11px] font-bold text-rose-500">Loveverse ✨</span>
            </div>

            <Link
              to="/loveverse/gifts"
              onClick={() => sound.playPop()}
              className="block mb-3 rounded-3xl overflow-hidden relative border border-rose-300 shadow-lg hover:shadow-xl transition-all group bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-900 text-white p-4"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">🏝️</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      7 Interactive Experiences
                    </span>
                  </div>
                  <h3 className="font-serif font-black text-base text-white">Loveverse Digital Gifts</h3>
                  <p className="text-[11px] text-rose-100 font-medium">Sunset island, 3D art museum, Paris invitation & kitty love letters.</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0 shadow-md">
                  <Gift className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </div>

          {/* Section 2: Play & Intimacy — Loveverse Playhouse */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loveverse Playhouse</h2>
              <span className="text-[11px] font-bold text-rose-500">Endless Fun ✨</span>
            </div>

            {/* Featured Hero Card: Loveverse Playhouse */}
            <Link
              to="/playhouse"
              onClick={() => sound.playPop()}
              className="block mb-3 rounded-3xl overflow-hidden relative border border-rose-200/90 shadow-md hover:shadow-xl transition-all group bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white p-4"
            >
              <img
                src="https://images.openai.com/static-rsc-4/KQXgFLFePANk9f5wk9WlQrjAAGaWiaIjPWVLpPJhbYq-ABHYZWS5FsrfUunx_LuzyZMCHGLid0kiiDn4-3j-QYuqxMSXZTltVDMB6KHcoz7Txxs8D-MHqNkcGk46dJFO0-nFaXYSlN0OibecRMrPb9ZMmMWZoJo-VAa11bCpFtt0cScCeNam5Uuag6S9bjfN?purpose=fullsize"
                alt="Loveverse Playhouse"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-500 pointer-events-none"
              />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">🏰</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                      Top 10 Games
                    </span>
                  </div>
                  <h3 className="font-serif font-black text-base text-white">Loveverse Playhouse</h3>
                  <p className="text-[11px] text-rose-100 font-medium">Two hearts. One little world. Endless fun.</p>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              <Link
                to="/truth-or-dare"
                className="p-4 rounded-2xl border love-card-interactive apple-press flex items-center gap-3 group"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder,
                  boxShadow: theme.colors.cardShadow
                }}
              >
                <div className="w-11 h-11 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Truth or Dare</h4>
                  <p className="text-[11px] text-gray-400">Spicy & playful</p>
                </div>
              </Link>

              <Link
                to="/who-loves-more"
                className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Who Loves More</h4>
                  <p className="text-[11px] text-gray-400">Playful debate</p>
                </div>
              </Link>

              <Link
                to="/lovelanguage"
                className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Love Language</h4>
                  <p className="text-[11px] text-gray-400">Quiz & profiles</p>
                </div>
              </Link>

              <Link
                to="/aira"
                className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
              >
                <div className="w-11 h-11 bg-pink-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">AIRA Companion</h4>
                  <p className="text-[11px] text-rose-500 font-medium">Romantic AI</p>
                </div>
              </Link>

              {/* Love Coupons & Date Rewards Vault */}
              <Link
                to="/love-coupons"
                onClick={() => sound.playPop()}
                className="col-span-2 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 p-4 rounded-2xl text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    🎁
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="font-bold text-sm text-white">Love Coupons & Date Vault</h4>
                      <span className="text-[9px] font-extrabold uppercase bg-white/25 px-2 py-0.5 rounded-full">Perks</span>
                    </div>
                    <p className="text-[11px] text-rose-100">Unlock & redeem massage passes, date wagers, and sweet favors</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            </div>
          </div>

          {/* Section 3: Our Future & Adventures */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Our Future & Adventures</h2>
              <span className="text-[11px] font-bold text-rose-500">Shared Dreams 🌟</span>
            </div>

            {/* Featured Shared Vision Board Banner */}
            <Link
              to="/vision-board"
              onClick={() => sound.playPop()}
              className="block mb-3 rounded-3xl overflow-hidden relative border border-rose-200/90 shadow-md hover:shadow-xl transition-all group bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 text-white p-4"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">✨</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                      New • AI Assisted
                    </span>
                  </div>
                  <h3 className="font-serif font-black text-base text-white">Shared Vision Board</h3>
                  <p className="text-[11px] text-rose-100 font-medium">Pin future photos, bucket lists, and dream goals together.</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
              </div>
            </Link>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/market"
                  className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
                >
                  <div className="w-11 h-11 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Love Market</h4>
                    <p className="text-[11px] text-gray-400">Gifts & perks</p>
                  </div>
                </Link>

                <Link
                  to="/date-planner"
                  className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
                >
                  <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CalendarHeart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Date Planner</h4>
                    <p className="text-[11px] text-gray-400">Curated dates</p>
                  </div>
                </Link>

                <Link
                  to="/map"
                  className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
                >
                  <div className="w-11 h-11 bg-green-100 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Love Map</h4>
                    <p className="text-[11px] text-gray-400">Pin our places</p>
                  </div>
                </Link>

                <Link
                  to="/diary"
                  className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
                >
                  <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Diary</h4>
                    <p className="text-[11px] text-gray-400">Private thoughts</p>
                  </div>
                </Link>

                <Link
                  to="/reminders"
                  className="bg-white p-4 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex items-center gap-3 group"
                >
                  <div className="w-11 h-11 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Reminders</h4>
                    <p className="text-[11px] text-gray-400">Anniversaries</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 backdrop-blur-sm">
             <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-6 font-serif">Settings</h2>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowCallPrompt(true);
                    }}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow-md shadow-rose-300/40 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Start Voice or Video Call</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(false);
                      sound.tap();
                      navigate('/my-collection');
                    }}
                    className="w-full bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-200/60"
                  >
                    <Palette className="w-4 h-4 text-rose-500" />
                    <span>🎨 Active Themes & Badges</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(false);
                      sound.tap();
                      setShowWallpaperModal(true);
                    }}
                    className="w-full bg-pink-50 text-pink-700 hover:bg-pink-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-pink-200/60"
                  >
                    <ImageIcon className="w-4 h-4 text-pink-500" />
                    <span>🖼️ Chat Background & Wallpaper</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(false);
                      sound.playPop();
                      setIsDrawerOpen(true);
                    }}
                    className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-purple-200/60"
                  >
                    <Bell className="w-4 h-4 text-purple-500" />
                    <span>🔔 Live Notifications & Alerts</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playLoveAlert();
                      triggerNotification({
                        type: 'pulse',
                        title: `💓 Live Heartbeat Alert Test`,
                        body: `Live notification test successful! Sound, vibration, and banners are active 💕`,
                        senderName: partnerData?.displayName || 'Partner',
                        link: '/chat',
                        actionLabel: 'Open Chat',
                      });
                    }}
                    className="w-full bg-pink-50/70 text-pink-700 hover:bg-pink-100/80 font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-pink-200/40 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                    <span>Test Live Notification Sound & Banner</span>
                  </button>

                  <button
                    onClick={() => setShowPermissionsModal(true)}
                    className="w-full bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-200/60"
                  >
                    <span>🛡️ Device Permissions</span>
                  </button>

                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="w-full bg-gray-50 text-gray-700 hover:bg-gray-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-200/60"
                  >
                    <span>🔒 Privacy & Terms Policy</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowDataRightsModal(true);
                    }}
                    className="w-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-emerald-200/60"
                  >
                    <span>⚖️ Data Principal Rights (DPDP)</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowGscModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-rose-50 to-pink-50 text-rose-700 hover:bg-rose-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-rose-200/60"
                  >
                    <span>🔍 Google Search Console & SEO</span>
                  </button>

                <button 
                  onClick={signOut} 
                  className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 font-semibold py-3 rounded-xl transition-colors"
                >
                   Sign Out
                </button>
                <button 
                  onClick={handleDisconnect} 
                  className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-semibold py-3 rounded-xl transition-colors"
                >
                   Disconnect Partner
                </button>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="w-full font-semibold py-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                   Cancel
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Device Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-rose-100 max-h-[85vh] overflow-y-auto">
            <PartnerPermissionsChecklist compact={false} />
            <button
              onClick={() => setShowPermissionsModal(false)}
              className="mt-4 w-full bg-rose-950 text-white font-semibold py-3 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Chat Wallpaper Customization Modal */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-rose-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
              <div>
                <h3 className="font-bold text-base font-serif text-gray-900">Chat Background</h3>
                <p className="text-[11px] text-gray-500">Pick a persistent romantic wallpaper</p>
              </div>
              <button
                onClick={() => setShowWallpaperModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {WALLPAPER_PRESETS.map((wp) => {
                const isSelected = currentWallpaper === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      sound.tap();
                      applyWallpaper(wp.id);
                      setCurrentWallpaper(wp.id);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/50 shadow-xs'
                        : 'border-gray-100 hover:border-rose-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl shadow-xs border border-white/50"
                        style={{ background: wp.preview }}
                      />
                      <span className="font-bold text-xs text-gray-800">{wp.name}</span>
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs shadow-2xs">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowWallpaperModal(false)}
              className="mt-4 w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-2.5 rounded-xl shadow-md shadow-rose-300/40 text-xs"
            >
              Apply to Chat
            </button>
          </div>
        </div>
      )}

      {/* Terms & Privacy Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* DPDP Data Rights Request Modal */}
      <DataRightsRequestModal
        isOpen={showDataRightsModal}
        onClose={() => setShowDataRightsModal(false)}
      />

      {/* Google Search Console & SEO Modal */}
      <GoogleSearchConsoleModal
        isOpen={showGscModal}
        onClose={() => setShowGscModal(false)}
      />

      {/* Voice & Video Call Prompt Modal */}
      <CallPromptModal
        isOpen={showCallPrompt}
        onClose={() => setShowCallPrompt(false)}
      />

      <BottomNav />
    </div>
  );
}
