import React, { useState } from 'react';
import { Sparkles, HelpCircle, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import type { Summary } from '../types';
import { api } from '../api';

interface SummaryCardProps {
  patientId: number;
  initialSummary?: Summary | null;
  onSummaryGenerated?: (summary: Summary) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  patientId,
  initialSummary,
  onSummaryGenerated,
}) => {
  const [summary, setSummary] = useState<Summary | null>(initialSummary || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSummary) setSummary(initialSummary);
  }, [initialSummary]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateSummary(patientId, 'en');
      setSummary(res);
      if (onSummaryGenerated) onSummaryGenerated(res);
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to generate patient-friendly summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 text-[10px] font-bold tracking-widest uppercase">
              AI-Generated
            </span>
            <h3 className="text-lg font-bold text-white">
              Patient-Friendly Clinical Summary & Clinician Q&A
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Synthesizes report findings in cautious, non-diagnostic language to foster doctor-patient dialogue.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="glass-button font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
              Synthesizing...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              {summary ? 'Regenerate Summary' : 'Generate Summary'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {summary ? (
        <div className="space-y-5">
          {/* Summary Text Paragraphs */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 font-sans">
            {summary.summary_text.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Clinician Questions */}
          {summary.questions && summary.questions.length > 0 && (
            <div className="bg-cyan-950/30 border border-cyan-800/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 text-cyan-300 font-extrabold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Neutral Discussion Questions For Your Clinician
              </div>
              <ul className="space-y-2.5">
                {summary.questions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs text-slate-200 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-cyan-600/80 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-xs">
                      {idx + 1}
                    </span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Persistent Non-Diagnostic Disclaimer */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300">Disclaimer:</strong> This summary is AI-generated and is not a medical diagnosis or treatment prescription. Discuss these findings directly with your provider.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-xs text-slate-400 mb-4">
            No summary generated yet for this patient record. Click below to synthesize intake baseline and parsed lab results into understandable notes and questions.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="glass-button text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            Generate Patient-Friendly Summary
          </button>
        </div>
      )}
    </div>
  );
};
