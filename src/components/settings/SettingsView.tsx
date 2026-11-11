import React, { useState, useRef } from 'react';
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
  Lock,
  Unlock,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Loader2,
  Palette
} from 'lucide-react';
import Button from '../shared/Button';
import BaselineManager from './BaselineManager';
import AccessManagerModal from '../auth/AccessManagerModal';
import { exportProjectExcel, importProjectExcel } from '../../services/excelService';
import clsx from 'clsx';
import PageHeader from '../shared/PageHeader';
import ThemeGrid, { THEMES } from '../shared/ThemeGrid';

const VALID_SETTINGS_TABS = new Set(['parameters', 'theme', 'baselines', 'access']);

const SettingsView: React.FC = () => {
  const { state, activeSubTab, updateSettings, updateProject, loadSample, clearAllData } = useProject();
  const { users, currentUser, rolePermissions, isAdmin, switchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'parameters' | 'theme' | 'baselines' | 'access'>(() => {
    if (activeSubTab?.view === 'settings' && VALID_SETTINGS_TABS.has(activeSubTab.tab)) {
      return activeSubTab.tab as 'parameters' | 'theme' | 'baselines' | 'access';
    }
    return 'parameters';
  });

  React.useEffect(() => {
    if (activeSubTab?.view === 'settings' && VALID_SETTINGS_TABS.has(activeSubTab.tab)) {
      setActiveTab(activeSubTab.tab as 'parameters' | 'theme' | 'baselines' | 'access');
    }
  }, [activeSubTab?.seq, activeSubTab?.view, activeSubTab?.tab]);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearData = () => {
    if (window.confirm('This will permanently delete all tasks, members, and project history. Are you absolutely certain?')) {
      clearAllData();
      window.location.reload();
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportProjectExcel(state);
    } catch (e: any) {
      alert('Export failed: ' + e.message);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const data = await importProjectExcel(file);
      updateProject(data);
      alert('Project database imported successfully.');
    } catch (e: any) {
      alert('Import failed: ' + e.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemo = async () => {
    if (!window.confirm('Load the comprehensive demo Excel database? This will populate 24 tasks, 12 deliveries, 10 team members, RAID items, and defect registers.')) {
      return;
    }
    try {
      setIsImporting(true);
      await loadSample('web');
      alert('Demo database loaded successfully.');
    } catch (e: any) {
      alert('Failed to load demo database: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateSnapshot = () => {
    setActiveTab('baselines');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-capture-baseline-modal'));
    }, 50);
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
              onClick={() => setActiveTab('theme')}
              className={clsx(
                "px-2 sm:px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors duration-150 active:scale-95 flex items-center justify-center gap-1 shrink-0",
                activeTab === 'theme' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Palette size={13} /> <span className="hidden md:inline">Theme & </span>Styling
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
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateSnapshot}
            className="h-9 px-3.5 rounded-xl font-bold flex items-center gap-1.5 active:scale-95 shadow-xs"
            title="Capture an executive baseline snapshot of project state"
          >
            <Camera size={14} />
            <span>Create Snapshot</span>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-8">

        {activeTab === 'baselines' ? (
          <BaselineManager />
        ) : activeTab === 'theme' ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-divider)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center">
                    <Palette size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">Theme Studio & Design System Chooser</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      Select your operational visual aesthetic from {THEMES.length} Swiss design systems. Each preview depicts real surfaces, typography, corners, and accents.
                    </p>
                  </div>
                </div>
              </div>

              <ThemeGrid showSearch={true} showCategories={true} />
            </div>
          </div>
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
                          {perms?.canCreateTask ? 'Create' : ''}{perms?.canEditTask ? ' • Edit' : ''}{perms?.canDeleteTask ? ' • Delete' : ''}{!perms?.canCreateTask && !perms?.canEditTask ? 'Read-only' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick explanation footer */}
            <div className="bg-[var(--color-surface-2)] p-4 rounded-xl border border-[var(--color-divider)] flex items-center gap-3">
              <Sliders className="text-[var(--color-primary-hex)] shrink-0" size={18} />
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
                <div className="flex items-center gap-3 text-[var(--color-primary-hex)] mb-2">
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
                        className="w-4 h-4 rounded border-[var(--color-divider)] accent-[var(--color-primary-hex)] cursor-pointer"
                        checked={(state.settings.alertPrefs as any)[alert.key] || false}
                        onChange={e => updateSettings({ alertPrefs: { ...state.settings.alertPrefs, [alert.key]: e.target.checked } })}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Theme & Design Systems */}
            <div className="card p-6 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0">
                  <Palette size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Active Design System: <span className="text-[var(--color-primary-hex)] capitalize">{state.theme}</span></h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Customize typography, colors, and layout aesthetics across 26 curated themes.
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab('theme')}
                className="font-bold text-xs shrink-0 cursor-pointer"
              >
                <Palette size={13} className="mr-1.5 text-[var(--color-primary-hex)]" />
                Open Theme Studio
              </Button>
            </div>

            {/* Excel Portability & Database */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              accept=".xlsx" 
              className="hidden" 
            />

            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[var(--color-primary-hex)]">
                  <FileSpreadsheet size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">Excel Database & Master Portability</h3>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      Export state or import relational Excel workbooks (.xlsx) with tasks, ALM deliveries, RAID, and team rosters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  onClick={handleExportExcel}
                >
                  <Download size={14} className="text-[var(--color-primary-hex)]" />
                  <span>Export Master Excel</span>
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isImporting}
                  className="h-10 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isImporting ? <Loader2 size={14} className="animate-spin text-[var(--color-primary-hex)]" /> : <UploadCloud size={14} className="text-[var(--color-primary-hex)]" />}
                  <span>Import Excel File</span>
                </Button>

                <a
                  href="/demo-data.xlsx"
                  download
                  className="h-10 px-3 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-text)] flex items-center justify-center gap-2 transition-colors no-underline"
                  title="Download ready-to-import demo Excel template"
                >
                  <Download size={14} className="text-emerald-500" />
                  <span>Download Demo .xlsx</span>
                </a>

                <Button 
                  variant="primary" 
                  size="sm" 
                  disabled={isImporting}
                  className="h-10 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  onClick={handleLoadDemo}
                >
                  {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                  <span>Load Demo Database</span>
                </Button>
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
