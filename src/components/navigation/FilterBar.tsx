import React from 'react';
import { motion } from 'motion/react';
import {
  useFilters,
  BRANCHES,
  DOCTORS,
  CATEGORIES,
  type DatePreset,
} from '../../context/FilterContext';
import {
  Calendar,
  Building2,
  UserCheck,
  Layers,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const FilterBar: React.FC = () => {
  const {
    datePreset,
    selectedBranch,
    selectedDoctor,
    selectedCategory,
    setDatePreset,
    setSelectedBranch,
    setSelectedDoctor,
    setSelectedCategory,
    setIsFilterSheetOpen,
    resetFilters,
  } = useFilters();

  const datePresets: DatePreset[] = ['Today', 'Yesterday', '7D', '30D', 'This Month'];

  const activeFiltersCount =
    (selectedBranch !== 'all' ? 1 : 0) +
    (selectedDoctor !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0);

  return (
    <div className="w-full">
      {/* Mobile Bar: Compact pill row with open sheet button */}
      <div className="flex md:hidden items-center justify-between gap-2 py-2">
        {/* Swipeable date preset chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {datePresets.map((preset) => {
            const active = datePreset === preset;
            return (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`relative px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200 bg-white/[0.04]'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobileDatePresetPill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{preset}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Trigger Button */}
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-xs font-semibold text-slate-200 border border-white/10 min-h-[36px] active:scale-95 transition-transform"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop Bar: Full inline 1440px bar */}
      <div className="hidden md:flex items-center justify-between gap-4 p-2.5 rounded-2xl glass-panel border border-white/[0.08]">
        {/* Date presets with animated sliding pill */}
        <div className="flex items-center gap-1 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 p-1 rounded-xl border border-white/5">
          <Calendar className="w-4 h-4 text-indigo-400 ml-2 mr-1" />
          {datePresets.map((preset) => {
            const active = datePreset === preset;
            return (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="desktopDatePresetPill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/25"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{preset}</span>
              </button>
            );
          })}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2.5">
          {/* Branch Dropdown */}
          <div className="relative flex items-center">
            <Building2 className="w-3.5 h-3.5 text-cyan-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-white/10 dark:text-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
            >
              {BRANCHES.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Dropdown */}
          <div className="relative flex items-center">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-white/10 dark:text-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
            >
              {DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="relative flex items-center">
            <Layers className="w-3.5 h-3.5 text-amber-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-white/10 dark:text-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
