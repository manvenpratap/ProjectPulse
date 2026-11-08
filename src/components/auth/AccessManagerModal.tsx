import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { UserRole, RolePermissions, UserAccount } from '../../types';
import { NAV_HUBS } from '../../config/navigation';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight, 
  Sliders, 
  Key,
  Shield,
  Layers,
  Info
} from 'lucide-react';
import clsx from 'clsx';

interface AccessManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessManagerModal: React.FC<AccessManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    currentUser, 
    rolePermissions, 
    updateUserRole, 
    updateUserCustomViews, 
    updateRolePermissions,
    createUser, 
    deleteUser 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'invite'>('users');
  const [selectedUserForViews, setSelectedUserForViews] = useState<UserAccount | null>(null);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Developer');
  const [newUserTitle, setNewUserTitle] = useState('');

  // Collect all views from navigation hubs
  const allViews = NAV_HUBS.flatMap(h => h.items.map(item => ({
    id: item.id,
    label: item.label,
    hubLabel: h.label
  })));

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    createUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      title: newUserTitle
    });

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
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'Project Manager':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'Developer':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Role & Access Governance"
      size="xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-[var(--color-text-faint)] flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Changes to roles and permissions apply immediately in real-time.</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose} className="rounded-xl px-5 font-bold">
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
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-97 cursor-pointer",
              activeTab === 'users' 
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <Users size={14} /> <span>Team Members & Roles</span>
          </button>
          <button
            onClick={() => { setActiveTab('roles'); setSelectedUserForViews(null); }}
            className={clsx(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-97 cursor-pointer",
              activeTab === 'roles' 
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <Sliders size={14} /> <span>Role Capabilities Matrix</span>
          </button>
          <button
            onClick={() => { setActiveTab('invite'); setSelectedUserForViews(null); }}
            className={clsx(
              "flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-97 cursor-pointer",
              activeTab === 'invite' 
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]" 
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <Plus size={14} /> <span>Add User</span>
          </button>
        </div>

        {/* TAB 1: USERS LIST & ACCESS CONTROLS */}
        {activeTab === 'users' && !selectedUserForViews && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1">
              <span>Select a role to assign access levels, or customize granular views.</span>
              <span className="font-semibold">{users.length} Users Enrolled</span>
            </div>

            <div className="card p-0 overflow-hidden border border-[var(--color-divider)] divide-y divide-[var(--color-divider)]">
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const roleConfig = rolePermissions[u.role];
                const viewCount = u.allowedViews ? u.allowedViews.length : (roleConfig.allowedViews.includes('*') ? allViews.length : roleConfig.allowedViews.length);

                return (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--color-surface-2)]/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 font-bold text-sm flex items-center justify-center shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[var(--color-text)] truncate">{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-[var(--color-surface-3)] text-[var(--color-text-muted)] px-1.5 py-0.2 rounded font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] truncate">{u.email}</div>
                        {u.title && (
                          <div className="text-[11px] text-[var(--color-text-faint)] truncate">{u.title}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Role Selector Dropdown */}
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        className={clsx(
                          "h-9 px-3 rounded-xl text-xs font-semibold outline-none cursor-pointer border transition-colors",
                          getRoleBadgeStyle(u.role)
                        )}
                        aria-label={`Change role for ${u.name}`}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Developer">Developer</option>
                        <option value="Stakeholder">Stakeholder</option>
                      </select>

                      {/* Granular View Permissions Button */}
                      <button
                        onClick={() => setSelectedUserForViews(u)}
                        className="h-9 px-3 rounded-xl bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-divider)] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        title="Configure custom view overrides"
                      >
                        <Key size={13} className="text-[var(--color-primary-hex)]" />
                        <span>{viewCount} Views</span>
                      </button>

                      {/* Delete user button (cannot delete yourself or the primary admin) */}
                      {!isCurrent && u.id !== 'user-admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove user ${u.name} from the workspace?`)) {
                              deleteUser(u.id);
                            }
                          }}
                          className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                          title="Delete User"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBVIEW: USER GRANULAR VIEW OVERRIDES */}
        {activeTab === 'users' && selectedUserForViews && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-divider)]">
              <div>
                <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                  <Key size={15} className="text-[var(--color-primary-hex)]" />
                  Custom View Overrides: {selectedUserForViews.name}
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Base Role: <strong className="text-[var(--color-text)]">{selectedUserForViews.role}</strong>
                  {selectedUserForViews.allowedViews ? " • Custom View Override Active" : " • Following Role Defaults"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedUserForViews.allowedViews && (
                  <Button variant="ghost" size="sm" onClick={handleResetUserViews} className="text-xs">
                    Reset to Default
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedUserForViews(null)} className="text-xs">
                  Back to Users
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto custom-scroll p-1">
              {allViews.map(view => {
                const defaultAllowed = rolePermissions[selectedUserForViews.role].allowedViews.includes('*') || 
                                       rolePermissions[selectedUserForViews.role].allowedViews.includes(view.id);
                const isAllowed = selectedUserForViews.allowedViews 
                  ? selectedUserForViews.allowedViews.includes(view.id)
                  : defaultAllowed;

                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => handleToggleUserView(view.id)}
                    className={clsx(
                      "p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-98",
                      isAllowed 
                        ? "bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/30 text-[var(--color-text)]" 
                        : "bg-[var(--color-surface-2)] border-[var(--color-divider)] text-[var(--color-text-muted)] opacity-60"
                    )}
                  >
                    <div>
                      <div className="font-bold text-xs">{view.label}</div>
                      <div className="text-[10px] text-[var(--color-text-faint)] font-mono">{view.hubLabel}</div>
                    </div>
                    <div className={clsx(
                      "w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
                      isAllowed ? "bg-[var(--color-primary-hex)] text-white" : "border border-[var(--color-divider)]"
                    )}>
                      {isAllowed && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ROLE CAPABILITIES MATRIX */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="text-xs text-[var(--color-text-muted)]">
              Administer role-level capability policies across the workspace.
            </div>

            <div className="card p-0 overflow-hidden border border-[var(--color-divider)]">
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)] text-[var(--color-text-muted)] font-semibold">
                      <th className="p-3">Capability / Policy</th>
                      {(['Admin', 'Project Manager', 'Developer', 'Stakeholder'] as UserRole[]).map(r => (
                        <th key={r} className="p-3 text-center">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-divider)]">
                    {[
                      { key: 'canCreateTask', label: 'Create Tasks & Items' },
                      { key: 'canEditTask', label: 'Edit & Update Status' },
                      { key: 'canDeleteTask', label: 'Delete Records' },
                      { key: 'canManageDeliveries', label: 'Manage ALM Deployments' },
                      { key: 'canManageReleases', label: 'Manage Releases & Milestones' },
                      { key: 'canManageRAID', label: 'Manage RAID Register' },
                      { key: 'canExportExcel', label: 'Export Excel Reports' },
                      { key: 'canManageSettings', label: 'Configure System Settings' },
                      { key: 'canManageUsers', label: 'Administer Users & Roles' },
                    ].map(cap => (
                      <tr key={cap.key} className="hover:bg-[var(--color-surface-offset)]/40 transition-colors">
                        <td className="p-3 font-semibold text-[var(--color-text)]">{cap.label}</td>
                        {(['Admin', 'Project Manager', 'Developer', 'Stakeholder'] as UserRole[]).map(r => {
                          const isAllowed = rolePermissions[r][cap.key as keyof RolePermissions] as boolean;
                          const isLocked = r === 'Admin'; // Admin always has full capability

                          return (
                            <td key={r} className="p-3 text-center">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => {
                                  updateRolePermissions(r, { [cap.key]: !isAllowed });
                                }}
                                className={clsx(
                                  "w-6 h-6 rounded-md inline-flex items-center justify-center transition-all",
                                  isAllowed ? "bg-emerald-500 text-white" : "bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-transparent",
                                  !isLocked && "cursor-pointer active:scale-90 hover:opacity-85"
                                )}
                                title={`${r}: ${isAllowed ? 'Enabled' : 'Disabled'}`}
                              >
                                <Check size={14} strokeWidth={2.5} />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVITE / ADD NEW USER */}
        {activeTab === 'invite' && (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="card p-5 space-y-4 border border-[var(--color-divider)]">
              <h4 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                <Plus size={16} className="text-[var(--color-primary-hex)]" />
                Enroll New Team Member
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)]"
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
                    className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)] block">Assigned Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-semibold outline-none focus:border-[var(--color-primary-hex)]"
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
                    className="w-full h-11 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-sm font-medium outline-none focus:border-[var(--color-primary-hex)]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" type="submit" className="h-10 px-5 rounded-xl font-bold">
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
