import React, { useState } from 'react';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { Sparkles, CheckCircle2, Circle, Flame, Heart, Trophy, ArrowRight } from 'lucide-react';

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  duration: string;
  icon: string;
  completed: boolean;
}

const INITIAL_CHALLENGES: ChallengeItem[] = [
  {
    id: 'ch_1',
    title: '60-Second Eye Gazing',
    description: 'Sit facing each other, hold hands, and look into each other’s eyes without speaking for 60 uninterrupted seconds.',
    category: 'Intimacy',
    points: 25,
    duration: '1 Min',
    icon: '👀',
    completed: true,
  },
  {
    id: 'ch_2',
    title: 'Surprise Coffee / Tea Delivery',
    description: 'Prepare their favorite morning beverage with a cute sticky note and deliver it without being asked.',
    category: 'Acts of Service',
    points: 30,
    duration: '5 Mins',
    icon: '☕',
    completed: false,
  },
  {
    id: 'ch_3',
    title: 'The 3-Song Dance Party',
    description: 'Pick 3 songs that defined your relationship and dance together in the kitchen or living room.',
    category: 'Playful Laughter',
    points: 40,
    duration: '10 Mins',
    icon: '🎶',
    completed: false,
  },
  {
    id: 'ch_4',
    title: 'Digital Sunset Detox',
    description: 'Put both phones in a drawer for 1 full hour after 8 PM and enjoy a quiet conversation or card game.',
    category: 'Quality Time',
    points: 50,
    duration: '1 Hour',
    icon: '🌅',
    completed: false,
  },
  {
    id: 'ch_5',
    title: 'Recite Your First Impression',
    description: 'Tell your partner the exact thought you had when you first saw them and why you knew they were special.',
    category: 'Memories',
    points: 35,
    duration: '5 Mins',
    icon: '💭',
    completed: false,
  },
  {
    id: 'ch_6',
    title: 'Back-to-Back Breathing',
    description: 'Sit back-to-back on a rug with eyes closed. Sync your breaths together for 3 calming minutes.',
    category: 'Synchronicity',
    points: 30,
    duration: '3 Mins',
    icon: '🧘',
    completed: false,
  }
];

export function CoupleChallengesGame() {
  const [challenges, setChallenges] = useState<ChallengeItem[]>(() => {
    try {
      const stored = localStorage.getItem('lovelink_couple_challenges');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_CHALLENGES;
  });

  const [activeFilter, setActiveFilter] = useState<'All' | 'Active' | 'Completed'>('All');

  const toggleChallenge = (id: string) => {
    sound.tap();
    setChallenges(prev => {
      const updated = prev.map(ch => {
        if (ch.id === id) {
          const nextState = !ch.completed;
          if (nextState) {
            sound.playSuccess();
            triggerHeartBurstConfetti(0.5, 0.45);
          }
          return { ...ch, completed: nextState };
        }
        return ch;
      });
      try {
        localStorage.setItem('lovelink_couple_challenges', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const completedCount = challenges.filter(c => c.completed).length;
  const totalPoints = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.points, 0);

  const filtered = challenges.filter(c => {
    if (activeFilter === 'Active') return !c.completed;
    if (activeFilter === 'Completed') return c.completed;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-4 font-sans">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Couple Adventures</span>
        </div>
        <h3 className="font-serif font-black text-lg text-gray-900">
          Micro Couple Challenges
        </h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Wholesome, heartwarming romantic mini-activities designed to deepen intimacy in 5 minutes a day.
        </p>
      </div>

      {/* Progress & Points Scoreboard */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-100 block">
            Adventure Progress
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-black">{completedCount} of {challenges.length} Done</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/30">
          <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span className="text-xs font-black">{totalPoints} Pts</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['All', 'Active', 'Completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              sound.tap();
              setActiveFilter(tab);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeFilter === tab
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Challenge Cards List */}
      <div className="space-y-2.5">
        {filtered.map(ch => (
          <div
            key={ch.id}
            onClick={() => toggleChallenge(ch.id)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              ch.completed
                ? 'bg-emerald-50/50 border-emerald-200/80 shadow-2xs'
                : 'bg-white border-gray-150 hover:border-rose-300 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{ch.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs font-bold ${ch.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {ch.title}
                  </h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {ch.duration}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug mt-0.5 max-w-xs">
                  {ch.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[10px] font-black text-rose-500">+{ch.points}</span>
              {ch.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 hover:text-rose-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
