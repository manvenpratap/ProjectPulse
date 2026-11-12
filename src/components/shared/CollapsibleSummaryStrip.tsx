import React, { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BarChart3, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export type SummaryTone = 'neutral' | 'primary' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';

export interface SummaryMetricItem {
  label: string;
  value: string | number;
  tone?: SummaryTone;
}

export interface CollapsibleSummaryStripProps {
  /** Compact metrics shown in the single-line summary bar when minimized */
  summary: SummaryMetricItem[];
  /** Short label displayed when the summary cards section is expanded */
  title?: string;
  /** Optional contextual help trigger kept visible even while minimized */
  help?: React.ReactNode;
  /** Minimized by default unless explicitly overridden */
  defaultExpanded?: boolean;
  /** Optional class for the outer container */
  className?: string;
  /** Inner body wrapper class inside the animated reveal stage */
  contentClassName?: string;
  /** Cards grid content revealed on demand */
  children: React.ReactNode;
}

const TONE_DOT_CLASSES: Record<SummaryTone, string> = {
  neutral: 'bg-[var(--color-text-muted)]',
  primary: 'bg-[var(--color-primary-hex)]',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  purple: 'bg-purple-500'
};

const TONE_VALUE_CLASSES: Record<SummaryTone, string> = {
  neutral: 'text-[var(--color-text)]',
  primary: 'text-[var(--color-primary-hex)]',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-500',
  sky: 'text-sky-600 dark:text-sky-400',
  purple: 'text-purple-500'
};

/**
 * Collapsible top summary strip: keeps top KPI/metric cards minimized to a compact
 * single-row summary ribbon by default and reveals the full cards with a smooth
 * height, clip, transform, and staggered entrance animation on demand.
 */
export const CollapsibleSummaryStrip: React.FC<CollapsibleSummaryStripProps> = ({
  summary,
  title = 'Summary Cards',
  help,
  defaultExpanded = false,
  className = '',
  contentClassName = 'pt-2.5',
  children
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const reduce = useReducedMotion();

  return (
    <div className={clsx('w-full min-w-0', className)}>
      {/* Compact Trigger Ribbon */}
      <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs min-w-0">
        {!expanded ? (
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-fade-x min-w-0 flex-1 py-0.5">
            {summary.map((item) => {
              const tone = item.tone || 'neutral';
              return (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)]/70 shrink-0 whitespace-nowrap text-[11px]"
                >
                  <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', TONE_DOT_CLASSES[tone])} />
                  <span className="font-medium text-[var(--color-text-muted)]">{item.label}</span>
                  <span className={clsx('font-mono font-bold tabular-nums', TONE_VALUE_CLASSES[tone])}>
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1 text-xs">
            <BarChart3 size={13} className="text-[var(--color-primary-hex)] shrink-0" />
            <span className="font-bold text-[var(--color-text)] truncate">{title}</span>
            <span className="text-[10px] font-mono text-[var(--color-text-faint)] hidden sm:inline">
              {summary.length} metrics
            </span>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {help}
          <button
            type="button"
            onClick={() => setExpanded(prev => !prev)}
            aria-expanded={expanded}
            aria-controls={panelId}
            className={clsx(
              'h-7 px-2.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 cursor-pointer select-none',
              'transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]',
              expanded
                ? 'bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/30'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
            )}
          >
            <BarChart3 size={12} className="shrink-0" />
            <span>{expanded ? 'Hide Cards' : 'Show Cards'}</span>
            <ChevronDown
              size={13}
              className={clsx(
                'shrink-0 transition-transform duration-200 ease-[var(--ease-out-ui)]',
                expanded && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>

      {/* Animated On-Demand Cards Reveal */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0.14 }
                : {
                    height: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
                    opacity: { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
                  }
            }
            className="overflow-hidden"
          >
            <motion.div
              initial={
                reduce
                  ? false
                  : {
                      opacity: 0,
                      transform: 'translateY(-8px) scale(0.985)',
                      clipPath: 'inset(0% 0% 18% 0% round 16px)'
                    }
              }
              animate={{
                opacity: 1,
                transform: 'translateY(0px) scale(1)',
                clipPath: 'inset(0% 0% 0% 0% round 16px)'
              }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : {
                      opacity: 0,
                      transform: 'translateY(-6px) scale(0.985)',
                      clipPath: 'inset(0% 0% 18% 0% round 16px)'
                    }
              }
              transition={
                reduce
                  ? { duration: 0.12 }
                  : { type: 'spring', duration: 0.4, bounce: 0.12 }
              }
              className={clsx('collapsible-cards-reveal', contentClassName)}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleSummaryStrip;

