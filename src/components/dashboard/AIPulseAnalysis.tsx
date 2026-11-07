import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { analyzeProject } from '../../services/aiService';
import { Brain, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../shared/Button';
import ReactMarkdown from 'react-markdown';

const AIPulseAnalysis: React.FC = () => {
  const { state } = useProject();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeProject(state);
      setInsight(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI synchronization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-full flex flex-col overflow-hidden bg-[var(--color-surface)] border border-[var(--color-divider)] relative shadow-sm rounded-2xl">
      <div className="p-5 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] flex items-center justify-center shadow-sm">
             <Brain size={18} />
           </div>
           <div>
             <h3 className="font-display font-bold text-sm text-[var(--color-text)] tracking-tight">AI Strategic Radar</h3>
             <p className="text-xs text-[var(--color-text-muted)] font-medium">Predictive telemetry &amp; risks</p>
           </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 rounded-lg"
          onClick={generateInsight}
          disabled={loading}
        >
          {loading ? <RefreshCw size={14} className="motion-safe:animate-spin" /> : <Sparkles size={14} className="text-[var(--color-primary-hex)]" />}
        </Button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto custom-scroll relative min-h-[300px]">
        {loading && (
           <div className="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
              <div className="w-10 h-10 border-3 border-[var(--color-divider)] border-t-[var(--color-primary-hex)] rounded-full motion-safe:animate-spin mb-3" />
              <div className="text-xs font-semibold text-[var(--color-primary-hex)] motion-safe:animate-pulse">Scanning telemetry…</div>
           </div>
        )}

        {error && (
           <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs font-medium text-rose-500 leading-relaxed">
                 {error}
                 <button onClick={generateInsight} className="block mt-2 underline cursor-pointer">Retry Sync</button>
              </div>
           </div>
        )}

        {insight ? (
           <div className="prose prose-sm max-w-none">
              <div className="text-xs leading-relaxed text-[var(--color-text)]">
                 <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
           </div>
        ) : !loading && (
           <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-2xl flex items-center justify-center text-[var(--color-text-muted)] mb-3">
                 <Brain size={28} />
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text)]">Project Mind Offline</h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5 max-w-[220px] leading-relaxed">
                 Initialize diagnostic sweep to generate AI-driven status insights and risk assessment.
              </p>
              <button 
                onClick={generateInsight}
                className="mt-5 px-5 py-2 bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] hover:opacity-95 rounded-lg text-xs font-semibold shadow-sm transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-primary-hex)]"
              >
                 Run Diagnosis
              </button>
           </div>
        )}
      </div>

      <div className="p-3.5 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-between text-xs">
         <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Model: Gemini 1.5 Flash
         </span>
         <span className="font-mono text-xs text-[var(--color-text-faint)]">v2.4.0-AI</span>
      </div>
    </div>
  );
};

export default AIPulseAnalysis;
