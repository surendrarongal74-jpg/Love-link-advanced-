import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Send, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const WORDS_POOL = [
  'Heart', 'First Kiss', 'Coffee Date', 'Holding Hands', 'Sunset', 'Puppy', 
  'Eiffel Tower', 'Pizza Slice', 'Teddy Bear', 'Stargazing', 'Rose Flower',
  'Cupcake', 'Engagement Ring', 'Warm Blanket', 'Campfire', 'Love Letter'
];

interface DrawGuessState {
  word: string;
  drawerId: string;
  strokes: string; // Serialized drawing paths or DataURL
  guesses: Array<{ senderId: string; text: string; correct: boolean; time: number }>;
  status: 'drawing' | 'solved' | 'timeout';
  round: number;
}

export function DrawItGuessItGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#e11d48');
  const [brushSize, setBrushSize] = useState(4);
  const [guessInput, setGuessInput] = useState('');
  const [gameState, setGameState] = useState<DrawGuessState | null>(null);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'draw-guess') : null;

  const isDrawer = gameState?.drawerId === userData?.id;

  // Listen to synchronized Firestore game state
  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            const parsed = JSON.parse(data.data) as DrawGuessState;
            setGameState(parsed);
            
            // If not drawer, render partner's drawing onto canvas
            if (canvasRef.current && parsed.strokes && parsed.drawerId !== userData?.id) {
              const img = new Image();
              img.onload = () => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx && canvasRef.current) {
                  ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                  ctx.drawImage(img, 0, 0);
                }
              };
              img.src = parsed.strokes;
            }
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        // Init default game
        const initialWord = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
        const initData: DrawGuessState = {
          word: initialWord,
          drawerId: userData?.id || '',
          strokes: '',
          guesses: [],
          status: 'drawing',
          round: 1
        };
        setDoc(docRef, {
          id: 'draw-guess',
          coupleSpaceId: space?.id || '',
          gameType: 'draw-guess',
          status: 'playing',
          currentTurn: userData?.id || '',
          data: JSON.stringify(initData),
          scores: JSON.stringify({}),
          round: 1,
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/draw-guess`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/draw-guess`));

    return () => unsubscribe();
  }, [docRef, space?.id, userData?.id]);

  const saveCanvasState = () => {
    if (!canvasRef.current || !docRef || !gameState) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 0.6);
    const updated = { ...gameState, strokes: dataUrl };
    updateDoc(docRef, {
      data: JSON.stringify(updated),
      updatedAt: Date.now()
    }).catch(console.error);
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || gameState?.status === 'solved') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer || gameState?.status === 'solved') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasState();
    }
  };

  const clearCanvas = () => {
    if (!isDrawer || !canvasRef.current || !docRef || !gameState) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const updated = { ...gameState, strokes: '' };
      updateDoc(docRef, {
        data: JSON.stringify(updated),
        updatedAt: Date.now()
      }).catch(console.error);
    }
  };

  const handleSendGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || !docRef || !gameState || isDrawer) return;

    sound.playPop();
    const guess = guessInput.trim();
    const isCorrect = guess.toLowerCase() === gameState.word.toLowerCase();

    const newGuesses = [
      ...(gameState.guesses || []),
      { senderId: userData?.id || '', text: guess, correct: isCorrect, time: Date.now() }
    ];

    const nextStatus = isCorrect ? 'solved' : gameState.status;
    const updated = {
      ...gameState,
      guesses: newGuesses,
      status: nextStatus
    };

    if (isCorrect) {
      sound.playSuccess();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    }

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: nextStatus === 'solved' ? 'solved' : 'playing',
      updatedAt: Date.now()
    }).catch(console.error);

    setGuessInput('');
  };

  const handleNextRound = () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    const nextWord = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
    const nextDrawer = isDrawer ? (partnerData?.id || userData?.id || '') : (userData?.id || '');
    
    // Clear local canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    const nextState: DrawGuessState = {
      word: nextWord,
      drawerId: nextDrawer,
      strokes: '',
      guesses: [],
      status: 'drawing',
      round: (gameState.round || 1) + 1
    };

    updateDoc(docRef, {
      data: JSON.stringify(nextState),
      status: 'playing',
      currentTurn: nextDrawer,
      round: nextState.round,
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Game Header Status Bar */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-rose-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-xl shadow-xs">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">Round {gameState?.round || 1}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {isDrawer ? 'You are drawing ✍️' : `${partnerData?.displayName || 'Partner'} is drawing ⏳`}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isDrawer ? (
                <>Secret word: <strong className="text-rose-600 font-bold uppercase tracking-wider">{gameState?.word}</strong></>
              ) : (
                'Watch the canvas and guess the word below!'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleNextRound}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Round</span>
        </button>
      </div>

      {/* Synchronized Drawing Canvas Card */}
      <div className="bg-white rounded-3xl p-3 border border-rose-200/80 shadow-md relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={360}
          height={260}
          onMouseDown={startDraw}
          onMouseMove={drawMove}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={drawMove}
          onTouchEnd={stopDraw}
          className={`w-full h-64 bg-amber-50/20 rounded-2xl touch-none border border-dashed border-rose-200 ${
            isDrawer ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* Solver Winner Splash */}
        <AnimatePresence>
          {gameState?.status === 'solved' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 rounded-3xl"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-2 animate-bounce">
                🎉
              </div>
              <h3 className="font-bold text-lg text-gray-900">Guessed Correctly!</h3>
              <p className="text-xs text-rose-600 font-semibold mb-3">
                The word was: <span className="uppercase font-extrabold">{gameState?.word}</span>
              </p>
              <button
                onClick={handleNextRound}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Next Turn & Switch Artists</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Artist Tool Palette */}
        {isDrawer && (
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-rose-100">
            <div className="flex items-center gap-1.5">
              {['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#18181b'].map((color) => (
                <button
                  key={color}
                  onClick={() => { sound.playPop(); setBrushColor(color); }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    brushColor === color ? 'scale-125 border-gray-900' : 'border-white'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="12"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-16 accent-rose-500"
              />
              <button
                onClick={clearCanvas}
                className="text-[11px] font-semibold px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guesses Log and Input */}
      <div className="bg-white/95 rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Guesses</span>
          <span className="text-[11px] text-rose-500 font-semibold">{gameState?.guesses?.length || 0} attempts</span>
        </div>

        {/* Chat / Guesses Bubble Stream */}
        <div className="max-h-32 overflow-y-auto space-y-1.5 scrollbar-none">
          {(!gameState?.guesses || gameState.guesses.length === 0) ? (
            <p className="text-xs text-gray-400 italic text-center py-2">No guesses yet. Take a guess!</p>
          ) : (
            gameState.guesses.map((g, idx) => (
              <div
                key={idx}
                className={`text-xs p-2 rounded-xl flex items-center justify-between ${
                  g.correct
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                    : 'bg-rose-50/70 text-gray-700'
                }`}
              >
                <span>
                  <strong>{g.senderId === userData?.id ? 'You' : (partnerData?.displayName || 'Partner')}:</strong> {g.text}
                </span>
                {g.correct && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
            ))
          )}
        </div>

        {/* Guess Input Bar (Guesser only) */}
        {!isDrawer ? (
          <form onSubmit={handleSendGuess} className="flex gap-2">
            <input
              type="text"
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder="Type your guess here..."
              className="flex-1 px-3.5 py-2.5 bg-rose-50/60 border border-rose-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
            <button
              type="submit"
              disabled={!guessInput.trim()}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Guess</span>
            </button>
          </form>
        ) : (
          <p className="text-center text-[11px] text-gray-400 italic">
            You are the artist! Keep sketching so your partner can solve it.
          </p>
        )}
      </div>
    </div>
  );
}
