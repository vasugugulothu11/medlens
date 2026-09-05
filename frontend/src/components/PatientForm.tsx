import React, { useState } from 'react';
import { Sparkles, Save, AlertCircle } from 'lucide-react';
import type { PatientCreateInput } from '../types';

interface PatientFormProps {
  onSubmit: (data: PatientCreateInput) => Promise<void>;
  isLoading?: boolean;
}

const DEMO_PATIENTS: PatientCreateInput[] = [
  {
    name: "Eleanor Vance",
    age: 58,
    sex: "female",
    symptoms: "Fatigue, intermittent shortness of breath during exertion, tingling sensation in both feet, and occasional lightheadedness.",
    conditions: ["Type 2 Diabetes", "Hypertension", "Hyperlipidemia"],
    allergies: ["Penicillin", "Sulfa drugs"],
    medications: ["Metformin 1000mg BID", "Lisinopril 20mg daily", "Atorvastatin 40mg daily", "Amoxicillin 500mg (prescribed for dental extraction)"],
    notes: "Patient reports numbness in extremities worsening over past 3 months. Last HbA1c checked 6 months ago. Dental clinic issued amoxicillin recently."
  },
  {
    name: "Marcus Holloway",
    age: 46,
    sex: "male",
    symptoms: "Flank discomfort, foamy urine, recurrent mild headaches, persistent ankle swelling in evenings.",
    conditions: ["Chronic Kidney Disease Stage 2", "Essential Hypertension"],
    allergies: ["Aspirin", "Ibuprofen (NSAIDs)"],
    medications: ["Amlodipine 10mg daily", "Ibuprofen 400mg PRN for headache"],
    notes: "Patient states he takes OTC Advil/Ibuprofen for tension headaches despite prior allergy note. Needs renal function and blood pressure review."
  },
  {
    name: "Dr. Arthur Pendelton",
    age: 63,
    sex: "male",
    symptoms: "Dry cough, mild wheezing in cold air, gastroesophageal reflux after dinner.",
    conditions: ["Mild Asthma", "GERD", "Hypothyroidism"],
    allergies: ["Codeine"],
    medications: ["Levothyroxine 75mcg daily", "Albuterol inhaler PRN", "Omeprazole 20mg daily"],
    notes: "Annual wellness checkup. Reports thyroid medication compliance is regular."
  }
];

export const PatientForm: React.FC<PatientFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<PatientCreateInput>({
    name: '',
    age: 45,
    sex: 'male',
    symptoms: '',
    conditions: [],
    allergies: [],
    medications: [],
    notes: ''
  });

  const [conditionsInput, setConditionsInput] = useState('');
  const [allergiesInput, setAllergiesInput] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadDemo = (demoIndex: number = 0) => {
    const demo = DEMO_PATIENTS[demoIndex % DEMO_PATIENTS.length];
    setFormData({ ...demo });
    setConditionsInput(demo.conditions.join(', '));
    setAllergiesInput(demo.allergies.join(', '));
    setMedicationsInput(demo.medications.join(', '));
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.age || formData.age <= 0 || formData.age > 130) {
      setValidationError('Please enter a valid age between 1 and 130.');
      return;
    }
    if (!formData.sex) {
      setValidationError('Please select patient sex.');
      return;
    }

    // Parse comma-separated lists
    const parsedConditions = conditionsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedAllergies = allergiesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const parsedMedications = medicationsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: PatientCreateInput = {
      ...formData,
      name: formData.name?.trim() || 'Anonymous Patient',
      conditions: parsedConditions,
      allergies: parsedAllergies,
      medications: parsedMedications,
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to register patient profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            Patient Clinical Intake Form
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Capture baseline clinical details provided directly by the patient or attending staff.
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 mr-1">Quick Demo Presets:</span>
          {DEMO_PATIENTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadDemo(idx)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-cyan-950/80 text-cyan-300 text-[11px] font-bold border border-slate-700 hover:border-cyan-500/50 transition"
            >
              Demo #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {validationError && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Basic Demographics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Full Name (Optional)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Eleanor Vance"
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs font-medium text-white outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Age (Years) *
          </label>
          <input
            type="number"
            min="1"
            max="130"
            required
            value={formData.age || ''}
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Biological Sex *
          </label>
          <select
            aria-label="Biological Sex"
            value={formData.sex}
            onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs font-medium text-white outline-none bg-slate-900"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Symptoms */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Reported Symptoms & Chief Complaint
        </label>
        <textarea
          rows={3}
          value={formData.symptoms}
          onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          placeholder="Describe symptoms, duration, severity..."
          className="w-full glass-input rounded-xl p-3.5 text-xs text-white outline-none"
        />
      </div>

      {/* Conditions, Allergies, Medications grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Diagnosed Conditions
          </label>
          <input
            type="text"
            value={conditionsInput}
            onChange={(e) => setConditionsInput(e.target.value)}
            placeholder="Type 2 Diabetes, Hypertension..."
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Comma-separated</span>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-rose-300 mb-1.5">
            Documented Allergies
          </label>
          <input
            type="text"
            value={allergiesInput}
            onChange={(e) => setAllergiesInput(e.target.value)}
            placeholder="Penicillin, Sulfa drugs..."
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-rose-200 outline-none border-rose-900/60 focus:border-rose-500"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Comma-separated</span>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Active Medications
          </label>
          <input
            type="text"
            value={medicationsInput}
            onChange={(e) => setMedicationsInput(e.target.value)}
            placeholder="Metformin 1000mg, Lisinopril..."
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
          />
          <span className="text-[10px] text-slate-500 mt-1 block">Comma-separated</span>
        </div>
      </div>

      {/* Clinical Notes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
          Additional Clinical Notes
        </label>
        <textarea
          rows={2}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Relevant medical context..."
          className="w-full glass-input rounded-xl p-3.5 text-xs text-white outline-none"
        />
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          User-Provided Baseline Layer (Traceable provenance)
        </span>
        <button
          type="submit"
          disabled={isLoading}
          className="glass-button font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-cyan-300" />
          {isLoading ? 'Saving Intake...' : 'Save Patient Profile'}
        </button>
      </div>
    </form>
  );
};
