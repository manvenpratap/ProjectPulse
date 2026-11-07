import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
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
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw]",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className={`relative w-full ${sizes[size]} bg-[var(--color-surface)] border-t sm:border border-[var(--color-border)] rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] sm:max-h-[90dvh]`}
          >
            {/* Mobile Sheet Handle */}
            <div className="w-10 h-1 bg-[var(--color-divider)] rounded-full mx-auto my-2 sm:hidden shrink-0" />

            <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-[var(--color-divider)]">
              <h3 className="font-display font-bold text-base sm:text-lg">{title}</h3>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full min-h-[36px] min-w-[36px]">
                <X size={18} />
              </Button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto custom-scroll flex-1 overscroll-contain">
              {children}
            </div>
            
            {footer && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex justify-end gap-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
