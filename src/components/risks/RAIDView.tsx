import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { RaidItem, Decision } from '../../types';
import { 
  ShieldAlert, 
  HelpCircle, 
  AlertTriangle, 
  Link, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle,
  FileText,
  User,
  Calendar,
  X,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import Modal from '../shared/Modal';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef } from '../shared/DataTable';

const RAIDView: React.FC = () => {
  const { state, updateProject, addLog } = useProject();
  const { raids = [], decisions = [], members = [] } = state;

  const [activeTab, setActiveTab] = useState<'all' | 'risks' | 'assumptions' | 'issues' | 'dependencies' | 'decisions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRaid, setSelectedRaid] = useState<RaidItem | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [isRaidOpen, setIsRaidOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [matrixFilter, setMatrixFilter] = useState<{ impact: string; prob: string } | null>(null);
  const [isMatrixExpandedMobile, setIsMatrixExpandedMobile] = useState(true);

  // Sorting state
  const [sortCol, setSortCol] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getTeamNames = () => members.filter(m => m.status === 'Active').map(m => m.name);

  // Normalization Helpers
  const normImpact = (val: string) => {
    const s = String(val || '').trim().toLowerCase();
    if (s === 'high' || s === 'critical' || s === 's1' || s === 's2' || s === 's1 - critical' || s === 's2 - major') return 'High';
    if (s === 'med' || s === 'medium' || s === 'moderate' || s === 's3' || s === 's3 - moderate') return 'Medium';
    if (s === 'low' || s === 'minor' || s === 's4' || s === 's4 - minor') return 'Low';
    return 'Medium';
  };

  const normProb = (val: string) => {
    const s = String(val || '').trim().toLowerCase();
    if (s === 'high' || s === 's1' || s === 's2') return 'High';
    if (s === 'med' || s === 'medium' || s === 'moderate' || s === 's3') return 'Medium';
    if (s === 'low' || s === 'minor' || s === 's4') return 'Low';
    return 'Medium';
  };

  const getCellCount = (imp: string, prb: string) => {
    return raids.filter(r => {
      const rImp = normImpact(r.impact);
      let rProb = r.probability;
      if (!rProb) {
        rProb = (r.type === 'Issue' || r.type === 'Dependency') ? 'High' : 'Medium';
      } else {
        rProb = normProb(rProb);
      }
      return rImp === imp && rProb === prb && (r.status === 'Active' || r.status === 'Identified');
    }).length;
  };

  const selectMatrixCell = (imp: string, prb: string) => {
    if (matrixFilter && matrixFilter.impact === imp && matrixFilter.prob === prb) {
      setMatrixFilter(null);
    } else {
      setMatrixFilter({ impact: imp, prob: prb });
    }
  };

  // Filter & Search RAID Items
  const getFilteredRaids = () => {
    let list = [...raids];

    if (activeTab !== 'all' && activeTab !== 'decisions') {
      const typeMap: Record<string, string> = {
        risks: 'Risk',
        assumptions: 'Assumption',
        issues: 'Issue',
        dependencies: 'Dependency'
      };
      list = list.filter(r => r.type === typeMap[activeTab]);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => 
        r.title.toLowerCase().includes(q) || 
        (r.desc || '').toLowerCase().includes(q) || 
        (r.owner || '').toLowerCase().includes(q) || 
        r.id.toLowerCase().includes(q)
      );
    }

    if (matrixFilter) {
      list = list.filter(r => {
        const rImp = normImpact(r.impact);
        let rProb = r.probability;
        if (!rProb) {
          rProb = (r.type === 'Issue' || r.type === 'Dependency') ? 'High' : 'Medium';
        } else {
          rProb = normProb(rProb);
        }
        return rImp === matrixFilter.impact && rProb === matrixFilter.prob;
      });
    }

    // Sorting
    return list.sort((a, b) => {
      let valA = a[sortCol as keyof RaidItem] || '';
      let valB = b[sortCol as keyof RaidItem] || '';
      
      if (sortCol === 'id') {
        const numA = parseInt(String(valA).replace(/\D/g, '')) || 0;
        const numB = parseInt(String(valB).replace(/\D/g, '')) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Filter & Search Decisions
  const getFilteredDecisions = () => {
    let list = [...decisions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.desc.toLowerCase().includes(q) || 
        (d.rationale || '').toLowerCase().includes(q) || 
        d.id.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const handleRaidSort = (col: string) => {
    if (sortCol === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortOrder('asc');
    }
  };

  const handleDeleteRaid = (id: string) => {
    if (confirm('Permanently delete this RAID register item?')) {
      const updated = raids.filter(r => r.id !== id);
      updateProject({ raids: updated });
      addLog('Deleted', id, 'RAID Item');
    }
  };

  const handleDeleteDecision = (id: string) => {
    if (confirm('Permanently delete this decision log entry?')) {
      const updated = decisions.filter(d => d.id !== id);
      updateProject({ decisions: updated });
      addLog('Deleted', id, 'Decision Log Entry');
    }
  };

  const handleOpenRaidModal = (item?: RaidItem) => {
    if (item) {
      setSelectedRaid({ ...item });
    } else {
      setSelectedRaid({
        id: '',
        type: 'Risk',
        title: '',
        desc: '',
        owner: getTeamNames()[0] || '',
        impact: 'High',
        probability: 'Medium',
        severity: 'S3 - Moderate',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Identified',
        mitigation: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setIsRaidOpen(true);
  };

  const handleSaveRaid = () => {
    if (!selectedRaid || !selectedRaid.title.trim()) return;

    const list = [...raids];
    const isEdit = !!selectedRaid.id;
    let finalItem = { ...selectedRaid, updatedAt: new Date().toISOString() };

    if (isEdit) {
      const idx = list.findIndex(r => r.id === selectedRaid.id);
      if (idx > -1) list[idx] = finalItem;
    } else {
      const nextId = state.nextRaidId || 1;
      finalItem.id = 'RAID-' + String(nextId).padStart(3, '0');
      list.push(finalItem);
      updateProject({ nextRaidId: nextId + 1 });
    }

    updateProject({ raids: list });
    addLog(isEdit ? 'Updated' : 'Created', finalItem.id, finalItem.title);
    setIsRaidOpen(false);
    setSelectedRaid(null);
  };

  const handleOpenDecisionModal = (item?: Decision) => {
    if (item) {
      setSelectedDecision({ ...item });
    } else {
      setSelectedDecision({
        id: '',
        title: '',
        desc: '',
        status: 'Pending Sign-off',
        impact: 'Medium',
        approver: getTeamNames()[0] || '',
        proposedBy: getTeamNames()[0] || '',
        rationale: '',
        alternatives: '',
        linkedTask: '',
        linkedMilestone: '',
        dueDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    setIsDecisionOpen(true);
  };

  const handleSaveDecision = () => {
    if (!selectedDecision || !selectedDecision.title.trim()) return;

    const list = [...decisions];
    const isEdit = !!selectedDecision?.id;
    let finalItem = { ...selectedDecision, title: selectedDecision?.title || '', status: selectedDecision?.status || 'Pending Sign-off' } as Decision;

    if (isEdit) {
      const idx = list.findIndex(d => d.id === selectedDecision?.id);
      if (idx > -1) list[idx] = finalItem;
    } else {
      const nextId = state.nextDecisionId || 1;
      finalItem.id = 'DEC-' + String(nextId).padStart(3, '0');
      list.push(finalItem);
      updateProject({ nextDecisionId: nextId + 1 });
    }

    updateProject({ decisions: list });
    addLog(isEdit ? 'Updated' : 'Created', finalItem.id, finalItem.title);
    setIsDecisionOpen(false);
    setSelectedDecision(null);
  };

  const activeFiltered = getFilteredRaids();
  const activeDecisions = getFilteredDecisions();

  const raidPagination = usePagination<RaidItem>(activeFiltered, 10, 'pp_page_size_raid');
  const decisionPagination = usePagination<Decision>(activeDecisions, 10, 'pp_page_size_decisions');

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'Risk':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/25';
      case 'Assumption':
        return 'text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/25';
      case 'Issue':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/25';
      default:
        return 'text-sky-500 bg-sky-500/10 border-sky-500/25';
    }
  };

  const getSeverityStyle = (sev: string) => {
    if (sev.includes('Critical') || sev.includes('S1')) {
      return 'bg-rose-500/15 text-rose-500 border border-rose-500/30';
    }
    if (sev.includes('Major') || sev.includes('S2')) {
      return 'bg-orange-500/15 text-orange-500 border border-orange-500/30';
    }
    return 'bg-amber-500/15 text-amber-500 border border-amber-500/30';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Closed' || status === 'Mitigated' || status === 'Approved') {
      return 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30';
    }
    if (status === 'Rejected' || status === 'Realized') {
      return 'bg-rose-500/15 text-rose-500 border border-rose-500/30';
    }
    return 'bg-amber-500/15 text-amber-500 border border-amber-500/30';
  };
  const decisionColumns: ColumnDef<Decision>[] = [
    {
      id: 'id',
      header: 'ID',
      headerTitle: 'Unique decision identifier (e.g. DEC-101)',
      width: 'w-20',
      cell: (d) => (
        <span className="font-mono font-bold text-xs text-[var(--color-primary-hex)] whitespace-nowrap">
          {d.id}
        </span>
      )
    },
    {
      id: 'title',
      header: 'Decision Title',
      headerTitle: 'Strategic steering decision topic and context',
      width: 'min-w-[280px]',
      cell: (d) => (
        <div className="flex items-center gap-1.5 min-w-0 max-w-[340px]">
          <span className="font-bold text-xs text-[var(--color-text)] truncate" title={d.title}>
            {d.title}
          </span>
          {d.desc && (
            <span className="text-[10px] text-[var(--color-text-muted)] truncate hidden xl:inline max-w-[180px] shrink-0" title={d.desc}>
              · {d.desc}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'owner',
      header: 'Owner / Approver',
      headerTitle: 'Accountable executive or steering lead',
      width: 'w-44',
      cell: (d) => (
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
          <span className="font-semibold text-[var(--color-text)]">{d.proposedBy}</span>
          <span className="text-[10px] text-[var(--color-text-faint)]">→ {d.approver}</span>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      headerTitle: 'Current decision sign-off state (Approved, Pending Sign-off, Rejected)',
      width: 'w-32',
      cell: (d) => (
        <span className={clsx("px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap inline-block", getStatusStyle(d.status))}>
          {d.status}
        </span>
      )
    },
    {
      id: 'dueDate',
      header: 'Target Date',
      headerTitle: 'Target resolution or review date',
      width: 'w-28',
      cell: (d) => (
        <span className="font-mono text-xs text-[var(--color-text-faint)] whitespace-nowrap">
          {d.dueDate}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 'w-20',
      align: 'right',
      cell: (d) => (
        <div className="flex gap-1 justify-end whitespace-nowrap" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => handleOpenDecisionModal(d)} 
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors inline-flex items-center justify-center cursor-pointer"
            aria-label={`Edit ${d.id}`}
          >
            <Edit2 size={13} />
          </button>
          <button 
            onClick={() => handleDeleteDecision(d.id)} 
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-faint)] hover:text-red-500 hover:bg-rose-500/10 transition-colors inline-flex items-center justify-center cursor-pointer"
            aria-label={`Delete ${d.id}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  const raidColumns: ColumnDef<RaidItem>[] = [
    {
      id: 'id',
      header: 'ID / Type',
      headerTitle: 'Identifier and RAID category: Risk, Assumption, Issue, or Dependency. Click to sort.',
      sortable: true,
      width: 'w-28',
      cell: (r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-mono font-bold text-xs text-[var(--color-primary-hex)]">{r.id}</span>
          <span className={clsx("px-1.5 py-0.2 rounded text-[10px] font-semibold border", getTypeStyle(r.type))}>{r.type}</span>
        </div>
      )
    },
    {
      id: 'title',
      header: 'Title & Context',
      headerTitle: 'Summary of the risk event or blocker condition. Click to sort.',
      sortable: true,
      width: 'min-w-[260px]',
      cell: (r) => (
        <div className="flex items-center gap-1.5 min-w-0 max-w-[320px]">
          <span className="font-bold text-xs text-[var(--color-text)] truncate" title={r.title}>
            {r.title}
          </span>
          {r.desc && (
            <span className="text-[10px] text-[var(--color-text-muted)] truncate hidden xl:inline max-w-[150px] shrink-0" title={r.desc}>
              · {r.desc}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'owner',
      header: 'Owner',
      headerTitle: 'Team member responsible for monitoring and mitigation. Click to sort.',
      sortable: true,
      width: 'w-32',
      cell: (r) => (
        <span className="text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap truncate block max-w-[120px]">
          {r.owner}
        </span>
      )
    },
    {
      id: 'impact',
      header: 'Impact / Prob',
      headerTitle: 'Consequence level (High/Medium/Low) and Probability score (1-5)',
      width: 'w-28',
      cell: (r) => (
        <span className="text-xs font-mono whitespace-nowrap">
          {r.impact} / {r.probability || 'N/A'}
        </span>
      )
    },
    {
      id: 'severity',
      header: 'Severity',
      headerTitle: 'Calculated risk severity score driving early warning indicators',
      width: 'w-24',
      cell: (r) => (
        <span className={clsx("px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap inline-block", getSeverityStyle(r.severity))}>
          {r.severity.split(' ')[0]}
        </span>
      )
    },
    {
      id: 'mitigation',
      header: 'Mitigation Plan',
      headerTitle: 'Preventive action and contingency plan to eliminate or absorb the threat',
      width: 'min-w-[200px]',
      cell: (r) => (
        <span className="text-xs text-[var(--color-text-muted)] max-w-xs truncate block" title={r.mitigation}>
          {r.mitigation}
        </span>
      )
    },
    {
      id: 'status',
      header: 'Status',
      headerTitle: 'Tracking status: Active, Mitigated, or Closed. Click to sort.',
      sortable: true,
      width: 'w-24',
      cell: (r) => (
        <span className={clsx("px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap inline-block", getStatusStyle(r.status))}>
          {r.status}
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 'w-20',
      align: 'right',
      cell: (r) => (
        <div className="flex gap-1 justify-end whitespace-nowrap" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => handleOpenRaidModal(r)} 
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors inline-flex items-center justify-center cursor-pointer"
            aria-label={`Edit ${r.id}`}
          >
            <Edit2 size={13} />
          </button>
          <button 
            onClick={() => handleDeleteRaid(r.id)} 
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-faint)] hover:text-red-500 hover:bg-rose-500/10 transition-colors inline-flex items-center justify-center cursor-pointer"
            aria-label={`Delete ${r.id}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];


  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={ShieldAlert}
        title="RAID Register"
        subtitle="Risks, Assumptions, Issues, Dependencies & Decisions"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleOpenDecisionModal()}
              className="min-h-[38px] px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer transition-transform"
              aria-label="Log Decision"
            >
              <FileText size={15} />
              <span className="hidden sm:inline">Log Decision</span>
              <span className="sm:hidden">Decision</span>
            </button>
          </div>
        }
        primaryAction={
          <button 
            onClick={() => handleOpenRaidModal()}
            className="min-h-[38px] px-3.5 bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer transition-transform"
            aria-label="Log RAID Item"
          >
            <PlusCircle size={15} />
            <span className="hidden sm:inline">Log RAID Item</span>
            <span className="sm:hidden">RAID</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-3 sm:p-6 lg:p-8 w-full space-y-6 pb-20 sm:pb-8">

        {/* Categories Tab Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-divider)]">
          <div className="flex bg-[var(--color-surface-2)] p-1 border border-[var(--color-divider)] rounded-xl overflow-x-auto custom-scroll max-w-full">
            {[
              { id: 'all', label: 'All RAID', count: raids.length },
              { id: 'risks', label: 'Risks', count: raids.filter(r => r.type === 'Risk').length },
              { id: 'assumptions', label: 'Assumptions', count: raids.filter(r => r.type === 'Assumption').length },
              { id: 'issues', label: 'Issues', count: raids.filter(r => r.type === 'Issue').length },
              { id: 'dependencies', label: 'Dependencies', count: raids.filter(r => r.type === 'Dependency').length },
              { id: 'decisions', label: 'Decisions', count: decisions.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setMatrixFilter(null); }}
                className={clsx(
                  "min-h-[36px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-[0.98] whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                  activeTab === tab.id 
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <span>{tab.label}</span>
                <span className={clsx(
                  "px-1.5 py-0.5 rounded-full text-[11px] font-mono",
                  activeTab === tab.id ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" : "bg-[var(--color-surface-3)] text-[var(--color-text-muted)]"
                )}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
            <input 
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-medium outline-none focus:border-[var(--color-primary-hex)] transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Grid-Heatmap Matrix Section for Risks & Assumptions */}
        {activeTab !== 'decisions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 card p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <div 
                  className="flex items-center gap-2 cursor-pointer sm:cursor-default"
                  onClick={() => setIsMatrixExpandedMobile(!isMatrixExpandedMobile)}
                >
                  <div>
                    <h3 className="font-bold text-sm flex items-center gap-1.5">
                      RAID Priority Matrix
                      <span className="sm:hidden text-xs text-[var(--color-text-faint)]">
                        {isMatrixExpandedMobile ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Impact vs probability distribution</p>
                  </div>
                </div>
                {matrixFilter && (
                  <button 
                    onClick={() => setMatrixFilter(null)}
                    className="min-h-[32px] px-2.5 rounded-lg text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Collapsible content on mobile */}
              <div className={clsx(
                "transition-all",
                isMatrixExpandedMobile ? "block" : "hidden sm:block"
              )}>
                <div className="flex gap-2 sm:gap-4 items-stretch">
                  {/* Y-Axis Label */}
                  <div className="w-5 text-[11px] font-semibold text-[var(--color-text-muted)] text-center flex items-center justify-center border-r border-[var(--color-divider)] pr-1 [writing-mode:vertical-lr] rotate-180 shrink-0">
                    Impact
                  </div>

                  {/* Main Grid + Probability Labels Container */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex gap-2 items-stretch">
                      {/* Impact Row Labels */}
                      <div className="grid grid-rows-3 gap-2 text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] text-right w-8 sm:w-12 pr-1 shrink-0">
                        <div className="flex items-center justify-end h-11 sm:h-12">High</div>
                        <div className="flex items-center justify-end h-11 sm:h-12">Med</div>
                        <div className="flex items-center justify-end h-11 sm:h-12">Low</div>
                      </div>
                      
                      {/* 3x3 Heatmap Grid */}
                      <div className="grid grid-cols-3 grid-rows-3 gap-2 flex-1">
                        {/* High-Risk Row */}
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('High', 'Low')}
                          className={clsx(
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/40 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'High' && matrixFilter.prob === 'Low' && "ring-2 ring-[var(--color-primary-hex)] bg-amber-500/25"
                          )}
                          aria-label={`High Impact, Low Probability: ${getCellCount('High', 'Low')} items`}
                        >{getCellCount('High', 'Low')}</button>
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('High', 'Medium')}
                          className={clsx(
                            "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200/40 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'High' && matrixFilter.prob === 'Medium' && "ring-2 ring-[var(--color-primary-hex)] bg-orange-500/25"
                          )}
                          aria-label={`High Impact, Medium Probability: ${getCellCount('High', 'Medium')} items`}
                        >{getCellCount('High', 'Medium')}</button>
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('High', 'High')}
                          className={clsx(
                            "bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'High' && matrixFilter.prob === 'High' && "ring-2 ring-[var(--color-primary-hex)] bg-rose-500/40"
                          )}
                          aria-label={`High Impact, High Probability: ${getCellCount('High', 'High')} items`}
                        >{getCellCount('High', 'High')}</button>

                        {/* Medium-Risk Row */}
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('Medium', 'Low')}
                          className={clsx(
                            "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'Medium' && matrixFilter.prob === 'Low' && "ring-2 ring-[var(--color-primary-hex)] bg-yellow-500/20"
                          )}
                          aria-label={`Medium Impact, Low Probability: ${getCellCount('Medium', 'Low')} items`}
                        >{getCellCount('Medium', 'Low')}</button>
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('Medium', 'Medium')}
                          className={clsx(
                            "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'Medium' && matrixFilter.prob === 'Medium' && "ring-2 ring-[var(--color-primary-hex)] bg-amber-500/25"
                          )}
                          aria-label={`Medium Impact, Medium Probability: ${getCellCount('Medium', 'Medium')} items`}
                        >{getCellCount('Medium', 'Medium')}</button>
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('Medium', 'High')}
                          className={clsx(
                            "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'Medium' && matrixFilter.prob === 'High' && "ring-2 ring-[var(--color-primary-hex)] bg-orange-500/35"
                          )}
                          aria-label={`Medium Impact, High Probability: ${getCellCount('Medium', 'High')} items`}
                        >{getCellCount('Medium', 'High')}</button>

                        {/* Low-Risk Row */}
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('Low', 'Low')}
                          className={clsx(
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'Low' && matrixFilter.prob === 'Low' && "ring-2 ring-[var(--color-primary-hex)] bg-emerald-500/20"
                          )}
                          aria-label={`Low Impact, Low Probability: ${getCellCount('Low', 'Low')} items`}
                        >{getCellCount('Low', 'Low')}</button>
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('Low', 'Medium')}
                          className={clsx(
                            "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-100/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'Low' && matrixFilter.prob === 'Medium' && "ring-2 ring-[var(--color-primary-hex)] bg-yellow-500/20"
                          )}
                          aria-label={`Low Impact, Medium Probability: ${getCellCount('Low', 'Medium')} items`}
                        >{getCellCount('Low', 'Medium')}</button>
                        <button 
                          type="button"
                          onClick={() => selectMatrixCell('Low', 'High')}
                          className={clsx(
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-11 sm:h-12 transition-all active:scale-95",
                            matrixFilter?.impact === 'Low' && matrixFilter.prob === 'High' && "ring-2 ring-[var(--color-primary-hex)] bg-amber-500/30"
                          )}
                          aria-label={`Low Impact, High Probability: ${getCellCount('Low', 'High')} items`}
                        >{getCellCount('Low', 'High')}</button>
                      </div>
                    </div>

                    {/* X-Axis Probability Column Labels directly under matrix */}
                    <div className="flex flex-col mt-2 pl-10 sm:pl-14">
                      <div className="grid grid-cols-3 gap-2 text-[11px] sm:text-xs font-semibold text-[var(--color-text-muted)] text-center">
                        <div>Low</div>
                        <div>Med</div>
                        <div>High</div>
                      </div>
                      <div className="text-[11px] font-semibold text-[var(--color-text-muted)] text-center mt-1">
                        Probability
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 sm:p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                  <ShieldAlert className="text-[var(--color-primary-hex)]" size={16} /> 
                  Active Risk Posture
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Tap any heatmap cell to filter register items by severity. Focus resolution efforts on High Impact &times; High Probability quadrant items first.
                </p>
              </div>
              {matrixFilter ? (
                <div className="mt-4 p-3 bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/30 text-[var(--color-primary-hex)] rounded-xl text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap size={14} /> Filtered: {matrixFilter.impact} Impact &times; {matrixFilter.prob} Prob
                  </span>
                  <button 
                    onClick={() => setMatrixFilter(null)}
                    className="underline text-[11px] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div className="mt-4 text-[11px] text-[var(--color-text-faint)] flex items-center gap-1">
                  <Info size={13} /> Showing all items
                </div>
              )}
            </div>
          </div>
        )}

        {/* Register Content: Responsive Card View on Mobile + Table on Desktop */}
        {activeTab === 'decisions' ? (
          <div>
            {/* Mobile Decisions Cards (< md) */}
            <div className="md:hidden space-y-3">
              {activeDecisions.length > 0 ? (
                activeDecisions.map(d => (
                  <div 
                    key={d.id} 
                    className="card p-4 space-y-3 border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-md">
                        {d.id}
                      </span>
                      <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", getStatusStyle(d.status))}>
                        {d.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text)] leading-snug">{d.title}</h4>
                      {d.desc && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{d.desc}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-divider)]/50">
                      <div>
                        <span className="text-[var(--color-text-faint)] block text-[10px] uppercase font-semibold">Proposed By</span>
                        <span className="font-medium text-[var(--color-text)]">{d.proposedBy || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-faint)] block text-[10px] uppercase font-semibold">Approver</span>
                        <span className="font-medium text-[var(--color-text)]">{d.approver || 'Pending'}</span>
                      </div>
                    </div>

                    {d.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
                        <Calendar size={13} />
                        <span>Target: {d.dueDate}</span>
                      </div>
                    )}

                    {d.rationale && (
                      <div className="p-2.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text-muted)]">
                        <span className="font-semibold text-[var(--color-text)] block text-[11px] mb-0.5">Rationale</span>
                        <p className="line-clamp-2">{d.rationale}</p>
                      </div>
                    )}

                    {/* Touch-Friendly Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-divider)]">
                      <button 
                        onClick={() => handleOpenDecisionModal(d)}
                        className="flex-1 min-h-[38px] px-3 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-[var(--color-divider)]"
                        aria-label={`Edit ${d.id}`}
                      >
                        <Edit2 size={13} /> <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteDecision(d.id)}
                        className="min-h-[38px] px-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-rose-500/20"
                        aria-label={`Delete ${d.id}`}
                      >
                        <Trash2 size={13} /> <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-8 text-center text-xs text-[var(--color-text-faint)]">
                  No decisions registered. Tap "+ Decision" above to record one.
                </div>
              )}
            </div>

            {/* Desktop Table View (>= md) powered by generic DataTable */}
            <div className="hidden md:block">
              <DataTable<Decision>
                data={activeDecisions}
                columns={decisionColumns}
                keyField="id"
                showRowNumbers={false}
                pagination={decisionPagination}
                itemLabel="decisions"
                maxHeight="max-h-[calc(100vh-320px)]"
                emptyMessage={<div className="py-8 text-center text-xs text-[var(--color-text-faint)]">No decisions registered.</div>}
              />
            </div>
          </div>
        ) : (
          <div>
            {/* Mobile RAID Cards (< md) */}
            <div className="md:hidden space-y-3">
              {activeFiltered.length > 0 ? (
                activeFiltered.map(r => (
                  <div 
                    key={r.id} 
                    className="card p-4 space-y-3 border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] px-2 py-0.5 rounded-md">
                          {r.id}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded-md text-xs font-semibold border", getTypeStyle(r.type))}>
                          {r.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={clsx("px-2 py-0.5 rounded text-[11px] font-medium", getSeverityStyle(r.severity))}>
                          {r.severity.split(' ')[0]}
                        </span>
                        <span className={clsx("px-2 py-0.5 rounded text-[11px] font-medium", getStatusStyle(r.status))}>
                          {r.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-text)] leading-snug">{r.title}</h4>
                      {r.desc && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{r.desc}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-divider)]/50">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-[var(--color-text-faint)] shrink-0" />
                        <span className="truncate">{r.owner || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-[var(--color-text-faint)] shrink-0" />
                        <span className="truncate">{r.dueDate || 'No date'}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-[11px]">
                        <span className="text-[var(--color-text-faint)]">Impact:</span>
                        <span className="font-semibold text-[var(--color-text)]">{r.impact}</span>
                        <span className="text-[var(--color-divider)]">|</span>
                        <span className="text-[var(--color-text-faint)]">Probability:</span>
                        <span className="font-semibold text-[var(--color-text)]">{r.probability || 'N/A'}</span>
                      </div>
                    </div>

                    {r.mitigation && (
                      <div className="p-2.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text-muted)]">
                        <span className="font-semibold text-[var(--color-text)] block text-[11px] mb-0.5">Mitigation Plan</span>
                        <p className="line-clamp-2">{r.mitigation}</p>
                      </div>
                    )}

                    {/* Touch-Friendly Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-divider)]">
                      <button 
                        onClick={() => handleOpenRaidModal(r)}
                        className="flex-1 min-h-[38px] px-3 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-[var(--color-divider)]"
                        aria-label={`Edit ${r.id}`}
                      >
                        <Edit2 size={13} /> <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteRaid(r.id)}
                        className="min-h-[38px] px-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-rose-500/20"
                        aria-label={`Delete ${r.id}`}
                      >
                        <Trash2 size={13} /> <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card p-8 text-center text-xs text-[var(--color-text-faint)]">
                  No RAID items found. Tap "+ RAID" above to log a risk or issue.
                </div>
              )}
            </div>

            {/* Desktop Table View (>= md) powered by generic DataTable */}
            <div className="hidden md:block">
              <DataTable<RaidItem>
                data={activeFiltered}
                columns={raidColumns}
                keyField="id"
                showRowNumbers={false}
                sortField={sortCol}
                sortAsc={sortOrder === 'asc'}
                onSort={(f) => handleRaidSort(f as any)}
                pagination={raidPagination}
                itemLabel="RAID items"
                maxHeight="max-h-[calc(100vh-320px)]"
                emptyMessage={<div className="p-12 text-center text-xs text-[var(--color-text-faint)]">No RAID items mapped.</div>}
              />
            </div>
          </div>
        )}

      </div>

      {/* RAID Form Modal with Mobile Bottom Sheet Animation */}
      <Modal
        isOpen={isRaidOpen && !!selectedRaid}
        onClose={() => { setIsRaidOpen(false); setSelectedRaid(null); }}
        title={selectedRaid?.id ? 'Edit RAID Item' : 'Log New RAID Item'}
        size="lg"
        footer={
          <div className="flex w-full gap-3">
            <Button 
              variant="ghost" 
              className="flex-1 font-semibold min-h-[42px] rounded-xl" 
              onClick={() => setIsRaidOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 font-bold min-h-[42px] rounded-xl bg-[var(--color-primary-hex)] text-[var(--color-primary-text)]" 
              onClick={handleSaveRaid}
            >
              Save Item
            </Button>
          </div>
        }
      >
        {selectedRaid && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">RAID Type</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedRaid.type}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, type: e.target.value as any })}
                >
                  <option value="Risk">Risk</option>
                  <option value="Assumption">Assumption</option>
                  <option value="Issue">Issue</option>
                  <option value="Dependency">Dependency</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Owner</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedRaid.owner}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, owner: e.target.value })}
                >
                  {getTeamNames().map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Title</label>
              <input 
                type="text"
                className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)]"
                value={selectedRaid.title}
                onChange={(e) => setSelectedRaid({ ...selectedRaid, title: e.target.value })}
                placeholder="e.g. Identity database gateway latency"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Description</label>
              <textarea 
                className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] min-h-[80px]"
                value={selectedRaid.desc}
                onChange={(e) => setSelectedRaid({ ...selectedRaid, desc: e.target.value })}
                placeholder="Provide context and analysis of the risk/issue..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Impact</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedRaid.impact}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, impact: e.target.value as any })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Probability</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedRaid.probability || 'Medium'}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, probability: e.target.value as any })}
                  disabled={selectedRaid.type !== 'Risk' && selectedRaid.type !== 'Assumption'}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Severity</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedRaid.severity}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, severity: e.target.value })}
                >
                  <option value="S1 - Critical">S1 - Critical</option>
                  <option value="S2 - Major">S2 - Major</option>
                  <option value="S3 - Moderate">S3 - Moderate</option>
                  <option value="S4 - Minor">S4 - Minor</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Due Date</label>
                <input 
                  type="date"
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedRaid.dueDate}
                  max="9999-12-31"
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Status</label>
              <select 
                className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                value={selectedRaid.status}
                onChange={(e) => setSelectedRaid({ ...selectedRaid, status: e.target.value })}
              >
                <option value="Identified">Identified</option>
                <option value="Active">Active</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Closed">Closed</option>
                <option value="Realized">Realized</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Mitigation / Resolution Plan</label>
              <textarea 
                className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] min-h-[80px]"
                value={selectedRaid.mitigation}
                onChange={(e) => setSelectedRaid({ ...selectedRaid, mitigation: e.target.value })}
                placeholder="Steps to resolve or mitigate this item..."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Decision Form Modal with Mobile Bottom Sheet Animation */}
      <Modal
        isOpen={isDecisionOpen && !!selectedDecision}
        onClose={() => { setIsDecisionOpen(false); setSelectedDecision(null); }}
        title={selectedDecision?.id ? 'Edit Decision Entry' : 'Log New Decision'}
        size="lg"
        footer={
          <div className="flex w-full gap-3">
            <Button 
              variant="ghost" 
              className="flex-1 font-semibold min-h-[42px] rounded-xl" 
              onClick={() => setIsDecisionOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 font-bold min-h-[42px] rounded-xl bg-[var(--color-primary-hex)] text-[var(--color-primary-text)]" 
              onClick={handleSaveDecision}
            >
              Save Decision
            </Button>
          </div>
        }
      >
        {selectedDecision && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Proposed By</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedDecision.proposedBy}
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, proposedBy: e.target.value })}
                >
                  {getTeamNames().map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Approver / Sign-off</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedDecision.approver}
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, approver: e.target.value })}
                >
                  {getTeamNames().map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Title</label>
              <input 
                type="text"
                className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)]"
                value={selectedDecision.title}
                onChange={(e) => setSelectedDecision({ ...selectedDecision, title: e.target.value })}
                placeholder="e.g. Move legacy database to PostgreSQL"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Description</label>
              <textarea 
                className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] min-h-[80px]"
                value={selectedDecision.desc}
                onChange={(e) => setSelectedDecision({ ...selectedDecision, desc: e.target.value })}
                placeholder="Explain the background and details of the decision..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Decision Status</label>
                <select 
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedDecision.status}
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, status: e.target.value as any })}
                >
                  <option value="Pending Sign-off">Pending Sign-off</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Appealed">Appealed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Target Date</label>
                <input 
                  type="date"
                  className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
                  value={selectedDecision.dueDate}
                  max="9999-12-31"
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Rationale</label>
              <textarea 
                className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] min-h-[80px]"
                value={selectedDecision.rationale}
                onChange={(e) => setSelectedDecision({ ...selectedDecision, rationale: e.target.value })}
                placeholder="Why is this decision being recommended? What is the core business logic..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5 block">Alternatives Considered</label>
              <textarea 
                className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] min-h-[80px]"
                value={selectedDecision.alternatives}
                onChange={(e) => setSelectedDecision({ ...selectedDecision, alternatives: e.target.value })}
                placeholder="What other paths were evaluated? Why were they bypassed..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RAIDView;
