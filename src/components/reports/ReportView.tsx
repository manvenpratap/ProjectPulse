import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
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
  Layers,
  Sparkles
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { TaskStatus, TaskPriority } from '../../types';
import { exportProjectExcel } from '../../services/excelService';
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

const ReportView: React.FC = () => {
  const { state } = useProject();
  const [reportType, setReportType] = useState<ReportType>('status');
  const [copiedEmail, setCopiedEmail] = useState(false);

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

  // Generate CXO Executive Briefing Email text
  const generateCxoEmailText = () => {
    const today = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const activeDeliveries = (state.deliveries || []).filter(d => d.status === 'Deployed' || d.status === 'Ready for Deployment');
    const upcomingRelease = (state.releases || []).find(r => r.status === 'Active') || state.releases?.[0];

    return `Subject: [EXECUTIVE BRIEFING] ${state.name} — Weekly Governance Pulse (${today})

Executive Leadership Team,

Below is the weekly delivery status and strategic health summary for ${state.name}.

═════════════════════════════════════════════════════════
1. EXECUTIVE STATUS & CONFIDENCE
═════════════════════════════════════════════════════════
• Overall Health Index: ${health}% (${health > 80 ? 'ON TRACK' : health > 50 ? 'AT RISK' : 'CRITICAL'})
• Scope Completed: ${progress}% (${completedTasks.length} of ${totalTasks} tasks delivered)
• Active Target Release: ${upcomingRelease ? `${upcomingRelease.name} (Target: ${fmtDate(upcomingRelease.date || '')})` : 'In Flight'}
• Overdue Action Items: ${overdueTasks.length} items requiring steering escalation

═════════════════════════════════════════════════════════
2. RECENT HIGHLIGHTS & KEY DELIVERIES
═════════════════════════════════════════════════════════
${activeDeliveries.slice(0, 3).map(d => `• [${d.almId || d.id}] ${d.name} (${d.category || 'Release'} — ${d.status})`).join('\n') || '• Key architecture components and foundational modules progressed.'}

═════════════════════════════════════════════════════════
3. RISK REGISTER & RED FLAGS (EWS)
═════════════════════════════════════════════════════════
${activeRaids.slice(0, 3).map(r => `• [${r.type.toUpperCase()}] ${r.title} (Owner: ${r.owner}, Impact: ${r.impact})`).join('\n') || '• No critical unmitigated high-impact risks logged.'}

═════════════════════════════════════════════════════════
4. DECISIONS NEEDED FROM STEERING COMMITTEE
═════════════════════════════════════════════════════════
${pendingDecisions.slice(0, 3).map(d => `• ${d.title} (Proposed by: ${d.proposedBy}, Approver: ${d.approver})`).join('\n') || '• No urgent sign-offs pending from leadership.'}

Full telemetry and interactive reports are available at ProjectPulse.

Best regards,
Project Management Office (PMO)`;
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generateCxoEmailText());
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-hidden print:bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10 print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-[var(--color-text)]">
              Executive Reporting & Board Packs
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] font-medium">
              Project Performance, CXO Briefings, and Release Audits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 font-bold" onClick={handlePrint}>
            <Printer size={16} className="mr-1.5" /> Print Sheet
          </Button>
          <Button variant="primary" size="sm" className="h-9 px-4 font-bold shadow-sm" onClick={() => exportProjectExcel(state)}>
            <Download size={16} className="mr-1.5" /> Export Excel Pack
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6 print:p-0">
        <div className="max-w-5xl mx-auto space-y-6 flex flex-col items-center">
          
          {/* Report Tab Selector */}
          <div className="w-full flex p-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl print:hidden shadow-sm overflow-x-auto">
            {[
              { id: 'status', label: 'Status Summary', icon: TrendingUp },
              { id: 'cxo', label: 'CXO Email Briefing', icon: Mail },
              { id: 'milestones', label: 'Release Checklist', icon: Flag },
              { id: 'workload', label: 'Capacity & Workload', icon: Clock },
              { id: 'architecture', label: 'Module Breakdown', icon: Layers },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as any)}
                className={clsx(
                  "flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] shrink-0",
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

          {/* Actual Report Sheet */}
          <div className="w-full bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-xl p-8 md:p-12 print:border-none print:shadow-none min-h-[800px] text-[var(--color-text)]">
            
            {/* Sheet Banner Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10 border-b border-[var(--color-divider)] pb-8">
              <div>
                <h2 className="text-3xl font-display font-black tracking-tight text-[var(--color-text)] flex items-center gap-3">
                  <span>{state.name}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">Telemetry Report</span>
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium">
                  {state.desc || 'Monolithic high-density project performance and governance dossier.'}
                </p>
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
                    <div className="text-2xl font-mono font-bold text-indigo-600 mt-1">{state.deliveries?.length || 0}</div>
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
                    <span className="font-mono text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-3 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-primary-hex)] rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Key Executive Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl border border-[var(--color-divider)] space-y-3">
                    <h4 className="text-xs font-bold text-[var(--color-text-faint)] flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-indigo-600" />
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

            {/* TAB 2: CXO EMAIL BRIEFING */}
            {reportType === 'cxo' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-divider)]">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                      <Mail size={16} className="text-indigo-600" />
                      One-Click CXO Briefing Email
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Pre-formatted bulleted update ready to copy and send to stakeholders.
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleCopyEmail} className="font-bold">
                    {copiedEmail ? <Check size={14} className="mr-1.5 text-emerald-300" /> : <Copy size={14} className="mr-1.5" />}
                    {copiedEmail ? 'Copied to Clipboard!' : 'Copy Email Text'}
                  </Button>
                </div>

                <div className="p-6 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-mono text-xs text-[var(--color-text)] whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto">
                  {generateCxoEmailText()}
                </div>
              </div>
            )}

            {/* TAB 3: RELEASE & DELIVERIES CHECKLIST */}
            {reportType === 'milestones' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[var(--color-text)] flex items-center gap-2">
                    <Flag size={18} className="text-indigo-600" />
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
                            <span className="font-mono font-bold text-sm text-indigo-600">{pct}%</span>
                            <span className="text-[10px] text-[var(--color-text-faint)] block">{doneMapped.length} of {mappedTasks.length} tasks</span>
                          </div>
                        </div>

                        <div className="h-2 w-full bg-[var(--color-surface-offset)] rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
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
                    <Users size={18} className="text-indigo-600" />
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
        </div>
      </div>
    </div>
  );
};

export default ReportView;
