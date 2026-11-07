import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Bug, Plus, Search, Filter, ShieldAlert, Activity } from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
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
      case DefectStatus.NEW: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case DefectStatus.ASSIGNED: return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case DefectStatus.FIXED: return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case DefectStatus.CLOSED: return "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]";
      case DefectStatus.REJECTED: return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Bug}
        title="Defect Workshop"
        subtitle={`${state.defects.length} Quality Issues • ${state.defects.filter(d => d.status === DefectStatus.NEW).length} Unaddressed`}
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input 
                className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none focus:border-[var(--color-primary-hex)] w-[240px] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] text-[var(--color-text)]"
                placeholder="Search by ID, title or tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="primary" size="sm" onClick={() => handleEdit(null)} className="h-9 px-4 active:scale-95">
              <Plus size={15} className="mr-1.5" /> Log Defect
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8 w-full">
        {filteredDefects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDefects.map((defect) => (
              <div 
                key={defect.id} 
                className="card p-5 group hover:border-red-200 transition-colors duration-150 flex flex-col cursor-pointer active:scale-[0.98]"
                onClick={() => handleEdit(defect.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded leading-none">
                      {defect.id}
                    </span>
                    <div className={clsx(
                      "text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0",
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
                   <div className="text-xs font-medium text-[var(--color-text-faint)]">Severity</div>
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
                    <div className="text-xs font-medium text-[var(--color-text-faint)]">Reported by</div>
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
