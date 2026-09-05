import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// =========================================================================
// DETERMINISTIC LAB STATUS RANGE ENGINE (Strictly uses printed ranges)
// =========================================================================
type LabStatus = 'low' | 'normal' | 'high' | 'range_unavailable';

function parseRange(rangeStr?: string | null): { low: number | null; high: number | null } | null {
  if (!rangeStr) return null;
  const s = rangeStr.trim().toLowerCase();

  // Pattern: "< 200" or "<= 99"
  const ltMatch = s.match(/^(?:<|<=|less than)\s*([0-9.]+)/i);
  if (ltMatch) {
    const val = parseFloat(ltMatch[1]);
    if (!isNaN(val)) return { low: null, high: val };
  }

  // Pattern: "> 50" or ">= 60"
  const gtMatch = s.match(/^(?:>|>=|greater than)\s*([0-9.]+)/i);
  if (gtMatch) {
    const val = parseFloat(gtMatch[1]);
    if (!isNaN(val)) return { low: val, high: null };
  }

  // Pattern: "13.5 - 17.5" or "13.5 to 17.5"
  const dashMatch = s.match(/([0-9.]+)\s*(?:-|–|—|to)\s*([0-9.]+)/i);
  if (dashMatch) {
    const low = parseFloat(dashMatch[1]);
    const high = parseFloat(dashMatch[2]);
    if (!isNaN(low) && !isNaN(high)) return { low, high };
  }

  return null;
}

function parseValue(valStr?: string | null): number | null {
  if (!valStr) return null;
  const cleaned = valStr.trim().replace(/,/g, '');
  const m = cleaned.match(/[-+]?[0-9]*\.?[0-9]+/);
  if (m) {
    const num = parseFloat(m[0]);
    return isNaN(num) ? null : num;
  }
  return null;
}

function computeStatus(valStr?: string | null, rangeStr?: string | null): LabStatus {
  const parsedVal = parseValue(valStr);
  const parsedRange = parseRange(rangeStr);

  if (parsedVal === null || parsedRange === null) {
    return 'range_unavailable';
  }

  const { low, high } = parsedRange;

  if (low !== null && high !== null) {
    if (parsedVal < low) return 'low';
    if (parsedVal > high) return 'high';
    return 'normal';
  }

  if (high !== null && low === null) {
    return parsedVal > high ? 'high' : 'normal';
  }

  if (low !== null && high === null) {
    return parsedVal < low ? 'low' : 'normal';
  }

  return 'range_unavailable';
}

// =========================================================================
// 3D ANATOMICAL MAPPER (Conditions + Symptoms + Abnormal Labs -> 3D Meshes)
// =========================================================================
interface AnatomyHighlight {
  structureId: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  system: string;
  source: string;
}

