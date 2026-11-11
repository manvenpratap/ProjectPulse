import React, { useState, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { isBlocked } from '../../utils/projectUtils';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { 
  Type, 
  AlignLeft, 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  Activity, 
  Layers, 
  Flag, 
  Plus, 
  CheckSquare, 
  Trash2, 
  Zap, 
  List, 
  Lock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Subtask, StepTemplate } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskId }) => {
  const { state, createTask, updateTask, deleteTask, setView } = useProject();
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<{ id: string; name: string } | null>(null);

  const blocked = formData.id ? isBlocked(formData as Task, state.tasks) : false;
  const blockedBy = formData.dependsOn?.filter(id => {
    const t = state.tasks.find(x => x.id === id);
    return t && t.status !== TaskStatus.COMPLETED;
  }) || [];

  // Check for saved draft when creating new task (State 8: In-Flight Form Auto-Draft Preservation)
  useEffect(() => {
    if (!taskId && isOpen) {
      const savedDraft = localStorage.getItem('pp_draft_task');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.name) {
            setHasDraft(true);
          }
        } catch (e) {}
      }
    }
  }, [taskId, isOpen]);

  // Auto-save draft when editing uncommitted new task
  useEffect(() => {
    if (!taskId && isOpen && formData.name && formData.name.trim().length > 0) {
      localStorage.setItem('pp_draft_task', JSON.stringify(formData));
    }
  }, [formData, taskId, isOpen]);

  useEffect(() => {
    if (taskId) {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) setFormData({ ...task });
    } else {
      setCreatedReceipt(null);
      setFormData({
        name: '',
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        progress: 0,
        moduleType: 'Other',
        module: 'General',
        subtasks: []
      });
    }
  }, [taskId, state.tasks, isOpen]);

  const handleSave = () => {
    if (blocked && (formData.status === TaskStatus.IN_PROGRESS || formData.status === TaskStatus.COMPLETED || (formData.progress || 0) > 0)) {
      setError(`Cannot start or complete task while blocked by: ${blockedBy.join(', ')}`);
      return;
    }
    setError(null);

    if (taskId) {
      updateTask(taskId, formData);
      onClose();
    } else {
      const created = createTask(formData);
      localStorage.removeItem('pp_draft_task');
      setHasDraft(false);
      setCreatedReceipt({ id: created.id, name: created.name || 'Untitled Task' });
    }
  };

  const addSubtask = () => {
    const newSub: Subtask = {
      id: `SUB-${(formData.subtasks?.length || 0) + 1}`,
      name: 'New Phase',
      status: TaskStatus.NOT_STARTED,
      done: false,
      effort: 1,
      progress: 0,
      type: 'step'
    };
    const subs = [...(formData.subtasks || []), newSub];
    const totalEffort = subs.reduce((acc, s) => acc + (Number(s.effort) || 0), 0);
    setFormData({ ...formData, subtasks: subs, estDays: totalEffort });
  };

  const updateSubtask = (idx: number, field: keyof Subtask, val: any) => {
    const subs = [...(formData.subtasks || [])];
    subs[idx] = { ...subs[idx], [field]: val };
    
    // Auto-recalc progress if status/done changes
    if (field === 'status' || field === 'done') {
       if (val === TaskStatus.COMPLETED || val === true) {
         subs[idx].progress = 100;
         subs[idx].done = true;
       } else if (val === TaskStatus.NOT_STARTED) {
         subs[idx].progress = 0;
         subs[idx].done = false;
       }
    }

    // Calc total progress
    const totalProgress = Math.round(subs.reduce((acc, s) => acc + (s.progress || 0), 0) / (subs.length || 1));
    
    // Auto-recalc total effort (estDays)
    const totalEffort = subs.reduce((acc, s) => acc + (Number(s.effort) || 0), 0);
    
    setFormData({ ...formData, subtasks: subs, progress: totalProgress, estDays: totalEffort });
  };

  const removeSubtask = (idx: number) => {
    const subs = (formData.subtasks || []).filter((_, i) => i !== idx);
    const totalProgress = subs.length ? Math.round(subs.reduce((acc, s) => acc + (s.progress || 0), 0) / subs.length) : formData.progress;
    const totalEffort = subs.reduce((acc, s) => acc + (Number(s.effort) || 0), 0);
    setFormData({ ...formData, subtasks: subs, progress: totalProgress, estDays: totalEffort });
  };

  const applyTemplate = (tpl: StepTemplate) => {
    const subs: Subtask[] = tpl.steps.map((st, i) => ({
      id: `ST-${i+1}`,
      name: st.name,
      status: TaskStatus.NOT_STARTED,
      done: false,
      effort: st.effort,
      progress: 0,
      type: 'step'
    }));
    const totalEffort = subs.reduce((acc, s) => acc + (Number(s.effort) || 0), 0);
    setFormData({ ...formData, subtasks: subs, progress: 0, estDays: totalEffort });
    setShowTemplates(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setCreatedReceipt(null);
        onClose();
      }}
      title={createdReceipt ? "Task Created" : taskId ? `Edit Task: ${taskId}` : "New Project Task"}
      size={createdReceipt ? "md" : "lg"}
      footer={
        createdReceipt ? (
          <div className="flex justify-end w-full">
            <Button 
              variant="primary" 
              onClick={() => {
                setCreatedReceipt(null);
                onClose();
              }} 
              className="rounded-xl px-5"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="flex justify-between items-center w-full">
            {taskId ? (
              <Button 
                variant="ghost" 
                onClick={() => {
                  if (confirm('Permanently delete this task and all associated subtasks?')) {
                    deleteTask(taskId);
                    onClose();
                  }
                }} 
                className="text-red-500 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-2" /> Delete Task
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={!formData.name}>
                {taskId ? 'Apply Changes' : 'Create Task'}
              </Button>
            </div>
          </div>
        )
      }
    >
      {createdReceipt ? (
        <div className="py-4 px-1 flex flex-col items-center text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>

          <div className="space-y-1 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--color-surface-offset)] border border-[var(--color-divider)] font-mono text-xs text-[var(--color-text-muted)]">
              <span>Task ID:</span>
              <span className="font-bold text-[var(--color-text)]">{createdReceipt.id}</span>
            </div>
            <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
              {createdReceipt.name}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Entity successfully registered in workspace state and linked to schedule dependencies.
            </p>
          </div>

          <div className="w-full max-w-md border border-[var(--color-divider)] rounded-xl divide-y divide-[var(--color-divider)] bg-[var(--color-surface-2)]/50 text-left text-xs overflow-hidden">
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-[var(--color-text-muted)]">Target Module</span>
              <span className="font-semibold text-[var(--color-text)]">{formData.module || 'General'}</span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-[var(--color-text-muted)]">Priority</span>
              <span className="font-semibold text-[var(--color-text)]">{formData.priority || 'Medium'}</span>
            </div>
            <div className="p-2.5 flex justify-between items-center">
              <span className="text-[var(--color-text-muted)]">Initial Status</span>
              <span className="font-semibold text-[var(--color-text)]">{formData.status || 'Not Started'}</span>
            </div>
          </div>

          <div className="w-full max-w-md pt-2 space-y-2">
            <div className="text-[11px] font-semibold text-[var(--color-text-muted)] tracking-wider uppercase text-left">
              Recommended Next Actions
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreatedReceipt(null);
                  onClose();
                  setView('tasks');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-offset)] text-xs font-semibold text-[var(--color-text)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <List size={14} className="text-blue-500" />
                  View in Task Matrix
                </span>
                <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedReceipt(null);
                  onClose();
                  setView('capacity', false, 'schedule');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-offset)] text-xs font-semibold text-[var(--color-text)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-emerald-500" />
                  Plan in Capacity & Scheduler
                </span>
                <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedReceipt(null);
                  setFormData({
                    name: '',
                    status: TaskStatus.NOT_STARTED,
                    priority: TaskPriority.MEDIUM,
                    progress: 0,
                    moduleType: 'Other',
                    module: 'General',
                    subtasks: []
                  });
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-offset)] text-xs font-semibold text-[var(--color-text)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Plus size={14} className="text-purple-500" />
                  Create Another Task
                </span>
                <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        {blocked && (
          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
               <Lock size={20} className="text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900 leading-tight">Blocked Task</h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                This task has unmet dependencies. Resolve the following tasks to begin work: 
                <span className="font-mono font-bold ml-1">{blockedBy.join(', ')}</span>
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[11px] font-bold rounded-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full motion-safe:animate-pulse" />
            {error}
          </div>
        )}

        {hasDraft && !taskId && (
          <div className="p-3 rounded-xl bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/30 flex items-center justify-between text-xs text-[var(--color-primary-hex)]">
            <span>Unsaved draft restored from earlier session.</span>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  const d = localStorage.getItem('pp_draft_task');
                  if (d) setFormData(JSON.parse(d));
                  setHasDraft(false);
                }}
                className="font-bold underline cursor-pointer"
              >
                Restore
              </button>
              <button 
                type="button"
                onClick={() => {
                  localStorage.removeItem('pp_draft_task');
                  setHasDraft(false);
                }}
                className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
            <Type size={14} /> Task Title
          </label>
          <input 
            className="w-full px-4 py-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-base focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
            placeholder="e.g. Implement OAuth2 flow"
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
           <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <Activity size={14} /> Status
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            >
              {state.dropdowns.status.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <Flag size={14} /> Priority
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            >
              {state.dropdowns.priority.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <Layers size={14} /> Module
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              value={formData.module}
              onChange={e => setFormData({ ...formData, module: e.target.value })}
            >
              {state.dropdowns.module.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <User size={14} /> Assignee
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              value={formData.assignee || ''}
              onChange={e => setFormData({ ...formData, assignee: e.target.value })}
            >
              <option value="">Unassigned</option>
              {state.members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
           <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <Calendar size={14} /> Start Date
            </label>
            <input 
              type="date"
              className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              value={formData.startDate || ''}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <Calendar size={14} /> Due Date
            </label>
            <input 
              type="date"
              className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              value={formData.dueDate || ''}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
            {Boolean(formData.startDate && formData.dueDate && formData.dueDate < formData.startDate) && (
              <div className="flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 rounded-lg mt-1">
                <span className="font-medium">Precedes start</span>
                <button
                  type="button"
                  onClick={() => {
                    const start = new Date(formData.startDate!);
                    start.setDate(start.getDate() + 5);
                    setFormData({ ...formData, dueDate: start.toISOString().split('T')[0] });
                  }}
                  className="font-semibold underline hover:no-underline text-rose-700 dark:text-rose-300 ml-2 cursor-pointer"
                >
                  Snap +5d
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <Clock size={14} /> Est. Days
            </label>
            <input 
              type="number"
              step="0.25"
              className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              value={formData.estDays || 0}
              onChange={e => setFormData({ ...formData, estDays: parseFloat(e.target.value) })}
            />
            {Number(formData.estDays ?? 0) <= 0 && (
              <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2.5 py-1 rounded-lg mt-1">
                <span className="font-medium">Must be &gt; 0</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, estDays: 1 })}
                  className="font-semibold underline hover:no-underline text-amber-700 dark:text-amber-300 ml-2 cursor-pointer"
                >
                  Set 1d
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
            <Layers size={14} /> Dependencies (Blocked By)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.dependsOn?.map(depId => {
              const depTask = state.tasks.find(t => t.id === depId);
              return (
                <div key={depId} className="flex items-center gap-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg group">
                  <span className="text-[10px] font-mono font-bold text-amber-700">{depId}</span>
                  <span className="text-[11px] font-medium truncate max-w-[100px]">{depTask?.name}</span>
                  <button 
                    onClick={() => setFormData({
                      ...formData, 
                      dependsOn: formData.dependsOn?.filter(id => id !== depId)
                    })}
                    className="text-amber-400 hover:text-amber-600 active:scale-95 transition-transform"
                  >
                    <Plus size={12} className="rotate-45" />
                  </button>
                </div>
              );
            })}
          </div>
          <select 
            className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
            onChange={e => {
              if (e.target.value && !formData.dependsOn?.includes(e.target.value)) {
                setFormData({
                  ...formData,
                  dependsOn: [...(formData.dependsOn || []), e.target.value]
                });
              }
              e.target.value = '';
            }}
          >
            <option value="">+ Add Dependency…</option>
            {state.tasks
              .filter(t => t.id !== taskId && !formData.dependsOn?.includes(t.id))
              .map(t => <option key={t.id} value={t.id}>{t.id}: {t.name}</option>)
            }
          </select>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--color-divider)]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--color-primary-hex)] flex items-center gap-2">
              <CheckSquare size={14} /> Task Lifecycle Phases (Subtasks)
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-bold active:scale-[0.98]"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <Zap size={12} className="mr-1 text-amber-500" /> Apply Template
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-bold active:scale-[0.98]"
                onClick={addSubtask}
              >
                <Plus size={12} className="mr-1 text-emerald-500" /> Add Phase
              </Button>
            </div>
          </div>

          {showTemplates && (
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-2xl p-4 motion-safe:animate-in motion-safe:slide-in-from-top-2 duration-200">
               <div className="flex items-center justify-between mb-3 text-xs font-medium text-amber-500">
                  <span>Strategic Blueprints</span>
                  <button onClick={() => setShowTemplates(false)} className="hover:underline text-xs cursor-pointer">Close</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scroll p-1">
                  {(state.stepTemplates || []).map((tpl, i) => (
                    <button 
                      key={i} 
                      onClick={() => applyTemplate(tpl)}
                      className="text-left p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl hover:border-amber-500 transition-colors duration-150 active:scale-[0.98] group cursor-pointer"
                    >
                       <div className="font-bold text-xs text-[var(--color-text)] truncate">{tpl.name}</div>
                       <div className="text-[11px] font-medium text-[var(--color-text-muted)]">{tpl.steps.length} Phases • {tpl.category}</div>
                    </button>
                  ))}
                  {(state.stepTemplates || []).length === 0 && (
                    <div className="col-span-full text-center py-4 text-[10px] font-bold text-[var(--color-text-faint)]">No templates found in architect registry.</div>
                  )}
               </div>
            </div>
          )}

          <div className="space-y-2">
            {(formData.subtasks || []).map((sub, i) => (
              <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-2xl group/sub">
                <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)] flex items-center justify-center text-[10px] font-black text-[var(--color-primary-hex)] shrink-0">
                  {i+1}
                </div>
                <input 
                  className="flex-1 min-w-[140px] bg-transparent border-none text-sm font-bold outline-none text-[var(--color-text)] focus:text-[var(--color-primary-hex)]"
                  value={sub.name}
                  onChange={e => updateSubtask(i, 'name', e.target.value)}
                />
                <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg px-2 shrink-0">
                  <Clock size={10} className="text-[var(--color-text-faint)]" />
                  <input 
                    type="number"
                    step="0.25"
                    className="w-10 bg-transparent border-none text-[10px] font-bold outline-none text-center text-[var(--color-text)]"
                    value={sub.effort}
                    onChange={e => updateSubtask(i, 'effort', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[9px] font-bold text-[var(--color-text-faint)]">d</span>
                </div>
                <select 
                  className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg px-2 py-1 text-[10px] font-bold outline-none text-[var(--color-text)] transition-colors"
                  value={sub.status}
                  onChange={e => updateSubtask(i, 'status', e.target.value as TaskStatus)}
                >
                  {state.dropdowns.status.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="hidden sm:flex items-center gap-2 sm:group-hover/sub:hidden">
                   <div className="w-12 h-1 bg-[var(--color-surface)] rounded-full overflow-hidden border border-[var(--color-divider)]">
                      <div className="h-full bg-[var(--color-primary-hex)]" style={{ width: `${sub.progress}%` }} />
                   </div>
                </div>
                <button 
                   type="button"
                   onClick={() => removeSubtask(i)}
                   aria-label={`Remove subtask ${sub.name || i + 1}`}
                   className="flex sm:hidden sm:group-hover/sub:flex p-1.5 min-h-[34px] min-w-[34px] items-center justify-center rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                   <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(formData.subtasks || []).length === 0 && !showTemplates && (
               <div className="py-8 text-center border-2 border-dashed border-[var(--color-divider)] rounded-3xl">
                  <List size={24} className="mx-auto text-[var(--color-text-faint)] mb-2 opacity-20" />
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">Add phases manually or apply a blueprint template</p>
               </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
              <Activity size={14} /> Progress Oversight
            </label>
            <span className="text-[10px] font-black text-[var(--color-primary-hex)] px-2 py-0.5 bg-[var(--color-primary-highlight-hex)] rounded-full">{formData.progress}%</span>
          </div>
          <input 
            type="range"
            className="w-full h-2 bg-[var(--color-surface-offset)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-hex)]"
            min="0"
            max="100"
            value={formData.progress || 0}
            onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
          />
        </div>

        <div className="space-y-1.5 pt-4 border-t border-[var(--color-divider)]">
          <label className="text-xs font-medium text-[var(--color-text-muted)] flex items-center gap-2">
            <AlignLeft size={14} /> Task Description / Notes
          </label>
          <textarea 
            className="w-full px-4 py-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] text-sm h-32 resize-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
            placeholder="Add implementation details, blockers, or reference links…"
            value={formData.notes || ''}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>
      )}
    </Modal>
  );
};

export default TaskModal;
