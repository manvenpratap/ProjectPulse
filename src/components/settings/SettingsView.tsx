import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Settings, 
  Bell, 
  Clock, 
  Shield, 
  Camera, 
  Trash2, 
  Save,
  Info,
  Sliders,
  Database
} from 'lucide-react';
import Button from '../shared/Button';
import BaselineManager from './BaselineManager';
import clsx from 'clsx';

const SettingsView: React.FC = () => {
  const { state, updateSettings, clearAllData } = useProject();
  const [activeTab, setActiveTab] = useState<'parameters' | 'baselines'>('parameters');

  const handleClearData = () => {
    if (window.confirm('This will permanently delete all tasks, members, and project history. Are you absolutely certain?')) {
      clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] overflow-y-auto custom-scroll">
      <div className="px-6 py-8 max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-divider)] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-offset)] border border-[var(--color-divider)] flex items-center justify-center text-[var(--color-text-faint)]">
              <Settings size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-tight text-[var(--color-text)]">
                System Configuration & Governance
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Manage operational telemetry, automated pulse alerts, and project baselines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('parameters')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 active:scale-95 flex items-center gap-1.5",
                activeTab === 'parameters' 
                  ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Sliders size={14} /> System Parameters
            </button>
            <button
              onClick={() => setActiveTab('baselines')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150 active:scale-95 flex items-center gap-1.5",
                activeTab === 'baselines' 
                  ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Camera size={14} /> Baseline Snapshots ({state.baselines?.length ? new Set(state.baselines.map(b => b.id)).size : 0})
            </button>
          </div>
        </div>

        {activeTab === 'baselines' ? (
          <BaselineManager />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Work Parameters */}
              <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 text-indigo-500 mb-2">
                  <Clock size={20} />
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Work Cycles & Capacity</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Target days per week
                    </label>
                    <input 
                      type="number" 
                      className="w-full h-11 px-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold text-xs"
                      value={state.settings.daysPerWeek}
                      onChange={e => updateSettings({ daysPerWeek: parseFloat(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Standard work days (weekly)
                    </label>
                    <input 
                      type="number" 
                      className="w-full h-11 px-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold text-xs"
                      value={state.settings.workDays}
                      onChange={e => updateSettings({ workDays: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>
              </div>

              {/* Pulse Alerts */}
              <div className="card p-6 space-y-6">
                <div className="flex items-center gap-3 text-amber-500 mb-2">
                  <Bell size={20} />
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Automated EWS alerts</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'overdue', label: 'Overdue Task Escalation' },
                    { key: 'dueSoon', label: 'Due Within 3 Days Warning' },
                    { key: 'blocked', label: 'Identity Dependency Blocker Alert' },
                    { key: 'overloaded', label: 'Resource Congestion Detection' },
                    { key: 'stale', label: 'Stale Task Inactivity Notification' }
                  ].map(alert => (
                    <label key={alert.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-surface-2)] cursor-pointer group transition-colors duration-150 border border-transparent hover:border-[var(--color-divider)]">
                      <span className="text-xs font-bold text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]">{alert.label}</span>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-[var(--color-divider)] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={(state.settings.alertPrefs as any)[alert.key] || false}
                        onChange={e => updateSettings({ alertPrefs: { ...state.settings.alertPrefs, [alert.key]: e.target.checked } })}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="card p-6 bg-red-500/5 border-red-500/20">
              <div className="flex items-center gap-3 text-red-500 mb-4">
                <Shield size={20} />
                <h3 className="text-sm font-bold">Destructive operations</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-[var(--color-text)]">Clear All Project Telemetry</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    This will purge the local database and reset tasks, releases, and logs to initial defaults.
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 border border-red-200 px-4 font-black" onClick={handleClearData}>
                  <Trash2 size={15} className="mr-1.5" /> Purge Project
                </Button>
              </div>
            </div>

            <div className="bg-[var(--color-primary-highlight-hex)] rounded-2xl p-5 border border-[var(--color-primary-hex)]/20 flex items-start gap-3">
              <Info className="text-[var(--color-primary-hex)] mt-0.5 shrink-0" size={20} />
              <div>
                <h4 className="text-xs font-bold text-[var(--color-text)] mb-0.5">System Architecture: Local-First Workstation</h4>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                  ProjectPulse runs completely locally inside your browser with offline persistence, zero third-party telemetry, and instant bi-directional Excel sync.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
