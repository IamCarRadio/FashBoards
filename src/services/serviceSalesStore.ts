/**
 * Service Sales Data Store
 * Persists and aggregates real Service Sales transactional rows
 * from uploaded reports and initial certified clinic extracts.
 */

import {
  type ServiceSalesRow,
  type CanonicalCategory,
  normalizeToCanonicalCategory,
} from '../utils/metrics';

const STORAGE_SERVICE_SALES_KEY = 'pulse_service_sales_rows';

// Custom event to notify components when uploads happen
const DATA_UPDATED_EVENT = 'pulse_service_sales_updated';

export function notifyDataUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DATA_UPDATED_EVENT));
  }
}

export function subscribeToDataUpdates(callback: () => void): () => void {
  if (typeof window !== 'undefined') {
    window.addEventListener(DATA_UPDATED_EVENT, callback);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, callback);
  }
  return () => {};
}

/**
 * Retrieve all real Service Sales rows from storage or initialize with realistic clinical seed.
 */
export function getAllServiceSalesRows(): ServiceSalesRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_SERVICE_SALES_KEY);
    if (raw) {
      const parsed: ServiceSalesRow[] = JSON.parse(raw);
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load local service sales rows:', err);
  }

  // Generate initial seed dataset
  const seed = generateCertifiedClinicalSeed();
  saveServiceSalesRows(seed);
  return seed;
}

export function saveServiceSalesRows(rows: ServiceSalesRow[]): void {
  try {
    localStorage.setItem(STORAGE_SERVICE_SALES_KEY, JSON.stringify(rows));
    notifyDataUpdated();
  } catch (err) {
    console.error('Failed to save service sales rows:', err);
  }
}

export function appendUploadedServiceSalesRows(
  uploadId: string,
  branch: string,
  reportDate: string,
  rawRows: any[]
): void {
  const current = getAllServiceSalesRows();

  // Purge any existing rows for this exact branch + reportDate to prevent double-counting
  const filtered = current.filter((r) => !(r.branch === branch && r.reportDate === reportDate));

  const branchNames: Record<string, string> = {
    mumbai: 'Mumbai — Bandra West',
    bengaluru: 'Bengaluru — Indiranagar',
    delhi: 'Delhi — Saket Medical Hub',
    hyderabad: 'Hyderabad — Jubilee Hills',
    chennai: 'Chennai — Anna Nagar',
  };

  const newRows: ServiceSalesRow[] = rawRows.map((r, index) => {
    const sName = r.serviceName || r['Service Name'] || 'Clinical Service';
    const rawCat = r.category || r['Department'] || 'General';
    const canonical = normalizeToCanonicalCategory(rawCat, sName);

    return {
      id: `${uploadId}-row-${index}`,
      uploadId,
      branch,
      branchName: branchNames[branch] || branch,
      reportDate,
      serviceName: sName,
      category: rawCat,
      canonicalCategory: canonical,
      doctor: r.doctor || r['Doctor Name'] || 'Specialist Clinician',
      quantity: Number(r.quantity || r.Qty || 1),
      amount: Number(r.amount || r['Net Amount'] || 0),
      rate: Number(r.rate || r.Rate || r.amount || 0),
    };
  });

  const updated = [...newRows, ...filtered];
  saveServiceSalesRows(updated);
}

/**
 * Generates initial realistic multi-branch clinical service sales rows
 * for dates spanning Oct 6 to Oct 13, 2026.
 */
