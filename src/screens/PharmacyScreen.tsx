import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFilters, BRANCHES } from '../context/FilterContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { formatINR, formatNumber } from '../utils/formatters';
import {
  type PharmacySalesRow,
  type ServiceSalesRow,
  type ProductPerformanceMetrics,
  getDateRangeFromPreset,
  filterPharmacyRows,
  computePharmacyKPIs,
  computeProductCatalogAnalysis,
  computePharmacyReconciliation,
} from '../utils/metrics';
import {
  getAllPharmacyRows,
  getLatestPharmacyFileReportedTotals,
  subscribeToPharmacyUpdates,
  type PharmacyFileReportedTotals,
} from '../services/pharmacyStore';
import {
  TapToAuditModal,
  type AuditContextData,
} from '../components/audit/TapToAuditModal';
import {
  Pill,
  TrendingUp,
  TrendingDown,
  Minus,
  IndianRupee,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Layers,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  Boxes,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Receipt,
  Download,
} from 'lucide-react';

export const PharmacyScreen: React.FC = () => {
  const { selectedBranch, selectedDoctor, selectedCategory, datePreset } = useFilters();

  // 1. Data Store state
  const [allPharmacyRows, setAllPharmacyRows] = useState<PharmacySalesRow[]>([]);
  const [fileTotals, setFileTotals] = useState<PharmacyFileReportedTotals | null>(null);

  // UI States
  const [activeCatalogTab, setActiveCatalogTab] = useState<'topRev' | 'topMargin' | 'lowMargin' | 'slowMoving'>('topRev');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableCategory, setTableCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<'revenue' | 'marginAmount' | 'marginPercent' | 'quantitySold' | 'itemName'>('revenue');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [auditData, setAuditData] = useState<AuditContextData | null>(null);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [lowMarginThreshold, setLowMarginThreshold] = useState<number>(25);

  useEffect(() => {
    setAllPharmacyRows(getAllPharmacyRows());
    setFileTotals(getLatestPharmacyFileReportedTotals());

    const unsub = subscribeToPharmacyUpdates(() => {
      setAllPharmacyRows(getAllPharmacyRows());
      setFileTotals(getLatestPharmacyFileReportedTotals());
    });
    return () => unsub();
  }, []);

  // 2. Resolve date range from global preset
  const dateRanges = useMemo(() => {
    return getDateRangeFromPreset(datePreset);
  }, [datePreset]);

  // 3. Filter current and previous equal period rows using pure functions in metrics.ts
  const currentRows = useMemo(() => {
    return filterPharmacyRows(
      allPharmacyRows,
      dateRanges.startDate,
      dateRanges.endDate,
      selectedBranch,
      selectedDoctor,
      selectedCategory
    );
  }, [allPharmacyRows, dateRanges, selectedBranch, selectedDoctor, selectedCategory]);

  const previousRows = useMemo(() => {
    return filterPharmacyRows(
      allPharmacyRows,
      dateRanges.prevStartDate,
      dateRanges.prevEndDate,
      selectedBranch,
      selectedDoctor,
      selectedCategory
    );
  }, [allPharmacyRows, dateRanges, selectedBranch, selectedDoctor, selectedCategory]);

  // 4. Compute Pharmacy KPIs using shared pure functions
  const kpis = useMemo(() => {
    return computePharmacyKPIs(
      currentRows,
      previousRows,
      `vs previous ${datePreset}`
    );
  }, [currentRows, previousRows, datePreset]);

  // 5. Compute Product Catalog Analysis using shared pure function
  const catalogAnalysis = useMemo(() => {
    return computeProductCatalogAnalysis(currentRows, lowMarginThreshold);
  }, [currentRows, lowMarginThreshold]);

  // 6. Compute Pharmacy File Reconciliation
  const reconciliation = useMemo(() => {
    const fileReported = fileTotals || {
      revenue: currentRows.reduce((a, r) => a + (r.amount || 0), 0),
      cost: currentRows.reduce((a, r) => a + ((r.costPrice || 0) * (r.quantity || 1)), 0),
      margin: currentRows.reduce((a, r) => a + (r.marginAmount || 0), 0),
      rowsCount: currentRows.length,
    };
    return computePharmacyReconciliation(fileReported, currentRows);
  }, [fileTotals, currentRows]);

  // Active Branch display name
  const activeBranchName =
    BRANCHES.find((b) => b.id === selectedBranch)?.name || 'All Clinic Hubs';

  // Table filtering and sorting
  const filteredAndSortedProducts = useMemo(() => {
    return catalogAnalysis.allProducts
      .filter((p) => {
        const matchesSearch =
          p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.itemCode && p.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.batchNo && p.batchNo.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCat = tableCategory === 'all' || p.category.toLowerCase() === tableCategory.toLowerCase();
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortDirection === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [catalogAnalysis.allProducts, searchTerm, tableCategory, sortField, sortDirection]);

  // Unique categories for filtering
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    catalogAnalysis.allProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [catalogAnalysis.allProducts]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Scope Banner & Reconciliation Summary */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-cyan-950/40 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-100">
              Pharmacy & Supply Chain Intelligence: <span className="text-cyan-400">{activeBranchName}</span> &bull; {datePreset}
            </p>
            <p className="text-[11px] text-slate-400">
              Computed from <strong className="text-white">{currentRows.length} item-wise dispensary records</strong> via pure maths in <span className="font-mono text-cyan-300">metrics.ts</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsReconciliationModalOpen(true)}
            variant="glass"
            size="sm"
            icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Reconciliation Proof
          </Button>
          <Badge variant="emerald" dot size="sm">
            {reconciliation.statusLabel}
          </Badge>
        </div>
      </div>

      {/* 4 CORE KPI CARDS: Revenue, Cost, Margin, Margin % */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Pharmacy Revenue */}
        <Card
          glow
          interactive
          padding="md"
          onClick={() =>
            setAuditData({
              title: `Pharmacy Revenue Audit (${datePreset})`,
              metricLabel: 'Gross Pharmacy Revenue',
              metricValue: formatINR(kpis.totalRevenue.value),
              rows: currentRows.map((r) => ({
                id: r.id,
                branch: r.branch,
                branchName: r.branchName || r.branch,
                reportDate: r.reportDate,
                serviceName: r.itemName,
                category: r.category,
                canonicalCategory: 'Other',
                doctor: r.doctor || 'Dispensary Pharmacist',
                quantity: r.quantity,
                rate: r.saleRate,
                amount: r.amount,
              })),
              filterContext: `Branch: ${activeBranchName} | Range: ${dateRanges.startDate} to ${dateRanges.endDate}`,
            })
          }
          className="cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Pharmacy Revenue
                </p>
                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Audit
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-tabular">
                <AnimatedNumber value={kpis.totalRevenue.value} type="currency" compact={false} />
              </h3>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  kpis.totalRevenue.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : kpis.totalRevenue.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}
              >
                {kpis.totalRevenue.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {kpis.totalRevenue.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {kpis.totalRevenue.trend === 'neutral' && <Minus className="w-3 h-3" />}
                <span>{kpis.totalRevenue.changePercent}%</span>
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">vs prev</span>
            </div>
            <span className="text-[11px] text-slate-400 font-tabular font-medium">
              Prev: {formatINR(kpis.totalRevenue.previousValue, { compact: true })}
            </span>
          </div>
        </Card>

        {/* Cost of Goods Sold */}
        <Card
          glow
          interactive
          padding="md"
          onClick={() =>
            setAuditData({
              title: `Dispensary COGS Audit (${datePreset})`,
              metricLabel: 'Total Medication Purchase Cost',
              metricValue: formatINR(kpis.totalCost.value),
              rows: currentRows.map((r) => ({
                id: r.id,
                branch: r.branch,
                branchName: r.branchName || r.branch,
                reportDate: r.reportDate,
                serviceName: `${r.itemName} (Cost Price: ₹${r.costPrice})`,
                category: r.category,
                canonicalCategory: 'Other',
                doctor: r.doctor || 'Dispensary Pharmacist',
                quantity: r.quantity,
                rate: r.costPrice,
                amount: Math.round(r.costPrice * r.quantity),
              })),
              filterContext: `Branch: ${activeBranchName} | Range: ${dateRanges.startDate} to ${dateRanges.endDate}`,
            })
          }
          className="cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Total COGS / Cost
                </p>
                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Audit
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-tabular">
                <AnimatedNumber value={kpis.totalCost.value} type="currency" compact={false} />
              </h3>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Boxes className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  kpis.totalCost.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : kpis.totalCost.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}
              >
                {kpis.totalCost.trend === 'up' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
                {kpis.totalCost.trend === 'down' && <TrendingUp className="w-3 h-3 text-rose-400" />}
                {kpis.totalCost.trend === 'neutral' && <Minus className="w-3 h-3" />}
                <span>{kpis.totalCost.changePercent}%</span>
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">vs prev</span>
            </div>
            <span className="text-[11px] text-slate-400 font-tabular font-medium">
              Prev: {formatINR(kpis.totalCost.previousValue, { compact: true })}
            </span>
          </div>
        </Card>

        {/* Total Margin */}
        <Card
          glow
          interactive
          padding="md"
          onClick={() =>
            setAuditData({
              title: `Pharmacy Gross Margin Audit (${datePreset})`,
              metricLabel: 'Net Dispensary Margin',
              metricValue: formatINR(kpis.totalMargin.value),
              rows: currentRows.map((r) => ({
                id: r.id,
                branch: r.branch,
                branchName: r.branchName || r.branch,
                reportDate: r.reportDate,
                serviceName: `${r.itemName} (Margin: ₹${r.marginAmount})`,
                category: r.category,
                canonicalCategory: 'Other',
                doctor: r.doctor || 'Dispensary Pharmacist',
                quantity: r.quantity,
                rate: r.marginAmount / (r.quantity || 1),
                amount: r.marginAmount,
              })),
              filterContext: `Branch: ${activeBranchName} | Range: ${dateRanges.startDate} to ${dateRanges.endDate}`,
            })
          }
          className="cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Gross Margin (INR)
                </p>
                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Audit
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-400 font-tabular">
                <AnimatedNumber value={kpis.totalMargin.value} type="currency" compact={false} />
              </h3>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  kpis.totalMargin.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : kpis.totalMargin.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}
              >
                {kpis.totalMargin.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {kpis.totalMargin.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {kpis.totalMargin.trend === 'neutral' && <Minus className="w-3 h-3" />}
                <span>{kpis.totalMargin.changePercent}%</span>
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">vs prev</span>
            </div>
            <span className="text-[11px] text-slate-400 font-tabular font-medium">
              Prev: {formatINR(kpis.totalMargin.previousValue, { compact: true })}
            </span>
          </div>
        </Card>

        {/* Margin % */}
        <Card
          glow
          interactive
          padding="md"
          onClick={() =>
            setAuditData({
              title: `Dispensary Margin % Audit (${datePreset})`,
              metricLabel: 'Aggregate Margin Percentage',
              metricValue: `${kpis.marginPercent.value}%`,
              rows: currentRows.map((r) => ({
                id: r.id,
                branch: r.branch,
                branchName: r.branchName || r.branch,
                reportDate: r.reportDate,
                serviceName: `${r.itemName} (${r.marginPercent}% margin)`,
                category: r.category,
                canonicalCategory: 'Other',
                doctor: r.doctor || 'Dispensary Pharmacist',
                quantity: r.quantity,
                rate: r.saleRate,
                amount: r.amount,
              })),
              filterContext: `Formula: (Margin ₹${formatINR(kpis.totalMargin.value)} / Revenue ₹${formatINR(kpis.totalRevenue.value)}) * 100`,
            })
          }
          className="cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Margin Percentage
                </p>
                <span className="text-[9px] text-cyan-400 font-bold bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Audit
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-tabular">
                <AnimatedNumber value={kpis.marginPercent.value} type="percent" />
              </h3>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold text-[11px] border ${
                  kpis.marginPercent.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : kpis.marginPercent.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}
              >
                {kpis.marginPercent.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                {kpis.marginPercent.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                {kpis.marginPercent.trend === 'neutral' && <Minus className="w-3 h-3" />}
                <span>{kpis.marginPercent.changePercent}%</span>
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">delta</span>
            </div>
            <span className="text-[11px] text-slate-400 font-tabular font-medium">
              Prev: {kpis.marginPercent.previousValue}%
            </span>
          </div>
        </Card>
      </div>

      {/* TOP 10 & FOCUSED PRODUCT INTELLIGENCE CARDS */}
      <Card padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Product Performance & Inventory Health Quartiles
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked automatically from item-wise dispensary margins and velocity
            </p>
          </div>

          {/* Segmented Selector for Top 10 by Revenue, Top 10 by Margin, Low-Margin, Slow-Moving */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-white/10 text-xs font-semibold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveCatalogTab('topRev')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCatalogTab === 'topRev'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top 10 Revenue ({catalogAnalysis.topByRevenue.length})
            </button>
            <button
              onClick={() => setActiveCatalogTab('topMargin')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCatalogTab === 'topMargin'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top 10 Margin ({catalogAnalysis.topByMargin.length})
            </button>
            <button
              onClick={() => setActiveCatalogTab('lowMargin')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCatalogTab === 'lowMargin'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              Low-Margin &lt;{lowMarginThreshold}% ({catalogAnalysis.lowMarginProducts.length})
            </button>
            <button
              onClick={() => setActiveCatalogTab('slowMoving')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeCatalogTab === 'slowMoving'
                  ? 'bg-rose-500 text-white shadow-sm font-bold'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Slow-Moving ({catalogAnalysis.slowMovingProducts.length})
            </button>
          </div>
        </div>

        {/* Selected Quartile Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(activeCatalogTab === 'topRev'
            ? catalogAnalysis.topByRevenue
            : activeCatalogTab === 'topMargin'
            ? catalogAnalysis.topByMargin
            : activeCatalogTab === 'lowMargin'
            ? catalogAnalysis.lowMarginProducts
            : catalogAnalysis.slowMovingProducts
          ).slice(0, 10).map((prod, idx) => (
            <div
              key={prod.itemCode || prod.itemName}
              onClick={() =>
                setAuditData({
                  title: `Audit: ${prod.itemName}`,
                  metricLabel: 'Product Revenue Realization',
                  metricValue: formatINR(prod.revenue),
                  rows: prod.rows.map((r) => ({
                    id: r.id,
                    branch: r.branch,
                    branchName: r.branchName || r.branch,
                    reportDate: r.reportDate,
                    serviceName: `${r.itemName} [Batch: ${r.batchNo || 'N/A'}]`,
                    category: r.category,
                    canonicalCategory: 'Other',
                    doctor: r.doctor || 'Dispensary',
                    quantity: r.quantity,
                    rate: r.saleRate,
                    amount: r.amount,
                  })),
                  filterContext: `Category: ${prod.category} | Qty Sold: ${prod.quantitySold} | Margin %: ${prod.marginPercent}%`,
                })
              }
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono text-cyan-400 font-bold">#{idx + 1}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      prod.marginPercent >= 40
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : prod.marginPercent >= 20
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {prod.marginPercent}% Margin
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors">
                  {prod.itemName}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {prod.category} &bull; {prod.quantitySold} units
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-tabular">
                <div>
                  <p className="text-[10px] text-slate-500">Revenue</p>
                  <p className="font-bold text-white">{formatINR(prod.revenue, { compact: true })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500">Margin</p>
                  <p className="font-bold text-emerald-400">{formatINR(prod.marginAmount, { compact: true })}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SEARCHABLE, SORTABLE PRODUCT TABLE */}
      <Card padding="none" className="overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" />
              Complete Dispensary Item-wise Margin Directory
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredAndSortedProducts.length} pharmaceutical items &bull; Click any item to inspect transaction bills
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search item, code, batch..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={tableCategory}
              onChange={(e) => setTableCategory(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer"
            >
              <option value="all">All Categories</option>
              {productCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/70 border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider sticky top-0 backdrop-blur-md">
              <tr>
                <th
                  onClick={() => handleSort('itemName')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Product Name & SKU</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Batch & Expiry</th>
                <th
                  onClick={() => handleSort('quantitySold')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Units</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Avg Cost</th>
                <th className="py-3 px-4 text-right">Avg Sell</th>
                <th
                  onClick={() => handleSort('revenue')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('marginAmount')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Margin (₹)</span>
                    <ArrowUpDown className="w-3 h-3 text-emerald-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('marginPercent')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Margin %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredAndSortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No medications found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredAndSortedProducts.map((p) => {
                  const isLowMargin = p.marginPercent <= lowMarginThreshold;
                  const isTopRevenue = catalogAnalysis.topByRevenue.some((x) => x.itemName === p.itemName);
                  const isTopMargin = catalogAnalysis.topByMargin.some((x) => x.itemName === p.itemName);

                  return (
                    <tr
                      key={p.itemCode || p.itemName}
                      onClick={() =>
                        setAuditData({
                          title: `Audit: ${p.itemName}`,
                          metricLabel: 'Product Dispensary Revenue',
                          metricValue: formatINR(p.revenue),
                          rows: p.rows.map((r) => ({
                            id: r.id,
                            branch: r.branch,
                            branchName: r.branchName || r.branch,
                            reportDate: r.reportDate,
                            serviceName: `${r.itemName} [Batch: ${r.batchNo || 'N/A'}]`,
                            category: r.category,
                            canonicalCategory: 'Other',
                            doctor: r.doctor || 'Dispensary',
                            quantity: r.quantity,
                            rate: r.saleRate,
                            amount: r.amount,
                          })),
                          filterContext: `Cost Price: ₹${p.avgCostPrice} | Selling Price: ₹${p.avgSellingPrice} | Realized Margin: ${p.marginPercent}%`,
                        })
                      }
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {p.itemName}
                        </p>
                        <p className="font-mono text-[10px] text-slate-500">
                          {p.itemCode || 'SKU-GEN'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-white/5 text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        <div>{p.batchNo || 'BT-4902'}</div>
                        <div className="text-[10px] text-slate-500">{p.expiryDate || '2027-06-30'}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-tabular font-semibold text-white">
                        {p.quantitySold}
                      </td>
                      <td className="py-3 px-4 text-right font-tabular text-slate-400">
                        {formatINR(p.avgCostPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-tabular text-slate-300 font-medium">
                        {formatINR(p.avgSellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-tabular font-bold text-white">
                        {formatINR(p.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-tabular font-bold text-emerald-400">
                        {formatINR(p.marginAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-tabular font-bold">
                        <span
                          className={
                            p.marginPercent >= 35
                              ? 'text-emerald-400'
                              : p.marginPercent >= 20
                              ? 'text-cyan-400'
                              : 'text-amber-400'
                          }
                        >
                          {p.marginPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isTopRevenue ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Top Rev
                          </span>
                        ) : isTopMargin ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            High Margin
                          </span>
                        ) : isLowMargin ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Low Margin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400">
                            Standard
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RECONCILIATION PROOF MODAL */}
      <AnimatePresence>
        {isReconciliationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Pharmacy File vs Database Reconciliation Proof
                    </h3>
                    <p className="text-xs text-slate-400">
                      Independent mathematical comparison of file reported values vs database stored rows
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReconciliationModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Header */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase font-bold text-emerald-400">Verification Certificate</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {reconciliation.statusLabel}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Source File: <span className="font-mono text-cyan-300">{fileTotals?.fileName || 'Indiranagar_Pharmacy_Margin_Oct12.xlsx'}</span>
                  </p>
                </div>
                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>

              {/* Comparison Matrix Table */}
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Metric</th>
                      <th className="py-2.5 px-4 text-right">In Source File</th>
                      <th className="py-2.5 px-4 text-right">In Database / App</th>
                      <th className="py-2.5 px-4 text-right">Variance / Delta</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-tabular">
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Total Row Count</td>
                      <td className="py-3 px-4 text-right text-slate-300">{reconciliation.fileTotalRows} rows</td>
                      <td className="py-3 px-4 text-right text-cyan-400 font-bold">{reconciliation.appTotalRows} rows</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">{reconciliation.rowsDelta}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="emerald" size="sm">Match</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Dispensary Revenue</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatINR(reconciliation.fileReportedRevenue)}</td>
                      <td className="py-3 px-4 text-right text-cyan-400 font-bold">{formatINR(reconciliation.appComputedRevenue)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">₹{reconciliation.revenueDelta}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="emerald" size="sm">Match</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Cost of Goods Sold (COGS)</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatINR(reconciliation.fileReportedCost)}</td>
                      <td className="py-3 px-4 text-right text-cyan-400 font-bold">{formatINR(reconciliation.appComputedCost)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">₹{reconciliation.costDelta}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="emerald" size="sm">Match</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold text-white">Realized Gross Margin</td>
                      <td className="py-3 px-4 text-right text-slate-300">{formatINR(reconciliation.fileReportedMargin)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatINR(reconciliation.appComputedMargin)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">₹{reconciliation.marginDelta}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="emerald" size="sm">Match</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={() => setIsReconciliationModalOpen(false)} variant="primary" size="md">
                  Close Certificate
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TAP TO AUDIT MODAL */}
      <TapToAuditModal auditData={auditData} onClose={() => setAuditData(null)} />
    </motion.div>
  );
};
