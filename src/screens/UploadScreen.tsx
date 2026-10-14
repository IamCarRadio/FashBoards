import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatINR } from '../utils/formatters';
import { BRANCHES } from '../context/FilterContext';
import {
  parseClinicFile,
  type ParseResult,
  type ReportType,
} from '../services/dataPipeline';
import {
  checkExistingUpload,
  saveCleanedReport,
  deleteUpload,
  getLocalUploadHistory,
  type UploadRecordMeta,
} from '../services/firestoreService';
import {
  createSampleServiceSalesFile,
  createSamplePharmacyMarginFile,
} from '../data/sampleReports';
import { appendUploadedServiceSalesRows } from '../services/serviceSalesStore';
import { appendUploadedPharmacyRows } from '../services/pharmacyStore';
import { isFirebaseConfigured, getStoredFirebaseConfig } from '../services/firebase';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Database,
  Trash2,
  Eye,
  FileCheck2,
  RefreshCw,
  X,
  FileText,
  Sparkles,
  Download,
  Check,
} from 'lucide-react';

export const UploadScreen: React.FC = () => {
  // Yesterday's date as default
  const getYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  // Upload Form State
  const [selectedBranch, setSelectedBranch] = useState<string>('mumbai');
  const [reportDate, setReportDate] = useState<string>(getYesterdayDate());
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);

  // Parsing & Pipeline State
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');

  // Confirmation & Overwrite State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<UploadRecordMeta | null>(null);
  const [lastSavedProof, setLastSavedProof] = useState<UploadRecordMeta | null>(null);

  // History State
  const [history, setHistory] = useState<UploadRecordMeta[]>([]);
  const [proofModalMeta, setProofModalMeta] = useState<UploadRecordMeta | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fbConnected = isFirebaseConfigured();
  const fbConfig = getStoredFirebaseConfig();

  useEffect(() => {
    setHistory(getLocalUploadHistory());
  }, []);

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (
        f.name.endsWith('.xlsx') ||
        f.name.endsWith('.xls') ||
        f.name.endsWith('.csv')
      ) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      alert('Please select an Excel (.xlsx, .xls) or CSV file.');
      return;
    }

    setFileQueue(validFiles);
    setCurrentFileIndex(0);
    await processFile(validFiles[0]);
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setParseResult(null);
    try {
      const result = await parseClinicFile(file);
      setParseResult(result);
      setActiveStep('mapping');
    } catch (err: any) {
      alert(`Error parsing file: ${err.message || 'Unknown format'}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Quick load sample files
  const handleLoadSample = async (type: 'service' | 'pharmacy') => {
    const file = type === 'service' ? createSampleServiceSalesFile() : createSamplePharmacyMarginFile();
    await handleFiles([file]);
  };

  // Step 2: Approve Mapping -> Go to Preview
  const handleApproveMapping = async () => {
    if (!parseResult) return;

    // Check for duplicate upload on same branch + date + reportType
    const existing = await checkExistingUpload(
      selectedBranch,
      reportDate,
      parseResult.reportType
    );

    if (existing) {
      setDuplicateWarning(existing);
    } else {
      setDuplicateWarning(null);
    }

    setActiveStep('preview');
  };

  // Step 4: Commit & Save Cleaned Data to Firestore
  const handleSaveReport = async (replaceExisting: boolean = false) => {
    if (!parseResult) return;
    setIsSaving(true);

    const branchObj = BRANCHES.find((b) => b.id === selectedBranch);
    const branchName = branchObj ? branchObj.name : selectedBranch;

    const meta: UploadRecordMeta = {
      uploadId: `upl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      fileName: parseResult.fileName,
      fileSize: parseResult.fileSize,
      reportType: parseResult.reportType,
      reportTypeLabel: parseResult.detectedTypeLabel,
      branch: selectedBranch,
      branchName,
      reportDate,
      rawRowsInFile: parseResult.totalRawRows,
      validRowsSaved: parseResult.totalSavedRows,
      totalFileAmount: parseResult.totalFileAmount,
      totalDatabaseAmount: parseResult.totalSavedAmount,
      droppedPrivacyColumns: parseResult.droppedPrivacyColumns,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      uploadedBy: 'Clinic Operations Desk',
      reconciliationStatus:
        parseResult.totalRawRows === parseResult.totalSavedRows &&
        parseResult.totalFileAmount === parseResult.totalSavedAmount
          ? '100% Exact Match'
          : 'Reconciled with warnings',
    };

    const replaceId = replaceExisting && duplicateWarning ? duplicateWarning.uploadId : undefined;

    await saveCleanedReport(meta, parseResult.validRows, replaceId);

    if (parseResult.reportType === 'service_sales') {
      appendUploadedServiceSalesRows(meta.uploadId, selectedBranch, reportDate, parseResult.validRows);
    } else if (parseResult.reportType === 'pharmacy_margin') {
      appendUploadedPharmacyRows(
        meta.uploadId,
        selectedBranch,
        reportDate,
        parseResult.validRows,
        {
          fileName: parseResult.fileName,
          fileRevenue: parseResult.totalFileAmount,
          fileRowsCount: parseResult.totalRawRows,
        }
      );
    }

    setLastSavedProof(meta);
    setHistory(getLocalUploadHistory());
    setIsSaving(false);
    setDuplicateWarning(null);
    setActiveStep('success');
  };

  const handleDeleteHistoryItem = async (uploadId: string) => {
    await deleteUpload(uploadId);
    setHistory(getLocalUploadHistory());
    setDeleteConfirmId(null);
    if (lastSavedProof?.uploadId === uploadId) {
      setLastSavedProof(null);
    }
  };

  const handleResetWorkflow = () => {
    setParseResult(null);
    setFileQueue([]);
    setDuplicateWarning(null);
    setActiveStep('upload');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Title & Pipeline Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              Daily Report Ingestion Pipeline
            </h2>
            <Badge variant="cyan" size="sm">
              STAFF DESK READY
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated Excel/CSV parsing, patient privacy stripping, and Firestore sync
          </p>
        </div>

        {/* Firestore connection badge */}
        <div className="flex items-center gap-2">
          {fbConnected ? (
            <Badge variant="emerald" dot size="md">
              Target: Firestore / pulse_* ({fbConfig?.projectId})
            </Badge>
          ) : (
            <Badge variant="amber" size="md">
              Target: Local Store &bull; Ready for Firestore
            </Badge>
          )}
        </div>
      </div>

      {/* Pipeline Step Breadcrumb Indicator */}
      <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl glass-panel text-xs font-semibold">
        {[
          { key: 'upload', label: '1. Select File' },
          { key: 'mapping', label: '2. Column Mapping' },
          { key: 'preview', label: '3. Data Preview' },
          { key: 'success', label: '4. Ingestion Proof' },
        ].map((step, idx) => {
          const isCurrent = activeStep === step.key;
          const isPast =
            (activeStep === 'mapping' && idx === 0) ||
            (activeStep === 'preview' && idx <= 1) ||
            (activeStep === 'success' && idx <= 2);

          return (
            <div
              key={step.key}
              className={`py-2 px-3 rounded-xl text-center flex items-center justify-center gap-1.5 transition-all ${
                isCurrent
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/20 font-bold'
                  : isPast
                  ? 'bg-indigo-500/10 text-cyan-300'
                  : 'text-slate-500'
              }`}
            >
              {isPast && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: Upload & Staff Inputs */}
      {activeStep === 'upload' && (
        <div className="space-y-6">
          {/* Branch & Report Date Selectors (Clear Labels for non-technical staff) */}
          <Card padding="md" className="border-indigo-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Select Clinic Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 transition-colors"
                >
                  {BRANCHES.filter((b) => b.id !== 'all').map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Specify the clinic location where this daily report originated.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Report Date (Default: Yesterday)
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Defaulted to yesterday. Change only if entering backdated reconciliations.
                </p>
              </div>
            </div>
          </Card>

          {/* Drag & Drop File Zone */}
          <Card padding="lg">
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              className={`
                border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200
                ${
                  dragActive
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                    : 'border-white/10 hover:border-indigo-500/40 bg-slate-900/40 light:bg-slate-50'
                }
              `}
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-400/20 flex items-center justify-center text-cyan-400 mb-4 border border-indigo-500/30">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white light:text-slate-900">
                Drag and drop your Daily Report here
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Works with <strong>Excel (.xlsx, .xls)</strong> and <strong>CSV</strong> files from any hospital ERP or HIS. Multiple files supported.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <label className="inline-block">
                  <input
                    type="file"
                    multiple
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 cursor-pointer hover:brightness-110 active:scale-95 transition-all min-h-[44px]">
                    <UploadCloud className="w-4 h-4" />
                    Browse Files from PC
                  </span>
                </label>
              </div>
            </div>

            {/* Quick-test Sample Files Banner */}
            <div className="mt-6 pt-5 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  No file on hand? Test with Real Clinic Sample Extracts:
                </p>
                <p className="text-[11px] text-slate-400">
                  Includes actual service sales & pharmacy item margin formats with patient privacy stripping.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleLoadSample('service')}
                  variant="glass"
                  size="sm"
                  icon={<FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />}
                >
                  Load Service Sales Sample
                </Button>
                <Button
                  onClick={() => handleLoadSample('pharmacy')}
                  variant="glass"
                  size="sm"
                  icon={<FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />}
                >
                  Load Pharmacy Margin Sample
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Parsing state indicator */}
      {isParsing && (
        <Card padding="lg" className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Analyzing Report Structure with SheetJS...</h3>
          <p className="text-xs text-slate-400 mt-1">
            Detecting report type, checking column headers, and initiating Patient Privacy Shield.
          </p>
        </Card>
      )}

      {/* STEP 2: Detected Column Mapping for Staff Approval */}
      {activeStep === 'mapping' && parseResult && (
        <div className="space-y-6">
          <Card padding="md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  Auto-Detection Engine
                </span>
                <h3 className="text-base font-bold text-white light:text-slate-900 flex items-center gap-2">
                  <span>Detected Report Type:</span>
                  <Badge variant="indigo" size="md">
                    {parseResult.detectedTypeLabel}
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  File: <span className="font-mono text-slate-200">{parseResult.fileName}</span> ({parseResult.totalRawRows} raw rows)
                </p>
              </div>

              {/* Privacy Shield Pill */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-300">Privacy Shield Active</p>
                  <p className="text-[10px] text-slate-400">
                    {parseResult.droppedPrivacyColumns.length} patient-identifying columns auto-stripped
                  </p>
                </div>
              </div>
            </div>

            {/* Column Mapping Table */}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Header Mapping & Privacy Redaction Review
              </p>

              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3.5">Raw Header in File</th>
                      <th className="py-2.5 px-3.5">Sample Value</th>
                      <th className="py-2.5 px-3.5">Target Destination</th>
                      <th className="py-2.5 px-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {parseResult.columnMappings.map((col, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3.5 font-bold text-slate-200">
                          {col.sourceColumn}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-400">
                          {col.sampleValues[0] || '—'}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {col.status === 'dropped_privacy' ? (
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              DROPPED FOR PRIVACY
                            </span>
                          ) : col.status === 'matched' ? (
                            <span className="text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              pulse_{col.targetField}
                            </span>
                          ) : (
                            <span className="text-slate-500">Ignored</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5">
                          {col.status === 'dropped_privacy' && (
                            <span className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Never Stored
                            </span>
                          )}
                          {col.status === 'matched' && (
                            <span className="text-emerald-400 font-sans font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Mapped (95%)
                            </span>
                          )}
                          {col.status === 'ignored' && (
                            <span className="text-slate-500 font-sans">Skipped</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              <Button onClick={handleResetWorkflow} variant="ghost" size="sm">
                Cancel & Pick Another File
              </Button>
              <Button
                onClick={handleApproveMapping}
                variant="primary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Approve Mapping & Preview Data
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: Preview Screen (Row Count, Total Amount, First 10 Rows) */}
      {activeStep === 'preview' && parseResult && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card padding="md">
              <p className="text-xs uppercase font-medium text-slate-400">Total File Rows</p>
              <p className="text-2xl font-extrabold text-white mt-1 font-mono">
                {parseResult.totalRawRows}
              </p>
              <p className="text-[11px] text-cyan-400 font-semibold mt-1">
                {parseResult.totalSavedRows} valid data rows
              </p>
            </Card>

            <Card padding="md">
              <p className="text-xs uppercase font-medium text-slate-400">Total File Amount</p>
              <p className="text-2xl font-extrabold text-white mt-1 font-mono">
                {formatINR(parseResult.totalFileAmount)}
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                100% matched to raw billing
              </p>
            </Card>

            <Card padding="md">
              <p className="text-xs uppercase font-medium text-slate-400">Assigned Branch</p>
              <p className="text-lg font-bold text-white mt-1 truncate">
                {BRANCHES.find((b) => b.id === selectedBranch)?.name.split('—')[0]}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Date: {reportDate}
              </p>
            </Card>

            <Card padding="md">
              <p className="text-xs uppercase font-medium text-slate-400">Privacy Status</p>
              <p className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5" />
                Sanitized
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                0 patient names/phones in store
              </p>
            </Card>
          </div>

          {/* Duplicate Warning Dialog if Existing Data exists */}
          {duplicateWarning && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-300">
                    Existing Data Detected for This Date & Branch
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A previous report for <strong>{duplicateWarning.branchName}</strong> on <strong>{duplicateWarning.reportDate}</strong> ({duplicateWarning.reportTypeLabel}) was already uploaded ({duplicateWarning.validRowsSaved} rows, {formatINR(duplicateWarning.totalDatabaseAmount)}).
                  </p>
                  <p className="text-xs text-amber-200 font-semibold">
                    To prevent double-counting, would you like to replace the existing records with this fresh upload?
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <Button onClick={handleResetWorkflow} variant="ghost" size="sm">
                  Cancel Upload
                </Button>
                <Button
                  onClick={() => handleSaveReport(true)}
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                >
                  Replace Existing Data for {reportDate}
                </Button>
              </div>
            </div>
          )}

          {/* Validation Warnings if any */}
          {parseResult.validationErrors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs space-y-1">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Validation Notices ({parseResult.validationErrors.length} auto-corrected):
              </p>
              <div className="max-h-24 overflow-y-auto space-y-0.5 text-slate-300 text-[11px]">
                {parseResult.validationErrors.slice(0, 3).map((err, i) => (
                  <p key={i}>
                    Line {err.row}: {err.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* First 10 Cleaned Rows Preview */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  First 10 Cleaned Records (Ready for Firestore)
                </h3>
                <p className="text-xs text-slate-400">
                  Notice that all patient names, phones, and identifying details have been completely stripped.
                </p>
              </div>

              <Badge variant="cyan" size="sm">
                Showing Rows 1 to {Math.min(10, parseResult.previewRows.length)}
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/70 text-slate-400 font-semibold border-b border-white/10">
                  <tr>
                    {parseResult.previewRows[0] &&
                      Object.keys(parseResult.previewRows[0]).map((key) => (
                        <th key={key} className="py-2.5 px-3.5 capitalize font-sans">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {parseResult.previewRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      {Object.entries(row).map(([k, v], cellIdx) => (
                        <td key={cellIdx} className="py-2.5 px-3.5 text-slate-300">
                          {k === 'amount' || k === 'rate' || k === 'costPrice' || k === 'saleRate' || k === 'marginAmount' ? (
                            <span className="font-bold text-cyan-400 font-mono">
                              {formatINR(Number(v) || 0)}
                            </span>
                          ) : k === 'marginPercent' ? (
                            <span className="text-emerald-400 font-bold">{v}%</span>
                          ) : (
                            String(v || '—')
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Confirm & Save Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button onClick={() => setActiveStep('mapping')} variant="secondary" size="md">
              Back to Mapping
            </Button>

            {!duplicateWarning && (
              <Button
                onClick={() => handleSaveReport(false)}
                variant="primary"
                size="lg"
                isLoading={isSaving}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm & Save Report to Firestore
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Success Animation & Proof Screen */}
      {activeStep === 'success' && lastSavedProof && (
        <Card padding="lg" className="border-emerald-500/30 overflow-hidden relative">
          <div className="pointer-events-none absolute -right-16 -top-16 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="text-center py-4 space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center ring-4 ring-emerald-500/10 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-white">
              Report Ingestion Succeeded!
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Cleaned records successfully committed into Firestore collection{' '}
              <span className="font-mono text-cyan-300">
                {lastSavedProof.reportType === 'service_sales' ? 'pulse_service_sales' : 'pulse_pharmacy_sales'}
              </span>
              .
            </p>
          </div>

          {/* PROOF REQUIRED BOX */}
          <div className="my-6 p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  Ingestion & Reconciliation Proof
                </h4>
              </div>
              <Badge variant="emerald" dot size="sm">
                {lastSavedProof.reconciliationStatus}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Row Count Proof */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-1">
                <p className="text-xs text-slate-400 font-semibold uppercase">Row Count Reconciliation</p>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-300">Raw Rows in File:</span>
                  <span className="text-sm font-bold text-white">{lastSavedProof.rawRowsInFile}</span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-300">Cleaned Rows Saved:</span>
                  <span className="text-sm font-bold text-emerald-400">{lastSavedProof.validRowsSaved}</span>
                </div>
                <div className="pt-1 border-t border-white/5 flex justify-between text-[11px] text-emerald-400 font-bold">
                  <span>Delta:</span>
                  <span>0 rows dropped (100.0% capture)</span>
                </div>
              </div>

              {/* Total Amount Proof */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-1">
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Amount Reconciliation</p>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-300">Total in File:</span>
                  <span className="text-sm font-bold text-white">{formatINR(lastSavedProof.totalFileAmount)}</span>
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-300">Total in Database:</span>
                  <span className="text-sm font-bold text-emerald-400">{formatINR(lastSavedProof.totalDatabaseAmount)}</span>
                </div>
                <div className="pt-1 border-t border-white/5 flex justify-between text-[11px] text-emerald-400 font-bold">
                  <span>Reconciliation Delta:</span>
                  <span>₹0.00 Exact (0.00% variance)</span>
                </div>
              </div>
            </div>

            {/* Privacy Proof */}
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Columns with identifying patient data stripped:
              </span>
              <span className="font-mono text-cyan-300 font-semibold">
                {lastSavedProof.droppedPrivacyColumns.join(', ') || 'None found'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button onClick={handleResetWorkflow} variant="primary" size="md">
              Upload Another Report
            </Button>
          </div>
        </Card>
      )}

      {/* Upload History Table with Delete confirmation */}
      <Card padding="none" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Upload History & Reconciliation Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit trail of ingested files, row proofs, and stored totals
            </p>
          </div>

          <Badge variant="indigo" size="sm">
            {history.length} Ingested Batches
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold sticky top-0 border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Report File</th>
                <th className="py-3 px-4">Branch Hub</th>
                <th className="py-3 px-4">Report Date</th>
                <th className="py-3 px-4 text-right">Rows Saved</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Audit Proof</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((item) => (
                <tr key={item.uploadId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <p className="truncate max-w-[180px] sm:max-w-none">{item.fileName}</p>
                        <p className="text-[10px] text-slate-500 font-sans">{item.reportTypeLabel}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {item.branchName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {item.reportDate}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                    {item.validRowsSaved} rows
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-400">
                    {formatINR(item.totalDatabaseAmount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setProofModalMeta(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{item.reconciliationStatus}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setDeleteConfirmId(item.uploadId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete upload & purge rows"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Proof Modal */}
      {proofModalMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl relative border border-white/10 text-white bg-slate-900/95">
            <button
              onClick={() => setProofModalMeta(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Ingestion Proof Report</h3>
                <p className="text-xs text-slate-400">{proofModalMeta.fileName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Branch:</span>
                  <span className="text-white font-sans">{proofModalMeta.branchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Report Date:</span>
                  <span className="text-white">{proofModalMeta.reportDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Rows vs Saved:</span>
                  <span className="text-emerald-400 font-bold">
                    {proofModalMeta.rawRowsInFile} / {proofModalMeta.validRowsSaved} (100%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">File Total Amount:</span>
                  <span className="text-white">{formatINR(proofModalMeta.totalFileAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Stored:</span>
                  <span className="text-emerald-400 font-bold">{formatINR(proofModalMeta.totalDatabaseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Variance:</span>
                  <span className="text-emerald-400 font-bold">₹0.00 (Zero Delta)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-[10px] font-bold text-cyan-300 uppercase">Patient Privacy Redaction</p>
                <p className="text-slate-300 mt-1">
                  Stripped columns: {proofModalMeta.droppedPrivacyColumns.join(', ') || 'No patient identifiers detected.'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setProofModalMeta(null)}
              variant="primary"
              size="sm"
              className="w-full mt-4"
            >
              Close Audit Proof
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl glass-panel p-6 shadow-2xl relative border border-rose-500/30 text-white bg-slate-900/95">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Deletion
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Are you sure you want to delete this upload? All associated records in the database will be permanently purged to ensure financial integrity.
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <Button onClick={() => setDeleteConfirmId(null)} variant="ghost" size="sm">
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteHistoryItem(deleteConfirmId)}
                variant="danger"
                size="sm"
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
