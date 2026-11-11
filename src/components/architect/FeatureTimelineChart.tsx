import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  GitFork, 
  CalendarCheck2, 
  Cpu, 
  CalendarDays, 
  Flag, 
  ChevronDown, 
  ChevronRight, 
  Monitor, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  Minimize2,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Feature, Task, TaskStatus, Release, Member } from '../../types';
import { fmtDate, daysDiff } from '../../utils/projectUtils';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

type ZoomMode = 'day' | 'week' | 'month' | 'quarter';

interface FeatureTimelineChartProps {
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

interface TimelineRow {
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

interface HitArea {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  row: TimelineRow;
  s: Date | null;
  e: Date | null;
  mcP90Date: Date | null;
  actDoneDate: Date | null;
}

const FEAT_PALETTE = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
const RELEASE_STATUS_COLORS: Record<string, string> = { Released: '#10b981', Active: '#3b82f6', Planned: '#f59e0b' };

function getBarColor(mObj: any, idx: number): string {
  if (mObj && mObj.overdueTasks > 0) return '#ef4444';
  return FEAT_PALETTE[idx % FEAT_PALETTE.length];
}

export const FeatureTimelineChart: React.FC<FeatureTimelineChartProps> = ({
  features,
  allFeatures,
  tasks,
  releases,
  members = [],
  featureMetrics,
  screenTasksMap,
  onSelectFeature
}) => {
  // Control states
  const [zoom, setZoom] = useState<ZoomMode>('week');
  const [showDeps, setShowDeps] = useState(true);
  const [showActuals, setShowActuals] = useState(true);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Splitter state
  const [leftWidth, setLeftWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  // Hover state
  const [hoveredRow, setHoveredRow] = useState<{
    hit: HitArea;
    x: number;
    y: number;
  } | null>(null);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitAreasRef = useRef<HitArea[]>([]);

  // ── 1. Build Flat List of Visible Rows (Features + Expanded Screen Children) ──
  const visibleRows = useMemo(() => {
    const rows: TimelineRow[] = [];

    features.forEach((f, featIdx) => {
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
          // Discover tasks linked to this screen
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

    return rows;
  }, [features, expandedNodes, featureMetrics, screenTasksMap, tasks]);

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
    const all = new Set<string>();
    features.forEach(f => {
      if (f.screens && f.screens.length > 0) {
        all.add(`feat-${f.name}`);
      }
    });
    setExpandedNodes(all);
  }, [features]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  // ── 2. Calculate Date Range Boundaries ──
  const dateBounds = useMemo(() => {
    const allDates: number[] = [];

    // Feature & task dates
    features.forEach(f => {
      const mObj = featureMetrics[f.name];
      if (mObj?.minDate) allDates.push(new Date(mObj.minDate + 'T00:00:00').getTime());
      if (mObj?.maxDate) allDates.push(new Date(mObj.maxDate + 'T00:00:00').getTime());
    });

    // Screen task dates
    tasks.forEach(t => {
      if (t.startDate) allDates.push(new Date(t.startDate + 'T00:00:00').getTime());
      if (t.dueDate) allDates.push(new Date(t.dueDate + 'T00:00:00').getTime());
    });

    // Release milestone dates
    releases.forEach(r => {
      if (r.date) allDates.push(new Date(r.date + 'T00:00:00').getTime());
    });

    allDates.push(new Date().getTime());

    let min = new Date(Math.min(...allDates));
    let max = new Date(Math.max(...allDates));

    // Add padding
    min.setDate(min.getDate() - 5);
    max.setDate(max.getDate() + 12);
    min.setHours(0, 0, 0, 0);
    max.setHours(0, 0, 0, 0);

    const totalDays = Math.max(14, Math.ceil((max.getTime() - min.getTime()) / 864e5));
    return { minDate: min, maxDate: max, totalDays };
  }, [features, featureMetrics, tasks, releases]);

  // Layout constants
  const dayW = zoom === 'day' ? 30 : zoom === 'week' ? 14 : zoom === 'quarter' ? 3 : 5;
  const ROW_H = 46;
  const HEAD_H = 54;
  const SUB_H = 20;
  const PAD_L = 8;
  const BAR_H = 22;
  const canvasW = dateBounds.totalDays * dayW + PAD_L * 2;
  const canvasH = HEAD_H + visibleRows.length * ROW_H;

  const dateToX = useCallback((dStr: string | null | undefined): number => {
    if (!dStr) return PAD_L;
    const rd = new Date(dStr.includes('T') ? dStr : dStr + 'T00:00:00');
    rd.setHours(0, 0, 0, 0);
    const days = Math.floor((rd.getTime() - dateBounds.minDate.getTime()) / 864e5);
    return PAD_L + Math.max(0, days) * dayW;
  }, [dateBounds.minDate, dayW]);

  // Jump to today
  const jumpToToday = () => {
    const todayX = dateToX(new Date().toISOString().slice(0, 10));
    if (rightScrollRef.current) {
      rightScrollRef.current.scrollTo({
        left: Math.max(0, todayX - 260),
        behavior: 'smooth'
      });
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

  // Synchronize vertical scrolling
  const handleRightScroll = () => {
    if (rightScrollRef.current && leftScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
  };

  const handleLeftScroll = () => {
    if (leftScrollRef.current && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  };

  // Monte Carlo Simulation
  const mcResults = useMemo(() => {
    if (!showMonteCarlo || features.length === 0) return null;

    const iterations = 80;
    const perFeature: Record<string, { p10: Date; p50: Date; p90: Date }> = {};

    features.forEach(f => {
      const mObj = featureMetrics[f.name];
      if (!mObj?.minDate || !mObj?.maxDate) return;

      const sMs = new Date(mObj.minDate + 'T00:00:00').getTime();
      const dMs = new Date(mObj.maxDate + 'T00:00:00').getTime();
      const plannedDays = Math.max(2, (dMs - sMs) / 864e5);
      const riskFactor = mObj.overdueTasks > 0 ? 1.35 : 1.05;

      const simEnds: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const r = 0.8 + Math.random() * 0.45;
        const simDays = plannedDays * riskFactor * r;
        simEnds.push(sMs + simDays * 864e5);
      }
      simEnds.sort((a, b) => a - b);

      perFeature[f.name] = {
        p10: new Date(simEnds[Math.floor(iterations * 0.10)]),
        p50: new Date(simEnds[Math.floor(iterations * 0.50)]),
        p90: new Date(simEnds[Math.floor(iterations * 0.90)]),
      };
    });

    return perFeature;
  }, [showMonteCarlo, features, featureMetrics]);

  // ── 3. Draw Canvas Gantt Timeline ──
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = canvasW * dpr;
    cvs.height = canvasH * dpr;
    cvs.style.width = `${canvasW}px`;
    cvs.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);

    // Resolve theme variables
    const bodyStyle = getComputedStyle(document.body);
    const themeBg = bodyStyle.getPropertyValue('--color-surface').trim() || '#ffffff';
    const themeBg2 = bodyStyle.getPropertyValue('--color-surface-2').trim() || '#f8f7f4';
    const themeDivider = bodyStyle.getPropertyValue('--color-divider').trim() || 'rgba(148, 163, 184, 0.15)';
    const themeBorder = bodyStyle.getPropertyValue('--color-border').trim() || 'rgba(148, 163, 184, 0.25)';
    const themeText = bodyStyle.getPropertyValue('--color-text').trim() || '#1c1917';
    const themeMuted = bodyStyle.getPropertyValue('--color-text-muted').trim() || '#64748b';
    const themeFaint = bodyStyle.getPropertyValue('--color-text-faint').trim() || '#94a3b8';
    const font = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

    // 1. Clear & Background
    ctx.fillStyle = themeBg;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // 2. Release period background tinting
    const sortedRels = [...releases]
      .filter(r => r.date)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    let lastRx = 0;
    sortedRels.forEach(rel => {
      const rx = dateToX(rel.date);
      if (rx > lastRx) {
        const baseColor = RELEASE_STATUS_COLORS[rel.status] || '#94a3b8';
        ctx.fillStyle = baseColor === '#10b981' ? 'rgba(16, 185, 129, 0.04)' : baseColor === '#3b82f6' ? 'rgba(59, 130, 246, 0.04)' : 'rgba(245, 158, 11, 0.04)';
        ctx.fillRect(lastRx, HEAD_H, rx - lastRx, canvasH - HEAD_H);
      }
      lastRx = rx;
    });

    // 3. Alternating row background bands
    visibleRows.forEach((row, i) => {
      const by = HEAD_H + i * ROW_H;
      if (row.type === 'screen') {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.035)';
        ctx.fillRect(0, by, canvasW, ROW_H);
      } else if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(128, 128, 128, 0.015)';
        ctx.fillRect(0, by, canvasW, ROW_H);
      }
    });

    // 4. Dual-Row Header
    ctx.fillStyle = themeBg2;
    ctx.fillRect(0, 0, canvasW, HEAD_H);

    ctx.fillStyle = themeBorder;
    ctx.fillRect(0, HEAD_H - SUB_H, canvasW, 0.8);
    ctx.fillRect(0, HEAD_H - 1, canvasW, 1.2);

    for (let d = 0; d < dateBounds.totalDays; d++) {
      const dt = new Date(dateBounds.minDate.getTime() + d * 864e5);
      const x = PAD_L + d * dayW;
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
      const isMonday = dt.getDay() === 1;
      const isMonthStart = dt.getDate() === 1;

      // Weekend shading
      if (isWeekend) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.04)';
        ctx.fillRect(x, HEAD_H, dayW, canvasH - HEAD_H);
      }

      // Grid line
      let drawGrid = false;
      if (zoom === 'day') drawGrid = true;
      else if (zoom === 'week') drawGrid = isMonday;
      else if (zoom === 'month') drawGrid = isMonthStart;
      else drawGrid = isMonthStart && dt.getMonth() % 3 === 0;

      if (drawGrid) {
        ctx.strokeStyle = themeDivider;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, HEAD_H);
        ctx.lineTo(x, canvasH);
        ctx.stroke();
      }

      // Top Header Row: Month / Year labels
      if ((zoom === 'day' && isMonthStart) || (zoom === 'week' && isMonthStart) || (zoom === 'month' && isMonthStart) || (zoom === 'quarter' && isMonthStart && dt.getMonth() % 3 === 0) || d === 0) {
        ctx.fillStyle = themeText;
        ctx.font = `bold 10px ${font}`;
        ctx.textAlign = 'left';
        ctx.fillText(dt.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), x + 4, HEAD_H - SUB_H - 6);
      }

