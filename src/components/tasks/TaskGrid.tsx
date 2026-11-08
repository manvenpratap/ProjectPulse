import React, { useState, useMemo } from 'react';
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
  Sparkles,
  Trash2,
  Check,
  X,
  User,
  Calendar,
  Layers2
} from 'lucide-react';
import Button from '../shared/Button';
import { motion, AnimatePresence } from 'motion/react';

interface TaskGridProps {
  onEditTask: (id: string) => void;
}

type DensityMode = 'comfortable' | 'compact';

const ST_MAP: Record<string, string> = {
  [TaskStatus.NOT_STARTED]: 'not-started',
  [TaskStatus.IN_PROGRESS]: 'in-progress',
  [TaskStatus.UNDER_REVIEW]: 'under-review',
  [TaskStatus.COMPLETED]: 'completed',
  [TaskStatus.ON_HOLD]: 'on-hold',
  [TaskStatus.CANCELLED]: 'cancelled',
};

const PRI_MAP: Record<string, string> = {
  [TaskPriority.CRITICAL]: 'critical',
  [TaskPriority.HIGH]: 'high',
  [TaskPriority.MEDIUM]: 'medium',
  [TaskPriority.LOW]: 'low',
};

const TaskGrid: React.FC<TaskGridProps> = ({ onEditTask }) => {
  const { state, searchTerm, updateTask, deleteTask } = useProject();
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedRelease, setSelectedRelease] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showInlineFilters, setShowInlineFilters] = useState<boolean>(true);
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'id' | 'name' | 'module' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'progress'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Bulk Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Filter options
  const modules = useMemo(() => Array.from(new Set(state.tasks.map(t => t.module).filter(Boolean))), [state.tasks]);
  const releases = useMemo(() => Array.from(new Set(state.tasks.map(t => t.release).filter(Boolean))), [state.tasks]);
  const assignees = useMemo(() => Array.from(new Set(state.tasks.map(t => t.assignee).filter(Boolean))), [state.tasks]);

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

  // Bulk Selection Handlers
  const toggleSelectTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleBatchUpdateStatus = (newStatus: TaskStatus) => {
    if (!selectedTaskIds.size) return;
    const isDone = newStatus === TaskStatus.COMPLETED;
    selectedTaskIds.forEach(id => {
      updateTask(id, {
        status: newStatus,
        progress: isDone ? 100 : undefined,
        actCompletionDate: isDone ? todayStr() : null
      }, `Batch status update: ${newStatus}`);
    });
    setSelectedTaskIds(new Set());
  };

  const handleBatchUpdatePriority = (newPriority: TaskPriority) => {
    if (!selectedTaskIds.size) return;
    selectedTaskIds.forEach(id => {
      updateTask(id, { priority: newPriority }, `Batch priority update: ${newPriority}`);
    });
    setSelectedTaskIds(new Set());
  };

  const handleBatchUpdateAssignee = (newAssignee: string) => {
    if (!selectedTaskIds.size) return;
    selectedTaskIds.forEach(id => {
      updateTask(id, { assignee: newAssignee }, `Batch assignee update: ${newAssignee}`);
    });
    setSelectedTaskIds(new Set());
  };

  const handleBatchDelete = () => {
    if (!selectedTaskIds.size) return;
    if (window.confirm(`Delete ${selectedTaskIds.size} selected task(s)? This action cannot be undone.`)) {
      selectedTaskIds.forEach(id => deleteTask(id));
      setSelectedTaskIds(new Set());
    }
  };

  // Sorting helper
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return state.tasks.filter(t => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.module.toLowerCase().includes(q) ||
        (t.assignee && t.assignee.toLowerCase().includes(q));

      const matchesModule = selectedModule === 'all' || t.module === selectedModule;
      const matchesRelease = selectedRelease === 'all' || t.release === selectedRelease;
      const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchesAssignee = selectedAssignee === 'all' || t.assignee === selectedAssignee;
      const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;

      return matchesSearch && matchesModule && matchesRelease && matchesStatus && matchesAssignee && matchesPriority;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'id') {
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'module') {
        cmp = a.module.localeCompare(b.module);
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortField === 'assignee') {
        cmp = (a.assignee || '').localeCompare(b.assignee || '');
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
  }, [state.tasks, searchTerm, selectedModule, selectedRelease, selectedStatus, selectedAssignee, selectedPriority, sortField, sortAsc]);

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

  const isAllSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;

  return (
    <div className="space-y-3.5">
      {/* ── 1. Table Toolbar & Operational Controls ── */}
      <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Module Filter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <Layers size={13} className="text-[var(--color-text-faint)]" />
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer"
            >
              <option value="all">All Modules ({modules.length})</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Quick Release Filter */}
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

          {/* Toggle Inline Filters */}
          <button
            onClick={() => setShowInlineFilters(!showInlineFilters)}
            className={clsx(
              "px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer",
              showInlineFilters 
                ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/30"
                : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)]"
            )}
            title="Toggle column header filter row"
          >
            <Filter size={13} />
            <span>{showInlineFilters ? 'Filters Visible' : 'Show Filters'}</span>
          </button>
        </div>

        {/* View Density & Filter Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
            <strong className="text-[var(--color-text)]">{filteredTasks.length}</strong> / {state.tasks.length} tasks
          </span>

          <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <button
              onClick={() => setDensity('compact')}
              className={clsx(
                "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                density === 'compact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
              )}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={clsx(
                "px-2.5 py-1 min-h-[30px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                density === 'comfortable' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
              )}
            >
              Comfortable
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Floating / Docked Bulk Actions Bar ── */}
      <AnimatePresence>
        {selectedTaskIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="p-2.5 sm:p-3 bg-[var(--color-surface-2)] border-2 border-[var(--color-primary-hex)] rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-extrabold text-[var(--color-primary-hex)] flex items-center gap-1.5">
                <CheckSquare size={14} />
                {selectedTaskIds.size} task(s) selected
              </span>

              <div className="h-4 w-px bg-[var(--color-divider)] hidden sm:block" />

              {/* Batch Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">Status:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBatchUpdateStatus(e.target.value as TaskStatus);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
                >
                  <option value="" disabled>Set Status...</option>
                  {Object.values(TaskStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Batch Priority */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">Priority:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBatchUpdatePriority(e.target.value as TaskPriority);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
                >
                  <option value="" disabled>Set Priority...</option>
                  {Object.values(TaskPriority).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Batch Assignee */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">Assignee:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBatchUpdateAssignee(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
                >
                  <option value="" disabled>Assign To...</option>
                  {state.members.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete Selected</span>
              </button>
              <button
                onClick={() => setSelectedTaskIds(new Set())}
                className="px-2.5 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] font-semibold transition-colors cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Desktop Table (Full HTML System Standards) ── */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-xs">
        <table className="w-full text-left border-collapse min-w-[1100px] table-fixed">
          <thead>
            {/* Header Row */}
            <tr className="bg-[var(--color-surface-offset)] border-b-2 border-[var(--color-border)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] select-none">
              {/* Checkbox Column */}
              <th className="p-2.5 w-10 text-center border-r border-[var(--color-divider)]">
                <input 
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all tasks"
                  className="rounded border-[var(--color-divider)] cursor-pointer"
                />
              </th>

              {/* Row Num Column (#) */}
              <th className="p-2.5 w-11 text-center border-r border-[var(--color-divider)] td-rn font-mono text-[10px]">
                #
              </th>

              {/* Expand Column */}
              <th className="p-2.5 w-8 text-center border-r border-[var(--color-divider)]"></th>

              {/* Task ID */}
              <th 
                onClick={() => handleSort('id')}
                className="p-2.5 w-24 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>TASK ID</span>
                  <span className={clsx("text-[9px]", sortField === 'id' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'id' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Module & Screen */}
              <th 
                onClick={() => handleSort('module')}
                className="p-2.5 w-40 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>MODULE & SCOPE</span>
                  <span className={clsx("text-[9px]", sortField === 'module' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'module' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Task Name & Checklist */}
              <th 
                onClick={() => handleSort('name')}
                className="p-2.5 min-w-[260px] cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>TASK NAME & CHECKLIST</span>
                  <span className={clsx("text-[9px]", sortField === 'name' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'name' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Status */}
              <th 
                onClick={() => handleSort('status')}
                className="p-2.5 w-36 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>STATUS</span>
                  <span className={clsx("text-[9px]", sortField === 'status' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'status' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Priority */}
              <th 
                onClick={() => handleSort('priority')}
                className="p-2.5 w-28 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)] text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>PRIORITY</span>
                  <span className={clsx("text-[9px]", sortField === 'priority' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'priority' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Assignee */}
              <th 
                onClick={() => handleSort('assignee')}
                className="p-2.5 w-36 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>ASSIGNEE</span>
                  <span className={clsx("text-[9px]", sortField === 'assignee' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'assignee' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Due Date */}
              <th 
                onClick={() => handleSort('dueDate')}
                className="p-2.5 w-30 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
              >
                <div className="flex items-center justify-between gap-1">
                  <span>DUE DATE</span>
                  <span className={clsx("text-[9px]", sortField === 'dueDate' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'dueDate' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Progress */}
              <th 
                onClick={() => handleSort('progress')}
                className="p-2.5 w-28 text-right cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>PROGRESS</span>
                  <span className={clsx("text-[9px]", sortField === 'progress' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                    {sortField === 'progress' ? (sortAsc ? '↑' : '↓') : '↕'}
                  </span>
                </div>
              </th>

              {/* Actions Column */}
              <th className="p-2.5 w-12 text-center"></th>
            </tr>

            {/* Inline Column Filters Row (Matching projectpulse.html) */}
            {showInlineFilters && (
              <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)] text-xs">
                {/* Empty check / rn / expand */}
                <th className="p-1 border-r border-[var(--color-divider)]"></th>
                <th className="p-1 border-r border-[var(--color-divider)]"></th>
                <th className="p-1 border-r border-[var(--color-divider)]"></th>

                {/* ID filter dummy */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <span className="text-[10px] text-[var(--color-text-faint)] font-mono pl-1">—</span>
                </th>

                {/* Module filter */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <select
                    value={selectedModule}
                    onChange={e => setSelectedModule(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                  >
                    <option value="all">All Modules</option>
                    {modules.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </th>

                {/* Name filter */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <span className="text-[10px] text-[var(--color-text-faint)] italic pl-1">Filtered by topbar search</span>
                </th>

                {/* Status filter */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                  >
                    <option value="all">All Statuses</option>
                    {Object.values(TaskStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </th>

                {/* Priority filter */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <select
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                  >
                    <option value="all">All</option>
                    {Object.values(TaskPriority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </th>

                {/* Assignee filter */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <select
                    value={selectedAssignee}
                    onChange={e => setSelectedAssignee(e.target.value)}
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                  >
                    <option value="all">All Team</option>
                    {assignees.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </th>

                {/* Date */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <span className="text-[10px] text-[var(--color-text-faint)] pl-1">—</span>
                </th>

                {/* Progress */}
                <th className="p-1 border-r border-[var(--color-divider)]">
                  <span className="text-[10px] text-[var(--color-text-faint)] pl-1">—</span>
                </th>

                <th className="p-1 text-center">
                  {(selectedModule !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all' || selectedPriority !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedModule('all');
                        setSelectedStatus('all');
                        setSelectedAssignee('all');
                        setSelectedPriority('all');
                      }}
                      title="Reset inline filters"
                      className="text-[10px] text-[var(--color-primary-hex)] hover:underline font-bold"
                    >
                      Reset
                    </button>
                  )}
                </th>
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-[var(--color-divider)]">
            {filteredTasks.map((task, idx) => {
              const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
              const blocked = isBlocked(task, state.tasks);
              const isExpanded = expandedTasks.has(task.id);
              const isSelected = selectedTaskIds.has(task.id);
              const isMilestone = (task.startDate && task.startDate === task.dueDate) || task.subtasks.some(s => s.name.toLowerCase().includes('milestone'));
              const padY = density === 'compact' ? "py-1.5" : "py-3";

              return (
                <React.Fragment key={task.id}>
                  <tr 
                    onClick={() => onEditTask(task.id)}
                    className={clsx(
                      "group hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer relative",
                      isSelected && "bg-[var(--color-primary-highlight-hex)]/40",
                      overdue && "is-overdue",
                      isMilestone && "is-milestone"
                    )}
                  >
                    {/* Checkbox */}
                    <td className={clsx("p-2.5 text-center border-r border-[var(--color-divider)]", padY)} onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectTask(task.id, e as any)}
                        className="rounded border-[var(--color-divider)] cursor-pointer"
                      />
                    </td>

                    {/* Row Num */}
                    <td className={clsx("p-2.5 text-center border-r border-[var(--color-divider)] td-rn font-mono", padY)}>
                      {idx + 1}
                    </td>

                    {/* Expand Subtasks Button */}
                    <td className={clsx("p-1 text-center border-r border-[var(--color-divider)]", padY)}>
                      {task.subtasks.length > 0 ? (
                        <button
                          onClick={(e) => toggleExpand(task.id, e)}
                          title={`${isExpanded ? 'Collapse' : 'Expand'} subtasks`}
                          className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-[var(--color-surface-offset)] text-[var(--color-text-muted)] cursor-pointer transition-transform"
                        >
                          <ChevronRight size={13} className={clsx("transition-transform", isExpanded && "rotate-90")} />
                        </button>
                      ) : null}
                    </td>

                    {/* Task ID */}
                    <td className={clsx("p-2.5 font-mono font-bold text-[11px] text-[var(--color-primary-hex)] border-r border-[var(--color-divider)]", padY)}>
                      <div className="flex items-center gap-1.5">
                        {blocked && <Lock size={11} className="text-amber-500 shrink-0" title="Blocked by dependency" />}
                        <span>{task.id}</span>
                      </div>
                    </td>

                    {/* Module & Scope */}
                    <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[var(--color-text)] truncate max-w-[140px]">
                          {task.module}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono truncate">
                          {task.moduleType || 'Server'}
                        </span>
                      </div>
                    </td>

                    {/* Task Name & Checklist */}
                    <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isMilestone && <span title="Milestone">🚩</span>}
                        <span className="text-xs font-bold text-[var(--color-text)] leading-tight">
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
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-medium text-indigo-600"
                            title="Toggle Checklist"
                          >
                            <CheckSquare size={10} />
                            {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                          </button>
                        )}
                      </div>
                      {task.screenName && (
                        <div className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                          Screen: {task.screenName}
                        </div>
                      )}
                    </td>

                    {/* Status Pill (st-badge) */}
                    <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                      <button
                        onClick={(e) => handleCycleStatus(task, e)}
                        title="Click to cycle status"
                        className={clsx("st-badge cursor-pointer", `st-${ST_MAP[task.status] || 'not-started'}`)}
                      >
                        <span className="dot" />
                        <span>{task.status}</span>
                      </button>
                    </td>

                    {/* Priority Pill (pri-badge) */}
                    <td className={clsx("p-2.5 text-center border-r border-[var(--color-divider)]", padY)}>
                      <span className={clsx("pri-badge", `pri-${PRI_MAP[task.priority] || 'medium'}`)}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                      {task.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[9px] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/30">
                            {task.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-[var(--color-text)] truncate max-w-[100px]">
                            {task.assignee}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--color-text-faint)] italic">—</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className={clsx("p-2.5 font-mono text-[11px] border-r border-[var(--color-divider)]", padY)}>
                      <span className={clsx(overdue ? "text-red-500 font-bold" : "text-[var(--color-text-muted)]")}>
                        {fmtDate(task.dueDate)}
                      </span>
                    </td>

                    {/* Progress Bar */}
                    <td className={clsx("p-2.5 text-right border-r border-[var(--color-divider)]", padY)}>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] font-mono font-bold text-[var(--color-text)]">{task.progress}%</span>
                        <div className="w-14 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-black/5">
                          <div 
                            className={clsx(
                              "h-full transition-all",
                              task.progress >= 100 ? "bg-emerald-500" : task.progress >= 50 ? "bg-[var(--color-primary-hex)]" : "bg-amber-500"
                            )} 
                            style={{ width: `${task.progress}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* Row Actions */}
                    <td className={clsx("p-2 text-center", padY)} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onEditTask(task.id)}
                        className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)]"
                        title="Edit task"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>

                  {/* ── Subtasks Expansion Rows (Matching projectpulse.html) ── */}
                  {isExpanded && task.subtasks.map((st, sIdx) => {
                    return (
                      <tr
                        key={st.id}
                        className="bg-[var(--color-surface-2)]/40 hover:bg-[var(--color-surface-2)]/80 transition-colors text-xs"
                      >
                        {/* Blank check */}
                        <td className="p-2 border-r border-[var(--color-divider)]"></td>

                        {/* Subtask Row Number (e.g. 1.1, 1.2) */}
                        <td className="p-2 text-center border-r border-[var(--color-divider)] font-mono text-[9px] text-[var(--color-text-faint)]">
                          {idx + 1}.{sIdx + 1}
                        </td>

                        {/* Blank expand */}
                        <td className="p-2 border-r border-[var(--color-divider)]"></td>

                        {/* Subtask ID */}
                        <td className="p-2 font-mono text-[10px] text-[var(--color-text-muted)] border-r border-[var(--color-divider)]">
                          {st.id}
                        </td>

                        {/* Scope */}
                        <td className="p-2 border-r border-[var(--color-divider)] text-[11px] text-[var(--color-text-muted)] italic">
                          Subtask
                        </td>

                        {/* Subtask Name & Checklist toggle */}
                        <td className="p-2 border-r border-[var(--color-divider)]">
                          <div 
                            onClick={(e) => handleToggleSubtask(task, st.id, e)}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            {st.done ? (
                              <CheckSquare size={13} className="text-emerald-500 shrink-0" />
                            ) : (
                              <Square size={13} className="text-[var(--color-text-faint)] group-hover:text-[var(--color-primary-hex)] shrink-0" />
                            )}
                            <span className={clsx("text-xs font-medium", st.done ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text)]")}>
                              {st.name}
                            </span>
                          </div>
                        </td>

                        {/* Subtask Status */}
                        <td className="p-2 border-r border-[var(--color-divider)]">
                          <span className={clsx("st-badge text-[9px] py-0.5", st.done ? "st-completed" : "st-in-progress")}>
                            <span className="dot" />
                            <span>{st.done ? 'Completed' : 'In Progress'}</span>
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="p-2 border-r border-[var(--color-divider)] text-center">
                          <span className="text-[10px] text-[var(--color-text-faint)]">—</span>
                        </td>

                        {/* Assignee */}
                        <td className="p-2 border-r border-[var(--color-divider)]">
                          <span className="text-[11px] text-[var(--color-text-muted)]">{st.assignee || '—'}</span>
                        </td>

                        {/* Due Date */}
                        <td className="p-2 border-r border-[var(--color-divider)] text-[10px] font-mono text-[var(--color-text-faint)]">
                          {st.dueDate ? fmtDate(st.dueDate) : '—'}
                        </td>

                        {/* Progress */}
                        <td className="p-2 border-r border-[var(--color-divider)] text-right">
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{st.done ? '100%' : '0%'}</span>
                        </td>

                        <td className="p-2"></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── 4. Mobile View Cards (Touch-friendly & responsive) ── */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {filteredTasks.map((task) => {
          const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
          const blocked = isBlocked(task, state.tasks);
          const isExpanded = expandedTasks.has(task.id);
          
          return (
            <div 
              key={task.id}
              onClick={() => onEditTask(task.id)}
              className={clsx(
                "p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs motion-safe:active:scale-[0.98] transition-colors duration-150 relative",
                blocked && "bg-amber-500/5 border-amber-500/20",
                overdue && "border-l-4 border-l-rose-500"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-[var(--color-primary-hex)]">{task.id}</span>
                    <button
                      onClick={(e) => handleCycleStatus(task, e)}
                      title="Click to cycle status"
                      className={clsx("st-badge text-[10px]", `st-${ST_MAP[task.status] || 'not-started'}`)}
                    >
                      <span className="dot" />
                      <span>{task.status}</span>
                    </button>
                    {task.subtasks.length > 0 && (
                      <button
                        onClick={(e) => toggleExpand(task.id, e)}
                        className="flex items-center justify-center gap-1 text-xs font-medium text-indigo-500 px-2 py-1 min-h-[32px] rounded-lg bg-indigo-500/10 cursor-pointer"
                      >
                        <CheckSquare size={12} /> {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-[var(--color-text)] leading-tight mt-1">{task.name}</h4>
                </div>
                {blocked && <Lock size={14} className="text-amber-500 shrink-0 ml-2" />}
              </div>

              {/* Subtasks checklist on mobile */}
              {isExpanded && task.subtasks.length > 0 && (
                <div className="mt-3 p-3 bg-[var(--color-surface-2)] rounded-xl space-y-2 border border-[var(--color-divider)]">
                  {task.subtasks.map(s => (
                    <div 
                      key={s.id} 
                      onClick={(e) => handleToggleSubtask(task, s.id, e)}
                      className="flex items-center gap-2 text-xs cursor-pointer text-[var(--color-text)] min-h-[32px]"
                    >
                      {s.done ? <CheckSquare size={16} className="text-emerald-500 shrink-0" /> : <Square size={16} className="text-[var(--color-text-faint)] shrink-0" />}
                      <span className={clsx(s.done && "line-through text-[var(--color-text-muted)]")}>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-divider)] text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[var(--color-text-muted)] truncate max-w-[110px]">{task.module}</span>
                  <span className={clsx("font-mono text-[11px]", overdue ? "text-red-500 font-bold" : "text-[var(--color-text-muted)]")}>
                    {fmtDate(task.dueDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[var(--color-text)]">{task.progress}%</span>
                  <div className="w-12 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary-hex)]" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskGrid;
