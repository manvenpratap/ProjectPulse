import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, TaskStatus, TaskPriority, Subtask } from '../../types';
import { fmtDate, daysDiff, isBlocked, todayStr } from '../../utils/projectUtils';
import clsx from 'clsx';
import { 
  MoreHorizontal, 
  ChevronRight, 
  ChevronDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  CheckSquare,
  Square,
  Bug,
  Filter,
  SlidersHorizontal,
  Layers,
  Flag,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import Button from '../shared/Button';
import { motion, AnimatePresence } from 'motion/react';

interface TaskGridProps {
  onEditTask: (id: string) => void;
}

type DensityMode = 'comfortable' | 'compact';

const TaskGrid: React.FC<TaskGridProps> = ({ onEditTask }) => {
  const { state, searchTerm, updateTask } = useProject();
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedRelease, setSelectedRelease] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'id' | 'dueDate' | 'progress' | 'priority'>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter options
  const modules = Array.from(new Set(state.tasks.map(t => t.module).filter(Boolean)));
  const releases = Array.from(new Set(state.tasks.map(t => t.release).filter(Boolean)));

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleCycleStatus = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const cycle = [
      TaskStatus.NOT_STARTED,
      TaskStatus.IN_PROGRESS,
      TaskStatus.UNDER_REVIEW,
      TaskStatus.COMPLETED
    ];
    const curIdx = cycle.indexOf(task.status);
    const nextStatus = cycle[(curIdx + 1) % cycle.length];
    const isDone = nextStatus === TaskStatus.COMPLETED;

    updateTask(task.id, {
      status: nextStatus,
      progress: isDone ? 100 : (task.status === TaskStatus.NOT_STARTED && task.progress === 0) ? 25 : task.progress,
      actCompletionDate: isDone ? todayStr() : null
    }, `Status transitioned to ${nextStatus}`);
  };

  const handleToggleSubtask = (task: Task, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubtasks = task.subtasks.map(s => {
      if (s.id === subId) {
        const nextDone = !s.done;
        return {
          ...s,
          done: nextDone,
          status: nextDone ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
          progress: nextDone ? 100 : 0
        };
      }
      return s;
    });

    const doneCount = updatedSubtasks.filter(s => s.done).length;
    const newProgress = updatedSubtasks.length ? Math.round((doneCount / updatedSubtasks.length) * 100) : task.progress;
    const allDone = doneCount === updatedSubtasks.length && updatedSubtasks.length > 0;

    updateTask(task.id, {
      subtasks: updatedSubtasks,
      progress: newProgress,
      status: allDone ? TaskStatus.COMPLETED : (newProgress > 0 && task.status === TaskStatus.NOT_STARTED) ? TaskStatus.IN_PROGRESS : task.status,
      actCompletionDate: allDone ? todayStr() : (task.status === TaskStatus.COMPLETED && !allDone) ? null : task.actCompletionDate
    }, `Checklist updated: ST ${subId}`);
  };

  // Filtered & Sorted Tasks
  const filteredTasks = state.tasks.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignee && t.assignee.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesModule = selectedModule === 'all' || t.module === selectedModule;
    const matchesRelease = selectedRelease === 'all' || t.release === selectedRelease;
    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;

    return matchesSearch && matchesModule && matchesRelease && matchesStatus;
  }).sort((a, b) => {
    let cmp = 0;
    if (sortField === 'id') {
      cmp = a.id.localeCompare(b.id);
    } else if (sortField === 'dueDate') {
      cmp = (new Date(a.dueDate).getTime() || 0) - (new Date(b.dueDate).getTime() || 0);
    } else if (sortField === 'progress') {
      cmp = (a.progress || 0) - (b.progress || 0);
    } else if (sortField === 'priority') {
      const order = { [TaskPriority.CRITICAL]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
      cmp = (order[b.priority] || 0) - (order[a.priority] || 0);
    }
    return sortAsc ? cmp : -cmp;
  });

  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case TaskStatus.IN_PROGRESS: return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case TaskStatus.ON_HOLD: return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case TaskStatus.CANCELLED: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case TaskStatus.UNDER_REVIEW: return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL: return "text-red-500 font-black";
      case TaskPriority.HIGH: return "text-amber-500 font-bold";
      case TaskPriority.MEDIUM: return "text-blue-500 font-semibold";
      default: return "text-[var(--color-text-faint)] font-medium";
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
    <div className="space-y-4">
      {/* Table Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <Layers size={13} className="text-[var(--color-text-faint)]" />
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer"
            >
              <option value="all">All Modules</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Release Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <Flag size={13} className="text-[var(--color-text-faint)]" />
            <select
              value={selectedRelease}
              onChange={e => setSelectedRelease(e.target.value)}
              className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer"
            >
              <option value="all">All Releases</option>
              {releases.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <Filter size={13} className="text-[var(--color-text-faint)]" />
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {Object.values(TaskStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Density & Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">
            Showing {filteredTasks.length} of {state.tasks.length} tasks
          </span>

          <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <button
              onClick={() => setDensity('compact')}
              className={clsx(
                "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50 cursor-pointer",
                density === 'compact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-faint)]"
              )}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={clsx(
                "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50 cursor-pointer",
                density === 'comfortable' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-faint)]"
              )}
            >
              Comfortable
            </button>
          </div>
        </div>
      </div>

      {/* Mobile view cards */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {filteredTasks.map((task) => {
          const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED;
          const blocked = isBlocked(task, state.tasks);
          const isExpanded = expandedTasks.has(task.id);
          
          return (
            <div 
              key={task.id}
              onClick={() => onEditTask(task.id)}
              className={clsx(
                "p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm motion-safe:active:scale-[0.98] transition-colors duration-150",
                blocked && "bg-amber-500/5 border-amber-500/20"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[var(--color-primary-hex)]">{task.id}</span>
                    <button
                      onClick={(e) => handleCycleStatus(task, e)}
                      title="Click to advance status"
                      className={clsx(
                        "px-2.5 py-1.5 min-h-[32px] rounded-full text-xs font-medium border motion-safe:transition-transform active:scale-95 inline-flex items-center justify-center cursor-pointer",
                        getStatusStyle(task.status)
                      )}
                    >
                      {task.status}
                    </button>
                    {task.subtasks.length > 0 && (
                      <button
                        onClick={(e) => toggleExpand(task.id, e)}
                        className="flex items-center justify-center gap-1 text-xs font-medium text-indigo-500 px-2 py-1.5 min-h-[32px] rounded-lg bg-indigo-500/10 cursor-pointer"
                      >
                        <CheckSquare size={12} /> {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text)] leading-tight">{task.name}</h4>
                </div>
                {blocked && <Lock size={12} className="text-amber-500 shrink-0" />}
              </div>

              {/* Subtasks checklist on mobile */}
              {isExpanded && task.subtasks.length > 0 && (
                <div className="mt-3 p-3 bg-[var(--color-surface-2)] rounded-xl space-y-1.5 border border-[var(--color-divider)]">
                  {task.subtasks.map(s => (
                    <div 
                      key={s.id} 
                      onClick={(e) => handleToggleSubtask(task, s.id, e)}
                      className="flex items-center gap-2 text-xs cursor-pointer text-[var(--color-text)] hover:opacity-80"
                    >
                      {s.done ? <CheckSquare size={14} className="text-emerald-500 shrink-0" /> : <Square size={14} className="text-[var(--color-text-faint)] shrink-0" />}
                      <span className={clsx(s.done && "line-through text-[var(--color-text-muted)]")}>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-divider)]">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] truncate max-w-[100px]">{task.module}</span>
                  <span className={clsx("text-[10px] font-mono", overdue ? "text-red-500 font-bold" : "text-[var(--color-text-muted)]")}>
                    {fmtDate(task.dueDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-[var(--color-text)]">{task.progress}%</span>
                  <div className="w-12 h-1 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary-hex)]" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view table */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)]">
              <th 
                onClick={() => { setSortField('id'); setSortAsc(!sortAsc); }}
                className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-24 cursor-pointer hover:text-[var(--color-text)]"
              >
                <div className="flex items-center gap-1">
                  ID <ArrowUpDown size={10} />
                </div>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-36">Module</th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] min-w-[240px]">Task Name & Checklist</th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-36">Status</th>
              <th 
                onClick={() => { setSortField('priority'); setSortAsc(!sortAsc); }}
                className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-24 cursor-pointer hover:text-[var(--color-text)]"
              >
                <div className="flex items-center gap-1">
                  Priority <ArrowUpDown size={10} />
                </div>
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-32">Assignee</th>
              <th 
                onClick={() => { setSortField('dueDate'); setSortAsc(!sortAsc); }}
                className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-28 cursor-pointer hover:text-[var(--color-text)]"
              >
                <div className="flex items-center gap-1">
                  Due Date <ArrowUpDown size={10} />
                </div>
              </th>
              <th 
                onClick={() => { setSortField('progress'); setSortAsc(!sortAsc); }}
                className="px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] w-28 text-right cursor-pointer hover:text-[var(--color-text)]"
              >
                <div className="flex items-center justify-end gap-1">
                  Progress <ArrowUpDown size={10} />
                </div>
              </th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-divider)]">
            {filteredTasks.map((task) => {
              const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED;
              const blocked = isBlocked(task, state.tasks);
              const isExpanded = expandedTasks.has(task.id);
              const paddingClass = density === 'compact' ? "py-2" : "py-3.5";

              return (
                <React.Fragment key={task.id}>
                  <tr 
                    className={clsx(
                      "group hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer relative",
                      blocked && "bg-amber-500/5"
                    )}
                    onClick={() => onEditTask(task.id)}
                  >
                    <td className={clsx("px-4 text-[11px] font-mono font-bold text-[var(--color-primary-hex)]", paddingClass)}>
                      <div className="flex items-center gap-1.5">
                        {task.subtasks.length > 0 && (
                          <button
                            onClick={(e) => toggleExpand(task.id, e)}
                            className="p-0.5 rounded hover:bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]"
                          >
                            <ChevronRight size={12} className={clsx("motion-safe:transition-transform", isExpanded && "rotate-90")} />
                          </button>
                        )}
                        {blocked && <Lock size={10} className="text-amber-500 shrink-0" />}
                        <span>{task.id}</span>
                      </div>
                    </td>

                    <td className={clsx("px-4", paddingClass)}>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">
                          {task.moduleType || 'Server'}
                        </span>
                        <span className="text-[12px] font-semibold text-[var(--color-text)] truncate max-w-[130px]">
                          {task.module}
                        </span>
                      </div>
                    </td>

                    <td className={clsx("px-4", paddingClass)}>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[var(--color-text)]">
                          {task.name}
                        </span>
                        {task.release && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 text-[9px] font-mono font-bold">
                            {task.release}
                          </span>
                        )}
                        {task.subtasks.length > 0 && (
                          <button
                            onClick={(e) => toggleExpand(task.id, e)}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-600"
                            title="Toggle Checklist"
                          >
                            <CheckSquare size={10} />
                            {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                          </button>
                        )}
                        {state.defects.filter(d => d.linkedId === task.id).length > 0 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-600">
                            <Bug size={10} />
                            {state.defects.filter(d => d.linkedId === task.id).length}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className={clsx("px-4", paddingClass)}>
                      <button
                        onClick={(e) => handleCycleStatus(task, e)}
                        title="Click to cycle status"
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium motion-safe:transition-transform active:scale-95",
                          getStatusStyle(task.status)
                        )}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        {task.status}
                      </button>
                    </td>

                    <td className={clsx("px-4", paddingClass)}>
                      <span className={clsx("text-xs font-medium", getPriorityStyle(task.priority))}>
                        {task.priority}
                      </span>
                    </td>

                    <td className={clsx("px-4 text-[12px] text-[var(--color-text-muted)] font-medium", paddingClass)}>
                      {task.assignee || 'Unassigned'}
                    </td>

                    <td className={clsx("px-4", paddingClass)}>
                      <div className={clsx(
                        "flex items-center gap-1.5 text-[11px] font-mono",
                        overdue ? "text-red-500 font-bold" : "text-[var(--color-text-muted)]"
                      )}>
                        {overdue && <AlertTriangle size={12} />}
                        {fmtDate(task.dueDate)}
                      </div>
                    </td>

                    <td className={clsx("px-4 text-right", paddingClass)}>
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-14 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden shrink-0">
                          <div 
                            className="h-full bg-[var(--color-primary-hex)] rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold w-8 text-right text-[var(--color-text)]">
                          {task.progress}%
                        </span>
                      </div>
                    </td>

                    <td className={clsx("px-3 text-right opacity-0 group-hover:opacity-100 transition-opacity", paddingClass)}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--color-text-muted)] active:scale-[0.98]">
                        <MoreHorizontal size={14} />
                      </Button>
                    </td>
                  </tr>

                  {/* Expanded Subtask Checklist Row */}
                  {isExpanded && task.subtasks.length > 0 && (
                    <tr className="bg-[var(--color-surface-2)]/60 border-y border-[var(--color-divider)]">
                      <td colSpan={9} className="px-10 py-3">
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5">
                            <CheckSquare size={12} className="text-indigo-600" />
                            Subtask Steps & GUI Checklist for {task.id}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {task.subtasks.map(s => (
                              <div
                                key={s.id}
                                onClick={(e) => handleToggleSubtask(task, s.id, e)}
                                className={clsx(
                                  "p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors duration-150 active:scale-[0.98]",
                                  s.done 
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800" 
                                    : "bg-[var(--color-surface)] border-[var(--color-divider)] hover:border-indigo-500/30 text-[var(--color-text)]"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {s.done ? (
                                    <CheckSquare size={14} className="text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square size={14} className="text-[var(--color-text-faint)] shrink-0" />
                                  )}
                                  <span className={clsx("font-semibold truncate", s.done && "line-through text-[var(--color-text-muted)]")}>
                                    {s.name}
                                  </span>
                                </div>
                                <span className="text-xs text-[var(--color-text-faint)] shrink-0 ml-2">
                                  {s.effort || 1}d
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskGrid;
