import React, { useState, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, TaskStatus, TaskPriority } from '../../types';
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
  Plus
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string | null;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, taskId }) => {
  const { state, createTask, updateTask } = useProject();
  const [formData, setFormData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (taskId) {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) setFormData(task);
    } else {
      setFormData({
        name: '',
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        progress: 0,
        moduleType: 'Other',
        module: 'General'
      });
    }
  }, [taskId, state.tasks, isOpen]);

  const handleSave = () => {
    if (taskId) {
      updateTask(taskId, formData);
    } else {
      createTask(formData);
    }
    onClose();
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

        <div className="grid grid-cols-2 gap-6">
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

        <div className="grid grid-cols-2 gap-6">
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

        <div className="grid grid-cols-3 gap-4">
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
              className="w-full px-4 py-2 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl outline-none text-xs"
              value={formData.estHours || 0}
              onChange={e => setFormData({ ...formData, estHours: parseFloat(e.target.value) })}
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

        <div className="space-y-1.5">
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
