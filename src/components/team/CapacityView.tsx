import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  BarChart3, 
  Users, 
  Settings2, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import clsx from 'clsx';
import { TaskStatus } from '../../types';
import { daysDiff, getBusinessDays } from '../../utils/projectUtils';

const CapacityView: React.FC = () => {
  const { state, updateSettings } = useProject();
  const { members, tasks, settings } = state;

  // Calculate load distribution
  const calculateCapacity = () => {
    const today = new Date();
    // Get start of current week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const weeks = [0, 1, 2, 3, 4, 5, 6, 7].map(w => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + (w * 7));
      return d;
    });

    const memberLoad = members.map(member => {
      const memberTasks = tasks.filter(t => t.assignee === member.name && t.status !== TaskStatus.COMPLETED);
      
      const weeklyEffort = weeks.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        let totalDays = 0;

        memberTasks.forEach(task => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.dueDate);
          
          // Intersection of task days and week days
          const rangeStart = taskStart > weekStart ? taskStart : weekStart;
          const rangeEnd = taskEnd < weekEnd ? taskEnd : weekEnd;

          if (rangeStart < rangeEnd) {
            const workingDaysInTask = getBusinessDays(task.startDate, task.dueDate);
            const workingDaysInIntersection = getBusinessDays(
              rangeStart.toISOString().split('T')[0], 
              rangeEnd.toISOString().split('T')[0]
            );

            if (workingDaysInTask > 0) {
              const effortPerDay = task.estDays / workingDaysInTask;
              totalDays += effortPerDay * workingDaysInIntersection;
            }
          }
        });

        return Number(totalDays.toFixed(2));
      });

      const totalLoad = weeklyEffort.reduce((a, b) => a + b, 0);
      const avgLoad = Number((totalLoad / weeks.length).toFixed(2));

      return {
        ...member,
        weeklyEffort,
        totalLoad,
        avgLoad,
        utilization: Math.round((avgLoad / settings.daysPerWeek) * 100)
      };
    });

    return { weeks, memberLoad };
  };

  const { weeks, memberLoad } = calculateCapacity();

  const getLoadColor = (days: number) => {
    const pct = (days / settings.daysPerWeek) * 100;
    if (pct > 100) return 'bg-rose-100 text-rose-700 border-rose-200';
    if (pct > 80) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (pct > 20) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center text-white">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Resource Capacity Planning</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Workload visualization for the next 8 weeks</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-[var(--color-border)]">
            <Settings2 size={16} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Settings:</span>
          </div>
          
          <div className="flex items-center gap-4 px-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Days/Wk</span>
              <input 
                type="number" 
                value={settings.daysPerWeek}
                onChange={(e) => updateSettings({ daysPerWeek: parseFloat(e.target.value) })}
                className="w-12 text-sm font-bold text-[var(--color-primary-hex)] bg-transparent focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Days/Wk</span>
              <input 
                type="number" 
                max={7}
                min={1}
                value={settings.workDays}
                onChange={(e) => updateSettings({ workDays: parseInt(e.target.value) })}
                className="w-10 text-sm font-bold text-[var(--color-primary-hex)] bg-transparent focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Resources</span>
              <Users size={16} className="text-[var(--color-primary-hex)]" />
            </div>
            <div className="text-2xl font-bold">{members.length} Members</div>
            <div className="mt-1 text-[10px] text-slate-500 font-medium">Available for allocation</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Utilization</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold">
              {Math.round(memberLoad.reduce((acc, m) => acc + m.utilization, 0) / members.length || 0)}%
            </div>
            <div className="mt-1 text-[10px] text-slate-500 font-medium">Across all team members</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">At Risk</span>
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <div className="text-2xl font-bold">
              {memberLoad.filter(m => m.utilization > 100).length} Overloaded
            </div>
            <div className="mt-1 text-[10px] text-slate-500 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Resources exceeding 100% capacity
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Backlog</span>
              <Calendar size={16} className="text-slate-400" />
            </div>
            <div className="text-2xl font-bold">
              {tasks.filter(t => t.status !== TaskStatus.COMPLETED).reduce((a, b) => a + b.estDays, 0).toFixed(1)} Days
            </div>
            <div className="mt-1 text-[10px] text-slate-500 font-medium">Estimated remaining effort</div>
          </div>
        </div>

        {/* Capacity Grid */}
        <div className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[var(--color-border)]">
                  <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-64 border-r border-slate-200">
                    Team Member
                  </th>
                  {weeks.map((week, idx) => (
                    <th key={idx} className="p-4 font-bold text-[10px] text-slate-400 uppercase tracking-wider min-w-[100px] border-r border-slate-200">
                      <div className="flex flex-col items-center">
                        <span>WK {idx + 1}</span>
                        <span className="text-[9px] font-normal lowercase">{week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </th>
                  ))}
                  <th className="p-4 font-bold text-xs text-slate-500 uppercase tracking-wider w-32">
                    Avg. Load
                  </th>
                </tr>
              </thead>
              <tbody>
                {memberLoad.map((member, mIdx) => (
                  <tr key={mIdx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-none">{member.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tight">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    {member.weeklyEffort.map((days, wIdx) => {
                      const util = (days / settings.daysPerWeek) * 100;
                      return (
                        <td key={wIdx} className="p-2 border-r border-slate-100">
                          <div className={clsx(
                            "h-12 w-full rounded-lg border-2 flex flex-col items-center justify-center transition-all",
                            getLoadColor(days)
                          )}>
                            <span className="text-xs font-bold">{days}d</span>
                            <div className="w-8 h-1 bg-current opacity-20 rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-current opacity-100" 
                                style={{ width: `${Math.min(util, 100)}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{member.utilization}%</span>
                          {member.utilization > 100 && <AlertTriangle size={12} className="text-rose-500" />}
                          {member.utilization <= 100 && member.utilization > 0 && <CheckCircle2 size={12} className="text-emerald-500" />}
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={clsx(
                              "h-full rounded-full transition-all duration-500",
                              member.utilization > 100 ? "bg-rose-500" : "bg-[var(--color-primary-hex)]"
                            )}
                            style={{ width: `${Math.min(member.utilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend/Context */}
        <div className="flex items-center gap-6 p-4 border border-dashed border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-100 border border-rose-200"></div>
            <span className="text-xs text-slate-500 font-medium">Overloaded (&gt;100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
            <span className="text-xs text-slate-500 font-medium">Heavy (80-100%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div>
            <span className="text-xs text-slate-500 font-medium">Healthy (20-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div>
            <span className="text-xs text-slate-500 font-medium">Under-allocated (&lt;20%)</span>
          </div>
          <div className="ml-auto text-[10px] text-slate-400 font-mono">
            *Effort is distributed evenly across working days between task start and end.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacityView;
