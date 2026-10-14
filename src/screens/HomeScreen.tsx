import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useFilters, BRANCHES } from '../context/FilterContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { formatINR, formatNumber } from '../utils/formatters';
import {
  type ServiceSalesRow,
  type CanonicalCategory,
  type PharmacySalesRow,
  getDateRangeFromPreset,
  filterRows,
  filterPharmacyRows,
  enrichAndMapRows,
  computePackageReconciliation,
  computeExecutiveKPIs,
  computeDailyRevenueTrend,
  computeTopAndBottomServices,
  computeCategorySplit,
  computeRevenueByDoctor,
  computeBranchComparison,
  computeConsolidatedHomeTotals,
} from '../utils/metrics';
import {
  getAllServiceSalesRows,
  subscribeToDataUpdates,
} from '../services/serviceSalesStore';
import {
  getAllPharmacyRows,
  subscribeToPharmacyUpdates,
} from '../services/pharmacyStore';
import {
  getCategoryMappings,
  getPackageValues,
  getRevenueMode,
  saveRevenueMode,
  subscribeToConfigUpdates,
} from '../services/clinicConfigStore';
import {
  TapToAuditModal,
  type AuditContextData,
} from '../components/audit/TapToAuditModal';
import { IndependentRecomputeCard } from '../components/audit/IndependentRecomputeCard';
import { PackageValuesModal } from '../components/settings/PackageValuesModal';
import { AISummaryCard } from '../components/AISummaryCard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  IndianRupee,
  Users,
  Receipt,
  FileCheck2,
  Building2,
  Sparkles,
  Award,
  Layers,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Package,
  Pill,
  AlertTriangle,
  Calculator,
  ChevronDown,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { selectedBranch, selectedDoctor, selectedCategory, datePreset } = useFilters();

  // Real raw rows from Service Sales storage
  const [allRows, setAllRows] = useState<ServiceSalesRow[]>([]);
  const [categoryMappings, setCategoryMappings] = useState(getCategoryMappings());
  const [packageValues, setPackageValues] = useState(getPackageValues());
  const [revenueMode, setRevenueModeState] = useState(getRevenueMode());
  const [includePharmacy, setIncludePharmacy] = useState<boolean>(false);
  const [allPharmacyRows, setAllPharmacyRows] = useState<PharmacySalesRow[]>([]);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  const [auditData, setAuditData] = useState<AuditContextData | null>(null);
  const [serviceRankTab, setServiceRankTab] = useState<'topRev' | 'bottomRev' | 'topCount' | 'bottomCount'>('topRev');

  useEffect(() => {
    setAllRows(getAllServiceSalesRows());
    setAllPharmacyRows(getAllPharmacyRows());

    const unsubData = subscribeToDataUpdates(() => setAllRows(getAllServiceSalesRows()));
    const unsubPharmacy = subscribeToPharmacyUpdates(() => setAllPharmacyRows(getAllPharmacyRows()));
    const unsubConfig = subscribeToConfigUpdates(() => {
      setCategoryMappings(getCategoryMappings());
      setPackageValues(getPackageValues());
      setRevenueModeState(getRevenueMode());
    });
    return () => {
      unsubData();
      unsubPharmacy();
      unsubConfig();
    };
  }, []);

  // 1. Enrich raw rows with Category Mapping and Package Values
  const enrichedRows = useMemo(() => {
    return enrichAndMapRows(allRows, categoryMappings, packageValues, revenueMode);
  }, [allRows, categoryMappings, packageValues, revenueMode]);

  // 2. Resolve date ranges via pure function in metrics.ts
  const dateRanges = useMemo(() => {
    return getDateRangeFromPreset(datePreset);
  }, [datePreset]);

  // 3. Filter current and previous equal period rows via pure function
  const currentRows = useMemo(() => {
    return filterRows(
      enrichedRows,
      dateRanges.startDate,
      dateRanges.endDate,
      selectedBranch,
      selectedDoctor,
      selectedCategory
    );
  }, [enrichedRows, dateRanges, selectedBranch, selectedDoctor, selectedCategory]);

  const previousRows = useMemo(() => {
    return filterRows(
      enrichedRows,
      dateRanges.prevStartDate,
      dateRanges.prevEndDate,
      selectedBranch,
      selectedDoctor,
      selectedCategory
    );
  }, [enrichedRows, dateRanges, selectedBranch, selectedDoctor, selectedCategory]);

  // 4. Pharmacy Stream filtering for current and previous period
  const currentPharmacyRows = useMemo(() => {
    return filterPharmacyRows(
      allPharmacyRows,
      dateRanges.startDate,
      dateRanges.endDate,
      selectedBranch,
      selectedDoctor,
      selectedCategory
    );
  }, [allPharmacyRows, dateRanges, selectedBranch, selectedDoctor, selectedCategory]);

  const previousPharmacyRows = useMemo(() => {
    return filterPharmacyRows(
      allPharmacyRows,
      dateRanges.prevStartDate,
      dateRanges.prevEndDate,
      selectedBranch,
      selectedDoctor,
      selectedCategory
    );
  }, [allPharmacyRows, dateRanges, selectedBranch, selectedDoctor, selectedCategory]);

  // Consolidated Totals via pure function in metrics.ts
  const consolidatedTotals = useMemo(() => {
    const currentServiceRev = currentRows.reduce((a, r) => a + (r.amount || 0), 0);
    const currentServiceBills = currentRows.length;
    const currentPharmRev = currentPharmacyRows.reduce((a, r) => a + (r.amount || 0), 0);
    const currentPharmBills = currentPharmacyRows.length;

    return computeConsolidatedHomeTotals(
      currentServiceRev,
      currentServiceBills,
      currentPharmRev,
      currentPharmBills,
      includePharmacy
    );
  }, [currentRows, currentPharmacyRows, includePharmacy]);

  const previousConsolidatedTotals = useMemo(() => {
    const prevServiceRev = previousRows.reduce((a, r) => a + (r.amount || 0), 0);
    const prevServiceBills = previousRows.length;
    const prevPharmRev = previousPharmacyRows.reduce((a, r) => a + (r.amount || 0), 0);
    const prevPharmBills = previousPharmacyRows.length;

    return computeConsolidatedHomeTotals(
      prevServiceRev,
      prevServiceBills,
      prevPharmRev,
      prevPharmBills,
      includePharmacy
    );
  }, [previousRows, previousPharmacyRows, includePharmacy]);

  // Combined audit rows when pharmacy is included
  const combinedAuditRows = useMemo(() => {
    if (!includePharmacy) return currentRows;

    const pharmAuditRows: ServiceSalesRow[] = currentPharmacyRows.map((p) => ({
      id: p.id,
      uploadId: p.uploadId,
      branch: p.branch,
      branchName: p.branchName,
      reportDate: p.reportDate,
      serviceName: `[Pharmacy] ${p.itemName}`,
      category: p.category,
      canonicalCategory: 'Other',
      doctor: p.doctor || 'Dispensary Pharmacist',
      quantity: p.quantity,
      rate: p.saleRate,
      amount: p.amount,
    }));

    return [...currentRows, ...pharmAuditRows];
  }, [includePharmacy, currentRows, currentPharmacyRows]);

  // 4. Compute Package Reconciliation (Collected + Package = Service-Value)
  const packageReconciliation = useMemo(() => {
    return computePackageReconciliation(currentRows, packageValues);
  }, [currentRows, packageValues]);

  // 3. Compute ALL mathematical metrics via pure functions in metrics.ts
  const kpis = useMemo(() => {
    return computeExecutiveKPIs(
      currentRows,
      previousRows,
      `vs previous ${datePreset}`
    );
  }, [currentRows, previousRows, datePreset]);

  // Active KPIs taking into account pharmacy toggle
  const activeKPIs = useMemo(() => {
    if (!includePharmacy) return kpis;

    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };

    const revChange = calcChange(consolidatedTotals.totalRevenue, previousConsolidatedTotals.totalRevenue);
    const billsChange = calcChange(consolidatedTotals.totalBills, previousConsolidatedTotals.totalBills);
    const avgChange = calcChange(consolidatedTotals.avgBillValue, previousConsolidatedTotals.avgBillValue);

    return {
      totalRevenue: {
        value: consolidatedTotals.totalRevenue,
        previousValue: previousConsolidatedTotals.totalRevenue,
        changePercent: Math.abs(revChange),
        trend: (revChange > 0 ? 'up' : revChange < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
        timeframeLabel: `vs previous ${datePreset}`,
        contributingRowsCount: consolidatedTotals.totalBills,
      },
      totalBills: {
        value: consolidatedTotals.totalBills,
        previousValue: previousConsolidatedTotals.totalBills,
        changePercent: Math.abs(billsChange),
        trend: (billsChange > 0 ? 'up' : billsChange < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
        timeframeLabel: `vs previous ${datePreset}`,
        contributingRowsCount: consolidatedTotals.totalBills,
      },
      averageBillValue: {
        value: consolidatedTotals.avgBillValue,
        previousValue: previousConsolidatedTotals.avgBillValue,
        changePercent: Math.abs(avgChange),
        trend: (avgChange > 0 ? 'up' : avgChange < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
        timeframeLabel: `vs previous ${datePreset}`,
        contributingRowsCount: consolidatedTotals.totalBills,
      },
    };
  }, [includePharmacy, kpis, consolidatedTotals, previousConsolidatedTotals, datePreset]);

  const dailyTrend = useMemo(() => {
    return computeDailyRevenueTrend(currentRows);
  }, [currentRows]);

  const servicesRank = useMemo(() => {
    return computeTopAndBottomServices(currentRows, 10);
  }, [currentRows]);

  const categorySplit = useMemo(() => {
    return computeCategorySplit(currentRows);
  }, [currentRows]);

  const doctorsRank = useMemo(() => {
    return computeRevenueByDoctor(currentRows);
  }, [currentRows]);

  const branchComparison = useMemo(() => {
    return computeBranchComparison(currentRows);
  }, [currentRows]);

  const activeBranchName =
    BRANCHES.find((b) => b.id === selectedBranch)?.name || 'All Clinic Hubs';

  // Custom Recharts Glass Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-xl border border-white/10 shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-200">{label} ({dataPoint.date})</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Revenue:</span>
            <span className="font-mono font-bold text-white">
              {formatINR(payload[0].value)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Bills: {dataPoint.billsCount}</span>
            <span>&bull;</span>
            <span>Avg: {formatINR(dataPoint.avgBillValue)}</span>
          </div>
          <p className="text-[10px] text-cyan-300 pt-1 font-semibold">Tap point on chart to audit rows</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Real Data & Telemetry Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-cyan-950/40 border border-cyan-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-100">
              Active Scope: <span className="text-cyan-400">{activeBranchName}</span> &bull; {datePreset} ({dateRanges.startDate} to {dateRanges.endDate})
            </p>
            <p className="text-[11px] text-slate-400">
              Aggregated from <strong className="text-white">{currentRows.length} real Service Sales records</strong> &bull; Pure maths in <span className="font-mono text-cyan-300">metrics.ts</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="emerald" dot size="sm">
            Real Saved Rows Active
          </Badge>
          <Badge variant="cyan" size="sm">
            Tap Any Metric to Audit
          </Badge>
        </div>
      </div>

      {/* Revenue Accounting Mode & Package Reconciliation Bar */}
      <div className="p-3.5 rounded-2xl glass-panel border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white">Package Reconciliation:</span>
              <span className="font-mono text-cyan-300 font-semibold">
                {packageReconciliation.equationText}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {packageReconciliation.totalZeroRowsCount} enrolled package sessions ({packageReconciliation.mappedZeroRowsCount} valued &bull; {packageReconciliation.unmappedZeroRows.length} unassigned)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <Button
            onClick={() => setIsPackageModalOpen(true)}
            variant="glass"
            size="sm"
            icon={<Package className="w-3.5 h-3.5 text-cyan-400" />}
          >
            Package Values
          </Button>

          {/* Pharmacy Stream Toggle */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-white/10 text-[11px] font-bold">
            <button
              onClick={() => setIncludePharmacy(!includePharmacy)}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                includePharmacy
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pharmacy: {includePharmacy ? 'Included' : 'Excluded'}</span>
              {includePharmacy && (
                <span className="text-[10px] text-emerald-200 font-mono">
                  +{formatINR(consolidatedTotals.pharmacyRevenue, { compact: true })}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-white/10 text-[11px] font-bold">
            <button
              onClick={() => {
                saveRevenueMode('collected');
                setRevenueModeState('collected');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                revenueMode === 'collected'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Collected (Default)
            </button>
            <button
              onClick={() => {
                saveRevenueMode('service_value');
                setRevenueModeState('service_value');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                revenueMode === 'service_value'
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Service-Value
            </button>
          </div>
        </div>
      </div>

      {/* Stream Breakdown Banner when Pharmacy is Included */}
      {includePharmacy && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">Consolidated Stream Breakdown:</strong> Clinical Services: <span className="font-mono text-cyan-300 font-bold">{formatINR(consolidatedTotals.serviceRevenue)}</span> &bull; Pharmacy Dispense: <span className="font-mono text-emerald-300 font-bold">{formatINR(consolidatedTotals.pharmacyRevenue)}</span> ({consolidatedTotals.pharmacySharePercent}% share)
            </span>
          </div>
          <Badge variant="emerald" size="sm">
            Consolidated Mode
          </Badge>
        </div>
      )}

      {/* Unmapped Zero Rows Alert (Never silently counted as zero) */}
      {packageReconciliation.unmappedZeroRows.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300">{packageReconciliation.unmappedZeroRows.length} Services with Rs. 0 sessions have no package value:</strong> Never counted as zero silently.
            </span>
          </div>
          <Button onClick={() => setIsPackageModalOpen(true)} variant="primary" size="sm">
            Assign Values
          </Button>
        </div>
      )}

      {/* Executive AI Summary Card */}
      <AISummaryCard
        datePreset={datePreset}
        dateRanges={dateRanges}
        selectedBranch={selectedBranch}
        selectedDoctor={selectedDoctor}
        selectedCategory={selectedCategory}
        revenueMode={revenueMode}
        includePharmacy={includePharmacy}
        activeKPIs={activeKPIs}
        consolidatedTotals={consolidatedTotals}
        packageReconciliation={packageReconciliation}
        categorySplit={categorySplit}
        doctorsRank={doctorsRank}
        topServices={servicesRank.topByRevenue}
      />

      {/* 3 CORE KPI CARDS (Total Revenue, Bills/Patients, Average Bill Value) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <Card
          glow
          interactive
          padding="md"
          onClick={() =>
            setAuditData({
              title: `Total Revenue Audit (${datePreset}) ${includePharmacy ? '[Services + Pharmacy]' : '[Clinical Services]'}`,
              metricLabel: includePharmacy ? 'Consolidated Network Revenue' : 'Gross Clinical Revenue',
              metricValue: formatINR(activeKPIs.totalRevenue.value),
              rows: combinedAuditRows,
              filterContext: `Branch: ${activeBranchName} | Date Range: ${dateRanges.startDate} to ${dateRanges.endDate} | Pharmacy: ${includePharmacy ? 'Included' : 'Excluded'}`,
            })
          }
          className="cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Total Revenue {includePharmacy && <span className="text-emerald-400 font-normal">(Consolidated)</span>}
                </p>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to Audit
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-tabular">
                <AnimatedNumber value={activeKPIs.totalRevenue.value} type="currency" compact={false} />
              </h3>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <IndianRupee className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${
                  activeKPIs.totalRevenue.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : activeKPIs.totalRevenue.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}
              >
                {activeKPIs.totalRevenue.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : activeKPIs.totalRevenue.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {activeKPIs.totalRevenue.changePercent}%
              </span>
              <span className="text-[11px] text-slate-400">{activeKPIs.totalRevenue.timeframeLabel}</span>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {activeKPIs.totalRevenue.contributingRowsCount} {includePharmacy ? 'transactions' : 'bills'}
            </span>
          </div>
        </Card>

        {/* Bills / Patients */}
        <Card
          glow
          interactive
          padding="md"
          onClick={() =>
            setAuditData({
              title: `Bills & Patients Count Audit (${datePreset}) ${includePharmacy ? '[Services + Pharmacy]' : ''}`,
              metricLabel: 'Total Transactions / Bills',
              metricValue: formatNumber(activeKPIs.totalBills.value),
              rows: combinedAuditRows,
              filterContext: `Branch: ${activeBranchName} | Date Range: ${dateRanges.startDate} to ${dateRanges.endDate}`,
            })
          }
          className="cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Bills / Patients {includePharmacy && <span className="text-emerald-400 font-normal">(+Rx)</span>}
                </p>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to Audit
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-tabular">
                <AnimatedNumber value={activeKPIs.totalBills.value} type="number" />
              </h3>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${
                  activeKPIs.totalBills.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : activeKPIs.totalBills.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}
              >
                {activeKPIs.totalBills.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : activeKPIs.totalBills.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {activeKPIs.totalBills.changePercent}%
              </span>
              <span className="text-[11px] text-slate-400">{activeKPIs.totalBills.timeframeLabel}</span>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Prev: {activeKPIs.totalBills.previousValue}
            </span>
          </div>
        </Card>

        {/* Average Bill Value */}
        <Card
          glow
          interactive
          padding="md"
          onClick={() =>
            setAuditData({
              title: `Average Bill Value Audit (${datePreset})`,
              metricLabel: 'Average Bill Value',
              metricValue: formatINR(activeKPIs.averageBillValue.value),
              rows: combinedAuditRows,
              filterContext: `Formula: Total Revenue (${formatINR(activeKPIs.totalRevenue.value)}) ÷ Total Bills (${activeKPIs.totalBills.value})`,
            })
          }
          className="cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                  Average Bill Value
                </p>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to Audit
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-tabular">
                <AnimatedNumber value={activeKPIs.averageBillValue.value} type="currency" compact={false} />
              </h3>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${
                  activeKPIs.averageBillValue.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : activeKPIs.averageBillValue.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}
              >
                {activeKPIs.averageBillValue.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : activeKPIs.averageBillValue.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {activeKPIs.averageBillValue.changePercent}%
              </span>
              <span className="text-[11px] text-slate-400">{activeKPIs.averageBillValue.timeframeLabel}</span>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Prev: {formatINR(activeKPIs.averageBillValue.previousValue, { compact: true })}
            </span>
          </div>
        </Card>
      </div>

      {/* Bento Grid: Daily Trend Chart (8 cols) & Category Split Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Revenue Trend Chart */}
        <Card padding="lg" className="lg:col-span-8 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Revenue Cadence
                </h3>
                <Badge variant="indigo" size="sm">
                  {dailyTrend.length} Days In Scope
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exact day-by-day billing aggregated from saved raw records
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Daily Service Sales</span>
              </div>
            </div>
          </div>

          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyTrend}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const point = e.activePayload[0].payload;
                    setAuditData({
                      title: `Daily Revenue Audit for ${point.date}`,
                      metricLabel: `Daily Total (${point.date})`,
                      metricValue: formatINR(point.revenue),
                      rows: point.rows,
                      filterContext: `Scope: ${activeBranchName} | Bills Count: ${point.billsCount}`,
                    });
                  }
                }}
              >
                <defs>
                  <linearGradient id="realRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="formattedDate"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatINR(val, { compact: true })}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#realRevenueGradient)"
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Click any point on the chart to audit that day's individual billing rows
            </span>
            <span className="font-mono text-cyan-300 font-bold">
              Avg Daily Run-Rate: {formatINR(kpis.totalRevenue.value / Math.max(1, dailyTrend.length), { compact: true })}
            </span>
          </div>
        </Card>

        {/* Category Split Donut (Skin / Obesity / Hair / Other) */}
        <Card padding="lg" className="lg:col-span-4 flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Category Split
              </h3>
              <Badge variant="cyan" size="sm">4 Segments</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Skin &bull; Obesity &bull; Hair &bull; Other
            </p>
          </div>

          <div className="h-[200px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySplit}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={4}
                  dataKey="revenue"
                  isAnimationActive={true}
                  animationDuration={900}
                  onClick={(entry: any) => {
                    setAuditData({
                      title: `${entry.category} Category Revenue Audit`,
                      metricLabel: `${entry.category} Revenue`,
                      metricValue: formatINR(entry.revenue),
                      rows: entry.rows,
                      filterContext: `Contribution: ${entry.percentage}% of total | Count: ${entry.count} items`,
                    });
                  }}
                >
                  {categorySplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" className="cursor-pointer hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatINR(val as number), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <span className="text-sm font-extrabold text-white font-mono">100%</span>
            </div>
          </div>

          {/* Legend Table with Tap-to-Audit for each category */}
          <div className="space-y-2 mt-2">
            {categorySplit.map((item) => (
              <button
                key={item.category}
                onClick={() =>
                  setAuditData({
                    title: `${item.category} Category Audit`,
                    metricLabel: `${item.category} Billing`,
                    metricValue: formatINR(item.revenue),
                    rows: item.rows,
                    filterContext: `${item.percentage}% of network revenue &bull; ${item.count} items billed`,
                  })
                }
                className="w-full flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-semibold truncate">{item.category}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="font-bold text-white">{formatINR(item.revenue, { compact: true })}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-cyan-300">
                    {item.percentage}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Second Bento Row: Top & Bottom 10 Services (7 cols) + Revenue By Doctor (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 10 & Bottom 10 Services */}
        <Card padding="none" className="lg:col-span-7 overflow-hidden flex flex-col justify-between">
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Procedure & Service Rankings
                </h3>
                <Badge variant="indigo" size="sm">
                  Top & Bottom 10
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Computed by gross revenue and bill frequency from raw rows
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setServiceRankTab('topRev')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  serviceRankTab === 'topRev' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top Rev
              </button>
              <button
                onClick={() => setServiceRankTab('bottomRev')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  serviceRankTab === 'bottomRev' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bottom Rev
              </button>
              <button
                onClick={() => setServiceRankTab('topCount')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  serviceRankTab === 'topCount' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Top Count
              </button>
              <button
                onClick={() => setServiceRankTab('bottomCount')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  serviceRankTab === 'bottomCount' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bottom Count
              </button>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-white/5">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Service Name</th>
                  <th className="py-2.5 px-4">Segment</th>
                  <th className="py-2.5 px-4 text-right">Volume</th>
                  <th className="py-2.5 px-4 text-right">Avg Rate</th>
                  <th className="py-2.5 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {(serviceRankTab === 'topRev'
                  ? servicesRank.topByRevenue
                  : serviceRankTab === 'bottomRev'
                  ? servicesRank.bottomByRevenue
                  : serviceRankTab === 'topCount'
                  ? servicesRank.topByCount
                  : servicesRank.bottomByCount
                ).map((service, idx) => (
                  <tr
                    key={service.serviceName}
                    onClick={() =>
                      setAuditData({
                        title: `Service Audit: ${service.serviceName}`,
                        metricLabel: service.serviceName,
                        metricValue: formatINR(service.totalRevenue),
                        rows: service.rows,
                        filterContext: `Category: ${service.canonicalCategory} | Total billed count: ${service.totalCount}`,
                      })
                    }
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    title="Tap to audit raw rows for this service"
                  >
                    <td className="py-3 px-4 text-slate-500 font-sans">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <span>{service.serviceName}</span>
                        <ArrowUpRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-white/5">
                        {service.canonicalCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">{service.totalCount}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{formatINR(service.avgRate)}</td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-400">
                      {formatINR(service.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-white/[0.06] text-center text-[11px] text-slate-400">
            Tap any row above to inspect the individual billing receipts
          </div>
        </Card>

        {/* Revenue by Doctor */}
        <Card padding="md" className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Revenue by Doctor
              </h3>
              <Badge variant="cyan" size="sm">{doctorsRank.length} Clinicians</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Clinician billing contribution, throughput, and average ticket size
            </p>

            <div className="space-y-3">
              {doctorsRank.map((doc) => (
                <div
                  key={doc.doctorName}
                  onClick={() =>
                    setAuditData({
                      title: `Doctor Billing Audit: ${doc.doctorName}`,
                      metricLabel: `${doc.doctorName} Revenue`,
                      metricValue: formatINR(doc.revenue),
                      rows: doc.rows,
                      filterContext: `${doc.billsCount} bills &bull; Avg ticket: ${formatINR(doc.avgBillValue)} &bull; ${doc.percentageOfTotal}% share`,
                    })
                  }
                  className="p-3 rounded-xl bg-slate-900/50 light:bg-slate-50 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs ring-1 ring-white/10 shrink-0">
                        {doc.doctorName.replace('Dr. ', '')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white light:text-slate-900 truncate group-hover:text-cyan-300 transition-colors">
                          {doc.doctorName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {doc.billsCount} bills &bull; Avg {formatINR(doc.avgBillValue)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-xs text-cyan-400">
                        {formatINR(doc.revenue)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {doc.percentageOfTotal}% of total
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{ width: `${Math.min(100, doc.percentageOfTotal)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-center text-[11px] text-slate-400 mt-2">
            Tap a doctor card to review their entire patient service ledger
          </div>
        </Card>
      </div>

      {/* Branch Comparison when multiple branches exist */}
      {branchComparison.length > 1 && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Multi-Branch Consolidated Comparison
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cross-branch revenue distribution, bill throughput, and run-rate attainment
              </p>
            </div>
            <Badge variant="indigo" size="sm">{branchComparison.length} Active Hubs</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {branchComparison.map((branch) => (
              <div
                key={branch.branchId}
                onClick={() =>
                  setAuditData({
                    title: `Branch Audit: ${branch.branchName}`,
                    metricLabel: `${branch.branchName} Revenue`,
                    metricValue: formatINR(branch.revenue),
                    rows: branch.rows,
                    filterContext: `${branch.billsCount} bills | Avg Bill: ${formatINR(branch.avgBillValue)}`,
                  })
                }
                className="p-3.5 rounded-2xl bg-slate-900/60 light:bg-slate-50 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white light:text-slate-900 truncate">
                      {branch.branchName.split('—')[0]}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {branch.billsCount} bills
                    </p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                <div>
                  <p className="text-base font-extrabold text-cyan-400 font-mono">
                    {formatINR(branch.revenue, { compact: true })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Avg Bill: {formatINR(branch.avgBillValue)}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Target Pace</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {branch.targetAttainmentPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* INDEPENDENT MATHEMATICAL PROOF FOR [DATE] */}
      <IndependentRecomputeCard
        allRows={allRows}
        currentFilteredRevenue={kpis.totalRevenue.value}
        initialDate={dateRanges.endDate}
        selectedBranch={selectedBranch}
        onOpenAudit={(data) => setAuditData(data)}
      />

      {/* TAP-TO-AUDIT MODAL LEDGER */}
      <TapToAuditModal
        auditData={auditData}
        onClose={() => setAuditData(null)}
      />

      {/* Package Values Modal */}
      <PackageValuesModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        allRows={allRows}
      />
    </motion.div>
  );
};
