import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Send, HelpCircle, CheckCircle2 } from 'lucide-react';

const CIPHERS = [
  { emoji: '🍕 🛋️ 🎬 🫂', answer: 'Pizza and movie cuddling', hint: 'Cozy night in with dinner and a screen' },
  { emoji: '☕ 🥐 🌅 👫', answer: 'Morning coffee and bakery walk', hint: 'Sunrise breakfast together' },
  { emoji: '🚗 🏔️ ⛺ ✨', answer: 'Roadtrip mountain camping under stars', hint: 'Adventure weekend getaway' },
  { emoji: '🏖️ 🍦 🌊 🐚', answer: 'Beach date with ice cream', hint: 'Summer ocean breeze' },
  { emoji: '🕯️ 🍷 🍝 💃', answer: 'Candlelight romantic Italian dinner', hint: 'Fancy date night at home' }
];

interface EmojiCipherState {
  cipherIndex: number;
  guesses: Array<{ senderId: string; text: string; correct: boolean }>;
  solved: boolean;
}

export function EmojiCipherGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<EmojiCipherState | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [showHint, setShowHint] = useState(false);

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
          cipherIndex: 0,
          guesses: [],
          solved: false
        };
        setDoc(docRef, {
          id: 'emoji-decoder',
          coupleSpaceId: space?.id || '',
          gameType: 'emoji-decoder',
          status: 'playing',
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/emoji-decoder`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/emoji-decoder`));

    return () => unsubscribe();
  }, [docRef, space?.id]);

  const current = CIPHERS[(gameState?.cipherIndex || 0) % CIPHERS.length];

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef || !gameState || !guessInput.trim()) return;

    sound.playPop();
    const cleaned = guessInput.trim().toLowerCase();
    const isCorrect = cleaned.includes(current.answer.toLowerCase().slice(0, 8)) ||
                      current.answer.toLowerCase().includes(cleaned);

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

  const handleNextCipher = () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    setShowHint(false);
    const nextIdx = (gameState.cipherIndex + 1) % CIPHERS.length;
    const init: EmojiCipherState = {
      cipherIndex: nextIdx,
      guesses: [],
      solved: false
    };
    updateDoc(docRef, {
      data: JSON.stringify(init),
      status: 'playing',
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
                Puzzle #{((gameState?.cipherIndex || 0) % CIPHERS.length) + 1}
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
          onClick={handleNextCipher}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Next Riddle</span>
        </button>
      </div>

      {/* Emoji Chamber */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-6 border border-amber-200 shadow-md text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block">Secret Emoji Sequence</span>
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
