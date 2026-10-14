import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Stethoscope,
  UserCheck,
  Pill,
  Sparkles,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  Activity,
} from 'lucide-react';
import type { TabId } from './MobileBottomNav';
import { useAuth } from '../../context/AuthContext';

interface DesktopSidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const navItems = [
    { id: 'home' as TabId, label: 'Executive Pulse', icon: LayoutDashboard, badge: 'Live' },
    { id: 'services' as TabId, label: 'Clinical Services', icon: Stethoscope },
    { id: 'doctors' as TabId, label: 'Doctor Practice', icon: UserCheck },
    { id: 'pharmacy' as TabId, label: 'Pharmacy Network', icon: Pill, badge: '38% Marg' },
    { id: 'ai' as TabId, label: 'Ask AI Intelligence', icon: Sparkles, badge: 'Gemini' },
    { id: 'upload' as TabId, label: 'EMR / MIS Upload', icon: UploadCloud },
  ];

  return (
    <aside
      className={`
        hidden md:flex flex-col shrink-0 border-r border-white/[0.08] dark:bg-[#0A0E1A]/95 light:bg-white transition-all duration-300 z-30
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-5 border-b border-white/[0.08]">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Activity className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0E1A] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white light:text-slate-900">
                  CEO Pulse
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Multi-Branch Clinics</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Activity className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-5 px-3 space-y-1.5">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Executive Modules
          </p>
        )}

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="desktopSidebarActive"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/30 via-indigo-500/20 to-cyan-500/20 border border-indigo-400/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <Icon
                className={`relative z-10 w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400 stroke-[2.2]' : 'text-slate-400'
                }`}
              />

              {!collapsed && (
                <div className="relative z-10 flex-1 flex items-center justify-between text-left">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Network Health Summary Card */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-4 rounded-xl bg-slate-900/60 light:bg-slate-100 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              Network Hubs
            </span>
            <span className="text-emerald-400 font-bold">5 Online</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-[94%]" />
          </div>
          <p className="text-[10px] text-slate-400">94.2% Daily Run-rate target reached</p>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-white/[0.08]">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-white/[0.02]`}>
          <div className="relative shrink-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name || 'CEO'}
              className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/20"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0A0E1A]" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                {user?.role} &bull; Group Ops
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