function mapPatientToAnatomy(
  conditions: string[] = [],
  symptoms: string = '',
  labResults: any[] = []
): AnatomyHighlight[] {
  const map = new Map<string, AnatomyHighlight>();

  const addHighlight = (
    structureId: string,
    label: string,
    severity: 'high' | 'medium' | 'low',
    reason: string,
    system: string,
    source: string
  ) => {
    const existing = map.get(structureId);
    if (!existing) {
      map.set(structureId, { structureId, label, severity, reason, system, source });
    } else {
      // Elevate severity if high
      if (severity === 'high') existing.severity = 'high';
      existing.reason += ` • ${reason}`;
    }
  };

  const textC = conditions.map((c) => c.toLowerCase()).join(' ');
  const textS = symptoms.toLowerCase();

  // 1. Conditions mapping
  if (textC.includes('diabet')) {
    addHighlight('pancreas', 'Pancreas', 'high', 'Diagnosed Diabetes: endocrine islet monitoring', 'Endocrine', 'Patient Intake (Condition)');
    addHighlight('peripheral_nerves', 'Peripheral Nerves', 'medium', 'Diabetic neuropathy risk profile', 'Nervous', 'Patient Intake (Condition)');
  }
  if (textC.includes('hypertens') || textC.includes('blood pressure')) {
    addHighlight('heart', 'Heart (Left Ventricle)', 'high', 'Essential Hypertension: increased left ventricular cardiac afterload', 'Cardiovascular', 'Patient Intake (Condition)');
    addHighlight('aorta', 'Aorta & Great Vessels', 'medium', 'Elevated arterial systemic pressure and aortic wall stress', 'Cardiovascular', 'Patient Intake (Condition)');
    addHighlight('circulatory_veins', 'Vascular Network', 'medium', 'Systemic vascular resistance elevation', 'Circulatory', 'Patient Intake (Condition)');
  }
  if (textC.includes('kidney') || textC.includes('renal') || textC.includes('ckd')) {
    addHighlight('kidneys', 'Kidneys (Renal System)', 'high', 'Chronic Kidney Disease / Glomerular filtration involvement', 'Urinary', 'Patient Intake (Condition)');
  }
  if (textC.includes('asthma') || textC.includes('copd') || textC.includes('bronch')) {
    addHighlight('lungs', 'Lungs & Pulmonary Airways', 'medium', 'Lower airway bronchial reactivity and gas exchange restriction', 'Respiratory', 'Patient Intake (Condition)');
  }
  if (textC.includes('thyroid')) {
    addHighlight('thyroid', 'Thyroid Gland', 'medium', 'Documented Thyroid dysfunction', 'Endocrine', 'Patient Intake (Condition)');
  }
  if (textC.includes('gerd') || textC.includes('reflux') || textC.includes('ulcer')) {
    addHighlight('stomach', 'Stomach & Gastric Pouch', 'low', 'Acid reflux / Gastric mucosal inflammation', 'Digestive', 'Patient Intake (Condition)');
  }
  if (textC.includes('back pain') || textC.includes('spine') || textC.includes('disc') || textC.includes('sciatica')) {
    addHighlight('spine', 'Vertebral Column & Spine', 'medium', 'Reported spinal axial involvement / radiculopathy risk', 'Skeletal', 'Patient Intake (Condition)');
  }

  // 2. Symptoms mapping
  if (textS.includes('tingl') || textS.includes('numb') || textS.includes('neuropath')) {
    addHighlight('peripheral_nerves', 'Peripheral Nerves', 'medium', 'Symptom: Tingling or numbness in extremities', 'Nervous', 'Patient Intake (Symptom)');
  }
  if (textS.includes('shortness of breath') || textS.includes('wheez') || textS.includes('cough')) {
    addHighlight('lungs', 'Lungs & Pulmonary Airways', 'medium', 'Symptom: Dyspnea or cough reported', 'Respiratory', 'Patient Intake (Symptom)');
    addHighlight('diaphragm', 'Thoracoabdominal Diaphragm', 'low', 'Increased respiratory work and diaphragmatic effort', 'Respiratory', 'Patient Intake (Symptom)');
  }
  if (textS.includes('chest pain') || textS.includes('palpitat') || textS.includes('tightness')) {
    addHighlight('heart', 'Heart (Left Ventricle)', 'high', 'Symptom: Chest tightness or palpitations', 'Cardiovascular', 'Patient Intake (Symptom)');
    addHighlight('ribcage', 'Rib Cage & Costal Bed', 'low', 'Chest wall and rib cage evaluation indicated', 'Skeletal', 'Patient Intake (Symptom)');
  }
  if (textS.includes('headache') || textS.includes('dizz') || textS.includes('lightheaded')) {
    addHighlight('brain', 'Brain / Frontal Lobe', 'medium', 'Symptom: Headaches or dizzy spells', 'Nervous', 'Patient Intake (Symptom)');
  }
  if (textS.includes('abdominal pain') || textS.includes('cramp') || textS.includes('bloat') || textS.includes('nausea')) {
    addHighlight('intestines', 'Intestines & Digestive Tract', 'medium', 'Symptom: Abdominal discomfort or bowel symptoms', 'Digestive', 'Patient Intake (Symptom)');
  }
  if (textS.includes('back pain') || textS.includes('stiff')) {
    addHighlight('spine', 'Vertebral Column & Spine', 'medium', 'Symptom: Axial spinal or lumbar discomfort', 'Skeletal', 'Patient Intake (Symptom)');
  }

  // 3. Lab Results mapping
  for (const lab of labResults) {
    const t = (lab.test_name || '').toLowerCase();
    const stat = lab.status;
    const val = lab.value;

    if (stat === 'high' || stat === 'low') {
      if (t.includes('glucose') || t.includes('hba1c') || t.includes('a1c')) {
        addHighlight('pancreas', 'Pancreas', 'high', `Abnormal ${lab.test_name}: ${val} (${stat.toUpperCase()})`, 'Endocrine', 'Lab Report');
      }
      if (t.includes('creatinine') || t.includes('egfr') || t.includes('bun') || t.includes('urea')) {
        addHighlight('kidneys', 'Kidneys (Renal System)', 'high', `Abnormal ${lab.test_name}: ${val} (${stat.toUpperCase()})`, 'Urinary', 'Lab Report');
      }
      if (t.includes('alt') || t.includes('ast') || t.includes('bilirubin') || t.includes('alp')) {
        addHighlight('liver', 'Liver (Hepatic Parenchyma)', 'medium', `Elevated liver enzymes (${lab.test_name}: ${val})`, 'Hepatic', 'Lab Report');
      }
      if (t.includes('cholesterol') || t.includes('triglyceride') || t.includes('ldl') || t.includes('hdl')) {
        addHighlight('heart', 'Heart & Coronary Arteries', 'medium', `Atherogenic lipid marker: ${lab.test_name} is ${stat}`, 'Cardiovascular', 'Lab Report');
        addHighlight('aorta', 'Aorta & Vascular Tree', 'medium', `Arterial lipid deposition and vascular wall plaque risk`, 'Cardiovascular', 'Lab Report');
      }
      if (t.includes('tsh') || t.includes('t4') || t.includes('t3')) {
        addHighlight('thyroid', 'Thyroid Gland', 'medium', `Thyroid axis flag: ${lab.test_name} is ${stat}`, 'Endocrine', 'Lab Report');
      }
      if (t.includes('hemoglobin') || t.includes('rbc') || t.includes('hematocrit')) {
        addHighlight('circulatory_veins', 'Circulatory System', 'medium', `Hematologic index abnormal: ${lab.test_name} is ${stat}`, 'Hematologic', 'Lab Report');
      }
    }
  }

  return Array.from(map.values());
}

