import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
  }[variant];

  return (
    <div
      className={`
        animate-shimmer bg-slate-800/60 dark:bg-slate-800/50 light:bg-slate-200/70
        ${variantStyles}
        ${className}
      `}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
    />
  );
};
