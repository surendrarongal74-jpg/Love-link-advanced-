import React, { useState } from 'react';
import { sound } from '../../lib/sound';
import { triggerHeartBurstConfetti } from '../../lib/celebrationEffects';
import { RotateCw, Sparkles, Heart, Gift, Award, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WheelActivity {
  id: string;
  label: string;
  color: string;
  text: string;
  category: string;
  icon: string;
}

const WHEEL_ACTIVITIES: WheelActivity[] = [
  { id: '1', label: '10-Min Massage', color: '#F43F5E', text: 'Give your partner a relaxing 10-minute shoulder or back massage with no phone distractions.', category: 'Touch & Relaxation', icon: '💆' },
  { id: '2', label: 'Whisper Secret', color: '#EC4899', text: 'Whisper 3 unexpected things that made you fall deeper in love with them recently.', category: 'Deep Connection', icon: '🤫' },
  { id: '3', label: 'Slow Dance', color: '#8B5CF6', text: 'Put on your favorite couple song right now and hold each other for a quiet slow dance.', category: 'Romance', icon: '💃' },
  { id: '4', label: 'Make Sweet Treat', color: '#3B82F6', text: 'Serve your partner their favorite hot drink, mocktail, or dessert in bed tonight.', category: 'Sweet Service', icon: '☕' },
  { id: '5', label: 'Silly Polaroid', color: '#10B981', text: 'Take a goofy, unfiltered selfie together right now and save it directly to Memories.', category: 'Playful Laughter', icon: '📸' },
  { id: '6', label: 'Spontaneous Date', color: '#F59E0B', text: 'Plan a surprise 30-minute late-night drive or stargazing walk within the next 48 hours.', category: 'Adventure', icon: '🚗' },
  { id: '7', label: 'Love Note', color: '#E11D48', text: 'Write a physical sticky note or secret message and hide it where they will find it tomorrow.', category: 'Words of Affirmation', icon: '💌' },
  { id: '8', label: 'Pass the Remote', color: '#6366F1', text: 'Your partner gets complete control over movie/show selection tonight with zero complaints!', category: 'Playful Favor', icon: '🍿' },
];

export function SpinTheWheelGame() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<WheelActivity | null>(null);
  const [history, setHistory] = useState<WheelActivity[]>([]);

  const handleSpin = () => {
    if (spinning) return;
    sound.tap();
    setSpinning(true);
    setSelectedActivity(null);

    // Pick a random target
    const randomIndex = Math.floor(Math.random() * WHEEL_ACTIVITIES.length);
    const segmentAngle = 360 / WHEEL_ACTIVITIES.length;
    // Calculate new rotation: multiple full spins + target segment offset
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = 360 * extraSpins + (WHEEL_ACTIVITIES.length - randomIndex) * segmentAngle;
    const finalRotation = rotation + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      const chosen = WHEEL_ACTIVITIES[randomIndex];
      setSelectedActivity(chosen);
      setHistory(prev => [chosen, ...prev.slice(0, 4)]);
      sound.playSuccess();
      triggerHeartBurstConfetti(0.5, 0.45);
    }, 3800);
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm space-y-4 font-sans">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Love Roulette Wheel</span>
        </div>
        <h3 className="font-serif font-black text-lg text-gray-900">
          Spin for Tonight’s Romantic Spark
        </h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Spin together! Whatever the wheel lands on is tonight’s sweet couple destiny.
        </p>
      </div>

      {/* Interactive Wheel Container */}
      <div className="relative flex flex-col items-center justify-center py-4">
        {/* Top Indicator Arrow */}
        <div className="absolute top-1 z-20 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-rose-600 drop-shadow-md" />
        </div>

        {/* The Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 3.8, ease: [0.15, 0.85, 0.35, 1] }}
          className="w-64 h-64 rounded-full border-4 border-white shadow-2xl relative overflow-hidden bg-gray-50"
          style={{
            background: `conic-gradient(
              ${WHEEL_ACTIVITIES.map((act, i) => `${act.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ')}
            )`
          }}
        >
          {/* Wheel Segments text */}
          {WHEEL_ACTIVITIES.map((act, idx) => {
            const angle = idx * 45 + 22.5;
            return (
              <div
                key={act.id}
                className="absolute inset-0 flex items-start justify-center pt-3 pointer-events-none"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: '50% 50%'
                }}
              >
                <div className="flex flex-col items-center text-white drop-shadow-sm space-y-0.5">
                  <span className="text-base">{act.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-tight text-center max-w-[50px] leading-tight">
                    {act.label}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Center Hub */}
          <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white shadow-lg border-2 border-rose-200 flex flex-col items-center justify-center text-rose-500">
            <Heart className="w-6 h-6 fill-rose-500 text-rose-500 animate-pulse" />
          </div>
        </motion.div>

        {/* Spin Trigger Button */}
        <div className="pt-6">
          <button
            disabled={spinning}
            onClick={handleSpin}
            className={`px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
              spinning 
                ? 'bg-gray-400 cursor-not-allowed opacity-80' 
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:brightness-110 active:scale-95 shadow-rose-300/50'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'Spinning Destiny...' : 'Spin the Wheel!'}</span>
          </button>
        </div>
      </div>

      {/* Result Card Reveal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-3xl bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 border-2 border-rose-300 shadow-md space-y-2 text-center"
          >
            <div className="text-3xl">{selectedActivity.icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-white/80 px-2.5 py-1 rounded-full border border-rose-200 inline-block">
              {selectedActivity.category}
            </span>
            <h4 className="font-serif font-black text-base text-gray-900">
              {selectedActivity.label}
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {selectedActivity.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent History */}
      {history.length > 0 && (
        <div className="pt-2 border-t border-rose-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
            Recent Spins
          </span>
          <div className="flex flex-wrap gap-1.5">
            {history.map((h, i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center gap-1">
                <span>{h.icon}</span>
                <span>{h.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
