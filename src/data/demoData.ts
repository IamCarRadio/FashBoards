/**
 * Realistic Multi-Branch Clinic Network Demo Data
 * All metrics marked clearly as Demo Data.
 */

export interface MetricCardData {
  id: string;
  title: string;
  value: number;
  type: 'currency' | 'number' | 'percent' | 'rating';
  previousValue: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  timeframe: string;
  compactValue?: string;
  iconName: string;
  color: 'indigo' | 'emerald' | 'cyan' | 'rose' | 'amber';
  subtext?: string;
}

export interface BranchMetric {
  id: string;
  name: string;
  city: string;
  revenue: number;
  targetRevenue: number;
  patientVolume: number;
  bedOccupancy: number;
  avgWaitMins: number;
  satisfaction: number;
  growth: number;
  status: 'optimal' | 'warning' | 'critical';
}

export interface DoctorPerformance {
  id: string;
  name: string;
  specialty: string;
  branch: string;
  patientsSeen: number;
  revenueGenerated: number;
  conversionRate: number; // e.g. 78%
  avgRating: number;
  avatar: string;
}

export interface DailyTrendPoint {
  date: string;
  timeSlot?: string;
  revenue: number;
  target: number;
  patients: number;
  pharmacy: number;
}

export interface DepartmentRevenue {
  name: string;
  revenue: number;
  marginPercent: number;
  color: string;
  patientShare: number;
}

export interface ClinicalProcedure {
  id: string;
  name: string;
  department: string;
  count: number;
  avgCost: number;
  totalRevenue: number;
  margin: number;
  avgDurationMins: number;
  growth: number;
}

export interface PharmacyStockItem {
  id: string;
  code: string;
  name: string;
  category: 'Cardiac' | 'Orthopedic' | 'Antibiotic' | 'Oncology' | 'Consumables' | 'Pediatric';
  currentStock: number;
  minThreshold: number;
  unitPrice: number;
  expiryDate: string;
  daysToExpiry: number;
  status: 'healthy' | 'low_stock' | 'expiring_soon' | 'critical';
  supplier: string;
}

export interface RealtimePulseItem {
  id: string;
  time: string;
  branch: string;
  type: 'admission' | 'pharmacy_large' | 'surgery_completed' | 'vip_checkin' | 'alert';
  title: string;
  amount?: number;
  badge: string;
  color: 'indigo' | 'emerald' | 'amber' | 'cyan' | 'rose';
}

export const DEMO_DATA_TAG = 'DEMO_DATA_SIMULATION';

