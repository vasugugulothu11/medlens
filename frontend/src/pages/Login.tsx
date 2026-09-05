import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Activity,
  ShieldCheck,
  Lock,
  Mail,
  Key,
  UserCheck,
  Stethoscope,
  User,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'Clinician' | 'Patient' | 'Administrator'>('Clinician');
  const [email, setEmail] = useState('s.vance@medlens.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      login(email, role, fullName || undefined);
      setIsLoading(false);
      navigate('/');
    }, 600);
  };

  const handleQuickDemo = (demoRole: 'Clinician' | 'Patient') => {
    setIsLoading(true);
    setTimeout(() => {
      if (demoRole === 'Clinician') {
        login('doctor@medlens.ai', 'Clinician', 'Dr. Sarah Vance, MD');
      } else {
        login('patient@medlens.ai', 'Patient', 'Eleanor Vance');
      }
      setIsLoading(false);
      navigate('/');
    }, 400);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative z-10">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-teal-400 text-slate-950 shadow-xl shadow-cyan-500/25 mb-4 group">
            <Activity className="w-8 h-8 stroke-[2.5] group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Med<span className="text-gradient-cyan">Lens</span> Access
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Clinical Information Intelligence Platform
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-panel border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl bg-[#090e1a]/90 relative overflow-hidden">
          {/* Top Security Banner */}
          <div className="flex items-center justify-between bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] mb-6">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>256-Bit Encrypted Session</span>
            </div>
            <span className="text-emerald-400 font-mono font-bold text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              HIPAA Compliant
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                !isRegister
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                isRegister
                  ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selector */}
          <div className="mb-5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Select Portal Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('Clinician')}
                className={`p-3 rounded-2xl border flex items-center gap-2 text-left transition ${
                  role === 'Clinician'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md glow-cyan'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Stethoscope className={`w-4 h-4 ${role === 'Clinician' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold">Clinician</div>
                  <div className="text-[10px] text-slate-400">MD / Care Team</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('Patient')}
                className={`p-3 rounded-2xl border flex items-center gap-2 text-left transition ${
                  role === 'Patient'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-md glow-cyan'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <User className={`w-4 h-4 ${role === 'Patient' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold">Patient</div>
                  <div className="text-[10px] text-slate-400">Personal Access</div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required={isRegister}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={role === 'Clinician' ? 'Dr. Sarah Vance, MD' : 'Eleanor Vance'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Security Password</label>
                {!isRegister && (
                  <button type="button" className="text-[11px] text-cyan-400 hover:underline">
                    Forgot key?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>{isRegister ? 'Register & Authenticate' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Presets */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2.5 text-center">
              Instant 1-Click Demo Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('Clinician')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold text-white group-hover:text-cyan-300 truncate">
                    Clinician Demo
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">Dr. Vance, MD</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('Patient')}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold text-white group-hover:text-cyan-300 truncate">
                    Patient Demo
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">Eleanor Vance</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Non-diagnostic clinical workstation • Audit provenance enabled</span>
        </p>
      </motion.div>
    </div>
  );
};
