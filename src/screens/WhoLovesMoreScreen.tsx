import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, RefreshCw, AlertCircle, ArrowRight, User, Wand2, Sparkles } from 'lucide-react';
import { generateAiraGameContent } from '../lib/ai';

interface WLMState {
  id: string;
  coupleSpaceId: string;
  playersOnline: string[];
  status: 'waiting' | 'playing' | 'revealing' | 'result';
  currentQuestion: string;
  round: number;
  answers: Record<string, string>; // userId -> answer (either userData.id or partnerInfo.id)
  scores: Record<string, number>;
  updatedAt: number;
}

const TEMPLATES = [
  "Who is more likely to {action}?",
  "Who is the better {noun}?",
  "Who takes longer to {action}?",
  "Who said 'I love you' first?",
  "Who is more stubborn?",
  "Who is more romantic?",
  "Who is the funny one?",
  "Who cooks better?",
  "Who complains more?"
];

// Fallback questions if AI fails
const FALLBACK_QUESTIONS = [
  "Who is more likely to fall asleep during a movie?",
  "Who takes more time to get ready?",
  "Who apologizes first after an argument?",
  "Who spends more money on food?",
  "Who is more organized?",
  "Who texts back faster?",
  "Who brings up random topics at 2 AM?",
  "Who is more likely to plan a surprise?"
];

