import React, { useEffect, useState } from 'react';
import { formatINR, formatNumber } from '../../utils/formatters';

interface AnimatedNumberProps {
  value: number;
  type?: 'currency' | 'number' | 'percent' | 'rating';
  compact?: boolean;
  duration?: number;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  type = 'number',
  compact = false,
  duration = 750,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(() => {
    // Check if prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return value;
    }
    return 0;
  });

  useEffect(() => {
    // If reduced motion is requested, jump immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const diff = value - startValue;

    if (Math.abs(diff) < 0.01) {
      setDisplayValue(value);
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const renderFormatted = () => {
    if (type === 'currency') {
      return formatINR(displayValue, { compact });
    }
    if (type === 'percent') {
      return `${displayValue.toFixed(1)}%`;
    }
    if (type === 'rating') {
      return displayValue.toFixed(2);
    }
    return formatNumber(Math.round(displayValue), compact);
  };

  return <span className={`font-tabular tracking-tight ${className}`}>{renderFormatted()}</span>;
};
