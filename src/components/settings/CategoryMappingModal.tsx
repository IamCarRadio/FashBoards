import React, { useState, useMemo } from 'react';
import {
  type CanonicalCategory,
  type CategoryMappingConfig,
  type ServiceSalesRow,
  autoSuggestCategory,
  detectUnmappedServices,
} from '../../utils/metrics';
import {
  getCategoryMappings,
  saveCategoryMappings,
  updateSingleCategoryMapping,
} from '../../services/clinicConfigStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Layers,
  X,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface CategoryMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRows: ServiceSalesRow[];
}

export const CategoryMappingModal: React.FC<CategoryMappingModalProps> = ({
  isOpen,
  onClose,
  allRows,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unmapped' | CanonicalCategory>('all');
  const [mappings, setMappings] = useState<CategoryMappingConfig>(getCategoryMappings());
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Extract all unique services from rows
  const allUniqueServices = useMemo(() => {
    const map: Record<string, { count: number; sampleDept: string; sampleDoc: string }> = {};
    allRows.forEach((r) => {
      const s = r.serviceName.trim();
      if (!map[s]) {
        map[s] = { count: 0, sampleDept: r.category, sampleDoc: r.doctor };
      }
      map[s].count += r.quantity || 1;
    });
    return Object.keys(map).map((sName) => ({
      name: sName,
      count: map[sName].count,
      sampleDept: map[sName].sampleDept,
      sampleDoc: map[sName].sampleDoc,
      currentCategory: mappings[sName] || null,
      autoSuggested: autoSuggestCategory(sName, map[sName].sampleDept),
    }));
  }, [allRows, mappings]);

  // Unmapped list
  const unmappedServices = useMemo(() => {
    return allUniqueServices.filter((s) => !mappings[s.name]);
  }, [allUniqueServices, mappings]);

  if (!isOpen) return null;

  const handleUpdate = (serviceName: string, category: CanonicalCategory) => {
    const updated = { ...mappings, [serviceName]: category };
    setMappings(updated);
    saveCategoryMappings(updated);
    triggerSuccess();
  };

  const handleAutoSuggestAll = () => {
    const updated = { ...mappings };
    allUniqueServices.forEach((s) => {
      if (!updated[s.name]) {
        updated[s.name] = s.autoSuggested;
      }
    });
    setMappings(updated);
    saveCategoryMappings(updated);
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  const filteredServices = allUniqueServices.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unmapped') return !mappings[s.name];
    return mappings[s.name] === selectedFilter;
  });

  const categories: CanonicalCategory[] = ['Skin', 'Obesity', 'Hair', 'Other'];

  const categoryColorStyles: Record<CanonicalCategory, string> = {
    Skin: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    Obesity: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    Hair: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Other: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl glass-panel p-5 sm:p-6 shadow-2xl relative border border-white/15 text-white bg-slate-900/95 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Category Mapping Configuration
                </h3>
                {unmappedServices.length > 0 ? (
                  <Badge variant="rose" dot size="sm">
                    {unmappedServices.length} Unmapped
                  </Badge>
                ) : (
                  <Badge variant="emerald" dot size="sm">
                    100% Services Mapped
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maps raw service names to canonical clinical categories (Skin, Obesity, Hair, Other). Zero silent drops.
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

        {/* Unmapped Services Alert Banner */}
        {unmappedServices.length > 0 && (
          <div className="my-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold text-rose-300">
                  {unmappedServices.length} Unmapped Services Detected
                </p>
                <p className="text-[11px] text-slate-300">
                  Services without explicit mapping may default to auto-heuristics. Assign them below.
                </p>
              </div>
            </div>

            <Button
              onClick={handleAutoSuggestAll}
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5 text-cyan-200" />}
            >
              Auto-Map All Using Keywords
            </Button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="my-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto p-1 bg-slate-950/60 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({allUniqueServices.length})
            </button>
            {unmappedServices.length > 0 && (
              <button
                onClick={() => setSelectedFilter('unmapped')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedFilter === 'unmapped' ? 'bg-rose-500/25 text-rose-300' : 'text-rose-400 hover:text-rose-200'
                }`}
              >
                Unmapped ({unmappedServices.length})
              </button>
            )}
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedFilter === cat ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search service name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Mapping Table */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 my-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold sticky top-0 border-b border-white/10 z-10 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-3">Raw Service Name</th>
                <th className="py-2.5 px-3">Sessions In Store</th>
                <th className="py-2.5 px-3">Auto-Suggestion</th>
                <th className="py-2.5 px-3">Assigned Category</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {filteredServices.map((service) => {
                const isExplicitlyMapped = !!mappings[service.name];
                const activeCategory = mappings[service.name] || service.autoSuggested;

                return (
                  <tr key={service.name} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-3 font-sans font-bold text-white max-w-[280px]">
                      <div className="flex items-center gap-2">
                        <span>{service.name}</span>
                        {!isExplicitlyMapped && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20 font-sans">
                            Needs Approval
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Raw Dept: {service.sampleDept} &bull; Dr: {service.sampleDoc}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-slate-300 font-mono">
                      {service.count} sessions
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        {service.autoSuggested}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {categories.map((cat) => {
                          const isSelected = activeCategory === cat;
                          return (
                            <button
                              key={cat}
                              onClick={() => handleUpdate(service.name, cat)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                isSelected
                                  ? categoryColorStyles[cat]
                                  : 'text-slate-400 bg-slate-900 border-white/5 hover:border-white/20'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-sans">
                      {!isExplicitlyMapped ? (
                        <button
                          onClick={() => handleUpdate(service.name, service.autoSuggested)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 text-[10px] font-bold hover:bg-cyan-500/25 transition-colors"
                        >
                          Accept Suggestion
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmed
                        </span>
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
            <span>Category mappings automatically update Home, Services, and Doctors dashboards.</span>
          </div>

          <Button onClick={onClose} variant="primary" size="sm">
            Save & Close Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
