import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { useTheme, LOVEVERSE_THEMES } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { PLAYHOUSE_GAMES, PlayhouseGameDef } from '../data/playhouseGamesData';
import { DrawItGuessItGame } from '../components/playhouse/DrawItGuessItGame';
import { GuessMyAnswerGame } from '../components/playhouse/GuessMyAnswerGame';
import { TwoHeartsMysteryGame } from '../components/playhouse/TwoHeartsMysteryGame';
import { LoveMemoryMatchGame } from '../components/playhouse/LoveMemoryMatchGame';
import { OneWordStoryGame } from '../components/playhouse/OneWordStoryGame';
import { HeartbeatHarmonyGame } from '../components/playhouse/HeartbeatHarmonyGame';
import { ConstellationConnectGame } from '../components/playhouse/ConstellationConnectGame';
import { LoveTicTacToeGame } from '../components/playhouse/LoveTicTacToeGame';
import { EmojiCipherGame } from '../components/playhouse/EmojiCipherGame';
import { CouplesTriviaGame } from '../components/playhouse/CouplesTriviaGame';
import { WouldYouRatherGame } from '../components/playhouse/WouldYouRatherGame';
import { SpinTheWheelGame } from '../components/playhouse/SpinTheWheelGame';
import { CompatibilityChallengeGame } from '../components/playhouse/CompatibilityChallengeGame';
import { CoupleChallengesGame } from '../components/playhouse/CoupleChallengesGame';
import { MemoryGuessGame } from '../components/playhouse/MemoryGuessGame';
import { sound } from '../lib/sound';
import { 
  Sparkles, Heart, ChevronLeft, Trophy, Flame, Play, 
  Gamepad2, Info, Star, Compass, Smile, ArrowRight, Lock, Coins, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export function LoveversePlayhouseScreen() {
  const { userData } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { wallet, inventory, spendCoins } = useLoveCoins();
  const themeContext = useTheme();
  const theme = themeContext?.theme || LOVEVERSE_THEMES.theme_cloud_romance;
  const navigate = useNavigate();

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'All' | 'Creativity' | 'Intimacy' | 'Mystery' | 'Memory' | 'Playful' | 'Rhythm'>('All');
  const [confirmUnlockGame, setConfirmUnlockGame] = useState<PlayhouseGameDef | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [previewLockedGame, setPreviewLockedGame] = useState<PlayhouseGameDef | null>(null);

  const isGameUnlocked = (game: PlayhouseGameDef): boolean => {
    if (!game.isLockedByDefault || (game.cost ?? 0) === 0) return true;
    const owned = inventory?.ownedGamePacks || [];
    return owned.includes(game.id);
  };

  const handleGameCardClick = (game: PlayhouseGameDef) => {
    sound.playPop();
    if (isGameUnlocked(game)) {
      setSelectedGameId(game.id);
    } else {
      // Show preview of locked game with unlock prompt
      setPreviewLockedGame(game);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!confirmUnlockGame) return;
    const cost = confirmUnlockGame.cost || 200;
    setUnlocking(true);
    setUnlockError(null);

    try {
      const res = await spendCoins(confirmUnlockGame.id, 'game_pack', cost);
      if (!res.success) {
        sound.error();
        setUnlockError(res.error || 'Insufficient Love Coins or transaction error.');
      } else {
        sound.playSuccess();
        confetti({ particleCount: 50, spread: 70 });
        const unlockedId = confirmUnlockGame.id;
        setConfirmUnlockGame(null);
        setPreviewLockedGame(null);
        setSelectedGameId(unlockedId);
      }
    } catch (err: any) {
      sound.error();
      setUnlockError(err.message || 'Unlock failed.');
    } finally {
      setUnlocking(false);
    }
  };

  const selectedGame = PLAYHOUSE_GAMES.find(g => g.id === selectedGameId);

  const filteredGames = activeTab === 'All' 
    ? PLAYHOUSE_GAMES 
    : PLAYHOUSE_GAMES.filter(g => g.category === activeTab);

  return (
    <div 
      className="min-h-screen pb-28 transition-colors duration-500 font-sans"
      style={{
        backgroundColor: theme.colors.screenBg,
        color: theme.colors.textMain
      }}
    >
      {/* Immersive Top Castle Banner */}
      {!selectedGameId ? (
        <div className="relative pt-5 px-4 pb-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-3.5">
            <Link
              to="/"
              onClick={() => sound.playPop()}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-xs hover:scale-105 active:scale-95"
              style={{
                backgroundColor: theme.colors.cardBg,
                color: theme.colors.primary,
                border: `1px solid ${theme.colors.cardBorder}`
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs"
              style={{
                backgroundColor: theme.colors.primarySoft,
                color: theme.colors.primary,
                borderColor: theme.colors.cardBorder
              }}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Two Hearts • One Little World</span>
            </div>

            {/* Coin balance link */}
            <div 
              onClick={() => navigate('/earn-coins')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border shadow-xs cursor-pointer hover:scale-105 transition-all"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder
              }}
            >
              <Coins className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span className="text-xs font-black">{wallet?.balance ?? 50}</span>
            </div>
          </div>

          {/* Hero Castle Card */}
          <div 
            className="relative rounded-3xl overflow-hidden shadow-lg border p-6 text-white"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #7E22CE 100%)`,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-block">
                💖 Loveverse Playhouse • 10 Co-Op Arenas
              </span>
              <h1 className="text-2xl font-serif font-black leading-tight drop-shadow-sm">
                Top Couple Games
              </h1>
              <p className="text-xs text-white/90 max-w-xs leading-relaxed">
                Live interactive drawing, telepathic intuition, truth or dare, micro challenges & rhythm waves for two.
              </p>
              
              <div className="flex items-center gap-2 pt-2">
                <span className="text-[10px] font-bold bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                  <span>Real Gameplay</span>
                </span>
                <span className="text-[10px] font-bold bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-300" />
                  <span>Authoritative Unlocks</span>
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-3 mt-1">
            {(['All', 'Playful', 'Intimacy', 'Creativity', 'Mystery', 'Memory', 'Rhythm'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { sound.playPop(); setActiveTab(cat); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeTab === cat
                    ? 'text-white shadow-md'
                    : 'border hover:brightness-105'
                }`}
                style={{
                  backgroundColor: activeTab === cat ? theme.colors.primary : theme.colors.cardBg,
                  color: activeTab === cat ? '#FFFFFF' : theme.colors.textMuted,
                  borderColor: theme.colors.cardBorder
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Top Games Grid with Real Unlock States */}
          <div className="space-y-3 mt-1">
            {filteredGames.map((game, index) => {
              const unlocked = isGameUnlocked(game);

              return (
                <motion.div
                  key={game.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleGameCardClick(game)}
                  className="rounded-3xl p-4 border shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-4 items-center group relative overflow-hidden"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.cardBorder
                  }}
                >
                  {/* Rank & Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${game.gradient} text-white flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform relative`}>
                    <span className="text-2xl">{game.icon}</span>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white text-rose-600 font-extrabold text-[10px] flex items-center justify-center border border-rose-200 shadow-xs">
                      {index + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-sm truncate transition-colors" style={{ color: theme.colors.textMain }}>
                        {game.title}
                      </h3>
                      <span 
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                        style={{
                          backgroundColor: theme.colors.primarySoft,
                          color: theme.colors.primary,
                          borderColor: theme.colors.cardBorder
                        }}
                      >
                        {game.badge}
                      </span>
                    </div>
                    <p className="text-xs line-clamp-1 mb-1" style={{ color: theme.colors.textMuted }}>
                      {game.tagline}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>
                      <span>{game.category}</span>
                      <span>•</span>
                      {unlocked ? (
                        <span className="font-semibold flex items-center gap-0.5" style={{ color: theme.colors.primary }}>
                          <Play className="w-2.5 h-2.5 fill-current" /> Play Now
                        </span>
                      ) : (
                        <span className="font-bold flex items-center gap-1 text-amber-500">
                          <Lock className="w-2.5 h-2.5" /> Unlock ({game.cost} Coins)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Icon */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                    style={{
                      backgroundColor: unlocked ? theme.colors.primarySoft : '#FEF3C7',
                      color: unlocked ? theme.colors.primary : '#D97706'
                    }}
                  >
                    {unlocked ? <ArrowRight className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Shortcuts to Truth or Dare & Compatibility */}
          <div className="mt-5 pt-3 border-t" style={{ borderColor: theme.colors.cardBorder }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 px-1 opacity-70">
              Classic Couple Arenas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => {
                  sound.playPop();
                  setSelectedGameId('spin-the-wheel');
                }}
                className="p-3.5 rounded-2xl border shadow-2xs hover:shadow-md transition-all flex items-center gap-2.5 cursor-pointer"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-lg">
                  🎡
                </div>
                <div>
                  <h4 className="font-bold text-xs">Spin Wheel</h4>
                  <p className="text-[10px] opacity-70">Romantic dares</p>
                </div>
              </div>

              <div
                onClick={() => {
                  sound.playPop();
                  setSelectedGameId('compatibility-challenge');
                }}
                className="p-3.5 rounded-2xl border shadow-2xs hover:shadow-md transition-all flex items-center gap-2.5 cursor-pointer"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardBorder
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-lg">
                  💖
                </div>
                <div>
                  <h4 className="font-bold text-xs">Harmony Quiz</h4>
                  <p className="text-[10px] opacity-70">Intuition match</p>
                </div>
              </div>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all"
              style={{
                backgroundColor: theme.colors.cardBg,
                color: theme.colors.primary,
                borderColor: theme.colors.cardBorder
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Playhouse</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold">Two Hearts Live</span>
            </div>
          </div>

          {/* Active Game Title Bar */}
          <div 
            className="rounded-3xl p-4 border shadow-sm flex items-center gap-3"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedGame?.gradient} flex items-center justify-center text-2xl text-white shadow-xs`}>
              {selectedGame?.icon}
            </div>
            <div>
              <h1 className="font-serif font-bold text-base leading-snug">
                {selectedGame?.title}
              </h1>
              <p className="text-xs opacity-75">{selectedGame?.tagline}</p>
            </div>
          </div>

          {/* Render Specific Real Game Interactive Components */}
          {selectedGameId === 'draw-guess' && <DrawItGuessItGame />}
          {selectedGameId === 'spin-the-wheel' && <SpinTheWheelGame />}
          {selectedGameId === 'compatibility-challenge' && <CompatibilityChallengeGame />}
          {selectedGameId === 'couple-challenges' && <CoupleChallengesGame />}
          {selectedGameId === 'memory-guess' && <MemoryGuessGame />}
          {selectedGameId === 'guess-answer' && <GuessMyAnswerGame />}
          {selectedGameId === 'mystery-island' && <TwoHeartsMysteryGame />}
          {selectedGameId === 'heartbeat-harmony' && <HeartbeatHarmonyGame />}
          {selectedGameId === 'constellation-puzzle' && <ConstellationConnectGame />}
          {selectedGameId === 'memory-match' && <LoveMemoryMatchGame />}
          {selectedGameId === 'story-weaver' && <OneWordStoryGame />}
          {selectedGameId === 'love-tic-tac-toe' && <LoveTicTacToeGame />}
          {selectedGameId === 'emoji-decoder' && <EmojiCipherGame />}
          {selectedGameId === 'couples-trivia' && <CouplesTriviaGame />}
          {selectedGameId === 'would-you-rather' && <WouldYouRatherGame />}

          {/* Rules & Features Details Drawer */}
          <div 
            className="rounded-3xl p-5 border shadow-sm space-y-3"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder
            }}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" style={{ color: theme.colors.primary }} />
              <h3 className="text-xs font-bold uppercase tracking-wider">How to Play & Couple Rules</h3>
            </div>
            <p className="text-xs leading-relaxed opacity-85">
              {selectedGame?.description}
            </p>
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold block">Game Flow:</span>
              <ul className="space-y-1 text-xs opacity-80">
                {selectedGame?.rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold" style={{ color: theme.colors.primary }}>•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LOCKED GAME PREVIEW MODAL                                 */}
      {/* ========================================================= */}
      <AnimatePresence>
        {previewLockedGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden text-gray-900 shadow-2xl border border-rose-100 flex flex-col"
            >
              {/* Header Image */}
              <div className="relative h-36 bg-gradient-to-tr from-purple-600 to-rose-500 p-4 text-white flex flex-col justify-between">
                <button
                  onClick={() => setPreviewLockedGame(null)}
                  className="self-end w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{previewLockedGame.icon}</span>
                  <div>
                    <h3 className="font-serif font-bold text-base leading-tight">
                      {previewLockedGame.title}
                    </h3>
                    <p className="text-[11px] text-rose-100">{previewLockedGame.tagline}</p>
                  </div>
                </div>
              </div>

              {/* Game Info Details */}
              <div className="p-5 space-y-3 text-xs text-gray-600">
                <p className="leading-relaxed">{previewLockedGame.description}</p>
                
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-1">
                  <div className="flex items-center justify-between text-amber-900 font-bold">
                    <span>Unlock Game Pack</span>
                    <span>{previewLockedGame.cost} Love Coins</span>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    Unlocks permanent access for both partners in this couple space.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setPreviewLockedGame(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      const target = previewLockedGame;
                      setPreviewLockedGame(null);
                      setConfirmUnlockGame(target);
                    }}
                    className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5 fill-current" />
                    <span>Unlock ({previewLockedGame.cost})</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* COIN DEDUCTION CONFIRMATION MODAL                         */}
      {/* ========================================================= */}
      <AnimatePresence>
        {confirmUnlockGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 text-gray-900 shadow-2xl border border-rose-100 space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shadow-xs">
                {confirmUnlockGame.icon}
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-serif font-black text-base">
                  Unlock {confirmUnlockGame.title}?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Spend <strong className="text-amber-600">{confirmUnlockGame.cost} Love Coins</strong> to unlock this game for your couple space.
                </p>
                <div className="pt-1">
                  <span className="text-[11px] text-gray-400">
                    Your Balance: <strong>{wallet?.balance ?? 50} Coins</strong>
                  </span>
                </div>
              </div>

              {unlockError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                  {unlockError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    sound.tap();
                    setConfirmUnlockGame(null);
                    setUnlockError(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={unlocking}
                  onClick={handleConfirmUnlock}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {unlocking ? (
                    <span>Unlocking...</span>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5 fill-current" />
                      <span>Confirm Unlock</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
