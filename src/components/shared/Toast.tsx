import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toast, ToastItem } from '../../utils/toast';

export const ToastContainer: React.FC = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toast.subscribe(setItems);
  }, []);

  if (typeof document === 'undefined') return null;

  const node = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-[calc(12px+env(safe-area-inset-top,0px))] right-3 left-3 sm:left-auto sm:right-6 z-[120] flex flex-col gap-2 pointer-events-none max-w-sm w-full mx-auto sm:mx-0 select-none"
    >
      <AnimatePresence mode="popLayout">
        {items.map(t => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const icon = isSuccess ? (
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          ) : isError ? (
            <AlertCircle size={16} className="text-rose-500 shrink-0" />
          ) : isWarning ? (
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          ) : (
            <Info size={16} className="text-[var(--color-primary-hex)] shrink-0" />
          );

          const borderTone = isSuccess
            ? 'border-emerald-500/30'
            : isError
            ? 'border-rose-500/30'
            : isWarning
            ? 'border-amber-500/30'
            : 'border-[var(--color-primary-hex)]/30';

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', damping: 28, stiffness: 360 }}
              className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl bg-[var(--color-surface)]/95 backdrop-blur-xl border ${borderTone} shadow-2xl flex items-start gap-3 text-xs`}
              role="alert"
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 font-semibold text-[var(--color-text)] leading-relaxed break-words">
                {t.message}
              </div>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="touch-hit-expand p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return createPortal(node, document.body);
};

