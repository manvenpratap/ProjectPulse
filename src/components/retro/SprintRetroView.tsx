import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  X,
  Table2,
  LayoutGrid,
  Download,
  PanelRight,
  Trash2,
  Search,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { fireConfetti } from '../../utils/designSpells';
import SectionHelpButton from '../shared/SectionHelpButton';
import PageHeader from '../shared/PageHeader';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { toast } from '../../utils/toast';
import CollapsibleSummaryStrip from '../shared/CollapsibleSummaryStrip';
import { nextRetroActionStatus } from '../../utils/stateMachines';
import { MotionPage, StaggerContainer, StaggerItem } from '../shared/MotionPage';
import { AnimatedMetric } from '../shared/AnimatedMetric';

type RetroViewMode = 'board' | 'table';

const CATEGORIES = [
  { id: 'went_well', label: 'What Went Well', color: 'emerald', icon: Smile, desc: 'Wins, accelerated velocities, and successful milestones' },
  { id: 'needs_improvement', label: 'Areas for Growth', color: 'amber', icon: AlertTriangle, desc: 'Process friction, bottlenecks, and technical debt' },
  { id: 'action_item', label: 'Action Commitments', color: 'sky', icon: ListChecks, desc: 'Continuous improvements with assigned owners' },
  { id: 'kudos', label: 'Team Kudos', color: 'purple', icon: Award, desc: 'Appreciation, peer recognition, and shoutouts' }
] as const;

export const SAMPLE_RETROS: RetroItem[] = [
  {
    id: 'RETRO-01', category: 'went_well', title: 'Automated CI/CD cut deployment time by 45%',
    desc: 'The GitHub Actions pipeline optimization eliminated manual staging handoffs.',
    author: 'Sarah Chen', assignedTo: '', status: undefined, targetSprint: 'Sprint 23', votes: 9, createdAt: '2026-10-20'
  },
  {
    id: 'RETRO-02', category: 'went_well', title: 'Zero regressions on ALM Release v1.0.0 production cut',
    desc: 'Automated smoke test coverage caught 3 edge cases prior to staging promotion.',
    author: 'Bobby Draper', assignedTo: '', status: undefined, targetSprint: 'Sprint 23', votes: 12, createdAt: '2026-10-21'
  },
  {
    id: 'RETRO-03', category: 'went_well', title: 'Sub-millisecond latency on order book matching kernel',
    desc: 'Lock-free memory ring buffer achieved p99 latency of 840 microseconds.',
    author: 'Naomi Nagata', assignedTo: '', status: undefined, targetSprint: 'Sprint 23', votes: 14, createdAt: '2026-10-22'
  },
  {
    id: 'RETRO-04', category: 'needs_improvement', title: 'SWIFT XML Gateway specs changed mid-sprint',
    desc: 'Lack of frozen XSD schema delayed mock integration by 2 full days.',
    author: 'Amos Burton', assignedTo: '', status: undefined, targetSprint: 'Sprint 23', votes: 8, createdAt: '2026-10-22'
  },
  {
    id: 'RETRO-05', category: 'needs_improvement', title: 'Flaky E2E test in payment sandbox environment',
    desc: 'Intermittent third-party webhook timeout caused false negative builds.',
    author: 'Bobby Draper', assignedTo: '', status: undefined, targetSprint: 'Sprint 23', votes: 7, createdAt: '2026-10-23'
  },
  {
    id: 'RETRO-06', category: 'action_item', title: 'Introduce OpenAPI spec freeze 48h before sprint kick-off',
    desc: 'Architecture lead must sign off contract before frontend tasks are assigned.',
    author: 'David Kim', assignedTo: 'Sarah Chen', status: 'In Progress', targetSprint: 'Sprint 24', votes: 11, createdAt: '2026-10-24'
  },
  {
    id: 'RETRO-07', category: 'action_item', title: 'Implement circuit breaker pattern for external banking webhooks',
    desc: 'Prevent cascade thread pool starvation when external banking gateway is unresponsive.',
    author: 'Naomi Nagata', assignedTo: 'Alex Rivera', status: 'Open', targetSprint: 'Sprint 24', votes: 13, createdAt: '2026-10-25'
  },
  {
    id: 'RETRO-08', category: 'kudos', title: 'Kudos to Sarah Chen for leading the late-night staging cutover',
    desc: 'Clean rollback plan and clear communications across all stakeholder channels.',
    author: 'Alex Rivera', assignedTo: '', status: undefined, targetSprint: 'Sprint 23', votes: 16, createdAt: '2026-10-25'
  }
];

