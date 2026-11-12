import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { History, Search, Filter, MessageSquare, Clock, Plus, X, ShieldCheck } from 'lucide-react';
import { fmtDate } from '../../utils/projectUtils';
import PageHeader from '../shared/PageHeader';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { toast } from '../../utils/toast';
import clsx from 'clsx';
import { LogEntry } from '../../types';

const LogView: React.FC = () => {
  const { state, addLog } = useProject();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteComment, setNoteComment] = useState('');

  const handleSaveAuditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteSubject.trim()) return;
    addLog(
      'AUDIT_NOTE',
      'governance',
      noteSubject.trim(),
      'Governance Audit',
      '',
      noteComment.trim() || 'Manual governance audit note recorded'
    );
    toast.success('Recorded governance audit note.');
    setNoteSubject('');
    setNoteComment('');
    setIsAddModalOpen(false);
  };

  const filteredLogs = state.log.filter(l => 
    l.taskName.toLowerCase().includes(search.toLowerCase()) || 
    l.assignee.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase())
  );

  // Group by day
  const groupedLogs = filteredLogs.slice().reverse().reduce((acc, entry) => {
    const date = entry.ts.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={History}
        title="Project Audit Log"
        subtitle={`${state.log.length} Transactional Entries Recorded`}
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input 
                className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl pl-9 pr-3 sm:pr-4 py-1.5 text-xs outline-none focus:border-[var(--color-primary-hex)] w-full min-w-[180px] sm:w-[240px] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] text-[var(--color-text)]"
                placeholder="Filter logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Filter logs"
              />
            </div>
            <button 
              aria-label="Filter log entries"
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] active:scale-95 cursor-pointer"
            >
              <Filter size={16} />
            </button>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Audit Note</span>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-10">
        <div className="w-full space-y-10">
          {(Object.entries(groupedLogs) as [string, LogEntry[]][]).map(([date, entries]) => (
            <div key={date} className="relative">
              {/* Day Label */}
              <div className="flex items-center gap-4 mb-4">
                <div className="px-3 py-1 rounded-full bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-xs font-medium text-[var(--color-text-muted)]">
                  {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                </div>
                <div className="h-[1px] flex-1 bg-[var(--color-divider)] shadow-sm" />
              </div>

              <div className="space-y-3 relative pl-4 border-l-2 border-[var(--color-divider)] ml-14">
                {entries.map((entry, idx) => {
                  const time = new Date(entry.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                  const isStatus = entry.action === 'Status Changed';
                  const isCreated = entry.action === 'Created';
                  
                  return (
                    <div key={idx} className="group relative">
                      {/* Timeline Dot */}
                      <div className={clsx(
                        "absolute -left-[1.35rem] top-4 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-surface)] ring-4 ring-[var(--color-bg)] motion-safe:transition-transform motion-safe:group-hover:scale-125",
                        isCreated ? "bg-emerald-500" : isStatus ? "bg-indigo-500" : "bg-blue-400"
                      )} />

                      {/* Time Marker */}
                      <div className="absolute -left-[4.5rem] top-3 text-[10px] font-mono font-bold text-[var(--color-text-faint)] w-12 text-right">
                        {time}
                      </div>

                      <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-4 shadow-sm group-hover:shadow-md transition-colors duration-150 group-hover:border-[var(--color-primary-highlight-hex)]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span className={clsx(
                                "text-xs font-semibold px-2 py-0.5 rounded-md border",
                                isCreated 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                  : isStatus 
                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" 
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              )}>
                                {entry.action}
                              </span>
                              <span className="text-[12px] font-bold text-[var(--color-text)] truncate">
                                {entry.taskName}
                              </span>
                              <span className="text-[10px] font-mono text-[var(--color-text-faint)]">
                                ({entry.taskId})
                              </span>
                            </div>

                            {entry.field && !isCreated && (
                              <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 mt-2">
                                <span className="font-bold text-[var(--color-primary-hex)] underline decoration-dotted underline-offset-4">{entry.field}</span>
                                <span className="opacity-40">changed from</span>
                                <span className="line-through italic opacity-60 px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded">{entry.oldVal || 'None'}</span>
                                <span className="font-bold opacity-100 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">{entry.newVal}</span>
                              </div>
                            )}

                            {entry.comment && (
                              <div className="mt-3 p-3 rounded-lg bg-[var(--color-surface-offset)] border border-[var(--color-divider)] flex gap-3 text-xs italic text-[var(--color-text-muted)]">
                                <MessageSquare size={14} className="shrink-0 opacity-30 mt-0.5" />
                                <span>{entry.comment}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right hidden sm:block">
                             <div className="text-xs font-medium text-[var(--color-text-faint)] mb-1">Assignee</div>
                             <div className="text-[11px] font-bold">{entry.assignee}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {state.log.length === 0 && (
            <div className="py-20 text-center text-[var(--color-text-faint)] space-y-4">
              <Clock size={48} strokeWidth={1} className="mx-auto opacity-20" />
              <p className="text-sm italic">The ledger is empty. Perform an action to see history.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Governance Audit Note Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Governance Note"
        size="md"
      >
        <form onSubmit={handleSaveAuditNote} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Subject / Scope <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Architecture Steering Review, Security Sign-Off..."
              value={noteSubject}
              onChange={e => setNoteSubject(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Audit Findings & Decision Notes
            </label>
            <textarea
              rows={3}
              placeholder="Record steering decision, compliance approval, or audit rationale..."
              value={noteComment}
              onChange={e => setNoteComment(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-divider)]">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddModalOpen(false)}
              className="h-9 px-4 rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              size="sm" 
              className="h-9 px-4 rounded-xl text-xs font-bold shadow-xs"
            >
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LogView;
