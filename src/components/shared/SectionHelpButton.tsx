import type { FC } from 'react';
import { HelpCircle } from 'lucide-react';
import clsx from 'clsx';

interface SectionHelpButtonProps {
  view: string;
  section?: string;
  label?: string;
  size?: number;
  className?: string;
}

/**
 * Discreet per-section help trigger that opens HelpModal focused directly on the section's guide.
 */
export const SectionHelpButton: FC<SectionHelpButtonProps> = ({
  view,
  section,
  label,
  size = 14,
  className,
}) => {
  const accessibleLabel = label || (section ? `${section} guide` : 'Open section help');

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('open-view-help', { detail: { view, section } }));
      }}
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className={clsx(
        'inline-flex items-center justify-center p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]',
        className
      )}
    >
      <HelpCircle size={size} aria-hidden="true" />
    </button>
  );
};

export default SectionHelpButton;

