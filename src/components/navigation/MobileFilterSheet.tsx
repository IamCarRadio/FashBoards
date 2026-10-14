import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFilters, BRANCHES, DOCTORS, CATEGORIES, type DatePreset } from '../../context/FilterContext';
import { X, Check, RotateCcw, Calendar, Building2, UserRound, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/Button';

export const MobileFilterSheet: React.FC = () => {
  const {
    datePreset,
    selectedBranch,
    selectedDoctor,
    selectedCategory,
    isFilterSheetOpen,
    setDatePreset,
    setSelectedBranch,
    setSelectedDoctor,
    setSelectedCategory,
    setIsFilterSheetOpen,
    resetFilters,
  } = useFilters();

  const datePresets: DatePreset[] = ['Today', 'Yesterday', '7D', '30D', 'This Month', 'Custom'];

  return (
    <AnimatePresence>
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFilterSheetOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl glass-panel p-5 max-h-[85vh] overflow-y-auto no-scrollbar border-t border-white/10 dark:text-white text-slate-900 bg-[#0E1526] light:bg-white"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-600/60 mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Executive Filter Suite
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5 my-4">
              {/* Date Presets */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Timeframe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {datePresets.map((preset) => {
                    const active = datePreset === preset;
                    return (
                      <button
                        key={preset}
                        onClick={() => setDatePreset(preset)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-100 text-slate-400 dark:text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Clinic Branch
                </label>
                <div className="space-y-1.5">
                  {BRANCHES.map((b) => {
                    const active = selectedBranch === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setSelectedBranch(b.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-medium text-left transition-all ${
                          active
                            ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                            : 'bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100/70 border border-white/5 text-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-100 dark:text-white">{b.name}</p>
                          <p className="text-[10px] text-slate-400">{b.city} &bull; Code: {b.code}</p>
                        </div>
                        {active && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Doctor */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <UserRound className="w-3.5 h-3.5 text-emerald-400" />
                  Specialist Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {DOCTORS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                  Revenue Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={() => setIsFilterSheetOpen(false)}
              variant="primary"
              size="md"
              className="w-full mt-2"
            >
              Apply Filter Selection
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
