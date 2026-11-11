import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import {
  ChevronLeft,
  ChevronDown,
  Activity,
  Menu,
  FileSpreadsheet,
  Download,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import clsx from 'clsx';
import { NAV_HUBS, getHubForView } from '../../config/navigation';
import { isRaidActive } from '../../utils/projectUtils';
import { motion, AnimatePresence } from 'motion/react';
import { exportProjectExcel, importProjectExcel } from '../../services/excelService';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle, onNavigate }) => {
  const { state, updateProject } = useProject();
  const { hasViewAccess, canPerform, isAdmin } = useAuth();
  const [processingLatency, setProcessingLatency] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isMobileViewport = useMediaQuery('(max-width: 1023px)');

  const hasTaskAccess = hasViewAccess('tasks');
  const hasDeliveryAccess = hasViewAccess('deliveries');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingLatency(`Importing ${file.name}...`);
    try {
      const importedData = await importProjectExcel(file);
      updateProject(importedData);
      setProcessingLatency(null);
      alert('Project data imported successfully from Excel.');
    } catch (err: any) {
      setProcessingLatency(null);
      alert('Failed to import Excel: ' + err.message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async () => {
    await exportProjectExcel(state);
  };

  // Filter navigation hubs and items strictly based on role access + presentation deduplication
  const visibleHubs = useMemo(() => {
    return NAV_HUBS.map(hub => {
      const allowedItems = hub.items.filter(item => {
        // Hide standalone Project Timeline in Sidebar for roles that already have unified Tasks & Timeline
        if (item.id === 'timeline' && hasTaskAccess) return false;
        return hasViewAccess(item.id);
      });
      if (allowedItems.length === 0) return null;
      return {
        ...hub,
        items: allowedItems,
        defaultView: allowedItems.some(i => i.id === hub.defaultView) ? hub.defaultView : allowedItems[0].id
      };
    }).filter(Boolean) as (typeof NAV_HUBS[0])[];
  }, [hasViewAccess, hasTaskAccess]);

  const currentHub = useMemo(() => {
    const matched = getHubForView(state.view, hasTaskAccess);
    return visibleHubs.find(h => h.id === matched.id) || visibleHubs[0] || NAV_HUBS[0];
  }, [state.view, hasTaskAccess, visibleHubs]);

  // Collapse administrative Workspace & Schema hub by default unless currently inside it
  const [expandedHubs, setExpandedHubs] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    NAV_HUBS.forEach(h => {
      init[h.id] = h.defaultCollapsed ? currentHub?.id === h.id : true;
    });
    return init;
  });

  // Always auto-expand the active hub when route changes
  useEffect(() => {
    if (currentHub) {
      setExpandedHubs(prev => ({ ...prev, [currentHub.id]: true }));
    }
  }, [currentHub?.id]);

  // Escape dismissal strictly scoped to open mobile drawer when no higher dialog is active
  useEffect(() => {
    if (!isMobileViewport || !isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const openDialogAbove = document.querySelector('[aria-modal="true"]:not(aside)');
      if (!openDialogAbove) {
        toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileViewport, isOpen, toggle]);

  const toggleHub = (hubId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHubs(prev => ({ ...prev, [hubId]: !prev[hubId] }));
  };

  // Compute accurate live badges (fixed: state.raids instead of stale state.risks)
  const getItemBadge = (id: string): number | undefined => {
    switch (id) {
      case 'deliveries': return state.deliveries?.length;
      case 'releases': return state.releases?.length;
      case 'retro': return state.retros?.filter(r => r.category === 'action_item' && r.status !== 'Resolved').length || undefined;
      case 'defects': return state.defects?.filter(d => d.status === 'New').length;
      case 'risks': return state.raids?.filter(r => isRaidActive(r.status)).length;
      default: return undefined;
    }
  };

  const getHubBadge = (hub: typeof NAV_HUBS[0]): number => {
    return hub.items.reduce((sum, item) => sum + (getItemBadge(item.id) || 0), 0);
  };

  const homeView = visibleHubs[0]?.defaultView || 'overview';
  const showQuickData = isOpen && (canPerform('canExportExcel') || isAdmin || canPerform('canManageSettings'));

  const handleSwipeTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (!isMobileViewport || !isOpen || e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleSwipeTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !isMobileViewport || !isOpen || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    // Strict horizontal left-swipe threshold prevents vertical drawer scroll misfires
    if (dx < -70 && Math.abs(dx) > 2 * Math.abs(dy)) {
      toggle();
    }
  };

  return (
    <aside
      aria-label="Workspace Navigation Drawer"
      role={isMobileViewport && isOpen ? 'dialog' : undefined}
      aria-modal={isMobileViewport && isOpen ? true : undefined}
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
      className={clsx(
        "h-full bg-[var(--color-surface)]/92 backdrop-blur-2xl border-r border-[var(--color-divider)] flex flex-col motion-safe:transition-[transform,width] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] fixed lg:relative z-50 lg:z-30 shadow-xl lg:shadow-none motion-reduce:transition-none select-none",
        isOpen ? 'translate-x-0 w-[270px] max-w-[85vw]' : '-translate-x-full lg:translate-x-0 lg:w-[68px]'
      )}
    >
      {/* Brand Header (clickable return to Home view) */}
      <div className="h-[calc(54px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-3.5 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/75 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate(homeView)}
          className="flex items-center gap-3 min-w-0 text-left rounded-xl p-1 -ml-1 hover:bg-[var(--color-surface-2)]/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
          title="Return to Home Dashboard"
          aria-label="ProjectPulse Home"
        >
          <div className="w-8 h-8 bg-[var(--color-primary-hex)] rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Activity size={16} strokeWidth={2.4} aria-hidden="true" />
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
        </button>
        {isOpen && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Close navigation drawer"
            className="lg:hidden p-1.5 hover:bg-[var(--color-surface-2)] rounded-xl text-[var(--color-text-muted)] min-h-[44px] min-w-[44px] -mr-1.5 flex items-center justify-center active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Primary Navigation Tree */}
      <nav aria-label="Primary" className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 custom-scroll">
        {isOpen ? (
          <ul className="space-y-1.5">
            {visibleHubs.map((hub) => {
              const isHubActive = currentHub.id === hub.id;
              const isExpanded = !!expandedHubs[hub.id];
              const HubIcon = hub.icon;
              const hubBadge = getHubBadge(hub);
              const listId = `sidebar-hub-${hub.id}`;

              return (
                <li key={hub.id} className="rounded-xl overflow-hidden">
                  {/* Hub Group Header */}
                  <div className="flex items-center w-full gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isExpanded) {
                          setExpandedHubs(prev => ({ ...prev, [hub.id]: true }));
                        }
                        onNavigate(hub.defaultView);
                      }}
                      className={clsx(
                        'flex-1 flex items-center justify-between px-2.5 py-2 min-h-[36px] rounded-lg transition-colors duration-150 cursor-pointer active:scale-[0.99] group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]',
                        isHubActive
                          ? 'bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold'
                          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/60 hover:text-[var(--color-text)]'
                      )}
                      title={hub.description}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <HubIcon
                          size={16}
                          aria-hidden="true"
                          className={clsx('shrink-0', isHubActive ? 'text-[var(--color-primary-hex)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]')}
                        />
                        <span className="text-xs font-semibold truncate tracking-tight">
                          {hub.label}
                        </span>
                      </div>

                      {hubBadge > 0 && !isExpanded && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold">
                          {hubBadge}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => toggleHub(hub.id, e)}
                      aria-expanded={isExpanded}
                      aria-controls={listId}
                      className="p-1.5 min-h-[36px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-offset)] text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-transform shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                      aria-label={isExpanded ? `Collapse ${hub.label}` : `Expand ${hub.label}`}
                    >
                      <ChevronDown
                        size={14}
                        aria-hidden="true"
                        className={clsx('transition-transform duration-200', isExpanded ? 'rotate-0' : '-rotate-90')}
                      />
                    </button>
                  </div>

                  {/* Nested Destination List */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.ul
                        id={listId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden ml-4 pl-2.5 border-l border-[var(--color-divider)] my-1 space-y-0.5"
                      >
                        {hub.items.map((item) => {
                          const isItemActive =
                            state.view === item.id ||
                            (item.id === 'tasks' && state.view === 'timeline' && hasTaskAccess);
                          const ItemIcon = item.icon;
                          const badge = getItemBadge(item.id);

                          return (
                            <li key={item.id}>
                              <button
                                type="button"
                                onClick={() => onNavigate(item.id)}
                                aria-current={isItemActive ? 'page' : undefined}
                                className={clsx(
                                  'relative w-full flex items-center justify-between px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium transition-colors duration-150 active:scale-[0.98] cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]',
                                  isItemActive
                                    ? 'bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-semibold shadow-2xs'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                                )}
                                title={item.shortcut ? `${item.description} (${item.shortcut})` : item.description}
                              >
                                {/* Non-color active indicator bar (WCAG 1.4.1) */}
                                {isItemActive && (
                                  <span
                                    aria-hidden="true"
                                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[var(--color-primary-hex)]"
                                  />
                                )}
                                <div className="flex items-center gap-2 min-w-0 pl-0.5">
                                  <ItemIcon
                                    size={14}
                                    aria-hidden="true"
                                    className={clsx('shrink-0', isItemActive ? 'text-[var(--color-primary-hex)]' : 'text-[var(--color-text-faint)] group-hover:text-[var(--color-text)]')}
                                  />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {badge !== undefined && badge > 0 && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] font-bold shrink-0">
                                    {badge}
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        ) : (
          /* COLLAPSED RAIL MODE */
          <ul className="flex flex-col items-center space-y-2">
            {visibleHubs.map((hub) => {
              const isHubActive = currentHub.id === hub.id;
              const HubIcon = hub.icon;
              const hubBadge = getHubBadge(hub);

              return (
                <li key={hub.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(hub.defaultView)}
                    aria-label={hub.label}
                    aria-current={isHubActive ? 'page' : undefined}
                    className={clsx(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-150 relative active:scale-95 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]',
                      isHubActive
                        ? 'bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] ring-1 ring-[var(--color-primary-hex)]/40 shadow-2xs'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                    )}
                    title={`${hub.label} — ${hub.description}`}
                  >
                    <HubIcon size={19} strokeWidth={isHubActive ? 2.3 : 1.8} aria-hidden="true" />
                    {hubBadge > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-primary-hex)] ring-2 ring-[var(--color-surface)]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Workspace Quick Stats (Expanded Mode - execution roles) */}
        {isOpen && (hasTaskAccess || hasDeliveryAccess) && (
          <div className="pt-3 pb-1 px-1">
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

        {/* Processing Indicator */}
        {processingLatency && isOpen && (
          <div className="mx-2 mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2 motion-safe:animate-pulse">
            <RefreshCw size={12} className="animate-spin shrink-0" />
            <span className="truncate">{processingLatency}</span>
          </div>
        )}
      </nav>

      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".xlsx"
        onChange={handleFileChange}
      />

      {/* Compact Utility Footer: Quick Excel I/O + Contextual Screen Guide */}
      {isOpen && (
        <div className="px-3 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:pb-2 border-t border-[var(--color-divider)] shrink-0 space-y-2">
          {showQuickData && (
            <div className="grid grid-cols-2 gap-1.5">
              {(isAdmin || canPerform('canManageSettings')) && (
                <button
                  type="button"
                  onClick={handleImportClick}
                  className="flex items-center justify-center gap-1.5 px-2 py-1.5 min-h-[32px] rounded-lg text-[11px] font-semibold bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                  title="Import project data from Excel (.xlsx)"
                >
                  <FileSpreadsheet size={13} className="text-indigo-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">Import .xlsx</span>
                </button>
              )}
              {canPerform('canExportExcel') && (
                <button
                  type="button"
                  onClick={handleExport}
                  className={clsx(
                    'flex items-center justify-center gap-1.5 px-2 py-1.5 min-h-[32px] rounded-lg text-[11px] font-semibold bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer',
                    !(isAdmin || canPerform('canManageSettings')) && 'col-span-2'
                  )}
                  title="Export full workbook to Excel (Cmd/Ctrl+E)"
                >
                  <Download size={13} className="text-emerald-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">Export .xlsx</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-view-help', { detail: { view: state.view } }))}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-primary-highlight-hex)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/30 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            title="How this screen works (F1 or ?)"
          >
            <HelpCircle size={14} className="text-[var(--color-primary-hex)] shrink-0" aria-hidden="true" />
            <span className="truncate">How this view works</span>
          </button>
        </div>
      )}

      {/* Collapse / Expand Toggle Button (Desktop Rail only) */}
      <div className="hidden lg:block p-3 border-t border-[var(--color-divider)] shrink-0">
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? 'Collapse navigation sidebar' : 'Expand navigation sidebar'}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors active:scale-95 cursor-pointer min-h-[38px]"
        >
          {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
