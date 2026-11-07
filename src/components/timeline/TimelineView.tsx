import React, { useRef, useEffect, useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { GanttChart as GanttIcon, ZoomIn, ZoomOut, Maximize, CalendarDays, Info } from 'lucide-react';
import { fmtDate, daysDiff, isBlocked } from '../../utils/projectUtils';
import { TaskStatus } from '../../types';
import Button from '../shared/Button';
import clsx from 'clsx';

const TimelineView: React.FC = () => {
  const { state, setView } = useProject();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week');

  const tasksWithDates = state.tasks
    .filter(t => t.startDate && t.dueDate)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Drawing Constants
    const ROW_H = 32;
    const HEAD_H = 48;
    const PAD_L = 4;
    const BAR_H = 16;
    const LEFT_PANEL_W = 200;
    const dpr = window.devicePixelRatio || 1;
    const dayW = zoom === 'day' ? 28 : zoom === 'week' ? 12 : 4;

    const tasks = tasksWithDates;
    if (tasks.length === 0) return;

    const allDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.dueDate)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 7);

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const W = LEFT_PANEL_W + totalDays * dayW + PAD_L * 2;
    const H = HEAD_H + tasks.length * ROW_H;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);

    // Helpers
    const getXAtDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const diff = Math.floor((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      return LEFT_PANEL_W + PAD_L + diff * dayW;
    };

    const getStatusColor = (status: TaskStatus) => {
      switch (status) {
        case TaskStatus.COMPLETED: return "#10b981";
        case TaskStatus.IN_PROGRESS: return "#3b82f6";
        case TaskStatus.ON_HOLD: return "#f59e0b";
        default: return "#94a3b8";
      }
    };

    // Draw Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // Draw Header
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, HEAD_H);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEAD_H);
    ctx.lineTo(W, HEAD_H);
    ctx.stroke();

    // Draw Left Panel Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, LEFT_PANEL_W, H);
    ctx.beginPath();
    ctx.moveTo(LEFT_PANEL_W, 0);
    ctx.lineTo(LEFT_PANEL_W, H);
    ctx.stroke();

    // Draw Grid Lines and Labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillStyle = "#64748b";

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(minDate.getTime() + i * 1000 * 60 * 60 * 24);
      const x = LEFT_PANEL_W + PAD_L + i * dayW;
      
      // Vertical line
      if (d.getDay() === 1 || zoom === 'day') {
        ctx.strokeStyle = "#eff6ff";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Weekend Highlight
      if (d.getDay() === 0 || d.getDay() === 6) {
        ctx.fillStyle = "rgba(0,0,0,0.02)";
        ctx.fillRect(x, 0, dayW, H);
      }

      // Label
      if (zoom === 'day') {
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(d.getDate().toString(), x + dayW / 2, HEAD_H / 2 + 10);
      } else if (zoom === 'week' && d.getDay() === 1) {
        ctx.fillStyle = "#64748b";
        ctx.fillText(`${d.getDate()} ${d.toLocaleDateString(undefined, {month:'short'})}`, x + dayW/2, HEAD_H / 2);
      }
    }

    // Today Marker
    const today = new Date();
    today.setHours(0,0,0,0);
    if (today >= minDate && today <= maxDate) {
      const tx = getXAtDate(today.toISOString().split('T')[0]);
      ctx.strokeStyle = "#ef4444";
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Tasks
    tasks.forEach((t, i) => {
      const y = HEAD_H + i * ROW_H;
      const centerY = y + ROW_H / 2;
      const blocked = isBlocked(t, state.tasks);
      
      // Left Panel Task Info
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = blocked ? "#94a3b8" : "#334155";
      ctx.fillText(t.name, 12, centerY);
      ctx.font = '9px monospace';
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(t.id, 160, centerY);

      if (blocked) {
        ctx.fillStyle = "#f59e0b";
        ctx.fillText("LOCKED", 160, centerY + 10);
      }

      // Row Separator
      ctx.strokeStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.moveTo(0, y + ROW_H);
      ctx.lineTo(W, y + ROW_H);
      ctx.stroke();

      // Bar
      const startX = getXAtDate(t.startDate);
      const endX = getXAtDate(t.dueDate) + dayW;
      const bw = Math.max(endX - startX, dayW);
      const barY = y + (ROW_H - BAR_H) / 2;

      // Fill
      ctx.globalAlpha = blocked ? 0.1 : 0.2;
      ctx.fillStyle = blocked ? "#f59e0b" : getStatusColor(t.status);
      ctx.beginPath();
      ctx.roundRect(startX, barY, bw, BAR_H, 4);
      ctx.fill();

      if (blocked) {
        ctx.strokeStyle = "#f59e0b";
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Progress
      ctx.globalAlpha = blocked ? 0.3 : 1;
      const pw = (bw * (t.progress || 0)) / 100;
      ctx.beginPath();
      ctx.roundRect(startX, barY, Math.max(0, pw), BAR_H, 4);
      ctx.fill();

      // Progress Text
      if (bw > 30) {
        ctx.fillStyle = "#ffffff";
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.progress}%`, startX + (pw > 20 ? pw/2 : bw/2), barY + BAR_H/2 + 1);
      }
    });

  }, [tasksWithDates, zoom]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <div className="px-6 py-6 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <GanttIcon size={18} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">Project Timeline</h1>
            <p className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">
              {tasksWithDates.length} Scheduled Tasks • Critical Path Optimized
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--color-surface-2)] p-1 rounded-lg border border-[var(--color-divider)]">
            {(['day', 'week', 'month'] as const).map(z => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={clsx(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                  zoom === z ? "bg-white shadow-sm text-indigo-600" : "text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]"
                )}
              >
                {z}
              </button>
            ))}
          </div>
          <div className="w-[1px] h-6 bg-[var(--color-divider)] mx-2" />
          <Button variant="ghost" size="icon" title="Zoom In"><ZoomIn size={16} /></Button>
          <Button variant="ghost" size="icon" title="Zoom Out"><ZoomOut size={16} /></Button>
        </div>
      </div>

      <div className="px-6 py-3 bg-[var(--color-surface)] border-y border-[var(--color-divider)] flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-20 border border-blue-500"></div>
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 opacity-20 border border-emerald-500"></div>
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 opacity-20 border border-amber-500 border-dashed"></div>
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Blocked / Dependent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 opacity-20 border border-red-500"></div>
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Overdue</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scroll relative">
        {/* Mobile Timeline List */}
        <div className="lg:hidden p-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4 text-[10px] font-bold text-amber-700 flex items-center gap-2">
            <Info size={14} />
            Switch to desktop for the full interactive roadmap.
          </div>
          {tasksWithDates.map(t => {
            const blocked = isBlocked(t, state.tasks);
            const overdue = daysDiff(t.dueDate)! < 0 && t.status !== TaskStatus.COMPLETED;
            
            return (
              <div key={t.id} className="p-4 bg-white border border-[var(--color-divider)] rounded-2xl shadow-sm">
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-black text-indigo-600">{t.id}</span>
                    <span className={clsx(
                      "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                      t.status === TaskStatus.COMPLETED ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>{t.status}</span>
                 </div>
                 <h4 className="font-bold text-sm mb-3">{t.name}</h4>
                 <div className="flex items-center justify-between text-[10px] font-medium text-[var(--color-text-faint)] uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={12} />
                      {fmtDate(t.startDate)} - {fmtDate(t.dueDate)}
                    </div>
                    {blocked && <span className="text-amber-600 font-black">LOCKED</span>}
                    {overdue && <span className="text-red-500 font-black tracking-tighter">OVERDUE</span>}
                 </div>
              </div>
            );
          })}
          {tasksWithDates.length === 0 && (
             <div className="py-20 text-center opacity-40 italic text-sm">No scheduled tasks.</div>
          )}
        </div>

        {/* Desktop Canvas */}
        {tasksWithDates.length > 0 ? (
           <canvas ref={canvasRef} className="hidden lg:block" aria-label="Interactive project Gantt chart schedule" role="img" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-[var(--color-surface-2)] rounded-3xl flex items-center justify-center mb-6 text-[var(--color-text-faint)]">
               <CalendarDays size={40} />
            </div>
            <h3 className="text-xl font-display font-bold">Timeline is clear</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-xs mx-auto">
              Add Start and Due dates to your tasks to see them projected on the roadmap.
            </p>
            <Button variant="primary" className="mt-8" onClick={() => setView('tasks')}>Go to Tasks Matrix</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
