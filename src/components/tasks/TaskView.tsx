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

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden">
      {/* Unified Tier 2 Command Bar: Title + Filters + View Modes + Actions */}
      <PageHeader
        icon={ListTodo}
        title="Project Tasks Matrix"
        subtitle={`${state.tasks.length} Total Tasks • ${state.tasks.filter(t => t.status === 'Completed').length} Done`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Filters (Active in Grid mode) */}
            {viewMode === 'grid' && (
              <div className="flex items-center gap-1.5 flex-wrap">
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
