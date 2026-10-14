import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatINR, formatNumber } from '../utils/formatters';
import { useFilters, BRANCHES } from '../context/FilterContext';
import {
  type ServiceSalesRow,
  type CanonicalCategory,
  getDateRangeFromPreset,
  filterRows,
  enrichAndMapRows,
  computeDoctorsDetailedAnalysis,
} from '../utils/metrics';
import {
  getAllServiceSalesRows,
  subscribeToDataUpdates,
} from '../services/serviceSalesStore';
import {
  getCategoryMappings,
  getPackageValues,
  getRevenueMode,
  subscribeToConfigUpdates,
} from '../services/clinicConfigStore';
import {
  TapToAuditModal,
  type AuditContextData,
} from '../components/audit/TapToAuditModal';
import {
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Award,
  Stethoscope,
  Receipt,
  Search,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const DoctorsScreen: React.FC = () => {
  const { selectedBranch, selectedDoctor, selectedCategory, datePreset } = useFilters();

  const [allRawRows, setAllRawRows] = useState<ServiceSalesRow[]>([]);
  const [categoryMappings, setCategoryMappings] = useState(getCategoryMappings());
  const [packageValues, setPackageValues] = useState(getPackageValues());
  const [revenueMode, setRevenueModeState] = useState(getRevenueMode());

  const [searchTerm, setSearchTerm] = useState('');
  const [auditData, setAuditData] = useState<AuditContextData | null>(null);

  useEffect(() => {
    setAllRawRows(getAllServiceSalesRows());
    const unsubData = subscribeToDataUpdates(() => setAllRawRows(getAllServiceSalesRows()));
    const unsubConfig = subscribeToConfigUpdates(() => {
      setCategoryMappings(getCategoryMappings());
      setPackageValues(getPackageValues());
      setRevenueModeState(getRevenueMode());
    });
    return () => {
      unsubData();
      unsubConfig();
    };
  }, []);

  // 1. Enrich rows with Category Mapping & Package Values
  const enrichedRows = useMemo(() => {
    return enrichAndMapRows(allRawRows, categoryMappings, packageValues, revenueMode);
  }, [allRawRows, categoryMappings, packageValues, revenueMode]);

  // 2. Filter dates & scope
  const dateRanges = useMemo(() => {
    return getDateRangeFromPreset(datePreset);
  }, [datePreset]);

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

  // 3. Compute Doctors Analysis via pure function
  const doctorsList = useMemo(() => {
    return computeDoctorsDetailedAnalysis(currentRows, previousRows);
  }, [currentRows, previousRows]);

  const filteredDoctors = useMemo(() => {
    return doctorsList.filter((doc) =>
      doc.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [doctorsList, searchTerm]);

  // Leaderboard highlights
  const topClinician = doctorsList[0];
  const totalClinicians = doctorsList.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white light:text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              Doctor Performance & Clinical Practice Analytics
            </h2>
            <Badge variant="cyan" size="sm">
              CLINICAL PRACTICE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Per-doctor revenue, procedural throughput, category mix (Skin / Obesity / Hair / Other), and trend
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="indigo" size="md">
            {totalClinicians} Active Doctors
          </Badge>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-medium text-slate-400">Top Revenue Producer</p>
            <Badge variant="emerald" size="sm">Rank #1</Badge>
          </div>
          <p className="text-lg font-bold text-white mt-1 truncate">
            {topClinician ? topClinician.doctorName : '—'}
          </p>
          <p className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
            {topClinician ? formatINR(topClinician.revenue) : '₹0'} &bull; {topClinician?.totalServicesCount} services
          </p>
        </Card>

        <Card padding="md">
          <p className="text-xs uppercase font-medium text-slate-400">Total Clinical Production</p>
          <p className="text-2xl font-extrabold text-white mt-1 font-mono">
            {formatINR(doctorsList.reduce((acc, d) => acc + d.revenue, 0))}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Across {currentRows.length} patient consultations & procedures
          </p>
        </Card>

        <Card padding="md">
          <p className="text-xs uppercase font-medium text-slate-400">Avg Doctor Realization</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            {formatINR(
              totalClinicians > 0
                ? doctorsList.reduce((acc, d) => acc + d.revenue, 0) / totalClinicians
                : 0
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Per specialist clinician in active window</p>
        </Card>
      </div>

      {/* Search & Doctor Cards Grid */}
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredDoctors.length}</strong> clinicians
          </span>
        </div>

        {/* Doctor Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map((doc, idx) => (
            <Card
              key={doc.doctorName}
              glow
              interactive
              padding="lg"
              onClick={() =>
                setAuditData({
                  title: `Doctor Ledger Audit: ${doc.doctorName}`,
                  metricLabel: `${doc.doctorName} Total Revenue`,
                  metricValue: formatINR(doc.revenue),
                  rows: doc.rows,
                  filterContext: `${doc.totalServicesCount} services conducted | Avg Ticket: ${formatINR(doc.averageTicketSize)}`,
                })
              }
              className="cursor-pointer group flex flex-col justify-between space-y-4"
            >
              {/* Doctor Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-base ring-1 ring-white/10 shrink-0">
                    {doc.doctorName.replace('Dr. ', '')[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white group-hover:text-cyan-300 transition-colors">
                        {doc.doctorName}
                      </h3>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {doc.branch} &bull; <strong className="text-slate-300">{doc.totalServicesCount} services</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-extrabold text-white font-mono">
                    {formatINR(doc.revenue)}
                  </p>
                  {/* Trend vs previous equal period */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                      doc.trendDirection === 'up'
                        ? 'text-emerald-400'
                        : doc.trendDirection === 'down'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {doc.trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
                    {doc.trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
                    {doc.trendDirection === 'neutral' && <Minus className="w-3 h-3" />}
                    {doc.trendPercent}% vs prev
                  </span>
                </div>
              </div>

              {/* Category Mix Breakdown (Skin / Obesity / Hair / Other) */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/60 light:bg-slate-50 border border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Category Mix (% of Billing)
                  </span>
                  <span className="text-[11px] text-slate-300 font-mono">
                    Avg Ticket: {formatINR(doc.averageTicketSize)}
                  </span>
                </div>

                {/* Stacked Proportional Bar */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${doc.categoryMix.Skin.percent}%` }}
                    title={`Skin: ${doc.categoryMix.Skin.percent}%`}
                  />
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${doc.categoryMix.Obesity.percent}%` }}
                    title={`Obesity: ${doc.categoryMix.Obesity.percent}%`}
                  />
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${doc.categoryMix.Hair.percent}%` }}
                    title={`Hair: ${doc.categoryMix.Hair.percent}%`}
                  />
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${doc.categoryMix.Other.percent}%` }}
                    title={`Other: ${doc.categoryMix.Other.percent}%`}
                  />
                </div>

                {/* Category Numbers Grid */}
                <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
                  <div className="p-1 rounded bg-cyan-500/10 text-center">
                    <span className="text-cyan-400 font-bold block">Skin</span>
                    <span className="text-slate-200">{doc.categoryMix.Skin.percent}%</span>
                  </div>
                  <div className="p-1 rounded bg-indigo-500/10 text-center">
                    <span className="text-indigo-400 font-bold block">Obesity</span>
                    <span className="text-slate-200">{doc.categoryMix.Obesity.percent}%</span>
                  </div>
                  <div className="p-1 rounded bg-emerald-500/10 text-center">
                    <span className="text-emerald-400 font-bold block">Hair</span>
                    <span className="text-slate-200">{doc.categoryMix.Hair.percent}%</span>
                  </div>
                  <div className="p-1 rounded bg-amber-500/10 text-center">
                    <span className="text-amber-400 font-bold block">Other</span>
                    <span className="text-slate-200">{doc.categoryMix.Other.percent}%</span>
                  </div>
                </div>
              </div>

              {/* Top 3 Services for this clinician */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Top Procedures Performed
                </span>
                <div className="space-y-1">
                  {doc.topServices.map((serv) => (
                    <div key={serv.serviceName} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                        &bull; {serv.serviceName}
                      </span>
                      <span className="font-mono text-slate-400 shrink-0">
                        {serv.count} sessions &bull; {formatINR(serv.revenue, { compact: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Hint */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>Tap to inspect clinician's {doc.rows.length} billing rows</span>
                  <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Tap-To-Audit Modal */}
      <TapToAuditModal
        auditData={auditData}
        onClose={() => setAuditData(null)}
      />
    </motion.div>
  );
};
