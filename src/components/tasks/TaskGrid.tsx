import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, TaskStatus, TaskPriority, Subtask } from '../../types';
import { fmtDate, daysDiff, isBlocked, todayStr } from '../../utils/projectUtils';
import { computeSubtaskRollup, nextTaskQuickStatus } from '../../utils/stateMachines';
import { toast } from '../../utils/toast';
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
  Trash2,
  Check,
  X,
  User,
  Calendar,
  Layers2,
  Plus,
  Search,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import Button from '../shared/Button';
import { motion, AnimatePresence } from 'motion/react';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef } from '../shared/DataTable';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import { markInteractionOrigin } from '../../utils/designSpells';

interface TaskGridProps {
  onEditTask: (id: string) => void;
  onNewTask?: () => void;
  selectedModule?: string;
  setSelectedModule?: (mod: string) => void;
  selectedRelease?: string;
  setSelectedRelease?: (rel: string) => void;
  showInlineFilters?: boolean;
  setShowInlineFilters?: (show: boolean) => void;
  density?: DensityMode;
  setDensity?: (density: DensityMode) => void;
  hideToolbar?: boolean;
}

type DensityMode = 'comfortable' | 'compact';

const ST_MAP: Record<string, string> = {
  [TaskStatus.NOT_STARTED]: 'not-started',
  [TaskStatus.IN_PROGRESS]: 'in-progress',
  [TaskStatus.UNDER_REVIEW]: 'under-review',
  [TaskStatus.COMPLETED]: 'completed',
  [TaskStatus.BLOCKED]: 'blocked',
  [TaskStatus.ON_HOLD]: 'on-hold',
  [TaskStatus.CANCELLED]: 'cancelled',
};

const PRI_MAP: Record<string, string> = {
  [TaskPriority.CRITICAL]: 'critical',
  [TaskPriority.HIGH]: 'high',
  [TaskPriority.MEDIUM]: 'medium',
  [TaskPriority.LOW]: 'low',
};

