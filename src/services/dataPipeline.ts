/**
 * Data Pipeline & Parser for Clinic Group MIS & ERP Reports
 * Supports Excel (.xlsx, .xls) and CSV parsing using SheetJS.
 */
import * as XLSX from 'xlsx';

export type ReportType = 'service_sales' | 'pharmacy_margin';

export interface ColumnMappingApproval {
  sourceColumn: string;
  targetField: string;
  status: 'matched' | 'dropped_privacy' | 'ignored';
  confidence: number;
  sampleValues: string[];
}

export interface CleanedServiceRecord {
  serviceName: string;
  category: string;
  doctor: string;
  quantity: number;
  amount: number;
  rate?: number;
  rawRowIndex: number;
}

export interface CleanedPharmacyRecord {
  itemName: string;
  itemCode?: string;
  category: string;
  doctor?: string;
  quantity: number;
  amount: number;
  costPrice?: number;
  saleRate?: number;
  marginAmount?: number;
  marginPercent?: number;
  batchNo?: string;
  expiryDate?: string;
  rawRowIndex: number;
}

export interface ParseResult {
  fileName: string;
  fileSize: number;
  reportType: ReportType;
  detectedTypeLabel: string;
  rawHeaders: string[];
  totalRawRows: number;
  columnMappings: ColumnMappingApproval[];
  droppedPrivacyColumns: string[];
  validRows: (CleanedServiceRecord | CleanedPharmacyRecord)[];
  previewRows: Record<string, any>[];
  totalFileAmount: number;
  totalSavedAmount: number;
  totalSavedRows: number;
  validationErrors: { row: number; column: string; message: string }[];
  warnings: string[];
}

// Columns that MUST be dropped for patient privacy
const PATIENT_PRIVACY_PATTERNS = [
  /patient/i,
  /pt[_\s]?name/i,
  /uhid/i,
  /mrn/i,
  /mobile/i,
  /phone/i,
  /contact/i,
  /address/i,
  /age/i,
  /gender/i,
  /sex/i,
  /email/i,
  /aadhar/i,
  /uid/i,
  /ipd[_\s]?no/i,
  /opd[_\s]?no/i,
];

