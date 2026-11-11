import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { Task, TaskStatus, TaskPriority, DefectStatus } from '../../types';
import { 
  Package, 
  Database, 
  Monitor, 
  Server, 
  CheckCircle2, 
  Loader, 
  Eye, 
  PauseCircle, 
  AlertCircle, 
  Circle,
  Layers,
  ShieldAlert,
  Bug,
  X,
  ArrowRight,
  Search,
  Grid,
  LayoutGrid,
  Zap,
  Activity,
  Check,
  User,
  Clock
} from 'lucide-react';
import clsx from 'clsx';

export type MatrixViewMode = 'grid' | 'cards';

export interface ModuleTierData {
  module: string;
  moduleType: string;
  tasks: Task[];
  totalEffort: number;
  completedEffort: number;
  progress: number;
  status: TaskStatus;
  maturityLevel: 'L4' | 'L3' | 'L2' | 'L1';
  maturityLabel: string;
  defectsCount: number;
  criticalDefectsCount: number;
  hasBlocker: boolean;
  contributors: string[];
}

export const ModuleDeliveryMatrix: React.FC = () => {
  const { state, setView } = useProject();
  const { hasViewAccess } = useAuth();
  const { tasks = [], defects = [] } = state;

  // View Controls State
  const [viewMode, setViewMode] = useState<MatrixViewMode>('grid');
  const [showDefectOverlay, setShowDefectOverlay] = useState<boolean>(true);
  const [showEffortOverlay, setShowEffortOverlay] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCell, setSelectedCell] = useState<{ module: string; moduleType: string } | null>(null);

  // ═════════════════════════════════════════════════════════════════════════
  // 1. DOMAINS & TIERS EXTRACTION
  // ═════════════════════════════════════════════════════════════════════════
  const allModules = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.module).filter(Boolean))).sort();
  }, [tasks]);

  const allTypes = useMemo(() => {
    const types: string[] = Array.from(new Set(tasks.map(t => t.moduleType).filter(Boolean))) as string[];
    return types.sort((a, b) => {
      if (a === 'Server') return -1;
      if (b === 'Server') return 1;
      if (a === 'GUI') return -1;
      if (b === 'GUI') return 1;
      return a.localeCompare(b);
    });
  }, [tasks]);

  // Filtered modules by search
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return allModules;
    const term = searchTerm.toLowerCase();
    return allModules.filter(m => m.toLowerCase().includes(term));
  }, [allModules, searchTerm]);

  // Helper: Derived status for task group
  const getDerivedStatus = (taskList: Task[]): TaskStatus => {
    if (!taskList.length) return TaskStatus.NOT_STARTED;
    if (taskList.some(t => t.status === TaskStatus.ON_HOLD)) return TaskStatus.ON_HOLD;
    if (taskList.every(t => t.status === TaskStatus.COMPLETED)) return TaskStatus.COMPLETED;
    if (taskList.some(t => t.status === TaskStatus.IN_PROGRESS)) return TaskStatus.IN_PROGRESS;
    if (taskList.some(t => t.status === TaskStatus.UNDER_REVIEW)) return TaskStatus.UNDER_REVIEW;
    if (taskList.some(t => t.status === TaskStatus.COMPLETED)) return TaskStatus.IN_PROGRESS;
    return TaskStatus.NOT_STARTED;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 2. MATURITY CLASSIFICATION & TIER DATA MAP
  // ═════════════════════════════════════════════════════════════════════════
  const cellDataMap = useMemo(() => {
    const map = new Map<string, ModuleTierData>();

    allModules.forEach(m => {
      allTypes.forEach(ty => {
        const mtTasks = tasks.filter(t => t.module === m && t.moduleType === ty);
        if (!mtTasks.length) return;

        const totalEffort = mtTasks.reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
        const completedEffort = mtTasks.reduce((sum, t) => {
          const effort = parseFloat(String(t.estEffort || t.estDays || 3)) || 3;
          if (t.status === TaskStatus.COMPLETED) return sum + effort;
          return sum + effort * ((t.progress || 0) / 100);
        }, 0);

        const progress = totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;
        const derivedStatus = getDerivedStatus(mtTasks);

        // Open defects in this module
        const modDefects = defects.filter(d => d.module === m && d.status !== DefectStatus.CLOSED);
        const critDefects = modDefects.filter(d => d.severity?.includes('S1') || d.severity?.includes('S2'));
        const hasBlocker = mtTasks.some(t => t.status === TaskStatus.ON_HOLD);

        // Architecture Maturity Level Classification
        let maturityLevel: 'L4' | 'L3' | 'L2' | 'L1' = 'L1';
        let maturityLabel = 'L1 Inception';

        if (progress === 100 && derivedStatus === TaskStatus.COMPLETED && critDefects.length === 0) {
          maturityLevel = 'L4';
          maturityLabel = 'L4 Verified';
        } else if (progress >= 75) {
          maturityLevel = 'L3';
          maturityLabel = 'L3 Hardening';
        } else if (progress >= 25) {
          maturityLevel = 'L2';
          maturityLabel = 'L2 Construction';
        } else {
          maturityLevel = 'L1';
          maturityLabel = 'L1 Inception';
        }

        const contributors = Array.from(new Set(mtTasks.map(t => t.assignee).filter(Boolean)));

        map.set(`${m}::${ty}`, {
          module: m,
          moduleType: ty,
          tasks: mtTasks,
          totalEffort: Math.round(totalEffort * 10) / 10,
          completedEffort: Math.round(completedEffort * 10) / 10,
          progress,
          status: derivedStatus,
          maturityLevel,
          maturityLabel,
          defectsCount: modDefects.length,
          criticalDefectsCount: critDefects.length,
          hasBlocker,
          contributors
        });
      });
    });

    return map;
  }, [allModules, allTypes, tasks, defects]);

  // ═════════════════════════════════════════════════════════════════════════
  // 3. EXECUTIVE TELEMETRY SCORECARD
  // ═════════════════════════════════════════════════════════════════════════
  const telemetry = useMemo(() => {
    let totalEffort = 0;
    let completedEffort = 0;
    let l4Count = 0;
    let l3Count = 0;
    let l2Count = 0;
    let l1Count = 0;
    let blockedCount = 0;

    cellDataMap.forEach(data => {
      totalEffort += data.totalEffort;
      completedEffort += data.completedEffort;
      if (data.maturityLevel === 'L4') l4Count++;
      else if (data.maturityLevel === 'L3') l3Count++;
      else if (data.maturityLevel === 'L2') l2Count++;
      else l1Count++;

      if (data.hasBlocker || data.criticalDefectsCount > 0) blockedCount++;
    });

    const totalTiers = cellDataMap.size;
    const maturityScore = totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;

    return {
      maturityScore,
      totalTiers,
      l4Count,
      l3Count,
      l2Count,
      l1Count,
      blockedCount
    };
  }, [cellDataMap]);

  // Selected cell data for drill-down
  const activeSelectedCell = useMemo(() => {
    if (!selectedCell) return null;
    return cellDataMap.get(`${selectedCell.module}::${selectedCell.moduleType}`) || null;
  }, [selectedCell, cellDataMap]);

  // Tier Icon Mapping
  const getTierIcon = (tier: string) => {
    if (tier.includes('Server')) return <Database size={14} className="text-indigo-500" />;
    if (tier.includes('GUI')) return <Monitor size={14} className="text-cyan-500" />;
    if (tier.includes('API') || tier.includes('Gateway')) return <Zap size={14} className="text-amber-500" />;
    return <Package size={14} className="text-purple-500" />;
  };

  // Maturity badge styling
  const getMaturityStyle = (level: 'L4' | 'L3' | 'L2' | 'L1') => {
    switch (level) {
      case 'L4':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          text: 'text-emerald-700 dark:text-emerald-400',
          border: 'border-emerald-500/30',
          bar: 'bg-emerald-500'
        };
      case 'L3':
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
          text: 'text-indigo-700 dark:text-indigo-400',
          border: 'border-indigo-500/30',
          bar: 'bg-indigo-600'
        };
      case 'L2':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/15',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-500/30',
          bar: 'bg-amber-500'
        };
      case 'L1':
      default:
        return {
          bg: 'bg-slate-500/10 dark:bg-slate-500/15',
          text: 'text-slate-600 dark:text-slate-400',
          border: 'border-slate-500/30',
          bar: 'bg-slate-400'
        };
    }
  };

  if (!allModules.length) return null;

  return (
    <div className="space-y-6">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* SECTION HEADER & VIEW CONTROLS                                        */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_var(--color-green)]" />
            <h2 className="text-xl font-bold font-display tracking-tight text-[var(--color-text)]">
              Module Architecture Maturity
            </h2>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Cross-tier architectural readiness, technical debt risk, and domain maturity progression
          </p>
        </div>

        {/* View Mode & Overlay Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter domains..."
              className="h-8 pl-8 pr-3 text-xs bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] w-36 sm:w-44 transition-all"
            />
          </div>

          {/* Overlays Checkboxes */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={showDefectOverlay}
                onChange={e => setShowDefectOverlay(e.target.checked)}
                className="rounded accent-[var(--color-primary-hex)] cursor-pointer"
              />
              <span>Defect Overlay</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-[var(--color-text)]">
              <input
                type="checkbox"
                checked={showEffortOverlay}
                onChange={e => setShowEffortOverlay(e.target.checked)}
                className="rounded accent-[var(--color-primary-hex)] cursor-pointer"
              />
              <span>Effort & Count</span>
            </label>
          </div>

          {/* View Mode Toggle Button */}
          <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                "p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold",
                viewMode === 'grid'
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
              title="2D Matrix Grid"
            >
              <Grid size={13} />
              <span>Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={clsx(
                "p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold",
                viewMode === 'cards'
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
              title="Domain Cards View"
            >
              <LayoutGrid size={13} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ARCHITECTURE MATURITY TELEMETRY KPI CHIPS                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">
            <span>Overall Readiness</span>
            <Activity size={12} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-display text-[var(--color-text)]">{telemetry.maturityScore}%</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {telemetry.maturityScore >= 80 ? 'L4 Verified' : telemetry.maturityScore >= 60 ? 'L3 Hardening' : 'L2 Active'}
            </span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            Aggregate architectural completion
          </div>
        </div>

        <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">
            <span>Production Ready</span>
            <CheckCircle2 size={12} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400">{telemetry.l4Count}</span>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">/ {telemetry.totalTiers} Tiers</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            Verified L4 release components
          </div>
        </div>

        <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">
            <span>Active Implementation</span>
            <Loader size={12} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-display text-indigo-600 dark:text-indigo-400">{telemetry.l3Count + telemetry.l2Count}</span>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">Tiers In-Flight</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            L3 Hardening & L2 Construction
          </div>
        </div>

        <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[var(--color-text-faint)] tracking-wider">
            <span>Architectural Debt</span>
            <AlertCircle size={12} className={clsx(telemetry.blockedCount > 0 ? "text-amber-500" : "text-emerald-500")} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={clsx("text-2xl font-black font-display", telemetry.blockedCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600")}>
              {telemetry.blockedCount}
            </span>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">Tiers At Risk</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            {telemetry.blockedCount > 0 ? "Blocked or defect concentration" : "Zero active architectural debt"}
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODE A: 2D ARCHITECTURE MATURITY MATRIX GRID                          */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'grid' && (
        <div className="card overflow-hidden bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm">
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-offset)] border-b border-[var(--color-divider)]">
                  <th className="p-4 text-left font-bold text-xs text-[var(--color-text-muted)] w-64 sticky left-0 bg-[var(--color-surface-offset)] z-10 shadow-r">
                    Business Domain / Layer
                  </th>
                  {allTypes.map(ty => {
                    // Aggregate progress across this tier
                    const tierCells = allModules.map(m => cellDataMap.get(`${m}::${ty}`)).filter(Boolean) as ModuleTierData[];
                    const tierTotal = tierCells.reduce((acc, c) => acc + c.totalEffort, 0);
                    const tierDone = tierCells.reduce((acc, c) => acc + c.completedEffort, 0);
                    const tierProg = tierTotal > 0 ? Math.round((tierDone / tierTotal) * 100) : 0;

                    return (
                      <th key={ty} className="p-4 text-center font-bold text-xs text-[var(--color-text-muted)] min-w-[170px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--color-text)]">
                            {getTierIcon(ty)}
                            <span>{ty}</span>
                          </div>
                          <div className="flex items-center gap-2 w-28">
                            <div className="flex-1 h-1 bg-[var(--color-divider)] rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${tierProg}%` }} />
                            </div>
                            <span className="text-[10px] font-mono font-medium text-[var(--color-text-faint)]">{tierProg}%</span>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredModules.map(m => {
                  return (
                    <tr key={m} className="border-b border-[var(--color-divider)] group hover:bg-[var(--color-surface-offset)]/40 transition-colors duration-150">
                      {/* Domain Row Header */}
                      <td className="p-4 font-bold text-xs sm:text-sm text-[var(--color-text)] sticky left-0 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-offset)] z-10 border-r border-[var(--color-divider)] shadow-r">
                        <div className="space-y-1">
                          <span className="block truncate max-w-[200px]" title={m}>{m}</span>
                          <span className="text-[10px] font-mono text-[var(--color-text-faint)] font-normal block">
                            {tasks.filter(t => t.module === m).length} tasks total
                          </span>
                        </div>
                      </td>

                      {/* Tier Cells */}
                      {allTypes.map(ty => {
                        const cellKey = `${m}::${ty}`;
                        const cell = cellDataMap.get(cellKey);
                        const isSelected = selectedCell?.module === m && selectedCell?.moduleType === ty;

                        if (!cell) {
                          return (
                            <td key={ty} className="p-4 text-center text-[var(--color-text-faint)] opacity-25 text-base font-mono">
                              —
                            </td>
                          );
                        }

                        const style = getMaturityStyle(cell.maturityLevel);

                        return (
                          <td 
                            key={ty} 
                            onClick={() => setSelectedCell(prev => (prev?.module === m && prev?.moduleType === ty ? null : { module: m, moduleType: ty }))}
                            className={clsx(
                              "p-3.5 transition-all cursor-pointer select-none",
                              isSelected ? "bg-[var(--color-primary-highlight-hex)] ring-2 ring-inset ring-[var(--color-primary-hex)]" : "hover:bg-[var(--color-surface-2)]/60"
                            )}
                            title={`Click to inspect ${m} (${ty}) deliverables`}
                          >
                            <div className="flex flex-col gap-2">
                              {/* Maturity Level Badge */}
                              <div className="flex items-center justify-between gap-1.5">
                                <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1", style.bg, style.text, style.border)}>
                                  {cell.maturityLevel === 'L4' && <CheckCircle2 size={10} />}
                                  {cell.maturityLevel === 'L3' && <Eye size={10} />}
                                  {cell.maturityLevel === 'L2' && <Loader size={10} className="animate-spin-slow" />}
                                  {cell.maturityLevel === 'L1' && <Circle size={10} />}
                                  <span>{cell.maturityLabel}</span>
                                </span>

                                {/* Defect & Blocker Indicators */}
                                {showDefectOverlay && (
                                  <div className="flex items-center gap-1">
                                    {cell.hasBlocker && (
                                      <span className="text-amber-500" title="Contains blocked task">
                                        <PauseCircle size={13} />
                                      </span>
                                    )}
                                    {cell.defectsCount > 0 && (
                                      <span className={clsx("text-[10px] font-bold px-1.5 py-0.2 rounded font-mono inline-flex items-center gap-0.5", cell.criticalDefectsCount > 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400")} title={`${cell.defectsCount} open defect(s)`}>
                                        <Bug size={11} className={cell.criticalDefectsCount > 0 ? "text-rose-500" : "text-amber-500"} />
                                        <span>{cell.defectsCount}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Progress Track */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden border border-[var(--color-divider)]">
                                  <div 
                                    className={clsx("h-full rounded-full transition-all", style.bar)}
                                    style={{ width: `${cell.progress}%` }} 
                                  />
                                </div>
                                <span className="text-xs font-mono font-bold text-[var(--color-text)] shrink-0">
                                  {cell.progress}%
                                </span>
                              </div>

                              {/* Effort & Task Count Overlay */}
                              {showEffortOverlay && (
                                <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                                  <span>{cell.tasks.length} task{cell.tasks.length !== 1 ? 's' : ''}</span>
                                  <span>{cell.totalEffort}d</span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* MODE B: BENTO DOMAIN CARDS VIEW                                       */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map(m => {
            const domainTiers = allTypes.map(ty => cellDataMap.get(`${m}::${ty}`)).filter(Boolean) as ModuleTierData[];
            const totalEff = domainTiers.reduce((acc, c) => acc + c.totalEffort, 0);
            const doneEff = domainTiers.reduce((acc, c) => acc + c.completedEffort, 0);
            const overallProg = totalEff > 0 ? Math.round((doneEff / totalEff) * 100) : 0;
            const openBugs = defects.filter(d => d.module === m && d.status !== DefectStatus.CLOSED).length;

            return (
              <div 
                key={m}
                className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-sm hover:border-[var(--color-primary-hex)]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text)] truncate">{m}</h4>
                      <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{domainTiers.length} Active Architecture Tiers</p>
                    </div>
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono",
                      overallProg === 100 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" :
                      overallProg >= 75 ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" :
                      "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    )}>
                      {overallProg}% Ready
                    </span>
                  </div>

                  {/* Overall Domain Progress Bar */}
                  <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)] mb-3.5">
                    <div 
                      className="h-full bg-[var(--color-primary-hex)] rounded-full transition-all"
                      style={{ width: `${overallProg}%` }}
                    />
                  </div>

                  {/* Architecture Tiers Strip */}
                  <div className="space-y-2">
                    {domainTiers.map(t => (
                      <div 
                        key={t.moduleType}
                        onClick={() => setSelectedCell({ module: m, moduleType: t.moduleType })}
                        className="p-2 rounded-xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between text-xs cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getTierIcon(t.moduleType)}
                          <span className="font-semibold text-[var(--color-text)]">{t.moduleType}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)]">{t.progress}%</span>
                          <span className={clsx("text-[9px] font-bold px-1.5 py-0.2 rounded border", getMaturityStyle(t.maturityLevel).bg, getMaturityStyle(t.maturityLevel).text, getMaturityStyle(t.maturityLevel).border)}>
                            {t.maturityLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-[11px] text-[var(--color-text-muted)]">
                  <span className="font-mono">{totalEff}d effort total</span>
                  {openBugs > 0 ? (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <Bug size={12} /> {openBugs} Bug{openBugs !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Zero Defects
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* INTERACTIVE CELL DELIVERABLE & TASK DRILL-DOWN PANEL                  */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeSelectedCell && (
        <div className="p-5 sm:p-6 bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)] rounded-3xl space-y-4 motion-safe:animate-in motion-safe:fade-in duration-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--color-divider)] pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] flex items-center justify-center text-[var(--color-primary-hex)] shadow-2xs">
                {getTierIcon(activeSelectedCell.moduleType)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-[var(--color-text)]">
                    {activeSelectedCell.module} — {activeSelectedCell.moduleType} Tier
                  </h3>
                  <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border", getMaturityStyle(activeSelectedCell.maturityLevel).bg, getMaturityStyle(activeSelectedCell.maturityLevel).text, getMaturityStyle(activeSelectedCell.maturityLevel).border)}>
                    {activeSelectedCell.maturityLabel}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {activeSelectedCell.tasks.length} Deliverable Task{activeSelectedCell.tasks.length !== 1 ? 's' : ''} • {activeSelectedCell.completedEffort} of {activeSelectedCell.totalEffort} days completed ({activeSelectedCell.progress}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              {hasViewAccess('tasks') && (
                <button
                  onClick={() => setView('tasks')}
                  className="h-8 px-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] text-xs font-semibold text-[var(--color-text)] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Open in Tasks Matrix</span>
                  <ArrowRight size={12} />
                </button>
              )}
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                title="Close drilldown panel"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Constituent Tasks Table / List */}
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll pr-1">
            {activeSelectedCell.tasks.map(t => {
              const subtasksDone = (t.subtasks || []).filter(s => s.status === TaskStatus.COMPLETED || s.done).length;
              const subtasksTotal = (t.subtasks || []).length;

              return (
                <div 
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs hover:border-[var(--color-primary-hex)]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="font-mono font-bold text-[10px] text-[var(--color-text-faint)] shrink-0">
                      {t.id}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--color-text)] block truncate">
                        {t.name}
                      </span>
                      {subtasksTotal > 0 && (
                        <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                          Checklist: {subtasksDone}/{subtasksTotal} subtasks verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {t.assignee && (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                        <User size={12} className="text-[var(--color-text-faint)]" />
                        {t.assignee}
                      </span>
                    )}
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {t.estEffort || t.estDays || 3} pd
                    </span>
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      t.status === TaskStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      t.status === TaskStatus.IN_PROGRESS ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" :
                      t.status === TaskStatus.ON_HOLD ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                      "bg-slate-500/10 text-slate-600 border-slate-500/20"
                    )}>
                      {t.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleDeliveryMatrix;
