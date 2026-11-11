import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { RetroItem, TaskPriority, TaskStatus } from '../../types';
import { 
  Smile, 
  TrendingUp, 
  ThumbsUp, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Heart, 
  Filter, 
  ArrowRight, 
  Clock, 
  User, 
  ListChecks, 
  MessageSquare, 
  Award, 
  Zap,
  Check,
  ChevronDown,
  X
} from 'lucide-react';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import PageHeader from '../shared/PageHeader';
import Button from '../shared/Button';

const CATEGORIES = [
  { id: 'went_well', label: 'What Went Well', color: 'emerald', icon: Smile, desc: 'Wins, accelerated velocities, and successful milestones' },
  { id: 'needs_improvement', label: 'Areas for Growth', color: 'amber', icon: AlertTriangle, desc: 'Process friction, bottlenecks, and technical debt' },
  { id: 'action_item', label: 'Action Commitments', color: 'sky', icon: ListChecks, desc: 'Continuous improvements with assigned owners' },
  { id: 'kudos', label: 'Team Kudos', color: 'purple', icon: Award, desc: 'Appreciation, peer recognition, and shoutouts' }
] as const;

export const SprintRetroView: React.FC = () => {
  const { state, updateProject, createTask, addLog } = useProject();
  const { retros = [], members = [], tasks = [] } = state;

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedSprint, setSelectedSprint] = useState<string>('Sprint 23');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [newCategory, setNewCategory] = useState<RetroItem['category']>('went_well');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAuthor, setNewAuthor] = useState(members[0]?.name || 'Engineering Lead');
  const [newAssignee, setNewAssignee] = useState(members[0]?.name || '');
  const [newSprint, setNewSprint] = useState('Sprint 24');

  // Velocity telemetry
  const completedSprintTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const sprintTargetPoints = 50;
  const sprintDeliveredPoints = Math.min(50, Math.round(completedSprintTasks.length * 6.2));
  const sprintMorale = 8.8; // Team sentiment index / 10

  // Category counts
  const counts = useMemo(() => {
    return {
      all: retros.length,
      went_well: retros.filter(r => r.category === 'went_well').length,
      needs_improvement: retros.filter(r => r.category === 'needs_improvement').length,
      action_item: retros.filter(r => r.category === 'action_item').length,
      kudos: retros.filter(r => r.category === 'kudos').length,
      resolved_actions: retros.filter(r => r.category === 'action_item' && r.status === 'Resolved').length
    };
  }, [retros]);

  // Handlers
  const handleVote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = retros.map(item => {
      if (item.id === id) {
        return { ...item, votes: item.votes + 1 };
      }
      return item;
    });
    updateProject({ retros: updated });
  };

  const handleCycleActionStatus = (id: string) => {
    const updated = retros.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Open' ? 'In Progress' : item.status === 'In Progress' ? 'Resolved' : 'Open';
        if (nextStatus === 'Resolved') {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
        }
        return { ...item, status: nextStatus as RetroItem['status'] };
      }
      return item;
    });
    updateProject({ retros: updated });
  };

  const handleConvertToActionTask = (item: RetroItem) => {
    const created = createTask({
      name: `[Retro Action] ${item.title}`,
      notes: `${item.desc || ''}\nOrigin: Sprint Retrospective (${item.id}) by ${item.author}`,
      priority: TaskPriority.HIGH,
      status: TaskStatus.NOT_STARTED,
      category: 'Improvement',
      assignee: item.assignedTo || item.author,
      estDays: 2,
      module: 'Continuous Improvement'
    });

    addLog('Retro Action Promoted', created.id, created.name, 'Action Item', 'Retro', 'Live Task');
    alert(`Successfully converted Action Item "${item.title}" into live Task ${created.id}!`);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: RetroItem = {
      id: `RETRO-${String(retros.length + 1).padStart(2, '0')}`,
      category: newCategory,
      title: newTitle.trim(),
      desc: newDesc.trim() || undefined,
      author: newAuthor,
      votes: 1,
      createdAt: new Date().toISOString().split('T')[0],
      ...(newCategory === 'action_item' ? {
        assignedTo: newAssignee,
        status: 'Open',
        targetSprint: newSprint
      } : {})
    };

    updateProject({ retros: [newItem, ...retros] });
    addLog('Retro Item Added', newItem.id, newItem.title, 'Category', '', newCategory);

    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(false);
  };

  const filteredItems = retros.filter(item => {
    if (activeCategoryFilter !== 'all' && item.category !== activeCategoryFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Smile}
        title="Sprint Retrospective"
        subtitle={`Kaizen Continuous Improvement • ${selectedSprint} Telemetry`}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              className="h-9 px-2 sm:px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs font-semibold text-[var(--color-text)] focus:outline-none cursor-pointer max-w-[105px] sm:max-w-none truncate"
              aria-label="Select sprint period"
            >
              <option value="Sprint 23">Sprint 23</option>
              <option value="Sprint 22">Sprint 22</option>
              <option value="Sprint 21">Sprint 21</option>
            </select>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-2.5 sm:px-4 active:scale-95 shrink-0 shadow-xs font-bold"
          >
            <Plus size={16} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Add Retro Item</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full space-y-6">
        {/* Sprint Vital Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Morale Index */}
            <div className="p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Smile size={24} />
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Team Morale Index</span>
                <div className="text-xl font-mono font-bold text-emerald-500 mt-0.5">
                  {sprintMorale} <span className="text-xs font-sans text-[var(--color-text-muted)]">/ 10</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">Strong Psychological Safety</span>
              </div>
            </div>

            {/* Velocity Fulfillment */}
            <div className="p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20">
                <TrendingUp size={24} />
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Velocity Delivered</span>
                <div className="text-xl font-mono font-bold text-sky-500 mt-0.5">
                  {sprintDeliveredPoints} <span className="text-xs font-sans text-[var(--color-text-muted)]">/ {sprintTargetPoints} pts</span>
                </div>
                <span className="text-[11px] text-sky-600 font-medium">96% Commitment Realization</span>
              </div>
            </div>

            {/* Kaizen Actions Closure */}
            <div className="p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--color-text-muted)]">Action Resolution</span>
                <div className="text-xl font-mono font-bold text-purple-500 mt-0.5">
                  {counts.resolved_actions} <span className="text-xs font-sans text-[var(--color-text-muted)]">/ {counts.action_item} Resolved</span>
                </div>
                <span className="text-[11px] text-purple-600 font-medium">Kaizen Continuous Flow</span>
              </div>
            </div>
          </div>

        {/* 2. CATEGORY PILL FILTER BAR (Information Pyramid Level 2) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scroll max-w-full">
          <button
            onClick={() => setActiveCategoryFilter('all')}
            className={clsx(
              "px-3.5 py-2 min-h-[36px] flex items-center justify-center rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer active:scale-95",
              activeCategoryFilter === 'all'
                ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm"
                : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            All Items ({counts.all})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={clsx(
                "px-3.5 py-2 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer active:scale-95",
                activeCategoryFilter === cat.id
                  ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm"
                  : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <cat.icon size={14} />
              <span>{cat.label} ({counts[cat.id as keyof typeof counts] || 0})</span>
            </button>
          ))}
        </div>

        {/* 3. RETRO BOARD FEEDBACK CARDS (Information Pyramid Level 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.filter(c => activeCategoryFilter === 'all' || activeCategoryFilter === c.id).map(category => {
            const items = retros.filter(r => r.category === category.id);
            const isEmerald = category.color === 'emerald';
            const isAmber = category.color === 'amber';
            const isSky = category.color === 'sky';
            const isPurple = category.color === 'purple';

            return (
              <div 
                key={category.id} 
                className={clsx(
                  "flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl p-4 shadow-sm",
                  activeCategoryFilter !== 'all' && "md:col-span-2 lg:col-span-4"
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-divider)]">
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                      isEmerald && "bg-emerald-500/10 text-emerald-500",
                      isAmber && "bg-amber-500/10 text-amber-500",
                      isSky && "bg-sky-500/10 text-sky-500",
                      isPurple && "bg-purple-500/10 text-purple-500"
                    )}>
                      <category.icon size={15} />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-[var(--color-text)] leading-tight">{category.label}</h2>
                      <span className="text-[11px] text-[var(--color-text-faint)] font-mono">{items.length} logged</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewCategory(category.id as any);
                      setIsModalOpen(true);
                    }}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg transition-colors cursor-pointer active:scale-95"
                    aria-label={`Add item to ${category.label}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px] pr-1 custom-scroll">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      className="p-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] hover:border-[var(--color-border)] rounded-xl transition-colors duration-150 space-y-2.5 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-[var(--color-text)] leading-snug flex-1">
                          {item.title}
                        </h3>
                        <button
                          onClick={(e) => handleVote(item.id, e)}
                          className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 rounded-md text-[11px] font-mono font-semibold flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] transition-colors cursor-pointer shrink-0"
                          title="Upvote item"
                          aria-label={`Upvote (${item.votes} votes)`}
                        >
                          <ThumbsUp size={12} className="text-[var(--color-primary-hex)]" />
                          <span>{item.votes}</span>
                        </button>
                      </div>

                      {item.desc && (
                        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                          {item.desc}
                        </p>
                      )}

                      {/* Action Item Metadata */}
                      {item.category === 'action_item' && (
                        <div className="pt-2 border-t border-[var(--color-divider)] space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                              <User size={12} />
                              <span className="truncate max-w-[100px]">{item.assignedTo || 'Unassigned'}</span>
                            </span>
                            <button
                              onClick={() => handleCycleActionStatus(item.id)}
                              className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer",
                                item.status === 'Resolved' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                                item.status === 'In Progress' && "bg-sky-500/10 text-sky-500 border border-sky-500/20",
                                item.status === 'Open' && "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              )}
                              title="Click to cycle status"
                            >
                              {item.status || 'Open'}
                            </button>
                          </div>

                          <button
                            onClick={() => handleConvertToActionTask(item)}
                            className="w-full py-1.5 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] text-[var(--color-primary-hex)] text-[11px] font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Zap size={12} />
                            <span>Convert to Live Task</span>
                          </button>
                        </div>
                      )}

                      {/* Footer: Author and Date */}
                      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-faint)] pt-1">
                        <span>by {item.author}</span>
                        <span className="font-mono">{item.createdAt}</span>
                      </div>
                    </div>
                  ))}

                  {items.length === 0 && (
                    <div className="py-8 text-center text-xs text-[var(--color-text-faint)] italic">
                      No items submitted yet in this category.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. CONTINUOUS IMPROVEMENT COMMITMENT LEDGER (Information Pyramid Level 4) */}
        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--color-divider)]">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text)]">Continuous Improvement Action Commitments</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Trackable Kaizen action items committed by the team for execution.</p>
            </div>
            <span className="text-xs font-mono text-[var(--color-primary-hex)] font-semibold">
              {retros.filter(r => r.category === 'action_item' && r.status === 'Resolved').length} / {retros.filter(r => r.category === 'action_item').length} Resolved
            </span>
          </div>

          <div className="divide-y divide-[var(--color-divider)]">
            {retros.filter(r => r.category === 'action_item').map(item => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-[var(--color-text-faint)]">{item.id}</span>
                    <h3 className="font-semibold text-[var(--color-text)] truncate">{item.title}</h3>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-3">
                    <span>Owner: <strong>{item.assignedTo || 'Unassigned'}</strong></span>
                    <span>Target: <strong>{item.targetSprint || 'Sprint 24'}</strong></span>
                    <span>Votes: <strong>{item.votes}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleCycleActionStatus(item.id)}
                    className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                      item.status === 'Resolved' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                      item.status === 'In Progress' && "bg-sky-500/10 text-sky-500 border border-sky-500/20",
                      item.status === 'Open' && "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}
                  >
                    {item.status || 'Open'}
                  </button>
                  <button
                    onClick={() => handleConvertToActionTask(item)}
                    className="px-2.5 py-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] text-[var(--color-text)] rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Zap size={13} className="text-[var(--color-primary-hex)]" />
                    <span>Promote Task</span>
                  </button>
                </div>
              </div>
            ))}

            {retros.filter(r => r.category === 'action_item').length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--color-text-faint)] italic">
                No continuous improvement actions currently logged.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL: SUBMIT RETRO ITEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
              <h2 className="text-base font-bold text-[var(--color-text)]">Add Retrospective Item</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text)]">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] focus:outline-none cursor-pointer"
                >
                  <option value="went_well">What Went Well</option>
                  <option value="needs_improvement">Areas for Growth / Friction</option>
                  <option value="action_item">Action Commitment</option>
                  <option value="kudos">Team Kudos & Shoutout</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text)]">Title / Core Observation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated smoke tests cut deployment latency"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text)]">Details & Context (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Elaborate on the root cause, friction point, or praise..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] focus:outline-none resize-none"
                />
              </div>

              {/* Author */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--color-text)]">Author</label>
                <select
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] focus:outline-none cursor-pointer"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                  {members.length === 0 && <option value="Contributor">Contributor</option>}
                </select>
              </div>

              {/* Action item specific fields */}
              {newCategory === 'action_item' && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-divider)]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Assigned Owner</label>
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] focus:outline-none cursor-pointer"
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text)]">Target Sprint</label>
                    <input
                      type="text"
                      value={newSprint}
                      onChange={(e) => setNewSprint(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-divider)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] hover:opacity-95 rounded-lg text-xs font-semibold transition-opacity shadow-sm cursor-pointer"
                >
                  Submit Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SprintRetroView;

