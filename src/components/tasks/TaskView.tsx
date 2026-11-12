import React, { useState, useEffect, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import TaskGrid from './TaskGrid';
import BoardView from './BoardView';
import TaskModal from './TaskModal';
import TimelineView from '../timeline/TimelineView';
import { ListTodo, Plus, LayoutGrid, Kanban, GanttChart, Layers, Flag, Filter } from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import CollapsibleSummaryStrip from '../shared/CollapsibleSummaryStrip';
import { TaskPriority, TaskStatus } from '../../types';
import { isBlocked, isOverdue } from '../../utils/projectUtils';
import clsx from 'clsx';

export interface TaskViewProps {
  initialMode?: 'grid' | 'board' | 'timeline';
}

const VALID_MODES = new Set(['grid', 'board', 'timeline']);

const TaskView: React.FC<TaskViewProps> = ({ initialMode }) => {
  const { state, setView, activeSubTab } = useProject();
  const { canPerform } = useAuth();
  const canCreate = canPerform('canCreateTask');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Operational Filters & Density lifted for unified Tier 2 Command Bar
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedRelease, setSelectedRelease] = useState<string>('all');
  const [showInlineFilters, setShowInlineFilters] = useState<boolean>(true);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const modules = useMemo(() => Array.from(new Set(state.tasks.map(t => t.module).filter(Boolean))), [state.tasks]);
  const releases = useMemo(() => Array.from(new Set(state.tasks.map(t => t.release).filter(Boolean))), [state.tasks]);

  const [viewMode, setViewMode] = useState<'grid' | 'board' | 'timeline'>(() => {
    if (initialMode) return initialMode;
    if (activeSubTab?.view === 'tasks' && VALID_MODES.has(activeSubTab.tab)) {
      return activeSubTab.tab as 'grid' | 'board' | 'timeline';
    }
    if (state.view === 'timeline') return 'timeline';
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem('pp-task-view-mode') as 'grid' | 'board' | 'timeline' | null;
      if (stored && VALID_MODES.has(stored)) return stored;
    }
    return 'grid';
  });

  useEffect(() => {
    if (initialMode) {
      setViewMode(initialMode);
    } else if (state.view === 'timeline') {
      setViewMode('timeline');
    } else if (activeSubTab?.view === 'tasks' && VALID_MODES.has(activeSubTab.tab)) {
      setViewMode(activeSubTab.tab as 'grid' | 'board' | 'timeline');
    }
  }, [initialMode, state.view, activeSubTab?.seq, activeSubTab?.view, activeSubTab?.tab]);

  const handleSetViewMode = (mode: 'grid' | 'board' | 'timeline') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('pp-task-view-mode', mode);
    }
    // Keep Sidebar on Delivery -> Tasks & Timeline unless currently on legacy #/timeline
    if (state.view === 'timeline' && mode !== 'timeline') {
      setView('tasks', true, mode);
    } else if (state.view === 'tasks') {
      setView('tasks', true, mode);
    }
  };

  const handleAddNewTask = () => {
    setEditingTaskId(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (id: string) => {
    setEditingTaskId(id);
    setIsModalOpen(true);
  };

  const taskTelemetry = useMemo(() => {
    const scoped = viewMode === 'grid'
      ? state.tasks.filter(t =>
          (selectedModule === 'all' || t.module === selectedModule) &&
          (selectedRelease === 'all' || t.release === selectedRelease)
        )
      : state.tasks;

    const total = scoped.length;
    const completed = scoped.filter(t => t.status === TaskStatus.COMPLETED).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const inFlight = scoped.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.UNDER_REVIEW).length;
    const blockedOrHold = scoped.filter(
      t => t.status === TaskStatus.BLOCKED || t.status === TaskStatus.ON_HOLD || isBlocked(t, state.tasks)
    ).length;
    const overdue = scoped.filter(t => isOverdue(t)).length;
    const highPriorityOpen = scoped.filter(
      t =>
        t.status !== TaskStatus.COMPLETED &&
        t.status !== TaskStatus.CANCELLED &&
        (t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH)
    ).length;
    const estDays = Math.round(scoped.reduce((sum, t) => sum + (t.estDays || 0), 0) * 10) / 10;
    const actDays = Math.round(scoped.reduce((sum, t) => sum + (t.actDays || 0), 0) * 10) / 10;

    return { total, completed, completionPct, inFlight, blockedOrHold, overdue, highPriorityOpen, estDays, actDays };
  }, [state.tasks, viewMode, selectedModule, selectedRelease]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden">
      {/* Unified Tier 2 Command Bar: Title + Filters + View Modes + Actions */}
      <PageHeader
        icon={ListTodo}
        title="Project Tasks Matrix"
        subtitle={`${state.tasks.length} Total Tasks • ${state.tasks.filter(t => t.status === 'Completed').length} Done`}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-fade-x py-0.5 max-w-full">
            {/* Quick Filters (Active in Grid mode) */}
            {viewMode === 'grid' && (
              <div className="flex items-center gap-1.5 flex-nowrap md:flex-wrap">
                {/* Module Filter */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs">
                  <Layers size={13} className="text-[var(--color-text-faint)]" />
                  <select
                    value={selectedModule}
                    onChange={e => setSelectedModule(e.target.value)}
                    className="bg-transparent font-semibold text-xs text-[var(--color-text)] outline-none cursor-pointer max-w-[130px] truncate"
                    aria-label="Filter by module"
                  >
                    <option value="all">All Modules ({modules.length})</option>
                    {modules.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Release Filter */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs">
                  <Flag size={13} className="text-[var(--color-text-faint)]" />
                  <select
                    value={selectedRelease}
                    onChange={e => setSelectedRelease(e.target.value)}
                    className="bg-transparent font-semibold text-xs text-[var(--color-text)] outline-none cursor-pointer max-w-[120px] truncate"
                    aria-label="Filter by release"
                  >
                    <option value="all">All Releases</option>
                    {releases.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle Inline Filters */}
                <button
                  onClick={() => setShowInlineFilters(!showInlineFilters)}
                  className={clsx(
                    "px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer min-h-[34px]",
                    showInlineFilters 
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/30"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)]"
                  )}
                  title="Toggle column header filter row"
                >
                  <Filter size={13} />
                  <span className="hidden md:inline">{showInlineFilters ? 'Filters Visible' : 'Show Filters'}</span>
                </button>

                {/* Density Toggle */}
                <div className="hidden xl:flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                  <button
                    onClick={() => setDensity('compact')}
                    className={clsx(
                      "px-2 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      density === 'compact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
                    )}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setDensity('comfortable')}
                    className={clsx(
                      "px-2 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                      density === 'comfortable' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)]"
                    )}
                  >
                    Comfortable
                  </button>
                </div>
              </div>
            )}

            {/* View Mode Toggle: Grid | Board | Timeline */}
            <div className="inline-flex items-center p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl gap-1">
              <button 
                onClick={() => handleSetViewMode('grid')}
                className={clsx(
                  "min-h-[34px] px-2.5 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer",
                  viewMode === 'grid' 
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="Grid Matrix View"
                aria-label="Grid Matrix View"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button 
                onClick={() => handleSetViewMode('board')}
                className={clsx(
                  "min-h-[34px] px-2.5 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer",
                  viewMode === 'board' 
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="Kanban Board View"
                aria-label="Kanban Board View"
              >
                <Kanban size={14} />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button 
                onClick={() => handleSetViewMode('timeline')}
                className={clsx(
                  "min-h-[34px] px-2.5 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 cursor-pointer",
                  viewMode === 'timeline' 
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="Timeline Gantt View"
                aria-label="Timeline Gantt View"
              >
                <GanttChart size={14} />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </div>
          </div>
        }
        primaryAction={
          canCreate ? (
            <Button variant="primary" size="sm" onClick={handleAddNewTask} className="h-9 font-bold active:scale-95 px-2.5 sm:px-3 shadow-xs">
              <Plus size={15} className="sm:mr-1" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </Button>
          ) : undefined
        }
      />

      {/* Collapsible Tasks Telemetry Cards Strip (Minimized by default) */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-divider)] px-3 sm:px-6 lg:px-8 py-2 shrink-0">
        <CollapsibleSummaryStrip
          title="Tasks Telemetry"
          summary={[
            { label: 'Completed', value: `${taskTelemetry.completed}/${taskTelemetry.total}`, tone: 'emerald' },
            { label: 'In Flight', value: taskTelemetry.inFlight, tone: 'sky' },
            { label: 'Blocked / Hold', value: taskTelemetry.blockedOrHold, tone: taskTelemetry.blockedOrHold > 0 ? 'amber' : 'neutral' },
            { label: 'Overdue', value: taskTelemetry.overdue, tone: taskTelemetry.overdue > 0 ? 'rose' : 'emerald' },
            { label: 'Crit / High Open', value: taskTelemetry.highPriorityOpen, tone: taskTelemetry.highPriorityOpen > 0 ? 'purple' : 'neutral' },
            { label: 'Effort Burned', value: `${taskTelemetry.actDays}/${taskTelemetry.estDays}d`, tone: 'primary' }
          ]}
          contentClassName="pt-2.5 pb-1"
        >
          <div className="flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar scroll-fade-x sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pb-1">
            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Completed Scope</div>
              <div className="text-xl font-bold text-emerald-500 mt-1 flex items-baseline gap-1.5 tracking-tight tabular-nums">
                <span>{taskTelemetry.completed}</span>
                <span className="text-[11px] font-normal text-[var(--color-text-muted)]">/ {taskTelemetry.total}</span>
              </div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5 tabular-nums">
                {taskTelemetry.completionPct}% done
              </div>
            </div>

            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">In Flight</div>
              <div className="text-xl font-bold text-sky-500 mt-1 flex items-baseline gap-1.5 tracking-tight tabular-nums">
                <span>{taskTelemetry.inFlight}</span>
                <span className="text-[11px] font-normal text-[var(--color-text-muted)]">active</span>
              </div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Progress &amp; review</div>
            </div>

            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Blocked / Hold</div>
              <div className={clsx(
                'text-xl font-bold mt-1 tracking-tight tabular-nums',
                taskTelemetry.blockedOrHold > 0 ? 'text-amber-500' : 'text-[var(--color-text)]'
              )}>
                {taskTelemetry.blockedOrHold}
              </div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Prerequisite or hold</div>
            </div>

            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Overdue Tasks</div>
              <div className={clsx(
                'text-xl font-bold mt-1 tracking-tight tabular-nums',
                taskTelemetry.overdue > 0 ? 'text-rose-500' : 'text-emerald-500'
              )}>
                {taskTelemetry.overdue}
              </div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Past target due date</div>
            </div>

            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Crit / High Open</div>
              <div className="text-xl font-bold text-purple-500 mt-1 tracking-tight tabular-nums">
                {taskTelemetry.highPriorityOpen}
              </div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Priority escalations</div>
            </div>

            <div className="min-w-[155px] sm:min-w-0 shrink-0 snap-start bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] p-3 sm:p-3.5 rounded-2xl shadow-2xs">
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Effort Burned</div>
              <div className="text-xl font-bold text-[var(--color-text)] mt-1 tracking-tight tabular-nums">
                {taskTelemetry.actDays}
                <span className="text-xs text-[var(--color-text-muted)] ml-1 font-normal">/ {taskTelemetry.estDays}d</span>
              </div>
              <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Actual vs estimated</div>
            </div>
          </div>
        </CollapsibleSummaryStrip>
      </div>

      {/* Task Content: Table starts immediately */}
      <div className={clsx(
        "flex-1 min-h-0",
        viewMode === 'timeline' 
          ? "overflow-hidden flex flex-col" 
          : "overflow-auto custom-scroll p-4 sm:p-6 lg:p-8"
      )}>
        {viewMode === 'grid' && (
           <TaskGrid 
             onEditTask={handleEditTask} 
             onNewTask={handleAddNewTask}
             selectedModule={selectedModule}
             setSelectedModule={setSelectedModule}
             selectedRelease={selectedRelease}
             setSelectedRelease={setSelectedRelease}
             showInlineFilters={showInlineFilters}
             setShowInlineFilters={setShowInlineFilters}
             density={density}
             setDensity={setDensity}
             hideToolbar={true}
           />
        )}
        {viewMode === 'board' && (
           <BoardView onEditTask={handleEditTask} />
        )}
        {viewMode === 'timeline' && (
           <TimelineView embedded={true} />
        )}
      </div>

      {/* Task Modal */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        taskId={editingTaskId} 
      />
    </div>
  );
};

export default TaskView;
