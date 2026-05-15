import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import TaskGrid from './TaskGrid';
import TaskModal from './TaskModal';
import { ListTodo, Plus } from 'lucide-react';
import Button from '../shared/Button';

const TaskView: React.FC = () => {
  const { state } = useProject();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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
          <Button variant="primary" size="sm" onClick={handleAddNewTask}>
            <Plus size={16} className="mr-1" /> New Task
          </Button>
        </div>
      </div>

      {/* Task Grid */}
      <div className="flex-1 overflow-auto custom-scroll p-6">
        <TaskGrid onEditTask={handleEditTask} />
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