export const SprintRetroView: React.FC = () => {
  const { state, updateProject, createTask, addLog, setView } = useProject();
  const { retros = [], members = [], tasks = [] } = state;

  // View Mode Persistence
  const [viewMode, setViewMode] = useState<RetroViewMode>(() => {
    try {
      const saved = localStorage.getItem('pp_retro_view_mode');
      return (saved === 'board' || saved === 'table') ? saved : 'board';
    } catch {
      return 'board';
    }
  });

  const handleToggleViewMode = (mode: RetroViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('pp_retro_view_mode', mode);
    } catch {}
  };

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedSprint, setSelectedSprint] = useState<string>('Sprint 23');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectItem, setInspectItem] = useState<RetroItem | null>(null);

  // Form state
  const [newCategory, setNewCategory] = useState<RetroItem['category']>('went_well');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAuthor, setNewAuthor] = useState(members[0]?.name || 'Engineering Lead');
  const [newAssignee, setNewAssignee] = useState(members[0]?.name || '');
  const [newSprint, setNewSprint] = useState('Sprint 24');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search & 'Escape' to deselect/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (selectedItemIds.size > 0) {
          setSelectedItemIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds]);

  // Velocity telemetry
  const completedSprintTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const sprintTargetPoints = 50;
  const sprintDeliveredPoints = Math.min(50, Math.round(completedSprintTasks.length * 6.2));
  const sprintMorale = 8.8;

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

  // Filtered items
  const filteredItems = useMemo(() => {
    return retros.filter(item => {
      const matchesCategory = activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
      const matchesSearch = !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignedTo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [retros, activeCategoryFilter, searchQuery]);

  // Drawer Navigation
  const drawerIndex = useMemo(() => {
    if (!inspectItem) return -1;
    return filteredItems.findIndex(i => i.id === inspectItem.id);
  }, [filteredItems, inspectItem]);

  const handleNextItem = () => {
    if (drawerIndex >= 0 && drawerIndex < filteredItems.length - 1) {
      setInspectItem(filteredItems[drawerIndex + 1]);
    }
  };

  const handlePreviousItem = () => {
    if (drawerIndex > 0) {
      setInspectItem(filteredItems[drawerIndex - 1]);
    }
  };

  // Handlers
  const handleVote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = retros.map(item => {
      if (item.id === id) {
        return { ...item, votes: item.votes + 1 };
      }
      return item;
    });
    updateProject({ retros: updated });
    if (inspectItem?.id === id) {
      setInspectItem({ ...inspectItem, votes: inspectItem.votes + 1 });
    }
    toast.success('Upvote recorded.');
  };

  const handleCycleActionStatus = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let finalStatus: string = 'Open';
    const updated = retros.map(item => {
      if (item.id === id) {
        const nextStatus = nextRetroActionStatus(item.status);
        finalStatus = nextStatus;
        if (nextStatus === 'Resolved') {
          fireConfetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
        }
        return { ...item, status: nextStatus };
      }
      return item;
    });
    updateProject({ retros: updated });
    if (inspectItem?.id === id) {
      setInspectItem({ ...inspectItem, status: finalStatus as any });
    }
    toast.success(`Action status set to "${finalStatus}".`);
  };

  const handleConvertToActionTask = (item: RetroItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

    if (item.category === 'action_item' && (!item.status || item.status === 'Open')) {
      updateProject({
        retros: retros.map(r => r.id === item.id ? { ...r, status: 'In Progress' } : r)
      });
      if (inspectItem?.id === item.id) {
        setInspectItem({ ...inspectItem, status: 'In Progress' });
      }
    }

    addLog('Retro Action Promoted', created.id, created.name, 'Action Item', 'Retro', 'Live Task');
    toast.success(`Promoted Action Item "${item.title}" into live Task ${created.id}!`);
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Delete this retrospective item?')) {
      updateProject({ retros: retros.filter(r => r.id !== id) });
      if (inspectItem?.id === id) setInspectItem(null);
      if (selectedItemIds.has(id)) {
        const next = new Set(selectedItemIds);
        next.delete(id);
        setSelectedItemIds(next);
      }
      toast.success('Retrospective item deleted.');
    }
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
    toast.success(`Added retro item "${newItem.title}".`);
  };

  // Batch Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleBatchUpvote = () => {
    const updated = retros.map(i => selectedItemIds.has(i.id) ? { ...i, votes: i.votes + 1 } : i);
    updateProject({ retros: updated });
    toast.success(`Upvoted ${selectedItemIds.size} item(s).`);
  };

  const handleBatchResolveActions = () => {
    const updated = retros.map(i => (selectedItemIds.has(i.id) && i.category === 'action_item') ? { ...i, status: 'Resolved' as const } : i);
    updateProject({ retros: updated });
    fireConfetti({ particleCount: 30, spread: 60 });
    toast.success(`Marked selected action items as Resolved.`);
    setSelectedItemIds(new Set());
  };

  const handleBatchDelete = () => {
    if (confirm(`Delete ${selectedItemIds.size} selected retrospective item(s)?`)) {
      updateProject({ retros: retros.filter(i => !selectedItemIds.has(i.id)) });
      toast.success(`Deleted ${selectedItemIds.size} item(s).`);
      setSelectedItemIds(new Set());
      if (inspectItem && selectedItemIds.has(inspectItem.id)) {
        setInspectItem(null);
      }
    }
  };

  // CSV Export (Governance Tool with UTF-8 BOM)
  const handleExportCsv = () => {
    const headers = ['ID', 'Category', 'Title', 'Description', 'Author', 'Votes', 'Assigned To', 'Status', 'Target Sprint', 'Created At'];
    const rows = filteredItems.map(item => [
      `"${item.id}"`,
      `"${item.category}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${(item.desc || '').replace(/"/g, '""')}"`,
      `"${item.author}"`,
      item.votes,
      `"${item.assignedTo || ''}"`,
      `"${item.status || ''}"`,
      `"${item.targetSprint || ''}"`,
      `"${item.createdAt}"`
    ].join(','));
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ProjectPulse_SprintRetro_${selectedSprint.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredItems.length} retrospective items to CSV.`);
  };

  const getCategoryConfig = (catId: RetroItem['category']) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  };

  // Linear-Grade Table Columns
  const columns = useMemo<ColumnDef<RetroItem>[]>(() => [
    {
      id: 'title',
      header: 'Observation & Feedback',
      width: '320px',
      sortable: true,
      sortKey: 'title',
      cell: (item) => {
        const cat = getCategoryConfig(item.category);
        const CatIcon = cat.icon;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={clsx(
              "w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold",
              cat.color === 'emerald' && "bg-emerald-500/10 text-emerald-500",
              cat.color === 'amber' && "bg-amber-500/10 text-amber-500",
              cat.color === 'sky' && "bg-sky-500/10 text-sky-500",
              cat.color === 'purple' && "bg-purple-500/10 text-purple-500"
            )}>
              <CatIcon size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-[var(--color-text)] truncate block hover:text-[var(--color-primary-hex)] transition-colors">
                {item.title}
              </span>
              {item.desc && (
                <span className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                  {item.desc}
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'category',
      header: 'Category',
      width: '160px',
      sortable: true,
      sortKey: 'category',
      cell: (item) => {
        const cat = getCategoryConfig(item.category);
        return (
          <span className={clsx(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border",
            cat.color === 'emerald' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
            cat.color === 'amber' && "bg-amber-500/10 text-amber-600 border-amber-500/20",
            cat.color === 'sky' && "bg-sky-500/10 text-sky-600 border-sky-500/20",
            cat.color === 'purple' && "bg-purple-500/10 text-purple-600 border-purple-500/20"
          )}>
            <span>{cat.label}</span>
          </span>
        );
      }
    },
    {
      id: 'votes',
      header: 'Votes',
      width: '90px',
      align: 'center',
      sortable: true,
      sortKey: 'votes',
      cell: (item) => (
        <button
          onClick={(e) => handleVote(item.id, e)}
          className="px-2 py-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 text-[var(--color-text)] hover:text-[var(--color-primary-hex)] transition-colors cursor-pointer"
          title="Upvote item"
          aria-label={`Upvote (${item.votes} votes)`}
        >
          <ThumbsUp size={12} className="text-[var(--color-primary-hex)]" />
          <span>{item.votes}</span>
        </button>
      )
    },
    {
      id: 'status',
      header: 'Commitment Status',
      width: '150px',
      cell: (item) => {
        if (item.category !== 'action_item') {
          return <span className="text-[11px] text-[var(--color-text-faint)] font-mono pl-3">-</span>;
        }
        return (
          <button
            onClick={(e) => handleCycleActionStatus(item.id, e)}
            className={clsx(
              "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer",
              item.status === 'Resolved' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
              item.status === 'In Progress' && "bg-sky-500/10 text-sky-600 border-sky-500/20",
              (!item.status || item.status === 'Open') && "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}
            title="Click to cycle status"
          >
            {item.status || 'Open'}
          </button>
        );
      }
    },
    {
      id: 'assignedTo',
      header: 'Assigned Owner',
      width: '140px',
      cell: (item) => {
        if (item.category !== 'action_item') {
          return <span className="text-[11px] text-[var(--color-text-faint)] font-mono pl-3">-</span>;
        }
        return (
          <span className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
            <User size={13} className="text-[var(--color-text-muted)] shrink-0" />
            <span className="truncate">{item.assignedTo || 'Unassigned'}</span>
          </span>
        );
      }
    },
    {
      id: 'author',
      header: 'Contributor',
      width: '130px',
      cell: (item) => (
        <span className="text-xs text-[var(--color-text-muted)] font-medium truncate block">
          {item.author}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '120px',
      align: 'right',
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setInspectItem(item)}
            title="Inspect Item in Peek Drawer"
            aria-label={`Inspect ${item.title}`}
            className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
          >
            <PanelRight size={14} />
          </button>
          {item.category === 'action_item' && (
            <button
              onClick={(e) => handleConvertToActionTask(item, e)}
              title="Promote to Live Task in Matrix"
              aria-label={`Promote ${item.title}`}
              className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
            >
              <Zap size={14} />
            </button>
          )}
          <button
            onClick={(e) => handleDeleteItem(item.id, e)}
            title="Delete Item"
            aria-label={`Delete ${item.title}`}
            className="p-1.5 text-[var(--color-text-faint)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ], []);

  return (
    <MotionPage className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Smile}
        title="Sprint Retrospective"
        subtitle={selectedSprint}
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

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full space-y-4 sm:space-y-5">
        {/* Collapsible Sprint Vital Gauges */}
        <CollapsibleSummaryStrip
          title="Sprint Vitals"
          help={<SectionHelpButton view="retro" section="Team Sentiment Score" label="Team Morale guide" size={12} />}
          summary={[
            { label: 'Team Morale Index', value: `${sprintMorale} / 10`, tone: 'emerald' },
            { label: 'Velocity Delivered', value: `${sprintDeliveredPoints} / ${sprintTargetPoints} pts`, tone: 'sky' },
            { label: 'Action Resolution', value: `${counts.resolved_actions} / ${counts.action_item}`, tone: 'purple' }
          ]}
          contentClassName="pt-2.5 pb-1"
        >
          <StaggerContainer className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar scroll-fade-x sm:grid-cols-3 gap-3 sm:gap-4 pb-1">
            {/* Morale Index */}
            <StaggerItem className="min-w-[235px] sm:min-w-0 shrink-0 snap-start p-3.5 sm:p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl flex items-center gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Smile size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Team Morale Index</span>
                </div>
                <div className="text-xl font-mono font-bold text-emerald-500 mt-0.5">
                  <AnimatedMetric value={sprintMorale} decimals={1} /> <span className="text-xs font-sans text-[var(--color-text-muted)]">/ 10</span>
                </div>
              </div>
            </StaggerItem>

            {/* Velocity Fulfillment */}
            <StaggerItem className="min-w-[235px] sm:min-w-0 shrink-0 snap-start p-3.5 sm:p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl flex items-center gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 border border-sky-500/20">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Velocity Delivered</span>
                  <SectionHelpButton view="retro" section="Action Items" label="Velocity Delivered guide" size={12} />
                </div>
                <div className="text-xl font-mono font-bold text-sky-500 mt-0.5">
                  <AnimatedMetric value={sprintDeliveredPoints} /> <span className="text-xs font-sans text-[var(--color-text-muted)]">/ {sprintTargetPoints} pts</span>
                </div>
              </div>
            </StaggerItem>

            {/* Kaizen Actions Closure */}
            <StaggerItem className="min-w-[235px] sm:min-w-0 shrink-0 snap-start p-3.5 sm:p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl flex items-center gap-3.5 sm:gap-4">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">Action Resolution</span>
                  <SectionHelpButton view="retro" section="Action Item Tracking" label="Action Resolution guide" size={12} />
                </div>
                <div className="text-xl font-mono font-bold text-purple-500 mt-0.5">
                  <AnimatedMetric value={counts.resolved_actions} /> <span className="text-xs font-sans text-[var(--color-text-muted)]">/ {counts.action_item} Resolved</span>
                </div>
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
              placeholder="Search feedback, observations, actions… (Press /)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              aria-label="Search retrospective items"
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

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              data-filter-category="all"
              onClick={() => setActiveCategoryFilter('all')}
              className={clsx(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0",
                activeCategoryFilter === 'all'
                  ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
              )}
            >
              All ({counts.all})
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                data-filter-category={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={clsx(
                  "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1",
                  activeCategoryFilter === cat.id
                    ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                )}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75">({counts[cat.id as keyof typeof counts] || 0})</span>
              </button>
            ))}

            {(activeCategoryFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => { setActiveCategoryFilter('all'); setSearchQuery(''); }}
                className="px-2 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer ml-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* Action & View Mode Toggle Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-9 px-3 rounded-xl border-[var(--color-divider)] bg-[var(--color-surface-2)] font-bold text-xs"
              title="Export retrospective to CSV"
            >
              <Download size={13} className="mr-1.5 text-[var(--color-primary-hex)]" />
              <span>Export CSV</span>
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
              <button
                data-testid="toggle-retro-board"
                onClick={() => handleToggleViewMode('board')}
                className={clsx(
                  "p-1.5 rounded-lg transition-all cursor-pointer",
                  viewMode === 'board' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="Feedback Board Grid"
                aria-label="Board View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                data-testid="toggle-retro-table"
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
            </div>
          </div>
        </div>

        {/* ── MODE 1: LINEAR-GRADE PRECISION TABLE ── */}
        {viewMode === 'table' && (
          <div className="card overflow-hidden border border-[var(--color-divider)] shadow-sm">
            <DataTable<RetroItem>
              data={filteredItems}
              columns={columns}
              keyField="id"
              selectable={true}
              selectedIds={selectedItemIds}
              onToggleSelect={(id) => handleToggleSelect(id)}
              onToggleSelectAll={handleToggleSelectAll}
              isAllSelected={selectedItemIds.size === filteredItems.length && filteredItems.length > 0}
              showRowNumbers={true}
              stickyFirstColumn={true}
              enableColumnVisibility={true}
              columnVisibilityStorageKey="pp_retro_table_cols"
              emptyTitle="No retrospective items found"
              emptyMessage={searchQuery || activeCategoryFilter !== 'all' ? "Try clearing your active filters or search terms." : "Start logging sprint wins, areas for growth, and continuous action commitments."}
              emptyAction={
                searchQuery || activeCategoryFilter !== 'all' ? (
                  <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setActiveCategoryFilter('all'); }}>
                    <RefreshCw size={13} className="mr-1.5" /> Clear Filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                    <Plus size={14} className="mr-1.5" /> Add Retro Item
                  </Button>
                )
              }
            />
          </div>
        )}

        {/* ── MODE 2: RETRO BOARD FEEDBACK COLUMNS ── */}
        {viewMode === 'board' && (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.filter(c => activeCategoryFilter === 'all' || activeCategoryFilter === c.id).map(category => {
              const items = filteredItems.filter(r => r.category === category.id);
              const isEmerald = category.color === 'emerald';
              const isAmber = category.color === 'amber';
              const isSky = category.color === 'sky';
              const isPurple = category.color === 'purple';

              return (
                <StaggerItem 
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
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => handleVote(item.id, e)}
                              className="px-2 py-1 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 rounded-md text-[11px] font-mono font-semibold flex items-center gap-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] transition-colors cursor-pointer"
                              title="Upvote item"
                              aria-label={`Upvote (${item.votes} votes)`}
                            >
                              <ThumbsUp size={12} className="text-[var(--color-primary-hex)]" />
                              <span>{item.votes}</span>
                            </button>
                            <button
                              onClick={() => setInspectItem(item)}
                              className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)]"
                              title="Inspect observation"
                            >
                              <PanelRight size={13} />
                            </button>
                          </div>
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
                                onClick={(e) => handleCycleActionStatus(item.id, e)}
                                className={clsx(
                                  "px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer",
                                  item.status === 'Resolved' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                                  item.status === 'In Progress' && "bg-sky-500/10 text-sky-500 border border-sky-500/20",
                                  (!item.status || item.status === 'Open') && "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                )}
                                title="Click to cycle status"
                              >
                                {item.status || 'Open'}
                              </button>
                            </div>

                            <button
                              onClick={(e) => handleConvertToActionTask(item, e)}
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
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {/* ── CONTINUOUS IMPROVEMENT COMMITMENT LEDGER ── */}
        <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--color-divider)]">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-[var(--color-text)]">Continuous Improvement Action Commitments</h2>
              <SectionHelpButton view="retro" section="Action Item Tracking" label="Action Commitments guide" size={13} />
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
                    onClick={(e) => handleCycleActionStatus(item.id, e)}
                    className={clsx(
                      "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                      item.status === 'Resolved' && "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
                      item.status === 'In Progress' && "bg-sky-500/10 text-sky-500 border border-sky-500/20",
                      (!item.status || item.status === 'Open') && "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}
                  >
                    {item.status || 'Open'}
                  </button>
                  <button
                    onClick={(e) => handleConvertToActionTask(item, e)}
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

      {/* ── Floating Action Bar for Batch Selection ── */}
      <AnimatePresence>
        {selectedItemIds.size > 0 && (
          <motion.div
            data-testid="retro-floating-action-bar"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-divider)] shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 text-xs max-w-[95vw] overflow-x-auto"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--color-divider)] font-bold text-[var(--color-text)] shrink-0">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center text-[10px]">
                {selectedItemIds.size}
              </span>
              <span>Selected</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleBatchUpvote}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Upvote all selected items (+1)"
              >
                <ThumbsUp size={12} className="text-[var(--color-primary-hex)]" />
                <span>Upvote (+1)</span>
              </button>

              <button
                onClick={handleBatchResolveActions}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Mark all selected action items as Resolved"
              >
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span>Resolve Actions</span>
              </button>

              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete selected items"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedItemIds(new Set())}
              className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] ml-1 cursor-pointer shrink-0"
              title="Deselect all (Escape)"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Master-Detail Retro Item Peek Side Drawer (<SlideOverDrawer>) ── */}
      {inspectItem && (
        <SlideOverDrawer
          isOpen={true}
          onClose={() => setInspectItem(null)}
          onNext={handleNextItem}
          onPrevious={handlePreviousItem}
          hasNext={drawerIndex < filteredItems.length - 1}
          hasPrevious={drawerIndex > 0}
          widthClass="w-full sm:w-[500px] lg:w-[560px]"
          title={
            <div className="flex items-center gap-2">
              <Smile size={16} className="text-[var(--color-primary-hex)] shrink-0" />
              <span className="truncate">{inspectItem.title}</span>
            </div>
          }
          subtitle={
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                {inspectItem.id} • by {inspectItem.author} • {inspectItem.createdAt}
              </span>
            </div>
          }
        >
          {(() => {
            const cat = getCategoryConfig(inspectItem.category);
            const CatIcon = cat.icon;

            return (
              <div className="p-5 sm:p-6 space-y-6 text-xs custom-scroll">
                {/* 4-Metric Telemetry Bento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Category</span>
                    <span className="text-xs font-bold text-[var(--color-text)] mt-1 block truncate">{cat.label}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Upvotes</span>
                    <span className="text-base font-mono font-bold text-[var(--color-primary-hex)] mt-1 block">{inspectItem.votes}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Author</span>
                    <span className="text-xs font-bold text-[var(--color-text)] mt-1 block truncate">{inspectItem.author}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Status</span>
                    <span className="text-xs font-bold text-emerald-600 mt-1 block truncate">
                      {inspectItem.category === 'action_item' ? (inspectItem.status || 'Open') : 'Logged'}
                    </span>
                  </div>
                </div>

                {/* Observation Details Card */}
                <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
                      Observation Content
                    </span>
                    <button
                      onClick={() => handleVote(inspectItem.id)}
                      className="px-2.5 py-1 bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <ThumbsUp size={13} />
                      <span>Upvote ({inspectItem.votes})</span>
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--color-text)] leading-snug">
                    {inspectItem.title}
                  </h3>

                  {inspectItem.desc && (
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-divider)]">
                      {inspectItem.desc}
                    </p>
                  )}
                </div>

                {/* Continuous Improvement Action Flow */}
                {inspectItem.category === 'action_item' && (
                  <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--color-text)]">
                      <ListChecks size={14} className="text-sky-500" />
                      <span>Kaizen Action Commitment Workflow</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                        <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Assigned Owner</span>
                        <span className="font-bold text-[var(--color-text)] mt-0.5 block">{inspectItem.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                        <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Target Sprint</span>
                        <span className="font-mono font-bold text-[var(--color-primary-hex)] mt-0.5 block">{inspectItem.targetSprint || 'Sprint 24'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-divider)]">
                      <button
                        onClick={() => handleCycleActionStatus(inspectItem.id)}
                        className={clsx(
                          "flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer",
                          inspectItem.status === 'Resolved' && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          inspectItem.status === 'In Progress' && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                          (!inspectItem.status || inspectItem.status === 'Open') && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}
                      >
                        Status: {inspectItem.status || 'Open'} (Click to cycle)
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConvertToActionTask(inspectItem)}
                        className="py-2 px-3 font-bold text-xs flex items-center gap-1.5"
                      >
                        <Zap size={13} />
                        <span>Promote to Task</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Drawer Footer Actions */}
                <div className="pt-4 border-t border-[var(--color-divider)] flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteItem(inspectItem.id)}
                    className="font-bold text-xs text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                  >
                    <Trash2 size={13} className="mr-1.5" /> Delete Item
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInspectItem(null)}
                    className="font-semibold text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
        </SlideOverDrawer>
      )}

      {/* ── MODAL: SUBMIT RETRO ITEM ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Retrospective Item"
        size="md"
      >
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
      </Modal>
    </MotionPage>
  );
};

export default SprintRetroView;
