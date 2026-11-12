import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { analyzeProject } from '../../services/aiService';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../shared/Button';
import SectionHelpButton from '../shared/SectionHelpButton';
import ReactMarkdown from 'react-markdown';

type PulseScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'ready'; insight: string }
  | { status: 'error'; message: string };

const AIPulseAnalysis: React.FC = () => {
  const { state } = useProject();
  const [scanState, setScanState] = useState<PulseScanState>({ status: 'idle' });

  const generateInsight = async () => {
    setScanState({ status: 'scanning' });
    try {
      const res = await analyzeProject(state);
      setScanState({ status: 'ready', insight: res });
    } catch (e) {
      setScanState({
        status: 'error',
        message: e instanceof Error ? e.message : 'AI synchronization failed',
      });
    }
  };

  return (
    <div className="card h-full flex flex-col overflow-hidden bg-[var(--color-surface)] border border-[var(--color-divider)] relative shadow-xs rounded-xl">
      <div className="p-5 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] flex items-center justify-center shadow-xs">
             <Brain size={18} />
           </div>
           <div className="flex items-center gap-1.5">
             <h3 className="font-display font-bold text-sm text-[var(--color-text)] tracking-tight">Executive Telemetry Radar</h3>
             <SectionHelpButton view="dash" section="AI Pulse Analysis" label="AI Pulse Analysis guide" />
           </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 rounded-lg cursor-pointer"
          onClick={generateInsight}
          disabled={scanState.status === 'scanning'}
          title="Refresh Analysis"
        >
          <RefreshCw size={14} className={scanState.status === 'scanning' ? "motion-safe:animate-spin" : "text-[var(--color-primary-hex)]"} />
        </Button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto custom-scroll relative min-h-[300px]">
        {scanState.status === 'scanning' && (
           <div className="absolute inset-0 bg-[var(--color-surface)]/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
              <div className="w-10 h-10 border-3 border-[var(--color-divider)] border-t-[var(--color-primary-hex)] rounded-full motion-safe:animate-spin mb-3" />
              <div className="text-xs font-semibold text-[var(--color-primary-hex)] motion-safe:animate-pulse">Scanning telemetry…</div>
           </div>
        )}

        {scanState.status === 'error' && (
           <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs font-medium text-rose-500 leading-relaxed">
                 {scanState.message}
                 <button onClick={generateInsight} className="block mt-2 underline cursor-pointer">Retry Sync</button>
              </div>
           </div>
        )}

        {scanState.status === 'ready' ? (
           <div className="prose prose-sm max-w-none">
              <div className="text-xs leading-relaxed text-[var(--color-text)]">
                 <ReactMarkdown>{scanState.insight}</ReactMarkdown>
              </div>
           </div>
        ) : scanState.status === 'idle' && (
           <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-2xl flex items-center justify-center text-[var(--color-text-muted)] mb-3">
                 <Brain size={28} />
              </div>
              <h4 className="font-bold text-sm text-[var(--color-text)]">Diagnostic Sweep Idle</h4>
              <button 
                onClick={generateInsight}
                className="mt-5 px-5 py-2 bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] hover:opacity-95 rounded-lg text-xs font-semibold shadow-sm transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-primary-hex)]"
              >
                 Run Diagnosis
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default AIPulseAnalysis;
