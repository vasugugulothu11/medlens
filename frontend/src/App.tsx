import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PatientProvider } from './context/PatientContext';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { Home } from './pages/Home';
import { Patients } from './pages/Patients';
import { Intake } from './pages/Intake';
import { ReportPage } from './pages/Report';
import { RecordPage } from './pages/Record';
import { AnatomyPage } from './pages/Anatomy';
import { Evaluator } from './pages/Evaluator';
import { Background3D } from './components/Background3D';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <PatientProvider>
        <div className="min-h-screen bg-[#070b16] text-slate-100 flex font-sans antialiased relative selection:bg-cyan-500/30 selection:text-cyan-200">
          {/* Ambient Interactive 3D Canvas Layer */}
          <Background3D />

          {/* Left Glass Sidebar (Fixed Dashboard) */}
          <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          {/* Main Dashboard Content Region (Offset for Left Sidebar) */}
          <div className="flex-1 md:pl-64 min-h-screen flex flex-col relative z-10 w-full">
            {/* Top Workstation Header Bar */}
            <HeaderBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Dynamic Viewport */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/new" element={<Intake />} />
                <Route path="/patients/:id" element={<RecordPage />} />
                <Route path="/patients/:id/report" element={<ReportPage />} />
                <Route path="/patients/:id/record" element={<RecordPage />} />
                <Route path="/patients/:id/anatomy" element={<AnatomyPage />} />
                <Route path="/evaluator" element={<Evaluator />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Glassmorphic Footer */}
            <footer className="glass-panel border-t border-slate-800/80 mt-auto py-5 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-wider">MedLens Dashboard</span>
                  <span>•</span>
                  <span className="text-slate-300">Clinical Intelligence System</span>
                </div>

                <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-medium bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/50">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Deterministic Auditing • Provenance Lineage • Non-Diagnostic</span>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </PatientProvider>
    </BrowserRouter>
  );
}
