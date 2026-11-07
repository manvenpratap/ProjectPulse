import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, TaskStatus } from '../../types';
import { isBlocked } from '../../utils/projectUtils';
import { 
  Package, 
  Database, 
  Monitor, 
  Link2, 
  Smartphone,
  CheckCircle2,
  Loader,
  Eye,
  PauseCircle,
  AlertCircle,
  Circle
} from 'lucide-react';
import clsx from 'clsx';

const ModuleDeliveryMatrix: React.FC = () => {
  const { state } = useProject();
  const { tasks } = state;

  const mods = Array.from(new Set(tasks.map(t => t.module).filter(Boolean))).sort();
  const types: string[] = Array.from(new Set(tasks.map(t => t.moduleType).filter(Boolean))) as string[];
  types.sort((a, b) => {
    if (a === 'Server') return -1;
    if (b === 'Server') return 1;
    if (a === 'GUI') return -1;
    if (b === 'GUI') return 1;
    return a.localeCompare(b);
  });

  const getDerivedStatus = (t: Task) => {
    // If it has subtasks, we consider it "as a whole"
    if (!t.subtasks || t.subtasks.length === 0) return t.status;
    
    if (t.subtasks.every(s => s.status === TaskStatus.COMPLETED)) return TaskStatus.COMPLETED;
    if (t.subtasks.some(s => s.status === TaskStatus.ON_HOLD)) return TaskStatus.ON_HOLD;
    if (t.subtasks.some(s => s.progress > 0)) return TaskStatus.IN_PROGRESS;
    return TaskStatus.NOT_STARTED;
  };

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return { color: 'var(--green)', icon: CheckCircle2 };
      case TaskStatus.IN_PROGRESS: return { color: 'var(--color-primary)', icon: Loader };
      case TaskStatus.UNDER_REVIEW: return { color: 'var(--blue)', icon: Eye };
      case TaskStatus.ON_HOLD: return { color: 'var(--amber)', icon: PauseCircle };
      case TaskStatus.CANCELLED: return { color: 'var(--color-text-faint)', icon: Circle };
      default: return { color: 'var(--color-text-faint)', icon: Circle };
    }
  };

  if (!mods.length) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_var(--color-green)]" />
        <h2 className="text-xl font-bold font-display tracking-tight text-[var(--color-text)]">Module Architecture Maturity</h2>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto custom-scroll">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-offset)] border-b border-[var(--color-divider)]">
                <th className="p-4 text-left font-semibold text-xs text-[var(--color-text-faint)] w-64 sticky left-0 bg-[var(--color-surface-offset)] z-10">
                  Business domain / layers
                </th>
                {types.map(ty => (
                  <th key={ty} className="p-4 text-center font-semibold text-xs text-[var(--color-text-faint)] min-w-[160px]">
                    <div className="flex flex-col items-center gap-2">
                       {ty.includes('Server') ? <Database size={14} /> : ty.includes('GUI') ? <Monitor size={14} /> : <Package size={14} />}
                       {ty}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mods.map(m => (
                <tr key={m} className="border-b border-[var(--color-divider)] group hover:bg-[var(--color-surface-offset)]/30 transition-colors duration-150">
                  <td className="p-4 font-bold text-sm text-[var(--color-text-muted)] sticky left-0 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-offset)] z-10 border-r border-[var(--color-divider)]">
                    {m}
                  </td>
                  {types.map(ty => {
                    const mtTasks = tasks.filter(t => t.module === m && t.moduleType === ty);
                    if (!mtTasks.length) {
                      return <td key={ty} className="p-4 text-center text-[var(--color-text-faint)] opacity-20 text-xl font-thin">∅</td>;
                    }

                    const statuses = mtTasks.map(t => getDerivedStatus(t));
                    const statusCounts: Record<string, number> = {};
                    statuses.forEach(s => statusCounts[s] = (statusCounts[s] || 0) + 1);

                    let displayStatus = TaskStatus.NOT_STARTED;
                    if (statusCounts[TaskStatus.ON_HOLD]) displayStatus = TaskStatus.ON_HOLD;
                    else if (statusCounts[TaskStatus.IN_PROGRESS]) displayStatus = TaskStatus.IN_PROGRESS;
                    else if (statusCounts[TaskStatus.UNDER_REVIEW]) displayStatus = TaskStatus.UNDER_REVIEW;
                    else if (statusCounts[TaskStatus.COMPLETED] === mtTasks.length) displayStatus = TaskStatus.COMPLETED;
                    else if (statusCounts[TaskStatus.COMPLETED]) displayStatus = TaskStatus.IN_PROGRESS;

                    const config = getStatusConfig(displayStatus);
                    const avgProg = Math.round(mtTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / mtTasks.length);

                    return (
                      <td key={ty} className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className={clsx(
                            "flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold text-white shadow-sm self-center",
                            displayStatus === TaskStatus.IN_PROGRESS && "motion-safe:animate-pulse"
                          )} style={{ backgroundColor: config.color }}>
                            <config.icon size={10} strokeWidth={3} />
                            {displayStatus}
                          </div>
                          
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                               <div 
                                 className="h-full rounded-full" 
                                 style={{ width: `${avgProg}%`, backgroundColor: config.color }} 
                               />
                             </div>
                             <span className="text-xs font-mono font-medium text-[var(--color-text-faint)]">{avgProg}%</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModuleDeliveryMatrix;
