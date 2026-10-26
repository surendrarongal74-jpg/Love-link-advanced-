import React from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';

export interface LoveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glass?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const LoveCard = React.forwardRef<HTMLDivElement, LoveCardProps>(({
  children,
  interactive = false,
  glass = true,
  glow = false,
  className = '',
  onClick,
  style,
  ...props
}, ref) => {
  const { theme } = useTheme();

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme?.colors?.cardBg || 'rgba(255, 255, 255, 0.9)',
    borderColor: glow ? (theme?.colors?.primary || '#F43F5E') : (theme?.colors?.cardBorder || 'rgba(244, 114, 182, 0.25)'),
    boxShadow: glow 
      ? `0 10px 30px -4px ${theme?.colors?.primarySoft || 'rgba(244, 63, 94, 0.2)'}`
      : (theme?.colors?.cardShadow || '0 8px 24px -4px rgba(244, 63, 94, 0.08)'),
    ...style
  };

  if (interactive) {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={onClick}
        className={`rounded-3xl border ${glass ? 'backdrop-blur-xl' : ''} transition-colors duration-200 cursor-pointer ${className}`}
        style={cardStyle}
        {...(props as any)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`rounded-3xl border ${glass ? 'backdrop-blur-xl' : ''} transition-colors duration-200 ${className}`}
      style={cardStyle}
      {...props}
    >
      {children}
    </div>
  );
});

LoveCard.displayName = 'LoveCard';
