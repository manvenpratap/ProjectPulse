import React, { useMemo } from 'react';
import { Presentation, ClipboardList, Users, ShieldAlert, Flag, Menu } from 'lucide-react';
import clsx from 'clsx';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { NAV_HUBS, getHubForView } from '../../config/navigation';

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
  const { hasViewAccess } = useAuth();
  const hasTaskAccess = hasViewAccess('tasks');
  const currentHub = getHubForView(currentView, hasTaskAccess);

  // Dynamically select up to 4 top accessible hubs for the active persona
  const primaryTabs = useMemo(() => {
    const candidateHubs = [
      { hubId: 'analytics', defaultId: 'overview', label: 'Insights', icon: Presentation },
      { hubId: 'execution', defaultId: 'tasks', label: 'Tasks', icon: ClipboardList, badge: state.deliveries?.length },
      { hubId: 'team', defaultId: 'team', label: 'Team', icon: Users },
      { hubId: 'governance', defaultId: 'defects', label: 'Quality', icon: ShieldAlert, badge: state.defects?.filter(d => d.status === 'New').length },
      { hubId: 'planning', defaultId: 'releases', label: 'Plan', icon: Flag },
    ];

    const available = candidateHubs
      .map(tab => {
        const hub = NAV_HUBS.find(h => h.id === tab.hubId);
        if (!hub) return null;
        const allowedItems = hub.items.filter(item => {
          if (item.id === 'timeline' && hasTaskAccess) return false;
          return hasViewAccess(item.id);
        });
        if (allowedItems.length === 0) return null;
        const targetId = allowedItems.some(i => i.id === tab.defaultId) ? tab.defaultId : allowedItems[0].id;
        return {
          ...tab,
          id: targetId,
        };
      })
      .filter(Boolean) as { hubId: string; id: string; label: string; icon: any; badge?: number }[];

    return available.slice(0, 4);
  }, [hasViewAccess, hasTaskAccess, state.deliveries?.length, state.defects]);

  const isMoreActive = !primaryTabs.some(t => t.hubId === currentHub.id);

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
            type="button"
            key={tab.hubId}
            onClick={() => onNavigate(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-colors duration-150 active:scale-95 relative cursor-pointer',
              isActive
                ? 'text-[var(--color-primary-hex)] font-semibold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            )}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="w-6 h-0.5 rounded-full bg-[var(--color-primary-hex)] mb-0.5"
              />
            )}
            <div className="relative">
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-[var(--color-primary-hex)] text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* All Hubs Drawer Button */}
      <button
        type="button"
        onClick={onOpenMore}
        aria-label="More navigation options"
        aria-current={isMoreActive ? 'page' : undefined}
        className={clsx(
          'flex-1 flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl transition-colors duration-150 active:scale-95 relative cursor-pointer',
          isMoreActive
            ? 'text-[var(--color-primary-hex)] font-semibold'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        )}
      >
        {isMoreActive && (
          <span
            aria-hidden="true"
            className="w-6 h-0.5 rounded-full bg-[var(--color-primary-hex)] mb-0.5"
          />
        )}
        <Menu size={19} strokeWidth={isMoreActive ? 2.4 : 1.8} aria-hidden="true" />
        <span className="text-[10px] tracking-tight mt-0.5 truncate">
          Hubs
        </span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
