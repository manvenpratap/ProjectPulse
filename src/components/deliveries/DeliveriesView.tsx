import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Delivery, TaskStatus } from '../../types';
import { fmtDate, todayStr, daysDiff } from '../../utils/projectUtils';
import { importDeliveriesFromExcel } from '../../services/excelService';
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
  CheckSquare,
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
  Server,
  Monitor,
  GitBranch,
  ArrowRight,
  Upload,
  Download
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import Modal from '../shared/Modal';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef } from '../shared/DataTable';

type ViewMode = 'table' | 'kanban' | 'heatmap';
type HeatmapPerspective = 'feat_screens' | 'env_pipeline' | 'del_impact';
type AutofitStrategy = 'all' | 'content-only' | 'header-only' | 'compact' | 'comfortable';

const DEL_ST_MAP: Record<string, string> = {
  'Deployed': 'deployed',
  'Ready for Deployment': 'ready',
  'In Progress': 'in-progress',
  'Scheduled': 'scheduled',
  'Cancelled': 'cancelled',
  'Rolled Back': 'rolled-back',
};

const ALM_ST_MAP: Record<string, string> = {
  'New': 'not-started',
  'Open': 'in-progress',
  'In Progress': 'in-progress',
  'Fixed': 'fixed',
  'Ready for Test': 'ready-test',
  'Retest': 'under-review',
  'Closed': 'completed',
  'Rejected': 'rejected',
  'Reopened': 'in-prep',
};

