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
import ViewExportButton from '../shared/ViewExportButton';
import clsx from 'clsx';
import { Defect, DefectStatus } from '../../types';
import DefectModal from './DefectModal';
import { fmtDate, todayStr } from '../../utils/projectUtils';
import { motion, AnimatePresence } from 'motion/react';
import TablePagination, { usePagination } from '../shared/TablePagination';

type ViewMode = 'table' | 'cards';
type DensityMode = 'comfortable' | 'compact';

const DEF_ST_MAP: Record<string, string> = {
  [DefectStatus.NEW]: 'not-started',
  [DefectStatus.ASSIGNED]: 'under-review',
  [DefectStatus.IN_PROGRESS]: 'in-progress',
  [DefectStatus.FIXED]: 'fixed',
  [DefectStatus.CLOSED]: 'closed',
  [DefectStatus.REJECTED]: 'rejected',
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
    const cycle = [
      DefectStatus.NEW,
      DefectStatus.ASSIGNED,
      DefectStatus.IN_PROGRESS,
      DefectStatus.FIXED,
      DefectStatus.CLOSED
    ];
    const curIdx = cycle.indexOf(defect.status);
    const nextStatus = cycle[(curIdx + 1) % cycle.length];
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

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      <PageHeader
        icon={Bug}
        title="Defect Workshop & Quality Matrix"
        subtitle={`${state.defects.length} Total Quality Issues • ${state.defects.filter(d => d.status === DefectStatus.NEW).length} Unaddressed • ${state.defects.filter(d => d.severity?.startsWith('S1')).length} Critical (S1)`}
        actions={
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 max-w-full">
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
                className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl pl-7 pr-2 py-1.5 text-xs outline-none focus:border-[var(--color-primary-hex)] w-20 sm:w-[200px] text-[var(--color-text)]"
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

            <ViewExportButton viewId="defects" label="Export Defects" />

            <Button variant="primary" size="sm" onClick={() => handleEdit(null)} className="h-9 px-2 sm:px-4 active:scale-95 shrink-0 font-bold">
              <Plus size={15} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Log Defect</span>
              <span className="sm:hidden">Log</span>
            </Button>
          </div>
        }
      />

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scroll p-4 sm:p-6 lg:p-8 space-y-3.5 max-w-full">
        {/* ── 1. Operational Toolbar ── */}
        <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <span className="text-[var(--color-text-faint)] font-bold">Status:</span>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {Object.values(DefectStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Quick Severity */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <AlertCircle size={13} className="text-red-500" />
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="bg-transparent font-bold text-xs text-[var(--color-text)] outline-none cursor-pointer"
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
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              <strong className="text-[var(--color-text)]">{filteredDefects.length}</strong> / {state.defects.length} defects
            </span>

            {viewMode === 'table' && (
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
            )}
          </div>
        </div>

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

        {/* ── 3. Table View (Enterprise Defect Matrix from projectpulse.html) ── */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-xs max-w-full">
            <table className="w-full text-left border-collapse min-w-[1050px] table-fixed">
              <thead>
                <tr className="bg-[var(--color-surface-offset)] border-b-2 border-[var(--color-border)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] select-none">
                  {/* Bulk Checkbox */}
                  <th className="p-2.5 w-10 text-center border-r border-[var(--color-divider)]">
                    <input 
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all defects"
                      className="rounded border-[var(--color-divider)] cursor-pointer"
                    />
                  </th>

                  {/* Row Number (#) */}
                  <th className="p-2.5 w-11 text-center border-r border-[var(--color-divider)] td-rn font-mono text-[10px]" title="Sequential defect index">
                    #
                  </th>

                  {/* Edit Action */}
                  <th className="p-2.5 w-10 text-center border-r border-[var(--color-divider)]" title="Quick edit defect"></th>

                  {/* Defect ID */}
                  <th 
                    onClick={() => handleSort('id')}
                    className="p-2.5 w-26 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
                    title="Unique defect tracking identifier (e.g. DEF-101). Click to sort."
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>DEFECT ID</span>
                      <span className={clsx("text-[9px]", sortBy === 'id' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                        {sortBy === 'id' ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>

                  {/* Title / Summary */}
                  <th 
                    onClick={() => handleSort('title')}
                    className="p-2.5 min-w-[260px] cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
                    title="Summary of the issue, failure symptom, or regression. Click to sort."
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>SUMMARY & SCOPE</span>
                      <span className={clsx("text-[9px]", sortBy === 'title' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                        {sortBy === 'title' ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>

                  {/* Severity */}
                  <th 
                    onClick={() => handleSort('severity')}
                    className="p-2.5 w-30 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
                    title="Impact severity tier (S1-Blocker, S2-Critical, S3-Major, S4-Minor). Click to sort."
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>SEVERITY</span>
                      <span className={clsx("text-[9px]", sortBy === 'severity' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                        {sortBy === 'severity' ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>

                  {/* Priority */}
                  <th 
                    onClick={() => handleSort('priority')}
                    className="p-2.5 w-26 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)] text-center"
                    title="Fix urgency for triage and sprint allocation. Click to sort."
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>PRIORITY</span>
                      <span className={clsx("text-[9px]", sortBy === 'priority' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                        {sortBy === 'priority' ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>

                  {/* Status */}
                  <th 
                    onClick={() => handleSort('status')}
                    className="p-2.5 w-36 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
                    title="Resolution lifecycle state (New, Open, In Progress, Resolved, Retest, Closed). Click to sort."
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>STATUS</span>
                      <span className={clsx("text-[9px]", sortBy === 'status' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                        {sortBy === 'status' ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>

                  {/* Assignee */}
                  <th 
                    onClick={() => handleSort('assignee')}
                    className="p-2.5 w-36 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors border-r border-[var(--color-divider)]"
                    title="Assigned engineer or QA lead investigating the defect. Click to sort."
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>ASSIGNEE</span>
                      <span className={clsx("text-[9px]", sortBy === 'assignee' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                        {sortBy === 'assignee' ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>

                  {/* Linked Item */}
                  <th className="p-2.5 w-32 border-r border-[var(--color-divider)]" title="Associated task ID or GUI screen origin">
                    LINKED ITEM
                  </th>

                  {/* Updated Date */}
                  <th 
                    onClick={() => handleSort('updatedAt')}
                    className="p-2.5 w-28 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors text-right"
                    title="Timestamp of last modification or comment. Click to sort."
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>UPDATED</span>
                      <span className={clsx("text-[9px]", sortBy === 'updatedAt' ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                        {sortBy === 'updatedAt' ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                </tr>

                {/* Inline Filters Row */}
                {showInlineFilters && (
                  <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)] text-xs">
                    <th className="p-1 border-r border-[var(--color-divider)]"></th>
                    <th className="p-1 border-r border-[var(--color-divider)]"></th>
                    <th className="p-1 border-r border-[var(--color-divider)]"></th>
                    <th className="p-1 border-r border-[var(--color-divider)]">
                      <span className="text-[10px] text-[var(--color-text-faint)] font-mono pl-1">—</span>
                    </th>
                    <th className="p-1 border-r border-[var(--color-divider)]">
                      <span className="text-[10px] text-[var(--color-text-faint)] italic pl-1">Filtered by topbar search</span>
                    </th>
                    {/* Severity Filter */}
                    <th className="p-1 border-r border-[var(--color-divider)]">
                      <select
                        value={filterSeverity}
                        onChange={e => setFilterSeverity(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                      >
                        <option value="all">All Severities</option>
                        {severities.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </th>
                    {/* Priority Filter */}
                    <th className="p-1 border-r border-[var(--color-divider)]">
                      <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                      >
                        <option value="all">All</option>
                        {priorities.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </th>
                    {/* Status Filter */}
                    <th className="p-1 border-r border-[var(--color-divider)]">
                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                      >
                        <option value="all">All Statuses</option>
                        {Object.values(DefectStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </th>
                    {/* Assignee Filter */}
                    <th className="p-1 border-r border-[var(--color-divider)]">
                      <select
                        value={filterAssignee}
                        onChange={e => setFilterAssignee(e.target.value)}
                        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none"
                      >
                        <option value="all">All Team</option>
                        {assignees.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </th>
                    <th className="p-1 border-r border-[var(--color-divider)]"></th>
                    <th className="p-1 text-center">
                      {(filterStatus !== 'all' || filterSeverity !== 'all' || filterPriority !== 'all' || filterAssignee !== 'all') && (
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
                      )}
                    </th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-[var(--color-divider)]">
                {pagination.paginatedItems.map((defect, idx) => {
                  const isSelected = selectedIds.has(defect.id);
                  const padY = density === 'compact' ? "py-1.5" : "py-3";
                  const isS1 = defect.severity?.startsWith('S1');

                  return (
                    <tr
                      key={defect.id}
                      onClick={() => handleEdit(defect.id)}
                      className={clsx(
                        "group hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer relative",
                        isSelected && "bg-[var(--color-primary-highlight-hex)]/40",
                        isS1 && "is-overdue"
                      )}
                    >
                      {/* Checkbox */}
                      <td className={clsx("p-2.5 text-center border-r border-[var(--color-divider)]", padY)} onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelect(defect.id, e as any)}
                          className="rounded border-[var(--color-divider)] cursor-pointer"
                        />
                      </td>

                      {/* Row Num */}
                      <td className={clsx("p-2.5 text-center border-r border-[var(--color-divider)] td-rn font-mono", padY)}>
                        {pagination.startIndex + idx + 1}
                      </td>

                      {/* Edit Button */}
                      <td className={clsx("p-1 text-center border-r border-[var(--color-divider)]", padY)} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(defect.id)}
                          className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-[var(--color-surface-offset)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                          title="Edit details"
                        >
                          <Edit2 size={12} />
                        </button>
                      </td>

                      {/* Defect ID */}
                      <td className={clsx("p-2.5 font-mono font-bold text-[11px] text-rose-500 border-r border-[var(--color-divider)]", padY)}>
                        {defect.id}
                      </td>

                      {/* Summary & Scope */}
                      <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                        <div className="font-bold text-xs text-[var(--color-text)] leading-tight truncate">
                          {defect.title}
                        </div>
                        {defect.desc && (
                          <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-sm mt-0.5">
                            {defect.desc}
                          </div>
                        )}
                      </td>

                      {/* Severity */}
                      <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-bold font-mono inline-block",
                          defect.severity?.startsWith('S1') ? "bg-rose-500/15 text-rose-500 border border-rose-500/30" :
                          defect.severity?.startsWith('S2') ? "bg-amber-500/15 text-amber-600 border border-amber-500/30" :
                          defect.severity?.startsWith('S3') ? "bg-blue-500/15 text-blue-600 border border-blue-500/30" :
                          "bg-slate-500/15 text-slate-600 border border-slate-500/30"
                        )}>
                          {defect.severity || 'S2 - High'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className={clsx("p-2.5 text-center border-r border-[var(--color-divider)]", padY)}>
                        <span className={clsx("pri-badge", `pri-${(defect.priority || 'medium').toLowerCase()}`)}>
                          {defect.priority || 'Medium'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                        <button
                          onClick={(e) => handleCycleStatus(defect, e)}
                          title="Click to cycle status"
                          className={clsx("st-badge cursor-pointer", `st-${DEF_ST_MAP[defect.status] || 'not-started'}`)}
                        >
                          <span className="dot" />
                          <span>{defect.status}</span>
                        </button>
                      </td>

                      {/* Assignee */}
                      <td className={clsx("p-2.5 border-r border-[var(--color-divider)]", padY)}>
                        {defect.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[9px] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/30">
                              {defect.assignee.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium text-[var(--color-text)] truncate max-w-[100px]">
                              {defect.assignee}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--color-text-faint)] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Linked Scope */}
                      <td className={clsx("p-2.5 font-mono text-[11px] text-[var(--color-text-muted)] border-r border-[var(--color-divider)] truncate", padY)}>
                        {defect.linkedId ? `${defect.linkedType || 'Task'}: ${defect.linkedId}` : '—'}
                      </td>

                      {/* Updated Date */}
                      <td className={clsx("p-2.5 font-mono text-[10px] text-right text-[var(--color-text-faint)]", padY)}>
                        {defect.updatedAt ? fmtDate(defect.updatedAt) : fmtDate(defect.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <TablePagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setCurrentPage}
              onPageSizeChange={pagination.setPageSize}
              itemLabel="defects"
            />
          </div>
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
