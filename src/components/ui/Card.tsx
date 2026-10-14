import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = false,
  interactive = false,
  padding = 'md',
  ...rest
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3.5 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }[padding];

  return (
    <motion.div
      whileHover={interactive ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`
        relative rounded-2xl transition-all duration-300
        dark:bg-[#0E1526]/80 dark:backdrop-blur-xl dark:border dark:border-white/[0.08] dark:shadow-xl dark:shadow-black/40
        light:bg-white light:border light:border-slate-200/80 light:shadow-sm light:shadow-slate-200/50
        ${glow ? 'dark:hover:border-indigo-500/30 dark:hover:shadow-indigo-500/10 dark:hover:shadow-2xl' : ''}
        ${interactive ? 'cursor-pointer active:scale-[0.99]' : ''}
        ${paddingClasses}
        ${className}
      `}
      {...rest}
    >
      {/* Subtle top specular border line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/10 dark:via-white/15 to-transparent" />
      {children}
    </motion.div>
  );
};
