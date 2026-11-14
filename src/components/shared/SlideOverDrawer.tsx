import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

export interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export const SlideOverDrawer: React.FC<SlideOverDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = 'w-full sm:w-[480px] lg:w-[540px]',
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  const titleId = useId();

  // Keyboard navigation: Escape to close, '[' for previous, ']' for next
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '[' && hasPrevious && onPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === ']' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                "pointer-events-auto bg-[var(--color-surface)] border-l border-[var(--color-divider)] shadow-2xl flex flex-col h-full",
                widthClass
              )}
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0 flex-1">
                  {title && (
                    <div id={titleId} className="text-sm font-bold text-[var(--color-text)] truncate">
                      {title}
                    </div>
                  )}
                  {subtitle && (
                    <div className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                      {subtitle}
                    </div>
                  )}
                </div>

                {/* Sequential Navigation & Close */}
                <div className="flex items-center gap-1 shrink-0">
                  {(onPrevious || onNext) && (
                    <div className="flex items-center mr-1 p-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                      <button
                        type="button"
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                        title="Previous item ([)"
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={onNext}
                        disabled={!hasNext}
                        title="Next item (])"
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close panel"
                    className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto custom-scroll p-5 sm:p-6 space-y-5">
                {children}
              </div>

              {/* Drawer Footer */}
              {footer && (
                <div className="px-5 py-3.5 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between gap-3 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SlideOverDrawer;