// Generate filter-sensitive metrics
export function getExecutiveKPIs(branchId: string = 'all', datePreset: string = 'Today'): MetricCardData[] {
  // Branch multiplier
  const multiplier = branchId === 'all' ? 1.0 : branchId === 'mumbai' ? 0.32 : branchId === 'bengaluru' ? 0.26 : branchId === 'delhi' ? 0.22 : 0.10;
  
  // Date preset multiplier
  const dateMult = datePreset === 'Today' ? 1 : datePreset === 'Yesterday' ? 0.95 : datePreset === '7D' ? 6.8 : datePreset === '30D' ? 29.5 : 24.2;

  const baseRev = 18450000 * multiplier * (datePreset === 'Today' ? 0.24 : datePreset === 'Yesterday' ? 0.23 : datePreset === '7D' ? 1.6 : datePreset === '30D' ? 7.2 : 5.8);
  const basePatients = Math.round(3420 * multiplier * dateMult * 0.28);
  const basePharmacy = Math.round(baseRev * 0.32);

  return [
    {
      id: 'kpi-revenue',
      title: 'Gross Revenue',
      value: Math.round(baseRev),
      type: 'currency',
      previousValue: Math.round(baseRev * 0.88),
      changePercent: 13.6,
      trend: 'up',
      timeframe: `vs previous ${datePreset}`,
      iconName: 'IndianRupee',
      color: 'indigo',
      subtext: 'Target 94% achieved',
    },
    {
      id: 'kpi-footfall',
      title: 'Patient Footfall',
      value: basePatients,
      type: 'number',
      previousValue: Math.round(basePatients * 0.93),
      changePercent: 7.5,
      trend: 'up',
      timeframe: `vs previous ${datePreset}`,
      iconName: 'Users',
      color: 'cyan',
      subtext: '86% OPD, 14% IPD',
    },
    {
      id: 'kpi-pharmacy',
      title: 'Pharmacy Dispense',
      value: basePharmacy,
      type: 'currency',
      previousValue: Math.round(basePharmacy * 0.91),
      changePercent: 9.8,
      trend: 'up',
      timeframe: 'Rx fulfillment 94.2%',
      iconName: 'Pill',
      color: 'emerald',
      subtext: 'Avg ticket ₹1,480',
    },
    {
      id: 'kpi-occupancy',
      title: 'Bed Occupancy',
      value: 84.2,
      type: 'percent',
      previousValue: 80.5,
      changePercent: 4.6,
      trend: 'up',
      timeframe: '312/370 active beds',
      iconName: 'BedDouble',
      color: 'amber',
      subtext: 'ICU: 91% capacity',
    },
    {
      id: 'kpi-ticket',
      title: 'Average Ticket Size',
      value: 5380,
      type: 'currency',
      previousValue: 5120,
      changePercent: 5.1,
      trend: 'up',
      timeframe: 'Consult + Diagnostics',
      iconName: 'Receipt',
      color: 'indigo',
      subtext: '+₹260 margin',
    },
    {
      id: 'kpi-csat',
      title: 'Patient CSAT Score',
      value: 4.82,
      type: 'rating',
      previousValue: 4.75,
      changePercent: 1.5,
      trend: 'up',
      timeframe: 'Based on 1,420 feedback SMS',
      iconName: 'HeartPulse',
      color: 'emerald',
      subtext: '94% NPS promoter score',
    },
  ];
}

export const BRANCH_METRICS: BranchMetric[] = [
  {
    id: 'mumbai',
    name: 'Mumbai — Bandra West',
    city: 'Mumbai',
    revenue: 5840000,
    targetRevenue: 6000000,
    patientVolume: 1140,
    bedOccupancy: 88.5,
    avgWaitMins: 14,
    satisfaction: 4.9,
    growth: 16.4,
    status: 'optimal',
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru — Indiranagar',
    city: 'Bengaluru',
    revenue: 4920000,
    targetRevenue: 5200000,
    patientVolume: 920,
    bedOccupancy: 82.1,
    avgWaitMins: 18,
    satisfaction: 4.8,
    growth: 12.1,
    status: 'optimal',
  },
  {
    id: 'delhi',
    name: 'Delhi — Saket Medical Hub',
    city: 'Delhi',
    revenue: 4180000,
    targetRevenue: 4500000,
    patientVolume: 810,
    bedOccupancy: 86.4,
    avgWaitMins: 22,
    satisfaction: 4.7,
    growth: 8.9,
    status: 'warning',
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad — Jubilee Hills',
    city: 'Hyderabad',
    revenue: 2310000,
    targetRevenue: 2500000,
    patientVolume: 510,
    bedOccupancy: 76.0,
    avgWaitMins: 12,
    satisfaction: 4.9,
    growth: 21.3,
    status: 'optimal',
  },
  {
    id: 'chennai',
    name: 'Chennai — Anna Nagar',
    city: 'Chennai',
    revenue: 1200000,
    targetRevenue: 1800000,
    patientVolume: 290,
    bedOccupancy: 68.2,
    avgWaitMins: 16,
    satisfaction: 4.6,
    growth: -3.4,
    status: 'critical',
  },
];

export const DEPARTMENT_REVENUE_DATA: DepartmentRevenue[] = [
  { name: 'Cardiology & Cath Lab', revenue: 5400000, marginPercent: 44, color: '#6366F1', patientShare: 24 },
  { name: 'Orthopedics & Joint Care', revenue: 4200000, marginPercent: 42, color: '#38BDF8', patientShare: 20 },
  { name: 'Oncology & Daycare Chemo', revenue: 3100000, marginPercent: 48, color: '#22D3EE', patientShare: 12 },
  { name: 'Pharmacy & OTC Store', revenue: 3350000, marginPercent: 36, color: '#10B981', patientShare: 28 },
  { name: 'Diagnostics & Radiology', revenue: 1600000, marginPercent: 52, color: '#F59E0B', patientShare: 16 },
];

