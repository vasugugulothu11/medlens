import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Cpu,
  ArrowRight,
  Database,
  Sparkles,
  Award,
  Zap,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { usePatient } from '../context/PatientContext';

export const Home: React.FC = () => {
  const { patients, currentPatient, setCurrentPatientId } = usePatient();
  const navigate = useNavigate();

  const handleSelectDemo = (id: number) => {
    setCurrentPatientId(id);
    navigate(`/patients/${id}/record`);
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4">
      {/* Hero Section - High Tech Clinical Workstation */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-cyan-500/30"
      >
        {/* Specular Ambient Glow Overlay */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                AI-Powered Clinical Information Intelligence System
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white mb-4">
                Clinical Precision Through <br />
                <span className="text-gradient-cyan">
                  Deterministic Audits & 3D Anatomy
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-2xl">
                Transforming unstructured clinical pathology reports into audited, structured medical records with mathematical range interval parsing, three-tier provenance, and real-time 3D anatomical organ mapping.
              </p>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl group">
                <img
                  src="/assets/premium_clinic_hero.jpg"
                  alt="Premium Medical Clinic Intelligence Center Workstation"
                  className="w-full h-64 sm:h-72 object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] text-cyan-300 font-mono flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold">Clinic Intelligence Center</span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Workstation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/evaluator"
              className="glass-button px-6 py-3 rounded-xl font-extrabold text-sm inline-flex items-center gap-2 shadow-xl glow-cyan"
            >
              <Award className="w-4 h-4 text-cyan-300" />
              Launch AI Evaluator Suite
            </Link>

            <Link
              to="/patients"
              className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700/80 transition flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Patient Directory ({patients.length})
            </Link>

            {currentPatient && (
              <Link
                to={`/patients/${currentPatient.id}/anatomy`}
                className="px-5 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-semibold text-sm border border-rose-500/40 transition flex items-center gap-2"
              >
                <Cpu className="w-4 h-4 text-rose-400" />
                3D Anatomy Engine
              </Link>
            )}
          </div>
        </div>

        {/* Live System Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-6 border-t border-slate-800/80 text-center relative z-10">
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Range Accuracy</span>
            <span className="text-xl sm:text-2xl font-black text-cyan-400">100% Math</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Provenance Audit</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">3-Tier Trace</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Spatial 3D Engine</span>
            <span className="text-xl sm:text-2xl font-black text-rose-400">Three.js</span>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Safety Guardrails</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">Non-Diagnostic</span>
          </div>
        </div>
      </motion.section>

      {/* Core Architectural Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="glass-card-interactive rounded-3xl p-6 sm:p-7 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center mb-5 shadow-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 mb-1 block">Mathematical Rigor</span>
          <h3 className="font-bold text-white text-lg mb-2">Deterministic Range Engine</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Evaluates Low/Normal/High status strictly using printed document intervals. Zero LLM guessing ensures laboratory math is 100% reproducible and auditable.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="glass-card-interactive rounded-3xl p-6 sm:p-7 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-5 shadow-lg">
            <Database className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 mb-1 block">Full Traceability</span>
          <h3 className="font-bold text-white text-lg mb-2">Three-Tier Provenance</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Observations are partitioned into <em>User-provided</em>, <em>AI-extracted</em> (with exact raw source snippets), and <em>AI-generated</em> summaries with human verification toggles.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="glass-card-interactive rounded-3xl p-6 sm:p-7 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mb-5 shadow-lg">
            <Cpu className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 mb-1 block">Spatial Intelligence</span>
          <h3 className="font-bold text-white text-lg mb-2">3D Anatomical Issue Mapping</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            WebGL & Three.js human mannequin with glowing emissive organ highlights (heart, pancreas, kidneys, liver, lungs) mapping clinical flags directly to physical biology.
          </p>
        </motion.div>
      </section>

      {/* Patient Cohort Carousel */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Multi-Patient Clinical Cohort
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any patient scenario to review their structured record, upload lab reports, or launch 3D anatomical visualization.
            </p>
          </div>
          <Link
            to="/patients/new"
            className="glass-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            + Add New Patient Profile
          </Link>
        </div>

        {patients.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs italic">
            No patients available yet. Click "New Patient Profile" to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patients.map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectDemo(p.id)}
                className="glass-card-interactive p-5 rounded-2xl cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                      ID #{p.id}
                    </span>
                    <span className="text-xs text-slate-400 font-medium capitalize">
                      {p.age}y {p.sex}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">{p.name || `Patient #${p.id}`}</h4>
                  <div className="text-xs text-slate-300 line-clamp-1 mb-4 font-mono">
                    {p.conditions.length > 0 ? p.conditions.join(' • ') : 'No recorded conditions'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-400 font-semibold group">
                  <span>Open Clinical Record</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