// =========================================================================
// IN-MEMORY CLINICAL DATA STORE (Pre-seeded with 3 realistic clinical patients)
// =========================================================================
interface PatientData {
  id: number;
  name: string;
  age: number;
  sex: 'male' | 'female' | 'other';
  symptoms: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes: string;
  created_at: string;
}

interface LabResultData {
  id: number;
  report_id: number;
  test_name: string;
  value: string;
  units: string | null;
  reference_range: string | null;
  date: string | null;
  remarks: string | null;
  status: LabStatus;
  source_snippet: string;
  confidence: 'high' | 'medium' | 'low';
  verification_status: 'unverified' | 'user_verified' | 'flagged';
  updated_at?: string;
}

interface MedicalReportData {
  id: number;
  patient_id: number;
  report_date: string;
  raw_text: string;
  created_at: string;
  results: LabResultData[];
}

interface SummaryData {
  id: number;
  patient_id: number;
  summary_text: string;
  questions: string[];
  language: string;
  created_at: string;
}

interface InconsistencyData {
  id: number;
  patient_id: number;
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  fact_a: string;
  fact_b: string;
  source_a: string;
  source_b: string;
  created_at: string;
}

let nextPatientId = 4;
let nextReportId = 3;
let nextResultId = 25;
let nextSummaryId = 2;
let nextInconsistencyId = 3;