export const DAILY_TREND_SERIES: DailyTrendPoint[] = [
  { date: '08:00', timeSlot: '8 AM', revenue: 420000, target: 350000, patients: 85, pharmacy: 120000 },
  { date: '10:00', timeSlot: '10 AM', revenue: 1450000, target: 1200000, patients: 260, pharmacy: 380000 },
  { date: '12:00', timeSlot: '12 PM', revenue: 2980000, target: 2600000, patients: 490, pharmacy: 780000 },
  { date: '14:00', timeSlot: '2 PM', revenue: 3850000, target: 3700000, patients: 590, pharmacy: 990000 },
  { date: '16:00', timeSlot: '4 PM', revenue: 5120000, target: 4900000, patients: 780, pharmacy: 1350000 },
  { date: '18:00', timeSlot: '6 PM', revenue: 6940000, target: 6500000, patients: 1040, pharmacy: 1890000 },
  { date: '20:00', timeSlot: '8 PM', revenue: 8450000, target: 8000000, patients: 1210, pharmacy: 2280000 },
];

export const TOP_DOCTORS: DoctorPerformance[] = [
  {
    id: 'dr_ananya',
    name: 'Dr. Ananya Sharma',
    specialty: 'Chief Interventional Cardiologist',
    branch: 'Mumbai — Bandra West',
    patientsSeen: 46,
    revenueGenerated: 1240000,
    conversionRate: 88,
    avgRating: 4.95,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'dr_rajesh',
    name: 'Dr. Rajesh Patel',
    specialty: 'Senior Joint Replacement Surgeon',
    branch: 'Bengaluru — Indiranagar',
    patientsSeen: 38,
    revenueGenerated: 980000,
    conversionRate: 84,
    avgRating: 4.91,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'dr_priya',
    name: 'Dr. Priya Nair',
    specialty: 'Clinical & Cosmetic Dermatologist',
    branch: 'Delhi — Saket Medical Hub',
    patientsSeen: 52,
    revenueGenerated: 720000,
    conversionRate: 92,
    avgRating: 4.88,
    avatar: 'https://images.unsplash.com/photo-1594824813511-c9902636a0d0?w=120&auto=format&fit=crop&q=80',
  },
  {
    id: 'dr_siddharth',
    name: 'Dr. Siddharth Rao',
    specialty: 'Neurosurgeon & Spine Specialist',
    branch: 'Hyderabad — Jubilee Hills',
    patientsSeen: 29,
    revenueGenerated: 850000,
    conversionRate: 79,
    avgRating: 4.85,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=120&auto=format&fit=crop&q=80',
  },
];

export const REALTIME_PULSE_FEED: RealtimePulseItem[] = [
  {
    id: 'pulse-1',
    time: '2 mins ago',
    branch: 'Mumbai — Bandra',
    type: 'surgery_completed',
    title: 'Emergency Coronary Angioplasty completed by Dr. Sharma',
    amount: 245000,
    badge: 'OT-1 SUCCESS',
    color: 'emerald',
  },
  {
    id: 'pulse-2',
    time: '8 mins ago',
    branch: 'Bengaluru — Indiranagar',
    type: 'pharmacy_large',
    title: 'High-value specialty oncology dispensing logged',
    amount: 118400,
    badge: 'PHARMACY DISPENSE',
    color: 'indigo',
  },
  {
    id: 'pulse-3',
    time: '14 mins ago',
    branch: 'Delhi — Saket Hub',
    type: 'admission',
    title: 'VIP Suite Inpatient Admission — Deluxe Ortho Care',
    amount: 85000,
    badge: 'IPD ADMISSION',
    color: 'cyan',
  },
  {
    id: 'pulse-4',
    time: '22 mins ago',
    branch: 'Chennai — Anna Nagar',
    type: 'alert',
    title: 'OPD wait time spiked to 26 mins (Cardiology wing)',
    badge: 'CAPACITY ALERT',
    color: 'amber',
  },
];

