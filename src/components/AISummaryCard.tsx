import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Lightbulb,
  ShieldCheck,
  Zap,
  RotateCcw,
  AlertCircle,
  Database,
  Clock,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';
import type {
  CanonicalCategory,
  PackageReconciliation,
  RevenueMode,
} from '../utils/metrics';

export interface AISummaryResponse {
  ceoSummary: string[];
  improvedOrDropped: string[];
  suggestedActions: string[];
  modelUsed?: string;
  generatedAt?: string;
}

interface AISummaryCardProps {
  datePreset: string;
  dateRanges: {
    startDate?: string;
    endDate?: string;
    prevStartDate?: string;
    prevEndDate?: string;
    label?: string;
  };
  selectedBranch: string;
  selectedDoctor: string;
  selectedCategory: string;
  revenueMode: RevenueMode;
  includePharmacy: boolean;
  activeKPIs: {
    totalRevenue: {
      value: number;
      previousValue: number;
      changePercent: number;
      trend: 'up' | 'down' | 'neutral';
      timeframeLabel: string;
      contributingRowsCount: number;
    };
    totalBills: {
      value: number;
      previousValue: number;
      changePercent: number;
      trend: 'up' | 'down' | 'neutral';
      timeframeLabel: string;
      contributingRowsCount: number;
    };
    averageBillValue: {
      value: number;
      previousValue: number;
      changePercent: number;
      trend: 'up' | 'down' | 'neutral';
      timeframeLabel: string;
      contributingRowsCount: number;
    };
  };
  consolidatedTotals: {
    serviceRevenue: number;
    pharmacyRevenue: number;
    totalRevenue: number;
    totalBills: number;
    avgBillValue: number;
    pharmacySharePercent: number;
  };
  packageReconciliation: PackageReconciliation;
  categorySplit: Array<{
    category: CanonicalCategory;
    revenue: number;
    percentage: number;
    count: number;
    color: string;
  }>;
  doctorsRank: Array<{
    doctorName: string;
    revenue: number;
    billsCount: number;
    avgBillValue: number;
    percentageOfTotal: number;
  }>;
  topServices: Array<{
    serviceName: string;
    canonicalCategory: CanonicalCategory;
    totalRevenue: number;
    totalCount: number;
    avgRate: number;
  }>;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  datePreset,
  dateRanges,
  selectedBranch,
  selectedDoctor,
  selectedCategory,
  revenueMode,
  includePharmacy,
  activeKPIs,
  consolidatedTotals,
  packageReconciliation,
  categorySplit,
  doctorsRank,
  topServices,
}) => {
  // Deterministic cache key based strictly on dates, filters, mode, and pharmacy stream
  const cacheKey = useMemo(() => {
    return `ceo_pulse_ai_summary_${datePreset}_${dateRanges.startDate || 'all'}_${dateRanges.endDate || 'all'}_${selectedBranch || 'all'}_${selectedDoctor || 'all'}_${selectedCategory || 'all'}_${revenueMode}_${includePharmacy}`;
  }, [
    datePreset,
    dateRanges.startDate,
    dateRanges.endDate,
    selectedBranch,
    selectedDoctor,
    selectedCategory,
    revenueMode,
    includePharmacy,
  ]);

  const [summaryData, setSummaryData] = useState<AISummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  // Animated Typing Reveal State
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [revealedChars, setRevealedChars] = useState<number>(0);
  const typingTimerRef = useRef<any>(null);

  // Calculate character segments for continuous, smooth progressive typing reveal across all 3 cards
  const textSegments = useMemo(() => {
    if (!summaryData) return [];
    const segments: { section: 'ceoSummary' | 'improvedOrDropped' | 'suggestedActions'; index: number; fullText: string; start: number; end: number }[] = [];
    let currentOffset = 0;

    (summaryData.ceoSummary || []).forEach((text, i) => {
      const len = text.length;
      segments.push({ section: 'ceoSummary', index: i, fullText: text, start: currentOffset, end: currentOffset + len });
      currentOffset += len + 6;
    });

    (summaryData.improvedOrDropped || []).forEach((text, i) => {
      const len = text.length;
      segments.push({ section: 'improvedOrDropped', index: i, fullText: text, start: currentOffset, end: currentOffset + len });
      currentOffset += len + 6;
    });

    (summaryData.suggestedActions || []).forEach((text, i) => {
      const len = text.length;
      segments.push({ section: 'suggestedActions', index: i, fullText: text, start: currentOffset, end: currentOffset + len });
      currentOffset += len + 6;
    });

    return segments;
  }, [summaryData]);

  const totalCharsToType = useMemo(() => {
    if (textSegments.length === 0) return 0;
    return textSegments[textSegments.length - 1].end;
  }, [textSegments]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  // Function to start animated typing reveal
  const startTypingReveal = (targetLength: number) => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setIsTyping(true);
    setRevealedChars(0);

    const step = 4; // characters per tick
    const intervalMs = 16;

    typingTimerRef.current = setInterval(() => {
      setRevealedChars((prev) => {
        const next = prev + step;
        if (next >= targetLength) {
          clearInterval(typingTimerRef.current);
          setIsTyping(false);
          return targetLength;
        }
        return next;
      });
    }, intervalMs);
  };

  const skipTyping = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setIsTyping(false);
    setRevealedChars(totalCharsToType);
  };

  // Helper to get partially revealed text for a specific item during typing
  const getRevealedItem = (
    section: 'ceoSummary' | 'improvedOrDropped' | 'suggestedActions',
    index: number
  ) => {
    if (!summaryData) return { text: '', isTypingHere: false, isVisible: false };
    
    // When not actively typing (e.g. from cache or finished or skipped), return complete text
    if (!isTyping) {
      const text =
        section === 'ceoSummary'
          ? summaryData.ceoSummary[index]
          : section === 'improvedOrDropped'
          ? summaryData.improvedOrDropped[index]
          : summaryData.suggestedActions[index];
      return { text: text || '', isTypingHere: false, isVisible: true };
    }

    const seg = textSegments.find((s) => s.section === section && s.index === index);
    if (!seg) return { text: '', isTypingHere: false, isVisible: false };

    if (revealedChars < seg.start) {
      return { text: '', isTypingHere: false, isVisible: false };
    }
    if (revealedChars >= seg.end) {
      return { text: seg.fullText, isTypingHere: false, isVisible: true };
    }

    const typedCount = Math.max(0, revealedChars - seg.start);
    return {
      text: seg.fullText.slice(0, typedCount),
      isTypingHere: true,
      isVisible: true,
    };
  };

  // Prepare ONLY already-computed metrics payload
  const buildComputedMetricsPayload = () => {
    const hasPrevious = activeKPIs.totalRevenue.previousValue > 0;

    return {
      period: {
        preset: datePreset,
        startDate: dateRanges.startDate || 'All available dates',
        endDate: dateRanges.endDate || 'All available dates',
        previousPeriodAvailable: hasPrevious,
        previousStartDate: dateRanges.prevStartDate || 'N/A',
        previousEndDate: dateRanges.prevEndDate || 'N/A',
        comparisonContext: activeKPIs.totalRevenue.timeframeLabel,
      },
      filtersApplied: {
        branch: selectedBranch || 'All Clinic Branches',
        doctor: selectedDoctor || 'All Doctors',
        category: selectedCategory || 'All Categories',
        revenueCalculationMode:
          revenueMode === 'collected'
            ? 'Collected Revenue (Billed Amount)'
            : 'Service-Value Revenue (Package Sessions Reconciled)',
        pharmacyIncluded: includePharmacy,
      },
      headlineExecutiveKPIs: {
        totalRevenue: {
          current: formatINR(activeKPIs.totalRevenue.value),
          previous: hasPrevious ? formatINR(activeKPIs.totalRevenue.previousValue) : 'Not Available',
          trend: activeKPIs.totalRevenue.trend,
          changePercent: hasPrevious ? `${activeKPIs.totalRevenue.changePercent}%` : 'Data Missing',
        },
        totalBills: {
          current: activeKPIs.totalBills.value,
          previous: hasPrevious ? activeKPIs.totalBills.previousValue : 'Not Available',
          trend: activeKPIs.totalBills.trend,
          changePercent: hasPrevious ? `${activeKPIs.totalBills.changePercent}%` : 'Data Missing',
        },
        averageBillValue: {
          current: formatINR(activeKPIs.averageBillValue.value),
          previous: hasPrevious ? formatINR(activeKPIs.averageBillValue.previousValue) : 'Not Available',
          trend: activeKPIs.averageBillValue.trend,
          changePercent: hasPrevious ? `${activeKPIs.averageBillValue.changePercent}%` : 'Data Missing',
        },
      },
      revenueStreams: {
        servicesRevenue: formatINR(consolidatedTotals.serviceRevenue),
        pharmacyRevenue: formatINR(consolidatedTotals.pharmacyRevenue),
        pharmacyRevenueShare: `${consolidatedTotals.pharmacySharePercent}%`,
        isPharmacyCombinedInTotals: includePharmacy,
      },
      packageReconciliation: {
        collectedRevenue: formatINR(packageReconciliation.collectedRevenue),
        packageIncrementalValue: formatINR(packageReconciliation.packageValueAdded),
        serviceValueTotal: formatINR(packageReconciliation.serviceValueTotal),
        totalZeroSessionsCount: packageReconciliation.totalZeroRowsCount,
        mappedZeroSessionsCount: packageReconciliation.mappedZeroRowsCount,
        unmappedZeroSessionsCount: packageReconciliation.unmappedZeroRows.length,
      },
      topCategoriesByShare: categorySplit.map((c) => ({
        category: c.category,
        revenue: formatINR(c.revenue),
        sharePercent: `${c.percentage}%`,
        serviceCount: c.count,
      })),
      topDoctorsByRevenue: doctorsRank.slice(0, 4).map((d, idx) => ({
        rank: idx + 1,
        doctor: d.doctorName,
        revenue: formatINR(d.revenue),
        sharePercent: `${d.percentageOfTotal}%`,
        bills: d.billsCount,
        averageBillValue: formatINR(d.avgBillValue),
      })),
      dominantServices: topServices.slice(0, 4).map((s) => ({
        serviceName: s.serviceName,
        category: s.canonicalCategory,
        revenue: formatINR(s.totalRevenue),
        volume: s.totalCount,
        avgRate: formatINR(s.avgRate),
      })),
    };
  };

  // Generate Summary Function
  const fetchAISummary = async (forceRefresh: boolean = false) => {
    // 1. Check Cache first per date and filter
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.ceoSummary) && parsed.ceoSummary.length === 5) {
            setSummaryData(parsed);
            setIsFromCache(true);
            setError(null);
            setLoading(false);
            setRevealedChars(999999);
            setIsTyping(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse cached AI summary:', e);
      }
    }

    // 2. If not cached or force refresh, call server route
    setLoading(true);
    setError(null);
    setIsFromCache(false);

    try {
      const computedMetrics = buildComputedMetricsPayload();

      const response = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: computedMetrics }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data: AISummaryResponse = await response.json();

      if (!data || !Array.isArray(data.ceoSummary) || data.ceoSummary.length === 0) {
        throw new Error('Received incomplete response from AI engine');
      }

      // Save to localStorage cache per date and filter set
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (storageErr) {
        console.warn('Failed to save AI summary in localStorage:', storageErr);
      }

      setSummaryData(data);
      setIsFromCache(false);

      // Compute total characters and trigger animated typing reveal
      let totalLen = 0;
      (data.ceoSummary || []).forEach((s) => { totalLen += s.length + 6; });
      (data.improvedOrDropped || []).forEach((s) => { totalLen += s.length + 6; });
      (data.suggestedActions || []).forEach((s) => { totalLen += s.length + 6; });

      startTypingReveal(totalLen);
    } catch (err: any) {
      console.error('Error fetching AI executive summary:', err);
      setError(err.message || 'Failed to generate AI executive summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger load or read from cache on filter / date change
  useEffect(() => {
    fetchAISummary(false);
  }, [cacheKey]);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-[#0e172a]/95 to-slate-950/95 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Executive AI Briefing
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300">
                  Gemini API
                </span>
              </h2>

              {isFromCache && !loading && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 flex items-center gap-1 font-medium">
                  <Database className="w-2.5 h-2.5 text-cyan-400" />
                  Cached for Filter Set
                </span>
              )}

              {isTyping && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 font-medium animate-pulse">
                  <Zap className="w-2.5 h-2.5 text-cyan-400" />
                  Typing Reveal Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span>Grounding: Computed metrics only</span>
              <span>&bull;</span>
              <span className="text-slate-300 font-mono font-medium">{datePreset}</span>
              {selectedBranch && (
                <>
                  <span>&bull;</span>
                  <span className="text-cyan-400">{selectedBranch}</span>
                </>
              )}
              {includePharmacy && (
                <>
                  <span>&bull;</span>
                  <span className="text-emerald-400">+ Pharmacy Stream</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Actions & Typing Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          {isTyping && (
            <button
              onClick={skipTyping}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Skip animated reveal"
            >
              <Zap className="w-3.5 h-3.5" />
              Skip Reveal
            </button>
          )}

          {!isTyping && summaryData && (
            <button
              onClick={() => startTypingReveal(totalCharsToType)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Replay animated typing reveal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay Reveal
            </button>
          )}

          <button
            onClick={() => fetchAISummary(true)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-cyan-900/30 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Synthesizing...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-6">
        {loading && !summaryData && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Synthesizing Executive Operational Intelligence...
              </p>
              <p className="text-xs text-slate-400">
                Grounding against pre-computed revenue, bills count, and package reconciliation.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Could not generate executive summary</p>
              <p>{error}</p>
              <button
                onClick={() => fetchAISummary(true)}
                className="mt-2 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-[11px] transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {summaryData && (
          <>
            {/* Structured Executive Presentation with Interactive Typing Reveal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
              {/* 1. 5-Line CEO Summary */}
              <div className="lg:col-span-12 p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      5-Line CEO Executive Summary
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Strict Zero-Hallucination
                  </span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {summaryData.ceoSummary.map((_, idx) => {
                    const itemState = getRevealedItem('ceoSummary', idx);
                    if (!itemState.isVisible && isTyping) {
                      return (
                        <div
                          key={idx}
                          className="h-10 rounded-lg bg-slate-900/20 border border-white/[0.02] animate-pulse"
                        />
                      );
                    }
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-800/40 border border-white/5 transition-colors"
                      >
                        <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-snug">
                          {itemState.text}
                          {itemState.isTypingHere && (
                            <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. What Improved or Dropped */}
              <div className="lg:col-span-6 p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        What Improved or Dropped
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Direct Evidence
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {summaryData.improvedOrDropped.map((origItem, idx) => {
                      const itemState = getRevealedItem('improvedOrDropped', idx);
                      if (!itemState.isVisible && isTyping) {
                        return (
                          <div
                            key={idx}
                            className="h-9 rounded-lg bg-slate-900/20 border border-white/[0.02] animate-pulse"
                          />
                        );
                      }

                      const isDrop =
                        origItem.toLowerCase().includes('drop') ||
                        origItem.toLowerCase().includes('fell') ||
                        origItem.toLowerCase().includes('declined') ||
                        origItem.toLowerCase().includes('down') ||
                        origItem.toLowerCase().includes('lowest');
                      const isNeutral =
                        origItem.toLowerCase().includes('missing') ||
                        origItem.toLowerCase().includes('not provided') ||
                        origItem.toLowerCase().includes('unavailable') ||
                        origItem.toLowerCase().includes('flat');
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/40 border border-white/5"
                        >
                          <div className="mt-0.5 shrink-0">
                            {isNeutral ? (
                              <Minus className="w-4 h-4 text-slate-400" />
                            ) : isDrop ? (
                              <TrendingDown className="w-4 h-4 text-rose-400" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {itemState.text}
                            {itemState.isTypingHere && (
                              <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. 3 Strategic Actions */}
              <div className="lg:col-span-6 p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        3 Suggested Actions
                      </h3>
                    </div>
                    <span className="text-[11px] text-amber-400 font-mono">
                      Executive Directives
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {summaryData.suggestedActions.map((_, idx) => {
                      const itemState = getRevealedItem('suggestedActions', idx);
                      if (!itemState.isVisible && isTyping) {
                        return (
                          <div
                            key={idx}
                            className="h-10 rounded-lg bg-amber-500/[0.02] border border-amber-500/5 animate-pulse"
                          />
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/15"
                        >
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {itemState.text}
                            {itemState.isTypingHere && (
                              <span className="inline-block w-1.5 h-3.5 bg-amber-400 animate-pulse ml-0.5 align-middle" />
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Metadata & Verification stamp */}
            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  Strict Prompt Grounding: Model quotes only supplied computed metrics; missing comparative data flagged explicitly.
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                {summaryData.modelUsed && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    Model: {summaryData.modelUsed}
                  </span>
                )}
                {summaryData.generatedAt && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(summaryData.generatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