// Helper to clean currency string e.g. "₹ 1,250.50", "Rs. 450", "(200)"
export function parseNumeric(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().replace(/[₹$,Rs\.\s]/gi, '').replace(/,/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Detects whether an Excel file represents Service Sales or Pharmacy Margin
 */
export function detectReportType(headers: string[]): {
  type: ReportType;
  confidence: number;
  label: string;
} {
  const normalized = headers.map((h) => h.toLowerCase().trim());

  let pharmacyScore = 0;
  let serviceScore = 0;

  normalized.forEach((h) => {
    if (/batch/i.test(h)) pharmacyScore += 3;
    if (/expiry|exp[_\s]?date/i.test(h)) pharmacyScore += 3;
    if (/item|medicine|drug|molecule|sku|mrp/i.test(h)) pharmacyScore += 2;
    if (/cost[_\s]?price|purchase[_\s]?rate|purchase[_\s]?price/i.test(h)) pharmacyScore += 3;
    if (/margin/i.test(h)) pharmacyScore += 3;

    if (/service|procedure|investigation|test[_\s]?name/i.test(h)) serviceScore += 3;
    if (/doctor|consultant|clinician/i.test(h)) serviceScore += 2;
    if (/department|specialty/i.test(h)) serviceScore += 2;
    if (/opd|ipd|admission/i.test(h)) serviceScore += 2;
  });

  if (pharmacyScore > serviceScore) {
    return {
      type: 'pharmacy_margin',
      confidence: Math.min(99, 65 + pharmacyScore * 4),
      label: 'Pharmacy Item-wise Margin Report',
    };
  }

  return {
    type: 'service_sales',
    confidence: Math.min(99, 65 + serviceScore * 4),
    label: 'Service Sales & Clinical Billing Report',
  };
}

/**
 * Parses file buffer and cleanses data according to strict privacy and schema rules
 */
export async function parseClinicFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with headers
  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawJson || rawJson.length < 2) {
    throw new Error('The file appears empty or is missing header rows.');
  }

  // Header row
  const headerRowIndex = 0;
  const rawHeaders: string[] = (rawJson[headerRowIndex] as any[])
    .map((h) => String(h || '').trim())
    .filter(Boolean);

  const dataRows: any[] = rawJson.slice(headerRowIndex + 1);

  // Auto detect report type
  const { type: reportType, label: detectedTypeLabel } = detectReportType(rawHeaders);

  // Identify column mappings & privacy drops
  const columnMappings: ColumnMappingApproval[] = [];
  const droppedPrivacyColumns: string[] = [];

  rawHeaders.forEach((header, colIndex) => {
    const isPrivacy = PATIENT_PRIVACY_PATTERNS.some((pat) => pat.test(header));

    const sampleVals = dataRows
      .slice(0, 3)
      .map((r) => String(r[colIndex] || ''))
      .filter(Boolean);

    if (isPrivacy) {
      droppedPrivacyColumns.push(header);
      columnMappings.push({
        sourceColumn: header,
        targetField: '[STRIPPED FOR PRIVACY]',
        status: 'dropped_privacy',
        confidence: 99,
        sampleValues: sampleVals.map(() => '••••••••'),
      });
      return;
    }

    // Map according to report type
    let targetField = '';
    const norm = header.toLowerCase().trim();

    if (reportType === 'service_sales') {
      if (/service|procedure|description|investigation|item/i.test(norm)) targetField = 'serviceName';
      else if (/dept|department|specialty|category/i.test(norm)) targetField = 'category';
      else if (/doctor|consultant|clinician/i.test(norm)) targetField = 'doctor';
      else if (/amount|net[_\s]?amount|total|billed/i.test(norm)) targetField = 'amount';
      else if (/qty|quantity|count/i.test(norm)) targetField = 'quantity';
      else if (/rate|unit[_\s]?price/i.test(norm)) targetField = 'rate';
    } else {
      if (/item[_\s]?name|medicine|drug|product|description/i.test(norm)) targetField = 'itemName';
      else if (/item[_\s]?code|sku|product[_\s]?code/i.test(norm)) targetField = 'itemCode';
      else if (/category|drug[_\s]?type|molecule/i.test(norm)) targetField = 'category';
      else if (/doctor|prescribed/i.test(norm)) targetField = 'doctor';
      else if (/sale[_\s]?amount|net[_\s]?amount|amount|total/i.test(norm)) targetField = 'amount';
      else if (/qty|quantity/i.test(norm)) targetField = 'quantity';
      else if (/cost[_\s]?price|purchase[_\s]?rate|purchase[_\s]?price/i.test(norm)) targetField = 'costPrice';
      else if (/sale[_\s]?rate|mrp|unit[_\s]?price/i.test(norm)) targetField = 'saleRate';
      else if (/margin[_\s]?amt|gross[_\s]?margin|margin/i.test(norm)) targetField = 'marginAmount';
      else if (/margin[_\s]?%|margin[_\s]?pct/i.test(norm)) targetField = 'marginPercent';
      else if (/batch/i.test(norm)) targetField = 'batchNo';
      else if (/exp[_\s]?date|expiry/i.test(norm)) targetField = 'expiryDate';
    }

    columnMappings.push({
      sourceColumn: header,
      targetField: targetField || '[Ignored/Unmapped]',
      status: targetField ? 'matched' : 'ignored',
      confidence: targetField ? 95 : 20,
      sampleValues: sampleVals,
    });
  });

  // Extract Cleaned Data
  const validationErrors: { row: number; column: string; message: string }[] = [];
  const warnings: string[] = [];

  const validRows: (CleanedServiceRecord | CleanedPharmacyRecord)[] = [];
  let totalFileAmount = 0;
  let totalSavedAmount = 0;

  // Header column index map
  const getColIdx = (target: string) => {
    const mapping = columnMappings.find((m) => m.targetField === target && m.status === 'matched');
    if (!mapping) return -1;
    return rawHeaders.indexOf(mapping.sourceColumn);
  };

  const amountColIdx = getColIdx('amount');
  const qtyColIdx = getColIdx('quantity');

  if (amountColIdx === -1) {
    throw new Error('Required column "Amount" / "Net Amount" could not be detected. Please check file headers.');
  }

  dataRows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 2; // 1-indexed, accounting for header

    // Skip entirely empty rows
    const isAllEmpty = row.every((val: any) => val === '' || val === null || val === undefined);
    if (isAllEmpty) return;

    // Check amount
    const rawAmt = row[amountColIdx];
    const amount = parseNumeric(rawAmt);

    if (rawAmt === '' || rawAmt === undefined) {
      validationErrors.push({
        row: rowNum,
        column: rawHeaders[amountColIdx] || 'Amount',
        message: 'Blank amount value. Converted to ₹0.',
      });
    } else if (isNaN(amount)) {
      validationErrors.push({
        row: rowNum,
        column: rawHeaders[amountColIdx] || 'Amount',
        message: `Non-numeric amount '${rawAmt}'. Converted to ₹0.`,
      });
    }

    totalFileAmount += amount;

    if (reportType === 'service_sales') {
      const sNameIdx = getColIdx('serviceName');
      const catIdx = getColIdx('category');
      const docIdx = getColIdx('doctor');
      const rateIdx = getColIdx('rate');

      const serviceName = sNameIdx !== -1 && row[sNameIdx] ? String(row[sNameIdx]).trim() : 'General Clinical Service';
      const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : 'Consultation';
      const doctor = docIdx !== -1 && row[docIdx] ? String(row[docIdx]).trim() : 'Duty Consultant';
      const quantity = qtyColIdx !== -1 ? Math.max(1, parseNumeric(row[qtyColIdx])) : 1;
      const rate = rateIdx !== -1 ? parseNumeric(row[rateIdx]) : amount;

      const record: CleanedServiceRecord = {
        serviceName,
        category,
        doctor,
        quantity,
        amount,
        rate,
        rawRowIndex: rowNum,
      };

      validRows.push(record);
      totalSavedAmount += amount;
    } else {
      const iNameIdx = getColIdx('itemName');
      const iCodeIdx = getColIdx('itemCode');
      const catIdx = getColIdx('category');
      const docIdx = getColIdx('doctor');
      const costIdx = getColIdx('costPrice');
      const saleRateIdx = getColIdx('saleRate');
      const marginAmtIdx = getColIdx('marginAmount');
      const marginPctIdx = getColIdx('marginPercent');
      const batchIdx = getColIdx('batchNo');
      const expIdx = getColIdx('expiryDate');

      const itemName = iNameIdx !== -1 && row[iNameIdx] ? String(row[iNameIdx]).trim() : 'Pharmacy Item';
      const itemCode = iCodeIdx !== -1 ? String(row[iCodeIdx] || '').trim() : undefined;
      const category = catIdx !== -1 && row[catIdx] ? String(row[catIdx]).trim() : 'General Medicine';
      const doctor = docIdx !== -1 ? String(row[docIdx] || '').trim() : undefined;
      const quantity = qtyColIdx !== -1 ? Math.max(1, parseNumeric(row[qtyColIdx])) : 1;
      const costPrice = costIdx !== -1 ? parseNumeric(row[costIdx]) : undefined;
      const saleRate = saleRateIdx !== -1 ? parseNumeric(row[saleRateIdx]) : undefined;
      const marginAmount = marginAmtIdx !== -1 ? parseNumeric(row[marginAmtIdx]) : undefined;
      const marginPercent = marginPctIdx !== -1 ? parseNumeric(row[marginPctIdx]) : undefined;
      const batchNo = batchIdx !== -1 ? String(row[batchIdx] || '').trim() : undefined;
      const expiryDate = expIdx !== -1 ? String(row[expIdx] || '').trim() : undefined;

      const record: CleanedPharmacyRecord = {
        itemName,
        itemCode,
        category,
        doctor,
        quantity,
        amount,
        costPrice,
        saleRate,
        marginAmount,
        marginPercent,
        batchNo,
        expiryDate,
        rawRowIndex: rowNum,
      };

      validRows.push(record);
      totalSavedAmount += amount;
    }
  });

  // Prepare first 10 preview rows without any privacy data
  const previewRows = validRows.slice(0, 10).map((r) => {
    const clean: Record<string, any> = { ...r };
    delete clean.rawRowIndex;
    return clean;
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    reportType,
    detectedTypeLabel,
    rawHeaders,
    totalRawRows: dataRows.length,
    columnMappings,
    droppedPrivacyColumns,
    validRows,
    previewRows,
    totalFileAmount: Math.round(totalFileAmount * 100) / 100,
    totalSavedAmount: Math.round(totalSavedAmount * 100) / 100,
    totalSavedRows: validRows.length,
    validationErrors,
    warnings,
  };
}
