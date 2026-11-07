import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Bell, 
  AlertCircle, 
  Clock, 
  X, 
  ShieldAlert, 
  UserPlus,
  ChevronRight
} from 'lucide-react';
import { daysDiff } from '../../utils/projectUtils';
import { TaskStatus } from '../../types';
import clsx from 'clsx';

interface NotificationFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationFlyout: React.FC<NotificationFlyoutProps> = ({ isOpen, onClose }) => {
  const { state, setView } = useProject();
  
  const overdue = state.tasks.filter(t => daysDiff(t.dueDate)! < 0 && t.status !== TaskStatus.COMPLETED);
  const unassigned = state.tasks.filter(t => !t.assignee && t.status !== TaskStatus.COMPLETED && t.priority === 'Critical');
  const blocked = state.tasks.filter(t => t.status === TaskStatus.ON_HOLD);

  const notifications = [
    ...overdue.map(t => ({
      id: `overdue-${t.id}`,
      type: 'overdue',
      title: 'Task Overdue',
      desc: `${t.name} is ${Math.abs(daysDiff(t.dueDate)!)} days past deadline.`,
      icon: Clock,
      color: 'text-red-500',
      bg: 'bg-red-50',
      target: 'tasks'
    })),
    ...unassigned.map(t => ({
      id: `unassigned-${t.id}`,
      type: 'unassigned',
      title: 'Action Required',
      desc: `Critical task ${t.id} has no lead assigned.`,
      icon: UserPlus,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      target: 'tasks'
    })),
    ...blocked.map(t => ({
        id: `blocked-${t.id}`,
        type: 'blocked',
        title: 'Project Blocker',
        desc: `${t.name} is currently locked by a dependency.`,
        icon: ShieldAlert,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        target: 'timeline'
      }))
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <div className="fixed top-[calc(56px+env(safe-area-inset-top,0px))] left-2 right-2 sm:left-auto sm:right-4 w-auto sm:w-[360px] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-2xl z-[101] overflow-hidden motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-300">
        <div className="p-4 sm:p-5 border-b border-[var(--color-divider)] flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Bell size={18} className="text-indigo-600" />
             <h3 className="font-display font-black text-sm tracking-tight">Notification Pulse</h3>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close notifications"
            className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center hover:bg-[var(--color-surface-2)] rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[480px] overflow-y-auto custom-scroll p-2">
          {notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => { setView(notif.target); onClose(); }}
                  className="w-full text-left p-4 rounded-2xl hover:bg-[var(--color-surface-2)] transition-colors duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] group flex items-start gap-4"
                >
                  <div className={clsx("w-10 h-10 rounded-xl shrink-0 flex items-center justify-center", notif.bg, notif.color)}>
                    <notif.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs font-black text-[var(--color-text)]">{notif.title}</span>
                       <ChevronRight size={14} className="text-[var(--color-text-faint)] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-medium">
                      {notif.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-4">
                 <AlertCircle size={32} />
               </div>
               <h4 className="font-bold text-sm">System Quiet</h4>
               <p className="text-xs font-medium text-[var(--color-text-faint)] mt-1">No critical alerts detected</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
           <div className="p-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)]/50">
              <button 
                onClick={() => { setView('tasks'); onClose(); }}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-colors duration-150"
              >
                Clear Diagnostics
              </button>
           </div>
        )}
      </div>
    </>
  );
};

export default NotificationFlyout;
