import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Layers, 
  CalendarDays, 
  Flag, 
  ChevronDown, 
  ChevronRight, 
  Monitor, 
  CheckCircle2, 
  AlertTriangle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Feature, Task, Release, Member } from '../../types';
import { fmtDate } from '../../utils/projectUtils';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

type ZoomMode = 'day' | 'week' | 'month';

interface FeatureSwimlaneChartProps {
  features: Feature[];
  allFeatures: Feature[];
  tasks: Task[];
  releases: Release[];
  members?: Member[];
  featureMetrics: Record<string, {
    totTasks: number;
    doneTasks: number;
    avgProg: number;
    overdueTasks: number;
    status: 'Planned' | 'Active' | 'Done' | 'At Risk';
    minDate: string | null;
    maxDate: string | null;
    impactedModules: string[];
    screensByModule: Record<string, string[]>;
  }>;
  screenTasksMap: Record<string, Task[]>;
  onSelectFeature: (feature: Feature) => void;
}

interface SwimlaneRow {
  type: 'feature' | 'screen';
  feature: Feature;
  featIdx: number;
  featKey: string;
  mObj?: any;
  hasChildren?: boolean;
  isExpanded?: boolean;
  screenName?: string;
  scTasks?: Task[];
  scIdx?: number;
  isLastSc?: boolean;
  parentRowIdx?: number;
}

interface LaneGroup {
  category: string;
  color: string;
  features: Feature[];
  progress: number;
  minDate: Date;
  maxDate: Date;
  rows: SwimlaneRow[];
}

interface HitArea {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  row: SwimlaneRow;
  s: Date | null;
  e: Date | null;
  category: string;
}

const FEAT_PALETTE = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
const RELEASE_STATUS_COLORS: Record<string, string> = { Released: '#10b981', Active: '#3b82f6', Planned: '#f59e0b' };

