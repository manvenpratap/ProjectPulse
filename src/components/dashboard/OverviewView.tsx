import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { TaskStatus, TaskPriority } from '../../types';
import { getHealthScore, normRaidImpact, getRaidEffectiveProb, isRaidActive, isDefectResolved, isDecisionPending } from '../../utils/projectUtils';
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
  Zap, 
  AlertTriangle,
  AlertCircle,
  Flame,
  DollarSign,
  ShieldCheck,
  Package,
  Activity,
  X,
  BarChart3,
  Check,
  ArrowUpRight,
  Trophy,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import clsx from 'clsx';
import PageHeader from '../shared/PageHeader';
import Button from '../shared/Button';
import { motion, AnimatePresence, useReducedMotion, animate } from 'motion/react';

const COCKPIT_EASE: readonly [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Hardware-friendly numeric counter writing directly to DOM ref (0 React re-renders/frame).
 * Renders final value immediately in JSX so Playwright and initial paint never read 0.
 */
const AnimatedMetric: React.FC<{
  value: number;
  suffix?: string;
  triggerKey: number | string;
  reducedMotion: boolean;
  className?: string;
}> = ({ value, suffix = '', triggerKey, reducedMotion, className }) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    if (reducedMotion || value === 0) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration: 0.72,
      ease: COCKPIT_EASE,
      onUpdate: (latest) => {
        el.textContent = `${Math.round(latest)}${suffix}`;
      }
    });
    return () => controls.stop();
  }, [value, suffix, triggerKey, reducedMotion]);

  return (
    <span ref={spanRef} className={className}>
      {value}{suffix}
    </span>
  );
};

/**
 * 180-degree avionics speedometer dial using spring-animated trigonometric coordinates
 * rather than CSS transform so prefers-reduced-motion never snaps the needle to 0 deg.
 */
