import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, useReducedMotion } from 'motion/react';

export function LivingAtmosphere() {
  const { theme, isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);

  // Pause animations when document is hidden to save GPU and battery
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Deterministic star positions
  const stars = useMemo(() => [
    { top: '6%', left: '12%', size: 3, delay: 0, duration: 4 },
    { top: '12%', right: '15%', size: 4, delay: 1.2, duration: 5 },
    { top: '24%', left: '82%', size: 2.5, delay: 2.4, duration: 3.5 },
    { top: '38%', left: '6%', size: 3.5, delay: 0.8, duration: 4.5 },
    { top: '46%', right: '8%', size: 3, delay: 1.8, duration: 4 },
    { top: '62%', left: '14%', size: 4, delay: 2.1, duration: 5.5 },
    { top: '75%', right: '18%', size: 3, delay: 0.5, duration: 4.2 },
    { top: '86%', left: '22%', size: 2.5, delay: 1.5, duration: 3.8 },
    { top: '92%', right: '28%', size: 3.5, delay: 2.8, duration: 4.8 },
  ], []);

  // Subtle clouds
  const clouds = useMemo(() => [
    { top: '3%', left: '-5%', width: 260, height: 100, opacity: isDark ? 0.06 : 0.28, duration: 42 },
    { top: '25%', right: '-8%', width: 320, height: 120, opacity: isDark ? 0.05 : 0.22, duration: 52 },
    { top: '55%', left: '-12%', width: 300, height: 110, opacity: isDark ? 0.05 : 0.20, duration: 46 },
    { top: '80%', right: '-5%', width: 240, height: 95, opacity: isDark ? 0.04 : 0.18, duration: 48 },
  ], [isDark]);

  // Floating crystal heart particles
  const crystalHearts = useMemo(() => [
    { top: '18%', left: '20%', size: 14, delay: 0, duration: 8 },
    { top: '40%', right: '22%', size: 12, delay: 3, duration: 9 },
    { top: '70%', left: '26%', size: 16, delay: 1.5, duration: 8.5 },
  ], []);

  const allowAnimation = isVisible && !shouldReduceMotion;

  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* Ambient Radial Aura Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full blur-3xl opacity-40 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${theme.colors.primarySoft} 0%, transparent 70%)`
        }}
      />

      {/* Floating Ambient Clouds */}
      {clouds.map((c, i) => (
        <motion.div
          key={`cloud-${i}`}
          initial={{ x: 0 }}
          animate={allowAnimation ? { x: [0, 30, 0] } : { x: 0 }}
          transition={{
            duration: c.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute rounded-full blur-2xl transition-opacity duration-1000"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            width: c.width,
            height: c.height,
            backgroundColor: isDark ? '#9333EA' : '#FFFFFF',
            opacity: c.opacity,
          }}
        />
      ))}

      {/* Twinkling Celestial Starlight Crystals */}
      {stars.map((s, i) => (
        <motion.div
          key={`star-${i}`}
          initial={{ opacity: 0.2, scale: 0.8 }}
          animate={allowAnimation ? {
            opacity: [0.15, 0.9, 0.15],
            scale: [0.8, 1.3, 0.8],
          } : { opacity: 0.4, scale: 1 }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut"
          }}
          className="absolute rounded-full"
          style={{
            top: s.top,
            left: s.left,
            right: s.right,
            width: s.size,
            height: s.size,
            backgroundColor: isDark ? '#FDE047' : theme.colors.accent,
            boxShadow: `0 0 10px ${isDark ? '#FDE047' : theme.colors.accent}`
          }}
        />
      ))}

      {/* Drifting Crystal Hearts */}
      {crystalHearts.map((h, i) => (
        <motion.div
          key={`heart-${i}`}
          initial={{ y: 0, opacity: 0.15, rotate: 0 }}
          animate={allowAnimation ? {
            y: [-10, 10, -10],
            rotate: [-6, 6, -6],
            opacity: [0.15, 0.35, 0.15],
          } : { opacity: 0.2 }}
          transition={{
            duration: h.duration,
            repeat: Infinity,
            delay: h.delay,
            ease: "easeInOut"
          }}
          className="absolute flex items-center justify-center opacity-25"
          style={{
            top: h.top,
            left: h.left,
            right: h.right,
          }}
        >
          <svg 
            width={h.size} 
            height={h.size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke={theme.colors.primary} 
            strokeWidth="1.5"
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="filter drop-shadow-xs"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
