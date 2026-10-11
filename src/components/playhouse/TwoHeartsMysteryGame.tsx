import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Sparkles, MapPin, Key, Compass, CheckCircle2, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chapter {
  id: number;
  title: string;
  location: string;
  storyIntro: string;
  partnerAClue: string;
  partnerBClue: string;
  riddleQuestion: string;
  solutionCode: string;
  epilogue: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'The Whispering Lagoon',
    location: 'Emerald Cove',
    storyIntro: 'An enchanted bottle washes up on the shoreline of a mystical island where two hearts washed ashore.',
    partnerAClue: '📜 Ancient Parchment: "The secret passcode starts with the hour when love blossoms under twilight (ROMANCE)."',
    partnerBClue: '🗝️ Brass Key Inscription: "Combine the sacred word with the number of eternal devotion: 7."',
    riddleQuestion: 'Combine your clues to reveal the Island Entrance Passcode (Word + Number):',
    solutionCode: 'ROMANCE7',
    epilogue: 'The stone gates of the Lagoon grind open with a gentle chime, revealing glowing rose crystals leading up the mountain!'
  },
  {
    id: 2,
    title: 'The Moonlit Ruins',
    location: 'Temple of Starlight',
    storyIntro: 'Inside the starlit temple, two celestial pillars reflect each other’s light across a deep mirror pool.',
    partnerAClue: '🌌 Starlight Glyph: "Only those who share everything can cross. The keyword is PASSION."',
    partnerBClue: '✨ Pool Echo: "The keeper whispers the sacred year when two destinies became one: 2026."',
    riddleQuestion: 'What is the Temple of Starlight key (Word + Year)?',
    solutionCode: 'PASSION2026',
    epilogue: 'A shimmering bridge of starlight connects across the chasm, holding your hands tightly!'
  },
  {
    id: 3,
    title: 'The Eternal Heart Sanctuary',
    location: 'Summit of the Lost Island',
    storyIntro: 'At the very peak of the floating island rests the Eternal Couple Heart, glowing with infinite radiant warmth.',
    partnerAClue: '💎 Rose Crystal: "True love is FOREVER."',
    partnerBClue: '🕊️ Golden Dove: "Seal the bond with the infinity symbol word: ONE."',
    riddleQuestion: 'Speak the final couple oath (Word + Word):',
    solutionCode: 'FOREVERONE',
    epilogue: 'The Floating Castle shines brilliantly across the Loveverse sky! You both unlocked the Grand Mystery of Two Hearts!'
  }
];

interface MysteryState {
  currentChapter: number;
  solvedChapters: number[];
  sharedNotes: string;
  status: 'playing' | 'solved';
}

