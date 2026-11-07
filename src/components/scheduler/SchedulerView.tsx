import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Task, Member, TaskStatus } from '../../types';
import { getBusinessDays, addBusDays, daysDiff } from '../../utils/projectUtils';
import { 
  Calendar as CalendarIcon, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  Settings2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';

const SchedulerView: React.FC = () => {
  const { state, updateProject, addLog } = useProject();
  const { tasks = [], members = [], settings } = state;

  // Active week calculation.
  // Defaults to the week of today.
  const [activeDate, setActiveDate] = useState<Date>(() => {
    const d = new Date();
    // Move to current Monday
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const getWeekRange = (start: Date) => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekDays = getWeekRange(activeDate);
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const handlePrevWeek = () => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() - 7);
    setActiveDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + 7);
    setActiveDate(d);
  };

  // Get active members
  const activeMembers = members.filter(m => m.status === 'Active');

  // Calculates task overlaps and daily efforts for each member for the active week's days
  const getDailySchedule = () => {
    const schedule: Record<string, Record<string, { effort: number; tasks: Task[] }>> = {};

    activeMembers.forEach(m => {
      schedule[m.name] = {};
      weekDays.forEach(day => {
        const dateStr = formatDate(day);
        schedule[m.name][dateStr] = { effort: 0, tasks: [] };
      });

      const mTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED);

      mTasks.forEach(task => {
        const tStart = new Date(task.startDate);
        const tEnd = new Date(task.dueDate);
        
        // Calculate daily effort for this task (estDays / workingDays)
        const totalWorkingDays = getBusinessDays(task.startDate, task.dueDate);
        const effortPerDay = totalWorkingDays > 0 ? (task.estDays / totalWorkingDays) : 0;

        weekDays.forEach(day => {
          const dateStr = formatDate(day);
          const currentDay = new Date(dateStr);
          
          if (currentDay >= tStart && currentDay <= tEnd) {
            schedule[m.name][dateStr].effort += effortPerDay;
            schedule[m.name][dateStr].tasks.push(task);
          }
        });
      });
    });

    return schedule;
  };

  const dailySchedule = getDailySchedule();

  // Diagnostics and conflict checker
  const findConflicts = () => {
    const list: { member: string; date: string; effort: number; tasks: Task[] }[] = [];
    activeMembers.forEach(m => {
      weekDays.forEach(day => {
        const dateStr = formatDate(day);
        const data = dailySchedule[m.name][dateStr];
        if (data.effort > 1.0) { // Overloaded if effort per day exceeds 1.0 full day
          list.push({
            member: m.name,
            date: dateStr,
            effort: Number(data.effort.toFixed(2)),
            tasks: data.tasks
          });
        }
      });
    });
    return list;
  };

  const conflicts = findConflicts();

  // Diagnostic checklist recommendations
  const getRecommendations = () => {
    const recs: string[] = [];
    
    if (conflicts.length === 0) {
      recs.push("Schedule is optimal. All team allocation loads are under 100% capacity.");
    } else {
      const overloadedMembers = Array.from(new Set(conflicts.map(c => c.member)));
      overloadedMembers.forEach(memName => {
        // Find underloaded members
        const loadOfOthers = activeMembers
          .filter(m => m.name !== memName)
          .map(m => {
            let totalWeekEffort = 0;
            weekDays.forEach(d => {
              totalWeekEffort += dailySchedule[m.name][formatDate(d)].effort;
            });
            return { name: m.name, load: totalWeekEffort };
          })
          .sort((a, b) => a.load - b.load);

        if (loadOfOthers.length > 0 && loadOfOthers[0].load < 2.5) {
          recs.push(`Reallocate task components from ${memName} to ${loadOfOthers[0].name} to balance peak workload levels.`);
        } else {
          recs.push(`Consider deferring or shifting due dates of overlapping tasks assigned to ${memName} by +2 business days.`);
        }
      });
    }

    // Checking for long idle gaps
    activeMembers.forEach(m => {
      let activeDaysCount = 0;
      weekDays.forEach(day => {
        if (dailySchedule[m.name][formatDate(day)].effort > 0.1) activeDaysCount++;
      });
      if (activeDaysCount === 0) {
        recs.push(`Resource Idle Warning: ${m.name} has no tasks allocated for this entire week.`);
      }
    });

    return recs;
  };

  const recommendations = getRecommendations();

  // Shift dates helper
  const handleShiftDates = (days: number) => {
    if (days === 0) return;
    const action = days > 0 ? 'postponed' : 'advanced';
    if (confirm(`Shift all active (non-completed) task timelines by ${days > 0 ? '+' : ''}${days} business days?`)) {
      const updatedTasks = tasks.map(t => {
        if (t.status === TaskStatus.COMPLETED) return t;
        const newStart = addBusDays(t.startDate, days);
        const newDue = addBusDays(t.dueDate, days);
        return {
          ...t,
          startDate: newStart,
          dueDate: newDue
        };
      });
      updateProject({ tasks: updatedTasks });
      addLog('Timeline Shifted', 'ALL', `Timeline shifted by ${days} days (${action})`);
    }
  };

  // Auto Balance workloads helper
  const handleAutoBalance = () => {
    if (conflicts.length === 0) {
      alert("No conflicts detected! Workloads are fully balanced for this week.");
      return;
    }

    if (confirm("Execute automatic AI balancing? This will distribute overlapping workloads to available team members.")) {
      const updatedTasks = [...tasks];
      let balanceCount = 0;

      conflicts.forEach(conflict => {
        const memToOffload = conflict.member;
        const conflictTasks = conflict.tasks;
        
        // Find underloaded member
        const otherMembers = activeMembers.filter(m => m.name !== memToOffload);
        if (otherMembers.length === 0) return;

        // Calculate weekly loads of others
        const sortedOthers = otherMembers.map(m => {
          let totalLoad = 0;
          weekDays.forEach(d => {
            totalLoad += dailySchedule[m.name][formatDate(d)].effort;
          });
          return { name: m.name, load: totalLoad };
        }).sort((a, b) => a.load - b.load);

        const replacementMember = sortedOthers[0].name;

        // Reassign the highest effort conflict task that isn't completed
        const targetTask = conflictTasks.sort((a, b) => b.estDays - a.estDays)[0];
        if (targetTask) {
          const idx = updatedTasks.findIndex(t => t.id === targetTask.id);
          if (idx > -1 && updatedTasks[idx].assignee === memToOffload) {
            updatedTasks[idx] = {
              ...updatedTasks[idx],
              assignee: replacementMember
            };
            balanceCount++;
            addLog('Reallocated', targetTask.id, `Reallocated to ${replacementMember} during auto-balancing`, 'assignee', memToOffload, replacementMember);
          }
        }
      });

      if (balanceCount > 0) {
        updateProject({ tasks: updatedTasks });
        alert(`Successfully rebalanced ${balanceCount} tasks to optimize resource utilization!`);
      } else {
        alert("Unable to balance tasks automatically. Try adjusting timelines or reassigning manually.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll">
      <div className="px-4 md:px-8 py-8 md:py-12 max-w-[1400px] mx-auto w-full space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--color-divider)]">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Intelligent Scheduling</div>
              <div className="w-1 h-1 rounded-full bg-[var(--color-divider)]" />
              <span className="text-xs font-bold text-[var(--color-text-faint)] uppercase">Copilot Sandbox</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text)] mb-3">Conflict Resolver & Scheduler</h1>
            <p className="text-[var(--color-text-muted)] text-sm max-w-xl leading-relaxed">
              Analyze daily workloads, resolve resource bottlenecks, and adjust project timelines in a sandboxed execution context.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleShiftDates(-1)}
              className="h-10 px-4 border border-[var(--color-divider)] rounded-xl text-xs font-bold hover:bg-[var(--color-surface-offset)]/50 transition-all"
            >
              Shift -1 Day
            </button>
            <button 
              onClick={() => handleShiftDates(1)}
              className="h-10 px-4 border border-[var(--color-divider)] rounded-xl text-xs font-bold hover:bg-[var(--color-surface-offset)]/50 transition-all"
            >
              Shift +1 Day
            </button>
            <button 
              onClick={handleAutoBalance}
              className="h-10 px-5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:scale-[1.02] transition-transform"
            >
              <Sparkles size={14} /> Auto-Balance
            </button>
          </div>
        </div>

        {/* Date Selector & Weekly Navigator */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-[var(--color-divider)] text-indigo-600 flex items-center justify-center shadow-sm">
              <CalendarIcon size={18} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-[var(--color-text-faint)] tracking-widest">Active Planning Week</div>
              <div className="text-sm font-black text-[var(--color-text)]">
                {formatDate(weekDays[0])} <span className="text-slate-400 font-bold">to</span> {formatDate(weekDays[4])}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevWeek}
              className="w-10 h-10 border border-[var(--color-divider)] bg-white rounded-xl flex items-center justify-center hover:bg-[var(--color-surface-offset)] transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={handleNextWeek}
              className="w-10 h-10 border border-[var(--color-divider)] bg-white rounded-xl flex items-center justify-center hover:bg-[var(--color-surface-offset)] transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Workspace Scheduler Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Calendar Grid (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-0 overflow-hidden">
              <div className="p-6 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-2)]">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  <h3 className="font-bold text-sm">Team Allocation Grid</h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-faint)]">Allocation Scale: 1.0 = 100% capacity (8 hours)</span>
              </div>

              <div className="divide-y divide-[var(--color-divider)]">
                {activeMembers.map(m => {
                  return (
                    <div key={m.id} className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
                      <div className="w-48 shrink-0">
                        <div className="font-bold text-sm text-[var(--color-text)]">{m.name}</div>
                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{m.role}</div>
                      </div>

                      <div className="flex-1 grid grid-cols-5 gap-3">
                        {weekDays.map(day => {
                          const dStr = formatDate(day);
                          const sched = dailySchedule[m.name][dStr] || { effort: 0, tasks: [] };
                          const effortPct = Math.min(Math.round(sched.effort * 100), 100);
                          const isConflict = sched.effort > 1.0;

                          return (
                            <div 
                              key={dStr} 
                              className={clsx(
                                "p-3 rounded-2xl border text-center transition-all group relative min-h-[100px] flex flex-col justify-between",
                                isConflict 
                                  ? "bg-rose-50/50 border-rose-200 text-rose-800" 
                                  : sched.effort > 0.01 
                                    ? "bg-emerald-50/20 border-emerald-100 text-emerald-800" 
                                    : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-faint)]"
                              )}
                            >
                              <div>
                                <div className="text-[9px] font-black uppercase tracking-widest mb-1">
                                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className="font-mono text-xs font-black">
                                  {sched.effort > 0 ? `${sched.effort.toFixed(1)}d` : '-'}
                                </div>
                              </div>

                              {sched.effort > 0 && (
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                                  <div 
                                    className={clsx("h-full rounded-full", isConflict ? "bg-rose-500" : "bg-emerald-500")}
                                    style={{ width: `${effortPct}%` }}
                                  />
                                </div>
                              )}

                              {/* Tooltip on Hover showing tasks details */}
                              {sched.tasks.length > 0 && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 space-y-1">
                                  <div className="font-black uppercase tracking-widest border-b border-slate-800 pb-1 mb-1 text-slate-400">Tasks details</div>
                                  {sched.tasks.map(t => (
                                    <div key={t.id} className="truncate">• {t.id}: {t.name}</div>
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
            <div className="card p-6 bg-slate-50 border-dashed border-[var(--color-divider)]">
              <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                <AlertTriangle className={clsx(conflicts.length > 0 ? "text-amber-500 animate-pulse" : "text-emerald-500")} size={16} />
                Conflict Diagnostic Sweep
              </h3>

              {conflicts.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    {conflicts.length} workload conflicts identified for this week.
                  </div>
                  <div className="space-y-3">
                    {conflicts.map((c, i) => (
                      <div key={i} className="p-3.5 bg-white border border-[var(--color-divider)] rounded-xl text-xs space-y-1">
                        <div className="font-black text-slate-900">{c.member}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Overloaded on {c.date} (Allocation: {c.effort}d)</div>
                        <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                          {c.tasks.map(t => (
                            <div key={t.id} className="text-[10px] text-slate-700 flex items-center justify-between font-bold">
                              <span className="truncate">{t.id}: {t.name}</span>
                              <span className="font-mono text-indigo-600 font-black shrink-0">{t.estDays}d</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white border border-[var(--color-divider)] rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto">
                    <CheckCircle size={22} />
                  </div>
                  <h4 className="font-black text-xs text-slate-900">Weekly Timeline Optimised</h4>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">No calendar conflicts or overallocation bottlenecks detected for active team members.</p>
                </div>
              )}
            </div>

            {/* Smart Suggestions & Copilot */}
            <div className="card p-6 relative overflow-hidden bg-gradient-to-r from-indigo-50/40 to-purple-50/40">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600">
                <Sparkles size={100} />
              </div>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
                <Sparkles className="text-indigo-500" size={16} />
                Scheduler Copilot Recommendations
              </h3>

              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2.5 items-start p-3 bg-white/70 border border-indigo-100/50 rounded-xl text-xs text-slate-700 font-bold leading-relaxed shadow-sm">
                    <ArrowRight size={14} className="text-indigo-500 shrink-0 mt-0.5" />
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
