import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleSpace } from '../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../contexts/LoveCoinsContext';
import { LoveLink3DGameView } from '../components/game3d/LoveLink3DGameView';
import { CharacterType, WorldDefinition } from '../components/game3d/gameTypes';
import {
  Sparkles,
  Play,
  Award,
  Users,
  Compass,
  Lock,
  ChevronRight,
  ShieldCheck,
  Gamepad2,
  Heart,
  CheckCircle2,
  Star
} from 'lucide-react';

const WORLDS_DATA: WorldDefinition[] = [
  {
    id: 'world1_sky_islands',
    number: 1,
    title: 'Sky Islands',
    subtitle: 'The Celestial Archipelago',
    theme: 'Floating fantasy islands in twilight clouds',
    description: 'Traverse floating stepping stones, solve the synchronized starlight pressure plates, and cross the crystalline energy bridge.',
    difficulty: 'Easy',
    rewardCoins: 100,
    rewardXP: 250,
    unlocked: true,
    badgeName: 'Sky Pioneer 🌟',
    color: 'from-blue-600 via-indigo-600 to-purple-600',
  },
  {
    id: 'world2_luminescent_caverns',
    number: 2,
    title: 'Luminescent Caverns',
    subtitle: 'Caves of Echoing Crystals',
    theme: 'Bioluminescent mushrooms and resonant crystals',
    description: 'Navigate subterranean chasms using bioluminescent echoes to reveal hidden crystal paths.',
    difficulty: 'Medium',
    rewardCoins: 150,
    rewardXP: 350,
    unlocked: false,
    badgeName: 'Cavern Delver 💎',
    color: 'from-emerald-600 via-teal-600 to-cyan-600',
  },
  {
    id: 'world3_sunken_coral',
    number: 3,
    title: 'Sunken Coral Ruins',
    subtitle: 'The Abyssal Reef',
    theme: 'Ancient flooded temple and glowing anemones',
    description: 'Work together through underwater current gates and trigger ancient water-wheel pressure nodes.',
    difficulty: 'Medium',
    rewardCoins: 180,
    rewardXP: 400,
    unlocked: false,
    badgeName: 'Abyssal Diver 🌊',
    color: 'from-cyan-600 via-blue-600 to-indigo-700',
  },
  {
    id: 'world4_clockwork_citadel',
    number: 4,
    title: 'Clockwork Citadel',
    subtitle: 'Gears of Destiny',
    theme: 'Steampunk rotating platforms and magnetic rails',
    description: 'Synchronize turning giant clockwork gears and balance weight-sensitive bridges with your partner.',
    difficulty: 'Challenging',
    rewardCoins: 220,
    rewardXP: 500,
    unlocked: false,
    badgeName: 'Chrono Weaver ⏱️',
    color: 'from-amber-600 via-orange-600 to-red-600',
  },
  {
    id: 'world5_whispering_bamboo',
    number: 5,
    title: 'Whispering Bamboo',
    subtitle: 'Grove of Floating Lanterns',
    theme: 'Zen misty bamboo forest and spirit bridges',
    description: 'Glide on updrafts from wind lanterns and solve wind chime harmonic puzzles in harmony.',
    difficulty: 'Challenging',
    rewardCoins: 260,
    rewardXP: 550,
    unlocked: false,
    badgeName: 'Wind Walker 🎋',
    color: 'from-green-600 via-emerald-600 to-teal-700',
  },
  {
    id: 'world6_celestial_observatory',
    number: 6,
    title: 'Celestial Observatory',
    subtitle: 'Starlight Spire',
    theme: 'Cosmic planetarium with astral bridges',
    description: 'Align orbiting planetary spheres to cast laser bridges across deep cosmic space.',
    difficulty: 'Expert',
    rewardCoins: 300,
    rewardXP: 650,
    unlocked: false,
    badgeName: 'Astral Cartographer 🌌',
    color: 'from-purple-600 via-pink-600 to-rose-600',
  },
];

