import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const icon = isDanger ? (
    <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shrink-0">
      <AlertTriangle size={20} />
    </div>
  ) : isWarning ? (
    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
      <AlertCircle size={20} />
    </div>
  ) : (
    <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center border border-[var(--color-primary-hex)]/20 shrink-0">
      <HelpCircle size={20} />
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-4"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'primary' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={`rounded-xl px-4 font-bold shadow-xs ${
              isDanger ? 'bg-rose-500 hover:bg-rose-600 text-white' : ''
            }`}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4 py-1">
        {icon}
        <div className="flex-1 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed pt-1">
          {message}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
