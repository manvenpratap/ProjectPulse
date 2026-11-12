import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { TaskStatus, TaskPriority } from '../../types';
import { getHealthScore, addBusDays } from '../../utils/projectUtils';
import { Sliders, RotateCcw, Check, Zap, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import SectionHelpButton from '../shared/SectionHelpButton';
import { toast } from '../../utils/toast';

export const WhatIfSandbox: React.FC = () => {
  const { state, updateProject, addLog } = useProject();
  const { canPerform } = useAuth();
  const { tasks = [], members = [] } = state;

  const healthScore = getHealthScore(tasks);

  // Overloaded members count
  const overloadedCount = members.filter(m => {
    const mTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED);
    return mTasks.length > 4;
  }).length;

  // Simulation Sliders State
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
  const daysDelta = (addEngineers * -2) + (scopeReduction * -1) + (timeCompression * -2);
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
      toast.success("Simulation committed to live project state! Tasks, team allocation, and schedules synchronized.");
    }
  };

  return (
    <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-divider)]">
        <div className="flex items-center gap-2">
          <Sliders className="text-[var(--color-primary-hex)] shrink-0" size={18} />
          <h3 className="font-sans text-base sm:text-lg font-bold text-[var(--color-text)]">Strategic What-If Sandbox</h3>
          <SectionHelpButton view="dash" section="Strategic What-If Sandbox" label="What-If Sandbox guide" />
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={resetWhatIf}
            className="px-3 py-1.5 border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            aria-label="Reset simulation parameters"
          >
            <RotateCcw size={12} /> Reset Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sliders (LHS) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Additional Engineers Slider */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)]">
            <div className="flex justify-between text-xs font-semibold text-[var(--color-text)]">
              <span>Additional Engineering Resources</span>
              <span className="text-xs font-bold text-[var(--color-primary-hex)] font-mono">+{addEngineers} FTEs</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5" 
              value={addEngineers} 
              onChange={(e) => setAddEngineers(parseInt(e.target.value))}
              className="w-full accent-[var(--color-primary-hex)] h-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
              <span>Baseline (0)</span>
              <span>+5 Consulting Devs</span>
            </div>
          </div>

          {/* Scope Reduction Slider */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)]">
            <div className="flex justify-between text-xs font-semibold text-[var(--color-text)]">
              <span>Scope Descoping / Backlog Reduction</span>
              <span className="text-xs font-bold text-[var(--color-primary-hex)] font-mono">-{scopeReduction}% scope</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="40" 
              value={scopeReduction} 
              onChange={(e) => setScopeReduction(parseInt(e.target.value))}
              className="w-full accent-[var(--color-primary-hex)] h-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
              <span>100% Scope Baseline</span>
              <span>-40% Non-critical Features</span>
            </div>
          </div>

          {/* Timeline Compression Slider */}
          <div className="space-y-1.5 p-4 rounded-2xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)]">
            <div className="flex justify-between text-xs font-semibold text-[var(--color-text)]">
              <span>Timeline Schedule Compression</span>
              <span className="text-xs font-bold text-[var(--color-primary-hex)] font-mono">{timeCompression}% faster</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="30" 
              value={timeCompression} 
              onChange={(e) => setTimeCompression(parseInt(e.target.value))}
              className="w-full accent-[var(--color-primary-hex)] h-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--color-text-muted)]">
              <span>Standard Pacing</span>
              <span>30% Sprint Crunch</span>
            </div>
          </div>
        </div>

        {/* Simulated Outcomes (RHS) */}
        <div className="lg:col-span-5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-2xl p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-[var(--color-text-muted)] font-medium">Simulated Confidence</div>
            <div className={clsx(
              "text-2xl font-mono font-bold",
              simConfidence > 80 ? "text-emerald-500" : simConfidence > 50 ? "text-amber-500" : "text-rose-500"
            )}>
              {simConfidence}%
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)]">Baseline: 75%</p>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[var(--color-text-muted)] font-medium">Simulated Health</div>
            <div className={clsx(
              "text-2xl font-mono font-bold",
              simHealth > 80 ? "text-emerald-500" : simHealth > 50 ? "text-amber-500" : "text-rose-500"
            )}>
              {simHealth}%
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)]">Current: {healthScore}%</p>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[var(--color-text-muted)] font-medium">Delivery Delta</div>
            <div className="text-2xl font-mono font-bold text-[var(--color-primary-hex)]">
              {daysDelta !== 0 ? `${daysDelta} days` : 'Stable'}
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)]">Schedule offset</p>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-[var(--color-text-muted)] font-medium">Capacity Balance</div>
            <div className={clsx(
              "text-2xl font-mono font-bold",
              simShortfall <= 0 ? "text-emerald-500" : "text-amber-500"
            )}>
              {simShortfall <= 0 ? 'Optimal' : `${simShortfall} Overload`}
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)]">FTE loading gap</p>
          </div>

          {canPerform('canEditTask') && (
            <div className="col-span-2 pt-3 border-t border-[var(--color-divider)] mt-1">
              <button 
                onClick={handleCommitSimulation}
                disabled={simulationCommitted}
                className={clsx(
                  "w-full h-11 rounded-xl text-xs font-bold whitespace-nowrap active:scale-[0.98] motion-safe:transition-transform flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed",
                  simulationCommitted 
                    ? "bg-emerald-600 text-white cursor-default" 
                    : "bg-[var(--color-primary-hex)] hover:opacity-95 text-[var(--color-primary-text)]"
                )}
              >
                {simulationCommitted ? (
                  <>
                    <Check size={14} /> <span>Simulation Committed to State</span>
                  </>
                ) : (
                  <>
                    <Sliders size={14} /> <span>Commit Simulation to Project</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatIfSandbox;
