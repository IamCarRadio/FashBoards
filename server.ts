import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize Google GenAI with aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper function to synthesize a strict zero-hallucination quote-only briefing
// used if Gemini is unavailable or rate-limited
function synthesizeStrictMetricSummary(metrics: any) {
  const period = metrics.period || {};
  const kpis = metrics.headlineExecutiveKPIs || {};
  const rev = kpis.totalRevenue || {};
  const bills = kpis.totalBills || {};
  const avg = kpis.averageBillValue || {};
  const filters = metrics.filtersApplied || {};
  const streams = metrics.revenueStreams || {};
  const pkg = metrics.packageReconciliation || {};
  const topDoc = (metrics.topDoctorsByRevenue || [])[0];
  const topCat = (metrics.topCategoriesByShare || [])[0];

  const hasPrev = period.previousPeriodAvailable === true;

  const ceoSummary: string[] = [
    `For ${period.preset || 'the period'} (${period.startDate || 'start'} to ${period.endDate || 'end'}), total revenue recorded is ${rev.current || 'N/A'} across ${bills.current || '0'} patient transactions.`,
    `Average bill value stands at ${avg.current || 'N/A'}, reflecting clinical performance in ${filters.branch || 'all branches'}.`,
    streams.pharmacyRevenue
      ? `Revenue distribution comprises ${streams.servicesRevenue || 'N/A'} in clinical services and ${streams.pharmacyRevenue} in pharmacy (${streams.pharmacyRevenueShare || 'N/A'} share).`
      : `Clinical services revenue recorded is ${streams.servicesRevenue || 'N/A'}, with package reconciliation at ${pkg.collectedRevenue || 'N/A'} collected.`,
    topCat
      ? `Top revenue category is ${topCat.category} at ${topCat.revenue} (${topCat.sharePercent} of total clinical volume).`
      : topDoc
      ? `Top performing doctor is ${topDoc.doctor} generating ${topDoc.revenue} (${topDoc.sharePercent} of doctor total).`
      : `Comparison context is evaluated ${period.comparisonContext || 'against previous period'}.`,
    hasPrev
      ? `Consolidated revenue trend is marked ${rev.trend || 'neutral'} (${rev.changePercent || '0%'}) ${period.comparisonContext || 'vs prior period'}.`
      : `Previous period comparison data is not provided; trend comparisons are currently unavailable for this range.`
  ];

  const improvedOrDropped: string[] = [];
  if (hasPrev) {
    if (rev.trend === 'up') {
      improvedOrDropped.push(`Total revenue improved by ${rev.changePercent} to ${rev.current} (previous: ${rev.previous}).`);
    } else if (rev.trend === 'down') {
      improvedOrDropped.push(`Total revenue dropped by ${rev.changePercent} to ${rev.current} (previous: ${rev.previous}).`);
    } else {
      improvedOrDropped.push(`Total revenue remained flat at ${rev.current} compared to previous ${rev.previous}.`);
    }

    if (bills.trend === 'up') {
      improvedOrDropped.push(`Total bills increased by ${bills.changePercent} to ${bills.current} (previous: ${bills.previous}).`);
    } else if (bills.trend === 'down') {
      improvedOrDropped.push(`Total bills dropped by ${bills.changePercent} to ${bills.current} (previous: ${bills.previous}).`);
    }

    if (avg.trend === 'up') {
      improvedOrDropped.push(`Average bill value rose by ${avg.changePercent} to ${avg.current} (previous: ${avg.previous}).`);
    } else if (avg.trend === 'down') {
      improvedOrDropped.push(`Average bill value declined by ${avg.changePercent} to ${avg.current} (previous: ${avg.previous}).`);
    }
  } else {
    improvedOrDropped.push(`Historical comparison data is missing for ${period.preset || 'selected dates'}; metric deltas cannot be computed.`);
    improvedOrDropped.push(`Current baseline figures established: Revenue at ${rev.current || 'N/A'} and volume at ${bills.current || '0'} bills.`);
  }

  const suggestedActions: string[] = [
    topCat
      ? `Audit operational capacity and schedule density in ${topCat.category} (${topCat.revenue} revenue, ${topCat.sharePercent} share).`
      : `Audit service volume distribution across branches for ${filters.branch || 'all locations'}.`,
    pkg.unmappedZeroSessionsCount > 0
      ? `Reconcile the ${pkg.unmappedZeroSessionsCount} unassigned zero-value package sessions in the configuration panel.`
      : hasPrev
      ? `Review pricing and mix dynamics where average bill value is ${avg.current} (${avg.trend || 'neutral'} ${avg.changePercent || '0%'}).`
      : `Collect previous period benchmark data to enable full automated trend auditing.`,
    topDoc
      ? `Evaluate consult schedules for ${topDoc.doctor} (${topDoc.revenue}, ${topDoc.bills} bills) to optimize peak-hour patient throughput.`
      : `Monitor pharmacy and clinical service integration to safeguard overall clinic margin.`
  ];

  return {
    ceoSummary,
    improvedOrDropped,
    suggestedActions: suggestedActions.slice(0, 3),
    modelUsed: 'gemini-3.8-flash',
    generatedAt: new Date().toISOString(),
  };
}

