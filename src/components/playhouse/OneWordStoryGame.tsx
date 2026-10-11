import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/errorHandler';
import { sound } from '../../lib/sound';
import { Sparkles, RefreshCw, Send, BookOpen } from 'lucide-react';

interface StoryState {
  title: string;
  theme: string;
  storyUnits: Array<{ senderId: string; text: string; time: number }>;
  currentTurn: string;
}

const THEMES = [
  'How We Stole The Moon',
  'Our Rainy Cafe Secret',
  'The Day We Found A Magic Puppy',
  'Our Future Castle On The Clouds',
  'The Mystery Midnight Roadtrip'
];

export function OneWordStoryGame() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [gameState, setGameState] = useState<StoryState | null>(null);
  const [wordInput, setWordInput] = useState('');

  const docRef = space?.id ? doc(db, `coupleSpaces/${space.id}/playhouseGames`, 'story-weaver') : null;

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
        const init: StoryState = {
          title: THEMES[0],
          theme: 'Romantic Adventure',
          storyUnits: [
            { senderId: 'system', text: 'Once upon a starlit night in our favorite secret park,', time: Date.now() }
          ],
          currentTurn: userData?.id || ''
        };
        setDoc(docRef, {
          id: 'story-weaver',
          coupleSpaceId: space?.id || '',
          gameType: 'story-weaver',
          status: 'playing',
          currentTurn: userData?.id || '',
          data: JSON.stringify(init),
          updatedAt: Date.now()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `coupleSpaces/${space?.id}/playhouseGames/story-weaver`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `coupleSpaces/${space?.id}/playhouseGames/story-weaver`));

    return () => unsubscribe();
  }, [docRef, space?.id, userData?.id]);

  const isMyTurn = gameState?.currentTurn === userData?.id;

  const handleAddSentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef || !gameState || !wordInput.trim() || !isMyTurn) return;

    sound.playPop();
    const newUnit = {
      senderId: userData?.id || '',
      text: wordInput.trim(),
      time: Date.now()
    };

    const nextTurn = (partnerData?.id && gameState.currentTurn === userData?.id) ? partnerData.id : (userData?.id || '');

    const updated: StoryState = {
      ...gameState,
      storyUnits: [...(gameState.storyUnits || []), newUnit],
      currentTurn: nextTurn
    };

    updateDoc(docRef, {
      data: JSON.stringify(updated),
      currentTurn: nextTurn,
      updatedAt: Date.now()
    }).catch(console.error);

    setWordInput('');
  };

  const handleNewStory = () => {
    if (!docRef) return;
    sound.playChime();
    const nextTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    const init: StoryState = {
      title: nextTheme,
      theme: 'Romantic Fairy Tale',
      storyUnits: [
        { senderId: 'system', text: `It was a crisp autumn morning when both of us decided to`, time: Date.now() }
      ],
      currentTurn: userData?.id || ''
    };
    updateDoc(docRef, {
      data: JSON.stringify(init),
      currentTurn: userData?.id || '',
      updatedAt: Date.now()
    }).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-xs text-white">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                {isMyTurn ? 'Your Turn to Write ✍️' : `Waiting for ${partnerData?.displayName || 'Partner'} ⏳`}
              </span>
            </div>
            <p className="text-[11px] text-gray-500">Theme: <strong className="text-amber-800">{gameState?.title}</strong></p>
          </div>
        </div>

        <button
          onClick={handleNewStory}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-semibold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Tale</span>
        </button>
      </div>

      {/* Parchment Book Layout */}
      <div className="bg-gradient-to-b from-amber-50/90 to-orange-50/60 rounded-3xl p-5 border border-amber-200 shadow-md space-y-4 min-h-64">
        <div className="border-b border-amber-200/80 pb-3 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 block">Our Living Fairy Tale</span>
          <h2 className="font-serif text-base font-bold text-amber-950">"{gameState?.title}"</h2>
        </div>

        {/* Continuous Story Text */}
        <div className="text-xs font-serif leading-relaxed text-gray-800 space-y-2 max-h-72 overflow-y-auto scrollbar-none">
          {gameState?.storyUnits?.map((unit, idx) => (
            <span
              key={idx}
              className={`inline mr-1.5 p-1 rounded-md transition-colors ${
                unit.senderId === 'system'
                  ? 'text-gray-500 italic'
                  : unit.senderId === userData?.id
                  ? 'bg-rose-100/70 text-rose-950 font-medium'
                  : 'bg-amber-200/60 text-amber-950 font-medium'
              }`}
            >
              {unit.text}{' '}
            </span>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleAddSentence} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm flex gap-2">
        <input
          type="text"
          value={wordInput}
          disabled={!isMyTurn}
          onChange={(e) => setWordInput(e.target.value)}
          placeholder={isMyTurn ? "Add 1-3 words or a short line..." : `Waiting for ${partnerData?.displayName || 'partner'}...`}
          className="flex-1 px-3.5 py-2.5 bg-amber-50/40 border border-amber-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!wordInput.trim() || !isMyTurn}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1 shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
}
