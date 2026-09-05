import axios from 'axios';
import type {
  Patient,
  PatientCreateInput,
  MedicalReport,
  Summary,
  Inconsistency,
  AnatomyResponse,
  LabResult,
} from './types';

// Connect to backend: defaults to /api (served by integrated full-stack server), or configurable via VITE_API_BASE_URL (e.g. http://localhost:8000/api)
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // Patients
  getPatients: async (): Promise<Patient[]> => {
    const res = await apiClient.get<Patient[]>('/patients');
    return res.data;
  },
  getPatient: async (id: number): Promise<Patient> => {
    const res = await apiClient.get<Patient>(`/patients/${id}`);
    return res.data;
  },
  createPatient: async (data: PatientCreateInput): Promise<Patient> => {
    const res = await apiClient.post<Patient>('/patients', data);
    return res.data;
  },
  updatePatient: async (id: number, data: Partial<PatientCreateInput>): Promise<Patient> => {
    const res = await apiClient.put<Patient>(`/patients/${id}`, data);
    return res.data;
  },
  deletePatient: async (id: number): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  },

  // Reports
  getReportsByPatient: async (patientId: number): Promise<MedicalReport[]> => {
    const res = await apiClient.get<MedicalReport[]>(`/reports/patient/${patientId}`);
    return res.data;
  },
  processReport: async (patientId: number, raw_text: string, report_date?: string): Promise<MedicalReport> => {
    const res = await apiClient.post<MedicalReport>(`/reports/patient/${patientId}/process`, {
      raw_text,
      report_date,
    });
    return res.data;
  },
  extractLabsStateless: async (reportText: string) => {
    const res = await apiClient.post('/reports/extract', { reportText });
    return res.data;
  },
  computeStatusStateless: async (results: any[]) => {
    const res = await apiClient.post('/reports/compute-status', { results });
    return res.data;
  },
  updateLabResult: async (
    resultId: number,
    data: { value?: string; reference_range?: string; verification_status?: string }
  ): Promise<LabResult> => {
    const res = await apiClient.patch<LabResult>(`/reports/results/${resultId}`, data);
    return res.data;
  },

  // Summaries
  getSummariesByPatient: async (patientId: number): Promise<Summary[]> => {
    const res = await apiClient.get<Summary[]>(`/summaries/patient/${patientId}`);
    return res.data;
  },
  generateSummary: async (patientId: number, language: string = 'en'): Promise<Summary> => {
    const res = await apiClient.post<Summary>('/summaries/generate', {
      patient_id: patientId,
      language,
    });
    return res.data;
  },

  // Inconsistencies
  getInconsistenciesByPatient: async (patientId: number): Promise<Inconsistency[]> => {
    const res = await apiClient.get<Inconsistency[]>(`/inconsistencies/patient/${patientId}`);
    return res.data;
  },
  detectInconsistencies: async (patientId: number): Promise<Inconsistency[]> => {
    const res = await apiClient.post<Inconsistency[]>('/inconsistencies/detect', {
      patient_id: patientId,
    });
    return res.data;
  },

  // Anatomy
  getAnatomyIssues: async (patientId: number): Promise<AnatomyResponse> => {
    const res = await apiClient.post<AnatomyResponse>('/anatomy/issues', {
      patient_id: patientId,
    });
    return res.data;
  },
};
