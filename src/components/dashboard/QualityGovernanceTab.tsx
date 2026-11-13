import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  FileText,
  Layers,
  ShieldAlert,
  Tag,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import clsx from 'clsx';
import SectionHelpButton from '../shared/SectionHelpButton';
import {
  Decision,
  Defect,
  DefectStatus,
  Delivery,
  LogEntry,
  RaidItem,
  Task,
  TaskStatus,
} from '../../types';
import {
  fmtDate,
  getRaidEffectiveProb,
  isDecisionPending,
  isDefectResolved,
  isRaidActive,
  normRaidImpact,
  RaidLevel,
} from '../../utils/projectUtils';

interface QualityGovernanceTabProps {
  tasks: Task[];
  defects: Defect[];
  raids: RaidItem[];
  decisions: Decision[];
  deliveries: Delivery[];
  log: LogEntry[];
  onNavigate: (view: string) => void;
}

const SEVERITY_ORDER = ['S1 - Blocker', 'S2 - High', 'S3 - Medium', 'S4 - Low'] as const;

const SEVERITY_META: Record<string, { label: string; color: string; pill: string }> = {
  'S1 - Blocker': {
    label: 'S1 · Blocker',
    color: '#ef4444',
    pill: 'bg-rose-500/12 text-rose-500 border-rose-500/25',
  },
  'S2 - High': {
    label: 'S2 · High',
    color: '#f97316',
    pill: 'bg-orange-500/12 text-orange-500 border-orange-500/25',
  },
  'S3 - Medium': {
    label: 'S3 · Medium',
    color: '#eab308',
    pill: 'bg-amber-500/12 text-amber-500 border-amber-500/25',
  },
  'S4 - Low': {
    label: 'S4 · Low',
    color: '#38bdf8',
    pill: 'bg-sky-500/12 text-sky-500 border-sky-500/25',
  },
};

const PIPELINE_STAGES: { status: DefectStatus; short: string; color: string }[] = [
  { status: DefectStatus.NEW, short: 'New', color: '#38bdf8' },
  { status: DefectStatus.ASSIGNED, short: 'Assigned', color: '#8b5cf6' },
  { status: DefectStatus.IN_PROGRESS, short: 'In Prog', color: '#3b82f6' },
  { status: DefectStatus.RETEST, short: 'Retest', color: '#f59e0b' },
  { status: DefectStatus.FIXED, short: 'Fixed', color: '#14b8a6' },
  { status: DefectStatus.CLOSED, short: 'Closed', color: '#10b981' },
];

const CATEGORY_PALETTE = ['#38bdf8', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];

const IMPACT_ROWS: { key: RaidLevel; label: string }[] = [
  { key: 'High', label: 'High' },
  { key: 'Medium', label: 'Med' },
  { key: 'Low', label: 'Low' },
];

const PROB_COLS: { key: RaidLevel; label: string }[] = [
  { key: 'Low', label: 'Low' },
  { key: 'Medium', label: 'Med' },
  { key: 'High', label: 'High' },
];

function normalizeSeverityBucket(sev?: string): string {
  const s = String(sev || '').trim().toLowerCase();
  if (s.startsWith('s1') || s.includes('blocker') || s.includes('critical')) return 'S1 - Blocker';
  if (s.startsWith('s2') || s.includes('high') || s.includes('major')) return 'S2 - High';
  if (s.startsWith('s3') || s.includes('med') || s.includes('moderate')) return 'S3 - Medium';
  return 'S4 - Low';
}

