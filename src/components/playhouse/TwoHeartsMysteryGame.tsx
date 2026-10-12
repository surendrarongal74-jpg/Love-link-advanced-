import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { generateAiraGameContent } from '../../lib/ai';
import confetti from 'canvas-confetti';
import { Sparkles, MapPin, Key, Compass, CheckCircle2, ChevronRight, RefreshCw, AlertCircle, Wand2 } from 'lucide-react';
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

const FALLBACK_CHAPTERS: Chapter[] = [
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
  currentChapterNum: number;
  chapterData: Chapter;
  solvedChapters: number[];
  status: 'playing' | 'solved';
}

export function TwoHeartsMysteryGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<MysteryState | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'two-hearts-mystery') : null;
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
          currentChapterNum: 1,
          chapterData: FALLBACK_CHAPTERS[0],
          solvedChapters: [],
          status: 'playing'
        };
        setDoc(docRef, {
          id: 'two-hearts-mystery',
          coupleSpaceId: space?.id || '',
          gameType: 'two-hearts-mystery',
          status: 'playing',
          round: 1,
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/two-hearts-mystery`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/two-hearts-mystery`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const currentChapter = gameState?.chapterData || FALLBACK_CHAPTERS[0];
  const isChapterSolved = gameState?.solvedChapters?.includes(currentChapter.id);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef || !gameState) return;
    setErrorMsg('');

    const cleaned = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const targetCode = currentChapter.solutionCode.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleaned === targetCode) {
      sound.playSuccess();
      confetti({ particleCount: 95, spread: 80, origin: { y: 0.6 } });

      const newSolved = [...(gameState.solvedChapters || []), currentChapter.id];
      const updated: MysteryState = {
        ...gameState,
        solvedChapters: Array.from(new Set(newSolved)),
        status: 'solved'
      };

      updateDoc(docRef, {
        data: JSON.stringify(updated),
        status: 'solved',
        updatedAt: Date.now()
      }).catch(console.error);

      setInputCode('');
    } else {
      sound.playPop();
      setErrorMsg('Incorrect passcode. Talk with your partner to combine both clues!');
    }
  };

  const handleNextAiraChapter = async () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    setIsGenerating(true);

    const nextChapNum = (gameState.currentChapterNum || 1) + 1;
    let newChapter: Chapter = {
      ...FALLBACK_CHAPTERS[(nextChapNum - 1) % FALLBACK_CHAPTERS.length],
      id: nextChapNum
    };

    try {
      const airaChapter = await generateAiraGameContent<Omit<Chapter, 'id'>>('two-hearts-mystery', nextChapNum);
      if (airaChapter?.title && airaChapter?.solutionCode) {
        newChapter = {
          ...airaChapter,
          id: nextChapNum
        };
      }
    } catch (e) {
      console.warn('AIRA generation failed for mystery:', e);
    } finally {
      setIsGenerating(false);
    }

    const updated: MysteryState = {
      currentChapterNum: nextChapNum,
      chapterData: newChapter,
      solvedChapters: gameState.solvedChapters || [],
      status: 'playing'
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: 'playing',
      round: nextChapNum,
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
              <span className="text-xs font-bold text-gray-800">Chapter {gameState?.currentChapterNum || 1}: {currentChapter.title}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {currentChapter.location}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Unlimited Mystery Chapters by AIRA</p>
          </div>
        </div>

        <button
          onClick={handleNextAiraChapter}
          disabled={isGenerating}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          <span>{isGenerating ? 'AIRA Story...' : 'New Chapter'}</span>
        </button>
      </div>

      {/* Story Atmosphere Card */}
      <div className="bg-gradient-to-br from-teal-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Story Chapter #{gameState?.currentChapterNum || 1}</span>
          </span>
          <h2 className="text-lg font-serif font-bold text-white drop-shadow-xs">
            {currentChapter.title}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed italic">
            "{currentChapter.storyIntro}"
          </p>
        </div>

        {/* Asymmetric Clue Box */}
        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-teal-200">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-300" />
              <span>Your Private Half of the Clue:</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">
              {isPartnerA ? 'Partner A' : 'Partner B'}
            </span>
          </div>
          <p className="text-xs font-medium text-amber-100 bg-black/20 p-3 rounded-xl border border-white/10 leading-relaxed">
            {isPartnerA ? currentChapter.partnerAClue : currentChapter.partnerBClue}
          </p>
          <p className="text-[10px] text-slate-400 italic text-center">
            🔒 Your partner sees the other half of this riddle! Call or message them to put your clues together.
          </p>
        </div>

        {/* Riddle question */}
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-slate-200">
            {currentChapter.riddleQuestion}
          </p>
          
          <form onSubmit={handleVerifyCode} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Enter shared passcode..."
              className="flex-1 px-3.5 py-2.5 bg-black/30 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 uppercase tracking-wider"
            />
            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40"
            >
              Unlock
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-rose-300 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          {isChapterSolved && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-xs text-emerald-200 space-y-2">
              <p className="font-bold flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Chapter Solved!
              </p>
              <p className="italic text-[11px] leading-relaxed">
                "{currentChapter.epilogue}"
              </p>
              <button
                onClick={handleNextAiraChapter}
                disabled={isGenerating}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'AIRA Unfolding Chapter...' : `Embark on Chapter ${(gameState?.currentChapterNum || 1) + 1}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
