import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FileText, ArrowRight, User, AlertCircle, CheckCircle2, Cpu, ClipboardList } from 'lucide-react';
import { ReportUploader } from '../components/ReportUploader';
import { LabTable } from '../components/LabTable';
import { api } from '../api';
import { usePatient } from '../context/PatientContext';
import type { Patient, MedicalReport } from '../types';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentPatientId } = usePatient();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [activeReport, setActiveReport] = useState<MedicalReport | null>(null);
  const [loading, setLoading] = useState(true);

  const patientId = parseInt(id || '0', 10);

  useEffect(() => {
    if (!patientId) return;
    setCurrentPatientId(patientId);

    const loadData = async () => {
      setLoading(true);
      try {
        const [pData, rList] = await Promise.all([
          api.getPatient(patientId),
          api.getReportsByPatient(patientId),
        ]);
        setPatient(pData);
        setReports(rList);
        if (rList.length > 0) {
          setActiveReport(rList[0]);
        }
      } catch (err) {
        console.error('Failed to load patient or reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [patientId]);

  const handleReportProcessed = (newReport: MedicalReport) => {
    setReports((prev) => [newReport, ...prev]);
    setActiveReport(newReport);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 text-sm">
        Loading patient and clinical documents...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 max-w-lg mx-auto my-8">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Patient Not Found</h2>
        <p className="text-xs text-slate-500 mb-4">The requested patient ID #{patientId} does not exist.</p>
        <Link to="/patients" className="text-xs text-teal-600 font-semibold hover:underline">
          Return to Patient Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Patient Glass Banner */}
      <div className="glass-card rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-950/80 text-cyan-300 font-mono font-black text-sm flex items-center justify-center border border-cyan-800/40">
            #{patient.id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-base">{patient.name || `Patient #${patient.id}`}</h2>
              <span className="text-xs text-slate-400 capitalize">({patient.age}y {patient.sex})</span>
            </div>
            <p className="text-xs text-slate-400">
              Conditions: {patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None'} • Allergies: {patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/patients/${patient.id}/record`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
          >
            <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
            View Record
          </Link>
          <Link
            to={`/patients/${patient.id}/anatomy`}
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/40 text-rose-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-rose-400" />
            3D Anatomy
          </Link>
        </div>
      </div>

      {/* Uploader Form */}
      <ReportUploader patientId={patient.id} onSuccess={handleReportProcessed} />

      {/* Recently Processed Lab Results Table */}
      {activeReport && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Parsed & Audited Lab Findings ({activeReport.results.length} tests)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Report date: {activeReport.report_date || 'Unspecified'} • Printed ranges parsed deterministically
              </p>
            </div>

            <button
              onClick={() => navigate(`/patients/${patient.id}/record`)}
              className="glass-button text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2"
            >
              Open Full Record
              <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          </div>

          <LabTable
            results={activeReport.results}
            onResultUpdated={(updated) => {
              setActiveReport((prev) =>
                prev
                  ? {
                      ...prev,
                      results: prev.results.map((r) => (r.id === updated.id ? updated : r)),
                    }
                  : null
              );
            }}
          />
        </div>
      )}
    </div>
  );
};
