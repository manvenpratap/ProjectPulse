import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Release, TaskStatus } from '../../types';
import { fmtDate, todayStr, daysDiff } from '../../utils/projectUtils';
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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import Modal from '../shared/Modal';
import clsx from 'clsx';

export const ReleaseRoadmap: React.FC = () => {
  const { state, updateProject, addLog } = useProject();
  const { releases = [], tasks = [], deliveries = [], features = [] } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [selectedReleaseDetails, setSelectedReleaseDetails] = useState<Release | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState(todayStr());
  const [formTargetDate, setFormTargetDate] = useState(todayStr());
  const [formStatus, setFormStatus] = useState<'Planned' | 'Active' | 'Released'>('Planned');

  // Statistics
  const totalReleases = releases.length;
  const activeReleases = releases.filter(r => r.status === 'Active').length;
  const releasedReleases = releases.filter(r => r.status === 'Released').length;
  const plannedReleases = releases.filter(r => r.status === 'Planned').length;

  const unmappedTasks = tasks.filter(t => !t.release || t.release.trim() === '').length;
  const unmappedDeliveries = deliveries.filter(d => !d.releaseVersion || d.releaseVersion.trim() === '').length;

  // Filtered releases
  const filteredReleases = releases.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      alert('Release name is required');
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
    }

    setIsModalOpen(false);
  };

  const handleDeleteRelease = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete release version "${name}"? Mapped tasks will remain intact.`)) {
      updateProject({ releases: releases.filter(r => r.id !== id) });
      addLog('Deleted Release', id, name, 'release', name, '', 'Release cycle deleted');
    }
  };

  const handleSyncDatesToTasks = (r: Release) => {
    if (!r.startDate || !r.date) return;
    const mapped = tasks.filter(t => t.release === r.name);
    if (!mapped.length) {
      alert(`No tasks currently mapped to ${r.name}`);
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
    }
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

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Flag}
        title="Release Roadmap"
        subtitle="Define delivery cycles, coordinate milestone rollouts, and monitor scope completion"
        actions={
          <Button variant="primary" size="sm" onClick={openAddModal} className="h-9 px-4 rounded-xl font-bold active:scale-95">
            <Plus size={15} className="mr-1.5" /> Add Release Version
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-6">

        {/* KPI Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
              <span>Total Cycles</span>
              <Flag size={14} className="text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-mono font-black text-[var(--color-text)]">
              {totalReleases}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
              Configured milestones
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
              <span>Active Cycle</span>
              <Clock size={14} className="text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-mono font-black text-blue-600">
              {activeReleases}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
              In active development
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
              <span>Shipped</span>
              <CheckCircle2 size={14} className="text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-mono font-black text-emerald-600">
              {releasedReleases}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
              Production delivered
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-text-muted)]">
              <span>Unmapped Scope</span>
              <AlertTriangle size={14} className="text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-mono font-black text-amber-600">
              {unmappedTasks}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
              Tasks without release tag
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input 
              type="text"
              placeholder="Search release versions…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-semibold focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['all', 'Active', 'Planned', 'Released'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={clsx(
                  "px-3 py-2 min-h-[36px] rounded-lg text-xs font-bold transition-colors duration-150 active:scale-[0.98] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50 cursor-pointer flex items-center justify-center",
                  filterStatus === st 
                    ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" 
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                )}
              >
                {st === 'all' ? 'All Releases' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Releases Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReleases.map(r => {
            const mappedTasks = tasks.filter(t => t.release === r.name);
            const mappedDeliveries = deliveries.filter(d => d.releaseVersion === r.name);
            const completedTasks = mappedTasks.filter(t => t.status === TaskStatus.COMPLETED);
            const progress = mappedTasks.length > 0 ? Math.round((completedTasks.length / mappedTasks.length) * 100) : 0;
            const daysLeft = r.date ? daysDiff(r.date) : null;
            const isOverdue = daysLeft !== null && daysLeft < 0 && r.status !== 'Released';

            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors duration-150 shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-mono font-bold text-xs">
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
                        onClick={() => openEditModal(r)}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors active:scale-95 cursor-pointer"
                        title="Edit Release"
                        aria-label="Edit Release"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRelease(r.id, r.name)}
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95 cursor-pointer"
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
                        isOverdue ? "text-red-500 font-bold" : "text-[var(--color-text)]"
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
                      <span className="font-mono font-bold text-indigo-600">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--color-primary-hex)] rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Mapped Assets */}
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] py-2 border-t border-[var(--color-divider)]">
                    <div className="flex items-center gap-1.5">
                      <ClipboardList size={13} className="text-indigo-500" />
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
                    className="text-[11px] font-bold text-[var(--color-text-muted)] hover:text-indigo-600 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} /> Sync Dates to Tasks
                  </button>

                  <button
                    onClick={() => setSelectedReleaseDetails(r)}
                    className="text-[11px] font-bold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1"
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
                <Plus size={14} className="mr-1" /> Add Release
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Release Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRelease ? 'Edit Release Version' : 'Create Release Version'}
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
              className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-sm"
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
                className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-mono text-xs font-semibold"
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
                className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-mono text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1.5">
              Governance Status
            </label>
            <select
              value={formStatus}
              onChange={e => setFormStatus(e.target.value as any)}
              className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-bold text-xs"
            >
              <option value="Planned">Planned (Future)</option>
              <option value="Active">Active (In Development)</option>
              <option value="Released">Released (Shipped / Done)</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Scope Details Drawer / Modal */}
      <Modal
        isOpen={!!selectedReleaseDetails}
        onClose={() => setSelectedReleaseDetails(null)}
        title={selectedReleaseDetails ? `Mapped Scope for ${selectedReleaseDetails.name}` : ''}
        size="lg"
        footer={
          <div className="flex justify-end w-full">
            <Button variant="ghost" size="sm" onClick={() => setSelectedReleaseDetails(null)} className="rounded-xl min-h-[38px] px-4 font-semibold">
              Close
            </Button>
          </div>
        }
      >
        {selectedReleaseDetails && (
          <div className="space-y-6">
            <div className="p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] text-xs text-[var(--color-text-muted)]">
              Target: {fmtDate(selectedReleaseDetails.date)} • Status: {selectedReleaseDetails.status}
            </div>

            {/* Mapped Tasks */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                <ClipboardList size={14} className="text-indigo-500" />
                Mapped Tasks ({tasks.filter(t => t.release === selectedReleaseDetails.name).length})
              </h4>
              <div className="space-y-2">
                {tasks.filter(t => t.release === selectedReleaseDetails.name).map(t => (
                  <div key={t.id} className="p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-[var(--color-primary-hex)] shrink-0">{t.id}</span>
                      <span className="font-semibold text-[var(--color-text)] truncate">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)]">{t.status}</span>
                      <span className="font-mono font-bold text-indigo-600">{t.progress}%</span>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.release === selectedReleaseDetails.name).length === 0 && (
                  <p className="text-xs italic text-[var(--color-text-muted)]">No tasks assigned to this release.</p>
                )}
              </div>
            </div>

            {/* Mapped Deliveries */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-3 flex items-center gap-2">
                <Package size={14} className="text-emerald-500" />
                Mapped Deliveries ({deliveries.filter(d => d.releaseVersion === selectedReleaseDetails.name).length})
              </h4>
              <div className="space-y-2">
                {deliveries.filter(d => d.releaseVersion === selectedReleaseDetails.name).map(d => (
                  <div key={d.id} className="p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-emerald-600 shrink-0">{d.almId || d.id}</span>
                      <span className="font-semibold text-[var(--color-text)] truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">{d.status}</span>
                    </div>
                  </div>
                ))}
                {deliveries.filter(d => d.releaseVersion === selectedReleaseDetails.name).length === 0 && (
                  <p className="text-xs italic text-[var(--color-text-muted)]">No deliveries mapped to this release.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReleaseRoadmap;