export const FeatureSwimlaneChart: React.FC<FeatureSwimlaneChartProps> = ({
  features,
  allFeatures,
  tasks,
  releases,
  featureMetrics,
  screenTasksMap,
  onSelectFeature
}) => {
  // Control states
  const [zoom, setZoom] = useState<ZoomMode>('week');
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Splitter state
  const [leftWidth, setLeftWidth] = useState(290);
  const [isResizing, setIsResizing] = useState(false);

  // Hover state
  const [hoveredRow, setHoveredRow] = useState<{
    hit: HitArea;
    x: number;
    y: number;
  } | null>(null);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const axisScrollRef = useRef<HTMLDivElement>(null);
  const axisCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const hitAreasRef = useRef<HitArea[]>([]);

  // ── 1. Calculate Date Range Boundaries ──
  const dateBounds = useMemo(() => {
    const allDates: number[] = [];

    features.forEach(f => {
      const mObj = featureMetrics[f.name];
      if (mObj?.minDate) allDates.push(new Date(mObj.minDate + 'T00:00:00').getTime());
      if (mObj?.maxDate) allDates.push(new Date(mObj.maxDate + 'T00:00:00').getTime());
    });

    tasks.forEach(t => {
      if (t.startDate) allDates.push(new Date(t.startDate + 'T00:00:00').getTime());
      if (t.dueDate) allDates.push(new Date(t.dueDate + 'T00:00:00').getTime());
    });

    releases.forEach(r => {
      if (r.date) allDates.push(new Date(r.date + 'T00:00:00').getTime());
    });

    allDates.push(new Date().getTime());

    let min = new Date(Math.min(...allDates));
    let max = new Date(Math.max(...allDates));

    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 8);
    min.setHours(0, 0, 0, 0);
    max.setHours(0, 0, 0, 0);

    // Snap to week/month boundaries
    if (zoom === 'week') {
      const dow = min.getDay();
      min.setDate(min.getDate() - (dow === 0 ? 6 : dow - 1));
      const dowE = max.getDay();
      max.setDate(max.getDate() + (dowE === 0 ? 0 : 7 - dowE));
    } else if (zoom === 'month') {
      min = new Date(min.getFullYear(), min.getMonth(), 1);
      max = new Date(max.getFullYear(), max.getMonth() + 1, 0);
    }

    const totalDays = Math.max(14, Math.ceil((max.getTime() - min.getTime()) / 864e5) + 1);
    return { minDate: min, maxDate: max, totalDays };
  }, [features, featureMetrics, tasks, releases, zoom]);

  // Layout constants
  const dayW = zoom === 'day' ? 28 : zoom === 'week' ? 13 : 5;
  const ROW_H = 46;
  const AXIS_H = 46;
  const LANE_HEAD_H = 36;
  const BAR_H = 22;
  const PAD_L = 10;
  const canvasW = dateBounds.totalDays * dayW + PAD_L * 2;

  const dateToX = useCallback((dStr: string | null | undefined): number => {
    if (!dStr) return PAD_L;
    const rd = new Date(dStr.includes('T') ? dStr : dStr + 'T00:00:00');
    rd.setHours(0, 0, 0, 0);
    const days = Math.floor((rd.getTime() - dateBounds.minDate.getTime()) / 864e5);
    return PAD_L + Math.max(0, days) * dayW;
  }, [dateBounds.minDate, dayW]);

  // ── 2. Group Features by Category into Swimlanes ──
  const laneGroups: LaneGroup[] = useMemo(() => {
    const map = new Map<string, Feature[]>();

    features.forEach(f => {
      const key = f.category || 'Uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    });

    const sortedCategories = Array.from(map.keys()).sort((a, b) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });

    return sortedCategories.map((category, laneIdx) => {
      const laneFeatures = map.get(category)!;
      const color = FEAT_PALETTE[laneIdx % FEAT_PALETTE.length];

      let sumP = 0;
      let countP = 0;
      let laneMin: Date | null = null;
      let laneMax: Date | null = null;

      laneFeatures.forEach(f => {
        const mObj = featureMetrics[f.name];
        if (mObj) {
          sumP += mObj.avgProg || 0;
          countP++;
          if (mObj.minDate) {
            const sd = new Date(mObj.minDate + 'T00:00:00');
            if (!laneMin || sd < laneMin) laneMin = sd;
          }
          if (mObj.maxDate) {
            const ed = new Date(mObj.maxDate + 'T00:00:00');
            if (!laneMax || ed > laneMax) laneMax = ed;
          }
        }
      });

      const progress = countP > 0 ? Math.round(sumP / countP) : 0;
      if (!laneMin) laneMin = dateBounds.minDate;
      if (!laneMax) laneMax = dateBounds.maxDate;

      // Construct lane visible rows
      const rows: SwimlaneRow[] = [];
      laneFeatures.forEach(f => {
        const featIdx = allFeatures.indexOf(f);
        const featKey = `feat-${f.name}`;
        const screens = f.screens || [];
        const hasChildren = screens.length > 0;
        const isExpanded = expandedNodes.has(featKey);
        const mObj = featureMetrics[f.name];

        const parentRowIdx = rows.length;
        rows.push({
          type: 'feature',
          feature: f,
          featIdx,
          featKey,
          mObj,
          hasChildren,
          isExpanded
        });

        if (hasChildren && isExpanded) {
          screens.forEach((scName, scIdx) => {
            const scTasks = screenTasksMap[scName] || tasks.filter(t => 
              t.screen === scName || 
              t.name === scName || 
              (t.subtasks && t.subtasks.some(st => st.name === scName))
            );
            const isLastSc = scIdx === screens.length - 1;

            rows.push({
              type: 'screen',
              feature: f,
              featIdx,
              featKey,
              screenName: scName,
              scTasks,
              scIdx,
              isLastSc,
              parentRowIdx
            });
          });
        }
      });

      return {
        category,
        color,
        features: laneFeatures,
        progress,
        minDate: laneMin,
        maxDate: laneMax,
        rows
      };
    });
  }, [features, allFeatures, featureMetrics, expandedNodes, screenTasksMap, tasks, dateBounds]);

  // Toggle lane collapse
  const toggleLaneCollapse = useCallback((cat: string) => {
    setCollapsedLanes(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Toggle single feature expansion
  const toggleNode = useCallback((featKey: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(featKey)) next.delete(featKey);
      else next.add(featKey);
      return next;
    });
  }, []);

  // Expand / Collapse all
  const expandAll = useCallback(() => {
    setCollapsedLanes(new Set());
    const allNodes = new Set<string>();
    features.forEach(f => {
      if (f.screens && f.screens.length > 0) {
        allNodes.add(`feat-${f.name}`);
      }
    });
    setExpandedNodes(allNodes);
  }, [features]);

  const collapseAll = useCallback(() => {
    const allLanes = new Set(laneGroups.map(g => g.category));
    setCollapsedLanes(allLanes);
    setExpandedNodes(new Set());
  }, [laneGroups]);

  // Jump to today
  const jumpToToday = () => {
    const todayX = dateToX(new Date().toISOString().slice(0, 10));
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTo({
        left: Math.max(0, todayX - 250),
        behavior: 'smooth'
      });
    }
  };

  // Synchronize scrolling
  const handleRightScroll = () => {
    if (rightScrollRef.current) {
      if (axisScrollRef.current) {
        axisScrollRef.current.scrollLeft = rightScrollRef.current.scrollLeft;
      }
      if (leftScrollRef.current) {
        leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
      }
    }
  };

  const handleLeftScroll = () => {
    if (leftScrollRef.current && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  };

  // Splitter dragging
  const handleSplitterDown = (e: React.PointerEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newW = Math.max(160, Math.min(550, e.clientX - rect.left));
      setLeftWidth(newW);
    };
    const onUp = () => setIsResizing(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isResizing]);

  // ── 3. Draw Sticky Date Axis Canvas ──
  useEffect(() => {
    const cvs = axisCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = canvasW * dpr;
    cvs.height = AXIS_H * dpr;
    cvs.style.width = `${canvasW}px`;
    cvs.style.height = `${AXIS_H}px`;
    ctx.scale(dpr, dpr);

    const bodyStyle = getComputedStyle(document.body);
    const themeBg2 = bodyStyle.getPropertyValue('--color-surface-2').trim() || '#f8f7f4';
    const themeDivider = bodyStyle.getPropertyValue('--color-divider').trim() || 'rgba(148, 163, 184, 0.15)';
    const themeBorder = bodyStyle.getPropertyValue('--color-border').trim() || 'rgba(148, 163, 184, 0.25)';
    const themeText = bodyStyle.getPropertyValue('--color-text').trim() || '#1c1917';
    const themeMuted = bodyStyle.getPropertyValue('--color-text-muted').trim() || '#64748b';
    const themeFaint = bodyStyle.getPropertyValue('--color-text-faint').trim() || '#94a3b8';
    const font = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

    ctx.fillStyle = themeBg2;
    ctx.fillRect(0, 0, canvasW, AXIS_H);

    ctx.fillStyle = themeBorder;
    ctx.fillRect(0, AXIS_H - 1, canvasW, 1);

    for (let d = 0; d < dateBounds.totalDays; d++) {
      const dt = new Date(dateBounds.minDate.getTime() + d * 864e5);
      const x = PAD_L + d * dayW;
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;

      if (dt.getDay() === 1 || zoom === 'day') {
        ctx.strokeStyle = themeDivider;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, AXIS_H);
        ctx.stroke();
      }

      if (isWeekend) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.04)';
        ctx.fillRect(x, 0, dayW, AXIS_H);
      }

      if (zoom === 'day') {
        ctx.fillStyle = isWeekend ? themeFaint : themeMuted;
        ctx.font = `9px ${font}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(dt.getDate()), x + dayW / 2, AXIS_H - 5);

        if (dt.getDate() === 1 || d === 0) {
          ctx.fillStyle = themeText;
          ctx.font = `bold 9px ${font}`;
          ctx.fillText(dt.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), x + dayW / 2, AXIS_H - 18);
        }
      } else if (zoom === 'week' && dt.getDay() === 1) {
        ctx.fillStyle = themeMuted;
        ctx.font = `9px ${font}`;
        ctx.textAlign = 'left';
        ctx.fillText(dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), x + 2, AXIS_H - 5);
      } else if (zoom === 'month' && dt.getDate() === 1) {
        ctx.fillStyle = themeText;
        ctx.font = `bold 9px ${font}`;
        ctx.textAlign = 'left';
        ctx.fillText(dt.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), x + 2, AXIS_H - 5);
      }
    }

    // Today indicator
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= dateBounds.minDate && today <= dateBounds.maxDate) {
      const tx = dateToX(today.toISOString().slice(0, 10));
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, AXIS_H);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#ef4444';
      ctx.font = `bold 8px ${font}`;
      ctx.textAlign = 'left';
      ctx.fillText('TODAY', tx + 2, AXIS_H - 12);
    }

    // Release Milestone Lines in Axis
    releases.forEach(rel => {
      if (!rel.date) return;
      const rx = dateToX(rel.date);
      if (rx < PAD_L || rx > canvasW - 20) return;

      const rc = RELEASE_STATUS_COLORS[rel.status] || '#94a3b8';
      ctx.save();
      ctx.strokeStyle = rc;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, AXIS_H);
      ctx.stroke();

      const label = `${rel.name}`;
      ctx.font = `bold 8.5px ${font}`;
      const lblW = ctx.measureText(label).width + 8;
      const lblX = Math.min(rx + 2, canvasW - lblW - 4);

      ctx.fillStyle = rc;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.roundRect(lblX, 3, lblW, 13, 3);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = rc;
      ctx.textAlign = 'left';
      ctx.fillText(label, lblX + 4, 12);
      ctx.restore();
    });

  }, [canvasW, AXIS_H, dateBounds, dayW, zoom, dateToX, releases]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden select-none">
      {/* ── 1. Top Release Legend & Toolbar Bar (Matches projectpulse.html) ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-divider)] shrink-0 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Toggle */}
          <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg">
            {(['day', 'week', 'month'] as const).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={clsx(
                  "px-2.5 py-1 text-[11px] font-bold capitalize rounded-md transition-all cursor-pointer",
                  zoom === z ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[var(--color-divider)] hidden sm:block" />

          {/* Release Legend Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-1 shrink-0">
              <Flag size={11} className="text-[var(--color-primary-hex)]" /> Releases
            </span>
            {releases.filter(r => r.date).map(r => {
              const col = RELEASE_STATUS_COLORS[r.status] || '#94a3b8';
              return (
                <span 
                  key={r.name}
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
                  style={{
                    backgroundColor: `${col}15`,
                    borderColor: `${col}40`,
                    color: col
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: col }} />
                  {r.name} <span className="font-medium opacity-75">{fmtDate(r.date)}</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={jumpToToday}
            className="px-2 py-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 text-[var(--color-text)] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <Flag size={11} className="text-rose-500" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* ── 2. Swimlane Header Row (Left Header + Sticky Axis Right) ── */}
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-2)] shrink-0 overflow-hidden">
        {/* Left Axis Title */}
        <div 
          style={{ width: `${leftWidth}px`, height: `${AXIS_H}px` }} 
          className="shrink-0 flex items-center justify-between px-3 border-r border-[var(--color-divider)] bg-[var(--color-surface-2)]"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-faint)]">
            <Layers size={13} className="opacity-60" /> Swimlane / Category
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] hover:text-[var(--color-primary-hex)] cursor-pointer"
            >
              Expand
            </button>
            <button
              onClick={collapseAll}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] hover:text-[var(--color-primary-hex)] cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </div>

        {/* Resizer Spacer */}
        <div className="w-1.5 shrink-0 bg-transparent" />

        {/* Right Sticky Axis Canvas */}
        <div 
          ref={axisScrollRef}
          className="flex-1 overflow-x-hidden overflow-y-hidden"
        >
          <canvas ref={axisCanvasRef} className="block" />
        </div>
      </div>

      {/* ── 3. Split Swimlane Workspace (Left Lanes List + Right Lanes Canvas) ── */}
      <div ref={containerRef} className="flex-1 flex min-h-0 relative overflow-hidden bg-[var(--color-surface)]">
        {/* Left Column: Category Headers & Feature Rows */}
        <div 
          ref={leftScrollRef}
          onScroll={handleLeftScroll}
          style={{ width: `${leftWidth}px` }} 
          className="shrink-0 flex flex-col border-r border-[var(--color-divider)] bg-[var(--color-surface)] min-w-[160px] max-w-[600px] overflow-y-auto custom-scroll overflow-x-hidden"
        >
          {laneGroups.map((lane) => {
            const isCollapsed = collapsedLanes.has(lane.category);

            return (
              <div key={`lane-left-${lane.category}`} className="flex flex-col border-b border-[var(--color-border)]">
                {/* Category Swimlane Header */}
                <div 
                  style={{ 
                    height: `${LANE_HEAD_H}px`,
                    background: `linear-gradient(135deg, ${lane.color}15 0%, ${lane.color}05 100%)`
                  }}
                  onClick={() => toggleLaneCollapse(lane.category)}
                  className="flex items-center justify-between px-3 cursor-pointer border-b border-[var(--color-divider)] transition-colors hover:brightness-95 shrink-0 select-none"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                    </span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lane.color }} />
                    <span className="font-extrabold text-xs text-[var(--color-text)] truncate">
                      {lane.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[var(--color-text-faint)]">
                      {lane.features.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] hidden sm:inline">
                      {fmtDate(lane.minDate.toISOString().slice(0, 10))} &ndash; {fmtDate(lane.maxDate.toISOString().slice(0, 10))}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-10 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ width: `${lane.progress}%`, backgroundColor: lane.color }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[10px]" style={{ color: lane.color }}>
                        {lane.progress}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Feature Rows */}
                {!isCollapsed && (
                  <div className="flex flex-col">
                    {lane.rows.map((row, i) => {
                      if (row.type === 'feature') {
                        const f = row.feature;
                        const mObj = row.mObj;

                        return (
                          <div
                            key={`sl-left-feat-${f.name}-${i}`}
                            style={{ height: `${ROW_H}px` }}
                            onClick={() => onSelectFeature(f)}
                            className={clsx(
                              "flex items-center pr-3 border-b border-[var(--color-divider)] cursor-pointer transition-colors group",
                              i % 2 === 1 ? "bg-black/[0.012] dark:bg-white/[0.01]" : "bg-transparent",
                              "hover:bg-[var(--color-surface-2)]"
                            )}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNode(row.featKey);
                              }}
                              className="w-5 h-5 flex items-center justify-center shrink-0 ml-1 mr-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                            >
                              {row.hasChildren ? (
                                row.isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
                              ) : (
                                <span className="w-3" />
                              )}
                            </button>

                            <div 
                              className="w-[3px] h-full shrink-0 rounded-r mr-2 opacity-85"
                              style={{ backgroundColor: lane.color }}
                            />

                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-bold text-xs text-[var(--color-text)] truncate leading-tight group-hover:text-[var(--color-primary-hex)]">
                                {f.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 truncate text-[9px]">
                                {f.release && (
                                  <span 
                                    className="font-bold px-1.5 py-0.2 rounded-full border truncate"
                                    style={{
                                      backgroundColor: `${RELEASE_STATUS_COLORS[f.release] || '#94a3b8'}15`,
                                      borderColor: `${RELEASE_STATUS_COLORS[f.release] || '#94a3b8'}40`,
                                      color: RELEASE_STATUS_COLORS[f.release] || '#94a3b8'
                                    }}
                                  >
                                    {f.release}
                                  </span>
                                )}
                                <span className="font-mono font-bold" style={{ color: lane.color }}>
                                  {mObj?.avgProg || 0}%
                                </span>
                                {mObj?.overdueTasks > 0 && (
                                  <span className="text-rose-500 font-bold flex items-center gap-0.5">
                                    <AlertTriangle size={9} /> Overdue
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-[9px] font-mono font-bold text-[var(--color-text-faint)] bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-md px-1.5 py-0.5 ml-1.5">
                              {f.screens?.length || 0} scr
                            </div>
                          </div>
                        );
                      } else {
                        // Child Screen Row
                        return (
                          <div
                            key={`sl-left-sc-${row.screenName}-${i}`}
                            style={{ height: `${ROW_H}px` }}
                            onClick={() => onSelectFeature(row.feature)}
                            className="flex items-center pl-7 pr-3 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors relative"
                          >
                            <span className="absolute left-3 font-mono text-[10px] text-[var(--color-text-faint)] pointer-events-none">
                              {row.isLastSc ? '└─' : '├─'}
                            </span>
                            <Monitor size={12} className="text-[var(--color-text-muted)] shrink-0 mr-1.5 ml-1" />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="font-semibold text-[11px] text-[var(--color-text-muted)] truncate">
                                {row.screenName}
                              </div>
                            </div>
                            <div className="shrink-0 text-[9px] font-mono font-bold text-[var(--color-text-faint)] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded px-1.5 py-0.5 ml-1.5">
                              {row.scTasks?.length || 0} tsk
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resizer Splitter */}
        <div
          onPointerDown={handleSplitterDown}
          className={clsx(
            "w-1.5 cursor-col-resize shrink-0 transition-colors z-20 -ml-1",
            isResizing ? "bg-[var(--color-primary-hex)]" : "hover:bg-[var(--color-primary-hex)]/50 bg-transparent"
          )}
          title="Drag to resize panel"
        />

        {/* Right Column: Swimlane Category Canvases */}
        <div 
          ref={rightScrollRef}
          onScroll={handleRightScroll}
          className="flex-1 overflow-auto custom-scroll relative bg-[var(--color-bg)]"
        >
          {laneGroups.map((lane) => {
            const isCollapsed = collapsedLanes.has(lane.category);

            return (
              <SwimlaneCategoryTrack
                key={`lane-track-${lane.category}`}
                lane={lane}
                isCollapsed={isCollapsed}
                canvasW={canvasW}
                ROW_H={ROW_H}
                LANE_HEAD_H={LANE_HEAD_H}
                BAR_H={BAR_H}
                dayW={dayW}
                PAD_L={PAD_L}
                dateBounds={dateBounds}
                dateToX={dateToX}
                zoom={zoom}
                releases={releases}
                onSelectFeature={onSelectFeature}
                onHoverArea={(hit, x, y) => setHoveredRow(hit ? { hit, x, y } : null)}
              />
            );
          })}
        </div>
      </div>

      {/* ── 4. Rich Floating Hover Tooltip ── */}
      <AnimatePresence>
        {hoveredRow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 pointer-events-none bg-[var(--color-surface)]/95 backdrop-blur-2xl border border-[var(--color-divider)] rounded-2xl shadow-xl p-3.5 max-w-xs text-xs space-y-2 hidden md:block"
            style={{
              left: Math.min(hoveredRow.x + 14, window.innerWidth - 300),
              top: Math.min(hoveredRow.y + 14, window.innerHeight - 240)
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-1.5">
              <span className="font-mono text-[10px] font-bold text-[var(--color-primary-hex)]">
                {hoveredRow.hit.category} • {hoveredRow.hit.row.type === 'feature' ? 'FEATURE' : 'SCREEN'}
              </span>
              {hoveredRow.hit.row.feature.release && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">
                  {hoveredRow.hit.row.feature.release}
                </span>
              )}
            </div>

            <div className="font-bold text-sm text-[var(--color-text)] leading-snug">
              {hoveredRow.hit.row.type === 'feature' 
                ? hoveredRow.hit.row.feature.name 
                : hoveredRow.hit.row.screenName}
            </div>

            <div className="space-y-1 text-[11px] text-[var(--color-text-muted)]">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-[var(--color-text-faint)]" />
                <span>
                  {hoveredRow.hit.s ? fmtDate(hoveredRow.hit.s.toISOString().slice(0, 10)) : 'No start'} → {' '}
                  {hoveredRow.hit.e ? fmtDate(hoveredRow.hit.e.toISOString().slice(0, 10)) : 'No due'}
                </span>
              </div>

              {hoveredRow.hit.row.type === 'feature' && (
                <div className="flex items-center gap-1.5">
                  <Monitor size={13} className="text-[var(--color-text-faint)]" />
                  <span>Screens: {hoveredRow.hit.row.feature.screens?.join(', ') || 'None'}</span>
                </div>
              )}
            </div>

            <div className="pt-1.5 border-t border-[var(--color-divider)]">
              <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)] mb-1">
                <span>Progress</span>
                <span className="font-bold text-[var(--color-text)]">
                  {hoveredRow.hit.row.type === 'feature'
                    ? `${hoveredRow.hit.row.mObj?.avgProg || 0}%`
                    : `${hoveredRow.hit.row.scTasks?.length ? Math.round(hoveredRow.hit.row.scTasks.reduce((s, t) => s + (t.progress || 0), 0) / hoveredRow.hit.row.scTasks.length) : 0}%`
                  }
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all" 
                  style={{ 
                    backgroundColor: hoveredRow.hit.row.feature.category ? FEAT_PALETTE[0] : 'var(--color-primary-hex)',
                    width: `${hoveredRow.hit.row.type === 'feature'
                      ? hoveredRow.hit.row.mObj?.avgProg || 0
                      : hoveredRow.hit.row.scTasks?.length ? Math.round(hoveredRow.hit.row.scTasks.reduce((s, t) => s + (t.progress || 0), 0) / hoveredRow.hit.row.scTasks.length) : 0
                    }%` 
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Subcomponent: Single Swimlane Category Track Canvas ──
interface SwimlaneCategoryTrackProps {
  lane: LaneGroup;
  isCollapsed: boolean;
  canvasW: number;
  ROW_H: number;
  LANE_HEAD_H: number;
  BAR_H: number;
  dayW: number;
  PAD_L: number;
  dateBounds: { minDate: Date; maxDate: Date; totalDays: number };
  dateToX: (d: string | null | undefined) => number;
  zoom: ZoomMode;
  releases: Release[];
  onSelectFeature: (f: Feature) => void;
  onHoverArea: (hit: HitArea | null, x: number, y: number) => void;
}

const SwimlaneCategoryTrack: React.FC<SwimlaneCategoryTrackProps> = ({
  lane,
  isCollapsed,
  canvasW,
  ROW_H,
  LANE_HEAD_H,
  BAR_H,
  dayW,
  PAD_L,
  dateBounds,
  dateToX,
  zoom,
  releases,
  onSelectFeature,
  onHoverArea
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackHitAreasRef = useRef<HitArea[]>([]);

  const trackH = Math.max(ROW_H, lane.rows.length * ROW_H);

  useEffect(() => {
    if (isCollapsed) return;

    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = canvasW * dpr;
    cvs.height = trackH * dpr;
    cvs.style.width = `${canvasW}px`;
    cvs.style.height = `${trackH}px`;
    ctx.scale(dpr, dpr);

    const bodyStyle = getComputedStyle(document.body);
    const themeBg = bodyStyle.getPropertyValue('--color-surface').trim() || '#ffffff';
    const themeDivider = bodyStyle.getPropertyValue('--color-divider').trim() || 'rgba(148, 163, 184, 0.15)';
    const themeFaint = bodyStyle.getPropertyValue('--color-text-faint').trim() || '#94a3b8';
    const font = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

    // 1. Background
    ctx.fillStyle = themeBg;
    ctx.fillRect(0, 0, canvasW, trackH);

    // 2. Grid lines matching axis
    for (let d = 0; d < dateBounds.totalDays; d++) {
      const dt = new Date(dateBounds.minDate.getTime() + d * 864e5);
      const x = PAD_L + d * dayW;
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;

      if (dt.getDay() === 1 || zoom === 'day') {
        ctx.strokeStyle = themeDivider;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, trackH);
        ctx.stroke();
      }

      if (isWeekend) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.03)';
        ctx.fillRect(x, 0, dayW, trackH);
      }
    }

    // 3. Row alternating fills and dividers
    lane.rows.forEach((row, i) => {
      const by = i * ROW_H;
      if (row.type === 'screen') {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.035)';
        ctx.fillRect(0, by, canvasW, ROW_H);
      } else if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.015)';
        ctx.fillRect(0, by, canvasW, ROW_H);
      }

      ctx.strokeStyle = themeDivider;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, by + ROW_H);
      ctx.lineTo(canvasW, by + ROW_H);
      ctx.stroke();
    });

    // 4. Release separator lines
    releases.forEach(rel => {
      if (!rel.date) return;
      const rx = dateToX(rel.date);
      if (rx < PAD_L || rx > canvasW - 20) return;

      const rc = RELEASE_STATUS_COLORS[rel.status] || '#94a3b8';
      ctx.save();
      ctx.strokeStyle = rc;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, trackH);
      ctx.stroke();
      ctx.restore();
    });

    // 5. Today line
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= dateBounds.minDate && today <= dateBounds.maxDate) {
      const tx = dateToX(today.toISOString().slice(0, 10));
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, trackH);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Bars & Child screen bars
    const hits: HitArea[] = [];
    const parentBarCoords: Record<number, { x1: number; yCenter: number }> = {};

    lane.rows.forEach((row, i) => {
      const barY = i * ROW_H + (ROW_H - BAR_H) / 2;

      if (row.type === 'feature') {
        const f = row.feature;
        const mObj = row.mObj;
        const bc = mObj?.overdueTasks > 0 ? '#ef4444' : lane.color;

        let s: Date | null = mObj?.minDate ? new Date(mObj.minDate + 'T00:00:00') : null;
        let e: Date | null = mObj?.maxDate ? new Date(mObj.maxDate + 'T00:00:00') : null;

        if (s && e) {
          const x1 = dateToX(mObj.minDate);
          const x2 = dateToX(mObj.maxDate) + dayW;
          const bw = Math.max(x2 - x1, dayW * 2);

          parentBarCoords[i] = { x1, yCenter: barY + BAR_H / 2 };

          // Ghost
          ctx.fillStyle = bc;
          ctx.globalAlpha = 0.14;
          ctx.beginPath();
          ctx.roundRect(x1, barY, bw, BAR_H, 6);
          ctx.fill();

          // Progress fill
          const pw = Math.max(bw * (mObj.avgProg || 0) / 100, 0);
          if (pw > 0) {
            ctx.globalAlpha = 1;
            const grad = ctx.createLinearGradient(x1, barY, x1 + pw, barY + BAR_H);
            grad.addColorStop(0, bc);
            grad.addColorStop(1, bc + 'bb');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x1, barY, pw, BAR_H, 6);
            ctx.fill();
          }

          // Border
          ctx.globalAlpha = 0.75;
          ctx.strokeStyle = bc;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(x1, barY, bw, BAR_H, 6);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Label
          const label = `${f.name}  ${mObj.avgProg || 0}%`;
          ctx.font = `bold 10px ${font}`;
          const lblW = ctx.measureText(label).width;
          if (bw > lblW + 16) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x1, barY, bw, BAR_H, 6);
            ctx.clip();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(label, x1 + 8, barY + BAR_H / 2 + 3.5);
            ctx.restore();
          }

          // Release chip
          if (f.release) {
            const relColor = RELEASE_STATUS_COLORS[f.release] || '#94a3b8';
            ctx.font = `bold 8px ${font}`;
            const chipLbl = f.release;
            const chipW = ctx.measureText(chipLbl).width + 8;
            const chipX = Math.min(x1 + bw - chipW - 4, canvasW - chipW - 6);
            const chipY = barY + 3;
            const chipH = BAR_H - 6;

            if (chipX > x1 + 6) {
              ctx.fillStyle = relColor;
              ctx.globalAlpha = 0.25;
              ctx.beginPath();
              ctx.roundRect(chipX, chipY, chipW, chipH, 3);
              ctx.fill();

              ctx.globalAlpha = 1;
              ctx.fillStyle = relColor;
              ctx.textAlign = 'left';
              ctx.fillText(chipLbl, chipX + 4, chipY + chipH / 2 + 2.5);
            }
          }

          // 100% flag
          if (mObj.avgProg === 100) {
            const dx = x1 + bw + 8;
            const dy = barY + BAR_H / 2;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(dx - 3, dy - 6);
            ctx.lineTo(dx - 3, dy + 8);
            ctx.stroke();

            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.moveTo(dx - 3, dy - 6);
            ctx.lineTo(dx + 6, dy - 2);
            ctx.lineTo(dx - 3, dy + 2);
            ctx.closePath();
            ctx.fill();
          }

          hits.push({
            x1,
            x2: x1 + bw,
            y1: i * ROW_H,
            y2: (i + 1) * ROW_H,
            row,
            s,
            e,
            category: lane.category
          });
        } else {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
          ctx.beginPath();
          ctx.roundRect(PAD_L + 6, barY, Math.min(260, canvasW - PAD_L - 30), BAR_H, 6);
          ctx.fill();

          ctx.fillStyle = themeFaint;
          ctx.font = `italic 10px ${font}`;
          ctx.textAlign = 'left';
          ctx.fillText('No tasks with dates mapped', PAD_L + 16, barY + BAR_H / 2 + 3);
        }
      } else if (row.type === 'screen') {
        const scTasks = (row.scTasks || []).filter(t => t.startDate && t.dueDate);
        const subH = 16;
        const subY = i * ROW_H + (ROW_H - subH) / 2;
        const parentCoord = row.parentRowIdx !== undefined ? parentBarCoords[row.parentRowIdx] : undefined;

        if (scTasks.length > 0) {
          const startTimes = scTasks.map(t => new Date(t.startDate + 'T00:00:00').getTime());
          const dueTimes = scTasks.map(t => new Date(t.dueDate + 'T00:00:00').getTime());
          const s = new Date(Math.min(...startTimes));
          const e = new Date(Math.max(...dueTimes));

          const x1 = dateToX(s.toISOString().slice(0, 10));
          const x2 = dateToX(e.toISOString().slice(0, 10)) + dayW;
          const bw = Math.max(x2 - x1, dayW * 2);

          const tot = scTasks.length;
          const avgP = tot ? Math.round(scTasks.reduce((st, t) => st + (t.progress || 0), 0) / tot) : 0;

          // Tree connector line
          if (parentCoord) {
            ctx.save();
            ctx.strokeStyle = lane.color;
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(parentCoord.x1 + 10, parentCoord.yCenter);
            ctx.lineTo(parentCoord.x1 + 10, subY + subH / 2);
            ctx.lineTo(x1, subY + subH / 2);
            ctx.stroke();
            ctx.restore();
          }

          // Screen Ghost
          ctx.fillStyle = lane.color;
          ctx.globalAlpha = 0.16;
          ctx.beginPath();
          ctx.roundRect(x1, subY, bw, subH, 4);
          ctx.fill();

          // Screen Progress
          const pw = Math.max(bw * avgP / 100, 0);
          if (pw > 0) {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = lane.color;
            ctx.beginPath();
            ctx.roundRect(x1, subY, pw, subH, 4);
            ctx.fill();
          }

          // Border
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = lane.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x1, subY, bw, subH, 4);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Label
          const label = `${row.screenName} (${avgP}%)`;
          ctx.font = `bold 9px ${font}`;
          const lblW = ctx.measureText(label).width;
          if (bw > lblW + 8) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x1, subY, bw, subH, 4);
            ctx.clip();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText(label, x1 + 6, subY + subH / 2 + 3);
            ctx.restore();
          }

          hits.push({
            x1,
            x2: x1 + bw,
            y1: i * ROW_H,
            y2: (i + 1) * ROW_H,
            row,
            s,
            e,
            category: lane.category
          });
        }
      }
    });

    trackHitAreasRef.current = hits;
  }, [isCollapsed, canvasW, trackH, dateBounds, dayW, zoom, lane, releases, dateToX, ROW_H, BAR_H, PAD_L]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hit = trackHitAreasRef.current.find(h => 
      mouseX >= h.x1 && mouseX <= h.x2 && mouseY >= h.y1 && mouseY <= h.y2
    );

    if (hit) {
      onHoverArea(hit, e.clientX, e.clientY);
    } else {
      onHoverArea(null, 0, 0);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hit = trackHitAreasRef.current.find(h => 
      mouseX >= h.x1 && mouseX <= h.x2 && mouseY >= h.y1 && mouseY <= h.y2
    );

    if (hit && hit.row.feature) {
      onSelectFeature(hit.row.feature);
    }
  };

  return (
    <div className="flex flex-col border-b border-[var(--color-border)]">
      {/* Right Category Track Header */}
      <div 
        style={{ 
          height: `${LANE_HEAD_H}px`, 
          width: `${canvasW}px`,
          background: `linear-gradient(135deg, ${lane.color}15 0%, ${lane.color}05 100%)`
        }}
        className="border-b border-[var(--color-divider)] shrink-0"
      />

      {/* Right Category Canvases */}
      {!isCollapsed && (
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => onHoverArea(null, 0, 0)}
          onClick={handleClick}
          className="cursor-pointer block"
        />
      )}
    </div>
  );
};

export default FeatureSwimlaneChart;

