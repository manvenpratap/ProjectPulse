import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  className = '',
}) => {
  return (
    <header className={`min-h-[56px] sm:min-h-[60px] py-2 px-4 sm:px-6 lg:px-8 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-2 shrink-0 ${className}`}>
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
    </header>
  );
};

export default PageHeader;
