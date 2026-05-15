import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { getHealthScore, daysDiff } from '../../utils/projectUtils';
import { 
  Zap, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Clock,
  Layers,
  Users,
  BarChart3,
  Search,
  Plus
} from 'lucide-react';
import clsx from 'clsx';
import { TaskStatus } from '../../types';
import PredictiveIntelligence from './PredictiveIntelligence';
import ModuleDeliveryMatrix from './ModuleDeliveryMatrix';
import BurndownChart from './BurndownChart';

const DashboardView: React.FC = () => {
  const { state, setView } = useProject();
  const tasks = state.tasks;
  const health = getHealthScore(tasks);
  const doneCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const inProgCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.UNDER_REVIEW).length;
  const blockedCount = tasks.filter(t => t.status === TaskStatus.ON_HOLD).length;
  
  const completionPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const stats = [
    { label: 'Total Volume', value: tasks.length, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Baseline scale' },
    { label: 'Value Delivered', value: doneCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: `${completionPct}% Complete` },
    { label: 'Active Pipeline', value: inProgCount, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'In production' },
    { label: 'Risk Factors', value: blockedCount, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', sub: 'Require action' },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll">
      <div className="px-8 py-12 max-w-[1400px] mx-auto w-full space-y-16">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-[var(--color-divider)]">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-200">Executive Hub</div>
               <div className="w-1 h-1 rounded-full bg-[var(--color-divider)]" />
               <span className="text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-tight">System Status: Optimal</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-text)] mb-4">Project Intelligence</h1>
            <p className="text-[var(--color-text-muted)] text-sm max-w-xl leading-relaxed">
              Real-world delivery telemetry, predictive forecasting, and strategic alignment across all project architecture layers.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl p-6 flex items-center gap-8 shadow-xl shadow-black/5 ring-1 ring-black/5">
              <div className="text-center shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-2">Health Index</div>
                <div className={clsx(
                  "text-4xl font-display font-black leading-none",
                  health > 80 ? "text-emerald-500" : health > 50 ? "text-amber-500" : "text-red-500"
                )}>{health}%</div>
              </div>
              <div className="w-[1px] h-12 bg-[var(--color-divider)]" />
              <div className="text-center shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)] mb-2">Aggregate Progress</div>
                <div className="text-4xl font-display font-black text-indigo-500 leading-none">{completionPct}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="card p-8 flex flex-col justify-between group hover:ring-2 hover:ring-indigo-500/20">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] group-hover:text-[var(--color-primary-hex)] transition-colors">
                    {stat.label}
                  </span>
                  <div className="text-4xl font-display font-black mt-2 leading-none">{stat.value}</div>
                </div>
                <div className={clsx("p-3.5 rounded-2xl transition-all group-hover:scale-110 shadow-sm", stat.bg, stat.color)}>
                  <stat.icon size={22} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-faint)]">
                 <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                 {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Strategic Matrix */}
        <ModuleDeliveryMatrix />

        {/* Charts Section */}
        <BurndownChart />

        {/* Predictive Section */}
        <PredictiveIntelligence />

        {/* Bottom Detail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          <div className="lg:col-span-2 space-y-8">
             <div className="card p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-550 shadow-sm">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">Critical Risks & Overdue Tasks</h3>
                    <p className="text-xs text-[var(--color-text-faint)] font-bold uppercase tracking-tighter mt-0.5">Immediate intervention required</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.filter(t => daysDiff(t.dueDate)! < 0 && t.status !== TaskStatus.COMPLETED).slice(0, 6).map(t => (
                    <div 
                      key={t.id} 
                      onClick={() => setView('tasks')}
                      className="flex items-center justify-between p-4 rounded-2xl bg-red-50/30 border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer group"
                    >
                       <div className="min-w-0">
                         <div className="text-[10px] font-mono font-bold text-red-600 mb-1">{t.id}</div>
                         <div className="text-[13px] font-bold truncate pr-4">{t.name}</div>
                       </div>
                       <div className="text-right shrink-0">
                          <div className="text-[11px] font-black text-red-600">{Math.abs(daysDiff(t.dueDate)!)}d LATE</div>
                          <div className="text-[9px] font-bold text-red-400 uppercase mt-0.5 group-hover:text-red-600">Action &rarr;</div>
                       </div>
                    </div>
                  ))}
                </div>
                
                {tasks.filter(t => daysDiff(t.dueDate)! < 0 && t.status !== TaskStatus.COMPLETED).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-emerald-500">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <div className="font-bold text-lg">Schedule Compliant</div>
                    <p className="text-sm text-[var(--color-text-faint)] mt-1 italic">No overdue tasks detected.</p>
                  </div>
                )}
             </div>
          </div>

          <div className="space-y-8">
            <div className="card p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-2xl shadow-indigo-200 relative overflow-hidden group">
               <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-white/5 rounded-full blur-xl" />
               
               <div className="relative z-10">
                 <h3 className="text-2xl font-display font-black mb-1">Intelligence Pulse</h3>
                 <p className="text-xs opacity-70 mb-8 font-bold uppercase tracking-widest">Automation & Diagnostics</p>
                 
                 <div className="space-y-4 font-mono text-[11px] font-bold uppercase tracking-tight">
                   <div className="flex justify-between p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                     <span className="opacity-60 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SYST_LOAD</span>
                     <span className="text-emerald-300">NOMINAL</span>
                   </div>
                   <div className="flex justify-between p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                     <span className="opacity-60 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> FILE_INTEGRITY</span>
                     <span>SYNCED</span>
                   </div>
                   <div className="flex justify-between p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-colors">
                     <span className="opacity-60 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> FORECAST_VEL</span>
                     <span className="text-amber-300">STABLE</span>
                   </div>
                 </div>
                 
                 <button 
                  onClick={() => window.location.reload()}
                  className="w-full mt-10 py-4 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] hover:shadow-xl transition-all active:scale-98 shadow-md"
                 >
                   Re-Calibrate Pulse
                 </button>
               </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <div className="p-6 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp size={16} className="text-indigo-500" />
                  Activity Stream
                </h3>
                <span className="text-[10px] font-mono font-bold text-[var(--color-text-faint)]">LIVE</span>
              </div>
              <div className="p-2 min-h-[300px]">
                {state.log.slice(-5).reverse().map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 hover:bg-[var(--color-surface-offset)]/50 rounded-2xl transition-colors cursor-pointer group">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-black leading-tight uppercase tracking-widest text-[var(--color-text-faint)] mb-1">{entry.action}</div>
                      <div className="text-sm font-bold text-[var(--color-text)] truncate">{entry.taskName}</div>
                      <div className="flex items-center gap-2 mt-2">
                         <div className="px-2 py-0.5 bg-[var(--color-surface-2)] rounded-md text-[9px] font-mono font-bold text-[var(--color-text-muted)] border border-[var(--color-divider)]">{entry.taskId}</div>
                         <div className="text-[9px] font-bold text-[var(--color-text-faint)] opacity-60 uppercase">{new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
