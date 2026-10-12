import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { generateAiraGameContent } from '../../lib/ai';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Send, CheckCircle2, Trophy, Flame, Wand2, Lightbulb, Undo } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FALLBACK_WORDS = [
  'Heart', 'First Kiss', 'Coffee Date', 'Holding Hands', 'Sunset', 'Puppy', 
  'Eiffel Tower', 'Pizza Slice', 'Teddy Bear', 'Stargazing', 'Rose Flower',
  'Cupcake', 'Engagement Ring', 'Warm Blanket', 'Campfire', 'Love Letter',
  'Moonlit Walk', 'Breakfast in Bed', 'Ferris Wheel', 'Matcha Latte', 'Seashell'
];

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  size: number;
  points: Point[];
}

interface DrawGuessState {
  word: string;
  hint?: string;
  drawerId: string;
  strokesData: Stroke[];
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
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Current stroke being actively drawn
  const currentStrokeRef = useRef<Stroke | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const syncTimeoutRef = useRef<any>(null);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'draw-guess') : null;
  const isDrawer = gameState?.drawerId === userData?.id;

  // Render stroke array onto canvas
  const redrawCanvas = useCallback((strokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;

      const first = stroke.points[0];
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < stroke.points.length; i++) {
        const pt = stroke.points[i];
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    });
  }, []);

  // Listen to Firestore game state with high-fidelity sync
  useEffect(() => {
    if (!docRef) return;
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.data) {
          try {
            const parsed = JSON.parse(data.data) as DrawGuessState;
            setGameState(parsed);
            strokesRef.current = parsed.strokesData || [];

            // Redraw on canvas for both drawer and guesser
            redrawCanvas(parsed.strokesData || []);
          } catch (e) {
            console.error('Error parsing draw-guess state:', e);
          }
        }
      } else {
        // Init default game at Level / Round 1
        const initialWord = FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
        const initData: DrawGuessState = {
          word: initialWord,
          hint: 'Romantic everyday token',
          drawerId: userData?.id || '',
          strokesData: [],
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

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [docRef, space?.id, userData?.id, redrawCanvas]);

  // Synchronize stroke updates to Firestore
  const syncStrokesToFirestore = (updatedStrokes: Stroke[]) => {
    if (!docRef || !gameState || !isDrawer) return;

    // Quick debounce to keep network snappy and stay well within Firestore rate limits
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      const updated: DrawGuessState = {
        ...gameState,
        strokesData: updatedStrokes
      };
      updateDoc(docRef, {
        data: JSON.stringify(updated),
        updatedAt: Date.now()
      }).catch(err => console.error('Error syncing strokes:', err));
    }, 80);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || gameState?.status === 'solved') return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    setIsDrawing(true);
    const newStroke: Stroke = {
      color: brushColor,
      size: brushSize,
      points: [pt]
    };
    currentStrokeRef.current = newStroke;

    const nextStrokes = [...strokesRef.current, newStroke];
    strokesRef.current = nextStrokes;
    redrawCanvas(nextStrokes);
  };

  const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer || !currentStrokeRef.current || gameState?.status === 'solved') return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    currentStrokeRef.current.points.push(pt);
    redrawCanvas(strokesRef.current);
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    currentStrokeRef.current = null;
    syncStrokesToFirestore(strokesRef.current);
  };

  const clearCanvas = () => {
    if (!isDrawer || !docRef || !gameState) return;
    strokesRef.current = [];
    redrawCanvas([]);
    const updated: DrawGuessState = {
      ...gameState,
      strokesData: []
    };
    updateDoc(docRef, {
      data: JSON.stringify(updated),
      updatedAt: Date.now()
    }).catch(console.error);
  };

  const undoLastStroke = () => {
    if (!isDrawer || !docRef || !gameState || strokesRef.current.length === 0) return;
    sound.playPop();
    const updatedStrokes = strokesRef.current.slice(0, -1);
    strokesRef.current = updatedStrokes;
    redrawCanvas(updatedStrokes);
    syncStrokesToFirestore(updatedStrokes);
  };

  const handleSendGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || !docRef || !gameState || isDrawer) return;

    sound.playPop();
    const guessText = guessInput.trim();
    // Fuzzy normalized match
    const cleanGuess = guessText.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanWord = gameState.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isCorrect = cleanGuess === cleanWord;

    const newGuesses = [
      ...(gameState.guesses || []),
      { senderId: userData?.id || '', text: guessText, correct: isCorrect, time: Date.now() }
    ];

    const nextStatus = isCorrect ? 'solved' : gameState.status;
    const updated: DrawGuessState = {
      ...gameState,
      guesses: newGuesses,
      status: nextStatus
    };

    if (isCorrect) {
      sound.playSuccess();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    }

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      status: nextStatus === 'solved' ? 'solved' : 'playing',
      updatedAt: Date.now()
    }).catch(console.error);

    setGuessInput('');
  };

  // Next round with AIRA unlimited generative levels
  const handleNextRound = async () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    setIsGeneratingWord(true);

    const nextRound = (gameState.round || 1) + 1;
    const nextDrawer = isDrawer ? (partnerData?.id || userData?.id || '') : (userData?.id || '');

    // Ask AIRA for an unlimited, fresh Level prompt
    let newWord = FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
    let newHint = 'A romantic token';

    try {
      const airaContent = await generateAiraGameContent<{ word: string; hint: string }>('draw-guess', nextRound);
      if (airaContent?.word) {
        newWord = airaContent.word;
        newHint = airaContent.hint || newHint;
      }
    } catch (e) {
      console.warn('AIRA generation fallback:', e);
    } finally {
      setIsGeneratingWord(false);
    }

    strokesRef.current = [];
    redrawCanvas([]);

    const nextState: DrawGuessState = {
      word: newWord,
      hint: newHint,
      drawerId: nextDrawer,
      strokesData: [],
      guesses: [],
      status: 'drawing',
      round: nextRound
    };

    updateDoc(docRef, {
      data: JSON.stringify(nextState),
      status: 'playing',
      currentTurn: nextDrawer,
      round: nextRound,
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Game Header Status Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-rose-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-xl shadow-xs">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">Level {gameState?.round || 1}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                {isDrawer ? 'You are drawing ✍️' : `${partnerData?.displayName || 'Partner'} is drawing ⏳`}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              {isDrawer ? (
                <>Secret word: <strong className="text-rose-600 font-bold uppercase tracking-wider">{gameState?.word}</strong></>
              ) : (
                'Watch the canvas live & guess in the box below!'
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleNextRound}
          disabled={isGeneratingWord}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-semibold active:scale-95 transition-all disabled:opacity-50"
        >
          {isGeneratingWord ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5 text-rose-500" />
          )}
          <span>{isGeneratingWord ? 'AIRA Thinking...' : 'New Level'}</span>
        </button>
      </div>

      {/* Secret Word Hint / Details for Drawer or Guesser */}
      {gameState?.hint && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs text-amber-800">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isDrawer ? (
                <span>Word Hint: <em>{gameState.hint}</em></span>
              ) : showHint ? (
                <span>Hint: <em>{gameState.hint}</em></span>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="underline font-semibold hover:text-amber-900"
                >
                  Need a hint from AIRA? Click to reveal!
                </button>
              )}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">AIRA Level {gameState?.round || 1}</span>
        </div>
      )}

      {/* Synchronized Drawing Canvas Card */}
      <div className="bg-white rounded-3xl p-3 border border-rose-200/80 shadow-md relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          onMouseDown={startDraw}
          onMouseMove={drawMove}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={drawMove}
          onTouchEnd={stopDraw}
          className={`w-full h-72 bg-amber-50/25 rounded-2xl touch-none border border-dashed border-rose-200 ${
            isDrawer ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />

        {/* Live sync badge */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-2xs border border-rose-100 text-[10px] font-bold text-gray-700 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Synchronized</span>
        </div>

        {/* Solver Winner Splash */}
        <AnimatePresence>
          {gameState?.status === 'solved' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 rounded-3xl"
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
                disabled={isGeneratingWord}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>{isGeneratingWord ? 'AIRA Generating Level...' : 'Next Turn & Switch Artists'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Artist Tool Palette */}
        {isDrawer && (
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-rose-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#18181b'].map((color) => (
                <button
                  key={color}
                  onClick={() => { sound.playPop(); setBrushColor(color); }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    brushColor === color ? 'scale-125 border-gray-900 shadow-sm' : 'border-white'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min="2"
                max="14"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-14 accent-rose-500"
              />
              <button
                onClick={undoLastStroke}
                title="Undo last stroke"
                className="text-[11px] font-semibold px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-0.5"
              >
                <Undo className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                onClick={clearCanvas}
                className="text-[11px] font-semibold px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guesses Log and Live Input */}
      <div className="bg-white/95 rounded-2xl p-4 border border-rose-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Guesses Stream</span>
          <span className="text-[11px] text-rose-500 font-semibold">{gameState?.guesses?.length || 0} attempts</span>
        </div>

        {/* Chat / Guesses Bubble Stream */}
        <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-none">
          {(!gameState?.guesses || gameState.guesses.length === 0) ? (
            <p className="text-xs text-gray-400 italic text-center py-2">
              {isDrawer ? 'Waiting for your partner to make guesses...' : 'No guesses yet! Type what you see on the canvas.'}
            </p>
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
              placeholder="Type what you see (e.g. Heart)..."
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
            You are the artist! Keep sketching so your partner can guess live.
          </p>
        )}
      </div>
    </div>
  );
}
