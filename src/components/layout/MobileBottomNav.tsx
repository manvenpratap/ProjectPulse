import React from 'react';
import { Presentation, Package, ClipboardList, ShieldAlert, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useProject } from '../../store/ProjectContext';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenMore,
}) => {
  const { state } = useProject();

  const primaryTabs = [
    { id: 'overview', label: 'Overview', icon: Presentation },
    { id: 'deliveries', label: 'ALM', icon: Package, badge: state.deliveries?.length },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'risks', label: 'RAID', icon: ShieldAlert },
  ];

  const isMoreActive = !primaryTabs.some(tab => tab.id === currentView);

  return (
    <nav 
      aria-label="Mobile Navigation" 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-divider)] flex items-center justify-around px-1 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-lg select-none"
    >
      {primaryTabs.map((tab) => {
        const isActive = currentView === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            aria-label={tab.label}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-colors duration-150 active:scale-95 relative",
              isActive 
                ? "text-[var(--color-primary-hex)] font-semibold" 
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            <div className="relative">
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-[var(--color-primary-hex)] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* 5th Tab: Drawer Menu Trigger */}
      <button
        onClick={onOpenMore}
        aria-label="Open Full Workspace Menu"
        className={clsx(
          "flex-1 flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-colors duration-150 active:scale-95 relative",
          isMoreActive 
            ? "text-[var(--color-primary-hex)] font-semibold" 
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        )}
      >
        <div className="relative">
          <Menu size={19} strokeWidth={isMoreActive ? 2.4 : 1.8} />
          {isMoreActive && (
            <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-[var(--color-primary-hex)] rounded-full" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-1 truncate max-w-[64px]">
          Menu
        </span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
