import { format, differenceInCalendarDays, addDays, isWeekend, parseISO } from 'date-fns';
import { Task, TaskStatus } from '../types';

export const nowISO = () => new Date().toISOString();
export const todayStr = () => new Date().toISOString().split('T')[0];

export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  try {
    const dt = parseISO(d);
    return isNaN(dt.getTime()) ? d : format(dt, 'dd MMM yyyy');
  } catch (e) {
    return d;
  }
};

export const daysDiff = (dateString: string | null | undefined): number | null => {
  if (!dateString) return null;
  const dt = parseISO(dateString);
  if (isNaN(dt.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(dt, now);
};

export const addBusDays = (date: string, days: number): string => {
  let d = parseISO(date);
  let effort = Math.max(1, Math.ceil(days));
  let added = 1;
  while (added < effort) {
    d = addDays(d, 1);
    if (!isWeekend(d)) added++;
  }
  return format(d, 'yyyy-MM-dd');
};

export const getNextBusDay = (date: string): string => {
  let d = parseISO(date);
  do {
    d = addDays(d, 1);
  } while (isWeekend(d));
  return format(d, 'yyyy-MM-dd');
};

export const getBusinessDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  let start = parseISO(startDate);
  let end = parseISO(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  let count = 0;
  let cur = new Date(start);
  while (cur <= end) {
    if (!isWeekend(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(0.1, count);
};

export const isBlocked = (task: Task, tasks: Task[]): boolean => {
  if (!task.dependsOn || !task.dependsOn.length) return false;
  return task.dependsOn.some(id => {
    const dep = tasks.find(x => x.id === id);
    return dep && dep.status !== TaskStatus.COMPLETED;
  });
};

export const isOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
    return false;
  }
  const diff = daysDiff(task.dueDate);
  return diff !== null && diff < 0;
};

export const getHealthScore = (tasks: Task[]): number => {
  if (!tasks || !tasks.length) return 100;
  const active = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);
  if (!active.length) return 100;

  const totalActive = active.length;
  const overdue = active.filter(t => {
    if (!t.dueDate) return false;
    const dd = daysDiff(t.dueDate);
    return dd !== null && dd < 0;
  }).length;
  
  // We need to pass tasks array to isBlocked
  const blocked = active.filter(t => isBlocked(t, tasks)).length;
  const onHold = active.filter(t => t.status === TaskStatus.ON_HOLD).length;

  let score = 100;
  if (overdue > 0) score -= (overdue / totalActive) * 50;
  if (blocked > 0) score -= (blocked / totalActive) * 30;
  if (onHold > 0) score -= (onHold / totalActive) * 20;

  return Math.max(0, Math.min(100, Math.round(score)));
};

export const esc = (s: string | number | null | undefined): string => {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

export const getTeamNames = (members: any[]): string[] => {
  return members.length ? members.filter(m => m.status === 'Active').map(m => m.name) : [];
};

export const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const getStartOfWeek = (d: Date): Date => {
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

export const saveBlob = (blob: Blob, filename: string): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const normalizeSkills = (skills: string[] | string | undefined | null): string[] => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string') {
    const trimmed = skills.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
      } catch {}
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};
