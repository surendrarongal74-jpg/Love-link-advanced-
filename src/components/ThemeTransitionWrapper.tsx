import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

interface ThemeTransitionWrapperProps {
  children: React.ReactNode;
}

export function ThemeTransitionWrapper({ children }: ThemeTransitionWrapperProps) {
  const { theme, isDark } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevThemeRef = useRef(theme.id);
  const [veilColor, setVeilColor] = useState(theme.colors.primary);

  useEffect(() => {
    if (theme.id !== prevThemeRef.current) {
      setVeilColor(theme.colors.primary);
      setIsTransitioning(true);
      prevThemeRef.current = theme.id;

      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 420);

      return () => clearTimeout(timer);
    }
  }, [theme.id, theme.colors.primary]);

  return (
    <div 
      className="relative min-h-screen w-full transition-colors duration-500 font-sans"
      style={{
        backgroundColor: theme.colors.screenBg,
        color: theme.colors.textMain,
      }}
    >
      {/* 
        Living Celestial Theme Transition Veil:
        Acts as an ethereal flash-barrier that smoothly dissolves across theme changes,
        blending light and dark palettes seamlessly without any sudden flicker or FOUC.
      */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key={`veil-${theme.id}`}
            initial={{ opacity: 0.35, scale: 1.01 }}
            animate={{ opacity: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 pointer-events-none z-[999] backdrop-blur-[2px]"
            style={{
              background: `radial-gradient(ellipse at 50% 25%, ${veilColor}33 0%, ${theme.colors.screenBg} 100%)`
            }}
          />
        )}
      </AnimatePresence>

      {/* Main app contents wrapped with keyed layout container */}
      <div 
        key={theme.id}
        className="w-full min-h-screen flex flex-col transition-colors duration-500"
      >
        {children}
      </div>
    </div>
  );
}
