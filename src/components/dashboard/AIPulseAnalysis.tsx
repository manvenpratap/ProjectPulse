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
    <div className="card h-full flex flex-col overflow-hidden bg-white/50 backdrop-blur-md border-[var(--color-divider)] relative">
      <div className="p-6 border-b border-[var(--color-divider)] flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
             <Brain size={20} />
           </div>
           <div>
             <h3 className="font-display font-black text-sm tracking-tight">AI Strategic Radar</h3>
             <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Predictive Insights</p>
           </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 rounded-lg"
          onClick={generateInsight}
          disabled={loading}
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="text-indigo-500" />}
        </Button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto custom-scroll relative min-h-[300px]">
        {loading && (
           <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <div className="text-xs font-black uppercase tracking-widest text-indigo-600 animate-pulse">Scanning Telemetry...</div>
           </div>
        )}

        {error && (
           <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="text-[11px] font-bold text-red-700 leading-relaxed">
                 {error}
                 <button onClick={generateInsight} className="block mt-2 underline">Retry Sync</button>
              </div>
           </div>
        )}

        {insight ? (
           <div className="prose prose-sm prose-slate max-w-none">
              <div className="text-[13px] leading-relaxed text-slate-700">
                 <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
           </div>
        ) : !loading && (
           <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                 <Brain size={32} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Project Mind Offline</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                 Initialize diagnostic sweep to generate AI-driven status insights and risk assessment.
              </p>
              <Button 
                variant="primary" 
                size="sm" 
                className="mt-6 px-6 bg-indigo-600 shadow-md shadow-indigo-100"
                onClick={generateInsight}
              >
                 Run Diagnosis
              </Button>
           </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--color-divider)] bg-slate-50/50 flex items-center justify-between">
         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Model: Gemini 1.5 Flash
         </span>
         <span className="text-[9px] font-mono font-bold text-slate-300">v2.4.0-AI</span>
      </div>
    </div>
  );
};

export default AIPulseAnalysis;
