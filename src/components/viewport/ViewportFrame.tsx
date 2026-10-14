import React from 'react';
import { useViewport } from '../../context/ViewportContext';
import { Smartphone, Monitor, Maximize2, Sparkles, Wifi, Battery, Signal } from 'lucide-react';

interface ViewportFrameProps {
  children: React.ReactNode;
}

export const ViewportFrame: React.FC<ViewportFrameProps> = ({ children }) => {
  const { mode, setMode } = useViewport();

  if (mode === 'mobile_390') {
    return (
      <div className="min-h-screen py-6 px-2 flex flex-col items-center justify-start bg-slate-950/90 relative z-10 overflow-x-hidden">
        {/* Device Switcher Ribbon */}
        <div className="mb-4 flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white">iPhone 15 Pro Emulation Mode</span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              390 × 844 px
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={() => setMode('desktop_1440')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            <span>Switch to 1440px Desktop</span>
          </button>

          <button
            onClick={() => setMode('responsive')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Responsive</span>
          </button>
        </div>

        {/* iPhone 15 Pro Physical Bezel */}
        <div className="relative w-[390px] h-[844px] rounded-[52px] bg-black p-3.5 shadow-2xl ring-1 ring-white/20 shadow-cyan-500/10 flex flex-col overflow-hidden shrink-0 border-[4px] border-[#2A2E3D]">
          {/* Dynamic Island */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-3 border border-white/[0.08]">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800" />
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* iOS Status Bar */}
          <div className="w-full h-8 px-6 pt-1 flex items-center justify-between text-[11px] font-semibold text-white/90 z-40 shrink-0 select-none">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-white/80">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Screen Display Area */}
          <div className="relative w-full flex-1 rounded-[40px] overflow-hidden flex flex-col bg-[#0A0E1A]">
            <div className="flex-1 overflow-y-auto no-scrollbar relative">
              {children}
            </div>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="w-full h-4 flex items-center justify-center shrink-0">
            <div className="w-32 h-1 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'desktop_1440') {
    return (
      <div className="min-h-screen py-6 px-4 flex flex-col items-center bg-slate-950/80 relative z-10">
        {/* Device Switcher Ribbon */}
        <div className="mb-4 flex items-center gap-3 glass-panel px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">Desktop 1440px Canvas Mode</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              1440 × 900 px
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <button
            onClick={() => setMode('mobile_390')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Switch to 390px Mobile</span>
          </button>

          <button
            onClick={() => setMode('responsive')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Responsive</span>
          </button>
        </div>

        {/* 1440px Centered Desktop Window Container */}
        <div className="w-full max-w-[1440px] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-[#0A0E1A]">
          {/* Mac-style Window Top Bar */}
          <div className="h-9 px-4 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              CEO Pulse &bull; Executive Command Console (1440px)
            </span>
            <div className="w-12" />
          </div>

          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Responsive mode: fills viewport
  return <>{children}</>;
};
