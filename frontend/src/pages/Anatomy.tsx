import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Cpu, ArrowLeft, ClipboardList, FileText, User } from 'lucide-react';
import { AnatomyViewer3D } from '../components/AnatomyViewer3D';
import { api } from '../api';
import { usePatient } from '../context/PatientContext';
import type { Patient } from '../types';

export const AnatomyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { setCurrentPatientId } = usePatient();
  const patientId = parseInt(id || '0', 10);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (!patientId) return;
    setCurrentPatientId(patientId);
    api.getPatient(patientId).then(setPatient).catch(console.error);
  }, [patientId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* Glass Header */}
      <div className="glass-card rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-900/50">
        <div className="flex items-center gap-3">
          <Link
            to={patientId ? `/patients/${patientId}/record` : '/patients'}
            className="p-2.5 bg-slate-900 hover:bg-rose-950/80 rounded-xl text-slate-300 hover:text-rose-300 border border-slate-700 transition"
            title="Back to Record"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-rose-400 animate-pulse" />
              3D Anatomical Workstation
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Interactive 3D human mannequin projecting abnormal laboratory values and intake symptoms onto physical organ meshes.
            </p>
          </div>
        </div>

        {patient && (
          <div className="flex items-center gap-2.5">
            <Link
              to={`/patients/${patient.id}/record`}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
              Patient Record
            </Link>
            <Link
              to={`/patients/${patient.id}/report`}
              className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-300" />
              Upload Lab
            </Link>
          </div>
        )}
      </div>

      {patient && (
        <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-300 border border-slate-800 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{patient.name || `Patient #${patient.id}`}</span>
            <span>•</span>
            <span className="text-cyan-300">{patient.age}y {patient.sex}</span>
            <span>•</span>
            <span className="text-slate-400 truncate max-w-md">Conditions: {patient.conditions.join(', ') || 'None'}</span>
          </div>
          <div className="text-cyan-400 text-[11px] font-bold hidden md:inline">
            Orbit Controls: Drag to Rotate • Scroll to Zoom • Right-click to Pan
          </div>
        </div>
      )}

      {/* 3D Component */}
      <AnatomyViewer3D patientId={patientId} />
    </div>
  );
};
