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
import PageHeader from '../shared/PageHeader';

const StepTemplates: React.FC = () => {
  const { state, updateProject } = useProject();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<StepTemplate | null>(null);

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

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm(JSON.parse(JSON.stringify(templates[idx])));
  };

  const saveEdit = () => {
    if (editingIdx === null || !editForm) return;
    const newTemplates = [...templates];
    newTemplates[editingIdx] = editForm;
    updateProject({ stepTemplates: newTemplates });
    setEditingIdx(null);
    setEditForm(null);
  };

  const addStep = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      steps: [...editForm.steps, { name: 'New Step', effort: 1 }]
    });
  };

  const removeStep = (sIdx: number) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      steps: editForm.steps.filter((_, i) => i !== sIdx)
    });
  };

  const updateStep = (sIdx: number, field: 'name' | 'effort', val: any) => {
    if (!editForm) return;
    const newSteps = [...editForm.steps];
    newSteps[sIdx] = { ...newSteps[sIdx], [field]: val };
    setEditForm({ ...editForm, steps: newSteps });
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={BookOpen}
        title="Step Blueprints"
        subtitle={`${templates.length} Active Templates • Automated technical workflow sequences`}
        actions={
          <Button variant="primary" size="sm" onClick={handleAddTemplate} className="h-9 px-4">
            <Plus size={16} className="mr-1.5" /> New Blueprint
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl, i) => {
            const totalEffort = tpl.steps.reduce((s, st) => s + st.effort, 0);
            
            return (
              <div key={i} className="card glass p-8 flex flex-col group hover:border-emerald-500/30 transition-colors duration-150 cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                    <Zap size={22} />
                  </div>
                  <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={(e) => { e.stopPropagation(); startEdit(i); }}>
                        <Edit2 size={14} />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500" onClick={(e) => { e.stopPropagation(); removeTemplate(i); }}>
                        <Trash2 size={14} />
                     </Button>
                  </div>
                </div>

                <div className="mb-6">
                   <h3 className="font-black text-xl text-[var(--color-text)] leading-tight mb-1">{tpl.name}</h3>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-600">{tpl.category} mapping</span>
                      <div className="w-1 h-1 rounded-full bg-[var(--color-divider)]" />
                      <span className="text-xs font-normal text-[var(--color-text-faint)]">{totalEffort}d total effort</span>
                   </div>
                </div>

                <div className="flex-1 bg-[var(--color-surface-offset)]/50 rounded-2xl p-4 border border-[var(--color-divider)] border-dashed">
                   <div className="text-xs font-medium text-[var(--color-text-faint)] mb-3">Sequence flow</div>
                   <div className="space-y-3">
                      {(tpl.steps || []).map((st, si) => (
                        <div key={si} className="flex items-center justify-between group/step">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                              <span className="text-xs font-bold text-[var(--color-text-muted)] group-hover/step:text-[var(--color-text)] transition-colors">{st.name}</span>
                           </div>
                           <div className="flex items-center gap-1.5 opacity-60 text-xs font-mono font-medium">
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
                   <span className="text-xs font-medium text-[var(--color-text-faint)]">{tpl.steps.length} Steps</span>
                </div>
              </div>
            );
          })}

          {templates.length === 0 && (
            <div className="col-span-full py-32 bg-[var(--color-surface-offset)]/30 rounded-3xl border-2 border-dashed border-[var(--color-divider)] flex flex-col items-center justify-center text-[var(--color-text-faint)] text-center px-12">
               <BookOpen size={64} strokeWidth={1} className="mb-6 opacity-20" />
               <h3 className="text-2xl font-black text-[var(--color-text-muted)]">No Technical Blueprints</h3>
               <p className="text-sm max-w-sm mt-2 leading-relaxed">Define standardized operational steps for common tasks (e.g. Design, Build, Test) to automate your planning phase.</p>
               <Button variant="primary" className="mt-8 rounded-xl font-bold px-10" onClick={handleAddTemplate}>
                  Instantiate Blueprint Engine
               </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in duration-200">
           <div className="bg-[var(--color-bg)] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-divider)] motion-safe:animate-in motion-safe:zoom-in-95 duration-200">
              <div className="p-8 border-b border-[var(--color-divider)] flex justify-between items-center bg-emerald-50/30">
                 <h2 className="text-2xl font-black">Edit Blueprint</h2>
                 <button onClick={() => setEditForm(null)} className="p-2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors">
                    <CheckCircle2 size={24} />
                 </button>
              </div>
              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scroll">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-medium text-[var(--color-text-faint)] mb-2 block">Template name</label>
                       <input 
                          className="w-full h-12 px-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-emerald-500 transition-colors duration-150"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-medium text-[var(--color-text-faint)] mb-2 block">Category</label>
                       <select 
                          className="w-full h-12 px-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-emerald-500 transition-colors duration-150"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                       >
                          <option value="General">General</option>
                          <option value="GUI">GUI</option>
                          <option value="Server">Server</option>
                          <option value="DevOps">DevOps</option>
                          <option value="Security">Security</option>
                       </select>
                    </div>
                 </div>

                 <div>
                    <div className="flex justify-between items-center mb-4">
                       <label className="text-xs font-medium text-[var(--color-text-faint)]">Step sequence</label>
                       <Button variant="ghost" size="sm" className="h-8 text-emerald-600 font-bold" onClick={addStep}>
                          <Plus size={14} className="mr-1" /> Add Phase
                       </Button>
                    </div>
                    <div className="space-y-3">
                       {editForm.steps.map((st, si) => (
                         <div key={si} className="flex items-center gap-3 p-3 bg-[var(--color-surface-offset)] rounded-2xl border border-[var(--color-divider)] group/editstep">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-700 shrink-0">{si+1}</div>
                            <input 
                               className="flex-1 bg-transparent border-transparent font-bold text-sm outline-none focus:text-emerald-700"
                               value={st.name}
                               onChange={(e) => updateStep(si, 'name', e.target.value)}
                            />
                            <div className="flex items-center gap-2">
                               <input 
                                  type="number"
                                  className="w-16 h-8 px-2 bg-white border border-[var(--color-divider)] rounded-lg text-xs font-bold outline-none focus:border-emerald-500"
                                  value={st.effort}
                                  onChange={(e) => updateStep(si, 'effort', parseInt(e.target.value) || 0)}
                               />
                               <span className="text-[10px] font-black text-[var(--color-text-faint)]">days</span>
                            </div>
                            <button onClick={() => removeStep(si)} className="p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover/editstep:opacity-100 transition-opacity">
                               <Trash2 size={16} />
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-[var(--color-surface-offset)] flex gap-4">
                 <Button variant="ghost" className="flex-1 font-bold h-12 rounded-2xl" onClick={() => setEditForm(null)}>Cancel</Button>
                 <Button variant="primary" className="flex-1 font-black h-12 rounded-2xl bg-emerald-600 border-emerald-600 shadow-emerald-100" onClick={saveEdit}>Finalize Blueprint</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StepTemplates;
