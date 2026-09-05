export interface Patient {
  id: number;
  name?: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  symptoms?: string | null;
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes?: string | null;
  created_at: string;
}

export interface PatientCreateInput {
  name?: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  symptoms?: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes?: string;
}

export type LabStatus = 'low' | 'normal' | 'high' | 'range_unavailable';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type VerificationStatus = 'unverified' | 'user_verified' | 'flagged';

export interface LabResult {
  id: number;
  report_id: number;
  test_name: string;
  value: string;
  units?: string | null;
  reference_range?: string | null;
  date?: string | null;
  remarks?: string | null;
  status: LabStatus;
  source_snippet: string;
  confidence: ConfidenceLevel;
  verification_status: VerificationStatus;
  updated_at?: string;
}

export interface MedicalReport {
  id: number;
  patient_id: number;
  report_date?: string | null;
  raw_text: string;
  created_at: string;
  results: LabResult[];
}

export interface Summary {
  id: number;
  patient_id: number;
  summary_text: string;
  questions: string[];
  language: string;
  created_at: string;
}

export interface Inconsistency {
  id: number;
  patient_id: number;
  type: 'allergy_medication' | 'diagnosis_conflict' | 'lab_value_conflict' | 'other';
  description: string;
  severity: 'high' | 'medium' | 'low';
  fact_a: string;
  fact_b: string;
  source_a: string;
  source_b: string;
  created_at: string;
}

export interface AnatomyHighlight {
  structureId: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  system: string;
  source: string;
}

export interface AnatomyResponse {
  patient_id: number;
  highlights: AnatomyHighlight[];
  totalIssues: number;
}
