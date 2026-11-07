import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Delivery, TaskStatus } from '../../types';
import { fmtDate, todayStr, daysDiff } from '../../utils/projectUtils';
import { exportProjectExcel } from '../../services/excelService';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Search, 
  Plus, 
  Filter, 
  SlidersHorizontal, 
  ArrowUpDown, 
  FileSpreadsheet, 
  Check, 
  X, 
  ChevronDown, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw, 
  MoreHorizontal, 
  Trash2, 
  Edit3,
  Calendar,
  Grid,
  Columns,
  Kanban,
  Activity,
  Layers2,
  FileCode,
  Sparkles,
  Server,
  Monitor,
  GitBranch,
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';

type ViewMode = 'table' | 'kanban' | 'heatmap';
type HeatmapPerspective = 'feat_screens' | 'env_pipeline' | 'del_impact';
type AutofitStrategy = 'all' | 'content-only' | 'header-only' | 'compact' | 'comfortable';

export const DeliveriesView: React.FC = () => {
  const { state, saveDelivery, deleteDelivery, batchUpdateDeliveries, setView } = useProject();
  const { deliveries = [], tasks = [], members = [], dropdowns = {} } = state;

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [heatmapPerspective, setHeatmapPerspective] = useState<HeatmapPerspective>('feat_screens');
  const [autofitStrategy, setAutofitStrategy] = useState<AutofitStrategy>('comfortable');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVersion, setFilterVersion] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSmoke, setFilterSmoke] = useState<string>('all');
  const [sortBy, setSortBy] = useState<keyof Delivery>('targetDeliveryDate');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  // Compute Cockpit Telemetry
  const telemetry = useMemo(() => {
    const total = deliveries.length;
    const deployed = deliveries.filter(d => d.status === 'Deployed').length;
    const ready = deliveries.filter(d => d.status === 'Ready for Deployment').length;
    const inProgress = deliveries.filter(d => d.status === 'In Progress').length;
    const scheduled = deliveries.filter(d => d.status === 'Scheduled').length;
    const pendingSignoff = deliveries.filter(d => d.signOffStatus === 'Pending').length;
    const failedSmoke = deliveries.filter(d => d.smokeTestStatus === 'Failed').length;
    const runningSmoke = deliveries.filter(d => d.smokeTestStatus === 'Running').length;
    
    // Avg cycle lead time
    const completedLead = deliveries.filter(d => d.leadTimeDays > 0);
    const avgLeadTime = completedLead.length 
      ? (completedLead.reduce((acc, d) => acc + d.leadTimeDays, 0) / completedLead.length).toFixed(1) 
      : '0.0';

    // Avg delay variance
    const avgVariance = total 
      ? (deliveries.reduce((acc, d) => acc + (d.variance || 0), 0) / total).toFixed(1)
      : '0.0';

    return {
      total,
      deployed,
      ready,
      inProgress,
      scheduled,
      pendingSignoff,
      failedSmoke,
      runningSmoke,
      avgLeadTime,
      avgVariance
    };
  }, [deliveries]);

  // Filtered & Sorted Deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries
      .filter(item => {
        if (filterEnv !== 'all' && item.environment !== filterEnv) return false;
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;
        if (filterVersion !== 'all' && item.releaseVersion !== filterVersion) return false;
        if (filterCategory !== 'all' && item.category !== filterCategory) return false;
        if (filterSmoke !== 'all' && item.smokeTestStatus !== filterSmoke) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesId = item.id.toLowerCase().includes(q);
          const matchesAlm = item.almId.toLowerCase().includes(q);
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesPdn = item.pdn.toLowerCase().includes(q);
          const matchesModule = item.module.toLowerCase().includes(q);
          const matchesApprover = item.approver.toLowerCase().includes(q);
          const matchesFixedBy = item.fixedBy.toLowerCase().includes(q);
          const matchesComponent = item.componentsDelivered.toLowerCase().includes(q);
          if (!matchesId && !matchesAlm && !matchesName && !matchesPdn && !matchesModule && !matchesApprover && !matchesFixedBy && !matchesComponent) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy] ?? '';
        let valB = b[sortBy] ?? '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [deliveries, filterEnv, filterStatus, filterVersion, filterCategory, filterSmoke, searchQuery, sortBy, sortAsc]);

  // Handlers
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDeliveries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDeliveries.map(d => d.id)));
    }
  };

  const handleOpenCreate = () => {
    setEditingDelivery(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setIsModalOpen(true);
  };

  const handleBatchDeploy = () => {
    if (!selectedIds.size) return;
    batchUpdateDeliveries(Array.from(selectedIds), {
      status: 'Deployed',
      actualDeliveryDate: todayStr(),
      almStatus: 'Closed',
      smokeTestStatus: 'Passed',
      signOffStatus: 'Approved'
    });
    setSelectedIds(new Set());
  };

  const handleBatchSignOff = () => {
    if (!selectedIds.size) return;
    batchUpdateDeliveries(Array.from(selectedIds), {
      signOffStatus: 'Approved'
    });
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (!selectedIds.size) return;
    if (confirm(`Delete ${selectedIds.size} delivery package(s)?`)) {
      selectedIds.forEach(id => deleteDelivery(id));
      setSelectedIds(new Set());
    }
  };

  // Autofit classes mapping
  const getAutofitRowClass = () => {
    switch (autofitStrategy) {
      case 'compact': return 'py-1 text-xs';
      case 'comfortable': return 'py-3 text-sm';
      case 'content-only': return 'py-2 text-xs leading-normal';
      case 'header-only': return 'py-2 text-xs truncate';
      case 'all': default: return 'py-2.5 text-xs';
    }
  };

  // Helper for Initials Avatar
  const renderAvatar = (name: string, titlePrefix = '') => {
    if (!name) return <span className="text-[var(--color-text-faint)] italic text-[11px]">Unassigned</span>;
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div className="flex items-center gap-1.5" title={`${titlePrefix}${name}`}>
        <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center font-mono font-bold text-[10px] shrink-0 border border-[var(--color-primary-hex)]/30">
          {initials}
        </div>
        <span className="truncate max-w-[100px] text-xs font-medium">{name}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      <PageHeader
        icon={Package}
        title="Software Deliveries & Deployment Schedule"
        subtitle={`ALM / PDN Release Workstation • ${deliveries.length} Total Packages`}
        actions={
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  "px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95",
                  viewMode === 'table' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Columns size={13} />
                <span>Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={clsx(
                  "px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95",
                  viewMode === 'kanban' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Kanban size={13} />
                <span>Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={clsx(
                  "px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95",
                  viewMode === 'heatmap' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Activity size={13} />
                <span>3D Heatmaps</span>
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={() => exportProjectExcel(state)} title="Export Excel with Deliveries sheet" className="h-9 font-bold active:scale-95">
              <FileSpreadsheet size={14} className="mr-1.5 text-emerald-500" />
              <span>Export .xlsx</span>
            </Button>

            <Button variant="primary" size="sm" onClick={handleOpenCreate} className="h-9 font-bold active:scale-95">
              <Plus size={14} className="mr-1" />
              <span>New Package</span>
            </Button>
          </div>
        }
      />

      {/* 1. Cockpit Telemetry Banner */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-divider)] p-4 shrink-0">
        {/* Bento Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-3 rounded-lg">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Deployed Live</div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1 flex items-baseline gap-1.5">
              <span>{telemetry.deployed}</span>
              <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
                / {telemetry.total}
              </span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Production sign-off</div>
          </div>

          <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-3 rounded-lg">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Ready / In Flight</div>
            <div className="text-xl font-mono font-bold text-sky-400 mt-1 flex items-baseline gap-1.5">
              <span>{telemetry.ready + telemetry.inProgress}</span>
              <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
                active
              </span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Staging & UAT queues</div>
          </div>

          <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-3 rounded-lg">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Pending Sign-Off</div>
            <div className="text-xl font-mono font-bold text-amber-400 mt-1">
              {telemetry.pendingSignoff}
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Awaiting lead sign-off</div>
          </div>

          <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-3 rounded-lg">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Smoke Test Gates</div>
            <div className="text-xl font-mono font-bold mt-1 flex items-center gap-2">
              <span className={telemetry.failedSmoke > 0 ? "text-rose-400" : "text-emerald-400"}>
                {telemetry.failedSmoke > 0 ? `${telemetry.failedSmoke} Fail` : '0 Fail'}
              </span>
              {telemetry.runningSmoke > 0 && (
                <span className="text-[10px] text-cyan-400 font-mono motion-safe:animate-pulse">
                  ({telemetry.runningSmoke} Run)
                </span>
              )}
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Automated test matrix</div>
          </div>

          <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-3 rounded-lg">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Avg Cycle Lead Time</div>
            <div className="text-xl font-mono font-bold text-[var(--color-text)] mt-1">
              {telemetry.avgLeadTime} <span className="text-xs text-[var(--color-text-muted)]">days</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Commit-to-release duration</div>
          </div>

          <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-3 rounded-lg">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Delay Variance</div>
            <div className={clsx(
              "text-xl font-mono font-bold mt-1",
              parseFloat(telemetry.avgVariance) > 0 ? "text-rose-400" : "text-emerald-400"
            )}>
              {parseFloat(telemetry.avgVariance) > 0 ? `+${telemetry.avgVariance}` : telemetry.avgVariance}
              <span className="text-xs text-[var(--color-text-muted)] ml-1">days</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Variance vs target</div>
          </div>
        </div>
      </div>

      {/* 2. Operational Filter Toolbar */}
      <div className="p-3 bg-[var(--color-surface)] border-b border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-[420px]">
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input 
              type="text"
              placeholder="Search by ALM ID, PDN, scope, module, developer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary-hex)] transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Environment Filter */}
          <select 
            value={filterEnv}
            onChange={e => setFilterEnv(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary-hex)]"
          >
            <option value="all">All Envs</option>
            {dropdowns.deliveryEnv?.map((env: string) => (
              <option key={env} value={env}>{env}</option>
            )) || ['Production', 'Staging', 'UAT', 'QA', 'Dev'].map(env => (
              <option key={env} value={env}>{env}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary-hex)]"
          >
            <option value="all">All Statuses</option>
            {['Scheduled', 'In Progress', 'Ready for Deployment', 'Deployed', 'Cancelled', 'Rolled Back'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Version Filter */}
          <select 
            value={filterVersion}
            onChange={e => setFilterVersion(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary-hex)]"
          >
            <option value="all">All Releases</option>
            {state.releases?.map(r => (
              <option key={r.id} value={r.name}>{r.name} ({r.status})</option>
            )) || ['v1.0.0', 'v1.1.0', 'v2.0.0-Beta', 'v2.1.0'].map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          {/* Column Autofit Strategy (ProjectPulse standard) */}
          {viewMode === 'table' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--color-divider)]">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Autofit:</span>
              <select 
                value={autofitStrategy}
                onChange={e => setAutofitStrategy(e.target.value as AutofitStrategy)}
                className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary-hex)]"
                title="Table column autofit engine layout mode"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact Dense</option>
                <option value="content-only">Wrap Content</option>
                <option value="header-only">Header Bounds</option>
                <option value="all">Full Fill</option>
              </select>
            </div>
          )}

          {/* Bulk Selection Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1.5 bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/30 rounded-lg px-2 py-1 ml-auto">
              <span className="font-semibold text-xs text-[var(--color-primary-hex)]">
                {selectedIds.size} Selected
              </span>
              <button 
                onClick={handleBatchDeploy}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors"
                title="Mark selected as Deployed"
              >
                Deploy
              </button>
              <button 
                onClick={handleBatchSignOff}
                className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold transition-colors"
                title="Approve sign-off"
              >
                Sign Off
              </button>
              <button 
                onClick={handleBatchDelete}
                className="p-1 hover:bg-rose-500/20 text-rose-400 rounded transition-colors"
                title="Delete selected packages"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Workspace Body */}
      <div className="flex-1 overflow-auto custom-scroll p-4">
        {/* VIEW MODE 1: MATRIX TABLE */}
        {viewMode === 'table' && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)] text-xs font-semibold text-[var(--color-text-muted)] select-none">
                    <th className="p-3 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredDeliveries.length}
                        onChange={toggleSelectAll}
                        className="rounded border-[var(--color-divider)] cursor-pointer"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('almId'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>ALM ID / PDN</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3 min-w-[240px] cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('name'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>Delivery Scope / Description</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('environment'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>Env</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('status'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('releaseVersion'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>Release</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('signOffStatus'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>Sign-off / Approver</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3 cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('smokeTestStatus'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>Smoke Gate</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3">Linked Tasks / Screens</th>
                    <th className="p-3 cursor-pointer hover:text-[var(--color-text)]" onClick={() => { setSortBy('targetDeliveryDate'); setSortAsc(!sortAsc); }}>
                      <div className="flex items-center gap-1">
                        <span>Target Date</span>
                        <ArrowUpDown size={11} />
                      </div>
                    </th>
                    <th className="p-3 text-right">Lead / Var</th>
                    <th className="p-3 text-center w-14">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-divider)]">
                  {filteredDeliveries.map(item => {
                    const isSelected = selectedIds.has(item.id);
                    const rowClass = getAutofitRowClass();
                    
                    return (
                      <tr 
                        key={item.id}
                        className={clsx(
                          "hover:bg-[var(--color-surface-2)]/60 transition-colors group cursor-pointer",
                          isSelected && "bg-[var(--color-primary-highlight-hex)]/40"
                        )}
                        onClick={(e) => {
                          // Prevent modal open when clicking checkbox or action menu
                          if ((e.target as HTMLElement).closest('input[type="checkbox"]') || (e.target as HTMLElement).closest('button')) return;
                          handleOpenEdit(item);
                        }}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="rounded border-[var(--color-divider)] cursor-pointer"
                          />
                        </td>

                        {/* ALM ID & PDN */}
                        <td className="p-3">
                          <div className="font-mono font-bold text-xs text-[var(--color-primary-hex)]">
                            {item.almId}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--color-text-muted)]">
                            {item.pdn}
                          </div>
                        </td>

                        {/* Name & Delivered Components */}
                        <td className="p-3">
                          <div className="font-semibold text-xs leading-tight mb-0.5 line-clamp-2">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                            <span className="font-medium text-[var(--color-text)]">{item.module}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{item.category}</span>
                            {item.componentsDelivered && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono text-[10px] text-[var(--color-text-faint)] truncate max-w-[150px]">
                                  {item.componentsDelivered}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Environment */}
                        <td className="p-3">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            item.environment === 'Production' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
                            item.environment === 'Staging' && "bg-sky-500/10 text-sky-400 border border-sky-500/30",
                            item.environment === 'UAT' && "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
                            item.environment === 'QA' && "bg-amber-500/10 text-amber-400 border border-amber-500/30",
                            item.environment === 'Dev' && "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30",
                          )}>
                            {item.environment}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={clsx(
                              "w-2 h-2 rounded-full",
                              item.status === 'Deployed' && "bg-emerald-500",
                              item.status === 'Ready for Deployment' && "bg-sky-500",
                              item.status === 'In Progress' && "bg-amber-500",
                              item.status === 'Scheduled' && "bg-zinc-500",
                              item.status === 'Cancelled' && "bg-rose-500",
                              item.status === 'Rolled Back' && "bg-purple-500"
                            )} />
                            <span className="text-xs font-medium">{item.status}</span>
                          </div>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                            ALM: {item.almStatus}
                          </span>
                        </td>

                        {/* Release */}
                        <td className="p-3">
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[var(--color-surface-2)] rounded border border-[var(--color-divider)]">
                            {item.releaseVersion}
                          </span>
                        </td>

                        {/* Sign-off & Approver */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={clsx(
                              "text-xs font-semibold",
                              item.signOffStatus === 'Approved' && "text-emerald-400",
                              item.signOffStatus === 'Pending' && "text-amber-400",
                              item.signOffStatus === 'Rejected' && "text-rose-400",
                              item.signOffStatus === 'Not Required' && "text-[var(--color-text-muted)]"
                            )}>
                              {item.signOffStatus}
                            </span>
                          </div>
                          {renderAvatar(item.approver, 'Approver: ')}
                        </td>

                        {/* Smoke Test */}
                        <td className="p-3">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-xs font-medium inline-block",
                            item.smokeTestStatus === 'Passed' && "bg-emerald-500/15 text-emerald-400",
                            item.smokeTestStatus === 'Running' && "bg-cyan-500/15 text-cyan-400 motion-safe:animate-pulse",
                            item.smokeTestStatus === 'Failed' && "bg-rose-500/15 text-rose-400",
                            item.smokeTestStatus === 'Not Run' && "text-[var(--color-text-faint)]"
                          )}>
                            {item.smokeTestStatus}
                          </span>
                        </td>

                        {/* Linked Tasks / Screens */}
                        <td className="p-3 max-w-[200px]">
                          {item.linkedId ? (
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded text-[10px] font-mono truncate max-w-[170px]" title={item.linkedId}>
                                {item.linkedId}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[var(--color-text-faint)] text-xs">None</span>
                          )}
                          {item.linkedScreens && item.linkedScreens.length > 0 && (
                            <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[170px] mt-0.5">
                              Screens: {item.linkedScreens.join(', ')}
                            </div>
                          )}
                        </td>

                        {/* Target Date */}
                        <td className="p-3">
                          <div className="font-mono text-xs">{fmtDate(item.targetDeliveryDate)}</div>
                          {item.actualDeliveryDate && (
                            <div className="text-[10px] font-mono text-emerald-400">
                              Act: {fmtDate(item.actualDeliveryDate)}
                            </div>
                          )}
                        </td>

                        {/* Lead / Variance */}
                        <td className="p-3 text-right font-mono text-xs">
                          <div>{item.leadTimeDays}d</div>
                          <div className={clsx(
                            "text-[10px]",
                            (item.variance || 0) > 0 ? "text-rose-400" : ((item.variance || 0) < 0 ? "text-emerald-400" : "text-[var(--color-text-muted)]")
                          )}>
                            {(item.variance || 0) > 0 ? `+${item.variance}d` : `${item.variance || 0}d`}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded transition-colors"
                              title="Edit delivery"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete delivery ${item.almId}?`)) {
                                  deleteDelivery(item.id);
                                }
                              }}
                              className="p-1.5 text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                              title="Delete delivery"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDeliveries.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-[var(--color-text-muted)]">
                        <Package size={32} className="mx-auto mb-2 opacity-40" />
                        <div className="text-sm font-semibold">No delivery packages match your filter</div>
                        <div className="text-xs text-[var(--color-text-faint)] mt-1">
                          Try adjusting search keywords or clearing active environment filters.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: KANBAN PIPELINE BOARD */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-[500px]">
            {(['Scheduled', 'In Progress', 'Ready for Deployment', 'Deployed'] as const).map(stageStatus => {
              const stageDeliveries = filteredDeliveries.filter(d => d.status === stageStatus);
              
              return (
                <div 
                  key={stageStatus}
                  className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl flex flex-col overflow-hidden"
                >
                  <div className="p-3 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">
                        {stageStatus}
                      </span>
                      <span className="px-1.5 py-0.2 bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded font-mono text-[10px]">
                        {stageDeliveries.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scroll">
                    {stageDeliveries.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => handleOpenEdit(item)}
                        className="bg-[var(--color-surface-2)] hover:border-[var(--color-primary-hex)] border border-[var(--color-divider)] p-3 rounded-lg cursor-pointer transition-colors duration-150 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-[var(--color-primary-hex)]">
                            {item.almId}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                            {item.releaseVersion}
                          </span>
                        </div>

                        <div className="font-semibold text-xs leading-snug">
                          {item.name}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-divider)]">
                          <span>{item.module}</span>
                          <span className="font-medium text-xs text-sky-400">{item.environment}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {renderAvatar(item.approver, 'Approver: ')}
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            <Clock size={11} className="text-[var(--color-text-muted)]" />
                            <span>{fmtDate(item.targetDeliveryDate)}</span>
                          </div>
                        </div>

                        {/* Quick Advance Button */}
                        <div className="pt-2 flex justify-end">
                          {stageStatus === 'Scheduled' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveDelivery({ status: 'In Progress' }, item.id);
                              }}
                              className="text-[10px] flex items-center gap-1 px-2 py-0.5 bg-[var(--color-surface)] hover:text-[var(--color-primary-hex)] rounded border border-[var(--color-divider)]"
                            >
                              <span>Start</span>
                              <ArrowRight size={10} />
                            </button>
                          )}
                          {stageStatus === 'In Progress' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveDelivery({ status: 'Ready for Deployment', almStatus: 'Ready for Test' }, item.id);
                              }}
                              className="text-[10px] flex items-center gap-1 px-2 py-0.5 bg-[var(--color-surface)] hover:text-sky-400 rounded border border-[var(--color-divider)]"
                            >
                              <span>Ready</span>
                              <ArrowRight size={10} />
                            </button>
                          )}
                          {stageStatus === 'Ready for Deployment' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveDelivery({ status: 'Deployed', actualDeliveryDate: todayStr(), almStatus: 'Closed', smokeTestStatus: 'Passed' }, item.id);
                              }}
                              className="text-[10px] flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                            >
                              <span>Deploy Live</span>
                              <Check size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageDeliveries.length === 0 && (
                      <div className="py-8 text-center text-[var(--color-text-faint)] text-xs italic">
                        Empty Stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW MODE 3: 3D HEATMAP WORKSPACE */}
        {viewMode === 'heatmap' && (
          <div className="space-y-4">
            {/* Perspective Picker */}
            <div className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-divider)] p-3 rounded-xl">
              <div>
                <h3 className="font-bold text-sm">Interactive Heatmap Perspectives</h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Pivot delivery density across application modules, screen coverage, and deployment pipelines.
                </p>
              </div>

              <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs">
                <button
                  onClick={() => setHeatmapPerspective('feat_screens')}
                  className={clsx(
                    "px-3 py-1.5 rounded-md font-medium transition-colors",
                    heatmapPerspective === 'feat_screens' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] font-semibold" : "text-[var(--color-text-muted)]"
                  )}
                >
                  Feature × Screens
                </button>
                <button
                  onClick={() => setHeatmapPerspective('env_pipeline')}
                  className={clsx(
                    "px-3 py-1.5 rounded-md font-medium transition-colors",
                    heatmapPerspective === 'env_pipeline' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] font-semibold" : "text-[var(--color-text-muted)]"
                  )}
                >
                  Environment Pipeline
                </button>
                <button
                  onClick={() => setHeatmapPerspective('del_impact')}
                  className={clsx(
                    "px-3 py-1.5 rounded-md font-medium transition-colors",
                    heatmapPerspective === 'del_impact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] font-semibold" : "text-[var(--color-text-muted)]"
                  )}
                >
                  Payload Variance
                </button>
              </div>
            </div>

            {/* PERSPECTIVE 1: Feature x Screens */}
            {heatmapPerspective === 'feat_screens' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">
                  Module Density Matrix
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(dropdowns.module || ['Core Engine', 'Authentication', 'User Interface', 'API Gateway', 'Market Data']).map((mod: string) => {
                    const modDeliveries = deliveries.filter(d => d.module === mod);
                    const deployedCount = modDeliveries.filter(d => d.status === 'Deployed').length;
                    
                    return (
                      <div key={mod} className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-3 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs">{mod}</span>
                          <span className="font-mono text-xs font-bold text-[var(--color-primary-hex)]">
                            {modDeliveries.length} Packages
                          </span>
                        </div>
                        
                        <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${modDeliveries.length ? (deployedCount / modDeliveries.length) * 100 : 0}%` }}
                            title={`${deployedCount} Deployed`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                          <span>{deployedCount} Live</span>
                          <span>{modDeliveries.length - deployedCount} Pending</span>
                        </div>

                        <div className="pt-2 space-y-1">
                          {modDeliveries.slice(0, 3).map(d => (
                            <div key={d.id} className="text-[11px] truncate flex items-center justify-between text-[var(--color-text-muted)]">
                              <span className="truncate max-w-[180px]">{d.name}</span>
                              <span className="font-mono text-[9px] px-1 bg-[var(--color-surface)] rounded">{d.environment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PERSPECTIVE 2: Environment Pipeline */}
            {heatmapPerspective === 'env_pipeline' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Multi-Release Environment Staging Flow
                </h4>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {['Dev', 'QA', 'UAT', 'Staging', 'Production'].map((env, idx) => {
                    const envItems = deliveries.filter(d => d.environment === env);
                    return (
                      <div key={env} className="space-y-2">
                        <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-2 rounded-lg">
                          <div className="text-xs font-medium text-[var(--color-text-muted)]">Stage {idx + 1}</div>
                          <div className="font-bold text-sm text-[var(--color-primary-hex)]">{env}</div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1">{envItems.length} active packages</div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          {envItems.map(item => (
                            <div key={item.id} className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-2 rounded text-xs">
                              <div className="font-mono font-bold text-[10px] text-[var(--color-primary-hex)]">{item.almId}</div>
                              <div className="font-medium text-[11px] truncate mt-0.5">{item.name}</div>
                              <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] mt-1 font-mono">
                                <span>{item.releaseVersion}</span>
                                <span className={item.smokeTestStatus === 'Passed' ? 'text-emerald-400' : 'text-amber-400'}>{item.smokeTestStatus}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PERSPECTIVE 3: Payload Impact Matrix */}
            {heatmapPerspective === 'del_impact' && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-4">
                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3">
                  Lead Time vs Schedule Variance Scatter
                </h4>
                <div className="space-y-2">
                  {deliveries.map(d => (
                    <div key={d.id} className="flex items-center gap-3 p-2 bg-[var(--color-surface-2)] rounded border border-[var(--color-divider)] text-xs">
                      <span className="font-mono font-bold text-[var(--color-primary-hex)] w-24 shrink-0">{d.almId}</span>
                      <span className="font-medium flex-1 truncate">{d.name}</span>
                      <span className="text-xs text-[var(--color-text-muted)] w-20 text-right">{d.leadTimeDays} days</span>
                      <span className={clsx(
                        "font-mono font-bold w-16 text-right",
                        (d.variance || 0) > 0 ? "text-rose-400" : "text-emerald-400"
                      )}>
                        {(d.variance || 0) > 0 ? `+${d.variance}d` : `${d.variance || 0}d`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Delivery Creation / Edit Modal */}
      {isModalOpen && (
        <DeliveryModal 
          isOpen={isModalOpen}
          delivery={editingDelivery}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            saveDelivery(data, editingDelivery?.id);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// Delivery Modal Sub-Component
interface DeliveryModalProps {
  isOpen: boolean;
  delivery: Delivery | null;
  onClose: () => void;
  onSave: (data: Partial<Delivery>) => void;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ isOpen, delivery, onClose, onSave }) => {
  const { state } = useProject();
  const { tasks = [], members = [], dropdowns = {} } = state;

  const [name, setName] = useState(delivery?.name || '');
  const [almId, setAlmId] = useState(delivery?.almId || '');
  const [pdn, setPdn] = useState(delivery?.pdn || '');
  const [module, setModule] = useState(delivery?.module || dropdowns.module?.[0] || 'Core Engine');
  const [moduleType, setModuleType] = useState(delivery?.moduleType || 'Server');
  const [category, setCategory] = useState(delivery?.category || 'GSP++ Delivery');
  const [releaseVersion, setReleaseVersion] = useState(delivery?.releaseVersion || 'v1.1.0');
  const [environment, setEnvironment] = useState(delivery?.environment || 'QA');
  const [status, setStatus] = useState(delivery?.status || 'Scheduled');
  const [almStatus, setAlmStatus] = useState(delivery?.almStatus || 'New');
  const [signOffStatus, setSignOffStatus] = useState(delivery?.signOffStatus || 'Pending');
  const [approver, setApprover] = useState(delivery?.approver || '');
  const [smokeTestStatus, setSmokeTestStatus] = useState(delivery?.smokeTestStatus || 'Not Run');
  const [fixedBy, setFixedBy] = useState(delivery?.fixedBy || '');
  const [reportedBy, setReportBy] = useState(delivery?.reportedBy || '');
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(delivery?.targetDeliveryDate || todayStr());
  const [actualDeliveryDate, setActualDeliveryDate] = useState(delivery?.actualDeliveryDate || '');
  const [componentsDelivered, setComponentsDelivered] = useState(delivery?.componentsDelivered || '');
  const [rollbackPlan, setRollbackPlan] = useState(delivery?.rollbackPlan || '');
  const [notes, setNotes] = useState(delivery?.notes || '');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(delivery?.linkedTasks || []);
  const [selectedScreens, setSelectedScreens] = useState<string[]>(delivery?.linkedScreens || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name,
      almId: almId.trim() || undefined,
      pdn: pdn.trim() || undefined,
      module,
      moduleType,
      category,
      releaseVersion,
      environment,
      status,
      almStatus,
      signOffStatus,
      approver,
      smokeTestStatus,
      fixedBy,
      reportedBy,
      targetDeliveryDate,
      actualDeliveryDate: actualDeliveryDate.trim() || null,
      componentsDelivered,
      rollbackPlan,
      notes,
      linkedTasks: selectedTasks,
      linkedScreens: selectedScreens
    });
  };

  const toggleTaskLink = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[var(--color-primary-hex)]" />
            <h3 className="font-display font-bold text-base uppercase">
              {delivery ? `Edit Delivery Package: ${delivery.almId}` : 'New Software Delivery Package'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
          {/* Row 1: ALM ID & PDN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">ALM Defect / Ticket ID</label>
              <input 
                type="text"
                placeholder="e.g. ALM-10145"
                value={almId}
                onChange={e => setAlmId(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">PDN Release Reference</label>
              <input 
                type="text"
                placeholder="e.g. PDN-2026-004"
                value={pdn}
                onChange={e => setPdn(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] font-mono"
              />
            </div>
          </div>

          {/* Scope / Name */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)]">Delivery Scope / Description *</label>
            <input 
              type="text"
              required
              placeholder="e.g. API Gateway TLS Termination & OAuth Token Introspection"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] font-medium"
            />
          </div>

          {/* Row 2: Module, Environment, Version */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Module</label>
              <select
                value={module}
                onChange={e => setModule(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                {dropdowns.module?.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Environment</label>
              <select
                value={environment}
                onChange={e => setEnvironment(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                {['Production', 'Staging', 'UAT', 'QA', 'Dev'].map(env => (
                  <option key={env} value={env}>{env}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Target Release</label>
              <select
                value={releaseVersion}
                onChange={e => setReleaseVersion(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                {state.releases?.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                )) || ['v1.0.0', 'v1.1.0', 'v2.0.0-Beta', 'v2.1.0'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Statuses & Sign-Off */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Deployment Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                {['Scheduled', 'In Progress', 'Ready for Deployment', 'Deployed', 'Cancelled', 'Rolled Back'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Sign-off Status</label>
              <select
                value={signOffStatus}
                onChange={e => setSignOffStatus(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                {['Pending', 'Approved', 'Rejected', 'Not Required'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Smoke Test Gate</label>
              <select
                value={smokeTestStatus}
                onChange={e => setSmokeTestStatus(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                {['Not Run', 'Running', 'Passed', 'Failed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: People & Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Approver</label>
              <select
                value={approver}
                onChange={e => setApprover(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Developer / Fixed By</label>
              <select
                value={fixedBy}
                onChange={e => setFixedBy(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Target Date</label>
              <input 
                type="date"
                value={targetDeliveryDate}
                onChange={e => setTargetDeliveryDate(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] font-mono"
              />
            </div>
          </div>

          {/* Link Parent Tasks */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)]">
              Link Parent WBS Tasks ({selectedTasks.length} linked)
            </label>
            <div className="mt-1 p-2 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg max-h-32 overflow-y-auto space-y-1 custom-scroll">
              {tasks.map(t => {
                const isLinked = selectedTasks.includes(t.id);
                return (
                  <div 
                    key={t.id}
                    onClick={() => toggleTaskLink(t.id)}
                    className={clsx(
                      "flex items-center justify-between p-1.5 rounded cursor-pointer text-xs transition-colors",
                      isLinked ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-semibold" : "hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                    )}
                  >
                    <span className="font-mono text-[10px] w-20 shrink-0">{t.id}</span>
                    <span className="truncate flex-1 px-2">{t.name}</span>
                    {isLinked && <Check size={12} className="text-[var(--color-primary-hex)]" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Components Delivered & Rollback Plan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Components / Artifacts Delivered</label>
              <textarea 
                rows={2}
                placeholder="e.g. auth-service.jar, main.tf, schema.sql"
                value={componentsDelivered}
                onChange={e => setComponentsDelivered(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg p-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)]">Contingency / Rollback Plan</label>
              <textarea 
                rows={2}
                placeholder="e.g. argocd app rollback to sync revision 3409"
                value={rollbackPlan}
                onChange={e => setRollbackPlan(e.target.value)}
                className="w-full mt-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg p-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
              />
            </div>
          </div>

          <div className="p-3 border-t border-[var(--color-divider)] flex justify-end gap-2 bg-[var(--color-surface-2)] -mx-4 -mb-4 mt-6">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {delivery ? 'Save Changes' : 'Create Package'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveriesView;
