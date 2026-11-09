import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { TaskStatus, TaskPriority, RaidItem, Decision } from '../../types';
import { getHealthScore, daysDiff, addBusDays } from '../../utils/projectUtils';
import { 
  Presentation, 
  ShieldAlert, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  HelpCircle, 
  Users, 
  Layers,
  Activity,
  Milestone,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers2,
  GitCommit,
  Check,
  Zap,
  RotateCcw,
  FileSpreadsheet,
  Command,
  Sliders
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';

const OverviewView: React.FC = () => {
  const { state, setView, updateProject, addLog } = useProject();
  const { hasViewAccess, canPerform } = useAuth();
  const { tasks = [], raids = [], decisions = [], members = [], log = [] } = state;

  // 1. Calculate Core Health metrics
  const healthScore = getHealthScore(tasks);
  const doneTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  // Active Risks (High Impact)
  const activeHighRaids = raids.filter(r => r.status === 'Active' && r.impact === 'High');

  // Pending Decisions
  const pendingDecisions = decisions.filter(d => d.status === 'Pending Sign-off');

  // Overdue tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.dueDate < todayStr);

  // 2. Early Warning System (EWS) Alerts
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

  // Check for resource overload
  const overloadedCount = members.filter(m => {
    const mTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED);
    return mTasks.length > 4;
  }).length;

  if (overloadedCount > 0) {
    ewsAlerts.push({
      id: 'overload',
      label: 'Resource Overload Risk',
      desc: `${overloadedCount} team member${overloadedCount > 1 ? 's have' : ' has'} more than 4 concurrent active tasks.`,
      type: 'warning',
      icon: Users
    });
  }

  // Fallback if no warnings
  if (ewsAlerts.length === 0) {
    ewsAlerts.push({
      id: 'optimal',
      label: 'All Indicators Optimal',
      desc: 'Telemetry scan confirms zero critical timeline slip risk, active bottlenecks, or RAID blockages.',
      type: 'info',
      icon: CheckCircle
    });
  }

  // 3. Milestones & Major Deliverables
  const criticalMilestones = tasks
    .filter(t => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH)
    .slice(0, 5);

  // 4. What-If Simulation Sandbox State
  const [addEngineers, setAddEngineers] = useState(0);
  const [scopeReduction, setScopeReduction] = useState(0);
  const [timeCompression, setTimeCompression] = useState(0);
  const [simulationCommitted, setSimulationCommitted] = useState(false);

  const resetWhatIf = () => {
    setAddEngineers(0);
    setScopeReduction(0);
    setTimeCompression(0);
    setSimulationCommitted(false);
  };

  // Simulating output values
  const simConfidence = Math.max(10, Math.min(98, 75 + (addEngineers * 5) + (scopeReduction * 0.5) - (timeCompression * 1.2)));
  const simHealth = Math.max(10, Math.min(100, Math.round(healthScore + (addEngineers * 3) + (scopeReduction * 0.4) - (timeCompression * 0.8))));
  const daysDelta = (addEngineers * -2) + (scopeReduction * -1) + (timeCompression * -2);
  const simShortfall = Math.max(0, overloadedCount - addEngineers);

  const handleCommitSimulation = () => {
    if (confirm("Are you sure you want to commit this simulation to the live project state? This will alter active task schedules, re-allocate resources, and adjust scope according to your simulation values.")) {
      let updatedTasks = [...tasks];
      let updatedMembers = [...members];
      let balanceLogs = 0;

      // 1. Shift deadlines (Timeline compression / daysDelta)
      if (daysDelta !== 0) {
        updatedTasks = updatedTasks.map(t => {
          if (t.status === TaskStatus.COMPLETED) return t;
          try {
            return {
              ...t,
              dueDate: addBusDays(t.dueDate, daysDelta),
              startDate: addBusDays(t.startDate, daysDelta)
            };
          } catch (e) {
            return t;
          }
        });
      }

      // 2. Add engineers
      if (addEngineers > 0) {
        for (let i = 1; i <= addEngineers; i++) {
          const devName = `Sandbox Dev ${String.fromCharCode(64 + i)}`;
          if (!updatedMembers.some(m => m.name === devName)) {
            updatedMembers.push({
              id: `MEM-SB-${i}`,
              name: devName,
              role: 'Consulting Engineer',
              status: 'Active',
              reportsTo: 'Sarah Chen',
              email: `${devName.toLowerCase().replace(' ', '')}@projectpulse.io`,
              phone: '+1 (555) simulation',
              birthday: '2026-01-01',
              plannedLeaves: []
            });
            balanceLogs++;
          }
        }
      }

      // 3. Rescope (reduce non-critical tasks)
      if (scopeReduction > 0) {
        const incompleteTasks = updatedTasks.filter(t => t.status !== TaskStatus.COMPLETED);
        const countToRemove = Math.min(incompleteTasks.length, Math.round((scopeReduction / 100) * tasks.length));
        if (countToRemove > 0) {
          const tasksToRemove = [...incompleteTasks]
            .sort((a, b) => {
              const prioMap = { [TaskPriority.LOW]: 1, [TaskPriority.MEDIUM]: 2, [TaskPriority.HIGH]: 3, [TaskPriority.CRITICAL]: 4 };
              return prioMap[a.priority] - prioMap[b.priority];
            })
            .slice(0, countToRemove);
          
          updatedTasks = updatedTasks.filter(t => !tasksToRemove.some(rem => rem.id === t.id));
          balanceLogs += countToRemove;
        }
      }

      // Save to global context
      updateProject({
        tasks: updatedTasks,
        members: updatedMembers
      });

      // Log event
      addLog('Simulation Committed', 'ALL', `Committed simulation: added ${addEngineers} devs, descoped ${scopeReduction}%, shifted by ${daysDelta} days.`);
      setSimulationCommitted(true);
      alert("Simulation successfully committed to live project state! Tasks, team allocation, and schedules have been synchronized.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Presentation}
        title="Executive Steering & Health Index"
        subtitle="Composite delivery health, early warning bottleneck signals, and real-time simulation"
        actions={
          <div className="flex items-center gap-2.5">
            {hasViewAccess('dash') && (
              <button 
                onClick={() => setView('dash')}
                className="h-9 px-3.5 bg-[var(--color-primary-hex)] hover:opacity-95 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] text-[var(--color-primary-text)] rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm transition-opacity"
                aria-label="Navigate to advanced telemetry dashboard"
              >
                <TrendingUp size={15} /> 
                <span>Advanced Analytics</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/20 text-white">G D</kbd>
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-8 pb-16">

        {/* Bento Grid: Health Dial + EWS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 grid-flow-dense gap-6 items-stretch">
          
          {/* Health Index Dial Component */}
          <div 
            className="card-glass p-6 flex flex-col justify-between items-center text-center cursor-help select-none"
            title="Composite Health Index: 100 - (OverdueTasks × 50% + BlockedTasks × 30% + OnHoldTasks × 20%) / TotalActiveTasks × 100"
          >
            <div className="space-y-1 text-center w-full">
              <h3 className="font-bold text-sm tracking-tight text-[var(--color-text)]">Composite Health Index</h3>
              <p className="text-xs text-[var(--color-primary-hex)] font-medium">Multi-factor algorithmic dial</p>
            </div>

            <div className="relative w-40 h-40 my-5 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" role="img" aria-label="Project health indicator gauge">
                <circle 
                  cx="80" 
                  cy="80" 
                  r="64" 
                  className="stroke-[var(--color-surface-2)] fill-none" 
                  strokeWidth="12" 
                />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="64" 
                  className={clsx(
                    "fill-none transition-[stroke-dashoffset] duration-700 ease-out",
                    healthScore > 80 ? "stroke-emerald-500" : healthScore > 50 ? "stroke-amber-500" : "stroke-rose-500"
                  )}
                  strokeWidth="12" 
                  strokeDasharray="402.1"
                  strokeDashoffset={402.1 - (402.1 * healthScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tracking-tight text-[var(--color-text)]">{healthScore}%</span>
                <span className="text-xs text-[var(--color-text-muted)] mt-0.5">Health score</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 border-t border-[var(--color-divider)] pt-4">
              <div className="text-center p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <div className="text-xs text-[var(--color-text-muted)]">Completed</div>
                <div className="text-lg font-bold text-emerald-500">{progressPct}%</div>
              </div>
              <div className="text-center p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <div className="text-xs text-[var(--color-text-muted)]">Backlog</div>
                <div className="text-lg font-bold text-[var(--color-text)]">{totalTasks - doneTasks.length} tasks</div>
              </div>
            </div>
          </div>

          {/* Early Warning System (EWS) */}
          <div className="card-glass p-6 lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-tight text-[var(--color-text)]">Early Warning System (EWS)</h3>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                    Critical: {ewsAlerts.filter(a => a.type === 'critical').length}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold">
                    Warning: {ewsAlerts.filter(a => a.type === 'warning').length}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Real-time telemetry scan for schedule slips, high RAID impacts, and resource overloading across delivery streams.
              </p>
            </div>

            <div className="space-y-3 flex-1">
              {ewsAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={clsx(
                    "p-3.5 rounded-xl border flex gap-3.5 items-start transition-colors duration-200",
                    alert.type === 'critical' ? "bg-rose-500/10 border-rose-500/25 text-rose-500" :
                    alert.type === 'warning' ? "bg-amber-500/10 border-amber-500/25 text-amber-500" :
                    "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
                  )}
                >
                  <div className={clsx(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                    alert.type === 'critical' ? "bg-rose-500 text-white" :
                    alert.type === 'warning' ? "bg-amber-500 text-white" :
                    "bg-emerald-500 text-white"
                  )}>
                    <alert.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-[var(--color-text)]">{alert.label}</h4>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-0.5">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ALM Deliveries Snapshot Card */}
        <div className="card-glass p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-[var(--color-primary-hex)]">ALM Release Workstation</span>
                <span className="text-xs text-[var(--color-text-faint)]">·</span>
                <span className="text-xs text-[var(--color-text-muted)]">{(state.deliveries || []).length} Packages</span>
              </div>
              <h3 className="text-base font-sans font-bold tracking-tight text-[var(--color-text)]">
                Active Deployments & Release Verification Gates
              </h3>
            </div>
            {hasViewAccess('deliveries') && (
              <button 
                onClick={() => setView('deliveries')}
                className="px-3.5 py-1.5 bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] hover:bg-[var(--color-primary-hex)] hover:text-[var(--color-primary-text)] active:scale-[0.98] rounded-lg text-xs font-semibold flex items-center gap-1.5 motion-safe:transition-transform self-start md:self-auto cursor-pointer"
              >
                <span>Open ALM Workspace</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">Production Deployed</span>
              <div className="text-xl font-mono font-bold text-emerald-500 mt-1">
                {(state.deliveries || []).filter(d => d.status === 'Deployed').length}
              </div>
            </div>
            <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">In Pipeline</span>
              <div className="text-xl font-mono font-bold text-sky-500 mt-1">
                {(state.deliveries || []).filter(d => d.status === 'Ready for Deployment' || d.status === 'In Progress').length}
              </div>
            </div>
            <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">Pending Sign-off</span>
              <div className="text-xl font-mono font-bold text-amber-500 mt-1">
                {(state.deliveries || []).filter(d => d.signOffStatus === 'Pending').length}
              </div>
            </div>
            <div className="p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">Avg Cycle Lead</span>
              <div className="text-xl font-mono font-bold text-[var(--color-text)] mt-1">
                {(state.deliveries || []).filter(d => d.leadTimeDays > 0).length 
                  ? ((state.deliveries || []).filter(d => d.leadTimeDays > 0).reduce((acc, d) => acc + d.leadTimeDays, 0) / (state.deliveries || []).filter(d => d.leadTimeDays > 0).length).toFixed(1)
                  : '0'}d
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Roadmap Widget */}
        <div className="card-glass p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-[var(--color-text)]">Milestone Roadmap Timeline</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Chronological checkpoint nodes, reached delivery gates, and target dates.</p>
            </div>
            {hasViewAccess('timeline') && (
              <button 
                onClick={() => setView('timeline')} 
                className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Timeline</span>
                <ArrowRight size={13} className="shrink-0" />
              </button>
            )}
          </div>
          
          <div className="relative py-2">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[var(--color-divider)] -translate-y-1/2 z-0" />
            <div className="relative z-10 flex justify-between items-center gap-4 overflow-x-auto pb-3 custom-scroll">
              {criticalMilestones.map((t, idx) => {
                const isDone = t.status === TaskStatus.COMPLETED;
                return (
                  <div key={t.id} className="flex flex-col items-center text-center min-w-[160px] space-y-2.5 shrink-0">
                    <div className={clsx(
                      "w-9 h-9 rounded-full flex items-center justify-center border-2 font-mono font-bold text-xs motion-safe:transition-transform duration-200 shadow-2xs",
                      isDone 
                        ? "bg-emerald-500 text-white border-emerald-300" 
                        : "bg-[var(--color-surface)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-text)] line-clamp-1 max-w-[150px]">{t.name}</div>
                      <div className="text-xs font-mono text-[var(--color-text-muted)] mt-0.5">{t.dueDate}</div>
                      <span className={clsx(
                        "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold mt-1",
                        isDone ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20"
                      )}>
                        {isDone ? 'REACHED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {criticalMilestones.length === 0 && (
                <div className="w-full py-6 text-center text-[var(--color-text-muted)] text-xs">No milestone-grade deliverables found in active tasks.</div>
              )}
            </div>
          </div>
        </div>

        {/* Resource Utilization Widget */}
        <div className="card-glass p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Resource Utilization Matrix</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Individual engineer capacity load, active commitments, and utilization thresholds.</p>
            </div>
            {hasViewAccess('capacity') && (
              <button 
                onClick={() => setView('capacity')} 
                className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Capacity</span>
                <ArrowRight size={13} className="shrink-0" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.slice(0, 8).map(m => {
              const activeTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED);
              const totalActiveEffort = activeTasks.reduce((sum, t) => sum + t.estDays, 0);
              const utilizationPct = Math.min(Math.round((totalActiveEffort / 10) * 100), 150);
              return (
                <div key={m.id} className="p-4 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)] transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <h4 className="font-bold text-xs text-[var(--color-text)] leading-tight">{m.name}</h4>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{m.role || 'Contributor'}</p>
                      </div>
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold",
                        utilizationPct > 100 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                        utilizationPct > 60 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      )}>
                        {utilizationPct}%
                      </span>
                    </div>

                    <div className="w-full bg-[var(--color-surface-offset)] h-1.5 rounded-full overflow-hidden mb-3">
                      <div 
                        className={clsx(
                          "h-full rounded-full",
                          utilizationPct > 100 ? "bg-rose-500" :
                          utilizationPct > 60 ? "bg-amber-500" :
                          "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 mt-2 pt-2.5 border-t border-[var(--color-divider)]">
                    <div className="text-xs text-[var(--color-text-muted)] font-medium mb-1">Active tasks:</div>
                    {activeTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="text-xs text-[var(--color-text)] font-medium flex justify-between gap-2">
                        <span className="truncate">• {t.name}</span>
                        <span className="text-xs text-[var(--color-primary-hex)] shrink-0 font-medium">{t.estDays} days</span>
                      </div>
                    ))}
                    {activeTasks.length > 2 && (
                      <div className="text-xs text-[var(--color-text-muted)] italic mt-0.5">+ {activeTasks.length - 2} more active tasks</div>
                    )}
                    {activeTasks.length === 0 && (
                      <div className="text-xs text-[var(--color-text-muted)] italic">No active tasks allocated.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What-If Sandbox Dashboard Widget (Linear / Telemetry Cockpit) */}
        <div className="card-glass p-6 md:p-8 relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-divider)]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sliders className="text-[var(--color-primary-hex)]" size={15} />
                  <span className="text-xs font-semibold text-[var(--color-primary-hex)]">
                    Scenario Modeler
                  </span>
                </div>
                <h3 className="font-sans text-lg font-bold text-[var(--color-text)]">Strategic What-If Sandbox</h3>
                <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
                  Simulate adjustments in engineering resources, scope descoping, and timeline crunch to model risk outcomes.
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={resetWhatIf}
                  className="px-3 py-1.5 border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  aria-label="Reset simulation parameters"
                >
                  <RotateCcw size={12} /> Reset Simulation
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sliders (LHS) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Additional Engineers Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[var(--color-text)]">
                    <span>Additional Engineering Resources</span>
                    <span className="text-xs font-semibold text-[var(--color-primary-hex)]">+{addEngineers} engineers</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    value={addEngineers} 
                    onChange={(e) => setAddEngineers(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-primary-hex)] h-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Baseline (0)</span>
                    <span>+5 Devs</span>
                  </div>
                </div>

                {/* Scope Reduction Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[var(--color-text)]">
                    <span>Scope Descoping / Backlog Reduction</span>
                    <span className="text-xs font-semibold text-[var(--color-primary-hex)]">-{scopeReduction}% scope</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="40" 
                    value={scopeReduction} 
                    onChange={(e) => setScopeReduction(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-primary-hex)] h-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>100% Scope</span>
                    <span>-40% Non-critical Features</span>
                  </div>
                </div>

                {/* Timeline Compression Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[var(--color-text)]">
                    <span>Timeline Schedule Compression</span>
                    <span className="text-xs font-semibold text-[var(--color-primary-hex)]">{timeCompression}% faster</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={timeCompression} 
                    onChange={(e) => setTimeCompression(parseInt(e.target.value))}
                    className="w-full accent-[var(--color-primary-hex)] h-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                    <span>Standard Pacing</span>
                    <span>30% Sprint Crunch</span>
                  </div>
                </div>
              </div>

              {/* Simulated Outcomes (RHS) */}
              <div className="lg:col-span-5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl p-5 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)] font-medium">Simulated Confidence</div>
                  <div className={clsx(
                    "text-2xl font-mono font-bold",
                    simConfidence > 80 ? "text-emerald-500" : simConfidence > 50 ? "text-amber-500" : "text-rose-500"
                  )}>
                    {simConfidence}%
                  </div>
                  <p className="text-xs text-[var(--color-text-faint)]">Baseline: 75%</p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)] font-medium">Simulated Health</div>
                  <div className={clsx(
                    "text-2xl font-mono font-bold",
                    simHealth > 80 ? "text-emerald-500" : simHealth > 50 ? "text-amber-500" : "text-rose-500"
                  )}>
                    {simHealth}%
                  </div>
                  <p className="text-xs text-[var(--color-text-faint)]">Current: {healthScore}%</p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)] font-medium">Delivery Delta</div>
                  <div className="text-2xl font-mono font-bold text-[var(--color-primary-hex)]">
                    {daysDelta !== 0 ? `${daysDelta} days` : 'Stable'}
                  </div>
                  <p className="text-xs text-[var(--color-text-faint)]">Schedule offset</p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-[var(--color-text-muted)] font-medium">Capacity Balance</div>
                  <div className={clsx(
                    "text-2xl font-mono font-bold",
                    simShortfall <= 0 ? "text-emerald-500" : "text-amber-500"
                  )}>
                    {simShortfall <= 0 ? 'Optimal' : `${simShortfall} Overload`}
                  </div>
                  <p className="text-xs text-[var(--color-text-faint)]">FTE loading gap</p>
                </div>

                {canPerform('canEditTask') && (
                  <div className="col-span-2 pt-3 border-t border-[var(--color-divider)] mt-1">
                    <button 
                      onClick={handleCommitSimulation}
                      disabled={simulationCommitted}
                      className={clsx(
                        "w-full h-10 rounded-lg text-xs font-semibold whitespace-nowrap active:scale-[0.98] motion-safe:transition-transform flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed",
                        simulationCommitted 
                          ? "bg-emerald-600 text-white cursor-default" 
                          : "bg-[var(--color-primary-hex)] hover:opacity-95 text-[var(--color-primary-text)]"
                      )}
                    >
                      {simulationCommitted ? (
                        <>
                          <Check size={14} /> <span>Committed</span>
                        </>
                      ) : (
                        <>
                          <Sliders size={14} /> <span>Commit Simulation</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Governance & Critical Path Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 grid-flow-dense gap-6 items-stretch">
          
          {/* Critical Path Deliverables */}
          <div className="card-glass p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text)]">Critical Path Deliverables</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">High & Critical Priority Telemetry Tasks</p>
                </div>
                {hasViewAccess('tasks') && (
                  <button 
                    onClick={() => setView('tasks')} 
                    className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Tasks</span>
                    <ArrowRight size={13} className="shrink-0" />
                  </button>
                )}
              </div>

              <div className="divide-y divide-[var(--color-divider)]">
                {criticalMilestones.length > 0 ? criticalMilestones.map(t => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="truncate flex-1">
                      <div className="text-xs font-semibold text-[var(--color-text)] truncate">{t.name}</div>
                      <div className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">{t.id} · {t.assignee || 'Unassigned'}</div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[11px] font-semibold",
                        t.status === TaskStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                        t.status === TaskStatus.ON_HOLD ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      )}>{t.status}</span>
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">{t.dueDate}</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-[var(--color-text-muted)] text-xs">No high or critical deliverables mapped.</div>
                )}
              </div>
            </div>
          </div>

          {/* Governance & Steerco Panel */}
          <div className="card-glass p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text)]">Steering Decisions Log</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Executive Sign-offs and Architectural Direction</p>
                </div>
                {hasViewAccess('risks') && (
                  <button 
                    onClick={() => setView('risks')} 
                    className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View RAID</span>
                    <ArrowRight size={13} className="shrink-0" />
                  </button>
                )}
              </div>

              <div className="divide-y divide-[var(--color-divider)]">
                {decisions.slice(0, 5).map(d => (
                  <div key={d.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[var(--color-text)] truncate">{d.title}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Proposed: {d.proposedBy} · Approver: {d.approver}</div>
                    </div>
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-[11px] font-semibold shrink-0",
                      d.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                      d.status === 'Rejected' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                      "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    )}>{d.status}</span>
                  </div>
                ))}
                {decisions.length === 0 && (
                  <div className="py-8 text-center text-[var(--color-text-muted)] text-xs">No strategic decisions logged. Navigate to RAID Register to log decisions.</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Change History Delta Stream */}
        <div className="card-glass p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)]">Project History Change Delta</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Live Audit Trail and Modification Stream</p>
            </div>
            {hasViewAccess('log') && (
              <button 
                onClick={() => setView('log')} 
                className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Log</span>
                <ArrowRight size={13} className="shrink-0" />
              </button>
            )}
          </div>

          <div className="divide-y divide-[var(--color-divider)] max-h-56 overflow-y-auto custom-scroll">
            {log.slice().reverse().slice(0, 6).map((l, i) => (
              <div key={i} className="py-2.5 flex items-center gap-3 text-xs">
                <div className="w-24 font-mono text-xs text-[var(--color-text-faint)] shrink-0">{l.ts.split('T')[0]} {l.ts.split('T')[1]?.substring(0, 5)}</div>
                <div className="w-20 text-xs font-semibold text-[var(--color-primary-hex)] shrink-0">{l.action}</div>
                <div className="flex-1 truncate text-[var(--color-text)] font-medium">{l.taskId ? `${l.taskId}: ` : ''}{l.taskName}</div>
                <div className="text-xs text-[var(--color-text-muted)] shrink-0">{l.assignee}</div>
              </div>
            ))}
            {log.length === 0 && (
              <div className="py-6 text-center text-[var(--color-text-muted)] text-xs">No activity entries registered.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewView;
