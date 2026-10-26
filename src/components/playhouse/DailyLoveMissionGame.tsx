import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCoupleSpace } from '../../contexts/CoupleSpaceContext';
import { useLoveCoins } from '../../contexts/LoveCoinsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { CalendarHeart, CheckCircle2, Clock, Flame, Award, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DailyMissionItem {
  id: string;
  title: string;
  vibe: string;
  description: string;
  actionStep: string;
  coinsAward: number;
}

const MISSIONS_LIST: DailyMissionItem[] = [
  {
    id: 'mission_1',
    title: '60-Second Eye Gaze & Heartbeat',
    vibe: 'Pure Connection',
    description: 'Sit facing each other in silence for 60 uninterrupted seconds. Look into each other’s eyes without phones or speaking.',
    actionStep: 'Hold hands, look into each other’s eyes, and let a gentle smile be your only words.',
    coinsAward: 40
  },
  {
    id: 'mission_2',
    title: 'Secret Sticky Love Note',
    vibe: 'Sweet Surprise',
    description: 'Leave a small physical handwritten note or drawing where your partner will discover it unexpectedly today.',
    actionStep: 'Write 1 reason you appreciate them and tuck it into a pocket, laptop, or bathroom mirror.',
    coinsAward: 40
  },
  {
    id: 'mission_3',
    title: 'Spontaneous Warm Beverage Delivery',
    vibe: 'Acts of Service',
    description: 'Prepare or bring your partner their favorite tea, coffee, or fresh drink without them asking.',
    actionStep: 'Serve it with a warm hug or sweet wink.',
    coinsAward: 45
  },
  {
    id: 'mission_4',
    title: 'The 3-Appreciations Whisper',
    vibe: 'Words of Affirmation',
    description: 'Tell your partner 3 specific things they did this week that made you feel loved or proud of them.',
    actionStep: 'Be genuine and specific about the little moments that mattered.',
    coinsAward: 50
  },
  {
    id: 'mission_5',
    title: 'Slow Dance in the Kitchen / Room',
    vibe: 'Romantic Spark',
    description: 'Play your favorite song and hold each other for a quiet 3-minute slow dance.',
    actionStep: 'Rest your head against their chest and sway together.',
    coinsAward: 50
  }
];

export function DailyLoveMissionGame() {
  const { userData } = useAuth();
  const { partnerData } = useCoupleSpace();
  const { theme } = useTheme();
  const { wallet } = useLoveCoins();

  // Daily deterministic mission selection based on date string
  const todayStr = new Date().toISOString().split('T')[0];
  const dayIndex = Math.abs(
    todayStr.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0)
  ) % MISSIONS_LIST.length;

  const activeMission = MISSIONS_LIST[dayIndex];
  const storageKey = `lovelink_daily_mission_${userData?.id || 'guest'}_${todayStr}`;

  const [isCompleted, setIsCompleted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`lovelink_mission_streak_${userData?.id || 'guest'}`);
      return saved ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });

  const handleComplete = () => {
    if (isCompleted) return;
    sound.playSuccess();
    triggerHeartBurstConfetti(0.5, 0.45);
    setIsCompleted(true);
    const nextStreak = streakDays + 1;
    setStreakDays(nextStreak);

    try {
      localStorage.setItem(storageKey, 'true');
      localStorage.setItem(`lovelink_mission_streak_${userData?.id || 'guest'}`, nextStreak.toString());
    } catch {}
  };

  return (
    <div 
      className="p-5 rounded-3xl border shadow-sm space-y-5 font-sans transition-colors duration-500"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderColor: theme.colors.cardBorder
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: theme.colors.primary }}>
            <CalendarHeart className="w-3.5 h-3.5" />
            <span>Daily Couple Ritual</span>
          </div>
          <h3 className="font-serif font-black text-lg">Daily Love Mission</h3>
        </div>

        <div 
          className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
          style={{
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.cardBorder,
            color: theme.colors.primary
          }}
        >
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>{streakDays} Day Streak</span>
        </div>
      </div>

      {/* Main Mission Card */}
      <div 
        className="p-5 rounded-3xl border space-y-3 relative overflow-hidden shadow-xs"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primarySoft} 0%, ${theme.colors.cardBg} 100%)`,
          borderColor: theme.colors.cardBorder
        }}
      >
        <div className="flex items-center justify-between">
          <span 
            className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
            style={{
              backgroundColor: theme.colors.tagBg,
              color: theme.colors.tagText
            }}
          >
            {activeMission.vibe}
          </span>

          <span className="text-[11px] font-semibold opacity-70 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Resets midnight</span>
          </span>
        </div>

        <h4 className="font-serif font-black text-base" style={{ color: theme.colors.textMain }}>
          {activeMission.title}
        </h4>

        <p className="text-xs leading-relaxed opacity-85" style={{ color: theme.colors.textMain }}>
          {activeMission.description}
        </p>

        {/* Action Callout */}
        <div 
          className="p-3 rounded-2xl border text-xs font-medium space-y-1"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder
          }}
        >
          <span className="font-bold text-[10px] uppercase tracking-wider opacity-60">Today's Step:</span>
          <p className="font-semibold text-xs leading-snug">{activeMission.actionStep}</p>
        </div>
      </div>

      {/* Completion CTA */}
      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl border text-center space-y-1"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: '#059669'
            }}
          >
            <div className="flex items-center justify-center gap-1.5 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Today’s Mission Complete!</span>
            </div>
            <p className="text-[11px] opacity-80">
              Wonderful job keeping your romantic connection alive. Your streak is protected!
            </p>
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleComplete}
            className="w-full py-3.5 rounded-2xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 hover:brightness-105"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Complete Mission with {partnerData?.displayName || 'Partner'}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
