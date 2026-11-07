import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { TaskStatus, TaskPriority, RaidItem, Decision } from '../../types';
import { getHealthScore, daysDiff, addBusDays } from '../../utils/projectUtils';
import { 
  Presentation, 
  ShieldAlert, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  HelpCircle, 
  Users, 
  Sparkles, 
  Layers,
  Activity,
  Milestone,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers2,
  GitCommit,
  Check,
  Zap,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';
import { exportProjectExcel } from '../../services/excelService';

const OverviewView: React.FC = () => {
  const { state, setView, updateProject, addLog } = useProject();
  const { tasks = [], raids = [], decisions = [], members = [], log = [] } = state;

  // 1. Calculate Core Health metrics
  const healthScore = getHealthScore(tasks);
  const doneTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0;

  // Active Risks (High Impact)
  const activeHighRaids = raids.filter(r => r.status === 'Active' && r.impact === 'High');

  // Pending Decisions
  const pendingDecisions = decisions.filter(d => d.status === 'Pending Sign-off');

  // Overdue tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.status !== TaskStatus.COMPLETED && t.dueDate < todayStr);

  // 2. Early Warning System (EWS) Alerts
  const ewsAlerts: { id: string; label: string; desc: string; type: 'critical' | 'warning' | 'info'; icon: any }[] = [];

  if (overdueTasks.length > 0) {
    ewsAlerts.push({
      id: 'overdue',
      label: 'Overdue Deliverables',
      desc: `${overdueTasks.length} active task${overdueTasks.length > 1 ? 's are' : ' is'} currently past due dates.`,
      type: 'critical',
      icon: Clock
    });
  }

  if (activeHighRaids.length > 0) {
    ewsAlerts.push({
      id: 'high-raids',
      label: 'High Threat RAID Items',
      desc: `${activeHighRaids.length} active Risk/Issue${activeHighRaids.length > 1 ? 's are' : ' is'} flagged at High Impact.`,
      type: 'critical',
      icon: ShieldAlert
    });
  }

  if (pendingDecisions.length > 0) {
    ewsAlerts.push({
      id: 'pending-decisions',
      label: 'Steering Decisions Pending',
      desc: `${pendingDecisions.length} core business decision${pendingDecisions.length > 1 ? 's are' : ' is'} awaiting sign-off.`,
      type: 'warning',
      icon: FileText
    });
  }

  // Check for resource overload
  const overloadedCount = members.filter(m => {
    const mTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED);
    return mTasks.length > 4;
  }).length;

  if (overloadedCount > 0) {
    ewsAlerts.push({
      id: 'overload',
      label: 'Resource Overload Risk',
      desc: `${overloadedCount} team member${overloadedCount > 1 ? 's have' : ' has'} more than 4 concurrent active tasks.`,
      type: 'warning',
      icon: Users
    });
  }

  // Fallback if no warnings
  if (ewsAlerts.length === 0) {
    ewsAlerts.push({
      id: 'optimal',
      label: 'All Indicators Optimal',
      desc: 'Telemetry scan confirms zero critical timeline slip risk, active bottlenecks, or RAID blockages.',
      type: 'info',
      icon: CheckCircle
    });
  }

  // 3. Milestones & Major Deliverables (Tasks categorized as Server Module, GUI Screen or High Priority)
  const criticalMilestones = tasks
    .filter(t => t.priority === TaskPriority.CRITICAL || t.priority === TaskPriority.HIGH)
    .slice(0, 5);

  // 4. What-If Simulation Sandbox State
  const [addEngineers, setAddEngineers] = useState(0);
  const [scopeReduction, setScopeReduction] = useState(0);
  const [timeCompression, setTimeCompression] = useState(0);
  const [simulationCommitted, setSimulationCommitted] = useState(false);

  const resetWhatIf = () => {
    setAddEngineers(0);
    setScopeReduction(0);
    setTimeCompression(0);
    setSimulationCommitted(false);
  };

  // Simulating output values
  const simConfidence = Math.max(10, Math.min(98, 75 + (addEngineers * 5) + (scopeReduction * 0.5) - (timeCompression * 1.2)));
  const simHealth = Math.max(10, Math.min(100, Math.round(healthScore + (addEngineers * 3) + (scopeReduction * 0.4) - (timeCompression * 0.8))));
  const daysDelta = (addEngineers * -2) + (scopeReduction * -1) + (timeCompression * -2); // advances by e.g. -15 days
  const simShortfall = Math.max(0, overloadedCount - addEngineers);

  const handleCommitSimulation = () => {
    if (confirm("Are you sure you want to commit this simulation to the live project state? This will alter active task schedules, re-allocate resources, and adjust scope according to your simulation values.")) {
      let updatedTasks = [...tasks];
      let updatedMembers = [...members];
      let balanceLogs = 0;

      // 1. Shift deadlines (Timeline compression / daysDelta)
      if (daysDelta !== 0) {
        updatedTasks = updatedTasks.map(t => {
          if (t.status === TaskStatus.COMPLETED) return t;
          try {
            return {
              ...t,
              dueDate: addBusDays(t.dueDate, daysDelta),
              startDate: addBusDays(t.startDate, daysDelta)
            };
          } catch (e) {
            return t;
          }
        });
      }

      // 2. Add engineers
      if (addEngineers > 0) {
        for (let i = 1; i <= addEngineers; i++) {
          const devName = `Sandbox Dev ${String.fromCharCode(64 + i)}`;
          if (!updatedMembers.some(m => m.name === devName)) {
            updatedMembers.push({
              id: `MEM-SB-${i}`,
              name: devName,
              role: 'Consulting Engineer',
              status: 'Active',
              reportsTo: 'Sarah Chen',
              email: `${devName.toLowerCase().replace(' ', '')}@projectpulse.io`,
              phone: '+1 (555) simulation',
              birthday: '2026-01-01',
              plannedLeaves: []
            });
            balanceLogs++;
          }
        }
      }

      // 3. Rescope (reduce non-critical tasks)
      if (scopeReduction > 0) {
        const incompleteTasks = updatedTasks.filter(t => t.status !== TaskStatus.COMPLETED);
        const countToRemove = Math.min(incompleteTasks.length, Math.round((scopeReduction / 100) * tasks.length));
        if (countToRemove > 0) {
          const tasksToRemove = [...incompleteTasks]
            .sort((a, b) => {
              const prioMap = { [TaskPriority.LOW]: 1, [TaskPriority.MEDIUM]: 2, [TaskPriority.HIGH]: 3, [TaskPriority.CRITICAL]: 4 };
              return prioMap[a.priority] - prioMap[b.priority];
            })
            .slice(0, countToRemove);
          
          updatedTasks = updatedTasks.filter(t => !tasksToRemove.some(rem => rem.id === t.id));
          balanceLogs += countToRemove;
        }
      }

      // Save to global context
      updateProject({
        tasks: updatedTasks,
        members: updatedMembers
      });

      // Log event
      addLog('Simulation Committed', 'ALL', `Committed simulation: added ${addEngineers} devs, descoped ${scopeReduction}%, shifted by ${daysDelta} days.`);
      setSimulationCommitted(true);
      alert("Simulation successfully committed to live project state! Tasks, team allocation, and schedules have been synchronized.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll pb-16">
      <div className="px-4 md:px-8 py-8 md:py-12 max-w-[1400px] mx-auto w-full space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--color-divider)]">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Executive Overview</div>
              <div className="w-1 h-1 rounded-full bg-[var(--color-divider)]" />
              <span className="text-xs font-bold text-[var(--color-text-faint)] uppercase">Project Pulse Dial</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black tracking-tight text-[var(--color-text)] mb-3">Executive Summary</h1>
            <p className="text-[var(--color-text-muted)] text-sm max-w-xl leading-relaxed">
              Composite health index, early warning signals, resource utilization, and major active workstreams.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => exportProjectExcel(state)}
              className="h-12 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] transition-all"
            >
              <FileSpreadsheet size={16} /> Export to Excel
            </button>
            <button 
              onClick={() => setView('dash')}
              className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <TrendingUp size={16} /> Advanced Analytics
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Health Index Dial Component */}
          <div className="card p-8 flex flex-col justify-between items-center text-center bg-gradient-to-br from-indigo-50/20 to-indigo-100/10 border-indigo-100/50 shadow-sm">
            <div className="space-y-1 text-center w-full">
              <h3 className="font-black text-sm text-slate-850">Composite Health Index</h3>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Real-Time Score Dial</p>
            </div>

            <div className="relative w-44 h-44 my-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="88" 
                  cy="88" 
                  r="72" 
                  className="stroke-slate-100 fill-none" 
                  strokeWidth="14" 
                />
                <circle 
                  cx="88" 
                  cy="88" 
                  r="72" 
                  className={clsx(
                    "fill-none transition-all duration-1000",
                    healthScore > 80 ? "stroke-emerald-500" : healthScore > 50 ? "stroke-amber-500" : "stroke-rose-500"
                  )}
                  strokeWidth="14" 
                  strokeDasharray="452.3"
                  strokeDashoffset={452.3 - (452.3 * healthScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-black tracking-tight text-slate-900">{healthScore}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Delivery confidence</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Completed</div>
                <div className="text-xl font-display font-black text-slate-800">{progressPct}%</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Active backlog</div>
                <div className="text-xl font-display font-black text-slate-800">{totalTasks - doneTasks.length} tasks</div>
              </div>
            </div>
          </div>

          {/* Early Warning System (EWS) */}
          <div className="lg:col-span-2 card p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-1 mb-6">
              <h3 className="font-bold text-sm">Early Warning System (EWS)</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Bottleneck and Slippage Alerts</p>
            </div>

            <div className="space-y-4 flex-1">
              {ewsAlerts.map(alert => (
                <div 
                  key={alert.id} 
                  className={clsx(
                    "p-4 rounded-2xl border flex gap-4 items-start transition-all",
                    alert.type === 'critical' ? "bg-rose-50/50 border-rose-200/50 text-rose-800" :
                    alert.type === 'warning' ? "bg-amber-50/50 border-amber-200/50 text-amber-800" :
                    "bg-emerald-50/30 border-emerald-100 text-emerald-800"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    alert.type === 'critical' ? "bg-rose-500 text-white" :
                    alert.type === 'warning' ? "bg-amber-500 text-white" :
                    "bg-emerald-500 text-white"
                  )}>
                    <alert.icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">{alert.label}</h4>
                    <p className="text-xs opacity-90 leading-relaxed mt-1">{alert.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Milestone Roadmap Widget */}
        <div className="card p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm">Milestone Roadmap Widget</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">A chronological track showing milestones, reached nodes, and target dates.</p>
            </div>
            <button onClick={() => setView('timeline')} className="text-xs font-bold text-indigo-600 hover:underline">View Timeline</button>
          </div>
          
          <div className="relative py-4">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 z-0" />
            <div className="relative z-10 flex justify-between items-center gap-4 overflow-x-auto pb-4 custom-scroll">
              {criticalMilestones.map((t, idx) => {
                const isDone = t.status === TaskStatus.COMPLETED;
                return (
                  <div key={t.id} className="flex flex-col items-center text-center min-w-[160px] space-y-3 shrink-0">
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center border-4 font-black text-xs transition-all shadow-sm",
                      isDone 
                        ? "bg-emerald-550 text-white border-emerald-200" 
                        : "bg-white text-indigo-600 border-indigo-200"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">{t.name}</div>
                      <div className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">{t.dueDate}</div>
                      <span className={clsx(
                        "inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase mt-1.5 tracking-wider",
                        isDone ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      )}>
                        {isDone ? 'REACHED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {criticalMilestones.length === 0 && (
                <div className="w-full py-6 text-center text-slate-400 text-xs">No milestone-grade deliverables found in active tasks.</div>
              )}
            </div>
          </div>
        </div>

        {/* Resource Utilization Widget */}
        <div className="card p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm">Resource Utilization Matrix</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Individual resource cards with utilization metrics and active task lists.</p>
            </div>
            <button onClick={() => setView('capacity')} className="text-xs font-bold text-indigo-600 hover:underline">View Capacity</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.slice(0, 8).map(m => {
              const activeTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED);
              const totalActiveEffort = activeTasks.reduce((sum, t) => sum + t.estDays, 0);
              const utilizationPct = Math.min(Math.round((totalActiveEffort / 10) * 100), 150); // Assumes 10 days capacity
              return (
                <div key={m.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 leading-tight">{m.name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{m.role || 'Contributor'}</p>
                      </div>
                      <span className={clsx(
                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                        utilizationPct > 100 ? "bg-rose-50 text-rose-600 border border-rose-100" :
                        utilizationPct > 60 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}>
                        {utilizationPct}% Util
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden mb-4 shadow-inner">
                      <div 
                        className={clsx(
                          "h-full rounded-full transition-all duration-1000",
                          utilizationPct > 100 ? "bg-rose-500" :
                          utilizationPct > 60 ? "bg-amber-500" :
                          "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-2 pt-3 border-t border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Active tasks:</div>
                    {activeTasks.slice(0, 2).map(t => (
                      <div key={t.id} className="text-xs text-slate-700 font-bold flex justify-between gap-2">
                        <span className="truncate">• {t.name}</span>
                        <span className="font-mono text-[10px] text-indigo-600 shrink-0">{t.estDays}d</span>
                      </div>
                    ))}
                    {activeTasks.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-bold uppercase italic mt-1">+ {activeTasks.length - 2} more active tasks</div>
                    )}
                    {activeTasks.length === 0 && (
                      <div className="text-xs text-slate-400 italic">No active tasks allocated.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What-If Sandbox Dashboard Widget */}
        <div className="card p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-none shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-400 pointer-events-none">
            <Sparkles size={200} />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-indigo-400 animate-pulse" size={16} />
                  <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Dynamic Copilot Sandbox</span>
                </div>
                <h3 className="font-display text-xl font-black">Strategic What-If Scenario Modeler</h3>
                <p className="text-slate-300 text-xs mt-1">Simulate changes in engineering resources, project scope, and timelines to forecast risk posture.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={resetWhatIf}
                  className="px-4 py-2 border border-white/20 hover:border-white/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <RotateCcw size={12} /> Reset Simulation
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Sliders (LHS) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Additional Engineers Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">Additional Engineering Resources</span>
                    <span className="text-indigo-400">+{addEngineers} Headcount</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="5" 
                    value={addEngineers} 
                    onChange={(e) => setAddEngineers(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>None</span>
                    <span>+5 Developers</span>
                  </div>
                </div>

                {/* Scope Reduction Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">Scope Rescoping / Feature Descoping</span>
                    <span className="text-indigo-400">-{scopeReduction}% Backlog Reduction</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="40" 
                    value={scopeReduction} 
                    onChange={(e) => setScopeReduction(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>Full Scope</span>
                    <span>-40% Non-critical Features</span>
                  </div>
                </div>

                {/* Timeline Compression Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200">Timeline Schedule Compression</span>
                    <span className="text-indigo-400">{timeCompression}% Faster Deadline</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    value={timeCompression} 
                    onChange={(e) => setTimeCompression(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>Normal pacing</span>
                    <span>30% compression (Sprint crunch)</span>
                  </div>
                </div>
              </div>

              {/* Simulated Outcomes (RHS) */}
              <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Simulated Confidence</div>
                  <div className={clsx(
                    "text-2xl font-display font-black",
                    simConfidence > 80 ? "text-emerald-400" : simConfidence > 50 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {simConfidence}%
                  </div>
                  <p className="text-[9px] text-slate-400">Baseline level: 75%</p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Simulated Health</div>
                  <div className={clsx(
                    "text-2xl font-display font-black",
                    simHealth > 80 ? "text-emerald-400" : simHealth > 50 ? "text-amber-400" : "text-rose-400"
                  )}>
                    {simHealth}%
                  </div>
                  <p className="text-[9px] text-slate-400">Current index: {healthScore}%</p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">P90 Delivery Delta</div>
                  <div className="text-2xl font-display font-black text-indigo-300">
                    {daysDelta !== 0 ? `${daysDelta} days` : 'Stable'}
                  </div>
                  <p className="text-[9px] text-slate-400">Target delivery date offset</p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Capacity Balance</div>
                  <div className={clsx(
                    "text-2xl font-display font-black",
                    simShortfall <= 0 ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {simShortfall <= 0 ? 'Surplus (+2)' : `${simShortfall} Overloaded`}
                  </div>
                  <p className="text-[9px] text-slate-400">FTE resource loading gap</p>
                </div>

                <div className="col-span-2 pt-4 border-t border-white/10 mt-2">
                  <button 
                    onClick={handleCommitSimulation}
                    disabled={simulationCommitted}
                    className={clsx(
                      "w-full h-11 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg",
                      simulationCommitted 
                        ? "bg-emerald-600 text-white cursor-default" 
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    )}
                  >
                    {simulationCommitted ? (
                      <>
                        <Check size={14} /> Simulation Committed
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Commit Simulation to Live State
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Governance & Critical Path Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Critical Path Deliverables */}
          <div className="card p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-sm">Critical Path Deliverables</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">High & Critical Priority Telemetry</p>
              </div>
              <button onClick={() => setView('tasks')} className="text-xs font-bold text-indigo-600 hover:underline">View Matrix</button>
            </div>

            <div className="divide-y divide-slate-100">
              {criticalMilestones.length > 0 ? criticalMilestones.map(t => (
                <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="truncate flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">{t.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{t.id} • {t.assignee || 'Unassigned'}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={clsx(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                      t.status === TaskStatus.COMPLETED ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      t.status === TaskStatus.ON_HOLD ? "bg-red-50 text-red-600 border border-red-100" :
                      "bg-amber-50 text-amber-600 border border-amber-100"
                    )}>{t.status}</span>
                    <span className="font-mono text-xs text-slate-500 font-bold">{t.dueDate}</span>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center text-slate-400 text-xs">No high or critical deliverables mapped.</div>
              )}
            </div>
          </div>

          {/* Governance & Steerco Panel */}
          <div className="card p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-sm">Steering Decisions Log</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Sign-off vs Approved State</p>
              </div>
              <button onClick={() => setView('risks')} className="text-xs font-bold text-indigo-600 hover:underline">View RAID</button>
            </div>

            <div className="divide-y divide-slate-100">
              {decisions.slice(0, 5).map(d => (
                <div key={d.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900">{d.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Proposed: {d.proposedBy} • Approver: {d.approver}</div>
                  </div>
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0",
                    d.status === 'Approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    d.status === 'Rejected' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                    "bg-amber-50 text-amber-600 border border-amber-100"
                  )}>{d.status}</span>
                </div>
              ))}
              {decisions.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">No strategic decisions logged. Navigate to RAID Register to log decisions.</div>
              )}
            </div>
          </div>

        </div>

        {/* Change History Delta Stream */}
        <div className="card p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-sm">Project History Change Delta</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Audit Trail Stream</p>
            </div>
            <button onClick={() => setView('log')} className="text-xs font-bold text-indigo-600 hover:underline">Full Log</button>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto custom-scroll">
            {log.slice().reverse().slice(0, 6).map((l, i) => (
              <div key={i} className="py-3 flex items-center gap-4 text-xs font-medium">
                <div className="w-20 font-mono text-[10px] text-slate-400 shrink-0">{l.ts.split('T')[0]} {l.ts.split('T')[1]?.substring(0, 5)}</div>
                <div className="w-16 text-[10px] font-black uppercase text-indigo-600 tracking-wider shrink-0">{l.action}</div>
                <div className="flex-1 truncate text-slate-700 font-bold">{l.taskId}: {l.taskName}</div>
                <div className="text-[10px] text-slate-400 shrink-0">{l.assignee}</div>
              </div>
            ))}
            {log.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">No activity entries registered.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewView;
