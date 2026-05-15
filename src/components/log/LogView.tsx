import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { History, Search, Filter, MessageSquare, Clock } from 'lucide-react';
import { fmtDate } from '../../utils/projectUtils';
import clsx from 'clsx';
import { LogEntry } from '../../types';

const LogView: React.FC = () => {
  const { state } = useProject();

  // Group by day
  const groupedLogs = state.log.slice().reverse().reduce((acc, entry) => {
    const date = entry.ts.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <div className="px-6 py-6 border-bottom border-[var(--color-divider)] bg-[var(--color-surface)]/50 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
            <History size={18} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">Project Audit Log</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              {state.log.length} Transactional Entries Recorded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input 
              className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg pl-9 pr-4 py-1.5 text-xs outline-none focus:border-[var(--color-primary-hex)] w-[240px]"
              placeholder="Filter by actor or task..."
            />
          </div>
          <button className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll p-6">
        <div className="max-w-4xl mx-auto space-y-10">
          {(Object.entries(groupedLogs) as [string, LogEntry[]][]).map(([date, entries]) => (
            <div key={date} className="relative">
              {/* Day Label */}
              <div className="flex items-center gap-4 mb-4">
                <div className="px-3 py-1 rounded-full bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
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
                        "absolute -left-[1.35rem] top-4 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-surface)] ring-4 ring-[var(--color-bg)] transition-transform group-hover:scale-125",
                        isCreated ? "bg-emerald-500" : isStatus ? "bg-indigo-500" : "bg-blue-400"
                      )} />

                      {/* Time Marker */}
                      <div className="absolute -left-[4.5rem] top-3 text-[10px] font-mono font-bold text-[var(--color-text-faint)] w-12 text-right">
                        {time}
                      </div>

                      <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-4 shadow-sm group-hover:shadow-md transition-all group-hover:border-[var(--color-primary-highlight-hex)]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                              <span className={clsx(
                                "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                isCreated ? "bg-emerald-100 text-emerald-700" : isStatus ? "bg-indigo-100 text-indigo-700" : "bg-blue-100 text-blue-700"
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
                                <span className="line-through italic opacity-50 px-1 bg-red-50 text-red-500 rounded">{entry.oldVal || 'None'}</span>
                                <span className="font-bold opacity-100 px-1 bg-emerald-50 text-emerald-600 rounded">{entry.newVal}</span>
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
                             <div className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-1">Assignee</div>
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
    </div>
  );
};

export default LogView;
