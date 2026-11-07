import React, { useState } from 'react';
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
  Search,
  Filter,
  Sliders,
  ChevronRight,
  Info,
  X,
  Sparkles,
  Clock,
  Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../shared/PageHeader';
import { TaskStatus } from '../../types';
import { daysDiff, getBusinessDays } from '../../utils/projectUtils';

const CapacityView: React.FC = () => {
  const { state, updateSettings } = useProject();
  const { members, tasks, settings } = state;

  // Filter and Interactive state
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'classic' | 'heatmap'>('heatmap');
  const [heatmapMetric, setHeatmapMetric] = useState<'days' | 'percent' | 'none'>('days');
  const [spotlightThreshold, setSpotlightThreshold] = useState<number>(100);
  const [enableSpotlight, setEnableSpotlight] = useState<boolean>(true);
  const [selectedCoords, setSelectedCoords] = useState<{
    memberName: string;
    weekIdx: number;
  } | null>(null);

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
  const getCellColor = (days: number, mode: 'classic' | 'heatmap') => {
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

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden">
      <PageHeader
        icon={BarChart3}
        title="Resource Capacity Planning"
        subtitle="Workload heatmap overlay and team leveling telemetry"
        actions={
          <div className="flex items-center gap-3 bg-[var(--color-surface-2)] p-1 px-3 rounded-xl border border-[var(--color-divider)]">
            <Settings2 size={14} className="text-[var(--color-text-muted)]" />
            <div className="flex items-center gap-3 text-xs divide-x divide-[var(--color-divider)]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[var(--color-text-muted)]">Cap/Wk:</span>
                <input 
                  type="number" 
                  step="0.5"
                  min="1"
                  max="7"
                  value={settings.daysPerWeek}
                  onChange={(e) => updateSettings({ daysPerWeek: parseFloat(e.target.value) })}
                  className="w-10 text-center font-bold text-[var(--color-primary-hex)] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)] py-0.5"
                />
              </div>
              <div className="flex items-center gap-1.5 pl-3">
                <span className="font-semibold text-[var(--color-text-muted)]">Workdays/Wk:</span>
                <input 
                  type="number" 
                  max={7}
                  min={1}
                  value={settings.workDays}
                  onChange={(e) => updateSettings({ workDays: parseInt(e.target.value) })}
                  className="w-10 text-center font-bold text-[var(--color-primary-hex)] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)] py-0.5"
                />
              </div>
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Main interactive grid column */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Active Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">Filtered resources</span>
                <Users size={16} className="text-[var(--color-primary-hex)]" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--color-text)]">{filteredMembers.length} Members</div>
              <div className="mt-1 text-xs text-[var(--color-text-faint)]">Active search scope</div>
            </div>

            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">Filtered utilization</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--color-text)]">
                {Math.round(memberLoad.reduce((acc, m) => acc + m.utilization, 0) / (memberLoad.length || 1))}%
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-faint)]">Average of display scope</div>
            </div>

            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] shadow-sm border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">Overload alert</span>
                <AlertTriangle size={16} className="text-rose-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-500">
                {memberLoad.filter(m => m.utilization > 100).length} Overloaded
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-faint)]">Exceeding 100% capacity</div>
            </div>

            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] shadow-sm border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">Under-utilized scope</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--color-text)]">
                {memberLoad.filter(m => m.utilization < 30).length} Idle
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-faint)]">Under 30% weekly average</div>
            </div>
          </div>

          {/* Controls Bar: Mode Toggles, Filter Pills, Search */}
          <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-1 rounded-lg shrink-0 self-start">
              <button
                onClick={() => setViewMode('classic')}
                className={clsx(
                  "px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                  viewMode === 'classic' 
                    ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                Classic Grid
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={clsx(
                  "px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer",
                  viewMode === 'heatmap' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Layers size={14} />
                Heatmap Overlay
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={clsx(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-colors border cursor-pointer",
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
            <div className="relative w-full md:w-60">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                aria-label="Search resources"
                className="w-full pl-9 pr-4 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

          </div>

          {/* Interactive Heatmap Controls */}
          {viewMode === 'heatmap' && (
            <div className="bg-[var(--color-surface-2)] p-4 rounded-xl border border-[var(--color-divider)] grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 flex items-center gap-3">
                <div className="p-2 bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-primary-hex)] rounded-lg">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[var(--color-text)]">Workload Spotlight Threshold</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Highlight extreme allocations dynamically on the grid</p>
                </div>
              </div>

              {/* Slider input */}
              <div className="md:col-span-4 flex items-center gap-3">
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
                  "font-mono text-xs font-semibold px-2 py-0.5 rounded shrink-0",
                  enableSpotlight ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                )}>
                  {spotlightThreshold}%
                </span>
              </div>

              {/* Toggle controls */}
              <div className="md:col-span-3 flex justify-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableSpotlight}
                    onChange={(e) => setEnableSpotlight(e.target.checked)}
                    className="rounded text-[var(--color-primary-hex)] focus:ring-[var(--color-primary-hex)] h-3.5 w-3.5"
                  />
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">Spotlight</span>
                </label>

                {/* Heatmap metric selectors */}
                <div className="flex items-center gap-1.5 border-l border-[var(--color-divider)] pl-4">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">Metric:</span>
                  <select
                    value={heatmapMetric}
                    onChange={(e: any) => setHeatmapMetric(e.target.value)}
                    aria-label="Heatmap metric display"
                    className="bg-transparent text-xs font-semibold text-[var(--color-text)] focus:outline-none cursor-pointer"
                  >
                    <option value="days">Days</option>
                    <option value="percent">% Util</option>
                    <option value="none">Blank</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Capacity Grid Workspace */}
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-divider)] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)]">
                    <th className="p-3.5 font-semibold text-xs text-[var(--color-text-muted)] sticky left-0 bg-[var(--color-surface-2)] z-10 w-64 border-r border-[var(--color-divider)]">
                      Team Member
                    </th>
                    {weeks.map((week, idx) => (
                      <th key={idx} className="p-3 font-semibold text-xs text-[var(--color-text-muted)] min-w-[100px] border-r border-[var(--color-divider)] text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[var(--color-text)]">Week {idx + 1}</span>
                          <span className="text-xs text-[var(--color-text-faint)] font-mono">
                            {week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="p-3.5 font-semibold text-xs text-[var(--color-text-muted)] w-36">
                      Average Capacity
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
                              <p className="text-xs font-semibold text-[var(--color-text)] truncate">{member.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)] truncate">{member.role || 'Unspecified Role'}</p>
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
                                "h-12 w-full rounded-lg border flex flex-col items-center justify-center transition-colors relative overflow-hidden",
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

                        {/* average load score */}
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1 text-xs">
                              <span className="font-semibold font-mono text-[var(--color-text)]">{member.utilization}%</span>
                              {member.utilization > 100 && (
                                <span className="text-xs font-semibold text-rose-500 flex items-center gap-0.5">
                                  <AlertTriangle size={11} /> Over
                                </span>
                              )}
                              {member.utilization <= 100 && member.utilization > 0 && (
                                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
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
                        <p className="font-semibold text-xs">No resources found matching active filter scope</p>
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

          {/* Heatmap Legend */}
          <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-[var(--color-text)]">Workload Key:</span>
              
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-rose-600"></div>
                <span className="text-[var(--color-text-muted)]">Overloaded (&gt;100%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-amber-500"></div>
                <span className="text-[var(--color-text-muted)]">High (80-100%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-emerald-500"></div>
                <span className="text-[var(--color-text-muted)]">Healthy (20-80%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-sky-500/30"></div>
                <span className="text-[var(--color-text-muted)]">Under-allocated (&lt;20%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)]"></div>
                <span className="text-[var(--color-text-muted)]">Zero Allocation (0%)</span>
              </div>
            </div>

            <div className="text-xs text-[var(--color-text-muted)] text-right">
              Effort distributes linearly across working days in task bounds.
            </div>
          </div>

        </div>

        {/* Selected Cell details & Mitigation Engine Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[var(--color-divider)] bg-[var(--color-surface-2)] shrink-0 overflow-y-auto custom-scroll p-5 flex flex-col justify-between h-auto lg:h-full">
          
          {selectedActiveCell ? (
            <div className="space-y-5">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
                <div>
                  <h2 className="font-bold text-[var(--color-text)] text-base">Week {selectedActiveCell.weekIdx + 1} Analysis</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">Selected allocation details</p>
                </div>
                <button 
                  onClick={() => setSelectedCoords(null)}
                  aria-label="Close allocation details"
                  className="p-1 hover:bg-[var(--color-surface)] rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Resource profile card */}
              <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] space-y-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/20 text-[var(--color-primary-hex)] flex items-center justify-center font-bold text-sm">
                    {selectedActiveCell.memberName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-[var(--color-text)]">{selectedActiveCell.memberName}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{selectedActiveCell.memberRole}</p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--color-divider)] flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">Week Start:</span>
                  <span className="font-mono text-[var(--color-text)]">
                    {selectedActiveCell.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Utilization gauge */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Allocated Workload</span>
                    <span className={clsx(
                      "font-mono font-bold",
                      selectedActiveCell.utilization > 100 ? "text-rose-500" : "text-[var(--color-primary-hex)]"
                    )}>{selectedActiveCell.utilization}% ({selectedActiveCell.days}d / {settings.daysPerWeek}d)</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-colors",
                        selectedActiveCell.utilization > 100 ? "bg-rose-500" : "bg-[var(--color-primary-hex)]"
                      )}
                      style={{ width: `${Math.min(selectedActiveCell.utilization, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Contributing Tasks Module */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                  <Briefcase size={12} className="text-[var(--color-primary-hex)]" />
                  Contributing Tasks ({selectedActiveCell.tasks.length})
                </h3>

                {selectedActiveCell.tasks.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll pr-1">
                    {selectedActiveCell.tasks.map((task, idx) => (
                      <div key={idx} className="bg-[var(--color-surface)] p-3 rounded-lg border border-[var(--color-divider)] space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-[var(--color-text)] text-xs line-clamp-2">
                            {task.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-muted)] shrink-0">
                            {task.priority}
                          </span>
                        </div>

                        {task.module && (
                          <div className="text-xs text-[var(--color-text-muted)]">
                            Module: {task.module}
                          </div>
                        )}

                        <div className="pt-1.5 border-t border-[var(--color-divider)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                          <span>Allocated Effort:</span>
                          <span className="font-mono text-[var(--color-text)]">
                            {task.daysInWeek}d this week ({task.dailyLoad}d/day)
                          </span>
                        </div>

                        <div className="text-xs text-[var(--color-text-faint)] flex items-center gap-1">
                          <Clock size={11} />
                          <span>{task.startDate} to {task.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[var(--color-surface)] p-5 rounded-lg border border-[var(--color-divider)] text-center text-[var(--color-text-muted)] italic text-xs">
                    No active tasks assigned to this resource for this week.
                  </div>
                )}
              </div>

              {/* Resource Leveling Intelligent Recommendation Engine */}
              <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-divider)] space-y-2.5 shadow-sm">
                <h3 className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[var(--color-primary-hex)]" />
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
                    <span>Leveling Candidate:</span>
                    <span className="font-mono text-[var(--color-primary-hex)] font-semibold">
                      {alternativeResource.name} ({alternativeResource.weekUtil}%)
                    </span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* General Summary dashboard when no cell is selected */
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
    </div>
  );
};

export default CapacityView;
