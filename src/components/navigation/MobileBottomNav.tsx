import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Stethoscope,
  UserCheck,
  Pill,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

export type TabId = 'home' | 'services' | 'doctors' | 'pharmacy' | 'ai' | 'upload';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'services', label: 'Services', icon: Stethoscope },
  { id: 'doctors', label: 'Doctors', icon: UserCheck },
  { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
  { id: 'ai', label: 'Ask AI', icon: Sparkles },
  { id: 'upload', label: 'Upload', icon: UploadCloud },
];

interface MobileBottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-2 sm:p-3 pointer-events-none md:hidden">
      <nav className="pointer-events-auto mx-auto max-w-lg rounded-2xl glass-pill px-1.5 py-1 shadow-2xl flex items-center justify-around border border-white/10 dark:bg-slate-950/90">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] cursor-pointer group active:scale-90 transition-transform"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavPill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/25 via-cyan-500/25 to-indigo-500/25 border border-indigo-400/30"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center gap-0.5">
                <Icon
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isActive
                      ? 'text-cyan-400 stroke-[2.2]'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span
                  className={`text-[9px] font-semibold tracking-tight transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