export function WhoLovesMoreScreen() {
  const { userData } = useAuth();
  const { space, partnerInfo } = useCoupleSpace();
  
  const [gameState, setGameState] = useState<WLMState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/whoLovesMore`, 'default') : null;

  useEffect(() => {
    if (!docRef || !userData?.id) return;

    const initOrJoinGame = async () => {
       try {
          await setDoc(docRef, {
             id: 'default',
             coupleSpaceId: space.id,
          }, { merge: true });
       } catch (e) {
          console.error(e);
       }
    };
    
    initOrJoinGame();

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as WLMState;
        
        if (!data.playersOnline?.includes(userData.id)) {
           updateDoc(docRef, {
              playersOnline: [...(data.playersOnline || []).filter(id => id !== userData.id), userData.id].slice(-2)
           }).catch(e => console.error(e));
        }
        
        setGameState(data);
      } else {
        setDoc(docRef, {
          id: 'default',
          coupleSpaceId: space.id,
          playersOnline: [userData.id],
          status: 'waiting',
          currentQuestion: '',
          round: 0,
          answers: {},
          scores: {},
          updatedAt: Date.now()
        }).catch(e => console.error(e));
      }
    }, (err) => {
       handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space.id}/whoLovesMore/default`);
    });

    return () => {
       unsubscribe();
       if (docRef && userData?.id) {
           updateDoc(docRef, {
               playersOnline: gameState?.playersOnline?.filter(id => id !== userData.id) || []
           }).catch(e => console.log(e));
       }
    };
  }, [space?.id, userData?.id]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (docRef && userData?.id && gameState?.playersOnline) {
          updateDoc(docRef, {
             playersOnline: gameState.playersOnline.filter(id => id !== userData.id)
          }).catch(e => console.log(e));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [docRef, userData?.id, gameState?.playersOnline]);

  const bothOnline = gameState?.playersOnline?.length === 2;

  const getNewQuestion = async (level: number = 1) => {
    try {
      const airaItem = await generateAiraGameContent<{ question: string }>('who-loves-more', level);
      if (airaItem?.question) {
        return airaItem.question.trim();
      }
      return FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
    } catch {
      return FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
    }
  };

  const handleStartGame = async () => {
    if (!docRef) return;
    setIsGenerating(true);
    const q = await getNewQuestion(1);
    await updateDoc(docRef, {
       status: 'playing',
       currentQuestion: q,
       round: 1,
       answers: {},
       updatedAt: Date.now()
    });
    setIsGenerating(false);
  };

  const submitAnswer = async (selectedUserId: string) => {
    if (!docRef || !userData?.id || !gameState) return;
    
    const newAnswers = { ...gameState.answers, [userData.id]: selectedUserId };
    
    // Check if both answered
    if (Object.keys(newAnswers).length === 2) {
       // Evaluate
       const p1 = Object.keys(newAnswers)[0];
       const p2 = Object.keys(newAnswers)[1];
       
       let points1 = 5; // participation
       let points2 = 5;
       
       if (newAnswers[p1] === newAnswers[p2]) {
          // match!
          points1 += 10;
          points2 += 10;
       }
       
       const newScores = {
          [p1]: (gameState.scores?.[p1] || 0) + points1,
          [p2]: (gameState.scores?.[p2] || 0) + points2,
       };
       
       await updateDoc(docRef, {
          answers: newAnswers,
          scores: newScores,
          status: 'revealing',
          updatedAt: Date.now()
       });
       
       setTimeout(() => {
          updateDoc(docRef, { status: 'result' });
       }, 3000);
       
    } else {
       // Wait for partner
       await updateDoc(docRef, {
          answers: newAnswers,
          updatedAt: Date.now()
       });
    }
  };

  const nextRound = async () => {
    if (!docRef) return;
    setIsGenerating(true);
    const nextRoundNum = (gameState?.round || 0) + 1;
    const q = await getNewQuestion(nextRoundNum);
    await updateDoc(docRef, {
       status: 'playing',
       currentQuestion: q,
       round: nextRoundNum,
       answers: {},
       updatedAt: Date.now()
    });
    setIsGenerating(false);
  };

  if (!gameState) {
    return <div className="h-screen bg-rose-50 flex items-center justify-center p-6"><RefreshCw className="w-8 h-8 text-rose-500 animate-spin" /></div>;
  }

  if (!bothOnline) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-rose-100 to-rose-50 relative justify-center items-center p-6 text-center pb-20">
        <Heart className="w-16 h-16 text-rose-300 animate-pulse mb-6" />
        <h2 className="text-2xl font-bold font-serif text-rose-950 mb-2">Who Loves More?</h2>
        <p className="text-rose-600 mb-8">Both of you need to be here to play!</p>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-sm font-medium text-rose-700">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
          Waiting for {partnerInfo?.displayName || 'partner'}
        </div>
        <BottomNav />
      </div>
    );
  }

  const myAnswer = gameState.answers?.[userData?.id || ''];
  const pAnswer = gameState.answers?.[partnerInfo?.id || ''];
  const bothAnswered = myAnswer && pAnswer;
  const isMatch = bothAnswered && myAnswer === pAnswer;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-500 to-rose-600 text-white relative pb-16 overflow-hidden">
      
      {/* Top Header */}
      <div className="flex justify-between items-center p-6 sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm">
         <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl drop-shadow-md flex items-center gap-1">
               Love Quiz <Heart className="w-5 h-5 text-rose-300 fill-current" />
            </h1>
         </div>
         {gameState.status !== 'waiting' && (
            <div className="flex gap-4 font-mono font-bold bg-black/20 px-3 py-1 rounded-full text-sm">
               <span>You: {gameState.scores?.[userData?.id || ''] || 0}</span>
               <span className="text-white/50">|</span>
               <span>{partnerInfo?.displayName}: {gameState.scores?.[partnerInfo?.id || ''] || 0}</span>
            </div>
         )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
         <AnimatePresence mode="wait">
            {gameState.status === 'waiting' && (
               <motion.div key="waiting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center w-full">
                  <div className="bg-white/20 p-8 rounded-[2rem] backdrop-blur-md border border-white/30 shadow-xl mb-8">
                     <h2 className="text-3xl font-serif font-bold mb-4">Ready to play?</h2>
                     <p className="text-white/80 mb-6 font-medium text-lg px-4">Find out who knows who better, and who is more likely to do what! 💖</p>
                     <button
                        onClick={handleStartGame}
                        disabled={isGenerating}
                        className="w-full bg-white text-rose-600 font-bold py-4 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xl disabled:opacity-50 flex justify-center items-center gap-2"
                     >
                        {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'Start Quiz'}
                     </button>
                  </div>
               </motion.div>
            )}

            {gameState.status === 'playing' && (
               <motion.div key="playing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full">
                  <div className="text-center mb-10">
                     <span className="inline-block px-4 py-1 bg-white/20 rounded-full font-bold uppercase tracking-widest text-xs mb-4">Round {gameState.round}</span>
                     <h2 className="text-3xl font-serif font-bold leading-tight drop-shadow-lg">{gameState.currentQuestion}</h2>
                  </div>

                  {!myAnswer ? (
                     <div className="grid grid-cols-1 gap-4">
                        <button 
                           onClick={() => submitAnswer(userData?.id || '')}
                           className="bg-white/90 hover:bg-white text-rose-600 font-bold py-5 rounded-2xl shadow-lg border border-white/50 text-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                        >
                           <User className="w-6 h-6" /> Me
                        </button>
                        <button 
                           onClick={() => submitAnswer(partnerInfo?.id || '')}
                           className="bg-black/30 hover:bg-black/40 text-white font-bold py-5 rounded-2xl shadow-lg border border-white/20 text-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 backdrop-blur-md"
                        >
                           <Heart className="w-6 h-6" /> {partnerInfo?.displayName}
                        </button>
                     </div>
                  ) : (
                     <div className="bg-white/10 p-8 rounded-[2rem] text-center border border-white/20 backdrop-blur-md">
                        <RefreshCw className="w-12 h-12 text-white/50 animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Waiting for {partnerInfo?.displayName}...</h3>
                        <p className="text-white/60">You chose: {myAnswer === userData?.id ? 'Me' : partnerInfo?.displayName}</p>
                     </div>
                  )}
               </motion.div>
            )}

            {(gameState.status === 'revealing' || gameState.status === 'result') && (
               <motion.div key="result" initial={{ opacity: 0, zoom: 0.8 }} animate={{ opacity: 1, zoom: 1 }} className="w-full text-center">
                  <h2 className="text-3xl font-serif font-bold mb-8 leading-tight drop-shadow-lg px-4">"{gameState.currentQuestion}"</h2>
                  
                  <div className="flex items-center justify-center gap-6 mb-10">
                     <div className="flex flex-col items-center">
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 ${myAnswer === userData?.id ? 'bg-white border-rose-300 text-rose-500' : 'bg-black/40 border-white/20 text-white'}`}>
                           {myAnswer === userData?.id ? 'Me' : partnerInfo?.displayName}
                        </div>
                        <span className="mt-3 font-bold text-lg">You chose</span>
                     </div>
                     <span className="text-3xl font-bold text-white/50">VS</span>
                     <div className="flex flex-col items-center">
                        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl shadow-xl border-4 ${pAnswer === partnerInfo?.id ? 'bg-white border-rose-300 text-rose-500' : 'bg-black/40 border-white/20 text-white'}`}>
                           {pAnswer === partnerInfo?.id ? 'Them' : 'You'}
                        </div>
                        <span className="mt-3 font-bold text-lg">{partnerInfo?.displayName} chose</span>
                     </div>
                  </div>

                  {gameState.status === 'result' ? (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/20 p-6 rounded-[2rem] backdrop-blur-md border border-white/30 text-center shadow-2xl">
                        {isMatch ? (
                           <>
                              <div className="text-5xl mb-4 animate-bounce">👯</div>
                              <h3 className="text-2xl font-bold mb-2 text-green-300">Perfect Match!</h3>
                              <p className="text-white/80 font-medium mb-6 px-4">You both agreed! +15 points each.</p>
                           </>
                        ) : (
                           <>
                              <div className="text-5xl mb-4">🤷</div>
                              <h3 className="text-2xl font-bold mb-2 text-yellow-300">Disagree!</h3>
                              <p className="text-white/80 font-medium mb-6 px-4">You guys couldn't agree. +5 points for participating.</p>
                           </>
                        )}
                        <button
                           onClick={nextRound}
                           disabled={isGenerating}
                           className="w-full bg-white text-purple-600 font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-all text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin"/> : 'Next Round'} <ArrowRight className="w-5 h-5" />
                        </button>
                     </motion.div>
                  ) : (
                     <div className="h-32 text-center text-white/50 font-medium animate-pulse text-xl">
                        Revealing...
                     </div>
                  )}
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
