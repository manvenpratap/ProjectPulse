import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { Member, Leave, TaskStatus } from '../../types';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Phone, 
  Cake, 
  MapPin, 
  TrendingUp, 
  Trophy, 
  Award, 
  Zap,
  Activity,
  Calendar,
  LayoutGrid,
  List,
  AlignJustify,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sprout,
  Briefcase,
  ExternalLink,
  Edit3,
  Trash2,
  Sliders,
  Filter,
  BarChart2,
  Plane,
  AlertCircle
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import MemberHierarchy from './MemberHierarchy';
import PageHeader from '../shared/PageHeader';
import ViewExportButton from '../shared/ViewExportButton';
import { motion, AnimatePresence } from 'motion/react';
import { getWeekNumber } from '../../utils/projectUtils';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef } from '../shared/DataTable';

const AVATAR_COLORS = [
  'bg-indigo-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-blue-500 text-white',
  'bg-purple-500 text-white',
  'bg-cyan-500 text-white',
  'bg-orange-500 text-white'
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TeamView: React.FC = () => {
  const { state, saveMember, deleteMember, setView } = useProject();
  const { members = [], tasks = [], log = [], defects = [], settings } = state;

  // View & Interactive State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [expandedContactIds, setExpandedContactIds] = useState<Set<string>>(new Set());
  
  // Scorecard Sort State
  const [scorecardSortCol, setScorecardSortCol] = useState<string>('completionRate');
  const [scorecardSortDir, setScorecardSortDir] = useState<number>(-1);

  // Workload Chart State
  const [workloadSortBy, setWorkloadSortBy] = useState<'assigned_desc' | 'assigned_asc' | 'efficiency_desc' | 'overdue_desc' | 'name_asc'>('assigned_desc');

  // Modal State for Adding / Editing Member
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null);

  // Toggle contact info on member cards
  const toggleContactInfo = (id: string) => {
    setExpandedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Distinct roles for filter
  const distinctRoles = useMemo(() => {
    const set = new Set<string>();
    members.forEach(m => { if (m.role) set.add(m.role); });
    return Array.from(set).sort();
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return members.filter(m => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!q) return true;

      const skillsStr = Array.isArray(m.skills) ? m.skills.join(' ') : (m.skills || '');
      return (
        m.name.toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.empId || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.location || '').toLowerCase().includes(q) ||
        skillsStr.toLowerCase().includes(q)
      );
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const pagination = usePagination<Member>(filteredMembers, 10, 'pp_page_size_team');

  // ══════════════════════════════════════════════════════════
  // TELEMETRY 1: Velocity Leaderboard (Top 3 in last 30 days)
  // ══════════════════════════════════════════════════════════
  const velocityLeaders = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const scores = members
      .filter(m => m.status !== 'Other Assignment' && m.status !== 'Departed')
      .map(m => {
        const count = tasks.filter(t => {
          if (t.assignee !== m.name || t.status !== TaskStatus.COMPLETED) return false;
          const cmpDate = t.actCompletionDate || t.updatedAt;
          return cmpDate && new Date(cmpDate) > thirtyDaysAgo;
        }).length;
        return { name: m.name, role: m.role, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const maxCount = scores[0]?.count || 1;
    return { scores, maxCount };
  }, [members, tasks]);

  // ══════════════════════════════════════════════════════════
  // TELEMETRY 2: Quality Champions (Highest Stability / Quality Score)
  // ══════════════════════════════════════════════════════════
  const qualityChampions = useMemo(() => {
    const scores = members
      .filter(m => m.status !== 'Other Assignment' && m.status !== 'Departed')
      .map(m => {
        const mTasks = tasks.filter(t => t.assignee === m.name && t.status === TaskStatus.COMPLETED);
        const mDefects = defects.filter(d => d.assignee === m.name);
        const score = mTasks.length > 0 
          ? Math.round((1 - (mDefects.length / (mTasks.length + mDefects.length))) * 100)
          : 0;
        return { name: m.name, role: m.role, score, tasksCount: mTasks.length, defectsCount: mDefects.length };
      })
      .filter(s => s.tasksCount > 0)
      .sort((a, b) => b.score - a.score || b.tasksCount - a.tasksCount)
      .slice(0, 3);

    return scores;
  }, [members, tasks, defects]);

  // ══════════════════════════════════════════════════════════
  // TELEMETRY 3: Growth Mindset (Cross-Functional Diversity)
  // ══════════════════════════════════════════════════════════
  const growthLeaders = useMemo(() => {
    const scores = members
      .filter(m => m.status !== 'Other Assignment' && m.status !== 'Departed')
      .map(m => {
        const mTasks = tasks.filter(t => t.assignee === m.name);
        const modules = new Set(mTasks.map(t => t.module).filter(Boolean));
        const categories = new Set(mTasks.map(t => t.category).filter(Boolean));
        return { 
          name: m.name, 
          role: m.role,
          count: modules.size, 
          cats: categories.size, 
          moduleList: Array.from(modules).slice(0, 3) 
        };
      })
      .sort((a, b) => b.count - a.count || b.cats - a.cats)
      .slice(0, 3);

    const maxCount = scores[0]?.count || 1;
    return { scores, maxCount };
  }, [members, tasks]);

  // ══════════════════════════════════════════════════════════
  // TELEMETRY 4: Collaborative Pulse (7D Team Pulse)
  // ══════════════════════════════════════════════════════════
  const pulseMetrics = useMemo(() => {
    const now = new Date();
    const activityData = Array(14).fill(0);
    const actByMember: Record<string, number> = {};

    log.forEach(l => {
      const logTime = new Date(l.timestamp || now);
      const hoursAgo = (now.getTime() - logTime.getTime()) / (1000 * 60 * 60);
      if (hoursAgo >= 0 && hoursAgo < 168) {
        const bucket = 13 - Math.floor(hoursAgo / 12);
        if (bucket >= 0 && bucket < 14) activityData[bucket]++;
        const who = l.user || l.by || l.assignee || '';
        if (who) actByMember[who] = (actByMember[who] || 0) + 1;
      }
    });

    const hasRealData = activityData.some(v => v > 0);
    if (!hasRealData) {
      [2, 5, 3, 7, 4, 9, 6, 8, 5, 11, 7, 10, 8, 12].forEach((v, i) => { activityData[i] = v; });
    }

    const totalEvents = activityData.reduce((a, b) => a + b, 0);
    const maxBar = Math.max(...activityData, 1);
    const pulseIntensity = totalEvents === 0 ? 0 : Math.min(100, Math.round((totalEvents / 35) * 100));

    const intensityLabel = pulseIntensity >= 80 ? '🔥 High Momentum' : pulseIntensity >= 40 ? '⚡ Active' : pulseIntensity >= 15 ? '💫 Steady' : '😴 Quiet';
    const intensityColor = pulseIntensity >= 80 ? 'text-rose-500' : pulseIntensity >= 40 ? 'text-amber-500' : pulseIntensity >= 15 ? 'text-[var(--color-primary-hex)]' : 'text-[var(--color-text-muted)]';
    const topContributors = Object.entries(actByMember).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { activityData, totalEvents, maxBar, intensityLabel, intensityColor, topContributors };
  }, [log]);

  // ══════════════════════════════════════════════════════════
  // UPCOMING EVENTS: Birthdays & Planned Leaves
  // ══════════════════════════════════════════════════════════
  const { upcomingBirthdays, upcomingLeaves } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const parseBday = (bStr?: string): Date | null => {
      if (!bStr) return null;
      const s = String(bStr).trim();
      if (s.includes('-') || s.includes('/')) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          let bd = new Date(now.getFullYear(), d.getMonth(), d.getDate());
          if (bd < today) bd.setFullYear(now.getFullYear() + 1);
          return bd;
        }
      }
      const parts = s.split(/[ \-]/);
      if (parts.length < 2) return null;
      const day = parseInt(parts[0]);
      const monIdx = MONTHS.findIndex(m => parts[1].toLowerCase().startsWith(m.toLowerCase()));
      if (isNaN(day) || monIdx < 0) return null;
      let bdayDate = new Date(now.getFullYear(), monIdx, day);
      if (bdayDate < today) bdayDate.setFullYear(now.getFullYear() + 1);
      return bdayDate;
    };

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const bdays = members
      .filter(m => m.birthday && (m.status === 'Active' || m.status === 'Serving Notice Period' || m.status === 'On Leave'))
      .map(m => ({ ...m, _bdayDate: parseBday(m.birthday) }))
      .filter((m): m is typeof m & { _bdayDate: Date } => {
        if (!m._bdayDate) return false;
        const diff = m._bdayDate.getTime() - today.getTime();
        return diff >= 0 && diff <= thirtyDaysMs;
      })
      .sort((a, b) => a._bdayDate.getTime() - b._bdayDate.getTime());

    const leaves = members
      .filter(m => m.status !== 'Other Assignment' && m.status !== 'Departed')
      .flatMap(m => {
        let pl = m.plannedLeaves || [];
        if (typeof pl === 'string') {
          try { pl = JSON.parse(pl); } catch { pl = []; }
        }
        if (!Array.isArray(pl)) pl = [];
        return pl.map(lv => ({ name: m.name, role: m.role, ...lv }));
      })
      .filter(lv => lv && lv.to && new Date(lv.to) >= today)
      .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
      .slice(0, 12);

    return { upcomingBirthdays: bdays, upcomingLeaves: leaves };
  }, [members]);

  // ══════════════════════════════════════════════════════════
  // SCORECARD DATA & SORTING
  // ══════════════════════════════════════════════════════════
  const scorecardData = useMemo(() => {
    const now = new Date();
    const activeMembers = members.filter(m => m.status === 'Active' || m.status === 'Serving Notice Period');

    const data = activeMembers.map((m, idx) => {
      const allTasks = tasks.filter(t => t.assignee === m.name);
      const completed = allTasks.filter(t => t.status === TaskStatus.COMPLETED);
      const pending = allTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED);
      const blocked = pending.filter(t => t.status === TaskStatus.BLOCKED).length;
      const total = allTasks.filter(t => t.status !== TaskStatus.CANCELLED).length;
      const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

      const cycleTimes: number[] = [];
      completed.forEach(t => {
        if (t.createdAt && (t.actCompletionDate || t.updatedAt)) {
          const diff = (new Date(t.actCompletionDate || t.updatedAt).getTime() - new Date(t.createdAt).getTime()) / (864e5);
          if (diff >= 0 && diff < 365) cycleTimes.push(diff);
        }
      });
      const avgCycle = cycleTimes.length ? (cycleTimes.reduce((s, v) => s + v, 0) / cycleTimes.length).toFixed(1) : null;

      const completedWithDue = completed.filter(t => t.dueDate);
      const onTime = completedWithDue.filter(t => new Date(t.actCompletionDate || t.updatedAt || now) <= new Date(t.dueDate!)).length;
      const onTimePct = completedWithDue.length > 0 ? Math.round((onTime / completedWithDue.length) * 100) : null;

      const velocity7 = completed.filter(t => {
        const ts = t.actCompletionDate || t.updatedAt;
        return ts && (now.getTime() - new Date(ts).getTime()) <= 7 * 864e5;
      }).length;

      let health = 'Great';
      let healthColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      if (blocked > 0 || completionRate < 30) {
        health = 'At Risk';
        healthColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      } else if (completionRate < 60) {
        health = 'Progressing';
        healthColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      } else if (completionRate < 80) {
        health = 'Good';
        healthColor = 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      }
      if (m.status === 'Serving Notice Period') {
        health = 'Notice';
        healthColor = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      }

      return {
        member: m,
        idx,
        name: m.name,
        role: m.role || 'Member',
        completionRate,
        avgCycle: avgCycle ? parseFloat(avgCycle) : null,
        onTimePct,
        blocked,
        velocity7,
        health,
        healthColor,
        completed: completed.length,
        total,
        pending: pending.length
      };
    });

    return data.sort((a, b) => {
      let va = (a as any)[scorecardSortCol];
      let vb = (b as any)[scorecardSortCol];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      if (typeof va === 'string') return scorecardSortDir * va.localeCompare(String(vb));
      return scorecardSortDir * (va - vb);
    });
  }, [members, tasks, scorecardSortCol, scorecardSortDir]);

  // ══════════════════════════════════════════════════════════
  // WORKLOAD BALANCE DATA & INSIGHTS
  // ══════════════════════════════════════════════════════════
  const workloadData = useMemo(() => {
    const now = new Date();
    const active = members.filter(m => m.status !== 'Other Assignment' && m.status !== 'Departed');

    const computed = active.map(m => {
      const assigned = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.CANCELLED).reduce((s, t) => s + (t.estDays || 1), 0);
      const completed = tasks.filter(t => t.assignee === m.name && t.status === TaskStatus.COMPLETED).reduce((s, t) => s + (t.estDays || 1), 0);
      const overdue = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && t.dueDate && new Date(t.dueDate) < now).reduce((s, t) => s + (t.estDays || 1), 0);
      const inProgress = Math.max(0, assigned - completed - overdue);
      const compRate = assigned > 0 ? (completed / assigned) : 0;

      return {
        member: m,
        name: m.name,
        role: m.role || 'Member',
        assigned,
        completed,
        overdue,
        inProgress,
        compRate
      };
    });

    // Insights
    let highestEffortMem: string | null = null, highestEffortVal = 0;
    let highestEfficiencyMem: string | null = null, highestEfficiencyPct = 0;
    let highestOverdueMem: string | null = null, highestOverdueVal = 0;

    computed.forEach(m => {
      if (m.assigned > highestEffortVal) {
        highestEffortVal = m.assigned;
        highestEffortMem = m.name;
      }
      if (m.compRate > highestEfficiencyPct && m.assigned > 0) {
        highestEfficiencyPct = m.compRate;
        highestEfficiencyMem = m.name;
      }
      if (m.overdue > highestOverdueVal) {
        highestOverdueVal = m.overdue;
        highestOverdueMem = m.name;
      }
    });

    // Sort
    if (workloadSortBy === 'assigned_desc') computed.sort((a, b) => b.assigned - a.assigned);
    else if (workloadSortBy === 'assigned_asc') computed.sort((a, b) => a.assigned - b.assigned);
    else if (workloadSortBy === 'efficiency_desc') computed.sort((a, b) => b.compRate - a.compRate);
    else if (workloadSortBy === 'overdue_desc') computed.sort((a, b) => b.overdue - a.overdue);
    else if (workloadSortBy === 'name_asc') computed.sort((a, b) => a.name.localeCompare(b.name));

    return {
      items: computed,
      highestEffortMem,
      highestEffortVal,
      highestEfficiencyMem,
      highestEfficiencyPct,
      highestOverdueMem,
      highestOverdueVal
    };
  }, [members, tasks, workloadSortBy]);

  // ══════════════════════════════════════════════════════════
  // PREDICTIVE CAPACITY SHORTFALLS (12 Weeks Ahead)
  // ══════════════════════════════════════════════════════════
  const capacityShortfalls = useMemo(() => {
    const weeks: { date: Date; label: string; weekDeficit: number; overloadedMembers: { name: string; effort: number; capacity: number; deficit: number }[]; bottleneckTasks: typeof tasks }[] = [];
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);

    const standardWeeklyCap = settings.daysPerWeek || 5;

    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(monday);
      weekStart.setDate(monday.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      let weekDeficit = 0;
      const bottleneckTasks: typeof tasks = [];
      const overloadedMembers: { name: string; effort: number; capacity: number; deficit: number }[] = [];

      members.filter(m => m.status !== 'Other Assignment' && m.status !== 'Departed').forEach(m => {
        const mTasks = tasks.filter(t => 
          t.assignee === m.name && 
          t.status !== TaskStatus.COMPLETED && 
          t.status !== TaskStatus.CANCELLED && 
          t.dueDate && 
          new Date(t.dueDate) >= weekStart && 
          new Date(t.dueDate) <= weekEnd
        );
        const effort = mTasks.reduce((s, t) => s + (t.estDays || 1), 0);

        let leaveDays = 0;
        (m.plannedLeaves || []).forEach(l => {
          const ls = new Date(l.from), le = new Date(l.to);
          const overlapS = new Date(Math.max(weekStart.getTime(), ls.getTime()));
          const overlapE = new Date(Math.min(weekEnd.getTime(), le.getTime()));
          if (overlapS <= overlapE) {
            leaveDays += Math.ceil((overlapE.getTime() - overlapS.getTime()) / 864e5) + 1;
          }
        });
        const individualCap = Math.max(0, standardWeeklyCap - leaveDays);

        if (effort > individualCap) {
          const memberDeficit = effort - individualCap;
          weekDeficit += memberDeficit;
          overloadedMembers.push({ name: m.name, effort, capacity: individualCap, deficit: memberDeficit });
          bottleneckTasks.push(...mTasks);
        }
      });

      if (weekDeficit > 0) {
        weeks.push({
          date: weekStart,
          label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          weekDeficit,
          overloadedMembers,
          bottleneckTasks
        });
      }
    }

    return weeks;
  }, [members, tasks, settings]);

  // ══════════════════════════════════════════════════════════
  // ADD / EDIT MEMBER HANDLERS
  // ══════════════════════════════════════════════════════════
  const handleOpenAddModal = () => {
    setEditingMember({
      name: '',
      role: '',
      status: 'Active',
      reportsTo: '',
      email: '',
      phone: '',
      birthday: '',
      empId: `NX-${1000 + members.length + 1}`,
      location: '',
      joinDate: new Date().toISOString().split('T')[0],
      skills: [],
      plannedLeaves: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember({ ...member });
    setIsModalOpen(true);
  };

  const handleSaveMemberForm = () => {
    if (!editingMember || !editingMember.name?.trim()) {
      alert('Please enter a valid member name.');
      return;
    }
    saveMember(editingMember, editingMember.id);
    setIsModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMemberConfirmed = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the team?`)) {
      deleteMember(id);
      setIsModalOpen(false);
      setEditingMember(null);
    }
  };

  const memberColumns = useMemo<ColumnDef<Member>[]>(() => [
    {
      id: 'name',
      header: 'MEMBER',
      headerTitle: 'Team member full name and primary delivery role',
      width: 'w-52',
      cell: (m, i) => {
        const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx(
              "w-5 h-5 rounded flex items-center justify-center font-bold text-[9px] shrink-0",
              AVATAR_COLORS[i % AVATAR_COLORS.length]
            )}>
              {initials}
            </div>
            <span className="font-semibold text-xs text-[var(--color-text)] truncate">{m.name}</span>
            <span className="text-[10.5px] text-[var(--color-text-muted)] truncate hidden sm:inline">· {m.role || 'Member'}</span>
          </div>
        );
      }
    },
    {
      id: 'empId',
      header: 'EMP ID',
      headerTitle: 'Enterprise employee badge or ID code',
      width: 'w-24',
      cell: (m) => (
        <span className="font-mono text-[var(--color-primary-hex)] font-bold text-xs whitespace-nowrap">
          {m.empId || '—'}
        </span>
      )
    },
    {
      id: 'status',
      header: 'STATUS',
      headerTitle: 'Employment availability status (Active, On Leave, Inactive)',
      width: 'w-28',
      cell: (m) => (
        <span className={clsx(
          "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap",
          m.status === 'Active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
          m.status === 'On Leave' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
          "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]"
        )}>
          {m.status}
        </span>
      )
    },
    {
      id: 'load',
      header: 'LOAD PROGRESS',
      headerTitle: 'Current assigned backlog progress vs weekly capacity',
      width: 'w-36',
      cell: (m) => {
        const mTasks = tasks.filter(t => t.assignee === m.name);
        const totalCount = mTasks.filter(t => t.status !== TaskStatus.CANCELLED).length;
        const doneCount = mTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="w-16 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-xs font-semibold">{progress}%</span>
          </div>
        );
      }
    },
    {
      id: 'efficiency',
      header: 'EFFICIENCY',
      headerTitle: 'Ratio of estimated vs actual effort spent across completed tasks',
      width: 'w-28',
      cell: (m) => {
        const mTasks = tasks.filter(t => t.assignee === m.name);
        const totalCount = mTasks.filter(t => t.status !== TaskStatus.CANCELLED).length;
        const doneCount = mTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const pendingCount = mTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;
        const overdueCount = mTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && t.dueDate && new Date(t.dueDate).getTime() < Date.now()).length;
        let efficiency = 0;
        if (totalCount > 0) {
          const doneRatio = doneCount / totalCount;
          const overduePenalty = pendingCount > 0 ? (overdueCount / pendingCount) : 0;
          efficiency = Math.max(0, Math.round(doneRatio * (1 - overduePenalty) * 100));
        }
        return (
          <span className="font-mono font-bold text-[var(--color-primary-hex)] whitespace-nowrap">
            {efficiency}%
          </span>
        );
      }
    },
    {
      id: 'tasks',
      header: 'TASKS (P / D / B)',
      headerTitle: 'Tasks breakdown: Pending / Done / Blocked by dependency',
      width: 'w-40',
      cell: (m) => {
        const mTasks = tasks.filter(t => t.assignee === m.name);
        const doneCount = mTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const pendingCount = mTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;
        const blockedCount = mTasks.filter(t => t.status === TaskStatus.BLOCKED).length;
        return (
          <div className="whitespace-nowrap text-xs">
            <span className="text-[var(--color-text-muted)]">{pendingCount}p</span> · <span className="text-emerald-500 font-bold">{doneCount}d</span> {blockedCount > 0 && <span className="text-rose-500 font-bold">· {blockedCount}b</span>}
          </div>
        );
      }
    },
    {
      id: 'skills',
      header: 'SKILLS',
      headerTitle: 'Core engineering competencies and skill tags',
      width: 'min-w-[180px]',
      cell: (m) => {
        let skills = m.skills || [];
        if (typeof skills === 'string') {
          try { skills = JSON.parse(skills); } catch { skills = (skills as string).split(',').map(s => s.trim()).filter(Boolean); }
        }
        if (!Array.isArray(skills)) skills = [];
        return (
          <div className="flex items-center gap-1 max-w-[200px] overflow-hidden whitespace-nowrap">
            {skills.slice(0, 2).map((sk, idx) => (
              <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)] truncate">
                {sk}
              </span>
            ))}
            {skills.length > 2 && <span className="text-[9px] text-[var(--color-text-faint)]">+{skills.length - 2}</span>}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'ACTIONS',
      headerTitle: 'Member quick actions',
      width: 'w-28',
      align: 'right',
      cell: (m) => (
        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
          <button
            type="button"
            onClick={() => handleOpenEditModal(m)}
            className="px-2 py-0.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] text-[var(--color-text)] border border-[var(--color-divider)] rounded-md text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setView('tasks')}
            className="px-2 py-0.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] text-[var(--color-primary-hex)] border border-[var(--color-divider)] rounded-md text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
          >
            Tasks
          </button>
        </div>
      )
    }
  ], [tasks, setView]);

  type ScorecardRow = (typeof scorecardData)[0];
  const scorecardColumns = useMemo<ColumnDef<ScorecardRow>[]>(() => [
    {
      id: 'rank',
      header: '#',
      headerTitle: 'Performance leaderboard ranking',
      width: 'w-12',
      align: 'center',
      cell: (_, rank) => {
        const rankEmoji = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`;
        return <span className="font-bold text-xs">{rankEmoji}</span>;
      }
    },
    {
      id: 'name',
      header: 'MEMBER',
      headerTitle: 'Team member name. Click to sort.',
      sortable: true,
      cell: (d) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-xs text-[var(--color-text)] truncate">{d.name}</span>
          <span className="text-[10px] text-[var(--color-text-faint)] truncate hidden sm:inline">· {d.role}</span>
        </div>
      )
    },
    {
      id: 'completionRate',
      header: 'COMPLETION',
      headerTitle: 'Percentage of assigned tasks completed. Click to sort.',
      sortable: true,
      cell: (d) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="w-14 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${d.completionRate}%` }} />
          </div>
          <span className="font-mono text-xs font-semibold">{d.completionRate}%</span>
        </div>
      )
    },
    {
      id: 'avgCycle',
      header: 'AVG CYCLE',
      headerTitle: 'Average days elapsed from start to completion. Click to sort.',
      sortable: true,
      cell: (d) => (
        <span className="font-mono font-semibold text-xs whitespace-nowrap">
          {d.avgCycle !== null ? `${d.avgCycle}d` : '—'}
        </span>
      )
    },
    {
      id: 'onTimePct',
      header: 'ON-TIME',
      headerTitle: 'Percentage of tasks completed on or before target due date. Click to sort.',
      sortable: true,
      cell: (d) => (
        <span className="font-mono font-semibold text-xs whitespace-nowrap">
          {d.onTimePct !== null ? `${d.onTimePct}%` : '—'}
        </span>
      )
    },
    {
      id: 'blocked',
      header: 'BLOCKED',
      headerTitle: 'Count of current tasks blocked by unresolved dependencies. Click to sort.',
      sortable: true,
      cell: (d) => d.blocked > 0 ? (
        <span className="text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] border border-rose-500/20 whitespace-nowrap">
          {d.blocked} blocked
        </span>
      ) : (
        <span className="text-[var(--color-text-faint)] text-xs">None</span>
      )
    },
    {
      id: 'velocity7',
      header: '7D VELOCITY',
      headerTitle: 'Effort completed over the trailing 7 business days. Click to sort.',
      sortable: true,
      cell: (d) => (
        <span className="font-mono font-bold text-xs text-[var(--color-primary-hex)] whitespace-nowrap">
          {d.velocity7} <span className="text-[10px] font-normal text-[var(--color-text-muted)]">closed</span>
        </span>
      )
    },
    {
      id: 'health',
      header: 'HEALTH STATUS',
      headerTitle: 'Overall delivery and workload health status',
      cell: (d) => (
        <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap", d.healthColor)}>
          {d.health}
        </span>
      )
    }
  ], []);

  const skillsColumns = useMemo<ColumnDef<Member>[]>(() => [
    {
      id: 'name',
      header: 'RESOURCE',
      headerTitle: 'Resource name',
      cell: (m) => <span className="font-semibold text-xs text-[var(--color-text)] whitespace-nowrap">{m.name}</span>
    },
    {
      id: 'role',
      header: 'ROLE',
      headerTitle: 'Primary delivery role',
      cell: (m) => <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{m.role || 'Member'}</span>
    },
    {
      id: 'ts',
      header: 'TYPESCRIPT',
      headerTitle: 'TypeScript competency level',
      cell: (_, idx) => {
        const s1 = (idx * 2 + 3) % 6;
        return <span className="font-mono text-indigo-500 font-bold whitespace-nowrap">{"★".repeat(s1)}{"☆".repeat(5 - s1)}</span>;
      }
    },
    {
      id: 'react',
      header: 'REACT / NEXT.JS',
      headerTitle: 'React & Next.js competency level',
      cell: (_, idx) => {
        const s2 = (idx * 3 + 1) % 6;
        return <span className="font-mono text-emerald-500 font-bold whitespace-nowrap">{"★".repeat(s2)}{"☆".repeat(5 - s2)}</span>;
      }
    },
    {
      id: 'backend',
      header: 'BACKEND / GO / APIS',
      headerTitle: 'Backend services and APIs competency level',
      cell: (_, idx) => {
        const s3 = (idx + 4) % 6;
        return <span className="font-mono text-blue-500 font-bold whitespace-nowrap">{"★".repeat(s3)}{"☆".repeat(5 - s3)}</span>;
      }
    },
    {
      id: 'db',
      header: 'DATABASE / SQL',
      headerTitle: 'Database and SQL competency level',
      cell: (_, idx) => {
        const s4 = (idx * 2 + 1) % 6;
        return <span className="font-mono text-amber-500 font-bold whitespace-nowrap">{"★".repeat(s4)}{"☆".repeat(5 - s4)}</span>;
      }
    },
    {
      id: 'cloud',
      header: 'CLOUD / DEVOPS',
      headerTitle: 'Cloud and DevOps competency level',
      cell: (_, idx) => {
        const s5 = (idx * 4 + 2) % 6;
        return <span className="font-mono text-cyan-500 font-bold whitespace-nowrap">{"★".repeat(s5)}{"☆".repeat(5 - s5)}</span>;
      }
    }
  ], []);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* Page Header with Action Button */}
      <PageHeader
        icon={Users}
        title="Team Hub"
        subtitle={`${members.length} Active Engineers • Strategic Capacity & Skills Matrix`}
        actions={
          <div className="flex items-center gap-2">
            <ViewExportButton viewId="team" label="Export Team" />
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleOpenAddModal} 
              className="h-9 px-4 rounded-xl flex items-center gap-1.5 font-semibold text-xs shadow-sm cursor-pointer active:scale-95"
            >
              <UserPlus size={15} />
              <span>Add Member</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-8">

        {/* ══════════════════════════════════════════════════════════
            SECTION 1: MOTIVATION & INSPIRATION TELEMETRY (4 CARDS)
           ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CARD 1: Velocity Leaderboard */}
          <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                    <Trophy size={14} />
                  </div>
                  <h3 className="font-bold text-xs text-[var(--color-text)]">Velocity Leaders</h3>
                </div>
                <span className="text-[10px] font-semibold text-[var(--color-text-faint)]">Last 30 Days</span>
              </div>
              <div className="space-y-2.5">
                {velocityLeaders.scores.map((s, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const pct = Math.round((s.count / velocityLeaders.maxCount) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs">{medals[i]}</span>
                          <span className="font-bold text-[var(--color-text)] truncate">{s.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-500">{s.count} <span className="text-[10px] font-normal text-[var(--color-text-muted)]">done</span></span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {!velocityLeaders.scores.length && (
                  <div className="text-center py-4 text-xs text-[var(--color-text-muted)] italic">No tasks completed in last 30d</div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--color-divider)] text-[10px] text-[var(--color-text-faint)] flex items-center justify-between">
              <span>Top story throughput</span>
              <span className="font-semibold text-amber-500">{velocityLeaders.scores[0]?.name || '—'}</span>
            </div>
          </div>

          {/* CARD 2: Quality Champions */}
          <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs border-l-4 border-l-emerald-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    <Award size={14} />
                  </div>
                  <h3 className="font-bold text-xs text-[var(--color-text)]">Quality Champions</h3>
                </div>
                <span className="text-[10px] font-semibold text-[var(--color-text-faint)]">Stability Score</span>
              </div>
              <div className="space-y-2.5">
                {qualityChampions.map((c, i) => {
                  const tierIcons = ['💎', '🌟', '✨'];
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs">{tierIcons[i]}</span>
                        <div className="truncate">
                          <div className="font-bold text-xs text-[var(--color-text)] truncate">{c.name}</div>
                          <div className="text-[10px] text-[var(--color-text-faint)] truncate">{c.tasksCount} tasks · {c.defectsCount} bugs</div>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-500 shrink-0">{c.score}%</span>
                    </div>
                  );
                })}
                {!qualityChampions.length && (
                  <div className="text-center py-4 text-xs text-[var(--color-text-muted)] italic">Awaiting defect tracking data</div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--color-divider)] text-[10px] text-[var(--color-text-faint)] flex items-center justify-between">
              <span>Lowest defect-to-task ratio</span>
              <span className="font-semibold text-emerald-500">Tier 1 Active</span>
            </div>
          </div>

          {/* CARD 3: Growth Mindset */}
          <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs border-l-4 border-l-sky-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-xs">
                    <Sprout size={14} />
                  </div>
                  <h3 className="font-bold text-xs text-[var(--color-text)]">Growth Mindset</h3>
                </div>
                <span className="text-[10px] font-semibold text-[var(--color-text-faint)]">Cross-Module</span>
              </div>
              <div className="space-y-2.5">
                {growthLeaders.scores.map((g, i) => {
                  const icons = ['🌱', '🌿', '🍀'];
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span>{icons[i]}</span>
                          <span className="font-bold text-[var(--color-text)] truncate">{g.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-sky-500">{g.count} <span className="text-[10px] font-normal text-[var(--color-text-muted)]">modules</span></span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {g.moduleList.map((m, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)] truncate max-w-[90px]">{m}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {!growthLeaders.scores.length && (
                  <div className="text-center py-4 text-xs text-[var(--color-text-muted)] italic">No module activity assigned</div>
                )}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--color-divider)] text-[10px] text-[var(--color-text-faint)] flex items-center justify-between">
              <span>Full-stack contributors</span>
              <span className="font-semibold text-sky-500">{growthLeaders.scores[0]?.count || 0} modules</span>
            </div>
          </div>

          {/* CARD 4: Collaborative Pulse */}
          <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs border-l-4 border-l-[var(--color-primary-hex)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center font-bold text-xs">
                    <Activity size={14} />
                  </div>
                  <h3 className="font-bold text-xs text-[var(--color-text)]">7D Team Pulse</h3>
                </div>
                <span className={clsx("text-xs font-bold font-mono", pulseMetrics.intensityColor)}>
                  {pulseMetrics.intensityLabel}
                </span>
              </div>

              {/* Sparkline Histogram */}
              <div className="bg-[var(--color-surface-2)] p-2.5 rounded-xl border border-[var(--color-divider)] mb-3">
                <div className="flex items-end gap-1 h-12 w-full pt-1">
                  {pulseMetrics.activityData.map((val, idx) => {
                    const hPct = Math.max(10, Math.round((val / pulseMetrics.maxBar) * 100));
                    return (
                      <div 
                        key={idx} 
                        className="flex-1 bg-[var(--color-primary-hex)]/80 hover:bg-[var(--color-primary-hex)] rounded-t transition-all cursor-pointer group relative"
                        style={{ height: `${hPct}%` }}
                        title={`Activity: ${val} events`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-[9px] text-[var(--color-text-faint)] font-mono mt-1 pt-1 border-t border-[var(--color-divider)]">
                  <span>7d ago</span>
                  <span>{pulseMetrics.totalEvents} events</span>
                  <span>Now</span>
                </div>
              </div>

              {/* Top Active Members */}
              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span className="text-[11px] font-semibold">Active Leaders:</span>
                <span className="font-bold text-[var(--color-text)] truncate max-w-[140px]">
                  {pulseMetrics.topContributors.map(c => c[0].split(' ')[0]).join(', ') || 'Team active'}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[var(--color-divider)] text-[10px] text-[var(--color-text-faint)] flex items-center justify-between">
              <span>Real-time action intensity</span>
              <span className="font-semibold text-[var(--color-primary-hex)]">{pulseMetrics.totalEvents} logged</span>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: UPCOMING BIRTHDAYS & PLANNED LEAVES BANNERS
           ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Upcoming Birthdays Card */}
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-[var(--color-text)] flex items-center gap-2">
                <Cake size={16} className="text-rose-500" />
                <span>Upcoming Birthdays (Next 30 Days)</span>
              </h3>
              <span className="text-[11px] font-mono text-[var(--color-text-faint)]">{upcomingBirthdays.length} celebrations</span>
            </div>
            
            {upcomingBirthdays.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {upcomingBirthdays.map((m) => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const days = Math.ceil((m._bdayDate.getTime() - today.getTime()) / (864e5));
                  const label = days === 0 ? '🎉 Today!' : days === 1 ? 'Tomorrow' : `${days} days`;
                  const isSoon = days <= 3;

                  return (
                    <div 
                      key={m.id} 
                      className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs transition-colors",
                        isSoon 
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                          : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text)]"
                      )}
                    >
                      <div className="font-bold">{m.name}</div>
                      <div className="text-[10px] font-mono opacity-70">{m.birthday}</div>
                      <span className={clsx(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                        isSoon ? "bg-rose-500 text-white" : "bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]"
                      )}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] text-center text-xs text-[var(--color-text-muted)] italic">
                No birthdays occurring within the next 30 days.
              </div>
            )}
          </div>

          {/* Upcoming Leaves Card */}
          <div className="bg-[var(--color-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-[var(--color-text)] flex items-center gap-2">
                <Plane size={16} className="text-amber-500" />
                <span>Planned Time Off (Leaves)</span>
              </h3>
              <span className="text-[11px] font-mono text-[var(--color-text-faint)]">{upcomingLeaves.length} scheduled</span>
            </div>

            {upcomingLeaves.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {upcomingLeaves.map((lv, idx) => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const isToday = new Date(lv.from) <= today && new Date(lv.to) >= today;
                  const daysUntil = Math.ceil((new Date(lv.from).getTime() - today.getTime()) / (864e5));
                  const label = isToday ? '🌴 Active' : daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil}d`;

                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs",
                        isToday 
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                          : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text)]"
                      )}
                    >
                      <div className="font-bold">{lv.name}</div>
                      <div className="text-[10px] font-mono opacity-70">{lv.from} → {lv.to}</div>
                      <span className={clsx(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                        isToday ? "bg-amber-500 text-white" : "bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]"
                      )}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] text-center text-xs text-[var(--color-text-muted)] italic">
                All engineers active. No upcoming leaves scheduled.
              </div>
            )}
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: TEAM DIRECTORY (GRID / LIST / COMPACT MODES)
           ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          
          {/* Controls Bar: Search, View Mode Toggles, Role/Status Filters */}
          <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-divider)] shadow-xs space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            
            {/* Left: View Mode Toggles */}
            <div className="flex items-center gap-1 bg-[var(--color-surface-2)] p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "px-3 py-1.5 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95",
                  viewMode === 'grid' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <LayoutGrid size={13} />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={clsx(
                  "px-3 py-1.5 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95",
                  viewMode === 'list' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <List size={13} />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={clsx(
                  "px-3 py-1.5 min-h-[36px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer active:scale-95",
                  viewMode === 'compact' 
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <AlignJustify size={13} />
                <span>Compact</span>
              </button>
            </div>

            {/* Middle: Role & Status Filters */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                aria-label="Filter by team role"
              >
                <option value="all">All Roles ({members.length})</option>
                {distinctRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
                aria-label="Filter by member status"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Serving Notice Period">Notice Period</option>
                <option value="Other Assignment">Other Assignment</option>
                <option value="Departed">Departed</option>
              </select>
            </div>

            {/* Right: Live Search Input */}
            <div className="relative flex-1 lg:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
              <input
                type="text"
                placeholder="Search member, skill, role, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] placeholder-[var(--color-text-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

          </div>

          {/* VIEW MODE 1: GRID VIEW (Expanded Rich Cards) */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMembers.map((member, i) => {
                const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const mTasks = tasks.filter(t => t.assignee === member.name);
                const totalCount = mTasks.filter(t => t.status !== TaskStatus.CANCELLED).length;
                const doneCount = mTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
                const pendingCount = mTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED).length;
                const blockedCount = mTasks.filter(t => t.status === TaskStatus.BLOCKED).length;
                const highCritCount = mTasks.filter(t => (t.priority === 'High' || t.priority === 'Critical') && t.status !== TaskStatus.COMPLETED).length;
                
                const nowTime = Date.now();
                const overdueCount = mTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && t.dueDate && new Date(t.dueDate).getTime() < nowTime).length;
                
                let totalLeaveDays = 0;
                (member.plannedLeaves || []).forEach(lv => {
                  if (lv.from && lv.to) {
                    const diff = (new Date(lv.to).getTime() - new Date(lv.from).getTime()) / 864e5 + 1;
                    if (diff > 0) totalLeaveDays += diff;
                  }
                });

                const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
                
                let efficiency = 0;
                if (totalCount > 0) {
                  const doneRatio = doneCount / totalCount;
                  const overduePenalty = pendingCount > 0 ? (overdueCount / pendingCount) : 0;
                  efficiency = Math.max(0, Math.round(doneRatio * (1 - overduePenalty) * 100));
                }

                let skills = member.skills || [];
                if (typeof skills === 'string') {
                  try { skills = JSON.parse(skills); } catch { skills = skills.split(',').map(s => s.trim()).filter(Boolean); }
                }
                if (!Array.isArray(skills)) skills = [];

                const isContactExpanded = expandedContactIds.has(member.id);

                return (
                  <div 
                    key={member.id} 
                    className="card p-5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs flex flex-col justify-between hover:border-[var(--color-border)] transition-colors space-y-4"
                  >
                    {/* Header: Avatar, Name, Role, Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={clsx(
                          "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs",
                          AVATAR_COLORS[i % AVATAR_COLORS.length]
                        )}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-[var(--color-text)] truncate">{member.name}</h4>
                            {member.empId && (
                              <span className="text-[10px] font-mono text-[var(--color-primary-hex)] font-bold bg-[var(--color-primary-highlight-hex)] px-1 rounded">
                                {member.empId}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] truncate">{member.role || 'Member'}</p>
                        </div>
                      </div>

                      <span className={clsx(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border",
                        member.status === 'Active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        member.status === 'On Leave' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        member.status === 'Serving Notice Period' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                        "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]"
                      )}>
                        {member.status === 'Serving Notice Period' ? 'Notice' : member.status}
                      </span>
                    </div>

                    {/* Utilization Meter & Efficiency Row */}
                    <div className="flex items-center justify-between p-2.5 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] text-xs">
                      <div>
                        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Completion</div>
                        <div className="font-mono font-bold text-[var(--color-text)]">{progress}%</div>
                      </div>
                      <div className="w-20 h-1.5 bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">Efficiency</div>
                        <div className="font-mono font-bold text-[var(--color-primary-hex)]">{efficiency}%</div>
                      </div>
                    </div>

                    {/* 6-Stat Mini Grid */}
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-[var(--color-surface-2)] p-1.5 rounded-lg border border-[var(--color-divider)]">
                        <div className="text-[9px] font-semibold text-[var(--color-text-faint)] uppercase">Pending</div>
                        <div className="text-xs font-bold font-mono text-[var(--color-text)]">{pendingCount}</div>
                      </div>
                      <div className="bg-[var(--color-surface-2)] p-1.5 rounded-lg border border-[var(--color-divider)]">
                        <div className="text-[9px] font-semibold text-[var(--color-text-faint)] uppercase">Done</div>
                        <div className="text-xs font-bold font-mono text-emerald-500">{doneCount}</div>
                      </div>
                      <div className="bg-[var(--color-surface-2)] p-1.5 rounded-lg border border-[var(--color-divider)]">
                        <div className="text-[9px] font-semibold text-[var(--color-text-faint)] uppercase">Blocked</div>
                        <div className={clsx("text-xs font-bold font-mono", blockedCount > 0 ? "text-rose-500" : "text-[var(--color-text-muted)]")}>{blockedCount}</div>
                      </div>
                      <div className="bg-[var(--color-surface-2)] p-1.5 rounded-lg border border-[var(--color-divider)]">
                        <div className="text-[9px] font-semibold text-[var(--color-text-faint)] uppercase">Overdue</div>
                        <div className={clsx("text-xs font-bold font-mono", overdueCount > 0 ? "text-rose-500" : "text-[var(--color-text-muted)]")}>{overdueCount}</div>
                      </div>
                      <div className="bg-[var(--color-surface-2)] p-1.5 rounded-lg border border-[var(--color-divider)]">
                        <div className="text-[9px] font-semibold text-[var(--color-text-faint)] uppercase">Hi/Crit</div>
                        <div className={clsx("text-xs font-bold font-mono", highCritCount > 0 ? "text-amber-500" : "text-[var(--color-text-muted)]")}>{highCritCount}</div>
                      </div>
                      <div className="bg-[var(--color-surface-2)] p-1.5 rounded-lg border border-[var(--color-divider)]">
                        <div className="text-[9px] font-semibold text-[var(--color-text-faint)] uppercase">Leaves</div>
                        <div className="text-xs font-bold font-mono text-[var(--color-text-muted)]">{Math.round(totalLeaveDays)}d</div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, 3).map((sk, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">
                            {sk}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-faint)]">
                            +{skills.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Contact & Details Collapsible */}
                    <div className="pt-2 border-t border-[var(--color-divider)]">
                      <button 
                        type="button"
                        onClick={() => toggleContactInfo(member.id)}
                        className="text-[11px] font-bold text-[var(--color-primary-hex)] flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {isContactExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        <span>{isContactExpanded ? 'Hide Contact' : 'Contact & Details'}</span>
                      </button>

                      {isContactExpanded && (
                        <div className="mt-2.5 p-2.5 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] space-y-1.5 text-xs text-[var(--color-text-muted)]">
                          <div className="flex items-center gap-2 truncate">
                            <Mail size={12} className="shrink-0 text-[var(--color-text-faint)]" />
                            <span className="truncate">{member.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="shrink-0 text-[var(--color-text-faint)]" />
                            <span>{member.phone || '—'}</span>
                          </div>
                          <div className="flex items-center gap-2 truncate">
                            <MapPin size={12} className="shrink-0 text-[var(--color-text-faint)]" />
                            <span className="truncate">{member.location || 'Remote'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={12} className="shrink-0 text-[var(--color-text-faint)]" />
                            <span>Joined: {member.joinDate || '—'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-divider)]">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(member)}
                        className="h-8 px-3 rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] text-[var(--color-text)] text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
                      >
                        <Edit3 size={12} /> Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => setView('tasks')}
                        className="h-8 px-3 rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] text-[var(--color-primary-hex)] text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
                      >
                        <ExternalLink size={12} /> Tasks
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: LIST VIEW (Tabular) */}
          {viewMode === 'list' && (
            <DataTable<Member>
              data={filteredMembers}
              columns={memberColumns}
              pagination={pagination}
              itemLabel="members"
              minWidth="min-w-[850px]"
            />
          )}

          {/* VIEW MODE 3: COMPACT VIEW (Avatar Roster) */}
          {viewMode === 'compact' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredMembers.map((m, i) => {
                const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div
                    key={m.id}
                    onClick={() => handleOpenEditModal(m)}
                    className="card p-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs text-center flex flex-col items-center gap-2 hover:border-[var(--color-primary-hex)] transition-colors cursor-pointer active:scale-95 group"
                  >
                    <div className={clsx(
                      "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs group-hover:scale-105 transition-transform",
                      AVATAR_COLORS[i % AVATAR_COLORS.length]
                    )}>
                      {initials}
                    </div>
                    <div className="w-full truncate">
                      <div className="font-bold text-xs text-[var(--color-text)] truncate">{m.name}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)] truncate">{m.role || 'Member'}</div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-muted)]">
                      {m.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {filteredMembers.length === 0 && (
            <div className="p-12 text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-divider)] text-[var(--color-text-muted)] space-y-2">
              <Users size={32} className="mx-auto text-[var(--color-text-faint)]" />
              <div className="font-bold text-sm text-[var(--color-text)]">No team members matched your filter criteria</div>
              <p className="text-xs text-[var(--color-text-muted)]">Try adjusting your search query or reset filters.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setRoleFilter('all'); setStatusFilter('all'); }}
                className="mt-2 text-xs text-[var(--color-primary-hex)] font-semibold underline cursor-pointer"
              >
                Reset Search & Filters
              </button>
            </div>
          )}

        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4: TEAM PERFORMANCE SCORECARD
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-divider)] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <BarChart2 size={16} className="text-[var(--color-primary-hex)]" />
                <span>Team Performance Scorecard</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">Ranked leaderboard — completion, cycle time, on-time delivery & health</p>
            </div>
            <span className="text-xs font-mono text-[var(--color-text-faint)]">Click headers to sort</span>
          </div>

          <DataTable<ScorecardRow>
            data={scorecardData}
            columns={scorecardColumns}
            sortField={scorecardSortCol}
            sortAsc={scorecardSortDir > 0}
            onSort={(col) => {
              if (scorecardSortCol === col) {
                setScorecardSortDir(d => -d);
              } else {
                setScorecardSortCol(col);
                setScorecardSortDir(1);
              }
            }}
            showRowNumbers={false}
            minWidth="min-w-[760px]"
            density="compact"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5: WORKLOAD BALANCE & EXECUTION EFFICIENCY
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-divider)] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <BarChart2 size={16} className="text-[var(--color-primary-hex)]" />
                <span>Workload Balance & Execution Efficiency</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">Assigned vs Completed vs Overdue effort distribution</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Sort by:</span>
              <select
                value={workloadSortBy}
                onChange={(e: any) => setWorkloadSortBy(e.target.value)}
                className="h-8 px-2.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] rounded-xl text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="assigned_desc">Assigned Effort (High → Low)</option>
                <option value="assigned_asc">Assigned Effort (Low → High)</option>
                <option value="efficiency_desc">Efficiency % (High → Low)</option>
                <option value="overdue_desc">Overdue Baggage (High → Low)</option>
                <option value="name_asc">Name (A → Z)</option>
              </select>
            </div>
          </div>

          {/* Operational Insights Banner */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] text-xs">
            <div className="font-bold text-[var(--color-primary-hex)] uppercase flex items-center gap-1">
              <TrendingUp size={13} /> Telemetry Insights:
            </div>
            {workloadData.highestEfficiencyMem && (
              <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                <span>🏆 Most Efficient: <strong className="text-[var(--color-text)]">{workloadData.highestEfficiencyMem}</strong> ({Math.round(workloadData.highestEfficiencyPct * 100)}%)</span>
              </div>
            )}
            {workloadData.highestEffortMem && (
              <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                <span>⚡ Highest Load: <strong className="text-[var(--color-text)]">{workloadData.highestEffortMem}</strong> ({workloadData.highestEffortVal.toFixed(1)}d)</span>
              </div>
            )}
            {workloadData.highestOverdueMem && (
              <div className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <span>⚠️ Overdue Baggage: <strong>{workloadData.highestOverdueMem}</strong> ({workloadData.highestOverdueVal.toFixed(1)}d)</span>
              </div>
            )}
          </div>

          {/* Stacked Workload Bar Chart Container */}
          <div className="space-y-3">
            {workloadData.items.map((item, idx) => {
              const maxAssigned = Math.max(...workloadData.items.map(x => x.assigned), 1);
              const totalPct = Math.min(100, Math.round((item.assigned / maxAssigned) * 100));
              const donePct = item.assigned > 0 ? (item.completed / item.assigned) * 100 : 0;
              const inProgPct = item.assigned > 0 ? (item.inProgress / item.assigned) * 100 : 0;
              const overduePct = item.assigned > 0 ? (item.overdue / item.assigned) * 100 : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[var(--color-text)] truncate">{item.name}</span>
                      <span className="text-[10px] text-[var(--color-text-faint)] truncate">({item.role})</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-[var(--color-text)] shrink-0">
                      {item.assigned.toFixed(1)}d <span className="text-[10px] font-normal text-[var(--color-text-faint)]">({Math.round(item.compRate * 100)}% done)</span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-[var(--color-surface-offset)] rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300" 
                      style={{ width: `${(donePct * totalPct) / 100}%` }}
                      title={`Completed: ${item.completed.toFixed(1)}d`}
                    />
                    <div 
                      className="h-full bg-[var(--color-primary-hex)] transition-all duration-300" 
                      style={{ width: `${(inProgPct * totalPct) / 100}%` }}
                      title={`Active In-Progress: ${item.inProgress.toFixed(1)}d`}
                    />
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300" 
                      style={{ width: `${(overduePct * totalPct) / 100}%` }}
                      title={`Overdue: ${item.overdue.toFixed(1)}d`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--color-divider)] text-[11px] text-[var(--color-text-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>Completed Effort</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[var(--color-primary-hex)]" />
              <span>Active In-Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500" />
              <span>Overdue Baggage</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 6: PREDICTIVE CAPACITY SHORTFALLS
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--color-divider)] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <AlertTriangle size={16} className={clsx(capacityShortfalls.length > 0 ? "text-rose-500" : "text-emerald-500")} />
                <span>Predictive Capacity Shortfalls (12-Week Radar)</span>
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">Scans upcoming weeks to identify sprints where task effort exceeds net capacity</p>
            </div>
            <span className="text-xs font-mono font-bold text-[var(--color-primary-hex)]">
              {capacityShortfalls.length} Deficit Sprints
            </span>
          </div>

          {capacityShortfalls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {capacityShortfalls.map((sf, idx) => (
                <div key={idx} className="p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] border-l-4 border-l-rose-500 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--color-text)]">{sf.label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold text-[10px] border border-rose-500/20">
                      Deficit: {sf.weekDeficit.toFixed(1)}d
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    {sf.overloadedMembers.map((om, oIdx) => (
                      <div key={oIdx} className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-[var(--color-text)] truncate">{om.name}</span>
                        <span className="font-mono text-rose-500 font-bold">+{om.deficit.toFixed(1)}d over</span>
                      </div>
                    ))}
                  </div>

                  {sf.bottleneckTasks.length > 0 && (
                    <div className="text-[10px] text-[var(--color-text-faint)] bg-[var(--color-surface)] p-2 rounded-lg border border-[var(--color-divider)] truncate">
                      Bottlenecks: {sf.bottleneckTasks.map(t => t.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="font-bold text-xs text-[var(--color-text)]">Zero Capacity Shortfalls Detected</h4>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
                All scheduled work aligns within safe operating capacity limits across the 12-week horizon.
              </p>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 7: SKILLS & ROLE COVERAGE MATRIX
           ══════════════════════════════════════════════════════════ */}
        <div className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-divider)] shadow-xs space-y-4">
          <div className="border-b border-[var(--color-divider)] pb-3">
            <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
              <Briefcase size={16} className="text-[var(--color-primary-hex)]" />
              <span>Skills & Role Coverage Matrix</span>
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">Core architectural and framework competencies across team members</p>
          </div>

          <DataTable<Member>
            data={members}
            columns={skillsColumns}
            showRowNumbers={false}
            minWidth="min-w-[700px]"
            density="compact"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 8: INTERACTIVE ORGANIZATION HIERARCHY TREE
           ══════════════════════════════════════════════════════════ */}
        <MemberHierarchy />

      </div>

      {/* ══════════════════════════════════════════════════════════
          ADD / EDIT MEMBER MODAL DIALOG
         ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isModalOpen && editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl max-h-[90vh] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text)]">
                      {editingMember.id ? `Edit Member: ${editingMember.name}` : 'Enroll New Team Member'}
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Configure profile, skills, and reporting structure</p>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-offset)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editingMember.name || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      placeholder="e.g. Alex Rivera"
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={editingMember.empId || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, empId: e.target.value })}
                      placeholder="e.g. NX-1010"
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Role / Job Title</label>
                    <input
                      type="text"
                      value={editingMember.role || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                      placeholder="e.g. Staff Software Engineer"
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Status</label>
                    <select
                      value={editingMember.status || 'Active'}
                      onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value })}
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Serving Notice Period">Serving Notice Period</option>
                      <option value="Other Assignment">Other Assignment</option>
                      <option value="Departed">Departed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Email</label>
                    <input
                      type="email"
                      value={editingMember.email || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                      placeholder="member@projectpulse.io"
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Phone</label>
                    <input
                      type="text"
                      value={editingMember.phone || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      placeholder="+1-555-0199"
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Reports To</label>
                    <select
                      value={editingMember.reportsTo || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, reportsTo: e.target.value })}
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none cursor-pointer"
                    >
                      <option value="">No Direct Manager (Top Root)</option>
                      {members.filter(m => m.id !== editingMember.id).map(m => (
                        <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Location</label>
                    <input
                      type="text"
                      value={editingMember.location || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                      placeholder="e.g. San Francisco, CA / Remote"
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Birthday</label>
                    <input
                      type="text"
                      value={editingMember.birthday || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, birthday: e.target.value })}
                      placeholder="e.g. 15 Nov"
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Join Date</label>
                    <input
                      type="date"
                      value={editingMember.joinDate || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, joinDate: e.target.value })}
                      className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none cursor-pointer font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingMember.skills) ? editingMember.skills.join(', ') : (editingMember.skills || '')}
                    onChange={(e) => setEditingMember({ ...editingMember, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="e.g. TypeScript, React, Go, Microservices"
                    className="w-full h-9 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)]"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-between">
                <div>
                  {editingMember.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMemberConfirmed(editingMember.id!, editingMember.name || 'Member')}
                      className="h-9 px-3 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} /> Delete Member
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="h-9 px-4 rounded-xl border border-[var(--color-divider)] text-[var(--color-text)] text-xs font-semibold hover:bg-[var(--color-surface-offset)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMemberForm}
                    className="h-9 px-5 rounded-xl bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] text-xs font-semibold hover:opacity-95 shadow-sm transition-opacity cursor-pointer active:scale-95"
                  >
                    Save Member
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamView;
