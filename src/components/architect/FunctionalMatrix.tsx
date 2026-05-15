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
  ArrowRight
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { Feature } from '../../types';

const FunctionalMatrix: React.FC = () => {
  const { state, updateProject } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

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
              const linkedTasks = state.tasks.filter(t => t.module === f.name || f.screens.includes(t.name));
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
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setEditingIdx(actualIdx)}>
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
                         {f.screens.slice(0, 4).map((s, si) => (
                           <span key={si} className="px-2.5 py-1 bg-cyan-50 text-cyan-700 text-[10px] font-black rounded-lg border border-cyan-100">
                             {s}
                           </span>
                         ))}
                         {f.screens.length > 4 && (
                           <span className="px-2.5 py-1 bg-[var(--color-surface-offset)] text-[var(--color-text-faint)] text-[10px] font-black rounded-lg">
                             + {f.screens.length - 4}
                           </span>
                         )}
                      </div>

                      <button className="flex items-center gap-2 text-[10px] font-black text-cyan-600 uppercase tracking-widest group-hover:gap-3 transition-all">
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
    </div>
  );
};

export default FunctionalMatrix;
