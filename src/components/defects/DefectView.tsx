import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import clsx from 'clsx';
import { Defect, DefectStatus } from '../../types';
import DefectModal from './DefectModal';
import { fmtDate, todayStr } from '../../utils/projectUtils';
import { nextDefectQuickStatus } from '../../utils/stateMachines';
import { motion, AnimatePresence } from 'motion/react';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef } from '../shared/DataTable';
import CollapsibleSummaryStrip, { SummaryMetricItem } from '../shared/CollapsibleSummaryStrip';

type ViewMode = 'table' | 'cards';
type DensityMode = 'comfortable' | 'compact';

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
  const assignees = useMemo(() => Array.from(new Set(state.defects.map(d => d.assignee).filter(Boolean))), [state.defects]);

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

      const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || d.severity === filterSeverity;
      const matchesPriority = filterPriority === 'all' || d.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || d.assignee === filterAssignee;

      return matchesSearch && matchesStatus && matchesSeverity && matchesPriority && matchesAssignee;
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
  }, [state.defects, search, filterStatus, filterSeverity, filterPriority, filterAssignee, sortBy, sortAsc]);

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
      cell: (defect) => (
        <div className="min-w-0 max-w-[420px] py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs text-[var(--color-text)] leading-tight truncate" title={defect.title}>
              {defect.title}
            </span>
          </div>
          {/* Second line with smaller text in comfortable view */}
          <div className="cell-secondary text-[10px] text-[var(--color-text-muted)] truncate max-w-[380px] mt-0.5" title={defect.desc || defect.module}>
            {defect.desc ? defect.desc : (defect.module ? `Module: ${defect.module}` : 'Standard defect tracking unit')}
          </div>
        </div>
      )
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
      cell: (defect) => (
        <button
          onClick={(e) => handleCycleStatus(defect, e)}
          title="Click to cycle status"
          className={clsx("st-badge cursor-pointer", `st-${DEF_ST_MAP[defect.status] || 'not-started'}`)}
        >
          <span className="dot" />
          <span>{defect.status}</span>
        </button>
      )
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
      cell: (defect) => defect.assignee ? (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[9px] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/30">
            {defect.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-[var(--color-text)] truncate max-w-[100px]">
            {defect.assignee}
          </span>
        </div>
      ) : (
        <span className="text-[11px] text-[var(--color-text-faint)] italic">Unassigned</span>
      )
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
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)]">
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
                className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl pl-7 pr-2 py-1.5 text-xs outline-none focus:border-[var(--color-primary-hex)] w-20 sm:w-[140px] md:w-[170px] text-[var(--color-text)]"
                placeholder="Search..."
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
          <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar scroll-fade-x sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pb-1">
            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Total Defects</div>
              <div className="text-xl font-bold text-[var(--color-text)] mt-1 tracking-tight tabular-nums">{state.defects.length}</div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">All tracked issues</div>
            </div>
            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-rose-500/20 bg-rose-500/5 p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-rose-500">S1 Blocker / Critical</div>
              <div className="text-xl font-bold text-rose-500 mt-1 tracking-tight tabular-nums">{state.defects.filter(d => d.severity?.startsWith('S1')).length}</div>
              <div className="text-[10px] text-rose-500/70 mt-0.5">Highest severity gate</div>
            </div>
            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-amber-500/20 bg-amber-500/5 p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-amber-500">Active In-Flight</div>
              <div className="text-xl font-bold text-amber-500 mt-1 tracking-tight tabular-nums">{state.defects.filter(d => d.status === DefectStatus.IN_PROGRESS || d.status === DefectStatus.ASSIGNED).length}</div>
              <div className="text-[10px] text-amber-500/70 mt-0.5">Assigned & in triage</div>
            </div>
            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-emerald-500">Resolved & Closed</div>
              <div className="text-xl font-bold text-emerald-500 mt-1 tracking-tight tabular-nums">{state.defects.filter(d => d.status === DefectStatus.CLOSED || d.status === DefectStatus.FIXED).length}</div>
              <div className="text-[10px] text-emerald-500/70 mt-0.5">Verified fixes</div>
            </div>
          </div>
        </CollapsibleSummaryStrip>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll p-4 sm:p-6 lg:p-8 space-y-3.5 max-w-full">

        {/* ── 2. Floating Bulk Actions Bar ── */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
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
                  className="px-2.5 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] font-semibold transition-colors cursor-pointer"
                >
                  Deselect All
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
            pagination={pagination}
            itemLabel="defects"
            onRowClick={(defect) => handleEdit(defect.id)}
            rowClassName={(defect) => defect.severity?.startsWith('S1') ? "is-overdue bg-rose-500/[0.02]" : ""}
          />
        ) : (
          /* Cards View */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pagination.paginatedItems.map((defect) => (
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

      <DefectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defectId={selectedDefect}
      />
    </div>
  );
};

export default DefectView;
