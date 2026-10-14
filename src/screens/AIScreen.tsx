import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';

interface AIInsightResponse {
  query: string;
  answer: string;
  highlights: string[];
  suggestedAction: string;
  metricImpact?: string;
}

const PRESET_QUERIES = [
  'Why did Chennai revenue dip 3.4% this week?',
  'Forecast next week pharmacy stock requirements',
  'Summarize today executive clinic run-rate highlights',
  'Doctor conversion bottleneck at Saket Medical Hub',
];

const PRESET_ANSWERS: Record<string, AIInsightResponse> = {
  'Why did Chennai revenue dip 3.4% this week?': {
    query: 'Why did Chennai revenue dip 3.4% this week?',
    answer:
      'Analysis of Chennai — Anna Nagar telemetry reveals a 22% dip in Daycare Ophthalmology procedures due to laser equipment recalibration on Tuesday and Wednesday. OPD footfall remained steady at 290 patients, but procedural billing dropped by ₹2.4 Lakhs.',
    highlights: [
      'Ophthalmology laser downtime caused 14 scheduled cataract procedures to defer.',
      'Cardiology and Pharmacy maintained normal run-rates (+4.2%).',
      'Rescheduling completed: 11 of the 14 procedures are slated for Friday/Saturday recovery.',
    ],
    suggestedAction:
      'Authorize weekend OT slot allocation at Anna Nagar to recoup ₹3.1L deferred surgical revenue.',
    metricImpact: 'Estimated net recovery: +₹2.8L by end of week.',
  },
  'Forecast next week pharmacy stock requirements': {
    query: 'Forecast next week pharmacy stock requirements',
    answer:
      'Based on current bed occupancy (84.2%) and scheduled joint replacement surgeries across Mumbai & Bengaluru, demand for Enoxaparin 40mg and surgical collagen membranes will surge by 35% over average weekly burn rate.',
    highlights: [
      'Enoxaparin injection stock is healthy (280 units, 14 days cover).',
      'Collagen Membrane Type-I is critically low (14 units remaining, threshold 20).',
      'Augmentin 625 Duo requires reorder from GSK India by tomorrow 11 AM.',
    ],
    suggestedAction:
      'Auto-trigger purchase order PO-2026-881 for 40 units Collagen Membrane from Eucare Pharmaceuticals.',
    metricImpact: 'Avoids estimated ₹1.8L surgical supply chain delay penalty.',
  },
  'Summarize today executive clinic run-rate highlights': {
    query: 'Summarize today executive clinic run-rate highlights',
    answer:
      'The clinic network generated ₹1.84 Cr in consolidated revenue today, achieving 94.2% of daily budget. Mumbai and Hyderabad branches outperformed budget with high-margin cath lab and neuro procedures, while Chennai operates below capacity.',
    highlights: [
      'Gross Revenue pacing +13.6% ahead of prior cycle.',
      'Average ticket size expanded to ₹5,380 (+5.1%) driven by robotics package uptake.',
      'Pharmacy sales contributed ₹58.4L (31.7% of total revenue) at 38.4% gross margin.',
      'Patient CSAT recorded at 4.82/5 across 1,420 post-consult surveys.',
    ],
    suggestedAction:
      'Schedule 15-minute sync with Chennai Medical Director Dr. Sundaram on OT block schedule utilization.',
    metricImpact: 'Consolidated network on track for ₹55 Cr monthly billing milestone.',
  },
  'Doctor conversion bottleneck at Saket Medical Hub': {
    query: 'Doctor conversion bottleneck at Saket Medical Hub',
    answer:
      'At Delhi Saket Hub, OPD to diagnostic conversion is strong (68%), but surgical conversion in Orthopedics is lagging at 21% (network average is 34.8%). Patient wait time between OPD consult and pre-anesthesia clearance (PAC) is averaging 42 minutes.',
    highlights: [
      'Dr. Priya Nair maintains high cosmetic conversion (92%).',
      'Orthopedic PAC clinic is currently staffed by a single rotating anesthesiologist.',
      '38 patients opted for second opinion during the PAC wait period.',
    ],
    suggestedAction:
      'Deploy dedicated morning PAC junior consultant at Saket to compress clearance wait to &lt; 15 mins.',
    metricImpact: 'Projected +12 surgical conversions/week (+₹18.5L revenue).',
  },
};