const TaskGrid: React.FC<TaskGridProps> = ({ 
  onEditTask, 
  onNewTask,
  selectedModule: propSelectedModule,
  setSelectedModule: propSetSelectedModule,
  selectedRelease: propSelectedRelease,
  setSelectedRelease: propSetSelectedRelease,
  showInlineFilters: propShowInlineFilters,
  setShowInlineFilters: propSetShowInlineFilters,
  density: propDensity,
  setDensity: propSetDensity,
  hideToolbar = false
}) => {
  const { state, searchTerm, setSearchTerm, updateTask, deleteTask } = useProject();
  const [internalSelectedModule, setInternalSelectedModule] = useState<string>('all');
  const selectedModule = propSelectedModule !== undefined ? propSelectedModule : internalSelectedModule;
  const setSelectedModule = propSetSelectedModule || setInternalSelectedModule;

  const [internalSelectedRelease, setInternalSelectedRelease] = useState<string>('all');
  const selectedRelease = propSelectedRelease !== undefined ? propSelectedRelease : internalSelectedRelease;
  const setSelectedRelease = propSetSelectedRelease || setInternalSelectedRelease;

  const [internalShowInlineFilters, setInternalShowInlineFilters] = useState<boolean>(true);
  const showInlineFilters = propShowInlineFilters !== undefined ? propShowInlineFilters : internalShowInlineFilters;
  const setShowInlineFilters = propSetShowInlineFilters || setInternalShowInlineFilters;

  const [internalDensity, setInternalDensity] = useState<DensityMode>('comfortable');
  const density = propDensity !== undefined ? propDensity : internalDensity;
  const setDensity = propSetDensity || setInternalDensity;

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'id' | 'name' | 'module' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'progress'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Quick Preset Filters & Search Shortcut
  type FilterPreset = 'all' | 'blocked' | 'critical' | 'overdue';
  const [activePreset, setActivePreset] = useState<FilterPreset>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bulk Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  // Master-Detail Peek Side Drawer State
  const [peekTaskId, setPeekTaskId] = useState<string | null>(null);

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
    const nextStatus = nextTaskQuickStatus(task.status);
    if (nextStatus === TaskStatus.COMPLETED) {
      markInteractionOrigin(e.currentTarget);
    }

    const res = updateTask(task.id, { status: nextStatus }, `Status transitioned to ${nextStatus}`);
    if (!res.ok) {
      toast.error(res.reason || 'Status transition failed.');
    }
  };

  const handleToggleSubtask = (task: Task, subId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const patch = computeSubtaskRollup(task, subId);
    if (patch.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      markInteractionOrigin(e.currentTarget);
    }

    const res = updateTask(task.id, patch, `Checklist updated: ST ${subId}`);
    if (!res.ok) {
      toast.error(res.reason || 'Checklist update failed.');
    }
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
    const rejected: string[] = [];
    selectedTaskIds.forEach(id => {
      const res = updateTask(id, { status: newStatus }, `Batch status update: ${newStatus}`);
      if (!res.ok) rejected.push(id);
    });
    if (rejected.length > 0) {
      toast.warning(`Skipped dependency-blocked task(s): ${rejected.join(', ')}`);
    } else {
      toast.success(`Updated ${selectedTaskIds.size} task(s) to ${newStatus}.`);
    }
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

  // Keyboard shortcut: Esc to clear selection
  useEffect(() => {
    if (selectedTaskIds.size === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTaskIds(new Set());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIds.size]);

  // Sorting helper
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const today = todayStr();
  const countBlocked = useMemo(() => state.tasks.filter(t => t.status === TaskStatus.BLOCKED || t.status === TaskStatus.ON_HOLD).length, [state.tasks]);
  const countCritical = useMemo(() => state.tasks.filter(t => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH).length, [state.tasks]);
  const countOverdue = useMemo(() => state.tasks.filter(t => Boolean(t.dueDate) && t.dueDate < today && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length, [state.tasks, today]);

  const isAnyFilterActive = 
    activePreset !== 'all' || 
    Boolean(searchTerm.trim()) || 
    selectedModule !== 'all' || 
    selectedRelease !== 'all' || 
    selectedStatus !== 'all' || 
    selectedPriority !== 'all' || 
    selectedAssignee !== 'all';

  const resetAllFilters = () => {
    setActivePreset('all');
    setSearchTerm('');
    setSelectedModule('all');
    setSelectedRelease('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedAssignee('all');
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

      const matchesPreset = 
        activePreset === 'all' ? true :
        activePreset === 'blocked' ? (t.status === TaskStatus.BLOCKED || t.status === TaskStatus.ON_HOLD) :
        activePreset === 'critical' ? (t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH) :
        activePreset === 'overdue' ? (Boolean(t.dueDate) && t.dueDate < today && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED) :
        true;

      const matchesModule = selectedModule === 'all' || t.module === selectedModule;
      const matchesRelease = selectedRelease === 'all' || t.release === selectedRelease;
      const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchesAssignee = selectedAssignee === 'all' || t.assignee === selectedAssignee;
      const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;

      return matchesSearch && matchesPreset && matchesModule && matchesRelease && matchesStatus && matchesAssignee && matchesPriority;
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
  }, [state.tasks, searchTerm, activePreset, selectedModule, selectedRelease, selectedStatus, selectedAssignee, selectedPriority, sortField, sortAsc, today]);

  const pagination = usePagination<Task>(filteredTasks, 10, 'pp_page_size_tasks');

  // Peek Side Drawer Navigation
  const peekTask = useMemo(() => (peekTaskId ? state.tasks.find(t => t.id === peekTaskId) || null : null), [state.tasks, peekTaskId]);
  const currentPeekIndex = peekTaskId ? filteredTasks.findIndex(t => t.id === peekTaskId) : -1;
  const hasPrevious = currentPeekIndex > 0;
  const hasNext = currentPeekIndex >= 0 && currentPeekIndex < filteredTasks.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) setPeekTaskId(filteredTasks[currentPeekIndex - 1].id);
  };

  const handleNext = () => {
    if (hasNext) setPeekTaskId(filteredTasks[currentPeekIndex + 1].id);
  };

  if (!state.tasks.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--color-divider)] rounded-2xl bg-[var(--color-surface)]">
        <div className="w-14 h-14 bg-[var(--color-surface-2)] rounded-xl flex items-center justify-center mb-3 text-[var(--color-text-muted)]">
          <Layers size={28} />
        </div>
        <h3 className="text-base font-bold text-[var(--color-text)] mb-1">Work Breakdown Matrix is Empty</h3>
        <p className="text-xs text-[var(--color-text-muted)] max-w-sm mb-5 leading-relaxed">
          Create engineering tasks across modules or import an Excel database to unlock Gantt scheduling, critical path, and burnup telemetry.
        </p>
        <button
          onClick={onNewTask}
          className="h-9 px-4 rounded-lg bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] text-xs font-bold shadow-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} /> Create First Task
        </button>
      </div>
    );
  }

  // User-configured column customizations from Field Architect
  const colMap = useMemo(() => {
    const map: Record<string, { label: string; width?: number; visible?: boolean }> = {};
    (state.cols || []).forEach(c => {
      map[c.key] = { label: c.label, width: c.width, visible: c.visible !== false };
    });
    return map;
  }, [state.cols]);

  const columns = useMemo<ColumnDef<Task>[]>(() => {
    const baseCols: ColumnDef<Task>[] = [
    {
      id: 'id',
      header: colMap['id']?.label || 'TASK ID',
      headerTitle: 'Unique persistent task identifier (e.g. T-101). Click to sort.',
      sortable: true,
      width: 'w-24',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] font-mono pl-1">—</span>,
      cell: (task) => {
        const blocked = isBlocked(task, state.tasks);
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-mono font-bold text-[11px] text-[var(--color-primary-hex)] whitespace-nowrap">
              {blocked && (
                <span title="Blocked by dependency" className="inline-flex items-center shrink-0">
                  <Lock size={11} className="text-amber-500" />
                </span>
              )}
              <span className="hover:underline">{task.id}</span>
            </div>
            <div className="cell-secondary text-[9px] font-mono text-[var(--color-text-faint)] mt-0.5 truncate">
              {blocked ? 'Blocked' : (task.subtasks.length > 0 ? `${task.subtasks.length} steps` : 'Base')}
            </div>
          </div>
        );
      }
    },
    {
      id: 'module',
      header: colMap['module']?.label || 'MODULE & SCOPE',
      headerTitle: 'Functional architectural domain of the codebase this task impacts. Click to sort.',
      sortable: true,
      width: 'w-44',
      filter: (
        <select
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 focus:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-text)] outline-none transition-all shadow-2xs"
        >
          <option value="all">All Modules</option>
          {modules.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      ),
      cell: (task) => (
        <div className="min-w-0 max-w-[170px]">
          <div className="flex items-center gap-1.5 truncate whitespace-nowrap">
            <span className="text-xs font-medium text-[var(--color-text)] truncate" title={task.module}>
              {task.module}
            </span>
            {task.moduleType && (
              <span className="text-[9.5px] text-[var(--color-text-muted)] font-mono shrink-0 opacity-60">
                ({task.moduleType})
              </span>
            )}
          </div>
          <div className="cell-secondary text-[9.5px] text-[var(--color-text-muted)] font-mono truncate mt-0.5 opacity-75">
            {task.category || 'Feature'}
          </div>
        </div>
      )
    },
    {
      id: 'name',
      header: colMap['name']?.label || 'TASK NAME & CHECKLIST',
      headerTitle: 'Task title and subtask checklist status. Indented rows indicate child subtasks. Click to sort.',
      sortable: true,
      width: 'min-w-[320px]',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] italic pl-1">Filtered by search</span>,
      cell: (task) => {
        const isMilestone = (task.startDate && task.startDate === task.dueDate) || task.subtasks.some(s => s.name.toLowerCase().includes('milestone'));
        const doneCount = task.subtasks.filter(s => s.done).length;
        return (
          <div className="min-w-0 max-w-[440px] py-0.5">
            <div className="flex items-center gap-2 min-w-0">
              {isMilestone && <span title="Milestone" className="shrink-0"><Flag size={12} className="text-amber-500" /></span>}
              <span 
                className="text-xs font-semibold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary-hex)] transition-colors cursor-pointer"
                title={task.screenName ? `${task.name} (Screen: ${task.screenName})` : task.name}
              >
                {task.name}
              </span>
              {task.release && (
                <span className="shrink-0 px-1.5 py-0.2 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)] text-[9px] font-mono font-semibold">
                  {task.release}
                </span>
              )}
              {task.subtasks.length > 0 && (
                <button
                  onClick={(e) => toggleExpand(task.id, e)}
                  className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-primary-highlight-hex)] hover:bg-[var(--color-primary-highlight-hex)]/80 border border-[var(--color-primary-hex)]/20 text-[10px] font-semibold text-[var(--color-primary-hex)] transition-colors cursor-pointer"
                  title="Toggle Checklist"
                >
                  <CheckSquare size={10} />
                  <span>{doneCount}/{task.subtasks.length}</span>
                </button>
              )}
            </div>
            {/* Second line in comfortable view */}
            <div className="cell-secondary text-[10px] text-[var(--color-text-muted)] flex items-center gap-2 mt-0.5 truncate">
              {task.screenName && (
                <span className="font-mono text-[var(--color-text-faint)] truncate max-w-[140px]">
                  Screen: {task.screenName}
                </span>
              )}
              {task.subtasks.length > 0 && (
                <span className="text-[var(--color-text-muted)]">
                  {doneCount} of {task.subtasks.length} phases completed
                </span>
              )}
              {task.desc && !task.screenName && (
                <span className="truncate opacity-75">{task.desc}</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'status',
      header: colMap['status']?.label || 'STATUS',
      headerTitle: 'Current task lifecycle state (Not Started, In Progress, Review, Completed, On Hold, Cancelled). Click badge in rows to quick-cycle. Click to sort.',
      sortable: true,
      width: 'w-32',
      filter: (
        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 focus:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-text)] outline-none transition-all shadow-2xs"
        >
          <option value="all">All Statuses</option>
          {Object.values(TaskStatus).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
      cell: (task) => (
        <button
          onClick={(e) => handleCycleStatus(task, e)}
          title="Click to cycle status"
          className={clsx("st-badge cursor-pointer shadow-2xs active:scale-95", `st-${ST_MAP[task.status] || 'not-started'}`)}
        >
          <span className="dot" />
          <span>{task.status}</span>
        </button>
      )
    },
    {
      id: 'priority',
      header: colMap['priority']?.label || 'PRIORITY',
      headerTitle: 'Execution urgency (Critical, High, Medium, Low). Prioritizes linear capacity leveling. Click to sort.',
      sortable: true,
      width: 'w-24',
      align: 'center',
      filter: (
        <select
          value={selectedPriority}
          onChange={e => setSelectedPriority(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 focus:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-text)] outline-none transition-all shadow-2xs"
        >
          <option value="all">All</option>
          {Object.values(TaskPriority).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      ),
      cell: (task) => (
        <span className={clsx("pri-badge shadow-2xs", `pri-${PRI_MAP[task.priority] || 'medium'}`)}>
          {task.priority}
        </span>
      )
    },
    {
      id: 'assignee',
      header: colMap['assignee']?.label || 'ASSIGNEE',
      headerTitle: 'Accountable module owner or developer. Subtask contributors roll up automatically. Click to sort.',
      sortable: true,
      width: 'w-36',
      filter: (
        <select
          value={selectedAssignee}
          onChange={e => setSelectedAssignee(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 focus:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-text)] outline-none transition-all shadow-2xs"
        >
          <option value="all">All Team</option>
          {assignees.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      ),
      cell: (task) => task.assignee ? (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[9px] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/30 shadow-2xs">
            {task.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-[var(--color-text)] truncate max-w-[120px]">
            {task.assignee}
          </span>
        </div>
      ) : (
        <span className="text-[11px] text-[var(--color-text-faint)] italic">—</span>
      )
    },
    {
      id: 'dueDate',
      header: colMap['dueDate']?.label || 'DUE DATE',
      headerTitle: 'Planned feasibility target completion date. Evaluated against Baseline Due Date. Click to sort.',
      sortable: true,
      width: 'w-36',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] pl-1">—</span>,
      cell: (task) => {
        const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
        return (
          <div className="flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap">
            <span className={clsx(overdue ? "text-rose-500 font-bold" : "text-[var(--color-text-muted)]")}>
              {fmtDate(task.dueDate)}
            </span>
            {overdue && (
              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                Overdue
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'progress',
      header: colMap['progress']?.label || 'PROGRESS',
      headerTitle: 'Granular completion percentage (0–100%). Click or slide to adjust. Click to sort.',
      sortable: true,
      width: 'w-28',
      align: 'right',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] pl-1">—</span>,
      cell: (task) => (
        <div className="flex items-center justify-end gap-2.5">
          <span className="text-[11px] font-mono tabular-nums font-bold text-[var(--color-text)]">{task.progress}%</span>
          <div className="w-16 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-divider)]/40 shadow-inner">
            <div 
              className={clsx(
                "h-full rounded-full transition-all duration-300",
                task.progress >= 100 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : task.progress >= 50 ? "bg-[var(--color-primary-hex)]" : "bg-amber-500"
              )} 
              style={{ width: `${task.progress}%` }} 
            />
          </div>
        </div>
      )
    }
  ];

  // Append user-defined custom fields from Field Architect
  (state.customFields || []).forEach(cf => {
    baseCols.push({
      id: `cf_${cf.name}`,
      header: cf.name.toUpperCase(),
      headerTitle: `Custom Field: ${cf.name}`,
      sortable: true,
      width: 'w-32',
      cell: (task) => {
        const val = (task as any)[cf.name];
        if (val === undefined || val === null || val === '') return <span className="text-[10px] text-[var(--color-text-faint)] italic">—</span>;
        if (cf.type === 'checkbox') return <span className={clsx("font-semibold text-xs", val ? "text-emerald-500" : "text-[var(--color-text-muted)]")}>{val ? 'Yes' : 'No'}</span>;
        return <span className="text-xs text-[var(--color-text)] truncate max-w-[150px]">{String(val)}</span>;
      }
    });
  });

  // Filter columns that are marked hidden (except id, name, and actions)
  const visibleCols = baseCols.filter(c => {
    if (c.id === 'id' || c.id === 'name') return true;
    return colMap[c.id]?.visible !== false;
  });

  // Actions column is always last
  visibleCols.push({
    id: 'actions',
    header: '',
    width: 'w-10',
    align: 'center',
    filter: (selectedModule !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all' || selectedPriority !== 'all') ? (
      <button
        onClick={() => {
          setSelectedModule('all');
          setSelectedStatus('all');
          setSelectedAssignee('all');
          setSelectedPriority('all');
        }}
        title="Reset inline filters"
        className="text-[10px] text-[var(--color-primary-hex)] hover:underline font-bold px-1.5 py-0.5 rounded"
      >
        Reset
      </button>
    ) : null,
    cell: (task) => (
      <button
        onClick={(e) => { e.stopPropagation(); onEditTask(task.id); }}
        className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors opacity-70 group-hover:opacity-100 cursor-pointer touch-hit-expand"
        title="Edit task"
      >
        <MoreHorizontal size={14} />
      </button>
    )
  });

  return visibleCols;
  }, [state.tasks, state.cols, state.customFields, colMap, selectedModule, modules, selectedStatus, selectedPriority, selectedAssignee, assignees, onEditTask]);

  const isAllSelected = filteredTasks.length > 0 && selectedTaskIds.size === filteredTasks.length;

  return (
    <div className="space-y-3.5">
      {/* ── 1. Table Toolbar & Operational Controls (Rendered when not merged into Tier 2 header) ── */}
      {!hideToolbar && (
        <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs space-y-2.5 text-xs">
          {/* Top Row: Quick Search + Preset Filter Chips + Density & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Quick Search with / Hotkey */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search tasks... (/)"
                className="w-full h-8 pl-8 pr-7 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)]/40 focus:bg-[var(--color-surface)] transition-all"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] p-0.5 rounded cursor-pointer"
                >
                  <X size={12} />
                </button>
              ) : (
                <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[var(--color-text-faint)] border border-[var(--color-divider)] px-1 py-0.5 rounded bg-[var(--color-surface)] pointer-events-none">
                  /
                </kbd>
              )}
            </div>

            {/* Segmented Filter Preset Chips */}
            <div className="flex items-center gap-1 overflow-x-auto custom-scroll py-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'blocked', label: 'Blocked / On Hold', count: countBlocked },
                { id: 'critical', label: 'Critical / High', count: countCritical },
                { id: 'overdue', label: 'Overdue', count: countOverdue },
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setActivePreset(chip.id as FilterPreset)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                    activePreset === chip.id
                      ? "bg-[var(--color-primary-hex)] text-white shadow-xs"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]/80"
                  )}
                >
                  <span>{chip.label}</span>
                  {chip.count !== undefined && (
                    <span className={clsx(
                      "px-1 py-0.2 rounded-full text-[9px] font-mono",
                      activePreset === chip.id ? "bg-white/20 text-white" : "bg-[var(--color-surface)] text-[var(--color-text-faint)]"
                    )}>
                      {chip.count}
                    </span>
                  )}
                </button>
              ))}

              {isAnyFilterActive && (
                <button
                  onClick={resetAllFilters}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer ml-1"
                  title="Clear all active filters"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* View Density & Filter Count */}
            <div className="flex items-center gap-2.5 ml-auto">
              <span className="text-xs font-semibold text-[var(--color-text-muted)] hidden sm:inline">
                <strong className="text-[var(--color-text)]">{filteredTasks.length}</strong> / {state.tasks.length}
              </span>

              <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <button
                  onClick={() => setDensity('compact')}
                  className={clsx(
                    "px-2.5 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    density === 'compact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
                  )}
                >
                  Compact
                </button>
                <button
                  onClick={() => setDensity('comfortable')}
                  className={clsx(
                    "px-2.5 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    density === 'comfortable' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
                  )}
                >
                  Comfortable
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Row: Module Filter + Release Filter + Inline Filters Toggle */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--color-divider)]/40">
            {/* Quick Module Filter */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
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
                "px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border transition-all cursor-pointer ml-auto",
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
        </div>
      )}

      {/* ── 2. Floating Docked Bulk Actions Bar ── */}
      <AnimatePresence>
        {selectedTaskIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-2 sm:px-4 sm:py-2.5 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-divider)] shadow-2xl rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs max-w-[95vw] sm:max-w-3xl ring-1 ring-black/5"
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
                className="px-2.5 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Deselect All</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">Esc</kbd>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Desktop Table (Linear-grade Precision Data Grid powered by generic DataTable) ── */}
      <DataTable<Task>
        data={filteredTasks}
        columns={columns}
        keyField="id"
        density={density}
        showInlineFilters={showInlineFilters}
        sortField={sortField}
        sortAsc={sortAsc}
        onSort={handleSort}
        selectable
        selectedIds={selectedTaskIds}
        onToggleSelect={toggleSelectTask}
        onToggleSelectAll={toggleSelectAll}
        isAllSelected={isAllSelected}
        showRowNumbers
        pagination={pagination}
        itemLabel="tasks"
        containerClassName="hidden lg:block"
        canExpand={(task) => task.subtasks.length > 0}
        isExpanded={(task) => expandedTasks.has(task.id)}
        onToggleExpand={(task, e) => toggleExpand(task.id, e)}
        onRowClick={(task) => setPeekTaskId(task.id)}
        rowClassName={(task) => {
          const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
          const isMilestone = (task.startDate && task.startDate === task.dueDate) || task.subtasks.some(s => s.name.toLowerCase().includes('milestone'));
          return clsx(
            overdue && "is-overdue bg-rose-500/[0.02]",
            isMilestone && "is-milestone bg-amber-500/[0.02]"
          );
        }}
        renderSubRows={(task, idx) => (
          <>
            {task.subtasks.map((st, sIdx) => (
              <tr
                key={st.id}
                className="bg-[var(--color-surface-2)]/30 hover:bg-[var(--color-surface-2)]/70 transition-colors text-xs border-b border-[var(--color-divider)]/30"
              >
                {/* Blank check */}
                <td className="px-2.5 py-1.5 text-center"></td>

                {/* Subtask Row Number (e.g. 1.1, 1.2) */}
                <td className="px-2 py-1.5 text-center font-mono text-[9px] text-[var(--color-text-faint)]">
                  {pagination.startIndex + idx + 1}.{sIdx + 1}
                </td>

                {/* Hierarchy Indicator */}
                <td className="px-1 py-1.5 text-center font-mono text-[var(--color-text-faint)]">
                  └
                </td>

                {/* Subtask ID */}
                <td className="px-3 py-1.5 font-mono text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                  {st.id}
                </td>

                {/* Scope */}
                <td className="px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] italic whitespace-nowrap">
                  Subtask
                </td>

                {/* Subtask Name & Checklist toggle */}
                <td className="px-3 py-1.5 max-w-[420px]">
                  <div 
                    onClick={(e) => handleToggleSubtask(task, st.id, e)}
                    className="flex items-center gap-2 cursor-pointer group/st min-w-0"
                  >
                    {st.done ? (
                      <CheckSquare size={13} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Square size={13} className="text-[var(--color-text-faint)] group-hover/st:text-[var(--color-primary-hex)] shrink-0" />
                    )}
                    <span className={clsx("text-xs font-medium transition-colors truncate", st.done ? "line-through text-[var(--color-text-muted)]" : "text-[var(--color-text)]")}>
                      {st.name}
                    </span>
                  </div>
                </td>

                {/* Subtask Status */}
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <span className={clsx("st-badge text-[9px] py-0.5", st.done ? "st-completed" : "st-in-progress")}>
                    <span className="dot" />
                    <span>{st.done ? 'Completed' : 'In Progress'}</span>
                  </span>
                </td>

                {/* Priority */}
                <td className="px-2 py-1.5 text-center whitespace-nowrap">
                  <span className="text-[10px] text-[var(--color-text-faint)]">—</span>
                </td>

                {/* Assignee */}
                <td className="px-3 py-1.5 whitespace-nowrap">
                  <span className="text-[11px] text-[var(--color-text-muted)]">{st.assignee || '—'}</span>
                </td>

                {/* Due Date */}
                <td className="px-3 py-1.5 text-[10px] font-mono text-[var(--color-text-faint)] whitespace-nowrap">
                  {st.dueDate ? fmtDate(st.dueDate) : '—'}
                </td>

                {/* Progress */}
                <td className="px-3 py-1.5 text-right whitespace-nowrap">
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{st.done ? '100%' : '0%'}</span>
                </td>

                <td className="px-2 py-1.5"></td>
              </tr>
            ))}
          </>
        )}
        emptyMessage={
          <div className="max-w-md mx-auto p-6 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)] space-y-3">
            <Layers size={28} className="mx-auto text-[var(--color-text-muted)] opacity-60" />
            <div className="text-sm font-bold text-[var(--color-text)]">No tasks match active filters</div>
            <div className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {searchTerm ? `Zero tasks found matching "${searchTerm}".` : 'No tasks found for the selected module, release, or priority filters.'}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedModule('all');
                  setSelectedRelease('all');
                  setSelectedStatus('all');
                  setSelectedAssignee('all');
                  setSelectedPriority('all');
                  setSearchTerm('');
                }}
                className="h-8 px-3.5 bg-[var(--color-surface)] hover:bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-lg text-xs font-semibold text-[var(--color-text)] transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
              {onNewTask && (
                <button
                  onClick={onNewTask}
                  className="h-8 px-3.5 bg-[var(--color-primary-hex)] hover:opacity-90 text-[var(--color-primary-text)] rounded-lg text-xs font-bold transition-opacity cursor-pointer shadow-xs"
                >
                  Create Task
                </button>
              )}
            </div>
          </div>
        }
      />

      {/* ── 4. Mobile View Cards (Touch-friendly & responsive) ── */}
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {filteredTasks.length === 0 && (
          <div className="p-6 text-center rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] space-y-3">
            <div className="text-xs font-bold text-[var(--color-text)]">No tasks match active filters</div>
            <button
              onClick={() => {
                setSelectedModule('all');
                setSelectedRelease('all');
                setSelectedStatus('all');
                setSelectedAssignee('all');
                setSelectedPriority('all');
                setSearchTerm('');
              }}
              className="h-8 px-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs font-semibold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
        {pagination.paginatedItems.map((task) => {
          const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED;
          const blocked = isBlocked(task, state.tasks);
          const isExpanded = expandedTasks.has(task.id);
          
          return (
            <div 
              key={task.id}
              onClick={() => setPeekTaskId(task.id)}
              className={clsx(
                "p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs motion-safe:active:scale-[0.98] transition-colors duration-150 relative",
                blocked && "bg-amber-500/5 border-amber-500/20",
                overdue && "border-rose-500/40 bg-rose-500/5 shadow-xs"
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
                        className="flex items-center justify-center gap-1 text-xs font-medium text-[var(--color-primary-hex)] px-2 py-1 min-h-[32px] rounded-lg bg-[var(--color-primary-highlight-hex)] cursor-pointer"
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
        {filteredTasks.length > 0 && (
          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
            itemLabel="tasks"
            className="rounded-2xl border border-[var(--color-divider)]"
          />
        )}
      </div>

      {/* ── 5. Master-Detail Peek Side Drawer ── */}
      <SlideOverDrawer
        isOpen={Boolean(peekTask)}
        onClose={() => setPeekTaskId(null)}
        title={
          peekTask && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--color-primary-hex)]">{peekTask.id}</span>
              <span className="text-sm font-bold text-[var(--color-text)] truncate">{peekTask.name}</span>
            </div>
          )
        }
        subtitle={
          peekTask && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <span>Module: <strong className="text-[var(--color-text)]">{peekTask.module}</strong></span>
              <span>•</span>
              <span>Release: <strong className="text-[var(--color-text)]">{peekTask.release || 'None'}</strong></span>
            </div>
          )
        }
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPrevious={handlePrevious}
        onNext={handleNext}
        footer={
          peekTask && (
            <>
              <button
                type="button"
                onClick={() => {
                  const id = peekTask.id;
                  setPeekTaskId(null);
                  onEditTask(id);
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--color-primary-hex)] text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
              >
                <ExternalLink size={13} />
                <span>Open Full Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setPeekTaskId(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
              >
                Close (Esc)
              </button>
            </>
          )
        }
      >
        {peekTask && (
          <div className="space-y-5 text-xs">
            {/* Status & Priority Pills */}
            <div className="flex items-center gap-2.5 flex-wrap p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Status:</span>
                <button
                  type="button"
                  onClick={(e) => handleCycleStatus(peekTask, e)}
                  title="Click to advance status"
                  className={clsx("st-badge cursor-pointer", `st-${ST_MAP[peekTask.status] || 'not-started'}`)}
                >
                  <span className="dot" />
                  <span>{peekTask.status}</span>
                </button>
              </div>

              <div className="h-3.5 w-px bg-[var(--color-divider)]" />

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">Priority:</span>
                <span className={clsx("pri-badge", `pri-${PRI_MAP[peekTask.priority] || 'low'}`)}>
                  {peekTask.priority}
                </span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Assignee</span>
                <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                  <User size={13} className="text-[var(--color-text-muted)]" />
                  <span>{peekTask.assignee || 'Unassigned'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Due Date</span>
                <div className="font-mono tabular-nums font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                  <Calendar size={13} className="text-[var(--color-text-muted)]" />
                  <span>{fmtDate(peekTask.dueDate) || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Completion Progress</span>
                <span className="font-mono tabular-nums font-bold text-xs text-[var(--color-primary-hex)]">{peekTask.progress || 0}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-divider)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary-hex)] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, peekTask.progress || 0))}%` }}
                />
              </div>
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">
                  Checklist ({peekTask.subtasks.filter(s => s.done).length}/{peekTask.subtasks.length})
                </span>
              </div>

              {peekTask.subtasks.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[var(--color-divider)] text-center text-xs text-[var(--color-text-muted)]">
                  No checklist items on this task.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-divider)]/40 border border-[var(--color-divider)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
                  {peekTask.subtasks.map(st => (
                    <div
                      key={st.id}
                      onClick={(e) => handleToggleSubtask(peekTask, st.id, e)}
                      className="px-3 py-2.5 flex items-center gap-2.5 hover:bg-[var(--color-surface-2)]/60 transition-colors cursor-pointer"
                    >
                      {st.done ? (
                        <CheckSquare size={15} className="text-emerald-500 shrink-0" />
                      ) : (
                        <Square size={15} className="text-[var(--color-text-faint)] shrink-0" />
                      )}
                      <span className={clsx("text-xs flex-1", st.done && "line-through text-[var(--color-text-muted)]")}>
                        {st.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

export default TaskGrid;
