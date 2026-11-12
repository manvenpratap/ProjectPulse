import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { 
  Bell, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  X, 
  ShieldAlert, 
  UserX,
  Bug,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { daysDiff } from '../../utils/projectUtils';
import { TaskStatus, DefectStatus } from '../../types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import SectionHelpButton from '../shared/SectionHelpButton';

export interface SmartAlert {
  id: string;
  type: 'OVERDUE_TASK' | 'DUE_SOON' | 'BLOCKED_TASK' | 'OVERLOADED_MEMBER' | 'CRITICAL_DEFECT' | 'HIGH_RISK_RAID' | 'UNMAPPED_SCREENS';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  body: string;
  targetView: string;
  itemId?: string;
}

interface SmartAlertsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function computeAlerts(state: { tasks?: any[]; members?: any[]; defects?: any[]; raids?: any[] }): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const tasks = state.tasks || [];
  const members = state.members || [];
  const defects = state.defects || [];
  const raids = state.raids || [];

  // 1. OVERDUE TASKS
  tasks.forEach(t => {
    const dd = daysDiff(t.dueDate);
    if (t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && dd !== null && dd < 0) {
      alerts.push({
        id: `overdue-${t.id}`,
        type: 'OVERDUE_TASK',
        severity: 'critical',
        title: `Task Overdue: ${t.name}`,
        body: `${Math.abs(dd)} days past deadline • Assignee: ${t.assignee || 'Unassigned'} • Module: ${t.module || 'General'}`,
        targetView: 'tasks',
        itemId: t.id
      });
    }
  });

  // 2. DUE SOON (Within 3 days)
  tasks.forEach(t => {
    const dd = daysDiff(t.dueDate);
    if (t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED && dd !== null && dd >= 0 && dd <= 3) {
      alerts.push({
        id: `soon-${t.id}`,
        type: 'DUE_SOON',
        severity: 'warning',
        title: `Due in ${dd === 0 ? 'Today' : `${dd} day(s)`}: ${t.name}`,
        body: `Progress: ${t.progress}% • Assignee: ${t.assignee || 'Unassigned'} • Due: ${t.dueDate}`,
        targetView: 'tasks',
        itemId: t.id
      });
    }
  });

  // 3. BLOCKED TASKS (Depends on incomplete tasks or On Hold)
  tasks.forEach(t => {
    if (t.status === TaskStatus.ON_HOLD) {
      alerts.push({
        id: `blocked-${t.id}`,
        type: 'BLOCKED_TASK',
        severity: 'critical',
        title: `Task Blocked: ${t.name}`,
        body: `Currently on hold awaiting dependency or external sign-off.`,
        targetView: 'timeline',
        itemId: t.id
      });
    } else if (t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED) {
      const deps = Array.isArray(t.dependsOn) ? t.dependsOn : (t.dependsOn ? String(t.dependsOn).split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      if (deps.length > 0) {
        const incompleteBlockers = deps
          .map((depId: string) => tasks.find(x => x.id === depId))
          .filter((x: any) => x && x.status !== TaskStatus.COMPLETED);
        if (incompleteBlockers.length > 0) {
          alerts.push({
            id: `dep-blocked-${t.id}`,
            type: 'BLOCKED_TASK',
            severity: 'critical',
            title: `Dependency Blocker: ${t.name}`,
            body: `Waiting on incomplete prerequisite(s): ${incompleteBlockers.map((b: any) => b?.name).join(', ')}`,
            targetView: 'tasks',
            itemId: t.id
          });
        }
      }
    }
  });

  // 4. OVERLOADED TEAM MEMBERS (>160h active work)
  members.forEach(m => {
    const activeLoad = tasks
      .filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED)
      .reduce((sum, t) => sum + (parseFloat(String(t.estEffort || 0)) || 8), 0);
    if (activeLoad > 160) {
      alerts.push({
        id: `overload-${m.id}`,
        type: 'OVERLOADED_MEMBER',
        severity: 'warning',
        title: `Capacity Overload: ${m.name}`,
        body: `${activeLoad}h assigned across active backlog (Monthly threshold: 160h). Reallocation recommended.`,
        targetView: 'capacity',
        itemId: String(m.id)
      });
    }
  });

  // 5. UNRESOLVED CRITICAL DEFECTS (S1 / S2)
  defects.forEach(d => {
    if (d.status !== DefectStatus.CLOSED && d.status !== DefectStatus.DEFERRED) {
      const isS1 = d.severity?.startsWith('S1');
      const isS2 = d.severity?.startsWith('S2');
      if (isS1 || isS2) {
        alerts.push({
          id: `defect-${d.id}`,
          type: 'CRITICAL_DEFECT',
          severity: isS1 ? 'critical' : 'warning',
          title: `Critical Bug: ${d.id} — ${d.title}`,
          body: `${d.severity} • Status: ${d.status} • Assignee: ${d.assignee || 'Unassigned'}`,
          targetView: 'defects',
          itemId: d.id
        });
      }
    }
  });

  // 6. HIGH-RISK RAID ITEMS
  raids.forEach(r => {
    if (r.status === 'Open' && r.type === 'Risk' && r.probability === 'High' && r.impact === 'High') {
      alerts.push({
        id: `raid-${r.id}`,
        type: 'HIGH_RISK_RAID',
        severity: 'critical',
        title: `Severe Risk: ${r.title}`,
        body: `High Probability / High Impact risk identified. Mitigation plan required.`,
        targetView: 'risks',
        itemId: r.id
      });
    }
  });

  return alerts;
}