export const CLINICAL_PROCEDURES: ClinicalProcedure[] = [
  {
    id: 'proc-1',
    name: 'Coronary Angiography (CAG)',
    department: 'Cardiology',
    count: 142,
    avgCost: 28500,
    totalRevenue: 4047000,
    margin: 48,
    avgDurationMins: 45,
    growth: 14.2,
  },
  {
    id: 'proc-2',
    name: 'Total Knee Replacement (Robotic)',
    department: 'Orthopedics',
    count: 38,
    avgCost: 265000,
    totalRevenue: 10070000,
    margin: 44,
    avgDurationMins: 90,
    growth: 22.8,
  },
  {
    id: 'proc-3',
    name: 'Laser Cataract Surgery (Phaco)',
    department: 'Ophthalmology',
    count: 184,
    avgCost: 35000,
    totalRevenue: 6440000,
    margin: 54,
    avgDurationMins: 20,
    growth: 8.6,
  },
  {
    id: 'proc-4',
    name: 'MRI 3-Tesla Whole Spine Contrast',
    department: 'Diagnostics',
    count: 220,
    avgCost: 14500,
    totalRevenue: 3190000,
    margin: 62,
    avgDurationMins: 35,
    growth: 18.0,
  },
  {
    id: 'proc-5',
    name: 'Chemotherapy Daycare Infusion',
    department: 'Oncology',
    count: 96,
    avgCost: 42000,
    totalRevenue: 4032000,
    margin: 41,
    avgDurationMins: 180,
    growth: 11.5,
  },
  {
    id: 'proc-6',
    name: 'Laparoscopic Cholecystectomy',
    department: 'General Surgery',
    count: 52,
    avgCost: 78000,
    totalRevenue: 4056000,
    margin: 46,
    avgDurationMins: 60,
    growth: 6.4,
  },
];

export const PHARMACY_STOCK_ITEMS: PharmacyStockItem[] = [
  {
    id: 'ph-1',
    code: 'MED-ATOR-40',
    name: 'Atorvastatin 40mg (Lipitor tab)',
    category: 'Cardiac',
    currentStock: 420,
    minThreshold: 100,
    unitPrice: 42.5,
    expiryDate: '2027-08-15',
    daysToExpiry: 306,
    status: 'healthy',
    supplier: 'Sun Pharma Ltd',
  },
  {
    id: 'ph-2',
    code: 'MED-AUG-625',
    name: 'Augmentin 625mg Duo (Amoxyclav)',
    category: 'Antibiotic',
    currentStock: 68,
    minThreshold: 150,
    unitPrice: 18.2,
    expiryDate: '2027-03-10',
    daysToExpiry: 148,
    status: 'low_stock',
    supplier: 'GSK India',
  },
  {
    id: 'ph-3',
    code: 'MED-HERC-440',
    name: 'Trastuzumab 440mg (Herclon vial)',
    category: 'Oncology',
    currentStock: 12,
    minThreshold: 10,
    unitPrice: 54000,
    expiryDate: '2026-11-20',
    daysToExpiry: 38,
    status: 'expiring_soon',
    supplier: 'Roche Diagnostics',
  },
  {
    id: 'ph-4',
    code: 'MED-ENOP-40',
    name: 'Enoxaparin 40mg PFS (Clexane injection)',
    category: 'Cardiac',
    currentStock: 280,
    minThreshold: 80,
    unitPrice: 420.0,
    expiryDate: '2027-12-01',
    daysToExpiry: 414,
    status: 'healthy',
    supplier: 'Sanofi Healthcare',
  },
  {
    id: 'ph-5',
    code: 'MED-COLL-C',
    name: 'Collagen Membrane Type-I Surgical',
    category: 'Consumables',
    currentStock: 14,
    minThreshold: 20,
    unitPrice: 3800.0,
    expiryDate: '2026-11-05',
    daysToExpiry: 23,
    status: 'critical',
    supplier: 'Eucare Pharmaceuticals',
  },
  {
    id: 'ph-6',
    code: 'MED-GLIMP-2',
    name: 'Glimepiride + Metformin SR (Amaryl M)',
    category: 'Cardiac',
    currentStock: 950,
    minThreshold: 200,
    unitPrice: 12.8,
    expiryDate: '2028-02-14',
    daysToExpiry: 489,
    status: 'healthy',
    supplier: 'Sanofi Healthcare',
  },
];
