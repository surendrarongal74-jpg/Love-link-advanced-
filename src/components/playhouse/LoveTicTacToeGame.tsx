import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Trophy } from 'lucide-react';

const DARES = [
  'Give partner a 5-minute shoulder massage',
  'Sing 30 seconds of a love song in voice note',
  'Cook or order partner’s favorite breakfast tomorrow',
  'Send 3 honest compliments you never said out loud',
  'Let partner choose your movie tonight',
  'Take a silly selfie right now and send in chat',
  'Promise a spontaneous date within 7 days',
  'Wear whatever outfit partner picks on next date',
  'Whisper the sweetest secret in partner’s ear'
];

interface TTTState {
  board: Array<string | null>; // 9 cells: 'X' | 'O' | null
  currentTurn: string;
  winner: string | null;
  wager: string;
  round: number;
}

export function LoveTicTacToeGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<TTTState | null>(null);

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'love-tic-tac-toe') : null;

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
        const init: TTTState = {
          board: Array(9).fill(null),
          currentTurn: userData?.id || '',
          winner: null,
          wager: DARES[0],
          round: 1
        };
        setDoc(docRef, {
          id: 'love-tic-tac-toe',
          coupleSpaceId: space?.id || '',
          gameType: 'love-tic-tac-toe',
          status: 'playing',
          currentTurn: userData?.id || '',
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/love-tic-tac-toe`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/love-tic-tac-toe`));

    return () => unsubscribe();
  }, [docRef, space?.id, userData?.id]);

  const isMyTurn = gameState?.currentTurn === userData?.id;
  const mySymbol = space?.partner1Id === userData?.id ? '💖' : '🌟';
  const partnerSymbol = space?.partner1Id === userData?.id ? '🌟' : '💖';

  const checkWinner = (b: Array<string | null>): string | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (const [a, b1, c] of lines) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
        return b[a];
      }
    }
    return null;
  };

  const handleCellClick = (idx: number) => {
    if (!docRef || !gameState || !isMyTurn || gameState.board[idx] || gameState.winner) return;

    sound.playPop();
    const newBoard = [...gameState.board];
    newBoard[idx] = mySymbol;

    const winnerSym = checkWinner(newBoard);
    let nextTurn = gameState.currentTurn;
    let nextWinner: string | null = null;

    if (winnerSym) {
      sound.playSuccess();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      nextWinner = userData?.id || 'me';
    } else {
      nextTurn = (partnerData?.id && gameState.currentTurn === userData?.id) ? partnerData.id : (userData?.id || '');
    }

    const updated: TTTState = {
      ...gameState,
      board: newBoard,
      currentTurn: nextTurn,
      winner: nextWinner
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      currentTurn: nextTurn,
      status: nextWinner ? 'won' : 'playing',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  const handleRematch = () => {
    if (!docRef || !gameState) return;
    sound.playChime();
    const nextDare = DARES[Math.floor(Math.random() * DARES.length)];
    const init: TTTState = {
      board: Array(9).fill(null),
      currentTurn: userData?.id || '',
      winner: null,
      wager: nextDare,
      round: (gameState.round || 1) + 1
    };
    updateDoc(docRef, {
      data: JSON.stringify(init),
      currentTurn: userData?.id || '',
      status: 'playing',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-indigo-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-xs text-white">
            ❌⭕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {gameState?.winner ? 'Match Ended!' : isMyTurn ? `Your Turn (${mySymbol})` : `${partnerData?.displayName || 'Partner'}'s Turn (${partnerSymbol})`}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Prize Wager: <strong className="text-indigo-600 font-bold">{gameState?.wager}</strong></p>
          </div>
        </div>

        <button
          onClick={handleRematch}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rematch</span>
        </button>
      </div>

      {/* 3x3 Grid with Romantic Per-Cell Dares */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl p-5 border border-indigo-100 shadow-md space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {gameState?.board?.map((cell, idx) => (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              disabled={Boolean(cell || !isMyTurn || gameState?.winner)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-3xl font-extrabold border-2 transition-all ${
                cell
                  ? 'bg-white border-indigo-300 shadow-sm'
                  : 'bg-white/70 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-400 active:scale-95'
              }`}
            >
              <span>{cell || ''}</span>
              {!cell && (
                <span className="text-[9px] text-gray-400 font-medium line-clamp-1 px-1 mt-0.5">
                  {DARES[idx % DARES.length].slice(0, 15)}...
                </span>
              )}
            </button>
          ))}
        </div>

        {gameState?.winner && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white text-center shadow-lg space-y-2 mt-3">
            <Trophy className="w-7 h-7 mx-auto text-amber-300 animate-bounce" />
            <h3 className="font-bold text-sm">
              {gameState.winner === userData?.id ? 'You Won the Round! 🎉' : `${partnerData?.displayName || 'Partner'} Won! 👑`}
            </h3>
            <p className="text-xs text-indigo-100 font-medium">
              Prize to be fulfilled: <strong>"{gameState.wager}"</strong>
            </p>
            <button
              onClick={handleRematch}
              className="px-4 py-2 bg-white text-indigo-900 rounded-xl font-bold text-xs shadow-md mt-2"
            >
              Play Next Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
