import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { BookOpen, Zap, Blocks, Target, Search, Palette, FileSpreadsheet } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Platform Operations Guide"
      size="lg"
      footer={<Button variant="primary" onClick={onClose}>Understood</Button>}
    >
      <div className="space-y-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-indigo-600">
                <Blocks size={20} />
                <h3 className="font-bold">Architectural Scaffolding</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
                Use the <strong>Project Scaffolder</strong> to define core modules and layers. Generates full task hierarchies and interface mapping automatically.
             </p>
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-emerald-600">
                <BookOpen size={20} />
                <h3 className="font-bold">Technical Blueprints</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
                Define reusable step templates in <strong>Step Blueprints</strong>. Apply them to tasks to ensure consistent implementation phases.
             </p>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-3 text-amber-600">
                <Search size={20} />
                <h3 className="font-bold">Global Navigation</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
                Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">G</kbd> then <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px]">/</kbd> to quickly focus the global search engine.
             </p>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-3 text-rose-600">
                <Target size={20} />
                <h3 className="font-bold">Predictive Foresight</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
                The dashboard uses <strong>AI Pulse</strong> and delivery telemetry to forecast completion and detect schedule slippage in real-time.
             </p>
          </div>

          <div className="space-y-3">
             <div className="flex items-center gap-3 text-cyan-600">
                <FileSpreadsheet size={20} />
                <h3 className="font-bold">Excel Synchronization</h3>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
                Export full project state to Excel or import existing plans. Download the <strong>Demo Excel</strong> from the Configuration & Data section in the sidebar for a full-featured starting point.
             </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="flex items-center gap-3 mb-3">
              <Palette size={18} className="text-indigo-500" />
              <h4 className="font-bold text-sm">Theme Synchronization</h4>
           </div>
           <p className="text-xs text-slate-500 leading-relaxed">
             This platform supports modular theming. Change appearances via the <strong>Palette</strong> icon in the top navigation bar to suit your workspace environment.
           </p>
        </div>
      </div>
    </Modal>
  );
};

export default HelpModal;
