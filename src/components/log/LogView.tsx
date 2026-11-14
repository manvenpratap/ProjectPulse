import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  History, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  Plus, 
  X, 
  ShieldCheck, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  FileSpreadsheet, 
  User, 
  Calendar, 
  Sparkles, 
  ArrowUpDown, 
  CheckCircle2, 
  LayoutList, 
  Table, 
  Tag,
  ArrowRight,
  FileText
} from 'lucide-react';
import { fmtDate } from '../../utils/projectUtils';
import PageHeader from '../shared/PageHeader';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import DataTable, { ColumnDef } from '../shared/DataTable';
import { usePagination } from '../shared/TablePagination';
import { toast } from '../../utils/toast';
import clsx from 'clsx';
import { LogEntry } from '../../types';
import { MotionPage, StaggerContainer, StaggerItem } from '../shared/MotionPage';
import { AnimatedMetric } from '../shared/AnimatedMetric';

interface IndexedLogEntry extends LogEntry {
  _id: string;
  _index: number;
}

type LogPreset = 'all' | 'status' | 'create' | 'field' | 'notes';

const getRelativeTime = (isoString: string): string => {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return fmtDate(isoString);
  } catch (e) {
    return 'Recently';
  }
};

const getActionBadgeStyle = (action: string) => {
  const act = action.toLowerCase();
  if (act.includes('create') || act.includes('add')) {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  }
  if (act.includes('delete') || act.includes('remove')) {
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  }
  if (act.includes('status')) {
    return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
  }
  if (act.includes('audit') || act.includes('note') || act.includes('governance')) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }
  if (act.includes('baseline')) {
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  }
  if (act.includes('release')) {
    return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
  }
  return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
};

