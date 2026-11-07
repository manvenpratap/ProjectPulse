import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import TaskGrid from './TaskGrid';
import BoardView from './BoardView';
import TaskModal from './TaskModal';
import { ListTodo, Plus, LayoutGrid, Kanban, FileSpreadsheet } from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { exportProjectExcel } from '../../services/excelService';

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
      {/* View Header */}
      <div className="px-6 py-4 flex items-center justify-between border-bottom border-[var(--color-divider)] bg-[var(--color-surface)]/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ListTodo size={18} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">Project Tasks Matrix</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              {state.tasks.length} Total Tasks • {state.tasks.filter(t => t.status === 'Completed').length} Done
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl mr-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white text-indigo-600 shadow-sm" : "text-[var(--color-text-faint)] hover:text-indigo-500"
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={clsx(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'board' ? "bg-white text-indigo-600 shadow-sm" : "text-[var(--color-text-faint)] hover:text-indigo-500"
              )}
            >
              <Kanban size={16} />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportProjectExcel(state)} className="mr-1 h-9">
            <FileSpreadsheet size={16} className="mr-1.5 text-emerald-600" /> Export Excel
          </Button>
          <Button variant="primary" size="sm" onClick={handleAddNewTask} className="h-9">
            <Plus size={16} className="mr-1" /> New Task
          </Button>
        </div>
      </div>

      {/* Task Content */}
      <div className="flex-1 overflow-auto custom-scroll p-4 md:p-6">
        {viewMode === 'grid' ? (
           <TaskGrid onEditTask={handleEditTask} />
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
