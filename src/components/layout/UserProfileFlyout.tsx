import React, { useRef, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { 
  User, 
  ShieldCheck, 
  LogOut, 
  Key, 
  Check, 
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';
import clsx from 'clsx';
import Button from '../shared/Button';

interface UserProfileFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccessManager: () => void;
}

export const UserProfileFlyout: React.FC<UserProfileFlyoutProps> = ({ 
  isOpen, 
  onClose,
  onOpenAccessManager 
}) => {
  const { currentUser, users, switchUser, logout, isAdmin } = useAuth();
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen || !currentUser) return null;

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25';
      case 'Project Manager':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25';
      case 'Developer':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      default:
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs sm:hidden"
        onClick={onClose} 
      />

      <div 
        ref={flyoutRef}
        className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-1.5 w-[calc(100vw-24px)] sm:w-80 bg-[var(--color-surface)]/95 backdrop-blur-2xl border border-[var(--color-divider)] rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-150 origin-top-right select-none"
      >
        {/* Header Profile Section */}
        <div className="p-4 bg-[var(--color-surface-2)]/60 border-b border-[var(--color-divider)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-[var(--color-text)] truncate">{currentUser.name}</div>
              <div className="text-xs text-[var(--color-text-muted)] truncate">{currentUser.email}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full border", getRoleBadgeStyle(currentUser.role))}>
                  {currentUser.role}
                </span>
                {currentUser.title && (
                  <span className="text-[10px] text-[var(--color-text-faint)] truncate max-w-[120px]">
                    • {currentUser.title}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Role / Persona Switcher */}
        <div className="p-3 border-b border-[var(--color-divider)] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--color-text-muted)] px-1">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft size={12} className="text-[var(--color-primary-hex)]" />
              Switch Active Persona
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {users.map(u => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => { switchUser(u.id); onClose(); }}
                  className={clsx(
                    "p-2 rounded-xl text-left border transition-all text-xs cursor-pointer active:scale-96",
                    isSelected 
                      ? "bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/40 text-[var(--color-text)] font-bold shadow-2xs" 
                      : "bg-[var(--color-surface-2)]/60 border-[var(--color-divider)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-semibold">{u.name.split(' ')[0]}</span>
                    {isSelected && <Check size={12} className="text-[var(--color-primary-hex)] shrink-0" />}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5 truncate">
                    {u.role}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Admin Access Controls Action */}
        <div className="p-2 space-y-1">
          {isAdmin ? (
            <button
              onClick={() => { onOpenAccessManager(); onClose(); }}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--color-primary-highlight-hex)] flex items-center justify-between text-xs font-semibold text-[var(--color-text)] transition-colors active:scale-98 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center">
                  <Key size={14} />
                </div>
                <div>
                  <div className="font-bold">Provide Access & Roles</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Configure team permissions</div>
                </div>
              </div>
              <ChevronRight size={14} className="text-[var(--color-text-faint)] group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="px-3 py-2 text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
              <ShieldCheck size={14} className="text-[var(--color-text-faint)] shrink-0" />
              <span>Permissions are managed by your Administrator.</span>
            </div>
          )}

          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-500 flex items-center gap-2.5 text-xs font-semibold transition-colors active:scale-98 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <LogOut size={14} />
            </div>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default UserProfileFlyout;
