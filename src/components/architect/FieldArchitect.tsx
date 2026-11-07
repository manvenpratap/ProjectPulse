import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Building, 
  Trash2, 
  Edit2, 
  Plus, 
  Database,
  Layout,
  Type,
  Calendar,
  Hash,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import clsx from 'clsx';
import { CustomField } from '../../types';

const FieldArchitect: React.FC = () => {
  const { state, updateProject } = useProject();
  const [activeTab, setActiveTab] = useState<'tasks' | 'defects'>('tasks');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CustomField | null>(null);

  const customFields = (activeTab === 'tasks' ? state.customFields : state.defCustomFields) || [];

  const handleAddField = () => {
    const newField: CustomField = {
      name: 'New Custom Attribute',
      type: 'text',
      required: false
    };
    
    if (activeTab === 'tasks') {
      updateProject({ customFields: [...(state.customFields || []), newField] });
    } else {
      updateProject({ defCustomFields: [...(state.defCustomFields || []), newField] });
    }
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...customFields[idx] });
  };

  const saveEdit = () => {
    if (editingIdx === null || !editForm) return;
    const updated = [...customFields];
    updated[editingIdx] = editForm;
    
    if (activeTab === 'tasks') {
      updateProject({ customFields: updated });
    } else {
      updateProject({ defCustomFields: updated });
    }
    setEditingIdx(null);
    setEditForm(null);
  };

  const removeField = (idx: number) => {
    if (confirm('Permanently delete this custom attribute? Existing data for this field will be lost.')) {
      if (activeTab === 'tasks') {
        const updated = (state.customFields || []).filter((_, i) => i !== idx);
        updateProject({ customFields: updated });
      } else {
        const updated = (state.defCustomFields || []).filter((_, i) => i !== idx);
        updateProject({ defCustomFields: updated });
      }
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'text': return <Type size={16} />;
      case 'number': return <Hash size={16} />;
      case 'date': return <Calendar size={16} />;
      case 'checkbox': return <CheckSquare size={16} />;
      case 'dropdown': return <Building size={16} />;
      default: return <Type size={16} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Database}
        title="Field Architect"
        subtitle="Extend the system data model with custom metadata attributes and entity schema"
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={clsx(
                  "px-2 sm:px-3 py-1.5 sm:py-2 min-h-[36px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50 cursor-pointer",
                  activeTab === 'tasks' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <span className="hidden sm:inline">Task Schema</span>
                <span className="sm:hidden">Tasks</span>
              </button>
              <button 
                onClick={() => setActiveTab('defects')}
                className={clsx(
                  "px-2 sm:px-3 py-1.5 sm:py-2 min-h-[36px] flex items-center justify-center rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50 cursor-pointer",
                  activeTab === 'defects' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <span className="hidden sm:inline">Defect Schema</span>
                <span className="sm:hidden">Defects</span>
              </button>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddField} className="h-9 px-2.5 sm:px-4 rounded-xl font-bold active:scale-95 shrink-0">
              <Plus size={15} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Add Field</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-2">
               <h3 className="font-semibold text-xs text-[var(--color-text-muted)]">Custom Extensions ({customFields.length})</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customFields.map((cf, i) => (
                <div key={i} className="card p-8 group relative overflow-hidden transition-colors duration-150 hover:border-indigo-500/30">
                  <div className="absolute top-0 left-0 w-12 h-12 bg-indigo-50/50 rounded-br-3xl flex items-center justify-center text-indigo-500 scale-150 -translate-x-4 -translate-y-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    {getIconForType(cf.type)}
                  </div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                      {getIconForType(cf.type)}
                    </div>
                    <div className="flex gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg active:scale-[0.98]" onClick={() => startEdit(i)}>
                          <Edit2 size={14} />
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-red-500 active:scale-[0.98]" 
                        onClick={() => removeField(i)}
                       >
                          <Trash2 size={14} />
                       </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <h4 className="font-black text-lg text-[var(--color-text)]">{cf.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs font-semibold text-indigo-500">{cf.type}</span>
                           <div className="w-1 h-1 rounded-full bg-[var(--color-divider)]" />
                           <span className="text-[10px] font-bold text-[var(--color-text-faint)] opacity-60">ID: CF_{cf.name.replace(/\s+/g, '_').toUpperCase()}</span>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-[var(--color-divider)] border-dashed grid grid-cols-2 gap-4">
                        <div>
                           <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Status</div>
                           <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold">Active Instance</span>
                           </div>
                        </div>
                        <div>
                           <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Maturity</div>
                           <span className="text-[10px] font-bold">Standardized</span>
                        </div>
                     </div>
                  </div>
                </div>
              ))}
              
              {customFields.length === 0 && (
                <div className="col-span-full py-20 bg-[var(--color-surface-offset)]/30 rounded-3xl border-2 border-dashed border-[var(--color-divider)] flex flex-col items-center justify-center text-[var(--color-text-faint)]">
                   <Layout size={48} strokeWidth={1} className="mb-4 opacity-20" />
                   <div className="font-bold">No custom attributes defined for {activeTab}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="card p-8 bg-[var(--color-surface-2)] border-none">
              <h3 className="font-semibold text-xs text-indigo-500 mb-6">Schema Integrity</h3>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                       <ShieldCheck size={18} />
                    </div>
                    <div>
                       <div className="text-sm font-bold">Atomic Propagation</div>
                       <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Updates to dropdown libraries instantly flow to all linked custom selectors.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                       <Layout size={18} />
                    </div>
                    <div>
                       <div className="text-sm font-bold">Responsive Layout</div>
                       <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Extended fields automatically adjust grid density based on data type.</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text)]">
               <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={20} className="text-amber-500" />
                  <h3 className="font-bold text-sm">Security Caution</h3>
               </div>
               <p className="text-xs font-medium leading-relaxed text-[var(--color-text-muted)]">
                  Deleting a field from the <strong>Field Architect</strong> will permanently remove that attribute from all existing task records. Please perform an <strong>Excel Backup</strong> before making sweeping schema changes.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/50 motion-safe:animate-in motion-safe:fade-in duration-200">
           <div className="bg-[var(--color-bg)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-divider)] motion-safe:animate-in motion-safe:zoom-in-95 duration-200">
              <div className="p-8 border-b border-[var(--color-divider)] flex justify-between items-center bg-indigo-50/30">
                 <h2 className="text-2xl font-black">Edit Attribute</h2>
                 <button onClick={() => setEditForm(null)} className="p-2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors active:scale-95">
                    <Trash2 size={24} className="rotate-45" />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div>
                    <label className="text-xs font-medium text-[var(--color-text-muted)] mb-2 block">Attribute Name</label>
                    <input 
                       className="w-full h-12 px-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                       value={editForm.name}
                       onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-muted)] mb-2 block">Data Type</label>
                        <select 
                          className="w-full h-12 px-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-indigo-500 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                        >
                          <option value="text">Textual</option>
                          <option value="number">Numeric</option>
                          <option value="date">Temporal (Date)</option>
                          <option value="checkbox">Boolean (Checkbox)</option>
                          <option value="dropdown">Categorical (Dropdown)</option>
                        </select>
                    </div>
                    <div className="flex flex-col justify-center">
                        <label className="text-xs font-medium text-[var(--color-text-muted)] mb-2 block">Constraint</label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                           <input 
                              type="checkbox"
                              className="w-5 h-5 rounded border-[var(--color-divider)] text-indigo-600 focus:ring-indigo-500"
                              checked={editForm.required}
                              onChange={(e) => setEditForm({ ...editForm, required: e.target.checked })}
                           />
                           <span className="text-xs font-bold text-[var(--color-text-muted)] group-hover:text-indigo-600 transition-colors">Required Field</span>
                        </label>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-[var(--color-surface-offset)] flex gap-4">
                 <Button variant="ghost" className="flex-1 font-bold h-12 rounded-2xl active:scale-[0.98]" onClick={() => setEditForm(null)}>Cancel</Button>
                 <Button variant="primary" className="flex-1 font-black h-12 rounded-2xl bg-indigo-600 border-indigo-600 shadow-indigo-100 active:scale-[0.98]" onClick={saveEdit}>Update Schema</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FieldArchitect;

const ShieldCheck: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