export const LoveLink3DAdventureScreen: React.FC = () => {
  const { user } = useAuth();
  const { space, partnerData } = useCoupleSpace();
  const { refreshWallet } = useLoveCoins();

  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState<WorldDefinition>(WORLDS_DATA[0]);
  const [characterChoice, setCharacterChoice] = useState<CharacterType>('boy');
  const [completedExpeditions, setCompletedExpeditions] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('lovelink_3d_completed_runs') || '0', 10);
    } catch {
      return 0;
    }
  });

  const partnerName = partnerData?.displayName || 'Partner';
  const myName = user?.displayName || 'Player 1';

  const handleLaunchGame = (world: WorldDefinition) => {
    setSelectedWorld(world);
    setIsPlaying(true);
  };

  const handleCompleteLevel = async (rewards: { coins: number; xp: number; badge: string }) => {
    try {
      const nextCount = completedExpeditions + 1;
      setCompletedExpeditions(nextCount);
      localStorage.setItem('lovelink_3d_completed_runs', nextCount.toString());
      await refreshWallet();
    } catch (e) {
      console.warn('Completed run stats persistence note:', e);
    }
  };

  // If in active 3D game view, render the 3D canvas viewport
  if (isPlaying) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <LoveLink3DGameView
          worldId={selectedWorld.id}
          initialCharacter={characterChoice}
          onExit={() => setIsPlaying(false)}
          onCompleteLevel={handleCompleteLevel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 p-6 md:p-10 shadow-2xl mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL-TIME 3D CO-OP EXPEDITION</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-pink-100 to-purple-200 bg-clip-text text-transparent">
            Love Link 3D
          </h1>
          <p className="text-lg font-medium text-pink-300/90 mt-1">Two Souls, One Adventure</p>

          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            Step into breathtaking real-time 3D realms crafted specifically for couples. Jump, explore floating islands,
            activate synchronized starlight mechanisms, and unlock celestial portals together in real time!
          </p>

          {/* Quick Stats Pill Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3.5 py-1.5 rounded-2xl text-xs">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Teamed with:</span>
              <span className="font-bold text-white">{partnerName}</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3.5 py-1.5 rounded-2xl text-xs">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">Expeditions:</span>
              <span className="font-bold text-amber-300">{completedExpeditions} Cleared</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-3.5 py-1.5 rounded-2xl text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300">Space Sync:</span>
              <span className="font-bold text-purple-300">Live Active</span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Character Selector & Launch Action */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 mb-8 backdrop-blur-md">
        <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-indigo-400" />
          <span>Choose Your In-Game Avatar</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Boy 1 Character Card */}
          <button
            onClick={() => setCharacterChoice('boy')}
            className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
              characterChoice === 'boy'
                ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-md">
                🧑
              </div>
              <div>
                <span className="text-sm font-bold block">Character Boy 1</span>
                <span className="text-xs text-blue-300">Streetwear Jacket & Kinetic Jump</span>
              </div>
            </div>
            {characterChoice === 'boy' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
          </button>

          {/* Galaxia Anime Girl Character Card */}
          <button
            onClick={() => setCharacterChoice('galaxia')}
            className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
              characterChoice === 'galaxia'
                ? 'bg-pink-950/60 border-pink-500 text-white shadow-lg shadow-pink-500/10'
                : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-2xl shadow-md">
                ✨
              </div>
              <div>
                <span className="text-sm font-bold block">Galaxia Anime Girl</span>
                <span className="text-xs text-pink-300">Starlight Twin Tails & Celestial Aura</span>
              </div>
            </div>
            {characterChoice === 'galaxia' && <CheckCircle2 className="w-5 h-5 text-pink-400" />}
          </button>
        </div>
      </div>

      {/* World Registry Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-pink-400" />
              <span>Expedition Worlds</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a world to embark together with your partner</p>
          </div>
          <span className="text-xs font-semibold text-pink-400 bg-pink-950/60 px-3 py-1 rounded-full border border-pink-800/60">
            6 Worlds Planned • World 1 Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {WORLDS_DATA.map((world) => (
            <div
              key={world.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                world.unlocked
                  ? 'bg-slate-900/80 border-purple-500/40 hover:border-pink-500/70 hover:shadow-xl hover:shadow-purple-500/10'
                  : 'bg-slate-900/30 border-slate-800/80 opacity-70'
              }`}
            >
              {/* World Card Top */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/50">
                    World {world.number}
                  </span>

                  {world.unlocked ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      PLAYABLE NOW
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-xl flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight">{world.title}</h3>
                <p className="text-xs font-semibold text-pink-400/90">{world.subtitle}</p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{world.description}</p>
              </div>

              {/* World Card Bottom Rewards & Launch Button */}
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-3 text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="text-amber-400 font-bold">🪙 +{world.rewardCoins}</span> Coins
                  </span>
                  <span className="text-purple-300 font-semibold">+{world.rewardXP} XP</span>
                  <span className="text-slate-400">{world.difficulty}</span>
                </div>

                {world.unlocked ? (
                  <button
                    onClick={() => handleLaunchGame(world)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Launch 3D Expedition</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-2xl bg-slate-800/60 text-slate-500 font-medium text-xs cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlocks After World {world.number - 1}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Play & Controls Card */}
      <div className="bg-gradient-to-r from-slate-900/90 to-purple-950/60 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <span>Co-Op Expedition Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <span className="font-bold text-pink-300 block mb-1">1. Synchronized Switches</span>
            Stand on Pressure Plate A while your partner (or smart AI partner) stands on Pressure Plate B. Both plates must be active to summon the crystalline bridge!
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <span className="font-bold text-indigo-300 block mb-1">2. Starlight Crystals</span>
            Locate and collect all 3 Star Shards across the islands. Collecting crystals charges up the ancient celestial portal.
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <span className="font-bold text-emerald-300 block mb-1">3. Live or AI Companion</span>
            When your partner is online, movement and moments synchronize instantly. If your partner is away, your companion AI follows and assists automatically!
          </div>
        </div>
      </div>
    </div>
  );
};