const patients: PatientData[] = [
  {
    id: 1,
    name: 'Eleanor Vance',
    age: 58,
    sex: 'female',
    symptoms: 'Persistent bilateral numbness and burning sensation in toes, daytime fatigue, exertional shortness of breath.',
    conditions: ['Type 2 Diabetes', 'Essential Hypertension', 'Hyperlipidemia'],
    allergies: ['Penicillin', 'Sulfa drugs'],
    medications: ['Metformin 1000mg BID', 'Lisinopril 20mg daily', 'Atorvastatin 40mg daily', 'Amoxicillin 500mg TID (dental extraction)'],
    notes: 'Dental surgeon prescribed amoxicillin without checking allergy chart. Reports worsening neuropathy.',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2,
    name: 'Marcus Holloway',
    age: 46,
    sex: 'male',
    symptoms: 'Flank tightness, foamy urine, tension headaches, dependent leg edema.',
    conditions: ['Chronic Kidney Disease Stage 2', 'Essential Hypertension'],
    allergies: ['Aspirin', 'Ibuprofen (NSAIDs)'],
    medications: ['Amlodipine 10mg daily', 'Ibuprofen 400mg PRN for tension headache'],
    notes: 'Takes OTC Advil/Ibuprofen despite documented NSAID sensitivity.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 3,
    name: 'Dr. Arthur Pendelton',
    age: 63,
    sex: 'male',
    symptoms: 'Cold intolerance, sluggish mornings, chronic nocturnal acid reflux, dry cough in cold weather.',
    conditions: ['GERD', 'Mild Asthma', 'Primary Hypothyroidism'],
    allergies: ['Codeine'],
    medications: ['Levothyroxine 75mcg daily', 'Omeprazole 20mg daily', 'Albuterol inhaler PRN'],
    notes: 'Routine annual follow-up. Check TSH and complete blood counts.',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const reports: MedicalReportData[] = [
  {
    id: 1,
    patient_id: 1,
    report_date: '2026-08-15',
    raw_text: `CLINICAL PATHOLOGY LABORATORY REPORT
Patient ID: PT-90214 | Date: 2026-08-15
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
AST (SGOT)                     32        U/L        0 - 40                NORMAL`,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    results: [
      { id: 1, report_id: 1, test_name: 'Glucose, Fasting', value: '156', units: 'mg/dL', reference_range: '70 - 99', date: '2026-08-15', remarks: 'HIGH', status: 'high', source_snippet: 'Glucose, Fasting 156 mg/dL 70 - 99 HIGH', confidence: 'high', verification_status: 'unverified' },
      { id: 2, report_id: 1, test_name: 'Hemoglobin A1c', value: '8.2', units: '%', reference_range: '< 5.7', date: '2026-08-15', remarks: 'HIGH', status: 'high', source_snippet: 'Hemoglobin A1c 8.2 % < 5.7 HIGH', confidence: 'high', verification_status: 'user_verified' },
      { id: 3, report_id: 1, test_name: 'Blood Urea Nitrogen (BUN)', value: '24', units: 'mg/dL', reference_range: '7 - 20', date: '2026-08-15', remarks: 'HIGH', status: 'high', source_snippet: 'Blood Urea Nitrogen (BUN) 24 mg/dL 7 - 20 HIGH', confidence: 'high', verification_status: 'unverified' },
      { id: 4, report_id: 1, test_name: 'Creatinine, Serum', value: '1.45', units: 'mg/dL', reference_range: '0.60 - 1.20', date: '2026-08-15', remarks: 'HIGH', status: 'high', source_snippet: 'Creatinine, Serum 1.45 mg/dL 0.60 - 1.20 HIGH', confidence: 'high', verification_status: 'unverified' },
      { id: 5, report_id: 1, test_name: 'eGFR Non-Afr. American', value: '52', units: 'mL/min/1.73', reference_range: '> 60', date: '2026-08-15', remarks: 'LOW', status: 'low', source_snippet: 'eGFR Non-Afr. American 52 mL/min/1.73 > 60 LOW', confidence: 'high', verification_status: 'user_verified' },
      { id: 6, report_id: 1, test_name: 'Total Cholesterol', value: '242', units: 'mg/dL', reference_range: '< 200', date: '2026-08-15', remarks: 'HIGH', status: 'high', source_snippet: 'Total Cholesterol 242 mg/dL < 200 HIGH', confidence: 'high', verification_status: 'unverified' },
      { id: 7, report_id: 1, test_name: 'Triglycerides', value: '198', units: 'mg/dL', reference_range: '< 150', date: '2026-08-15', remarks: 'HIGH', status: 'high', source_snippet: 'Triglycerides 198 mg/dL < 150 HIGH', confidence: 'high', verification_status: 'unverified' },
      { id: 8, report_id: 1, test_name: 'HDL Cholesterol', value: '41', units: 'mg/dL', reference_range: '> 50', date: '2026-08-15', remarks: 'LOW', status: 'low', source_snippet: 'HDL Cholesterol 41 mg/dL > 50 LOW', confidence: 'high', verification_status: 'unverified' },
      { id: 9, report_id: 1, test_name: 'LDL Cholesterol (calc)', value: '161', units: 'mg/dL', reference_range: '< 100', date: '2026-08-15', remarks: 'HIGH', status: 'high', source_snippet: 'LDL Cholesterol (calc) 161 mg/dL < 100 HIGH', confidence: 'high', verification_status: 'unverified' },
      { id: 10, report_id: 1, test_name: 'Sodium', value: '141', units: 'mmol/L', reference_range: '135 - 145', date: '2026-08-15', remarks: 'NORMAL', status: 'normal', source_snippet: 'Sodium 141 mmol/L 135 - 145 NORMAL', confidence: 'high', verification_status: 'unverified' },
      { id: 11, report_id: 1, test_name: 'Potassium', value: '4.6', units: 'mmol/L', reference_range: '3.5 - 5.0', date: '2026-08-15', remarks: 'NORMAL', status: 'normal', source_snippet: 'Potassium 4.6 mmol/L 3.5 - 5.0 NORMAL', confidence: 'high', verification_status: 'unverified' },
    ],
  },
];

const summaries: SummaryData[] = [
  {
    id: 1,
    patient_id: 1,
    summary_text: `Your recent laboratory tests show several values that sit outside the reference ranges printed by the testing facility. In particular, both fasting blood sugar (156 mg/dL) and Hemoglobin A1c (8.2%) were flagged above the standard laboratory threshold, which is relevant to your documented diabetes.\n\nAdditionally, markers related to kidney filtration—specifically serum creatinine (1.45 mg/dL) and estimated GFR (52 mL/min)—show changes that your clinician will want to review in connection with your blood pressure medications and current symptoms.\n\nPlease note that this summary organizes your clinical documents for your review and is not a medical diagnosis or treatment plan. Always discuss these findings directly with your primary care provider.`,
    questions: [
      'What clinical steps or lifestyle adjustments do you recommend in response to my elevated HbA1c of 8.2%?',
      'How does my kidney filtration rate (eGFR 52) influence my current blood pressure and diabetes medications?',
      'Could my recent foot tingling be related to my blood sugar levels or circulation?',
      'Is there an alternative antibiotic we should substitute, given my penicillin allergy documentation?',
    ],
    language: 'en',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const inconsistencies: InconsistencyData[] = [
  {
    id: 1,
    patient_id: 1,
    type: 'allergy_medication',
    description: 'Hazardous Drug-Allergy Warning: Patient has a documented allergy to Penicillin, but Amoxicillin 500mg is listed under active medications.',
    severity: 'high',
    fact_a: 'Documented Allergy: Penicillin',
    fact_b: 'Active Prescription: Amoxicillin 500mg TID',
    source_a: 'Patient Intake Profile (Allergies)',
    source_b: 'Patient Intake Profile (Medications)',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    patient_id: 2,
    type: 'allergy_medication',
    description: 'NSAID Sensitivity Conflict: Documented allergy to Ibuprofen (NSAIDs), but patient is taking OTC Ibuprofen 400mg PRN for tension headaches.',
    severity: 'high',
    fact_a: 'Documented Allergy: Ibuprofen (NSAIDs)',
    fact_b: 'Active PRN Medication: Ibuprofen 400mg',
    source_a: 'Patient Intake Profile (Allergies)',
    source_b: 'Patient Intake Profile (Medications)',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

// =========================================================================
// AI INTEGRATION VIA @google/genai (With safe fallback)
// =========================================================================
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// =========================================================================
// API ROUTES
// =========================================================================

// --- PATIENTS ---
app.get('/api/patients', (req, res) => {
  res.json(patients);
});

app.post('/api/patients', (req, res) => {
  const body = req.body;
  const newPatient: PatientData = {
    id: nextPatientId++,
    name: body.name || 'Anonymous Patient',
    age: parseInt(body.age, 10) || 45,
    sex: body.sex || 'other',
    symptoms: body.symptoms || '',
    conditions: Array.isArray(body.conditions) ? body.conditions : [],
    allergies: Array.isArray(body.allergies) ? body.allergies : [],
    medications: Array.isArray(body.medications) ? body.medications : [],
    notes: body.notes || '',
    created_at: new Date().toISOString(),
  };
  patients.unshift(newPatient);
  res.status(201).json(newPatient);
});

app.get('/api/patients/:id', (req, res) => {
  const p = patients.find((x) => x.id === parseInt(req.params.id, 10));
  if (!p) return res.status(404).json({ detail: 'Patient not found' });
  res.json(p);
});

app.put('/api/patients/:id', (req, res) => {
  const idx = patients.findIndex((x) => x.id === parseInt(req.params.id, 10));
  if (idx === -1) return res.status(404).json({ detail: 'Patient not found' });
  patients[idx] = { ...patients[idx], ...req.body, id: patients[idx].id };
  res.json(patients[idx]);
});

app.delete('/api/patients/:id', (req, res) => {
  const pId = parseInt(req.params.id, 10);
  const idx = patients.findIndex((x) => x.id === pId);
  if (idx === -1) return res.status(404).json({ detail: 'Patient not found' });
  patients.splice(idx, 1);
  // Cascade delete
  for (let i = reports.length - 1; i >= 0; i--) {
    if (reports[i].patient_id === pId) reports.splice(i, 1);
  }
  for (let i = summaries.length - 1; i >= 0; i--) {
    if (summaries[i].patient_id === pId) summaries.splice(i, 1);
  }
  for (let i = inconsistencies.length - 1; i >= 0; i--) {
    if (inconsistencies[i].patient_id === pId) inconsistencies.splice(i, 1);
  }
  res.status(204).send();
});

// --- REPORTS ---
app.get('/api/reports/patient/:id', (req, res) => {
  const pId = parseInt(req.params.id, 10);
  const patientReports = reports.filter((r) => r.patient_id === pId);
  res.json(patientReports);
});

app.post('/api/reports/extract', async (req, res) => {
  const { reportText } = req.body;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract all reported lab tests into valid JSON with format: {"results": [{"test_name": string, "value": string, "units": string|null, "reference_range": string|null, "date": string|null, "remarks": string|null, "source_snippet": string, "confidence": "high"|"medium"|"low"}]}. Preserve exact names and snippets. Never guess reference ranges. Raw text:\n${reportText}`,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json({ results: parsed.results || [], processingNotes: 'AI extracted via Gemini' });
    } catch (e: any) {
      console.warn('AI Extraction failed, using regex fallback:', e.message);
    }
  }

  // Fallback regex parser
  const lines = (reportText || '').split('\n').filter((l: string) => l.trim().length > 0);
  const results: any[] = [];
  const lineRe = /^([A-Za-z0-9\s,\-\/\(\)]+?)(?::|\t|\s{2,})\s*([<>]?\s*[-+]?\d+(?:\.\d+)?|[A-Za-z]+)(?:\s+([a-zA-Z%\/μuU]+(?:\/[a-zA-Z0-9]+)?))?(?:\s*[\(\[]?\s*([<>]?\s*\d+(?:\.\d+)?\s*(?:[-–—to]+\s*\d+(?:\.\d+)?)?|normal|negative)[\)\]]?)?/i;

  for (const line of lines) {
    if (['patient:', 'dob:', 'doctor:', 'date:', 'test name'].some((h) => line.toLowerCase().includes(h))) continue;
    const m = line.match(lineRe);
    if (m && m[1].trim().length > 1 && m[1].trim().length < 60) {
      results.push({
        test_name: m[1].trim(),
        value: m[2].trim(),
        units: m[3]?.trim() || null,
        reference_range: m[4]?.trim() || null,
        date: null,
        remarks: null,
        source_snippet: line.trim(),
        confidence: 'medium',
      });
    }
  }

  res.json({ results, processingNotes: 'Extracted via clinical parser' });
});

app.post('/api/reports/compute-status', (req, res) => {
  const { results } = req.body;
  const enriched = (results || []).map((r: any) => ({
    ...r,
    status: computeStatus(r.value, r.reference_range),
  }));
  res.json({ results: enriched });
});

app.post('/api/reports/patient/:id/process', async (req, res) => {
  const pId = parseInt(req.params.id, 10);
  const p = patients.find((x) => x.id === pId);
  if (!p) return res.status(404).json({ detail: 'Patient not found' });

  const { raw_text, report_date } = req.body;
  if (!raw_text) return res.status(400).json({ detail: 'Raw report text is required' });

  // 1. AI Extract
  const ai = getGeminiClient();
  let extractedItems: any[] = [];

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract all clinical lab results from this document into valid JSON: {"results": [{"test_name": string, "value": string, "units": string|null, "reference_range": string|null, "date": string|null, "remarks": string|null, "source_snippet": string, "confidence": "high"|"medium"|"low"}]}. Never fabricate reference ranges.\n\n${raw_text}`,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      if (Array.isArray(parsed.results)) extractedItems = parsed.results;
    } catch (e: any) {
      console.warn('AI Extraction failed during process:', e.message);
    }
  }

  if (extractedItems.length === 0) {
    // Regex extraction fallback
    const lines = raw_text.split('\n').filter((l: string) => l.trim().length > 0);
    const lineRe = /^([A-Za-z0-9\s,\-\/\(\)]+?)(?::|\t|\s{2,})\s*([<>]?\s*[-+]?\d+(?:\.\d+)?|[A-Za-z]+)(?:\s+([a-zA-Z%\/μuU]+(?:\/[a-zA-Z0-9]+)?))?(?:\s*[\(\[]?\s*([<>]?\s*\d+(?:\.\d+)?\s*(?:[-–—to]+\s*\d+(?:\.\d+)?)?|normal|negative)[\)\]]?)?/i;
    for (const line of lines) {
      if (['patient:', 'dob:', 'doctor:', 'date:', 'test name'].some((h) => line.toLowerCase().includes(h))) continue;
      const m = line.match(lineRe);
      if (m && m[1].trim().length > 1 && m[1].trim().length < 60) {
        extractedItems.push({
          test_name: m[1].trim(),
          value: m[2].trim(),
          units: m[3]?.trim() || null,
          reference_range: m[4]?.trim() || null,
          date: report_date || null,
          remarks: null,
          source_snippet: line.trim(),
          confidence: 'medium',
        });
      }
    }
  }

  // 2. Deterministic Status computation strictly from printed ranges
  const reportId = nextReportId++;
  const labResults: LabResultData[] = extractedItems.map((item) => {
    const val = String(item.value || '');
    const ref = item.reference_range ? String(item.reference_range) : null;
    return {
      id: nextResultId++,
      report_id: reportId,
      test_name: String(item.test_name || 'Laboratory Marker'),
      value: val,
      units: item.units ? String(item.units) : null,
      reference_range: ref,
      date: item.date || report_date || null,
      remarks: item.remarks ? String(item.remarks) : null,
      status: computeStatus(val, ref),
      source_snippet: String(item.source_snippet || raw_text.slice(0, 80)),
      confidence: (item.confidence as any) || 'medium',
      verification_status: 'unverified',
    };
  });

  const newReport: MedicalReportData = {
    id: reportId,
    patient_id: pId,
    report_date: report_date || new Date().toISOString().split('T')[0],
    raw_text,
    created_at: new Date().toISOString(),
    results: labResults,
  };

  reports.unshift(newReport);
  res.status(201).json(newReport);
});

app.patch('/api/reports/results/:id', (req, res) => {
  const rId = parseInt(req.params.id, 10);
  for (const rep of reports) {
    const resItem = rep.results.find((r) => r.id === rId);
    if (resItem) {
      if (req.body.value !== undefined) resItem.value = req.body.value;
      if (req.body.reference_range !== undefined) {
        resItem.reference_range = req.body.reference_range;
        resItem.status = computeStatus(resItem.value, resItem.reference_range);
      }
      if (req.body.verification_status !== undefined) {
        resItem.verification_status = req.body.verification_status;
      }
      resItem.updated_at = new Date().toISOString();
      return res.json(resItem);
    }
  }
  res.status(404).json({ detail: 'Lab result not found' });
});

// --- SUMMARIES ---
app.get('/api/summaries/patient/:id', (req, res) => {
  const pId = parseInt(req.params.id, 10);
  res.json(summaries.filter((s) => s.patient_id === pId));
});

app.post('/api/summaries/generate', async (req, res) => {
  const pId = parseInt(req.body.patient_id, 10);
  const p = patients.find((x) => x.id === pId);
  if (!p) return res.status(404).json({ detail: 'Patient not found' });

  const patientReports = reports.filter((r) => r.patient_id === pId);
  const latestResults = patientReports.length > 0 ? patientReports[0].results : [];

  const ai = getGeminiClient();
  let summaryText = '';
  let questions: string[] = [];

  if (ai) {
    try {
      const prompt = `You are the Patient Communication Assistant in MedLens.
Your goal is to explain laboratory findings clearly, cautiously, and with zero diagnostic pronouncements.
MANDATES:
- Absolutely NO medical diagnosis or treatment/dosage advice.
- Cautious language: "Your test was recorded at X, which your doctor can contextualize".
- Formulate 3-5 neutral, empowering questions for the clinician.
Output valid JSON: {"summaryText": string, "questionsForClinician": string[]}.

Patient: Age ${p.age}, ${p.sex}, Conditions: ${p.conditions.join(', ')}, Symptoms: ${p.symptoms}
Results: ${JSON.stringify(latestResults)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      summaryText = parsed.summaryText || '';
      questions = parsed.questionsForClinician || [];
    } catch (e: any) {
      console.warn('AI Summary failed:', e.message);
    }
  }

  if (!summaryText) {
    const flagged = latestResults.filter((r) => r.status === 'high' || r.status === 'low');
    const flaggedNames = flagged.map((f) => `${f.test_name} (${f.status.toUpperCase()})`).join(', ');
    const flagNote = flagged.length > 0
      ? `${flagged.length} test(s) showed values outside printed reference intervals: ${flaggedNames}.`
      : 'All parsed laboratory tests currently sit within document reference intervals.';

    summaryText = `This report summary consolidates your intake baseline and recent laboratory findings. ${flagNote} Standard reference intervals represent statistical norms; any single test value should always be interpreted in the context of your overall clinical history.\n\nPlease remember that MedLens provides structured document organization and is not a medical diagnostic engine. We encourage you to review these findings with your physician.`;

    questions = [
      'What clinical significance do my recent lab results hold in relation to my symptoms?',
      'Are any of the flagged values expected given my current conditions or medications?',
      'Would you recommend repeating any of these tests at our next appointment?',
      'Are there any preventive lifestyle or diet adjustments we should consider based on this review?',
    ];
  }

  const newSummary: SummaryData = {
    id: nextSummaryId++,
    patient_id: pId,
    summary_text: summaryText,
    questions,
    language: req.body.language || 'en',
    created_at: new Date().toISOString(),
  };

  summaries.unshift(newSummary);
  res.status(201).json(newSummary);
});

// --- INCONSISTENCIES ---
app.get('/api/inconsistencies/patient/:id', (req, res) => {
  const pId = parseInt(req.params.id, 10);
  res.json(inconsistencies.filter((i) => i.patient_id === pId));
});

app.post('/api/inconsistencies/detect', async (req, res) => {
  const pId = parseInt(req.body.patient_id, 10);
  const p = patients.find((x) => x.id === pId);
  if (!p) return res.status(404).json({ detail: 'Patient not found' });

  const patientReports = reports.filter((r) => r.patient_id === pId);
  const conflicts: any[] = [];

  // Deterministic rule cross-checks
  const allergies = p.allergies.map((a) => a.toLowerCase());
  const meds = p.medications.map((m) => m.toLowerCase());
  const conditions = p.conditions.map((c) => c.toLowerCase());

  // Rule 1: Penicillin allergy vs Beta-lactams
  const hasPenAllergy = allergies.some((a) => a.includes('penicillin') || a.includes('amox'));
  const hasPenMed = meds.some((m) => ['amoxicillin', 'augmentin', 'penicillin', 'ampicillin'].some((d) => m.includes(d)));
  if (hasPenAllergy && hasPenMed) {
    conflicts.push({
      type: 'allergy_medication',
      description: 'Potential Drug-Allergy Warning: Patient lists allergy to Penicillin-class antibiotics, but is prescribed active Amoxicillin/Penicillin.',
      severity: 'high',
      fact_a: 'Documented Allergy: Penicillin',
      fact_b: `Active Medication: ${p.medications.find((m) => m.toLowerCase().includes('amox') || m.toLowerCase().includes('penicillin'))}`,
      source_a: 'Patient Intake Profile (Allergies)',
      source_b: 'Patient Intake Profile (Medications)',
    });
  }

  // Rule 2: NSAID allergy vs Ibuprofen/Naproxen/Aspirin
  const hasNsaidAllergy = allergies.some((a) => a.includes('nsaid') || a.includes('aspirin') || a.includes('ibuprofen'));
  const hasNsaidMed = meds.some((m) => ['ibuprofen', 'advil', 'motrin', 'naproxen', 'aspirin', 'aleve'].some((d) => m.includes(d)));
  if (hasNsaidAllergy && hasNsaidMed) {
    conflicts.push({
      type: 'allergy_medication',
      description: 'Potential NSAID Sensitivity Alert: Documented allergy to NSAIDs with concurrent prescription or OTC Ibuprofen/Aspirin.',
      severity: 'high',
      fact_a: 'Documented Allergy: NSAID / Aspirin / Ibuprofen',
      fact_b: `Active Medication: ${p.medications.find((m) => m.toLowerCase().includes('ibuprofen') || m.toLowerCase().includes('aspirin'))}`,
      source_a: 'Patient Intake Profile (Allergies)',
      source_b: 'Patient Intake Profile (Medications)',
    });
  }

  // Rule 3: High HbA1c in Lab without diabetes condition
  const hasDiabetes = conditions.some((c) => c.includes('diabet'));
  for (const r of patientReports) {
    for (const lab of r.results) {
      if (lab.test_name.toLowerCase().includes('hba1c') || lab.test_name.toLowerCase().includes('a1c')) {
        const val = parseFloat(lab.value);
        if (!isNaN(val) && val >= 6.5 && !hasDiabetes) {
          conflicts.push({
            type: 'diagnosis_conflict',
            description: `Glycemic Marker Discrepancy: HbA1c is elevated at ${lab.value}% (${lab.reference_range}), but Diabetes is not recorded in the Intake profile.`,
            severity: 'medium',
            fact_a: `Lab Result: HbA1c is ${lab.value}%`,
            fact_b: 'No Diabetes recorded in intake conditions',
            source_a: `Medical Report #${r.id}`,
            source_b: 'Patient Intake Profile (Conditions)',
          });
        }
      }
    }
  }

  // Remove existing inconsistencies for this patient and save new ones
  for (let i = inconsistencies.length - 1; i >= 0; i--) {
    if (inconsistencies[i].patient_id === pId) inconsistencies.splice(i, 1);
  }

  const createdRows: InconsistencyData[] = conflicts.map((c) => {
    const item: InconsistencyData = {
      id: nextInconsistencyId++,
      patient_id: pId,
      type: c.type,
      description: c.description,
      severity: c.severity,
      fact_a: c.fact_a,
      fact_b: c.fact_b,
      source_a: c.source_a,
      source_b: c.source_b,
      created_at: new Date().toISOString(),
    };
    inconsistencies.unshift(item);
    return item;
  });

  res.status(201).json(createdRows);
});

// --- ANATOMY ---
app.post('/api/anatomy/issues', (req, res) => {
  const pId = parseInt(req.body.patient_id, 10);
  const p = patients.find((x) => x.id === pId);
  if (!p) return res.status(404).json({ detail: 'Patient not found' });

  const patientReports = reports.filter((r) => r.patient_id === pId);
  const latestResults = patientReports.length > 0 ? patientReports[0].results : [];

  const highlights = mapPatientToAnatomy(p.conditions, p.symptoms, latestResults);
  res.json({
    patient_id: pId,
    highlights,
    totalIssues: highlights.length,
  });
});

// =========================================================================
// VITE MIDDLEWARE & STATIC ASSETS
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const frontendDir = path.resolve(__dirname, '../../frontend');
    const vite = await createViteServer({
      root: frontendDir,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MedLens] Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

// Export app instance for serverless environments (e.g., Vercel)
export default app;

if (!process.env.VERCEL) {
  startServer();
}
