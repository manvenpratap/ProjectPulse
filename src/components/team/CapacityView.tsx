import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  BarChart3, 
  Users, 
  Settings2, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Filter,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Info,
  X,
  Sparkles,
  Clock,
  Briefcase,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '../shared/PageHeader';
import { TaskStatus } from '../../types';
import { daysDiff, getBusinessDays, addBusDays } from '../../utils/projectUtils';

export interface CapacityViewProps {
  initialMode?: 'cards' | 'heatmap' | 'classic' | 'schedule';
}

const CapacityView: React.FC<CapacityViewProps> = ({ initialMode }) => {
  const { state, updateSettings, updateProject, addLog } = useProject();
  const { members, tasks, settings } = state;

  // Filter and Interactive state
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Responsive default: Mobile defaults to touch-friendly cards, Desktop defaults to heatmap
  const [viewMode, setViewMode] = useState<'cards' | 'heatmap' | 'classic' | 'schedule'>(() => {
    if (initialMode) return initialMode;
    return typeof window !== 'undefined' && window.innerWidth < 1024 ? 'cards' : 'heatmap';
  });
  const [heatmapMetric, setHeatmapMetric] = useState<'days' | 'percent' | 'none'>('days');
  const [spotlightThreshold, setSpotlightThreshold] = useState<number>(100);
  const [enableSpotlight, setEnableSpotlight] = useState<boolean>(true);
  const [selectedCoords, setSelectedCoords] = useState<{
    memberName: string;
    weekIdx: number;
  } | null>(null);

  // ══════ OPERATIONAL SCHEDULER ENGINE (Merged from Scheduler) ══════
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());

  const getScheduleWeekDays = (baseDate: Date): Date[] => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const days: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  };

  const scheduleWeekDays = useMemo(() => getScheduleWeekDays(scheduleDate), [scheduleDate]);

  const handlePrevScheduleWeek = () => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() - 7);
    setScheduleDate(d);
  };

  const handleNextScheduleWeek = () => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + 7);
    setScheduleDate(d);
  };

  const handleTodayScheduleWeek = () => {
    setScheduleDate(new Date());
  };

  const activeMembers = useMemo(() => members.filter(m => m.status === 'Active'), [members]);

  const { dailySchedule, conflicts, recommendations, underutilized } = useMemo(() => {
    const schedule: Record<string, Record<string, { effort: number; tasks: typeof tasks }>> = {};
    activeMembers.forEach(m => {
      schedule[m.name] = {};
      scheduleWeekDays.forEach(day => {
        const dStr = day.toISOString().split('T')[0];
        schedule[m.name][dStr] = { effort: 0, tasks: [] };
      });
    });

    tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).forEach(task => {
      if (!task.assignee || !task.startDate || !task.dueDate) return;
      if (!schedule[task.assignee]) return;

      const start = new Date(task.startDate);
      const end = new Date(task.dueDate);
      const est = task.estDays || 1;

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

      scheduleWeekDays.forEach(day => {
        const dStr = day.toISOString().split('T')[0];
        if (day >= start && day <= end) {
          schedule[task.assignee][dStr].effort += dailyEffort;
          schedule[task.assignee][dStr].tasks.push(task);
        }
      });
    });

    const conflictsList: { member: string; date: string; effort: number; tasks: typeof tasks }[] = [];
    activeMembers.forEach(m => {
      scheduleWeekDays.forEach(day => {
        const dStr = day.toISOString().split('T')[0];
        const alloc = schedule[m.name]?.[dStr];
        if (alloc && alloc.effort > 1.0) {
          conflictsList.push({
            member: m.name,
            date: dStr,
            effort: parseFloat(alloc.effort.toFixed(1)),
            tasks: alloc.tasks
          });
        }
      });
    });

    const underutilizedList = activeMembers.filter(m => {
      const totalWeekly = scheduleWeekDays.reduce((acc, d) => {
        const dStr = d.toISOString().split('T')[0];
        return acc + (schedule[m.name]?.[dStr]?.effort || 0);
      }, 0);
      return totalWeekly < 2.0;
    });

    const recs: string[] = [];
    if (conflictsList.length > 0) {
      const overloadedNames = Array.from(new Set(conflictsList.map(c => c.member)));
      recs.push(`Detected workload spikes for ${overloadedNames.join(', ')}. Recommend reassigning low-priority tasks.`);
    }
    if (underutilizedList.length > 0) {
      recs.push(`Available capacity detected for ${underutilizedList.map(u => u.name).join(', ')}. Candidate resources for task offloading.`);
    }
    if (recs.length === 0) {
      recs.push("Workload is optimally balanced across all active team members for this period.");
    }

    return {
      dailySchedule: schedule,
      conflicts: conflictsList,
      recommendations: recs,
      underutilized: underutilizedList
    };
  }, [activeMembers, scheduleWeekDays, tasks]);

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
      addLog('Schedule Shifted', 'CAPACITY', `Shifted active task timelines by ${daysDelta} days`);
    }
  };

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
        addLog('Auto-Balance Executed', 'CAPACITY', `Reassigned ${reallocatedCount} tasks to balance workloads.`);
        alert(`Successfully rebalanced ${reallocatedCount} task(s) across available team members!`);
      } else {
        alert("Could not reassign tasks automatically: all overloaded tasks are flagged Critical.");
      }
    }
  };

  // Extract unique roles for filtering
  const roles = ['all', ...Array.from(new Set(members.map(m => m.role).filter(Boolean)))];

  // Filter members based on role and search query
  const filteredMembers = members.filter(member => {
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (member.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

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

    const memberLoad = filteredMembers.map(member => {
      const memberTasks = tasks.filter(t => t.assignee === member.name && t.status !== TaskStatus.COMPLETED);
      
      const weeklyEffort = weeks.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        let totalDays = 0;
        const contributingTasks: Array<{
          id: string;
          name: string;
          estDays: number;
          dailyLoad: number;
          daysInWeek: number;
          status: string;
          priority: string;
          module?: string;
          startDate: string;
          dueDate: string;
        }> = [];

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
              const contribution = effortPerDay * workingDaysInIntersection;
              totalDays += contribution;
              contributingTasks.push({
                id: task.id,
                name: task.name,
                estDays: task.estDays,
                dailyLoad: Number(effortPerDay.toFixed(1)),
                daysInWeek: workingDaysInIntersection,
                status: task.status,
                priority: task.priority || 'medium',
                module: task.module,
                startDate: task.startDate,
                dueDate: task.dueDate
              });
            }
          }
        });

        const totalDaysFixed = Number(totalDays.toFixed(2));
        const utilization = Math.round((totalDaysFixed / settings.daysPerWeek) * 100);

        return {
          days: totalDaysFixed,
          utilization,
          tasks: contributingTasks
        };
      });

      const totalLoad = weeklyEffort.reduce((a, b) => a + b.days, 0);
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

  // Color-coded logic depending on the view mode (Classic vs. Saturated Heatmap)
  const getCellColor = (days: number, mode: 'classic' | 'heatmap' | 'cards') => {
    const pct = (days / settings.daysPerWeek) * 100;
    
    if (mode === 'classic') {
      if (pct > 100) return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
      if (pct > 80) return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      if (pct > 20) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      return 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]';
    } else {
      // Heatmap view: Solid saturated blocks
      if (pct === 0) return 'bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border-[var(--color-divider)] hover:border-[var(--color-border)]';
      if (pct < 20) return 'bg-sky-500/20 text-sky-500 border-sky-500/30 hover:bg-sky-500/30';
      if (pct <= 80) return 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600';
      if (pct <= 100) return 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600';
      return 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700';
    }
  };

  // Find peak week index for auto inspection
  const getPeakWeekIndex = (member: typeof memberLoad[0]) => {
    let maxDays = -1;
    let peakIdx = 0;
    member.weeklyEffort.forEach((eff, idx) => {
      if (eff.days > maxDays) {
        maxDays = eff.days;
        peakIdx = idx;
      }
    });
    return peakIdx;
  };

  // Interactive selected cell details lookup
  const selectedActiveCell = selectedCoords ? (() => {
    const m = memberLoad.find(member => member.name === selectedCoords.memberName);
    if (!m) return null;
    const effort = m.weeklyEffort[selectedCoords.weekIdx];
    if (!effort) return null;
    return {
      memberName: m.name,
      memberRole: m.role,
      weekIdx: selectedCoords.weekIdx,
      weekStart: weeks[selectedCoords.weekIdx],
      days: effort.days,
      utilization: effort.utilization,
      tasks: effort.tasks
    };
  })() : null;

  // Leveling alternative resource recommendation lookup
  const alternativeResource = selectedActiveCell ? (() => {
    const candidate = memberLoad
      .filter(m => m.name !== selectedActiveCell.memberName && m.role === selectedActiveCell.memberRole)
      .map(m => ({
        name: m.name,
        role: m.role,
        avgLoad: m.avgLoad,
        utilization: m.utilization,
        weekLoad: m.weeklyEffort[selectedActiveCell.weekIdx]?.days || 0,
        weekUtil: m.weeklyEffort[selectedActiveCell.weekIdx]?.utilization || 0
      }))
      .sort((a, b) => a.weekLoad - b.weekLoad);
    return candidate.length > 0 ? candidate[0] : null;
  })() : null;

  // Reusable Allocation Analysis Details content
  const renderAllocationDetailsContent = (onClose: () => void, isMobile: boolean = false) => {
    if (!selectedActiveCell) return null;

    return (
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
          <div>
            <h2 className="font-bold text-[var(--color-text)] text-base">Week {selectedActiveCell.weekIdx + 1} Analysis</h2>
            <p className="text-xs text-[var(--color-text-muted)]">Selected allocation details</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close allocation details"
            className="p-1.5 min-h-[36px] min-w-[36px] hover:bg-[var(--color-surface)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer flex items-center justify-center active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Resource profile card */}
        <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-divider)] space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/20 text-[var(--color-primary-hex)] flex items-center justify-center font-bold text-sm shrink-0">
              {selectedActiveCell.memberName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs text-[var(--color-text)] truncate">{selectedActiveCell.memberName}</h3>
              <p className="text-xs text-[var(--color-text-muted)] truncate">{selectedActiveCell.memberRole || 'Unspecified Role'}</p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[var(--color-divider)] flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)] font-medium">Week Start:</span>
            <span className="font-mono font-semibold text-[var(--color-text)]">
              {selectedActiveCell.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Utilization gauge */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-[var(--color-text-muted)] font-medium">
              <span>Allocated Workload</span>
              <span className={clsx(
                "font-mono font-bold",
                selectedActiveCell.utilization > 100 ? "text-rose-500" : "text-[var(--color-primary-hex)]"
              )}>{selectedActiveCell.utilization}% ({selectedActiveCell.days}d / {settings.daysPerWeek}d)</span>
            </div>
            <div className="h-2 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all duration-300",
                  selectedActiveCell.utilization > 100 ? "bg-rose-500" : "bg-[var(--color-primary-hex)]"
                )}
                style={{ width: `${Math.min(selectedActiveCell.utilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contributing Tasks Module */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
            <Briefcase size={13} className="text-[var(--color-primary-hex)]" />
            Contributing Tasks ({selectedActiveCell.tasks.length})
          </h3>

          {selectedActiveCell.tasks.length > 0 ? (
            <div className={clsx("space-y-2.5 overflow-y-auto custom-scroll pr-1", isMobile ? "max-h-60" : "max-h-72")}>
              {selectedActiveCell.tasks.map((task, idx) => (
                <div key={idx} className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-divider)] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-[var(--color-text)] text-xs line-clamp-2">
                      {task.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-muted)] shrink-0">
                      {task.priority}
                    </span>
                  </div>

                  {task.module && (
                    <div className="text-[11px] text-[var(--color-text-muted)] font-medium">
                      Module: <span className="text-[var(--color-text)]">{task.module}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--color-divider)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Allocated Effort:</span>
                    <span className="font-mono font-semibold text-[var(--color-text)]">
                      {task.daysInWeek}d this week ({task.dailyLoad}d/day)
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--color-text-faint)] flex items-center gap-1 font-mono">
                    <Clock size={11} />
                    <span>{task.startDate} to {task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] p-5 rounded-xl border border-[var(--color-divider)] text-center text-[var(--color-text-muted)] text-xs">
              No active tasks scheduled for this resource this week.
            </div>
          )}
        </div>

        {/* Resource Leveling Intelligent Recommendation Engine */}
        <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-divider)] space-y-2.5 shadow-xs">
          <h3 className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[var(--color-primary-hex)]" />
            Allocation Advisory
          </h3>
          
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {selectedActiveCell.utilization > 100 ? (
              <>
                <strong className="text-rose-500 font-semibold">Over-Allocation: </strong>
                {selectedActiveCell.memberName} is overloaded by {selectedActiveCell.utilization - 100}% this week.
                {alternativeResource ? (
                  <span> Consider transferring backlog tasks to <strong className="text-[var(--color-text)] font-semibold">{alternativeResource.name}</strong>, who has {settings.daysPerWeek - alternativeResource.weekLoad}d spare capacity.</span>
                ) : (
                  <span> Recommend adjusting timeline bounds to minimize parallel overlap.</span>
                )}
              </>
            ) : selectedActiveCell.utilization > 80 ? (
              <>
                <strong className="text-amber-500 font-semibold">Heavy Load: </strong>
                {selectedActiveCell.memberName} is operating at {selectedActiveCell.utilization}% capacity. Nearing saturation.
              </>
            ) : selectedActiveCell.utilization > 20 ? (
              <>
                <strong className="text-emerald-500 font-semibold">Healthy: </strong>
                Workload is within healthy boundaries ({selectedActiveCell.utilization}%).
              </>
            ) : (
              <>
                <strong className="text-sky-500 font-semibold">Under-Allocated: </strong>
                {selectedActiveCell.memberName} is operating at {selectedActiveCell.utilization}% capacity. Available for assignment.
              </>
            )}
          </p>

          {alternativeResource && selectedActiveCell.utilization > 100 && (
            <div className="pt-2 border-t border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] flex items-center justify-between">
              <span className="font-medium">Leveling Candidate:</span>
              <span className="font-mono text-[var(--color-primary-hex)] font-bold">
                {alternativeResource.name} ({alternativeResource.weekUtil}%)
              </span>
            </div>
          )}
        </div>

        {/* Mobile Dismiss Button */}
        {isMobile && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[var(--color-text)] rounded-xl font-bold text-xs flex items-center justify-center transition-colors active:scale-98 cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden">
      <PageHeader
        icon={BarChart3}
        title="Resource Capacity & Scheduling"
        subtitle="Strategic workload heatmaps, daily operational scheduling, and autonomous leveling"
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleShiftDates(-1)}
                className="h-9 px-2.5 sm:px-3 border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                title="Shift all active uncompleted tasks backward by 1 business day"
              >
                <span>-1d Shift</span>
              </button>
              <button 
                onClick={() => handleShiftDates(1)}
                className="h-9 px-2.5 sm:px-3 border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs"
                title="Shift all active uncompleted tasks forward by 1 business day"
              >
                <span>+1d Shift</span>
              </button>
            </div>

            <button 
              onClick={handleAutoBalance}
              className={clsx(
                "h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95",
                conflicts.length > 0 
                  ? "bg-rose-500 hover:bg-rose-600 text-white" 
                  : "bg-[var(--color-primary-hex)] hover:opacity-95 text-[var(--color-primary-text)]"
              )}
              title="Automatically reassign non-critical tasks from overloaded engineers to available peers"
            >
              <Sparkles size={14} /> 
              <span>AI Auto-Balance</span>
              {conflicts.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold">
                  {conflicts.length}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2.5 bg-[var(--color-surface-2)] p-1 px-2.5 rounded-xl border border-[var(--color-divider)]">
              <Settings2 size={13} className="text-[var(--color-text-muted)] shrink-0" />
              <div className="flex items-center gap-2 text-xs divide-x divide-[var(--color-divider)]">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-[var(--color-text-muted)] text-[11px]">Cap/Wk:</span>
                  <input 
                    type="number" 
                    step="0.5"
                    min="1"
                    max="7"
                    value={settings.daysPerWeek}
                    onChange={(e) => updateSettings({ daysPerWeek: parseFloat(e.target.value) || 5 })}
                    className="w-9 text-center font-bold text-[var(--color-primary-hex)] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)] py-0.5 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 pl-2">
                  <span className="font-semibold text-[var(--color-text-muted)] text-[11px]">Workdays:</span>
                  <input 
                    type="number" 
                    max={7}
                    min={1}
                    value={settings.workDays}
                    onChange={(e) => updateSettings({ workDays: parseInt(e.target.value) || 5 })}
                    className="w-9 text-center font-bold text-[var(--color-primary-hex)] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)] py-0.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-w-0 max-w-full">
        {/* Main interactive grid column */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 min-w-0 max-w-full">
          
          {/* Active Summary Stats: 2x2 grid on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-[var(--color-surface)] p-3.5 sm:p-4 rounded-2xl border border-[var(--color-divider)] shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Resources</span>
                <Users size={15} className="text-[var(--color-primary-hex)] shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-text)]">{filteredMembers.length} Members</div>
              <div className="mt-0.5 text-[10px] sm:text-xs text-[var(--color-text-faint)] truncate">Active search scope</div>
            </div>

            <div className="bg-[var(--color-surface)] p-3.5 sm:p-4 rounded-2xl border border-[var(--color-divider)] shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Avg Utilization</span>
                <TrendingUp size={15} className="text-emerald-500 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-text)]">
                {Math.round(memberLoad.reduce((acc, m) => acc + m.utilization, 0) / (memberLoad.length || 1))}%
              </div>
              <div className="mt-0.5 text-[10px] sm:text-xs text-[var(--color-text-faint)] truncate">Team average load</div>
            </div>

            <div className="bg-[var(--color-surface)] p-3.5 sm:p-4 rounded-2xl border border-[var(--color-divider)] shadow-xs border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Overload Alert</span>
                <AlertTriangle size={15} className="text-rose-500 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-500">
                {memberLoad.filter(m => m.utilization > 100).length} Overloaded
              </div>
              <div className="mt-0.5 text-[10px] sm:text-xs text-[var(--color-text-faint)] truncate">Exceeding 100% capacity</div>
            </div>

            <div className="bg-[var(--color-surface)] p-3.5 sm:p-4 rounded-2xl border border-[var(--color-divider)] shadow-xs border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] truncate">Available Reserves</span>
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-text)]">
                {memberLoad.filter(m => m.utilization < 30).length} Idle
              </div>
              <div className="mt-0.5 text-[10px] sm:text-xs text-[var(--color-text-faint)] truncate">Under 30% weekly load</div>
            </div>
          </div>

          {/* Controls Bar: Mode Toggles, Filter Pills, Search */}
          <div className="bg-[var(--color-surface)] p-3 sm:p-4 rounded-2xl border border-[var(--color-divider)] shadow-xs space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            
            {/* View Mode Tabs: Cards vs Heatmap vs Daily Scheduler vs Classic */}
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-1 rounded-xl shrink-0 max-w-full overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={clsx(
                  "px-3 py-1.5 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95 shrink-0",
                  viewMode === 'cards' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <LayoutGrid size={13} />
                <span>Member Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('heatmap')}
                className={clsx(
                  "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0",
                  viewMode === 'heatmap' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Layers size={13} />
                <span>Heatmap Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('schedule')}
                className={clsx(
                  "px-3 py-1.5 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95 shrink-0 relative",
                  viewMode === 'schedule' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Calendar size={13} />
                <span>Daily Scheduler</span>
                {conflicts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('classic')}
                className={clsx(
                  "px-3 py-1.5 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95 shrink-0",
                  viewMode === 'classic' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <TableIcon size={13} />
                <span>Classic</span>
              </button>
            </div>

            {/* Filter Pills (Smooth scroll container on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {roles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={clsx(
                    "px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors border cursor-pointer shrink-0 whitespace-nowrap active:scale-95",
                    roleFilter === role 
                      ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] border-[var(--color-primary-hex)] shadow-sm" 
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:border-[var(--color-border)]"
                  )}
                >
                  {role === 'all' ? 'All Roles' : role}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-56 shrink-0">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                aria-label="Search resources"
                className="w-full h-10 pl-9 pr-8 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] min-h-[28px] min-w-[28px] flex items-center justify-center cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

          </div>

          {/* Interactive Heatmap Controls (Shown when viewing grid or adjusting threshold) */}
          {(viewMode === 'heatmap' || viewMode === 'classic') && (
            <div className="bg-[var(--color-surface-2)] p-3.5 sm:p-4 rounded-2xl border border-[var(--color-divider)] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-primary-hex)] rounded-xl shrink-0">
                  <Sliders size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--color-text)]">Spotlight Threshold</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Highlight high allocation cells</p>
                </div>
              </div>

              {/* Slider & Metric Selectors */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="10"
                    value={spotlightThreshold}
                    onChange={(e) => setSpotlightThreshold(parseInt(e.target.value))}
                    disabled={!enableSpotlight}
                    aria-label="Spotlight allocation threshold percentage"
                    className={clsx(
                      "w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-hex)] bg-[var(--color-surface)] border border-[var(--color-divider)]",
                      !enableSpotlight && "opacity-40 cursor-not-allowed"
                    )}
                  />
                  <span className={clsx(
                    "font-mono text-xs font-bold px-2 py-0.5 rounded-md shrink-0",
                    enableSpotlight ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                  )}>
                    {spotlightThreshold}%
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableSpotlight}
                      onChange={(e) => setEnableSpotlight(e.target.checked)}
                      className="rounded text-[var(--color-primary-hex)] focus:ring-[var(--color-primary-hex)] h-3.5 w-3.5"
                    />
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">Spotlight</span>
                  </label>

                  <div className="flex items-center gap-1 border-l border-[var(--color-divider)] pl-3">
                    <span className="text-xs font-semibold text-[var(--color-text-muted)]">Metric:</span>
                    <select
                      value={heatmapMetric}
                      onChange={(e: any) => setHeatmapMetric(e.target.value)}
                      aria-label="Heatmap metric display"
                      className="bg-transparent text-xs font-bold text-[var(--color-text)] focus:outline-none cursor-pointer"
                    >
                      <option value="days">Days</option>
                      <option value="percent">% Util</option>
                      <option value="none">Blank</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: DAILY SCHEDULER vs MEMBER CARDS vs HEATMAP/CLASSIC GRID */}
          {viewMode === 'schedule' ? (
            <div className="space-y-6">
              {/* Date Selector & Weekly Navigator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-muted)]">Active Planning Week</div>
                    <div className="text-sm font-bold text-[var(--color-text)]">
                      {scheduleWeekDays[0]?.toISOString().split('T')[0]} <span className="text-[var(--color-text-faint)] font-normal text-xs">to</span> {scheduleWeekDays[4]?.toISOString().split('T')[0]}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    onClick={handleTodayScheduleWeek}
                    className="h-9 px-3 border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] text-[var(--color-text)] rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                  >
                    Current Week
                  </button>
                  <button 
                    onClick={handlePrevScheduleWeek}
                    className="w-9 h-9 border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95 text-[var(--color-text)]"
                    aria-label="Previous week"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextScheduleWeek}
                    className="w-9 h-9 border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95 text-[var(--color-text)]"
                    aria-label="Next week"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Workspace Scheduler Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Calendar Grid (2 Cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="overflow-hidden bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs">
                    <div className="p-4 md:p-5 border-b border-[var(--color-divider)] flex flex-wrap justify-between items-center gap-2 bg-[var(--color-surface-2)]">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-[var(--color-primary-hex)]" />
                        <h2 className="font-bold text-sm text-[var(--color-text)]">Team Allocation Grid</h2>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)] font-mono">1.0 = 100% capacity (8h/day)</span>
                    </div>

                    <div className="divide-y divide-[var(--color-divider)]">
                      {activeMembers.map(m => {
                        return (
                          <div key={m.id} className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center">
                            <div className="w-44 shrink-0">
                              <div className="font-bold text-xs text-[var(--color-text)] truncate">{m.name}</div>
                              <div className="text-xs text-[var(--color-primary-hex)] mt-0.5 truncate">{m.role}</div>
                            </div>

                            <div className="flex-1 grid grid-cols-5 gap-2">
                              {scheduleWeekDays.map(day => {
                                const dStr = day.toISOString().split('T')[0];
                                const sched = dailySchedule[m.name]?.[dStr] || { effort: 0, tasks: [] };
                                const effortPct = Math.min(Math.round(sched.effort * 100), 100);
                                const isConflict = sched.effort > 1.0;

                                return (
                                  <div 
                                    key={dStr} 
                                    className={clsx(
                                      "p-2.5 rounded-xl border text-center transition-colors group relative min-h-[85px] flex flex-col justify-between select-none",
                                      isConflict 
                                        ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                                        : sched.effort > 0.01 
                                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                                          : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-faint)]"
                                    )}
                                  >
                                    <div>
                                      <div className="text-[11px] font-semibold mb-1">
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
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-zinc-950 text-zinc-100 text-xs p-2.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 space-y-1 border border-zinc-800">
                                        <div className="font-bold border-b border-zinc-800 pb-1 mb-1 text-zinc-400">Assigned tasks:</div>
                                        {sched.tasks.map(t => (
                                          <div key={t.id} className="truncate text-[11px] text-zinc-200">• {t.id}: {t.name} ({t.estDays}d)</div>
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
                  <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs">
                    <h2 className="font-bold text-sm flex items-center gap-2 mb-3 text-[var(--color-text)]">
                      <AlertTriangle className={clsx(conflicts.length > 0 ? "text-amber-500" : "text-emerald-500")} size={16} />
                      Conflict Diagnostic Sweep
                    </h2>

                    {conflicts.length > 0 ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-xs text-rose-500 font-semibold flex items-center gap-2">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>{conflicts.length} workload conflicts identified this week.</span>
                        </div>
                        <div className="space-y-2.5 max-h-[280px] overflow-y-auto custom-scroll pr-1">
                          {conflicts.map((c, i) => (
                            <div key={i} className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs space-y-1">
                              <div className="font-bold text-[var(--color-text)]">{c.member}</div>
                              <div className="text-[11px] text-[var(--color-text-muted)]">Overloaded on {c.date} (Allocation: {c.effort}d)</div>
                              <div className="pt-2 border-t border-[var(--color-divider)] mt-2 space-y-1">
                                {c.tasks.map(t => (
                                  <div key={t.id} className="text-xs text-[var(--color-text)] flex items-center justify-between font-medium">
                                    <span className="truncate max-w-[170px]">{t.id}: {t.name}</span>
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
                          <CheckCircle2 size={20} />
                        </div>
                        <h3 className="font-bold text-xs text-[var(--color-text)]">Weekly Timeline Optimised</h3>
                        <p className="text-xs text-[var(--color-text-muted)] max-w-[220px] mx-auto leading-relaxed">
                          No calendar bottlenecks or day-level conflicts detected.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Smart Suggestions & Copilot */}
                  <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs space-y-3">
                    <h2 className="font-bold text-sm flex items-center gap-2 text-[var(--color-text)]">
                      <Sparkles className="text-[var(--color-primary-hex)]" size={16} />
                      Scheduler Copilot Recommendations
                    </h2>

                    <div className="space-y-2.5">
                      {recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-2 items-start p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] leading-relaxed">
                          <ArrowRight size={13} className="text-[var(--color-primary-hex)] shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={handleAutoBalance}
                      className="w-full mt-2 h-9 px-3.5 bg-[var(--color-primary-hex)] hover:opacity-95 text-[var(--color-primary-text)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity shadow-sm cursor-pointer active:scale-95"
                    >
                      <Sparkles size={14} /> Auto-Balance Tasks
                    </button>
                  </div>

                </div>

              </div>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="space-y-3.5">
              {memberLoad.length > 0 ? (
                memberLoad.map((member, mIdx) => {
                  const peakIdx = getPeakWeekIndex(member);
                  const peakEffort = member.weeklyEffort[peakIdx];
                  const isOverloaded = member.utilization > 100;

                  return (
                    <div 
                      key={mIdx} 
                      className="card p-4 sm:p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs space-y-3.5 hover:border-[var(--color-border)] transition-colors"
                    >
                      {/* Card Header: Avatar, Name, Role, Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                            {member.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-[var(--color-text)] truncate">{member.name}</h4>
                            <p className="text-xs text-[var(--color-text-muted)] truncate">{member.role || 'Unspecified Role'}</p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          {isOverloaded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <AlertTriangle size={12} /> {member.utilization}% Overload
                            </span>
                          ) : member.utilization > 80 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {member.utilization}% Near Cap
                            </span>
                          ) : member.utilization >= 20 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 size={12} /> {member.utilization}% Healthy
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              {member.utilization}% Idle
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Overall workload summary bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
                          <span>Weekly Avg: <strong className="font-mono text-[var(--color-text)]">{member.avgLoad}d</strong>/wk</span>
                          <span>Total: <strong className="font-mono text-[var(--color-text)]">{member.totalLoad.toFixed(1)}d</strong> ({weeks.length}w)</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                          <div 
                            className={clsx(
                              "h-full rounded-full transition-all duration-300",
                              isOverloaded ? "bg-rose-500" : "bg-[var(--color-primary-hex)]"
                            )}
                            style={{ width: `${Math.min(member.utilization, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* 8-Week Touch Strip */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-muted)]">
                          <span>8-Week Timeline Allocation:</span>
                          <span className="text-[10px] text-[var(--color-text-faint)]">Tap week to inspect</span>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                          {member.weeklyEffort.map((effort, wIdx) => {
                            const days = effort.days;
                            const util = effort.utilization;
                            const isSelected = selectedCoords?.memberName === member.name && selectedCoords?.weekIdx === wIdx;
                            const isSpotlighted = enableSpotlight && util >= spotlightThreshold;
                            const weekDate = weeks[wIdx];

                            return (
                              <button
                                key={wIdx}
                                type="button"
                                onClick={() => setSelectedCoords({ memberName: member.name, weekIdx: wIdx })}
                                className={clsx(
                                  "p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer min-h-[52px] relative active:scale-95 group select-none",
                                  getCellColor(days, 'heatmap'),
                                  isSelected 
                                    ? "ring-2 ring-[var(--color-primary-hex)] ring-offset-2 z-10" 
                                    : "border-[var(--color-divider)]",
                                  isSpotlighted && !isSelected && "ring-2 ring-rose-400 ring-offset-1"
                                )}
                                aria-label={`${member.name} Week ${wIdx + 1}: ${days} days, ${util}% utilization, ${effort.tasks.length} tasks`}
                              >
                                <span className="text-[10px] font-semibold opacity-80 leading-none">W{wIdx + 1}</span>
                                <span className="text-xs font-bold font-mono mt-0.5 leading-none">{days}d</span>
                                <div className="flex items-center gap-0.5 mt-1 text-[9px] opacity-75 font-mono leading-none">
                                  <span>{util}%</span>
                                  {effort.tasks.length > 0 && (
                                    <span className="font-bold">({effort.tasks.length})</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Peak Week Action if overloaded */}
                      {isOverloaded && (
                        <div className="pt-1 flex items-center justify-between bg-rose-500/5 border border-rose-500/15 rounded-xl px-3 py-2 text-xs">
                          <span className="text-rose-600 dark:text-rose-400 text-[11px] font-medium flex items-center gap-1.5 truncate">
                            <AlertTriangle size={12} className="shrink-0" />
                            Peak: Wk {peakIdx + 1} ({peakEffort.days}d / {peakEffort.utilization}%)
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedCoords({ memberName: member.name, weekIdx: peakIdx })}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                          >
                            Inspect <ChevronRight size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="card p-12 text-center text-[var(--color-text-muted)]">
                  <Users size={32} className="mx-auto text-[var(--color-text-faint)] mb-2" />
                  <p className="font-bold text-sm text-[var(--color-text)]">No resources found</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Try adjusting your search query or role filter.</p>
                  <button 
                    onClick={() => { setRoleFilter('all'); setSearchQuery(''); }}
                    className="mt-3 text-xs text-[var(--color-primary-hex)] font-semibold underline whitespace-nowrap cursor-pointer"
                  >
                    Reset Filters &amp; Search
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE 2 & 3: CAPACITY GRID TABLE (HEATMAP OR CLASSIC) */
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-divider)] shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)]">
                      <th className="p-3.5 font-bold text-xs text-[var(--color-text-muted)] sticky left-0 bg-[var(--color-surface-2)] z-10 min-w-[130px] sm:w-64 border-r border-[var(--color-divider)]">
                        Team Member
                      </th>
                      {weeks.map((week, idx) => (
                        <th key={idx} className="p-3 font-bold text-xs text-[var(--color-text-muted)] min-w-[90px] border-r border-[var(--color-divider)] text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[var(--color-text)]">Week {idx + 1}</span>
                            <span className="text-[10px] sm:text-xs text-[var(--color-text-faint)] font-mono">
                              {week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="p-3.5 font-bold text-xs text-[var(--color-text-muted)] min-w-[110px] w-36">
                        Average Load
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberLoad.length > 0 ? (
                      memberLoad.map((member, mIdx) => (
                        <tr key={mIdx} className="border-b border-[var(--color-divider)] hover:bg-[var(--color-surface-2)]/60 transition-colors">
                          {/* Member Avatar / Meta details */}
                          <td className="p-3.5 sticky left-0 bg-[var(--color-surface)] z-10 border-r border-[var(--color-divider)]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 flex items-center justify-center font-bold text-xs shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--color-text)] truncate">{member.name}</p>
                                <p className="text-[11px] text-[var(--color-text-muted)] truncate">{member.role || 'Unspecified Role'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Interactive Weekly Blocks */}
                          {member.weeklyEffort.map((effort, wIdx) => {
                            const days = effort.days;
                            const util = effort.utilization;
                            const isSpotlighted = enableSpotlight && util >= spotlightThreshold;
                            const isSelected = selectedCoords?.memberName === member.name && selectedCoords?.weekIdx === wIdx;

                            return (
                              <td 
                                key={wIdx} 
                                onClick={() => setSelectedCoords({ memberName: member.name, weekIdx: wIdx })}
                                className="p-1.5 border-r border-[var(--color-divider)] cursor-pointer select-none"
                              >
                                <div className={clsx(
                                  "h-12 w-full rounded-xl border flex flex-col items-center justify-center transition-all relative overflow-hidden active:scale-95",
                                  getCellColor(days, viewMode),
                                  isSelected ? "ring-2 ring-[var(--color-primary-hex)] ring-offset-1 z-10" : "border-[var(--color-divider)]",
                                  isSpotlighted && !isSelected && "ring-2 ring-rose-400 ring-offset-1"
                                )}>
                                  {viewMode === 'classic' ? (
                                    <>
                                      <span className="text-xs font-semibold font-mono">{days}d</span>
                                      <div className="w-8 h-1 bg-current opacity-25 rounded-full mt-1 overflow-hidden">
                                        <div 
                                          className="h-full bg-current opacity-100" 
                                          style={{ width: `${Math.min(util, 100)}%` }} 
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {heatmapMetric === 'days' && (
                                        <span className="text-xs font-bold font-mono">{days}d</span>
                                      )}
                                      {heatmapMetric === 'percent' && (
                                        <span className="text-xs font-bold font-mono">{util}%</span>
                                      )}
                                      <div className="absolute bottom-1 right-1.5 text-[9px] opacity-60 font-mono">
                                        {effort.tasks.length > 0 && `${effort.tasks.length}t`}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Average load score */}
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between mb-1 text-xs">
                                <span className="font-bold font-mono text-[var(--color-text)]">{member.utilization}%</span>
                                {member.utilization > 100 && (
                                  <span className="text-[11px] font-bold text-rose-500 flex items-center gap-0.5">
                                    <AlertTriangle size={11} /> Over
                                  </span>
                                )}
                                {member.utilization <= 100 && member.utilization > 0 && (
                                  <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                                    <CheckCircle2 size={11} /> Ok
                                  </span>
                                )}
                              </div>
                              <div className="w-full h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                                <div 
                                  className={clsx(
                                    "h-full rounded-full transition-colors",
                                    member.utilization > 100 ? "bg-rose-500" : "bg-[var(--color-primary-hex)]"
                                  )}
                                  style={{ width: `${Math.min(member.utilization, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-[var(--color-text-muted)]">
                          <Users size={28} className="mx-auto text-[var(--color-text-faint)] mb-2" />
                          <p className="font-bold text-xs">No resources found matching active filter scope</p>
                          <button 
                            onClick={() => { setRoleFilter('all'); setSearchQuery(''); }}
                            className="mt-2 text-xs text-[var(--color-primary-hex)] font-semibold underline whitespace-nowrap cursor-pointer"
                          >
                            Reset Filters &amp; Search
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Heatmap Legend */}
          {viewMode !== 'schedule' && (
            <div className="bg-[var(--color-surface)] p-3.5 sm:p-4 rounded-2xl border border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-[var(--color-text)]">Workload Key:</span>
                
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-rose-600"></div>
                  <span className="text-[var(--color-text-muted)] text-[11px]">Overloaded (&gt;100%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500"></div>
                  <span className="text-[var(--color-text-muted)] text-[11px]">High (80-100%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500"></div>
                  <span className="text-[var(--color-text-muted)] text-[11px]">Healthy (20-80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-sky-500/30"></div>
                  <span className="text-[var(--color-text-muted)] text-[11px]">Under-allocated (&lt;20%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)]"></div>
                  <span className="text-[var(--color-text-muted)] text-[11px]">Zero Load (0%)</span>
                </div>
              </div>

              <div className="text-[11px] text-[var(--color-text-faint)]">
                Effort distributes linearly across working days.
              </div>
            </div>
          )}

          {/* Mobile Overview & Advisory (Visible only on mobile below the deck) */}
          <div className="lg:hidden space-y-4 pt-2">
            <div className="border-b border-[var(--color-divider)] pb-2 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <Sparkles size={15} className="text-[var(--color-primary-hex)]" />
                Capacity Alerts & Leveling Advisory
              </h3>
            </div>

            {/* Overloaded Resource Spotlights */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                Overload Alerts ({memberLoad.filter(m => m.utilization > 100).length})
              </div>

              {memberLoad.filter(m => m.utilization > 100).length > 0 ? (
                <div className="space-y-2">
                  {memberLoad.filter(m => m.utilization > 100).map((member, idx) => {
                    const peakIdx = getPeakWeekIndex(member);
                    return (
                      <div key={idx} className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-divider)] flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-[var(--color-text)]">{member.name}</div>
                          <div className="text-[11px] text-[var(--color-text-muted)]">{member.role}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCoords({ memberName: member.name, weekIdx: peakIdx })}
                          className="px-2.5 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer active:scale-95"
                        >
                          Peak Wk {peakIdx + 1} <ChevronRight size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-divider)] text-center text-[var(--color-text-muted)] text-xs">
                  All resources operating within safe capacity limits.
                </div>
              )}
            </div>

            {/* Available Resource Reserves */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                Available Reserves ({memberLoad.filter(m => m.utilization < 40).length})
              </div>

              {memberLoad.filter(m => m.utilization < 40).length > 0 ? (
                <div className="space-y-2">
                  {memberLoad.filter(m => m.utilization < 40).map((member, idx) => (
                    <div key={idx} className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-divider)] flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-[var(--color-text)]">{member.name}</div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">{member.role}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 border border-sky-500/20 text-xs font-bold rounded-md">
                        {member.utilization}% Avg
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-divider)] text-center text-[var(--color-text-muted)] text-xs">
                  All resources are fully utilized.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Selected Cell details & Mitigation Engine Panel (Desktop Sidebar Only) */}
        <div className="hidden lg:flex w-96 border-l border-[var(--color-divider)] bg-[var(--color-surface-2)] shrink-0 overflow-y-auto custom-scroll p-5 flex-col justify-between h-full">
          {selectedActiveCell ? (
            renderAllocationDetailsContent(() => setSelectedCoords(null), false)
          ) : (
            /* General Summary dashboard when no cell is selected on desktop */
            <div className="h-full flex flex-col justify-between space-y-5">
              <div className="space-y-5">
                <div className="border-b border-[var(--color-divider)] pb-3">
                  <h2 className="font-bold text-[var(--color-text)] text-base">Allocation Advisory</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">Workload and reserve metrics</p>
                </div>

                <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] space-y-2 text-center shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center mx-auto mb-1">
                    <Info size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-[var(--color-text)]">Interactive Grid Mode</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                      Select any weekly block inside the capacity matrix or heatmap overlay to inspect individual task intersections.
                    </p>
                  </div>
                </div>

                {/* Overloaded Resource Spotlights */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-rose-500" />
                    Overload Alerts ({memberLoad.filter(m => m.utilization > 100).length})
                  </h3>

                  {memberLoad.filter(m => m.utilization > 100).length > 0 ? (
                    <div className="space-y-2">
                      {memberLoad.filter(m => m.utilization > 100).slice(0, 3).map((member, idx) => {
                        const peakIdx = getPeakWeekIndex(member);
                        return (
                          <div key={idx} className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-divider)] flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-[var(--color-text)]">{member.name}</div>
                              <div className="text-xs text-[var(--color-text-muted)]">{member.role}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedCoords({ memberName: member.name, weekIdx: peakIdx })}
                              className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              Peak Wk {peakIdx + 1} <ChevronRight size={11} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-divider)] text-center text-[var(--color-text-muted)] italic text-xs">
                      All resources operating under safe capacity thresholds.
                    </div>
                  )}
                </div>

                {/* Underutilized Resource Spotlights */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    Available Reserves ({memberLoad.filter(m => m.utilization < 40).length})
                  </h3>

                  {memberLoad.filter(m => m.utilization < 40).length > 0 ? (
                    <div className="space-y-2">
                      {memberLoad.filter(m => m.utilization < 40).slice(0, 3).map((member, idx) => {
                        return (
                          <div key={idx} className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-divider)] flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-[var(--color-text)]">{member.name}</div>
                              <div className="text-xs text-[var(--color-text-muted)]">{member.role}</div>
                            </div>
                            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-500 border border-sky-500/20 text-xs font-semibold rounded-md">
                              {member.utilization}% Avg
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-divider)] text-center text-[var(--color-text-muted)] italic text-xs">
                      All resources are heavily utilized.
                    </div>
                  )}
                </div>

              </div>

              <div className="text-xs text-[var(--color-text-muted)] text-center p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-divider)]">
                Recommendations update automatically as project settings and task assignments change.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE ALLOCATION DETAILS BOTTOM SHEET DRAWER */}
      <AnimatePresence>
        {selectedActiveCell && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedCoords(null)}
            />

            {/* Slide-up Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-h-[85vh] bg-[var(--color-surface)] border-t border-[var(--color-divider)] rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drag Pill Handle */}
              <div className="pt-3 pb-1 shrink-0 flex justify-center">
                <div className="w-12 h-1.5 bg-[var(--color-divider)] rounded-full" />
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
                {renderAllocationDetailsContent(() => setSelectedCoords(null), true)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CapacityView;
