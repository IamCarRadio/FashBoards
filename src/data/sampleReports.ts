/**
 * Realistic Sample Reports for Testing & Verification
 * Generates valid binary XLSX Files in browser for both Service Sales & Pharmacy Margin.
 */
import * as XLSX from 'xlsx';

export function createSampleServiceSalesFile(): File {
  const data = [
    [
      'Bill No',
      'Bill Date',
      'Patient Name',
      'UHID',
      'Mobile',
      'Doctor Name',
      'Department',
      'Service Name',
      'Qty',
      'Rate',
      'Net Amount',
    ],
    ['BL-2026-001', '2026-10-12', 'Rajesh Sharma', 'UHID-8821', '9820012345', 'Dr. Ananya Sharma', 'Cardiology', 'Coronary Angiography (CAG)', 1, 28500, 28500],
    ['BL-2026-002', '2026-10-12', 'Pooja Verma', 'UHID-8822', '9820054321', 'Dr. Rajesh Patel', 'Orthopedics', 'Total Knee Replacement (Robotic)', 1, 265000, 265000],
    ['BL-2026-003', '2026-10-12', 'Amit Kulkarni', 'UHID-8823', '9811122334', 'Dr. Ananya Sharma', 'Cardiology', '2D Echocardiography with Doppler', 1, 3800, 3800],
    ['BL-2026-004', '2026-10-12', 'Meena Sundaram', 'UHID-8824', '9840011223', 'Dr. Priya Nair', 'Dermatology', 'Fractional CO2 Laser Therapy', 1, 8500, 8500],
    ['BL-2026-005', '2026-10-12', 'Vikramaditya Roy', 'UHID-8825', '9870099887', 'Dr. Siddharth Rao', 'Neurology', 'Brain MRI with Contrast 3T', 1, 14500, 14500],
    ['BL-2026-006', '2026-10-12', 'Kavita Chawla', 'UHID-8826', '9820033445', 'Dr. Sunita Mehta', 'Pediatrics', 'Comprehensive Pediatric Health Assessment', 1, 2400, 2400],
    ['BL-2026-007', '2026-10-12', 'Harish Iyer', 'UHID-8827', '9830055667', 'Dr. Rajesh Patel', 'Orthopedics', 'Intra-articular Hyaluronic Injection', 2, 6000, 12000],
    ['BL-2026-008', '2026-10-12', 'Sneha Kapoor', 'UHID-8828', '9820077889', 'Dr. Ananya Sharma', 'Cardiology', 'TMT Stress Test & ECG Analysis', 1, 2800, 2800],
    ['BL-2026-009', '2026-10-12', 'Farooq Abdullah', 'UHID-8829', '9890044556', 'Dr. Priya Nair', 'Dermatology', 'OPD Specialist Consultation', 1, 1500, 1500],
    ['BL-2026-010', '2026-10-12', 'Arjun Saxena', 'UHID-8830', '9810088990', 'Dr. Siddharth Rao', 'Neurology', 'Spine Lumbar Decompression Daycare', 1, 88000, 88000],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Service_Sales');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([wbout], 'Bandra_Service_Sales_Oct12.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function createSamplePharmacyMarginFile(): File {
  const data = [
    [
      'Bill No',
      'Bill Date',
      'Patient Name',
      'UHID',
      'Doctor Name',
      'Item Code',
      'Item Name',
      'Category',
      'Batch No',
      'Expiry Date',
      'Qty',
      'Cost Price',
      'MRP',
      'Sale Amount',
      'Margin Amount',
      'Margin %',
    ],
    ['PH-2026-101', '2026-10-12', 'Sunil Gupta', 'UHID-9011', 'Dr. Ananya Sharma', 'MED-ATOR-40', 'Atorvastatin 40mg (Lipitor tab)', 'Cardiac', 'BT-7721', '2027-08-15', 30, 24.5, 42.5, 1275, 540, 42.3],
    ['PH-2026-102', '2026-10-12', 'Deepa Joshi', 'UHID-9012', 'Dr. Sunita Mehta', 'MED-AUG-625', 'Augmentin 625mg Duo (Amoxyclav)', 'Antibiotic', 'BT-6640', '2027-03-10', 14, 11.2, 18.2, 254.8, 98, 38.5],
    ['PH-2026-103', '2026-10-12', 'Ramesh Sen', 'UHID-9013', 'Dr. Rajesh Patel', 'MED-ENOP-40', 'Enoxaparin 40mg PFS (Clexane inj)', 'Cardiac', 'BT-9901', '2027-12-01', 4, 260.0, 420.0, 1680, 640, 38.1],
    ['PH-2026-104', '2026-10-12', 'Anil Deshmukh', 'UHID-9014', 'Dr. Priya Nair', 'MED-GLIMP-2', 'Glimepiride + Metformin SR (Amaryl M)', 'Cardiac', 'BT-4412', '2028-02-14', 60, 7.8, 12.8, 768, 300, 39.1],
    ['PH-2026-105', '2026-10-12', 'Zarina Khan', 'UHID-9015', 'Dr. Sharma', 'MED-HERC-440', 'Trastuzumab 440mg (Herclon vial)', 'Oncology', 'BT-1029', '2026-11-20', 1, 38500.0, 54000.0, 54000, 15500, 28.7],
    ['PH-2026-106', '2026-10-12', 'Bhavna Parekh', 'UHID-9016', 'Dr. Patel', 'MED-COLL-C', 'Collagen Membrane Type-I Surgical', 'Consumables', 'BT-8842', '2026-11-05', 2, 2200.0, 3800.0, 7600, 3200, 42.1],
    ['PH-2026-107', '2026-10-12', 'Nitin Gadgil', 'UHID-9017', 'Dr. Rao', 'MED-PANT-40', 'Pantoprazole 40mg (Pan 40 tab)', 'Gastro', 'BT-5531', '2027-09-12', 30, 4.2, 8.5, 255, 129, 50.6],
    ['PH-2026-108', '2026-10-12', 'Lata Merchant', 'UHID-9018', 'Dr. Nair', 'MED-TELM-40', 'Telmisartan 40mg (Telma tab)', 'Cardiac', 'BT-3329', '2027-11-30', 30, 6.5, 11.0, 330, 135, 40.9],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pharmacy_Margin');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new File([wbout], 'Indiranagar_Pharmacy_Margin_Oct12.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
