import React, { useState, useMemo, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  BookOpen, 
  Trash2, 
  Edit2, 
  Plus, 
  Layers,
  ArrowRight,
  Clock,
  Zap,
  Info,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Copy,
  Search,
  AlertTriangle,
  RefreshCw,
  FileText,
  Sparkles,
  Check,
  X,
  PlusCircle,
  MinusCircle,
  Sliders
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { StepTemplate, Task, Subtask, TaskStatus } from '../../types';
import PageHeader from '../shared/PageHeader';
import { motion, AnimatePresence } from 'motion/react';

// ============================================================================
// SMART WORKFLOW SYNCHRONIZATION ALGORITHM (Parity with Enterprise ALM)
// ============================================================================
export interface SyncStep {
  name: string;
  effort: number;
}

export function smartSyncSubtasks(
  existingSubtasks: Subtask[],
  oldSteps: SyncStep[] | null,
  newSteps: SyncStep[],
  parentTask: Task,
  nextSubIdStart: number
): { syncedSubtasks: Subtask[]; nextSubId: number } {
  const updated: (Subtask | null)[] = new Array(newSteps.length).fill(null);
  const claimedExisting = new Set<number>();
  let currentSubId = nextSubIdStart;

  // 1. Exact Name Match (Highest priority)
  newSteps.forEach((nStep, nIdx) => {
    const nName = nStep.name.trim();
    const matchIdx = existingSubtasks.findIndex(
      (e, eIdx) => !claimedExisting.has(eIdx) && e.name.trim().toLowerCase() === nName.toLowerCase()
    );
    if (matchIdx > -1) {
      updated[nIdx] = {
        ...existingSubtasks[matchIdx],
        name: nStep.name,
        effort: nStep.effort || existingSubtasks[matchIdx].effort || 1
      };
      claimedExisting.add(matchIdx);
    }
  });

  // 2. Relative Position Matching for Remaining (Handles renames while preserving progress)
  newSteps.forEach((nStep, nIdx) => {
    if (updated[nIdx]) return;
    const oldStepName = oldSteps && oldSteps[nIdx] ? oldSteps[nIdx].name.trim().toLowerCase() : null;
    if (oldStepName) {
      const matchIdx = existingSubtasks.findIndex(
        (e, eIdx) => !claimedExisting.has(eIdx) && e.name.trim().toLowerCase() === oldStepName
      );
      if (matchIdx > -1) {
        updated[nIdx] = {
          ...existingSubtasks[matchIdx],
          name: nStep.name,
          effort: nStep.effort || 1
        };
        claimedExisting.add(matchIdx);
        return;
      }
    }
    const unclaimedIdx = existingSubtasks.findIndex((e, eIdx) => !claimedExisting.has(eIdx));
    if (unclaimedIdx > -1) {
      updated[nIdx] = {
        ...existingSubtasks[unclaimedIdx],
        name: nStep.name,
        effort: nStep.effort || 1
      };
      claimedExisting.add(unclaimedIdx);
    }
  });

  // 3. New Steps (that couldn't be matched)
  const taskIsDone = parentTask.status === TaskStatus.COMPLETED || parentTask.progress === 100;
  newSteps.forEach((nStep, nIdx) => {
    if (!updated[nIdx]) {
      const subId = 'ST-' + String(currentSubId++).padStart(3, '0');
      updated[nIdx] = {
        id: subId,
        name: nStep.name,
        status: taskIsDone ? TaskStatus.COMPLETED : TaskStatus.NOT_STARTED,
        done: taskIsDone,
        progress: taskIsDone ? 100 : 0,
        effort: nStep.effort || 1,
        actDays: taskIsDone ? (nStep.effort || 1) : 0,
        type: 'step',
        category: parentTask.category,
        startDate: parentTask.startDate,
        dueDate: parentTask.dueDate,
        actCompletionDate: taskIsDone ? (parentTask.actCompletionDate || parentTask.dueDate || undefined) : undefined
      };
    }
  });

  return {
    syncedSubtasks: updated.filter((s): s is Subtask => s !== null),
    nextSubId: currentSubId
  };
}

// ============================================================================
// MAIN COMPONENT: STEP TEMPLATES & LIVE BLUEPRINT IMPACT ARCHITECT
// ============================================================================
const StepTemplates: React.FC = () => {
  const { state, updateProject } = useProject();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<StepTemplate | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'quickText'>('visual');
  const [quickText, setQuickText] = useState<string>('');
  const [confirmPropagation, setConfirmPropagation] = useState<boolean>(false);
  const [taskSearch, setTaskSearch] = useState<string>('');

  const templates = state.stepTemplates || [];
  const categories = state.dropdowns?.category || [
    'Feature', 'Server Module', 'GUI Screen', 'GUI Module', 'DevOps', 'Testing', 'Research', 'Documentation'
  ];

  const handleAddTemplate = () => {
    const defaultCat = categories[0] || 'Feature';
    const newTpl: StepTemplate = {
      name: 'New Technical Workflow',
      category: defaultCat,
      steps: [
        { name: 'Initial Requirement', effort: 1 },
        { name: 'Architecture & Design', effort: 2 },
        { name: 'Core Implementation', effort: 4 },
        { name: 'Quality Verification', effort: 2 }
      ]
    };
    setEditingIdx(null); // Indicates a brand new blueprint
    setEditForm(JSON.parse(JSON.stringify(newTpl)));
    setQuickText(newTpl.steps.map(s => `${s.name}:${s.effort}`).join('\n'));
    setConfirmPropagation(false);
    setEditorMode('visual');
  };

  const removeTemplate = (idx: number) => {
    const target = templates[idx];
    if (confirm(`Delete the "${target.name}" technical workflow blueprint?`)) {
      const updated = templates.filter((_, i) => i !== idx);
      updateProject({ stepTemplates: updated });
    }
  };

  const duplicateTemplate = (idx: number) => {
    const target = templates[idx];
    const cloned: StepTemplate = {
      ...JSON.parse(JSON.stringify(target)),
      name: `${target.name} (Copy)`
    };
    updateProject({ stepTemplates: [...templates, cloned] });
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    const formCopy = JSON.parse(JSON.stringify(templates[idx]));
    setEditForm(formCopy);
    setQuickText(formCopy.steps.map((s: any) => `${s.name}:${s.effort}`).join('\n'));
    setConfirmPropagation(false);
    setEditorMode('visual');
  };

  // Sync quick text when editForm.steps change in visual mode
  const syncToQuickText = (steps: { name: string; effort: number }[]) => {
    setQuickText(steps.map(s => `${s.name}:${s.effort}`).join('\n'));
  };

  // Step item handlers
  const addStep = () => {
    if (!editForm) return;
    const updated = [...editForm.steps, { name: 'New Phase', effort: 1 }];
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const removeStep = (sIdx: number) => {
    if (!editForm) return;
    if (editForm.steps.length <= 1) {
      alert('A workflow blueprint must contain at least one phase.');
      return;
    }
    const updated = editForm.steps.filter((_, i) => i !== sIdx);
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const updateStep = (sIdx: number, field: 'name' | 'effort', val: any) => {
    if (!editForm) return;
    const updated = [...editForm.steps];
    updated[sIdx] = { ...updated[sIdx], [field]: val };
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const moveStep = (sIdx: number, direction: 'up' | 'down') => {
    if (!editForm) return;
    const targetIdx = direction === 'up' ? sIdx - 1 : sIdx + 1;
    if (targetIdx < 0 || targetIdx >= editForm.steps.length) return;
    const updated = [...editForm.steps];
    const temp = updated[sIdx];
    updated[sIdx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const cloneStep = (sIdx: number) => {
    if (!editForm) return;
    const updated = [...editForm.steps];
    const source = updated[sIdx];
    updated.splice(sIdx + 1, 0, { name: `${source.name} (Next)`, effort: source.effort });
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  // Handle Quick Bulk Text change
  const handleQuickTextChange = (text: string) => {
    setQuickText(text);
    if (!editForm) return;
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const parsed = lines.map(line => {
      const parts = line.split(':');
      const name = parts[0]?.trim() || 'New Phase';
      const effort = parseFloat(parts[1]) || 1;
      return { name, effort: Math.max(0.5, effort) };
    });
    setEditForm({
      ...editForm,
      steps: parsed.length > 0 ? parsed : [{ name: 'Phase 1', effort: 1 }]
    });
  };

  // ==========================================================================
  // REAL-TIME AUTO COMPUTED IMPACT ENGINE
  // ==========================================================================
  const impact = useMemo(() => {
    if (!editForm) return null;

    const targetCategory = editForm.category;
    const tasks = state.tasks.filter(t => {
      if (targetCategory === 'GUI Screen') {
        return (
          t.category === 'GUI Screen' ||
          (t.subtasks && t.subtasks.some(st => st.type === 'screen')) ||
          (t.guiScreens && t.guiScreens.length > 0)
        );
      }
      return t.category === targetCategory;
    });

    const oldSteps = editingIdx !== null && templates[editingIdx] ? templates[editingIdx].steps : [];
    const newSteps = editForm.steps || [];

    let added = 0;
    let renamed = 0;
    let removed = 0;
    const claimedOld = new Set<number>();
    const claimedNew = new Set<number>();

    // 1. Exact name match
    newSteps.forEach((ns, ni) => {
      const matchIdx = oldSteps.findIndex(
        (os, oi) => !claimedOld.has(oi) && os.name.trim().toLowerCase() === ns.name.trim().toLowerCase()
      );
      if (matchIdx > -1) {
        claimedOld.add(matchIdx);
        claimedNew.add(ni);
      }
    });

    // 2. Relative position matching for remaining
    if (oldSteps.length > 0) {
      newSteps.forEach((ns, ni) => {
        if (claimedNew.has(ni)) return;
        if (ni < oldSteps.length && !claimedOld.has(ni)) {
          renamed++;
          claimedOld.add(ni);
          claimedNew.add(ni);
        }
      });
    }

    added = newSteps.length - claimedNew.size;
    removed = oldSteps.length - claimedOld.size;

    const oldTotalEffort = oldSteps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
    const newTotalEffort = newSteps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
    const effortDelta = newTotalEffort - oldTotalEffort;

    return {
      affectedTasks: tasks,
      taskCount: tasks.length,
      stepDiff: added + renamed + removed,
      added,
      renamed,
      removed,
      oldTotalEffort,
      newTotalEffort,
      effortDelta,
      hasStructuralChange: added > 0 || renamed > 0 || removed > 0,
      hasEffortChange: effortDelta !== 0
    };
  }, [editForm, editingIdx, templates, state.tasks]);

  // Execute Save and optional propagation
  const handleFinalize = (propagate: boolean) => {
    if (!editForm) return;
    if (!editForm.name.trim()) {
      alert('Blueprint name is required');
      return;
    }
    if (editForm.steps.length === 0) {
      alert('At least one phase is required in the workflow sequence');
      return;
    }

    let updatedTemplates: StepTemplate[];
    if (editingIdx !== null) {
      updatedTemplates = [...templates];
      updatedTemplates[editingIdx] = editForm;
    } else {
      updatedTemplates = [...templates, editForm];
    }

    let updatedTasks = state.tasks;
    let nextSubId = state.nextSubId || 100;
    const oldSteps = editingIdx !== null && templates[editingIdx] ? templates[editingIdx].steps : [];

    if (propagate && impact && impact.taskCount > 0) {
      updatedTasks = state.tasks.map(task => {
        const isAffected = 
          task.category === editForm.category ||
          (editForm.category === 'GUI Screen' && (
            (task.subtasks && task.subtasks.some(st => st.type === 'screen')) ||
            (task.guiScreens && task.guiScreens.length > 0)
          ));
        if (!isAffected) return task;

        const existingSubtasks = task.subtasks || [];
        const { syncedSubtasks, nextSubId: newSubId } = smartSyncSubtasks(
          existingSubtasks,
          oldSteps,
          editForm.steps,
          task,
          nextSubId
        );
        nextSubId = newSubId;

        const taskIsDone = task.status === TaskStatus.COMPLETED || task.progress === 100;
        const totalEffort = syncedSubtasks.reduce((sum, st) => sum + (st.effort || 0), 0);
        const doneCount = syncedSubtasks.filter(st => st.done || st.status === TaskStatus.COMPLETED).length;
        const progress = syncedSubtasks.length ? Math.round((doneCount / syncedSubtasks.length) * 100) : task.progress;

        return {
          ...task,
          subtasks: syncedSubtasks,
          estDays: totalEffort > 0 ? totalEffort : task.estDays,
          progress: taskIsDone ? 100 : progress,
          updatedAt: new Date().toISOString()
        };
      });
    }

    const logEntry = {
      ts: new Date().toISOString(),
      action: editingIdx !== null ? 'Update Blueprint' : 'Create Blueprint',
      taskId: '',
      taskName: editForm.name,
      field: 'workflow',
      oldVal: editingIdx !== null && templates[editingIdx] ? `${templates[editingIdx].steps.length} steps` : 'New',
      newVal: `${editForm.steps.length} steps`,
      comment: propagate && impact && impact.taskCount > 0
        ? `Propagated blueprint "${editForm.name}" to ${impact.taskCount} tasks in category "${editForm.category}".`
        : `Saved blueprint "${editForm.name}" for category "${editForm.category}".`,
      module: 'Architect',
      assignee: 'Admin'
    };

    updateProject({
      stepTemplates: updatedTemplates,
      tasks: updatedTasks,
      nextSubId,
      log: [...(state.log || []), logEntry]
    });

    setEditingIdx(null);
    setEditForm(null);
    setConfirmPropagation(false);
  };

  const filteredAffectedTasks = useMemo(() => {
    if (!impact) return [];
    if (!taskSearch.trim()) return impact.affectedTasks;
    const q = taskSearch.toLowerCase();
    return impact.affectedTasks.filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (t.module && t.module.toLowerCase().includes(q))
    );
  }, [impact, taskSearch]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={BookOpen}
        title="Step Blueprints"
        subtitle={`${templates.length} Active Templates • Automated technical workflow sequences with real-time impact propagation`}
        actions={
          <Button variant="primary" size="sm" onClick={handleAddTemplate} className="h-9 px-4 shadow-sm">
            <Plus size={16} className="mr-1.5" /> New Blueprint
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {templates.map((tpl, i) => {
              const totalEffort = tpl.steps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
              const matchingTasks = state.tasks.filter(t => 
                t.category === tpl.category || (tpl.category === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))
              );
              
              return (
                <motion.div 
                  key={tpl.name || i} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
                  onClick={() => startEdit(i)}
                  className="card glass p-6 flex flex-col group hover:border-[var(--color-primary-hex)]/40 hover:shadow-lg transition-all duration-200 cursor-pointer rounded-2xl relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                      <Zap size={20} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)]" 
                        title="Duplicate Blueprint"
                        onClick={(e) => { e.stopPropagation(); duplicateTemplate(i); }}
                      >
                        <Copy size={13} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)]" 
                        title="Edit Blueprint"
                        onClick={(e) => { e.stopPropagation(); startEdit(i); }}
                      >
                        <Edit2 size={13} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10" 
                        title="Delete Blueprint"
                        onClick={(e) => { e.stopPropagation(); removeTemplate(i); }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-[var(--color-text)] leading-tight truncate group-hover:text-[var(--color-primary-hex)] transition-colors">
                        {tpl.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">
                        {tpl.category} mapping
                      </span>
                      <span className="text-[11px] font-medium text-[var(--color-text-faint)]">
                        {totalEffort}d effort
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {matchingTasks.length} tasks linked
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 bg-[var(--color-surface-offset)]/40 rounded-xl p-3.5 border border-[var(--color-divider)] border-dashed">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] mb-2.5 flex items-center justify-between">
                      <span>Workflow Phases</span>
                      <span>{tpl.steps.length} Steps</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll pr-1">
                      {(tpl.steps || []).map((st, si) => (
                        <div key={si} className="flex items-center justify-between text-xs py-0.5 group/step">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full bg-[var(--color-surface-2)] text-[9px] font-bold text-[var(--color-text-muted)] flex items-center justify-center shrink-0 border border-[var(--color-divider)]">
                              {si + 1}
                            </span>
                            <span className="font-medium text-[var(--color-text-muted)] group-hover/step:text-[var(--color-text)] transition-colors truncate">
                              {st.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 text-[11px] font-mono font-semibold text-[var(--color-text-faint)]">
                            <Clock size={10} />
                            {st.effort}d
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--color-divider)] flex items-center justify-between text-xs text-[var(--color-text-faint)]">
                    <span className="flex items-center gap-1 font-medium">
                      <Zap size={11} className="text-emerald-500" /> Auto-sync enabled
                    </span>
                    <span className="font-semibold text-[var(--color-primary-hex)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                      Configure <ArrowRight size={12} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {templates.length === 0 && (
            <div className="col-span-full py-28 bg-[var(--color-surface-offset)]/30 rounded-3xl border-2 border-dashed border-[var(--color-divider)] flex flex-col items-center justify-center text-[var(--color-text-faint)] text-center px-12">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <BookOpen size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)]">No Technical Blueprints</h3>
              <p className="text-xs max-w-sm mt-1.5 text-[var(--color-text-muted)] leading-relaxed">
                Define standardized operational step templates for common tasks to automate checklist population and effort estimation.
              </p>
              <Button variant="primary" className="mt-6 rounded-xl font-bold px-6" onClick={handleAddTemplate}>
                Create Initial Blueprint
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* HIGH-END EDIT BLUEPRINT MODAL WITH AUTO-COMPUTED LIVE IMPACT ANALYSIS */}
      {/* ===================================================================== */}
      {editForm && impact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[var(--color-surface)] w-full max-w-5xl rounded-3xl shadow-2xl border border-[var(--color-divider)] overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)]">
                      {editingIdx !== null ? 'Edit Workflow Blueprint' : 'Create New Blueprint'}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Live Telemetry
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    System automatically computes live blast radius and task impact on every change.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] font-medium">
                  <span className="font-bold text-[var(--color-text)]">{editForm.steps.length}</span> Phases
                  <span className="text-[var(--color-divider)]">•</span>
                  <span className="font-bold text-[var(--color-text)]">{impact.newTotalEffort}d</span> Total
                </div>
                <button 
                  onClick={() => { setEditForm(null); setConfirmPropagation(false); }}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Main Body (2-Column Grid) */}
            <div className="flex-1 overflow-y-auto custom-scroll p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ───────────────────────────────────────────────────────────── */}
                {/* LEFT COLUMN: BLUEPRINT IDENTITY & SEQUENCE BUILDER (7 Cols)  */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Blueprint Meta Card */}
                  <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] mb-1.5 block">
                          Blueprint Name
                        </label>
                        <input 
                          type="text"
                          className="w-full h-10 px-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors shadow-2xs"
                          placeholder="e.g. Standard Feature Dev Flow"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] mb-1.5 block">
                          Category Mapping
                        </label>
                        <select 
                          className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors shadow-2xs cursor-pointer"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          {categories.map(cat => {
                            const count = state.tasks.filter(t => 
                              t.category === cat || (cat === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))
                            ).length;
                            return (
                              <option key={cat} value={cat}>
                                {cat} ({count} active {count === 1 ? 'task' : 'tasks'})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Phase Sequence Editor Container */}
                  <div className="p-4.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-divider)]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                          Phase Sequence
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--color-text-faint)]">
                          ({editForm.steps.length} {editForm.steps.length === 1 ? 'step' : 'steps'})
                        </span>
                      </div>

                      {/* Mode Switcher */}
                      <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-divider)] text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setEditorMode('visual')}
                          className={clsx(
                            "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                            editorMode === 'visual'
                              ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                          )}
                        >
                          <Sliders size={12} /> Visual
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('quickText')}
                          className={clsx(
                            "px-2.5 py-1 rounded-md transition-all flex items-center gap-1",
                            editorMode === 'quickText'
                              ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                          )}
                        >
                          <FileText size={12} /> Quick Text
                        </button>
                      </div>
                    </div>

                    {/* Visual Editor Mode */}
                    {editorMode === 'visual' ? (
                      <div className="space-y-2.5">
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll pr-1">
                          {editForm.steps.map((st, si) => (
                            <div 
                              key={si}
                              className="flex items-center gap-2 p-2.5 bg-[var(--color-surface-2)]/60 rounded-xl border border-[var(--color-divider)] group/step hover:border-[var(--color-primary-hex)]/30 transition-colors"
                            >
                              {/* Step Index Badge */}
                              <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] text-[11px] font-bold text-[var(--color-text-muted)] flex items-center justify-center border border-[var(--color-divider)] shrink-0 shadow-2xs">
                                #{si + 1}
                              </div>

                              {/* Step Name Input */}
                              <input 
                                type="text"
                                className="flex-1 h-8 px-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-medium text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)]"
                                placeholder="Phase title..."
                                value={st.name}
                                onChange={(e) => updateStep(si, 'name', e.target.value)}
                              />

                              {/* Effort Input & Stepper */}
                              <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg px-2 h-8 shrink-0">
                                <Clock size={11} className="text-[var(--color-text-faint)]" />
                                <input 
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  className="w-12 text-center text-xs font-bold bg-transparent outline-none text-[var(--color-text)]"
                                  value={st.effort}
                                  onChange={(e) => updateStep(si, 'effort', parseFloat(e.target.value) || 0.5)}
                                />
                                <span className="text-[10px] font-semibold text-[var(--color-text-faint)]">days</span>
                              </div>

                              {/* Reorder Buttons */}
                              <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover/step:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  disabled={si === 0}
                                  onClick={() => moveStep(si, 'up')}
                                  title="Move up"
                                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  disabled={si === editForm.steps.length - 1}
                                  onClick={() => moveStep(si, 'down')}
                                  title="Move down"
                                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cloneStep(si)}
                                  title="Duplicate phase"
                                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                                >
                                  <Copy size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeStep(si)}
                                  title="Delete phase"
                                  className="p-1 rounded text-rose-500 hover:bg-rose-500/10 ml-0.5"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={addStep} 
                          className="w-full h-9 border border-dashed border-[var(--color-divider)] rounded-xl text-xs font-bold text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)]"
                        >
                          <Plus size={14} className="mr-1" /> Add Workflow Phase
                        </Button>
                      </div>
                    ) : (
                      /* Quick Text Editor Mode */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-faint)] px-1">
                          <span>SYNTAX: NAME:EFFORT (ONE PER LINE)</span>
                          <span>Auto-parses on keystroke</span>
                        </div>
                        <textarea 
                          rows={8}
                          value={quickText}
                          onChange={(e) => handleQuickTextChange(e.target.value)}
                          placeholder="Requirement Analysis:1&#10;Architecture Blueprint:2&#10;Backend Implementation:4&#10;Unit & Integration Test:2&#10;Deployment & Sign-off:1"
                          className="w-full p-3 font-mono text-xs bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] custom-scroll leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* RIGHT COLUMN: AUTO-COMPUTED LIVE IMPACT COCKPIT (5 Cols)     */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="p-4.5 rounded-2xl bg-[var(--color-surface-2)]/50 border border-[var(--color-divider)] space-y-4">
                    
                    {/* Header with Live Indicator */}
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-divider)]">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                          Impact Analysis
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--color-text-faint)]">
                        Target: {editForm.category}
                      </span>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-center shadow-2xs">
                        <div className="text-lg font-black text-[var(--color-text)]">
                          {impact.taskCount}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--color-text-faint)] truncate">
                          Tasks Impacted
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-center shadow-2xs">
                        <div className="text-lg font-black text-[var(--color-text)]">
                          {impact.stepDiff}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--color-text-faint)] truncate">
                          Step Changes
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-center shadow-2xs">
                        <div className={clsx("text-lg font-black", impact.effortDelta > 0 ? "text-amber-500" : (impact.effortDelta < 0 ? "text-emerald-500" : "text-[var(--color-text)]"))}>
                          {impact.effortDelta > 0 ? `+${impact.effortDelta}d` : `${impact.effortDelta}d`}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--color-text-faint)] truncate">
                          Effort Delta
                        </div>
                      </div>
                    </div>

                    {/* Structural Delta Feed */}
                    <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-2 text-xs">
                      {impact.added > 0 && (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          <PlusCircle size={14} className="shrink-0" />
                          <span>{impact.added} new {impact.added === 1 ? 'phase' : 'phases'} will be added to workflows</span>
                        </div>
                      )}
                      {impact.renamed > 0 && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                          <RefreshCw size={13} className="shrink-0" />
                          <span>{impact.renamed} {impact.renamed === 1 ? 'phase' : 'phases'} renamed (progress preserved)</span>
                        </div>
                      )}
                      {impact.removed > 0 && (
                        <div className="flex items-center gap-2 text-rose-500 font-medium">
                          <MinusCircle size={14} className="shrink-0" />
                          <span>{impact.removed} {impact.removed === 1 ? 'phase' : 'phases'} will be removed from workflow</span>
                        </div>
                      )}
                      {!impact.hasStructuralChange && (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check size={14} className="shrink-0" />
                          <span>
                            {impact.hasEffortChange
                              ? `Effort adjustments (${impact.oldTotalEffort}d → ${impact.newTotalEffort}d), structural steps remain aligned`
                              : 'Workflow phases identical to current blueprint version'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Affected Tasks Directory */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--color-text-muted)]">
                          Affected Tasks Directory ({impact.taskCount})
                        </span>
                        {impact.taskCount > 3 && (
                          <div className="relative w-28">
                            <input 
                              type="text"
                              placeholder="Filter..."
                              className="w-full h-6 px-2 text-[10px] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded outline-none text-[var(--color-text)]"
                              value={taskSearch}
                              onChange={(e) => setTaskSearch(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto custom-scroll space-y-1.5 pr-1">
                        {filteredAffectedTasks.map(t => {
                          const subCount = t.subtasks?.length || 0;
                          const doneSubs = (t.subtasks || []).filter(s => s.done || s.status === TaskStatus.COMPLETED).length;
                          return (
                            <div 
                              key={t.id}
                              className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/30 transition-colors text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)] shrink-0">
                                    {t.id}
                                  </span>
                                  <span className="font-semibold text-[var(--color-text)] truncate" title={t.name}>
                                    {t.name}
                                  </span>
                                </div>
                                <span className={clsx(
                                  "text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0",
                                  t.status === TaskStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                  t.status === TaskStatus.IN_PROGRESS ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                  t.status === TaskStatus.BLOCKED ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-[var(--color-text-muted)]"
                                )}>
                                  {t.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-faint)]">
                                <span>{t.module || 'General'}</span>
                                <div className="flex items-center gap-2">
                                  <span>{doneSubs}/{subCount} phases</span>
                                  <span className="font-semibold text-[var(--color-text-muted)]">{t.progress}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {impact.taskCount === 0 && (
                          <div className="p-4 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-xs text-[var(--color-text-faint)]">
                            No active tasks found matching category &quot;{editForm.category}&quot;. Changes will apply to future tasks.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer (with Safe Propagation Confirmation) */}
            <div className="px-6 py-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex flex-col gap-3">
              {confirmPropagation ? (
                /* Confirmation View */
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-98 duration-150">
                  <div className="flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                    <span>
                      Propagate changes to <strong>{impact.taskCount} tasks</strong> in &quot;{editForm.category}&quot;? Progress will be safely preserved for matching phases.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setConfirmPropagation(false)}
                      className="text-xs"
                    >
                      Back
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleFinalize(false)}
                      className="text-xs"
                      title="Update template definition without touching existing tasks"
                    >
                      Save Blueprint Only
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleFinalize(true)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <Zap size={13} /> Propagate to {impact.taskCount} Tasks
                    </Button>
                  </div>
                </div>
              ) : (
                /* Standard Footer */
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                    <Sparkles size={13} className="text-emerald-500" />
                    <span>
                      {impact.taskCount > 0 
                        ? `${impact.taskCount} tasks currently mapped to this blueprint` 
                        : 'No existing tasks affected by this blueprint'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <Button 
                      variant="ghost" 
                      onClick={() => { setEditForm(null); setConfirmPropagation(false); }}
                      className="h-10 px-4 text-xs font-semibold"
                    >
                      Cancel
                    </Button>

                    {impact.taskCount > 0 ? (
                      <Button 
                        variant="primary" 
                        onClick={() => setConfirmPropagation(true)}
                        className="h-10 px-5 text-xs font-bold bg-[var(--color-primary-hex)] text-white shadow-sm flex items-center gap-1.5"
                      >
                        <Zap size={14} /> Review & Save Blueprint
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        onClick={() => handleFinalize(false)}
                        className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-sm flex items-center gap-1.5"
                      >
                        <Check size={14} /> Save Blueprint
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StepTemplates;
