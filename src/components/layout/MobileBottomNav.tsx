import React from 'react';
import { Presentation, ClipboardList, Users, ShieldAlert, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useProject } from '../../store/ProjectContext';
import { getHubForView } from '../../config/navigation';

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
  const currentHub = getHubForView(currentView);

  const primaryTabs = [
    { hubId: 'analytics', id: 'overview', label: 'Analytics', icon: Presentation },
    { hubId: 'execution', id: 'tasks', label: 'Execution', icon: ClipboardList, badge: state.deliveries?.length },
    { hubId: 'team', id: 'team', label: 'Team', icon: Users },
    { hubId: 'governance', id: 'defects', label: 'Quality', icon: ShieldAlert, badge: state.defects?.filter(d => d.status === 'New').length },
  ];

  const isMoreActive = currentHub.id === 'architecture' || currentHub.id === 'settings';

  return (
    <nav 
      aria-label="Mobile Navigation" 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-surface)]/85 backdrop-blur-2xl saturate-180 border-t border-[var(--color-divider)]/80 flex items-center justify-around px-1 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-xs select-none"
    >
      {primaryTabs.map((tab) => {
        const isActive = currentHub.id === tab.hubId;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            aria-label={tab.label}
            className={clsx(
              "flex-1 flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-colors duration-150 active:scale-95 relative cursor-pointer",
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

      {/* More / All Hubs Drawer Button */}
      <button
        onClick={onOpenMore}
        aria-label="More navigation options"
        className={clsx(
          "flex-1 flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-colors duration-150 active:scale-95 relative cursor-pointer",
          isMoreActive 
            ? "text-[var(--color-primary-hex)] font-semibold" 
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        )}
      >
        <Menu size={19} strokeWidth={isMoreActive ? 2.4 : 1.8} />
        <span className="text-[10px] tracking-tight mt-1 truncate">
          Hubs
        </span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
