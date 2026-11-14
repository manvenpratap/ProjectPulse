import type { FC } from 'react';
import CxoEmailBriefing from './CxoEmailBriefing';

export interface CxoEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CxoEmailModal: FC<CxoEmailModalProps> = ({ isOpen, onClose }) => {
  return <CxoEmailBriefing embedded={false} isOpen={isOpen} onClose={onClose} />;
};

export default CxoEmailModal;
