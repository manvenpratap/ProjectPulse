import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Bug, Plus, Search, Filter, ShieldAlert, Activity } from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { DefectStatus } from '../../types';
import DefectModal from './DefectModal';

const DefectView: React.FC = () => {
  const { state } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleEdit = (id: string | null) => {
    setSelectedDefect(id);
    setIsModalOpen(true);
  };

  const filteredDefects = state.defects.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusStyle = (status: DefectStatus) => {
    switch (status) {
      case DefectStatus.NEW: return "bg-blue-50 text-blue-700 border-blue-100";
      case DefectStatus.ASSIGNED: return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case DefectStatus.FIXED: return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case DefectStatus.CLOSED: return "bg-slate-50 text-slate-500 border-slate-200";
      case DefectStatus.REJECTED: return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <div className="px-6 py-6 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-red-600 flex items-center justify-center">
            <Bug size={18} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">Defect Workshop</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              {state.defects.length} Quality Issues • {state.defects.filter(d => d.status === DefectStatus.NEW).length} Unaddressed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input 
              className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:border-[var(--color-primary-hex)] w-[240px]"
              placeholder="Search by ID, title or tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="primary" size="sm" onClick={() => handleEdit(null)} className="h-9 px-4">
             <Plus size={16} className="mr-1.5" /> Log Defect
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-6">
        {filteredDefects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDefects.map((defect) => (
              <div 
                key={defect.id} 
                className="card p-5 group hover:border-red-200 transition-all flex flex-col cursor-pointer"
                onClick={() => handleEdit(defect.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded leading-none">
                      {defect.id}
                    </span>
                    <div className={clsx(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0",
                      getStatusStyle(defect.status)
                    )}>
                      {defect.status}
                    </div>
                  </div>
                  <ShieldAlert size={14} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <h3 className="font-bold text-[14px] text-[var(--color-text)] leading-tight mb-3 line-clamp-2">
                  {defect.title || 'Untitled Defect'}
                </h3>

                <div className="flex items-center gap-2 mb-6">
                   <div className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider">Severity</div>
                   <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                   <div className="text-[11px] font-bold">{defect.severity || 'S2 - High'}</div>
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--color-divider)] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                      {defect.assignee ? defect.assignee[0] : '?'}
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)] truncate">
                      {defect.assignee || 'Unassigned'}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-[var(--color-text-faint)] uppercase tracking-tight">Reported By</div>
                    <div className="text-[11px] font-medium truncate max-w-[80px]">{defect.reporter || 'System'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-[var(--color-surface-2)] rounded-3xl border-2 border-dashed border-[var(--color-divider)]">
            <div className="w-20 h-20 bg-[var(--color-surface)] rounded-2xl flex items-center justify-center mb-6 shadow-xl text-red-500">
               <Bug size={40} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-display font-bold">Codebase Crystal Clear</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-sm mx-auto leading-relaxed">
              No defects are currently tracked. Use this space to capture technical debt and quality issues as they arise.
            </p>
            <Button variant="primary" size="lg" className="mt-8 px-8" onClick={() => handleEdit(null)}>
              Log First Issue
            </Button>
          </div>
        )}
      </div>

      <DefectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defectId={selectedDefect}
      />
    </div>
  );
};

export default DefectView;
