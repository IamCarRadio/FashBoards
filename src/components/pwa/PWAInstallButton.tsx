import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA, render a tiny "Installed / Standalone" badge or hide
  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">PWA App Active</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) setInstallSuccess(true);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Direct instruction fallback modal
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="glass"
        size="sm"
        icon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
        className={`group text-xs font-semibold ${className}`}
      >
        <span>{variant === 'compact' ? 'Install' : 'Install CEO App'}</span>
      </Button>

      {/* iOS or Desktop Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-panel p-6 shadow-2xl relative border border-white/10 dark:text-white text-slate-900 bg-slate-900/95 light:bg-white">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                P
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Install CEO Pulse</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add to Home Screen for 60fps Native Feel</p>
              </div>
            </div>

            <div className="space-y-3.5 my-5 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 dark:bg-slate-800/40 light:bg-slate-100 border border-white/5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">Step 1</p>
                  <p className="text-xs mt-0.5">Tap the <strong>Share</strong> icon in the Safari/Browser toolbar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 dark:bg-slate-800/40 light:bg-slate-100 border border-white/5">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-xs">Step 2</p>
                  <p className="text-xs mt-0.5">Scroll down and select <strong>"Add to Home Screen"</strong>.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowIOSGuide(false)}
              variant="primary"
              size="md"
              className="w-full"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
