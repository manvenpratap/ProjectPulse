import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  GanttChart as GanttIcon, 
  ZoomIn, 
  ZoomOut, 
  CalendarDays, 
  GitFork, 
  CalendarCheck2, 
  Cpu, 
  Layers, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Flag, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  User,
  ArrowUpDown,
  Filter,
  Plus
} from 'lucide-react';
import { fmtDate, daysDiff, isBlocked } from '../../utils/projectUtils';
import { Task, TaskStatus, Release } from '../../types';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import TaskModal from '../tasks/TaskModal';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

type ZoomMode = 'day' | 'week' | 'month';
type SortMode = 'date' | 'name-asc' | 'name-desc';
type ViewMode = 'swimlane' | 'flat';

interface MonteCarloTaskResult {
  p10: Date;
  p50: Date;
  p90: Date;
}

interface HitArea {
  task: Task;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface TimelineViewProps {
  embedded?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ embedded = false }) => {
  const { state } = useProject();

  // Control states
  const [zoom, setZoom] = useState<ZoomMode>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('swimlane');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [showDeps, setShowDeps] = useState(true);
  const [showActuals, setShowActuals] = useState(true);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());

  // Splitter state
  const [leftWidth, setLeftWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  // Interaction & modal states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<{ task: Task; x: number; y: number } | null>(null);

  // DOM Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const axisScrollRef = useRef<HTMLDivElement>(null);
  const axisCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightBodyScrollRef = useRef<HTMLDivElement>(null);
  const bodyCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftBodyScrollRef = useRef<HTMLDivElement>(null);
  const hitAreasRef = useRef<HitArea[]>([]);

  // Filter tasks with valid dates
  const filteredTasks = useMemo(() => {
    return state.tasks.filter(t => {
      if (!t.startDate || !t.dueDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesAssignee = t.assignee?.toLowerCase().includes(q);
        const matchesModule = t.module?.toLowerCase().includes(q) || t.moduleType?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesAssignee && !matchesModule) return false;
      }
      if (onlyCritical) {
        const blocked = isBlocked(t, state.tasks);
        const overdue = (daysDiff(t.dueDate) ?? 0) < 0 && t.status !== TaskStatus.COMPLETED;
        if (!blocked && !overdue && t.priority !== 'Critical') return false;
      }
      return true;
    });
  }, [state.tasks, searchQuery, onlyCritical]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    if (sortMode === 'name-asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'name-desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    }
    return list;
  }, [filteredTasks, sortMode]);

  // Group tasks into swimlanes
  const swimlanes = useMemo(() => {
    const map = new Map<string, Task[]>();
    sortedTasks.forEach(t => {
      const key = t.moduleType || t.module || 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'General') return 1;
      if (b[0] === 'General') return -1;
      return a[0].localeCompare(b[0]);
    });
  }, [sortedTasks]);

  // Monte Carlo simulation
  const mcResults = useMemo(() => {
    if (!showMonteCarlo || sortedTasks.length === 0) return null;

    const iterations = 100;
    const memberVelocities: Record<string, number> = {};
    
    (state.members || []).forEach(m => {
      const completed = state.tasks.filter(t => t.assignee === m.name && t.status === TaskStatus.COMPLETED);
      if (!completed.length) {
        memberVelocities[m.name] = 1.0;
      } else {
        let totalEst = 0;
        let totalAct = 0;
        completed.forEach(t => {
          totalEst += parseFloat(t.estDays as any) || 8;
          totalAct += parseFloat(t.actDays as any) || parseFloat(t.estDays as any) || 8;
        });
        memberVelocities[m.name] = totalEst > 0 ? (totalAct / totalEst) : 1.0;
      }
    });

    const perTask: Record<string, MonteCarloTaskResult> = {};
    sortedTasks.forEach(t => {
      const startMs = new Date(t.startDate + 'T00:00:00').getTime();
      const dueMs = new Date(t.dueDate + 'T00:00:00').getTime();
      const plannedDays = Math.max(1, (dueMs - startMs) / 864e5);
      const baseVel = memberVelocities[t.assignee] || 1.0;
      const simEndDates: Date[] = [];

      for (let i = 0; i < iterations; i++) {
        const r = 0.75 + Math.random() * 0.55;
        const simDays = plannedDays * baseVel * r;
        simEndDates.push(new Date(startMs + simDays * 864e5));
      }
      simEndDates.sort((a, b) => a.getTime() - b.getTime());

      perTask[t.id] = {
        p10: simEndDates[Math.floor(iterations * 0.10)],
        p50: simEndDates[Math.floor(iterations * 0.50)],
        p90: simEndDates[Math.floor(iterations * 0.90)],
      };
    });

    const allP10 = Object.values(perTask).map(r => r.p10.getTime());
    const allP50 = Object.values(perTask).map(r => r.p50.getTime());
    const allP90 = Object.values(perTask).map(r => r.p90.getTime());

    return {
      perTask,
      summary: {
        p10: new Date(allP10.length ? Math.max(...allP10) : Date.now()),
        p50: new Date(allP50.length ? Math.max(...allP50) : Date.now()),
        p90: new Date(allP90.length ? Math.max(...allP90) : Date.now()),
      }
    };
  }, [showMonteCarlo, sortedTasks, state.members, state.tasks]);

  // Compute overall timeline date boundaries
  const dateBounds = useMemo(() => {
    if (sortedTasks.length === 0) {
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth(), 1);
      const max = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      return { minDate: min, maxDate: max, totalDays: 60 };
    }

    const allDates = sortedTasks.flatMap(t => [
      new Date(t.startDate + 'T00:00:00'),
      new Date(t.dueDate + 'T00:00:00'),
      ...(showActuals && t.actCompletionDate ? [new Date(t.actCompletionDate + 'T00:00:00')] : [])
    ]);

    (state.releases || []).forEach((r: Release) => {
      if (r.date) allDates.push(new Date(r.date + 'T00:00:00'));
      if (r.startDate) allDates.push(new Date(r.startDate + 'T00:00:00'));
    });

    allDates.push(new Date());

    let minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    let maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    minDate.setDate(minDate.getDate() - 4);
    maxDate.setDate(maxDate.getDate() + 10);
    minDate.setHours(0, 0, 0, 0);
    maxDate.setHours(0, 0, 0, 0);

    if (zoom === 'week') {
      const dow = minDate.getDay();
      minDate.setDate(minDate.getDate() - (dow === 0 ? 6 : dow - 1));
      const dowE = maxDate.getDay();
      maxDate.setDate(maxDate.getDate() + (dowE === 0 ? 0 : 7 - dowE));
    } else if (zoom === 'month') {
      minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    }

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / 864e5) + 1;
    return { minDate, maxDate, totalDays };
  }, [sortedTasks, state.releases, zoom, showActuals]);

  // Geometric constants
  const dayW = zoom === 'day' ? 28 : zoom === 'week' ? 14 : 5;
  const ROW_H = 36;
  const HEAD_H = 46;
  const LANE_HEAD_H = 34;
  const PAD_L = 12;
  const BAR_H = 18;
  const canvasW = dateBounds.totalDays * dayW + PAD_L * 2;

  const dateToX = useCallback((dStr: string) => {
    if (!dStr) return PAD_L;
    const rd = new Date(dStr.includes('T') ? dStr : dStr + 'T00:00:00');
    rd.setHours(0, 0, 0, 0);
    const diff = Math.floor((rd.getTime() - dateBounds.minDate.getTime()) / 864e5);
    return PAD_L + Math.max(0, diff) * dayW;
  }, [dateBounds.minDate, dayW]);

  // Calculate total canvas height
  const totalCanvasH = useMemo(() => {
    if (viewMode === 'flat') {
      return Math.max(400, sortedTasks.length * ROW_H + 20);
    }
    let h = 0;
    swimlanes.forEach(([laneKey, items]) => {
      h += LANE_HEAD_H;
      if (!collapsedLanes.has(laneKey)) {
        h += items.length * ROW_H;
      }
    });
    return Math.max(400, h + 20);
  }, [viewMode, sortedTasks.length, swimlanes, collapsedLanes]);

  // Color mapper helper
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED: return "#10b981";
      case TaskStatus.IN_PROGRESS: return "#3b82f6";
      case TaskStatus.ON_HOLD: return "#f59e0b";
      case TaskStatus.UNDER_REVIEW: return "#8b5cf6";
      case TaskStatus.CANCELLED: return "#ef4444";
      default: return "#94a3b8";
    }
  };

  const getReleaseColor = (status: string) => {
    switch (status) {
      case 'Released': return "#10b981";
      case 'Active': return "#3b82f6";
      default: return "#f59e0b";
    }
  };

  // Toggle lane collapse
  const toggleLane = (laneKey: string) => {
    setCollapsedLanes(prev => {
      const next = new Set(prev);
      if (next.has(laneKey)) next.delete(laneKey);
      else next.add(laneKey);
      return next;
    });
  };

  // Splitter resizer listeners
  const startResizing = (e: React.PointerEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;
    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newW = Math.max(180, Math.min(480, e.clientX - rect.left));
      setLeftWidth(newW);
    };
    const handlePointerUp = () => setIsResizing(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isResizing]);

  // Synchronized scrolling handlers
  const handleRightScroll = () => {
    if (rightBodyScrollRef.current) {
      if (axisScrollRef.current) {
        axisScrollRef.current.scrollLeft = rightBodyScrollRef.current.scrollLeft;
      }
      if (leftBodyScrollRef.current) {
        leftBodyScrollRef.current.scrollTop = rightBodyScrollRef.current.scrollTop;
      }
    }
  };

  const handleLeftScroll = () => {
    if (leftBodyScrollRef.current && rightBodyScrollRef.current) {
      rightBodyScrollRef.current.scrollTop = leftBodyScrollRef.current.scrollTop;
    }
  };

  // Quick jump to Today
  const jumpToToday = () => {
    const todayX = dateToX(new Date().toISOString().slice(0, 10));
    if (rightBodyScrollRef.current) {
      rightBodyScrollRef.current.scrollTo({
        left: Math.max(0, todayX - 250),
        behavior: 'smooth'
      });
    }
  };

  // ── DRAW STICKY AXIS CANVAS ──
  useEffect(() => {
    const cvs = axisCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = canvasW * dpr;
    cvs.height = HEAD_H * dpr;
    cvs.style.width = `${canvasW}px`;
    cvs.style.height = `${HEAD_H}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
    ctx.fillRect(0, 0, canvasW, HEAD_H);

    // Bottom border
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEAD_H - 0.5);
    ctx.lineTo(canvasW, HEAD_H - 0.5);
    ctx.stroke();

    // Days & Ticks
    for (let d = 0; d < dateBounds.totalDays; d++) {
      const dt = new Date(dateBounds.minDate.getTime() + d * 864e5);
      const x = PAD_L + d * dayW;

      // Vertical tick lines
      if (dt.getDay() === 1 || zoom === 'day') {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEAD_H);
        ctx.stroke();
      }

      // Weekend subtle shading in header
      if (dt.getDay() === 0 || dt.getDay() === 6) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.05)";
        ctx.fillRect(x, 0, dayW, HEAD_H);
      }

      // Date labels
      if (zoom === 'day') {
        ctx.fillStyle = "#64748b";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(dt.getDate()), x + dayW / 2, HEAD_H - 6);

        if (dt.getDate() === 1 || d === 0) {
          ctx.fillStyle = "#0f172a";
          ctx.font = "bold 9px Inter, sans-serif";
          ctx.fillText(dt.toLocaleDateString('en-GB', { month: 'short' }), x + dayW / 2, HEAD_H - 22);
        }
      } else if (zoom === 'week' && dt.getDay() === 1) {
        ctx.fillStyle = "#64748b";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), x + 2, HEAD_H - 6);
      } else if (zoom === 'month' && dt.getDate() === 1) {
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(dt.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), x + 2, HEAD_H - 6);
      }
    }

    // Today indicator marker in axis
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= dateBounds.minDate && today <= dateBounds.maxDate) {
      const tx = dateToX(today.toISOString().slice(0, 10));
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, HEAD_H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 8px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("TODAY", tx + 3, HEAD_H - 24);
    }

    // Release Milestone Headers
    (state.releases || []).forEach((rel: Release) => {
      const relTasks = sortedTasks.filter(t => t.release === rel.name);
      let rDate = rel.date ? new Date(rel.date + 'T00:00:00') : null;
      if (!rDate && relTasks.length > 0) {
        const dueTimes = relTasks.map(t => new Date(t.dueDate + 'T00:00:00').getTime());
        rDate = new Date(Math.max(...dueTimes));
      }
      if (!rDate) return;
      rDate.setHours(0, 0, 0, 0);
      if (rDate < dateBounds.minDate || rDate > dateBounds.maxDate) return;

      const rx = dateToX(rDate.toISOString().slice(0, 10));
      const relColor = getReleaseColor(rel.status);

      ctx.strokeStyle = relColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, HEAD_H);
      ctx.stroke();

      const label = `${rel.name} (${rel.status})`;
      ctx.font = "bold 8.5px Inter, sans-serif";
      const lblW = ctx.measureText(label).width + 10;
      const lblX = Math.min(rx + 2, canvasW - lblW - 4);
      
      ctx.fillStyle = relColor;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.roundRect(lblX, 3, lblW, 14, 3);
      ctx.fill();

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = relColor;
      ctx.textAlign = "left";
      ctx.fillText(label, lblX + 5, 13);
    });

  }, [canvasW, HEAD_H, dateBounds, zoom, dayW, dateToX, state.releases, sortedTasks]);

  // ── DRAW MAIN GANTT CANVAS (TRACKS, BARS, DEPS, ACTUALS) ──
  useEffect(() => {
    const cvs = bodyCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = canvasW * dpr;
    cvs.height = totalCanvasH * dpr;
    cvs.style.width = `${canvasW}px`;
    cvs.style.height = `${totalCanvasH}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, canvasW, totalCanvasH);

    // Reset hit areas
    const newHitAreas: HitArea[] = [];
    const taskPositions: Record<string, { x1: number; x2: number; y: number }> = {};

    // 1. Grid Lines & Weekend Backgrounds
    for (let d = 0; d < dateBounds.totalDays; d++) {
      const dt = new Date(dateBounds.minDate.getTime() + d * 864e5);
      const x = PAD_L + d * dayW;

      if (dt.getDay() === 1 || zoom === 'day') {
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, totalCanvasH);
        ctx.stroke();
      }

      if (dt.getDay() === 0 || dt.getDay() === 6) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.03)";
        ctx.fillRect(x, 0, dayW, totalCanvasH);
      }
    }

    // 2. Today Line Marker
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today >= dateBounds.minDate && today <= dateBounds.maxDate) {
      const tx = dateToX(today.toISOString().slice(0, 10));
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, totalCanvasH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Release Milestones Vertical Markers
    (state.releases || []).forEach((rel: Release) => {
      let rDate = rel.date ? new Date(rel.date + 'T00:00:00') : null;
      if (!rDate) {
        const relTasks = sortedTasks.filter(t => t.release === rel.name);
        if (relTasks.length > 0) {
          const dueTimes = relTasks.map(t => new Date(t.dueDate + 'T00:00:00').getTime());
          rDate = new Date(Math.max(...dueTimes));
        }
      }
      if (!rDate) return;
      rDate.setHours(0, 0, 0, 0);
      if (rDate < dateBounds.minDate || rDate > dateBounds.maxDate) return;

      const rx = dateToX(rDate.toISOString().slice(0, 10));
      const relColor = getReleaseColor(rel.status);

      ctx.save();
      ctx.strokeStyle = relColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, totalCanvasH);
      ctx.stroke();
      ctx.restore();
    });

    // 4. Render Task Rows & Bars
    let currentY = 0;

    const renderTaskBar = (task: Task, y: number, isRowEven: boolean) => {
      // Row horizontal divider
      ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + ROW_H - 0.5);
      ctx.lineTo(canvasW, y + ROW_H - 0.5);
      ctx.stroke();

      // Zebra striping
      if (isRowEven) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.02)";
        ctx.fillRect(0, y, canvasW, ROW_H);
      }

      const x1 = dateToX(task.startDate);
      const x2 = dateToX(task.dueDate) + dayW;
      const bw = Math.max(x2 - x1, dayW);
      const barY = y + (ROW_H - BAR_H) / 2;
      const centerY = barY + BAR_H / 2;

      // Save position for dependency arrows
      taskPositions[task.id] = { x1, x2: x1 + bw, y: centerY };

      // Register hit area
      newHitAreas.push({
        task,
        x1,
        x2: x1 + bw,
        y1: y,
        y2: y + ROW_H
      });

      const blocked = isBlocked(task, state.tasks);
      const statusColor = getStatusColor(task.status);
      const isMilestone = (task.startDate && task.startDate === task.dueDate) || task.category === 'Milestone';

      // Monte Carlo Simulation Band
      if (showMonteCarlo && mcResults && mcResults.perTask[task.id]) {
        const mc = mcResults.perTask[task.id];
        const p10X = dateToX(mc.p10.toISOString().slice(0, 10));
        const p90X = dateToX(mc.p90.toISOString().slice(0, 10)) + dayW;

        ctx.fillStyle = "rgba(139, 92, 246, 0.14)";
        ctx.beginPath();
        ctx.roundRect(p10X, barY - 2, Math.max(6, p90X - p10X), BAR_H + 4, 4);
        ctx.fill();

        ctx.strokeStyle = "#8b5cf6";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(p90X, barY - 4);
        ctx.lineTo(p90X, barY + BAR_H + 4);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (isMilestone) {
        // Milestone Diamond Flag
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.moveTo(x1, centerY);
        ctx.lineTo(x1 + BAR_H / 2, barY);
        ctx.lineTo(x1 + BAR_H, centerY);
        ctx.lineTo(x1 + BAR_H / 2, barY + BAR_H);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Normal Task Bar Background
        ctx.globalAlpha = blocked ? 0.15 : 0.22;
        ctx.fillStyle = blocked ? "#f59e0b" : statusColor;
        ctx.beginPath();
        ctx.roundRect(x1, barY, bw, BAR_H, 4);
        ctx.fill();

        // Progress Bar
        const progressPct = Math.min(100, Math.max(0, task.progress || 0));
        const pw = bw * (progressPct / 100);
        ctx.globalAlpha = blocked ? 0.35 : 0.85;
        ctx.fillStyle = blocked ? "#f59e0b" : statusColor;
        ctx.beginPath();
        ctx.roundRect(x1, barY, Math.max(pw, 0), BAR_H, 4);
        ctx.fill();

        // Border
        ctx.globalAlpha = 1;
        ctx.strokeStyle = blocked ? "#f59e0b" : statusColor;
        ctx.lineWidth = 1;
        if (blocked) ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.roundRect(x1, barY, bw, BAR_H, 4);
        ctx.stroke();
        ctx.setLineDash([]);

        // Progress label on bar
        if (bw > 34) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 8.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`${progressPct}%`, x1 + (pw > 20 ? pw / 2 : bw / 2), centerY + 3);
        }
      }

      // Actual Completion Tracking
      if (showActuals && task.actCompletionDate) {
        const actX = dateToX(task.actCompletionDate) + dayW / 2;

        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x1 + bw, centerY);
        ctx.lineTo(actX, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Green completion dot
        ctx.fillStyle = "#10b981";
        ctx.beginPath();
        ctx.arc(actX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    if (viewMode === 'flat') {
      sortedTasks.forEach((t, i) => {
        renderTaskBar(t, currentY, i % 2 === 1);
        currentY += ROW_H;
      });
    } else {
      swimlanes.forEach(([laneKey, items]) => {
        // Lane Header background in canvas
        ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
        ctx.fillRect(0, currentY, canvasW, LANE_HEAD_H);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, currentY + LANE_HEAD_H - 0.5);
        ctx.lineTo(canvasW, currentY + LANE_HEAD_H - 0.5);
        ctx.stroke();

        currentY += LANE_HEAD_H;

        if (!collapsedLanes.has(laneKey)) {
          items.forEach((t, i) => {
            renderTaskBar(t, currentY, i % 2 === 1);
            currentY += ROW_H;
          });
        }
      });
    }

    // 5. Draw Dependency Connectors (Stepped Bezier / Orthogonal Arrows)
    if (showDeps) {
      sortedTasks.forEach(t => {
        const deps = t.dependsOn || [];
        deps.forEach(depId => {
          const from = taskPositions[depId];
          const to = taskPositions[t.id];
          if (!from || !to || from === to) return;

          const startX = from.x2;
          const startY = from.y;
          const endX = to.x1;
          const endY = to.y;

          ctx.save();
          ctx.strokeStyle = "#f59e0b";
          ctx.fillStyle = "#f59e0b";
          ctx.lineWidth = 1.8;
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
            const offsetRight = startX + 12;
            const offsetLeft = endX - 12;
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

          // Directional Arrowhead
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - 6, endY - 4);
          ctx.lineTo(endX - 6, endY + 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      });
    }

    hitAreasRef.current = newHitAreas;

  }, [
    canvasW, 
    totalCanvasH, 
    dateBounds, 
    zoom, 
    dayW, 
    dateToX, 
    viewMode, 
    sortedTasks, 
    swimlanes, 
    collapsedLanes, 
    showDeps, 
    showActuals, 
    showMonteCarlo, 
    mcResults, 
    state.releases, 
    state.tasks
  ]);

  // Handle canvas mouse move for interactive tooltips
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = bodyCanvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hit = hitAreasRef.current.find(h => 
      mouseX >= h.x1 && mouseX <= h.x2 && mouseY >= h.y1 && mouseY <= h.y2
    );

    if (hit) {
      setHoveredTask({ task: hit.task, x: e.clientX, y: e.clientY });
    } else {
      setHoveredTask(null);
    }
  };

  // Handle canvas click to edit task
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = bodyCanvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hit = hitAreasRef.current.find(h => 
      mouseX >= h.x1 && mouseX <= h.x2 && mouseY >= h.y1 && mouseY <= h.y2
    );

    if (hit) {
      setSelectedTaskId(hit.task.id);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]" ref={containerRef}>
      {/* 1. Page Header (hidden when embedded in TaskView) */}
      {!embedded && (
        <PageHeader
          icon={GanttIcon}
          title="Project Timeline & Gantt"
          subtitle={`${filteredTasks.length} Scheduled Tasks • Swimlanes & Predictive Forecast`}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-divider)]">
                <button
                  onClick={() => setViewMode('swimlane')}
                  className={clsx(
                    "px-2.5 py-1.5 min-h-[36px] min-w-[36px] text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
                    viewMode === 'swimlane'
                      ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-primary-hex)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                  title="Group into Module Swimlanes"
                  aria-label="Group into Module Swimlanes"
                >
                  <Layers size={14} />
                  <span className="hidden sm:inline">Swimlanes</span>
                </button>
                <button
                  onClick={() => setViewMode('flat')}
                  className={clsx(
                    "px-2.5 py-1.5 min-h-[36px] min-w-[36px] text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
                    viewMode === 'flat'
                      ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-primary-hex)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                  title="Show flat chronological matrix"
                  aria-label="Show flat chronological matrix"
                >
                  <Filter size={14} />
                  <span className="hidden sm:inline">Flat</span>
                </button>
              </div>

              {/* Resolution Zoom Selector */}
              <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-divider)]">
                {(['day', 'week', 'month'] as const).map(z => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={clsx(
                      "px-2.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg transition-colors duration-150 capitalize cursor-pointer active:scale-95 flex items-center justify-center",
                      zoom === z 
                        ? "bg-[var(--color-surface)] shadow-sm text-[var(--color-primary-hex)]" 
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                    aria-label={`Zoom ${z}`}
                  >
                    {z}
                  </button>
                ))}
              </div>

              {/* Jump to Today Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={jumpToToday}
                className="text-xs font-semibold h-9 min-h-[36px] active:scale-95"
                title="Center timeline on today"
              >
                Today
              </Button>
            </div>
          }
          primaryAction={
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => { setSelectedTaskId(null); setIsModalOpen(true); }}
              className="text-xs font-bold h-9 min-h-[36px] active:scale-95 px-3.5 shadow-xs flex items-center gap-1.5"
              title="Create a new scheduled task"
            >
              <Plus size={14} />
              <span>New Task</span>
            </Button>
          }
        />
      )}

      {/* 2. Operational Filter Toolbar */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {embedded && (
            <>
              {/* Embedded View Mode Toggle */}
              <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-divider)]">
                <button
                  onClick={() => setViewMode('swimlane')}
                  className={clsx(
                    "px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
                    viewMode === 'swimlane'
                      ? "bg-[var(--color-surface)] shadow-xs text-[var(--color-primary-hex)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                  title="Group into Module Swimlanes"
                  aria-label="Group into Module Swimlanes"
                >
                  <Layers size={13} />
                  <span className="hidden md:inline">Swimlanes</span>
                </button>
                <button
                  onClick={() => setViewMode('flat')}
                  className={clsx(
                    "px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95",
                    viewMode === 'flat'
                      ? "bg-[var(--color-surface)] shadow-xs text-[var(--color-primary-hex)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                  title="Show flat chronological matrix"
                  aria-label="Show flat chronological matrix"
                >
                  <Filter size={13} />
                  <span className="hidden md:inline">Flat</span>
                </button>
              </div>

              {/* Embedded Resolution Zoom Selector */}
              <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-divider)]">
                {(['day', 'week', 'month'] as const).map(z => (
                  <button
                    key={z}
                    onClick={() => setZoom(z)}
                    className={clsx(
                      "px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-lg transition-colors duration-150 capitalize cursor-pointer active:scale-95 flex items-center justify-center",
                      zoom === z 
                        ? "bg-[var(--color-surface)] shadow-xs text-[var(--color-primary-hex)]" 
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    )}
                    aria-label={`Zoom ${z}`}
                  >
                    {z}
                  </button>
                ))}
              </div>

              {/* Embedded Jump to Today Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={jumpToToday}
                className="text-xs font-semibold h-8 min-h-[32px] px-2.5 active:scale-95"
                title="Center timeline on today"
              >
                Today
              </Button>
            </>
          )}

          <div className="relative min-w-[180px] max-w-[280px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input 
              type="text"
              placeholder="Search task, module, assignee..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary-hex)] transition-colors"
            />
          </div>
        </div>

        {/* Feature Switches */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Dependencies Switch */}
          <button
            onClick={() => setShowDeps(!showDeps)}
            className={clsx(
              "px-3 py-2 min-h-[36px] rounded-lg border flex items-center gap-1.5 font-semibold transition-colors duration-150 active:scale-95 cursor-pointer",
              showDeps 
                ? "bg-amber-500/10 border-amber-500/40 text-amber-500" 
                : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-muted)]"
            )}
            title="Toggle dependency connection lines"
            aria-label="Toggle dependency connection lines"
          >
            <GitFork size={13} />
            <span>Deps</span>
          </button>

          {/* Actuals Tracking Switch */}
          <button
            onClick={() => setShowActuals(!showActuals)}
            className={clsx(
              "px-3 py-2 min-h-[36px] rounded-lg border flex items-center gap-1.5 font-semibold transition-colors duration-150 active:scale-95 cursor-pointer",
              showActuals 
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-500" 
                : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-muted)]"
            )}
            title="Toggle baseline vs actual completion date markers"
            aria-label="Toggle baseline vs actual completion date markers"
          >
            <CalendarCheck2 size={13} />
            <span>Actuals</span>
          </button>

          {/* Monte Carlo Switch */}
          <button
            onClick={() => setShowMonteCarlo(!showMonteCarlo)}
            className={clsx(
              "px-3 py-2 min-h-[36px] rounded-lg border flex items-center gap-1.5 font-semibold transition-colors duration-150 active:scale-95 cursor-pointer",
              showMonteCarlo 
                ? "bg-purple-500/10 border-purple-500/40 text-purple-400" 
                : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-muted)]"
            )}
            title="Toggle Monte Carlo probabilistic forecast bands"
            aria-label="Toggle Monte Carlo probabilistic forecast bands"
          >
            <Cpu size={13} />
            <span>Forecast</span>
          </button>

          {/* Critical Path Filter */}
          <button
            onClick={() => setOnlyCritical(!onlyCritical)}
            className={clsx(
              "px-3 py-2 min-h-[36px] rounded-lg border flex items-center gap-1.5 font-semibold transition-colors duration-150 active:scale-95 cursor-pointer",
              onlyCritical 
                ? "bg-rose-500/10 border-rose-500/40 text-rose-400" 
                : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-muted)]"
            )}
            title="Filter by critical blockers and overdue items"
            aria-label="Filter by critical blockers and overdue items"
          >
            <AlertTriangle size={13} />
            <span>Critical Path</span>
          </button>

          <div className="w-[1px] h-5 bg-[var(--color-divider)] mx-1 hidden sm:block" />

          {/* Sort Selector */}
          <select 
            value={sortMode}
            onChange={e => setSortMode(e.target.value as SortMode)}
            className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)]"
          >
            <option value="date">Sort: Start Date</option>
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* 3. Monte Carlo Forecasting Banner (When active) */}
      {showMonteCarlo && mcResults && (
        <div className="px-4 sm:px-6 lg:px-8 py-3 bg-purple-500/5 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <Cpu size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-2">
                <span>Algorithmic Monte Carlo Delivery Forecast</span>
                <span className="text-[10px] font-mono font-normal text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded">
                  100 Passes
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                Dynamic simulation based on historical member velocities and task scope variances
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] border-l-2 border-l-blue-400 px-3 py-1.5 rounded-lg shadow-sm">
              <div className="text-[10px] text-[var(--color-text-muted)] font-bold">P10 (Aggressive)</div>
              <div className="font-mono font-bold text-[var(--color-text)] mt-0.5">{fmtDate(mcResults.summary.p10.toISOString().slice(0, 10))}</div>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] border-l-2 border-l-amber-400 px-3 py-1.5 rounded-lg shadow-sm">
              <div className="text-[10px] text-[var(--color-text-muted)] font-bold">P50 (Likely)</div>
              <div className="font-mono font-bold text-[var(--color-text)] mt-0.5">{fmtDate(mcResults.summary.p50.toISOString().slice(0, 10))}</div>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] border-l-2 border-l-purple-400 px-3 py-1.5 rounded-lg shadow-sm">
              <div className="text-[10px] text-purple-400 font-bold">P90 (Conservative)</div>
              <div className="font-mono font-bold text-purple-400 mt-0.5">{fmtDate(mcResults.summary.p90.toISOString().slice(0, 10))}</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Split-Screen Main Gantt Area */}
      {filteredTasks.length > 0 ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Top Sticky Header Row (Left Title & Right Date Axis) */}
          <div className="flex h-[46px] border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] shrink-0 select-none">
            {/* Left Header */}
            <div 
              style={{ width: `${leftWidth}px` }} 
              className="px-4 flex items-center justify-between border-r border-[var(--color-divider)] shrink-0 font-bold text-xs text-[var(--color-text)]"
            >
              <span>Task Hierarchy</span>
              <span className="text-[10px] font-mono font-semibold text-[var(--color-text-muted)]">
                {filteredTasks.length} items
              </span>
            </div>

            {/* Splitter Top Anchor */}
            <div className="w-[5px] shrink-0 bg-[var(--color-divider)]/40 cursor-col-resize" />

            {/* Right Sticky Date Axis Canvas Container */}
            <div 
              ref={axisScrollRef}
              className="flex-1 overflow-x-hidden overflow-y-hidden"
            >
              <canvas ref={axisCanvasRef} aria-hidden="true" />
            </div>
          </div>

          {/* Main Body Split (Left Task Rows + Right Canvas Tracks) */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Left Column: Task Rows & Swimlane Headers */}
            <div 
              ref={leftBodyScrollRef}
              onScroll={handleLeftScroll}
              style={{ width: `${leftWidth}px` }}
              className="h-full overflow-y-auto overflow-x-hidden border-r border-[var(--color-divider)] bg-[var(--color-surface)] shrink-0 custom-scroll select-none"
            >
              {viewMode === 'flat' ? (
                <div>
                  {sortedTasks.map(t => {
                    const blocked = isBlocked(t, state.tasks);
                    const overdue = (daysDiff(t.dueDate) ?? 0) < 0 && t.status !== TaskStatus.COMPLETED;
                    return (
                      <div
                        key={t.id}
                        onClick={() => { setSelectedTaskId(t.id); setIsModalOpen(true); }}
                        className="h-[36px] px-3 border-b border-[var(--color-divider)] flex items-center gap-2 text-xs hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors"
                      >
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: getStatusColor(t.status) }} 
                        />
                        <span className="font-mono text-[10px] text-[var(--color-primary-hex)] font-bold shrink-0">
                          {t.id}
                        </span>
                        <span className="truncate font-semibold text-[var(--color-text)] flex-1" title={t.name}>
                          {t.name}
                        </span>
                        {blocked && (
                          <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded shrink-0">
                            LOCKED
                          </span>
                        )}
                        {overdue && (
                          <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded shrink-0">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {swimlanes.map(([laneKey, items]) => {
                    const isCollapsed = collapsedLanes.has(laneKey);
                    const completedCount = items.filter(t => t.status === TaskStatus.COMPLETED).length;
                    const avgProgress = Math.round(items.reduce((acc, t) => acc + (t.progress || 0), 0) / items.length);

                    return (
                      <div key={laneKey}>
                        {/* Swimlane Header */}
                        <div
                          onClick={() => toggleLane(laneKey)}
                          className="h-[34px] px-3 bg-[var(--color-surface-2)] border-b border-[var(--color-divider)] flex items-center justify-between cursor-pointer hover:bg-[var(--color-primary-highlight-hex)] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                            <span className="text-xs font-bold text-[var(--color-text)] truncate">
                              {laneKey}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-surface)] border border-[var(--color-divider)] font-semibold text-[var(--color-text-muted)]">
                              {completedCount}/{items.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-[var(--color-text-muted)]">
                              {avgProgress}%
                            </span>
                          </div>
                        </div>

                        {/* Swimlane Task Items */}
                        {!isCollapsed && items.map(t => {
                          const blocked = isBlocked(t, state.tasks);
                          const overdue = (daysDiff(t.dueDate) ?? 0) < 0 && t.status !== TaskStatus.COMPLETED;
                          return (
                            <div
                              key={t.id}
                              onClick={() => { setSelectedTaskId(t.id); setIsModalOpen(true); }}
                              className="h-[36px] pl-6 pr-3 border-b border-[var(--color-divider)] flex items-center gap-2 text-xs hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors"
                            >
                              <span 
                                className="w-2 h-2 rounded-full shrink-0" 
                                style={{ backgroundColor: getStatusColor(t.status) }} 
                              />
                              <span className="font-mono text-[10px] text-[var(--color-primary-hex)] font-bold shrink-0">
                                {t.id}
                              </span>
                              <span className="truncate font-medium text-[var(--color-text)] flex-1" title={t.name}>
                                {t.name}
                              </span>
                              {blocked && (
                                <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded shrink-0">
                                  LOCK
                                </span>
                              )}
                              {overdue && (
                                <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded shrink-0">
                                  LATE
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resizable Splitter Handle */}
            <div
              onPointerDown={startResizing}
              className={clsx(
                "w-[5px] shrink-0 bg-[var(--color-divider)] hover:bg-[var(--color-primary-hex)] cursor-col-resize transition-colors duration-150 relative z-10",
                isResizing && "bg-[var(--color-primary-hex)]"
              )}
              title="Drag to resize panels"
            />

            {/* Right Column: Interactive Canvas Tracks */}
            <div 
              ref={rightBodyScrollRef}
              onScroll={handleRightScroll}
              className="flex-1 h-full overflow-auto custom-scroll relative bg-[var(--color-surface)]"
            >
              <canvas 
                ref={bodyCanvasRef} 
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setHoveredTask(null)}
                onClick={handleCanvasClick}
                className="cursor-pointer"
                aria-label="Interactive project Gantt timeline chart"
                role="img"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
          <div className="w-16 h-16 bg-[var(--color-surface-2)] rounded-2xl flex items-center justify-center mb-4 text-[var(--color-text-faint)]">
            <CalendarDays size={32} />
          </div>
          <h3 className="text-base font-display font-bold text-[var(--color-text)]">No matching scheduled tasks</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or adding Start and Due dates to tasks.
          </p>
          {(searchQuery || onlyCritical) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => { setSearchQuery(''); setOnlyCritical(false); }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      )}

      {/* 5. Rich Hover Tooltip */}
      <AnimatePresence>
        {hoveredTask && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="fixed z-50 pointer-events-none bg-[var(--color-surface)]/92 backdrop-blur-2xl border border-[var(--color-divider)] rounded-2xl shadow-xl p-3.5 max-w-xs text-xs space-y-2 hidden md:block"
            style={{
              left: Math.min(hoveredTask.x + 14, window.innerWidth - 300),
              top: Math.min(hoveredTask.y + 14, window.innerHeight - 200)
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-1.5">
              <span className="font-mono text-[10px] font-bold text-[var(--color-primary-hex)]">
                {hoveredTask.task.id}
              </span>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: getStatusColor(hoveredTask.task.status) }}
              >
                {hoveredTask.task.status}
              </span>
            </div>

            <div className="font-bold text-sm text-[var(--color-text)] leading-snug">
              {hoveredTask.task.name}
            </div>

            <div className="space-y-1 text-[11px] text-[var(--color-text-muted)]">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-[var(--color-text-faint)]" />
                <span>{fmtDate(hoveredTask.task.startDate)} → {fmtDate(hoveredTask.task.dueDate)}</span>
              </div>
              {hoveredTask.task.assignee && (
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-[var(--color-text-faint)]" />
                  <span>Lead: {hoveredTask.task.assignee}</span>
                </div>
              )}
              {hoveredTask.task.moduleType && (
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-[var(--color-text-faint)]" />
                  <span>Track: {hoveredTask.task.moduleType}</span>
                </div>
              )}
              {hoveredTask.task.dependsOn && hoveredTask.task.dependsOn.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                  <GitFork size={13} />
                  <span>Depends on: {hoveredTask.task.dependsOn.join(', ')}</span>
                </div>
              )}
              {hoveredTask.task.actCompletionDate && (
                <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <CheckCircle2 size={13} />
                  <span>Completed: {fmtDate(hoveredTask.task.actCompletionDate)}</span>
                </div>
              )}
            </div>

            <div className="pt-1.5 border-t border-[var(--color-divider)]">
              <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)] mb-1">
                <span>Progress</span>
                <span className="font-bold text-[var(--color-text)]">{hoveredTask.task.progress || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary-hex)] rounded-full" 
                  style={{ width: `${hoveredTask.task.progress || 0}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Task Modal for Direct Editing */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTaskId(null); }}
        taskId={selectedTaskId}
      />
    </div>
  );
};

export default TimelineView;
