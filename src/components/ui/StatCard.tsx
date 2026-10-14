import React from 'react';
import { Card } from './Card';
import { AnimatedNumber } from './AnimatedNumber';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  IndianRupee,
  Users,
  Pill,
  BedDouble,
  Receipt,
  HeartPulse,
  Activity,
} from 'lucide-react';
import type { MetricCardData } from '../../data/demoData';

const iconMap: Record<string, React.ElementType> = {
  IndianRupee,
  Users,
  Pill,
  BedDouble,
  Receipt,
  HeartPulse,
  Activity,
};

interface StatCardProps {
  data: MetricCardData;
  compactOnMobile?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ data, compactOnMobile = true }) => {
  const IconComponent = iconMap[data.iconName] || Activity;

  // Color schemes
  const colorStyles = {
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      pill: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      glow: 'from-indigo-500/10',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      pill: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      glow: 'from-emerald-500/10',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
      pill: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      glow: 'from-cyan-500/10',
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      pill: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      glow: 'from-amber-500/10',
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      pill: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      glow: 'from-rose-500/10',
    },
  }[data.color];

  const isPositive = data.changePercent > 0;
  const isNegative = data.changePercent < 0;

  return (
    <Card glow interactive padding="md" className="group overflow-hidden">
      {/* Background radial gradient accent */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${colorStyles.glow} to-transparent blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide uppercase text-slate-400 dark:text-slate-400">
            {data.title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {/* Show compact on mobile, full on desktop or compact if specified */}
              <span className={compactOnMobile ? 'sm:hidden' : ''}>
                <AnimatedNumber value={data.value} type={data.type} compact={true} />
              </span>
              {compactOnMobile && (
                <span className="hidden sm:inline">
                  <AnimatedNumber value={data.value} type={data.type} compact={false} />
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Icon Pill */}
        <div className={`p-2.5 rounded-xl ${colorStyles.iconBg} transition-transform group-hover:scale-110 duration-200`}>
          <IconComponent className="w-5 h-5 stroke-[2]" />
        </div>
      </div>

      {/* Footer Info & Trend Pill */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${
              isPositive
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400'
                : isNegative
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 dark:text-rose-400'
                : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : isNegative ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {Math.abs(data.changePercent)}%
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px] sm:max-w-none">
            {data.timeframe}
          </span>
        </div>

        {data.subtext && (
          <span className="hidden xs:inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {data.subtext}
          </span>
        )}
      </div>
    </Card>
  );
};