export const SmartAlertsCenter: React.FC<SmartAlertsCenterProps> = ({ isOpen, onClose }) => {
  const { state, setView } = useProject();
  const { hasViewAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'warning' | 'dismissed'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());

  // ══════ SMART ALERTS ENGINE (Matches projectpulse.html computeAlerts) ══════
  const allAlerts = useMemo(() => {
    return computeAlerts(state).filter(a => !a.targetView || hasViewAccess(a.targetView));
  }, [state.tasks, state.members, state.defects, state.raids, hasViewAccess]);

  const activeAlerts = useMemo(() => allAlerts.filter(a => !dismissedIds.has(a.id)), [allAlerts, dismissedIds]);
  const dismissedAlerts = useMemo(() => allAlerts.filter(a => dismissedIds.has(a.id)), [allAlerts, dismissedIds]);

  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.severity === 'warning').length;

  const displayedAlerts = useMemo(() => {
    if (activeTab === 'dismissed') return dismissedAlerts;
    if (activeTab === 'critical') return activeAlerts.filter(a => a.severity === 'critical');
    if (activeTab === 'warning') return activeAlerts.filter(a => a.severity === 'warning');
    return activeAlerts;
  }, [activeTab, activeAlerts, dismissedAlerts]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const handleRestore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDismissAll = () => {
    setDismissedIds(new Set(allAlerts.map(a => a.id)));
  };

  const handleNavigate = (alert: SmartAlert) => {
    setView(alert.targetView);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex motion-safe:animate-in motion-safe:fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs" onClick={onClose} />

      {/* Flyout Drawer */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        className="ml-auto w-full max-w-md bg-[var(--color-surface)] h-full relative shadow-2xl flex flex-col border-l border-[var(--color-divider)] text-[var(--color-text)] z-10"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base leading-none flex items-center gap-2">
                <span>Smart Alerts Center</span>
                {activeAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px]">
                    {activeAlerts.length}
                  </span>
                )}
                <SectionHelpButton view="overview" section="Early Warning System" label="Smart Alerts guide" size={13} />
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] cursor-pointer"
            aria-label="Close Smart Alerts Center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Operational Filter Tabs */}
        <div className="p-2 border-b border-[var(--color-divider)] bg-[var(--color-surface)] flex items-center justify-between gap-1 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer",
                activeTab === 'all' ? "bg-[var(--color-surface-2)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              All ({activeAlerts.length})
            </button>
            <button
              onClick={() => setActiveTab('critical')}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1",
                activeTab === 'critical' ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <AlertCircle size={12} className="text-rose-500" />
              <span>Critical ({criticalCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('warning')}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1",
                activeTab === 'warning' ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <AlertTriangle size={12} className="text-amber-500" />
              <span>Warnings ({warningCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('dismissed')}
              className={clsx(
                "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer",
                activeTab === 'dismissed' ? "bg-[var(--color-surface-2)] text-[var(--color-text)]" : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
              )}
            >
              Dismissed ({dismissedAlerts.length})
            </button>
          </div>

          {activeAlerts.length > 0 && activeTab !== 'dismissed' && (
            <button 
              onClick={handleDismissAll}
              className="text-[11px] font-semibold text-[var(--color-primary-hex)] hover:underline whitespace-nowrap px-1 cursor-pointer"
            >
              Dismiss All
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scroll">
          {displayedAlerts.map(alert => {
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                onClick={() => handleNavigate(alert)}
                className={clsx(
                  "p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col space-y-1.5 shadow-2xs hover:shadow-xs",
                  isCritical 
                    ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/25" 
                    : "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/25"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <h4 className="font-bold text-xs text-[var(--color-text)] leading-snug">
                      {alert.title}
                    </h4>
                  </div>

                  {activeTab !== 'dismissed' ? (
                    <button
                      onClick={(e) => handleDismiss(alert.id, e)}
                      title="Dismiss alert"
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] rounded transition-opacity cursor-pointer shrink-0"
                    >
                      <X size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleRestore(alert.id, e)}
                      title="Restore alert"
                      className="text-[10px] font-bold text-[var(--color-primary-hex)] hover:underline cursor-pointer"
                    >
                      Restore
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[var(--color-text-muted)] pl-6 leading-relaxed">
                  {alert.body}
                </p>

                <div className="pl-6 pt-1 flex items-center justify-between text-[10px] font-semibold text-[var(--color-primary-hex)]">
                  <span className="flex items-center gap-1 group-hover:underline">
                    <span>Jump to {alert.targetView}</span>
                    <ChevronRight size={11} />
                  </span>
                  <span className="text-[var(--color-text-faint)] font-mono uppercase">{alert.type.replace(/_/g, ' ')}</span>
                </div>
              </div>
            );
          })}

          {displayedAlerts.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <CheckCircle2 size={36} className="mx-auto text-emerald-500 opacity-60" />
              <h3 className="font-bold text-sm text-[var(--color-text)]">
                {activeTab === 'dismissed' ? 'No Dismissed Alerts' : 'All Clear — Zero Active Alerts'}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                {activeTab === 'dismissed' 
                  ? 'Alerts you dismiss will be cataloged here for reference.'
                  : 'No critical delivery slippages, blocker dependencies, or capacity overloads detected.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--color-surface-2)] border-t border-[var(--color-divider)] flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-[var(--color-text-faint)]">
            Computed across {state.tasks.length} tasks and {state.defects?.length || 0} defects
          </span>
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)] font-semibold hover:bg-[var(--color-surface-2)] cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SmartAlertsCenter;
