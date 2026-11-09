import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import TaskGrid from './TaskGrid';
import BoardView from './BoardView';
import TaskModal from './TaskModal';
import { ListTodo, Plus, LayoutGrid, Kanban } from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import ViewExportButton from '../shared/ViewExportButton';
import clsx from 'clsx';

const TaskView: React.FC = () => {
  const { state } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'board'>('grid');

  const handleAddNewTask = () => {
    setEditingTaskId(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (id: string) => {
    setEditingTaskId(id);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={ListTodo}
        title="Project Tasks Matrix"
        subtitle={`${state.tasks.length} Total Tasks • ${state.tasks.filter(t => t.status === 'Completed').length} Done`}
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl mr-1 gap-1">
              <button 
                onClick={() => setViewMode('grid')}
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
                onClick={() => setViewMode('board')}
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
            </div>
            <ViewExportButton viewId="tasks" label="Export Tasks" className="mr-1" />
            <Button variant="primary" size="sm" onClick={handleAddNewTask} className="h-9 font-bold active:scale-95 px-2.5 sm:px-3">
              <Plus size={15} className="sm:mr-1" />
              <span className="hidden sm:inline">New Task</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        }
      />

      {/* Task Content */}
      <div className="flex-1 overflow-auto custom-scroll p-4 sm:p-6 lg:p-8">
        {viewMode === 'grid' ? (
           <TaskGrid onEditTask={handleEditTask} onNewTask={handleAddNewTask} />
        ) : (
           <BoardView onEditTask={handleEditTask} />
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
