import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Edit2, Check, X, Info, ShieldCheck, Flag } from 'lucide-react';
import type { LabResult, LabStatus, VerificationStatus } from '../types';
import { api } from '../api';

interface LabTableProps {
  results: LabResult[];
  onResultUpdated?: (updated: LabResult) => void;
}

export const LabTable: React.FC<LabTableProps> = ({ results: initialResults, onResultUpdated }) => {
  const [results, setResults] = useState<LabResult[]>(initialResults);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editRange, setEditRange] = useState('');
  const [expandedSnippetId, setExpandedSnippetId] = useState<number | null>(null);

  // Sync with prop changes
  React.useEffect(() => {
    setResults(initialResults);
  }, [initialResults]);

  const startEdit = (result: LabResult) => {
    setEditingId(result.id);
    setEditValue(result.value);
    setEditRange(result.reference_range || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (resultId: number) => {
    try {
      const updated = await api.updateLabResult(resultId, {
        value: editValue,
        reference_range: editRange,
        verification_status: 'user_verified',
      });
      setResults((prev) => prev.map((r) => (r.id === resultId ? updated : r)));
      if (onResultUpdated) onResultUpdated(updated);
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update lab result:', err);
    }
  };

  const handleStatusChange = async (resultId: number, status: VerificationStatus) => {
    try {
      const updated = await api.updateLabResult(resultId, {
        verification_status: status,
      });
      setResults((prev) => prev.map((r) => (r.id === resultId ? updated : r)));
      if (onResultUpdated) onResultUpdated(updated);
    } catch (err) {
      console.error('Failed to change verification status:', err);
    }
  };

  const getStatusBadge = (status: LabStatus) => {
    switch (status) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-black bg-rose-950/80 text-rose-300 border border-rose-500/50 glow-rose">
            HIGH
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-black bg-amber-950/80 text-amber-300 border border-amber-500/50 glow-amber">
            LOW
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 glow-emerald">
            NORMAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900/80 text-slate-400 border border-slate-700">
            UNAVAILABLE
          </span>
        );
    }
  };

  const getConfidenceBadge = (conf: string) => {
    switch (conf.toLowerCase()) {
      case 'high':
        return <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40 uppercase">High</span>;
      case 'medium':
        return <span className="text-[10px] font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/40 uppercase">Medium</span>;
      default:
        return <span className="text-[10px] font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 uppercase">Low</span>;
    }
  };

  if (!results || results.length === 0) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl text-slate-400 text-xs italic">
        No laboratory results recorded for this report.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass-card rounded-2xl border border-slate-800 shadow-2xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300 text-[11px] font-extrabold uppercase tracking-wider">
            <th className="py-4 px-4">Test Name</th>
            <th className="py-4 px-4">Value</th>
            <th className="py-4 px-4">Units</th>
            <th className="py-4 px-4">Printed Reference Range</th>
            <th className="py-4 px-4">Computed Status</th>
            <th className="py-4 px-4">AI Confidence</th>
            <th className="py-4 px-4">Source Provenance</th>
            <th className="py-4 px-4 text-right">Verification</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono">
          {results.map((r) => {
            const isEditing = editingId === r.id;
            const isSnippetOpen = expandedSnippetId === r.id;

            return (
              <React.Fragment key={r.id}>
                <tr className={`hover:bg-cyan-950/20 transition ${r.status === 'high' ? 'bg-rose-950/10' : r.status === 'low' ? 'bg-amber-950/10' : ''}`}>
                  {/* Test Name */}
                  <td className="py-3.5 px-4 font-sans font-bold text-white">
                    {r.test_name}
                  </td>

                  {/* Value */}
                  <td className="py-3.5 px-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 text-xs font-bold glass-input rounded px-2 py-1 outline-none text-white border-cyan-500"
                      />
                    ) : (
                      <span className="font-bold text-cyan-300">{r.value}</span>
                    )}
                  </td>

                  {/* Units */}
                  <td className="py-3.5 px-4 text-slate-400">
                    {r.units || <span className="text-slate-600">—</span>}
                  </td>

                  {/* Reference Range */}
                  <td className="py-3.5 px-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editRange}
                        onChange={(e) => setEditRange(e.target.value)}
                        className="w-28 text-xs font-bold glass-input rounded px-2 py-1 outline-none text-white border-cyan-500"
                      />
                    ) : (
                      <span className="text-slate-300">{r.reference_range || <span className="text-slate-600 italic">None printed</span>}</span>
                    )}
                  </td>

                  {/* Computed Status */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(r.status)}
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-4">
                    {getConfidenceBadge(r.confidence || 'high')}
                  </td>

                  {/* Source Snippet Inspect Button */}
                  <td className="py-3.5 px-4 font-sans">
                    <button
                      onClick={() => setExpandedSnippetId(isSnippetOpen ? null : r.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold transition"
                    >
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isSnippetOpen ? 'Hide Text' : 'Source Excerpt'}</span>
                    </button>
                  </td>

                  {/* Verification Actions */}
                  <td className="py-3.5 px-4 text-right font-sans">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => saveEdit(r.id)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                          title="Save Changes"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Cancel Edit"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {r.verification_status === 'user_verified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 text-[10px] font-bold border border-emerald-800/60">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Verified
                          </span>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(r.id, 'user_verified')}
                            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-emerald-950/80 text-slate-400 hover:text-emerald-300 text-[10px] font-semibold border border-slate-800 hover:border-emerald-800/60 transition"
                          >
                            Mark Verified
                          </button>
                        )}

                        <button
                          onClick={() => startEdit(r)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition"
                          title="Edit Lab Values"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* Expanded Source Snippet Lineage Row */}
                {isSnippetOpen && (
                  <tr className="bg-slate-950/90 font-mono">
                    <td colSpan={8} className="p-4 border-t border-slate-800">
                      <div className="text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between text-cyan-400 font-sans font-bold text-xs">
                          <span>Raw Pathology Source Lineage Excerpt</span>
                          <span>Report ID #{r.report_id}</span>
                        </div>
                        <p className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-200 select-all font-mono leading-relaxed">
                          "{r.source_snippet || 'No source text snippet recorded for this entry.'}"
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