export const QualityGovernanceTab: React.FC<QualityGovernanceTabProps> = ({
  tasks,
  defects,
  raids,
  decisions,
  deliveries,
  log,
  onNavigate,
}) => {
  const [severityScope, setSeverityScope] = useState<'active' | 'all'>('active');
  const [defectLensMode, setDefectLensMode] = useState<'root_cause' | 'modules'>('root_cause');
  const [expandedDqKey, setExpandedDqKey] = useState<string | null>(null);
  const [selectedRiskCell, setSelectedRiskCell] = useState<{ imp: RaidLevel; prob: RaidLevel } | null>(null);
  const [raidTypeFilter, setRaidTypeFilter] = useState<'all' | RaidItem['type']>('all');
  const [decisionFilter, setDecisionFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // ── 1. Defect Quality Reliability & Lifecycle Telemetry ─────────────────
  const defectAnalytics = useMemo(() => {
    const total = defects.length;
    const active = defects.filter(d => !isDefectResolved(d.status));
    const resolved = defects.filter(d => isDefectResolved(d.status));
    const verifiedClosed = defects.filter(d => String(d.status).toLowerCase() === 'closed');
    const retestQueue = defects.filter(d => String(d.status).toLowerCase() === 'retest');

    const countByBucket = (list: Defect[]) => {
      const counts: Record<string, number> = {
        'S1 - Blocker': 0,
        'S2 - High': 0,
        'S3 - Medium': 0,
        'S4 - Low': 0,
      };
      list.forEach(d => {
        counts[normalizeSeverityBucket(d.severity)]++;
      });
      return counts;
    };

    const openCounts = countByBucket(active);
    const allCounts = countByBucket(defects);

    const openS1 = openCounts['S1 - Blocker'];
    const openS2 = openCounts['S2 - High'];
    const openS3 = openCounts['S3 - Medium'];
    const openS4 = openCounts['S4 - Low'];

    // Reliability Index penalizes only unresolved defects weighted by impact
    const reliabilityScore = Math.max(
      0,
      Math.min(100, Math.round(100 - openS1 * 15 - openS2 * 6 - openS3 * 2 - openS4 * 1))
    );

    const reliabilityBand =
      reliabilityScore >= 85
        ? { label: 'Optimal', text: 'text-emerald-500', badge: 'bg-emerald-500/12 text-emerald-500 border-emerald-500/25' }
        : reliabilityScore >= 65
        ? { label: 'Guarded', text: 'text-amber-500', badge: 'bg-amber-500/12 text-amber-500 border-amber-500/25' }
        : { label: 'At Risk', text: 'text-rose-500', badge: 'bg-rose-500/12 text-rose-500 border-rose-500/25' };

    const resolutionPct = total > 0 ? Math.round((resolved.length / total) * 100) : 100;

    // Lifecycle Pipeline progression in strict workflow order
    const pipelineData = PIPELINE_STAGES.map(stage => ({
      name: stage.short,
      fullStatus: stage.status,
      count: defects.filter(d => d.status === stage.status).length,
      color: stage.color,
    }));

    // Root cause / type distribution
    const typeCounts: Record<string, number> = {};
    defects.forEach(d => {
      const t = (d.type || 'Unclassified').trim();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const rootCauseEntries = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], idx) => ({
        name,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
        color: CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
      }));

    // Module Hotspot attribution via linked Task ID or screen/subtask fallback
    const taskById = new Map<string, Task>();
    tasks.forEach(t => taskById.set(t.id, t));
    const moduleCounts: Record<string, { total: number; open: number }> = {};
    defects.forEach(d => {
      let modName = 'Unlinked';
      const linkedTask = taskById.get(d.linkedId);
      if (linkedTask) {
        modName = linkedTask.module || 'General';
      } else {
        const subParent = tasks.find(t => t.subtasks?.some(s => s.id === d.linkedId || s.name === d.linkedId));
        if (subParent) modName = subParent.module || 'General';
        else {
          const screenParent = tasks.find(t => t.guiScreens?.includes(d.linkedId));
          if (screenParent) modName = screenParent.module || 'General';
        }
      }
      if (!moduleCounts[modName]) moduleCounts[modName] = { total: 0, open: 0 };
      moduleCounts[modName].total++;
      if (!isDefectResolved(d.status)) moduleCounts[modName].open++;
    });

    const moduleEntries = Object.entries(moduleCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, stats], idx) => ({
        name,
        count: stats.total,
        open: stats.open,
        pct: total > 0 ? Math.round((stats.total / total) * 100) : 0,
        color: CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length],
      }));

    return {
      total,
      active,
      resolved,
      verifiedClosed,
      retestQueue,
      openCounts,
      allCounts,
      openS1,
      openS2,
      reliabilityScore,
      reliabilityBand,
      resolutionPct,
      pipelineData,
      rootCauseEntries,
      moduleEntries,
      avgPerModule: moduleEntries.length > 0 ? (total / moduleEntries.length).toFixed(1) : '0.0',
    };
  }, [defects, tasks]);

  // Pure SVG multi-segment donut rings
  const activeDonutCounts =
    severityScope === 'active' ? defectAnalytics.openCounts : defectAnalytics.allCounts;
  const donutTotal = Object.values(activeDonutCounts).reduce((a, b) => a + b, 0);

  const donutSegments = useMemo(() => {
    const r = 56;
    const circumference = 2 * Math.PI * r;
    if (donutTotal === 0) {
      return [];
    }
    const items = SEVERITY_ORDER.map(sev => ({
      key: sev,
      count: activeDonutCounts[sev] || 0,
      color: SEVERITY_META[sev].color,
    })).filter(i => i.count > 0);

    const gapPx = items.length > 1 ? 4 : 0;
    const usableCirc = circumference - gapPx * items.length;
    let offset = 0;

    return items.map(item => {
      const segLen = (item.count / donutTotal) * usableCirc;
      const seg = {
        ...item,
        dashArray: `${segLen} ${circumference - segLen}`,
        dashOffset: -offset,
      };
      offset += segLen + gapPx;
      return seg;
    });
  }, [activeDonutCounts, donutTotal]);

  // ── 2. Data Quality & Analytics Integrity (HTML Parity 6 Dimensions) ────
  const dataQuality = useMemo(() => {
    const total = tasks.length;
    const dims = [
      {
        key: 'schedule',
        label: 'Schedule Dates',
        desc: 'Missing start/due dates or inverted date order',
        offending: tasks.filter(
          t =>
            !t.dueDate ||
            !t.startDate ||
            (t.startDate && t.dueDate && new Date(t.startDate) > new Date(t.dueDate))
        ),
      },
      {
        key: 'completion',
        label: 'Completion Dates',
        desc: 'Completed tasks missing completion date or <100% progress',
        offending: tasks.filter(
          t =>
            t.status === TaskStatus.COMPLETED &&
            (!t.actCompletionDate || (Number(t.progress) || 0) < 100)
        ),
      },
      {
        key: 'assignee',
        label: 'Module Owner',
        desc: 'Unassigned deliverables lacking accountable owner',
        offending: tasks.filter(t => !t.assignee || t.assignee === 'Unassigned'),
      },
      {
        key: 'effort',
        label: 'Est. Effort',
        desc: 'Zero or missing person-day effort estimate',
        offending: tasks.filter(t => !(parseFloat(String((t as any).estEffort || t.estDays || 0)) > 0)),
      },
      {
        key: 'category',
        label: 'Category',
        desc: 'Tasks without functional category taxonomy',
        offending: tasks.filter(t => !t.category),
      },
      {
        key: 'module',
        label: 'Module Link',
        desc: 'Tasks not mapped to an architectural module',
        offending: tasks.filter(t => !t.module || (t.module === 'General' && tasks.length > 5)),
      },
    ];

    const score = total
      ? Math.round(
          (dims.reduce((sum, d) => sum + (total - d.offending.length) / total, 0) / dims.length) * 100
        )
      : 100;

    return { total, dims, score };
  }, [tasks]);

  // ── 3. Delivery Sign-Off & Smoke Quality Governance (HTML Parity) ───────
  const releaseQuality = useMemo(() => {
    const total = deliveries.length;
    const approved = deliveries.filter(d => d.signOffStatus === 'Approved').length;
    const passed = deliveries.filter(d => d.smokeTestStatus === 'Passed').length;
    const failed = deliveries.filter(d => d.smokeTestStatus === 'Failed').length;
    const running = deliveries.filter(d => d.smokeTestStatus === 'Running').length;
    const deployed = deliveries.filter(d => d.status === 'Deployed').length;
    const pendingProd = deliveries.filter(
      d => d.environment === 'Production' && d.signOffStatus === 'Pending'
    ).length;
    const pendingAll = deliveries.filter(d => d.signOffStatus === 'Pending').length;

    const signOffRate = total ? Math.round((approved / total) * 100) : 100;
    const smokeRate = total ? Math.round((passed / total) * 100) : 100;
    const deployedRate = total ? Math.round((deployed / total) * 100) : 100;

    // Prioritize pending / running / upcoming deliverables
    const spotlight = [...deliveries]
      .sort((a, b) => {
        const aWeight = a.smokeTestStatus === 'Failed' ? 0 : a.signOffStatus === 'Pending' ? 1 : a.status === 'Deployed' ? 3 : 2;
        const bWeight = b.smokeTestStatus === 'Failed' ? 0 : b.signOffStatus === 'Pending' ? 1 : b.status === 'Deployed' ? 3 : 2;
        if (aWeight !== bWeight) return aWeight - bWeight;
        return String(a.targetDeliveryDate || '').localeCompare(String(b.targetDeliveryDate || ''));
      })
      .slice(0, 4);

    return {
      total,
      approved,
      passed,
      failed,
      running,
      deployed,
      pendingProd,
      pendingAll,
      signOffRate,
      smokeRate,
      deployedRate,
      spotlight,
    };
  }, [deliveries]);

  // ── 4. Normalized RAID 3x3 Governance Matrix & Decision Posture ─────────
  const raidMatrix = useMemo(() => {
    const active = raids.filter(r => isRaidActive(r.status));
    const criticalHigh = active.filter(r => normRaidImpact(r.impact) === 'High');

    const getCellItems = (imp: RaidLevel, prob: RaidLevel) =>
      active.filter(r => normRaidImpact(r.impact) === imp && getRaidEffectiveProb(r) === prob);

    const displayed = active.filter(r => {
      if (selectedRiskCell) {
        return (
          normRaidImpact(r.impact) === selectedRiskCell.imp &&
          getRaidEffectiveProb(r) === selectedRiskCell.prob
        );
      }
      if (raidTypeFilter !== 'all' && r.type !== raidTypeFilter) return false;
      return true;
    });

    // Order by severity/impact then dueDate
    const sortedDisplayed = [...displayed].sort((a, b) => {
      const impScore = (x: RaidItem) =>
        normRaidImpact(x.impact) === 'High' ? 0 : normRaidImpact(x.impact) === 'Medium' ? 1 : 2;
      const diff = impScore(a) - impScore(b);
      if (diff !== 0) return diff;
      return String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
    });

    return {
      active,
      criticalHigh,
      getCellItems,
      displayed: sortedDisplayed,
    };
  }, [raids, selectedRiskCell, raidTypeFilter]);

  // ── 5. Filtered Steering Decisions ──────────────────────────────────────
  const decisionTelemetry = useMemo(() => {
    const pending = decisions.filter(d => isDecisionPending(d.status));
    const approved = decisions.filter(d => String(d.status).toLowerCase() === 'approved');
    const filtered =
      decisionFilter === 'pending'
        ? pending
        : decisionFilter === 'approved'
        ? approved
        : decisions;

    return { total: decisions.length, pendingCount: pending.length, approvedCount: approved.length, filtered };
  }, [decisions, decisionFilter]);

  const getCellStyle = (imp: RaidLevel, prob: RaidLevel, count: number) => {
    if (count === 0) {
      return 'bg-[var(--color-surface-2)]/50 text-[var(--color-text-muted)] border-[var(--color-divider)] opacity-60 cursor-default';
    }
    if ((imp === 'High' && prob === 'High') || (imp === 'High' && prob === 'Medium') || (imp === 'Medium' && prob === 'High')) {
      return 'bg-rose-500/14 text-rose-500 border-rose-500/35 hover:border-rose-500/70 cursor-pointer';
    }
    if ((imp === 'High' && prob === 'Low') || (imp === 'Medium' && prob === 'Medium') || (imp === 'Low' && prob === 'High')) {
      return 'bg-amber-500/14 text-amber-500 border-amber-500/35 hover:border-amber-500/70 cursor-pointer';
    }
    return 'bg-emerald-500/14 text-emerald-500 border-emerald-500/35 hover:border-emerald-500/70 cursor-pointer';
  };

  return (
    <div className="space-y-5 motion-safe:animate-in motion-safe:fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 1: 4-METRIC QUALITY & GOVERNANCE TELEMETRY STRIP                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Quality Reliability Index */}
        <div
          onClick={() => onNavigate('defects')}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('defects'); }}
          className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors cursor-pointer flex flex-col justify-between gap-2.5 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Quality Reliability
            </span>
            <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md border', defectAnalytics.reliabilityBand.badge)}>
              {defectAnalytics.reliabilityBand.label}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className={clsx('text-2xl font-mono font-black tabular-nums', defectAnalytics.reliabilityBand.text)}>
              {defectAnalytics.reliabilityScore}%
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] tabular-nums">
              {defectAnalytics.openS1} S1 Open · {defectAnalytics.openS2} S2
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all',
                defectAnalytics.reliabilityScore >= 85
                  ? 'bg-emerald-500'
                  : defectAnalytics.reliabilityScore >= 65
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              )}
              style={{ width: `${defectAnalytics.reliabilityScore}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Defect Resolution Velocity */}
        <div
          onClick={() => onNavigate('defects')}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('defects'); }}
          className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors cursor-pointer flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Defect Resolution
            </span>
            <Bug size={14} className="text-[var(--color-primary-hex)]" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-mono font-black tabular-nums text-[var(--color-text)]">
              {defectAnalytics.resolutionPct}%
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] tabular-nums">
              {defectAnalytics.resolved.length}/{defectAnalytics.total} Fixed/Closed
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-divider)]">
            <span>{defectAnalytics.active.length} active backlog</span>
            <span className="font-mono font-semibold text-emerald-500">
              {defectAnalytics.verifiedClosed.length} verified closed
            </span>
          </div>
        </div>

        {/* KPI 3: Analytics Data Integrity */}
        <div
          onClick={() => onNavigate('tasks')}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('tasks'); }}
          className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors cursor-pointer flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Data Integrity
            </span>
            <Database size={14} className={dataQuality.score >= 90 ? 'text-emerald-500' : 'text-amber-500'} />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={clsx(
                'text-2xl font-mono font-black tabular-nums',
                dataQuality.score >= 90 ? 'text-emerald-500' : dataQuality.score >= 70 ? 'text-amber-500' : 'text-rose-500'
              )}
            >
              {dataQuality.score}%
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] tabular-nums">
              {tasks.length} tasks audited
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-divider)]">
            <span>6 schema dimensions</span>
            <span className="font-mono font-semibold text-[var(--color-primary-hex)]">
              {dataQuality.dims.filter(d => d.offending.length > 0).length} warnings
            </span>
          </div>
        </div>

        {/* KPI 4: Governance & Threat Posture */}
        <div
          onClick={() => onNavigate('risks')}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('risks'); }}
          className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors cursor-pointer flex flex-col justify-between gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Governance & RAID
            </span>
            <ShieldAlert size={14} className={raidMatrix.criticalHigh.length > 0 ? 'text-rose-500' : 'text-emerald-500'} />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-mono font-black tabular-nums text-[var(--color-text)]">
              {raidMatrix.active.length}
            </span>
            <span className="text-[11px] font-mono text-rose-500 font-semibold tabular-nums">
              {raidMatrix.criticalHigh.length} High/Critical
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-divider)]">
            <span>Pending ADRs: {decisionTelemetry.pendingCount}</span>
            <span className="font-mono font-semibold text-[var(--color-primary-hex)]">
              {releaseQuality.signOffRate}% Sign-Off
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 2: DEFECT RELIABILITY DIAL, LIFECYCLE PIPELINE & ROOT CAUSE LENS     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Quality Reliability Index (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1">
              <h4 className="font-sans font-bold text-sm text-[var(--color-text)] leading-snug">
                Quality Reliability Index
              </h4>
              <SectionHelpButton view="dash" section="Quality Reliability" label="Quality Reliability guide" size={13} />
            </div>
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[10px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setSeverityScope('active')}
                className={clsx(
                  'px-2 py-1 rounded-md transition-colors cursor-pointer',
                  severityScope === 'active'
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                Active ({defectAnalytics.active.length})
              </button>
              <button
                type="button"
                onClick={() => setSeverityScope('all')}
                className={clsx(
                  'px-2 py-1 rounded-md transition-colors cursor-pointer',
                  severityScope === 'all'
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                All ({defectAnalytics.total})
              </button>
            </div>
          </div>

          {/* Crisp Pure-SVG Multi-Segment Reliability Ring */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 144 144" className="w-full h-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  fill="none"
                  stroke="var(--color-surface-2)"
                  strokeWidth="14"
                />
                {donutTotal === 0 ? (
                  <circle
                    cx="72"
                    cy="72"
                    r="56"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                ) : (
                  donutSegments.map(seg => (
                    <circle
                      key={seg.key}
                      cx="72"
                      cy="72"
                      r="56"
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="14"
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                      strokeLinecap="butt"
                    />
                  ))
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-mono font-black tracking-tight tabular-nums text-[var(--color-text)]">
                  {defectAnalytics.reliabilityScore}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Reliability
                </span>
              </div>
            </div>
          </div>

          {/* Severity Breakdown Table */}
          <div className="space-y-2 border-t border-[var(--color-divider)] pt-3">
            {SEVERITY_ORDER.map(sev => {
              const count = activeDonutCounts[sev] || 0;
              const pct = donutTotal > 0 ? Math.round((count / donutTotal) * 100) : 0;
              const meta = SEVERITY_META[sev];
              return (
                <div key={sev} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="font-semibold text-[var(--color-text)]">{sev}</span>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-[var(--color-text-muted)]">
                      {count} <span className="text-[10px] opacity-80">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Defect Pipeline Progression (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1">
              <h4 className="font-sans font-bold text-sm text-[var(--color-text)] leading-snug">
                Defect Pipeline Progression
              </h4>
              <SectionHelpButton view="dash" section="Quality Reliability" label="Defect Pipeline guide" size={13} />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('defects')}
              className="text-[11px] font-bold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Triage</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={defectAnalytics.pipelineData}
                margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-divider)"
                  opacity={0.7}
                />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--color-surface-2)', opacity: 0.45 }}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-divider)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-text)',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {defectAnalytics.pipelineData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-[var(--color-divider)] pt-3 text-center">
            <div className="p-2 rounded-xl bg-[var(--color-surface-2)]/70">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                Reported
              </span>
              <span className="text-base font-mono font-black tabular-nums text-[var(--color-text)]">
                {defectAnalytics.total}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[var(--color-surface-2)]/70">
              <span className="text-[10px] uppercase font-bold text-[var(--color-primary-hex)] block">
                Active Queue
              </span>
              <span className="text-base font-mono font-black tabular-nums text-[var(--color-primary-hex)]">
                {defectAnalytics.active.length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[var(--color-surface-2)]/70">
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">
                Retest / Done
              </span>
              <span className="text-base font-mono font-black tabular-nums text-emerald-500">
                {defectAnalytics.resolved.length + defectAnalytics.retestQueue.length}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Root Cause & Module Hotspots (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1">
              <h4 className="font-sans font-bold text-sm text-[var(--color-text)] leading-snug">
                {defectLensMode === 'root_cause' ? 'Defect Root Cause' : 'Module Defect Hotspots'}
              </h4>
              <SectionHelpButton view="dash" section="Quality Reliability" label="Defect Root Cause guide" size={13} />
            </div>
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[10px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setDefectLensMode('root_cause')}
                className={clsx(
                  'px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1',
                  defectLensMode === 'root_cause'
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <Tag size={10} />
                <span>Cause</span>
              </button>
              <button
                type="button"
                onClick={() => setDefectLensMode('modules')}
                className={clsx(
                  'px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1',
                  defectLensMode === 'modules'
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <Layers size={10} />
                <span>Module</span>
              </button>
            </div>
          </div>

          {/* Dominant / Hotspot Strip */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] block">
                {defectLensMode === 'root_cause' ? 'Dominant Cause' : 'Primary Hotspot'}
              </span>
              <span className="text-xs font-bold text-[var(--color-text)] truncate block mt-0.5">
                {defectLensMode === 'root_cause'
                  ? defectAnalytics.rootCauseEntries[0]?.name || '—'
                  : defectAnalytics.moduleEntries[0]?.name || '—'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-[var(--color-text-muted)] block">
                {defectLensMode === 'root_cause' ? 'Categories' : 'Avg / Module'}
              </span>
              <span className="text-xs font-mono font-bold text-[var(--color-primary-hex)] tabular-nums block mt-0.5">
                {defectLensMode === 'root_cause'
                  ? `${defectAnalytics.rootCauseEntries.length} Types`
                  : `${defectAnalytics.avgPerModule} bugs`}
              </span>
            </div>
          </div>

          {/* Ranked Bars */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scroll pr-1">
            {(defectLensMode === 'root_cause'
              ? defectAnalytics.rootCauseEntries
              : defectAnalytics.moduleEntries
            ).map(row => (
              <div key={row.name} className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="font-semibold text-[var(--color-text)] truncate">
                      {row.name}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-[var(--color-text-muted)] shrink-0">
                    {row.count} · {row.pct}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                  />
                </div>
              </div>
            ))}
            {defectAnalytics.total === 0 && (
              <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                Zero defects recorded across project modules.
              </div>
            )}
          </div>

          {/* Stacked Proportion Bar */}
          {defectAnalytics.total > 0 && (
            <div className="pt-2 border-t border-[var(--color-divider)] space-y-1.5">
              <div className="flex h-2 w-full rounded-full overflow-hidden gap-0.5 bg-[var(--color-surface-2)]">
                {(defectLensMode === 'root_cause'
                  ? defectAnalytics.rootCauseEntries
                  : defectAnalytics.moduleEntries
                ).map(item => (
                  <div
                    key={item.name}
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    title={`${item.name}: ${item.count} (${item.pct}%)`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 3: DATA QUALITY INTEGRITY AUDIT + RELEASE & SMOKE GOVERNANCE GATE   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Analytics Data Quality Score (5 cols) */}
        <div className="lg:col-span-5 p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">
                Analytics Data Integrity
              </h3>
              <SectionHelpButton view="dash" section="Quality Reliability" label="Analytics Data Integrity guide" />
            </div>
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span
                className={clsx(
                  'text-xl font-mono font-black tabular-nums',
                  dataQuality.score >= 90
                    ? 'text-emerald-500'
                    : dataQuality.score >= 70
                    ? 'text-amber-500'
                    : 'text-rose-500'
                )}
              >
                {dataQuality.score}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {dataQuality.dims.map(dim => {
              const missing = dim.offending.length;
              const pct = dataQuality.total
                ? Math.round(((dataQuality.total - missing) / dataQuality.total) * 100)
                : 100;
              const isExpanded = expandedDqKey === dim.key;
              const barCls =
                pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500';
              const textCls =
                pct >= 90 ? 'text-emerald-500' : pct >= 70 ? 'text-amber-500' : 'text-rose-500';

              return (
                <div key={dim.key} className="space-y-1">
                  <button
                    type="button"
                    disabled={missing === 0}
                    onClick={() => setExpandedDqKey(isExpanded ? null : dim.key)}
                    title={missing > 0 ? `Inspect ${missing} task(s): ${dim.desc}` : dim.desc}
                    className={clsx(
                      'w-full flex items-center gap-3 p-1.5 rounded-lg text-left transition-colors',
                      missing > 0
                        ? 'hover:bg-[var(--color-surface-2)] cursor-pointer'
                        : 'cursor-default'
                    )}
                  >
                    <span className="text-xs font-semibold text-[var(--color-text)] w-28 truncate shrink-0">
                      {dim.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all', barCls)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={clsx('text-[11px] font-mono font-bold tabular-nums w-9 text-right', textCls)}>
                      {pct}%
                    </span>
                    {missing > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/12 text-rose-500 border border-rose-500/20 shrink-0">
                        <span>{missing}</span>
                        {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </span>
                    ) : (
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    )}
                  </button>

                  {isExpanded && missing > 0 && (
                    <div className="ml-2 p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
                        <span>{dim.desc}</span>
                        <button
                          type="button"
                          onClick={() => onNavigate('tasks')}
                          className="font-bold text-[var(--color-primary-hex)] hover:underline cursor-pointer shrink-0 ml-2"
                        >
                          Fix in Tasks
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dim.offending.slice(0, 6).map(ot => (
                          <span
                            key={ot.id}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text)]"
                          >
                            {ot.id} · {ot.name.slice(0, 26)}
                            {ot.name.length > 26 ? '...' : ''}
                          </span>
                        ))}
                        {dim.offending.length > 6 && (
                          <span className="text-[10px] font-mono text-[var(--color-text-muted)] self-center">
                            +{dim.offending.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sign-Off & Release Quality Gate (7 cols) */}
        <div className="lg:col-span-7 p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">
                Release Sign-Off & Smoke Quality Gate
              </h3>
              <SectionHelpButton view="dash" section="Quality Reliability" label="Release Smoke Gate guide" />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('deliveries')}
              className="text-[11px] font-bold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>ALM Deliveries</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Mini Quality Gate Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)]">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                Sign-Off Rate
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-mono font-black tabular-nums text-[var(--color-text)]">
                  {releaseQuality.signOffRate}%
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  {releaseQuality.approved}/{releaseQuality.total}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)]">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                Smoke Pass
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={clsx(
                    'text-lg font-mono font-black tabular-nums',
                    releaseQuality.failed > 0 ? 'text-rose-500' : 'text-emerald-500'
                  )}
                >
                  {releaseQuality.smokeRate}%
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  {releaseQuality.passed}/{releaseQuality.total}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)]">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">
                Deployed Live
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-lg font-mono font-black tabular-nums text-[var(--color-primary-hex)]">
                  {releaseQuality.deployedRate}%
                </span>
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                  {releaseQuality.deployed}/{releaseQuality.total}
                </span>
              </div>
            </div>
          </div>

          {/* Quality Gate Status Callout */}
          {releaseQuality.failed > 0 ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-500">
              <AlertOctagon size={15} className="shrink-0" />
              <span>
                <strong>Smoke Gate Blocked:</strong> {releaseQuality.failed} delivery package
                {releaseQuality.failed > 1 ? 's' : ''} failed automated verification.
              </span>
            </div>
          ) : releaseQuality.pendingAll > 0 ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-500">
              <Clock size={15} className="shrink-0" />
              <span>
                <strong>Governance Queue:</strong> {releaseQuality.pendingAll} package
                {releaseQuality.pendingAll > 1 ? 's' : ''} awaiting sign-off
                {releaseQuality.running > 0 ? ` · ${releaseQuality.running} smoke test${releaseQuality.running > 1 ? 's' : ''} running` : ''}.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-500">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>
                <strong>Quality Gate Clear:</strong> All deployment packages satisfy sign-off and smoke criteria.
              </span>
            </div>
          )}

          {/* Compact Delivery Gate Spotlight Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-divider)] text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                  <th className="py-2 pr-3 font-bold">ALM ID</th>
                  <th className="py-2 pr-3 font-bold">Package Scope</th>
                  <th className="py-2 pr-3 font-bold">Env</th>
                  <th className="py-2 pr-3 font-bold">Sign-Off</th>
                  <th className="py-2 font-bold text-right">Smoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-divider)]">
                {releaseQuality.spotlight.map(del => (
                  <tr
                    key={del.id}
                    onClick={() => onNavigate('deliveries')}
                    className="hover:bg-[var(--color-surface-2)]/60 cursor-pointer transition-colors"
                  >
                    <td className="py-2 pr-3 font-mono font-bold text-[var(--color-primary-hex)] whitespace-nowrap">
                      {del.almId || del.id}
                    </td>
                    <td className="py-2 pr-3 max-w-[240px] truncate font-medium text-[var(--color-text)]">
                      {del.name}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap font-mono text-[11px] text-[var(--color-text-muted)]">
                      {del.environment}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2 py-0.5 rounded-md border',
                          del.signOffStatus === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : del.signOffStatus === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        )}
                      >
                        {del.signOffStatus}
                      </span>
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <span
                        className={clsx(
                          'text-[10px] font-mono font-bold',
                          del.smokeTestStatus === 'Passed'
                            ? 'text-emerald-500'
                            : del.smokeTestStatus === 'Failed'
                            ? 'text-rose-500'
                            : del.smokeTestStatus === 'Running'
                            ? 'text-sky-500'
                            : 'text-[var(--color-text-muted)]'
                        )}
                      >
                        {del.smokeTestStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {releaseQuality.spotlight.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-[var(--color-text-muted)]">
                      No ALM delivery packages registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 4: INTERACTIVE 3×3 RAID GOVERNANCE THREAT HEATMAP & INSPECTOR       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--color-text)]">
              RAID Governance Threat Heatmap
            </h3>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">
              {raidMatrix.active.length} active
            </span>
            <SectionHelpButton view="risks" section="Impact Matrix Heatmap" label="RAID Heatmap guide" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedRiskCell && (
              <button
                type="button"
                onClick={() => setSelectedRiskCell(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/30 text-xs font-bold cursor-pointer"
              >
                <span>
                  {selectedRiskCell.imp} Impact × {selectedRiskCell.prob} Prob
                </span>
                <X size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('risks')}
              className="text-xs font-bold text-[var(--color-primary-hex)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Open RAID Register</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 3x3 Impact x Probability Matrix (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            {IMPACT_ROWS.map(row => (
              <div key={row.key} className="flex items-center gap-2.5">
                <span className="w-12 text-[11px] font-bold text-[var(--color-text-muted)] text-right pr-1 shrink-0">
                  {row.label}
                </span>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  {PROB_COLS.map(col => {
                    const items = raidMatrix.getCellItems(row.key, col.key);
                    const count = items.length;
                    const isSelected =
                      selectedRiskCell?.imp === row.key && selectedRiskCell?.prob === col.key;
                    return (
                      <button
                        type="button"
                        key={col.key}
                        onClick={() =>
                          count > 0 &&
                          setSelectedRiskCell(isSelected ? null : { imp: row.key, prob: col.key })
                        }
                        disabled={count === 0}
                        title={`${row.key} Impact × ${col.key} Probability: ${count} item(s)`}
                        className={clsx(
                          'h-14 rounded-xl border flex flex-col items-center justify-center transition-all',
                          getCellStyle(row.key, col.key, count),
                          isSelected && 'ring-2 ring-[var(--color-primary-hex)] scale-[1.02]'
                        )}
                      >
                        <span className="text-base font-mono font-black tabular-nums leading-none">
                          {count}
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-wider opacity-85 mt-0.5">
                          {count === 1 ? 'Item' : 'Items'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* X-Axis Labels */}
            <div className="flex items-center gap-2.5 pt-1">
              <div className="w-12 shrink-0 text-[9px] font-bold uppercase text-[var(--color-text-muted)] text-right pr-1">
                Imp \ Prob
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase text-[var(--color-text-muted)]">
                {PROB_COLS.map(col => (
                  <span key={col.key}>{col.label} Prob</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Threat Inspector List (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {selectedRiskCell
                  ? `Filtered: ${selectedRiskCell.imp} Impact × ${selectedRiskCell.prob} Probability (${raidMatrix.displayed.length})`
                  : `Active Threat Feed (${raidMatrix.displayed.length})`}
              </span>

              {!selectedRiskCell && (
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[10px] font-bold">
                  {(['all', 'Risk', 'Issue', 'Dependency', 'Assumption'] as const).map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setRaidTypeFilter(t)}
                      className={clsx(
                        'px-2 py-1 rounded-md transition-colors cursor-pointer',
                        raidTypeFilter === t
                          ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                      )}
                    >
                      {t === 'all' ? 'All' : t === 'Dependency' ? 'Deps' : `${t}s`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scroll pr-1">
              {raidMatrix.displayed.slice(0, 6).map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('risks')}
                  className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] border border-[var(--color-divider)] transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-[var(--color-primary-hex)] shrink-0">
                        {item.id}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] px-2 py-0.5 rounded-md font-bold border shrink-0',
                          item.type === 'Risk'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : item.type === 'Issue'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : item.type === 'Dependency'
                            ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        )}
                      >
                        {item.type}
                      </span>
                      <span className="text-xs font-bold text-[var(--color-text)] truncate">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] shrink-0">
                      {item.owner || 'Unassigned'}
                    </span>
                  </div>
                  {item.mitigation && (
                    <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                      Mitigation: {item.mitigation}
                    </p>
                  )}
                </div>
              ))}
              {raidMatrix.displayed.length === 0 && (
                <div className="py-10 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-divider)] rounded-xl">
                  No active RAID items matching this filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ROW 5: STEERING DECISIONS LOG (ADRs) & PROJECT HISTORY CHANGE DELTA     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Steering Decisions Log (6 cols) */}
        <div className="lg:col-span-6 p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/12 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <FileText size={16} />
              </div>
              <div className="flex items-center gap-1">
                <h3 className="font-sans font-bold text-sm text-[var(--color-text)]">
                  Steering Decisions Log
                </h3>
                <SectionHelpButton view="risks" section="Decisions Register" label="Steering Decisions guide" size={13} />
              </div>
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[10px] font-bold">
              {[
                { id: 'all', label: `All (${decisionTelemetry.total})` },
                { id: 'pending', label: `Pending (${decisionTelemetry.pendingCount})` },
                { id: 'approved', label: `Approved (${decisionTelemetry.approvedCount})` },
              ].map(tab => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setDecisionFilter(tab.id as any)}
                  className={clsx(
                    'px-2 py-1 rounded-md transition-colors cursor-pointer',
                    decisionFilter === tab.id
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scroll pr-1">
            {decisionTelemetry.filtered.map(d => {
              const isPending = isDecisionPending(d.status);
              return (
                <div
                  key={d.id}
                  onClick={() => onNavigate('risks')}
                  className="p-3.5 rounded-xl bg-[var(--color-surface-2)]/60 hover:bg-[var(--color-surface-2)] border border-[var(--color-divider)] space-y-1.5 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-[var(--color-primary-hex)] shrink-0">
                        {d.id}
                      </span>
                      <span className="font-bold text-[var(--color-text)] truncate">{d.title}</span>
                    </div>
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0',
                        d.status === 'Approved'
                          ? 'bg-emerald-500/12 text-emerald-500 border-emerald-500/20'
                          : d.status === 'Rejected'
                          ? 'bg-rose-500/12 text-rose-500 border-rose-500/20'
                          : isPending
                          ? 'bg-amber-500/12 text-amber-500 border-amber-500/25'
                          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)]'
                      )}
                    >
                      {d.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[var(--color-text-muted)]">
                    <span>
                      Approver: <strong className="text-[var(--color-text)]">{d.approver || 'Steering'}</strong> · Impact: {d.impact || 'High'}
                    </span>
                    <span className="text-[10px] font-mono">
                      {d.dueDate ? fmtDate(d.dueDate) : d.proposedBy || 'PMO'}
                    </span>
                  </div>
                  {d.rationale && (
                    <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">
                      {d.rationale}
                    </p>
                  )}
                </div>
              );
            })}
            {decisionTelemetry.filtered.length === 0 && (
              <div className="py-12 text-center text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-divider)] rounded-xl">
                No decisions matching current filter.
              </div>
            )}
          </div>
        </div>

        {/* Project History Change Delta (6 cols) */}
        <div className="lg:col-span-6 p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center border border-[var(--color-primary-hex)]/20">
                <Activity size={16} />
              </div>
              <div className="flex items-center gap-1">
                <h3 className="font-sans font-bold text-sm text-[var(--color-text)]">
                  Project History Change Delta
                </h3>
                <SectionHelpButton view="log" label="Audit log guide" size={13} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('log')}
              className="text-xs font-mono font-bold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{log.length} Events</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll pr-1">
            {log.slice(-12).reverse().map((l, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-hex)] shrink-0" />
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">
                    {l.timestamp || l.ts
                      ? new Date(l.timestamp || l.ts).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recent'}
                  </span>
                  <span className="font-semibold text-[var(--color-text)]">
                    {l.user || l.assignee || 'System'}
                  </span>
                  <span className="text-[var(--color-text-muted)] truncate">{l.action}</span>
                  {l.taskId && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] shrink-0">
                      {l.taskId}
                    </span>
                  )}
                </div>
                {l.field && (
                  <span className="text-[11px] font-mono text-[var(--color-text-muted)] shrink-0">
                    {l.field}: {String(l.oldVal || '—')} →{' '}
                    <strong className="text-[var(--color-text)]">{String(l.newVal)}</strong>
                  </span>
                )}
              </div>
            ))}
            {log.length === 0 && (
              <div className="py-10 px-4 text-center border border-dashed border-[var(--color-divider)] rounded-xl space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text)]">
                  No state transitions logged in this session
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('log')}
                  className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs font-bold text-[var(--color-primary-hex)] hover:border-[var(--color-primary-hex)]/40 cursor-pointer"
                >
                  <span>Open Activity Ledger</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityGovernanceTab;
