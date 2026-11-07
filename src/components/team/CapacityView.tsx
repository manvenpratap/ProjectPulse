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
      if (pct > 100) return 'bg-rose-50 text-rose-700 border-rose-200';
      if (pct > 80) return 'bg-amber-50 text-amber-700 border-amber-200';
      if (pct > 20) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      return 'bg-slate-50 text-slate-500 border-slate-100';
    } else {
      // Heatmap view: Solid saturated blocks
      if (pct === 0) return 'bg-slate-50 text-slate-300 border-slate-100/50 hover:bg-slate-100';
      if (pct < 20) return 'bg-sky-100/70 text-sky-800 border-sky-150 hover:bg-sky-200/60';
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
      {/* Header */}
      <div className="p-6 border-b border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">Resource Capacity Planning</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Color-coded workload heatmap overlay &amp; task leveling engine</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Settings Console */}
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-150">
            <Settings2 size={14} className="text-slate-400" />
            <div className="flex items-center gap-3 text-xs divide-x divide-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-500">Cap/Wk</span>
                <input 
                  type="number" 
                  step="0.5"
                  min="1"
                  max="7"
                  value={settings.daysPerWeek}
                  onChange={(e) => updateSettings({ daysPerWeek: parseFloat(e.target.value) })}
                  className="w-10 text-center font-black text-indigo-600 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 py-0.5"
                />
              </div>
              <div className="flex items-center gap-1.5 pl-3">
                <span className="font-bold text-slate-500">Workdays/Wk</span>
                <input 
                  type="number" 
                  max={7}
                  min={1}
                  value={settings.workDays}
                  onChange={(e) => updateSettings({ workDays: parseInt(e.target.value) })}
                  className="w-10 text-center font-black text-indigo-600 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 py-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Main interactive grid column */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-6">
          
          {/* Active Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtered Resources</span>
                <Users size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-slate-800">{filteredMembers.length} Members</div>
              <div className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active search scope</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtered Utilization</span>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {Math.round(memberLoad.reduce((acc, m) => acc + m.utilization, 0) / (memberLoad.length || 1))}%
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Avg of display scope</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Overload Alert</span>
                <AlertTriangle size={16} className="text-rose-500 animate-pulse" />
              </div>
              <div className="text-2xl font-black text-rose-700">
                {memberLoad.filter(m => m.utilization > 100).length} Overloaded
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Exceeding 100% capacity</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-sm border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Under-Utilized Scope</span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-800">
                {memberLoad.filter(m => m.utilization < 30).length} Idle
              </div>
              <div className="mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">Under 30% weekly average</div>
            </div>
          </div>

          {/* Controls Bar: Mode Toggles, Filter Pills, Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start">
              <button
                onClick={() => setViewMode('classic')}
                className={clsx(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  viewMode === 'classic' 
                    ? "bg-white text-slate-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Classic Grid
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={clsx(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5",
                  viewMode === 'heatmap' 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
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
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border",
                    roleFilter === role 
                      ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {role === 'all' ? 'All Roles' : role}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-60">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

          </div>

          {/* Interactive Heatmap Controls (Only shown in Heatmap Mode) */}
          {viewMode === 'heatmap' && (
            <div className="bg-gradient-to-r from-indigo-50/50 to-sky-50/30 p-4 rounded-2xl border border-indigo-100/50 grid grid-cols-1 md:grid-cols-12 gap-4 items-center animate-fade-in">
              <div className="md:col-span-5 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sliders size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">Workload Spotlight Threshold</h4>
                  <p className="text-[10px] text-slate-400">Highlight extreme allocations dynamically on the grid</p>
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
                  className={clsx(
                    "w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 bg-slate-200",
                    !enableSpotlight && "opacity-40 cursor-not-allowed"
                  )}
                />
                <span className={clsx(
                  "font-mono text-xs font-black px-2 py-0.5 rounded shrink-0",
                  enableSpotlight ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"
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
                    className="rounded text-indigo-650 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span className="text-[10px] font-black uppercase text-slate-500">Spotlight</span>
                </label>

                {/* Heatmap metric selectors */}
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                  <span className="text-[9px] font-black uppercase text-slate-400">Metric:</span>
                  <select
                    value={heatmapMetric}
                    onChange={(e: any) => setHeatmapMetric(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase tracking-wider text-slate-600 focus:outline-none cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-150">
                    <th className="p-4 font-black text-xs text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-10 w-64 border-r border-slate-150">
                      Team Member
                    </th>
                    {weeks.map((week, idx) => (
                      <th key={idx} className="p-4 font-black text-[10px] text-slate-400 uppercase tracking-wider min-w-[110px] border-r border-slate-150 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-600">WEEK {idx + 1}</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5 font-mono">
                            {week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="p-4 font-black text-xs text-slate-500 uppercase tracking-wider w-36">
                      Average Capacity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {memberLoad.length > 0 ? (
                    memberLoad.map((member, mIdx) => (
                      <tr key={mIdx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        {/* Member Avatar / Meta details */}
                        <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-150">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-150 shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-800 leading-tight truncate">{member.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider truncate">{member.role || 'Unspecified Role'}</p>
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
                              className={clsx(
                                "p-2 border-r border-slate-100 cursor-pointer transition-all relative select-none"
                              )}
                            >
                              <div className={clsx(
                                "h-14 w-full rounded-xl border flex flex-col items-center justify-center transition-all duration-250 relative overflow-hidden",
                                getCellColor(days, viewMode),
                                isSelected ? "ring-2 ring-indigo-600 ring-offset-1 scale-95 z-10" : "border-slate-100",
                                isSpotlighted && !isSelected && "ring-2 ring-red-400 ring-offset-1 animate-pulse-subtle"
                              )}>
                                {viewMode === 'classic' ? (
                                  <>
                                    <span className="text-xs font-black">{days}d</span>
                                    <div className="w-8 h-1 bg-current opacity-25 rounded-full mt-1.5 overflow-hidden">
                                      <div 
                                        className="h-full bg-current opacity-100" 
                                        style={{ width: `${Math.min(util, 100)}%` }} 
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {heatmapMetric === 'days' && (
                                      <span className="text-xs font-black tracking-tight">{days}d</span>
                                    )}
                                    {heatmapMetric === 'percent' && (
                                      <span className="text-[10px] font-black tracking-tight">{util}%</span>
                                    )}
                                    {/* Saturated Micro visual indicators */}
                                    <div className="absolute bottom-1 right-1.5 text-[7px] font-black opacity-50 font-mono">
                                      {effort.tasks.length > 0 && `${effort.tasks.length}t`}
                                    </div>
                                    {isSpotlighted && (
                                      <div className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* average load score */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between mb-1 text-xs">
                              <span className="font-black text-slate-700">{member.utilization}%</span>
                              {member.utilization > 100 && (
                                <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-0.5">
                                  <AlertTriangle size={10} /> OVER
                                </span>
                              )}
                              {member.utilization <= 100 && member.utilization > 0 && (
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-0.5">
                                  <CheckCircle2 size={10} /> OK
                                </span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={clsx(
                                  "h-full rounded-full transition-all duration-500",
                                  member.utilization > 100 ? "bg-rose-500" : "bg-indigo-650"
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
                      <td colSpan={10} className="p-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="font-black text-sm uppercase tracking-wide">No resources found matching active filter scope</p>
                        <button 
                          onClick={() => { setRoleFilter('all'); setSearchQuery(''); }}
                          className="mt-3 text-xs text-indigo-600 font-bold underline hover:text-indigo-800"
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
          <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Workload Key:</span>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-rose-600 border border-rose-700"></div>
                <span className="text-slate-500 font-bold">Overloaded (&gt;100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-amber-500 border border-amber-600"></div>
                <span className="text-slate-500 font-bold">High (80-100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-emerald-500 border border-emerald-600"></div>
                <span className="text-slate-500 font-bold">Perfect (20-80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-sky-100 border border-sky-200"></div>
                <span className="text-slate-500 font-bold">Under-allocated (&lt;20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-slate-50 border border-slate-100"></div>
                <span className="text-slate-500 font-bold">Zero Allocation (0%)</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-mono text-right leading-tight max-w-sm">
              *Effort values distribute linearly across standard workdays inside start-to-end task bounds.
            </div>
          </div>

        </div>

        {/* Selected Cell details & Mitigation Engine Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 shrink-0 overflow-y-auto custom-scroll p-6 flex flex-col justify-between h-auto lg:h-full">
          
          {selectedActiveCell ? (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Selected Allocation Details</div>
                  <h3 className="font-black text-slate-800 text-lg mt-1">Week {selectedActiveCell.weekIdx + 1} Analysis</h3>
                </div>
                <button 
                  onClick={() => setSelectedCoords(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Resource profile card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-700 flex items-center justify-center font-black text-base uppercase">
                    {selectedActiveCell.memberName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 leading-tight">{selectedActiveCell.memberName}</h4>
                    <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-wider">{selectedActiveCell.memberRole}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 font-bold">Week Start:</div>
                  <div className="font-mono font-black text-slate-700">
                    {selectedActiveCell.weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Utilization gauge */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Allocated Workload</span>
                    <span className={clsx(
                      "font-mono font-black",
                      selectedActiveCell.utilization > 100 ? "text-rose-600" : "text-indigo-650"
                    )}>{selectedActiveCell.utilization}% ({selectedActiveCell.days}d / {settings.daysPerWeek}d)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-300",
                        selectedActiveCell.utilization > 100 ? "bg-rose-500 animate-pulse" : "bg-indigo-600"
                      )}
                      style={{ width: `${Math.min(selectedActiveCell.utilization, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Contributing Tasks Module */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Briefcase size={12} className="text-slate-400" />
                  Contributing Tasks ({selectedActiveCell.tasks.length})
                </h4>

                {selectedActiveCell.tasks.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto custom-scroll pr-1">
                    {selectedActiveCell.tasks.map((task, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-150 space-y-2 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-slate-800 text-xs leading-tight line-clamp-2">
                            {task.name}
                          </span>
                          <span className={clsx(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0",
                            task.priority === 'high' ? "bg-red-50 text-red-700" :
                            task.priority === 'medium' ? "bg-amber-50 text-amber-700" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            {task.priority}
                          </span>
                        </div>

                        {task.module && (
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            Module: {task.module}
                          </div>
                        )}

                        {/* intersection days count */}
                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-bold">Allocated Effort:</span>
                          <span className="font-mono font-black text-slate-700">
                            {task.daysInWeek} days this week ({task.dailyLoad}d/day)
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock size={10} />
                          <span>{task.startDate} to {task.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 italic text-xs">
                    No active tasks assigned to this resource for this week period
                  </div>
                )}
              </div>

              {/* Resource Leveling Intelligent Recommendation Engine */}
              <div className="bg-gradient-to-br from-indigo-50 to-sky-50 p-4 rounded-2xl border border-indigo-100 space-y-3 shadow-inner">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600 animate-spin-slow" />
                  Allocation Advisory
                </h4>
                
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {selectedActiveCell.utilization > 100 ? (
                    <>
                      <strong className="text-rose-700">ALERT: Critical Over-Allocation detected. </strong>
                      {selectedActiveCell.memberName} is overloaded by {selectedActiveCell.utilization - 100}% this week. 
                      This poses high delivery risk for {selectedActiveCell.tasks[0]?.name || 'active tasks'}. 
                      {alternativeResource ? (
                        <span> We highly recommend transferring backlog tasks to <strong className="text-indigo-900">{alternativeResource.name}</strong>, who has {settings.daysPerWeek - alternativeResource.weekLoad} days of spare capacity in week {selectedActiveCell.weekIdx + 1}.</span>
                      ) : (
                        <span> We recommend adjusting upcoming milestone timeline structures to lower task overlaps.</span>
                      )}
                    </>
                  ) : selectedActiveCell.utilization > 80 ? (
                    <>
                      <strong className="text-amber-700">HEAVY WORKLOAD. </strong>
                      {selectedActiveCell.memberName} is operating at high efficiency this week ({selectedActiveCell.utilization}%). 
                      Watch out for feature delivery roadblocks or spillover. Capacity is nearly saturated.
                    </>
                  ) : selectedActiveCell.utilization > 20 ? (
                    <>
                      <strong className="text-emerald-700">IDEAL ALLOCATION. </strong>
                      Workload is perfectly aligned within healthy boundaries ({selectedActiveCell.utilization}%). 
                      Optimal productivity with standard buffer space.
                    </>
                  ) : (
                    <>
                      <strong className="text-sky-700">UNDER-ALLOCATION. </strong>
                      {selectedActiveCell.memberName} is currently under-utilized ({selectedActiveCell.utilization}%). 
                      {alternativeResource && (
                        <span> Consider routing backlog queue tickets or unassigned items to leverage their open capacity and boost overall velocity.</span>
                      )}
                    </>
                  )}
                </p>

                {alternativeResource && selectedActiveCell.utilization > 100 && (
                  <div className="pt-2 mt-2 border-t border-indigo-150 text-[10px] font-bold text-indigo-800 flex items-center justify-between">
                    <span>Optimal leveler candidate:</span>
                    <span className="font-mono bg-indigo-100/50 px-2 py-0.5 rounded">
                      {alternativeResource.name} ({alternativeResource.weekUtil}% load)
                    </span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* General Summary dashboard when no cell is selected */
            <div className="h-full flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Interactive Analysis</div>
                  <h3 className="font-black text-slate-800 text-lg mt-1">Allocation Advisory</h3>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-1">
                    <Info size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">Interactive Grid Mode</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Click any weekly cell inside the capacity grid or heatmap overlay to invoke real-time bottleneck diagnostic advisors.
                    </p>
                  </div>
                </div>

                {/* Overloaded Resource Spotlights */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-rose-500" />
                    Top Resource Alerts ({memberLoad.filter(m => m.utilization > 100).length})
                  </h4>

                  {memberLoad.filter(m => m.utilization > 100).length > 0 ? (
                    <div className="space-y-2">
                      {memberLoad.filter(m => m.utilization > 100).slice(0, 3).map((member, idx) => {
                        const peakIdx = getPeakWeekIndex(member);
                        return (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors">
                            <div>
                              <div className="text-xs font-black text-slate-800">{member.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{member.role}</div>
                            </div>
                            <button
                              onClick={() => setSelectedCoords({ memberName: member.name, weekIdx: peakIdx })}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 border border-rose-150 transition-colors"
                            >
                              Peak Wk {peakIdx + 1} <ChevronRight size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 italic text-xs">
                      All team resources are operating under safe capacity thresholds!
                    </div>
                  )}
                </div>

                {/* Underutilized Resource Spotlights */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Available Resource Reserves ({memberLoad.filter(m => m.utilization < 40).length})
                  </h4>

                  {memberLoad.filter(m => m.utilization < 40).length > 0 ? (
                    <div className="space-y-2">
                      {memberLoad.filter(m => m.utilization < 40).slice(0, 3).map((member, idx) => {
                        return (
                          <div key={idx} className="bg-white p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-black text-slate-800">{member.name}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">{member.role}</div>
                            </div>
                            <span className="px-2 py-0.5 bg-sky-50 text-sky-700 text-[9px] font-black rounded-lg border border-sky-150">
                              {member.utilization}% Avg
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 italic text-xs">
                      All display scope resources are heavily utilized.
                    </div>
                  )}
                </div>

              </div>

              <div className="text-[10px] text-slate-400 italic leading-relaxed text-center p-3 bg-white rounded-xl border border-slate-150">
                Tip: Dynamic recommendations update automatically as you refine project settings or change team roles.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CapacityView;
