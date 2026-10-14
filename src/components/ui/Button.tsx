import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...rest
}) => {
  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs rounded-xl min-h-[36px]',
    md: 'h-11 px-4 text-sm rounded-xl min-h-[44px]', // 44px touch target
    lg: 'h-12 px-6 text-base rounded-2xl min-h-[48px]',
  }[size];

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95 border border-indigo-400/30',
    secondary:
      'bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-800/80 border border-slate-700/80 light:bg-slate-100 light:text-slate-800 light:hover:bg-slate-200',
    glass:
      'glass-pill text-slate-200 hover:text-white dark:hover:bg-white/[0.08] light:text-slate-800 light:hover:bg-slate-100/80',
    outline:
      'border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100',
    ghost:
      'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] light:text-slate-600 light:hover:bg-slate-100',
    danger:
      'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:bg-rose-500/30',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 select-none transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${sizeStyles}
        ${variantStyles}
        ${className}
      `}
      {...rest}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </motion.button>
  );
};
