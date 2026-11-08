import React from 'react';
import { useAuth } from '../../store/AuthContext';
import { useProject } from '../../store/ProjectContext';
import { getAllNavItems } from '../../config/navigation';
import { ShieldAlert, Lock, ArrowLeft, UserCheck, Sparkles, Key } from 'lucide-react';
import Button from '../shared/Button';

interface AccessDeniedProps {
  viewId: string;
  onOpenAccessManager?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ viewId, onOpenAccessManager }) => {
  const { currentUser, switchUser, users, isAdmin, hasViewAccess } = useAuth();
  const { setView } = useProject();

  const adminUser = users.find(u => u.role === 'Admin');
  const allNav = getAllNavItems();
  const fallbackView = allNav.find(item => hasViewAccess(item.id))?.id || 'overview';

  return (
    <div className="h-full flex items-center justify-center p-4 sm:p-8 bg-[var(--color-bg)] select-none">
      <div className="card p-8 sm:p-10 max-w-lg w-full text-center space-y-6 bg-[var(--color-surface)]/90 backdrop-blur-2xl border border-[var(--color-divider)] shadow-xl rounded-3xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center mx-auto shadow-2xs">
          <ShieldAlert size={32} strokeWidth={2.2} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-500/20">
            <Lock size={12} /> Access Restricted
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Restricted View
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed max-w-md mx-auto">
            You are signed in as <strong className="text-[var(--color-text)]">{currentUser?.name}</strong> with the <strong className="text-[var(--color-text)]">{currentUser?.role}</strong> role.
            This module (<span className="font-mono text-xs">{viewId}</span>) requires elevated administrative or manager privileges.
          </p>
        </div>

        <div className="p-4 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-2xl text-left space-y-2">
          <div className="text-xs font-semibold text-[var(--color-text)] flex items-center gap-2">
            <Key size={14} className="text-[var(--color-primary-hex)]" />
            <span>Need access to this feature?</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
            Your system administrator (<strong className="text-[var(--color-text)]">{adminUser?.name || 'Administrator'}</strong>) can grant you access from the Role & Permissions Governance panel.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => setView(fallbackView)}
            className="w-full sm:w-auto h-11 px-5 rounded-xl font-semibold"
          >
            <ArrowLeft size={15} className="mr-1.5" /> Return to Workspace
          </Button>

          {/* Quick Demo Switcher if current user is not admin */}
          {!isAdmin && adminUser && (
            <Button 
              variant="primary" 
              onClick={() => switchUser(adminUser.id)}
              className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm"
            >
              <Sparkles size={15} className="mr-1.5" /> Switch to Admin ({adminUser.name.split(' ')[0]})
            </Button>
          )}

          {isAdmin && onOpenAccessManager && (
            <Button 
              variant="primary" 
              onClick={onOpenAccessManager}
              className="w-full sm:w-auto h-11 px-5 rounded-xl font-bold bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-sm"
            >
              <UserCheck size={15} className="mr-1.5" /> Manage Access
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
