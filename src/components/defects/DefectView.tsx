import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Bug, 
  Plus, 
  Search, 
  Filter, 
  ShieldAlert, 
  Activity, 
  Columns, 
  LayoutGrid, 
  Trash2, 
  CheckSquare, 
  X, 
  MoreHorizontal,
  ArrowUpDown,
  Edit2,
  Calendar,
  Layers,
  AlertCircle,
  ChevronDown,
  Check,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import clsx from 'clsx';
import { Defect, DefectStatus } from '../../types';
import DefectModal from './DefectModal';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import { toast } from '../../utils/toast';
import { fmtDate, todayStr } from '../../utils/projectUtils';
import { nextDefectQuickStatus } from '../../utils/stateMachines';
import { motion, AnimatePresence } from 'motion/react';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef } from '../shared/DataTable';
import CollapsibleSummaryStrip, { SummaryMetricItem } from '../shared/CollapsibleSummaryStrip';
import { MotionPage, StaggerContainer, StaggerItem } from '../shared/MotionPage';
import { AnimatedMetric } from '../shared/AnimatedMetric';

type ViewMode = 'table' | 'cards';
type DensityMode = 'comfortable' | 'compact';
type DefectPreset = 'all' | 's1' | 'in_progress' | 'unassigned' | 'retest';

const ALL_DEF_STATUSES: DefectStatus[] = [
  DefectStatus.NEW,
  DefectStatus.ASSIGNED,
  DefectStatus.IN_PROGRESS,
  DefectStatus.FIXED,
  DefectStatus.RETEST,
  DefectStatus.CLOSED,
  DefectStatus.REJECTED,
  DefectStatus.DEFERRED
];

const DEF_ST_MAP: Record<string, string> = {
  [DefectStatus.NEW]: 'not-started',
  [DefectStatus.ASSIGNED]: 'under-review',
  [DefectStatus.IN_PROGRESS]: 'in-progress',
  [DefectStatus.FIXED]: 'fixed',
  [DefectStatus.RETEST]: 'under-review',
  [DefectStatus.CLOSED]: 'closed',
  [DefectStatus.REJECTED]: 'rejected',
  [DefectStatus.DEFERRED]: 'on-hold',
};

