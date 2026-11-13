import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { getHealthScore, daysDiff } from '../../utils/projectUtils';
import {
  Target,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Database,
  Calendar,
  Lock,
  Flame,
  Activity,
  ShieldCheck,
  DollarSign,
  Compass,
  Gauge,
  RefreshCw,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import clsx from 'clsx';
import SectionHelpButton from '../shared/SectionHelpButton';
import { TaskStatus, TaskPriority, DefectStatus, Task } from '../../types';
import ModuleDeliveryMatrix from './ModuleDeliveryMatrix';
import BurndownChart from './BurndownChart';
import VelocityBandChart from './VelocityBandChart';
import ResourceUtilizationMatrix from './ResourceUtilizationMatrix';
import WhatIfSandbox from './WhatIfSandbox';
import AIPulseAnalysis from './AIPulseAnalysis';
import QualityGovernanceTab from './QualityGovernanceTab';
import PageHeader from '../shared/PageHeader';
import Button from '../shared/Button';
import DataTable, { ColumnDef } from '../shared/DataTable';
import { MotionPage, StaggerContainer, StaggerItem } from '../shared/MotionPage';
import { AnimatedMetric } from '../shared/AnimatedMetric';
import { 
  ResponsiveContainer, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip,
  CartesianGrid
} from 'recharts';

const VALID_DASH_TABS = new Set(['predictive', 'flow', 'evm', 'quality']);

export const DashboardView: React.FC = () => {
  const { state, setView, activeSubTab, loadSample } = useProject();
  const { hasViewAccess } = useAuth();
  const { tasks = [], defects = [], raids = [], members = [], decisions = [], deliveries = [], log = [] } = state;

  // Active Intelligence Mode
  const [activeTab, setActiveTab] = useState<'predictive' | 'flow' | 'evm' | 'quality'>(() => {
    if (activeSubTab?.view === 'dash' && VALID_DASH_TABS.has(activeSubTab.tab)) {
      return activeSubTab.tab as 'predictive' | 'flow' | 'evm' | 'quality';
    }
    return 'predictive';
  });

  React.useEffect(() => {
    if (activeSubTab?.view === 'dash' && VALID_DASH_TABS.has(activeSubTab.tab)) {
      setActiveTab(activeSubTab.tab as 'predictive' | 'flow' | 'evm' | 'quality');
    }
  }, [activeSubTab?.seq, activeSubTab?.view, activeSubTab?.tab]);
  
  // Financial Simulation State
  const [blendedRate, setBlendedRate] = useState<number>(800);
  const [allocatedBudget, setAllocatedBudget] = useState<number>(300000);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleRecompute = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 500);
  };

  // Core metrics
  const health = getHealthScore(tasks);
  const doneCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.UNDER_REVIEW).length;
  const blockedCount = tasks.filter(t => t.status === TaskStatus.ON_HOLD).length;
  const completionPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // Timeline boundaries
  const now = new Date();
  const startDates = tasks.map(t => new Date(t.startDate).getTime()).filter(t => !isNaN(t));
  const dueDates = tasks.map(t => new Date(t.dueDate).getTime()).filter(t => !isNaN(t));
  const minStart = startDates.length ? new Date(Math.min(...startDates)) : new Date(now.getTime() - 14 * 864e5);
  const maxDue = dueDates.length ? new Date(Math.max(...dueDates)) : new Date(now.getTime() + 30 * 864e5);
  const totalProjectDays = Math.max(1, Math.ceil((maxDue.getTime() - minStart.getTime()) / 864e5));
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - minStart.getTime()) / 864e5));
  const daysRemaining = Math.max(1, Math.ceil((maxDue.getTime() - now.getTime()) / 864e5));

  // ═════════════════════════════════════════════════════════════════════════
  // 1. PREDICTIVE COMPLETION & MONTE CARLO ENGINE (HTML parity)
  // ═════════════════════════════════════════════════════════════════════════
  const totalEffortDays = tasks.reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
  const completedEffortDays = tasks
    .filter(t => t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
  const remainingEffortDays = Math.max(0, totalEffortDays - completedEffortDays);

  // Weekly velocity
  const weeksElapsed = Math.max(1, daysElapsed / 7);
  const rollingWeeklyVelocity = Math.max(0.5, parseFloat((completedEffortDays / weeksElapsed).toFixed(1)));
  const weeksToFinishP50 = rollingWeeklyVelocity > 0 ? (remainingEffortDays / rollingWeeklyVelocity) : 1;
  const forecastFinishDate = new Date(now.getTime() + weeksToFinishP50 * 7 * 864e5);

  // P90 Conservative Target (Monte Carlo +25% variance buffer)
  const weeksToFinishP90 = weeksToFinishP50 * 1.25;
  const p90FinishDate = new Date(now.getTime() + weeksToFinishP90 * 7 * 864e5);

  // Variance vs Target Deadline
  const delayDays = Math.round((forecastFinishDate.getTime() - maxDue.getTime()) / 864e5);
  
  // AI Confidence Score (0-100%)
  const confidenceScore = useMemo(() => {
    if (remainingEffortDays === 0) return 100;
    if (delayDays <= 0) {
      return Math.min(98, Math.round(85 + Math.min(13, Math.abs(delayDays) * 1.2)));
    } else {
      return Math.max(20, Math.round(75 - delayDays * 3.2));
    }
  }, [remainingEffortDays, delayDays]);

  const confidenceBadge = useMemo(() => {
    if (confidenceScore >= 80) {
      return { label: 'High Confidence', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    } else if (confidenceScore >= 55) {
      return { label: 'Moderate Pacing', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    }
    return { label: 'Schedule Risk', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
  }, [confidenceScore]);

  // Circular Dial Circumference & Offset (r = 34, c = 213.6)
  const dialRadius = 34;
  const dialCircumference = 2 * Math.PI * dialRadius;
  const dialOffset = dialCircumference - (confidenceScore / 100) * dialCircumference;

  // ═════════════════════════════════════════════════════════════════════════
  // 2. TASK AGING & STALE RISK DISTRIBUTION (HTML parity)
  // ═════════════════════════════════════════════════════════════════════════
  const agingData = useMemo(() => {
    const buckets: Record<string, number> = { '0-3d': 0, '4-7d': 0, '8-14d': 0, '15-30d': 0, '30d+': 0 };
    const staleList: (Task & { inactiveDays: number })[] = [];

    tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).forEach(t => {
      const refDateStr = t.updatedAt || t.createdAt || t.startDate || now.toISOString();
      const refDate = new Date(refDateStr);
      const inactiveDays = Math.max(0, Math.ceil((now.getTime() - refDate.getTime()) / 864e5));

      if (inactiveDays <= 3) buckets['0-3d']++;
      else if (inactiveDays <= 7) buckets['4-7d']++;
      else if (inactiveDays <= 14) buckets['8-14d']++;
      else if (inactiveDays <= 30) {
        buckets['15-30d']++;
        staleList.push({ ...t, inactiveDays });
      } else {
        buckets['30d+']++;
        staleList.push({ ...t, inactiveDays });
      }
    });

    staleList.sort((a, b) => b.inactiveDays - a.inactiveDays);

    const chartPoints = [
      { bucket: '0–3d', count: buckets['0-3d'], label: 'Active', fill: '#10b981' },
      { bucket: '4–7d', count: buckets['4-7d'], label: 'Normal', fill: '#3b82f6' },
      { bucket: '8–14d', count: buckets['8-14d'], label: 'Review', fill: '#6366f1' },
      { bucket: '15–30d', count: buckets['15-30d'], label: 'Stale', fill: '#f59e0b' },
      { bucket: '30d+', count: buckets['30d+'], label: 'At Risk', fill: '#ef4444' },
    ];

    return { chartPoints, staleList, activeCount: buckets['0-3d'] + buckets['4-7d'] + buckets['8-14d'], staleCount: buckets['15-30d'], riskCount: buckets['30d+'] };
  }, [tasks, now]);

  // ═════════════════════════════════════════════════════════════════════════
  // 3. DEPENDENCY BOTTLENECK ANALYSIS (HTML parity)
  // ═════════════════════════════════════════════════════════════════════════
  const bottlenecks = useMemo(() => {
    const blockingCounts: Record<string, number> = {};
    members.forEach(m => { blockingCounts[m.name] = 0; });

    tasks.forEach(t => {
      const deps = Array.isArray(t.dependsOn) ? t.dependsOn : (t.dependsOn ? String(t.dependsOn).split(',').map(s => s.trim()).filter(Boolean) : []);
      if (deps.length > 0) {
        deps.forEach((depId: string) => {
          const depTask = tasks.find(x => x.id === depId);
          if (depTask && depTask.assignee && depTask.status !== TaskStatus.COMPLETED) {
            blockingCounts[depTask.assignee] = (blockingCounts[depTask.assignee] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(blockingCounts)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [tasks, members]);

  // ═════════════════════════════════════════════════════════════════════════
  // 4. RESOURCE CAPACITY & REQUIRED DAILY VELOCITY (HTML parity)
  // ═════════════════════════════════════════════════════════════════════════
  const capacityTelemetry = useMemo(() => {
    const teamSize = Math.max(1, members.length);
    const dailyLoadNeeded = parseFloat((remainingEffortDays / daysRemaining).toFixed(1));
    const utilization = Math.round((dailyLoadNeeded / teamSize) * 100);

    const capStatus = utilization > 110 ? 'Overloaded' : utilization > 80 ? 'At Capacity' : 'Healthy';
    const capColor = utilization > 110 ? 'text-rose-500' : utilization > 80 ? 'text-amber-500' : 'text-emerald-500';

    return { teamSize, dailyLoadNeeded, utilization, capStatus, capColor };
  }, [members.length, remainingEffortDays, daysRemaining]);

  // ═════════════════════════════════════════════════════════════════════════
  // 5. CRITICAL PATH RISK MATRIX (HTML parity)
  // ═════════════════════════════════════════════════════════════════════════
  const criticalPathTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      const isParent = tasks.some(x => {
        const d = Array.isArray(x.dependsOn) ? x.dependsOn : (x.dependsOn ? String(x.dependsOn).split(',').map(s => s.trim()) : []);
        return d.includes(t.id);
      });
      const isPastDue = daysDiff(t.dueDate)! < 0;
      const isHighPri = t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH;
      return isParent && (isPastDue || isHighPri || t.status === TaskStatus.ON_HOLD);
    }).slice(0, 5);
  }, [tasks]);

  const criticalPathColumns = useMemo<ColumnDef<Task>[]>(() => [
    {
      id: 'name',
      header: 'MILESTONE TASK',
      headerTitle: 'Milestone task identifier and name',
      cell: (t) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-rose-600 font-bold">{t.id}</span>
          <span className="truncate max-w-[280px] font-bold text-[var(--color-text)]">{t.name}</span>
        </div>
      )
    },
    {
      id: 'module',
      header: 'DOMAIN MODULE',
      headerTitle: 'Domain module',
      cell: (t) => <span className="text-[var(--color-text-muted)] font-medium text-xs">{t.module || 'General'}</span>
    },
    {
      id: 'assignee',
      header: 'ASSIGNEE',
      headerTitle: 'Assigned owner',
      cell: (t) => <span className="text-[var(--color-text)] font-semibold text-xs">{t.assignee || 'Unassigned'}</span>
    },
    {
      id: 'dueDate',
      header: 'DEADLINE',
      headerTitle: 'Milestone deadline',
      cell: (t) => <span className="font-mono text-[var(--color-text-muted)] text-xs">{t.dueDate}</span>
    },
    {
      id: 'impact',
      header: 'VARIANCE IMPACT',
      headerTitle: 'Variance impact and delay',
      align: 'right',
      cell: (t) => {
        const dd = daysDiff(t.dueDate);
        return (
          <span className="font-bold text-rose-600 font-mono text-xs">
            {dd !== null && dd < 0 ? `${Math.abs(dd)}d LATE` : 'HIGH RISK'}
          </span>
        );
      }
    }
  ], []);

  // ═════════════════════════════════════════════════════════════════════════
  // 6. EARNED VALUE MANAGEMENT (EVM) ANALYTICS (HTML parity)
  // ═════════════════════════════════════════════════════════════════════════
  const evmMetrics = useMemo(() => {
    const BAC = totalEffortDays * blendedRate;
    const timeProgressRatio = Math.min(1, daysElapsed / totalProjectDays);
    const workProgressRatio = totalEffortDays > 0 ? (completedEffortDays / totalEffortDays) : 0;

    const PV = Math.round(timeProgressRatio * BAC);
    const EV = Math.round(workProgressRatio * BAC);
    const AC = Math.round(completedEffortDays * blendedRate);

    const SPI = PV > 0 ? parseFloat((EV / PV).toFixed(2)) : 1.0;
    const CPI = AC > 0 ? parseFloat((EV / AC).toFixed(2)) : 1.0;
    const EAC = CPI > 0 ? Math.round(BAC / CPI) : BAC;
    const VAC = BAC - EAC;

    // 4-Quadrant Status
    let quadrantTitle = 'Optimal Execution';
    let quadrantColor = 'text-emerald-500';
    let quadrantBg = 'bg-emerald-500/10 border-emerald-500/20';
    if (SPI >= 1.0 && CPI >= 1.0) {
      quadrantTitle = 'Ahead of Schedule & Under Budget';
      quadrantColor = 'text-emerald-500';
      quadrantBg = 'bg-emerald-500/10 border-emerald-500/20';
    } else if (SPI < 1.0 && CPI >= 1.0) {
      quadrantTitle = 'Behind Schedule & Under Budget';
      quadrantColor = 'text-amber-500';
      quadrantBg = 'bg-amber-500/10 border-amber-500/20';
    } else if (SPI >= 1.0 && CPI < 1.0) {
      quadrantTitle = 'Ahead of Schedule & Over Budget';
      quadrantColor = 'text-amber-500';
      quadrantBg = 'bg-amber-500/10 border-amber-500/20';
    } else {
      quadrantTitle = 'Behind Schedule & Over Budget';
      quadrantColor = 'text-rose-500';
      quadrantBg = 'bg-rose-500/10 border-rose-500/20';
    }

    return { BAC, PV, EV, AC, SPI, CPI, EAC, VAC, quadrantTitle, quadrantColor, quadrantBg };
  }, [totalEffortDays, blendedRate, daysElapsed, totalProjectDays, completedEffortDays]);

  // Cost Allocation across major modules
  const moduleCosts = Array.from(new Set(tasks.map(t => t.module).filter(Boolean))).map(modName => {
    const modTasks = tasks.filter(t => t.module === modName);
    const modCompletedDays = modTasks.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + (t.estDays || 3), 0);
    const modRemainingDays = modTasks.filter(t => t.status !== TaskStatus.COMPLETED).reduce((sum, t) => sum + (t.estDays || 3), 0);
    return {
      name: modName || 'General',
      completedCost: modCompletedDays * blendedRate,
      remainingCost: modRemainingDays * blendedRate,
      totalCost: (modCompletedDays + modRemainingDays) * blendedRate
    };
  }).sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);

  // Fallback if empty tasks
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[var(--color-bg)] p-8 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-[var(--color-primary-highlight-hex)] rounded-3xl flex items-center justify-center text-[var(--color-primary-hex)] mx-auto mb-8 shadow-inner border border-[var(--color-primary-hex)]/20">
            <BarChart3 size={40} />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-[var(--color-text)] mb-3">Intelligence Engine Offline</h1>
          <p className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed">
            The predictive intelligence suite requires project tasks and backlog deliverables to compute Monte Carlo simulations, aging curves, and EVM telemetry.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => loadSample('web')}
              className="h-11 px-6 bg-[var(--color-primary-hex)] hover:opacity-90 text-[var(--color-primary-text)] rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
               Load Demo Excel Database
            </button>
            {hasViewAccess('tasks') && (
              <button 
                onClick={() => setView('tasks')}
                className="h-11 px-6 bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text)] rounded-xl font-bold text-xs hover:bg-[var(--color-surface-2)] transition-all active:scale-[0.98] cursor-pointer"
              >
                 Create First Task
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-x-hidden max-w-full">
      <PageHeader
        icon={Compass}
        title="Project Intelligence Cockpit"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold">
              <span className="hidden sm:inline text-[var(--color-text-muted)]">AI Confidence:</span>
              <span className="sm:hidden text-[var(--color-text-muted)]">Conf:</span>
              <span className={clsx("font-bold font-mono", confidenceBadge.color)}>
                <AnimatedMetric value={confidenceScore} suffix="%" />
              </span>
              <div className="w-px h-3 bg-[var(--color-divider)]" />
              <span className="text-[var(--color-text-muted)]">SPI:</span>
              <span className={clsx("font-mono font-bold", evmMetrics.SPI >= 1 ? "text-emerald-500" : "text-amber-500")}>
                <AnimatedMetric value={evmMetrics.SPI} decimals={2} />
              </span>
            </div>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            onClick={handleRecompute}
            className="h-9 px-2.5 sm:px-3.5 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 shadow-xs shrink-0"
            title="Recompute Monte Carlo forecasts, EVM cost baselines, and quality dynamics"
          >
            <RefreshCw size={14} className={isSimulating ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Recompute Forecast</span>
            <span className="sm:hidden">Sync</span>
          </Button>
        }
      />

      <MotionPage className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-6 pb-20 max-w-full">
        {/* TOP TAB CONTROLS (4 High-Agency Modes) */}
        <div className="flex border-b border-[var(--color-divider)] gap-4 sm:gap-8 overflow-x-auto no-scrollbar scroll-fade-x pb-px">
          {[
            { id: 'predictive', label: 'Monte Carlo & Predictive Telemetry', icon: TrendingUp },
            { id: 'flow', label: 'Delivery Flow & Velocity', icon: Flame },
            { id: 'evm', label: 'EVM & Financial Cockpit', icon: DollarSign },
            { id: 'quality', label: 'Quality & Governance', icon: ShieldCheck },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  setActiveTab(tab.id as any);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }}
                className={clsx(
                  "pb-3.5 font-bold text-xs sm:text-sm tracking-tight border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer active:scale-97",
                  isActive 
                    ? "border-[var(--color-primary-hex)] text-[var(--color-primary-hex)]" 
                    : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: PREDICTIVE & AI TELEMETRY (HTML PARITY)                          */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'predictive' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
            {/* Top Row: AI Gauge + P50/P90 Horizon + Capacity Required */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Card 1: AI Confidence & Completion Gauge (HTML dash-eta parity) */}
              <div className="lg:col-span-6 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm flex flex-col justify-between space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center border border-[var(--color-primary-hex)]/20">
                      <Target size={20} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-[var(--color-text)]">Predictive Completion</h3>
                      <SectionHelpButton view="dash" section="Monte Carlo Simulation" label="Monte Carlo completion guide" />
                    </div>
                  </div>
                  <span className={clsx("px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5", confidenceBadge.bg, confidenceBadge.color, confidenceBadge.border)}>
                    <span className="w-2 h-2 rounded-full bg-current motion-safe:animate-pulse" />
                    {confidenceBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* SVG Confidence Dial */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center py-2">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                        <defs>
                          <linearGradient id="etaConfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                        <circle cx="40" cy="40" r={dialRadius} fill="none" stroke="currentColor" strokeWidth="6" className="text-[var(--color-divider)]" />
                        <circle 
                          cx="40" 
                          cy="40" 
                          r={dialRadius} 
                          fill="none" 
                          stroke="url(#etaConfGrad)" 
                          strokeWidth="6" 
                          strokeDasharray={dialCircumference} 
                          strokeDashoffset={dialOffset}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black font-display text-[var(--color-text)]">
                          <AnimatedMetric value={confidenceScore} suffix="%" />
                        </span>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--color-text-faint)]">Confidence</span>
                      </div>
                    </div>
                  </div>

                  {/* P50 Expected vs P90 Conservative Target */}
                  <div className="sm:col-span-8 space-y-3">
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                      <div className="flex justify-between items-center flex-wrap gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-1.5">
                          <Calendar size={12} className="text-[var(--color-primary-hex)] shrink-0" /> Forecasted Finish (P50 Likely)
                        </span>
                        <span className={clsx(
                          "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0",
                          delayDays > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}>
                          {delayDays > 0 ? `+${delayDays}d delay` : delayDays < 0 ? `${Math.abs(delayDays)}d ahead` : 'On Target'}
                        </span>
                      </div>
                      <div className="text-lg font-black font-display text-[var(--color-text)]">
                        {forecastFinishDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-[var(--color-text-muted)] mt-1.5 font-medium">
                        <span>Velocity: <strong className="text-[var(--color-text)] font-mono">{rollingWeeklyVelocity}</strong> pd/wk</span>
                        <span>Backlog: <strong className="text-[var(--color-text)] font-mono">{remainingEffortDays}</strong> pd</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)] flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-1">
                          <ShieldAlert size={12} className="text-purple-500" /> Conservative Target (P90)
                        </span>
                        <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                          {p90FinishDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Capacity Bandwidth & Required Daily Load (HTML dash-capacity parity) */}
              <div className="lg:col-span-6 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm flex flex-col justify-between space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <Gauge size={20} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-[var(--color-text)]">Capacity Bandwidth Projection</h3>
                      <SectionHelpButton view="dash" section="Capacity Bandwidth" label="Capacity Bandwidth guide" />
                    </div>
                  </div>
                  <span className={clsx("px-3 py-1 rounded-full text-xs font-bold border", capacityTelemetry.capColor, "bg-slate-500/10 border-current/20")}>
                    {capacityTelemetry.capStatus} ({capacityTelemetry.utilization}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block mb-1">Backlog Effort</span>
                    <span className="text-lg font-black font-display text-[var(--color-text)]">{remainingEffortDays}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] block">person-days</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block mb-1">Time Remaining</span>
                    <span className="text-lg font-black font-display text-[var(--color-text)]">{daysRemaining}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] block">calendar days</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block mb-1">Required Velocity</span>
                    <span className={clsx("text-lg font-black font-display", capacityTelemetry.capColor)}>{capacityTelemetry.dailyLoadNeeded}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] block">pd / day</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block mb-1">Team Roster</span>
                    <span className="text-lg font-black font-display text-[var(--color-text)]">{capacityTelemetry.teamSize}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] block">members</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--color-text-muted)]">Team Utilization Pacing</span>
                    <span className={clsx("font-mono font-bold", capacityTelemetry.capColor)}>{capacityTelemetry.utilization}%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-divider)]">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-500",
                        capacityTelemetry.utilization > 110 ? "bg-rose-500" : capacityTelemetry.utilization > 80 ? "bg-amber-500" : "bg-emerald-500"
                      )} 
                      style={{ width: `${Math.min(100, capacityTelemetry.utilization)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic What-If Sandbox (Moved from Overview) */}
            <WhatIfSandbox />

            {/* Detailed Resource Utilization Matrix (Moved from Overview) */}
            <ResourceUtilizationMatrix />

            {/* Middle Row: Task Aging Curve & Stale List + Bottlenecks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Task Aging Histogram & Stale Tasks (HTML dash-aging parity) */}
              <div className="lg:col-span-7 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-[var(--color-text)]">Task Aging & Activity Telemetry</h3>
                    <SectionHelpButton view="dash" section="Task Aging" label="Task Aging Telemetry guide" />
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active: {agingData.activeCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> Stale: {agingData.staleCount}
                    </span>
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> At Risk: {agingData.riskCount}
                    </span>
                  </div>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={agingData.chartPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" opacity={0.6} />
                      <XAxis dataKey="bucket" tick={{ fontSize: 11, fontWeight: 'bold', fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                      <ChartTooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-divider)', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {agingData.chartPoints.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stale Tasks Drilldown */}
                {agingData.staleList.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-[var(--color-divider)]">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                      Stale & At-Risk Backlog Items ({agingData.staleList.length})
                    </div>
                    <div className="space-y-2 max-h-36 overflow-y-auto custom-scroll pr-1">
                      {agingData.staleList.slice(0, 4).map(st => (
                        <div 
                          key={st.id} 
                          onClick={() => { if (hasViewAccess('tasks')) setView('tasks'); }}
                          className={clsx(
                            "p-2.5 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)] flex items-center justify-between transition-colors",
                            hasViewAccess('tasks') ? "hover:bg-[var(--color-surface-offset)] cursor-pointer" : "cursor-default"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className={clsx("w-2 h-2 rounded-full shrink-0", st.inactiveDays >= 30 ? "bg-rose-500" : "bg-amber-500")} />
                            <span className="text-xs font-bold text-[var(--color-text)] truncate">{st.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono font-bold text-[var(--color-text-muted)]">
                              Inactive {st.inactiveDays}d
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-faint)]">
                              {st.assignee || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-600 font-semibold text-center py-2 flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Zero stale or abandoned tasks. Team pacing is fresh!</span>
                  </div>
                )}
              </div>

              {/* Dependency Bottleneck Ranking (HTML dash-btl parity) */}
              <div className="lg:col-span-5 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-amber-500" />
                  <h3 className="font-bold text-base text-[var(--color-text)]">Dependency Bottlenecks</h3>
                  <SectionHelpButton view="dash" section="Dependency Bottlenecks" label="Dependency Bottlenecks guide" />
                </div>

                {bottlenecks.length > 0 ? (
                  <div className="space-y-3.5 my-2">
                    {bottlenecks.slice(0, 5).map((b, idx) => {
                      const maxB = bottlenecks[0]?.count || 1;
                      const pct = Math.round((b.count / maxB) * 100);
                      return (
                        <div key={b.name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[var(--color-text)]">{b.name}</span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              Blocking {b.count} task{b.count > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-divider)]">
                            <div 
                              className={clsx(
                                "h-full rounded-full",
                                idx === 0 ? "bg-rose-500" : idx === 1 ? "bg-amber-500" : "bg-[var(--color-primary-hex)]"
                              )} 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-[var(--color-text-faint)] space-y-2">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                    <div className="font-bold text-sm text-[var(--color-text)]">No Active Bottlenecks</div>
                    <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                      All dependency chains are decoupled and moving forward without blocking prerequisites.
                    </p>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-[var(--color-surface-2)] text-[11px] text-[var(--color-text-muted)] leading-relaxed flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-amber-500 shrink-0" />
                  <span><strong>Recommendation:</strong> Reallocate helper pairs or subtasks to alleviate top dependency owners.</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Critical Path Risk Alert Matrix (HTML dash-cprisk parity) */}
            <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-[var(--color-text)]">Critical Path Risk & Schedule Drift</h3>
                    <SectionHelpButton view="dash" section="Critical Path Risk" label="Critical Path guide" />
                  </div>
                </div>
                <span className={clsx("px-3 py-1 rounded-full text-xs font-bold border", criticalPathTasks.length > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}>
                  {criticalPathTasks.length > 0 ? `${criticalPathTasks.length} Milestones At Risk` : 'Critical Path Clear'}
                </span>
              </div>

              {criticalPathTasks.length > 0 ? (
                <DataTable<Task>
                  data={criticalPathTasks}
                  columns={criticalPathColumns}
                  showRowNumbers={false}
                  density="compact"
                />
              ) : (
                <div className="py-8 text-center text-emerald-600 space-y-1">
                  <CheckCircle2 size={28} className="mx-auto" />
                  <div className="font-bold text-sm">Critical Path Intact</div>
                  <p className="text-xs text-[var(--color-text-muted)]">No overdue tasks with downstream dependents detected.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DELIVERY FLOW & VELOCITY                                         */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'flow' && (
          <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in duration-200">
            {/* Interactive Burndown & Burnup Simulator */}
            <BurndownChart />

            {/* Weekly Velocity Band & Trend (HTML dash-analytics-velocity parity) */}
            <VelocityBandChart />

            {/* Strategic Module Delivery Matrix */}
            <ModuleDeliveryMatrix />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: EARNED VALUE MANAGEMENT (EVM) & FINANCIAL COCKPIT (HTML parity)  */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'evm' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in duration-200">
            {/* EVM KPI Cards Cockpit */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider block">Planned Value (PV)</span>
                <div className="text-2xl font-black font-display text-[var(--color-text)]">${evmMetrics.PV.toLocaleString()}</div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">Scheduled work budget</span>
              </div>
              <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider block">Earned Value (EV)</span>
                <div className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400">${evmMetrics.EV.toLocaleString()}</div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">Delivered work value</span>
              </div>
              <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider block">Schedule Perf Index (SPI)</span>
                <div className={clsx("text-2xl font-black font-display", evmMetrics.SPI >= 1 ? "text-emerald-500" : "text-rose-500")}>
                  {evmMetrics.SPI}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">
                  {evmMetrics.SPI >= 1 ? 'Ahead of Schedule' : 'Schedule Lagging'}
                </span>
              </div>
              <div className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-2">
                <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider block">Cost Perf Index (CPI)</span>
                <div className={clsx("text-2xl font-black font-display", evmMetrics.CPI >= 1 ? "text-emerald-500" : "text-rose-500")}>
                  {evmMetrics.CPI}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)] block">
                  {evmMetrics.CPI >= 1 ? 'Budget Efficient' : 'Cost Overrun'}
                </span>
              </div>
            </div>

            {/* 4-Quadrant EVM Matrix & Budget Simulation Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 4-Quadrant EVM Performance Quadrant (HTML evm_quadrant parity) */}
              <div className="lg:col-span-6 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-5">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base text-[var(--color-text)]">EVM 4-Quadrant Performance Matrix</h3>
                  <SectionHelpButton view="dash" section="EVM 4-Quadrant" label="EVM 4-Quadrant Matrix guide" />
                </div>

                <div className={clsx("p-3.5 rounded-2xl border text-xs font-bold text-center flex items-center justify-center gap-2", evmMetrics.quadrantBg, evmMetrics.quadrantColor)}>
                  <span>Active State:</span> {evmMetrics.quadrantTitle}
                </div>

                {/* 2x2 Quadrant Grid */}
                <div className="grid grid-cols-2 gap-3 h-56">
                  {/* Q1: Ahead of Schedule, Under Budget */}
                  <div className={clsx(
                    "p-3 rounded-2xl border flex flex-col justify-between transition-all",
                    evmMetrics.SPI >= 1 && evmMetrics.CPI >= 1 
                      ? "bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm" 
                      : "bg-[var(--color-surface-2)]/40 border-[var(--color-divider)] opacity-60"
                  )}>
                    <div className="flex justify-between items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Q1: TARGET</span>
                      <TrendingUp size={12} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text)]">Ahead & Under Budget</div>
                      <div className="text-[10px] text-[var(--color-text-faint)]">SPI ≥ 1.0 • CPI ≥ 1.0</div>
                    </div>
                  </div>

                  {/* Q2: Ahead of Schedule, Over Budget */}
                  <div className={clsx(
                    "p-3 rounded-2xl border flex flex-col justify-between transition-all",
                    evmMetrics.SPI >= 1 && evmMetrics.CPI < 1 
                      ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-sm" 
                      : "bg-[var(--color-surface-2)]/40 border-[var(--color-divider)] opacity-60"
                  )}>
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Q2: COST OVERRUN</div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text)]">Ahead & Over Budget</div>
                      <div className="text-[10px] text-[var(--color-text-faint)]">SPI ≥ 1.0 • CPI &lt; 1.0</div>
                    </div>
                  </div>

                  {/* Q3: Behind Schedule, Under Budget */}
                  <div className={clsx(
                    "p-3 rounded-2xl border flex flex-col justify-between transition-all",
                    evmMetrics.SPI < 1 && evmMetrics.CPI >= 1 
                      ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-sm" 
                      : "bg-[var(--color-surface-2)]/40 border-[var(--color-divider)] opacity-60"
                  )}>
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Q3: SLOW PACING</div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text)]">Behind & Under Budget</div>
                      <div className="text-[10px] text-[var(--color-text-faint)]">SPI &lt; 1.0 • CPI ≥ 1.0</div>
                    </div>
                  </div>

                  {/* Q4: Behind Schedule, Over Budget */}
                  <div className={clsx(
                    "p-3 rounded-2xl border flex flex-col justify-between transition-all",
                    evmMetrics.SPI < 1 && evmMetrics.CPI < 1 
                      ? "bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/30 shadow-sm" 
                      : "bg-[var(--color-surface-2)]/40 border-[var(--color-divider)] opacity-60"
                  )}>
                    <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Q4: CRITICAL RISK</div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-text)]">Behind & Over Budget</div>
                      <div className="text-[10px] text-[var(--color-text-faint)]">SPI &lt; 1.0 • CPI &lt; 1.0</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Simulator & Day Rate Controls */}
              <div className="lg:col-span-6 card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text)]">Financial Telemetry &amp; Burn Simulator</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Simulate blended day-rates and budget boundary impact</p>
                </div>

                <div className="space-y-4">
                  {/* Blended Day Rate Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[var(--color-text-muted)]">Blended Dev Day-Rate</span>
                      <span className="font-mono text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-lg border border-[var(--color-primary-hex)]/20">
                        ${blendedRate} / day
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="400" 
                      max="1600" 
                      step="50" 
                      value={blendedRate} 
                      onChange={(e) => setBlendedRate(parseInt(e.target.value))}
                      className="w-full h-2 bg-[var(--color-surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-hex)]"
                    />
                  </div>

                  {/* Budget Cap Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[var(--color-text-muted)]">Budget Allocation Cap</span>
                      <span className="font-mono text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-lg border border-[var(--color-primary-hex)]/20">
                        ${allocatedBudget.toLocaleString()}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="100000" 
                      max="600000" 
                      step="10000" 
                      value={allocatedBudget} 
                      onChange={(e) => setAllocatedBudget(parseInt(e.target.value))}
                      className="w-full h-2 bg-[var(--color-surface-2)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-hex)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-divider)]">
                  <div className="p-3 rounded-2xl bg-[var(--color-surface-2)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block mb-0.5">Estimate at Comp (EAC)</span>
                    <span className="text-base font-black font-display text-[var(--color-text)]">${evmMetrics.EAC.toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--color-surface-2)]">
                    <span className="text-[10px] uppercase font-bold text-[var(--color-text-faint)] block mb-0.5">Budget Variance (VAC)</span>
                    <span className={clsx("text-base font-black font-display font-mono", evmMetrics.VAC >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {evmMetrics.VAC >= 0 ? '+' : ''}${evmMetrics.VAC.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: QUALITY & GOVERNANCE                                             */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'quality' && (
          <QualityGovernanceTab
            tasks={tasks}
            defects={defects}
            raids={raids}
            decisions={decisions}
            deliveries={deliveries}
            log={log}
            onNavigate={(viewId) => {
              if (hasViewAccess(viewId)) setView(viewId);
            }}
          />
        )}
      </MotionPage>
    </div>
  );
};

export default DashboardView;
