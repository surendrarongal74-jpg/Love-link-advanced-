import React from 'react';
import { motion } from 'motion/react';
import { sound } from '../../lib/sound';
import { Loader2 } from 'lucide-react';

export interface LoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  icon?: any;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticFeedback?: boolean;
}

export const LoveButton = React.forwardRef<HTMLButtonElement, LoveButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  icon,
  leftIcon,
  rightIcon,
  hapticFeedback = true,
  className = '',
  onClick,
  disabled,
  ...props
}, ref) => {
  const isActuallyLoading = isLoading || loading;
  const resolvedLeftIcon = leftIcon || (icon ? (React.isValidElement(icon) ? icon : React.createElement(icon, { className: 'w-4 h-4 shrink-0' })) : null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) return;
    if (hapticFeedback) {
      sound.tap();
    }
    onClick?.(e);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[36px]',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-2xl min-h-[44px]',
    lg: 'px-6 py-3.5 text-sm sm:text-base rounded-2xl min-h-[48px] font-bold'
  }[size];

  const variantClasses = {
    primary: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white shadow-md shadow-rose-500/20 hover:brightness-105 border border-rose-400/30',
    secondary: 'bg-rose-50/80 hover:bg-rose-100/90 text-rose-700 border border-rose-200/80 shadow-2xs',
    outline: 'bg-transparent border border-rose-300 hover:bg-rose-50/50 text-rose-600',
    ghost: 'bg-transparent hover:bg-rose-50/60 text-rose-600',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20'
  }[variant];

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || isActuallyLoading ? 1 : 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      disabled={disabled || isActuallyLoading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...(props as any)}
    >
      {isActuallyLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Please wait...</span>
        </>
      ) : (
        <>
          {resolvedLeftIcon && <span className="shrink-0">{resolvedLeftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
});

LoveButton.displayName = 'LoveButton';
