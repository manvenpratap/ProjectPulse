import React, { useState, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Defect, DefectStatus, TaskPriority } from '../../types';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { 
  X, 
  Save, 
  Trash2, 
  Bug, 
  AlertTriangle, 
  User, 
  Clock, 
  FileText,
  Link as LinkIcon,
  Activity,
  Plus
} from 'lucide-react';
import { getTeamNames } from '../../utils/projectUtils';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defectId: string | null;
}

const DefectModal: React.FC<DefectModalProps> = ({ isOpen, onClose, defectId }) => {
  const { state, saveDefect, deleteDefect } = useProject();
  const [formData, setFormData] = useState<Partial<Defect>>({});

  useEffect(() => {
    if (defectId) {
      const d = state.defects.find(x => x.id === defectId);
      if (d) setFormData({ ...d });
    } else {
      setFormData({
        title: '',
        status: DefectStatus.NEW,
        severity: 'S3-Medium',
        priority: 'Normal',
        type: 'Bug',
        desc: '',
        steps: '',
        assignee: '',
        reporter: 'Current User',
        linkedType: 'Task',
        linkedId: ''
      });
    }
  }, [defectId, state.defects, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveDefect(formData, defectId || undefined);
    onClose();
  };

  const handleDelete = () => {
    if (defectId && window.confirm('Permanently strike this defect from the record?')) {
      deleteDefect(defectId);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={defectId ? `Defect Analysis: ${defectId}` : 'Log Technical Discrepancy'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2 pb-6">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">Defect Title</label>
          <input 
            className="w-full h-12 px-4 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl text-sm font-bold outline-none focus:border-red-500 transition-all shadow-sm"
            placeholder="Describe the failure vector..."
            value={formData.title || ''}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <Activity size={14} className="text-red-400" /> Status
            </label>
            <select 
              className="w-full h-11 px-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl text-sm font-bold outline-none focus:border-red-500 transition-all"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as DefectStatus })}
            >
              {Object.values(DefectStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> Severity
            </label>
            <select 
              className="w-full h-11 px-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl text-sm font-bold outline-none focus:border-red-500 transition-all"
              value={formData.severity}
              onChange={e => setFormData({ ...formData, severity: e.target.value })}
            >
              <option value="S1-Critical">S1 - System Crash</option>
              <option value="S2-High">S2 - Major Malfunction</option>
              <option value="S3-Medium">S3 - Logic Anomaly</option>
              <option value="S4-Low">S4 - Cosmetic Refinement</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <User size={14} /> Assignee
            </label>
            <select 
              className="w-full h-11 px-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl text-sm font-bold outline-none focus:border-red-500 transition-all"
              value={formData.assignee}
              onChange={e => setFormData({ ...formData, assignee: e.target.value })}
            >
              <option value="">Unassigned</option>
              {getTeamNames(state.members).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
              <LinkIcon size={14} /> Linked Task / Element
            </label>
            <select 
              className="w-full h-11 px-3 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-xl text-sm font-bold outline-none focus:border-red-500 transition-all"
              value={formData.linkedId}
              onChange={e => setFormData({ ...formData, linkedId: e.target.value })}
            >
              <option value="">Global / No Link</option>
              {state.tasks.map(t => <option key={t.id} value={t.id}>{t.id}: {t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
            <FileText size={14} /> Detailed Observation
          </label>
          <textarea 
            className="w-full p-4 h-24 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-2xl text-sm font-medium outline-none focus:border-red-500 transition-all resize-none"
            placeholder="Environmental conditions, expected vs actual behavior..."
            value={formData.desc || ''}
            onChange={e => setFormData({ ...formData, desc: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-2">
             Replication Protocol
          </label>
          <textarea 
            className="w-full p-4 h-20 bg-[var(--color-surface-offset)] border border-[var(--color-divider)] rounded-2xl text-sm font-medium font-mono outline-none focus:border-red-500 transition-all resize-none"
            placeholder="1. Login as Admin&#10;2. Click export&#10;3. Observe crash"
            value={formData.steps || ''}
            onChange={e => setFormData({ ...formData, steps: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between pt-4 gap-4">
          {defectId && (
            <Button type="button" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" /> Delete Issue
            </Button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-100">
            <Save size={16} className="mr-2" /> {defectId ? 'Update Record' : 'Commit Issue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DefectModal;
