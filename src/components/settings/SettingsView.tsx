import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
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
  Database,
  ShieldCheck,
  Users,
  UserCheck,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';
import Button from '../shared/Button';
import BaselineManager from './BaselineManager';
import AccessManagerModal from '../auth/AccessManagerModal';
import clsx from 'clsx';
import PageHeader from '../shared/PageHeader';

const SettingsView: React.FC = () => {
  const { state, updateSettings, clearAllData } = useProject();
  const { users, currentUser, rolePermissions, isAdmin, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'parameters' | 'baselines' | 'access'>('parameters');
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const handleClearData = () => {
    if (window.confirm('This will permanently delete all tasks, members, and project history. Are you absolutely certain?')) {
      clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Settings}
        title="System Configuration & Governance"
        subtitle="Manage operational telemetry, automated pulse alerts, and project baselines"
        actions={
          <div className="flex items-center gap-1 p-0.5 sm:p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl max-w-full overflow-x-auto no-scrollbar shrink">
            <button
              onClick={() => setActiveTab('parameters')}
              className={clsx(
                "px-2 sm:px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-95 flex items-center justify-center gap-1 shrink-0",
                activeTab === 'parameters' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Sliders size={13} /> <span className="hidden md:inline">System </span>Params
            </button>
            <button
              onClick={() => setActiveTab('baselines')}
              className={clsx(
                "px-2 sm:px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-95 flex items-center justify-center gap-1 shrink-0",
                activeTab === 'baselines' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Camera size={13} /> <span className="hidden sm:inline">Snapshots</span><span className="sm:hidden">Snaps</span> ({state.baselines?.length ? new Set(state.baselines.map(b => b.id)).size : 0})
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={clsx(
                "px-2 sm:px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-95 flex items-center justify-center gap-1 shrink-0",
                activeTab === 'access' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <ShieldCheck size={13} /> <span className="hidden md:inline">Roles & </span>Access
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-8">

        {activeTab === 'baselines' ? (
          <BaselineManager />
        ) : activeTab === 'access' ? (
          <div className="space-y-6">
            {/* Header info card */}
            <div className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--color-surface)]/90 backdrop-blur-xl border border-[var(--color-divider)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text)]">
                    Role-Based Access Control (RBAC) Governance
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Configure team personas, view restrictions, and fine-grained operation privileges across ProjectPulse.
                  </p>
                </div>
              </div>
              <Button 
                variant="primary" 
                onClick={() => setIsAccessModalOpen(true)}
                className="h-11 px-5 rounded-xl font-bold bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shrink-0"
              >
                <UserCheck size={16} className="mr-2" />
                Open Access Studio
              </Button>
            </div>

            {/* Current Signed In User Banner */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] flex items-center justify-center font-bold text-xs shadow-2xs">
                  {currentUser?.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-text)]">{currentUser?.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20">
                      {currentUser?.role}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Admin Privileges Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--color-text-faint)] font-mono">{currentUser?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-muted)] font-medium">Quick switch persona:</span>
                <div className="flex items-center gap-1">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => switchUser(u.id)}
                      className={clsx(
                        "px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer",
                        u.id === currentUser?.id 
                          ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-2xs" 
                          : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-divider)]"
                      )}
                    >
                      {u.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Users & Roles Roster Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(u => {
                const perms = rolePermissions[u.role];
                return (
                  <div key={u.id} className="card p-5 space-y-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-center font-bold text-sm text-[var(--color-text)]">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[var(--color-text)]">{u.name}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">
                              {u.role}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)]">{u.title || u.email}</p>
                        </div>
                      </div>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[var(--color-divider)] grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[var(--color-text-faint)] block text-[10px] font-medium">VIEW ACCESS</span>
                        <span className="font-semibold text-[var(--color-text)]">
                          {u.allowedViews ? `${u.allowedViews.length} custom views` : (perms?.allowedViews.includes('*') ? 'All views (Universal)' : `${perms?.allowedViews.length || 0} views`)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-faint)] block text-[10px] font-medium">WRITE CAPABILITIES</span>
                        <span className="font-semibold text-[var(--color-text)]">
                          {perms?.canCreate ? 'Create' : ''}{perms?.canEdit ? ' • Edit' : ''}{perms?.canDelete ? ' • Delete' : ''}{!perms?.canCreate && !perms?.canEdit ? 'Read-only' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick explanation footer */}
            <div className="bg-[var(--color-surface-2)] p-4 rounded-2xl border border-[var(--color-divider)] flex items-center gap-3">
              <Sparkles className="text-[var(--color-primary-hex)] shrink-0" size={18} />
              <p className="text-xs text-[var(--color-text-muted)]">
                Only users with the <strong className="text-[var(--color-text)]">Admin</strong> role can modify user roles, grant view overrides, or change system access matrices.
              </p>
            </div>
          </div>
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

      {/* Admin Access Manager Modal */}
      <AccessManagerModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
    </div>
  );
};

export default SettingsView;
