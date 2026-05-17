import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Layers, 
  Plus, 
  Search, 
  Map, 
  Activity,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  XCircle
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { Feature } from '../../types';

const FunctionalMatrix: React.FC = () => {
  const { state, updateProject } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Feature | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const features = state.features || [];

  const handleAddFeature = () => {
    const newFeature: Feature = {
      name: 'New Strategic Feature',
      desc: 'Define the functional goal here.',
      screens: []
    };
    updateProject({ features: [...features, newFeature] });
  };

  const removeFeature = (idx: number) => {
    if (confirm('Permanently remove this strategic feature from the matrix?')) {
      const newFeatures = features.filter((_, i) => i !== idx);
      updateProject({ features: newFeatures });
    }
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...features[idx] });
  };

  const saveEdit = () => {
    if (editingIdx === null || !editForm) return;
    const newFeatures = [...features];
    newFeatures[editingIdx] = editForm;
    updateProject({ features: newFeatures });
    setEditingIdx(null);
    setEditForm(null);
  };

  const filteredFeatures = features.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll">
      <div className="px-8 py-12 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-[var(--color-text)] mb-2 flex items-center gap-3">
              <Map className="text-cyan-500" />
              Functional Matrix
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm font-medium">Mapping project strategy to architectural entities and modules.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input 
                  className="h-10 pl-10 pr-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold focus:border-indigo-500 outline-none w-64 transition-all shadow-sm"
                  placeholder="Filter matrix..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Button variant="primary" size="sm" onClick={handleAddFeature} className="h-10 rounded-xl font-bold px-6">
                <Plus size={18} className="mr-2" /> New Feature
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredFeatures.map((f, i) => {
              const actualIdx = features.indexOf(f);
              const screens = f.screens || [];
              const linkedTasks = state.tasks.filter(t => t.module === f.name || screens.includes(t.name));
              const avgProg = linkedTasks.length > 0 ? Math.round(linkedTasks.reduce((s,t) => s + (t.progress || 0), 0) / linkedTasks.length) : 0;
              
              return (
                <div key={i} className="card glass p-8 flex flex-col group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 group-hover:w-2 transition-all" />
                   
                   <div className="flex items-start justify-between mb-6">
                      <div className="space-y-1">
                         <h3 className="font-black text-xl text-[var(--color-text)] leading-tight">{f.name}</h3>
                         <div className="flex items-center gap-2">
                            <ShieldCheck size={12} className="text-cyan-500" />
                            <span className="text-[10px] font-black text-[var(--color-text-faint)] uppercase tracking-widest">Validated Feature</span>
                         </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => startEdit(actualIdx)}>
                            <Edit2 size={14} />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-red-500" onClick={() => removeFeature(actualIdx)}>
                            <Trash2 size={14} />
                         </Button>
                      </div>
                   </div>

                   <p className="text-sm text-[var(--color-text-muted)] mb-8 line-clamp-3 leading-relaxed min-h-[4.5rem]">
                      {f.desc}
                   </p>

                   <div className="mt-auto space-y-6">
                      <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-[var(--color-text-faint)] uppercase tracking-widest">Maturation</span>
                            <span className="text-lg font-display font-black text-cyan-500 leading-none">{avgProg}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 rounded-full transition-all duration-1000" style={{ width: `${avgProg}%` }} />
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                         {screens.slice(0, 4).map((s, si) => (
                           <span key={si} className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[10px] font-black rounded-lg border border-cyan-100">
                             {s}
                           </span>
                         ))}
                         {screens.length > 4 && (
                           <span className="px-2.5 py-1 bg-[var(--color-surface-offset)] text-[var(--color-text-faint)] text-[10px] font-black rounded-lg">
                             + {screens.length - 4}
                           </span>
                         )}
                      </div>

                      <button 
                        onClick={() => setSelectedFeature(f)}
                        className="flex items-center gap-2 text-[10px] font-black text-cyan-600 uppercase tracking-widest group-hover:gap-3 transition-all"
                      >
                         View feature details <ArrowRight size={12} />
                      </button>
                   </div>
                </div>
              );
           })}

           {features.length === 0 && (
             <div className="col-span-full py-32 flex flex-col items-center justify-center text-[var(--color-text-faint)]">
                <Map size={64} strokeWidth={1} className="mb-6 opacity-20" />
                <h3 className="text-xl font-bold text-[var(--color-text-muted)]">Matrix Workspace Empty</h3>
                <p className="text-sm max-w-sm text-center mt-2 leading-relaxed">Strategic Features define the "Why" and "What" of your product, connecting business goals to technical architecture.</p>
                <Button variant="outline" className="mt-8 rounded-xl font-bold border-dashed border-2" onClick={handleAddFeature}>
                   Create First Strategic Feature
                </Button>
             </div>
           )}
        </div>
      </div>

      {/* Feature Details Overlay */}
      {selectedFeature && (
        <div className="fixed inset-0 z-[110] flex animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedFeature(null)} />
           <div className="ml-auto w-full max-w-2xl bg-white h-full relative shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
              <div className="p-8 border-b border-[var(--color-divider)] flex items-center justify-between bg-cyan-900 text-white">
                 <div>
                    <h2 className="text-3xl font-black tracking-tight">{selectedFeature.name}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Strategic Blueprint Details</p>
                 </div>
                 <button onClick={() => setSelectedFeature(null)} className="h-12 w-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                    <XCircle size={28} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 custom-scroll space-y-12">
                 <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-4">Strategic Purpose</h4>
                    <p className="text-lg font-medium text-slate-700 leading-relaxed italic border-l-4 border-cyan-500 pl-6 py-2">
                       "{selectedFeature.desc}"
                    </p>
                 </section>

                 <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-6">Target Implementation (Screens)</h4>
                    <div className="grid grid-cols-2 gap-4">
                       {(selectedFeature.screens || []).map((s, si) => (
                         <div key={si} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4 group">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-cyan-600 font-black text-xs shadow-sm">
                               {si + 1}
                            </div>
                            <span className="font-bold text-slate-800">{s}</span>
                         </div>
                       ))}
                       {(!selectedFeature.screens || selectedFeature.screens.length === 0) && (
                         <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-xs">
                            No interface screens mapped yet.
                         </div>
                       )}
                    </div>
                 </section>

                 <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-6">Linked Technical Status</h4>
                    <div className="space-y-3">
                       {state.tasks.filter(t => t.module === selectedFeature.name || (selectedFeature.screens || []).includes(t.name)).map(t => (
                         <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-cyan-500/30 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                               <span className="text-[10px] font-mono font-bold text-slate-400">{t.id}</span>
                               <span className="font-bold text-slate-800">{t.name}</span>
                            </div>
                            <div className="flex items-center gap-6">
                               <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 font-mono">{t.progress}%</span>
                               <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500" style={{ width: `${t.progress}%` }} />
                               </div>
                            </div>
                         </div>
                       ))}
                       {state.tasks.filter(t => t.module === selectedFeature.name || (selectedFeature.screens || []).includes(t.name)).length === 0 && (
                         <div className="py-20 text-center bg-slate-50 rounded-3xl border border-slate-100">
                            <Activity className="mx-auto text-slate-300 mb-4" size={32} />
                            <p className="text-[10px] font-black uppercase text-slate-400">No active tasks linked to this strategy</p>
                         </div>
                       )}
                    </div>
                 </section>
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
                 <Button variant="ghost" className="font-bold" onClick={() => setSelectedFeature(null)}>Close Matrix Details</Button>
                 <Button variant="primary" className="bg-cyan-600 border-cyan-600 font-black rounded-xl px-10 shadow-lg shadow-cyan-100" onClick={() => { setSelectedFeature(null); startEdit(features.indexOf(selectedFeature)); }}>
                    Refine Feature Definition
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {editForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[var(--color-bg)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-divider)] animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-[var(--color-divider)] flex justify-between items-center">
                 <h2 className="text-2xl font-black">Edit Feature</h2>
                 <button onClick={() => setEditForm(null)} className="p-2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors">
                    <XCircle size={24} />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] mb-2 block">Feature Name</label>
                    <input 
                       className="w-full h-12 px-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-cyan-500 transition-all"
                       value={editForm.name}
                       onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] mb-2 block">Description</label>
                    <textarea 
                       className="w-full h-32 p-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-medium outline-none focus:border-cyan-500 transition-all resize-none"
                       value={editForm.desc}
                       onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] mb-2 block">Linked Screens (Comma Separated)</label>
                    <input 
                       className="w-full h-12 px-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-cyan-500 transition-all"
                       value={editForm.screens.join(', ')}
                       onChange={(e) => setEditForm({ ...editForm, screens: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                 </div>
              </div>
              <div className="p-8 bg-[var(--color-surface-offset)] flex gap-4">
                 <Button variant="ghost" className="flex-1 font-bold h-12 rounded-2xl" onClick={() => setEditForm(null)}>Cancel</Button>
                 <Button variant="primary" className="flex-1 font-black h-12 rounded-2xl bg-cyan-600 border-cyan-600 shadow-cyan-100" onClick={saveEdit}>Save Changes</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FunctionalMatrix;
