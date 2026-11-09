import React, { useMemo } from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { getHubForView } from '../../config/navigation';
import clsx from 'clsx';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  showHubTabs?: boolean;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  showHubTabs = true,
  className = '',
}) => {
  const { state, setView } = useProject();
  const { hasViewAccess } = useAuth();
  const currentHub = getHubForView(state.view);

  // Filter sub-navigation tabs strictly based on user role access
  const accessibleHubItems = useMemo(() => {
    return currentHub?.items?.filter(item => hasViewAccess(item.id)) || [];
  }, [currentHub, hasViewAccess]);

  const showTabs = showHubTabs && accessibleHubItems.length > 1;

  return (
    <header className={`border-b border-[var(--color-divider)] bg-[var(--color-surface)]/85 backdrop-blur-xl saturate-180 sticky top-0 z-20 shrink-0 shadow-2xs ${className}`}>
      {/* Primary Header Row */}
      <div className="min-h-[56px] sm:min-h-[60px] py-2 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/15 text-[var(--color-primary-hex)] flex items-center justify-center shrink-0 shadow-2xs">
            <Icon size={17} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 max-w-4xl">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base md:text-lg font-display font-black text-[var(--color-text)] tracking-tight leading-snug truncate">
                {title}
              </h1>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-view-help', { detail: { view: state.view } }))}
                className="text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] p-1 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer shrink-0"
                title={`Guide: How ${title} works (F1 or ?)`}
                aria-label={`Guide: How ${title} works`}
              >
                <HelpCircle size={15} />
              </button>
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] font-medium mt-0.5 truncate max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-[60vw] sm:max-w-none">
            {actions}
          </div>
        )}
      </div>

      {/* Hub Sub-Navigation Tab Bar */}
      {showTabs && (
        <div className="px-4 sm:px-6 lg:px-8 bg-[var(--color-surface-2)]/50 border-t border-[var(--color-divider)] flex items-center gap-1.5 overflow-x-auto custom-scroll py-1.5 max-w-full">
          <span className="text-[10px] font-semibold text-[var(--color-text-faint)] uppercase tracking-wider mr-1.5 shrink-0 hidden md:inline">
            {currentHub.label}:
          </span>
          <div className="inline-flex items-center bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-divider)] gap-1">
            {accessibleHubItems.map((item) => {
              const isActive = state.view === item.id;
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={clsx(
                    "px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-96 shrink-0",
                    isActive
                      ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-sm border border-[var(--color-divider)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]/50"
                  )}
                  aria-label={item.label}
                >
                  <ItemIcon size={13} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span>{item.shortLabel || item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default PageHeader;
