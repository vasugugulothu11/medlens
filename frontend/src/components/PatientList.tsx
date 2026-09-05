import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, FileText, Cpu, Trash2, ArrowRight } from 'lucide-react';
import type { Patient } from '../types';
import { usePatient } from '../context/PatientContext';
import { api } from '../api';

interface PatientListProps {
  patients: Patient[];
  onSelect?: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients }) => {
  const navigate = useNavigate();
  const { setCurrentPatientId, refreshPatients } = usePatient();

  const handlePatientClick = (patient: Patient) => {
    setCurrentPatientId(patient.id);
    navigate(`/patients/${patient.id}/record`);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete patient #${id}? This will remove all associated reports and analyses.`)) {
      try {
        await api.deletePatient(id);
        await refreshPatients();
      } catch (err) {
        console.error('Failed to delete patient:', err);
      }
    }
  };

  if (!patients || patients.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">No Patients Registered Yet</h3>
        <p className="text-sm text-slate-500 mb-6">
          Add your first patient profile to begin extracting medical documents, validating lab ranges, and viewing 3D anatomical issues.
        </p>
        <button
          onClick={() => navigate('/patients/new')}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          Create Patient Record
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {patients.map((patient) => {
        const condList = patient.conditions || [];
        const allergyCount = (patient.allergies || []).length;
        const medCount = (patient.medications || []).length;

        return (
          <div
            key={patient.id}
            onClick={() => handlePatientClick(patient)}
            className="group glass-card-interactive rounded-3xl p-5 shadow-2xl border border-slate-800 cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 text-cyan-300 font-mono font-black text-xs flex items-center justify-center border border-cyan-800/40">
                    #{patient.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-2 text-base">
                      {patient.name || `Patient #${patient.id}`}
                    </h3>
                    <p className="text-xs text-slate-400 capitalize">
                      {patient.age} yrs • {patient.sex}
                    </p>
                  </div>
                </div>

                <button
                  title="Delete Patient Profile"
                  onClick={(e) => handleDelete(e, patient.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Conditions Badges */}
              <div className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Reported Conditions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {condList.length > 0 ? (
                    condList.slice(0, 3).map((cond, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2.5 py-1 bg-slate-900 text-slate-200 rounded-lg text-xs font-semibold border border-slate-800"
                      >
                        {cond}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">None recorded</span>
                  )}
                  {condList.length > 3 && (
                    <span className="text-xs text-cyan-400 font-bold self-center">
                      +{condList.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Patient Intake Stats */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 rounded-xl p-3 mb-4 text-xs font-mono border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Allergies</span>
                  <span className="font-bold text-rose-300">{allergyCount} documented</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Medications</span>
                  <span className="font-bold text-cyan-300">{medCount} active</span>
                </div>
              </div>

              {patient.symptoms && (
                <div className="text-xs text-slate-400 line-clamp-1 mb-3">
                  <span className="font-bold text-slate-300">Symptoms:</span> {patient.symptoms}
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-sans">
              <div className="flex items-center gap-2">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPatientId(patient.id);
                    navigate(`/patients/${patient.id}/report`);
                  }}
                  className="hover:text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> Lab Report
                </span>
                <span>•</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPatientId(patient.id);
                    navigate(`/patients/${patient.id}/anatomy`);
                  }}
                  className="hover:text-rose-300 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Cpu className="w-3.5 h-3.5 text-rose-400" /> 3D View
                </span>
              </div>

              <span className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Record <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