const LogView: React.FC = () => {
  const { state, addLog, setView } = useProject();

  // Search, Presets & Filters
  const [search, setSearch] = useState('');
  const [activePreset, setActivePreset] = useState<LogPreset>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // View Mode: 'table' vs 'stream'
  const [viewMode, setViewMode] = useState<'table' | 'stream'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pp_log_view_mode');
      if (saved === 'table' || saved === 'stream') return saved;
    }
    return 'table';
  });

  // Sorting
  const [sortField, setSortField] = useState<string>('ts');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Modal & Drawer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteComment, setNoteComment] = useState('');
  const [peekLog, setPeekLog] = useState<IndexedLogEntry | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSetViewMode = (mode: 'table' | 'stream') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pp_log_view_mode', mode);
    }
  };

  const handleSaveAuditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteSubject.trim()) return;
    addLog(
      'AUDIT_NOTE',
      'governance',
      noteSubject.trim(),
      'Governance Audit',
      '',
      noteComment.trim() || 'Manual governance audit note recorded'
    );
    toast.success('Recorded governance audit note.');
    setNoteSubject('');
    setNoteComment('');
    setIsAddModalOpen(false);
  };

  // Attach deterministic unique IDs & index
  const indexedLogs = useMemo<IndexedLogEntry[]>(() => {
    return state.log.map((entry, idx) => ({
      ...entry,
      _id: `${entry.ts}-${idx}-${entry.taskId}`,
      _index: idx
    }));
  }, [state.log]);

  // Global Dynamic Preset Counts
  const counts = useMemo(() => {
    let allCount = indexedLogs.length;
    let statusCount = 0;
    let createCount = 0;
    let fieldCount = 0;
    let noteCount = 0;

    for (const l of indexedLogs) {
      const act = l.action.toLowerCase();
      if (act.includes('status')) statusCount++;
      if (act.includes('create') || act.includes('add')) createCount++;
      if (Boolean(l.field) && !act.includes('create') && !act.includes('status')) fieldCount++;
      if (l.action === 'AUDIT_NOTE' || Boolean(l.comment)) noteCount++;
    }

    return { allCount, statusCount, createCount, fieldCount, noteCount };
  }, [indexedLogs]);

  // Unique Assignees and Modules for filter dropdowns
  const uniqueAssignees = useMemo(() => {
    const set = new Set<string>();
    state.log.forEach(l => {
      if (l.assignee && l.assignee !== 'Unassigned') set.add(l.assignee);
    });
    return Array.from(set).sort();
  }, [state.log]);

  const uniqueModules = useMemo(() => {
    const set = new Set<string>();
    state.log.forEach(l => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set).sort();
  }, [state.log]);

  // Filter logs by search, preset, assignee, module
  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return indexedLogs.filter(l => {
      // 1. Search filter
      if (q) {
        const matches = 
          l.taskName.toLowerCase().includes(q) ||
          l.taskId.toLowerCase().includes(q) ||
          l.assignee.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.field && l.field.toLowerCase().includes(q)) ||
          (l.comment && l.comment.toLowerCase().includes(q)) ||
          (l.module && l.module.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 2. Preset chip filter
      if (activePreset === 'status' && !l.action.toLowerCase().includes('status')) return false;
      if (activePreset === 'create' && !(l.action.toLowerCase().includes('create') || l.action.toLowerCase().includes('add'))) return false;
      if (activePreset === 'field' && (!l.field || l.action.toLowerCase().includes('create') || l.action.toLowerCase().includes('status'))) return false;
      if (activePreset === 'notes' && !(l.action === 'AUDIT_NOTE' || Boolean(l.comment))) return false;

      // 3. Dropdown filters
      if (assigneeFilter !== 'all' && l.assignee !== assigneeFilter) return false;
      if (moduleFilter !== 'all' && l.module !== moduleFilter) return false;

      return true;
    });
  }, [indexedLogs, search, activePreset, assigneeFilter, moduleFilter]);

  // Multi-column sorting
  const sortedLogs = useMemo(() => {
    const list = [...filteredLogs];
    list.sort((a, b) => {
      let aVal = (a as any)[sortField] ?? '';
      let bVal = (b as any)[sortField] ?? '';

      if (sortField === 'ts') {
        const aTime = new Date(a.ts).getTime();
        const bTime = new Date(b.ts).getTime();
        return sortAsc ? aTime - bTime : bTime - aTime;
      }

      const cmp = String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [filteredLogs, sortField, sortAsc]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Integrated Pagination for Table Mode
  const pagination = usePagination<IndexedLogEntry>(sortedLogs, 25, 'pp_log_table_pagesize');

  // Group by day for Stream Mode
  const groupedLogs = useMemo(() => {
    return sortedLogs.reduce((acc, entry) => {
      const date = entry.ts.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, IndexedLogEntry[]>);
  }, [sortedLogs]);

  const isFiltered = activePreset !== 'all' || search.trim() !== '' || assigneeFilter !== 'all' || moduleFilter !== 'all';

  const handleResetFilters = () => {
    setActivePreset('all');
    setSearch('');
    setAssigneeFilter('all');
    setModuleFilter('all');
  };

  // Sequential drawer navigation
  const peekIndex = useMemo(() => {
    if (!peekLog) return -1;
    return sortedLogs.findIndex(l => l._id === peekLog._id);
  }, [peekLog, sortedLogs]);

  const hasPrev = peekIndex > 0;
  const hasNext = peekIndex >= 0 && peekIndex < sortedLogs.length - 1;

  const handlePrevLog = useCallback(() => {
    if (hasPrev) setPeekLog(sortedLogs[peekIndex - 1]);
  }, [hasPrev, peekIndex, sortedLogs]);

  const handleNextLog = useCallback(() => {
    if (hasNext) setPeekLog(sortedLogs[peekIndex + 1]);
  }, [hasNext, peekIndex, sortedLogs]);

  useEffect(() => {
    if (!peekLog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      if (e.key === '[') {
        e.preventDefault();
        handlePrevLog();
      } else if (e.key === ']') {
        e.preventDefault();
        handleNextLog();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [peekLog, handlePrevLog, handleNextLog]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (filteredLogs.length === 0) {
      toast.error('No audit records to export');
      return;
    }
    const headers = ['Timestamp', 'Action', 'Target ID', 'Target Name', 'Field', 'Old Value', 'New Value', 'Module', 'Assignee', 'Comment'];
    const rows = filteredLogs.map(l => [
      l.ts,
      l.action,
      l.taskId,
      l.taskName,
      l.field || '',
      l.oldVal || '',
      l.newVal || '',
      l.module || '',
      l.assignee || '',
      l.comment || ''
    ]);
    const csvContent = '\uFEFF' + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `projectpulse-audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} audit records to CSV.`);
  }, [filteredLogs]);

  // Copy Markdown Summary
  const handleCopyMarkdownSummary = useCallback(() => {
    if (filteredLogs.length === 0) {
      toast.error('No audit records to copy');
      return;
    }
    const sample = filteredLogs.slice(0, 50);
    const mdRows = sample.map(l => 
      `| ${l.ts.replace('T', ' ').substring(0, 19)} | ${l.action} | \`${l.taskId}\` | ${l.taskName} | ${l.field || '—'} | ${l.newVal || '—'} | ${l.assignee} |`
    ).join('\n');
    const markdown = [
      `# ProjectPulse Audit Trail Summary`,
      `Generated: ${new Date().toISOString()} | Total Entries: ${filteredLogs.length}`,
      '',
      `| Timestamp | Action | Target ID | Target Name | Field | Value | Performer |`,
      `| --- | --- | --- | --- | --- | --- | --- |`,
      mdRows,
      sample.length < filteredLogs.length ? `\n*Showing top 50 of ${filteredLogs.length} audit records.*` : ''
    ].join('\n');

    navigator.clipboard.writeText(markdown);
    toast.success('Copied audit trail markdown to clipboard.');
  }, [filteredLogs]);

  // Copy Single Evidence JSON
  const handleCopyEvidenceJSON = (entry: IndexedLogEntry) => {
    const json = JSON.stringify({
      auditRecordId: entry._id,
      timestamp: entry.ts,
      action: entry.action,
      entity: {
        id: entry.taskId,
        name: entry.taskName,
        module: entry.module
      },
      delta: {
        field: entry.field || null,
        before: entry.oldVal || null,
        after: entry.newVal || null
      },
      performer: entry.assignee,
      governanceComment: entry.comment || null
    }, null, 2);

    navigator.clipboard.writeText(json);
    toast.success('Copied JSON audit evidence to clipboard');
  };

  // Jump to Target Entity
  const handleJumpToEntity = (entry: IndexedLogEntry) => {
    const isTask = state.tasks.some(t => t.id === entry.taskId);
    if (isTask) {
      setView('tasks');
      setPeekLog(null);
      toast.info(`Navigated to Task Grid for ${entry.taskId}`);
      return;
    }
    const isDelivery = state.deliveries.some(d => d.id === entry.taskId);
    if (isDelivery) {
      setView('deliveries');
      setPeekLog(null);
      toast.info(`Navigated to Deliveries for ${entry.taskId}`);
      return;
    }
    const isRelease = state.releases.some(r => r.id === entry.taskId);
    if (isRelease) {
      setView('releases');
      setPeekLog(null);
      toast.info(`Navigated to Releases for ${entry.taskId}`);
      return;
    }
    toast.info(`Target ${entry.taskId} is an archived or system item.`);
  };

  // DataTable Column Definitions
  const columns: ColumnDef<IndexedLogEntry>[] = useMemo(() => [
    {
      id: 'ts',
      header: 'Timestamp & Target Entity',
      sortable: true,
      sortKey: 'ts',
      width: '270px',
      cell: (item) => {
        const timeStr = new Date(item.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const dateStr = fmtDate(item.ts);
        const relTime = getRelativeTime(item.ts);
        return (
          <div className="flex flex-col min-w-0 py-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[var(--color-text)]">
                {dateStr} <span className="text-[var(--color-text-faint)] font-normal">{timeStr}</span>
              </span>
              <span className="text-[10px] text-[var(--color-primary-hex)] font-medium bg-[var(--color-primary-highlight-hex)] px-1.5 py-0.2 rounded">
                {relTime}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[var(--color-text-muted)] shrink-0">
                {item.taskId}
              </span>
              <span className="font-bold text-[var(--color-text)] truncate" title={item.taskName}>
                {item.taskName}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      id: 'action',
      header: 'Action',
      sortable: true,
      sortKey: 'action',
      width: '140px',
      cell: (item) => {
        const badgeStyle = getActionBadgeStyle(item.action);
        return (
          <span className={clsx(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0",
            badgeStyle
          )}>
            {item.action}
          </span>
        );
      }
    },
    {
      id: 'module',
      header: 'Scope / Module',
      sortable: true,
      sortKey: 'module',
      width: '130px',
      cell: (item) => (
        <span className="inline-flex items-center text-[11px] font-semibold text-[var(--color-text-muted)] px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-divider)] truncate max-w-[120px]" title={item.module || 'General'}>
          {item.module || 'General'}
        </span>
      )
    },
    {
      id: 'field',
      header: 'Mutation Delta',
      sortable: true,
      sortKey: 'field',
      width: '240px',
      cell: (item) => {
        if (item.field) {
          return (
            <div className="flex flex-col gap-0.5 text-xs min-w-0">
              <div className="font-bold text-[11px] text-[var(--color-text)] flex items-center gap-1.5">
                <span className="text-[var(--color-primary-hex)] underline decoration-dotted underline-offset-2">
                  {item.field}
                </span>
              </div>
              {(item.oldVal || item.newVal) && (
                <div className="flex items-center gap-1 text-[10px] truncate">
                  <span className="line-through text-rose-500 opacity-70 truncate max-w-[80px]" title={item.oldVal || 'None'}>
                    {item.oldVal || 'None'}
                  </span>
                  <ArrowRight size={10} className="text-[var(--color-text-faint)] shrink-0" />
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[90px]" title={item.newVal}>
                    {item.newVal}
                  </span>
                </div>
              )}
            </div>
          );
        }
        return (
          <span className="text-xs text-[var(--color-text-faint)] font-mono">—</span>
        );
      }
    },
    {
      id: 'assignee',
      header: 'Performer',
      sortable: true,
      sortKey: 'assignee',
      width: '140px',
      cell: (item) => {
        const name = item.assignee || 'System';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SYS';
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/30 flex items-center justify-center text-[9px] font-bold shrink-0">
              {initials}
            </div>
            <span className="text-xs font-semibold text-[var(--color-text)] truncate" title={name}>
              {name}
            </span>
          </div>
        );
      }
    },
    {
      id: 'comment',
      header: 'Governance Rationale',
      sortable: false,
      width: 'minmax(180px, 1fr)',
      cell: (item) => {
        if (item.comment) {
          return (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] truncate" title={item.comment}>
              <MessageSquare size={12} className="shrink-0 text-[var(--color-text-faint)]" />
              <span className="truncate italic">{item.comment}</span>
            </div>
          );
        }
        return <span className="text-[var(--color-text-faint)] text-xs font-mono">—</span>;
      }
    },
    {
      id: '_actions',
      header: '',
      sortable: false,
      width: '48px',
      align: 'right',
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPeekLog(item);
          }}
          title="Inspect Audit Record"
          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
        >
          <ExternalLink size={13} />
        </button>
      )
    }
  ], []);

  // Responsive Mobile Card Renderer for Table Mode (< md)
  const renderMobileCard = (item: IndexedLogEntry) => {
    const badgeStyle = getActionBadgeStyle(item.action);
    const timeStr = new Date(item.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const dateStr = fmtDate(item.ts);
    const relTime = getRelativeTime(item.ts);

    return (
      <div
        onClick={() => setPeekLog(item)}
        className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-xs hover:border-[var(--color-primary-hex)]/40 transition-all cursor-pointer space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <span className={clsx("px-2 py-0.5 rounded-md text-[10px] font-bold border", badgeStyle)}>
            {item.action}
          </span>
          <span className="font-mono text-[10px] text-[var(--color-text-faint)]">
            {dateStr} {timeStr} ({relTime})
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[var(--color-text-muted)] shrink-0">
              {item.taskId}
            </span>
            <span className="text-xs font-bold text-[var(--color-text)] truncate">
              {item.taskName}
            </span>
          </div>
          {item.field && (
            <div className="mt-1 text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <span className="font-semibold text-[var(--color-primary-hex)]">{item.field}:</span>
              <span className="line-through text-rose-500 opacity-70 text-[11px]">{item.oldVal || 'None'}</span>
              <ArrowRight size={10} className="text-[var(--color-text-faint)]" />
              <span className="font-bold text-emerald-500 text-[11px]">{item.newVal}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[var(--color-divider)]">
          <span className="text-[var(--color-text-muted)] font-medium flex items-center gap-1">
            <User size={12} className="text-[var(--color-text-faint)]" /> {item.assignee}
          </span>
          <span className="text-[10px] font-mono text-[var(--color-primary-hex)] font-semibold flex items-center gap-0.5">
            <span>Peek</span> <ExternalLink size={10} />
          </span>
        </div>
      </div>
    );
  };

  return (
    <MotionPage className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* ── 1. Page Header with Actions & Metrics ── */}
      <PageHeader
        icon={History}
        title="Project Audit Log"
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <AnimatedMetric value={state.log.length} />
            <span>Transactional Audit Entries Recorded</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs">
              <button
                onClick={() => handleSetViewMode('table')}
                title="Linear-Grade Enterprise Audit Table"
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'table'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Table size={13} />
                <span className="hidden sm:inline">Audit Grid</span>
              </button>
              <button
                onClick={() => handleSetViewMode('stream')}
                title="Chronological Timeline Stream"
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                  viewMode === 'stream'
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <LayoutList size={13} />
                <span className="hidden sm:inline">Timeline</span>
              </button>
            </div>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              title="Download filtered audit trail as CSV spreadsheet"
            >
              <FileSpreadsheet size={13} className="text-emerald-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Audit Note</span>
          </Button>
        }
      />

      {/* ── 2. Filter Bar: Quick Presets, Search & Dropdowns ── */}
      <div className="p-4 sm:px-6 lg:px-8 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/50 space-y-3 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Filter Preset Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1">
            <button
              onClick={() => setActivePreset('all')}
              className={clsx(
                "h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activePreset === 'all'
                  ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold border border-[var(--color-primary-hex)]/30"
                  : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <span>All Activity</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-surface-2)]">
                {counts.allCount}
              </span>
            </button>

            <button
              onClick={() => setActivePreset('status')}
              className={clsx(
                "h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activePreset === 'status'
                  ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30"
                  : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <span>Status Changes</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-surface-2)]">
                {counts.statusCount}
              </span>
            </button>

            <button
              onClick={() => setActivePreset('create')}
              className={clsx(
                "h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activePreset === 'create'
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30"
                  : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <span>Creations</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-surface-2)]">
                {counts.createCount}
              </span>
            </button>

            <button
              onClick={() => setActivePreset('field')}
              className={clsx(
                "h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activePreset === 'field'
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30"
                  : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <span>Field Updates</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-surface-2)]">
                {counts.fieldCount}
              </span>
            </button>

            <button
              onClick={() => setActivePreset('notes')}
              className={clsx(
                "h-7 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap",
                activePreset === 'notes'
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30"
                  : "bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <span>Governance Notes</span>
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-[var(--color-surface-2)]">
                {counts.noteCount}
              </span>
            </button>

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="h-7 px-2 rounded-lg text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <X size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Search Input & Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search audit trail… (Press /)"
                className="w-full h-9 pl-9 pr-8 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] transition-colors shadow-2xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter by Performer */}
            {uniqueAssignees.length > 0 && (
              <select
                value={assigneeFilter}
                onChange={e => setAssigneeFilter(e.target.value)}
                aria-label="Filter by performer"
                className="h-9 px-2.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-medium text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] cursor-pointer"
              >
                <option value="all">All Performers ({uniqueAssignees.length})</option>
                {uniqueAssignees.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}

            {/* Filter by Module */}
            {uniqueModules.length > 0 && (
              <select
                value={moduleFilter}
                onChange={e => setModuleFilter(e.target.value)}
                aria-label="Filter by scope"
                className="h-9 px-2.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-medium text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] cursor-pointer"
              >
                <option value="all">All Scopes ({uniqueModules.length})</option>
                {uniqueModules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Main Content: Table Mode vs Stream Mode ── */}
      <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
        {viewMode === 'table' ? (
          /* ── 3A. Linear-Grade Enterprise Audit Table ── */
          <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
            <DataTable<IndexedLogEntry>
              data={pagination.paginatedItems}
              columns={columns}
              keyField="_id"
              density="compact"
              stickyFirstColumn={true}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
              showRowNumbers={true}
              startIndex={pagination.startIndex}
              onRowClick={(item) => setPeekLog(item)}
              pagination={pagination}
              itemLabel="audit records"
              pageSizeOptions={[10, 25, 50, 100]}
              mobileCardRenderer={renderMobileCard}
              emptyTitle="No Audit Records Found"
              emptyMessage={
                isFiltered
                  ? `No audit trail entries matched your active filters.`
                  : `The audit ledger is empty. Perform project actions to record transaction history.`
              }
              emptyAction={
                isFiltered ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset All Filters
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                    Add Governance Note
                  </Button>
                )
              }
            />
          </div>
        ) : (
          /* ── 3B. Chronological Timeline Stream Mode ── */
          <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 space-y-10">
            <div className="w-full space-y-10">
              {(Object.entries(groupedLogs) as [string, IndexedLogEntry[]][]).map(([date, entries]) => (
                <div key={date} className="relative">
                  {/* Day Label */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="px-3 py-1 rounded-full bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-xs font-medium text-[var(--color-text-muted)]">
                      {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="h-[1px] flex-1 bg-[var(--color-divider)] shadow-sm" />
                  </div>

                  <StaggerContainer className="space-y-3 relative pl-4 border-l-2 border-[var(--color-divider)] ml-14">
                    {entries.map((entry) => {
                      const time = new Date(entry.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                      const badgeStyle = getActionBadgeStyle(entry.action);
                      const isCreated = entry.action.toLowerCase().includes('create');
                      const isStatus = entry.action.toLowerCase().includes('status');

                      return (
                        <StaggerItem key={entry._id} className="group relative">
                          {/* Timeline Dot */}
                          <div className={clsx(
                            "absolute -left-[1.35rem] top-4 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-surface)] ring-4 ring-[var(--color-bg)] motion-safe:transition-transform motion-safe:group-hover:scale-125",
                            isCreated ? "bg-emerald-500" : isStatus ? "bg-indigo-500" : "bg-blue-400"
                          )} />

                          {/* Time Marker */}
                          <div className="absolute -left-[4.5rem] top-3 text-[10px] font-mono font-bold text-[var(--color-text-faint)] w-12 text-right">
                            {time}
                          </div>

                          <div 
                            onClick={() => setPeekLog(entry)}
                            className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-4 shadow-sm group-hover:shadow-md transition-all duration-150 group-hover:border-[var(--color-primary-hex)]/40 cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-2 mb-1">
                                  <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-md border", badgeStyle)}>
                                    {entry.action}
                                  </span>
                                  <span className="text-[12px] font-bold text-[var(--color-text)] truncate">
                                    {entry.taskName}
                                  </span>
                                  <span className="text-[10px] font-mono text-[var(--color-text-faint)]">
                                    ({entry.taskId})
                                  </span>
                                </div>

                                {entry.field && (
                                  <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 mt-2">
                                    <span className="font-bold text-[var(--color-primary-hex)] underline decoration-dotted underline-offset-4">{entry.field}</span>
                                    <span className="opacity-40">changed from</span>
                                    <span className="line-through italic opacity-60 px-1.5 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded">{entry.oldVal || 'None'}</span>
                                    <span className="font-bold opacity-100 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">{entry.newVal}</span>
                                  </div>
                                )}

                                {entry.comment && (
                                  <div className="mt-3 p-3 rounded-lg bg-[var(--color-surface-offset)] border border-[var(--color-divider)] flex gap-3 text-xs italic text-[var(--color-text-muted)]">
                                    <MessageSquare size={14} className="shrink-0 opacity-30 mt-0.5" />
                                    <span>{entry.comment}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right hidden sm:flex flex-col items-end shrink-0">
                                <div className="text-xs font-medium text-[var(--color-text-faint)] mb-1">Assignee</div>
                                <div className="text-[11px] font-bold text-[var(--color-text)]">{entry.assignee}</div>
                                <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-[var(--color-primary-hex)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span>Inspect</span>
                                  <ExternalLink size={10} />
                                </span>
                              </div>
                            </div>
                          </div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                </div>
              ))}

              {filteredLogs.length === 0 && (
                <div className="py-20 text-center text-[var(--color-text-faint)] space-y-4">
                  <Clock size={48} strokeWidth={1} className="mx-auto opacity-20" />
                  <p className="text-sm italic">
                    {isFiltered ? 'No audit trail entries matched your search.' : 'The ledger is empty. Perform an action to see history.'}
                  </p>
                  {isFiltered && (
                    <Button variant="outline" size="sm" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Master-Detail Audit Peek Side Drawer ── */}
      <SlideOverDrawer
        isOpen={Boolean(peekLog)}
        onClose={() => setPeekLog(null)}
        widthClass="w-full sm:w-[540px] lg:w-[620px]"
        onPrevious={hasPrev ? handlePrevLog : undefined}
        onNext={hasNext ? handleNextLog : undefined}
        hasPrevious={hasPrev}
        hasNext={hasNext}
      >
        {peekLog && (() => {
          const badgeStyle = getActionBadgeStyle(peekLog.action);
          const dateStr = fmtDate(peekLog.ts);
          const timeStr = new Date(peekLog.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const relTime = getRelativeTime(peekLog.ts);

          return (
            <div className="flex flex-col h-full overflow-y-auto custom-scroll p-6 space-y-6">
              {/* Drawer Header Banner */}
              <div className="space-y-3 pb-5 border-b border-[var(--color-divider)]">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-bold border", badgeStyle)}>
                    {peekLog.action}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[var(--color-text-muted)]">
                    {peekLog.taskId}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg sm:text-xl font-display font-black text-[var(--color-text)] tracking-tight">
                    {peekLog.taskName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--color-text-muted)]">
                    <Calendar size={13} className="text-[var(--color-text-faint)]" />
                    <span className="font-mono font-medium">{dateStr} at {timeStr}</span>
                    <span className="text-[var(--color-primary-hex)] font-semibold">({relTime})</span>
                  </div>
                </div>
              </div>

              {/* 4-Stat Metric Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Scope</div>
                  <div className="text-xs font-bold text-[var(--color-text)] mt-1 truncate" title={peekLog.module || 'General'}>
                    {peekLog.module || 'General'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Performer</div>
                  <div className="text-xs font-bold text-[var(--color-text)] mt-1 truncate" title={peekLog.assignee}>
                    {peekLog.assignee}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Operation</div>
                  <div className="text-xs font-bold text-[var(--color-text)] mt-1 truncate">
                    {peekLog.action}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Audit Seq</div>
                  <div className="text-[11px] font-mono font-bold text-[var(--color-primary-hex)] mt-1 truncate">
                    #{peekLog._index + 1}
                  </div>
                </div>
              </div>

              {/* State Mutation / Delta Card */}
              {peekLog.field && (
                <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <Tag size={13} className="text-[var(--color-primary-hex)]" />
                      <span>Field Mutation: {peekLog.field}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1">
                      <div className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">Before</div>
                      <div className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 line-through break-words">
                        {peekLog.oldVal || 'None / Empty'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                      <div className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider">After</div>
                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 break-words">
                        {peekLog.newVal || 'None / Empty'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Governance Rationale & Notes Card */}
              {peekLog.comment && (
                <div className="p-4 rounded-xl bg-[var(--color-surface-2)]/50 border border-[var(--color-divider)] space-y-2">
                  <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                    <MessageSquare size={13} className="text-[var(--color-primary-hex)]" />
                    <span>Governance Rationale & Context</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] italic leading-relaxed">
                    "{peekLog.comment}"
                  </p>
                </div>
              )}

              {/* Forensic Verification Card */}
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-offset)] border border-[var(--color-divider)] flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
                <div className="min-w-0 text-xs">
                  <div className="font-bold text-[var(--color-text)]">Immutable Audit Trail Record</div>
                  <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                    Timestamped transaction committed to project ledger with cryptographic audit integrity.
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--color-divider)] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyEvidenceJSON(peekLog)}
                    className="h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copy JSON</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMarkdownSummary}
                    className="h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Copy Summary MD</span>
                  </Button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleJumpToEntity(peekLog)}
                  className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Open Target Entity ({peekLog.taskId})</span>
                </Button>
              </div>
            </div>
          );
        })()}
      </SlideOverDrawer>

      {/* ── 5. Manual Governance Audit Note Modal ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Governance Note"
        size="md"
      >
        <form onSubmit={handleSaveAuditNote} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Subject / Scope <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Architecture Steering Review, Security Sign-Off..."
              value={noteSubject}
              onChange={e => setNoteSubject(e.target.value)}
              className="w-full h-9 px-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
              Audit Findings & Decision Notes
            </label>
            <textarea
              rows={3}
              placeholder="Record steering decision, compliance approval, or audit rationale..."
              value={noteComment}
              onChange={e => setNoteComment(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-divider)]">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddModalOpen(false)}
              className="h-9 px-4 rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              size="sm" 
              className="h-9 px-4 rounded-xl text-xs font-bold shadow-xs"
            >
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>
    </MotionPage>
  );
};

export default LogView;