export const DeliveriesView: React.FC = () => {
  const { state, saveDelivery, deleteDelivery, batchUpdateDeliveries, setView, updateProject } = useProject();
  const { deliveries = [], tasks = [], members = [], dropdowns = {} } = state;

  // File import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportDeliveries = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const mergedDeliveries = await importDeliveriesFromExcel(file, state.deliveries || []);
      const newCount = mergedDeliveries.length - (state.deliveries || []).length;
      updateProject({ deliveries: mergedDeliveries });
      alert(`Deliveries imported successfully! ${mergedDeliveries.length} total records (${newCount > 0 ? `${newCount} added, ` : ''}${Math.min(mergedDeliveries.length, (state.deliveries || []).length)} synced).`);
    } catch (err: any) {
      alert('Failed to import deliveries: ' + (err.message || String(err)));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
  const [showInlineFilters, setShowInlineFilters] = useState<boolean>(true);
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

  const pagination = usePagination<Delivery>(filteredDeliveries, 10, 'pp_page_size_deliveries');

  // User-configured column customizations from Field Architect
  const delColMap = useMemo(() => {
    const map: Record<string, { label: string; width?: number; visible?: boolean }> = {};
    (state.delCols || []).forEach(c => {
      map[c.key] = { label: c.label, width: c.width, visible: c.visible !== false };
    });
    return map;
  }, [state.delCols]);

  const columns = useMemo<ColumnDef<Delivery>[]>(() => {
    const baseCols: ColumnDef<Delivery>[] = [
    {
      id: 'almId',
      header: delColMap['almId']?.label || 'ALM ID / PDN',
      headerTitle: 'Application Lifecycle Management tracking ID and Package Delivery Note code. Click to sort.',
      sortable: true,
      width: 'w-28',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] font-mono pl-1">—</span>,
      cell: (item) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-mono font-bold text-xs text-[var(--color-primary-hex)]">
            {item.almId}
          </span>
          {item.pdn && (
            <span className="font-mono text-[10px] text-[var(--color-text-muted)] opacity-70">
              ({item.pdn})
            </span>
          )}
        </div>
      )
    },
    {
      id: 'name',
      header: delColMap['name']?.label || 'DELIVERY SCOPE & DETAILS',
      headerTitle: 'Package title and delivery scope narrative. Click to sort.',
      sortable: true,
      width: 'min-w-[260px]',
      filter: <span className="text-[10px] text-[var(--color-text-faint)] italic pl-1">Filtered by topbar search</span>,
      cell: (item) => (
        <div className="flex items-center gap-1.5 min-w-0 max-w-[340px]">
          <span className="font-bold text-xs leading-tight truncate text-[var(--color-text)]" title={item.name}>
            {item.name}
          </span>
          <span className="shrink-0 text-[10px] text-[var(--color-text-muted)] font-mono">
            ({item.module})
          </span>
          {item.category && (
            <span className="shrink-0 px-1.5 py-0.2 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[9px] font-semibold text-[var(--color-text-muted)]">
              {item.category}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'almStatus',
      header: delColMap['almStatus']?.label || 'ALM STATUS',
      headerTitle: 'Current delivery lifecycle status (New, Scheduled, In Progress, Ready for Deployment, Closed). Click to sort.',
      sortable: true,
      width: 'w-32',
      filter: (
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option key="all" value="all">All</option>
          {['Scheduled', 'In Progress', 'Ready for Deployment', 'Deployed', 'Cancelled', 'Rolled Back'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
      cell: (item) => (
        <span className={clsx("st-badge", `st-${ALM_ST_MAP[item.almStatus] || 'not-started'}`)}>
          <span className="dot" />
          <span>{item.almStatus}</span>
        </span>
      )
    },
    {
      id: 'environment',
      header: delColMap['environment']?.label || 'ENV',
      headerTitle: 'Target deployment infrastructure tier (DEV, SIT, UAT, STAGING, PROD). Click to sort.',
      sortable: true,
      width: 'w-24',
      filter: (
        <select
          value={filterEnv}
          onChange={e => setFilterEnv(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option key="all" value="all">All</option>
          {['Production', 'Staging', 'UAT', 'QA', 'Dev'].map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      ),
      cell: (item) => (
        <span className={clsx(
          "px-2 py-0.5 rounded text-[11px] font-semibold inline-block whitespace-nowrap",
          item.environment === 'Production' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
          item.environment === 'Staging' && "bg-sky-500/10 text-sky-400 border border-sky-500/30",
          item.environment === 'UAT' && "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
          item.environment === 'QA' && "bg-amber-500/10 text-amber-400 border border-amber-500/30",
          item.environment === 'Dev' && "bg-zinc-500/10 text-zinc-400 border border-zinc-500/30",
        )}>
          {item.environment}
        </span>
      )
    },
    {
      id: 'status',
      header: delColMap['status']?.label || 'DEPLOY STATUS',
      headerTitle: 'Deployment pipeline status (Pending, Deployed, Verified, Rolled Back). Click to sort.',
      sortable: true,
      width: 'w-32',
      filter: null,
      cell: (item) => (
        <span className={clsx("st-badge", `st-${DEL_ST_MAP[item.status] || 'not-started'}`)}>
          <span className="dot" />
          <span>{item.status}</span>
        </span>
      )
    },
    {
      id: 'releaseVersion',
      header: delColMap['releaseVersion']?.label || 'RELEASE',
      headerTitle: 'Mapped release vehicle (e.g. v1.0.0, Q3 Release). Click to sort.',
      sortable: true,
      width: 'w-24',
      filter: (
        <select
          value={filterVersion}
          onChange={e => setFilterVersion(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option key="all" value="all">All</option>
          {['v1.0.0', 'v1.1.0', 'v2.0.0-Beta', 'v2.1.0'].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      ),
      cell: (item) => (
        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-[var(--color-surface-2)] rounded border border-[var(--color-divider)] whitespace-nowrap">
          {item.releaseVersion}
        </span>
      )
    },
    {
      id: 'signOffStatus',
      header: delColMap['signOffStatus']?.label || 'SIGN-OFF',
      headerTitle: 'Quality and stakeholder sign-off status (Pending, Approved, Conditionally Approved, Rejected). Click to sort.',
      sortable: true,
      width: 'w-32',
      filter: null,
      cell: (item) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className={clsx(
            "text-xs font-semibold",
            item.signOffStatus === 'Approved' && "text-emerald-400",
            item.signOffStatus === 'Pending' && "text-amber-400",
            item.signOffStatus === 'Rejected' && "text-rose-400",
            item.signOffStatus === 'Not Required' && "text-[var(--color-text-muted)]"
          )}>
            {item.signOffStatus}
          </span>
          {item.approver && (
            <span className="text-[10px] text-[var(--color-text-faint)]">
              ({item.approver.split(' ')[0]})
            </span>
          )}
        </div>
      )
    },
    {
      id: 'smokeTestStatus',
      header: delColMap['smokeTestStatus']?.label || 'SMOKE GATE',
      headerTitle: 'Automated smoke test gate status (Passed, Failed, In Progress, Blocked). Click to sort.',
      sortable: true,
      width: 'w-28',
      filter: (
        <select
          value={filterSmoke}
          onChange={e => setFilterSmoke(e.target.value)}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] rounded-lg px-1.5 py-0.5 text-[11px] text-[var(--color-text)] outline-none transition-colors"
        >
          <option key="all" value="all">All</option>
          {['Passed', 'Running', 'Failed', 'Not Run'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
      cell: (item) => (
        <span className={clsx(
          "px-2 py-0.5 rounded text-xs font-medium inline-block whitespace-nowrap",
          item.smokeTestStatus === 'Passed' && "bg-emerald-500/15 text-emerald-400",
          item.smokeTestStatus === 'Running' && "bg-cyan-500/15 text-cyan-400 motion-safe:animate-pulse",
          item.smokeTestStatus === 'Failed' && "bg-rose-500/15 text-rose-400",
          item.smokeTestStatus === 'Not Run' && "text-[var(--color-text-faint)]"
        )}>
          {item.smokeTestStatus}
        </span>
      )
    },
    {
      id: 'linkedScope',
      header: delColMap['linkedScope']?.label || 'LINKED SCOPE',
      headerTitle: 'Total count of tasks and GUI screens bundled into this delivery note',
      width: 'w-32',
      filter: null,
      cell: (item) => item.linkedId ? (
        <span className="px-1.5 py-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded text-[10px] font-mono truncate max-w-[180px] inline-block whitespace-nowrap" title={item.linkedId}>
          {item.linkedId}
        </span>
      ) : (
        <span className="text-[var(--color-text-faint)] text-xs">—</span>
      )
    },
    {
      id: 'targetDeliveryDate',
      header: delColMap['targetDeliveryDate']?.label || 'TARGET DATE',
      headerTitle: 'Scheduled calendar delivery date. Click to sort.',
      sortable: true,
      width: 'w-28',
      filter: null,
      cell: (item) => (
        <div className="flex items-center gap-1 font-mono text-xs whitespace-nowrap">
          <span>{fmtDate(item.targetDeliveryDate)}</span>
          {item.actualDeliveryDate && (
            <span className="text-[10px] text-emerald-400" title={`Actual: ${fmtDate(item.actualDeliveryDate)}`}>
              ✓
            </span>
          )}
        </div>
      )
    },
    {
      id: 'leadVar',
      header: delColMap['leadVar']?.label || 'LEAD / VAR',
      headerTitle: 'Lead time and schedule variance against baseline target',
      width: 'w-24',
      align: 'right',
      filter: null,
      cell: (item) => (
        <div className="font-mono text-xs whitespace-nowrap text-right">
          <span className="mr-1">{item.leadTimeDays}d</span>
          <span className={clsx(
            "text-[10px]",
            (item.variance || 0) > 0 ? "text-rose-400 font-bold" : ((item.variance || 0) < 0 ? "text-emerald-400 font-bold" : "text-[var(--color-text-muted)]")
          )}>
            {(item.variance || 0) > 0 ? `+${item.variance}d` : `${item.variance || 0}d`}
          </span>
        </div>
      )
    }
  ];

  // Append user-defined custom fields from Field Architect
  (state.delCustomFields || []).forEach(cf => {
    baseCols.push({
      id: `cf_${cf.name}`,
      header: cf.name.toUpperCase(),
      headerTitle: `Custom Field: ${cf.name}`,
      sortable: true,
      width: 'w-32',
      cell: (item) => {
        const val = (item as any)[cf.name];
        if (val === undefined || val === null || val === '') return <span className="text-[10px] text-[var(--color-text-faint)] italic">—</span>;
        if (cf.type === 'checkbox') return <span className="font-semibold text-xs text-emerald-400">{val ? '✓ Yes' : '✕ No'}</span>;
        return <span className="text-xs text-[var(--color-text)] truncate max-w-[150px]">{String(val)}</span>;
      }
    });
  });

  // Filter columns that are marked hidden (except almId and name)
  const visibleCols = baseCols.filter(c => {
    if (c.id === 'almId' || c.id === 'name') return true;
    return delColMap[c.id]?.visible !== false;
  });

  visibleCols.push({
    id: 'actions',
    header: '',
    width: 'w-10',
    align: 'center',
    filter: (filterStatus !== 'all' || filterEnv !== 'all' || filterVersion !== 'all' || filterSmoke !== 'all') ? (
      <button
        onClick={() => {
          setFilterStatus('all');
          setFilterEnv('all');
          setFilterVersion('all');
          setFilterSmoke('all');
        }}
        className="text-[10px] text-[var(--color-primary-hex)] hover:underline font-bold"
      >
        Reset
      </button>
    ) : null,
    cell: (item) => (
      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
        <button
          onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
          className="w-7 h-7 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer"
          title="Edit delivery"
          aria-label="Edit delivery"
        >
          <Edit3 size={13} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete delivery ${item.almId}?`)) {
              deleteDelivery(item.id);
            }
          }}
          className="w-7 h-7 flex items-center justify-center text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          title="Delete delivery"
          aria-label="Delete delivery"
        >
          <Trash2 size={13} />
        </button>
      </div>
    )
  });

  return visibleCols;
  }, [state.delCols, state.delCustomFields, delColMap, filterStatus, filterEnv, filterVersion, filterSmoke]);

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

  const handleBatchALMStatus = (almStatus: string) => {
    if (!selectedIds.size) return;
    batchUpdateDeliveries(Array.from(selectedIds), { almStatus });
    setSelectedIds(new Set());
  };

  const handleBatchCategory = (category: string) => {
    if (!selectedIds.size) return;
    batchUpdateDeliveries(Array.from(selectedIds), { category });
    setSelectedIds(new Set());
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                aria-label="Table Matrix View"
                className={clsx(
                  "px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 min-h-[36px] min-w-[36px]",
                  viewMode === 'table' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Columns size={13} />
                <span className="hidden sm:inline">Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                aria-label="Pipeline Kanban View"
                className={clsx(
                  "px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 min-h-[36px] min-w-[36px]",
                  viewMode === 'kanban' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Kanban size={13} />
                <span className="hidden sm:inline">Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                aria-label="3D Heatmaps View"
                className={clsx(
                  "px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95 min-h-[36px] min-w-[36px]",
                  viewMode === 'heatmap' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Activity size={13} />
                <span className="hidden sm:inline">Heatmaps</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleImportDeliveries}
                className="hidden"
                data-testid="deliveries-file-input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                title="Import Deliveries from Excel or CSV"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] transition-colors active:scale-95 shadow-2xs h-9 cursor-pointer"
                data-testid="import-deliveries-button"
              >
                <Upload size={13} className={isImporting ? "animate-spin" : "text-sky-500"} />
                <span className="hidden sm:inline">{isImporting ? 'Importing...' : 'Import'}</span>
              </button>
            </div>
          </div>
        }
        primaryAction={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="h-9 px-2.5 sm:px-3 font-bold active:scale-95 min-w-[36px] shadow-xs">
            <Plus size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">New Package</span>
          </Button>
        }
      />

      {/* 1. Cockpit Telemetry Banner */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-divider)] p-4 sm:p-6 lg:p-8 shrink-0">
        {/* Bento Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3.5 rounded-2xl shadow-2xs">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Deployed Live</div>
            <div className="text-xl font-bold text-emerald-500 mt-1 flex items-baseline gap-1.5 tracking-tight">
              <span>{telemetry.deployed}</span>
              <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
                / {telemetry.total}
              </span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Production sign-off</div>
          </div>

          <div className="bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3.5 rounded-2xl shadow-2xs">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Ready / In Flight</div>
            <div className="text-xl font-bold text-sky-500 mt-1 flex items-baseline gap-1.5 tracking-tight">
              <span>{telemetry.ready + telemetry.inProgress}</span>
              <span className="text-[11px] font-normal text-[var(--color-text-muted)]">
                active
              </span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Staging & UAT queues</div>
          </div>

          <div className="bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3.5 rounded-2xl shadow-2xs">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Pending Sign-Off</div>
            <div className="text-xl font-bold text-amber-500 mt-1 tracking-tight">
              {telemetry.pendingSignoff}
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Awaiting lead sign-off</div>
          </div>

          <div className="bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3.5 rounded-2xl shadow-2xs">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Smoke Test Gates</div>
            <div className="text-xl font-bold mt-1 flex items-center gap-2 tracking-tight">
              <span className={telemetry.failedSmoke > 0 ? "text-rose-500" : "text-emerald-500"}>
                {telemetry.failedSmoke > 0 ? `${telemetry.failedSmoke} Fail` : '0 Fail'}
              </span>
              {telemetry.runningSmoke > 0 && (
                <span className="text-[10px] text-cyan-500 font-mono motion-safe:animate-pulse">
                  ({telemetry.runningSmoke} Run)
                </span>
              )}
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Automated test matrix</div>
          </div>

          <div className="bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3.5 rounded-2xl shadow-2xs">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Avg Cycle Lead Time</div>
            <div className="text-xl font-bold text-[var(--color-text)] mt-1 tracking-tight">
              {telemetry.avgLeadTime} <span className="text-xs text-[var(--color-text-muted)] font-normal">days</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Commit-to-release duration</div>
          </div>

          <div className="bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3.5 rounded-2xl shadow-2xs">
            <div className="text-xs font-medium text-[var(--color-text-muted)]">Delay Variance</div>
            <div className={clsx(
              "text-xl font-bold mt-1 tracking-tight",
              parseFloat(telemetry.avgVariance) > 0 ? "text-rose-500" : "text-emerald-500"
            )}>
              {parseFloat(telemetry.avgVariance) > 0 ? `+${telemetry.avgVariance}` : telemetry.avgVariance}
              <span className="text-xs text-[var(--color-text-muted)] ml-1 font-normal">days</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Variance vs target</div>
          </div>
        </div>
      </div>

      {/* 2. Operational Filter Toolbar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 bg-[var(--color-surface)] border-b border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-3 shrink-0">
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
            <option key="all" value="all">All Envs</option>
            {(dropdowns.deliveryEnv && dropdowns.deliveryEnv.length > 0
              ? dropdowns.deliveryEnv
              : ['Production', 'Staging', 'UAT', 'QA', 'Dev']
            ).map((env: string, idx: number) => (
              <option key={`env-${env}-${idx}`} value={env}>{env}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary-hex)]"
          >
            <option key="all" value="all">All Statuses</option>
            {['Scheduled', 'In Progress', 'Ready for Deployment', 'Deployed', 'Cancelled', 'Rolled Back'].map((s, idx) => (
              <option key={`status-${s}-${idx}`} value={s}>{s}</option>
            ))}
          </select>

          {/* Version Filter */}
          <select 
            value={filterVersion}
            onChange={e => setFilterVersion(e.target.value)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary-hex)]"
          >
            <option key="all" value="all">All Releases</option>
            {state.releases && state.releases.length > 0 ? (
              state.releases.map((r, idx) => {
                const relVal = r.name || r.version || `rel-${idx}`;
                return (
                  <option key={`rel-${relVal}`} value={relVal}>{relVal} ({r.title || r.status})</option>
                );
              })
            ) : (
              ['v1.0.0', 'v1.1.0', 'v2.0.0-Beta', 'v2.1.0'].map((v, idx) => (
                <option key={`rel-fallback-${v}-${idx}`} value={v}>{v}</option>
              ))
            )}
          </select>

          {/* Column Autofit Strategy & Filter Toggle (ProjectPulse standard) */}
          {viewMode === 'table' && (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-divider)]">
              <button
                onClick={() => setShowInlineFilters(!showInlineFilters)}
                className={clsx(
                  "px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer",
                  showInlineFilters 
                    ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/30"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)]"
                )}
                title="Toggle column header filter row"
              >
                <Filter size={12} />
                <span>{showInlineFilters ? 'Filters Visible' : 'Show Filters'}</span>
              </button>

              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">Autofit:</span>
                <select 
                  value={autofitStrategy}
                  onChange={e => setAutofitStrategy(e.target.value as AutofitStrategy)}
                  className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary-hex)]"
                  title="Table column autofit engine layout mode"
                >
                  <option key="comfortable" value="comfortable">Comfortable</option>
                  <option key="compact" value="compact">Compact Dense</option>
                  <option key="content-only" value="content-only">Wrap Content</option>
                  <option key="header-only" value="header-only">Header Bounds</option>
                  <option key="all" value="all">Full Fill</option>
                </select>
              </div>
            </div>
          )}

          {/* Bulk Selection Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-[var(--color-surface-2)] border-2 border-[var(--color-primary-hex)] rounded-xl px-3 py-1.5 ml-auto flex-wrap shadow-sm">
              <span className="font-extrabold text-xs text-[var(--color-primary-hex)] flex items-center gap-1">
                <CheckSquare size={13} />
                {selectedIds.size} Selected
              </span>

              <div className="h-4 w-px bg-[var(--color-divider)] hidden sm:block" />

              {/* Batch ALM Status */}
              <select
                onChange={(e) => {
                  if (e.target.value) handleBatchALMStatus(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-xs cursor-pointer"
              >
                <option key="placeholder-status" value="" disabled>Set ALM Status...</option>
                {['New', 'Open', 'In Progress', 'Fixed', 'Ready for Test', 'Retest', 'Closed', 'Rejected', 'Reopened'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Batch Category */}
              <select
                onChange={(e) => {
                  if (e.target.value) handleBatchCategory(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-xs cursor-pointer"
              >
                <option key="placeholder-category" value="" disabled>Set Category...</option>
                {['GSP++ Delivery', 'Regression/NRT Defect'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <button 
                onClick={handleBatchDeploy}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                title="Mark selected as Deployed"
              >
                Deploy
              </button>
              <button 
                onClick={handleBatchSignOff}
                className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                title="Approve sign-off"
              >
                Sign Off
              </button>
              <button 
                onClick={handleBatchDelete}
                className="p-1 hover:bg-rose-500/20 text-rose-500 rounded transition-colors cursor-pointer"
                title="Delete selected packages"
              >
                <Trash2 size={13} />
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline cursor-pointer"
              >
                Deselect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Workspace Body */}
      <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 lg:p-8">
        {/* VIEW MODE 1: MATRIX TABLE (Powered by generic DataTable) */}
        {viewMode === 'table' && (
          <DataTable<Delivery>
            data={filteredDeliveries}
            columns={columns}
            keyField="id"
            density={autofitStrategy === 'compact' ? 'compact' : 'comfortable'}
            showInlineFilters={showInlineFilters}
            sortField={sortBy}
            sortAsc={sortAsc}
            onSort={(f) => {
              if (sortBy === f) setSortAsc(!sortAsc);
              else { setSortBy(f as any); setSortAsc(true); }
            }}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            isAllSelected={selectedIds.size > 0 && selectedIds.size === filteredDeliveries.length}
            showRowNumbers
            pagination={pagination}
            itemLabel="packages"
            onRowClick={(item) => handleOpenEdit(item)}
            rowClassName={(item) => {
              const isOverdue = daysDiff(item.targetDeliveryDate)! < 0 && item.status !== 'Deployed' && item.status !== 'Cancelled';
              return isOverdue ? "is-overdue bg-rose-500/[0.02]" : "";
            }}
          />
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
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (!delivery && isOpen) {
      try {
        const saved = localStorage.getItem('pp_draft_delivery');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name && !name) {
            setHasDraft(true);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, [delivery, isOpen]);

  useEffect(() => {
    if (!delivery && isOpen && (name || almId || pdn)) {
      localStorage.setItem('pp_draft_delivery', JSON.stringify({
        name, almId, pdn, module, moduleType, category, releaseVersion, environment, status, approver
      }));
    }
  }, [name, almId, pdn, module, moduleType, category, releaseVersion, environment, status, approver, delivery, isOpen]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem('pp_draft_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.almId) setAlmId(parsed.almId);
        if (parsed.pdn) setPdn(parsed.pdn);
        if (parsed.module) setModule(parsed.module);
        if (parsed.moduleType) setModuleType(parsed.moduleType);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.releaseVersion) setReleaseVersion(parsed.releaseVersion);
        if (parsed.environment) setEnvironment(parsed.environment);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.approver) setApprover(parsed.approver);
      }
    } catch (e) {
      // ignore
    }
    setHasDraft(false);
  };

  const discardDraft = () => {
    localStorage.removeItem('pp_draft_delivery');
    setHasDraft(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    localStorage.removeItem('pp_draft_delivery');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={delivery ? `Edit Package: ${delivery.almId || delivery.name}` : 'New Software Delivery Package'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2.5 w-full">
          <Button variant="outline" size="sm" type="button" onClick={onClose} className="rounded-xl min-h-[38px] px-4 font-semibold">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="button" onClick={handleSubmit} className="rounded-xl min-h-[38px] px-4 font-semibold bg-[var(--color-primary-hex)] text-[var(--color-primary-text)]">
            {delivery ? 'Save Changes' : 'Create Package'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {hasDraft && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <span>Unfinished package draft found from previous session.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                className="underline hover:no-underline font-semibold text-amber-700 dark:text-amber-300 cursor-pointer"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="text-amber-600/70 hover:text-amber-800 text-[11px] cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}
        {/* Row 1: ALM ID & PDN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                {state.releases && state.releases.length > 0 ? (
                  state.releases.map((r, idx) => {
                    const relVal = r.name || r.version || `rel-${idx}`;
                    return (
                      <option key={relVal} value={relVal}>{relVal} - {r.title || r.status}</option>
                    );
                  })
                ) : (
                  ['v1.0.0', 'v1.1.0', 'v2.0.0-Beta', 'v2.1.0'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))
                )}
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
                <option key="unassigned" value="">Unassigned</option>
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
                <option key="unassigned" value="">Unassigned</option>
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

      </form>
    </Modal>
  );
};

export default DeliveriesView;
