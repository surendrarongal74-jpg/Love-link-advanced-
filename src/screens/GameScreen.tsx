import React, { useState, useEffect, useRef } from 'react';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BottomNav } from '../components/BottomNav';
import { Play, CheckCircle2, ChevronLeft, Star, Sparkles, Image as ImageIcon, Video as VideoIcon, Camera, Heart, Smile, Sparkle, Film } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { generateDailyQuestion, generateAiraGameContent } from '../lib/ai';
import { DailyQuestionAttachmentPreview, QuestionAttachmentItem, processFileToAttachment } from '../components/DailyQuestionAttachmentPreview';
import { sound } from '../lib/sound';

const QUESTIONS = [
  "What's our favorite thing to do on a lazy Sunday?",
  "Where was our first kiss?",
  "What's my weirdest habit?",
  "What is the one thing I can't live without?",
  "Where do you see us in 5 years?",
  "What's your most cherished memory of us?",
  "What's one song that instantly reminds you of me?",
  "What was the exact moment you realized you loved me?",
  "What is our sweetest inside joke?",
  "If we could teleport anywhere right now for 24 hours, where would we go?"
];

export function GameScreen() {
  const { space, partnerData } = useCoupleSpace();
  const { userData } = useAuth();
  
  const [activeGame, setActiveGame] = useState<any>(null);
  const [pastGames, setPastGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [answer, setAnswer] = useState('');
  const [attachments, setAttachments] = useState<QuestionAttachmentItem[]>([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; name?: string } | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (activeGame?.status === 'completed' && prevStatus === 'playing') {
      sound.playSuccess();
      const myCanvas = document.createElement('canvas');
      myCanvas.style.width = '100vw';
      myCanvas.style.height = '100vh';
      myCanvas.style.position = 'fixed';
      myCanvas.style.top = '0';
      myCanvas.style.left = '0';
      myCanvas.style.pointerEvents = 'none';
      myCanvas.style.zIndex = '9999';
      document.body.appendChild(myCanvas);

      const myConfetti = confetti.create(myCanvas, {
        resize: true,
        useWorker: false
      });

      myConfetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#fb7185', '#eab308', '#ec4899']
      });

      setTimeout(() => {
        myCanvas.remove();
      }, 5000);
    }
    if (activeGame) {
      setPrevStatus(activeGame.status);
    }
  }, [activeGame?.status, prevStatus]);

  useEffect(() => {
    if (!space?.id) return;
    
    // Listen for recent games
    const q = query(
      collection(db, `coupleSpaces/${space.id}/games`),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setActiveGame(all[0]);
        setPastGames(all.slice(1));
      } else {
        setActiveGame(null);
        setPastGames([]);
      }
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `coupleSpaces/${space.id}/games`));

    return unsubscribe;
  }, [space?.id]);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingMedia(true);
    sound.playPop();

    try {
      const newItems: QuestionAttachmentItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (attachments.length + newItems.length >= 5) break; // max 5
        const item = await processFileToAttachment(file);
        newItems.push(item);
      }
      setAttachments(prev => [...prev, ...newItems].slice(0, 5));
    } catch (err) {
      console.error('Failed to process attachment', err);
    } finally {
      setIsProcessingMedia(false);
      // Reset input value so same file can be picked again if removed
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(item => item.id !== id));
  };

  const startNewGame = async () => {
    if (!space?.id || !userData?.id || !partnerData?.id || isGenerating) return;
    
    setIsGenerating(true);
    sound.playPop();
    let randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    try {
      const msgsQuery = query(collection(db, `coupleSpaces/${space.id}/messages`), orderBy('createdAt', 'desc'), limit(15));
      const smap = await getDocs(msgsQuery);
      const chatHistory = smap.docs.reverse().map(d => `${d.data().senderId === userData.id ? 'Me' : 'Partner'}: ${d.data().content}`);
      
      const airaRes = await generateAiraGameContent<{ question: string }>('couple-quiz', (pastGames.length || 0) + 1);
      if (airaRes?.question) {
        randomQ = airaRes.question;
      } else {
        randomQ = await generateDailyQuestion(chatHistory);
      }
    } catch(err) {
      console.error("Failed to generate AI question", err);
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
      question: randomQ,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    try {
      await setDoc(doc(db, `coupleSpaces/${space.id}/games`, gameId), gameData);
      setAnswer('');
      setAttachments([]);
      sound.playChime();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `coupleSpaces/${space.id}/games`);
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = async () => {
    if (!activeGame || !answer.trim() || !space?.id || !userData) return;
    
    sound.playChime();
    const isP1 = userData.id === activeGame.p1Id;
    const serializedAttachments = attachments.map(a => ({
      id: a.id,
      type: a.type,
      url: a.url,
      name: a.name,
      size: a.size,
      duration: a.duration || 0
    }));

    const updateData: any = { updatedAt: Date.now() };
    
    if (isP1) {
      updateData.p1Answer = answer.trim();
      updateData.p1Attachments = serializedAttachments;
    } else {
      updateData.p2Answer = answer.trim();
      updateData.p2Attachments = serializedAttachments;
    }
    
    // Check if other partner has already answered
    const otherPartnerAnswer = isP1 ? activeGame.p2Answer : activeGame.p1Answer;
    if (otherPartnerAnswer) {
      updateData.status = 'completed';
    }
    
    try {
      await updateDoc(doc(db, `coupleSpaces/${space.id}/games`, activeGame.id), updateData);
      
      // If completed, award XP
      if (updateData.status === 'completed') {
        const newXp = (space.xp || 0) + 50;
        let newLevel = space.level || 1;
        if (newXp >= newLevel * 100) {
           newLevel += 1;
        }
        await updateDoc(doc(db, 'coupleSpaces', space.id), {
          xp: newXp,
          level: newLevel
        });
      }
      setAnswer('');
      setAttachments([]);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `coupleSpaces/${space.id}/games`);
    }
  };

  const handleSendLoveReaction = async (reaction: string) => {
    if (!space?.id || !activeGame?.id) return;
    sound.playChime();
    try {
      const existingReactions = activeGame.reactions || [];
      await updateDoc(doc(db, `coupleSpaces/${space.id}/games`, activeGame.id), {
        reactions: [...existingReactions, { user: userData?.displayName, reaction, time: Date.now() }]
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-rose-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-3 border-rose-300 border-t-rose-500 animate-spin" />
        <p className="text-sm font-semibold text-rose-900/60">Loading Love Sync...</p>
      </div>
    );
  }

  const renderGameContent = () => {
    if (!activeGame || activeGame.status === 'completed') {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center pt-6 pb-12 px-6 text-center relative overflow-hidden"
        >
          {/* Decorative background blobs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/35 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-200/35 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <div className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl shadow-rose-200/50 mb-5 border border-white relative z-10">
             <Star className="w-10 h-10 text-rose-500 fill-rose-500" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-rose-950 mb-2 relative z-10">Love Sync</h2>
          <p className="text-rose-500/80 mb-6 max-w-xs mx-auto text-sm font-medium relative z-10">
            Answer today's couple question together, attach special photos or video clips, and unlock deeper intimacy.
          </p>
          
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg shadow-rose-100/60 border border-rose-100 w-full mb-6 flex justify-between items-center text-left relative z-10">
            <div>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-[0.2em] mb-1">Level {space?.level || 1} Bond</p>
              <p className="text-xl font-bold text-rose-950 font-mono">{space?.xp || 0} / {(space?.level || 1) * 100} XP</p>
              <div className="w-36 h-2 bg-rose-100 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (((space?.xp || 0) % 100) / 100) * 100)}%` }}
                />
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-inner">
               <Star className="w-7 h-7 text-rose-500 fill-rose-300" />
            </div>
          </div>

          <button 
            onClick={startNewGame}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white font-semibold py-4 px-8 rounded-full shadow-lg shadow-rose-300/60 hover:shadow-xl hover:shadow-rose-400/70 disabled:opacity-50 disabled:shadow-none transition-all text-base active:scale-[0.98] flex items-center justify-center gap-3 relative z-10"
          >
            {isGenerating ? (
              <><Sparkles className="w-5 h-5 fill-current animate-spin" /> Generating AI Question...</>
            ) : (
              <><Sparkles className="w-5 h-5 fill-current" /> Start Today's Couple Question</>
            )}
          </button>

          {/* Quick Portal into Loveverse Playhouse */}
          <Link
            to="/playhouse"
            className="w-full mt-4 p-4 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between group relative z-10"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-2xl">🏰</span>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-200 block">
                  Top 10 Games • Live Co-Op
                </span>
                <h4 className="font-serif font-bold text-sm text-white">Loveverse Playhouse</h4>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </div>
          </Link>
          
          {/* Last Completed Question Card */}
          {activeGame && activeGame.status === 'completed' && (
             <div className="mt-8 bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-200/80 w-full text-left relative z-10">
               <div className="flex items-center justify-between mb-3">
                 <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1">
                   <Sparkle className="w-3 h-3 fill-current" /> Revealed Together
                 </span>
                 <span className="text-xs text-rose-400 font-medium">Earned +50 XP</span>
               </div>
               
               <h3 className="font-serif font-bold text-xl text-rose-950 mb-5 leading-snug">
                 "{activeGame.question}"
               </h3>

               {/* Partner 1 Answer */}
               <div className="space-y-5">
                 <div className="bg-rose-50/60 border border-rose-100/80 p-4 rounded-2xl">
                   <div className="flex items-center justify-between mb-1.5">
                     <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">
                       {userData?.id === activeGame.p1Id ? 'You' : partnerData?.displayName}
                     </p>
                   </div>
                   <p className="text-rose-950 text-[15px] leading-relaxed mb-3">
                     {activeGame.p1Answer}
                   </p>

                   {/* P1 Attachments */}
                   {activeGame.p1Attachments && activeGame.p1Attachments.length > 0 && (
                     <div className="mt-2 pt-2 border-t border-rose-200/50">
                       <p className="text-[11px] font-semibold text-rose-600/70 mb-2 flex items-center gap-1">
                         <ImageIcon className="w-3 h-3" /> Attached Memories ({activeGame.p1Attachments.length})
                       </p>
                       <div className="grid grid-cols-2 gap-2">
                         {activeGame.p1Attachments.map((att: any) => (
                           <div
                             key={att.id}
                             onClick={() => setLightboxMedia(att)}
                             className="relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer group border border-rose-200 shadow-2xs"
                           >
                             {att.type === 'image' ? (
                               <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                             ) : (
                               <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative">
                                 <video src={att.url} className="w-full h-full object-cover opacity-80" />
                                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                   <div className="w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center">
                                     <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                   </div>
                                 </div>
                               </div>
                             )}
                             <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                               {att.type === 'image' ? 'Photo' : 'Video'}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>

                 {/* Partner 2 Answer */}
                 <div className="bg-pink-50/60 border border-pink-100/80 p-4 rounded-2xl">
                   <div className="flex items-center justify-between mb-1.5">
                     <p className="text-xs text-pink-600 font-bold uppercase tracking-wider">
                       {userData?.id === activeGame.p2Id ? 'You' : partnerData?.displayName}
                     </p>
                   </div>
                   <p className="text-rose-950 text-[15px] leading-relaxed mb-3">
                     {activeGame.p2Answer}
                   </p>

                   {/* P2 Attachments */}
                   {activeGame.p2Attachments && activeGame.p2Attachments.length > 0 && (
                     <div className="mt-2 pt-2 border-t border-pink-200/50">
                       <p className="text-[11px] font-semibold text-pink-600/70 mb-2 flex items-center gap-1">
                         <ImageIcon className="w-3 h-3" /> Attached Memories ({activeGame.p2Attachments.length})
                       </p>
                       <div className="grid grid-cols-2 gap-2">
                         {activeGame.p2Attachments.map((att: any) => (
                           <div
                             key={att.id}
                             onClick={() => setLightboxMedia(att)}
                             className="relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer group border border-pink-200 shadow-2xs"
                           >
                             {att.type === 'image' ? (
                               <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                             ) : (
                               <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative">
                                 <video src={att.url} className="w-full h-full object-cover opacity-80" />
                                 <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                   <div className="w-8 h-8 rounded-full bg-white/90 text-rose-600 flex items-center justify-center">
                                     <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                   </div>
                                 </div>
                               </div>
                             )}
                             <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                               {att.type === 'image' ? 'Photo' : 'Video'}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>

               {/* Interactive Reaction Pill Bar */}
               <div className="mt-5 pt-4 border-t border-rose-100 flex items-center justify-between">
                 <span className="text-xs font-semibold text-rose-800">React to partner:</span>
                 <div className="flex gap-2">
                   {['💖', '🥰', '😂', '🥹'].map(emoji => (
                     <button
                       key={emoji}
                       onClick={() => handleSendLoveReaction(emoji)}
                       className="w-9 h-9 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center text-base hover:scale-110 active:scale-95 transition-all shadow-2xs"
                       title={`Send ${emoji}`}
                     >
                       {emoji}
                     </button>
                   ))}
                 </div>
               </div>
             </div>
          )}

          {/* Past Couple Sync History */}
          {pastGames.length > 0 && (
            <div className="mt-8 w-full text-left relative z-10">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-3 px-1">
                Our Past Sync Memories ({pastGames.length})
              </h4>
              <div className="space-y-3">
                {pastGames.slice(0, 3).map((game) => (
                  <div key={game.id} className="bg-white/80 p-4 rounded-2xl border border-rose-100 shadow-2xs">
                    <p className="text-xs font-serif font-bold text-rose-950 mb-1">"{game.question}"</p>
                    <p className="text-[11px] text-rose-500/70">
                      Answered together • {new Date(game.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    // Active Game
    const isP1 = userData?.id === activeGame.p1Id;
    const myAnswer = isP1 ? activeGame.p1Answer : activeGame.p2Answer;
    const partnerAnswer = isP1 ? activeGame.p2Answer : activeGame.p1Answer;

    if (myAnswer) {
      // I have answered, waiting for partner
      return (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center pt-12 pb-16 px-6 text-center relative overflow-hidden"
        >
          {/* Decorative background blobs */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-pink-200/40 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />

          <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center animate-pulse mb-6 shadow-inner border border-white">
            <CheckCircle2 className="w-12 h-12 text-rose-500" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-rose-950 mb-2 relative z-10">Answer Locked! 🔒</h2>
          <p className="text-rose-600 font-medium relative z-10 mb-4 max-w-xs">
            Waiting for {partnerData?.displayName} to lock their answer...
          </p>
          <span className="text-xs text-rose-400 bg-rose-100/70 px-3 py-1.5 rounded-full mb-8 font-medium">
            Answers remain secret until both of you complete today's question
          </span>
          
          <div className="flex items-center justify-center gap-2 relative z-10 mb-8">
            <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce" />
            <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-2.5 h-2.5 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>

          <div className="bg-white/80 p-5 rounded-3xl border border-rose-100 shadow-md max-w-sm w-full text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Your Answer:</span>
            <p className="text-rose-950 text-sm mt-1 italic">"{myAnswer}"</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-6 flex flex-col relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200/35 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-200/35 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col">
          {/* Header pill */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-[0.18em] inline-flex items-center gap-1.5 bg-rose-100 border border-rose-200/80 px-3 py-1 rounded-full shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Daily Sync Question
            </span>
            {partnerAnswer && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full animate-pulse">
                {partnerData?.displayName} answered! 🔒
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-rose-950 mb-5 leading-tight">
            {activeGame.question}
          </h2>
          
          {/* Answer Text Area */}
          <div className="relative">
            <textarea 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your honest answer here... Add photos or video clips below to bring this memory to life!"
              className="w-full bg-white/95 backdrop-blur-xl border border-rose-200/90 p-5 rounded-3xl shadow-lg shadow-rose-200/30 min-h-[140px] outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none text-rose-950 text-base mb-2 transition-all placeholder:text-rose-300"
            />
          </div>

          {/* Media Attachment Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl shadow-2xs active:scale-95 transition-all"
            >
              <ImageIcon className="w-4 h-4 text-rose-500" />
              <span>Attach Photo</span>
            </button>

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl shadow-2xs active:scale-95 transition-all"
            >
              <VideoIcon className="w-4 h-4 text-amber-500" />
              <span>Attach Video Clip</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl shadow-2xs active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 text-indigo-500" />
              <span>Take Photo</span>
            </button>

            {isProcessingMedia && (
              <span className="text-xs text-rose-500 font-medium animate-pulse ml-1">
                Optimizing media...
              </span>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input 
            ref={photoInputRef}
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleFilesSelected} 
            className="hidden" 
          />
          <input 
            ref={videoInputRef}
            type="file" 
            accept="video/*" 
            multiple 
            onChange={handleFilesSelected} 
            className="hidden" 
          />
          <input 
            ref={cameraInputRef}
            type="file" 
            accept="image/*" 
            capture="environment" 
            onChange={handleFilesSelected} 
            className="hidden" 
          />

          {/* Dedicated Attachment Preview Component with Removal Functionality */}
          <DailyQuestionAttachmentPreview
            attachments={attachments}
            onRemoveAttachment={handleRemoveAttachment}
            onClearAll={() => setAttachments([])}
            onAddMore={() => photoInputRef.current?.click()}
            maxAttachments={5}
          />
          
          {/* Submit button */}
          <div className="pt-4 pb-12">
            <button 
              onClick={submitAnswer}
              disabled={!answer.trim() && attachments.length === 0}
              className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 text-white font-semibold py-4 rounded-full shadow-lg shadow-rose-300 hover:shadow-xl hover:shadow-rose-400 disabled:opacity-40 disabled:shadow-none transition-all text-base active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              <span>Lock My Answer & Sync</span>
            </button>
            <p className="text-[11px] text-center text-rose-400 mt-2 font-medium">
              Answers are kept secret until both partners have locked their answers
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-rose-50 relative pb-20 overflow-y-auto overflow-x-hidden font-sans">
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-white/70 backdrop-blur-xl z-20 border-b border-rose-100 shadow-2xs shrink-0">
         <div className="flex items-center gap-3">
           <Link to="/" className="p-2 -ml-2 bg-white rounded-full shadow-2xs text-rose-500 hover:bg-rose-50 transition-colors">
             <ChevronLeft className="w-5 h-5" />
           </Link>
           <div>
             <h1 className="font-serif font-bold text-lg text-rose-950 leading-tight">Love Sync</h1>
             <p className="text-[10px] text-rose-500/70 font-medium">Daily Couple Question Ritual</p>
           </div>
         </div>

         {partnerData && (
           <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span>{partnerData.displayName}</span>
           </div>
         )}
      </div>
      
      <div className="flex-1">
        {renderGameContent()}
      </div>

      {/* Lightbox Modal for Completed Game Attachments */}
      {lightboxMedia && (
        <div 
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div onClick={e => e.stopPropagation()} className="relative max-w-lg w-full bg-zinc-950 rounded-3xl overflow-hidden border border-white/10">
            <div className="p-3 bg-zinc-900 flex justify-between items-center text-white text-xs">
              <span>{lightboxMedia.type === 'image' ? 'Attached Photo' : 'Attached Video Clip'}</span>
              <button onClick={() => setLightboxMedia(null)} className="px-2.5 py-1 bg-white/20 rounded-full hover:bg-white/30">Close</button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black min-h-[250px]">
              {lightboxMedia.type === 'image' ? (
                <img src={lightboxMedia.url} alt="Attachment" className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain" />
              ) : (
                <video src={lightboxMedia.url} controls autoPlay className="max-h-[70vh] w-auto max-w-full rounded-xl" />
              )}
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}

