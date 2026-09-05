import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Users, UserPlus, FileText, ClipboardList, ShieldAlert, Cpu, Award } from 'lucide-react';
import { usePatient } from '../context/PatientContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { patients, currentPatient, setCurrentPatientId } = usePatient();

  const patientId = currentPatient?.id;

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#090e1a]/80 border-b border-slate-800/80 shadow-2xl">
      {/* Safety Notice Bar */}
      <div className="bg-[#0b1222]/90 text-slate-300 text-xs px-4 py-1.5 flex items-center border-b border-cyan-950/60">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span className="truncate text-[11px] tracking-wide">
            <strong className="text-amber-300 font-semibold uppercase tracking-wider">Clinical Decision Support Prototype:</strong> MedLens structures & audits clinical records. It does <em>not</em> replace medical diagnosis or prescribe dosage.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 font-black stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">
                  Med<span className="text-gradient-cyan">Lens</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  3D Clinical Intelligence
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 backdrop-blur-md">
              <Link
                to="/patients"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive('/patients') && !isActive('/patients/new')
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Directory
              </Link>

              <Link
                to="/patients/new"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  isActive('/patients/new')
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Intake
              </Link>

              {patientId && (
                <>
                  <span className="text-slate-700 mx-0.5">|</span>
                  <Link
                    to={`/patients/${patientId}/report`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isActive(`/patients/${patientId}/report`)
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Upload Lab
                  </Link>

                  <Link
                    to={`/patients/${patientId}/record`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isActive(`/patients/${patientId}/record`)
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    Record
                  </Link>

                  <Link
                    to={`/patients/${patientId}/anatomy`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isActive(`/patients/${patientId}/anatomy`)
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/30'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 text-rose-400" />
                    3D Anatomy
                  </Link>
                </>
              )}

              {/* AI Evaluator Hub Shortcut */}
              <Link
                to="/evaluator"
                className={`ml-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                  isActive('/evaluator')
                    ? 'bg-cyan-950/80 text-cyan-200 border-cyan-500 shadow-md glow-cyan'
                    : 'bg-slate-900/90 hover:bg-cyan-950/50 text-cyan-300 border-slate-700'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Evaluator</span>
              </Link>
            </nav>
          </div>

          {/* Active Patient Cohort Switcher */}
          <div className="flex items-center gap-3">
            {patients.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-400 hidden lg:inline">Active Patient:</span>
                <select
                  aria-label="Active Patient"
                  value={patientId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    if (id) {
                      setCurrentPatientId(id);
                      if (location.pathname.includes('/record') || location.pathname.includes('/anatomy') || location.pathname.includes('/report')) {
                        const subPath = location.pathname.split('/').pop();
                        navigate(`/patients/${id}/${subPath}`);
                      }
                    }
                  }}
                  className="text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 font-semibold text-slate-200 focus:border-cyan-500 outline-none max-w-[180px] sm:max-w-[220px] truncate shadow-inner"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                      #{p.id} {p.name || 'Anonymous'} ({p.age}y {p.sex})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link
              to="/patients/new"
              className="glass-button px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">New Patient</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
