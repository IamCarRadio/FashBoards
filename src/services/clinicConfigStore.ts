/**
 * Clinic Configuration Store
 * Persists Category Mappings, Package Values, and Revenue Mode (Collected vs Service-value).
 */
import {
  type CanonicalCategory,
  type CategoryMappingConfig,
  type PackageValuesConfig,
  type RevenueMode,
} from '../utils/metrics';

const STORAGE_CAT_MAPPING_KEY = 'pulse_category_mapping_config';
const STORAGE_PKG_VALUES_KEY = 'pulse_package_values_config';
const STORAGE_REV_MODE_KEY = 'pulse_revenue_mode_preference';
const CONFIG_UPDATED_EVENT = 'pulse_clinic_config_updated';

export function notifyConfigUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CONFIG_UPDATED_EVENT));
  }
}

export function subscribeToConfigUpdates(callback: () => void): () => void {
  if (typeof window !== 'undefined') {
    window.addEventListener(CONFIG_UPDATED_EVENT, callback);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, callback);
  }
  return () => {};
}

// Default initial category mappings
const DEFAULT_CATEGORY_MAPPINGS: CategoryMappingConfig = {
  'Fractional CO2 Laser Resurfacing': 'Skin',
  'HydraFacial Elite MD Infusion': 'Skin',
  'Carbon Laser Peel (Hollywood Peel)': 'Skin',
  'Dermal Fillers Hyaluronic Acid (1ml)': 'Skin',
  'Advanced Chemical Peel (Glycolic/Salicylic)': 'Skin',
  'Q-Switched Nd:YAG Pigmentation Laser': 'Skin',
  'Skin Tightening Radiofrequency RF': 'Skin',
  'CoolSculpting Cryolipolysis (2 Cycles)': 'Obesity',
  'Ultrasound Inch Loss Contouring': 'Obesity',
  'Metabolic & Bariatric Medical Program': 'Obesity',
  'Semaglutide Weekly Clinical Protocol': 'Obesity',
  'Targeted Lipolysis Micro-Injection': 'Obesity',
  'Body Composition Analysis & Dietetics': 'Obesity',
  'FUE Hair Transplant (1500 Grafts)': 'Hair',
  'PRP Hair Therapy with GFC Activator': 'Hair',
  'Scalp Mesotherapy Cocktail Session': 'Hair',
  'Low-Level Laser Hair Therapy (LLLT)': 'Hair',
  'Trichology Diagnostic Digital Trichoscan': 'Hair',
  'Senior Consultant Clinic Evaluation': 'Other',
  'Executive Preventive Blood Panel': 'Other',
  'IV Glutathione & Vitamin Glow Therapy': 'Other',
  'Minor Surgical Skin Lesion Excision': 'Other',
};

// Default initial per-session package realization values in INR
const DEFAULT_PACKAGE_VALUES: PackageValuesConfig = {
  'CoolSculpting Cryolipolysis (2 Cycles)': 24000,
  'Ultrasound Inch Loss Contouring': 7500,
  'Semaglutide Weekly Clinical Protocol': 12000,
  'HydraFacial Elite MD Infusion': 6500,
  'Fractional CO2 Laser Resurfacing': 10500,
  'PRP Hair Therapy with GFC Activator': 7500,
  'Scalp Mesotherapy Cocktail Session': 5000,
  'Carbon Laser Peel (Hollywood Peel)': 4500,
  'Advanced Chemical Peel (Glycolic/Salicylic)': 3500,
  'Skin Tightening Radiofrequency RF': 8500,
  'IV Glutathione & Vitamin Glow Therapy': 5500,
};

export function getCategoryMappings(): CategoryMappingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CAT_MAPPING_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load category mapping:', err);
  }
  return { ...DEFAULT_CATEGORY_MAPPINGS };
}

export function saveCategoryMappings(config: CategoryMappingConfig): void {
  try {
    localStorage.setItem(STORAGE_CAT_MAPPING_KEY, JSON.stringify(config));
    notifyConfigUpdated();
  } catch (err) {
    console.error('Failed to save category mapping:', err);
  }
}

export function updateSingleCategoryMapping(serviceName: string, category: CanonicalCategory): void {
  const current = getCategoryMappings();
  current[serviceName.trim()] = category;
  saveCategoryMappings(current);
}

export function getPackageValues(): PackageValuesConfig {
  try {
    const raw = localStorage.getItem(STORAGE_PKG_VALUES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load package values:', err);
  }
  return { ...DEFAULT_PACKAGE_VALUES };
}

export function savePackageValues(config: PackageValuesConfig): void {
  try {
    localStorage.setItem(STORAGE_PKG_VALUES_KEY, JSON.stringify(config));
    notifyConfigUpdated();
  } catch (err) {
    console.error('Failed to save package values:', err);
  }
}

export function updateSinglePackageValue(serviceName: string, perSessionValue: number): void {
  const current = getPackageValues();
  current[serviceName.trim()] = Math.max(0, perSessionValue);
  savePackageValues(current);
}

export function getRevenueMode(): RevenueMode {
  try {
    const raw = localStorage.getItem(STORAGE_REV_MODE_KEY);
    if (raw === 'service_value' || raw === 'collected') {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'collected'; // Default: Collected
}

export function saveRevenueMode(mode: RevenueMode): void {
  try {
    localStorage.setItem(STORAGE_REV_MODE_KEY, mode);
    notifyConfigUpdated();
  } catch (err) {
    console.error('Failed to save revenue mode:', err);
  }
}