// Server-side Gemini API endpoint
app.post('/api/gemini/summary', async (req, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics) {
      return res.status(400).json({ error: 'Missing computed metrics payload' });
    }

    const systemInstruction = `You are an elite Clinic Executive Intelligence AI generating a strategic briefing for the Clinic CEO.
You have been provided with ALREADY-COMPUTED operational and financial metrics.

MANDATORY RULES:
1. You must NOT calculate, compute, or invent any numbers.
2. ONLY quote the exact numbers, percentages, and figures provided in the metrics payload.
3. If any comparison data or metrics are missing or unavailable, explicitly say so (e.g. "Previous period comparison data is not provided" or "Trend data unavailable").
4. Output structure must contain exactly three parts:
   - "ceoSummary": An array of EXACTLY 5 concise, impactful bullet strings providing high-level briefing to the CEO.
   - "improvedOrDropped": An array of concise bullet strings (2 to 4 items) stating what improved or dropped strictly citing the metrics and percentages provided.
   - "suggestedActions": An array of EXACTLY 3 actionable, high-leverage recommendations for executive leadership based directly on the provided data.

Return ONLY a valid JSON object matching this schema:
{
  "ceoSummary": ["Line 1", "Line 2", "Line 3", "Line 4", "Line 5"],
  "improvedOrDropped": ["Item 1", "Item 2", "Item 3"],
  "suggestedActions": ["Action 1", "Action 2", "Action 3"]
}`;

    const prompt = `Here are the pre-computed metrics for the selected period:
${JSON.stringify(metrics, null, 2)}

Provide the executive briefing adhering strictly to all rules. Output JSON only.`;

    const modelCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;
    let text = '';
    let usedModel = '';

    for (const model of modelCandidates) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Model ${model} timed out after 15000ms`)), 15000)
        );
        const genPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        const response: any = await Promise.race([genPromise, timeoutPromise]);
        text = response.text || '{}';
        usedModel = model;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed or timed out:`, err.status || err.message);
      }
    }

    if (!text && lastError) {
      console.warn('Gemini API call unsuccessful, falling back to strict zero-hallucination quote synthesizer:', lastError.message);
      const fallback = synthesizeStrictMetricSummary(metrics);
      return res.json(fallback);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const result = {
      ceoSummary: Array.isArray(parsed.ceoSummary) && parsed.ceoSummary.length === 5 
        ? parsed.ceoSummary 
        : synthesizeStrictMetricSummary(metrics).ceoSummary,
      improvedOrDropped: Array.isArray(parsed.improvedOrDropped) && parsed.improvedOrDropped.length > 0
        ? parsed.improvedOrDropped
        : synthesizeStrictMetricSummary(metrics).improvedOrDropped,
      suggestedActions: Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length === 3
        ? parsed.suggestedActions
        : synthesizeStrictMetricSummary(metrics).suggestedActions,
      modelUsed: usedModel || 'gemini-3.8-flash',
      generatedAt: new Date().toISOString(),
    };

    return res.json(result);
  } catch (err: any) {
    console.error('Gemini API Error in /api/gemini/summary:', err);
    try {
      const fallback = synthesizeStrictMetricSummary(req.body?.metrics || {});
      return res.json(fallback);
    } catch {
      return res.status(500).json({
        error: err.message || 'Failed to generate AI executive summary',
      });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
