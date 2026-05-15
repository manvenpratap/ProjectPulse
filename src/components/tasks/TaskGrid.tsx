import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { fmtDate, daysDiff, isBlocked } from '../../utils/projectUtils';
import clsx from 'clsx';
import { 
  MoreHorizontal, 
  ChevronRight, 
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock
} from 'lucide-react';
import Button from '../shared/Button';

interface TaskGridProps {
  onEditTask: (id: string) => void;
}

const TaskGrid: React.FC<TaskGridProps> = ({ onEditTask }) => {
  const { state } = useProject();

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case TaskStatus.IN_PROGRESS: return "bg-blue-50 text-blue-700 border-blue-200";
      case TaskStatus.ON_HOLD: return "bg-amber-50 text-amber-700 border-amber-200";
      case TaskStatus.CANCELLED: return "bg-slate-50 text-slate-500 border-slate-200";
      case TaskStatus.UNDER_REVIEW: return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL: return "text-red-600 font-bold";
      case TaskPriority.HIGH: return "text-amber-600 font-bold";
      case TaskPriority.MEDIUM: return "text-slate-700";
      default: return "text-slate-400";
    }
  };

  if (!state.tasks.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--color-divider)] rounded-3xl opacity-60">
        <div className="w-16 h-16 bg-[var(--color-surface-2)] rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-[var(--color-text-faint)]" />
        </div>
        <h3 className="text-lg font-bold mb-1">No tasks yet</h3>
        <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
          Start by adding a task or importing your project from an Excel file.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-[var(--color-surface-offset)] border-bottom border-[var(--color-divider)]">
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] w-20">ID</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">Module</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] min-w-[200px]">Task Name</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] w-40">Status</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] w-28">Priority</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] w-32">Due Date</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] w-28 text-right">Progress</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-divider)]">
          {state.tasks.map((task) => {
            const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED;
            const blocked = isBlocked(task, state.tasks);
            
            return (
              <tr 
                key={task.id} 
                className={clsx(
                  "group hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer relative",
                  blocked && "bg-amber-50/50"
                )}
                onClick={() => onEditTask(task.id)}
              >
                <td className="px-4 py-3.5 text-[11px] font-mono font-bold text-[var(--color-primary-hex)]">
                  <div className="flex items-center gap-2">
                    {blocked && <Lock size={10} className="text-amber-600" />}
                    {task.id}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] tracking-wider flex items-center gap-1">
                      {task.moduleType}
                      {blocked && <span className="bg-amber-100 text-amber-700 px-1 py-0 rounded text-[8px]">BLOCKED</span>}
                    </span>
                    <span className="text-[12px] font-semibold truncate max-w-[120px]">
                      {task.module}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--color-text)]">
                      {task.name}
                    </span>
                    {task.subtasks.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-surface-offset)] text-[10px] font-bold text-[var(--color-text-muted)]">
                        {task.subtasks.length}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className={clsx(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                    getStatusStyle(task.status)
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {task.status}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={clsx("text-[11px] uppercase tracking-wider", getPriorityStyle(task.priority))}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className={clsx(
                    "flex items-center gap-1.5 text-[11px] font-mono",
                    overdue ? "text-red-500 font-bold" : "text-[var(--color-text-muted)]"
                  )}>
                    {overdue && <AlertTriangle size={12} />}
                    {fmtDate(task.dueDate)}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-3">
                    <div className="w-16 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden shrink-0">
                      <div 
                        className="h-full bg-[var(--color-primary-hex)] rounded-full transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-mono font-bold w-8 text-right italic">
                      {task.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal size={14} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskGrid;
