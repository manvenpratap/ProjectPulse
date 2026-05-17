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
  Lock
} from 'lucide-react';
import { Subtask, StepTemplate } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskId }) => {
  const { state, createTask, updateTask } = useProject();
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = formData.id ? isBlocked(formData as Task, state.tasks) : false;
  const blockedBy = formData.dependsOn?.filter(id => {
    const t = state.tasks.find(x => x.id === id);
    return t && t.status !== TaskStatus.COMPLETED;
  }) || [];

  useEffect(() => {
    if (taskId) {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) setFormData({ ...task });
    } else {
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
    } else {
      createTask(formData);
    }
    onClose();
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
      onClose={onClose}
      title={taskId ? `Edit Task: ${taskId}` : "New Project Task"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!formData.name}>
            {taskId ? 'Apply Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {blocked && (
          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
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
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
            <Type size={14} /> Task Title
          </label>
          <input 
            className="w-full px-4 py-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-base"
            placeholder="e.g. Implement OAuth2 flow"
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
           <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Activity size={14} /> Status
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as TaskStatus })}
            >
              {state.dropdowns.status.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Flag size={14} /> Priority
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold"
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
            >
              {state.dropdowns.priority.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Layers size={14} /> Module
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold"
              value={formData.module}
              onChange={e => setFormData({ ...formData, module: e.target.value })}
            >
              {state.dropdowns.module.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <User size={14} /> Assignee
            </label>
            <select 
              className="w-full px-4 py-2.5 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-sm font-semibold"
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
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Calendar size={14} /> Start Date
            </label>
            <input 
              type="date"
              className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs"
              value={formData.startDate || ''}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Calendar size={14} /> Due Date
            </label>
            <input 
              type="date"
              className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs"
              value={formData.dueDate || ''}
              onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
             <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Clock size={14} /> Est. Days
            </label>
            <input 
              type="number"
              step="0.25"
              className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs"
              value={formData.estDays || 0}
              onChange={e => setFormData({ ...formData, estDays: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
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
                    className="text-amber-400 hover:text-amber-600"
                  >
                    <Plus size={12} className="rotate-45" />
                  </button>
                </div>
              );
            })}
          </div>
          <select 
            className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs"
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
            <option value="">+ Add Dependency...</option>
            {state.tasks
              .filter(t => t.id !== taskId && !formData.dependsOn?.includes(t.id))
              .map(t => <option key={t.id} value={t.id}>{t.id}: {t.name}</option>)
            }
          </select>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--color-divider)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
              <CheckSquare size={14} /> Task Lifecycle Phases (Subtasks)
            </h3>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-bold"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <Zap size={12} className="mr-1 text-amber-500" /> Apply Template
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[10px] font-bold"
                onClick={addSubtask}
              >
                <Plus size={12} className="mr-1 text-emerald-500" /> Add Phase
              </Button>
            </div>
          </div>

          {showTemplates && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
               <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-tight text-amber-800">
                  <span>Strategic Blueprints</span>
                  <button onClick={() => setShowTemplates(false)} className="hover:text-amber-600 underline text-xs">Close</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scroll p-1">
                  {(state.stepTemplates || []).map((tpl, i) => (
                    <button 
                      key={i} 
                      onClick={() => applyTemplate(tpl)}
                      className="text-left p-3 bg-white border border-amber-200 rounded-xl hover:border-amber-500 hover:shadow-md transition-all group"
                    >
                       <div className="font-bold text-xs text-amber-900 truncate">{tpl.name}</div>
                       <div className="text-[9px] font-black text-amber-600/60 uppercase">{tpl.steps.length} Phases • {tpl.category}</div>
                    </button>
                  ))}
                  {(state.stepTemplates || []).length === 0 && (
                    <div className="col-span-full text-center py-4 text-[10px] font-bold text-amber-600/40">No templates found in architect registry.</div>
                  )}
               </div>
            </div>
          )}

          <div className="space-y-2">
            {(formData.subtasks || []).map((sub, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-2xl group/sub">
                <div className="w-6 h-6 rounded-lg bg-white border border-[var(--color-divider)] flex items-center justify-center text-[10px] font-black text-indigo-500 shrink-0">
                  {i+1}
                </div>
                <input 
                  className="flex-1 bg-transparent border-none text-sm font-bold outline-none focus:text-indigo-600"
                  value={sub.name}
                  onChange={e => updateSubtask(i, 'name', e.target.value)}
                />
                <div className="flex items-center gap-1 bg-white border border-[var(--color-divider)] rounded-lg px-2 shrink-0">
                  <Clock size={10} className="text-slate-400" />
                  <input 
                    type="number"
                    step="0.25"
                    className="w-10 bg-transparent border-none text-[10px] font-bold outline-none text-center"
                    value={sub.effort}
                    onChange={e => updateSubtask(i, 'effort', parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[9px] font-bold text-slate-400">d</span>
                </div>
                <select 
                  className="bg-white border border-[var(--color-divider)] rounded-lg px-2 py-1 text-[10px] font-bold outline-none transition-colors"
                  value={sub.status}
                  onChange={e => updateSubtask(i, 'status', e.target.value as TaskStatus)}
                >
                  {state.dropdowns.status.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex items-center gap-2 group-hover/sub:hidden">
                   <div className="w-12 h-1 bg-white rounded-full overflow-hidden border border-[var(--color-divider)]">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${sub.progress}%` }} />
                   </div>
                </div>
                <button 
                   onClick={() => removeSubtask(i)}
                   className="hidden group-hover/sub:flex p-1.5 text-red-400 hover:text-red-600 transition-colors"
                >
                   <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(formData.subtasks || []).length === 0 && !showTemplates && (
               <div className="py-8 text-center border-2 border-dashed border-[var(--color-divider)] rounded-3xl">
                  <List size={24} className="mx-auto text-[var(--color-text-faint)] mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase text-[var(--color-text-faint)]">Add phases manually or apply a blueprint template</p>
               </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 pt-4">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Activity size={14} /> Progress Oversight
            </label>
            <span className="text-[10px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full">{formData.progress}%</span>
          </div>
          <input 
            type="range"
            className="w-full h-2 bg-[var(--color-surface-offset)] rounded-lg appearance-none cursor-pointer accent-indigo-600"
            min="0"
            max="100"
            value={formData.progress || 0}
            onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
          />
        </div>

        <div className="space-y-1.5 pt-4 border-t border-[var(--color-divider)]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
            <AlignLeft size={14} /> Task Description / Notes
          </label>
          <textarea 
            className="w-full px-4 py-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] text-sm h-32 resize-none"
            placeholder="Add implementation details, blockers, or reference links..."
            value={formData.notes || ''}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;
