import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { TaskStatus, TaskPriority, DefectStatus } from '../../types';
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
  Layers2,
  X,
  ExternalLink,
  ChevronRight,
  Maximize2,
  BarChart3,
  User,
  Check,
  ArrowUpRight,
  Sliders,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../shared/PageHeader';
import Button from '../shared/Button';
import { motion, AnimatePresence } from 'motion/react';

type DetailCardType = 
  | 'health' 
  | 'milestones' 
  | 'ews' 
  | 'scope' 
  | 'effort' 
  | 'team' 
  | 'governance' 
  | 'deliverables' 
  | 'gravity';

export const OverviewView: React.FC = () => {
  const { state, setView } = useProject();
  const { hasViewAccess } = useAuth();
  const { 
    tasks = [], 
    raids = [], 
    decisions = [], 
    members = [], 
    releases = [], 
    deliveries = [],
    defects = [] 
  } = state;

  // Active Detail Inspector Drawer
  const [activeDetail, setActiveDetail] = useState<DetailCardType | null>(null);

  // ═════════════════════════════════════════════════════════════════════════
  // 1. CORE VISUAL METRICS COMPUTATION
  // ═════════════════════════════════════════════════════════════════════════
  const healthScore = getHealthScore(tasks);
  const doneTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.UNDER_REVIEW);
  const blockedTasks = tasks.filter(t => t.status === TaskStatus.ON_HOLD || t.isBlocked);
  const progressPct = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  const totalEffort = tasks.reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
  const doneEffort = doneTasks.reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
  const remainingEffort = Math.max(0, totalEffort - doneEffort);
  const effortPct = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;

  // Active Risks (High Impact)
  const activeHighRaids = raids.filter(r => (r.status === 'Open' || r.status === 'Active') && r.impact === 'High');

  // Pending Decisions
  const pendingDecisions = decisions.filter(d => d.status === 'Pending Sign-off');

  // Critical Defects
  const criticalDefects = defects.filter(d => d.severity?.startsWith('S1') && d.status !== DefectStatus.CLOSED);

  // Overdue tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.dueDate && t.dueDate < todayStr);

  // Early Warning System (EWS) Alerts
  const ewsAlerts = useMemo(() => {
    const list: { id: string; label: string; desc: string; type: 'critical' | 'warning' | 'info'; icon: any; actionView: string; actionLabel: string }[] = [];

    if (overdueTasks.length > 0) {
      list.push({
        id: 'overdue',
        label: 'Overdue Deliverables',
        desc: `${overdueTasks.length} active task${overdueTasks.length > 1 ? 's are' : ' is'} currently past due dates.`,
        type: 'critical',
        icon: Clock,
        actionView: 'tasks',
        actionLabel: 'Inspect Tasks'
      });
    }

    if (activeHighRaids.length > 0) {
      list.push({
        id: 'high-raids',
        label: 'High Threat RAID Items',
        desc: `${activeHighRaids.length} active Risk/Issue${activeHighRaids.length > 1 ? 's are' : ' is'} flagged at High Impact.`,
        type: 'critical',
        icon: ShieldAlert,
        actionView: 'risks',
        actionLabel: 'Inspect RAID'
      });
    }

    if (blockedTasks.length > 0) {
      list.push({
        id: 'blocked',
        label: 'Active Hold / Blockers',
        desc: `${blockedTasks.length} task${blockedTasks.length > 1 ? 's are' : ' is'} blocked by external dependencies.`,
        type: 'warning',
        icon: AlertTriangle,
        actionView: 'tasks',
        actionLabel: 'Unblock Tasks'
      });
    }

    if (pendingDecisions.length > 0) {
      list.push({
        id: 'pending-decisions',
        label: 'Steering Decisions Pending',
        desc: `${pendingDecisions.length} core business decision${pendingDecisions.length > 1 ? 's are' : ' is'} awaiting sign-off.`,
        type: 'warning',
        icon: FileText,
        actionView: 'risks',
        actionLabel: 'Review Decisions'
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'optimal',
        label: 'All Indicators Optimal',
        desc: 'Telemetry scan confirms zero critical timeline slip risk, active bottlenecks, or RAID blockages.',
        type: 'info',
        icon: CheckCircle,
        actionView: 'dash',
        actionLabel: 'View Telemetry'
      });
    }

    return list;
  }, [overdueTasks, activeHighRaids, blockedTasks, pendingDecisions]);

  // Critical Milestones & Major Phase Deliverables
  const criticalMilestones = useMemo(() => {
    return tasks
      .filter(t => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH)
      .slice(0, 5);
  }, [tasks]);

  // Deliverables by module (for visual distribution)
  const moduleDistribution = useMemo(() => {
    const counts: Record<string, { total: number; done: number; effort: number }> = {};
    tasks.forEach(t => {
      const mod = t.module || 'Core';
      if (!counts[mod]) counts[mod] = { total: 0, done: 0, effort: 0 };
      counts[mod].total++;
      counts[mod].effort += parseFloat(String(t.estEffort || t.estDays || 3)) || 3;
      if (t.status === TaskStatus.COMPLETED) counts[mod].done++;
    });
    return Object.entries(counts).map(([name, data]) => ({
      name,
      total: data.total,
      done: data.done,
      effort: Math.round(data.effort),
      pct: Math.round((data.done / Math.max(1, data.total)) * 100)
    })).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [tasks]);

  // Governance Index Calculation
  const governanceIndex = Math.max(45, Math.min(100, 100 - activeHighRaids.length * 15 - pendingDecisions.length * 5 - criticalDefects.length * 10));

  // ═════════════════════════════════════════════════════════════════════════
  // 2. RENDER INSPECTOR DRAWER CONTENT
  // ═════════════════════════════════════════════════════════════════════════
  const renderDetailModal = () => {
    if (!activeDetail) return null;

    let title = '';
    let category = '';
    let Icon = Presentation;
    let targetView = 'tasks';
    let targetViewLabel = 'Open Full Workstation';
    let contentNode = null;

    switch (activeDetail) {
      case 'health':
        title = 'Composite Health Diagnostics & Telemetry';
        category = 'ALGORITHMIC HEALTH FACTOR';
        Icon = Activity;
        targetView = 'dash';
        targetViewLabel = 'Open Intelligence Cockpit';
        contentNode = (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Health Score</span>
                <span className={clsx("text-2xl font-black font-display", healthScore > 80 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-rose-500")}>
                  {healthScore}%
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Composite Weighted</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Overdue Tasks</span>
                <span className={clsx("text-2xl font-black font-display font-mono", overdueTasks.length > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {overdueTasks.length}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">-8% deduction each</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Active Blockers</span>
                <span className="text-2xl font-black font-display font-mono text-amber-500">
                  {blockedTasks.length}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">-12% deduction each</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">High Threat RAID</span>
                <span className="text-2xl font-black font-display font-mono text-indigo-500">
                  {activeHighRaids.length}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">-5% deduction each</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Identified Timeline Slippage & Bottlenecks</h4>
              {overdueTasks.length === 0 && blockedTasks.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Zero overdue deliverables or active blockers detected. The delivery pipeline is running nominally.</span>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-divider)] border border-[var(--color-divider)] rounded-2xl bg-[var(--color-surface)] overflow-hidden">
                  {[...overdueTasks, ...blockedTasks].slice(0, 6).map(t => (
                    <div key={t.id} className="p-3.5 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--color-text)] truncate">{t.name}</span>
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
                            t.dueDate && t.dueDate < todayStr ? "bg-rose-500/15 text-rose-600" : "bg-amber-500/15 text-amber-600"
                          )}>
                            {t.dueDate && t.dueDate < todayStr ? "Overdue" : "Blocked"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">
                          {t.module || 'Core'} • Assignee: {t.assignee || 'Unassigned'} • Due: {t.dueDate || 'TBD'}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] shrink-0">{t.estDays || 3}d</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        break;

      case 'milestones':
        title = 'Milestone Delivery Runway & Critical Gates';
        category = 'SCHEDULE TIMELINE TELEMETRY';
        Icon = Milestone;
        targetView = 'releases';
        targetViewLabel = 'Open Release Roadmap';
        contentNode = (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <div>
                <span className="text-xs font-bold text-[var(--color-text)]">Target Release Version</span>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  {releases[0]?.name || 'Production Rollout v1.0'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[var(--color-primary-hex)]">
                  {releases[0]?.date || 'Scheduled for Next Sprint'}
                </span>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Release Gate Active</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Phase Gate Progression</h4>
              <div className="space-y-3">
                {criticalMilestones.map((m, idx) => {
                  const isDone = m.status === TaskStatus.COMPLETED;
                  const isInProg = m.status === TaskStatus.IN_PROGRESS;
                  return (
                    <div key={m.id} className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
                            isDone ? "bg-emerald-500 text-white" : isInProg ? "bg-indigo-500 text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-faint)]"
                          )}>
                            {isDone ? "✓" : idx + 1}
                          </span>
                          <span className="font-bold text-[var(--color-text)]">{m.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--color-text)]">
                          {isDone ? "100%" : `${m.progress || 0}%`}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                        <div 
                          className={clsx("h-full rounded-full transition-all", isDone ? "bg-emerald-500" : "bg-indigo-500")}
                          style={{ width: `${isDone ? 100 : m.progress || 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[var(--color-text-muted)] pt-1 font-mono">
                        <span>Owner: {m.assignee || 'Unassigned'}</span>
                        <span>Due: {m.dueDate || 'Sprint Target'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
        break;

      case 'ews':
        title = 'Early Warning Signals & Threat Triage';
        category = 'EARLY WARNING RADAR';
        Icon = AlertCircle;
        targetView = 'risks';
        targetViewLabel = 'Open RAID Register';
        contentNode = (
          <div className="space-y-6">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              The automated telemetry sensor scans task deadlines, external dependencies, high-impact RAID registers, and governance bottlenecks in real-time.
            </p>

            <div className="space-y-3">
              {ewsAlerts.map(alert => {
                const AlertIcon = alert.icon;
                return (
                  <div 
                    key={alert.id}
                    className={clsx(
                      "p-4 rounded-2xl border flex items-start gap-3.5 transition-all",
                      alert.type === 'critical' ? "bg-rose-500/5 border-rose-500/30 text-rose-700 dark:text-rose-400" :
                      alert.type === 'warning' ? "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400" :
                      "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                    )}
                  >
                    <AlertIcon size={18} className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs">{alert.label}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 mt-1 leading-relaxed">{alert.desc}</p>
                      {hasViewAccess(alert.actionView) && (
                        <button
                          onClick={() => setView(alert.actionView)}
                          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold underline hover:opacity-80 cursor-pointer"
                        >
                          <span>{alert.actionLabel}</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        break;

      case 'scope':
        title = 'Scope Completion & Backlog Matrix';
        category = 'DELIVERABLE VOLUME TELEMETRY';
        Icon = CheckCircle2;
        targetView = 'tasks';
        targetViewLabel = 'Open Tasks Matrix';
        contentNode = (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Completed</span>
                <span className="text-2xl font-black font-display font-mono text-emerald-600">{doneTasks.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">{progressPct}% of scope</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">In Construction</span>
                <span className="text-2xl font-black font-display font-mono text-indigo-600">{inProgressTasks.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Active Sprint</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Total Scope</span>
                <span className="text-2xl font-black font-display font-mono text-[var(--color-text)]">{totalTasks}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Total Backlog</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Breakdown by Priority</h4>
              <div className="divide-y divide-[var(--color-divider)] border border-[var(--color-divider)] rounded-2xl bg-[var(--color-surface)] overflow-hidden text-xs">
                {[TaskPriority.CRITICAL, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW].map(pri => {
                  const count = tasks.filter(t => t.priority === pri).length;
                  const done = tasks.filter(t => t.priority === pri && t.status === TaskStatus.COMPLETED).length;
                  const pct = count > 0 ? Math.round((done / count) * 100) : 0;
                  return (
                    <div key={pri} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "w-2 h-2 rounded-full",
                          pri === TaskPriority.CRITICAL ? "bg-rose-500" :
                          pri === TaskPriority.HIGH ? "bg-amber-500" : "bg-indigo-500"
                        )} />
                        <span className="font-bold text-[var(--color-text)]">{pri}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[var(--color-text-muted)]">{done} / {count} Done</span>
                        <span className="font-mono font-bold text-[var(--color-text)] w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
        break;

      case 'effort':
        title = 'Effort Burn & Resource Velocity';
        category = 'VELOCITY & DAY-RATE TELEMETRY';
        Icon = Zap;
        targetView = 'capacity';
        targetViewLabel = 'Open Resource Capacity';
        contentNode = (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Burned Effort</span>
                <span className="text-2xl font-black font-display font-mono text-indigo-600">{doneEffort}d</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">{effortPct}% total</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Remaining</span>
                <span className="text-2xl font-black font-display font-mono text-amber-600">{remainingEffort}d</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Est. to Release</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Total Budgeted</span>
                <span className="text-2xl font-black font-display font-mono text-[var(--color-text)]">{totalEffort}d</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Person-days</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Effort by System Module</h4>
              <div className="space-y-2.5">
                {moduleDistribution.map(m => (
                  <div key={m.name} className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[var(--color-text)]">{m.name}</span>
                      <span className="font-mono text-[var(--color-text-muted)]">{m.effort} person-days</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round((m.effort / Math.max(1, totalEffort)) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        break;

      case 'team':
        title = 'Team Bandwidth & Allocation Roster';
        category = 'CAPACITY & HEADCOUNT TELEMETRY';
        Icon = Users;
        targetView = 'team';
        targetViewLabel = 'Open Team Hub';
        contentNode = (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-[var(--color-text)]">Active Engineering Roster</span>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{members.length} Dedicated FTE Contributors</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-purple-600">Avg {Math.round(totalTasks / Math.max(1, members.length))} tasks / FTE</span>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Balanced Allocation</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Engineer Bandwidth Status</h4>
              <div className="divide-y divide-[var(--color-divider)] border border-[var(--color-divider)] rounded-2xl bg-[var(--color-surface)] overflow-hidden text-xs">
                {members.slice(0, 7).map(m => {
                  const assigned = tasks.filter(t => t.assignee === m.name);
                  const days = assigned.reduce((acc, t) => acc + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
                  const isHigh = days > 15;
                  return (
                    <div key={m.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-[var(--color-text)] truncate block">{m.name}</span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">{m.role || 'Senior Engineer'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">{assigned.length} tasks ({days}d)</span>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
                          isHigh ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"
                        )}>
                          {isHigh ? "Intense" : "Optimal"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
        break;

      case 'governance':
        title = 'Governance, Compliance & Decision Ledger';
        category = 'STEERING & RISK GOVERNANCE';
        Icon = ShieldCheck;
        targetView = 'risks';
        targetViewLabel = 'Open RAID & Decisions';
        contentNode = (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Audit Score</span>
                <span className="text-2xl font-black font-display font-mono text-emerald-600">{governanceIndex}%</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Compliant</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">Pending Sign-off</span>
                <span className="text-2xl font-black font-display font-mono text-amber-600">{pendingDecisions.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Decisions</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block">High Impact RAID</span>
                <span className="text-2xl font-black font-display font-mono text-rose-600">{activeHighRaids.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Threats</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Pending Steering Decisions</h4>
              {pendingDecisions.length === 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Zero pending executive decisions awaiting sign-off.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {pendingDecisions.map(d => (
                    <div key={d.id} className="p-3.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[var(--color-text)]">{d.title}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-mono text-[10px] font-bold">Pending</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] font-mono">Approver: {d.approver || d.proposedBy || 'Executive Steering'} • Impact: {d.impact || 'High'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        break;

      case 'deliverables':
        title = 'Strategic Deliverables & Package Deployment';
        category = 'ALM RELEASE ENGINEERING';
        Icon = Package;
        targetView = 'deliveries';
        targetViewLabel = 'Open Deliveries Workstation';
        contentNode = (
          <div className="space-y-6">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Software delivery units, ALM packages, and integration pipelines scheduled for the active release train.
            </p>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Core Release Packages</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {moduleDistribution.map(mod => (
                  <div key={mod.name} className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[var(--color-text)]">{mod.name}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                        {mod.done}/{mod.total} Done
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${mod.pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] font-mono pt-1">
                      <span>Package Status: Active</span>
                      <span className="font-bold text-[var(--color-text)]">{mod.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        break;

      case 'gravity':
        title = 'Module Gravity & Architectural Cohesion';
        category = 'SYSTEM ARCHITECTURE MATRIX';
        Icon = Layers;
        targetView = 'features';
        targetViewLabel = 'Open Functional Matrix';
        contentNode = (
          <div className="space-y-6">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Distribution of engineering mass across modular software domains, computing subsystem coupling and release density.
            </p>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-faint)]">Domain Architecture Distribution</h4>
              <div className="divide-y divide-[var(--color-divider)] border border-[var(--color-divider)] rounded-2xl bg-[var(--color-surface)] overflow-hidden text-xs">
                {moduleDistribution.map(m => {
                  const pct = Math.round((m.total / Math.max(1, totalTasks)) * 100);
                  return (
                    <div key={m.name} className="p-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="font-bold text-[var(--color-text)] truncate block">{m.name}</span>
                        <span className="text-[11px] text-[var(--color-text-muted)] font-mono">{m.total} total deliverables • {m.effort} person-days</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono font-bold text-xs w-10 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
        break;
    }

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div 
          className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--color-divider)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/15 flex items-center justify-center shrink-0 shadow-2xs">
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-hex)] block font-mono">
                  {category}
                </span>
                <h3 className="font-bold text-base sm:text-lg text-[var(--color-text)] leading-tight">
                  {title}
                </h3>
              </div>
            </div>
            <button 
              onClick={() => setActiveDetail(null)}
              className="p-1.5 rounded-xl hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              title="Close detail inspector"
              aria-label="Close detail inspector"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="max-h-[60vh] overflow-y-auto custom-scroll pr-1">
            {contentNode}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[var(--color-divider)] flex items-center justify-between gap-3 text-xs">
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Real-time project telemetry • Zero stale cache
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveDetail(null)}
                className="h-9 px-3 rounded-xl font-bold active:scale-95 cursor-pointer"
              >
                Close
              </Button>
              {hasViewAccess(targetView) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveDetail(null);
                    setView(targetView);
                  }}
                  className="h-9 px-4 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
                >
                  <span>{targetViewLabel}</span>
                  <ArrowRight size={13} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-6 pb-16">
        
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: VISUAL HERO COCKPIT (BENTO GRID - HIGH DESIGN TASTE)       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Card 1: Composite Health Index Dial (4 COLS) */}
          <div 
            onClick={() => setActiveDetail('health')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between items-center text-center cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect algorithmic health diagnostics and contributors"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('health'); }}
          >
            {/* Click Affordance Pill */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

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

          {/* Card 2: Visual Milestone Runway Radar (4 COLS) */}
          <div 
            onClick={() => setActiveDetail('milestones')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect milestone phase gates and schedule runway"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('milestones'); }}
          >
            {/* Click Affordance Pill */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 pr-14">
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

          {/* Card 3: Threat Radar & Early Warning Signals (4 COLS) */}
          <div 
            onClick={() => setActiveDetail('ews')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect early warning signals and risk triage"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('ews'); }}
          >
            {/* Click Affordance Pill */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex items-center justify-between pr-14">
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
          <div 
            onClick={() => setActiveDetail('scope')}
            className="p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer select-none group relative overflow-hidden active:scale-[0.98]"
            title="Click to inspect deliverable scope completion breakdown"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('scope'); }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Scope Completed</span>
              <CheckCircle2 size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">{progressPct}%</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">{doneTasks.length}/{totalTasks} tasks</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] pt-0.5">
              <span>{inProgressTasks.length} in progress</span>
              <span className="font-semibold text-[var(--color-primary-hex)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Details <ArrowUpRight size={10} />
              </span>
            </div>
          </div>

          {/* Tile 2: Effort Burn Ratio */}
          <div 
            onClick={() => setActiveDetail('effort')}
            className="p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer select-none group relative overflow-hidden active:scale-[0.98]"
            title="Click to inspect effort burned and velocity breakdown"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('effort'); }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Effort Burned</span>
              <Zap size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">{effortPct}%</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">{doneEffort}d / {totalEffort}d</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${effortPct}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] pt-0.5">
              <span>{remainingEffort}d remaining</span>
              <span className="font-semibold text-[var(--color-primary-hex)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Details <ArrowUpRight size={10} />
              </span>
            </div>
          </div>

          {/* Tile 3: Active Team Bandwidth */}
          <div 
            onClick={() => setActiveDetail('team')}
            className="p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer select-none group relative overflow-hidden active:scale-[0.98]"
            title="Click to inspect team bandwidth and allocation roster"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('team'); }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Team Bandwidth</span>
              <Users size={16} className="text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">{members.length}</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">Active FTEs</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${Math.min(100, members.length * 12)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] pt-0.5">
              <span>Balanced Capacity</span>
              <span className="font-semibold text-[var(--color-primary-hex)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Details <ArrowUpRight size={10} />
              </span>
            </div>
          </div>

          {/* Tile 4: Governance Compliance */}
          <div 
            onClick={() => setActiveDetail('governance')}
            className="p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-3 cursor-pointer select-none group relative overflow-hidden active:scale-[0.98]"
            title="Click to inspect governance compliance and decision ledger"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('governance'); }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">Governance Index</span>
              <ShieldCheck size={16} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-display text-[var(--color-text)]">
                {governanceIndex}%
              </span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">Audit Score</span>
            </div>
            <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all" 
                style={{ width: `${governanceIndex}%` }} 
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] pt-0.5">
              <span>{pendingDecisions.length} pending decisions</span>
              <span className="font-semibold text-[var(--color-primary-hex)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Details <ArrowUpRight size={10} />
              </span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: STRATEGIC DELIVERABLES & MODULE ARCHITECTURE VISUALS       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Visual ALM Deliverables Snapshot (7 COLS) */}
          <div 
            onClick={() => setActiveDetail('deliverables')}
            className="lg:col-span-7 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-5 flex flex-col justify-between cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect strategic deliverables and deployment schedule"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('deliverables'); }}
          >
            {/* Click Affordance Pill */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex justify-between items-center pr-14">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text)]">Strategic Deliverables Snapshot</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Core component packages and delivery pipelines</p>
                </div>
              </div>
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
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                    <span>Package Progress</span>
                    <span className="font-bold text-[var(--color-text)]">{mod.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>ALM Delivery Health</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Release Blockers</span>
            </div>
          </div>

          {/* Module Architecture Gravity Bar Distribution (5 COLS) */}
          <div 
            onClick={() => setActiveDetail('gravity')}
            className="lg:col-span-5 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-4 flex flex-col justify-between cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect module gravity and architectural cohesion"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('gravity'); }}
          >
            {/* Click Affordance Pill */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex justify-between items-center pr-14">
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
              <span className="font-bold text-[var(--color-text)] font-mono">High Cohesion (94%)</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: INTELLIGENCE DEEP-DIVE EXECUTIVE BANNER                    */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm space-y-5 relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-[var(--color-primary-hex)] text-xs font-bold uppercase tracking-wider font-mono">
                <Zap size={14} />
                <span>Advanced Analytics & Simulation</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-[var(--color-text)]">
                Looking for granular metrics and scenario modeling?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Explore the complete Project Intelligence Cockpit for Monte Carlo ETA simulations, What-If Staffing Sandboxes, Velocity Control Bands, Earned Value Management (EVM), and Governance Audit Ledgers.
              </p>
            </div>

            {hasViewAccess('dash') && (
              <button
                onClick={() => setView('dash')}
                className="h-11 px-5 rounded-2xl bg-[var(--color-primary-hex)] text-white hover:opacity-95 font-bold text-xs shrink-0 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-xs"
              >
                <span>Launch Intelligence Cockpit</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--color-divider)] text-xs">
            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] transition-all border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 cursor-pointer space-y-1 group active:scale-95"
            >
              <div className="font-bold text-[var(--color-text)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-emerald-500" />
                  <span>Monte Carlo</span>
                </div>
                <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary-hex)]" />
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">P50/P90 finish horizons</p>
            </div>

            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] transition-all border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 cursor-pointer space-y-1 group active:scale-95"
            >
              <div className="font-bold text-[var(--color-text)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame size={13} className="text-amber-500" />
                  <span>Velocity Band</span>
                </div>
                <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary-hex)]" />
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">±1.25σ Shewhart corridor</p>
            </div>

            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] transition-all border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 cursor-pointer space-y-1 group active:scale-95"
            >
              <div className="font-bold text-[var(--color-text)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={13} className="text-cyan-500" />
                  <span>EVM & Financials</span>
                </div>
                <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary-hex)]" />
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">PV, EV, CPI, and SPI matrices</p>
            </div>

            <div 
              onClick={() => { if (hasViewAccess('dash')) setView('dash'); }}
              className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] transition-all border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 cursor-pointer space-y-1 group active:scale-95"
            >
              <div className="font-bold text-[var(--color-text)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-purple-500" />
                  <span>Quality & Risk</span>
                </div>
                <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary-hex)]" />
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)]">RAID heatmap & audit ledger</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Detail Inspector Modal */}
      {renderDetailModal()}
    </div>
  );
};

export default OverviewView;
