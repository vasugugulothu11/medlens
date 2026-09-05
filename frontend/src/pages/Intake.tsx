import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { PatientForm } from '../components/PatientForm';
import { api } from '../api';
import { usePatient } from '../context/PatientContext';
import type { PatientCreateInput } from '../types';

export const Intake: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentPatientId, refreshPatients } = usePatient();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: PatientCreateInput) => {
    setLoading(true);
    try {
      const newPatient = await api.createPatient(data);
      await refreshPatients();
      setCurrentPatientId(newPatient.id);
      // Seamless clinical workflow: jump straight to report upload for the new patient
      navigate(`/patients/${newPatient.id}/report`);
    } catch (err: any) {
      console.error('Failed to create patient:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-teal-600" />
            Clinical Intake & Patient Registration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Capture primary demographics, reported symptoms, known diagnoses, drug allergies, and active medications.
          </p>
        </div>
      </div>

      <PatientForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  );
};
