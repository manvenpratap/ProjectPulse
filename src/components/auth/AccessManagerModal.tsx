import React, { useState, useMemo } from 'react';
import { useAuth, DEFAULT_ROLE_PERMISSIONS } from '../../store/AuthContext';
import { UserRole, RolePermissions, UserAccount } from '../../types';
import { NAV_HUBS } from '../../config/navigation';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import SectionHelpButton from '../shared/SectionHelpButton';
import { toast } from '../../utils/toast';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Lock, 
  Plus, 
  Trash2, 
  Check, 
  Sliders, 
  Key, 
  Shield, 
  Compass, 
  Code, 
  Eye, 
  Search, 
  RotateCcw, 
  X, 
  CheckCheck,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

interface AccessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRoleTheme = (role: UserRole) => {
  switch (role) {
    case 'Admin':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-500 dark:text-rose-400',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        icon: Shield,
        desc: 'Unrestricted administration, user governance, schema modifications, and full workspace control.'
      };
    case 'Project Manager':
      return {
        bg: 'bg-indigo-500/15',
        text: 'text-indigo-500 dark:text-indigo-400',
        border: 'border-indigo-500/30',
        badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        icon: Compass,
        desc: 'Sprint execution, workload balancing, deliverables, release gating, and risk monitoring.'
      };
    case 'Developer':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-500 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: Code,
        desc: 'Task progress delivery, defect logging/triage, subtask execution, and technical timelines.'
      };
    case 'Stakeholder':
    default:
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-500 dark:text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: Eye,
        desc: 'Read-only operational observability, executive health overview, and milestone tracking.'
      };
  }
};

