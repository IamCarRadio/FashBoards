import React, { useState } from 'react';
import {
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig,
  clearStoredFirebaseConfig,
  isFirebaseConfigured,
  type FirebaseConfig,
} from '../../services/firebase';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Database, X, CheckCircle2, Copy, Sparkles, Key, AlertCircle } from 'lucide-react';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const current = getStoredFirebaseConfig();
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState<'paste' | 'view'>('paste');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveJson = () => {
    setStatusMessage(null);
    try {
      // Allow pasting either raw JS object format or JSON
      let cleaned = jsonInput.trim();
      if (cleaned.startsWith('const firebaseConfig =')) {
        cleaned = cleaned.replace('const firebaseConfig =', '').trim();
      }
      if (cleaned.endsWith(';')) {
        cleaned = cleaned.slice(0, -1).trim();
      }

      // Convert unquoted keys to quoted JSON if needed
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Evaluate safely with regex replacement or relaxed JSON
        const relaxedJson = cleaned.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":').replace(/'/g, '"');
        parsed = JSON.parse(relaxedJson);
      }

      if (!parsed.projectId) {
        throw new Error('Missing "projectId" in Firebase configuration');
      }

      const config: FirebaseConfig = {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
      };

      saveStoredFirebaseConfig(config);
      setStatusMessage({ type: 'success', text: `Connected! Project: ${config.projectId}` });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Invalid Firebase config format. Please paste JSON.' });
    }
  };

  const handleClear = () => {
    clearStoredFirebaseConfig();
    setStatusMessage({ type: 'success', text: 'Firebase configuration cleared. Using demo storage mode.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl glass-panel p-6 shadow-2xl relative border border-white/10 dark:text-white text-slate-900 bg-slate-900/95 light:bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Firebase Project Connection
              {isFirebaseConfigured() ? (
                <Badge variant="emerald" dot size="sm">Connected</Badge>
              ) : (
                <Badge variant="amber" size="sm">Demo Mode</Badge>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste your own Firebase credentials (Firestore + Storage)
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {current && (
            <div className="p-3.5 rounded-xl bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 border border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Firebase Project ID:</span>
                <span className="font-mono font-semibold text-cyan-400">{current.projectId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Storage Bucket:</span>
                <span className="font-mono text-slate-300">{current.storageBucket || 'Default'}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Paste Firebase Config Object
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-clinic.firebaseapp.com",\n  "projectId": "my-clinic-group",\n  "storageBucket": "my-clinic.appspot.com",\n  "appId": "1:..."\n}`}
              rows={6}
              className="w-full rounded-xl bg-slate-950/80 light:bg-slate-50 border border-slate-700/80 p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Obtain this from Firebase Console &gt; Project Settings &gt; General &gt; Your apps &gt; SDK setup and configuration.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {current && (
              <Button onClick={handleClear} variant="danger" size="sm">
                Disconnect
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button onClick={onClose} variant="ghost" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSaveJson} variant="primary" size="sm" disabled={!jsonInput.trim()}>
                Save & Connect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