export const AIScreen: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<string>(
    'Summarize today executive clinic run-rate highlights'
  );
  const [customInput, setCustomInput] = useState('');
  const [activeInsight, setActiveInsight] = useState<AIInsightResponse>(
    PRESET_ANSWERS['Summarize today executive clinic run-rate highlights']
  );
  const [isThinking, setIsThinking] = useState(false);

  const handleSelectPrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setIsThinking(true);
    setTimeout(() => {
      const response =
        PRESET_ANSWERS[prompt] || {
          query: prompt,
          answer: `Analysis of multi-branch data for query "${prompt}": Telemetry indicates steady 84% bed utilization and balanced OPD margins across Mumbai and Bengaluru branches. Diagnostic conversion stands at 72%.`,
          highlights: [
            'Real-time metrics correlate with seasonal clinic volume trends.',
            'Working capital cycle in pharmacy maintained at 24 days.',
            'No critical patient safety or compliance outliers detected in the active timeframe.',
          ],
          suggestedAction:
            'Review weekly clinical governance report during Monday morning executive rounds.',
          metricImpact: 'Status: Healthy baseline operations.',
        };
      setActiveInsight(response);
      setIsThinking(false);
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleSelectPrompt(customInput.trim());
    setCustomInput('');
  };

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
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Executive AI Intelligence Briefing
            </h2>
            <Badge variant="cyan" size="sm">
              DEMO DATA
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time natural language reasoning over consolidated clinic group telemetry
          </p>
        </div>

        <Badge variant="indigo" size="md">
          Gemini Intelligence Architecture Ready
        </Badge>
      </div>

      {/* Suggested Prompt Chips */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          High-Priority Executive Queries
        </p>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {PRESET_QUERIES.map((query) => (
            <button
              key={query}
              onClick={() => handleSelectPrompt(query)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                selectedPrompt === query
                  ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-cyan-300 border-indigo-400/40 shadow-sm'
                  : 'bg-slate-900/60 light:bg-slate-100 text-slate-400 hover:text-slate-200 border-white/5 hover:border-white/10'
              }`}
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* AI Answer Card */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                CEO Decision Intelligence
              </p>
              <h3 className="text-sm sm:text-base font-bold text-white light:text-slate-900">
                {activeInsight.query}
              </h3>
            </div>
          </div>

          <Badge variant="emerald" size="sm" dot>
            Verified from Telemetry
          </Badge>
        </div>

        {isThinking ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Synthesizing multi-branch clinic data...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Main Narrative Answer */}
            <p className="text-sm leading-relaxed text-slate-200 light:text-slate-700">
              {activeInsight.answer}
            </p>

            {/* Key Analytical Takeaways */}
            <div className="p-4 rounded-xl bg-slate-900/70 light:bg-slate-50 border border-white/5 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Key Diagnostic Findings
              </p>
              <div className="space-y-1.5">
                {activeInsight.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 light:text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested CEO Action */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-cyan-950/40 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Recommended CEO Intervention
                </p>
                <p className="text-xs font-semibold text-white light:text-slate-900">
                  {activeInsight.suggestedAction}
                </p>
              </div>

              {activeInsight.metricImpact && (
                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    {activeInsight.metricImpact}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Natural Language Query Bar */}
      <form onSubmit={handleCustomSubmit} className="relative flex items-center">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Ask a question about multi-branch revenue, wait times, or doctor metrics..."
          className="w-full pl-5 pr-28 py-3.5 rounded-2xl glass-panel text-xs text-white placeholder:text-slate-500 border border-white/10 focus:outline-none focus:border-cyan-400 shadow-xl"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Button type="submit" variant="primary" size="sm" disabled={!customInput.trim()}>
            <span>Ask Pulse</span>
            <Send className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
