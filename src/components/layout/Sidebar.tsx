import React, { useState, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { 
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Activity,
  Menu,
  Lock
} from 'lucide-react';
import clsx from 'clsx';
import { NAV_HUBS, getHubForView } from '../../config/navigation';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, onNavigate }) => {
  const { state } = useProject();
  const { hasViewAccess } = useAuth();

  // Track which hubs are expanded in open mode (default to expanded for seamless discovery)
  const [expandedHubs, setExpandedHubs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV_HUBS.forEach(h => { init[h.id] = true; });
    return init;
  });

  // Ensure current hub is always expanded when view changes
  useEffect(() => {
    const active = getHubForView(state.view);
    setExpandedHubs(prev => ({ ...prev, [active.id]: true }));
  }, [state.view]);

  const toggleHub = (hubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHubs(prev => ({ ...prev, [hubId]: !prev[hubId] }));
  };

  // Helper to compute live badges
  const getItemBadge = (id: string): number | undefined => {
    switch (id) {
      case 'deliveries': return state.deliveries?.length;
      case 'releases': return state.releases?.length;
      case 'retro': return state.retros?.length;
      case 'defects': return state.defects?.filter(d => d.status === 'New').length;
      case 'risks': return state.risks?.filter(r => r.status === 'Open').length;
      default: return undefined;
    }
  };

  const getHubBadge = (hub: typeof NAV_HUBS[0]): number => {
    return hub.items.reduce((sum, item) => sum + (getItemBadge(item.id) || 0), 0);
  };

  const currentHub = getHubForView(state.view);

  return (
    <aside 
      aria-label="Application Navigation"
      className={clsx(
        "h-full bg-[var(--color-surface)]/92 backdrop-blur-2xl border-r border-[var(--color-divider)] flex flex-col motion-safe:transition-[transform,width] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] fixed lg:relative z-30 shadow-xl lg:shadow-none motion-reduce:transition-none select-none",
        isOpen ? "translate-x-0 w-[270px] max-w-[85vw]" : "-translate-x-full lg:translate-x-0 lg:w-[68px]"
      )}
    >
      {/* Brand Header */}
      <div className="h-[calc(54px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-4 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/75 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-[var(--color-primary-hex)] rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Activity size={16} strokeWidth={2.4} />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-[var(--color-text)] truncate block">
                ProjectPulse
              </span>
              <span className="text-[10px] text-[var(--color-text-faint)] font-mono block truncate">
                ALM Platform 2.0
              </span>
            </div>
          )}
        </div>
        {isOpen && (
          <button 
            onClick={toggle}
            aria-label="Collapse sidebar navigation"
            className="lg:hidden p-1.5 hover:bg-[var(--color-surface-2)] rounded-lg text-[var(--color-text-muted)] min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scroll">
        {isOpen ? (
          /* EXPANDED SIDEBAR: Structured Hub Groups */
          NAV_HUBS.map((hub) => {
            const isHubActive = currentHub.id === hub.id;
            const isExpanded = !!expandedHubs[hub.id];
            const HubIcon = hub.icon;
            const hubBadge = getHubBadge(hub);

            return (
              <div key={hub.id} className="rounded-xl overflow-hidden border border-transparent transition-colors">
                {/* Hub Header Button */}
                <div className="flex items-center w-full gap-0.5">
                  <button
                    onClick={() => {
                      if (!isExpanded) {
                        setExpandedHubs(prev => ({ ...prev, [hub.id]: true }));
                      }
                      onNavigate(hub.defaultView);
                    }}
                    className={clsx(
                      "flex-1 flex items-center justify-between px-2.5 py-2 min-h-[38px] rounded-lg transition-colors duration-150 cursor-pointer active:scale-[0.99] group text-left",
                      isHubActive 
                        ? "bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold" 
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/60 hover:text-[var(--color-text)]"
                    )}
                    title={hub.description}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HubIcon 
                        size={16} 
                        className={clsx("shrink-0", isHubActive ? "text-[var(--color-primary-hex)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]")} 
                      />
                      <span className="text-xs font-semibold truncate tracking-tight">
                        {hub.label}
                      </span>
                    </div>

                    {hubBadge > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold">
                        {hubBadge}
                      </span>
                    )}
                  </button>

                  {hub.items.length > 1 && (
                    <button
                      onClick={(e) => toggleHub(hub.id, e)}
                      className="p-1.5 min-h-[36px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-offset)] text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-transform shrink-0 cursor-pointer"
                      aria-label={isExpanded ? `Collapse ${hub.label}` : `Expand ${hub.label}`}
                    >
                      <ChevronDown 
                        size={14} 
                        className={clsx("transition-transform duration-200", isExpanded ? "rotate-0" : "-rotate-90")} 
                      />
                    </button>
                  )}
                </div>

                {/* Sub-Items List */}
                <AnimatePresence initial={false}>
                  {isExpanded && hub.items.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden ml-4 pl-2.5 border-l border-[var(--color-divider)] my-1 space-y-0.5"
                    >
                      {hub.items.map((item) => {
                        const isItemActive = state.view === item.id;
                        const ItemIcon = item.icon;
                        const badge = getItemBadge(item.id);
                        const hasAccess = hasViewAccess(item.id);

                        return (
                          <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={clsx(
                              "w-full flex items-center justify-between px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.98] cursor-pointer group text-left",
                              isItemActive
                                ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-semibold shadow-2xs"
                                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                              !hasAccess && "opacity-60"
                            )}
                            title={!hasAccess ? `${item.label} (Access Restricted)` : item.description}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ItemIcon size={14} className={clsx("shrink-0", isItemActive ? "text-[var(--color-primary-hex)]" : "text-[var(--color-text-faint)] group-hover:text-[var(--color-text)]")} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {!hasAccess && (
                                <Lock size={11} className="text-[var(--color-text-faint)] shrink-0" />
                              )}
                              {badge !== undefined && badge > 0 && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] font-bold">
                                  {badge}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          /* COLLAPSED SIDEBAR: 6 Primary Hub Icons */
          <div className="flex flex-col items-center space-y-2">
            {NAV_HUBS.map((hub) => {
              const isHubActive = currentHub.id === hub.id;
              const HubIcon = hub.icon;
              const hubBadge = getHubBadge(hub);

              return (
                <button
                  key={hub.id}
                  onClick={() => onNavigate(hub.defaultView)}
                  aria-label={hub.label}
                  className={clsx(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-150 relative active:scale-95 cursor-pointer group",
                    isHubActive
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-2xs"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                  )}
                  title={`${hub.label} — ${hub.description}`}
                >
                  <HubIcon size={19} strokeWidth={isHubActive ? 2.3 : 1.8} />
                  {hubBadge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-primary-hex)] ring-2 ring-[var(--color-surface)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Workspace Quick Stats (Expanded Mode) */}
        {isOpen && (
          <div className="pt-4 pb-1 px-1">
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl p-2.5 grid grid-cols-3 gap-1.5 text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] font-medium text-[var(--color-text-faint)]">Tasks</span>
                <div className="text-xs font-mono font-bold leading-tight">{state.tasks.length}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-medium text-[var(--color-text-faint)]">Done</span>
                <div className="text-xs font-mono font-bold leading-tight text-emerald-500">
                  {state.tasks.filter(t => t.status === 'Completed').length}
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-medium text-[var(--color-text-faint)]">ALM</span>
                <div className="text-xs font-mono font-bold leading-tight text-[var(--color-primary-hex)]">
                  {state.deliveries?.length || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapse / Expand Toggle Button */}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] border-t border-[var(--color-divider)] shrink-0">
        <button 
          onClick={toggle}
          aria-label={isOpen ? "Collapse navigation sidebar" : "Expand navigation sidebar"}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors active:scale-95 cursor-pointer min-h-[38px]"
        >
          {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
