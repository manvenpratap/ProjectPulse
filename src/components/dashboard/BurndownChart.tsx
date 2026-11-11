import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  ComposedChart,
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TaskStatus } from '../../types';
import { getWeekNumber } from '../../utils/projectUtils';
import { 
  Zap, 
  TrendingUp, 
  Sliders, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Activity, 
  Info,
  Maximize2
} from 'lucide-react';
import clsx from 'clsx';

const BurndownChart: React.FC = () => {
  const { state } = useProject();
  const { tasks = [], log = [] } = state;

  const [viewTab, setViewTab] = useState<'combined' | 'cfd'>('combined');
  
  // Simulation States
  const [velocityMultiplier, setVelocityMultiplier] = useState<number>(1.0);
  const [scopeBuffer, setScopeBuffer] = useState<number>(0); // 0% to 50% extra scope simulation

  // 1. Core Timeline Calculations
  const timelineRange = useMemo(() => {
    const startDates = tasks.map(t => new Date(t.startDate)).filter(d => !isNaN(d.getTime()));
    const endDates = tasks.map(t => new Date(t.dueDate)).filter(d => !isNaN(d.getTime()));
    
    const start = startDates.length ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date();
    // Default 30 days project length if empty
    const end = endDates.length ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date(start.getTime() + 30 * 864e5);
    
    // Fallback if dates match
    if (start.getTime() === end.getTime()) {
      end.setDate(end.getDate() + 15);
    }

    return { start, end };
  }, [tasks]);

  // 2. Generate Interactive Combined Burnup & Burndown Data
  const combinedChartData = useMemo(() => {
    const { start, end } = timelineRange;
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 864e5) || 10;
    
    // We want 10 clean plotting intervals
    const numPoints = 11;
    const intervalDays = totalDays / (numPoints - 1);
    
    const totalActualEffort = tasks.reduce((sum, t) => sum + (t.estDays || 3), 0);
    const completedEffort = tasks
      .filter(t => t.status === TaskStatus.COMPLETED)
      .reduce((sum, t) => sum + (t.estDays || 3), 0);

    const now = new Date();
    const dataPoints = [];

    for (let i = 0; i < numPoints; i++) {
      const currentDayOffset = i * intervalDays;
      const currentPointDate = new Date(start.getTime() + currentDayOffset * 864e5);
      const isFuture = currentPointDate > now;

      // Real historical data
      const tasksCreatedBefore = tasks.filter(t => {
        const tStart = new Date(t.startDate);
        return isNaN(tStart.getTime()) || tStart <= currentPointDate;
      });

      // Scope creep ceiling (increases if scopeBuffer is active or over time naturally)
      const baseScope = tasksCreatedBefore.reduce((sum, t) => sum + (t.estDays || 3), 0);
      const scopeSimulated = isFuture 
        ? Math.round(baseScope * (1 + scopeBuffer / 100))
        : baseScope;

      // Completed effort
      let completedSimulated = 0;
      if (!isFuture) {
        // Real historical completions
        completedSimulated = tasksCreatedBefore
          .filter(t => {
            if (t.status !== TaskStatus.COMPLETED) return false;
            const compDate = t.actCompletionDate ? new Date(t.actCompletionDate) : new Date(t.updatedAt || t.dueDate);
            return !isNaN(compDate.getTime()) && compDate <= currentPointDate;
          })
          .reduce((sum, t) => sum + (t.estDays || 3), 0);
      } else {
        // Forecasted completion with velocity multiplier
        const prevPoint = dataPoints[i - 1];
        const lastRealCompleted = prevPoint ? prevPoint.completed : completedEffort;
        
        // Dynamic simulated increment
        const daysStep = intervalDays;
        const averageDailyVelocity = totalActualEffort > 0 ? (completedEffort / Math.max(1, totalDays * 0.5)) : 1.2;
        const forecastedIncrease = averageDailyVelocity * velocityMultiplier * daysStep;
        
        completedSimulated = Math.min(scopeSimulated, Math.round(lastRealCompleted + forecastedIncrease));
      }

      // Burndown remaining effort (remaining = scope - completed)
      const remainingSimulated = Math.max(0, scopeSimulated - completedSimulated);

      // Ideal standard paths (independent of simulation for baseline comparison)
      const idealRemaining = Math.max(0, Math.round(totalActualEffort - (totalActualEffort / (numPoints - 1)) * i));
      const idealCompleted = Math.min(totalActualEffort, Math.round((totalActualEffort / (numPoints - 1)) * i));

      dataPoints.push({
        dayLabel: `Pt ${i}`,
        dateLabel: currentPointDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        scope: scopeSimulated,
        completed: completedSimulated,
        remaining: remainingSimulated,
        idealRemaining: idealRemaining,
        idealCompleted: idealCompleted,
        isForecast: isFuture
      });
    }

    return dataPoints;
  }, [tasks, timelineRange, velocityMultiplier, scopeBuffer]);

  // 3. Generate Cumulative Flow Diagram Stacks
  const cfdData = useMemo(() => {
    const last8Weeks = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i * 7);
        last8Weeks.push({
            label: `W${getWeekNumber(d)}`,
            date: d
        });
    }

    const statuses = [TaskStatus.COMPLETED, TaskStatus.UNDER_REVIEW, TaskStatus.IN_PROGRESS, TaskStatus.ON_HOLD, TaskStatus.NOT_STARTED];
    
    return last8Weeks.map(w => {
        const point: any = { name: w.label };
        statuses.forEach(s => {
            point[s] = tasks.filter(t => {
                const taskAtPoint = (new Date(t.createdAt) <= w.date);
                if (!taskAtPoint) return false;
                
                // Track historical status via telemetry logs
                const logs = log.filter(l => l.taskId === t.id && l.action === 'Status Changed' && new Date(l.ts) <= w.date);
                if (logs.length > 0) {
                    const latest = logs.sort((a,b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())[0];
                    return latest.newVal === s;
                }
                
                return t.status === s;
            }).length;
        });
        return point;
    });
  }, [tasks, log]);

  // 4. Summarized Metrics Calculations
  const summaryMetrics = useMemo(() => {
    const totalScopeEffort = tasks.reduce((sum, t) => sum + (t.estDays || 3), 0);
    const completedEffort = tasks
      .filter(t => t.status === TaskStatus.COMPLETED)
      .reduce((sum, t) => sum + (t.estDays || 3), 0);
    
    const baseRemaining = Math.max(0, totalScopeEffort - completedEffort);
    const currentVelocity = completedEffort > 0 ? (completedEffort / Math.max(1, tasks.filter(t => t.status === TaskStatus.COMPLETED).length)) : 3.0;
    
    // Forecast remaining days to complete based on current/simulated velocity
    const simulatedDailyVelocity = (currentVelocity / 5) * velocityMultiplier; // assume average task is 5 days
    const daysToFinish = simulatedDailyVelocity > 0 ? Math.ceil(baseRemaining / simulatedDailyVelocity) : Infinity;
    
    const today = new Date();
    const forecastedFinishDate = new Date(today.getTime() + (daysToFinish === Infinity ? 365 : daysToFinish) * 864e5);
    
    // Efficiency delta
    const actualProgressRatio = totalScopeEffort > 0 ? completedEffort / totalScopeEffort : 0;
    const isAhead = velocityMultiplier >= 1.2 || actualProgressRatio > 0.6;

    return {
      totalScopeEffort,
      completedEffort,
      baseRemaining,
      daysToFinish,
      forecastedFinishDate,
      isAhead,
      simulatedDailyVelocity
    };
  }, [tasks, velocityMultiplier]);

  // Custom polished Tooltip component for Recharts
  const CustomCombinedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isForecast = payload[0]?.payload?.isForecast;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-xl text-xs space-y-2 max-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
            <span className="font-bold text-slate-400">{payload[0]?.payload?.dateLabel}</span>
            {isForecast && (
              <span className="px-1.5 py-0.5 bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] text-[10px] font-medium rounded">Forecasted</span>
            )}
          </div>
          <div className="space-y-1">
            {payload.map((p: any, idx: number) => {
              if (!p.value) return null;
              return (
                <div key={idx} className="flex justify-between items-center gap-6">
                  <span className="flex items-center gap-1.5 text-slate-350">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
                    {p.name}:
                  </span>
                  <span className="font-semibold text-slate-100">{p.value} Days</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Dynamic Simulation Metrics Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        
        {/* Metric 1 */}
        <div className="card p-4 sm:p-6 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]/70 transition-colors duration-150 flex flex-col justify-between border border-[var(--color-divider)]">
          <div>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Baseline Effort Scope</span>
            <div className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] mt-1">
              {summaryMetrics.totalScopeEffort} <span className="text-xs font-bold text-[var(--color-text-faint)] font-sans">Days</span>
            </div>
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] mt-3 flex items-center gap-1.5">
            <Info size={12} className="text-[var(--color-primary-hex)] shrink-0" />
            <span>Cumulative weight of tasks</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card p-4 sm:p-6 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]/70 transition-colors duration-150 flex flex-col justify-between border border-[var(--color-divider)]">
          <div>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Total Completed</span>
            <div className="text-2xl sm:text-3xl font-display font-black text-emerald-500 mt-1">
              {summaryMetrics.completedEffort} <span className="text-xs font-bold text-[var(--color-text-faint)] font-sans">Days</span>
            </div>
          </div>
          <div className="text-[10px] text-emerald-500 mt-3 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} className="shrink-0" />
            <span>{Math.round((summaryMetrics.completedEffort / (summaryMetrics.totalScopeEffort || 1)) * 100)}% Scope Burned</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card p-4 sm:p-6 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]/70 transition-colors duration-150 flex flex-col justify-between border border-[var(--color-divider)]">
          <div>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Active Backlog</span>
            <div className="text-2xl sm:text-3xl font-display font-black text-[var(--color-primary-hex)] mt-1">
              {summaryMetrics.baseRemaining} <span className="text-xs font-bold text-[var(--color-text-faint)] font-sans">Days</span>
            </div>
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
            <Activity size={12} className="text-[var(--color-primary-hex)] shrink-0" />
            <span>Remaining effort pending delivery</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card p-4 sm:p-6 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]/70 transition-colors duration-150 flex flex-col justify-between border border-[var(--color-divider)]">
          <div>
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Simulated Target Date</span>
            <div className="text-lg sm:text-xl font-display font-black text-[var(--color-text)] mt-2 truncate">
              {summaryMetrics.daysToFinish === Infinity ? 'Indefinite' : summaryMetrics.forecastedFinishDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div className="mt-3">
            <span className={clsx(
              "px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1.5",
              summaryMetrics.isAhead ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            )}>
              {summaryMetrics.isAhead ? (
                <>
                  <CheckCircle2 size={12} />
                  <span>Ahead / On Schedule</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} />
                  <span>Action Advised</span>
                </>
              )}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Double Split Card: Simulation Sliders Left & Unified Interactive Chart Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Interactive Controls & PM Forecast Notes (Left Columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sliders Box */}
          <div className="card p-6 border border-slate-150 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Sliders size={16} className="text-[var(--color-primary-hex)]" />
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Telemetry Simulator</h4>
            </div>

            {/* Velocity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Resource Delivery Velocity</span>
                <span className="text-xs font-semibold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded">{velocityMultiplier.toFixed(1)}×</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value={velocityMultiplier} 
                onChange={(e) => setVelocityMultiplier(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-hex)]"
              />
              <p className="text-[10px] text-slate-400 leading-tight">Simulates productivity gains/losses (e.g., adding developers or QA blocks).</p>
            </div>

            {/* Scope Creep Buffer Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-500">Scope Expansion Buffer</span>
                <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded">+{scopeBuffer}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="5" 
                value={scopeBuffer} 
                onChange={(e) => setScopeBuffer(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[10px] text-slate-400 leading-tight">Injects scope creep buffer into remaining forecasted sprint milestones.</p>
            </div>
          </div>

          {/* PM Forecast AI Commentary */}
          <div className="card p-6 bg-[var(--color-surface-2)] border border-[var(--color-divider)] space-y-4">
            <h5 className="text-sm font-semibold text-[var(--color-primary-hex)] flex items-center gap-1.5">
              <TrendingUp size={14} /> Forecast Insights
            </h5>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-hex)] mt-1.5 shrink-0" />
                <p className="text-slate-650 leading-relaxed">
                  Based on simulated velocity of <span className="font-bold text-[var(--color-primary-hex)]">{(summaryMetrics.simulatedDailyVelocity * 5).toFixed(1)} tasks/week</span>, completion is anticipated in <span className="font-bold text-slate-900">{summaryMetrics.daysToFinish} days</span>.
                </p>
              </div>

              {scopeBuffer > 0 ? (
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-450 mt-1.5 shrink-0 motion-safe:animate-pulse" />
                  <p className="text-slate-650 leading-relaxed">
                    Scope expansion of <span className="font-bold text-rose-600">+{scopeBuffer}%</span> raises the ceiling by <span className="font-bold text-slate-900">{Math.round(summaryMetrics.totalScopeEffort * (scopeBuffer / 100))} Days</span> of effort, delaying original target date.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <p className="text-slate-650 leading-relaxed">
                    Scope is currently locked with <span className="font-bold text-emerald-600">0% creep</span>. Standard parameters apply.
                  </p>
                </div>
              )}

              <div className="flex gap-2 items-start p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--color-text-muted)] leading-normal">
                  {velocityMultiplier < 1.0 
                    ? "Warning: Sluggish velocity triggers backlog stacking. We advise removing blocking architecture defects." 
                    : "High-velocity metrics confirm stable agile deployment flow. Ready for production release train."}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Composed Area/Line Chart Wrapper (Right Columns) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="card p-4 sm:p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
            
            {/* Tab selection header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[var(--color-divider)]">
              <div>
                <h3 className="font-bold text-base text-[var(--color-text)] leading-tight">Advanced Analytics Composites</h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Real-time projection &amp; process flow matrices</p>
              </div>

              <div className="flex bg-[var(--color-surface-2)] border border-[var(--color-divider)] p-1 rounded-xl">
                <button 
                  onClick={() => setViewTab('combined')}
                  className={clsx(
                    "px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50",
                    viewTab === 'combined' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  Burnup / Burndown
                </button>
                <button 
                  onClick={() => setViewTab('cfd')}
                  className={clsx(
                    "px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-colors duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50",
                    viewTab === 'cfd' ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  Cumulative Flow
                </button>
              </div>
            </div>

            {/* Render Tab 1: Combined composed chart */}
            {viewTab === 'combined' && (
              <div className="h-80 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" />
                    <XAxis 
                      dataKey="dateLabel" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                      label={{ value: 'Effort (Days)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}}
                    />
                    <ChartTooltip content={<CustomCombinedTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}
                    />
                    
                    {/* Burnup Elements */}
                    <Area 
                      type="monotone" 
                      dataKey="scope" 
                      stroke="#cbd5e1" 
                      fill="#f1f5f9" 
                      fillOpacity={0.6}
                      name="Total Scope Ceiling" 
                      strokeWidth={1.5}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 1 }}
                      name="Completed Effort (Burnup)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="idealCompleted" 
                      stroke="#34d399" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      dot={false}
                      name="Ideal Burnup Target" 
                    />

                    {/* Burndown Elements */}
                    <Line 
                      type="monotone" 
                      dataKey="remaining" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#6366f1', strokeWidth: 1 }}
                      name="Remaining Backlog (Burndown)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="idealRemaining" 
                      stroke="#a5b4fc" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      dot={false}
                      name="Ideal Burndown Path" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Render Tab 2: CFD area stack */}
            {viewTab === 'cfd' && (
              <div className="h-80 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cfdData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                      label={{ value: 'Task Volume', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}}
                    />
                    <ChartTooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-surface-raised)', 
                        border: 'none',
                        borderRadius: '12px',
                        color: 'var(--color-text-primary)',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey={TaskStatus.COMPLETED as string} stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.65} name="Completed" />
                    <Area type="monotone" dataKey={TaskStatus.UNDER_REVIEW as string} stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} name="In Review" />
                    <Area type="monotone" dataKey={TaskStatus.IN_PROGRESS as string} stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} name="In Progress" />
                    <Area type="monotone" dataKey={TaskStatus.ON_HOLD as string} stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="On Hold" />
                    <Area type="monotone" dataKey={TaskStatus.NOT_STARTED as string} stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} name="To Do" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bottom info banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[var(--color-text-muted)] font-medium gap-2 pt-2 border-t border-slate-100">
               <span className="flex items-center gap-1">
                 <Calendar size={12} className="text-slate-400" />
                 Baseline Scope Period: {timelineRange.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to {timelineRange.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               </span>
               <span className="text-slate-400">
                 Telemetry Mode: Active
               </span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default BurndownChart;
