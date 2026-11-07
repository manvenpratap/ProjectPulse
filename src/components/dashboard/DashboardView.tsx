import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { getHealthScore, daysDiff } from '../../utils/projectUtils';
import { 
  Zap, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Clock,
  Layers,
  Users,
  BarChart3,
  Search,
  Plus,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Database,
  Monitor,
  Bug,
  HelpCircle,
  FileText,
  Calendar
} from 'lucide-react';
import clsx from 'clsx';
import { TaskStatus, TaskPriority, DefectStatus } from '../../types';
import PredictiveIntelligence from './PredictiveIntelligence';
import ModuleDeliveryMatrix from './ModuleDeliveryMatrix';
import BurndownChart from './BurndownChart';
import AIPulseAnalysis from './AIPulseAnalysis';
import PageHeader from '../shared/PageHeader';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  'S1 - Blocker': '#ef4444',
  'S2 - High': '#f97316',
  'S3 - Medium': '#eab308',
  'S4 - Low': '#3b82f6',
};

const STATUS_COLORS: Record<string, string> = {
  'New': '#3b82f6',
  'Assigned': '#a855f7',
  'Fixed': '#10b981',
  'Retest': '#eab308',
  'Closed': '#64748b',
  'Deferred': '#94a3b8',
};

const DashboardView: React.FC = () => {
  const { state, setView, loadSample } = useProject();
  const { tasks = [], defects = [], raids = [], members = [], decisions = [] } = state;

  const [activeTab, setActiveTab] = useState<'exec' | 'flow' | 'quality'>('exec');
  const [selectedRiskCell, setSelectedRiskCell] = useState<{ prob: string; imp: string } | null>(null);
  
  // Advanced Executive Financial Telemetry simulation state
  const [blendedRate, setBlendedRate] = useState<number>(800);
  const [allocatedBudget, setAllocatedBudget] = useState<number>(300000);

  const health = getHealthScore(tasks);
  const doneCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.UNDER_REVIEW).length;
  const blockedCount = tasks.filter(t => t.status === TaskStatus.ON_HOLD).length;
  
  const completionPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // Bootstrapping sample data trigger if empty
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[var(--color-bg)] p-8 text-center">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-inner">
            <BarChart3 size={40} />
          </div>
          <h1 className="font-display text-4xl font-black tracking-tight text-[var(--color-text)] mb-4">Intelligence Engine Offline</h1>
          <p className="text-[var(--color-text-muted)] text-sm mb-10 leading-relaxed">
            The dashboard requires active project telemetry to generate strategic insights. Populate your environment with technical tasks to activate the tracking sub-systems.
          </p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => loadSample('web')}
              className="h-11 px-6 bg-[var(--color-primary-hex)] text-white rounded-xl font-semibold text-sm shadow-md transition-colors duration-150 active:scale-[0.98] motion-safe:transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] cursor-pointer"
            >
               Boot demo environment
            </button>
            <button 
              onClick={() => setView('tasks')}
              className="h-11 px-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl font-semibold text-sm hover:border-indigo-500/20 transition-colors duration-150 active:scale-[0.98] motion-safe:transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] cursor-pointer"
            >
               Create first task
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stats definition with sparklines
  const stats = [
    { label: 'Total Volume', value: tasks.length, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Baseline scale', trend: [10, 15, 12, 18, 16, 22, tasks.length] },
    { label: 'Value Delivered', value: doneCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${completionPct}% Complete`, trend: [2, 5, 8, 12, 11, 15, doneCount] },
    { label: 'Active Pipeline', value: inProgCount, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'In production', trend: [8, 10, 7, 12, 9, 14, inProgCount] },
    { label: 'Risk Factors', value: blockedCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', sub: 'Require action', trend: [1, 3, 2, 4, 3, 2, blockedCount] },
  ];

  // Calculated release trains roadmap
  const releaseNames = Array.from(new Set(tasks.map(t => t.release).filter(Boolean))).sort() as string[];
  const releaseMetadata: Record<string, { date: string; status: 'Released' | 'Active' | 'Planned' }> = {
    'v1.0.0': { date: 'Feb 15, 2026', status: 'Released' },
    'v1.1.0': { date: 'May 20, 2026', status: 'Active' },
    'v1.2.0': { date: 'Aug 15, 2026', status: 'Planned' },
  };

  const releaseTrains = releaseNames.map(name => {
    const relTasks = tasks.filter(t => t.release === name);
    const completed = relTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const total = relTasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const meta = releaseMetadata[name] || { date: 'TBD', status: 'Planned' as const };
    return { name, total, completed, progress, ...meta };
  });

  // Quality Analytics calculations
  const qualityScore = Math.max(0, 100 - (defects.filter(d => d.severity.includes('S1') || d.severity.includes('S2')).length * 15) - (defects.filter(d => d.severity.includes('S3')).length * 5));
  
  const defectSeverityCounts = defects.reduce((acc, d) => {
    const sev = d.severity || 'S4 - Low';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityChartData = Object.entries(defectSeverityCounts).map(([name, value]) => ({
    name,
    value,
    color: SEVERITY_COLORS[name] || '#3b82f6'
  }));

  const defectStatusCounts = defects.reduce((acc, d) => {
    const st = d.status || 'New';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(defectStatusCounts).map(([name, count]) => ({
    name,
    count,
  }));

  // Resource capacity allocations
  const resourceLoads = members.map(m => {
    const mTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);
    const mCompleted = tasks.filter(t => t.assignee === m.name && t.status === TaskStatus.COMPLETED);
    const totalAssigned = mTasks.length + mCompleted.length;
    const avgProgress = totalAssigned > 0 ? Math.round(tasks.filter(t => t.assignee === m.name).reduce((acc, t) => acc + (t.progress || 0), 0) / totalAssigned) : 0;
    
    let loadStatus: 'Available' | 'Optimal' | 'Overloaded' = 'Optimal';
    if (mTasks.length > 4) {
      loadStatus = 'Overloaded';
    } else if (mTasks.length === 0) {
      loadStatus = 'Available';
    }

    return {
      member: m,
      activeCount: mTasks.length,
      completedCount: mCompleted.length,
      totalAssigned,
      avgProgress,
      loadStatus
    };
  });

  // RAID Risk matrix (Probability vs Impact) Active items
  const probLevels = ['High', 'Medium', 'Low'];
  const impLevels = ['High', 'Medium', 'Low'];

  const getRaidCellCount = (prob: string, imp: string) => {
    return raids.filter(r => {
      const rProb = r.probability || 'Medium';
      const rImp = r.impact || 'Medium';
      return rProb.toLowerCase() === prob.toLowerCase() && rImp.toLowerCase() === imp.toLowerCase() && r.status === 'Active';
    }).length;
  };

  const getRaidCellItems = (prob: string, imp: string) => {
    return raids.filter(r => {
      const rProb = r.probability || 'Medium';
      const rImp = r.impact || 'Medium';
      return rProb.toLowerCase() === prob.toLowerCase() && rImp.toLowerCase() === imp.toLowerCase() && r.status === 'Active';
    });
  };

  // Helper colors for Risk Matrix cells
  const getMatrixCellBg = (prob: string, imp: string, count: number) => {
    if (count === 0) return 'bg-slate-50/50 text-slate-350 border-slate-100';
    
    // High-Risk Zone (Red)
    if ((prob === 'High' && imp === 'High') || (prob === 'High' && imp === 'Medium') || (prob === 'Medium' && imp === 'High')) {
      return 'bg-red-100 hover:bg-red-200 text-red-750 border-red-200 font-bold';
    }
    // Medium-Risk Zone (Orange/Yellow)
    if ((prob === 'Low' && imp === 'High') || (prob === 'Medium' && imp === 'Medium') || (prob === 'High' && imp === 'Low')) {
      return 'bg-amber-100 hover:bg-amber-200 text-amber-750 border-amber-200 font-bold';
    }
    // Low-Risk Zone (Green)
    return 'bg-emerald-50 hover:bg-emerald-100 text-emerald-750 border-emerald-200 font-bold';
  };

  // Financial and Cost Telemetry Calculations
  const completedEffortDays = tasks.filter(t => t.status === TaskStatus.COMPLETED).reduce((sum, t) => sum + (t.estDays || 3), 0);
  const remainingEffortDays = tasks.filter(t => t.status !== TaskStatus.COMPLETED).reduce((sum, t) => sum + (t.estDays || 3), 0);
  const totalEffortDays = completedEffortDays + remainingEffortDays;

  const actualSpend = completedEffortDays * blendedRate;
  const remainingForecast = remainingEffortDays * blendedRate;
  const totalEstimatedCost = actualSpend + remainingForecast;
  const budgetVariance = allocatedBudget - totalEstimatedCost;
  
  // Percentages with caps for visual stability
  const budgetBurnPercent = allocatedBudget > 0 ? Math.round((actualSpend / allocatedBudget) * 100) : 0;
  const totalForecastBurnPercent = allocatedBudget > 0 ? Math.round((totalEstimatedCost / allocatedBudget) * 100) : 0;

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

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={TrendingUp}
        title="Project Pulse Analytics"
        subtitle="Real-world delivery telemetry, bug dynamics, and resource loading across all modules"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs">
              <span className="text-[var(--color-text-muted)] font-medium">Composite Health:</span>
              <span className={clsx(
                "font-mono font-bold",
                health > 80 ? "text-emerald-500" : health > 50 ? "text-amber-500" : "text-rose-500"
              )}>{health}%</span>
              <div className="w-[1px] h-3.5 bg-[var(--color-divider)]" />
              <span className="text-[var(--color-text-muted)] font-medium">Completion:</span>
              <span className="font-mono font-bold text-[var(--color-primary-hex)]">{completionPct}%</span>
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-8 pb-16">
        {/* Tab Interface Controls */}
        <div className="flex border-b border-[var(--color-divider)] pb-px gap-6 md:gap-10 overflow-x-auto custom-scroll">
          <button 
            onClick={() => setActiveTab('exec')}
            className={clsx(
              "pb-4 font-bold text-sm tracking-tight border-b-2 transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] relative whitespace-nowrap cursor-pointer",
              activeTab === 'exec' ? "border-[var(--color-primary-hex)] text-[var(--color-primary-hex)] font-black" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            Executive Console
          </button>
          <button 
            onClick={() => setActiveTab('flow')}
            className={clsx(
              "pb-4 font-bold text-sm tracking-tight border-b-2 transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] relative whitespace-nowrap cursor-pointer",
              activeTab === 'flow' ? "border-[var(--color-primary-hex)] text-[var(--color-primary-hex)] font-black" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            Delivery Flow &amp; Velocity
          </button>
          <button 
            onClick={() => setActiveTab('quality')}
            className={clsx(
              "pb-4 font-bold text-sm tracking-tight border-b-2 transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] relative whitespace-nowrap cursor-pointer",
              activeTab === 'quality' ? "border-[var(--color-primary-hex)] text-[var(--color-primary-hex)] font-black" : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            Quality &amp; Resources
          </button>
        </div>

        {/* TAB 1: EXECUTIVE CONSOLE */}
        {activeTab === 'exec' && (
          <div className="space-y-10 md:space-y-14">
            
            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="card p-5 md:p-8 flex flex-col justify-between group hover:ring-2 hover:ring-indigo-500/20">
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div>
                      <span className="text-xs font-semibold text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-hex)] transition-colors">
                        {stat.label}
                      </span>
                      <div className="text-2xl md:text-4xl font-display font-black mt-1 md:mt-2 leading-none">{stat.value}</div>
                      
                      {/* Sparkline SVG */}
                      <div className="mt-3 w-28 h-8 opacity-75 group-hover:opacity-100 transition-opacity">
                        <svg className="w-full h-full" viewBox="0 0 100 30" fill="none" aria-hidden="true">
                          <path
                            d={`M ${stat.trend.map((val, idx) => {
                              const x = (idx / (stat.trend.length - 1)) * 100;
                              const maxVal = Math.max(...stat.trend, 1);
                              const minVal = Math.min(...stat.trend, 0);
                              const y = 25 - ((val - minVal) / (maxVal - minVal || 1)) * 20;
                              return `${x} ${y}`;
                            }).join(' L ')}`}
                            className={clsx(
                              "stroke-current",
                              stat.label === 'Total Volume' ? "text-indigo-500" :
                              stat.label === 'Value Delivered' ? "text-emerald-500" :
                              stat.label === 'Active Pipeline' ? "text-blue-500" :
                              "text-rose-500"
                            )}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className={clsx("p-2.5 md:p-3.5 rounded-xl md:rounded-2xl shadow-sm", stat.bg, stat.color)}>
                      <stat.icon size={20} className="md:w-[22px] md:h-[22px]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-[var(--color-text-faint)]">
                     <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                     {stat.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Strategic Roadmap & Release Trains */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <h2 className="text-xl font-bold font-display tracking-tight text-[var(--color-text)]">Strategic Release Trains (Roadmap)</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {releaseTrains.map((rel) => (
                  <div key={rel.name} className="card p-6 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-800">{rel.name}</span>
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            rel.status === 'Released' ? "bg-emerald-100 text-emerald-800" :
                            rel.status === 'Active' ? "bg-indigo-100 text-indigo-800 motion-safe:animate-pulse" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {rel.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] font-medium flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          Launch Date: {rel.date}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end text-xs">
                        <span className="font-bold text-slate-500">{rel.completed} / {rel.total} Tasks Completed</span>
                        <span className="font-mono font-black text-indigo-600">{rel.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full rounded-full",
                            rel.status === 'Released' ? 'bg-emerald-500' : 'bg-indigo-600'
                          )} 
                          style={{ width: `${rel.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Financial Telemetry & Budget Control Console */}
            <div className="card p-6 md:p-8 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">Strategic Financial Telemetry &amp; Cost Control</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Dynamic alignment of active tasks, estimated effort, and executive budget boundaries</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full shrink-0">
                  <Database size={12} />
                  <span>Interactive Simulation Mode</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 1. Simulator controls & Budget parameters (Left 4 columns) */}
                <div className="lg:col-span-4 space-y-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-150">
                  <h4 className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Sliders size={14} className="text-indigo-500" />
                    Simulated Budget Parameters
                  </h4>

                  {/* Blended Developer Day Rate Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">Blended Dev Day-Rate</span>
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">${blendedRate}/day</span>
                    </div>
                    <input 
                      type="range" 
                      min="400" 
                      max="1600" 
                      step="50" 
                      value={blendedRate} 
                      onChange={(e) => setBlendedRate(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 leading-tight">Controls the fully burdened average cost of resources assigned to tasks.</p>
                  </div>

                  {/* Allocated Project Budget Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500">Allocated Budget Cap</span>
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">${allocatedBudget.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="100000" 
                      max="600000" 
                      step="10000" 
                      value={allocatedBudget} 
                      onChange={(e) => setAllocatedBudget(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 leading-tight">Configures the absolute executive ceiling for overall project funding.</p>
                  </div>

                  {/* Context Metrics Summary */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs font-medium text-[var(--color-text-muted)]">
                      <span>Total Measured Effort:</span>
                      <span className="text-slate-700">{totalEffortDays} Days</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium text-[var(--color-text-muted)]">
                      <span>Completed Volume:</span>
                      <span className="text-emerald-600">{completedEffortDays} Days ({Math.round((completedEffortDays / (totalEffortDays || 1)) * 100)}%)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Cost Health Dial & Metrics Cards (Middle 4 columns) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Spent Card */}
                    <div className="p-4 bg-slate-50/20 border border-slate-150 rounded-2xl">
                      <div className="text-xs font-medium text-[var(--color-text-muted)]">Accrued Spent</div>
                      <div className="text-lg font-black font-display text-slate-800 mt-1">${actualSpend.toLocaleString()}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-1">{budgetBurnPercent}% Budget Burned</div>
                    </div>

                    {/* Forecast Remaining Card */}
                    <div className="p-4 bg-slate-50/20 border border-slate-150 rounded-2xl">
                      <div className="text-xs font-medium text-[var(--color-text-muted)]">Pending Forecast</div>
                      <div className="text-lg font-black font-display text-indigo-600 mt-1">${remainingForecast.toLocaleString()}</div>
                      <div className="text-xs text-indigo-500 mt-1">Requires Backlog Clearance</div>
                    </div>
                  </div>

                  {/* Cost At Completion vs Variance banner */}
                  <div className="p-5 border border-slate-150 rounded-2xl space-y-3 bg-white shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-medium text-[var(--color-text-muted)]">Estimated Cost at Completion (EAC)</div>
                        <div className="text-2xl font-black font-display text-slate-800 mt-1">${totalEstimatedCost.toLocaleString()}</div>
                      </div>
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        budgetVariance >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-red-50 text-red-700 border-red-150"
                      )}>
                        {budgetVariance >= 0 ? 'Under Budget' : 'Budget Overrun'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                      <span className="font-bold text-slate-500">Remaining Cost Variance:</span>
                      <span className={clsx("font-mono font-black", budgetVariance >= 0 ? "text-emerald-600" : "text-red-650")}>
                        {budgetVariance >= 0 ? '+' : ''}{budgetVariance.toLocaleString()}
                      </span>
                    </div>

                    {/* Budget progress bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs font-medium text-[var(--color-text-muted)]">
                        <span>Cumulative Budget Burn</span>
                        <span>{totalForecastBurnPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full rounded-full",
                            totalForecastBurnPercent > 100 ? "bg-red-500" : totalForecastBurnPercent > 80 ? "bg-amber-500" : "bg-indigo-600"
                          )} 
                          style={{ width: `${Math.min(100, totalForecastBurnPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Recharts module allocation bar chart (Right 4 columns) */}
                <div className="lg:col-span-4 space-y-4">
                  <h4 className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">Cost Distribution by Module</h4>
                  <div className="h-44 w-full">
                    {moduleCosts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={moduleCosts} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} 
                            width={75}
                          />
                          <Bar dataKey="totalCost" radius={[0, 4, 4, 0]} fill="#6366f1">
                            {moduleCosts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : index === 1 ? '#6366f1' : '#818cf8'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">No active modules to trace cost distribution</div>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-medium leading-normal text-center italic">Calculated live using estimating effort per target module component</p>
                </div>

              </div>
            </div>

            {/* AI Insights & Alerts Stream Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Critical Overdue & Risks */}
              <div className="lg:col-span-2 space-y-6">
                 <div className="card p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-red-550 shadow-sm">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">Critical Timeline Warnings</h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Immediate coordination required</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tasks.filter(t => daysDiff(t.dueDate)! < 0 && t.status !== TaskStatus.COMPLETED).slice(0, 6).map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => setView('tasks')}
                          className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/20 border border-rose-100 hover:bg-rose-50 hover:border-rose-200 transition-colors duration-150 active:scale-[0.98] cursor-pointer group"
                        >
                           <div className="min-w-0">
                             <div className="text-[10px] font-mono font-bold text-red-600 mb-1">{t.id}</div>
                             <div className="text-[13px] font-bold truncate pr-4">{t.name}</div>
                           </div>
                           <div className="text-right shrink-0">
                              <div className="text-xs font-bold text-red-600">{Math.abs(daysDiff(t.dueDate)!)}d OVERDUE</div>
                              <div className="text-xs font-medium text-red-500 mt-0.5 group-hover:text-red-700">Action</div>
                           </div>
                        </div>
                      ))}
                    </div>
                    
                    {tasks.filter(t => daysDiff(t.dueDate)! < 0 && t.status !== TaskStatus.COMPLETED).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-emerald-500">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                          <CheckCircle2 size={32} />
                        </div>
                        <div className="font-bold text-lg">Schedule Compliant</div>
                        <p className="text-sm text-[var(--color-text-faint)] mt-1 italic">Zero overdue milestones or blocking tasks.</p>
                      </div>
                    )}
                 </div>
              </div>

              {/* AI Strategic analysis panel */}
              <div className="space-y-8">
                <AIPulseAnalysis />
              </div>
            </div>

            {/* Activity Logs Stream */}
            <div className="card p-0 overflow-hidden">
              <div className="p-6 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
                <h3 className="font-display font-black text-base flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Live Team Telemetry Stream
                </h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-md motion-safe:animate-pulse">Live feed</span>
              </div>
              <div className="p-2 min-h-[250px]">
                {state.log.slice(-5).reverse().map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 hover:bg-[var(--color-surface-offset)]/50 rounded-2xl transition-colors cursor-pointer group">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">{entry.action}</div>
                      <div className="text-sm font-bold text-[var(--color-text)] truncate">{entry.taskName}</div>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="px-2 py-0.5 bg-[var(--color-surface-2)] rounded-md text-[9px] font-mono font-bold text-[var(--color-text-muted)] border border-[var(--color-divider)]">{entry.taskId}</div>
                         <div className="text-xs text-[var(--color-text-muted)] opacity-60">{new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                         <div className="ml-auto text-xs font-medium text-indigo-500">{entry.assignee}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DELIVERY FLOW & VELOCITY */}
        {activeTab === 'flow' && (
          <div className="space-y-12">
            
            {/* System Architectural Maturity Grid */}
            <ModuleDeliveryMatrix />

            {/* Velocity Flow Charts */}
            <BurndownChart />

            {/* Predictive deviation matrices */}
            <PredictiveIntelligence />

          </div>
        )}

        {/* TAB 3: QUALITY & RESOURCES */}
        {activeTab === 'quality' && (
          <div className="space-y-12">
            
            {/* Double column: Quality Donut and Status charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Quality Score and severity donut */}
              <div className="card p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1">Quality Confidence</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Dynamic defect mitigation</p>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={severityChartData.length > 0 ? severityChartData : [{ name: 'Stable', value: 1, color: '#10b981' }]}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {severityChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          {severityChartData.length === 0 && <Cell fill="#10b981" />}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-display font-black tracking-tight text-slate-800">{qualityScore}%</span>
                      <span className="text-xs text-[var(--color-text-muted)] mt-0.5">Reliability index</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-4">
                  {severityChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-650">{item.name}</span>
                      </div>
                      <span className="font-semibold text-slate-500"><span className="font-mono">{item.value}</span> Bug{item.value > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                  {severityChartData.length === 0 && (
                    <div className="text-xs font-bold text-emerald-600 text-center py-2">Zero active defects reported</div>
                  )}
                </div>
              </div>

              {/* Bug Status bar chart */}
              <div className="card p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1">Defect Pipeline Status</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Bug progression telemetry</p>
                </div>

                <div className="h-44 my-4">
                  {statusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData}>
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
                        <ChartTooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">No data available</div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                  <div>
                    <div className="text-xs font-medium text-[var(--color-text-muted)]">Total Bugs</div>
                    <div className="text-lg font-black font-display text-slate-700">{defects.length}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-indigo-400">Open</div>
                    <div className="text-lg font-black font-display text-indigo-600">
                      {defects.filter(d => d.status !== DefectStatus.CLOSED && d.status !== DefectStatus.REJECTED).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-emerald-400">Resolved</div>
                    <div className="text-lg font-black font-display text-emerald-600">
                      {defects.filter(d => d.status === DefectStatus.CLOSED).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Blocker Defects details panel */}
              <div className="card p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1">Active Severity Risks</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Requires structural patch</p>
                </div>

                <div className="space-y-3 my-4 overflow-y-auto max-h-48 custom-scroll flex-1 pr-1">
                  {defects.filter(d => d.severity.includes('S1') || d.severity.includes('S2')).slice(0, 4).map(d => (
                    <div key={d.id} className="p-3 bg-red-50/40 border border-red-100 rounded-xl flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold text-red-650">{d.id}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          <span className="text-xs font-medium text-red-600 truncate">{d.severity.split(' ')[0]}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-700 truncate mt-0.5">{d.title}</div>
                      </div>
                      <span className="px-2 py-0.5 bg-white border border-slate-200 text-xs font-medium text-slate-500 rounded-md shrink-0">{d.assignee.split(' ')[0]}</span>
                    </div>
                  ))}
                  {defects.filter(d => d.severity.includes('S1') || d.severity.includes('S2')).length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-emerald-600 py-6 text-center">
                      <CheckCircle2 size={24} className="mb-2" />
                      <span className="text-xs font-bold">Safe Release Environment</span>
                      <span className="text-[10px] text-slate-400 italic mt-0.5">No critical blocking errors active</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setView('defects')}
                  className="w-full py-2.5 bg-slate-50 border border-slate-250 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50"
                >
                  Configure Defect Matrix
                </button>
              </div>
            </div>

            {/* Interactive Governance RAID Risk Heatmap Matrix */}
            <div className="card p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1">RAID Governance Heatmap</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Dynamic probability vs impact index matrix (Active items only)</p>
                </div>
                {selectedRiskCell && (
                  <button 
                    onClick={() => setSelectedRiskCell(null)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] disabled:opacity-50"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 3x3 Heatmap grid */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex">
                    <div className="w-10 shrink-0 flex items-center justify-center text-xs font-semibold text-slate-400 -rotate-90">
                      Probability
                    </div>
                    <div className="flex-1 space-y-2">
                      {probLevels.map(p => (
                        <div key={p} className="flex items-center gap-2">
                          <span className="w-16 text-xs font-medium text-slate-400 text-right pr-2">{p}</span>
                          <div className="flex-1 grid grid-cols-3 gap-2">
                            {impLevels.map(i => {
                              const count = getRaidCellCount(p, i);
                              const isSelected = selectedRiskCell?.prob === p && selectedRiskCell?.imp === i;
                              return (
                                <div 
                                  key={i}
                                  onClick={() => count > 0 && setSelectedRiskCell(isSelected ? null : { prob: p, imp: i })}
                                  className={clsx(
                                    "h-16 rounded-xl border flex flex-col items-center justify-center transition-colors duration-150 motion-safe:transition-transform active:scale-95 cursor-pointer shadow-sm relative",
                                    getMatrixCellBg(p, i, count),
                                    isSelected && "ring-4 ring-indigo-500 scale-102 z-10"
                                  )}
                                >
                                  <span className="text-xl font-display font-black">{count}</span>
                                  <span className="text-[9px] opacity-75 font-semibold mt-0.5">RAID</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {/* X-Axis labels */}
                      <div className="flex items-center gap-2 pt-2">
                        <div className="w-16 shrink-0" />
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          {impLevels.map(i => (
                            <span key={i} className="text-center text-xs font-medium text-slate-400">{i} Impact</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter list outputs */}
                <div className="lg:col-span-7 h-full min-h-[150px] flex flex-col justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">
                        {selectedRiskCell 
                          ? `Displaying: ${selectedRiskCell.prob} Probability / ${selectedRiskCell.imp} Impact Cell` 
                          : "Hover or select any cell in the matrix to inspect core risk mitigation cards."}
                      </span>
                      {selectedRiskCell && (
                        <div className="w-3 h-3 rounded-full bg-indigo-500 motion-safe:animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-3">
                      {(selectedRiskCell 
                        ? getRaidCellItems(selectedRiskCell.prob, selectedRiskCell.imp)
                        : raids.filter(r => r.status === 'Active').slice(0, 3)
                      ).map(item => (
                        <div key={item.id} className="p-4 border border-slate-200/80 rounded-2xl bg-white shadow-sm hover:border-slate-350 transition-colors space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-500">{item.id}</span>
                                <span className={clsx(
                                  "px-2 py-0.5 rounded text-xs font-medium",
                                  item.type === 'Risk' ? 'bg-red-50 text-red-700' :
                                  item.type === 'Issue' ? 'bg-orange-50 text-orange-700' :
                                  'bg-blue-50 text-blue-700'
                                )}>{item.type}</span>
                                <span className="text-xs font-bold text-slate-800">{item.title}</span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                          {item.mitigation && (
                            <div className="p-3 bg-indigo-50/30 border border-indigo-50 rounded-xl text-xs text-slate-655 italic">
                              <span className="font-semibold text-indigo-700 not-italic text-xs block mb-0.5">Mitigation Protocol</span>
                              "{item.mitigation}"
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 text-xs font-medium text-slate-400">
                            <span>Owner: {item.owner}</span>
                            <span>Target Date: {item.dueDate}</span>
                          </div>
                        </div>
                      ))}

                      {(selectedRiskCell ? getRaidCellItems(selectedRiskCell.prob, selectedRiskCell.imp) : raids).length === 0 && (
                        <div className="p-12 text-center text-slate-400 italic text-xs">
                          No active RAID items registered in this threat cell.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Team Load Capacity & Allocation Matrix */}
            <div className="card p-6 md:p-8 space-y-6">
              <div>
                <h3 className="font-bold text-lg leading-tight mb-1">Resource Capacity &amp; Contribution Matrix</h3>
                <p className="text-xs text-[var(--color-text-muted)]">Dynamic allocation telemetry mapping deliverables density</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {resourceLoads.map((load) => (
                  <div key={load.member.id} className="p-5 border border-slate-150 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors duration-150 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-display font-black text-sm">
                          {load.member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{load.member.name}</div>
                          <div className="text-xs font-medium text-slate-400">{load.member.role}</div>
                        </div>
                      </div>

                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        load.loadStatus === 'Overloaded' ? "bg-red-50 text-red-700 border-red-150" :
                        load.loadStatus === 'Available' ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                        "bg-indigo-50 text-indigo-700 border-indigo-150"
                      )}>
                        {load.loadStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center border-y border-slate-100 py-3">
                      <div>
                        <div className="text-xs font-medium text-slate-400">Active Tasks</div>
                        <div className="text-base font-black font-display text-slate-700">{load.activeCount}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-400">Completions</div>
                        <div className="text-base font-black font-display text-slate-700">{load.completedCount}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-slate-400">Average progress</span>
                        <span className="text-indigo-650">{load.avgProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${load.avgProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default DashboardView;
