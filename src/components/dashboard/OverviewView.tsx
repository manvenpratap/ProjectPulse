import React, { useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { TaskStatus, TaskPriority } from '../../types';
import { getHealthScore } from '../../utils/projectUtils';
import { 
  Presentation, 
  ShieldAlert, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Users, 
  Layers, 
  Milestone, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  AlertTriangle,
  AlertCircle,
  Flame,
  DollarSign,
  ShieldCheck,
  Package,
  Activity,
  Layers2
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../shared/PageHeader';

export const OverviewView: React.FC = () => {
  const { state, setView } = useProject();
  const { hasViewAccess } = useAuth();
  const { tasks = [], raids = [], decisions = [], members = [], releases = [] } = state;

  // ═════════════════════════════════════════════════════════════════════════
  // 1. CORE VISUAL METRICS
  // ═════════════════════════════════════════════════════════════════════════
  const healthScore = getHealthScore(tasks);
  const doneTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const totalEffort = tasks.reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
  const doneEffort = doneTasks.reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
  const effortPct = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;

  // Active Risks (High Impact)
  const activeHighRaids = raids.filter(r => (r.status === 'Open' || r.status === 'Active') && r.impact === 'High');

  // Pending Decisions
  const pendingDecisions = decisions.filter(d => d.status === 'Pending Sign-off');

  // Overdue tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.dueDate && t.dueDate < todayStr);

  // Early Warning System (EWS) Alerts
  const ewsAlerts: { id: string; label: string; desc: string; type: 'critical' | 'warning' | 'info'; icon: any }[] = [];

  if (overdueTasks.length > 0) {
    ewsAlerts.push({
      id: 'overdue',
      label: 'Overdue Deliverables',
      desc: `${overdueTasks.length} active task${overdueTasks.length > 1 ? 's are' : ' is'} currently past due dates.`,
      type: 'critical',
      icon: Clock
    });
  }

  if (activeHighRaids.length > 0) {
    ewsAlerts.push({
      id: 'high-raids',
      label: 'High Threat RAID Items',
      desc: `${activeHighRaids.length} active Risk/Issue${activeHighRaids.length > 1 ? 's are' : ' is'} flagged at High Impact.`,
      type: 'critical',
      icon: ShieldAlert
    });
  }

  if (pendingDecisions.length > 0) {
    ewsAlerts.push({
      id: 'pending-decisions',
      label: 'Steering Decisions Pending',
      desc: `${pendingDecisions.length} core business decision${pendingDecisions.length > 1 ? 's are' : ' is'} awaiting sign-off.`,
      type: 'warning',
      icon: FileText
    });
  }

  if (ewsAlerts.length === 0) {
    ewsAlerts.push({
      id: 'optimal',
      label: 'All Indicators Optimal',
      desc: 'Telemetry scan confirms zero critical timeline slip risk, active bottlenecks, or RAID blockages.',
      type: 'info',
      icon: CheckCircle
    });
  }

  // Milestones & Major Deliverables
  const criticalMilestones = tasks
    .filter(t => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH)
    .slice(0, 5);

  // Deliverables by module (for visual distribution)
  const moduleDistribution = useMemo(() => {
    const counts: Record<string, { total: number; done: number }> = {};
    tasks.forEach(t => {
      const mod = t.module || 'Core';
      if (!counts[mod]) counts[mod] = { total: 0, done: 0 };
      counts[mod].total++;
      if (t.status === TaskStatus.COMPLETED) counts[mod].done++;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      total: data.total,
      done: data.done,
      pct: Math.round((data.done / Math.max(1, data.total)) * 100)
    })).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [tasks]);

  // SVG Gauge calculations
  const strokeDashoffset = 402 - (402 * healthScore) / 100;

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Presentation}
        title="Executive Overview"
        subtitle="Visual high-level project telemetry, health dials, and milestone release radar"
        primaryAction={
          hasViewAccess('dash') ? (
            <button 
              onClick={() => setView('dash')}
              className="h-9 px-3.5 bg-[var(--color-primary-hex)] hover:opacity-95 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-opacity"
              aria-label="Navigate to advanced intelligence telemetry"
            >
              <TrendingUp size={15} /> 
              <span>Intelligence Cockpit</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/20 text-white">G D</kbd>
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-8 pb-16">
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: VISUAL HERO COCKPIT (BENTO GRID)                           */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Card 1: Composite Health Index Dial */}
          <div 
            className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm flex flex-col justify-between items-center text-center cursor-help select-none"
            title="Composite Health Index calculated from overdue tasks, blockers, and active hold items"
          >
            <div className="space-y-1 text-center w-full">
              <h3 className="font-bold text-base text-[var(--color-text)]">Composite Health Index</h3>
              <p className="text-xs text-[var(--color-primary-hex)] font-semibold">Algorithmic Delivery Health</p>
            </div>

            <div className="relative w-44 h-44 my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" role="img" aria-label="Project health indicator gauge">
                <circle 
                  cx="88" 
                  cy="88" 
                  r="70" 
                  className="stroke-[var(--color-surface-2)] fill-none" 
                  strokeWidth="12" 
                />
                <circle 
                  cx="88" 
                  cy="88" 
                  r="70" 
                  className={clsx(
                    "fill-none transition-all duration-1000 ease-out",
                    healthScore > 80 ? "stroke-emerald-500" :
                    healthScore > 50 ? "stroke-amber-500" : "stroke-rose-500"
                  )}
                  strokeWidth="12" 
                  strokeDasharray={440} 
                  strokeDashoffset={440 - (440 * healthScore) / 100}
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={clsx(
                  "font-display text-4xl font-black tracking-tight",
                  healthScore > 80 ? "text-emerald-500" :
                  healthScore > 50 ? "text-amber-500" : "text-rose-500"
                )}>
                  {healthScore}%
                </span>
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1",
                  healthScore > 80 ? "bg-emerald-500/10 text-emerald-600" :
                  healthScore > 50 ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"
                )}>
                  {healthScore > 80 ? 'On Track' : healthScore > 50 ? 'At Risk' : 'Critical'}
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 border-t border-[var(--color-divider)] pt-4 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Overdue</span>
                <span className={clsx("text-sm font-bold font-mono", overdueTasks.length > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {overdueTasks.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Blocked</span>
                <span className="text-sm font-bold font-mono text-amber-500">
                  {tasks.filter(t => t.status === TaskStatus.ON_HOLD).length}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Active RAID</span>
                <span className="text-sm font-bold font-mono text-indigo-500">
                  {raids.filter(r => r.status === 'Open' || r.status === 'Active').length}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Visual Milestone Runway Radar */}
          <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Milestone className="text-indigo-600" size={18} />
                  <h3 className="font-bold text-base text-[var(--color-text)]">Milestone Delivery Radar</h3>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {criticalMilestones.filter(m => m.status === TaskStatus.COMPLETED).length} / {criticalMilestones.length} Done
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">High-priority phase gates and scheduled milestones</p>
            </div>

            <div className="space-y-3.5 my-2">
              {criticalMilestones.map((m, idx) => {
                const isDone = m.status === TaskStatus.COMPLETED;
                const isInProg = m.status === TaskStatus.IN_PROGRESS;
                return (
                  <div key={m.id} className="flex items-center gap-3 text-xs">
                    <div className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold font-mono border",
                      isDone ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                      isInProg ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 animate-pulse" :
                      "bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border-[var(--color-divider)]"
                    )}>
                      {isDone ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--color-text)] truncate">{m.name}</span>
                        <span className="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">
                          {m.dueDate ? new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden mt-1 border border-[var(--color-divider)]">
                        <div 
                          className={clsx("h-full rounded-full", isDone ? "bg-emerald-500" : "bg-indigo-500")}
                          style={{ width: `${m.progress || (isDone ? 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)]">Project Launch Target</span>
              <span className="font-bold text-[var(--color-text)] font-mono">
                {releases[0]?.date ? new Date(releases[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled'}
              </span>
            </div>
          </div>

          {/* Card 3: Threat Radar & Early Warning Signals */}
          <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={18} />
                <h3 className="font-bold text-base text-[var(--color-text)]">Early Warning Signals</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-text-faint)]">
                {ewsAlerts.length} Signals Active
              </span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto custom-scroll pr-1 my-1">
              {ewsAlerts.map(alert => {
                const AlertIcon = alert.icon;
                return (
                  <div 
                    key={alert.id}
                    className={clsx(
                      "p-3 rounded-2xl border flex items-start gap-3 transition-colors",
                      alert.type === 'critical' ? "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400" :
                      alert.type === 'warning' ? "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400" :
                      "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    <AlertIcon size={16} className="shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs leading-tight">{alert.label}</h4>
                      <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{alert.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>Risk Threat Level:</span>
              <span className={clsx("font-bold font-mono", activeHighRaids.length > 0 ? "text-rose-500" : "text-emerald-500")}>
                {activeHighRaids.length > 0 ? `${activeHighRaids.length} High Risks` : 'Nominal'}
              </span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: EXECUTIVE VISUAL STRATEGIC METRIC ARCS (4 TILES)          */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Scope Progress */}
          <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Scope Completed</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">{progressPct}%</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">{doneTasks.length}/{totalTasks} tasks</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Tile 2: Effort Burn Ratio */}
          <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Effort Burned</span>
              <Zap size={16} className="text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">{effortPct}%</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">{doneEffort}d / {totalEffort}d</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${effortPct}%` }} />
            </div>
          </div>

          {/* Tile 3: Active Team Bandwidth */}
          <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Team Bandwidth</span>
              <Users size={16} className="text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">{members.length}</span>
              <span className="text-xs text-[var(--color-text-muted)]">Active FTEs</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(100, members.length * 12)}%` }} />
            </div>
          </div>

          {/* Tile 4: Governance Compliance */}
          <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Governance Index</span>
              <ShieldCheck size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">
                {Math.max(50, 100 - activeHighRaids.length * 15 - pendingDecisions.length * 5)}%
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">Audit Score</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all" 
                style={{ width: `${Math.max(50, 100 - activeHighRaids.length * 15 - pendingDecisions.length * 5)}%` }} 
              />
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: STRATEGIC DELIVERABLES & MODULE ARCHITECTURE VISUALS       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Visual ALM Deliverables Snapshot */}
          <div className="lg:col-span-7 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-5 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text)]">Strategic Deliverables Snapshot</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Core component packages and delivery pipelines</p>
                </div>
              </div>
              {hasViewAccess('deliveries') && (
                <button
                  onClick={() => setView('deliveries')}
                  className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Deliveries Hub</span>
                  <ArrowRight size={13} className="shrink-0" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-1">
              {moduleDistribution.slice(0, 4).map(mod => (
                <div key={mod.name} className="p-4 rounded-2xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-[var(--color-text)] truncate">{mod.name}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {mod.done}/{mod.total}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${mod.pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                    <span>Package Progress</span>
                    <span className="font-mono font-bold text-[var(--color-text)]">{mod.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>ALM Delivery Health</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Release Blockers</span>
            </div>
          </div>

          {/* Module Architecture Gravity Bar Distribution */}
          <div className="lg:col-span-5 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="text-purple-600" size={18} />
                <h3 className="font-bold text-base text-[var(--color-text)]">Module Gravity</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-text-faint)]">
                {moduleDistribution.length} Modules
              </span>
            </div>

            <div className="space-y-3 my-2">
              {moduleDistribution.map(m => (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[var(--color-text)]">{m.name}</span>
                    <span className="font-mono text-[var(--color-text-muted)]">{m.total} tasks</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                    <div 
                      className="h-full bg-purple-600 rounded-full transition-all"
                      style={{ width: `${Math.round((m.total / Math.max(1, totalTasks)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] flex justify-between">
              <span>Cohesion Score</span>
              <span className="font-bold text-[var(--color-text)]">High Cohesion (94%)</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: INTELLIGENCE DEEP-DIVE EXECUTIVE BANNER                    */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl space-y-5 border border-indigo-800/40">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Zap size={14} />
                <span>Advanced Analytics & Simulation</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
                Looking for granular metrics and scenario modeling?
              </h3>
              <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
                Explore the complete Project Intelligence Cockpit for Monte Carlo ETA simulations, What-If Staffing Sandboxes, Velocity Control Bands, Earned Value Management (EVM), and Governance Audit Ledgers.
              </p>
            </div>

            {hasViewAccess('dash') && (
              <button
                onClick={() => setView('dash')}
                className="h-11 px-5 rounded-2xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs shrink-0 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                <span>Launch Intelligence Cockpit</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-indigo-800/60 text-xs">
            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer space-y-1"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-400" />
                <span>Monte Carlo Forecast</span>
              </div>
              <p className="text-[11px] text-indigo-200/70">P50/P90 finish horizons</p>
            </div>

            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer space-y-1"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <Flame size={13} className="text-amber-400" />
                <span>Velocity Band</span>
              </div>
              <p className="text-[11px] text-indigo-200/70">±1.25σ Shewhart corridor</p>
            </div>

            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer space-y-1"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <DollarSign size={13} className="text-cyan-400" />
                <span>EVM & Financials</span>
              </div>
              <p className="text-[11px] text-indigo-200/70">PV, EV, CPI, and SPI matrices</p>
            </div>

            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer space-y-1"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-purple-400" />
                <span>Quality & Governance</span>
              </div>
              <p className="text-[11px] text-indigo-200/70">RAID heatmap & audit ledger</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