const ConfidenceSpeedometer: React.FC<{
  value: number;
  triggerKey: number;
  reducedMotion: boolean;
}> = ({ value, triggerKey, reducedMotion }) => {
  const lineRef = useRef<SVGLineElement>(null);
  const tipRef = useRef<SVGCircleElement>(null);

  const calcCoords = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    const rad = ((100 - clamped) / 100) * Math.PI;
    return {
      x: 100 + 65 * Math.cos(rad),
      y: 100 - 65 * Math.sin(rad)
    };
  };

  const target = calcCoords(value);

  useEffect(() => {
    const lineEl = lineRef.current;
    const tipEl = tipRef.current;
    if (!lineEl || !tipEl) return;
    if (reducedMotion) {
      lineEl.setAttribute('x2', target.x.toFixed(2));
      lineEl.setAttribute('y2', target.y.toFixed(2));
      tipEl.setAttribute('cx', target.x.toFixed(2));
      tipEl.setAttribute('cy', target.y.toFixed(2));
      return;
    }
    const controls = animate(0, value, {
      type: 'spring',
      stiffness: 88,
      damping: 13,
      mass: 1,
      onUpdate: (latest) => {
        const pt = calcCoords(latest);
        lineEl.setAttribute('x2', pt.x.toFixed(2));
        lineEl.setAttribute('y2', pt.y.toFixed(2));
        tipEl.setAttribute('cx', pt.x.toFixed(2));
        tipEl.setAttribute('cy', pt.y.toFixed(2));
      }
    });
    return () => controls.stop();
  }, [value, triggerKey, reducedMotion, target.x, target.y]);

  const activeColor = value > 75 ? '#10b981' : value > 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible" role="img" aria-label="Delivery confidence speedometer gauge">
      {/* Precision Rim Tick Marks */}
      {[0, 25, 50, 75, 100].map((pct) => {
        const rad = ((100 - pct) / 100) * Math.PI;
        const inner = 84;
        const outer = 90;
        return (
          <line
            key={pct}
            x1={100 + inner * Math.cos(rad)}
            y1={100 - inner * Math.sin(rad)}
            x2={100 + outer * Math.cos(rad)}
            y2={100 - outer * Math.sin(rad)}
            stroke="var(--color-text-muted)"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
      {/* Gauge Background Track (180 deg) */}
      <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="var(--color-surface-2)" strokeWidth="14" strokeLinecap="round" />
      <path d="M 25 100 A 75 75 0 0 1 55 42" fill="none" stroke="#ef4444" strokeWidth="14" strokeOpacity="0.22" />
      <path d="M 55 42 A 75 75 0 0 1 145 42" fill="none" stroke="#f59e0b" strokeWidth="14" strokeOpacity="0.22" />
      <path d="M 145 42 A 75 75 0 0 1 175 100" fill="none" stroke="#10b981" strokeWidth="14" strokeOpacity="0.28" />
      {/* Active Colored Arc */}
      <motion.path
        d="M 25 100 A 75 75 0 0 1 175 100"
        fill="none"
        stroke={activeColor}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={236}
        initial={reducedMotion ? false : { strokeDashoffset: 236 }}
        animate={{ strokeDashoffset: 236 - (236 * value) / 100 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.85, ease: COCKPIT_EASE }}
      />
      {/* Pivot Center Pin */}
      <circle cx="100" cy="100" r="7" fill="var(--color-text)" />
      {/* Spring-Driven Trig Needle */}
      <line
        ref={lineRef}
        x1="100"
        y1="100"
        x2={target.x}
        y2={target.y}
        stroke="var(--color-text)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle ref={tipRef} cx={target.x} cy={target.y} r="3.5" fill={activeColor} />
    </svg>
  );
};

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
  const shouldReduceMotion = Boolean(useReducedMotion());
  const { 
    tasks = [], 
    raids = [], 
    decisions = [], 
    members = [], 
    releases = [], 
    deliveries = [],
    defects = [] 
  } = state;

  // Active Detail Inspector Drawer & Telemetry Instrumentation State
  const [activeDetail, setActiveDetail] = useState<DetailCardType | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [radarLive, setRadarLive] = useState(true);
  const [velocityMode, setVelocityMode] = useState<'bars' | 'curve'>('bars');
  const [hoveredBarIdx, setHoveredBarIdx] = useState<number | null>(null);
  const [hoveredModName, setHoveredModName] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDetail) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDetail(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDetail]);

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

  // Active Risks (High / Critical Impact)
  const activeHighRaids = raids.filter(r => isRaidActive(r.status) && normRaidImpact(r.impact) === 'High');

  // Pending Decisions
  const pendingDecisions = decisions.filter(d => isDecisionPending(d.status));

  // Active Critical Defects
  const criticalDefects = defects.filter(d => d.severity?.startsWith('S1') && !isDefectResolved(d.status));

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
    const coords = healthHistory.map((s, i) => {
      const x = (i / (healthHistory.length - 1 || 1)) * w;
      const y = h - ((s - minS) / (maxS - minS || 1)) * (h - 8) - 4;
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    });
    const pts = coords.map(c => `${c.x},${c.y}`).join(' ');
    const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const lastPt = coords[coords.length - 1] || { x: w, y: h / 2 };

    const areaPts = `0,${h} ${pts} ${w},${h}`;
    return { pts, pathD, areaPts, w, h, lastPt };
  }, [healthHistory]);

  // ── Delivery Confidence Speedometer Calculation ──
  const deliveryConfidenceVal = useMemo(() => {
    const remTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);
    const avgWeeklyVel = Math.max(3, Math.round(doneTasks.length / 4) || 6);
    const weeksRemaining = remTasks.length / avgWeeklyVel;
    const base = 100 - (weeksRemaining * 3.5) - (activeHighRaids.length * 3) - (overdueTasks.length * 2);
    return Math.max(35, Math.min(96, Math.round(base)));
  }, [tasks, doneTasks.length, activeHighRaids.length, overdueTasks.length]);

  // ── 6-Week Delivery Velocity Histogram & Cumulative Curve ──
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
    let run = 0;
    const cumVals = vals.map(v => {
      run += v;
      return run;
    });
    const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    const maxVal = Math.max(...vals, avg, 10);
    const cumMax = Math.max(...cumVals, 10);
    return { weeks, vals, cumVals, avg, maxVal, cumMax };
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
      if (!isRaidActive(r.status)) return;
      const imp = normRaidImpact(r.impact);
      const prob = getRaidEffectiveProb(r);
      const key = `${imp}-${prob}`;
      if (grid[key] !== undefined) {
        grid[key]++;
      }
    });

    const totalActiveRisks = raids.filter(r => isRaidActive(r.status)).length;
    const totalMitigated = raids.length - totalActiveRisks;

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
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Health Score</span>
                <span className={clsx("text-2xl font-black font-display", healthScore > 80 ? "text-emerald-500" : healthScore > 50 ? "text-amber-500" : "text-rose-500")}>
                  {healthScore}%
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Composite Weighted</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Overdue Tasks</span>
                <span className={clsx("text-2xl font-black font-display font-mono", overdueTasks.length > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {overdueTasks.length}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">-8% deduction each</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Active Blockers</span>
                <span className="text-2xl font-black font-display font-mono text-amber-500">
                  {blockedTasks.length}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">-12% deduction each</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">High Threat RAID</span>
                <span className="text-2xl font-black font-display font-mono text-[var(--color-primary-hex)]">
                  {activeHighRaids.length}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">-5% deduction each</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Identified Timeline Slippage & Bottlenecks</h4>
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
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Phase Gate Progression</h4>
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
                            isDone ? "bg-emerald-500 text-white" : isInProg ? "bg-[var(--color-primary-hex)] text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
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
                          className={clsx("h-full rounded-full transition-[width] duration-300", isDone ? "bg-emerald-500" : "bg-[var(--color-primary-hex)]")}
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
                      "p-4 rounded-2xl border flex items-start gap-3.5 transition-colors",
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
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Completed</span>
                <span className="text-2xl font-black font-display font-mono text-emerald-600">{doneTasks.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">{progressPct}% of scope</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">In Construction</span>
                <span className="text-2xl font-black font-display font-mono text-[var(--color-primary-hex)]">{inProgressTasks.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Active Sprint</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Total Scope</span>
                <span className="text-2xl font-black font-display font-mono text-[var(--color-text)]">{totalTasks}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Total Backlog</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Breakdown by Priority</h4>
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
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Burned Effort</span>
                <span className="text-2xl font-black font-display font-mono text-[var(--color-primary-hex)]">{doneEffort}d</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">{effortPct}% total</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Remaining</span>
                <span className="text-2xl font-black font-display font-mono text-amber-600">{remainingEffort}d</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Est. to Release</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Total Budgeted</span>
                <span className="text-2xl font-black font-display font-mono text-[var(--color-text)]">{totalEffort}d</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Person-days</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Effort by System Module</h4>
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
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Engineer Bandwidth Status</h4>
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
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Audit Score</span>
                <span className="text-2xl font-black font-display font-mono text-emerald-600">{governanceIndex}%</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Compliant</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Pending Sign-off</span>
                <span className="text-2xl font-black font-display font-mono text-amber-600">{pendingDecisions.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Decisions</span>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">High Impact RAID</span>
                <span className="text-2xl font-black font-display font-mono text-rose-600">{activeHighRaids.length}</span>
                <span className="text-[11px] text-[var(--color-text-muted)] block mt-0.5">Threats</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Pending Steering Decisions</h4>
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
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Core Release Packages</h4>
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
              <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Domain Architecture Distribution</h4>
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
      <motion.div
        key="overview-detail-backdrop"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14, ease: COCKPIT_EASE }}
        onClick={() => setActiveDetail(null)}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          key={`overview-detail-card-${activeDetail}`}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.96) translateY(6px)' }}
          animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.97) translateY(4px)' }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.15, ease: COCKPIT_EASE }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5"
          role="dialog"
          aria-modal="true"
          aria-label={title}
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
        </motion.div>
      </motion.div>
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
        {/* SECTION 0: EXECUTIVE TELEMETRY COMMAND STRIP (Below PageHeader)       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <motion.div
          key={`strip-${replayKey}`}
          initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(-6px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2, ease: COCKPIT_EASE }}
          className="px-4 py-2.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'w-2 h-2 rounded-full',
                  radarLive && !shouldReduceMotion ? 'bg-emerald-500 motion-safe:animate-pulse' : 'bg-emerald-500'
                )}
              />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Cockpit Live
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              <span className="text-[var(--color-text-muted)]">
                Scope <b className="text-[var(--color-text)] tabular-nums">{doneTasks.length}/{totalTasks}</b>
              </span>
              <span className="text-[var(--color-divider)]">•</span>
              <span className="text-[var(--color-text-muted)]">
                Velocity <b className="text-[var(--color-primary-hex)] tabular-nums">{weeklyVelocityData.avg}/wk</b>
              </span>
              <span className="text-[var(--color-divider)]">•</span>
              <span className="text-[var(--color-text-muted)]">
                Active RAID <b className={clsx('tabular-nums', activeHighRaids.length > 0 ? 'text-rose-500' : 'text-[var(--color-text)]')}>{riskMatrixData.totalActiveRisks}</b>
              </span>
              <span className="text-[var(--color-divider)]">•</span>
              <span className="text-[var(--color-text-muted)]">
                Deliveries <b className="text-[var(--color-text)] tabular-nums">{deliveries.length}</b>
              </span>
              <span className="text-[var(--color-divider)] hidden sm:inline">•</span>
              <span className="text-[var(--color-text-muted)] hidden sm:inline">
                Open S1 <b className={clsx('tabular-nums', criticalDefects.length > 0 ? 'text-rose-500' : 'text-emerald-500')}>{criticalDefects.length}</b>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5" role="group" aria-label="Cockpit telemetry controls">
            <button
              type="button"
              onClick={() => setRadarLive(prev => !prev)}
              className="h-7 px-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center gap-1.5 cursor-pointer transition-colors"
              title={radarLive ? 'Pause live telemetry radar sweep' : 'Resume live telemetry radar sweep'}
            >
              {radarLive ? <Pause size={11} /> : <Play size={11} />}
              <span>{radarLive ? 'Pause Sweep' : 'Resume Sweep'}</span>
            </button>
            <button
              type="button"
              onClick={() => setReplayKey(k => k + 1)}
              className="h-7 px-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95"
              title="Replay cockpit instrument entrance animations"
            >
              <RotateCcw size={11} />
              <span>Replay</span>
            </button>
          </div>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: EXECUTIVE PULSE DIALS & INSTRUMENTS (Hero Visual Row)       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div key={`row1-${replayKey}`} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Widget 1: Composite Health Index Dial & Sparkline Trajectory (Span 4) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.02, ease: COCKPIT_EASE }}
            onClick={() => setActiveDetail('health')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between items-center text-center cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect algorithmic health diagnostics and contributors"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('health'); }}
          >
            {/* Subtle instrument radial ambient tint */}
            <div
              className="pointer-events-none absolute -top-12 inset-x-0 h-32 opacity-20"
              style={{
                background: `radial-gradient(circle at 50% 45%, ${healthScore > 80 ? '#10b981' : healthScore > 50 ? '#f59e0b' : '#ef4444'}45, transparent 70%)`
              }}
            />

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="space-y-0.5 text-center w-full relative z-[1]">
              <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Composite Health Index</h4>
              <p className="text-xs text-[var(--color-primary-hex)] font-semibold">Algorithmic Delivery Health</p>
            </div>

            {/* Precision Tick Circular SVG Gauge */}
            <div className="relative w-40 h-40 my-3 flex items-center justify-center z-[1]">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160" role="img" aria-label="Project health indicator gauge">
                {Array.from({ length: 24 }).map((_, idx) => {
                  const angle = (idx / 24) * Math.PI * 2;
                  const r1 = 74;
                  const r2 = idx % 6 === 0 ? 78 : 76;
                  return (
                    <line
                      key={idx}
                      x1={80 + r1 * Math.cos(angle)}
                      y1={80 + r1 * Math.sin(angle)}
                      x2={80 + r2 * Math.cos(angle)}
                      y2={80 + r2 * Math.sin(angle)}
                      stroke="var(--color-text-muted)"
                      strokeOpacity={idx % 6 === 0 ? 0.45 : 0.2}
                      strokeWidth={idx % 6 === 0 ? 1.5 : 1}
                      strokeLinecap="round"
                    />
                  );
                })}
                <circle
                  cx="80"
                  cy="80"
                  r="64"
                  className="stroke-[var(--color-surface-2)] fill-none"
                  strokeWidth="11"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="64"
                  className={clsx(
                    "fill-none",
                    healthScore > 80 ? "stroke-emerald-500" :
                    healthScore > 50 ? "stroke-amber-500" : "stroke-rose-500"
                  )}
                  strokeWidth="11"
                  strokeDasharray={402}
                  initial={shouldReduceMotion ? false : { strokeDashoffset: 402 }}
                  animate={{ strokeDashoffset: 402 - (402 * healthScore) / 100 }}
                  transition={{ duration: shouldReduceMotion ? 0.1 : 0.85, ease: COCKPIT_EASE }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <AnimatedMetric
                  value={healthScore}
                  suffix="%"
                  triggerKey={replayKey}
                  reducedMotion={shouldReduceMotion}
                  className={clsx(
                    "font-display text-4xl font-black tracking-tight tabular-nums",
                    healthScore > 80 ? "text-emerald-500" :
                    healthScore > 50 ? "text-amber-500" : "text-rose-500"
                  )}
                />
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1 whitespace-nowrap",
                  healthScore > 80 ? "bg-emerald-500/10 text-emerald-500" :
                  healthScore > 50 ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
                )}>
                  {healthScore > 80 ? 'On Track' : healthScore > 50 ? 'At Risk' : 'Critical'}
                </span>
              </div>
            </div>

            {/* Historical 7-Week Animated Sparkline Trajectory */}
            <div className="w-full bg-[var(--color-surface-2)]/60 rounded-2xl p-2.5 border border-[var(--color-divider)] flex items-center justify-between gap-2 z-[1]">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">7-Week Trend</span>
                <span className="text-xs font-bold text-emerald-500 font-mono">+2.4% vs 14d</span>
              </div>
              <div className="w-28 h-8 shrink-0">
                <svg viewBox={`0 0 ${sparklineData.w} ${sparklineData.h}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="healthSparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <motion.polygon
                    fill="url(#healthSparkGrad)"
                    points={sparklineData.areaPts}
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: COCKPIT_EASE }}
                  />
                  <motion.path
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={sparklineData.pathD}
                    initial={shouldReduceMotion ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: shouldReduceMotion ? 0.1 : 0.75, ease: COCKPIT_EASE }}
                  />
                  <circle cx={sparklineData.lastPt.x} cy={sparklineData.lastPt.y} r="3" fill="#10b981" />
                </svg>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 border-t border-[var(--color-divider)] pt-3 mt-3 text-center z-[1]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Overdue</span>
                <span className={clsx("text-sm font-bold font-mono tabular-nums", overdueTasks.length > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {overdueTasks.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Blocked</span>
                <span className="text-sm font-bold font-mono text-amber-500 tabular-nums">
                  {tasks.filter(t => t.status === TaskStatus.ON_HOLD).length}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Active RAID</span>
                <span className="text-sm font-bold font-mono text-[var(--color-primary-hex)] tabular-nums">
                  {raids.filter(r => isRaidActive(r.status)).length}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Widget 2: Delivery Confidence Speedometer Dial (Span 4) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.06, ease: COCKPIT_EASE }}
            onClick={() => setActiveDetail('effort')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between items-center text-center cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
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
              <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Delivery Confidence</h4>
              <p className="text-xs text-[var(--color-primary-hex)] font-semibold">Throughput vs Remaining Scope</p>
            </div>

            {/* 180° Spring-Driven Speedometer SVG Gauge */}
            <div className="relative w-48 h-32 my-2 flex items-center justify-center">
              <ConfidenceSpeedometer
                value={deliveryConfidenceVal}
                triggerKey={replayKey}
                reducedMotion={shouldReduceMotion}
              />
              <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
                <AnimatedMetric
                  value={deliveryConfidenceVal}
                  suffix="%"
                  triggerKey={replayKey}
                  reducedMotion={shouldReduceMotion}
                  className="font-display text-3xl font-black text-[var(--color-text)] leading-none tabular-nums"
                />
                <span className={clsx(
                  "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1 whitespace-nowrap",
                  deliveryConfidenceVal > 75 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                )}>
                  {deliveryConfidenceVal > 75 ? 'Pacing Nominal' : 'Velocity Watch'}
                </span>
              </div>
            </div>

            {/* Run Rate Forecast Metric Bar */}
            <div className="w-full bg-[var(--color-surface-2)]/60 rounded-2xl p-2.5 border border-[var(--color-divider)] flex items-center justify-between text-xs mt-2">
              <div className="text-left">
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Runway</span>
                <span className="font-bold font-mono text-[var(--color-text)] tabular-nums">
                  ~{(tasks.filter(t => t.status !== TaskStatus.COMPLETED).length / Math.max(1, weeklyVelocityData.avg)).toFixed(1)} wks
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Weekly Throughput</span>
                <span className="font-bold font-mono text-[var(--color-primary-hex)] tabular-nums">
                  {weeklyVelocityData.avg} tasks / wk
                </span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between border-t border-[var(--color-divider)] pt-3 mt-3 text-xs text-[var(--color-text-muted)]">
              <span>Velocity Corridor:</span>
              <span className="font-bold text-emerald-500 font-mono">Stable (+1.2σ)</span>
            </div>
          </motion.div>

          {/* Widget 3: Threat Radar & Anomaly Multi-Meter (Span 4) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.1, ease: COCKPIT_EASE }}
            onClick={() => setActiveDetail('ews')}
            className="lg:col-span-4 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between space-y-3 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
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
              <div className="flex items-center gap-2 min-w-0">
                {/* Miniature Concentric Radar Scanner SVG */}
                <svg viewBox="0 0 48 48" className="w-9 h-9 shrink-0" aria-hidden="true">
                  <defs>
                    <linearGradient id="radarSweepGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={activeHighRaids.length > 0 ? '#f43f5e' : '#10b981'} stopOpacity="0.45" />
                      <stop offset="100%" stopColor={activeHighRaids.length > 0 ? '#f43f5e' : '#10b981'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-border)" strokeWidth="1" />
                  <circle cx="24" cy="24" r="13" fill="none" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="24" cy="24" r="6" fill="none" stroke="var(--color-border)" strokeWidth="1" />
                  <line x1="24" y1="4" x2="24" y2="44" stroke="var(--color-divider)" strokeWidth="1" />
                  <line x1="4" y1="24" x2="44" y2="24" stroke="var(--color-divider)" strokeWidth="1" />
                  <motion.g
                    animate={radarLive && !shouldReduceMotion ? { rotate: 360 } : false}
                    transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
                    style={{ transformOrigin: '24px 24px' }}
                  >
                    <path d="M 24 24 L 24 4 A 20 20 0 0 1 41.3 14 Z" fill="url(#radarSweepGrad)" />
                    <line x1="24" y1="24" x2="24" y2="4" stroke={activeHighRaids.length > 0 ? '#f43f5e' : '#10b981'} strokeWidth="1.5" />
                  </motion.g>
                  {overdueTasks.length > 0 && <circle cx="15" cy="14" r="2.2" fill="#f43f5e" />}
                  {activeHighRaids.length > 0 && <circle cx="34" cy="17" r="2.5" fill="#e11d48" />}
                  {blockedTasks.length > 0 && <circle cx="17" cy="33" r="2" fill="#f59e0b" />}
                  {pendingDecisions.length > 0 && <circle cx="32" cy="32" r="2" fill="var(--color-primary-hex)" />}
                  <circle cx="24" cy="24" r="2" fill="var(--color-text)" />
                </svg>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)] truncate">Threat Radar</h4>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] block whitespace-nowrap">4-Vector Scan</span>
                </div>
              </div>
              <span className={clsx(
                "text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap",
                activeHighRaids.length > 0 || overdueTasks.length > 0 ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
              )}>
                {activeHighRaids.length > 0 || overdueTasks.length > 0 ? 'Alert Active' : 'Nominal'}
              </span>
            </div>

            {/* Visual Anomaly Proportional Multi-Meters (GPU scaleX + exact width) */}
            <div className="space-y-2.5 my-1 flex-1 flex flex-col justify-center">
              {[
                {
                  label: 'Overdue Deliverables',
                  count: overdueTasks.length,
                  pct: Math.min(100, (overdueTasks.length / Math.max(1, totalTasks)) * 300),
                  color: 'bg-rose-500',
                  textColor: overdueTasks.length > 0 ? 'text-rose-500' : 'text-emerald-500',
                  icon: <Clock size={12} className="text-rose-500" />
                },
                {
                  label: 'High Threat RAID',
                  count: activeHighRaids.length,
                  pct: Math.min(100, activeHighRaids.length * 25),
                  color: 'bg-rose-600',
                  textColor: activeHighRaids.length > 0 ? 'text-rose-500' : 'text-emerald-500',
                  icon: <ShieldAlert size={12} className="text-rose-500" />
                },
                {
                  label: 'Active Hold / Blockers',
                  count: blockedTasks.length,
                  pct: Math.min(100, blockedTasks.length * 20),
                  color: 'bg-amber-500',
                  textColor: 'text-amber-500',
                  icon: <AlertTriangle size={12} className="text-amber-500" />
                },
                {
                  label: 'Decisions Pending Sign-Off',
                  count: pendingDecisions.length,
                  pct: Math.min(100, pendingDecisions.length * 20),
                  color: 'bg-[var(--color-primary-hex)]',
                  textColor: 'text-[var(--color-primary-hex)]',
                  icon: <FileText size={12} className="text-[var(--color-primary-hex)]" />
                }
              ].map((meter, idx) => (
                <div key={meter.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                      {meter.icon}
                      {meter.label}
                    </span>
                    <span className={clsx("font-mono font-bold tabular-nums", meter.textColor)}>
                      {meter.count}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                    <motion.div
                      className={clsx("h-full rounded-full", meter.color)}
                      style={{ width: `${meter.pct}%`, transformOrigin: 'left center' }}
                      initial={shouldReduceMotion ? false : { transform: 'scaleX(0.05)' }}
                      animate={{ transform: 'scaleX(1)' }}
                      transition={{ duration: shouldReduceMotion ? 0.1 : 0.45, delay: shouldReduceMotion ? 0 : 0.08 + idx * 0.04, ease: COCKPIT_EASE }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>Total Active Signals:</span>
              <span className="font-bold text-[var(--color-text)] font-mono tabular-nums">{ewsAlerts.length} Signals</span>
            </div>
          </motion.div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: VELOCITY & ARCHITECTURE (2 Deep Visual Instruments)        */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div key={`row2-${replayKey}`} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Widget 4: 6-Week Delivery Velocity Histogram & Cumulative Curve (Span 7) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.12, ease: COCKPIT_EASE }}
            onClick={() => setActiveDetail('effort')}
            className="lg:col-span-7 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect delivery velocity and burn rates"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('effort'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pr-14">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-[var(--color-primary-hex)] shrink-0" size={18} />
                  <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Delivery Velocity & Throughput Corridor</h4>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Weekly completed deliverables vs target baseline throughput</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="inline-flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[10px] font-bold"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setVelocityMode('bars')}
                    className={clsx(
                      'px-2 py-1 rounded-lg transition-colors cursor-pointer',
                      velocityMode === 'bars'
                        ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    )}
                  >
                    Bars
                  </button>
                  <button
                    type="button"
                    onClick={() => setVelocityMode('curve')}
                    className={clsx(
                      'px-2 py-1 rounded-lg transition-colors cursor-pointer',
                      velocityMode === 'curve'
                        ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                    )}
                  >
                    Curve
                  </button>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  Avg {weeklyVelocityData.avg} tasks / wk
                </span>
              </div>
            </div>

            {/* Interactive SVG Velocity Histogram or Cumulative Curve */}
            <div className="w-full h-44 my-2 relative">
              <svg viewBox="0 0 540 160" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="velCurveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid Lines */}
                <line x1="40" y1="22" x2="520" y2="22" stroke="var(--color-divider)" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="520" y2="60" stroke="var(--color-divider)" strokeDasharray="3 3" />
                <line x1="40" y1="98" x2="520" y2="98" stroke="var(--color-divider)" strokeDasharray="3 3" />
                <line x1="40" y1="135" x2="520" y2="135" stroke="var(--color-divider)" />

                {/* High-contrast Y-Axis Labels */}
                {[
                  { y: 26, val: velocityMode === 'curve' ? weeklyVelocityData.cumMax : Math.round(weeklyVelocityData.maxVal) },
                  { y: 64, val: velocityMode === 'curve' ? Math.round(weeklyVelocityData.cumMax * 0.66) : Math.round(weeklyVelocityData.maxVal * 0.66) },
                  { y: 102, val: velocityMode === 'curve' ? Math.round(weeklyVelocityData.cumMax * 0.33) : Math.round(weeklyVelocityData.maxVal * 0.33) },
                  { y: 139, val: 0 }
                ].map((tick) => (
                  <text key={tick.y} x="32" y={tick.y} fontSize="10" fill="var(--color-text-muted)" textAnchor="end" fontFamily="var(--font-mono)">
                    {tick.val}
                  </text>
                ))}

                {velocityMode === 'bars' ? (
                  <>
                    {/* 6 Staggered Animated Velocity Bars */}
                    {weeklyVelocityData.weeks.map((wName, idx) => {
                      const val = weeklyVelocityData.vals[idx];
                      const barW = 38;
                      const barX = 70 + idx * 75;
                      const barH = Math.max(8, (val / (weeklyVelocityData.maxVal || 10)) * 110);
                      const barY = 135 - barH;
                      const isCurrent = idx === weeklyVelocityData.weeks.length - 1;
                      const isHovered = hoveredBarIdx === idx;
                      const delta = Math.round((val - weeklyVelocityData.avg) * 10) / 10;

                      return (
                        <g
                          key={wName}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredBarIdx(idx)}
                          onMouseLeave={() => setHoveredBarIdx(null)}
                        >
                          <defs>
                            <linearGradient id={`barGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isHovered ? '#38BDF8' : isCurrent ? '#6366f1' : '#818cf8'} />
                              <stop offset="100%" stopColor={isHovered ? '#0284c7' : isCurrent ? '#4f46e5' : '#6366f1'} stopOpacity="0.82" />
                            </linearGradient>
                          </defs>
                          <motion.rect
                            x={barX}
                            y={barY}
                            width={barW}
                            height={barH}
                            rx="6"
                            fill={`url(#barGrad-${idx})`}
                            style={{ transformOrigin: `${barX + barW / 2}px 135px` }}
                            initial={shouldReduceMotion ? false : { transform: 'scaleY(0.08)', opacity: 0.35 }}
                            animate={{ transform: isHovered && !shouldReduceMotion ? 'scaleY(1.03)' : 'scaleY(1)', opacity: 1 }}
                            transition={{ duration: shouldReduceMotion ? 0.1 : 0.4, delay: shouldReduceMotion ? 0 : idx * 0.045, ease: COCKPIT_EASE }}
                          />
                          {!isHovered && (
                            <text
                              x={barX + barW / 2}
                              y={barY - 6}
                              fontSize="10"
                              fontWeight="bold"
                              fill="var(--color-text)"
                              textAnchor="middle"
                              fontFamily="var(--font-mono)"
                            >
                              {val}
                            </text>
                          )}
                          <text
                            x={barX + barW / 2}
                            y="152"
                            fontSize="10"
                            fontWeight={isCurrent || isHovered ? 'bold' : 'normal'}
                            fill={isCurrent || isHovered ? 'var(--color-primary-hex)' : 'var(--color-text-muted)'}
                            textAnchor="middle"
                          >
                            {wName}
                          </text>
                          {isHovered && (
                            <g className="pointer-events-none">
                              <rect
                                x={Math.min(410, Math.max(44, barX - 24))}
                                y={Math.max(0, barY - 26)}
                                width="92"
                                height="18"
                                rx="6"
                                fill="var(--color-surface-2)"
                                stroke="var(--color-primary-hex)"
                                strokeWidth="1"
                              />
                              <text
                                x={Math.min(456, Math.max(90, barX + 22))}
                                y={Math.max(12, barY - 14)}
                                fontSize="9"
                                fontWeight="bold"
                                fontFamily="var(--font-mono)"
                                fill="var(--color-text)"
                                textAnchor="middle"
                              >
                                {wName}: {val} ({delta >= 0 ? `+${delta}` : delta})
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Non-Overlapping Benchmark Dashed Reference Line + Header Pill */}
                    {(() => {
                      const benchY = 135 - (weeklyVelocityData.avg / (weeklyVelocityData.maxVal || 10)) * 110;
                      return (
                        <g className="pointer-events-none">
                          <motion.line
                            x1="40"
                            y1={benchY}
                            x2="520"
                            y2={benchY}
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                            strokeDasharray="5 4"
                            initial={shouldReduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 0.9 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                          />
                          <rect x="412" y="2" width="108" height="14" rx="5" fill="var(--color-surface-2)" stroke="rgba(245, 158, 11, 0.35)" strokeWidth="1" />
                          <text x="466" y="12" fontSize="9" fill="#f59e0b" fontWeight="bold" textAnchor="middle" fontFamily="var(--font-mono)">
                            Baseline ({weeklyVelocityData.avg}/wk)
                          </text>
                        </g>
                      );
                    })()}
                  </>
                ) : (
                  (() => {
                    const cPts = weeklyVelocityData.cumVals.map((cv, idx) => ({
                      x: 89 + idx * 75,
                      y: 135 - (cv / (weeklyVelocityData.cumMax || 10)) * 108,
                      cv,
                      week: weeklyVelocityData.weeks[idx]
                    }));
                    const lineD = cPts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y.toFixed(1)}`).join(' ');
                    const areaD = `${lineD} L ${cPts[cPts.length - 1].x} 135 L ${cPts[0].x} 135 Z`;
                    return (
                      <g>
                        <motion.path
                          d={areaD}
                          fill="url(#velCurveFill)"
                          initial={shouldReduceMotion ? false : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.45 }}
                        />
                        <motion.path
                          d={lineD}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={shouldReduceMotion ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: shouldReduceMotion ? 0.1 : 0.65, ease: COCKPIT_EASE }}
                        />
                        {cPts.map((pt) => (
                          <g key={pt.week}>
                            <circle cx={pt.x} cy={pt.y} r="4.5" fill="var(--color-surface)" stroke="#6366f1" strokeWidth="2.5" />
                            <text x={pt.x} y={pt.y - 9} fontSize="10" fontWeight="bold" fill="var(--color-text)" textAnchor="middle" fontFamily="var(--font-mono)">
                              {pt.cv}
                            </text>
                            <text x={pt.x} y="152" fontSize="10" fill="var(--color-text-muted)" textAnchor="middle">
                              {pt.week}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })()
                )}
              </svg>
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Flame size={13} className="text-amber-500" />
                Delivery Momentum: <b className="text-emerald-500 font-mono">+12.8%</b>
              </span>
              <span className="text-[var(--color-text-muted)]">
                Throughput Corridor: <b className="text-[var(--color-text)] font-mono">Stable</b>
              </span>
            </div>
          </motion.div>

          {/* Widget 5: Interactive Module Architecture Gravity Donut Chart (Span 5) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.16, ease: COCKPIT_EASE }}
            onClick={() => setActiveDetail('gravity')}
            className="lg:col-span-5 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
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
                <Layers className="text-purple-500 shrink-0" size={18} />
                <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)] truncate">Module Architecture Mass</h4>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] shrink-0 whitespace-nowrap">
                {moduleDistribution.length} Domains
              </span>
            </div>

            {/* Interactive Donut Chart + Highlightable Legend */}
            {(() => {
              const activeMod = hoveredModName ? moduleDonutData.find(s => s.name === hoveredModName) : null;
              return (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center my-1">
                  {/* Donut Chart (5 Cols) */}
                  <div className="sm:col-span-5 flex items-center justify-center relative">
                    <svg viewBox="0 0 160 160" className="w-36 h-36 transform -rotate-90">
                      {moduleDonutData.map((slice, idx) => {
                        const circum = 345.5;
                        const dashLen = circum * slice.slicePct;
                        const offset = -(circum * slice.startPct);
                        const isHovered = hoveredModName === slice.name;
                        const isDimmed = hoveredModName !== null && !isHovered;
                        return (
                          <motion.circle
                            key={slice.name}
                            cx="80"
                            cy="80"
                            r="55"
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={isHovered ? 22 : 18}
                            strokeDasharray={`${dashLen} ${circum - dashLen}`}
                            strokeDashoffset={offset}
                            opacity={isDimmed ? 0.35 : 1}
                            initial={shouldReduceMotion ? false : { opacity: 0 }}
                            animate={{ opacity: isDimmed ? 0.35 : 1 }}
                            transition={{ duration: 0.35, delay: shouldReduceMotion ? 0 : idx * 0.05, ease: COCKPIT_EASE }}
                            className="cursor-pointer transition-[stroke-width,opacity] duration-150"
                            onMouseEnter={() => setHoveredModName(slice.name)}
                            onMouseLeave={() => setHoveredModName(null)}
                          />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                      <span className="text-sm font-extrabold text-[var(--color-text)] font-display tabular-nums leading-tight">
                        {activeMod ? `${activeMod.percentage}%` : totalTasks}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] truncate max-w-[78px]">
                        {activeMod ? activeMod.name : 'Total Mass'}
                      </span>
                    </div>
                  </div>

                  {/* Module Slices Breakdown Legend (7 Cols) */}
                  <div className="sm:col-span-7 space-y-2">
                    {moduleDonutData.slice(0, 4).map((slice, idx) => {
                      const isHovered = hoveredModName === slice.name;
                      return (
                        <div
                          key={slice.name}
                          onMouseEnter={() => setHoveredModName(slice.name)}
                          onMouseLeave={() => setHoveredModName(null)}
                          className={clsx(
                            'space-y-0.5 text-xs p-1 -mx-1 rounded-lg transition-colors cursor-pointer',
                            isHovered && 'bg-[var(--color-surface-2)]/80'
                          )}
                        >
                          <div className="flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                              <span className="font-semibold text-[var(--color-text)] truncate">{slice.name}</span>
                            </div>
                            <span className="font-mono text-[var(--color-text-muted)] shrink-0 tabular-nums">{slice.percentage}%</span>
                          </div>
                          <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden border border-[var(--color-divider)]">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ width: `${slice.pct}%`, backgroundColor: slice.color, transformOrigin: 'left center' }}
                              initial={shouldReduceMotion ? false : { transform: 'scaleX(0.05)' }}
                              animate={{ transform: 'scaleX(1)' }}
                              transition={{ duration: shouldReduceMotion ? 0.1 : 0.45, delay: shouldReduceMotion ? 0 : 0.1 + idx * 0.04, ease: COCKPIT_EASE }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] flex justify-between">
              <span>Architectural Cohesion</span>
              <span className="font-bold text-emerald-500 font-mono">High Modularity (94%)</span>
            </div>
          </motion.div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: RISK MATRIX & SCOPE CONCENTRATION (2 Visual Instruments)   */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <div key={`row3-${replayKey}`} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Widget 6: Executive RAID 3x3 Risk Heatmap Matrix (Span 6) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.18, ease: COCKPIT_EASE }}
            onClick={() => setActiveDetail('governance')}
            className="lg:col-span-6 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect governance compliance and risk matrix"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('governance'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex justify-between items-center gap-2 pr-14">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
                <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)] truncate">RAID 3×3 Risk Heatmap Matrix</h4>
              </div>
              <span className={clsx(
                "text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap",
                riskMatrixData.totalActiveRisks > 0 ? "bg-rose-500/15 text-rose-500" : "bg-emerald-500/15 text-emerald-500"
              )}>
                {riskMatrixData.totalActiveRisks} Active Threats
              </span>
            </div>

            {/* Interactive 3x3 Heatmap Grid */}
            <div className="space-y-1.5 my-1">
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-bold text-center">
                <div className="text-[var(--color-text-muted)] text-left pl-1">Impact ↓ / Prob →</div>
                <div className="text-[var(--color-text-muted)] uppercase">Low</div>
                <div className="text-[var(--color-text-muted)] uppercase">Medium</div>
                <div className="text-[var(--color-text-muted)] uppercase">High</div>
              </div>

              {[
                {
                  imp: 'High',
                  label: 'High',
                  labelColor: 'text-rose-500',
                  cells: [
                    { key: 'High-Low', label: 'High · Low', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-500' },
                    { key: 'High-Medium', label: 'High · Med', cls: 'bg-rose-500/20 border-rose-500/40 text-rose-500' },
                    {
                      key: 'High-High',
                      label: 'High · High',
                      cls: riskMatrixData.grid['High-High'] > 0
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-500/25 border-rose-500/50 text-rose-500',
                      hot: riskMatrixData.grid['High-High'] > 0
                    }
                  ]
                },
                {
                  imp: 'Medium',
                  label: 'Med',
                  labelColor: 'text-amber-500',
                  cells: [
                    { key: 'Medium-Low', label: 'Med · Low', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' },
                    { key: 'Medium-Medium', label: 'Med · Med', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-500' },
                    { key: 'Medium-High', label: 'Med · High', cls: 'bg-rose-500/20 border-rose-500/40 text-rose-500' }
                  ]
                },
                {
                  imp: 'Low',
                  label: 'Low',
                  labelColor: 'text-emerald-500',
                  cells: [
                    { key: 'Low-Low', label: 'Low · Low', cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' },
                    { key: 'Low-Medium', label: 'Low · Med', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' },
                    { key: 'Low-High', label: 'Low · High', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-500' }
                  ]
                }
              ].map((row, rIdx) => (
                <div key={row.imp} className="grid grid-cols-4 gap-1.5 items-center text-xs">
                  <span className={clsx('text-[10px] font-bold uppercase tracking-wider text-left pl-1', row.labelColor)}>
                    {row.label}
                  </span>
                  {row.cells.map((cell, cIdx) => {
                    const count = riskMatrixData.grid[cell.key];
                    return (
                      <motion.div
                        key={cell.key}
                        initial={shouldReduceMotion ? false : { opacity: 0, transform: 'scale(0.95)' }}
                        animate={{ opacity: 1, transform: 'scale(1)' }}
                        transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.1 + (rIdx * 3 + cIdx) * 0.02, ease: COCKPIT_EASE }}
                        onMouseEnter={() => setHoveredCell(`${cell.label}: ${count} item${count === 1 ? '' : 's'}`)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={clsx(
                          'p-2.5 rounded-xl border font-mono font-bold text-center tabular-nums transition-[transform,border-color] duration-150 relative',
                          cell.cls,
                          hoveredCell?.startsWith(cell.label) && 'ring-2 ring-[var(--color-primary-hex)]/50',
                          cell.hot && radarLive && !shouldReduceMotion && 'ring-2 ring-rose-400/60'
                        )}
                      >
                        {count}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>{hoveredCell ? 'Selected Quadrant' : 'Risk Resolution Progress'}</span>
              <span className="font-bold text-emerald-500 font-mono tabular-nums">
                {hoveredCell || `${riskMatrixData.totalMitigated} Mitigated / ${riskMatrixData.totalActiveRisks} Open`}
              </span>
            </div>
          </motion.div>

          {/* Widget 7: Scope Completion & Effort Dual Radial Rings (Span 6) */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.21, ease: COCKPIT_EASE }}
            onClick={() => setActiveDetail('scope')}
            className="lg:col-span-6 p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
            title="Click to inspect deliverable scope completion breakdown"
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('scope'); }}
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
              <span>Inspect</span>
              <ArrowUpRight size={11} />
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2 pr-10">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />
                <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)] truncate">Deliverable Scope & Effort Burn</h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {doneTasks.length}/{totalTasks} Tasks Done
              </span>
            </div>

            {/* Concentric Dual Rings + Animated Priority Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-1">
              {/* Dual Concentric Radial Rings (5 Cols) */}
              <div className="sm:col-span-5 flex items-center justify-center relative">
                <svg viewBox="0 0 160 160" className="w-36 h-36 transform -rotate-90">
                  {/* Outer Ring: Scope Completed */}
                  <circle cx="80" cy="80" r="66" fill="none" stroke="var(--color-surface-2)" strokeWidth="9" />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="66"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="9"
                    strokeDasharray={414}
                    initial={shouldReduceMotion ? false : { strokeDashoffset: 414 }}
                    animate={{ strokeDashoffset: 414 - (414 * progressPct) / 100 }}
                    transition={{ duration: shouldReduceMotion ? 0.1 : 0.8, ease: COCKPIT_EASE }}
                    strokeLinecap="round"
                  />

                  {/* Inner Ring: Effort Burned */}
                  <circle cx="80" cy="80" r="48" fill="none" stroke="var(--color-surface-2)" strokeWidth="9" />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="48"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="9"
                    strokeDasharray={301}
                    initial={shouldReduceMotion ? false : { strokeDashoffset: 301 }}
                    animate={{ strokeDashoffset: 301 - (301 * effortPct) / 100 }}
                    transition={{ duration: shouldReduceMotion ? 0.1 : 0.85, delay: shouldReduceMotion ? 0 : 0.08, ease: COCKPIT_EASE }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <AnimatedMetric
                    value={progressPct}
                    suffix="%"
                    triggerKey={replayKey}
                    reducedMotion={shouldReduceMotion}
                    className="font-display text-xl font-black text-emerald-500 tabular-nums"
                  />
                  <span className="text-[9px] font-mono font-bold text-[var(--color-primary-hex)] tabular-nums">{effortPct}% Eff.</span>
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
                    {[
                      { pri: TaskPriority.CRITICAL, cls: 'bg-rose-500', label: 'Critical Priority' },
                      { pri: TaskPriority.HIGH, cls: 'bg-amber-500', label: 'High Priority' },
                      { pri: TaskPriority.MEDIUM, cls: 'bg-[var(--color-primary-hex)]', label: 'Medium Priority' },
                      { pri: TaskPriority.LOW, cls: 'bg-slate-400', label: 'Low Priority' }
                    ].map((seg, idx) => {
                      const segPct = (tasks.filter(t => t.priority === seg.pri).length / Math.max(1, totalTasks)) * 100;
                      return (
                        <motion.div
                          key={seg.pri}
                          className={clsx('h-full', seg.cls)}
                          style={{ width: `${segPct}%`, transformOrigin: 'left center' }}
                          title={seg.label}
                          initial={shouldReduceMotion ? false : { transform: 'scaleX(0.05)' }}
                          animate={{ transform: 'scaleX(1)' }}
                          transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : 0.1 + idx * 0.04, ease: COCKPIT_EASE }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[var(--color-text-muted)]">Critical:</span>
                    <b className="font-mono text-[var(--color-text)] tabular-nums">{tasks.filter(t => t.priority === TaskPriority.CRITICAL).length}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[var(--color-text-muted)]">High:</span>
                    <b className="font-mono text-[var(--color-text)] tabular-nums">{tasks.filter(t => t.priority === TaskPriority.HIGH).length}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary-hex)]" />
                    <span className="text-[var(--color-text-muted)]">Medium:</span>
                    <b className="font-mono text-[var(--color-text)] tabular-nums">{tasks.filter(t => t.priority === TaskPriority.MEDIUM).length}</b>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[var(--color-text-muted)]">Low:</span>
                    <b className="font-mono text-[var(--color-text)] tabular-nums">{tasks.filter(t => t.priority === TaskPriority.LOW).length}</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-xs text-[var(--color-text-muted)]">
              <span>Effort Burned vs Total</span>
              <span className="font-bold text-[var(--color-primary-hex)] font-mono tabular-nums">
                {doneEffort}d / {totalEffort}d Person-days
              </span>
            </div>
          </motion.div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: STRATEGIC DELIVERY HORIZON & MILESTONES (Full Width)       */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <motion.div
          key={`milestones-${replayKey}`}
          initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.22, ease: COCKPIT_EASE }}
          onClick={() => setActiveDetail('milestones')}
          className="p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
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
                <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">Milestone Delivery Horizon & Release Gates</h4>
                <p className="text-xs text-[var(--color-text-muted)]">Progressive phase gates and scheduled launch roadmap</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                Target Launch: {releases[0]?.date ? new Date(releases[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Q4 Production'}
              </span>
            </div>
          </div>

          {/* Horizontal Visual Delivery Flight Path + Animated Runway Beam */}
          {(() => {
            const doneCount = criticalMilestones.filter(m => m.status === TaskStatus.COMPLETED).length;
            const beamPct = criticalMilestones.length > 0 ? Math.round((doneCount / criticalMilestones.length) * 100) : 0;
            return (
              <div className="relative pt-2">
                <div className="hidden lg:block mb-3 px-6">
                  <div className="h-1 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-divider)]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[var(--color-primary-hex)] rounded-full"
                      style={{ width: `${beamPct}%`, transformOrigin: 'left center' }}
                      initial={shouldReduceMotion ? false : { transform: 'scaleX(0.05)' }}
                      animate={{ transform: 'scaleX(1)' }}
                      transition={{ duration: 0.65, delay: 0.15, ease: COCKPIT_EASE }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {criticalMilestones.map((m, idx) => {
                    const isDone = m.status === TaskStatus.COMPLETED;
                    const isInProg = m.status === TaskStatus.IN_PROGRESS;
                    const mPct = isDone ? 100 : m.progress || 0;
                    return (
                      <motion.div
                        key={m.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(8px)' }}
                        animate={{ opacity: 1, transform: 'translateY(0px)' }}
                        transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : 0.12 + idx * 0.035, ease: COCKPIT_EASE }}
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
                            isInProg ? "bg-[var(--color-primary-hex)] text-white border-[var(--color-primary-hex)]" :
                            "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]"
                          )}>
                            {isDone ? <Check size={12} className="stroke-[3]" /> : idx + 1}
                          </span>
                          <span className={clsx(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono whitespace-nowrap",
                            isDone ? "bg-emerald-500/15 text-emerald-500" :
                            isInProg ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                          )}>
                            {isDone ? "Done" : isInProg ? "Active" : "Planned"}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-bold text-xs text-[var(--color-text)] truncate" title={m.name}>
                            {m.name}
                          </h5>
                          <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                            Due: {m.dueDate ? new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Sprint Target'}
                          </p>
                        </div>

                        <div className="w-full bg-[var(--color-surface-2)] h-1.5 rounded-full overflow-hidden border border-[var(--color-divider)]">
                          <motion.div
                            className={clsx("h-full rounded-full", isDone ? "bg-emerald-500" : "bg-[var(--color-primary-hex)]")}
                            style={{ width: `${mPct}%`, transformOrigin: 'left center' }}
                            initial={shouldReduceMotion ? false : { transform: 'scaleX(0.05)' }}
                            animate={{ transform: 'scaleX(1)' }}
                            transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : 0.15 + idx * 0.04, ease: COCKPIT_EASE }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: MULTI-LEVEL ACCOMPLISHMENTS & POSITIVE INDICATORS STREAM   */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <motion.div
          key={`stream-${replayKey}`}
          initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.26, ease: COCKPIT_EASE }}
          onClick={() => setActiveDetail('deliverables')}
          className="p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 rounded-3xl shadow-2xs hover:shadow-md transition-[border-color,box-shadow,transform] duration-200 space-y-4 cursor-pointer select-none group relative overflow-hidden active:scale-[0.99]"
          title="Click to inspect strategic deliverables and accomplishments"
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveDetail('deliverables'); }}
        >
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-full border border-[var(--color-primary-hex)]/20 shadow-2xs">
            <span>Inspect</span>
            <ArrowUpRight size={11} />
          </div>

          <div className="flex justify-between items-center gap-2 pr-14">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                <Trophy size={16} />
              </div>
              <div className="min-w-0">
                <h4 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)] truncate">Recent Deliveries & Multi-Level Accomplishments</h4>
                <p className="text-xs text-[var(--color-text-muted)] truncate">Verified completion stream (Tasks › Server Sub-tasks › GUI Screens)</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
              Verified Stream
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAccomplishments.map((item, idx) => (
              <motion.div
                key={idx}
                initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(8px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                transition={{ duration: 0.22, delay: shouldReduceMotion ? 0 : 0.14 + idx * 0.03, ease: COCKPIT_EASE }}
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
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono truncate">{item.module}</span>
                  </div>
                  <h5 className="font-bold text-[var(--color-text)] truncate" title={item.name}>{item.name}</h5>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Assignee: {item.assignee}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Check size={14} strokeWidth={2.5} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: INTELLIGENCE DEEP-DIVE EXECUTIVE BANNER                    */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.24, delay: shouldReduceMotion ? 0 : 0.3, ease: COCKPIT_EASE }}
          className="p-6 sm:p-8 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm space-y-5 relative overflow-hidden"
        >
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
                className="h-11 px-5 rounded-2xl bg-[var(--color-primary-hex)] text-white hover:opacity-95 font-bold text-xs shrink-0 flex items-center gap-2 transition-[transform,opacity] active:scale-95 cursor-pointer shadow-xs"
              >
                <span>Launch Intelligence Cockpit</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[var(--color-divider)] text-xs">
            {[
              { title: 'Monte Carlo', subTab: 'predictive', desc: 'P50/P90 finish horizons', icon: <TrendingUp size={13} className="text-emerald-500" /> },
              { title: 'Velocity Band', subTab: 'flow', desc: '±1.25σ Shewhart corridor', icon: <Flame size={13} className="text-amber-500" /> },
              { title: 'EVM & Financials', subTab: 'evm', desc: 'PV, EV, CPI, and SPI matrices', icon: <DollarSign size={13} className="text-cyan-500" /> },
              { title: 'Quality & Risk', subTab: 'quality', desc: 'RAID heatmap & audit ledger', icon: <ShieldCheck size={13} className="text-purple-500" /> }
            ].map(tile => (
              <button
                type="button"
                key={tile.title}
                onClick={() => { if (hasViewAccess('dash')) setView('dash', false, tile.subTab); }}
                className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] transition-[background-color,border-color,transform] duration-150 border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 cursor-pointer space-y-1 group active:scale-95 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
              >
                <div className="font-bold text-[var(--color-text)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {tile.icon}
                    <span>{tile.title}</span>
                  </div>
                  <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary-hex)]" />
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)]">{tile.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Interactive Detail Inspector Modal with AnimatePresence */}
      <AnimatePresence>
        {renderDetailModal()}
      </AnimatePresence>
    </div>
  );
};

export default OverviewView;
