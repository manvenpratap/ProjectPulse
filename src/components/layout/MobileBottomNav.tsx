import React, { useMemo } from 'react';
import { Presentation, ClipboardList, Users, ShieldAlert, Menu } from 'lucide-react';
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
  const currentHub = getHubForView(currentView);

  // Filter mobile tabs so only accessible hubs and views are visible
  const primaryTabs = useMemo(() => {
    const rawTabs = [
      { hubId: 'analytics', defaultId: 'overview', label: 'Analytics', icon: Presentation },
      { hubId: 'execution', defaultId: 'tasks', label: 'Execution', icon: ClipboardList, badge: state.deliveries?.length },
      { hubId: 'team', defaultId: 'team', label: 'Team', icon: Users },
      { hubId: 'governance', defaultId: 'defects', label: 'Quality', icon: ShieldAlert, badge: state.defects?.filter(d => d.status === 'New').length },
    ];

    return rawTabs.map(tab => {
      const hub = NAV_HUBS.find(h => h.id === tab.hubId);
      if (!hub) return null;
      const allowedItems = hub.items.filter(item => hasViewAccess(item.id));
      if (allowedItems.length === 0) return null;
      const targetId = allowedItems.some(i => i.id === tab.defaultId) ? tab.defaultId : allowedItems[0].id;
      return {
        ...tab,
        id: targetId,
      };
    }).filter(Boolean) as { hubId: string; id: string; label: string; icon: any; badge?: number }[];
  }, [hasViewAccess, state.deliveries?.length, state.defects]);

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
