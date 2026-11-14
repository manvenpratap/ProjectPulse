import type { FC } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { TaskStatus } from '../../types';
import { Users, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import SectionHelpButton from '../shared/SectionHelpButton';

export const ResourceUtilizationMatrix: FC = () => {
  const { state, setView } = useProject();
  const { hasViewAccess } = useAuth();
  const { members = [], tasks = [] } = state;

  return (
    <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Users size={20} />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-base text-[var(--color-text)]">Resource Utilization Matrix</h3>
            <SectionHelpButton view="capacity" section="Daily Load Thresholds" label="Resource Utilization guide" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-[var(--color-text-faint)]">
            Member Directory ({members.length} FTEs)
          </span>
          {hasViewAccess('capacity') && (
            <button
              onClick={() => setView('capacity')}
              className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Capacity Leveling</span>
              <ArrowRight size={13} className="shrink-0" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.slice(0, 12).map(m => {
          const activeTasks = tasks.filter(t => t.assignee === m.name && t.status !== TaskStatus.COMPLETED);
          const totalActiveEffort = activeTasks.reduce((sum, t) => sum + (parseFloat(String(t.estEffort || t.estDays || 3)) || 3), 0);
          const utilizationPct = Math.min(Math.round((totalActiveEffort / 10) * 100), 150);

          return (
            <div
              key={m.id}
              className="p-4 rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 hover:border-[var(--color-primary-hex)]/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-xs text-[var(--color-text)] leading-tight truncate">{m.name}</h4>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">{m.role || 'Contributor'}</p>
                  </div>
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0",
                    utilizationPct > 100 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                    utilizationPct >= 70 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    "bg-indigo-500/10 text-indigo-600 border-indigo-500/20"
                  )}>
                    {utilizationPct > 100 ? 'Overloaded' : utilizationPct >= 70 ? 'Balanced' : 'Available'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-[var(--color-text-muted)] mb-1.5 font-medium">
                  <span>Workload Intensity</span>
                  <span className="font-mono font-bold text-[var(--color-text)]">{utilizationPct}%</span>
                </div>
                <div className="w-full bg-[var(--color-surface)] h-2 rounded-full overflow-hidden border border-[var(--color-divider)]">
                  <div 
                    className={clsx(
                      "h-full rounded-full transition-all",
                      utilizationPct > 100 ? "bg-rose-500" :
                      utilizationPct >= 70 ? "bg-emerald-500" :
                      "bg-indigo-500"
                    )}
                    style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--color-divider)] flex justify-between items-center text-[11px] text-[var(--color-text-faint)]">
                <span>{activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}</span>
                <span className="font-mono font-bold text-[var(--color-text-muted)]">{totalActiveEffort}d effort</span>
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="py-8 text-center text-xs text-[var(--color-text-muted)]">
          No team members registered. Add contributors in Team Hub to activate utilization metrics.
        </div>
      )}
    </div>
  );
};

export default ResourceUtilizationMatrix;
