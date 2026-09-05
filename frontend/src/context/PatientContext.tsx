import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Patient, MedicalReport } from '../types';
import { api } from '../api';

interface PatientContextType {
  patients: Patient[];
  currentPatient: Patient | null;
  latestReport: MedicalReport | null;
  loading: boolean;
  error: string | null;
  setCurrentPatientId: (id: number) => void;
  refreshPatients: () => Promise<void>;
  refreshCurrentPatient: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatientId, setCurrentPatientIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('medlens_active_patient_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [latestReport, setLatestReport] = useState<MedicalReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getPatients();
      setPatients(list);

      // If no active patient, pick first if available
      if (!currentPatientId && list.length > 0) {
        setCurrentPatientIdState(list[0].id);
        localStorage.setItem('medlens_active_patient_id', list[0].id.toString());
      }
    } catch (err: any) {
      console.error('Failed to load patients:', err);
      setError(err.message || 'Failed to connect to MedLens API');
    } finally {
      setLoading(false);
    }
  }, [currentPatientId]);

  const refreshCurrentPatient = useCallback(async () => {
    if (!currentPatientId) {
      setCurrentPatient(null);
      setLatestReport(null);
      return;
    }
    try {
      const [patient, reports] = await Promise.all([
        api.getPatient(currentPatientId),
        api.getReportsByPatient(currentPatientId)
      ]);
      setCurrentPatient(patient);
      setLatestReport(reports.length > 0 ? reports[0] : null);
    } catch (err: any) {
      console.error(`Failed to load patient ${currentPatientId}:`, err);
    }
  }, [currentPatientId]);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  useEffect(() => {
    refreshCurrentPatient();
  }, [currentPatientId, refreshCurrentPatient]);

  const setCurrentPatientId = (id: number) => {
    setCurrentPatientIdState(id);
    localStorage.setItem('medlens_active_patient_id', id.toString());
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        currentPatient,
        latestReport,
        loading,
        error,
        setCurrentPatientId,
        refreshPatients,
        refreshCurrentPatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};
