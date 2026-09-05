import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  ClipboardList,
  Cpu,
  Award,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';

export const Sidebar: React.FC<{ isOpen: boolean; toggleSidebar: () => void }> = ({
  isOpen,
  toggleSidebar,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { patients, currentPatient, setCurrentPatientId } = usePatient();

  const patientId = currentPatient?.id;

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      label: 'Dashboard Overview',
      path: '/',
      icon: LayoutDashboard,
      badge: 'Main',
    },
    {
      label: 'Patient Cohort',
      path: '/patients',
      icon: Users,
      badge: `${patients.length}`,
    },
    {
      label: 'Clinical Intake',
      path: '/patients/new',
      icon: UserPlus,
    },
  ];

  const patientNavItems = patientId
    ? [
        {
          label: 'Patient Record',
          path: `/patients/${patientId}/record`,
          icon: ClipboardList,
          activeGlow: 'cyan',
        },
        {
          label: 'Upload Pathology',
          path: `/patients/${patientId}/report`,
          icon: FileText,
          activeGlow: 'sky',
        },
        {
          label: '3D Anatomy Model',
          path: `/patients/${patientId}/anatomy`,
          icon: Cpu,
          activeGlow: 'rose',
        },
      ]
    : [];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Left Glass Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#090e1a]/95 backdrop-blur-2xl border-r border-slate-800/80 shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xl font-black text-white tracking-tight flex items-center gap-1">
                Med<span className="text-gradient-cyan">Lens</span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest block">
                Clinical Intelligence
              </span>
            </div>
          </Link>

          <button
            onClick={toggleSidebar}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Patient Switcher Card */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
            Active Patient Selection
          </span>

          {patients.length > 0 ? (
            <select
              aria-label="Active Patient Switcher"
              value={patientId || ''}
              onChange={(e) => {
                const id = parseInt(e.target.value, 10);
                if (id) {
                  setCurrentPatientId(id);
                  if (
                    location.pathname.includes('/record') ||
                    location.pathname.includes('/anatomy') ||
                    location.pathname.includes('/report')
                  ) {
                    const subPath = location.pathname.split('/').pop();
                    navigate(`/patients/${id}/${subPath}`);
                  } else {
                    navigate(`/patients/${id}/record`);
                  }
                }
              }}
              className="w-full text-xs bg-slate-900 border border-slate-700/90 rounded-xl px-3 py-2 font-bold text-cyan-200 outline-none focus:border-cyan-500 shadow-inner truncate"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  #{p.id} {p.name || 'Anonymous'} ({p.age}y {p.sex})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-slate-500 italic">No patients in cohort</div>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {/* Main Workspace Navigation */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2.5 px-2">
              Core Platform
            </span>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path) && (item.path !== '/patients' || !location.pathname.startsWith('/patients/'));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isOpen && toggleSidebar()}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      active
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-md glow-cyan'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Patient Context Navigation */}
          {patientId && (
            <div>
              <div className="flex items-center justify-between px-2 mb-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
                  Patient Context (#{patientId})
                </span>
              </div>
              <nav className="space-y-1">
                {patientNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => isOpen && toggleSidebar()}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                        active
                          ? item.activeGlow === 'rose'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-md glow-rose'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-md glow-cyan'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? (item.activeGlow === 'rose' ? 'text-rose-400' : 'text-cyan-400') : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${active ? 'translate-x-0.5' : ''}`} />
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* AI Evaluator Console Link */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2.5 px-2">
              Evaluation & Audits
            </span>
            <Link
              to="/evaluator"
              onClick={() => isOpen && toggleSidebar()}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition border ${
                isActive('/evaluator')
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-500 shadow-md glow-cyan'
                  : 'bg-slate-900/90 hover:bg-cyan-950/40 text-cyan-300 border-slate-700/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>AI Evaluator</span>
              </div>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Live Suite
              </span>
            </Link>
          </div>
        </div>

        {/* Sidebar Footer Status */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>Range Engine: Deterministic</span>
          </div>
        </div>
      </aside>
    </>
  );
};
