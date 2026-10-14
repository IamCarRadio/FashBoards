import React, { createContext, useContext, useState } from 'react';

export type DatePreset = 'Today' | 'Yesterday' | '7D' | '30D' | 'This Month' | 'Custom';

export interface BranchOption {
  id: string;
  name: string;
  city: string;
  code: string;
}

export const BRANCHES: BranchOption[] = [
  { id: 'all', name: 'All Branches (5 Network Hubs)', city: 'National', code: 'ALL' },
  { id: 'mumbai', name: 'Mumbai — Bandra West', city: 'Mumbai', code: 'BOM-01' },
  { id: 'bengaluru', name: 'Bengaluru — Indiranagar', city: 'Bengaluru', code: 'BLR-02' },
  { id: 'delhi', name: 'Delhi — Saket Medical Hub', city: 'Delhi', code: 'DEL-01' },
  { id: 'hyderabad', name: 'Hyderabad — Jubilee Hills', city: 'Hyderabad', code: 'HYD-03' },
  { id: 'chennai', name: 'Chennai — Anna Nagar', city: 'Chennai', code: 'MAA-02' },
];

export interface DoctorOption {
  id: string;
  name: string;
  specialty: string;
}

export const DOCTORS: DoctorOption[] = [
  { id: 'all', name: 'All Doctors (48 Specialists)', specialty: 'Multi-Specialty' },
  { id: 'dr_ananya', name: 'Dr. Ananya Sharma', specialty: 'Cardiology' },
  { id: 'dr_rajesh', name: 'Dr. Rajesh Patel', specialty: 'Orthopedics' },
  { id: 'dr_priya', name: 'Dr. Priya Nair', specialty: 'Dermatology' },
  { id: 'dr_siddharth', name: 'Dr. Siddharth Rao', specialty: 'Neurology & Spine' },
  { id: 'dr_sunita', name: 'Dr. Sunita Mehta', specialty: 'Pediatrics' },
];

export interface CategoryOption {
  id: string;
  name: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'all', name: 'All Revenue Streams' },
  { id: 'opd', name: 'OPD Consultations' },
  { id: 'procedures', name: 'Minor & Daycare Procedures' },
  { id: 'surgeries', name: 'Inpatient Surgeries' },
  { id: 'diagnostics', name: 'Diagnostics & Imaging' },
  { id: 'pharmacy', name: 'Pharmacy & Health Store' },
];

interface FilterState {
  datePreset: DatePreset;
  selectedBranch: string;
  selectedDoctor: string;
  selectedCategory: string;
  isFilterSheetOpen: boolean;
}

interface FilterContextType extends FilterState {
  setDatePreset: (preset: DatePreset) => void;
  setSelectedBranch: (branchId: string) => void;
  setSelectedDoctor: (doctorId: string) => void;
  setSelectedCategory: (categoryId: string) => void;
  setIsFilterSheetOpen: (open: boolean) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | null>(null);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datePreset, setDatePreset] = useState<DatePreset>('Today');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);

  const resetFilters = () => {
    setDatePreset('Today');
    setSelectedBranch('all');
    setSelectedDoctor('all');
    setSelectedCategory('all');
  };

  return (
    <FilterContext.Provider
      value={{
        datePreset,
        selectedBranch,
        selectedDoctor,
        selectedCategory,
        isFilterSheetOpen,
        setDatePreset,
        setSelectedBranch,
        setSelectedDoctor,
        setSelectedCategory,
        setIsFilterSheetOpen,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within FilterProvider');
  }
  return context;
};
