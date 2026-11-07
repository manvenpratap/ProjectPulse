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
import PageHeader from '../shared/PageHeader';
import clsx from 'clsx';

const RegistryView: React.FC = () => {
  const { state, updateProject } = useProject();
  const [selectedKey, setSelectedRegistryKey] = useState('status');
  const [newValue, setNewValue] = useState('');
  const [newLibName, setNewLibName] = useState('');
  const [isAddingLib, setIsAddingLib] = useState(false);

  const dropdowns = state.dropdowns || {};
  const keys = Object.keys(dropdowns).sort();
  const values = dropdowns[selectedKey] || [];

  const isReserved = ['status', 'priority', 'category', 'module', 'moduleType'].includes(selectedKey);

  const handleAddLib = () => {
    if (!newLibName.trim()) return;
    const formatted = newLibName.trim().replace(/\s+/g, '');
    if (dropdowns[formatted]) {
      alert('Library already exists');
      return;
    }
    updateProject({
      dropdowns: {
        ...dropdowns,
        [formatted]: []
      }
    });
    setSelectedRegistryKey(formatted);
    setNewLibName('');
    setIsAddingLib(false);
  };

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
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={ListChecks}
        title="Pulse Registry"
        subtitle="Centralized option libraries, dropdown taxonomies, and entity lookups"
      />
      <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-8 max-w-[1400px] mx-auto w-full flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm shrink-0 h-auto lg:h-[calc(100vh-140px)]">
          <div className="p-6 border-b border-[var(--color-divider)]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)]">Option Libraries</h4>
              <button 
                onClick={() => setIsAddingLib(!isAddingLib)} 
                className="p-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-medium hover:bg-indigo-600 hover:text-white transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50 cursor-pointer"
              >
                {isAddingLib ? 'Cancel' : 'Add New'}
              </button>
            </div>
            
            {isAddingLib ? (
              <div className="motion-safe:animate-in motion-safe:slide-in-from-top-2 duration-200">
                <input 
                  autoFocus
                  className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-indigo-500/20 rounded-xl text-xs font-semibold outline-none shadow-inner mb-2 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                  placeholder="Library Name…"
                  value={newLibName}
                  onChange={(e) => setNewLibName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLib()}
                />
                <Button variant="primary" size="sm" className="w-full h-8 text-xs rounded-lg font-bold active:scale-[0.98]" onClick={handleAddLib}>Create Set</Button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input 
                  className="w-full h-9 pl-9 pr-4 bg-[var(--color-surface-2)] border border-transparent rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500/20 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                  placeholder="Filter libraries…"
                />
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scroll max-h-[300px] lg:max-h-none">
            {keys.map(k => {
              const isActive = selectedKey === k;
              const count = dropdowns[k].length;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedRegistryKey(k)}
                  className={clsx(
                    "w-full px-6 py-4 text-left flex items-center justify-between group transition-colors duration-150 active:scale-[0.98] relative border-l-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50",
                    isActive 
                      ? "bg-indigo-50/50 border-l-indigo-600" 
                      : "border-l-transparent hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-2 h-2 rounded-full transition-colors duration-150",
                      isActive ? "bg-indigo-600" : "bg-[var(--color-divider)]"
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
        <div className="flex-1 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl md:rounded-3xl overflow-hidden shadow-sm relative min-h-[600px] lg:min-h-0">
          <div className="p-6 md:p-10 flex-1 overflow-y-auto custom-scroll">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-6 md:gap-0">
                <div>
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--color-text)] text-capitalize">
                      {selectedKey.replace(/([A-Z])/g, ' $1')}
                    </h2>
                    {isReserved && (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-100">System Core</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed font-medium">
                    Standardized selection library for the <strong>{selectedKey}</strong> attribute. These values are synchronized across all project modules.
                  </p>
                </div>
                
                <div className="flex gap-2">
                   {!isReserved && (
                     <Button variant="ghost" size="icon" className="h-10 w-10 text-red-500 rounded-xl active:scale-[0.98]" onClick={deleteSet}>
                        <Trash2 size={20} />
                     </Button>
                   )}
                </div>
              </div>

              <div className="bg-[var(--color-surface-2)] rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[var(--color-divider)] mb-8 md:mb-10 group focus-within:ring-2 focus-within:ring-indigo-500/20">
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-4 md:mb-6">Add New Value</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    className="flex-1 h-12 md:h-14 px-4 md:px-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl md:rounded-2xl text-sm md:text-base font-bold text-[var(--color-text)] outline-none focus:border-indigo-500 transition-colors duration-150 shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                    placeholder="Enter unique value…"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                  />
                  <Button variant="primary" className="h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-2xl font-black shadow-lg shadow-indigo-100 active:scale-[0.98]" onClick={handleAddValue}>
                    Add to Library
                  </Button>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3">
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-4">Total Definitions ({values.length})</h4>
                {values.map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 md:p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl md:rounded-2xl transition-colors duration-150 hover:border-indigo-500/30 group shadow-sm">
                    <div className="flex items-center gap-4 md:gap-6">
                      <span className="text-[9px] md:text-[10px] font-mono font-black text-[var(--color-text-faint)] opacity-40">{(i + 1).toString().padStart(2, '0')}</span>
                      <span className="text-sm md:text-base font-black text-[var(--color-text)]">{v}</span>
                    </div>
                    <button 
                      onClick={() => removeValue(i)}
                      className="p-2 text-[var(--color-text-faint)] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50"
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
                <span className="text-xs font-medium text-[var(--color-text-muted)] leading-none">Sync Integrity: 100%</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                <span className="text-xs font-medium text-emerald-600 leading-none">Global Database Live</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistryView;
