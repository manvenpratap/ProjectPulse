import React, { useState, useRef, useMemo } from 'react';
import { LucideIcon, HelpCircle, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { getHubForView } from '../../config/navigation';
import { ShareExportMenu } from './ShareExportMenu';
import clsx from 'clsx';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  primaryAction?: React.ReactNode; // Prominent Primary Action Button positioned on the far top right
  toolbar?: React.ReactNode;
  showHubTabs?: boolean; // Deprecated in Option A: redundant Hub Sub-Navigation row eliminated across all screens
  showShareExport?: boolean;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  primaryAction,
  toolbar,
  showShareExport = true,
  className = '',
}) => {
  const { state, setView } = useProject();
  const { hasViewAccess } = useAuth();
  const [isHubMenuOpen, setIsHubMenuOpen] = useState(false);
  const hubMenuRef = useRef<HTMLLIElement>(null);

  useClickOutside(hubMenuRef, () => setIsHubMenuOpen(false), isHubMenuOpen);

  const hasTaskAccess = hasViewAccess('tasks');
  const currentHub = getHubForView(state.view, hasTaskAccess);

  const siblingViews = useMemo(() => {
    return currentHub.items.filter(item => {
      if (item.id === 'timeline' && hasTaskAccess) return false;
      return hasViewAccess(item.id);
    });
  }, [currentHub, hasTaskAccess, hasViewAccess]);

  const currentNavItem = useMemo(() => {
    return siblingViews.find(i => i.id === state.view) ||
      (state.view === 'timeline' && hasTaskAccess ? siblingViews.find(i => i.id === 'tasks') : undefined) ||
      siblingViews[0];
  }, [siblingViews, state.view, hasTaskAccess]);

  return (
    <header className={`border-b border-[var(--color-divider)] bg-[var(--color-surface)]/85 backdrop-blur-xl saturate-180 sticky top-0 z-30 shrink-0 shadow-2xs ${className}`}>
      {/* Primary Unified Header Row */}
      <div className="min-h-[52px] sm:min-h-[56px] py-2 px-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 sm:gap-2.5">
        <div className="order-1 flex-1 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/15 text-[var(--color-primary-hex)] flex items-center justify-center shrink-0 shadow-2xs">
            <Icon size={17} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 max-w-4xl">
            {/* Accessible Interactive Hub Breadcrumb + Sibling Quick-Switcher */}
            {currentHub?.label && (
              <nav aria-label="Breadcrumb" className="mb-0.5">
                <ol className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider leading-none whitespace-nowrap">
                  <li className="relative" ref={hubMenuRef}>
                    {siblingViews.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsHubMenuOpen(prev => !prev)}
                          aria-expanded={isHubMenuOpen}
                          aria-haspopup="true"
                          aria-controls="header-hub-siblings"
                          className="touch-hit-expand inline-flex items-center gap-1 rounded px-1 py-0.5 -ml-1 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-primary-hex)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)] max-w-[145px] sm:max-w-none"
                          title={`Switch view within ${currentHub.label}`}
                        >
                          <span className="truncate">{currentHub.label}</span>
                          <ChevronDown size={10} aria-hidden="true" className={clsx('shrink-0 transition-transform duration-150', isHubMenuOpen && 'rotate-180')} />
                        </button>
                        {isHubMenuOpen && (
                          <div
                            id="header-hub-siblings"
                            className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xl z-[70] py-1.5 normal-case tracking-normal"
                          >
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] border-b border-[var(--color-divider)] mb-1">
                              {currentHub.label}
                            </div>
                            <ul className="space-y-0.5 px-1.5">
                              {siblingViews.map(sib => {
                                const SibIcon = sib.icon;
                                const isActive = sib.id === state.view || (state.view === 'timeline' && sib.id === 'tasks');
                                return (
                                  <li key={sib.id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setView(sib.id);
                                        setIsHubMenuOpen(false);
                                      }}
                                      aria-current={isActive ? 'page' : undefined}
                                      className={clsx(
                                        'w-full flex items-center justify-between gap-2 px-2.5 py-2.5 sm:py-2 rounded-lg text-xs text-left transition-colors cursor-pointer',
                                        isActive
                                          ? 'bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold'
                                          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] font-medium'
                                      )}
                                    >
                                      <span className="flex items-center gap-2 min-w-0">
                                        <SibIcon size={13} className="shrink-0" aria-hidden="true" />
                                        <span className="truncate">{sib.label}</span>
                                      </span>
                                      {sib.shortcut ? (
                                        <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border border-[var(--color-divider)] shrink-0">
                                          {sib.shortcut}
                                        </kbd>
                                      ) : isActive ? (
                                        <Check size={12} className="shrink-0 text-[var(--color-primary-hex)]" aria-hidden="true" />
                                      ) : null}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <span>{currentHub.label}</span>
                    )}
                  </li>
                  <li aria-hidden="true" className="text-[var(--color-text-faint)]/70 flex items-center">
                    <ChevronRight size={10} />
                  </li>
                  <li className="text-[var(--color-text-muted)] truncate max-w-[140px] sm:max-w-[160px]" aria-current="page">
                    {currentNavItem?.shortLabel || title}
                  </li>
                </ol>
              </nav>
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-[13px] sm:text-base md:text-lg font-display font-black text-[var(--color-text)] tracking-tight leading-tight sm:leading-snug break-words sm:truncate">
                {title}
              </h1>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-view-help', { detail: { view: state.view } }))}
                className="touch-hit-expand min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] p-1 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer shrink-0"
                title={`Guide: How ${title} works (F1 or ?)`}
                aria-label={`Guide: How ${title} works`}
              >
                <HelpCircle size={15} />
              </button>
            </div>
            {subtitle && (
              <div className="text-[11px] sm:text-xs text-[var(--color-text-muted)] font-medium mt-0.5 truncate max-w-3xl">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {(showShareExport || primaryAction) && (
          <div className="order-2 2xl:order-3 flex items-center gap-1.5 sm:gap-2 shrink-0 justify-end">
            {showShareExport && <ShareExportMenu />}
            {primaryAction}
          </div>
        )}

        {actions && (
          <div className="order-3 2xl:order-2 w-full 2xl:w-auto min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto 2xl:overflow-visible no-scrollbar max-2xl:pt-2 max-2xl:mt-0.5 max-2xl:border-t max-2xl:border-[var(--color-divider)]/60 2xl:flex-wrap 2xl:justify-end">
            {actions}
          </div>
        )}
      </div>

      {/* Integrated Tier 2 Operational Toolbar (when provided) */}
      {toolbar && (
        <div className="px-4 sm:px-6 lg:px-8 py-2 bg-[var(--color-surface-2)]/30 border-t border-[var(--color-divider)] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {toolbar}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
