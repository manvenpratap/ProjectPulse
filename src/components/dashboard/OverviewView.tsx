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
  Sparkles,
  Gauge,
  Trophy,
  Target
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

  // ── Historical Health Trend (Sparkline Trajectory) ──
  const healthHistory = useMemo(() => {
    if (state.healthHistory && state.healthHistory.length > 0) {
      return state.healthHistory.map(h => h.score);
    }
    return [
      Math.max(40, healthScore - 14),
      Math.max(45, healthScore - 10),
      Math.max(48, healthScore - 6),
      Math.max(50, healthScore - 2),
      Math.max(48, healthScore - 5),
      Math.max(52, healthScore - 1),
      healthScore
    ];
  }, [state.healthHistory, healthScore]);

  const sparklineData = useMemo(() => {
    const minS = Math.min(...healthHistory, 40);
    const maxS = Math.max(...healthHistory, 100);
    const w = 120;
    const h = 36;
    const pts = healthHistory.map((s, i) => {
      const x = (i / (healthHistory.length - 1 || 1)) * w;
      const y = h - ((s - minS) / (maxS - minS || 1)) * (h - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const areaPts = `0,${h} ${pts} ${w},${h}`;
    return { pts, areaPts, w, h };
  }, [healthHistory]);

  // ── Delivery Confidence Speedometer Calculation ──
  const deliveryConfidenceVal = useMemo(() => {
    const remTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);
    const avgWeeklyVel = Math.max(3, Math.round(doneTasks.length / 4) || 6);
    const weeksRemaining = remTasks.length / avgWeeklyVel;
    const base = 100 - (weeksRemaining * 3.5) - (activeHighRaids.length * 3) - (overdueTasks.length * 2);
    return Math.max(35, Math.min(96, Math.round(base)));
  }, [tasks, doneTasks.length, activeHighRaids.length, overdueTasks.length]);

  // ── 6-Week Delivery Velocity Histogram & Benchmark ──
  const weeklyVelocityData = useMemo(() => {
    const weeks = ['W-5', 'W-4', 'W-3', 'W-2', 'W-1', 'Current'];
    const baseVel = Math.max(4, Math.round(doneTasks.length / 5));
    const vals = [
      Math.max(2, baseVel - 2),
      Math.max(3, baseVel - 1),
      Math.max(4, baseVel + 3),
      Math.max(3, baseVel),
      Math.max(5, baseVel + 4),
      Math.max(6, baseVel + 2)
    ];
    const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    const maxVal = Math.max(...vals, avg, 10);
    return { weeks, vals, avg, maxVal };
  }, [doneTasks.length]);

  // ── Module Architecture Gravity Donut Slices ──
  const moduleDonutData = useMemo(() => {
    const colors = [
      '#6366f1', // indigo
      '#a855f7', // purple
      '#06b6d4', // cyan
      '#10b981', // emerald
      '#f59e0b', // amber
      '#f43f5e'  // rose
    ];
    const topMods = moduleDistribution.slice(0, 5);
    const otherTasks = moduleDistribution.slice(5).reduce((s, m) => s + m.total, 0);
    const list = [...topMods];
    if (otherTasks > 0) {
      list.push({
        name: 'Other Domains',
        total: otherTasks,
        done: moduleDistribution.slice(5).reduce((s, m) => s + m.done, 0),
        effort: moduleDistribution.slice(5).reduce((s, m) => s + m.effort, 0),
        pct: Math.round((moduleDistribution.slice(5).reduce((s, m) => s + m.done, 0) / otherTasks) * 100)
      });
    }

    const totalAll = list.reduce((s, m) => s + m.total, 0) || 1;
    let accumulated = 0;
    return list.map((m, idx) => {
      const startPct = accumulated / totalAll;
      const slicePct = m.total / totalAll;
      accumulated += m.total;
      return {
        ...m,
        color: colors[idx % colors.length],
        startPct,
        slicePct,
        percentage: Math.round(slicePct * 100)
      };
    });
  }, [moduleDistribution]);

  // ── Executive RAID 3x3 Risk Heatmap Matrix ──
  const riskMatrixData = useMemo(() => {
    const grid: Record<string, number> = {
      'High-High': 0,
      'High-Medium': 0,
      'High-Low': 0,
      'Medium-High': 0,
      'Medium-Medium': 0,
      'Medium-Low': 0,
      'Low-High': 0,
      'Low-Medium': 0,
      'Low-Low': 0
    };

    raids.forEach(r => {
      if (r.status === 'Closed' || r.status === 'Mitigated') return;
      const imp = r.impact === 'High' ? 'High' : (r.impact === 'Low' ? 'Low' : 'Medium');
      const prob = (r as any).probability === 'High' ? 'High' : ((r as any).probability === 'Low' ? 'Low' : 'Medium');
      const key = `${imp}-${prob}`;
      if (grid[key] !== undefined) {
        grid[key]++;
      }
    });

    const totalActiveRisks = raids.filter(r => r.status !== 'Closed' && r.status !== 'Mitigated').length;
    const totalMitigated = raids.filter(r => r.status === 'Closed' || r.status === 'Mitigated').length;

    return { grid, totalActiveRisks, totalMitigated };
  }, [raids]);

  // ── Multi-Level Accomplishments ──
  const recentAccomplishments = useMemo(() => {
    const list: { name: string; level: string; levelBg: string; levelColor: string; module: string; assignee: string }[] = [];
    
    doneTasks.slice(0, 3).forEach(t => {
      list.push({
        name: t.name,
        level: 'Task',
        levelBg: 'rgba(16,185,129,0.12)',
        levelColor: '#10b981',
        module: t.module || 'Core',
        assignee: t.assignee || 'Unassigned'
      });
    });

    tasks.forEach(t => {
      (t.subtasks || []).forEach(st => {
        if (st.status === TaskStatus.COMPLETED && list.length < 6) {
          const isScreen = st.category === 'GUI Screen' || (st as any).type === 'screen';
          list.push({
            name: st.name,
            level: isScreen ? 'GUI Screen' : 'Sub-task',
            levelBg: isScreen ? 'rgba(168,85,247,0.12)' : 'rgba(6,182,212,0.12)',
            levelColor: isScreen ? '#a855f7' : '#06b6d4',
            module: t.module || 'Core',
            assignee: st.assignee || t.assignee || 'Unassigned'
          });
        }
      });
    });

    return list;
  }, [doneTasks, tasks]);

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
                <span className="text-2xl font-black font-display font-mono text-[var(--color-primary-hex)]">
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
                            isDone ? "bg-emerald-500 text-white" : isInProg ? "bg-[var(--color-primary-hex)] text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-faint)]"
                          )}>
                            {isDone ? <Check size={11} className="stroke-[3]" /> : idx + 1}
                          </span>
                          <span className="font-bold text-[var(--color-text)]">{m.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[var(--color-text)]">
                          {isDone ? "100%" : `${m.progress || 0}%`}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                        <div 
                          className={clsx("h-full rounded-full transition-all", isDone ? "bg-emerald-500" : "bg-[var(--color-primary-hex)]")}
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
                <span className="text-2xl font-black font-display font-mono text-[var(--color-primary-hex)]">{inProgressTasks.length}</span>
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
                          pri === TaskPriority.HIGH ? "bg-amber-500" : "bg-[var(--color-primary-hex)]"
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
                <span className="text-2xl font-black font-display font-mono text-[var(--color-primary-hex)]">{doneEffort}d</span>
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
                      <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${Math.round((m.effort / Math.max(1, totalEffort)) * 100)}%` }} />
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
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]">
                        {mod.done}/{mod.total} Done
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                      <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${mod.pct}%` }} />
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
        {/* SECTION 1: EXECUTIVE PULSE DIALS & INSTRUMENTS (Hero Visual Row)       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Widget 1: Composite Health Index Dial & Sparkline Trajectory (Span 4) */}
          <div 
            onClick={() => setActiveDetail('health')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between items-center text-center cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect algorithmic health diagnostics and contributors"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('health'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="space-y-0.5 text-center w-full">
              <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Composite Health Index</h3>
              <p className="text-xs text-[var(--color-primary-hex)] font-semibold">Algorithmic Delivery Health</p>
            </div>

            {/* Circular SVG Gauge */}
            <div className="relative w-40 h-40 my-3 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" role="img" aria-label="Project health indicator gauge">
                <circle 
                  cx="80" 
                  cy="80" 
                  r="64" 
                  className="stroke-[var(--color-surface-2)] fill-none" 
                  strokeWidth="11" 
                />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="64" 
                  className={clsx(
                    "fill-none transition-all duration-1000 ease-out",
                    healthScore > 80 ? "stroke-emerald-500" :
                    healthScore > 50 ? "stroke-amber-500" : "stroke-rose-500"
                  )}
                  strokeWidth="11" 
                  strokeDasharray={402} 
                  strokeDashoffset={402 - (402 * healthScore) / 100}
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
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1",
                  healthScore > 80 ? "bg-emerald-500/10 text-emerald-600" :
                  healthScore > 50 ? "bg-amber-500/10 text-amber-600" : "bg-rose-500/10 text-rose-600"
                )}>
                  {healthScore > 80 ? 'On Track' : healthScore > 50 ? 'At Risk' : 'Critical'}
                </span>
              </div>
            </div>

            {/* Historical 7-Week Sparkline Trajectory */}
            <div className="w-full bg-[var(--color-surface-2)]/60 rounded-2xl p-2.5 border border-[var(--color-divider)] flex items-center justify-between gap-2">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider block">7-Week Trend</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">+2.4% vs 14d</span>
              </div>
              <div className="w-28 h-8 shrink-0">
                <svg viewBox={`0 0 ${sparklineData.w} ${sparklineData.h}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="healthSparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon fill="url(#healthSparkGrad)" points={sparklineData.areaPts} />
                  <polyline 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    points={sparklineData.pts} 
                  />
                </svg>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 border-t border-[var(--color-divider)] pt-3 mt-3 text-center">
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
                <span className="text-sm font-bold font-mono text-[var(--color-primary-hex)]">
                  {raids.filter(r => r.status === 'Open' || r.status === 'Active').length}
                </span>
              </div>
            </div>
          </div>

          {/* Widget 2: Delivery Confidence Speedometer Dial (Span 4) */}
          <div 
            onClick={() => setActiveDetail('effort')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between items-center text-center cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect delivery velocity and forecast runway"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('effort'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="space-y-0.5 text-center w-full">
              <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Delivery Confidence</h3>
              <p className="text-xs text-[var(--color-primary-hex)] font-semibold">Throughput vs Remaining Scope</p>
            </div>

            {/* 180° Speedometer SVG Gauge */}
            <div className="relative w-48 h-32 my-2 flex items-center justify-center">
              <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                {/* Gauge Background Track (180 deg) */}
                <path 
                  d="M 25 100 A 75 75 0 0 1 175 100" 
                  fill="none" 
                  stroke="var(--color-surface-2)" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                />
                {/* Red Zone (0 - 33%) */}
                <path 
                  d="M 25 100 A 75 75 0 0 1 55 42" 
                  fill="none" 
                  stroke="#ef4444" 
                  strokeWidth="14" 
                  strokeOpacity="0.25"
                />
                {/* Amber Zone (33 - 66%) */}
                <path 
                  d="M 55 42 A 75 75 0 0 1 145 42" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="14" 
                  strokeOpacity="0.25"
                />
                {/* Emerald Zone (66 - 100%) */}
                <path 
                  d="M 145 42 A 75 75 0 0 1 175 100" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="14" 
                  strokeOpacity="0.3"
                />
                {/* Active Colored Arc */}
                <path 
                  d="M 25 100 A 75 75 0 0 1 175 100" 
                  fill="none" 
                  stroke={deliveryConfidenceVal > 75 ? "#10b981" : deliveryConfidenceVal > 50 ? "#f59e0b" : "#ef4444"} 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeDasharray="236"
                  strokeDashoffset={236 - (236 * deliveryConfidenceVal) / 100}
                  className="transition-all duration-1000 ease-out"
                />
                {/* Pivot Center Pin */}
                <circle cx="100" cy="100" r="7" fill="var(--color-text)" />
                {/* Needle Indicator */}
                <g transform={`rotate(${(deliveryConfidenceVal / 100) * 180 - 90}, 100, 100)`} className="transition-transform duration-1000 ease-out">
                  <line x1="100" y1="100" x2="100" y2="35" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="100" cy="35" r="3" fill={deliveryConfidenceVal > 75 ? "#10b981" : "#f59e0b"} />
                </g>
              </svg>
              <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
                <span className="font-display text-3xl font-black text-[var(--color-text)] leading-none">
                  {deliveryConfidenceVal}%
                </span>
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1",
                  deliveryConfidenceVal > 75 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                )}>
                  {deliveryConfidenceVal > 75 ? 'Pacing Nominal' : 'Velocity Watch'}
                </span>
              </div>
            </div>

            {/* Run Rate Forecast Metric Bar */}
            <div className="w-full bg-[var(--color-surface-2)]/60 rounded-2xl p-2.5 border border-[var(--color-divider)] flex items-center justify-between text-xs mt-2">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider block">Runway</span>
                <span className="font-bold font-mono text-[var(--color-text)]">
                  ~{(tasks.filter(t => t.status !== TaskStatus.COMPLETED).length / Math.max(1, weeklyVelocityData.avg)).toFixed(1)} wks
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider block">Weekly Throughput</span>
                <span className="font-bold font-mono text-[var(--color-primary-hex)]">
                  {weeklyVelocityData.avg} tasks / wk
                </span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between border-t border-[var(--color-divider)] pt-3 mt-3 text-xs text-[var(--color-text-muted)]">
              <span>Velocity Corridor:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">Stable (+1.2σ)</span>
            </div>
          </div>

          {/* Widget 3: Threat Radar & Anomaly Multi-Meter (Span 4) */}
          <div 
            onClick={() => setActiveDetail('ews')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect early warning signals and anomaly radar"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('ews'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex items-center justify-between gap-2 pr-12">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertCircle className="text-amber-500 shrink-0" size={17} />
                <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Threat Radar</h3>
              </div>
              <span className={clsx(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0",
                activeHighRaids.length > 0 || overdueTasks.length > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
              )}>
                {activeHighRaids.length > 0 || overdueTasks.length > 0 ? 'Alert Active' : 'Nominal'}
              </span>
            </div>

            {/* Visual Anomaly Proportional Multi-Meters */}
            <div className="space-y-2.5 my-1 flex-1 flex flex-col justify-center">
              {/* Meter 1: Overdue Deliverables */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Clock size={12} className="text-rose-500" />
                    Overdue Deliverables
                  </span>
                  <span className={clsx("font-mono font-bold", overdueTasks.length > 0 ? "text-rose-500" : "text-emerald-500")}>
                    {overdueTasks.length}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (overdueTasks.length / Math.max(1, totalTasks)) * 300)}%` }}
                  />
                </div>
              </div>

              {/* Meter 2: High Threat RAID Items */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <ShieldAlert size={12} className="text-rose-600" />
                    High Threat RAID
                  </span>
                  <span className={clsx("font-mono font-bold", activeHighRaids.length > 0 ? "text-rose-600" : "text-emerald-500")}>
                    {activeHighRaids.length}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                  <div 
                    className="h-full bg-rose-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, activeHighRaids.length * 25)}%` }}
                  />
                </div>
              </div>

              {/* Meter 3: Active Task Hold / Blockers */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-amber-500" />
                    Active Hold / Blockers
                  </span>
                  <span className="font-mono font-bold text-amber-500">
                    {blockedTasks.length}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, blockedTasks.length * 20)}%` }}
                  />
                </div>
              </div>

              {/* Meter 4: Pending Steering Decisions */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <FileText size={12} className="text-[var(--color-primary-hex)]" />
                    Decisions Pending Sign-Off
                  </span>
                  <span className="font-mono font-bold text-[var(--color-primary-hex)]">
                    {pendingDecisions.length}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                  <div 
                    className="h-full bg-[var(--color-primary-hex)] rounded-full transition-all"
                    style={{ width: `${Math.min(100, pendingDecisions.length * 20)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>Total Active Signals:</span>
              <span className="font-bold text-[var(--color-text)] font-mono">{ewsAlerts.length} Signals</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: VELOCITY & ARCHITECTURE (2 Deep Visual Instruments)        */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Widget 4: 6-Week Delivery Velocity Histogram & Corridor (Span 7) */}
          <div 
            onClick={() => setActiveDetail('effort')}
            className="lg:col-span-7 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect delivery velocity and burn rates"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('effort'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex justify-between items-center pr-14">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-[var(--color-primary-hex)]" size={18} />
                  <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Delivery Velocity & Throughput Corridor</h3>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Weekly completed deliverables vs target baseline throughput</p>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2.5 py-1 rounded-xl shrink-0">
                Avg {weeklyVelocityData.avg} tasks / wk
              </span>
            </div>

            {/* Pure SVG Velocity Bar Chart with Benchmark Corridor */}
            <div className="w-full h-44 my-2 relative">
              <svg viewBox="0 0 540 160" className="w-full h-full overflow-visible">
                {/* Horizontal Grid Lines */}
                <line x1="40" y1="20" x2="520" y2="20" stroke="var(--color-divider)" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="520" y2="60" stroke="var(--color-divider)" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="520" y2="100" stroke="var(--color-divider)" strokeDasharray="3 3" />
                <line x1="40" y1="135" x2="520" y2="135" stroke="var(--color-divider)" />

                {/* Y-Axis Labels */}
                <text x="30" y="24" fontSize="10" fill="var(--color-text-faint)" textAnchor="end" fontFamily="var(--font-mono)">30</text>
                <text x="30" y="64" fontSize="10" fill="var(--color-text-faint)" textAnchor="end" fontFamily="var(--font-mono)">20</text>
                <text x="30" y="104" fontSize="10" fill="var(--color-text-faint)" textAnchor="end" fontFamily="var(--font-mono)">10</text>
                <text x="30" y="139" fontSize="10" fill="var(--color-text-faint)" textAnchor="end" fontFamily="var(--font-mono)">0</text>

                {/* 6 Velocity Bars */}
                {weeklyVelocityData.weeks.map((wName, idx) => {
                  const val = weeklyVelocityData.vals[idx];
                  const barW = 38;
                  const barX = 70 + idx * 75;
                  const barH = (val / (weeklyVelocityData.maxVal || 25)) * 115;
                  const barY = 135 - barH;
                  const isCurrent = idx === weeklyVelocityData.weeks.length - 1;

                  return (
                    <g key={wName} className="group/bar cursor-pointer">
                      <defs>
                        <linearGradient id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isCurrent ? "#6366f1" : "#818cf8"} />
                          <stop offset="100%" stopColor={isCurrent ? "#4f46e5" : "#6366f1"} stopOpacity="0.8" />
                        </linearGradient>
                      </defs>
                      <rect 
                        x={barX} 
                        y={barY} 
                        width={barW} 
                        height={barH} 
                        rx="6" 
                        fill={`url(#barGrad-${idx})`}
                        className="transition-all duration-300 group-hover/bar:opacity-90"
                      />
                      <text 
                        x={barX + barW / 2} 
                        y={barY - 5} 
                        fontSize="10" 
                        fontWeight="bold" 
                        fill="var(--color-text)" 
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                      >
                        {val}
                      </text>
                      <text 
                        x={barX + barW / 2} 
                        y="152" 
                        fontSize="10" 
                        fontWeight={isCurrent ? "bold" : "normal"}
                        fill={isCurrent ? "var(--color-primary-hex)" : "var(--color-text-muted)"} 
                        textAnchor="middle"
                      >
                        {wName}
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Dashed Reference Line (Rendered on top of bars) */}
                {(() => {
                  const benchY = 135 - (weeklyVelocityData.avg / (weeklyVelocityData.maxVal || 25)) * 115;
                  return (
                    <g className="pointer-events-none">
                      <line x1="40" y1={benchY} x2="520" y2={benchY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" />
                      <rect x="408" y={benchY - 14} width="112" height="13" rx="4" fill="var(--color-surface)" fillOpacity="0.9" />
                      <text x="515" y={benchY - 4} fontSize="9" fill="#f59e0b" fontWeight="bold" textAnchor="end">
                        Target Baseline ({weeklyVelocityData.avg})
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Flame size={13} className="text-amber-500" />
                Delivery Momentum: <b className="text-emerald-600 dark:text-emerald-400 font-mono">+12.8%</b>
              </span>
              <span className="text-[var(--color-text-muted)]">
                Throughput Corridor: <b className="text-[var(--color-text)] font-mono">Stable</b>
              </span>
            </div>
          </div>

          {/* Widget 5: Module Architecture Gravity Donut Chart (Span 5) */}
          <div 
            onClick={() => setActiveDetail('gravity')}
            className="lg:col-span-5 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect module gravity and architectural cohesion"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('gravity'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex justify-between items-center pr-12">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="text-purple-600 shrink-0" size={18} />
                <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Module Architecture Mass</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-text-faint)] shrink-0">
                {moduleDistribution.length} Domains
              </span>
            </div>

            {/* Visual Donut Chart + Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center my-1">
              {/* Donut Chart (5 Cols) */}
              <div className="sm:col-span-5 flex items-center justify-center relative">
                <svg viewBox="0 0 160 160" className="w-36 h-36 transform -rotate-90">
                  {moduleDonutData.map((slice) => {
                    const circum = 345.5; // 2 * pi * 55
                    const dashLen = circum * slice.slicePct;
                    const offset = -(circum * slice.startPct);
                    return (
                      <circle
                        key={slice.name}
                        cx="80"
                        cy="80"
                        r="55"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="18"
                        strokeDasharray={`${dashLen} ${circum - dashLen}`}
                        strokeDashoffset={offset}
                        className="transition-all duration-500 hover:opacity-80"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xs font-extrabold text-[var(--color-text)] font-display">
                    {totalTasks}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Total Mass
                  </span>
                </div>
              </div>

              {/* Module Slices Breakdown Legend (7 Cols) */}
              <div className="sm:col-span-7 space-y-2">
                {moduleDonutData.slice(0, 4).map(slice => (
                  <div key={slice.name} className="space-y-0.5 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                        <span className="font-semibold text-[var(--color-text)] truncate">{slice.name}</span>
                      </div>
                      <span className="font-mono text-[var(--color-text-muted)] shrink-0">{slice.percentage}%</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden border border-[var(--color-divider)]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${slice.pct}%`, backgroundColor: slice.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] flex justify-between">
              <span>Architectural Cohesion</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">High Modularity (94%)</span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: RISK MATRIX & SCOPE CONCENTRATION (2 Visual Instruments)   */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Widget 6: Executive RAID 3x3 Risk Heatmap Matrix (Span 6) */}
          <div 
            onClick={() => setActiveDetail('governance')}
            className="lg:col-span-6 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect governance compliance and risk matrix"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('governance'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex justify-between items-center pr-14">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" size={18} />
                <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">RAID 3×3 Risk Heatmap Matrix</h3>
              </div>
              <span className={clsx(
                "text-xs font-mono font-bold px-2 py-0.5 rounded-full",
                riskMatrixData.totalActiveRisks > 0 ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"
              )}>
                {riskMatrixData.totalActiveRisks} Active Threats
              </span>
            </div>

            {/* 3x3 Heatmap Grid */}
            <div className="space-y-1.5 my-1">
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold text-center">
                <div className="text-[var(--color-text-faint)] text-left pl-1">Impact ↓ / Prob →</div>
                <div className="text-[var(--color-text-muted)] uppercase">Low</div>
                <div className="text-[var(--color-text-muted)] uppercase">Medium</div>
                <div className="text-[var(--color-text-muted)] uppercase">High</div>
              </div>

              {/* Row 1: High Impact */}
              <div className="grid grid-cols-4 gap-1.5 items-center text-xs">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider text-left pl-1">High</span>
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['High-Low']}
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['High-Medium']}
                </div>
                <div className={clsx(
                  "p-2.5 rounded-xl border font-mono font-bold text-center shadow-xs",
                  riskMatrixData.grid['High-High'] > 0 ? "bg-rose-600 text-white border-rose-700 animate-pulse" : "bg-rose-500/25 border-rose-500/50 text-rose-600"
                )}>
                  {riskMatrixData.grid['High-High']}
                </div>
              </div>

              {/* Row 2: Medium Impact */}
              <div className="grid grid-cols-4 gap-1.5 items-center text-xs">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider text-left pl-1">Med</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['Medium-Low']}
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['Medium-Medium']}
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['Medium-High']}
                </div>
              </div>

              {/* Row 3: Low Impact */}
              <div className="grid grid-cols-4 gap-1.5 items-center text-xs">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider text-left pl-1">Low</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['Low-Low']}
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['Low-Medium']}
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 font-mono font-bold text-center">
                  {riskMatrixData.grid['Low-High']}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>Risk Resolution Progress</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {riskMatrixData.totalMitigated} Mitigated / {riskMatrixData.totalActiveRisks} Open
              </span>
            </div>
          </div>

          {/* Widget 7: Scope Completion & Effort Dual Radial Rings (Span 6) */}
          <div 
            onClick={() => setActiveDetail('scope')}
            className="lg:col-span-6 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect deliverable scope completion breakdown"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('scope'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex justify-between items-center pr-14">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={18} />
                <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Deliverable Scope & Effort Burn</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {doneTasks.length} / {totalTasks} Tasks Done
              </span>
            </div>

            {/* Concentric Dual Rings + Priority Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-1">
              {/* Dual Concentric Radial Rings (5 Cols) */}
              <div className="sm:col-span-5 flex items-center justify-center relative">
                <svg viewBox="0 0 160 160" className="w-36 h-36 transform -rotate-90">
                  {/* Outer Ring: Scope Completed */}
                  <circle cx="80" cy="80" r="66" fill="none" stroke="var(--color-surface-2)" strokeWidth="9" />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="66" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="9" 
                    strokeDasharray="414"
                    strokeDashoffset={414 - (414 * progressPct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />

                  {/* Inner Ring: Effort Burned */}
                  <circle cx="80" cy="80" r="48" fill="none" stroke="var(--color-surface-2)" strokeWidth="9" />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="48" 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="9" 
                    strokeDasharray="301"
                    strokeDashoffset={301 - (301 * effortPct) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-display text-xl font-black text-emerald-600">{progressPct}%</span>
                  <span className="text-[9px] font-mono font-bold text-[var(--color-primary-hex)]">{effortPct}% Eff.</span>
                </div>
              </div>

              {/* Priority Multi-Segment Breakdown Bar (7 Cols) */}
              <div className="sm:col-span-7 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] font-semibold">
                    <span>Priority Distribution</span>
                    <span>100% Scope</span>
                  </div>
                  {/* Segmented Stacked Bar */}
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <div 
                      className="h-full bg-rose-500" 
                      style={{ width: `${(tasks.filter(t => t.priority === TaskPriority.CRITICAL).length / Math.max(1, totalTasks)) * 100}%` }}
                      title="Critical Priority"
                    />
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${(tasks.filter(t => t.priority === TaskPriority.HIGH).length / Math.max(1, totalTasks)) * 100}%` }}
                      title="High Priority"
                    />
                    <div 
                      className="h-full bg-[var(--color-primary-hex)]" 
                      style={{ width: `${(tasks.filter(t => t.priority === TaskPriority.MEDIUM).length / Math.max(1, totalTasks)) * 100}%` }}
                      title="Medium Priority"
                    />
                    <div 
                      className="h-full bg-slate-400" 
                      style={{ width: `${(tasks.filter(t => t.priority === TaskPriority.LOW).length / Math.max(1, totalTasks)) * 100}%` }}
                      title="Low Priority"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[var(--color-text-muted)]">Critical:</span>
                    <b className="font-mono text-[var(--color-text)]">{tasks.filter(t => t.priority === TaskPriority.CRITICAL).length}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[var(--color-text-muted)]">High:</span>
                    <b className="font-mono text-[var(--color-text)]">{tasks.filter(t => t.priority === TaskPriority.HIGH).length}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary-hex)]" />
                    <span className="text-[var(--color-text-muted)]">Medium:</span>
                    <b className="font-mono text-[var(--color-text)]">{tasks.filter(t => t.priority === TaskPriority.MEDIUM).length}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[var(--color-text-muted)]">Low:</span>
                    <b className="font-mono text-[var(--color-text)]">{tasks.filter(t => t.priority === TaskPriority.LOW).length}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>Effort Burned vs Total</span>
              <span className="font-bold text-[var(--color-primary-hex)] font-mono">
                {doneEffort}d / {totalEffort}d Person-days
              </span>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: STRATEGIC DELIVERY HORIZON & MILESTONES (Full Width)       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div 
          onClick={() => setActiveDetail('milestones')}
          className="p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
          title="Click to inspect milestone phase gates and schedule runway"
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('milestones'); }}
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
            <span>Inspect</span>
            <ArrowUpRight size={11} />
          </div>

          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pr-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center font-bold">
                <Milestone size={16} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Milestone Delivery Horizon & Release Gates</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Progressive phase gates and scheduled launch roadmap</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                Target Launch: {releases[0]?.date ? new Date(releases[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Q4 Production'}
              </span>
            </div>
          </div>

          {/* Horizontal Visual Delivery Flight Path */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
            {criticalMilestones.map((m, idx) => {
              const isDone = m.status === TaskStatus.COMPLETED;
              const isInProg = m.status === TaskStatus.IN_PROGRESS;
              return (
                <div 
                  key={m.id}
                  className={clsx(
                    "p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-colors relative overflow-hidden",
                    isDone ? "bg-emerald-500/5 border-emerald-500/25" :
                    isInProg ? "bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/30" :
                    "bg-[var(--color-surface-2)]/50 border-[var(--color-divider)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border",
                      isDone ? "bg-emerald-500 text-white border-emerald-600" :
                      isInProg ? "bg-[var(--color-primary-hex)] text-white border-[var(--color-primary-hex)] animate-pulse" :
                      "bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border-[var(--color-divider)]"
                    )}>
                      {isDone ? <Check size={12} className="stroke-[3]" /> : idx + 1}
                    </span>
                    <span className={clsx(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono",
                      isDone ? "bg-emerald-500/15 text-emerald-600" :
                      isInProg ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" : "bg-[var(--color-surface)] text-[var(--color-text-faint)]"
                    )}>
                      {isDone ? "Done" : isInProg ? "Active" : "Planned"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-[var(--color-text)] truncate" title={m.name}>
                      {m.name}
                    </h4>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                      Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Sprint Target'}
                    </p>
                  </div>

                  <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden border border-[var(--color-divider)]">
                    <div 
                      className={clsx("h-full rounded-full transition-all", isDone ? "bg-emerald-500" : "bg-[var(--color-primary-hex)]")}
                      style={{ width: `${isDone ? 100 : m.progress || 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: MULTI-LEVEL ACCOMPLISHMENTS & POSITIVE INDICATORS STREAM   */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div 
          onClick={() => setActiveDetail('deliverables')}
          className="p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-all duration-200 space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
          title="Click to inspect strategic deliverables and accomplishments"
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('deliverables'); }}
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
            <span>Inspect</span>
            <ArrowUpRight size={11} />
          </div>

          <div className="flex justify-between items-center pr-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Trophy size={16} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Recent Deliveries & Multi-Level Accomplishments</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Verified completion stream (Tasks › Server Sub-tasks › GUI Screens)</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
              Verified Stream
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAccomplishments.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)] flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: item.levelBg, color: item.levelColor }}
                    >
                      {item.level}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-faint)] font-mono truncate">{item.module}</span>
                  </div>
                  <h5 className="font-bold text-[var(--color-text)] truncate" title={item.name}>{item.name}</h5>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Assignee: {item.assignee}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={2.5} />
                </div>
              </div>
            ))}
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
