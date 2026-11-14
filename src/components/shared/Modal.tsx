import React, { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import Button from './Button';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md' 
}) => {
  const titleId = useId();
  const dragControls = useDragControls();
  const isMobile = useMediaQuery('(max-width: 639px)');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw]",
  };

  const modalNode = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-black/35 backdrop-blur-sm overflow-hidden overscroll-contain"
          />
          
          <motion.div
            initial={isMobile ? { y: '100%', opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%', opacity: 1 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={
              isMobile 
                ? { type: 'spring', damping: 32, stiffness: 340, mass: 0.8 }
                : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
            }
            drag={isMobile ? 'y' : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={(_, info) => {
              if (isMobile && (info.offset.y > 90 || info.velocity.y > 420)) {
                onClose();
              }
            }}
            className={`relative w-full ${sizes[size]} bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[90dvh] overscroll-contain`}
          >
            {/* Mobile Sheet Drag Handle (strictly scoped drag trigger via dragListener={false} above) */}
            <div
              onPointerDown={(e) => {
                if (isMobile) dragControls.start(e);
              }}
              className="w-full pt-2.5 pb-1 flex justify-center sm:hidden shrink-0 touch-none cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            >
              <div className="w-10 h-1 bg-[var(--color-divider)] rounded-full" />
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[var(--color-divider)]">
              <div id={titleId} className="font-display font-bold text-base sm:text-lg pr-2 flex items-center min-w-0">
                <h3 className="flex items-center gap-2 min-w-0 truncate">{title}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-full min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] shrink-0"
              >
                <X size={18} />
              </Button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto custom-scroll flex-1 overscroll-contain">
              {children}
            </div>
            
            {footer && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex justify-end gap-3 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return modalNode;
  return createPortal(modalNode, document.body);
};

export default Modal;