export function TwoHeartsMysteryGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<MysteryState | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'two-hearts-mystery') : null;

  // Partner 1 gets A clue, Partner 2 gets B clue
  const isPartnerA = space?.partner1Id === userData?.id;

  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            setGameState(JSON.parse(data.data));
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        const init: MysteryState = {
          currentChapter: 1,
          solvedChapters: [],
          sharedNotes: '',
          status: 'playing'
        };
        setDoc(docRef, {
          id: 'two-hearts-mystery',
          coupleSpaceId: space?.id || '',
          gameType: 'two-hearts-mystery',
          status: 'playing',
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/two-hearts-mystery`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/two-hearts-mystery`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const currentChapter = CHAPTERS.find(c => c.id === (gameState?.currentChapter || 1)) || CHAPTERS[0];
  const isChapterSolved = gameState?.solvedChapters?.includes(currentChapter.id);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef || !gameState) return;
    setErrorMsg('');

    const cleaned = inputCode.trim().toUpperCase().replace(/\s+/g, '');
    if (cleaned === currentChapter.solutionCode) {
      sound.playSuccess();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });

      const newSolved = [...(gameState.solvedChapters || []), currentChapter.id];
      const nextChapterNum = currentChapter.id < CHAPTERS.length ? currentChapter.id + 1 : currentChapter.id;

      const updated: MysteryState = {
        ...gameState,
        currentChapter: nextChapterNum,
        solvedChapters: Array.from(new Set(newSolved)),
        status: nextChapterNum === CHAPTERS.length && newSolved.length === CHAPTERS.length ? 'solved' : 'playing'
      };

      updateDoc(docRef, {
        data: JSON.stringify(updated),
        status: updated.status,
        updatedAt: Date.now()
      }).catch(console.error);

      setInputCode('');
    } else {
      sound.playPop();
      setErrorMsg('Incorrect passcode. Talk with your partner to combine both clues!');
    }
  };

  const handleResetAdventure = () => {
    if (!docRef) return;
    sound.playChime();
    const init: MysteryState = {
      currentChapter: 1,
      solvedChapters: [],
      sharedNotes: '',
      status: 'playing'
    };
    updateDoc(docRef, {
      data: JSON.stringify(init),
      status: 'playing',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Chapter Indicator Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-teal-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-xl shadow-xs text-white">
            🧩
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">Chapter {currentChapter.id}: {currentChapter.title}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {currentChapter.location}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Co-op Clue Solving Escape</p>
          </div>
        </div>

        <button
          onClick={handleResetAdventure}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>
      </div>

      {/* Story Atmosphere Card */}
      <div className="bg-gradient-to-br from-teal-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Story Chapter #{currentChapter.id}</span>
          </span>
          <h2 className="text-base font-serif font-bold text-teal-50">{currentChapter.title}</h2>
          <p className="text-xs text-teal-100/90 leading-relaxed italic">
            "{currentChapter.storyIntro}"
          </p>
        </div>

        {/* Private Clue Compartment */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-teal-300/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <Key className="w-3.5 h-3.5" />
              <span>YOUR SECRET CLUE ({isPartnerA ? 'Partner A' : 'Partner B'}):</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-teal-100">
              Tell Partner via Chat or Voice
            </span>
          </div>
          <p className="text-xs text-white font-medium p-2 bg-black/25 rounded-xl border border-white/10 leading-relaxed">
            {isPartnerA ? currentChapter.partnerAClue : currentChapter.partnerBClue}
          </p>
          <p className="text-[11px] text-teal-200/80 italic">
            💡 {partnerData?.displayName || 'Your partner'} has the other missing half of this riddle on their phone!
          </p>
        </div>

        {/* Passcode Chamber */}
        <div className="bg-black/30 rounded-2xl p-4 border border-teal-500/30 space-y-3">
          <p className="text-xs font-semibold text-teal-200">
            {currentChapter.riddleQuestion}
          </p>
          
          <form onSubmit={handleVerifyCode} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. PASSION2026"
              className="flex-1 px-3.5 py-2.5 bg-white/15 border border-teal-300/40 rounded-xl text-xs text-white placeholder-teal-200/50 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-500 text-teal-950 font-bold text-xs rounded-xl shadow-md disabled:opacity-40 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Unlock</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-300 font-semibold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}
        </div>
      </div>

      {/* Chapters Map & Progress */}
      <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-sm space-y-3">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Adventure Journey</span>
        <div className="grid grid-cols-3 gap-2">
          {CHAPTERS.map((ch) => {
            const isCompleted = gameState?.solvedChapters?.includes(ch.id);
            const isCurrent = currentChapter.id === ch.id;
            return (
              <div
                key={ch.id}
                className={`p-3 rounded-xl border text-center text-xs space-y-1 transition-all ${
                  isCompleted
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : isCurrent
                    ? 'bg-teal-50 border-teal-400 text-teal-900 font-semibold shadow-2xs'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                <span className="block text-base">{isCompleted ? '✅' : isCurrent ? '📍' : '🔒'}</span>
                <span className="block text-[11px] font-bold">Ch. {ch.id}</span>
                <span className="block text-[10px] truncate">{ch.location}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
