import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Baseline, TaskStatus } from '../../types';
import { fmtDate, todayStr, daysDiff } from '../../utils/projectUtils';
import { 
  Camera, 
  Trash2, 
  RotateCcw, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Layers,
  Search,
  Eye,
  X,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import SectionHelpButton from '../shared/SectionHelpButton';
import DataTable, { ColumnDef, DensityMode } from '../shared/DataTable';
import { usePagination } from '../shared/TablePagination';
import { toast } from '../../utils/toast';
import clsx from 'clsx';

export interface BaselineComparisonRow {
  taskId: string;
  taskName: string;
  baselineDueDate: string;
  currentDueDate: string;
  varianceDays: number;
  baselineEffort: number;
  currentStatus: string;
}

export const BaselineManager: React.FC = () => {
  const { state, updateProject, addLog, setView } = useProject();
  const { baselines = [], tasks = [] } = state;

  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [baselineName, setBaselineName] = useState('');
  const [baselineDesc, setBaselineDesc] = useState('');
  const [selectedBaseline, setSelectedBaseline] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [tableDensity, setTableDensity] = useState<DensityMode>('compact');
  const [sortField, setSortField] = useState<string>('varianceDays');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'primary';
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
    confirmLabel: 'Confirm'
  });

  React.useEffect(() => {
    const handleOpen = () => setIsCaptureModalOpen(true);
    window.addEventListener('open-capture-baseline-modal', handleOpen);
    return () => window.removeEventListener('open-capture-baseline-modal', handleOpen);
  }, []);

  // Group baselines by snapshot ID
  const groupedSnapshots = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; desc: string; date: string; items: Baseline[] }>();
    baselines.forEach(b => {
      if (!map.has(b.id)) {
        map.set(b.id, {
          id: b.id,
          name: b.name,
          desc: b.desc,
          date: b.snapshotDate || todayStr(),
          items: []
        });
      }
      map.get(b.id)!.items.push(b);
    });
    return Array.from(map.values());
  }, [baselines]);

  const handleCaptureSnapshot = () => {
    if (!baselineName.trim()) {
      toast.warning('Baseline name is required before capturing snapshot.');
      return;
    }

    const nextId = 'BSLN-' + String(state.nextBaselineId || 1).padStart(3, '0');
    const snapDate = todayStr();

    const newBaselines: Baseline[] = tasks.map(t => {
      const bStartDate = t.startDate || snapDate;
      const bDueDate = t.dueDate || snapDate;
      const bEffort = t.estDays || 0;
      
      return {
        id: nextId,
        name: baselineName.trim(),
        desc: baselineDesc.trim(),
        taskId: t.id,
        taskName: t.name,
        baselineStartDate: bStartDate,
        baselineDueDate: bDueDate,
        baselineEffort: bEffort,
        actStartDate: t.status !== TaskStatus.NOT_STARTED ? (t.startDate || snapDate) : '',
        actDueDate: t.dueDate || snapDate,
        actEffort: t.actDays || bEffort,
        varianceDays: 0,
        slippageReason: '',
        snapshotDate: snapDate
      };
    });

    updateProject({
      baselines: [...baselines, ...newBaselines],
      nextBaselineId: (state.nextBaselineId || 1) + 1
    });

    addLog('Captured Baseline', nextId, baselineName.trim(), 'baselines', '', nextId, `Saved snapshot across ${tasks.length} tasks`);
    toast.success(`Baseline snapshot "${baselineName.trim()}" captured across ${tasks.length} tasks.`);
    setIsCaptureModalOpen(false);
    setBaselineName('');
    setBaselineDesc('');
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Baseline Snapshot',
      message: `Permanently delete baseline snapshot "${name}"? This will remove historical baseline variances for this snapshot point.`,
      variant: 'danger',
      confirmLabel: 'Delete Baseline',
      onConfirm: () => {
        updateProject({
          baselines: baselines.filter(b => b.id !== id)
        });
        addLog('Deleted Baseline', id, name, 'baselines', name, '', 'Baseline snapshot deleted');
        if (selectedBaseline === id) setSelectedBaseline(null);
        toast.info(`Baseline snapshot "${name}" deleted.`);
      }
    });
  };

  const handleRestoreSnapshot = (snapshotId: string, name: string) => {
    const snapshotItems = baselines.filter(b => b.id === snapshotId);
    if (!snapshotItems.length) return;

    setConfirmState({
      isOpen: true,
      title: 'Restore Project Baseline Schedules',
      message: `Restore schedule dates and estimated effort from "${name}" across all matching tasks? Current live schedules will be updated to baseline values.`,
      variant: 'primary',
      confirmLabel: 'Restore Baseline',
      onConfirm: () => {
        const taskMap = new Map(snapshotItems.map(b => [b.taskId, b]));
        const updatedTasks = tasks.map(t => {
          const b = taskMap.get(t.id);
          if (b) {
            return {
              ...t,
              startDate: b.baselineStartDate || t.startDate,
              dueDate: b.baselineDueDate || t.dueDate,
              estDays: b.baselineEffort || t.estDays,
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });

        updateProject({ tasks: updatedTasks });
        addLog('Restored Baseline', snapshotId, name, 'tasks', '', snapshotId, `Aligned live tasks to baseline snapshot dates`);
        toast.success(`Tasks successfully aligned to baseline "${name}".`);
      }
    });
  };

  const activeSnapshotDetails = groupedSnapshots.find(s => s.id === selectedBaseline);

  const comparisonRows = useMemo<BaselineComparisonRow[]>(() => {
    if (!activeSnapshotDetails) return [];
    return activeSnapshotDetails.items.map(item => {
      const currentTask = tasks.find(t => t.id === item.taskId);
      const curDue = currentTask?.dueDate || '';
      const diff = (curDue && item.baselineDueDate) 
        ? Math.round((new Date(curDue).getTime() - new Date(item.baselineDueDate).getTime()) / 864e5) 
        : 0;
      return {
        taskId: item.taskId,
        taskName: item.taskName,
        baselineDueDate: item.baselineDueDate,
        currentDueDate: curDue,
        varianceDays: diff,
        baselineEffort: item.baselineEffort,
        currentStatus: currentTask?.status || 'Unknown'
      };
    });
  }, [activeSnapshotDetails, tasks]);

  const filteredComparisonRows = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return comparisonRows;
    return comparisonRows.filter(r => 
      r.taskId.toLowerCase().includes(q) ||
      r.taskName.toLowerCase().includes(q) ||
      r.currentStatus.toLowerCase().includes(q)
    );
  }, [comparisonRows, tableSearch]);

  const sortedComparisonRows = useMemo(() => {
    return [...filteredComparisonRows].sort((a, b) => {
      let aVal: any = a[sortField as keyof BaselineComparisonRow];
      let bVal: any = b[sortField as keyof BaselineComparisonRow];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredComparisonRows, sortField, sortAsc]);

  const pagination = usePagination<BaselineComparisonRow>(sortedComparisonRows, 10, 'pp_page_size_baseline_comparison');

  const baselineColumns = useMemo<ColumnDef<BaselineComparisonRow>[]>(() => [
    {
      id: 'taskName',
      header: 'TASK IDENTIFIER & NAME',
      headerTitle: 'Task identifier and summary',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[var(--color-primary-hex)] shrink-0">{r.taskId}</span>
          <span className="font-semibold text-xs text-[var(--color-text)] truncate max-w-[280px]" title={r.taskName}>
            {r.taskName}
          </span>
        </div>
      )
    },
    {
      id: 'baselineDueDate',
      header: 'BASELINE TARGET',
      headerTitle: 'Original baseline target deadline',
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--color-text-muted)]">
          {fmtDate(r.baselineDueDate)}
        </span>
      )
    },
    {
      id: 'currentDueDate',
      header: 'CURRENT DUE DATE',
      headerTitle: 'Current active due date',
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-[var(--color-text)]">
          {fmtDate(r.currentDueDate)}
        </span>
      )
    },
    {
      id: 'varianceDays',
      header: 'SCHEDULE VARIANCE',
      headerTitle: 'Schedule slip or early completion variance',
      align: 'right',
      cell: (r) => {
        const diff = r.varianceDays;
        return (
          <div className="flex items-center justify-end">
            {diff > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                +{diff}d slip
              </span>
            ) : diff < 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {diff}d ahead
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">
                On track
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: 'baselineEffort',
      header: 'EFFORT',
      headerTitle: 'Estimated baseline effort in work days',
      align: 'right',
      cell: (r) => (
        <span className="font-mono text-xs text-[var(--color-text-muted)]">
          {r.baselineEffort}d
        </span>
      )
    },
    {
      id: 'currentStatus',
      header: 'STATUS',
      headerTitle: 'Current live task status',
      cell: (r) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-divider)]">
          {r.currentStatus}
        </span>
      )
    },
    {
      id: 'actions',
      header: '',
      headerTitle: 'Action shortcuts',
      align: 'right',
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setView('tasks');
          }}
          title="Open in Task Grid"
          className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <ExternalLink size={13} />
        </button>
      )
    }
  ], [setView]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)]">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-[var(--color-primary-hex)]" />
          <h3 className="text-base font-bold text-[var(--color-text)]">Project Performance Baselines</h3>
          <SectionHelpButton view="settings" section="Baseline Snapshot Management" label="Baselines guide" size={14} />
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsCaptureModalOpen(true)} className="h-9 px-4 rounded-xl font-bold">
          <Camera size={15} className="mr-1.5" /> Capture Baseline
        </Button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupedSnapshots.map(snap => {
          // Calculate drift metrics vs current live tasks
          let totalVarianceDays = 0;
          let driftedTasksCount = 0;

          snap.items.forEach(item => {
            const currentTask = tasks.find(t => t.id === item.taskId);
            if (currentTask && currentTask.dueDate && item.baselineDueDate) {
              const diff = Math.round((new Date(currentTask.dueDate).getTime() - new Date(item.baselineDueDate).getTime()) / 864e5);
              if (diff !== 0) {
                totalVarianceDays += diff;
                driftedTasksCount++;
              }
            }
          });

          const isSelected = selectedBaseline === snap.id;

          return (
            <div 
              key={snap.id}
              className={clsx(
                "p-5 rounded-2xl bg-[var(--color-surface)] border transition-colors duration-150 shadow-sm flex flex-col justify-between group",
                isSelected ? "border-[var(--color-primary-hex)] ring-2 ring-[var(--color-primary-highlight-hex)]" : "border-[var(--color-divider)] hover:border-[var(--color-text-faint)]"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-mono font-medium text-[var(--color-primary-hex)]">{snap.id}</span>
                    <h4 className="font-bold text-sm text-[var(--color-text)]">{snap.name}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleDeleteSnapshot(snap.id, snap.name)}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Snapshot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {snap.desc && (
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-3">
                    {snap.desc}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[var(--color-surface-2)] text-xs mb-3">
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-faint)] block">Captured on</span>
                    <span className="font-mono font-semibold text-[var(--color-text)]">{fmtDate(snap.date)}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--color-text-faint)] block">Tasks recorded</span>
                    <span className="font-mono font-semibold text-[var(--color-text)]">{snap.items.length} tasks</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-[var(--color-divider)] space-y-1 text-xs mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">Schedule drift:</span>
                    <span className={clsx("font-mono font-bold", totalVarianceDays > 0 ? "text-red-500" : totalVarianceDays < 0 ? "text-emerald-500" : "text-[var(--color-text-muted)]")}>
                      {totalVarianceDays > 0 ? `+${totalVarianceDays} days slip` : totalVarianceDays < 0 ? `${totalVarianceDays} days ahead` : 'Zero Drift'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[var(--color-text-faint)]">
                    <span>Impacted Tasks:</span>
                    <span>{driftedTasksCount} of {snap.items.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-divider)]">
                <button
                  onClick={() => handleRestoreSnapshot(snap.id, snap.name)}
                  className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Align Schedules
                </button>

                <button
                  onClick={() => setSelectedBaseline(isSelected ? null : snap.id)}
                  className="text-[11px] font-bold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1"
                >
                  <Eye size={12} /> {isSelected ? 'Hide Table' : 'Compare Drift'}
                </button>
              </div>
            </div>
          );
        })}

        {groupedSnapshots.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[var(--color-surface)] border border-dashed border-[var(--color-divider)] rounded-2xl">
            <Camera size={28} className="mx-auto text-[var(--color-text-faint)] mb-2 opacity-50" />
            <h4 className="text-xs font-bold text-[var(--color-text)]">No baseline snapshots captured</h4>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Capture a baseline before starting a delivery milestone to measure schedule variance.
            </p>
          </div>
        )}
      </div>

      {/* Baseline Comparison Table */}
      {activeSnapshotDetails && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--color-divider)] pb-4">
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[var(--color-text)] flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--color-primary-hex)]" />
                <span>Baseline Comparison Table: {activeSnapshotDetails.name}</span>
                <SectionHelpButton view="settings" section="Project Baselines" label="Baseline variance guide" size={13} />
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Comparing {activeSnapshotDetails.items.length} baseline milestones captured on {fmtDate(activeSnapshotDetails.date)} against current live task schedules.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <div className="relative w-full sm:w-56">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Filter baseline tasks..."
                  className="w-full h-8 pl-8 pr-7 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] shadow-2xs"
                />
                {tableSearch && (
                  <button 
                    onClick={() => setTableSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <Button variant="ghost" size="sm" onClick={() => setSelectedBaseline(null)} className="h-8 px-3 text-xs">
                Close
              </Button>
            </div>
          </div>

          <DataTable<BaselineComparisonRow>
            data={sortedComparisonRows}
            columns={baselineColumns}
            keyField="taskId"
            minWidth="w-full"
            density={tableDensity}
            sortField={sortField}
            sortAsc={sortAsc}
            onSort={(field) => {
              if (sortField === field) {
                setSortAsc(!sortAsc);
              } else {
                setSortField(field);
                setSortAsc(true);
              }
            }}
            showRowNumbers
            stickyFirstColumn
            pagination={pagination}
            itemLabel="baseline tasks"
            tableLabel="Baseline Schedule Comparison"
            onRowClick={(r) => setView('tasks')}
          />
        </motion.div>
      )}

      {/* Capture Modal (Integrated with Shared Accessible Modal) */}
      <Modal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <span>Capture Project Baseline Snapshot</span>
            <SectionHelpButton view="settings" section="Baseline Snapshot Management" label="Snapshot guide" size={13} />
          </span>
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCaptureModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCaptureSnapshot}>
              Save Baseline Snapshot
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          <div>
            <label className="text-xs font-medium text-[var(--color-text-faint)] block mb-1.5">
              Baseline Name *
            </label>
            <input 
              type="text"
              placeholder="e.g. Sprint 1 Commitment or Q3 Release Kickoff"
              value={baselineName}
              onChange={e => setBaselineName(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-sm text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-faint)] block mb-1.5">
              Description & Context
            </label>
            <textarea 
              placeholder="Why this snapshot was captured (e.g. Scope frozen after architecture sign-off)"
              value={baselineDesc}
              onChange={e => setBaselineDesc(e.target.value)}
              rows={3}
              className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-medium text-xs resize-none text-[var(--color-text)]"
            />
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
      />
    </div>
  );
};

export default BaselineManager;