      // Bottom Header Row: Day / Week ticks
      if (zoom === 'day') {
        ctx.fillStyle = isWeekend ? themeFaint : themeMuted;
        ctx.font = `9px ${font}`;
        ctx.textAlign = 'center';
        ctx.fillText(String(dt.getDate()), x + dayW / 2, HEAD_H - 6);
      } else if (zoom === 'week' && isMonday) {
        ctx.fillStyle = themeMuted;
        ctx.font = `9px ${font}`;
        ctx.textAlign = 'left';
        ctx.fillText(dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), x + 2, HEAD_H - 6);
      }
    }

    // 5. Release Milestone Vertical Marker Lines
    releases.forEach(rel => {
      if (!rel.date) return;
      const rx = dateToX(rel.date);
      if (rx < PAD_L || rx > canvasW - 20) return;

      const relColor = RELEASE_STATUS_COLORS[rel.status] || '#94a3b8';

      ctx.save();
      ctx.strokeStyle = relColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, canvasH);
      ctx.stroke();
      ctx.setLineDash([]);

      const label = `${rel.name} • ${rel.status}`;
      ctx.font = `bold 8.5px ${font}`;
      const lblW = ctx.measureText(label).width + 10;
      const lblX = Math.min(rx + 2, canvasW - lblW - 4);

      ctx.fillStyle = relColor;
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      ctx.roundRect(lblX, 3, lblW, 14, 3);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = relColor;
      ctx.textAlign = 'left';
      ctx.fillText(label, lblX + 5, 13);
      ctx.restore();
    });

    // 6. Today Vertical Dashed Line
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= dateBounds.minDate && today <= dateBounds.maxDate) {
      const tx = dateToX(today.toISOString().slice(0, 10));

      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, canvasH);
      ctx.stroke();
      ctx.restore();

      const todayLbl = 'TODAY';
      ctx.font = `bold 8px ${font}`;
      const tlW = ctx.measureText(todayLbl).width + 8;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(tx - tlW / 2, HEAD_H + 2, tlW, 13, 3);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(todayLbl, tx, HEAD_H + 11);
    }

    // 7. Row Horizontal Dividers
    ctx.strokeStyle = themeDivider;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= visibleRows.length; i++) {
      const y = HEAD_H + i * ROW_H;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();
    }

    // 8. Draw Feature & Screen Bars
    const newHitAreas: HitArea[] = [];
    const parentBarCoords: Record<number, { x1: number; yCenter: number }> = {};
    const barPositions: Record<string, { x: number; x2: number; y: number; id: string }> = {};

    visibleRows.forEach((row, i) => {
      const barY = HEAD_H + i * ROW_H + (ROW_H - BAR_H) / 2;

      if (row.type === 'feature') {
        const f = row.feature;
        const mObj = row.mObj;
        const bc = getBarColor(mObj, row.featIdx);

        let s: Date | null = mObj?.minDate ? new Date(mObj.minDate + 'T00:00:00') : null;
        let e: Date | null = mObj?.maxDate ? new Date(mObj.maxDate + 'T00:00:00') : null;

        if (s && e) {
          const x1 = dateToX(mObj.minDate);
          const x2 = dateToX(mObj.maxDate) + dayW;
          const bw = Math.max(x2 - x1, dayW * 2);

          parentBarCoords[i] = { x1, yCenter: barY + BAR_H / 2 };
          const fPos = { x: x1, x2: x1 + bw, y: barY + BAR_H / 2, id: f.name };
          barPositions[f.name] = fPos;
          if (f.id) barPositions[f.id] = fPos;

          // Monte Carlo Whisker Overlay
          let mcP90Date: Date | null = null;
          if (showMonteCarlo && mcResults && mcResults[f.name]) {
            const mc = mcResults[f.name];
            mcP90Date = mc.p90;
            const p10X = dateToX(mc.p10.toISOString().slice(0, 10));
            const p90X = dateToX(mc.p90.toISOString().slice(0, 10)) + dayW;

            ctx.fillStyle = 'rgba(139, 92, 246, 0.16)';
            ctx.beginPath();
            ctx.roundRect(p10X, barY - 3, Math.max(6, p90X - p10X), BAR_H + 6, 6);
            ctx.fill();

            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(p90X, barY - 4);
            ctx.lineTo(p90X, barY + BAR_H + 4);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#8b5cf6';
            ctx.font = `bold 8px ${font}`;
            ctx.fillText('P90', p90X + 2, barY - 1);
          }

          // Actuals Overlay Marker
          let actDoneDate: Date | null = null;
          if (showActuals) {
            const actDates = (tasks || [])
              .filter(t => t.module === f.name && t.actCompletionDate)
              .map(t => new Date(t.actCompletionDate! + 'T00:00:00').getTime());

            if (actDates.length > 0) {
              actDoneDate = new Date(Math.max(...actDates));
              const actX = dateToX(actDoneDate.toISOString().slice(0, 10)) + dayW / 2;

              ctx.save();
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 1.5;
              ctx.setLineDash([2, 2]);
              ctx.beginPath();
              ctx.moveTo(x2, barY + BAR_H / 2);
              ctx.lineTo(actX, barY + BAR_H / 2);
              ctx.stroke();
              ctx.setLineDash([]);

              const ds = 5;
              const dy = barY + BAR_H / 2;
              ctx.fillStyle = '#10b981';
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(actX, dy - ds);
              ctx.lineTo(actX + ds, dy);
              ctx.lineTo(actX, dy + ds);
              ctx.lineTo(actX - ds, dy);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          }

          // Bar Background Ghost
          ctx.fillStyle = bc;
          ctx.globalAlpha = 0.14;
          ctx.beginPath();
          ctx.roundRect(x1, barY, bw, BAR_H, 6);
          ctx.fill();

          // Progress Fill Gradient
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

          // Border Outline
          ctx.globalAlpha = 0.75;
          ctx.strokeStyle = bc;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(x1, barY, bw, BAR_H, 6);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Inline Label
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

          // Release Version Chip on Bar Right
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

          // 100% Completion Milestone Flag
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

          newHitAreas.push({
            x1,
            x2: x1 + bw,
            y1: HEAD_H + i * ROW_H,
            y2: HEAD_H + (i + 1) * ROW_H,
            row,
            s,
            e,
            mcP90Date,
            actDoneDate
          });
        } else {
          // Unscheduled Placeholder
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
        // Sub-row: Screen Bar
        const scTasks = (row.scTasks || []).filter(t => t.startDate && t.dueDate);
        const subH = 16;
        const subY = HEAD_H + i * ROW_H + (ROW_H - subH) / 2;
        const parentCoord = row.parentRowIdx !== undefined ? parentBarCoords[row.parentRowIdx] : undefined;
        const bc = getBarColor(featureMetrics[row.feature.name], row.featIdx);

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

          barPositions[row.screenName!] = { x: x1, x2: x1 + bw, y: subY + subH / 2, id: row.screenName! };

          // Tree connector line from parent bar
          if (parentCoord) {
            ctx.save();
            ctx.strokeStyle = bc;
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

          // Screen Bar Ghost
          ctx.fillStyle = bc;
          ctx.globalAlpha = 0.16;
          ctx.beginPath();
          ctx.roundRect(x1, subY, bw, subH, 4);
          ctx.fill();

          // Screen Progress
          const pw = Math.max(bw * avgP / 100, 0);
          if (pw > 0) {
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = bc;
            ctx.beginPath();
            ctx.roundRect(x1, subY, pw, subH, 4);
            ctx.fill();
          }

          // Border
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = bc;
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

          newHitAreas.push({
            x1,
            x2: x1 + bw,
            y1: HEAD_H + i * ROW_H,
            y2: HEAD_H + (i + 1) * ROW_H,
            row,
            s,
            e,
            mcP90Date: null,
            actDoneDate: null
          });
        } else {
          ctx.fillStyle = themeFaint;
          ctx.globalAlpha = 0.5;
          ctx.font = `italic 9px ${font}`;
          ctx.textAlign = 'left';
          ctx.fillText(`Screen '${row.screenName}' — unscheduled`, PAD_L + 24, subY + subH / 2 + 3);
          ctx.globalAlpha = 1;
        }
      }
    });

    // 9. Draw Dependency Connecting Arrows
    if (showDeps) {
      const drawnConns = new Set<string>();

      visibleRows.forEach(row => {
        let deps: string[] = [];
        let toPos: { x: number; x2: number; y: number; id: string } | null = null;

        if (row.type === 'feature') {
          const f = row.feature;
          if (f.dependsOn) {
            deps = Array.isArray(f.dependsOn) ? f.dependsOn : String(f.dependsOn).split(',').map(s => s.trim()).filter(Boolean);
          }
          toPos = barPositions[f.name] || (f.id ? barPositions[f.id] : null);
        }

        if (!toPos || deps.length === 0) return;

        deps.forEach(depId => {
          const fromPos = barPositions[depId];
          if (!fromPos || fromPos === toPos) return;

          const connKey = `${fromPos.id}-->${toPos.id}`;
          if (drawnConns.has(connKey)) return;
          drawnConns.add(connKey);

          const startX = fromPos.x2;
          const startY = fromPos.y;
          const endX = toPos.x;
          const endY = toPos.y;

          ctx.save();
          ctx.strokeStyle = '#f59e0b';
          ctx.fillStyle = '#f59e0b';
          ctx.lineWidth = 1.6;
          ctx.globalAlpha = 0.85;

          if (endX >= startX + 12) {
            const midX = Math.round((startX + endX) / 2);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(midX, startY);
            ctx.lineTo(midX, endY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          } else {
            const offsetRight = startX + 10;
            const offsetLeft = endX - 10;
            const midY = Math.round((startY + endY) / 2);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(offsetRight, startY);
            ctx.lineTo(offsetRight, midY);
            ctx.lineTo(offsetLeft, midY);
            ctx.lineTo(offsetLeft, endY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - 5, endY - 3.5);
          ctx.lineTo(endX - 5, endY + 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      });
    }

    hitAreasRef.current = newHitAreas;
  }, [canvasW, canvasH, dateBounds, dayW, visibleRows, zoom, showDeps, showActuals, showMonteCarlo, releases, mcResults, dateToX, tasks]);

  // Handle canvas mouse move for tooltip
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hit = hitAreasRef.current.find(h => 
      mouseX >= h.x1 && mouseX <= h.x2 && mouseY >= h.y1 && mouseY <= h.y2
    );

    if (hit) {
      setHoveredRow({ hit, x: e.clientX, y: e.clientY });
    } else {
      setHoveredRow(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hit = hitAreasRef.current.find(h => 
      mouseX >= h.x1 && mouseX <= h.x2 && mouseY >= h.y1 && mouseY <= h.y2
    );

    if (hit && hit.row.feature) {
      onSelectFeature(hit.row.feature);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden select-none">
      {/* ── 1. Top Release Legend Bar (Matches projectpulse.html) ── */}
      {releases.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-divider)] shrink-0 overflow-x-auto custom-scroll">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-1 shrink-0">
            <Flag size={11} className="text-[var(--color-primary-hex)]" /> Releases
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {releases.filter(r => r.date).map(r => {
              const col = RELEASE_STATUS_COLORS[r.status] || '#94a3b8';
              return (
                <span 
                  key={r.name}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0"
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
      )}

      {/* ── 2. Timeline Control Toolbar ── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--color-surface-2)] border-b border-[var(--color-divider)] shrink-0 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom Toggle */}
          <div className="flex items-center p-0.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg">
            {(['day', 'week', 'month', 'quarter'] as const).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={clsx(
                  "px-2 py-1 text-[11px] font-bold capitalize rounded-md transition-all cursor-pointer",
                  zoom === z ? "bg-[var(--color-surface-2)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[var(--color-divider)] hidden sm:block" />

          {/* Overlays */}
          <button
            onClick={() => setShowDeps(!showDeps)}
            className={clsx(
              "px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              showDeps ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400" : "bg-[var(--color-surface)] border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
            title="Toggle Feature Dependencies Overlay"
          >
            <GitFork size={12} />
            <span className="hidden sm:inline">Dependencies</span>
          </button>

          <button
            onClick={() => setShowActuals(!showActuals)}
            className={clsx(
              "px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              showActuals ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "bg-[var(--color-surface)] border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
            title="Toggle Actual Completion Markers"
          >
            <CalendarCheck2 size={12} />
            <span className="hidden sm:inline">Actuals</span>
          </button>

          <button
            onClick={() => setShowMonteCarlo(!showMonteCarlo)}
            className={clsx(
              "px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
              showMonteCarlo ? "bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400" : "bg-[var(--color-surface)] border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
            title="Toggle Monte Carlo P90 Forecast Whiskers"
          >
            <Cpu size={12} />
            <span className="hidden sm:inline">Monte Carlo</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={jumpToToday}
            className="px-2 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 text-[var(--color-text)] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
          >
            <Flag size={11} className="text-rose-500" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* ── 3. Split-Panel Chart Body ── */}
      <div ref={containerRef} className="flex-1 flex min-h-0 relative overflow-hidden bg-[var(--color-surface)]">
        {/* ── Left Column: Features & Child Screens Tree ── */}
        <div 
          style={{ width: `${leftWidth}px` }} 
          className="shrink-0 flex flex-col border-r border-[var(--color-divider)] bg-[var(--color-surface)] min-w-[160px] max-w-[600px] overflow-hidden"
        >
          {/* Left Header */}
          <div 
            style={{ height: `${HEAD_H}px` }} 
            className="flex items-center justify-between px-3 border-b-2 border-[var(--color-border)] bg-[var(--color-surface-2)] shrink-0"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-text-faint)]">
              <Layers size={13} className="opacity-60" /> Feature / Screen
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={expandAll}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] hover:text-[var(--color-primary-hex)] cursor-pointer"
                title="Expand All Screens"
              >
                Expand
              </button>
              <button
                onClick={collapseAll}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] hover:text-[var(--color-primary-hex)] cursor-pointer"
                title="Collapse All Screens"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Left Rows List */}
          <div 
            ref={leftScrollRef}
            onScroll={handleLeftScroll}
            className="flex-1 overflow-y-auto custom-scroll overflow-x-hidden"
          >
            {visibleRows.map((row, i) => {
              if (row.type === 'feature') {
                const f = row.feature;
                const mObj = row.mObj;
                const bc = getBarColor(mObj, row.featIdx);

                return (
                  <div
                    key={`left-${f.name}-${i}`}
                    style={{ height: `${ROW_H}px` }}
                    onClick={() => onSelectFeature(f)}
                    className={clsx(
                      "flex items-center pr-3 border-b border-[var(--color-divider)] cursor-pointer transition-colors group",
                      i % 2 === 1 ? "bg-black/[0.015] dark:bg-white/[0.01]" : "bg-transparent",
                      "hover:bg-[var(--color-surface-2)]"
                    )}
                  >
                    {/* Expand/Collapse Chevron */}
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

                    {/* Color stripe */}
                    <div 
                      className="w-[3px] h-full shrink-0 rounded-r mr-2 opacity-85"
                      style={{ backgroundColor: bc }}
                    />

                    {/* Info */}
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
                        <span className="font-mono font-bold" style={{ color: bc }}>
                          {mObj?.avgProg || 0}%
                        </span>
                        {mObj?.overdueTasks > 0 && (
                          <span className="text-rose-500 font-bold flex items-center gap-0.5">
                            <AlertTriangle size={9} /> Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Screen count badge */}
                    <div className="shrink-0 text-[9px] font-mono font-bold text-[var(--color-text-faint)] bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-md px-1.5 py-0.5 ml-1.5">
                      {f.screens?.length || 0} scr
                    </div>
                  </div>
                );
              } else {
                // Child Screen Row
                return (
                  <div
                    key={`left-sc-${row.screenName}-${i}`}
                    style={{ height: `${ROW_H}px` }}
                    onClick={() => onSelectFeature(row.feature)}
                    className="flex items-center pl-7 pr-3 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors relative"
                  >
                    {/* Tree connector glyph */}
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
        </div>

        {/* ── Column Resizer Splitter ── */}
        <div
          onPointerDown={handleSplitterDown}
          className={clsx(
            "w-1.5 cursor-col-resize shrink-0 transition-colors z-20 -ml-1",
            isResizing ? "bg-[var(--color-primary-hex)]" : "hover:bg-[var(--color-primary-hex)]/50 bg-transparent"
          )}
          title="Drag to resize panel"
        />

        {/* ── Right Column: Canvas Timeline Chart ── */}
        <div 
          ref={rightScrollRef}
          onScroll={handleRightScroll}
          className="flex-1 overflow-auto custom-scroll relative bg-[var(--color-bg)]"
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={handleCanvasClick}
            className="cursor-pointer block"
            aria-label="Interactive Feature Gantt Timeline"
          />
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
                {hoveredRow.hit.row.type === 'feature' ? 'FEATURE' : 'SCREEN'}
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

              {hoveredRow.hit.actDoneDate && (
                <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <CheckCircle2 size={13} />
                  <span>Actual Done: {fmtDate(hoveredRow.hit.actDoneDate.toISOString().slice(0, 10))}</span>
                </div>
              )}

              {hoveredRow.hit.mcP90Date && (
                <div className="flex items-center gap-1.5 text-purple-500 font-semibold">
                  <Cpu size={13} />
                  <span>Monte Carlo P90: {fmtDate(hoveredRow.hit.mcP90Date.toISOString().slice(0, 10))}</span>
                </div>
              )}

              {hoveredRow.hit.row.feature.dependsOn && (
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                  <GitFork size={13} />
                  <span>Depends on: {Array.isArray(hoveredRow.hit.row.feature.dependsOn) ? hoveredRow.hit.row.feature.dependsOn.join(', ') : hoveredRow.hit.row.feature.dependsOn}</span>
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
                  className="h-full bg-[var(--color-primary-hex)] rounded-full transition-all" 
                  style={{ 
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

export default FeatureTimelineChart;
