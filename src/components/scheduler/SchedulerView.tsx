import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, Member, TaskStatus } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../shared/PageHeader';
import { addBusDays, fmtDate, todayStr } from '../../utils/projectUtils';

const SchedulerView: React.FC = () => {
  const { state, updateProject, addLog } = useProject();
  const { tasks = [], members = [] } = state;

  // Calendar week anchor
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Calculate current week business days (Mon-Fri)
  const getWeekDays = (baseDate: Date): Date[] => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const weekDays = getWeekDays(currentDate);

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // Map active team members and calculate daily allocation
  const activeMembers = members.filter(m => m.status === 'Active');

  interface DayAllocation {
    effort: number; // 1.0 = 100% capacity (1 day)
    tasks: Task[];
  }

  // Pre-calculate member allocations per day in the active week
  const dailySchedule: Record<string, Record<string, DayAllocation>> = {};
  activeMembers.forEach(m => {
    dailySchedule[m.name] = {};
    weekDays.forEach(day => {
      const dStr = formatDate(day);
      dailySchedule[m.name][dStr] = { effort: 0, tasks: [] };
    });
  });

  // Distribute task effort across active dates
  tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).forEach(task => {
    if (!task.assignee || !task.startDate || !task.dueDate) return;
    if (!dailySchedule[task.assignee]) return;

    const start = new Date(task.startDate);
    const end = new Date(task.dueDate);
    const est = task.estDays || 1;

    // Count business days in task range
    let businessDaysCount = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysCount++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const dailyEffort = businessDaysCount > 0 ? est / businessDaysCount : est;

    // Allocate to days in current week
    weekDays.forEach(day => {
      const dStr = formatDate(day);
      if (day >= start && day <= end) {
        dailySchedule[task.assignee][dStr].effort += dailyEffort;
        dailySchedule[task.assignee][dStr].tasks.push(task);
      }
    });
  });

  // Identify Bottlenecks & Conflicts (> 1.0 day allocation)
  const conflicts: { member: string; date: string; effort: number; tasks: Task[] }[] = [];
  activeMembers.forEach(m => {
    weekDays.forEach(day => {
      const dStr = formatDate(day);
      const alloc = dailySchedule[m.name][dStr];
      if (alloc.effort > 1.0) {
        conflicts.push({
          member: m.name,
          date: dStr,
          effort: parseFloat(alloc.effort.toFixed(1)),
          tasks: alloc.tasks
        });
      }
    });
  });

  // Automated Schedule Shifting / Batch Action
  const handleShiftDates = (daysDelta: number) => {
    if (confirm(`Shift all active uncompleted tasks by ${daysDelta > 0 ? `+${daysDelta}` : daysDelta} business days?`)) {
      const updated = tasks.map(t => {
        if (t.status === TaskStatus.COMPLETED) return t;
        try {
          return {
            ...t,
            startDate: addBusDays(t.startDate, daysDelta),
            dueDate: addBusDays(t.dueDate, daysDelta)
          };
        } catch {
          return t;
        }
      });
      updateProject({ tasks: updated });
      addLog('Schedule Shifted', 'ALL', `Shifted active task timelines by ${daysDelta} days`);
    }
  };

  // Smart Rebalancing Recommendations
  const recommendations: string[] = [];
  if (conflicts.length > 0) {
    const overloadedNames = Array.from(new Set(conflicts.map(c => c.member)));
    recommendations.push(`Detected workload spikes for ${overloadedNames.join(', ')}. Recommend reassigning low-priority tasks.`);
  }
  const underutilized = activeMembers.filter(m => {
    const totalWeekly = weekDays.reduce((acc, d) => acc + dailySchedule[m.name][formatDate(d)].effort, 0);
    return totalWeekly < 2.0; // Less than 2 days assigned in a week
  });
  if (underutilized.length > 0) {
    recommendations.push(`Available capacity detected for ${underutilized.map(u => u.name).join(', ')}. Candidate resources for task offloading.`);
  }
  if (recommendations.length === 0) {
    recommendations.push("Workload is optimally balanced across all active team members for this period.");
  }

  // Auto-Balance Action: Shifts non-critical tasks from overloaded devs to available devs
  const handleAutoBalance = () => {
    if (conflicts.length === 0) {
      alert("No conflicts to resolve! Workload is already balanced.");
      return;
    }
    if (underutilized.length === 0) {
      alert("No available team members found to reallocate work to. Consider hiring or extending deadlines.");
      return;
    }

    if (confirm("Execute AI Copilot Auto-Balance? This will reassign non-critical tasks from overloaded team members to available peers.")) {
      let reallocatedCount = 0;
      let targetTasks = [...tasks];

      conflicts.forEach(conflict => {
        const candidateTasks = conflict.tasks.filter(t => t.priority !== 'Critical');
        if (candidateTasks.length > 0 && underutilized.length > 0) {
          const taskToMove = candidateTasks[0];
          const recipient = underutilized[reallocatedCount % underutilized.length];

          targetTasks = targetTasks.map(t => {
            if (t.id === taskToMove.id) {
              return { ...t, assignee: recipient.name };
            }
            return t;
          });
          reallocatedCount++;
        }
      });

      if (reallocatedCount > 0) {
        updateProject({ tasks: targetTasks });
        addLog('Auto-Balance Executed', 'SCHEDULER', `Reassigned ${reallocatedCount} tasks to balance workloads.`);
        alert(`Successfully rebalanced ${reallocatedCount} task(s) across available team members!`);
      } else {
        alert("Could not reassign tasks automatically: all overloaded tasks are flagged Critical.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={CalendarIcon}
        title="Conflict Resolver & Scheduler"
        subtitle="Analyze daily workloads, resolve resource bottlenecks, and adjust project timelines"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleShiftDates(-1)}
              className="h-9 px-3 border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95"
            >
              Shift -1 Day
            </button>
            <button 
              onClick={() => handleShiftDates(1)}
              className="h-9 px-3 border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95"
            >
              Shift +1 Day
            </button>
            <button 
              onClick={handleAutoBalance}
              className="h-9 px-3.5 bg-[var(--color-primary-hex)] hover:opacity-95 text-[var(--color-primary-text)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity shadow-sm cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-hex)]"
            >
              <Sparkles size={14} /> Auto-Balance
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Date Selector & Weekly Navigator */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 flex items-center justify-center shrink-0">
              <CalendarIcon size={18} />
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--color-text-muted)]">Active Planning Week</div>
              <div className="text-sm font-semibold text-[var(--color-text)]">
                {formatDate(weekDays[0])} <span className="text-[var(--color-text-faint)] font-normal">to</span> {formatDate(weekDays[4])}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevWeek}
              className="w-9 h-9 border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextWeek}
              className="w-9 h-9 border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Workspace Scheduler Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Calendar Grid (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-0 overflow-hidden bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-sm">
              <div className="p-4 md:p-5 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-2)]">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[var(--color-primary-hex)]" />
                  <h2 className="font-semibold text-sm text-[var(--color-text)]">Team Allocation Grid</h2>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">1.0 = 100% capacity (8h)</span>
              </div>

              <div className="divide-y divide-[var(--color-divider)]">
                {activeMembers.map(m => {
                  return (
                    <div key={m.id} className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center">
                      <div className="w-44 shrink-0">
                        <div className="font-semibold text-xs text-[var(--color-text)]">{m.name}</div>
                        <div className="text-xs text-[var(--color-primary-hex)] mt-0.5">{m.role}</div>
                      </div>

                      <div className="flex-1 grid grid-cols-5 gap-2.5">
                        {weekDays.map(day => {
                          const dStr = formatDate(day);
                          const sched = dailySchedule[m.name][dStr] || { effort: 0, tasks: [] };
                          const effortPct = Math.min(Math.round(sched.effort * 100), 100);
                          const isConflict = sched.effort > 1.0;

                          return (
                            <div 
                              key={dStr} 
                              className={clsx(
                                "p-2.5 rounded-lg border text-center transition-colors group relative min-h-[90px] flex flex-col justify-between",
                                isConflict 
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                                  : sched.effort > 0.01 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                                    : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-faint)]"
                              )}
                            >
                              <div>
                                <div className="text-xs font-semibold mb-1">
                                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className="font-mono text-xs font-bold">
                                  {sched.effort > 0 ? `${sched.effort.toFixed(1)}d` : '-'}
                                </div>
                              </div>

                              {sched.effort > 0 && (
                                <div className="w-full bg-[var(--color-surface-offset)] h-1.5 rounded-full overflow-hidden mt-1.5">
                                  <div 
                                    className={clsx("h-full rounded-full motion-safe:transition-transform duration-300", isConflict ? "bg-rose-500" : "bg-emerald-500")}
                                    style={{ width: `${effortPct}%` }}
                                  />
                                </div>
                              )}

                              {/* Tooltip on Hover showing tasks details */}
                              {sched.tasks.length > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-950 text-zinc-100 text-xs p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 space-y-1 border border-zinc-800">
                                  <div className="font-semibold border-b border-zinc-800 pb-1 mb-1 text-zinc-400">Assigned tasks:</div>
                                  {sched.tasks.map(t => (
                                    <div key={t.id} className="truncate text-xs">• {t.id}: {t.name}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diagnostics Panel (1 Col) */}
          <div className="space-y-6">
            <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-sm">
              <h2 className="font-bold text-sm flex items-center gap-2 mb-3 text-[var(--color-text)]">
                <AlertTriangle className={clsx(conflicts.length > 0 ? "text-amber-500" : "text-emerald-500")} size={16} />
                Conflict Diagnostic Sweep
              </h2>

              {conflicts.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg text-xs text-rose-500 font-medium flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {conflicts.length} workload conflicts identified for this week.
                  </div>
                  <div className="space-y-2.5">
                    {conflicts.map((c, i) => (
                      <div key={i} className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs space-y-1">
                        <div className="font-semibold text-[var(--color-text)]">{c.member}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">Overloaded on {c.date} (Allocation: {c.effort}d)</div>
                        <div className="pt-2 border-t border-[var(--color-divider)] mt-2 space-y-1">
                          {c.tasks.map(t => (
                            <div key={t.id} className="text-xs text-[var(--color-text)] flex items-center justify-between font-medium">
                              <span className="truncate">{t.id}: {t.name}</span>
                              <span className="font-mono text-[var(--color-primary-hex)] shrink-0">{t.estDays}d</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mx-auto">
                    <CheckCircle size={20} />
                  </div>
                  <h3 className="font-bold text-xs text-[var(--color-text)]">Weekly Timeline Optimised</h3>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-[200px] mx-auto leading-relaxed">
                    No calendar conflicts or overallocation bottlenecks detected.
                  </p>
                </div>
              )}
            </div>

            {/* Smart Suggestions & Copilot */}
            <div className="p-5 relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
              <h2 className="font-bold text-sm flex items-center gap-2 mb-3 text-[var(--color-text)]">
                <Sparkles className="text-[var(--color-primary-hex)]" size={16} />
                Scheduler Copilot Recommendations
              </h2>

              <div className="space-y-2.5">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] leading-relaxed">
                    <ArrowRight size={13} className="text-[var(--color-primary-hex)] shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default SchedulerView;