const DefectView: React.FC = () => {
  const { state, saveDefect, deleteDefect } = useProject();
  const [viewMode, setViewMode] = useState<ViewMode>(() => typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [showInlineFilters, setShowInlineFilters] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Quick Preset Chips state
  const [activePreset, setActivePreset] = useState<DefectPreset>('all');

  // Master-Detail Peek Side Drawer state
  const [peekDefectId, setPeekDefectId] = useState<string | null>(null);

  // Inline Quick-Edit states
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleVal, setEditingTitleVal] = useState<string>('');
  const [statusMenuDefectId, setStatusMenuDefectId] = useState<string | null>(null);
  const [assigneeMenuDefectId, setAssigneeMenuDefectId] = useState<string | null>(null);

  // Filtering states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'severity' | 'priority' | 'status' | 'assignee' | 'updatedAt'>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleEdit = (id: string | null) => {
    setSelectedDefect(id);
    setIsModalOpen(true);
  };

  // Distinct Filter Options
  const severities = useMemo(() => Array.from(new Set(state.defects.map(d => d.severity).filter(Boolean))), [state.defects]);
  const priorities = useMemo(() => Array.from(new Set(state.defects.map(d => d.priority).filter(Boolean))), [state.defects]);
  const assignees = useMemo(() => Array.from(new Set(state.defects.map(d => d.assignee).concat((state.team || []).map(m => m.name)).filter(Boolean))), [state.defects, state.team]);

  // Keyboard shortcut: '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard number shortcuts 1-8 for status jumping
  useEffect(() => {
    if (!statusMenuDefectId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= ALL_DEF_STATUSES.length) {
        e.preventDefault();
        const targetDefect = state.defects.find(d => d.id === statusMenuDefectId);
        if (targetDefect) {
          const targetStatus = ALL_DEF_STATUSES[num - 1];
          saveDefect({
            ...targetDefect,
            status: targetStatus,
            updatedAt: new Date().toISOString()
          }, targetDefect.id);
          setStatusMenuDefectId(null);
          toast.success(`Defect moved to ${targetStatus}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [statusMenuDefectId, state.defects, saveDefect]);

  // Close menus on outside click
  useEffect(() => {
    if (!statusMenuDefectId && !assigneeMenuDefectId) return;
    const handleClickOutside = () => {
      setStatusMenuDefectId(null);
      setAssigneeMenuDefectId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [statusMenuDefectId, assigneeMenuDefectId]);

  const defectSummaryMetrics: SummaryMetricItem[] = useMemo(() => {
    const total = state.defects.length;
    const critical = state.defects.filter(d => d.severity?.startsWith('S1')).length;
    const inProgress = state.defects.filter(d => d.status === DefectStatus.IN_PROGRESS || d.status === DefectStatus.ASSIGNED).length;
    const resolved = state.defects.filter(d => d.status === DefectStatus.CLOSED || d.status === DefectStatus.FIXED).length;

    return [
      { label: 'Total Issues', value: total, tone: 'neutral' },
      { label: 'S1 Critical', value: critical, tone: critical > 0 ? 'rose' : 'emerald' },
      { label: 'In Progress', value: inProgress, tone: inProgress > 0 ? 'amber' : 'neutral' },
      { label: 'Resolved', value: resolved, tone: 'emerald' }
    ];
  }, [state.defects]);

  // Bulk Handlers
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDefects.length && filteredDefects.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDefects.map(d => d.id)));
    }
  };

  const handleBatchStatus = (newStatus: DefectStatus) => {
    if (!selectedIds.size) return;
    selectedIds.forEach(id => {
      const existing = state.defects.find(d => d.id === id);
      if (existing) {
        saveDefect({ ...existing, status: newStatus, updatedAt: new Date().toISOString() }, id);
      }
    });
    setSelectedIds(new Set());
  };

  const handleBatchPriority = (newPriority: string) => {
    if (!selectedIds.size) return;
    selectedIds.forEach(id => {
      const existing = state.defects.find(d => d.id === id);
      if (existing) {
        saveDefect({ ...existing, priority: newPriority, updatedAt: new Date().toISOString() }, id);
      }
    });
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (!selectedIds.size) return;
    if (window.confirm(`Delete ${selectedIds.size} selected defect(s)?`)) {
      selectedIds.forEach(id => deleteDefect(id));
      setSelectedIds(new Set());
    }
  };

  // Keyboard shortcut: Esc to clear selection
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIds(new Set());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds.size]);

  // Quick Preset Handlers & Presets
  const PRESETS: { id: DefectPreset; label: string; count: number }[] = useMemo(() => [
    { id: 'all', label: 'All', count: state.defects.length },
    { id: 's1', label: 'S1 Blocker', count: state.defects.filter(d => d.severity?.startsWith('S1')).length },
    { id: 'in_progress', label: 'In Progress', count: state.defects.filter(d => d.status === DefectStatus.IN_PROGRESS || d.status === DefectStatus.ASSIGNED).length },
    { id: 'unassigned', label: 'Unassigned', count: state.defects.filter(d => !d.assignee).length },
    { id: 'retest', label: 'Retest / Verification', count: state.defects.filter(d => d.status === DefectStatus.RETEST || d.status === DefectStatus.FIXED).length },
  ], [state.defects]);

  const handlePresetClick = (preset: DefectPreset) => {
    setActivePreset(preset);
    setFilterStatus('all');
    setFilterSeverity('all');
    setFilterPriority('all');
    setFilterAssignee('all');
  };

  const resetAllFilters = () => {
    setActivePreset('all');
    setFilterStatus('all');
    setFilterSeverity('all');
    setFilterPriority('all');
    setFilterAssignee('all');
    setSearch('');
  };

  const hasActiveFilters = activePreset !== 'all' || filterStatus !== 'all' || filterSeverity !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all' || search.length > 0;

  // Inline Title Editing Commit
  const handleCommitTitle = (defect: Defect) => {
    const trimmed = editingTitleVal.trim();
    if (trimmed && trimmed !== defect.title) {
      saveDefect({
        ...defect,
        title: trimmed,
        updatedAt: new Date().toISOString()
      }, defect.id);
      toast.success('Defect summary updated');
    }
    setEditingTitleId(null);
  };

  // Status Jump Menu Handler
  const handleSetStatus = (defect: Defect, newStatus: DefectStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    saveDefect({
      ...defect,
      status: newStatus,
      updatedAt: new Date().toISOString()
    }, defect.id);
    setStatusMenuDefectId(null);
    toast.success(`Defect moved to ${newStatus}`);
  };

  // Assignee Quick Reassign Handler
  const handleSetAssignee = (defect: Defect, newAssignee: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveDefect({
      ...defect,
      assignee: newAssignee,
      updatedAt: new Date().toISOString()
    }, defect.id);
    setAssigneeMenuDefectId(null);
    toast.success(newAssignee ? `Assigned to ${newAssignee}` : 'Defect unassigned');
  };

  // 1-Click Cycle Status
  const handleCycleStatus = (defect: Defect, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = nextDefectQuickStatus(defect.status);
    saveDefect({
      ...defect,
      status: nextStatus,
      updatedAt: new Date().toISOString()
    }, defect.id);
  };

  // Sorting
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  // Filtered and Sorted Defects
  const filteredDefects = useMemo(() => {
    return state.defects.filter(d => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        d.title.toLowerCase().includes(q) || 
        d.id.toLowerCase().includes(q) ||
        (d.desc && d.desc.toLowerCase().includes(q)) ||
        (d.assignee && d.assignee.toLowerCase().includes(q));

      const matchesPreset = 
        activePreset === 'all' ? true :
        activePreset === 's1' ? d.severity?.startsWith('S1') :
        activePreset === 'in_progress' ? (d.status === DefectStatus.IN_PROGRESS || d.status === DefectStatus.ASSIGNED) :
        activePreset === 'unassigned' ? !d.assignee :
        activePreset === 'retest' ? (d.status === DefectStatus.RETEST || d.status === DefectStatus.FIXED) : true;

      const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || d.severity === filterSeverity;
      const matchesPriority = filterPriority === 'all' || d.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || d.assignee === filterAssignee;

      return matchesPreset && matchesSearch && matchesStatus && matchesSeverity && matchesPriority && matchesAssignee;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'id') {
        cmp = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === 'severity') {
        cmp = (a.severity || '').localeCompare(b.severity || '');
      } else if (sortBy === 'priority') {
        cmp = (a.priority || '').localeCompare(b.priority || '');
      } else if (sortBy === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortBy === 'assignee') {
        cmp = (a.assignee || '').localeCompare(b.assignee || '');
      } else if (sortBy === 'updatedAt') {
        cmp = (new Date(a.updatedAt || 0).getTime()) - (new Date(b.updatedAt || 0).getTime());
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [state.defects, search, activePreset, filterStatus, filterSeverity, filterPriority, filterAssignee, sortBy, sortAsc]);

  const peekDefect = useMemo(() => {
    if (!peekDefectId) return null;
    return state.defects.find(d => d.id === peekDefectId) || null;
  }, [peekDefectId, state.defects]);

  const peekIndex = useMemo(() => {
    if (!peekDefectId) return -1;
    return filteredDefects.findIndex(d => d.id === peekDefectId);
  }, [peekDefectId, filteredDefects]);

  const handlePrevPeek = () => {
    if (peekIndex > 0) {
      setPeekDefectId(filteredDefects[peekIndex - 1].id);
    }
  };

  const handleNextPeek = () => {
    if (peekIndex >= 0 && peekIndex < filteredDefects.length - 1) {
      setPeekDefectId(filteredDefects[peekIndex + 1].id);
    }
  };

  const pagination = usePagination<Defect>(filteredDefects, 10, 'pp_page_size_defects');

  const isAllSelected = filteredDefects.length > 0 && selectedIds.size === filteredDefects.length;

  // User-configured column customizations from Field Architect
  const defColMap = useMemo(() => {
    const map: Record<string, { label: string; width?: number; visible?: boolean }> = {};
    (state.defCols || []).forEach(c => {
      map[c.key] = { label: c.label, width: c.width, visible: c.visible !== false };
    });
    return map;
  }, [state.defCols]);

  const columns = useMemo<ColumnDef<Defect>[]>(() => {
    const baseCols: ColumnDef<Defect>[] = [
    {
      id: 'edit',
      header: '',
      headerTitle: 'Quick edit defect',
      width: 'w-8',
      align: 'center',
      cell: (defect) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleEdit(defect.id); }}
          className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-[var(--color-surface-offset)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer touch-hit-expand"
          title="Edit details"
        >
          <Edit2 size={12} />
        </button>
      )
    },
    {
      id: 'id',
      header: defColMap['id']?.label || 'DEFECT ID',
      headerTitle: 'Persistent defect identifier (e.g. DEF-001). Click to sort.',
      sortable: true,
      width: 'w-24',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] font-mono pl-1">—</span>,
      cell: (defect) => (
        <div className="min-w-0">
          <span className="font-mono font-bold text-[11px] text-rose-500 whitespace-nowrap">
            {defect.id}
          </span>
          <div className="cell-secondary text-[9px] font-mono text-[var(--color-text-faint)] mt-0.5 truncate max-w-[80px]">
            {defect.linkedTaskId || defect.category || 'Defect'}
          </div>
        </div>
      )
    },
    {
      id: 'title',
      header: defColMap['title']?.label || 'SUMMARY & SCOPE',
      headerTitle: 'Summary of the issue, failure symptom, or regression. Click to sort.',
      sortable: true,
      width: 'min-w-[280px]',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] italic pl-1">Filtered by search</span>,
      cell: (defect) => {
        const isEditing = editingTitleId === defect.id;

        if (isEditing) {
          return (
            <div className="flex items-center gap-1 py-0.5 w-full" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                value={editingTitleVal}
                onChange={e => setEditingTitleVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCommitTitle(defect);
                  if (e.key === 'Escape') setEditingTitleId(null);
                }}
                onBlur={() => handleCommitTitle(defect)}
                className="w-full px-2 py-1 text-xs font-bold rounded-lg border border-[var(--color-primary-hex)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none ring-2 ring-[var(--color-primary-highlight-hex)] shadow-sm"
              />
            </div>
          );
        }

        return (
          <div 
            className="min-w-0 max-w-[420px] py-0.5 group/title cursor-text"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingTitleId(defect.id);
              setEditingTitleVal(defect.title);
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-[var(--color-text)] leading-tight truncate" title={defect.title}>
                {defect.title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTitleId(defect.id);
                  setEditingTitleVal(defect.title);
                }}
                className="opacity-0 group-hover/title:opacity-100 p-0.5 text-[var(--color-text-faint)] hover:text-[var(--color-text)] rounded transition-opacity cursor-pointer shrink-0"
                title="Edit summary inline (double-click)"
              >
                <Edit2 size={11} />
              </button>
            </div>
            {/* Second line with smaller text in comfortable view */}
            <div className="cell-secondary text-[10px] text-[var(--color-text-muted)] truncate max-w-[380px] mt-0.5" title={defect.desc || defect.module}>
              {defect.desc ? defect.desc : (defect.module ? `Module: ${defect.module}` : 'Standard defect tracking unit')}
            </div>
          </div>
        );
      }
    },
    {
      id: 'severity',
      header: defColMap['severity']?.label || 'SEVERITY',
      headerTitle: 'Impact severity tier (S1-Blocker, S2-Critical, S3-Major, S4-Minor). Click to sort.',
      sortable: true,
      width: 'w-28',
      filter: (
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option value="all">All Severities</option>
          {severities.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
      cell: (defect) => (
        <span className={clsx(
          "px-2 py-0.5 rounded text-[10px] font-bold font-mono inline-block whitespace-nowrap",
          defect.severity?.startsWith('S1') ? "bg-rose-500/15 text-rose-500 border border-rose-500/30" :
          defect.severity?.startsWith('S2') ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
          defect.severity?.startsWith('S3') ? "bg-blue-500/15 text-blue-600 border border-blue-500/30" :
          "bg-slate-500/15 text-slate-600 border border-slate-500/30"
        )}>
          {defect.severity || 'S2 - High'}
        </span>
      )
    },
    {
      id: 'priority',
      header: defColMap['priority']?.label || 'PRIORITY',
      headerTitle: 'Fix urgency for triage and sprint allocation. Click to sort.',
      sortable: true,
      width: 'w-24',
      align: 'center',
      filter: (
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option value="all">All</option>
          {priorities.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      ),
      cell: (defect) => (
        <span className={clsx("pri-badge", `pri-${(defect.priority || 'medium').toLowerCase()}`)}>
          {defect.priority || 'Medium'}
        </span>
      )
    },
    {
      id: 'status',
      header: defColMap['status']?.label || 'STATUS',
      headerTitle: 'Resolution lifecycle state (New, Open, In Progress, Resolved, Retest, Closed). Click to sort.',
      sortable: true,
      width: 'w-32',
      filter: (
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option value="all">All Statuses</option>
          {Object.values(DefectStatus).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
      cell: (defect) => {
        const isStatusOpen = statusMenuDefectId === defect.id;
        return (
          <div className="relative inline-block" onClick={e => e.stopPropagation()}>
            <div className="inline-flex items-center rounded-full">
              <button
                type="button"
                onClick={(e) => handleCycleStatus(defect, e)}
                title="Click to advance status"
                className={clsx("st-badge cursor-pointer", `st-${DEF_ST_MAP[defect.status] || 'not-started'}`)}
              >
                <span className="dot" />
                <span>{defect.status}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusMenuDefectId(prev => prev === defect.id ? null : defect.id);
                  setAssigneeMenuDefectId(null);
                }}
                className="p-1 -ml-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] rounded-full hover:bg-[var(--color-surface-offset)] transition-colors cursor-pointer"
                title="Jump to specific status"
              >
                <ChevronDown size={11} />
              </button>
            </div>

            {isStatusOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 z-50 min-w-[170px] p-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] border-b border-[var(--color-divider)]/40 mb-1">
                  Jump to Status
                </div>
                <div className="space-y-0.5">
                  {ALL_DEF_STATUSES.map((st, idx) => (
                    <button
                      key={st}
                      type="button"
                      onClick={(e) => handleSetStatus(defect, st, e)}
                      className={clsx(
                        "w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer",
                        defect.status === st
                          ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold"
                          : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={clsx("w-2 h-2 rounded-full", `st-dot-${DEF_ST_MAP[st] || 'not-started'}`)} />
                        <span>{st}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-faint)] font-mono">
                        <span>{idx + 1}</span>
                        {defect.status === st && <Check size={12} className="text-[var(--color-primary-hex)]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'assignee',
      header: defColMap['assignee']?.label || 'ASSIGNEE',
      headerTitle: 'Assigned engineer or QA lead investigating the defect. Click to sort.',
      sortable: true,
      width: 'w-36',
      filter: (
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option value="all">All Team</option>
          {assignees.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      ),
      cell: (defect) => {
        const isAssigneeOpen = assigneeMenuDefectId === defect.id;
        return (
          <div className="relative inline-block" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAssigneeMenuDefectId(prev => prev === defect.id ? null : defect.id);
                setStatusMenuDefectId(null);
              }}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors group/assign cursor-pointer text-left max-w-full"
              title="Click to reassign"
            >
              {defect.assignee ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[9px] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/30 shadow-2xs">
                    {defect.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text)] truncate max-w-[100px]">
                    {defect.assignee}
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-[var(--color-text-faint)] italic hover:text-[var(--color-primary-hex)]">
                  + Assign
                </span>
              )}
              <ChevronDown size={10} className="text-[var(--color-text-faint)] group-hover/assign:text-[var(--color-text)] opacity-0 group-hover/assign:opacity-100 transition-opacity shrink-0" />
            </button>

            {isAssigneeOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 z-50 min-w-[180px] p-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] border-b border-[var(--color-divider)]/40 mb-1">
                  Reassign Defect
                </div>
                <div className="max-h-[190px] overflow-y-auto space-y-0.5 custom-scroll">
                  <button
                    type="button"
                    onClick={(e) => handleSetAssignee(defect, '', e)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <X size={12} />
                    <span>Unassigned</span>
                  </button>
                  {assignees.map(member => (
                    <button
                      key={member}
                      type="button"
                      onClick={(e) => handleSetAssignee(defect, member, e)}
                      className={clsx(
                        "w-full flex items-center justify-between px-2 py-1 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer",
                        defect.assignee === member
                          ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold"
                          : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-4 h-4 rounded-full bg-[var(--color-primary-hex)] text-white font-bold text-[8px] flex items-center justify-center shrink-0">
                          {member.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate">{member}</span>
                      </div>
                      {defect.assignee === member && <Check size={12} className="ml-1 shrink-0 text-[var(--color-primary-hex)]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'linkedId',
      header: defColMap['linkedId']?.label || 'LINKED ITEM',
      headerTitle: 'Associated task ID or GUI screen origin',
      width: 'w-32',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] pl-1">—</span>,
      cell: (defect) => (
        <span className="font-mono text-[11px] text-[var(--color-text-muted)] truncate whitespace-nowrap">
          {defect.linkedId ? `${defect.linkedType || 'Task'}: ${defect.linkedId}` : '—'}
        </span>
      )
    },
    {
      id: 'updatedAt',
      header: defColMap['updatedAt']?.label || 'UPDATED',
      headerTitle: 'Timestamp of last modification or comment. Click to sort.',
      sortable: true,
      width: 'w-28',
      align: 'right',
      filter: (filterStatus !== 'all' || filterSeverity !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all') ? (
        <button
          onClick={() => {
            setFilterStatus('all');
            setFilterSeverity('all');
            setFilterPriority('all');
            setFilterAssignee('all');
          }}
          className="text-[10px] text-[var(--color-primary-hex)] hover:underline font-bold"
        >
          Reset
        </button>
      ) : null,
      cell: (defect) => (
        <span className="font-mono text-[10px] text-right text-[var(--color-text-faint)] whitespace-nowrap">
          {defect.updatedAt ? fmtDate(defect.updatedAt) : fmtDate(defect.createdAt)}
        </span>
      )
    }
  ];

  // Append user-defined custom fields from Field Architect
  (state.defCustomFields || []).forEach(cf => {
    baseCols.push({
      id: `cf_${cf.name}`,
      header: cf.name.toUpperCase(),
      headerTitle: `Custom Field: ${cf.name}`,
      sortable: true,
      width: 'w-32',
      cell: (defect) => {
        const val = (defect as any)[cf.name];
        if (val === undefined || val === null || val === '') return <span className="text-[10px] text-[var(--color-text-faint)] italic">—</span>;
        if (cf.type === 'checkbox') return <span className={clsx("font-semibold text-xs", val ? "text-emerald-500" : "text-[var(--color-text-muted)]")}>{val ? 'Yes' : 'No'}</span>;
        return <span className="text-xs text-[var(--color-text)] truncate max-w-[150px]">{String(val)}</span>;
      }
    });
  });

  // Filter columns that are marked hidden (except edit, id, and title)
  return baseCols.filter(c => {
    if (c.id === 'edit' || c.id === 'id' || c.id === 'title') return true;
    return defColMap[c.id]?.visible !== false;
  });
  }, [state.defCols, state.defCustomFields, defColMap, severities, filterSeverity, priorities, filterPriority, filterStatus, assignees, filterAssignee]);

  return (
    <MotionPage className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      <PageHeader
        icon={Bug}
        title="Defect Workshop & Quality Matrix"
        subtitle={`${state.defects.length} Total Issues • ${state.defects.filter(d => d.status === DefectStatus.NEW).length} Unaddressed • ${state.defects.filter(d => d.severity?.startsWith('S1')).length} Critical (S1)`}
        actions={
          <div className="flex flex-nowrap md:flex-wrap items-center gap-2">
            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 flex-nowrap md:flex-wrap">
              {/* Quick Status */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs">
                <span className="text-[var(--color-text-faint)] font-bold text-[11px]">Status:</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer max-w-[120px] truncate"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  {Object.values(DefectStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Quick Severity */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs">
                <AlertCircle size={12} className="text-red-500 shrink-0" />
                <select
                  value={filterSeverity}
                  onChange={e => setFilterSeverity(e.target.value)}
                  className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer max-w-[120px] truncate"
                  aria-label="Filter by severity"
                >
                  <option value="all">All Severities</option>
                  {severities.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Toggle Inline Filters */}
              {viewMode === 'table' && (
                <button
                  onClick={() => setShowInlineFilters(!showInlineFilters)}
                  className={clsx(
                    "px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer min-h-[34px]",
                    showInlineFilters 
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/30"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)]"
                  )}
                  title="Toggle column header filter row"
                >
                  <Filter size={13} />
                  <span className="hidden md:inline">{showInlineFilters ? 'Filters Visible' : 'Show Filters'}</span>
                </button>
              )}

              {/* Density Toggle (for table) */}
              {viewMode === 'table' && (
                <div className="hidden xl:flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                  <button
                    onClick={() => setDensity('compact')}
                    className={clsx(
                      "px-2 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      density === 'compact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
                    )}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setDensity('comfortable')}
                    className={clsx(
                      "px-2 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      density === 'comfortable' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
                    )}
                  >
                    Comfortable
                  </button>
                </div>
              )}
            </div>

            {/* View Switcher: Table Matrix vs Cards */}
            <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl mr-0.5">
              <button
                onClick={() => setViewMode('table')}
                aria-label="Table View"
                className={clsx(
                  "min-w-[34px] min-h-[34px] sm:min-w-0 p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'table' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Columns size={13} />
                <span className="hidden sm:inline">Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                aria-label="Cards View"
                className={clsx(
                  "min-w-[34px] min-h-[34px] sm:min-w-0 p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'cards' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input 
                ref={searchInputRef}
                className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl pl-7 pr-2 py-1.5 text-xs outline-none focus:border-[var(--color-primary-hex)] w-20 sm:w-[140px] md:w-[170px] text-[var(--color-text)]"
                placeholder="Search... (/)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search defects"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        }
        primaryAction={
          <Button variant="primary" size="sm" onClick={() => handleEdit(null)} className="h-9 px-2.5 sm:px-4 active:scale-95 shrink-0 font-bold shadow-xs">
            <Plus size={15} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Log Defect</span>
            <span className="sm:hidden">Log</span>
          </Button>
        }
      />

      {/* Collapsible Defects Telemetry Cards Strip (Minimized by default) */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-divider)] px-3 sm:px-6 lg:px-8 py-2 shrink-0">
        <CollapsibleSummaryStrip
          summary={defectSummaryMetrics}
          title="Defect Triage Telemetry"
          defaultExpanded={false}
          contentClassName="pt-2.5 pb-1"
        >
          <StaggerContainer className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar scroll-fade-x sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pb-1">
            <StaggerItem className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Total Defects</div>
              <div className="text-xl font-bold text-[var(--color-text)] mt-1 tracking-tight tabular-nums">
                <AnimatedMetric value={state.defects.length} />
              </div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">All tracked issues</div>
            </StaggerItem>
            <StaggerItem className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-rose-500/20 bg-rose-500/5 p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-rose-500">S1 Blocker / Critical</div>
              <div className="text-xl font-bold text-rose-500 mt-1 tracking-tight tabular-nums">
                <AnimatedMetric value={state.defects.filter(d => d.severity?.startsWith('S1')).length} />
              </div>
              <div className="text-[10px] text-rose-500/70 mt-0.5">Highest severity gate</div>
            </StaggerItem>
            <StaggerItem className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-amber-500/20 bg-amber-500/5 p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-amber-500">Active In-Flight</div>
              <div className="text-xl font-bold text-amber-500 mt-1 tracking-tight tabular-nums">
                <AnimatedMetric value={state.defects.filter(d => d.status === DefectStatus.IN_PROGRESS || d.status === DefectStatus.ASSIGNED).length} />
              </div>
              <div className="text-[10px] text-amber-500/70 mt-0.5">Assigned & in triage</div>
            </StaggerItem>
            <StaggerItem className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-emerald-500">Resolved & Closed</div>
              <div className="text-xl font-bold text-emerald-500 mt-1 tracking-tight tabular-nums">
                <AnimatedMetric value={state.defects.filter(d => d.status === DefectStatus.CLOSED || d.status === DefectStatus.FIXED).length} />
              </div>
              <div className="text-[10px] text-emerald-500/70 mt-0.5">Verified fixes</div>
            </StaggerItem>
          </StaggerContainer>
        </CollapsibleSummaryStrip>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll p-4 sm:p-6 lg:p-8 space-y-3.5 max-w-full">

        {/* ── 1. Quick Filter Presets Strip ── */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5 select-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider hidden sm:inline mr-1">
              Presets:
            </span>
            {PRESETS.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p.id)}
                  className={clsx(
                    "px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95",
                    isActive
                      ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] border-transparent shadow-xs font-bold"
                      : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 hover:text-[var(--color-text)]"
                  )}
                >
                  <span>{p.label}</span>
                  <span className={clsx(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold",
                    isActive ? "bg-black/20 text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-faint)]"
                  )}>
                    {p.count}
                  </span>
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-2 py-1 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                title="Reset all filters"
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-[var(--color-text-faint)] font-mono shrink-0">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-semibold text-[10px]">/</kbd> to search</span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-semibold text-[10px]">[</kbd> <kbd className="px-1 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-semibold text-[10px] shadow-2xs">]</kbd> to navigate</span>
          </div>
        </div>

        {/* ── 2. Floating Docked Bulk Actions Bar ── */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
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
                  {selectedIds.size} defect(s) selected
                </span>

                <div className="h-4 w-px bg-[var(--color-divider)] hidden sm:block" />

                {/* Batch Status */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">Set Status:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleBatchStatus(e.target.value as DefectStatus);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
                  >
                    <option value="" disabled>Select status...</option>
                    {Object.values(DefectStatus).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Priority */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--color-text-muted)] font-semibold">Set Priority:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleBatchPriority(e.target.value);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs font-medium cursor-pointer"
                  >
                    <option value="" disabled>Select priority...</option>
                    {['Critical', 'High', 'Medium', 'Low'].map(p => (
                      <option key={p} value={p}>{p}</option>
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
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Deselect All</span>
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">Esc</kbd>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3. Table View (Enterprise Defect Matrix powered by generic DataTable) ── */}
        {viewMode === 'table' ? (
          <DataTable<Defect>
            data={filteredDefects}
            columns={columns}
            keyField="id"
            tableLabel="Defect Workshop & Quality Matrix"
            density={density}
            showInlineFilters={showInlineFilters}
            sortField={sortBy}
            sortAsc={sortAsc}
            onSort={(f) => handleSort(f as any)}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            isAllSelected={isAllSelected}
            showRowNumbers
            stickyFirstColumn
            pagination={pagination}
            itemLabel="defects"
            onRowClick={(defect) => setPeekDefectId(defect.id)}
            rowClassName={(defect) => defect.severity?.startsWith('S1') ? "is-overdue bg-rose-500/[0.02]" : ""}
            mobileCardRenderer={(defect, { isSelected, onToggleSelect: toggleRowSelect }) => (
              <div
                onClick={() => setPeekDefectId(defect.id)}
                className={clsx(
                  "p-3.5 space-y-2.5 transition-colors active:bg-[var(--color-surface-2)]/70 cursor-pointer",
                  isSelected && "bg-[var(--color-primary-highlight-hex)]/25"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div onClick={e => e.stopPropagation()} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleRowSelect(e)}
                        aria-label={`Select defect ${defect.id}`}
                        className="w-4 h-4 rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] cursor-pointer"
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded leading-none">
                      {defect.id}
                    </span>
                    <span className={clsx(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold font-mono",
                      defect.severity?.startsWith('S1') ? "bg-rose-500/15 text-rose-500 border border-rose-500/30" :
                      defect.severity?.startsWith('S2') ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                      "bg-slate-500/15 text-slate-600 border border-slate-500/30"
                    )}>
                      {defect.severity || 'S2'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleCycleStatus(defect, e)}
                    className={clsx("st-badge text-[10px] cursor-pointer", `st-${DEF_ST_MAP[defect.status] || 'not-started'}`)}
                  >
                    <span className="dot" />
                    <span>{defect.status}</span>
                  </button>
                </div>

                <div className="text-xs font-bold text-[var(--color-text)] leading-snug line-clamp-2">
                  {defect.title}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-divider)]/40 text-[11px] text-[var(--color-text-muted)]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5 truncate">
                    {defect.assignee ? (
                      <>
                        <div className="w-4 h-4 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[8px] flex items-center justify-center border border-[var(--color-primary-hex)]/30 shrink-0">
                          {defect.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[100px]">{defect.assignee}</span>
                      </>
                    ) : (
                      <span className="text-[var(--color-text-faint)] italic">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPeekDefectId(defect.id);
                      }}
                      className="px-2.5 py-1 min-h-[36px] rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[11px] font-bold text-[var(--color-text)] flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <ExternalLink size={12} />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCycleStatus(defect, e)}
                      className="px-2.5 py-1 min-h-[36px] rounded-lg bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/20 text-[11px] font-bold text-[var(--color-primary-hex)] flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <CheckCircle2 size={12} />
                      <span>Next</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        ) : (
          /* Cards View */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pagination.paginatedItems.map((defect) => (
                <div 
                  key={defect.id} 
                  className="card p-5 group hover:border-red-200 transition-colors duration-150 flex flex-col cursor-pointer active:scale-[0.98]"
                  onClick={() => setPeekDefectId(defect.id)}
                >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded leading-none">
                      {defect.id}
                    </span>
                    <button
                      onClick={(e) => handleCycleStatus(defect, e)}
                      className={clsx("st-badge text-[10px]", `st-${DEF_ST_MAP[defect.status] || 'not-started'}`)}
                    >
                      <span className="dot" />
                      <span>{defect.status}</span>
                    </button>
                  </div>
                  <ShieldAlert size={14} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <h3 className="font-bold text-[14px] text-[var(--color-text)] leading-tight mb-3 line-clamp-2">
                  {defect.title || 'Untitled Defect'}
                </h3>

                <div className="flex items-center gap-3 mb-6 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--color-text-faint)]">Severity:</span>
                    <span className="font-bold text-[11px]">{defect.severity || 'S2 - High'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--color-text-faint)]">Priority:</span>
                    <span className={clsx("pri-badge", `pri-${(defect.priority || 'medium').toLowerCase()}`)}>
                      {defect.priority || 'Medium'}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[var(--color-divider)] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary-highlight-hex)] flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-hex)] shrink-0 border border-[var(--color-primary-hex)]/30">
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
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={pagination.setPageSize}
              itemLabel="defects"
              className="rounded-2xl border border-[var(--color-divider)]"
            />
          </div>
        )}

        {filteredDefects.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 bg-[var(--color-surface-2)] rounded-3xl border-2 border-dashed border-[var(--color-divider)]">
            <div className="w-20 h-20 bg-[var(--color-surface)] rounded-2xl flex items-center justify-center mb-6 shadow-xl text-red-500">
               <Bug size={40} strokeWidth={1} />
            </div>
            <h3 className="text-xl font-display font-bold">Codebase Crystal Clear</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-sm mx-auto leading-relaxed">
              No defects are currently tracked matching your criteria. Use this space to capture technical debt and quality issues as they arise.
            </p>
            <Button variant="primary" size="lg" className="mt-8 px-8" onClick={() => handleEdit(null)}>
              Log First Issue
            </Button>
          </div>
        )}
      </div>

      {/* ── Master-Detail Peek Side Drawer ── */}
      <SlideOverDrawer
        isOpen={Boolean(peekDefect)}
        onClose={() => setPeekDefectId(null)}
        title={
          peekDefect && (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded leading-none">
                {peekDefect.id}
              </span>
              <span className={clsx("st-badge text-[11px]", `st-${DEF_ST_MAP[peekDefect.status] || 'not-started'}`)}>
                <span className="dot" />
                <span>{peekDefect.status}</span>
              </span>
              <span className={clsx(
                "px-2 py-0.5 rounded text-[10px] font-bold font-mono",
                peekDefect.severity?.startsWith('S1') ? "bg-rose-500/15 text-rose-500 border border-rose-500/30" :
                peekDefect.severity?.startsWith('S2') ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                "bg-slate-500/15 text-slate-600 border border-slate-500/30"
              )}>
                {peekDefect.severity || 'S2'}
              </span>
            </div>
          )
        }
        subtitle={
          peekDefect && (
            <div className="text-[11px] text-[var(--color-text-faint)] flex items-center gap-2 mt-0.5">
              <span>Reported {fmtDate(peekDefect.createdAt || peekDefect.updatedAt)}</span>
              {peekDefect.reporter && <span>by {peekDefect.reporter}</span>}
              {peekDefect.module && <span>• Module: {peekDefect.module}</span>}
            </div>
          )
        }
        hasPrevious={peekIndex > 0}
        hasNext={peekIndex >= 0 && peekIndex < filteredDefects.length - 1}
        onPrevious={handlePrevPeek}
        onNext={handleNextPeek}
        footer={
          peekDefect && (
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = peekDefect.id;
                  setPeekDefectId(null);
                  handleEdit(id);
                }}
                className="px-3 py-1.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 size={13} />
                <span>Edit Full Form</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete defect ${peekDefect.id}?`)) {
                      deleteDefect(peekDefect.id);
                      setPeekDefectId(null);
                      toast.info(`Defect ${peekDefect.id} deleted`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCycleStatus(peekDefect, e)}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Advance Status</span>
                </button>
              </div>
            </div>
          )
        }
      >
        {peekDefect && (
          <div className="space-y-5 text-xs text-[var(--color-text)]">
            {/* Title */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] mb-1">
                Summary & Issue Title
              </div>
              <h2 className="text-base font-bold text-[var(--color-text)] leading-snug">
                {peekDefect.title}
              </h2>
            </div>

            {/* Quick Status Bar */}
            <div className="p-3 rounded-2xl bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Lifecycle Progression
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[DefectStatus.NEW, DefectStatus.IN_PROGRESS, DefectStatus.FIXED, DefectStatus.CLOSED].map(st => {
                  const isCurrent = peekDefect.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={(e) => handleSetStatus(peekDefect, st, e)}
                      className={clsx(
                        "py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer",
                        isCurrent
                          ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-xs"
                          : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      )}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1">
                  Assignee
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[9px] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/30">
                    {peekDefect.assignee ? peekDefect.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?'}
                  </div>
                  <span className="font-semibold text-xs truncate">
                    {peekDefect.assignee || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1">
                  Priority
                </span>
                <span className={clsx("pri-badge", `pri-${(peekDefect.priority || 'medium').toLowerCase()}`)}>
                  {peekDefect.priority || 'Medium'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1">
                  Module / Subsystem
                </span>
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {peekDefect.module || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] block mb-1">
                  Linked Item
                </span>
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {peekDefect.linkedId ? `${peekDefect.linkedType || 'Task'}: ${peekDefect.linkedId}` : '—'}
                </span>
              </div>
            </div>

            {/* Description & Reproduction Steps */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] mb-1.5">
                Description & Reproduction Steps
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/50 border border-[var(--color-divider)] text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed font-sans min-h-[90px]">
                {peekDefect.desc || <span className="text-[var(--color-text-faint)] italic">No detailed steps provided for this defect.</span>}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      <DefectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defectId={selectedDefect}
      />
    </MotionPage>
  );
};

export default DefectView;
