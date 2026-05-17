import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, TaskStatus } from '../../types';
import { MoreVertical, Plus, Clock, AlertCircle, Lock } from 'lucide-react';
import clsx from 'clsx';
import { daysDiff, isBlocked } from '../../utils/projectUtils';

interface BoardViewProps {
  onEditTask: (id: string) => void;
}

const BoardView: React.FC<BoardViewProps> = ({ onEditTask }) => {
  const { state, updateTask, searchTerm } = useProject();
  
  const filteredTasks = state.tasks.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { id: TaskStatus.NOT_STARTED, title: 'Backlog', color: 'border-slate-200' },
    { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'border-blue-400' },
    { id: TaskStatus.UNDER_REVIEW, title: 'Review', color: 'border-amber-400' },
    { id: TaskStatus.COMPLETED, title: 'Done', color: 'border-emerald-400' },
    { id: TaskStatus.ON_HOLD, title: 'Blocked', color: 'border-red-400' },
  ];

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'text-red-500 bg-red-50';
      case 'High': return 'text-amber-500 bg-amber-50';
      case 'Medium': return 'text-blue-500 bg-blue-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="flex gap-6 h-full min-w-max pb-4">
      {columns.map(col => {
        const columnTasks = filteredTasks.filter(t => t.status === col.id);
        
        return (
          <div key={col.id} className="w-[320px] flex flex-col h-full bg-slate-50/50 rounded-3xl border border-[var(--color-divider)]">
            <div className={clsx("p-5 border-b-2 flex items-center justify-between shrink-0", col.color)}>
               <div className="flex items-center gap-3">
                  <h3 className="font-bold text-sm text-slate-800 tracking-tight">{col.title}</h3>
                  <span className="px-2 py-0.5 bg-slate-200/50 text-[10px] font-mono font-black text-slate-500 rounded-full">
                    {columnTasks.length}
                  </span>
               </div>
               <button className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-400">
                  <MoreVertical size={16} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
              {columnTasks.map(task => {
                const overdue = daysDiff(task.dueDate)! < 0 && task.status !== TaskStatus.COMPLETED;
                const blocked = isBlocked(task, state.tasks);
                
                return (
                  <div 
                    key={task.id}
                    onClick={() => onEditTask(task.id)}
                    className={clsx(
                      "bg-white border rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-300",
                      blocked ? "border-amber-200 bg-amber-50/30" : "border-[var(--color-divider)] hover:border-indigo-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                          getPriorityColor(task.priority)
                        )}>
                          {task.priority}
                        </span>
                        {blocked && <Lock size={12} className="text-amber-600" />}
                      </div>
                      <span className="text-[10px] font-mono font-black text-slate-400">{task.id}</span>
                    </div>
                    
                    <h4 className="font-bold text-sm text-slate-900 leading-snug mb-4 group-hover:text-indigo-600 transition-colors">
                      {task.name}
                    </h4>

                    <div className="flex items-center justify-between">
                       <div className="flex -space-x-2">
                          {task.assignee ? (
                             <div className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm" title={task.assignee}>
                                {task.assignee.charAt(0)}
                             </div>
                          ) : (
                             <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400 italic">?</div>
                          )}
                       </div>

                       <div className="flex items-center gap-3">
                          {overdue && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                             <Clock size={12} />
                             {task.dueDate.split('-').slice(1).join('/')}
                          </div>
                       </div>
                    </div>

                    {task.progress > 0 && (
                       <div className="mt-4 pt-4 border-t border-slate-50">
                          <div className="flex justify-between items-center mb-1.5">
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progress</span>
                             <span className="text-[9px] font-black text-slate-600">{task.progress}%</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                               style={{ width: `${task.progress}%` }} 
                             />
                          </div>
                       </div>
                    )}
                  </div>
                );
              })}
              
              {columnTasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase text-slate-300 tracking-widest">
                   Empty Column
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BoardView;
