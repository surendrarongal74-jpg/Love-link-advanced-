import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { generateAiraGameContent } from '../../lib/ai';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Send, HelpCircle, CheckCircle2, Wand2 } from 'lucide-react';

interface CipherItem {
  emoji: string;
  answer: string;
  hint: string;
}

const FALLBACK_CIPHERS: CipherItem[] = [
  { emoji: '🍕 🛋️ 🎬 🫂', answer: 'Pizza and movie cuddling', hint: 'Cozy night in with dinner and a screen' },
  { emoji: '☕ 🥐 🌅 👫', answer: 'Morning coffee and bakery walk', hint: 'Sunrise breakfast together' },
  { emoji: '🚗 🏔️ ⛺ ✨', answer: 'Roadtrip mountain camping under stars', hint: 'Adventure weekend getaway' },
  { emoji: '🏖️ 🍦 🌊 🐚', answer: 'Beach date with ice cream', hint: 'Summer ocean breeze' },
  { emoji: '🕯️ 🍷 🍝 💃', answer: 'Candlelight romantic Italian dinner', hint: 'Fancy date night at home' }
];

interface EmojiCipherState {
  level: number;
  currentCipher: CipherItem;
  guesses: Array<{ senderId: string; text: string; correct: boolean }>;
  solved: boolean;
}

export function EmojiCipherGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<EmojiCipherState | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'emoji-decoder') : null;

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
        const init: EmojiCipherState = {
          level: 1,
          currentCipher: FALLBACK_CIPHERS[0],
          guesses: [],
          solved: false
        };
        setDoc(docRef, {
          id: 'emoji-decoder',
          coupleSpaceId: space?.id || '',
          gameType: 'emoji-decoder',
          status: 'playing',
          round: 1,
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/emoji-decoder`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/emoji-decoder`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const current = gameState?.currentCipher || FALLBACK_CIPHERS[0];

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef || !gameState || !guessInput.trim()) return;

    sound.playPop();
    const cleaned = guessInput.trim().toLowerCase();
    const answerWords = current.answer.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const hasWordMatch = answerWords.some(w => cleaned.includes(w));
    const isCorrect = cleaned.includes(current.answer.toLowerCase().slice(0, 8)) ||
                      current.answer.toLowerCase().includes(cleaned) ||
                      hasWordMatch;

    const newGuesses = [
      ...(gameState.guesses || []),
      { senderId: userData?.id || '', text: guessInput.trim(), correct: isCorrect }
    ];

    if (isCorrect) {
      sound.playSuccess();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }

    const updated: EmojiCipherState = {
      ...gameState,
      guesses: newGuesses,
      solved: isCorrect || gameState.solved
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: isCorrect ? 'solved' : 'playing',
      updatedAt: Date.now()
    }).catch(console.error);

    setGuessInput('');
  };

  const handleNextLevel = async () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    setShowHint(false);
    setIsGenerating(true);

    const nextLevel = (gameState.level || 1) + 1;
    let nextCipher = FALLBACK_CIPHERS[nextLevel % FALLBACK_CIPHERS.length];

    try {
      const airaItem = await generateAiraGameContent<CipherItem>('emoji-decoder', nextLevel);
      if (airaItem?.emoji && airaItem?.answer) {
        nextCipher = airaItem;
      }
    } catch (e) {
      console.warn('AIRA generation failed for emoji-decoder:', e);
    } finally {
      setIsGenerating(false);
    }

    const updated: EmojiCipherState = {
      level: nextLevel,
      currentCipher: nextCipher,
      guesses: [],
      solved: false
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: 'playing',
      round: nextLevel,
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 flex items-center justify-center text-xl shadow-xs text-white">
            🕵️‍♀️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                Emoji Cipher Level {gameState?.level || 1}
              </span>
              {gameState?.solved && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Decoded!
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500">Decode the hidden romantic date or phrase</p>
          </div>
        </div>

        <button
          onClick={handleNextLevel}
          disabled={isGenerating}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          <span>{isGenerating ? 'AIRA Riddle...' : 'Next Level'}</span>
        </button>
      </div>

      {/* Emoji Chamber */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-6 border border-amber-200 shadow-md text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block">
          AIRA Emoji Level {gameState?.level || 1}
        </span>
        <div className="text-4xl py-3 tracking-widest filter drop-shadow-sm">
          {current.emoji}
        </div>

        {showHint ? (
          <p className="text-xs bg-amber-100/70 p-2.5 rounded-xl text-amber-900 font-medium">
            💡 Hint: {current.hint}
          </p>
        ) : (
          <button
            onClick={() => setShowHint(true)}
            className="text-xs text-amber-700 hover:underline font-semibold flex items-center justify-center gap-1 mx-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Show Clue / Hint</span>
          </button>
        )}

        {gameState?.solved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold">
            🎉 Solved Answer: "{current.answer}"
          </div>
        )}
      </div>

      {/* Live Guesses stream */}
      {Boolean(gameState?.guesses && gameState.guesses.length > 0) && (
        <div className="bg-white/80 rounded-2xl p-3 border border-amber-100 space-y-1.5 max-h-28 overflow-y-auto">
          {gameState?.guesses.map((g, idx) => (
            <div
              key={idx}
              className={`text-xs p-2 rounded-xl flex items-center justify-between ${
                g.correct ? 'bg-emerald-50 text-emerald-800 font-bold' : 'bg-amber-50/50 text-gray-700'
              }`}
            >
              <span>
                <strong>{g.senderId === userData?.id ? 'You' : (partnerData?.displayName || 'Partner')}:</strong> {g.text}
              </span>
              {g.correct && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleGuess} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm flex gap-2">
        <input
          type="text"
          value={guessInput}
          onChange={(e) => setGuessInput(e.target.value)}
          placeholder="What do these emojis mean? Guess here..."
          className="flex-1 px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <button
          type="submit"
          disabled={!guessInput.trim()}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Guess</span>
        </button>
      </form>
    </div>
  );
}
