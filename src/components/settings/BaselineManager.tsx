import React, { useState } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../shared/Button';
import clsx from 'clsx';

export const BaselineManager: React.FC = () => {
  const { state, updateProject, addLog } = useProject();
  const { baselines = [], tasks = [] } = state;

  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [baselineName, setBaselineName] = useState('');
  const [baselineDesc, setBaselineDesc] = useState('');
  const [selectedBaseline, setSelectedBaseline] = useState<string | null>(null);

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
      alert('Baseline name is required');
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
    setIsCaptureModalOpen(false);
    setBaselineName('');
    setBaselineDesc('');
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    if (confirm(`Permanently delete baseline snapshot "${name}"?`)) {
      updateProject({
        baselines: baselines.filter(b => b.id !== id)
      });
      addLog('Deleted Baseline', id, name, 'baselines', name, '', 'Baseline snapshot deleted');
      if (selectedBaseline === id) setSelectedBaseline(null);
    }
  };

  const handleRestoreSnapshot = (snapshotId: string, name: string) => {
    const snapshotItems = baselines.filter(b => b.id === snapshotId);
    if (!snapshotItems.length) return;

    if (confirm(`Restore schedule dates and estimated effort from "${name}" across all matching tasks? Current live schedules will be updated to baseline values.`)) {
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
      alert(`Tasks successfully aligned to baseline "${name}".`);
    }
  };

  const activeSnapshotDetails = groupedSnapshots.find(s => s.id === selectedBaseline);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)]">
        <div>
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-[var(--color-primary-hex)]" />
            <h3 className="text-base font-bold text-[var(--color-text)]">Project Performance Baselines</h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Capture immutable point-in-time snapshots of schedules, commitments, and effort estimates for drift analysis.
          </p>
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
          className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <TrendingUp size={16} className="text-[var(--color-primary-hex)]" />
                Baseline Comparison Table: {activeSnapshotDetails.name}
              </h4>
              <p className="text-xs text-[var(--color-text-muted)]">
                Comparing Point-in-Time Baseline against Live Execution Schedules.
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setSelectedBaseline(null)}>
              Close
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-divider)] text-xs font-semibold text-[var(--color-text-faint)]">
                  <th className="py-2.5 px-3">Task</th>
                  <th className="py-2.5 px-3">Baseline Target</th>
                  <th className="py-2.5 px-3">Current Due Date</th>
                  <th className="py-2.5 px-3">Variance</th>
                  <th className="py-2.5 px-3">Baseline Effort</th>
                  <th className="py-2.5 px-3">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {activeSnapshotDetails.items.map(item => {
                  const currentTask = tasks.find(t => t.id === item.taskId);
                  const curDue = currentTask?.dueDate || '';
                  const diff = (curDue && item.baselineDueDate) 
                    ? Math.round((new Date(curDue).getTime() - new Date(item.baselineDueDate).getTime()) / 864e5) 
                    : 0;

                  return (
                    <tr key={item.taskId} className="hover:bg-[var(--color-surface-2)] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-[var(--color-primary-hex)]">{item.taskId}</div>
                        <div className="font-semibold text-[var(--color-text)]">{item.taskName}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-text-muted)]">
                        {fmtDate(item.baselineDueDate)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-text)] font-semibold">
                        {fmtDate(curDue)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {diff > 0 ? (
                          <span className="text-red-500">+{diff}d slip</span>
                        ) : diff < 0 ? (
                          <span className="text-emerald-500">{diff}d ahead</span>
                        ) : (
                          <span className="text-[var(--color-text-faint)]">On track</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-text-muted)]">
                        {item.baselineEffort}d
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-surface-2)] text-[var(--color-text)]">
                          {currentTask?.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Capture Modal */}
      <AnimatePresence>
        {isCaptureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl border border-[var(--color-divider)] shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[var(--color-divider)] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[var(--color-text)] flex items-center gap-2">
                  <Camera size={16} className="text-[var(--color-primary-hex)]" />
                  Capture Project Baseline Snapshot
                </h3>
                <button onClick={() => setIsCaptureModalOpen(false)} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-faint)] block mb-1.5">
                    Baseline Name *
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Sprint 1 Commitment or Q3 Release Kickoff"
                    value={baselineName}
                    onChange={e => setBaselineName(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-sm"
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
                    className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-medium text-xs resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[11px] leading-relaxed">
                  <strong>Snapshot Scope:</strong> Captures schedule dates and effort estimates for all {tasks.length} tasks currently in the project.
                </div>
              </div>

              <div className="px-6 py-4 bg-[var(--color-surface-2)] border-t border-[var(--color-divider)] flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCaptureModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleCaptureSnapshot}>
                  Save Baseline Snapshot
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BaselineManager;

