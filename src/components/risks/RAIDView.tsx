import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { RaidItem, Decision, TaskStatus, TaskPriority } from '../../types';
import { daysDiff } from '../../utils/projectUtils';
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
  Info
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';

const RAIDView: React.FC = () => {
  const { state, updateProject, addLog } = useProject();
  const { raids = [], decisions = [], members = [], tasks = [] } = state;

  const [activeTab, setActiveTab] = useState<'all' | 'risks' | 'assumptions' | 'issues' | 'dependencies' | 'decisions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRaid, setSelectedRaid] = useState<RaidItem | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [isRaidOpen, setIsRaidOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [matrixFilter, setMatrixFilter] = useState<{ impact: string; prob: string } | null>(null);

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

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={ShieldAlert}
        title="Unified RAID Register"
        subtitle="Track Risks, Assumptions, Issues, and Dependencies alongside steering Decisions"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleOpenRaidModal()}
              className="h-9 px-3.5 bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            >
              <PlusCircle size={15} /> <span>Log RAID Item</span>
            </button>
            <button 
              onClick={() => handleOpenDecisionModal()}
              className="h-9 px-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-xl text-xs font-semibold flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
            >
              <FileText size={15} /> <span>Log Decision</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-8">

        {/* Categories Tab Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[var(--color-divider)]">
          <div className="flex bg-[var(--color-surface-2)] p-1 border border-[var(--color-divider)] rounded-xl overflow-x-auto custom-scroll max-w-full">
            {[
              { id: 'all', label: 'All RAID', count: raids.length },
              { id: 'risks', label: 'Risks', count: raids.filter(r => r.type === 'Risk').length },
              { id: 'assumptions', label: 'Assumptions', count: raids.filter(r => r.type === 'Assumption').length },
              { id: 'issues', label: 'Issues', count: raids.filter(r => r.type === 'Issue').length },
              { id: 'dependencies', label: 'Dependencies', count: raids.filter(r => r.type === 'Dependency').length },
              { id: 'decisions', label: 'Decisions Log', count: decisions.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setMatrixFilter(null); }}
                className={clsx(
                  "py-2 px-3.5 rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-[0.98] whitespace-nowrap flex items-center gap-2 cursor-pointer",
                  activeTab === tab.id 
                    ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <span>{tab.label}</span>
                <span className={clsx(
                  "px-1.5 py-0.2 rounded-full text-xs font-mono",
                  activeTab === tab.id ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" : "bg-[var(--color-surface-3)] text-[var(--color-text-muted)]"
                )}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="relative w-64 max-w-full">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            <input 
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Grid-Heatmap Matrix Section for Risks & Assumptions */}
        {activeTab !== 'decisions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 card p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-sm">RAID Priority Matrix</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Impact vs probability distribution</p>
                </div>
                {matrixFilter && (
                  <button 
                    onClick={() => setMatrixFilter(null)}
                    className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="flex gap-4 items-stretch">
                <div className="text-xs font-semibold text-[var(--color-text-muted)] text-center flex items-center justify-center border-r border-[var(--color-divider)] pr-3 [writing-mode:vertical-lr] rotate-180">Impact</div>
                <div className="flex-1 flex flex-col">
                  <div className="flex gap-4 items-stretch">
                    <div className="grid grid-rows-3 gap-2 text-xs font-semibold text-[var(--color-text-muted)] text-right w-12 pr-2">
                      <div className="flex items-center justify-end h-12">High</div>
                      <div className="flex items-center justify-end h-12">Med</div>
                      <div className="flex items-center justify-end h-12">Low</div>
                    </div>
                    
                    <div className="grid grid-cols-3 grid-rows-3 gap-2 flex-1">
                      {/* High-Risk Rows */}
                      <div 
                        onClick={() => selectMatrixCell('High', 'Low')}
                        className={clsx(
                          "bg-amber-500/10 text-amber-600 border border-amber-200/40 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'High' && matrixFilter.prob === 'Low' && "ring-2 ring-[var(--color-primary-hex)] bg-amber-500/20"
                        )}
                      >{getCellCount('High', 'Low')}</div>
                      <div 
                        onClick={() => selectMatrixCell('High', 'Medium')}
                        className={clsx(
                          "bg-orange-500/15 text-orange-600 border border-orange-200/40 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'High' && matrixFilter.prob === 'Medium' && "ring-2 ring-[var(--color-primary-hex)] bg-orange-500/25"
                        )}
                      >{getCellCount('High', 'Medium')}</div>
                      <div 
                        onClick={() => selectMatrixCell('High', 'High')}
                        className={clsx(
                          "bg-rose-500/25 text-rose-600 border border-rose-200/50 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'High' && matrixFilter.prob === 'High' && "ring-2 ring-[var(--color-primary-hex)] bg-rose-500/40"
                        )}
                      >{getCellCount('High', 'High')}</div>

                      {/* Medium-Risk Rows */}
                      <div 
                        onClick={() => selectMatrixCell('Medium', 'Low')}
                        className={clsx(
                          "bg-yellow-500/10 text-yellow-600 border border-yellow-100 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'Medium' && matrixFilter.prob === 'Low' && "ring-2 ring-[var(--color-primary-hex)] bg-yellow-500/20"
                        )}
                      >{getCellCount('Medium', 'Low')}</div>
                      <div 
                        onClick={() => selectMatrixCell('Medium', 'Medium')}
                        className={clsx(
                          "bg-amber-500/15 text-amber-600 border border-amber-200 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'Medium' && matrixFilter.prob === 'Medium' && "ring-2 ring-[var(--color-primary-hex)] bg-amber-500/25"
                        )}
                      >{getCellCount('Medium', 'Medium')}</div>
                      <div 
                        onClick={() => selectMatrixCell('Medium', 'High')}
                        className={clsx(
                          "bg-orange-500/15 text-orange-600 border border-orange-200 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'Medium' && matrixFilter.prob === 'High' && "ring-2 ring-[var(--color-primary-hex)] bg-orange-500/35"
                        )}
                      >{getCellCount('Medium', 'High')}</div>

                      {/* Low-Risk Rows */}
                      <div 
                        onClick={() => selectMatrixCell('Low', 'Low')}
                        className={clsx(
                          "bg-emerald-500/10 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'Low' && matrixFilter.prob === 'Low' && "ring-2 ring-[var(--color-primary-hex)] bg-emerald-500/20"
                        )}
                      >{getCellCount('Low', 'Low')}</div>
                      <div 
                        onClick={() => selectMatrixCell('Low', 'Medium')}
                        className={clsx(
                          "bg-yellow-500/10 text-yellow-600 border border-yellow-100 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'Low' && matrixFilter.prob === 'Medium' && "ring-2 ring-[var(--color-primary-hex)] bg-yellow-500/20"
                        )}
                      >{getCellCount('Low', 'Medium')}</div>
                      <div 
                        onClick={() => selectMatrixCell('Low', 'High')}
                        className={clsx(
                          "bg-amber-500/10 text-amber-600 border border-amber-200 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer h-12 transition-colors duration-150 active:scale-95",
                          matrixFilter?.impact === 'Low' && matrixFilter.prob === 'High' && "ring-2 ring-[var(--color-primary-hex)] bg-amber-500/30"
                        )}
                      >{getCellCount('Low', 'High')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex ml-16 mt-2 flex-col gap-1">
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-[var(--color-text-muted)] text-center">
                    <div>Low</div>
                    <div>Medium</div>
                    <div>High</div>
                  </div>
                  <div className="text-xs font-semibold text-[var(--color-text-muted)] text-center mt-1">Probability</div>
                </div>
              </div>
            </div>

            <div className="card p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                  <ShieldAlert className="text-indigo-500" size={16} /> 
                  Active Risk Posture
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                  The RAID matrix dynamically organizes project risks. Prioritize high-impact/probability items for immediate mitigation in the panel below.
                </p>
              </div>
              {matrixFilter && (
                <div className="p-3 bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)] text-[var(--color-primary-hex)] rounded-xl text-xs font-bold flex items-center gap-2">
                  <Zap size={14} /> Filtered: {matrixFilter.impact} x {matrixFilter.prob}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RAID list or Decisions table */}
        {activeTab === 'decisions' ? (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-divider)]">
                    <th className="p-4">ID</th>
                    <th className="p-4">Decision Title</th>
                    <th className="p-4">Owner / Approver</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Target Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-divider)]">
                  {activeDecisions.length > 0 ? activeDecisions.map(d => (
                    <tr key={d.id} className="hover:bg-[var(--color-surface-offset)]/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-xs text-[var(--color-primary-hex)]">{d.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-sm text-[var(--color-text)]">{d.title}</div>
                        <div className="text-xs text-[var(--color-text-muted)] mt-1 max-w-md">{d.desc}</div>
                      </td>
                      <td className="p-4 text-xs text-[var(--color-text-muted)]">
                        <div><b>Proposed:</b> {d.proposedBy}</div>
                        <div><b>Approver:</b> {d.approver}</div>
                      </td>
                      <td className="p-4">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          d.status === 'Approved' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                          d.status === 'Rejected' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                          "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        )}>{d.status}</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-[var(--color-text-faint)]">{d.dueDate}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleOpenDecisionModal(d)} className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteDecision(d.id)} className="p-1 text-[var(--color-text-faint)] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-[var(--color-text-faint)]">No decisions registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-divider)]">
                    <th className="p-4 cursor-pointer" onClick={() => handleRaidSort('id')}>ID / Type</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleRaidSort('title')}>Title & Context</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleRaidSort('owner')}>Owner</th>
                    <th className="p-4">Impact / Prob</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Mitigation Plan</th>
                    <th className="p-4 cursor-pointer" onClick={() => handleRaidSort('status')}>Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-divider)]">
                  {activeFiltered.length > 0 ? activeFiltered.map(r => {
                    const typeColor = r.type === 'Risk' ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' :
                      r.type === 'Assumption' ? 'text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/20' :
                      r.type === 'Issue' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                    return (
                      <tr key={r.id} className="hover:bg-[var(--color-surface-offset)]/50 transition-colors">
                        <td className="p-4">
                          <div className="font-mono font-bold text-xs text-[var(--color-primary-hex)]">{r.id}</div>
                          <span className={clsx("px-1.5 py-0.5 rounded text-xs font-medium border", typeColor)}>{r.type}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-sm text-[var(--color-text)]">{r.title}</div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">{r.desc}</div>
                        </td>
                        <td className="p-4 text-xs font-bold text-[var(--color-text-muted)]">{r.owner}</td>
                        <td className="p-4 text-xs">
                          <div className="font-semibold">{r.impact} / {r.probability || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            r.severity.includes('Critical') || r.severity.includes('Major') ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          )}>{r.severity.split(' ')[0]}</span>
                        </td>
                        <td className="p-4 text-xs text-[var(--color-text-muted)] max-w-xs">{r.mitigation}</td>
                        <td className="p-4">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            r.status === 'Closed' || r.status === 'Mitigated' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          )}>{r.status}</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleOpenRaidModal(r)} className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteRaid(r.id)} className="p-1 text-[var(--color-text-faint)] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-[var(--color-text-faint)]">No RAID items mapped.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* RAID Form Modal */}
      {isRaidOpen && selectedRaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-bg)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-divider)] flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-2)]">
              <h2 className="text-xl font-black">{selectedRaid.id ? 'Edit RAID Item' : 'Log New RAID Item'}</h2>
              <button onClick={() => setIsRaidOpen(false)} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scroll">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">RAID Type</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
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
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Owner</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    value={selectedRaid.owner}
                    onChange={(e) => setSelectedRaid({ ...selectedRaid, owner: e.target.value })}
                  >
                    {getTeamNames().map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Title</label>
                <input 
                  type="text"
                  className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  value={selectedRaid.title}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, title: e.target.value })}
                  placeholder="e.g. Identity database gateway latency"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Description</label>
                <textarea 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500 min-h-20"
                  value={selectedRaid.desc}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, desc: e.target.value })}
                  placeholder="Provide context and analysis of the risk/issue..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Impact</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    value={selectedRaid.impact}
                    onChange={(e) => setSelectedRaid({ ...selectedRaid, impact: e.target.value as any })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Probability</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Severity</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
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
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Due Date</label>
                  <input 
                    type="date"
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    value={selectedRaid.dueDate}
                    max="9999-12-31"
                    onChange={(e) => setSelectedRaid({ ...selectedRaid, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Status</label>
                <select 
                  className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
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
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Mitigation / Resolution Plan</label>
                <textarea 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500 min-h-20"
                  value={selectedRaid.mitigation}
                  onChange={(e) => setSelectedRaid({ ...selectedRaid, mitigation: e.target.value })}
                  placeholder="Steps to resolve or mitigate this item..."
                />
              </div>
            </div>
            <div className="p-6 bg-[var(--color-surface-offset)] border-t border-[var(--color-divider)] flex gap-4">
              <Button variant="ghost" className="flex-1 font-bold h-12 rounded-2xl" onClick={() => setIsRaidOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1 font-black h-12 rounded-2xl bg-indigo-600 border-indigo-600 shadow-indigo-100" onClick={handleSaveRaid}>Save Item</Button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Form Modal */}
      {isDecisionOpen && selectedDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--color-bg)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-[var(--color-divider)] flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-2)]">
              <h2 className="text-xl font-black">{selectedDecision.id ? 'Edit Decision entry' : 'Log New Decision'}</h2>
              <button onClick={() => setIsDecisionOpen(false)} className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scroll">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Proposed By</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    value={selectedDecision.proposedBy}
                    onChange={(e) => setSelectedDecision({ ...selectedDecision, proposedBy: e.target.value })}
                  >
                    {getTeamNames().map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Approver / Sign-off</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    value={selectedDecision.approver}
                    onChange={(e) => setSelectedDecision({ ...selectedDecision, approver: e.target.value })}
                  >
                    {getTeamNames().map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Title</label>
                <input 
                  type="text"
                  className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                  value={selectedDecision.title}
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, title: e.target.value })}
                  placeholder="e.g. Move legacy database to PostgreSQL"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Description</label>
                <textarea 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500 min-h-20"
                  value={selectedDecision.desc}
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, desc: e.target.value })}
                  placeholder="Explain the background and details of the decision..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Decision Status</label>
                  <select 
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
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
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Target Date</label>
                  <input 
                    type="date"
                    className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                    value={selectedDecision.dueDate}
                    max="9999-12-31"
                    onChange={(e) => setSelectedDecision({ ...selectedDecision, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Rationale</label>
                <textarea 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500 min-h-20"
                  value={selectedDecision.rationale}
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, rationale: e.target.value })}
                  placeholder="Why is this decision being recommended? What is the core business logic..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Alternatives Considered</label>
                <textarea 
                  className="w-full p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-bold outline-none focus:border-indigo-500 min-h-20"
                  value={selectedDecision.alternatives}
                  onChange={(e) => setSelectedDecision({ ...selectedDecision, alternatives: e.target.value })}
                  placeholder="What other paths were evaluated? Why were they bypassed..."
                />
              </div>
            </div>
            <div className="p-6 bg-[var(--color-surface-offset)] border-t border-[var(--color-divider)] flex gap-4">
              <Button variant="ghost" className="flex-1 font-bold h-12 rounded-2xl" onClick={() => setIsDecisionOpen(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1 font-black h-12 rounded-2xl bg-indigo-600 border-indigo-600 shadow-indigo-100" onClick={handleSaveDecision}>Save Decision</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RAIDView;
