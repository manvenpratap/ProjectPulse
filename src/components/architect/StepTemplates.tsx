import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  BookOpen, 
  Trash2, 
  Edit2, 
  Plus, 
  Layers,
  ArrowRight,
  Clock,
  Zap,
  Info,
  CheckCircle2
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { StepTemplate } from '../../types';

const StepTemplates: React.FC = () => {
  const { state, updateProject } = useProject();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const templates = state.stepTemplates || [];

  const handleAddTemplate = () => {
    const newTpl: StepTemplate = {
      name: 'New Technical Workflow',
      category: 'General',
      steps: [
        { name: 'Initial Requirement', effort: 1 },
        { name: 'Development', effort: 3 },
        { name: 'Validation', effort: 1 }
      ]
    };
    updateProject({ stepTemplates: [...templates, newTpl] });
  };

  const removeTemplate = (idx: number) => {
    if (confirm('Delete this technical workflow blueprint?')) {
      const updated = templates.filter((_, i) => i !== idx);
      updateProject({ stepTemplates: updated });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll">
      <div className="px-8 py-12 max-w-[1400px] mx-auto w-full">
        <div className="flex items-end justify-between mb-12 border-b border-[var(--color-divider)] pb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-200">Process Automation</div>
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight text-[var(--color-text)] mb-4 flex items-center gap-4">
              <BookOpen className="text-emerald-500" />
              Step Blueprints
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm max-w-xl leading-relaxed">
              Define reusable technical workflow sequences. These blueprints can be applied to any module to instantly generate granular task histories and effort estimates.
            </p>
          </div>
          
          <Button variant="primary" size="sm" onClick={handleAddTemplate} className="h-10 px-8 rounded-xl font-bold bg-emerald-600 border-emerald-600 shadow-emerald-100">
             <Plus size={18} className="mr-2" /> New Blueprint
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((tpl, i) => {
            const totalEffort = tpl.steps.reduce((s, st) => s + st.effort, 0);
            
            return (
              <div key={i} className="card glass p-8 flex flex-col group hover:border-emerald-500/30 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                    <Zap size={22} />
                  </div>
                  <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setEditingIdx(i)}>
                        <Edit2 size={14} />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500" onClick={() => removeTemplate(i)}>
                        <Trash2 size={14} />
                     </Button>
                  </div>
                </div>

                <div className="mb-6">
                   <h3 className="font-black text-xl text-[var(--color-text)] leading-tight mb-1">{tpl.name}</h3>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{tpl.category} Mapping</span>
                      <div className="w-1 h-1 rounded-full bg-[var(--color-divider)]" />
                      <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-tight">{totalEffort}d total effort</span>
                   </div>
                </div>

                <div className="flex-1 bg-[var(--color-surface-offset)]/50 rounded-2xl p-4 border border-[var(--color-divider)] border-dashed">
                   <div className="text-[9px] font-black text-[var(--color-text-faint)] uppercase tracking-widest mb-3">Sequence Flow</div>
                   <div className="space-y-3">
                      {tpl.steps.map((st, si) => (
                        <div key={si} className="flex items-center justify-between group/step">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                              <span className="text-xs font-bold text-[var(--color-text-muted)] group-hover/step:text-[var(--color-text)] transition-colors">{st.name}</span>
                           </div>
                           <div className="flex items-center gap-1.5 opacity-60 text-[10px] font-mono font-bold">
                              <Clock size={10} />
                              {st.effort}d
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--color-divider)] flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(j => (
                        <div key={j} className="w-6 h-6 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-divider)] flex items-center justify-center">
                           <span className="text-[6px] font-black">{j}</span>
                        </div>
                      ))}
                   </div>
                   <span className="text-[10px] font-black text-[var(--color-text-faint)] uppercase tracking-widest">{tpl.steps.length} Steps</span>
                </div>
              </div>
            );
          })}

          {templates.length === 0 && (
            <div className="col-span-full py-32 bg-[var(--color-surface-offset)]/30 rounded-3xl border-2 border-dashed border-[var(--color-divider)] flex flex-col items-center justify-center text-[var(--color-text-faint)] text-center px-12">
               <BookOpen size={64} strokeWidth={1} className="mb-6 opacity-20" />
               <h3 className="text-2xl font-black text-[var(--color-text-muted)]">No Technical Blueprints</h3>
               <p className="text-sm max-w-sm mt-2 leading-relaxed">Define standardized operational steps for common tasks (e.g. Design, Build, Test) to automate your planning phase.</p>
               <Button variant="primary" className="mt-8 rounded-xl font-bold px-10 bg-emerald-600 border-emerald-600" onClick={handleAddTemplate}>
                  Instantiate Blueprint Engine
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepTemplates;
