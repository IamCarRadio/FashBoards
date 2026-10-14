import React, { useState } from 'react';
import {
  type ServiceSalesRow,
  type PackageValuesConfig,
  type RevenueMode,
  computePackageReconciliation,
} from '../../utils/metrics';
import {
  getPackageValues,
  savePackageValues,
  updateSinglePackageValue,
  getRevenueMode,
  saveRevenueMode,
} from '../../services/clinicConfigStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatINR } from '../../utils/formatters';
import {
  Package,
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface PackageValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRows: ServiceSalesRow[];
}

export const PackageValuesModal: React.FC<PackageValuesModalProps> = ({
  isOpen,
  onClose,
  allRows,
}) => {
  const [pkgValues, setPkgValues] = useState<PackageValuesConfig>(getPackageValues());
  const [revenueMode, setRevenueModeState] = useState<RevenueMode>(getRevenueMode());
  const [quickInputValues, setQuickInputValues] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Compute package reconciliation via pure function
  const reconciliation = computePackageReconciliation(allRows, pkgValues);

  const handleToggleRevenueMode = (mode: RevenueMode) => {
    setRevenueModeState(mode);
    saveRevenueMode(mode);
  };

  const handleSaveValue = (serviceName: string, value: number) => {
    const updated = { ...pkgValues, [serviceName]: value };
    setPkgValues(updated);
    savePackageValues(updated);
  };

  // All services with at least one Rs. 0 session or in package values
  const zeroServicesSummary: Record<string, { zeroCount: number; category: string }> = {};
  allRows.forEach((r) => {
    if (r.isPackageSession || r.amount === 0) {
      const s = r.serviceName.trim();
      if (!zeroServicesSummary[s]) {
        zeroServicesSummary[s] = { zeroCount: 0, category: r.canonicalCategory };
      }
      zeroServicesSummary[s].zeroCount += r.quantity || 1;
    }
  });

  const allPackageEligibleServices = Array.from(
    new Set([...Object.keys(zeroServicesSummary), ...Object.keys(pkgValues)])
  ).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl glass-panel p-5 sm:p-6 shadow-2xl relative border border-white/15 text-white bg-slate-900/95 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 text-cyan-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Package Sessions & Zero-Bill Valuation
                </h3>
                <Badge variant="indigo" size="sm">
                  Accounting Engine
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign imputed per-session valuation to enrolled package patients who appear with Rs. 0 bills
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Revenue Mode Toggle Bar */}
        <div className="my-3 p-4 rounded-2xl bg-slate-800/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <span>Active Revenue Valuation Mode:</span>
              <span className="text-cyan-400 font-mono uppercase tracking-wider">
                {revenueMode === 'collected' ? 'Collected Revenue (Cash)' : 'Service-Value Revenue (Production)'}
              </span>
            </span>
            <p className="text-[11px] text-slate-400">
              {revenueMode === 'collected'
                ? 'Counts enrolled package redemptions at Rs. 0 (actual cash receipts).'
                : 'Imputes session value to Rs. 0 package redemptions based on package price tables.'}
            </p>
          </div>

          {/* Toggle Button */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-white/10 shrink-0 text-xs">
            <button
              onClick={() => handleToggleRevenueMode('collected')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                revenueMode === 'collected'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Collected (Default)
            </button>
            <button
              onClick={() => handleToggleRevenueMode('service_value')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                revenueMode === 'service_value'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Service-Value
            </button>
          </div>
        </div>

        {/* Reconciliation Equation Card */}
        <div className="mb-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-cyan-950/40 border border-cyan-500/25 shrink-0 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              Package Value Reconciliation Equation
            </span>
            <Badge variant="emerald" dot size="sm">
              Mathematically Reconciled
            </Badge>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 font-mono text-xs sm:text-sm text-center text-slate-200">
            {reconciliation.equationText}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[11px]">
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="text-slate-400 block">Cash Collected:</span>
              <span className="font-mono font-bold text-white text-xs">{formatINR(reconciliation.collectedRevenue)}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="text-slate-400 block">+ Package Value Imputed:</span>
              <span className="font-mono font-bold text-cyan-400 text-xs">+{formatINR(reconciliation.packageValueAdded)}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="text-slate-400 block">= Service-Value Total:</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">{formatINR(reconciliation.serviceValueTotal)}</span>
            </div>
          </div>
        </div>

        {/* Visible Alert: Unmapped Rs. 0 Rows (Never silently counted as zero) */}
        {reconciliation.unmappedZeroRows.length > 0 && (
          <div className="mb-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 shrink-0 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="font-bold text-rose-300">
                {reconciliation.unmappedZeroRows.length} Services with Rs. 0 Package Sessions Missing Valuation:
              </p>
            </div>
            <p className="text-[11px] text-slate-300">
              The following services have enrolled patients with Rs. 0 bills, but no package value is set. Set a value below so they are never silently ignored:
            </p>

            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {reconciliation.unmappedZeroRows.map((unm) => (
                <div
                  key={unm.serviceName}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-rose-500/20 text-xs"
                >
                  <span className="font-bold text-slate-200">{unm.serviceName} ({unm.count} zero-sessions)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Enter Rs..."
                      value={quickInputValues[unm.serviceName] || ''}
                      onChange={(e) => setQuickInputValues({ ...quickInputValues, [unm.serviceName]: e.target.value })}
                      className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        const val = parseFloat(quickInputValues[unm.serviceName] || '0');
                        if (val > 0) handleSaveValue(unm.serviceName, val);
                      }}
                      className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-500"
                    >
                      Assign Value
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Package Values Table */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 my-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold sticky top-0 border-b border-white/10 z-10 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3">Rs. 0 Sessions Logged</th>
                <th className="py-2.5 px-3">Configured Per-Session Value</th>
                <th className="py-2.5 px-3 text-right">Total Imputed Package Realization</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {allPackageEligibleServices.map((sName) => {
                const zeroCount = zeroServicesSummary[sName]?.zeroCount || 0;
                const currentValue = pkgValues[sName] || 0;
                const totalValue = zeroCount * currentValue;

                return (
                  <tr key={sName} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 font-sans font-bold text-white">
                      <span>{sName}</span>
                      {zeroCount > 0 && currentValue === 0 && (
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Unassigned Rs. 0
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {zeroCount > 0 ? (
                        <span className="text-amber-300 font-bold">{zeroCount} sessions</span>
                      ) : (
                        <span className="text-slate-500">0 sessions</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">₹</span>
                        <input
                          type="number"
                          defaultValue={currentValue || ''}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            handleSaveValue(sName, val);
                          }}
                          placeholder="e.g. 8500"
                          className="w-28 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-cyan-400 font-mono">
                      {formatINR(totalValue)}
                    </td>

                    <td className="py-3 px-3 text-right font-sans">
                      {currentValue > 0 ? (
                        <span className="text-emerald-400 text-[11px] font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Configured
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Unset</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Zero-dollar rows are tracked and reconciled transparently.</span>
          </div>

          <Button onClick={onClose} variant="primary" size="sm">
            Save & Close Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};
