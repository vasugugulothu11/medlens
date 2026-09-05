import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../api';
import type { MedicalReport } from '../types';

interface ReportUploaderProps {
  patientId: number;
  onSuccess: (report: MedicalReport) => void;
}

const SAMPLE_REPORTS = [
  {
    title: "Comprehensive Metabolic & Lipid Panel",
    date: "2026-08-15",
    text: `CLINICAL PATHOLOGY LABORATORY REPORT
Patient ID: PT-90214 | Date Collected: 2026-08-15
Ordered By: Dr. Jonathan Miller, MD

TEST NAME                       VALUE     UNITS      REFERENCE INTERVAL    STATUS
----------------------------------------------------------------------------------
Glucose, Fasting               156       mg/dL      70 - 99               HIGH
Hemoglobin A1c                 8.2       %          < 5.7                 HIGH
Blood Urea Nitrogen (BUN)      24        mg/dL      7 - 20                HIGH
Creatinine, Serum              1.45      mg/dL      0.60 - 1.20           HIGH
eGFR Non-Afr. American         52        mL/min/1.73 > 60                 LOW
Sodium                         141       mmol/L     135 - 145             NORMAL
Potassium                      4.6       mmol/L     3.5 - 5.0             NORMAL
Total Cholesterol              242       mg/dL      < 200                 HIGH
Triglycerides                  198       mg/dL      < 150                 HIGH
HDL Cholesterol                41        mg/dL      > 50                  LOW
LDL Cholesterol (calc)         161       mg/dL      < 100                 HIGH
ALT (SGPT)                     38        U/L        0 - 45                NORMAL
AST (SGOT)                     32        U/L        0 - 40                NORMAL

Clinician Note: Elevated glycemic and atherogenic lipid markers. Reduced filtration eGFR with elevated serum creatinine. Correlate with microvascular and endocrine follow-up.`
  },
  {
    title: "Complete Blood Count & Liver Function",
    date: "2026-07-22",
    text: `MEMORIAL HOSPITAL CLINICAL LAB
Specimen: Venous Whole Blood | Date: 2026-07-22

COMPLETE BLOOD COUNT:
White Blood Cell (WBC)         7.4       x10E3/uL   4.5 - 11.0
Red Blood Cell (RBC)           3.82      x10E6/uL   4.20 - 5.40           LOW
Hemoglobin                     11.2      g/dL       12.0 - 16.0           LOW
Hematocrit                     33.8      %          37.0 - 47.0           LOW
Platelets                      245       x10E3/uL   150 - 450

LIVER ENZYME PROFILE:
Alanine Aminotransferase (ALT) 68        U/L        7 - 56                HIGH
Aspartate Aminotransferase (AST) 59      U/L        10 - 40               HIGH
Alkaline Phosphatase (ALP)     112       U/L        44 - 147
Total Bilirubin                1.1       mg/dL      0.2 - 1.2

Document Note: Borderline normocytic anemia noted alongside mild transaminase elevation.`
  },
  {
    title: "Thyroid & Renal Assessment",
    date: "2026-09-01",
    text: `DIAGNOSTIC HEALTH PARTNERS
Test Date: 2026-09-01 | Specimen: Serum

TSH (Thyroid Stimulating)      6.85      uIU/mL     0.45 - 4.50           HIGH
Free T4                        0.82      ng/dL      0.82 - 1.77           NORMAL
Serum Creatinine               0.95      mg/dL      0.50 - 1.10           NORMAL
Blood Urea Nitrogen            14        mg/dL      8 - 22                NORMAL
Estimated GFR                  88        mL/min     > 60                  NORMAL
Serum Calcium                  9.4       mg/dL      8.6 - 10.2            NORMAL`
  }
];

export const ReportUploader: React.FC<ReportUploaderProps> = ({ patientId, onSuccess }) => {
  const [reportText, setReportText] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSample = (index: number) => {
    const sample = SAMPLE_REPORTS[index];
    setReportText(sample.text);
    setReportDate(sample.date);
    setError(null);
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) {
      setError('Please enter or paste medical report text.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const processedReport = await api.processReport(patientId, reportText, reportDate);
      onSuccess(processedReport);
    } catch (err: any) {
      console.error('Failed to process report:', err);
      setError(
        err.response?.data?.detail || err.message || 'An error occurred while processing the clinical document.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs max-w-4xl mx-auto">
      {/* Header & Description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Clinical Document & Lab Report Ingestion
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Paste unstructured lab documents, pathology texts, or EHR notes. MedLens extracts structured test values and deterministically validates Low/Normal/High bounds using ONLY the printed reference ranges.
        </p>
      </div>

      {/* Sample Loader Chips */}
      <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Load verified clinical sample report:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_REPORTS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSample(idx)}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-teal-500 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-medium shadow-2xs transition"
            >
              {s.title.split('&')[0]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleProcess}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Report Date
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Provenance Note
            </label>
            <div className="text-xs text-slate-500 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
              Deterministic range engine calculates test status strictly from printed reference intervals.
            </div>
          </div>
        </div>

        {/* Text Area Dropzone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Raw Report Text / Pathology Document
          </label>
          <textarea
            rows={10}
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Paste raw laboratory report output (Glucose 156 mg/dL 70-99 HIGH, HbA1c 8.2% < 5.7)..."
            className="w-full glass-input rounded-2xl p-4 text-xs font-mono text-cyan-200 outline-none leading-relaxed border border-slate-700/80 focus:border-cyan-500 shadow-inner"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Reference-range aware: Non-invented bounds strictly enforced.
          </span>

          <button
            type="submit"
            disabled={isProcessing}
            className="glass-button font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                Extracting & Auditing Math...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                Process & Extract Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
