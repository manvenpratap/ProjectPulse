import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useProject } from '../../store/ProjectContext';
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
  const currentHub = getHubForView(state.view);
  const showTabs = showHubTabs && currentHub && currentHub.items.length > 1;

  return (
    <header className={`border-b border-[var(--color-divider)] bg-[var(--color-surface)]/85 backdrop-blur-md sticky top-0 z-20 shrink-0 ${className}`}>
      {/* Primary Header Row */}
      <div className="min-h-[56px] sm:min-h-[60px] py-2 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0">
            <Icon size={17} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-sm sm:text-base font-bold text-[var(--color-text)] tracking-tight leading-none truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] font-medium mt-1 truncate">
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
        <div className="px-4 sm:px-6 lg:px-8 bg-[var(--color-surface-2)]/60 border-t border-[var(--color-divider)] flex items-center gap-1 overflow-x-auto custom-scroll py-1.5 max-w-full">
          <span className="text-[10px] font-semibold text-[var(--color-text-faint)] uppercase tracking-wider mr-2 shrink-0 hidden md:inline">
            {currentHub.label}:
          </span>
          {currentHub.items.map((item) => {
            const isActive = state.view === item.id;
            const ItemIcon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={clsx(
                  "px-3 py-2 min-h-[36px] rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shrink-0",
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
      )}
    </header>
  );
};

export default PageHeader;
