import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Search, RefreshCw } from 'lucide-react';
import { PatientList } from '../components/PatientList';
import { usePatient } from '../context/PatientContext';

export const Patients: React.FC = () => {
  const { patients, loading, refreshPatients } = usePatient();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(term);
    const condMatch = (p.conditions || []).some((c) => c.toLowerCase().includes(term));
    const sympMatch = (p.symptoms || '').toLowerCase().includes(term);
    return nameMatch || condMatch || sympMatch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Patient Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage multiple patient records, demographic details, and clinical histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshPatients()}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow-2xs"
            title="Refresh patient list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          <Link
            to="/patients/new"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            Register New Patient
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by patient name, condition (e.g. Diabetes, Hypertension), or symptom..."
          className="w-full text-sm pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition shadow-2xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {loading && patients.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading clinical patient cohort...
        </div>
      ) : (
        <PatientList patients={filteredPatients} />
      )}
    </div>
  );
};
