import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Release, TaskStatus } from '../../types';
import { fmtDate, todayStr, daysDiff } from '../../utils/projectUtils';
import { RELEASE_CYCLE, ReleaseStatus } from '../../utils/stateMachines';
import { 
  Flag, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Layers, 
  Package, 
  ClipboardList, 
  RefreshCw, 
  ExternalLink, 
  ChevronRight, 
  ArrowRight, 
  X,
  Table2,
  LayoutGrid,
  Download,
  PanelRight,
  SlidersHorizontal,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import Modal from '../shared/Modal';
import SectionHelpButton from '../shared/SectionHelpButton';
import CollapsibleSummaryStrip from '../shared/CollapsibleSummaryStrip';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { MotionPage, StaggerContainer, StaggerItem, AnimatedProgressBar } from '../shared/MotionPage';
import { AnimatedMetric, COCKPIT_EASE } from '../shared/AnimatedMetric';
import { toast } from '../../utils/toast';
import clsx from 'clsx';

type ReleaseViewMode = 'table' | 'cards';

export const ReleaseRoadmap: React.FC = () => {
  const { state, updateProject, addLog, setView } = useProject();
  const { releases = [], tasks = [], deliveries = [] } = state;

  // View Mode Persistence
  const [viewMode, setViewMode] = useState<ReleaseViewMode>(() => {
    try {
      const saved = localStorage.getItem('pp_release_view_mode');
      return (saved === 'cards' || saved === 'table') ? saved : 'table';
    } catch {
      return 'table';
    }
  });

  const handleToggleViewMode = (mode: ReleaseViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('pp_release_view_mode', mode);
    } catch {}
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReleaseIds, setSelectedReleaseIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [selectedReleaseDetails, setSelectedReleaseDetails] = useState<Release | null>(null);
  const [scopeDrawerTab, setScopeDrawerTab] = useState<'all' | 'tasks' | 'deliveries'>('all');

  // Form State
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState(todayStr());
  const [formTargetDate, setFormTargetDate] = useState(todayStr());
  const [formStatus, setFormStatus] = useState<'Planned' | 'Active' | 'Released'>('Planned');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search & 'Escape' to deselect/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (selectedReleaseIds.size > 0) {
          setSelectedReleaseIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReleaseIds]);

  // Statistics
  const totalReleases = releases.length;
  const activeReleases = releases.filter(r => r.status === 'Active').length;
  const releasedReleases = releases.filter(r => r.status === 'Released').length;
  const plannedReleases = releases.filter(r => r.status === 'Planned').length;

  const unmappedTasks = tasks.filter(t => !t.release || t.release.trim() === '').length;
  const unmappedDeliveries = deliveries.filter(d => !d.releaseVersion || d.releaseVersion.trim() === '').length;

  // Filtered releases
  const filteredReleases = useMemo(() => {
    return releases.filter(r => {
      const matchesSearch = !searchQuery.trim() || 
        (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.status || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.startDate || '').includes(searchQuery) ||
        (r.date || '').includes(searchQuery);
      const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [releases, searchQuery, filterStatus]);

  // Modal Handlers
  const openAddModal = () => {
    setEditingRelease(null);
    setFormName('');
    setFormStartDate(todayStr());
    setFormTargetDate(todayStr());
    setFormStatus('Planned');
    setIsModalOpen(true);
  };

  const openEditModal = (r: Release) => {
    setEditingRelease(r);
    setFormName(r.name);
    setFormStartDate(r.startDate || todayStr());
    setFormTargetDate(r.date || todayStr());
    setFormStatus(r.status);
    setIsModalOpen(true);
  };

  const handleSaveRelease = () => {
    if (!formName.trim()) {
      toast.error('Release name is required');
      return;
    }

    if (editingRelease) {
      const updated = releases.map(r => r.id === editingRelease.id ? {
        ...r,
        name: formName.trim(),
        startDate: formStartDate,
        date: formTargetDate,
        status: formStatus
      } : r);
      updateProject({ releases: updated });
      addLog('Updated Release', editingRelease.id, formName.trim(), 'status', editingRelease.status, formStatus, 'Release details modified');
      toast.success(`Updated release "${formName.trim()}".`);
      if (selectedReleaseDetails?.id === editingRelease.id) {
        setSelectedReleaseDetails({
          ...editingRelease,
          name: formName.trim(),
          startDate: formStartDate,
          date: formTargetDate,
          status: formStatus
        });
      }
    } else {
      const newId = `rel-${Date.now().toString(36)}`;
      const newRelease: Release = {
        id: newId,
        name: formName.trim(),
        startDate: formStartDate,
        date: formTargetDate,
        status: formStatus
      };
      updateProject({ releases: [...releases, newRelease] });
      addLog('Created Release', newId, formName.trim(), 'release', '', formName.trim(), 'New release cycle created');
      toast.success(`Created release "${formName.trim()}".`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteRelease = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete release version "${name}"? Mapped tasks will remain intact.`)) {
      updateProject({ releases: releases.filter(r => r.id !== id) });
      addLog('Deleted Release', id, name, 'release', name, '', 'Release cycle deleted');
      toast.success(`Deleted release "${name}".`);
      if (selectedReleaseDetails?.id === id) {
        setSelectedReleaseDetails(null);
      }
      if (selectedReleaseIds.has(id)) {
        const next = new Set(selectedReleaseIds);
        next.delete(id);
        setSelectedReleaseIds(next);
      }
    }
  };

  const handleSyncDatesToTasks = (r: Release) => {
    if (!r.startDate || !r.date) return;
    const mapped = tasks.filter(t => t.release === r.name);
    if (!mapped.length) {
      toast.info(`No tasks currently mapped to ${r.name}`);
      return;
    }

    if (confirm(`Sync start date (${r.startDate}) and target date (${r.date}) across ${mapped.length} tasks mapped to ${r.name}?`)) {
      const updatedTasks = tasks.map(t => {
        if (t.release === r.name) {
          return {
            ...t,
            startDate: t.status === TaskStatus.COMPLETED ? t.startDate : r.startDate,
            dueDate: t.status === TaskStatus.COMPLETED ? t.dueDate : r.date,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      updateProject({ tasks: updatedTasks });
      addLog('Synced Release Dates', r.id, r.name, 'tasks', '', '', `Synchronized dates for ${mapped.length} tasks`);
      toast.success(`Synchronized dates for ${mapped.length} tasks in "${r.name}".`);
    }
  };

  // Inline Quick Status Change
  const handleQuickStatusChange = (r: Release, newStatus: Release['status']) => {
    if (r.status === newStatus) return;
    const updated = releases.map(item => item.id === r.id ? { ...item, status: newStatus } : item);
    updateProject({ releases: updated });
    addLog('Updated Release Status', r.id, r.name, 'status', r.status, newStatus);
    toast.success(`Set "${r.name}" to ${newStatus}.`);
    if (selectedReleaseDetails?.id === r.id) {
      setSelectedReleaseDetails({ ...r, status: newStatus });
    }
  };

  // Drawer Navigation
  const drawerIndex = useMemo(() => {
    if (!selectedReleaseDetails) return -1;
    return filteredReleases.findIndex(r => r.id === selectedReleaseDetails.id);
  }, [filteredReleases, selectedReleaseDetails]);

  const handleNextRelease = () => {
    if (drawerIndex >= 0 && drawerIndex < filteredReleases.length - 1) {
      setSelectedReleaseDetails(filteredReleases[drawerIndex + 1]);
    }
  };

  const handlePreviousRelease = () => {
    if (drawerIndex > 0) {
      setSelectedReleaseDetails(filteredReleases[drawerIndex - 1]);
    }
  };

  // Batch Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedReleaseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedReleaseIds.size === filteredReleases.length && filteredReleases.length > 0) {
      setSelectedReleaseIds(new Set());
    } else {
      setSelectedReleaseIds(new Set(filteredReleases.map(r => r.id)));
    }
  };

  const handleBatchSetStatus = (status: Release['status']) => {
    const updated = releases.map(r => selectedReleaseIds.has(r.id) ? { ...r, status } : r);
    updateProject({ releases: updated });
    toast.success(`Updated status to "${status}" for ${selectedReleaseIds.size} release(s).`);
    setSelectedReleaseIds(new Set());
  };

  const handleBatchDelete = () => {
    if (confirm(`Delete ${selectedReleaseIds.size} selected release version(s)? Mapped tasks will remain intact.`)) {
      updateProject({ releases: releases.filter(r => !selectedReleaseIds.has(r.id)) });
      toast.success(`Deleted ${selectedReleaseIds.size} release version(s).`);
      setSelectedReleaseIds(new Set());
      if (selectedReleaseDetails && selectedReleaseIds.has(selectedReleaseDetails.id)) {
        setSelectedReleaseDetails(null);
      }
    }
  };

  const handleBatchSyncDates = () => {
    let syncedCount = 0;
    const selectedList = releases.filter(r => selectedReleaseIds.has(r.id));
    let nextTasks = [...tasks];

    selectedList.forEach(r => {
      if (!r.startDate || !r.date) return;
      nextTasks = nextTasks.map(t => {
        if (t.release === r.name) {
          syncedCount++;
          return {
            ...t,
            startDate: t.status === TaskStatus.COMPLETED ? t.startDate : r.startDate,
            dueDate: t.status === TaskStatus.COMPLETED ? t.dueDate : r.date,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
    });

    if (syncedCount > 0) {
      updateProject({ tasks: nextTasks });
      toast.success(`Synchronized dates across ${syncedCount} mapped tasks.`);
    } else {
      toast.info('No mapped tasks found in selected releases to synchronize.');
    }
  };

  // CSV Export (Governance Tool with UTF-8 BOM)
  const handleExportCsv = () => {
    const headers = ['Release Version', 'Governance Status', 'Cycle Start Date', 'Target Launch Date', 'Days Remaining', 'Completion %', 'Mapped Tasks', 'Mapped Deliveries'];
    const rows = filteredReleases.map(r => {
      const mappedTasks = tasks.filter(t => t.release === r.name);
      const mappedDeliveries = deliveries.filter(d => d.releaseVersion === r.name);
      const completedTasks = mappedTasks.filter(t => t.status === TaskStatus.COMPLETED);
      const progress = mappedTasks.length > 0 ? Math.round((completedTasks.length / mappedTasks.length) * 100) : 0;
      const daysLeft = r.date ? daysDiff(r.date) : '';
      return [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${r.startDate || ''}"`,
        `"${r.date || ''}"`,
        daysLeft,
        `${progress}%`,
        mappedTasks.length,
        mappedDeliveries.length
      ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProjectPulse_Releases_${todayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredReleases.length} releases to CSV.`);
  };

  const getStatusBadge = (status: Release['status']) => {
    switch (status) {
      case 'Released':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Active':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Planned':
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  // Linear-Grade Table Columns
  const columns = useMemo<ColumnDef<Release>[]>(() => [
    {
      id: 'name',
      header: 'Release Version',
      width: '260px',
      sortable: true,
      sortKey: 'name',
      cell: (r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center font-mono font-bold text-xs shrink-0">
            {r.name.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-[var(--color-text)] truncate block hover:text-[var(--color-primary-hex)] transition-colors">
              {r.name}
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Governance Status',
      width: '160px',
      sortable: true,
      sortKey: 'status',
      cell: (r) => (
        <select
          value={r.status}
          onChange={(e) => handleQuickStatusChange(r, e.target.value as Release['status'])}
          className={clsx(
            "h-7 px-2.5 rounded-lg text-xs font-bold border outline-none cursor-pointer bg-transparent transition-colors",
            getStatusBadge(r.status)
          )}
          aria-label={`Governance status for ${r.name}`}
        >
          <option value="Planned" className="bg-[var(--color-surface)] text-[var(--color-text)]">Planned</option>
          <option value="Active" className="bg-[var(--color-surface)] text-[var(--color-text)]">Active</option>
          <option value="Released" className="bg-[var(--color-surface)] text-[var(--color-text)]">Released</option>
        </select>
      )
    },
    {
      id: 'startDate',
      header: 'Cycle Start',
      width: '130px',
      sortable: true,
      sortKey: 'startDate',
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-[var(--color-text-muted)]">
          {fmtDate(r.startDate || '')}
        </span>
      )
    },
    {
      id: 'date',
      header: 'Target Launch',
      width: '180px',
      sortable: true,
      sortKey: 'date',
      cell: (r) => {
        const daysLeft = r.date ? daysDiff(r.date) : null;
        const isOverdue = daysLeft !== null && daysLeft < 0 && r.status !== 'Released';

        return (
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
            <span className={clsx(isOverdue ? "text-rose-500 font-bold" : "text-[var(--color-text)]")}>
              {fmtDate(r.date || '')}
            </span>
            {daysLeft !== null && (
              <span className={clsx(
                "text-[10px] px-1.5 py-0.5 rounded-md font-mono",
                isOverdue 
                  ? "bg-rose-500/10 text-rose-500 font-bold" 
                  : daysLeft === 0 
                    ? "bg-amber-500/10 text-amber-600 font-bold" 
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-faint)]"
              )}>
                {daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today' : `${Math.abs(daysLeft)}d overdue`}
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'progress',
      header: 'Scope Completion',
      width: '200px',
      cell: (r) => {
        const mappedTasks = tasks.filter(t => t.release === r.name);
        const completedTasks = mappedTasks.filter(t => t.status === TaskStatus.COMPLETED);
        const progress = mappedTasks.length > 0 ? Math.round((completedTasks.length / mappedTasks.length) * 100) : 0;

        return (
          <div className="space-y-1 w-full max-w-[160px]">
            <div className="flex justify-between items-center text-[11px] font-semibold">
              <span className="font-mono text-[var(--color-text-muted)]">{completedTasks.length}/{mappedTasks.length}</span>
              <span className="font-mono font-bold text-[var(--color-primary-hex)]">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-300",
                  progress === 100 ? "bg-emerald-500" : progress > 50 ? "bg-[var(--color-primary-hex)]" : "bg-sky-500"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      id: 'tasks',
      header: 'Tasks',
      width: '100px',
      align: 'center',
      cell: (r) => {
        const count = tasks.filter(t => t.release === r.name).length;
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs font-semibold text-[var(--color-text)]">
            <ClipboardList size={12} className="text-[var(--color-primary-hex)]" />
            <span>{count}</span>
          </span>
        );
      }
    },
    {
      id: 'deliveries',
      header: 'Deliveries',
      width: '110px',
      align: 'center',
      cell: (r) => {
        const count = deliveries.filter(d => d.releaseVersion === r.name).length;
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600">
            <Package size={12} />
            <span>{count}</span>
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '130px',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setSelectedReleaseDetails(r)}
            title="Inspect Release Scope in Peek Drawer"
            aria-label={`Inspect scope for ${r.name}`}
            className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
          >
            <PanelRight size={14} />
          </button>
          <button
            onClick={() => openEditModal(r)}
            title="Edit Release Specs"
            aria-label={`Edit ${r.name}`}
            className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => handleSyncDatesToTasks(r)}
            title="Sync Dates to Mapped Tasks"
            aria-label={`Sync dates for ${r.name}`}
            className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => handleDeleteRelease(r.id, r.name)}
            title="Delete Release"
            aria-label={`Delete ${r.name}`}
            className="p-1.5 text-[var(--color-text-faint)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ], [tasks, deliveries]);

  return (
    <MotionPage className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Flag}
        title="Release Roadmap"
        subtitle="Govern milestone version lifecycles, mapped scope telemetry, and release date synchronizations"
        primaryAction={
          <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 px-4 rounded-xl font-bold active:scale-95 shadow-xs">
            <Plus size={15} className="mr-1.5" /> Add Release Version
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-4 sm:space-y-5">
        {/* Collapsible KPI Telemetry Cards */}
        <CollapsibleSummaryStrip
          title="Release Cycle Telemetry"
          summary={[
            { label: 'Total Cycles', value: totalReleases, tone: 'primary' },
            { label: 'Active Cycle', value: activeReleases, tone: 'sky' },
            { label: 'Shipped', value: releasedReleases, tone: 'emerald' },
            { label: 'Unmapped Scope', value: unmappedTasks, tone: 'amber' }
          ]}
          contentClassName="pt-2.5 pb-1"
        >
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StaggerItem className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
                <span>Total Cycles</span>
                <Flag size={14} className="text-[var(--color-primary-hex)]" />
              </div>
              <div className="mt-2 text-2xl font-mono font-black text-[var(--color-text)]">
                <AnimatedMetric value={totalReleases} />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                Configured milestones
              </div>
            </StaggerItem>

            <StaggerItem className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
                <span>Active Cycle</span>
                <Clock size={14} className="text-sky-500" />
              </div>
              <div className="mt-2 text-2xl font-mono font-black text-sky-500">
                <AnimatedMetric value={activeReleases} />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                In active development
              </div>
            </StaggerItem>

            <StaggerItem className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
                <span>Shipped</span>
                <CheckCircle2 size={14} className="text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-mono font-black text-emerald-600">
                <AnimatedMetric value={releasedReleases} />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                Production delivered
              </div>
            </StaggerItem>

            <StaggerItem className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
                <span>Unmapped Scope</span>
                <AlertTriangle size={14} className="text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-mono font-black text-amber-600">
                <AnimatedMetric value={unmappedTasks} />
              </div>
              <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                Tasks without release tag
              </div>
            </StaggerItem>
          </StaggerContainer>
        </CollapsibleSummaryStrip>

        {/* Filter, Search & View Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-sm">
          {/* Search input with '/' shortcut */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input 
              ref={searchInputRef}
              type="search"
              placeholder="Search release versions… (Press /)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              aria-label="Search release versions"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] p-0.5"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Preset Filter Chips */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              data-filter-status="all"
              onClick={() => setFilterStatus('all')}
              className={clsx(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0",
                filterStatus === 'all'
                  ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
              )}
            >
              All ({totalReleases})
            </button>
            {(['Active', 'Planned', 'Released'] as const).map(st => {
              const count = st === 'Active' ? activeReleases : st === 'Planned' ? plannedReleases : releasedReleases;
              return (
                <button
                  key={st}
                  data-filter-status={st}
                  onClick={() => setFilterStatus(st)}
                  className={clsx(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1",
                    filterStatus === st
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <span>{st}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}

            {(filterStatus !== 'all' || searchQuery) && (
              <button
                onClick={() => { setFilterStatus('all'); setSearchQuery(''); }}
                className="px-2 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer ml-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* Action & View Toggle Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-9 px-3 rounded-xl border-[var(--color-divider)] bg-[var(--color-surface-2)] font-bold text-xs"
              title="Export releases to CSV"
            >
              <Download size={13} className="mr-1.5 text-[var(--color-primary-hex)]" />
              <span>Export CSV</span>
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
              <button
                data-testid="toggle-view-table"
                onClick={() => handleToggleViewMode('table')}
                className={clsx(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === 'table' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="Linear-Grade Precision Table"
                aria-label="Table View"
              >
                <Table2 size={15} />
              </button>
              <button
                data-testid="toggle-view-cards"
                onClick={() => handleToggleViewMode('cards')}
                className={clsx(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === 'cards' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="Milestone Bento Cards Grid"
                aria-label="Cards View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ── MODE 1: LINEAR-GRADE PRECISION TABLE ── */}
        {viewMode === 'table' && (
          <div className="card overflow-hidden border border-[var(--color-divider)] shadow-sm">
            <DataTable<Release>
              data={filteredReleases}
              columns={columns}
              keyField="id"
              selectable={true}
              selectedIds={selectedReleaseIds}
              onToggleSelect={(id) => handleToggleSelect(id)}
              onToggleSelectAll={handleToggleSelectAll}
              isAllSelected={selectedReleaseIds.size === filteredReleases.length && filteredReleases.length > 0}
              showRowNumbers={true}
              stickyFirstColumn={true}
              enableColumnVisibility={true}
              columnVisibilityStorageKey="pp_release_table_cols"
              emptyTitle="No release versions found"
              emptyMessage={searchQuery || filterStatus !== 'all' ? "Try clearing your active filters or search terms." : "Add a new release cycle to align tasks, deliveries, and roadmap schedules."}
              emptyAction={
                searchQuery || filterStatus !== 'all' ? (
                  <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
                    <RefreshCw size={13} className="mr-1.5" /> Clear Filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={openAddModal}>
                    <Plus size={14} className="mr-1.5" /> Add Release Version
                  </Button>
                )
              }
            />
          </div>
        )}

        {/* ── MODE 2: MILESTONE BENTO CARDS GRID ── */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReleases.map(r => {
              const mappedTasks = tasks.filter(t => t.release === r.name);
              const mappedDeliveries = deliveries.filter(d => d.releaseVersion === r.name);
              const completedTasks = mappedTasks.filter(t => t.status === TaskStatus.COMPLETED);
              const progress = mappedTasks.length > 0 ? Math.round((completedTasks.length / mappedTasks.length) * 100) : 0;
              const daysLeft = r.date ? daysDiff(r.date) : null;
              const isOverdue = daysLeft !== null && daysLeft < 0 && r.status !== 'Released';
              const isSelected = selectedReleaseIds.has(r.id);

              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, transform: 'translateY(10px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: COCKPIT_EASE }}
                  className={clsx(
                    "p-5 rounded-2xl border transition-all duration-150 shadow-sm flex flex-col justify-between group",
                    isSelected 
                      ? "border-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)]/20" 
                      : "bg-[var(--color-surface)] border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          aria-label={`Select ${r.name}`}
                          className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] focus:ring-[var(--color-primary-hex)] cursor-pointer"
                        />
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {r.name.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-[var(--color-text)] flex items-center gap-2">
                            {r.name}
                          </h3>
                          <span className={clsx(
                            "inline-block px-2 py-0.5 rounded-md text-xs font-medium border mt-1",
                            getStatusBadge(r.status)
                          )}>
                            {r.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedReleaseDetails(r)}
                          className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors active:scale-95 cursor-pointer"
                          title="Inspect Release Scope in Peek Drawer"
                          aria-label="Inspect Release Scope"
                        >
                          <PanelRight size={15} />
                        </button>
                        <button 
                          onClick={() => openEditModal(r)}
                          className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors active:scale-95 cursor-pointer"
                          title="Edit Release"
                          aria-label="Edit Release"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteRelease(r.id, r.name)}
                          className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors active:scale-95 cursor-pointer"
                          title="Delete Release"
                          aria-label="Delete Release"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Dates & Timeline */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[var(--color-surface-2)] text-xs mb-3">
                      <div>
                        <span className="text-xs font-medium text-[var(--color-text-muted)] block">Cycle Start</span>
                        <span className="font-mono font-semibold text-[var(--color-text)]">{fmtDate(r.startDate || '')}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-[var(--color-text-muted)] block">Target Launch</span>
                        <span className={clsx(
                          "font-mono font-semibold",
                          isOverdue ? "text-rose-500 font-bold" : "text-[var(--color-text)]"
                        )}>
                          {fmtDate(r.date || '')}
                          {daysLeft !== null && (
                            <span className="ml-1 text-[9px] font-normal opacity-75">
                              ({daysLeft > 0 ? `${daysLeft}d left` : `${Math.abs(daysLeft)}d overdue`})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)]">Scope Completion</span>
                        <span className="font-mono font-bold text-[var(--color-primary-hex)]">
                          <AnimatedMetric value={progress} suffix="%" />
                        </span>
                      </div>
                      <AnimatedProgressBar progress={progress} height={8} />
                    </div>

                    {/* Mapped Assets */}
                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] py-2 border-t border-[var(--color-divider)]">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList size={13} className="text-[var(--color-primary-hex)]" />
                        <span className="font-semibold text-[var(--color-text)]">{mappedTasks.length}</span> Tasks
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package size={13} className="text-emerald-500" />
                        <span className="font-semibold text-[var(--color-text)]">{mappedDeliveries.length}</span> Deliveries
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-divider)] mt-2">
                    <button
                      onClick={() => handleSyncDatesToTasks(r)}
                      className="text-[11px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} /> Sync Dates to Tasks
                    </button>

                    <button
                      onClick={() => setSelectedReleaseDetails(r)}
                      className="text-[11px] font-bold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      View Scope <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {filteredReleases.length === 0 && (
              <div className="col-span-full py-16 text-center bg-[var(--color-surface)] border border-dashed border-[var(--color-divider)] rounded-2xl">
                <Flag size={32} className="mx-auto text-[var(--color-text-faint)] mb-2" />
                <h3 className="text-sm font-bold text-[var(--color-text)]">No release versions found</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Add a new release cycle to align tasks, deliveries, and roadmap schedules.
                </p>
                <Button variant="primary" size="sm" onClick={openAddModal} className="mt-4">
                  <Plus size={14} className="mr-1" /> Add Release Version
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Floating Action Bar for Batch Selection ── */}
      <AnimatePresence>
        {selectedReleaseIds.size > 0 && (
          <motion.div
            data-testid="release-floating-action-bar"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-divider)] shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 text-xs max-w-[95vw] overflow-x-auto"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--color-divider)] font-bold text-[var(--color-text)] shrink-0">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center text-[10px]">
                {selectedReleaseIds.size}
              </span>
              <span>Selected</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative inline-flex items-center">
                <select
                  onChange={e => { if (e.target.value) handleBatchSetStatus(e.target.value as Release['status']); }}
                  value=""
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold text-xs cursor-pointer bg-transparent outline-none"
                  aria-label="Set Status for selected releases"
                >
                  <option value="" disabled>Set Status…</option>
                  <option value="Planned">Mark Planned</option>
                  <option value="Active">Mark Active</option>
                  <option value="Released">Mark Released</option>
                </select>
              </div>

              <button
                onClick={handleBatchSyncDates}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Sync dates across selected releases"
              >
                <RefreshCw size={12} className="text-[var(--color-primary-hex)]" />
                <span>Sync Dates</span>
              </button>

              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete selected releases"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedReleaseIds(new Set())}
              className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] ml-1 cursor-pointer shrink-0"
              title="Deselect all (Escape)"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Release Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <span>{editingRelease ? 'Edit Release Version' : 'Create Release Version'}</span>
            <SectionHelpButton view="releases" section="Version Scope Gating" label="Release guide" size={13} />
          </span>
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="rounded-xl min-h-[38px] px-4 font-semibold">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRelease} className="rounded-xl min-h-[38px] px-4 font-semibold bg-[var(--color-primary-hex)] text-[var(--color-primary-text)]">
              {editingRelease ? 'Update Release' : 'Create Release'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1.5">
              Release Version Identifier *
            </label>
            <input 
              type="text"
              placeholder="e.g. v2.1.0 or Q3-Release"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-sm text-[var(--color-text)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1.5">
                Cycle Start Date
              </label>
              <input 
                type="date"
                value={formStartDate}
                onChange={e => setFormStartDate(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-mono text-xs font-semibold text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1.5">
                Target Launch Date
              </label>
              <input 
                type="date"
                value={formTargetDate}
                onChange={e => setFormTargetDate(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-mono text-xs font-semibold text-[var(--color-text)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1.5">
              Governance Status
            </label>
            <select
              value={formStatus}
              onChange={e => setFormStatus(e.target.value as ReleaseStatus)}
              className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-xs text-[var(--color-text)]"
            >
              {RELEASE_CYCLE.map(st => (
                <option key={st} value={st}>
                  {st === 'Planned' ? 'Planned (Future)' : st === 'Active' ? 'Active (In Development)' : 'Released (Shipped / Done)'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* ── Master-Detail Release Scope Peek Side Drawer (<SlideOverDrawer>) ── */}
      {selectedReleaseDetails && (
        <SlideOverDrawer
          isOpen={true}
          onClose={() => setSelectedReleaseDetails(null)}
          onNext={handleNextRelease}
          onPrevious={handlePreviousRelease}
          hasNext={drawerIndex < filteredReleases.length - 1}
          hasPrevious={drawerIndex > 0}
          widthClass="w-full sm:w-[500px] lg:w-[580px]"
          title={
            <div className="flex items-center gap-2">
              <Flag size={16} className="text-[var(--color-primary-hex)] shrink-0" />
              <span className="truncate">Release Scope: {selectedReleaseDetails.name}</span>
            </div>
          }
          subtitle={
            <div className="flex items-center gap-2 mt-0.5">
              <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-md border", getStatusBadge(selectedReleaseDetails.status))}>
                {selectedReleaseDetails.status}
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                Target Launch: {fmtDate(selectedReleaseDetails.date)}
              </span>
            </div>
          }
        >
          {(() => {
            const mappedTasks = tasks.filter(t => t.release === selectedReleaseDetails.name);
            const mappedDeliveries = deliveries.filter(d => d.releaseVersion === selectedReleaseDetails.name);
            const completedTasks = mappedTasks.filter(t => t.status === TaskStatus.COMPLETED);
            const progress = mappedTasks.length > 0 ? Math.round((completedTasks.length / mappedTasks.length) * 100) : 0;
            const daysLeft = selectedReleaseDetails.date ? daysDiff(selectedReleaseDetails.date) : null;
            const isOverdue = daysLeft !== null && daysLeft < 0 && selectedReleaseDetails.status !== 'Released';

            return (
              <div className="p-5 sm:p-6 space-y-6 text-xs custom-scroll">
                {/* 4-Metric Telemetry Bento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Completion</span>
                    <span className="text-base font-mono font-bold text-[var(--color-primary-hex)] mt-1 block">{progress}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Tasks</span>
                    <span className="text-base font-mono font-bold text-[var(--color-text)] mt-1 block">{mappedTasks.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Deliveries</span>
                    <span className="text-base font-mono font-bold text-emerald-600 mt-1 block">{mappedDeliveries.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Countdown</span>
                    <span className={clsx(
                      "text-base font-mono font-bold mt-1 block",
                      isOverdue ? "text-rose-500" : "text-[var(--color-text)]"
                    )}>
                      {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft}d` : daysLeft === 0 ? 'Today' : `${Math.abs(daysLeft)}d+`) : '-'}
                    </span>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-[var(--color-text-muted)]">Milestone Delivery Velocity</span>
                    <span className="font-mono font-bold text-[var(--color-primary-hex)]">{completedTasks.length} of {mappedTasks.length} Tasks Complete</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-divider)]">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-300",
                        progress === 100 ? "bg-emerald-500" : "bg-[var(--color-primary-hex)]"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Scope Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
                  <button
                    onClick={() => setScopeDrawerTab('all')}
                    className={clsx(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      scopeDrawerTab === 'all' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    All Scope ({mappedTasks.length + mappedDeliveries.length})
                  </button>
                  <button
                    onClick={() => setScopeDrawerTab('tasks')}
                    className={clsx(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      scopeDrawerTab === 'tasks' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    Tasks ({mappedTasks.length})
                  </button>
                  <button
                    onClick={() => setScopeDrawerTab('deliveries')}
                    className={clsx(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      scopeDrawerTab === 'deliveries' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                  >
                    Deliveries ({mappedDeliveries.length})
                  </button>
                </div>

                {/* Mapped Tasks List */}
                {(scopeDrawerTab === 'all' || scopeDrawerTab === 'tasks') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--color-text)]">
                        <ClipboardList size={14} className="text-[var(--color-primary-hex)]" />
                        <span>Mapped Tasks ({mappedTasks.length})</span>
                      </div>
                      <button
                        onClick={() => setView('tasks')}
                        className="text-[11px] font-bold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Open Matrix <ExternalLink size={11} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {mappedTasks.map(t => (
                        <div key={t.id} className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-divider)] flex items-center justify-between gap-3 text-xs hover:border-[var(--color-primary-hex)]/40 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-[var(--color-primary-hex)]">{t.id}</span>
                              <span className="font-semibold text-[var(--color-text)] truncate">{t.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                              <span>{t.assignee || 'Unassigned'}</span>
                              <span>•</span>
                              <span>Due: {fmtDate(t.dueDate)}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-muted)] block mb-1">
                              {t.status}
                            </span>
                            <span className="font-mono font-bold text-[var(--color-primary-hex)] text-xs">{t.progress}%</span>
                          </div>
                        </div>
                      ))}
                      {mappedTasks.length === 0 && (
                        <div className="p-4 rounded-xl bg-[var(--color-surface-2)] text-center text-xs text-[var(--color-text-muted)] italic">
                          No tasks currently mapped to this release version.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mapped Deliveries List */}
                {(scopeDrawerTab === 'all' || scopeDrawerTab === 'deliveries') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--color-text)]">
                        <Package size={14} className="text-emerald-500" />
                        <span>Mapped Deliveries ({mappedDeliveries.length})</span>
                      </div>
                      <button
                        onClick={() => setView('deliveries')}
                        className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Open Deliveries <ExternalLink size={11} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {mappedDeliveries.map(d => (
                        <div key={d.id} className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-divider)] flex items-center justify-between gap-3 text-xs hover:border-emerald-500/40 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-emerald-600">{d.almId || d.id}</span>
                              <span className="font-semibold text-[var(--color-text)] truncate">{d.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                              <span>Env: {d.environment || 'Production'}</span>
                              <span>•</span>
                              <span>Target: {fmtDate(d.targetDate)}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                            {d.status}
                          </span>
                        </div>
                      ))}
                      {mappedDeliveries.length === 0 && (
                        <div className="p-4 rounded-xl bg-[var(--color-surface-2)] text-center text-xs text-[var(--color-text-muted)] italic">
                          No deliveries currently mapped to this release version.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-[var(--color-divider)] flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncDatesToTasks(selectedReleaseDetails)}
                    className="font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} /> Sync Dates
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(selectedReleaseDetails)}
                      className="font-bold text-xs flex items-center gap-1.5"
                    >
                      <Edit3 size={13} /> Edit Specs
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReleaseDetails(null)}
                      className="font-semibold text-xs"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </SlideOverDrawer>
      )}
    </MotionPage>
  );
};

export default ReleaseRoadmap;
