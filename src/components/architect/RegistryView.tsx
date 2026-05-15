import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  ListChecks, 
  Search, 
  Plus, 
  Trash2, 
  XCircle,
  Database,
  ShieldCheck,
  Package,
  Activity
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';

const RegistryView: React.FC = () => {
  const { state, updateProject } = useProject();
  const [selectedKey, setSelectedRegistryKey] = useState('status');
  const [newValue, setNewValue] = useState('');

  const keys = Object.keys(state.dropdowns).sort();
  const values = state.dropdowns[selectedKey] || [];

  const isReserved = ['status', 'priority', 'category'].includes(selectedKey);

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    if (values.includes(newValue.trim())) {
      alert('Value already exists');
      return;
    }

    const updated = [...values, newValue.trim()];
    updateProject({
      dropdowns: {
        ...state.dropdowns,
        [selectedKey]: updated
      }
    });
    setNewValue('');
  };

  const removeValue = (idx: number) => {
    const updated = values.filter((_, i) => i !== idx);
    updateProject({
      dropdowns: {
        ...state.dropdowns,
        [selectedKey]: updated
      }
    });
  };

  const deleteSet = () => {
    if (confirm(`Delete entire "${selectedKey}" library? This cannot be undone.`)) {
      const newDds = { ...state.dropdowns };
      delete newDds[selectedKey];
      updateProject({ dropdowns: newDds });
      setSelectedRegistryKey(Object.keys(newDds)[0] || '');
    }
  };

  return (
    <div className="flex h-full bg-[var(--color-bg)] overflow-hidden">
      <div className="flex-1 max-w-[1400px] mx-auto w-full p-8 flex gap-8">
        {/* Sidebar */}
        <div className="w-80 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl overflow-hidden shadow-xl shadow-black/5">
          <div className="p-6 border-b border-[var(--color-divider)]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] mb-4">Option Libraries</h4>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input 
                className="w-full h-9 pl-9 pr-4 bg-[var(--color-surface-2)] border border-transparent rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500/20 outline-none transition-all"
                placeholder="Filter libraries..."
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scroll">
            {keys.map(k => {
              const isActive = selectedKey === k;
              const count = state.dropdowns[k].length;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedRegistryKey(k)}
                  className={clsx(
                    "w-full px-6 py-4 text-left flex items-center justify-between group transition-all relative border-l-4",
                    isActive 
                      ? "bg-indigo-50/50 border-l-indigo-600" 
                      : "border-l-transparent hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-2 h-2 rounded-full transition-all",
                      isActive ? "bg-indigo-600 scale-125" : "bg-[var(--color-divider)]"
                    )} />
                    <span className={clsx(
                      "text-xs font-bold text-capitalize",
                      isActive ? "text-indigo-900" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                    )}>
                      {k.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                  <span className={clsx(
                    "text-[10px] font-black px-2 py-0.5 rounded-lg transition-colors",
                    isActive ? "bg-indigo-600 text-white" : "bg-[var(--color-surface-offset)] text-[var(--color-text-faint)]"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl overflow-hidden shadow-xl shadow-black/5 relative">
          <div className="p-10 flex-1 overflow-y-auto custom-scroll">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-4xl font-display font-black tracking-tight text-[var(--color-text)] text-capitalize">
                      {selectedKey.replace(/([A-Z])/g, ' $1')}
                    </h2>
                    {isReserved && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">System Core</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed font-medium">
                    Standardized selection library for the <strong>{selectedKey}</strong> attribute. These values are synchronized across all project modules.
                  </p>
                </div>
                
                <div className="flex gap-2">
                   {!isReserved && (
                     <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 rounded-xl" onClick={deleteSet}>
                        <Trash2 size={20} />
                     </Button>
                   )}
                </div>
              </div>

              <div className="bg-[var(--color-surface-2)] rounded-3xl p-8 border border-[var(--color-divider)] mb-10 group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] mb-6">Add New Value</h4>
                <div className="flex gap-4">
                  <input 
                    className="flex-1 h-14 px-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl text-base font-bold text-[var(--color-text)] outline-none focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="Enter unique value..."
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                  />
                  <Button variant="primary" className="h-14 px-10 rounded-2xl font-black shadow-lg shadow-indigo-100" onClick={handleAddValue}>
                    Add to Library
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] mb-4">Total Definitions ({values.length})</h4>
                {values.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl transition-all hover:translate-x-1 hover:border-indigo-500/30 group shadow-sm">
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] font-mono font-black text-[var(--color-text-faint)] opacity-40">{(i + 1).toString().padStart(2, '0')}</span>
                      <span className="text-base font-black text-[var(--color-text)]">{v}</span>
                    </div>
                    <button 
                      onClick={() => removeValue(i)}
                      className="p-2 text-[var(--color-text-faint)] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                ))}
                
                {values.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-[var(--color-text-faint)]">
                    <div className="text-4xl mb-4 opacity-20">∅</div>
                    <div className="font-bold text-sm">Registry set is currently empty</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 flex justify-between items-center px-10">
             <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-faint)] leading-none">Sync Integrity: 100%</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 leading-none">Global Database Live</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistryView;
