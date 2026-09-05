import React from 'react';
import { Menu, ShieldAlert, Sparkles, UserPlus, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';

export const HeaderBar: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const { currentPatient } = usePatient();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#090e1a]/85 border-b border-slate-800/80 shadow-lg">
      {/* Top Clinical Safety Notice Ticker */}
      <div className="bg-[#0b1222]/90 text-slate-300 text-[11px] px-4 py-1.5 border-b border-cyan-950/60 font-sans flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span className="truncate">
            <strong className="text-amber-300 font-semibold uppercase tracking-wider">Clinical Decision Support:</strong> MedLens structures & audits clinical records. It does <em>not</em> replace medical diagnosis or prescribe dosage.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {currentPatient && (
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold text-white">Active Patient:</span>
              <span className="text-cyan-300 font-mono font-semibold">
                #{currentPatient.id} {currentPatient.name || 'Anonymous'} ({currentPatient.age}y {currentPatient.sex})
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Shortcuts */}
        <div className="flex items-center gap-3">
          <Link
            to="/patients/new"
            className="glass-button px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">New Intake</span>
          </Link>

          <Link
            to="/evaluator"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition flex items-center gap-1.5 shadow-md"
          >
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Evaluator Suite</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