export const AccessManagerModal: React.FC<AccessManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    currentUser, 
    rolePermissions, 
    switchUser,
    updateUserRole, 
    updateUserCustomViews, 
    updateRolePermissions,
    createUser, 
    deleteUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'invite'>('users');
  const [selectedUserForViews, setSelectedUserForViews] = useState<UserAccount | null>(null);

  // Search and Role Filters for Users tab
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');

  // Search filter for View Overrides subview
  const [viewSearchQuery, setViewSearchQuery] = useState('');

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Developer');
  const [newUserTitle, setNewUserTitle] = useState('');

  // Collect all views from navigation hubs
  const allViews = useMemo(() => {
    return NAV_HUBS.flatMap(h => h.items.map(item => ({
      id: item.id,
      label: item.label,
      hubId: h.id,
      hubLabel: h.label,
      hubIcon: h.icon
    })));
  }, []);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { All: users.length, Admin: 0, 'Project Manager': 0, Developer: 0, Stakeholder: 0 };
    users.forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      if (!matchesRole) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.title && u.title.toLowerCase().includes(q)) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, searchQuery]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    createUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      title: newUserTitle.trim() || undefined
    });

    toast.success(`Enrolled ${newUserName} as ${newUserRole}`);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserTitle('');
    setActiveTab('users');
  };

  const handleToggleUserView = (viewId: string) => {
    if (!selectedUserForViews) return;

    const currentAllowed = selectedUserForViews.allowedViews || 
      (rolePermissions[selectedUserForViews.role].allowedViews.includes('*') 
        ? allViews.map(v => v.id) 
        : rolePermissions[selectedUserForViews.role].allowedViews);

    let updated: string[];
    if (currentAllowed.includes(viewId)) {
      updated = currentAllowed.filter(id => id !== viewId);
    } else {
      updated = [...currentAllowed, viewId];
    }

    updateUserCustomViews(selectedUserForViews.id, updated);
    setSelectedUserForViews({ ...selectedUserForViews, allowedViews: updated });
  };

  const handleResetUserViews = () => {
    if (!selectedUserForViews) return;
    updateUserCustomViews(selectedUserForViews.id, undefined);
    setSelectedUserForViews({ ...selectedUserForViews, allowedViews: undefined });
    toast.info(`Reset ${selectedUserForViews.name} to default ${selectedUserForViews.role} view permissions`);
  };

  const handleAllowAllViews = () => {
    if (!selectedUserForViews) return;
    const allIds = allViews.map(v => v.id);
    updateUserCustomViews(selectedUserForViews.id, allIds);
    setSelectedUserForViews({ ...selectedUserForViews, allowedViews: allIds });
    toast.success(`Granted ${selectedUserForViews.name} access to all ${allIds.length} views`);
  };

  const handleResetAllRoleCapabilities = () => {
    (['Admin', 'Project Manager', 'Developer', 'Stakeholder'] as UserRole[]).forEach(r => {
      updateRolePermissions(r, DEFAULT_ROLE_PERMISSIONS[r]);
    });
    toast.success('Role capabilities restored to factory defaults');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-[var(--color-text)]">Role & Access Governance</span>
              <SectionHelpButton view="settings" section="Role Governance & Modification Permissions" label="Access governance guide" size={13} />
            </div>
          </div>
        </div>
      }
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-[var(--color-text-faint)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Live Real-Time Governance</span>
            <span className="hidden sm:inline text-[var(--color-text-faint)]">• {users.length} enrolled personas</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose} className="rounded-xl px-6 font-bold shadow-xs">
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
          <button
            onClick={() => { setActiveTab('users'); setSelectedUserForViews(null); }}
            className={clsx(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer",
              activeTab === 'users' 
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <Users size={14} />
            <span>Team Members & Roles</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[var(--color-surface-3)] text-[var(--color-text)]">
              {users.length}
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('roles'); setSelectedUserForViews(null); }}
            className={clsx(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer",
              activeTab === 'roles' 
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <Sliders size={14} />
            <span>Role Capabilities Matrix</span>
          </button>
          <button
            onClick={() => { setActiveTab('invite'); setSelectedUserForViews(null); }}
            className={clsx(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer",
              activeTab === 'invite' 
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <Plus size={14} />
            <span>Add User</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1: USERS LIST & ACCESS CONTROLS
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && !selectedUserForViews && (
          <div className="space-y-3.5">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search members by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {(['All', 'Admin', 'Project Manager', 'Developer', 'Stakeholder'] as const).map(role => {
                  const isActive = roleFilter === role;
                  const count = roleCounts[role] || 0;
                  return (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
                        isActive
                          ? "bg-[var(--color-primary-hex)] text-white shadow-2xs"
                          : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-divider)]"
                      )}
                    >
                      <span>{role}</span>
                      <span className={clsx(
                        "text-[10px] font-mono px-1 rounded-full font-bold",
                        isActive ? "bg-white/20 text-white" : "bg-[var(--color-surface-3)] text-[var(--color-text-muted)]"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Users Ledger Card */}
            <div className="card p-0 overflow-hidden border border-[var(--color-divider)] divide-y divide-[var(--color-divider)] shadow-xs">
              {filteredUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const roleConfig = rolePermissions[u.role];
                const viewCount = u.allowedViews ? u.allowedViews.length : (roleConfig.allowedViews.includes('*') ? allViews.length : roleConfig.allowedViews.length);
                const hasCustomOverride = Boolean(u.allowedViews);
                const roleTheme = getRoleTheme(u.role);
                const RoleIcon = roleTheme.icon;

                return (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-[var(--color-surface-2)]/50 transition-colors">
                    {/* User Identity */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Avatar with Role Badge Indicator */}
                      <div className="relative shrink-0">
                        <div className={clsx(
                          "w-11 h-11 rounded-2xl font-bold text-sm flex items-center justify-center border shadow-2xs font-display",
                          roleTheme.badge
                        )}>
                          {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div 
                          className={clsx(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border border-[var(--color-surface)] flex items-center justify-center text-[10px] shadow-xs",
                            roleTheme.badge
                          )}
                          title={`Assigned Role: ${u.role}`}
                        >
                          <RoleIcon size={11} strokeWidth={2.5} />
                        </div>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[var(--color-text)] truncate">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              You (Active)
                            </span>
                          )}
                          {hasCustomOverride && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-semibold" title="Custom view override assigned to this user">
                              Custom Views
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] font-mono truncate">{u.email}</div>
                        {u.title && (
                          <div className="text-xs text-[var(--color-text)]/75 font-medium truncate">{u.title}</div>
                        )}
                      </div>
                    </div>

                    {/* Operational Action Controls (Uniform Alignments) */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Role Selector Dropdown */}
                      <div className="relative">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newR = e.target.value as UserRole;
                            updateUserRole(u.id, newR);
                            toast.success(`Updated role for ${u.name} to ${newR}`);
                          }}
                          className={clsx(
                            "h-9 pl-3 pr-8 rounded-xl text-xs font-semibold outline-none cursor-pointer border transition-all appearance-none",
                            roleTheme.badge
                          )}
                          aria-label={`Change role for ${u.name}`}
                        >
                          <option value="Admin">Admin</option>
                          <option value="Project Manager">Project Manager</option>
                          <option value="Developer">Developer</option>
                          <option value="Stakeholder">Stakeholder</option>
                        </select>
                        <RoleIcon size={12} className={clsx("absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-80", roleTheme.text)} />
                      </div>

                      {/* Granular View Permissions Button */}
                      <button
                        onClick={() => setSelectedUserForViews(u)}
                        className={clsx(
                          "h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer",
                          hasCustomOverride
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                            : "bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border-[var(--color-divider)]"
                        )}
                        title={`Configure granular view access (${viewCount} views accessible)`}
                      >
                        <Key size={13} className={hasCustomOverride ? "text-amber-500" : "text-[var(--color-primary-hex)]"} />
                        <span>{viewCount} Views</span>
                      </button>

                      {/* Persona Test Switcher (for non-current users) */}
                      {!isCurrent ? (
                        <button
                          onClick={() => {
                            switchUser(u.id);
                            toast.success(`Switched active persona session to ${u.name} (${u.role})`);
                          }}
                          className="h-9 px-2.5 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-primary-highlight-hex)] hover:text-[var(--color-primary-hex)] hover:border-[var(--color-primary-hex)]/30 border border-[var(--color-divider)] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                          title={`Test permissions as ${u.name}`}
                        >
                          <UserCheck size={13} className="text-emerald-500" />
                          <span className="hidden md:inline">Test</span>
                        </button>
                      ) : (
                        <div className="w-9 h-9 sm:w-[72px]" aria-hidden="true" />
                      )}

                      {/* Delete user button (cannot delete yourself or the primary admin) */}
                      {!isCurrent && u.id !== 'user-admin' ? (
                        <button
                          onClick={() => {
                            if (confirm(`Remove user ${u.name} from the workspace?`)) {
                              deleteUser(u.id);
                              toast.info(`Removed ${u.name}`);
                            }
                          }}
                          className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                          title="Delete User"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <div className="w-9 h-9" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="p-12 text-center text-xs text-[var(--color-text-muted)] space-y-3">
                  <Users size={32} className="mx-auto text-[var(--color-text-faint)] opacity-40" />
                  <p className="font-semibold text-sm text-[var(--color-text)]">No members found</p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    No enrolled team members matched your active search query or role filter.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setRoleFilter('All'); }} className="rounded-xl text-xs">
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SUBVIEW: USER GRANULAR VIEW OVERRIDES
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && selectedUserForViews && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-divider)]">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-[var(--color-text)] flex items-center gap-2">
                    <Key size={16} className="text-[var(--color-primary-hex)]" />
                    Custom View Access: {selectedUserForViews.name}
                  </h4>
                  <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold border", getRoleTheme(selectedUserForViews.role).badge)}>
                    {selectedUserForViews.role}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
                  <span>
                    {selectedUserForViews.allowedViews 
                      ? `${selectedUserForViews.allowedViews.length} custom views enabled`
                      : `Following default ${selectedUserForViews.role} scope (${rolePermissions[selectedUserForViews.role].allowedViews.includes('*') ? allViews.length : rolePermissions[selectedUserForViews.role].allowedViews.length} views)`
                    }
                  </span>
                  <span>•</span>
                  <span>{allViews.length} total system views</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="ghost" size="sm" onClick={handleAllowAllViews} className="text-xs h-8">
                  <CheckCheck size={13} className="mr-1 text-[var(--color-primary-hex)]" /> Allow All
                </Button>
                {selectedUserForViews.allowedViews && (
                  <Button variant="ghost" size="sm" onClick={handleResetUserViews} className="text-xs h-8 text-amber-600">
                    <RotateCcw size={12} className="mr-1" /> Reset to Role Default
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={() => setSelectedUserForViews(null)} className="text-xs h-8">
                  Done
                </Button>
              </div>
            </div>

            {/* View Search Filter */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
              <input
                type="text"
                placeholder="Filter views by title or category..."
                value={viewSearchQuery}
                onChange={(e) => setViewSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-3 text-xs rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)]"
              />
            </div>

            {/* Navigation Hubs Grouped Views */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto custom-scroll pr-1">
              {NAV_HUBS.map(hub => {
                const hubViews = hub.items.filter(item => {
                  if (!viewSearchQuery.trim()) return true;
                  const q = viewSearchQuery.toLowerCase();
                  return item.label.toLowerCase().includes(q) || hub.label.toLowerCase().includes(q);
                });

                if (hubViews.length === 0) return null;

                const HubIcon = hub.icon;
                const defaultAllowed = rolePermissions[selectedUserForViews.role].allowedViews.includes('*') || 
                  rolePermissions[selectedUserForViews.role].allowedViews;

                return (
                  <div key={hub.id} className="space-y-2">
                    <div className="flex items-center gap-2 px-1 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                      <HubIcon size={14} className="text-[var(--color-primary-hex)]" />
                      <span>{hub.label}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hubViews.map(view => {
                        const isRoleDefault = defaultAllowed === true || (Array.isArray(defaultAllowed) && defaultAllowed.includes(view.id));
                        const isAllowed = selectedUserForViews.allowedViews 
                          ? selectedUserForViews.allowedViews.includes(view.id)
                          : isRoleDefault;

                        return (
                          <button
                            key={view.id}
                            type="button"
                            onClick={() => handleToggleUserView(view.id)}
                            className={clsx(
                              "p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-98",
                              isAllowed 
                                ? "bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/40 text-[var(--color-text)] shadow-2xs" 
                                : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-muted)] opacity-60 hover:opacity-100"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-xs truncate">{view.label}</div>
                              <div className="text-[10px] text-[var(--color-text-faint)] font-mono truncate">{hub.label}</div>
                            </div>
                            <div className={clsx(
                              "w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                              isAllowed ? "bg-[var(--color-primary-hex)] text-white" : "border border-[var(--color-divider)] bg-[var(--color-surface)]"
                            )}>
                              {isAllowed && <Check size={12} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: ROLE CAPABILITIES MATRIX
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
              <div>
                <span>Administer role-level capability policies across all project personas.</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetAllRoleCapabilities} 
                className="text-xs h-8 self-start sm:self-auto rounded-xl"
              >
                <RotateCcw size={12} className="mr-1.5 text-amber-500" />
                Reset Defaults
              </Button>
            </div>

            <div className="card p-0 overflow-hidden border border-[var(--color-divider)] shadow-xs">
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)] text-[var(--color-text-muted)] font-semibold">
                      <th className="p-3.5">Capability / Operation</th>
                      {(['Admin', 'Project Manager', 'Developer', 'Stakeholder'] as UserRole[]).map(r => {
                        const theme = getRoleTheme(r);
                        const Icon = theme.icon;
                        return (
                          <th key={r} className="p-3.5 text-center min-w-[110px]">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[11px]" style={{
                              borderColor: 'var(--color-divider)'
                            }}>
                              <Icon size={12} className={theme.text} />
                              <span>{r}</span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-divider)]">
                    {[
                      { group: 'Task & Backlog Governance', items: [
                        { key: 'canCreateTask', label: 'Create Tasks & Items', desc: 'Add new work items to sprint backlogs' },
                        { key: 'canEditTask', label: 'Edit & Update Status', desc: 'Modify attributes, progress, and stage transitions' },
                        { key: 'canDeleteTask', label: 'Delete Records', desc: 'Permanently remove tasks and milestones' },
                      ]},
                      { group: 'Delivery & Release Operations', items: [
                        { key: 'canManageDeliveries', label: 'Manage ALM Deployments', desc: 'Configure software packages and build targets' },
                        { key: 'canManageReleases', label: 'Manage Releases & Milestones', desc: 'Create versions and set code freeze dates' },
                        { key: 'canManageRAID', label: 'Manage RAID Register', desc: 'Log and mitigate risks, assumptions, and issues' },
                      ]},
                      { group: 'System Administration & Reporting', items: [
                        { key: 'canExportExcel', label: 'Export Excel Reports', desc: 'Download styled xlsx executive audit workbooks' },
                        { key: 'canManageSettings', label: 'Configure System Settings', desc: 'Baseline snapshots, alerts, and metadata schema' },
                        { key: 'canManageUsers', label: 'Administer Users & Roles', desc: 'Modify access controls and permissions' },
                      ]}
                    ].map(section => (
                      <React.Fragment key={section.group}>
                        <tr className="bg-[var(--color-surface-2)]/60">
                          <td colSpan={5} className="py-2 px-3.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-mono">
                            {section.group}
                          </td>
                        </tr>
                        {section.items.map(cap => (
                          <tr key={cap.key} className="hover:bg-[var(--color-surface-2)]/40 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-xs text-[var(--color-text)]">{cap.label}</div>
                              <div className="text-[11px] text-[var(--color-text-muted)]">{cap.desc}</div>
                            </td>
                            {(['Admin', 'Project Manager', 'Developer', 'Stakeholder'] as UserRole[]).map(r => {
                              const isAllowed = rolePermissions[r][cap.key as keyof RolePermissions] as boolean;
                              const isLocked = r === 'Admin'; // Admin always has full capability

                              return (
                                <td key={r} className="p-3.5 text-center">
                                  {isLocked ? (
                                    <div className="w-7 h-7 rounded-lg mx-auto inline-flex items-center justify-center bg-rose-500/15 text-rose-500 border border-rose-500/30" title="Admin permissions are permanently locked">
                                      <Lock size={12} strokeWidth={2.5} />
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateRolePermissions(r, { [cap.key]: !isAllowed });
                                        toast.info(`${cap.label} for ${r} ${!isAllowed ? 'enabled' : 'disabled'}`);
                                      }}
                                      className={clsx(
                                        "w-7 h-7 rounded-lg mx-auto inline-flex items-center justify-center transition-all cursor-pointer active:scale-90",
                                        isAllowed 
                                          ? "bg-emerald-500 text-white shadow-xs hover:bg-emerald-600" 
                                          : "bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-transparent hover:border-[var(--color-primary-hex)]/40"
                                      )}
                                      title={`${r}: Click to ${isAllowed ? 'disable' : 'enable'}`}
                                    >
                                      <Check size={14} strokeWidth={3} />
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: INVITE / ADD NEW USER
           ══════════════════════════════════════════════════════════ */}
        {activeTab === 'invite' && (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="card p-5 space-y-5 border border-[var(--color-divider)] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                    <Plus size={16} className="text-[var(--color-primary-hex)]" />
                    Enroll New Team Member
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Assign a role and grant access credentials to active engineering and steerco personnel.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full h-11 px-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="jordan.miller@projectpulse.io"
                    className="w-full h-11 px-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Assigned Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full h-11 px-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Stakeholder">Stakeholder</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Title / Position</label>
                  <input
                    type="text"
                    value={newUserTitle}
                    onChange={(e) => setNewUserTitle(e.target.value)}
                    placeholder="e.g. QA Automation Lead"
                    className="w-full h-11 px-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors"
                  />
                </div>
              </div>

              {/* Role Scope Preview Card */}
              {(() => {
                const theme = getRoleTheme(newUserRole);
                const Icon = theme.icon;
                return (
                  <div className={clsx("p-4 rounded-2xl border flex items-start gap-3.5 text-xs", theme.badge)}>
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] flex items-center justify-center shrink-0">
                      <Icon size={16} className={theme.text} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[var(--color-text)]">
                        {newUserRole} Permission Scope
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                        {theme.desc}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex justify-end">
                <Button variant="primary" type="submit" className="h-10 px-6 rounded-xl font-bold shadow-xs">
                  <Plus size={15} className="mr-1.5" />
                  Enroll User & Grant Access
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AccessManagerModal;
