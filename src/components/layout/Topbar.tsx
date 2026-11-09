import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { getHealthScore } from '../../utils/projectUtils';
import Button from '../shared/Button';
import HelpModal from '../shared/HelpModal';
import { 
  Bell, 
  Palette, 
  Search, 
  Plus, 
  HelpCircle,
  Menu
} from 'lucide-react';
import clsx from 'clsx';
import ThemeFlyout from './ThemeFlyout';
import SmartAlertsCenter, { computeAlerts } from './SmartAlertsCenter';
import UserProfileFlyout from './UserProfileFlyout';
import AccessManagerModal from '../auth/AccessManagerModal';
import { useAuth } from '../../store/AuthContext';

interface TopbarProps {
  toggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
  const { state, setView, searchTerm, setSearchTerm } = useProject();
  const { currentUser, canPerform, hasViewAccess } = useAuth();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccessManagerOpen, setIsAccessManagerOpen] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      const updateNetworkStatus = () => {
        if (['slow-2g', '2g', '3g'].includes(conn.effectiveType) || conn.saveData) {
          setIsSlowNetwork(true);
        } else {
          setIsSlowNetwork(false);
        }
      };
      updateNetworkStatus();
      conn.addEventListener?.('change', updateNetworkStatus);
      return () => conn.removeEventListener?.('change', updateNetworkStatus);
    }
  }, []);

  const smartAlerts = useMemo(() => {
    return computeAlerts(state).filter(a => !a.targetView || hasViewAccess(a.targetView));
  }, [state.tasks, state.members, state.defects, state.raids, hasViewAccess]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      // Shortcut: / to focus search
      if (e.key === '/' && !isInput) {
         e.preventDefault();
         searchInputRef.current?.focus();
      }
      // F1 or ? -> Open Screen Help Guide
      if ((e.key === 'F1' || e.key === '?') && !isInput) {
         e.preventDefault();
         setIsHelpOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleOpenHelp = () => setIsHelpOpen(true);
    window.addEventListener('open-view-help', handleOpenHelp);
    return () => window.removeEventListener('open-view-help', handleOpenHelp);
  }, []);
  
  const health = getHealthScore(state.tasks);

  const getHealthColor = (score: number) => {
    if (score > 80) return "text-emerald-500";
    if (score > 50) return "text-amber-500";
    return "text-red-500";
  };

  const getHealthLabel = (score: number) => {
    if (score > 80) return "On Track";
    if (score > 50) return "At Risk";
    return "Critical";
  };

  return (
    <>
      <header className="h-[calc(54px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-[var(--color-surface)]/85 backdrop-blur-xl saturate-180 border-b border-[var(--color-divider)] flex items-center px-4 gap-3 md:gap-4 shrink-0 z-30 shadow-2xs sticky top-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button 
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center hover:bg-[var(--color-surface-2)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors active:scale-95 cursor-pointer"
          >
            <Menu size={18} />
          </button>
          
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs md:text-sm text-[var(--color-text)] tracking-tight truncate max-w-[120px] md:max-w-[200px]" title={state.name}>
              {state.name}
            </span>
          </div>
        </div>

        <div 
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] shadow-2xs backdrop-blur-sm cursor-help select-none"
          title={`Project Health: ${health}% (${getHealthLabel(health)})\nCalculated by penalizing active scope for overdue (-50%), blocked (-30%), and on-hold (-20%) tasks.`}
        >
          <div className={clsx("w-2 h-2 rounded-full motion-safe:animate-pulse bg-current", getHealthColor(health))} />
          <span className={clsx("text-xs font-semibold tracking-tight", getHealthColor(health))}>
            {getHealthLabel(health)} {health}%
          </span>
        </div>

        {isSlowNetwork && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium" title="Connection latency detected. Local offline-first caching active.">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>Slow Link Active</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="relative group hidden lg:block">
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--color-text-faint)] pointer-events-none border border-[var(--color-divider)] px-1.5 py-0.5 rounded-md bg-[var(--color-surface)]/80 shadow-2xs">
              /
            </kbd>
            <input 
              ref={searchInputRef}
              className="w-[200px] lg:w-[260px] xl:w-[300px] h-9 pl-9 pr-8 bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)]/40 focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-primary-hex)]/15 transition-all duration-150"
              placeholder="Search tasks, defects, RAID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
          </div>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Smart Alerts Center"
              aria-label="Smart Alerts Center" 
              className={clsx("rounded-xl min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] relative", isNotifOpen && "bg-[var(--color-surface-2)]")}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <Bell size={18} />
              {smartAlerts.length > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-[var(--color-surface)] shadow-2xs">
                  {smartAlerts.length > 9 ? '9+' : smartAlerts.length}
                </span>
              )}
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            title="Appearance Settings"
            aria-label="Appearance and Theme Settings" 
            className="rounded-xl min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px]"
            onClick={() => setIsThemeOpen(true)}
          >
            <Palette size={18} />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            title="Help & Screen Guide (F1 or ?)"
            aria-label="Help and Screen Guide" 
            className="rounded-xl min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] hidden sm:flex"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle size={18} />
          </Button>

          <div className="w-[1px] h-5 bg-[var(--color-divider)] mx-0.5 md:mx-1 hidden sm:block" />

          {/* User Profile & Role Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-[var(--color-surface-2)] transition-all cursor-pointer border border-transparent hover:border-[var(--color-divider)] active:scale-95"
                title={`${currentUser.name} (${currentUser.role}) - Account & Access`}
                aria-label="User Account and Access Controls"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-xs flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/20 shadow-2xs">
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="hidden xl:flex flex-col text-left leading-none">
                  <span className="text-xs font-bold text-[var(--color-text)] truncate max-w-[90px]">{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-[var(--color-text-faint)] font-medium mt-0.5">{currentUser.role}</span>
                </div>
              </button>

              <UserProfileFlyout 
                isOpen={isProfileOpen} 
                onClose={() => setIsProfileOpen(false)} 
                onOpenAccessManager={() => setIsAccessManagerOpen(true)}
              />
            </div>
          )}

          {canPerform('canCreateTask') && hasViewAccess('tasks') && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => setView('tasks')}
              className="h-9 rounded-xl shadow-sm px-3 md:px-4 text-xs font-semibold"
            >
              <Plus size={16} className="md:mr-1.5" /> <span className="hidden md:inline">New Task</span>
            </Button>
          )}
        </div>
      </header>

      <SmartAlertsCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <ThemeFlyout isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <AccessManagerModal isOpen={isAccessManagerOpen} onClose={() => setIsAccessManagerOpen(false)} />
    </>
  );
};

export default Topbar;
