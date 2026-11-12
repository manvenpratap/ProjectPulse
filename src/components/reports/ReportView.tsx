import React, { useState, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import CxoEmailBriefing from './CxoEmailBriefing';
import { 
  FileText, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Printer,
  Mail,
  Copy,
  Check,
  Flag,
  Package,
  ShieldAlert,
  Users,
  Layers
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import SectionHelpButton from '../shared/SectionHelpButton';
import clsx from 'clsx';
import { TaskStatus, TaskPriority } from '../../types';
import { getHealthScore, fmtDate } from '../../utils/projectUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#E11D48', '#8B5CF6', '#06B6D4', '#EC4899'];

type ReportType = 'status' | 'cxo' | 'milestones' | 'workload' | 'architecture';
const VALID_REPORT_TABS = new Set(['status', 'cxo', 'milestones', 'workload', 'architecture']);

const ReportView: React.FC = () => {
  const { state, activeSubTab } = useProject();
  const [reportType, setReportType] = useState<ReportType>(() => {
    if (activeSubTab?.view === 'reports' && VALID_REPORT_TABS.has(activeSubTab.tab)) {
      return activeSubTab.tab as ReportType;
    }
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem('pp-report-subtab') as ReportType | null;
      if (stored && VALID_REPORT_TABS.has(stored)) {
        window.sessionStorage.removeItem('pp-report-subtab');
        return stored;
      }
    }
    return 'status';
  });

  useEffect(() => {
    if (activeSubTab?.view === 'reports' && VALID_REPORT_TABS.has(activeSubTab.tab)) {
      setReportType(activeSubTab.tab as ReportType);
    }
  }, [activeSubTab?.seq, activeSubTab?.view, activeSubTab?.tab]);

  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent<ReportType>) => {
      if (e.detail) setReportType(e.detail);
    };
    window.addEventListener('switch-report-tab', handleSwitchTab as EventListener);
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem('pp-report-subtab') as ReportType | null;
      if (stored) {
        window.sessionStorage.removeItem('pp-report-subtab');
        setReportType(stored);
      }
    }
    return () => window.removeEventListener('switch-report-tab', handleSwitchTab as EventListener);
  }, []);

  const completedTasks = state.tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const totalTasks = state.tasks.length;
  const progress = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const health = getHealthScore(state.tasks);

  const overdueTasks = state.tasks.filter(t => {
    return t.status !== TaskStatus.COMPLETED && t.dueDate && new Date(t.dueDate) < new Date();
  });

  const activeRaids = (state.raids || []).filter(r => r.status === 'Active');
  const pendingDecisions = (state.decisions || []).filter(d => d.status === 'Pending Sign-off');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden print:bg-white">
      <PageHeader
        icon={FileText}
        title="Executive Reporting & Board Packs"
        className="print:hidden"
        primaryAction={
          <Button variant="primary" size="sm" className="h-9 px-3.5 rounded-xl font-bold active:scale-95 shadow-xs flex items-center gap-1.5" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Sheet</span>
          </Button>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scroll print:overflow-visible">
        <div className="spell-scroll-hairline print:hidden" aria-hidden="true" />
        <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6 print:p-0">
          
          {/* Report Tab Selector */}
          <div className="w-full flex p-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl print:hidden shadow-sm overflow-x-auto no-scrollbar scroll-fade-x">
            {[
              { id: 'status', label: 'Status Summary', icon: TrendingUp },
              { id: 'cxo', label: 'CXO Email Briefing', icon: Mail },
              { id: 'milestones', label: 'Release Checklist', icon: Flag },
              { id: 'workload', label: 'Capacity & Workload', icon: Clock },
              { id: 'architecture', label: 'Module Breakdown', icon: Layers },
            ].map(type => (
              <button
                key={type.id}
                onClick={(e) => {
                  setReportType(type.id as any);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }}
                className={clsx(
                  "flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 sm:py-2 px-3 rounded-xl text-xs font-bold transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] shrink-0 cursor-pointer",
                  reportType === type.id 
                    ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-sm" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <type.icon size={14} />
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 2: CXO EMAIL BRIEFING (High-Density Cockpit Studio) */}
          {reportType === 'cxo' ? (
            <div className="w-full animate-in fade-in duration-300">
              <CxoEmailBriefing embedded={true} />
            </div>
          ) : (
            /* Actual Report Sheet */
            <div className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 md:p-12 print:border-none print:shadow-none min-h-[800px] text-[var(--color-text)]">
              
              {/* Sheet Banner Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-10 border-b border-[var(--color-divider)] pb-5 sm:pb-8">
                <div>
                  <h2 className="text-xl sm:text-3xl font-display font-black tracking-tight text-[var(--color-text)] flex flex-wrap items-center gap-2 sm:gap-3">
                    <span>{state.name}</span>
                    <span className="print:hidden">
                      <SectionHelpButton view="reports" section="Audit Scorecard" label="Status report guide" />
                    </span>
                  </h2>
                  {state.desc && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium">
                      {state.desc}
                    </p>
                  )}
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xs font-medium text-[var(--color-text-faint)] mb-1">Generated at</div>
                  <div className="text-xs font-mono font-bold text-[var(--color-text)]">
                    {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                    Health Index: {health}%
                  </div>
                </div>
              </div>

              {/* TAB 1: STATUS SUMMARY */}
              {reportType === 'status' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in duration-300">
                  {/* 4 Core Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                      <span className="text-xs font-medium text-[var(--color-text-faint)]">Tasks done</span>
                      <div className="text-2xl font-mono font-bold text-emerald-600 mt-1">{completedTasks.length} / {totalTasks}</div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{progress}% completed</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                      <span className="text-xs font-medium text-[var(--color-text-faint)]">ALM deliveries</span>
                      <div className="text-2xl font-mono font-bold text-[var(--color-primary-hex)] mt-1">{state.deliveries?.length || 0}</div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">Release packages</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                      <span className="text-xs font-medium text-[var(--color-text-faint)]">Active RAID</span>
                      <div className="text-2xl font-mono font-bold text-amber-600 mt-1">{activeRaids.length}</div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">Risks & dependencies</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                      <span className="text-xs font-medium text-[var(--color-text-faint)]">Overdue items</span>
                      <div className="text-2xl font-mono font-bold text-red-500 mt-1">{overdueTasks.length}</div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">Need intervention</span>
                    </div>
                  </div>

                  {/* Progress Visual */}
                  <div className="space-y-2 p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">Total delivery momentum</span>
                      <span className="font-mono text-[var(--color-primary-hex)]">{progress}%</span>
                    </div>
                    <div className="h-3 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Key Executive Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl border border-[var(--color-divider)] space-y-3">
                      <h4 className="text-xs font-bold text-[var(--color-text-faint)] flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-[var(--color-primary-hex)]" />
                        Executive Highlights
                      </h4>
                      <ul className="text-xs space-y-2 text-[var(--color-text-muted)] list-disc pl-4 leading-relaxed">
                        <li>Overall project velocity is maintaining a stable delivery pace across all primary modules.</li>
                        <li>Core architectural foundations and API Gateway infrastructure have completed verification.</li>
                        <li>{completedTasks.length} functional deliverables verified against quality benchmarks.</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-2xl border border-[var(--color-divider)] space-y-3">
                      <h4 className="text-xs font-bold text-[var(--color-text-faint)] flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-500" />
                        Early Warnings & Bottlenecks
                      </h4>
                      <ul className="text-xs space-y-2 text-[var(--color-text-muted)] list-disc pl-4 leading-relaxed">
                        {overdueTasks.length > 0 ? (
                          overdueTasks.slice(0, 3).map(t => (
                            <li key={t.id}><strong className="text-[var(--color-text)]">{t.id}:</strong> {t.name} (Due: {fmtDate(t.dueDate)})</li>
                          ))
                        ) : (
                          <li>Zero overdue tasks detected. All scheduled deliverables remain on track.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RELEASE & DELIVERIES CHECKLIST */}
              {reportType === 'milestones' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[var(--color-text)] flex items-center gap-2">
                    <Flag size={18} className="text-[var(--color-primary-hex)]" />
                    Release Version Roadmap & Audit
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {state.releases?.length || 0} Configured Release Cycles
                  </span>
                </div>

                <div className="space-y-4">
                  {(state.releases || []).map(r => {
                    const mappedTasks = state.tasks.filter(t => t.release === r.name);
                    const doneMapped = mappedTasks.filter(t => t.status === TaskStatus.COMPLETED);
                    const pct = mappedTasks.length > 0 ? Math.round((doneMapped.length / mappedTasks.length) * 100) : 0;

                    return (
                      <div key={r.id} className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                              {r.name}
                              <span className={clsx(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                r.status === 'Released' ? "bg-emerald-500/10 text-emerald-600" : r.status === 'Active' ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"
                              )}>
                                {r.status}
                              </span>
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                              Target Date: {fmtDate(r.date || '')} • Start: {fmtDate(r.startDate || '')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-sm text-[var(--color-primary-hex)]">{pct}%</span>
                            <span className="text-[10px] text-[var(--color-text-faint)] block">{doneMapped.length} of {mappedTasks.length} tasks</span>
                          </div>
                        </div>

                        <div className="h-2 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: WORKLOAD & CAPACITY */}
            {reportType === 'workload' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[var(--color-text)] flex items-center gap-2">
                    <Users size={18} className="text-[var(--color-primary-hex)]" />
                    Resource Capacity & Assignment Load
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {state.members.length} Active Engineers
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={state.members.map(m => {
                      const mTasks = state.tasks.filter(t => t.assignee === m.name);
                      const done = mTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
                      const active = mTasks.length - done;
                      return { name: m.name.split(' ')[0], active, done };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <ChartTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-divider)', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="active" fill="#6366f1" name="Active Tasks" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="done" fill="#10b981" name="Completed Tasks" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB 5: ARCHITECTURE COHESION */}
            {reportType === 'architecture' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[var(--color-text)] flex items-center gap-2">
                    <Layers size={18} className="text-cyan-500" />
                    Module Gravity & Architecture Cohesion
                  </h3>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Distribution across system modules
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            state.tasks.reduce((acc, t) => {
                              acc[t.module || 'General'] = (acc[t.module || 'General'] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([name, value]) => ({ name, value }))}
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {state.tasks.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-divider)', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(
                      state.tasks.reduce((acc, t) => {
                        acc[t.module || 'General'] = (acc[t.module || 'General'] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([mod, count], i) => (
                      <div key={mod} className="p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-semibold text-[var(--color-text)]">{mod}</span>
                        </div>
                        <span className="font-mono font-bold text-[var(--color-text-muted)]">{count} tasks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
