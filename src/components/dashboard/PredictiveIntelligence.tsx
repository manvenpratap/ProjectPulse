import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { TaskStatus, TaskPriority } from '../../types';
import { daysDiff, getWeekNumber, todayStr } from '../../utils/projectUtils';
import { 
  Zap, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Target,
  BarChart2,
  Lock,
  Clock
} from 'lucide-react';
import clsx from 'clsx';

const PredictiveIntelligence: React.FC = () => {
  const { state } = useProject();
  const { tasks, log, members } = state;

  // 1. Predictive Completion (ETA)
  const remTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);
  
  // Calculate average weekly velocity over last 4 weeks
  const last4w = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - (i * 7));
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - (d.getDay() || 7) + 1);
    weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23,59,59,999);
    
    const doneCount = log.filter(l => 
      l.action === 'Status Changed' && 
      l.newVal === TaskStatus.COMPLETED && 
      new Date(l.ts) >= weekStart && 
      new Date(l.ts) <= weekEnd
    ).length;
    last4w.push(doneCount);
  }
  
  const avgVel = last4w.reduce((s, v) => s + v, 0) / 4 || 1;
  const weeksRem = avgVel > 0 ? (remTasks.length / avgVel) : 0;
  const forecastDate = new Date();
  forecastDate.setDate(now.getDate() + Math.round(weeksRem * 7));

  // 2. Slippage Risk (Progress vs Time Elapsed)
  const modules = Array.from(new Set(tasks.map(t => t.module).filter(Boolean)));
  const slippageData = modules.map(m => {
    const mTasks = tasks.filter(t => t.module === m && t.status !== TaskStatus.CANCELLED);
    if (!mTasks.length) return null;
    
    const avgProg = mTasks.reduce((s, t) => s + (t.progress || 0), 0) / mTasks.length;
    const startDates = mTasks.map(t => new Date(t.startDate)).filter(d => !isNaN(d.getTime()));
    const endDates = mTasks.map(t => new Date(t.dueDate)).filter(d => !isNaN(d.getTime()));
    
    if (!startDates.length || !endDates.length) return null;
    
    const minStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const maxEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
    
    const totalDur = Math.max(1, (maxEnd.getTime() - minStart.getTime()) / 864e5);
    const elapsed = Math.max(0, (now.getTime() - minStart.getTime()) / 864e5);
    const timePct = Math.min(100, (elapsed / totalDur) * 100);
    const gap = timePct - avgProg;
    
    return { name: m, gap, progress: avgProg, timePct };
  }).filter(Boolean) as { name: string, gap: number, progress: number, timePct: number }[];

  const highSlip = slippageData.sort((a, b) => b.gap - a.gap).slice(0, 3);

  // 3. Resource Bottlenecks
  const blockingCounts: Record<string, number> = {};
  members.forEach(m => blockingCounts[m.name] = 0);
  tasks.forEach(t => {
    if (t.dependsOn && t.dependsOn.length) {
      t.dependsOn.forEach(depId => {
        const depTask = tasks.find(x => x.id === depId);
        if (depTask && depTask.assignee && depTask.status !== TaskStatus.COMPLETED) {
          blockingCounts[depTask.assignee] = (blockingCounts[depTask.assignee] || 0) + 1;
        }
      });
    }
  });
  const bottlenecks = Object.entries(blockingCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-indigo-500 motion-safe:animate-pulse" />
        <h2 className="text-xl font-bold font-display tracking-tight text-[var(--color-text)]">Predictive Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Forecast Card */}
        <div className="card p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--color-text-faint)]">Completion forecast</span>
            <Target size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-[var(--color-text)] mb-1">
            {forecastDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-medium mb-4">
            Predicted end based on {avgVel.toFixed(1)} tasks/wk
          </div>
          <div className="h-1.5 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ width: `${Math.min(100, (1 - weeksRem/12) * 100)}%` }} 
            />
          </div>
        </div>

        {/* Capacity Load Card */}
        <div className="card p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--color-text-faint)]">Efficiency index</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-[var(--color-text)] mb-1">
            {avgVel > 0 ? (avgVel / (members.length || 1)).toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-medium mb-4">
            Tasks completed per member / week
          </div>
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-xs font-medium text-emerald-600">Optimal flow</span>
          </div>
        </div>

        {/* Bottleneck Card */}
        <div className="card p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--color-text-faint)]">Active bottlenecks</span>
            <Lock size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-[var(--color-text)] mb-1">
            {bottlenecks.length} Key Roles
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-medium mb-4 truncate">
            {bottlenecks.length > 0 ? `Mostly impacting ${bottlenecks[0][0]}` : 'Workflow path clear'}
          </div>
          <div className="flex flex-wrap gap-1">
            {bottlenecks.map(([name, count]) => (
              <span key={name} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-lg border border-amber-100">
                {name.split(' ')[0]} : {count}
              </span>
            ))}
          </div>
        </div>

        {/* Backlog Density */}
        <div className="card p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[var(--color-text-faint)]">Risk exposure</span>
            <AlertTriangle size={16} className="text-rose-500" />
          </div>
          <div className="text-xl font-bold text-[var(--color-text)] mb-1">
            {highSlip.filter(s => s.gap > 10).length} Modules
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] font-medium mb-4">
            Exhibiting significant schedule drift
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {highSlip.map((s, i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-rose-600">
                   {s.name[0]}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-rose-600">Action req</span>
          </div>
        </div>
      </div>

      {/* Slippage Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                   <Clock size={16} className="text-indigo-500" />
                   Schedule Deviation Matrix
                </h3>
                <p className="text-xs text-[var(--color-text-faint)] mt-1 font-medium">Time elapsed vs actual progress</p>
             </div>
          </div>
          
          <div className="space-y-5">
            {slippageData.sort((a,b) => b.gap - a.gap).slice(0, 5).map((m, i) => {
              const isHigh = m.gap > 15;
              const isLow = m.gap < 0;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                        <span className="text-xs font-bold text-[var(--color-text)]">{m.name}</span>
                        <span className={clsx(
                          "ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded",
                          isHigh ? "bg-red-50 text-red-600" : isLow ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {m.gap > 0 ? `+${m.gap.toFixed(0)}% LAG` : `${Math.abs(m.gap).toFixed(0)}% AHEAD`}
                        </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-text-faint)] font-bold">{m.progress.toFixed(0)}% / {m.timePct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-surface-offset)] rounded-full relative overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-indigo-500/20 z-0" 
                      style={{ width: `${m.timePct}%` }} 
                    />
                    <div 
                      className={clsx(
                        "absolute left-0 top-0 h-full z-10",
                        isHigh ? "bg-rose-500" : "bg-indigo-500"
                      )}
                      style={{ width: `${m.progress}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                   <Target size={16} className="text-indigo-500" />
                   Priority Momentum
                </h3>
                <p className="text-xs text-[var(--color-text-faint)] mt-1 font-medium">Completions by priority (last 30 days)</p>
             </div>
             <BarChart2 size={18} className="text-[var(--color-text-faint)]" />
          </div>

          <div className="space-y-4">
             {[TaskPriority.CRITICAL, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW].map(p => {
                const priorityTasks = tasks.filter(t => t.priority === p);
                const completedInLog = log.filter(l => 
                   l.action === 'Status Changed' && 
                   l.newVal === TaskStatus.COMPLETED && 
                   priorityTasks.some(t => t.id === l.taskId)
                ).length;

                const colorMap = {
                   [TaskPriority.CRITICAL]: 'bg-rose-500',
                   [TaskPriority.HIGH]: 'bg-amber-500',
                   [TaskPriority.MEDIUM]: 'bg-indigo-500',
                   [TaskPriority.LOW]: 'bg-slate-400'
                };

                const totalCompleted = tasks.filter(t => t.status === TaskStatus.COMPLETED).length || 1;
                const pct = (completedInLog / totalCompleted) * 100;

                return (
                   <div key={p} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                         <span className="text-[var(--color-text-muted)]">{p}</span>
                         <span className="text-[var(--color-text)]">{completedInLog} Tasks</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                         <div 
                            className={clsx("h-full rounded-full", colorMap[p])}
                            style={{ width: `${pct}%` }}
                         />
                      </div>
                   </div>
                );
             })}
          </div>
          <div className="mt-8 pt-4 border-t border-[var(--color-divider)]">
             <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-[var(--color-text-faint)]">Velocity health</div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                   <TrendingUp size={12} />
                   +12% vs last month
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveIntelligence;
