import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { BottomNav } from '../components/BottomNav';
import { PLAYHOUSE_GAMES, PlayhouseGameDef } from '../data/playhouseGamesData';
import { DrawItGuessItGame } from '../components/playhouse/DrawItGuessItGame';
import { GuessMyAnswerGame } from '../components/playhouse/GuessMyAnswerGame';
import { TwoHeartsMysteryGame } from '../components/playhouse/TwoHeartsMysteryGame';
import { LoveMemoryMatchGame } from '../components/playhouse/LoveMemoryMatchGame';
import { OneWordStoryGame } from '../components/playhouse/OneWordStoryGame';
import { SyncHeartbeatsGame } from '../components/playhouse/SyncHeartbeatsGame';
import { LoveTicTacToeGame } from '../components/playhouse/LoveTicTacToeGame';
import { EmojiCipherGame } from '../components/playhouse/EmojiCipherGame';
import { CouplesTriviaGame } from '../components/playhouse/CouplesTriviaGame';
import { WouldYouRatherGame } from '../components/playhouse/WouldYouRatherGame';
import { TruthOrDareScreen } from './TruthOrDareScreen';
import { WhoLovesMoreScreen } from './WhoLovesMoreScreen';
import { sound } from '../lib/sound';
import { 
  Sparkles, Heart, ChevronLeft, Trophy, Flame, Play, 
  Gamepad2, Info, Star, Compass, Smile, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export function LoveversePlayhouseScreen() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Creativity' | 'Intimacy' | 'Mystery' | 'Memory' | 'Playful'>('All');

  const selectedGame = PLAYHOUSE_GAMES.find(g => g.id === selectedGameId);

  const filteredGames = activeTab === 'All' 
    ? PLAYHOUSE_GAMES 
    : PLAYHOUSE_GAMES.filter(g => g.category === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-pink-50/30 to-purple-50/50 pb-28 text-gray-800">
      {/* Immersive Top Castle Banner */}
      {!selectedGameId ? (
        <div className="relative pt-6 px-4 pb-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              onClick={() => sound.playPop()}
              className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-rose-200/80 flex items-center justify-center text-rose-600 shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100/80 rounded-full text-rose-700 text-xs font-bold border border-rose-200">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Two Hearts • One Little World</span>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-rose-200/80 flex items-center justify-center text-rose-500 shadow-sm">
              <Gamepad2 className="w-5 h-5" />
            </div>
          </div>

          {/* Hero Heroine Castle Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-rose-200/90 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 text-white p-6">
            <img
              src="https://images.openai.com/static-rsc-4/KQXgFLFePANk9f5wk9WlQrjAAGaWiaIjPWVLpPJhbYq-ABHYZWS5FsrfUunx_LuzyZMCHGLid0kiiDn4-3j-QYuqxMSXZTltVDMB6KHcoz7Txxs8D-MHqNkcGk46dJFO0-nFaXYSlN0OibecRMrPb9ZMmMWZoJo-VAa11bCpFtt0cScCeNam5Uuag6S9bjfN?purpose=fullsize"
              alt="Loveverse Playhouse Floating Castle"
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30 pointer-events-none"
            />
            <div className="relative z-10 space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-block">
                💖 Loveverse Playhouse
              </span>
              <h1 className="text-2xl font-serif font-black leading-tight text-white drop-shadow-sm">
                Top 10 Couple Games
              </h1>
              <p className="text-xs text-rose-100 max-w-xs leading-relaxed">
                Live interactive drawing, telepathic guessing, mystery islands, and sync pulses built exclusively for two.
              </p>
              
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[11px] font-bold bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>10 Playable Games</span>
                </span>
                <span className="text-[11px] font-bold bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-300" />
                  <span>Real-Time Co-Op</span>
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 mt-2">
            {(['All', 'Creativity', 'Intimacy', 'Mystery', 'Memory', 'Playful'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { sound.playPop(); setActiveTab(cat); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeTab === cat
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-300/40'
                    : 'bg-white/80 hover:bg-white text-gray-600 border border-rose-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Top 10 Games Grid */}
          <div className="space-y-3 mt-1">
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sound.playPop();
                  setSelectedGameId(game.id);
                }}
                className="bg-white rounded-3xl p-4 border border-rose-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden"
              >
                {/* Number Rank & Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${game.gradient} text-white flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform relative`}>
                  <span className="text-2xl">{game.icon}</span>
                  <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white text-rose-600 font-extrabold text-[10px] flex items-center justify-center border border-rose-200 shadow-xs">
                    {index + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-rose-600 transition-colors">
                      {game.title}
                    </h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                      {game.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                    {game.tagline}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                    <span>{game.category}</span>
                    <span>•</span>
                    <span className="text-rose-500 font-semibold flex items-center gap-0.5">
                      <Play className="w-2.5 h-2.5 fill-current" /> Play Now
                    </span>
                  </div>
                </div>

                {/* Right Arrow */}
                <div className="w-8 h-8 rounded-full bg-rose-50 group-hover:bg-rose-500 group-hover:text-white text-rose-500 flex items-center justify-center shrink-0 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Shortcuts to Truth or Dare & Who Loves More */}
          <div className="mt-5 pt-3 border-t border-rose-200/60">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 px-1">
              Classic Couple Arenas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/truth-or-dare"
                className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all flex items-center gap-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
                  🍾
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">Truth or Dare</h4>
                  <p className="text-[10px] text-gray-400">Spin the bottle</p>
                </div>
              </Link>

              <Link
                to="/who-loves-more"
                className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-2xs hover:shadow-md transition-all flex items-center gap-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-lg">
                  ❤️‍🔥
                </div>
                <div>
                  <h4 className="font-bold text-xs text-gray-900">Who Loves More</h4>
                  <p className="text-[10px] text-gray-400">Friendly debate</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Active Game Arena View */
        <div className="pt-4 px-4 space-y-4">
          {/* Active Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                sound.playPop();
                setSelectedGameId(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-rose-200 text-rose-600 text-xs font-bold shadow-sm hover:bg-rose-50 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Playhouse</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-gray-700">Live Couple Sync</span>
            </div>
          </div>

          {/* Active Game Title Bar */}
          <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-sm flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedGame?.gradient} flex items-center justify-center text-2xl text-white shadow-xs`}>
              {selectedGame?.icon}
            </div>
            <div>
              <h1 className="font-serif font-bold text-base text-gray-900 leading-snug">
                {selectedGame?.title}
              </h1>
              <p className="text-xs text-gray-500">{selectedGame?.tagline}</p>
            </div>
          </div>

          {/* Render Specific Game Interactive Component */}
          {selectedGameId === 'draw-guess' && <DrawItGuessItGame />}
          {selectedGameId === 'guess-answer' && <GuessMyAnswerGame />}
          {selectedGameId === 'mystery-island' && <TwoHeartsMysteryGame />}
          {selectedGameId === 'memory-match' && <LoveMemoryMatchGame />}
          {selectedGameId === 'story-weaver' && <OneWordStoryGame />}
          {selectedGameId === 'sync-pulse' && <SyncHeartbeatsGame />}
          {selectedGameId === 'love-tic-tac-toe' && <LoveTicTacToeGame />}
          {selectedGameId === 'emoji-decoder' && <EmojiCipherGame />}
          {selectedGameId === 'couples-trivia' && <CouplesTriviaGame />}
          {selectedGameId === 'would-you-rather' && <WouldYouRatherGame />}

          {/* Rules & Features Details Drawer */}
          <div className="bg-white/90 rounded-3xl p-5 border border-rose-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">How to Play & Features</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {selectedGame?.description}
            </p>
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-gray-700 block">Game Rules:</span>
              <ul className="space-y-1 text-xs text-gray-600">
                {selectedGame?.rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