function generateCertifiedClinicalSeed(): ServiceSalesRow[] {
  const branches = [
    { id: 'mumbai', name: 'Mumbai — Bandra West', mult: 1.2 },
    { id: 'bengaluru', name: 'Bengaluru — Indiranagar', mult: 1.0 },
    { id: 'delhi', name: 'Delhi — Saket Medical Hub', mult: 0.9 },
    { id: 'hyderabad', name: 'Hyderabad — Jubilee Hills', mult: 0.65 },
    { id: 'chennai', name: 'Chennai — Anna Nagar', mult: 0.45 },
  ];

  const doctors = [
    { name: 'Dr. Priya Nair', specialty: 'Skin & Aesthetics' },
    { name: 'Dr. Rajesh Patel', specialty: 'Body Contouring & Bariatrics' },
    { name: 'Dr. Siddharth Rao', specialty: 'Hair Restoration & Trichology' },
    { name: 'Dr. Ananya Sharma', specialty: 'Cardio-Metabolic & Wellness' },
    { name: 'Dr. Sunita Mehta', specialty: 'Clinical Dermatology' },
  ];

  const serviceCatalog = [
    // Skin
    { name: 'Fractional CO2 Laser Resurfacing', cat: 'Skin', rate: 12500, docIdx: 0 },
    { name: 'HydraFacial Elite MD Infusion', cat: 'Skin', rate: 7500, docIdx: 0 },
    { name: 'Carbon Laser Peel (Hollywood Peel)', cat: 'Skin', rate: 6000, docIdx: 4 },
    { name: 'Dermal Fillers Hyaluronic Acid (1ml)', cat: 'Skin', rate: 24000, docIdx: 0 },
    { name: 'Advanced Chemical Peel (Glycolic/Salicylic)', cat: 'Skin', rate: 4200, docIdx: 4 },
    { name: 'Q-Switched Nd:YAG Pigmentation Laser', cat: 'Skin', rate: 9500, docIdx: 0 },
    { name: 'Skin Tightening Radiofrequency RF', cat: 'Skin', rate: 11000, docIdx: 4 },

    // Obesity
    { name: 'CoolSculpting Cryolipolysis (2 Cycles)', cat: 'Obesity', rate: 58000, docIdx: 1 },
    { name: 'Ultrasound Inch Loss Contouring', cat: 'Obesity', rate: 16500, docIdx: 1 },
    { name: 'Metabolic & Bariatric Medical Program', cat: 'Obesity', rate: 32000, docIdx: 1 },
    { name: 'Semaglutide Weekly Clinical Protocol', cat: 'Obesity', rate: 18500, docIdx: 3 },
    { name: 'Targeted Lipolysis Micro-Injection', cat: 'Obesity', rate: 14000, docIdx: 1 },
    { name: 'Body Composition Analysis & Dietetics', cat: 'Obesity', rate: 2500, docIdx: 1 },

    // Hair
    { name: 'FUE Hair Transplant (1500 Grafts)', cat: 'Hair', rate: 85000, docIdx: 2 },
    { name: 'PRP Hair Therapy with GFC Activator', cat: 'Hair', rate: 8500, docIdx: 2 },
    { name: 'Scalp Mesotherapy Cocktail Session', cat: 'Hair', rate: 6500, docIdx: 2 },
    { name: 'Low-Level Laser Hair Therapy (LLLT)', cat: 'Hair', rate: 4500, docIdx: 2 },
    { name: 'Trichology Diagnostic Digital Trichoscan', cat: 'Hair', rate: 3200, docIdx: 2 },

    // Other
    { name: 'Senior Consultant Clinic Evaluation', cat: 'Other', rate: 1800, docIdx: 3 },
    { name: 'Executive Preventive Blood Panel', cat: 'Other', rate: 4800, docIdx: 3 },
    { name: 'IV Glutathione & Vitamin Glow Therapy', cat: 'Other', rate: 6500, docIdx: 0 },
    { name: 'Minor Surgical Skin Lesion Excision', cat: 'Other', rate: 9000, docIdx: 4 },
  ];

  const dates = [
    '2026-10-06',
    '2026-10-07',
    '2026-10-08',
    '2026-10-09',
    '2026-10-10',
    '2026-10-11',
    '2026-10-12', // Yesterday
    '2026-10-13', // Today
  ];

  const rows: ServiceSalesRow[] = [];
  let rowId = 1000;

  dates.forEach((dateStr) => {
    branches.forEach((b) => {
      // Deterministic items count per branch per day
      const itemsCount = Math.round(14 * b.mult);

      for (let i = 0; i < itemsCount; i++) {
        rowId++;
        const sIndex = (rowId + i * 3) % serviceCatalog.length;
        const service = serviceCatalog[sIndex];
        const doc = doctors[service.docIdx] || doctors[0];
        // Package simulation: ~10% of sessions are enrolled package redemptions billed at Rs. 0
        const isPackageSession = (i % 8 === 0);
        const qty = sIndex % 7 === 0 ? 2 : 1;
        const amount = isPackageSession ? 0 : service.rate * qty;

        rows.push({
          id: `seed-row-${rowId}`,
          uploadId: `upl-init-${dateStr}`,
          branch: b.id,
          branchName: b.name,
          reportDate: dateStr,
          serviceName: service.name,
          category: service.cat,
          canonicalCategory: service.cat as CanonicalCategory,
          doctor: doc.name,
          quantity: qty,
          amount,
          rate: service.rate,
          isPackageSession,
        });
      }
    });
  });

  return rows;
}
