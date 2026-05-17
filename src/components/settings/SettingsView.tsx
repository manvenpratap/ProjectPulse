import React from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Settings, 
  Bell, 
  Clock, 
  Shield, 
  Palette, 
  Trash2, 
  Save,
  Info
} from 'lucide-react';
import Button from '../shared/Button';

const SettingsView: React.FC = () => {
  const { state, updateSettings, clearAllData } = useProject();

  const handleClearData = () => {
    if (window.confirm('This will permanently delete all tasks, members, and project history. Are you absolutely certain?')) {
      clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll">
      <div className="px-6 py-12 max-w-4xl mx-auto w-full space-y-12">
        <div className="flex items-center gap-4 border-b border-[var(--color-divider)] pb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-offset)] border border-[var(--color-divider)] flex items-center justify-center text-[var(--color-text-faint)]">
            <Settings size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black tracking-tight">System Configuration</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Control heartbeat parameters and project telemetry</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Work Parameters */}
           <div className="card p-8 space-y-6">
              <div className="flex items-center gap-3 text-indigo-500 mb-2">
                 <Clock size={20} />
                 <h3 className="text-sm font-black uppercase tracking-widest">Work Cycles</h3>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Target Days Per Week</label>
                    <input 
                       type="number" 
                       className="w-full h-11 px-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold"
                       value={state.settings.daysPerWeek}
                       onChange={e => updateSettings({ daysPerWeek: parseFloat(e.target.value) })}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Work Days (Per Week)</label>
                    <input 
                       type="number" 
                       className="w-full h-11 px-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold"
                       value={state.settings.workDays}
                       onChange={e => updateSettings({ workDays: parseInt(e.target.value) })}
                    />
                 </div>
              </div>
           </div>

           {/* Pulse Alerts */}
           <div className="card p-8 space-y-6">
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                 <Bell size={20} />
                 <h3 className="text-sm font-black uppercase tracking-widest">Pulse Alerts</h3>
              </div>
              <div className="space-y-3">
                 {[
                   { key: 'overdue', label: 'Overdue Task Escalation' },
                   { key: 'blocked', label: 'Identity Dependency Blocker' },
                   { key: 'overloaded', label: 'Resource Congestion' },
                 ].map(alert => (
                   <label key={alert.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-surface-2)] cursor-pointer group transition-all">
                      <span className="text-xs font-bold text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">{alert.label}</span>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-[var(--color-divider)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={(state.settings.alertPrefs as any)[alert.key]}
                        onChange={e => updateSettings({ alertPrefs: { ...state.settings.alertPrefs, [alert.key]: e.target.checked } })}
                      />
                   </label>
                 ))}
              </div>
           </div>
        </div>

        {/* Data Management */}
        <div className="card p-8 bg-red-50/10 border-red-100">
           <div className="flex items-center gap-3 text-red-500 mb-6">
              <Shield size={20} />
              <h3 className="text-sm font-black uppercase tracking-widest">Destructive Operations</h3>
           </div>
           <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                 <p className="text-sm font-bold text-slate-800">Clear All Project Telemetry</p>
                 <p className="text-[11px] text-slate-500 mt-1">This will reset the pulse registry and tasks to factory defaults.</p>
              </div>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50 border border-red-200 px-6 font-black" onClick={handleClearData}>
                 <Trash2 size={16} className="mr-2" /> Purge Project
              </Button>
           </div>
        </div>

        <div className="bg-indigo-50 rounded-3xl p-8 flex items-start gap-4">
           <Info className="text-indigo-500 mt-1 shrink-0" size={24} />
           <div>
              <h4 className="text-sm font-bold text-indigo-900 mb-1">System Version 2.4.0 (Stable)</h4>
              <p className="text-xs text-indigo-700/70 leading-relaxed">
                 Pulse Engine is currently running in local-first mode. All data is persisted to your browser's encrypted local storage layer. Ensure backups are exported periodically from the Reporting view.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
