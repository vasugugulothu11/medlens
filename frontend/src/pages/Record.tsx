import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ClipboardList,
  User,
  FileText,
  Sparkles,
  AlertTriangle,
  Cpu,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { LabTable } from '../components/LabTable';
import { SummaryCard } from '../components/SummaryCard';
import { api } from '../api';
import { usePatient } from '../context/PatientContext';
import type { Patient, MedicalReport, Summary, Inconsistency } from '../types';

export const RecordPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentPatientId } = usePatient();
  const patientId = parseInt(id || '0', 10);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  const [loading, setLoading] = useState(true);
  const [detectingInconsistencies, setDetectingInconsistencies] = useState(false);

  const loadAll = async () => {
    if (!patientId) return;
    setCurrentPatientId(patientId);
    setLoading(true);
    try {
      const [p, rList, sList, iList] = await Promise.all([
        api.getPatient(patientId),
        api.getReportsByPatient(patientId),
        api.getSummariesByPatient(patientId),
        api.getInconsistenciesByPatient(patientId),
      ]);
      setPatient(p);
      setReports(rList);
      if (rList.length > 0) {
        setSelectedReportId(rList[0].id);
      }
      setSummaries(sList);
      setInconsistencies(iList);
    } catch (err) {
      console.error('Failed to load patient record:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [patientId]);

  const handleRunConflictCheck = async () => {
    setDetectingInconsistencies(true);
    try {
      const conflicts = await api.detectInconsistencies(patientId);
      setInconsistencies(conflicts);
    } catch (err) {
      console.error('Failed to run conflict check:', err);
    } finally {
      setDetectingInconsistencies(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm">
        Loading complete clinical intelligence record...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Patient Not Found</h2>
        <Link to="/patients" className="text-xs text-teal-600 font-semibold hover:underline">
          Return to Patient Directory
        </Link>
      </div>
    );
  }

  const activeReport = reports.find((r) => r.id === selectedReportId) || (reports.length > 0 ? reports[0] : null);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Top Clinical Glass Header */}
      <div className="glass-card rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 text-xs font-mono font-bold border border-cyan-800/40">
              PATIENT #{patient.id}
            </span>
            <h1 className="text-2xl font-black text-white">{patient.name || 'Anonymous Patient'}</h1>
          </div>
          <p className="text-xs text-slate-300">
            {patient.age} years old • Biological Sex: <span className="capitalize text-cyan-300 font-bold">{patient.sex}</span> • Record Created: {new Date(patient.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/patients/${patient.id}/report`}
            className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-300" />
            Upload Lab Report
          </Link>

          <Link
            to={`/patients/${patient.id}/anatomy`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 glow-rose"
          >
            <Cpu className="w-4 h-4" />
            Interactive 3D Anatomy
          </Link>
        </div>
      </div>

      {/* Provenance Guide Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="glass-card p-3 rounded-2xl flex items-center gap-2.5 text-slate-300 border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
          <span><strong className="text-white">User-Provided:</strong> Intake baseline & symptoms</span>
        </div>
        <div className="glass-card p-3 rounded-2xl flex items-center gap-2.5 text-cyan-200 border-cyan-900/60 bg-cyan-950/20">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0 glow-cyan"></span>
          <span><strong className="text-white">AI-Extracted:</strong> Tabulated labs & raw snippets</span>
        </div>
        <div className="glass-card p-3 rounded-2xl flex items-center gap-2.5 text-emerald-200 border-emerald-900/60 bg-emerald-950/20">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 glow-emerald"></span>
          <span><strong className="text-white">AI-Generated:</strong> Summary & clinician questions</span>
        </div>
      </div>

      {/* SECTION 1: USER-PROVIDED INTAKE PROFILE */}
      <section className="glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold tracking-widest uppercase border border-slate-700">
              User-Provided Baseline
            </span>
            <h2 className="text-lg font-bold text-white">Patient Intake Baseline</h2>
          </div>
          <span className="text-xs text-slate-400">Direct Patient Record</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <span className="font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Reported Symptoms
            </span>
            <p className="text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed font-sans">
              {patient.symptoms || <span className="text-slate-500 italic">No symptoms reported.</span>}
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Diagnosed Conditions
            </span>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 min-h-[44px] items-center">
              {patient.conditions.length > 0 ? (
                patient.conditions.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-cyan-300 font-semibold">
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic px-1">None reported</span>
              )}
            </div>
          </div>

          <div>
            <span className="font-bold text-rose-300 uppercase tracking-widest block mb-1.5">
              Documented Allergies
            </span>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-rose-950/30 rounded-xl border border-rose-900/50 min-h-[44px] items-center">
              {patient.allergies.length > 0 ? (
                patient.allergies.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-800/80 rounded-lg font-bold">
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic px-1">No known allergies</span>
              )}
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Current Medications
            </span>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 min-h-[44px] items-center">
              {patient.medications.length > 0 ? (
                patient.medications.map((m, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-semibold">
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic px-1">None listed</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CLINICAL INCONSISTENCIES & SAFETY CONFLICTS */}
      <section className="glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-950/80 text-amber-300 text-[10px] font-bold tracking-widest uppercase border border-amber-800/40">
                AI Cross-Check
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Clinical Safety Conflicts & Discrepancies
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cross-evaluates patient allergy/medication notes against laboratory findings to highlight potential contraindications for human review.
            </p>
          </div>

          <button
            onClick={handleRunConflictCheck}
            disabled={detectingInconsistencies}
            className="glass-button text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${detectingInconsistencies ? 'animate-spin' : ''}`} />
            {detectingInconsistencies ? 'Auditing Conflicts...' : 'Run Consistency Check'}
          </button>
        </div>

        {inconsistencies.length === 0 ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              No active drug-allergy or diagnostic discrepancies identified for this record. Click "Run Consistency Check" to re-verify.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {inconsistencies.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-rose-800/80 bg-rose-950/40 flex flex-col gap-2.5 text-xs shadow-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{c.description}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-700 font-black uppercase text-[10px] rounded-md glow-rose">
                    {c.severity} Severity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 bg-slate-950/90 p-3.5 rounded-xl border border-rose-900/40 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                      Fact A ({c.source_a})
                    </span>
                    <span className="font-bold text-slate-200">{c.fact_a}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                      Fact B ({c.source_b})
                    </span>
                    <span className="font-bold text-slate-200">{c.fact_b}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: AI-EXTRACTED LAB RESULTS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 text-[10px] font-bold tracking-widest uppercase">
              AI-Extracted & Deterministically Validated
            </span>
            <h2 className="text-lg font-bold text-white">
              Laboratory Documents ({reports.length} Reports)
            </h2>
          </div>

          {reports.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Select Report:</span>
              <select
                value={selectedReportId || ''}
                onChange={(e) => setSelectedReportId(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-bold outline-none"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-200">
                    Report #{r.id} ({r.report_date || 'No Date'}) - {r.results.length} tests
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeReport ? (
          <LabTable results={activeReport.results} />
        ) : (
          <div className="p-8 text-center glass-card rounded-3xl border border-dashed border-slate-800">
            <p className="text-xs text-slate-400 mb-4">No laboratory reports uploaded for this patient yet.</p>
            <Link
              to={`/patients/${patient.id}/report`}
              className="glass-button text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-lg"
            >
              Upload First Lab Report
            </Link>
          </div>
        )}
      </section>

      {/* SECTION 4: AI-GENERATED PATIENT SUMMARY & CLINICIAN QUESTIONS */}
      <section>
        <SummaryCard
          patientId={patient.id}
          initialSummary={summaries.length > 0 ? summaries[0] : null}
          onSummaryGenerated={(s) => setSummaries((prev) => [s, ...prev])}
        />
      </section>

      {/* Footer 3D Banner */}
      <section className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 border border-rose-900/40 bg-gradient-to-r from-slate-950 via-rose-950/30 to-slate-950">
        <div>
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-rose-400 animate-pulse" />
            Launch Interactive 3D Anatomical Organ Mapping
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Map this patient's abnormal lab markers and symptoms onto physical 3D organ meshes.
          </p>
        </div>
        <Link
          to={`/patients/${patient.id}/anatomy`}
          className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition shrink-0 flex items-center gap-2 glow-rose"
        >
          Open 3D Model <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};
