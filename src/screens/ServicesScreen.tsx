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
  computeServicesDetailedAnalysis,
  detectUnmappedServices,
} from '../utils/metrics';
import {
  getAllServiceSalesRows,
  subscribeToDataUpdates,
} from '../services/serviceSalesStore';
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
import { CategoryMappingModal } from '../components/settings/CategoryMappingModal';
import { PackageValuesModal } from '../components/settings/PackageValuesModal';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Layers,
  Package,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Table,
} from 'lucide-react';

export const ServicesScreen: React.FC = () => {
  const { selectedBranch, selectedDoctor, selectedCategory, datePreset } = useFilters();

  const [allRawRows, setAllRawRows] = useState<ServiceSalesRow[]>([]);
  const [categoryMappings, setCategoryMappings] = useState(getCategoryMappings());
  const [packageValues, setPackageValues] = useState(getPackageValues());
  const [revenueMode, setRevenueModeState] = useState(getRevenueMode());

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'all' | 'Dominant' | 'Under-sold'>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Modals
  const [auditData, setAuditData] = useState<AuditContextData | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);

  // Sync data & config updates
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

  // 1. Enrich rows with Category Mapping and Package Values
  const enrichedRows = useMemo(() => {
    return enrichAndMapRows(allRawRows, categoryMappings, packageValues, revenueMode);
  }, [allRawRows, categoryMappings, packageValues, revenueMode]);

  // 2. Unmapped category services check
  const unmappedServices = useMemo(() => {
    return detectUnmappedServices(allRawRows, categoryMappings);
  }, [allRawRows, categoryMappings]);

  // 3. Date filtering via metrics.ts
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

  // 4. Compute full service analysis via pure function in metrics.ts
  const servicesList = useMemo(() => {
    return computeServicesDetailedAnalysis(currentRows, previousRows);
  }, [currentRows, previousRows]);

  // Filter table by search, category, and dominant/under-sold tag
  const filteredServices = useMemo(() => {
    return servicesList.filter((s) => {
      const matchesSearch = s.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategoryFilter === 'all' || s.category.toLowerCase() === activeCategoryFilter.toLowerCase();
      const matchesClass =
        classificationFilter === 'all' || s.classification === classificationFilter;
      return matchesSearch && matchesCategory && matchesClass;
    });
  }, [servicesList, searchTerm, activeCategoryFilter, classificationFilter]);

  // Dominant & Under-sold counts
  const dominantCount = servicesList.filter((s) => s.classification === 'Dominant').length;
  const underSoldCount = servicesList.filter((s) => s.classification === 'Under-sold').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Title & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white light:text-slate-900">
              Clinical Services & Procedure Intelligence
            </h2>
            <Badge variant="cyan" size="sm">
              REAL REVENUE
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rankings, average ticket realization, revenue share %, and Pareto dominant vs under-sold analysis
          </p>
        </div>

        {/* Configuration Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsCategoryModalOpen(true)}
            variant="glass"
            size="sm"
            icon={<Layers className="w-3.5 h-3.5 text-cyan-400" />}
          >
            <span>Category Mapping</span>
            {unmappedServices.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </Button>

          <Button
            onClick={() => setIsPackageModalOpen(true)}
            variant="glass"
            size="sm"
            icon={<Package className="w-3.5 h-3.5 text-indigo-400" />}
          >
            <span>Package Values Fix</span>
          </Button>

          {/* Revenue Mode Indicator Pill */}
          <button
            onClick={() => {
              const nextMode = revenueMode === 'collected' ? 'service_value' : 'collected';
              saveRevenueMode(nextMode);
              setRevenueModeState(nextMode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="Click to switch between Collected (Cash) and Service-Value (Package production) revenue"
          >
            <span className="text-slate-400">Mode:</span>
            <span className="font-bold text-cyan-400 uppercase font-mono text-[11px]">
              {revenueMode === 'collected' ? 'Collected' : 'Service-Value'}
            </span>
          </button>
        </div>
      </div>

      {/* Unmapped Services Alert Banner if any */}
      {unmappedServices.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong className="text-rose-300">{unmappedServices.length} unmapped services detected:</strong> Categorized via auto-heuristics. Open Category Mapping to confirm so nothing is silently dropped.
            </span>
          </div>
          <Button
            onClick={() => setIsCategoryModalOpen(true)}
            variant="primary"
            size="sm"
          >
            Review Mapping
          </Button>
        </div>
      )}

      {/* Quick Summary Bento (Dominant vs Under-sold vs Total Catalog) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card padding="md">
          <p className="text-xs uppercase font-medium text-slate-400">Services in Scope</p>
          <p className="text-2xl font-extrabold text-white mt-1 font-mono">{servicesList.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across 4 Clinical Segments</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-medium text-slate-400">Dominant Procedures</p>
            <Badge variant="indigo" size="sm">Top 20% Rev</Badge>
          </div>
          <p className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">{dominantCount}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">Primary Network Revenue Drivers</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase font-medium text-slate-400">Under-Sold Procedures</p>
            <Badge variant="amber" size="sm">Low Volume</Badge>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">{underSoldCount}</p>
          <p className="text-[11px] text-amber-400/90 font-medium mt-1">&lt; 50% category volume</p>
        </Card>

        <Card padding="md">
          <p className="text-xs uppercase font-medium text-slate-400">Enrolled Package Redemptions</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            {currentRows.filter((r) => r.isPackageSession).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Zero-bill sessions detected & reconciled</p>
        </Card>
      </div>

      {/* Searchable Services Table */}
      <Card padding="none" className="overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Classification Filter */}
            <div className="flex items-center p-1 bg-slate-900/80 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setClassificationFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  classificationFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({servicesList.length})
              </button>
              <button
                onClick={() => setClassificationFilter('Dominant')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  classificationFilter === 'Dominant' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dominant ({dominantCount})
              </button>
              <button
                onClick={() => setClassificationFilter('Under-sold')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  classificationFilter === 'Under-sold' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Under-Sold ({underSoldCount})
              </button>
            </div>

            {/* Category Dropdown */}
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Skin">Skin</option>
              <option value="Obesity">Obesity</option>
              <option value="Hair">Hair</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by procedure name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-white/5 sticky top-0">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Count</th>
                <th className="py-3 px-4 text-right">Avg Price</th>
                <th className="py-3 px-4 text-right">Share %</th>
                <th className="py-3 px-4 text-right">Trend vs Prev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {filteredServices.map((service) => (
                <tr
                  key={service.serviceName}
                  onClick={() =>
                    setAuditData({
                      title: `Procedure Audit: ${service.serviceName}`,
                      metricLabel: `${service.serviceName} Revenue`,
                      metricValue: formatINR(service.revenue),
                      rows: service.rows,
                      filterContext: `Category: ${service.category} | Volume: ${service.count} sessions | Rank: #${service.rank}`,
                    })
                  }
                  className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  title="Tap to audit raw rows for this procedure"
                >
                  <td className="py-3.5 px-4 font-sans text-slate-500 font-bold">
                    #{service.rank}
                  </td>

                  <td className="py-3.5 px-4 font-sans font-bold text-white group-hover:text-cyan-300 transition-colors max-w-[240px]">
                    <div className="flex items-center gap-1.5">
                      <span>{service.serviceName}</span>
                      <ArrowUpRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {service.isZeroValueEnrolled && (
                      <span className="text-[10px] text-amber-300 font-mono font-normal block mt-0.5">
                        {service.packageSessionCount} package session(s)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-white/5 font-medium">
                      {service.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    {service.classification === 'Dominant' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold text-[10px]">
                        <Award className="w-3 h-3 text-cyan-400" />
                        Dominant
                      </span>
                    )}
                    {service.classification === 'Under-sold' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Under-sold
                      </span>
                    )}
                    {service.classification === 'Standard' && (
                      <span className="text-slate-500 text-[10px] font-sans">Standard</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-cyan-400 font-mono">
                    {formatINR(service.revenue)}
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-200 font-mono">
                    {formatNumber(service.count)}
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-300 font-mono">
                    {formatINR(service.averagePrice)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-300">
                    {service.sharePercent}%
                  </td>

                  <td className="py-3.5 px-4 text-right font-sans">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        service.trendDirection === 'up'
                          ? 'text-emerald-400'
                          : service.trendDirection === 'down'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {service.trendDirection === 'up' && <TrendingUp className="w-3 h-3" />}
                      {service.trendDirection === 'down' && <TrendingDown className="w-3 h-3" />}
                      {service.trendDirection === 'neutral' && <Minus className="w-3 h-3" />}
                      {service.trendPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredServices.length}</strong> of {servicesList.length} procedures
          </span>
          <span>Tap any row to inspect underlying audit ledger</span>
        </div>
      </Card>

      {/* Tap-To-Audit Modal */}
      <TapToAuditModal
        auditData={auditData}
        onClose={() => setAuditData(null)}
      />

      {/* Category Mapping Settings Modal */}
      <CategoryMappingModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        allRows={allRawRows}
      />

      {/* Package Values Modal */}
      <PackageValuesModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        allRows={allRawRows}
      />
    </motion.div>
  );
};
