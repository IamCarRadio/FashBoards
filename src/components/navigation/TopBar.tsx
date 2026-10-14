import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useViewport, type ViewportMode } from '../../context/ViewportContext';
import { isFirebaseConfigured } from '../../services/firebase';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Badge } from '../ui/Badge';
import {
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Maximize2,
  Database,
  Activity,
} from 'lucide-react';

interface TopBarProps {
  onOpenFirebaseConfig: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenFirebaseConfig }) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { mode, setMode } = useViewport();
  const isFbConnected = isFirebaseConfigured();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] dark:bg-[#0A0E1A]/85 backdrop-blur-xl light:bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Title or Greeting */}
        <div className="flex items-center gap-3">
          <div className="flex md:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white light:text-slate-900 leading-tight">
                CEO Pulse
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Clinic Group Network</p>
            </div>
          </div>

          {/* Desktop Greeting Header */}
          <div className="hidden md:flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 light:text-slate-900">
                Welcome, {user?.name?.split(' ')[0] || 'Dr. Vikram'}
              </h2>
              <Badge variant="indigo" size="sm" dot>
                5 Hubs Active
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Consolidated Executive Financial & Clinical Run-Rate
            </p>
          </div>

          {/* Demo Data Tag */}
          <div className="hidden lg:flex items-center">
            <Badge variant="cyan" size="sm">
              DEMO DATA SIMULATION
            </Badge>
          </div>
        </div>

        {/* Right Controls: Viewport Switcher, Theme Toggle, Firebase, PWA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Viewport Simulation Switcher (Desktop 1440px / Mobile 390px / Responsive) */}
          <div className="hidden sm:flex items-center bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setMode('responsive')}
              className={`p-1.5 rounded-lg transition-colors ${
                mode === 'responsive'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Responsive View (Full Window)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMode('mobile_390')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors font-medium ${
                mode === 'mobile_390'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Preview Mobile (390px iPhone)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px]">390px</span>
            </button>
            <button
              onClick={() => setMode('desktop_1440')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors font-medium ${
                mode === 'desktop_1440'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Preview Desktop (1440px Bento)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="text-[11px]">1440px</span>
            </button>
          </div>

          {/* Firebase Connector Button */}
          <button
            onClick={onOpenFirebaseConfig}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel text-xs font-semibold text-slate-300 hover:text-white border border-white/10 active:scale-95 transition-all min-h-[36px]"
            title="Configure your own Firebase project"
          >
            <Database className={`w-3.5 h-3.5 ${isFbConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">Firebase</span>
            {isFbConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="text-[10px] text-amber-400">Plug</span>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Animated Light/Dark Mode Switcher */}
          <button
            onClick={toggleTheme}
            className="relative p-2 rounded-xl glass-panel text-slate-300 hover:text-white border border-white/10 active:scale-90 transition-transform cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-90" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
