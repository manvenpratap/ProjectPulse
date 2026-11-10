import React from 'react';
import { LucideIcon, HelpCircle, ChevronRight } from 'lucide-react';
import { useProject } from '../../store/ProjectContext';
import { getHubForView } from '../../config/navigation';
import { ShareExportMenu } from './ShareExportMenu';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
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
  toolbar,
  showShareExport = true,
  className = '',
}) => {
  const { state } = useProject();
  const currentHub = getHubForView(state.view);

  return (
    <header className={`border-b border-[var(--color-divider)] bg-[var(--color-surface)]/85 backdrop-blur-xl saturate-180 sticky top-0 z-30 shrink-0 shadow-2xs ${className}`}>
      {/* Primary Unified Header Row */}
      <div className="min-h-[52px] sm:min-h-[56px] py-2 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] border border-[var(--color-primary-hex)]/15 text-[var(--color-primary-hex)] flex items-center justify-center shrink-0 shadow-2xs">
            <Icon size={17} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 max-w-4xl">
            {currentHub?.label && (
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[var(--color-text-faint)] uppercase tracking-wider leading-none mb-0.5 truncate">
                <span>{currentHub.label}</span>
                <ChevronRight size={10} className="text-[var(--color-text-faint)]/70 shrink-0" />
              </div>
            )}
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
              <div className="text-[11px] sm:text-xs text-[var(--color-text-muted)] font-medium mt-0.5 truncate max-w-3xl">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {(actions || showShareExport) && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
            {actions}
            {showShareExport && <ShareExportMenu />}
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
