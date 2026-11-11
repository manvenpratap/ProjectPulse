import React, { useState, useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { 
  Share2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Code, 
  Globe, 
  Copy, 
  Mail, 
  Printer, 
  ChevronDown, 
  Check, 
  Layers
} from 'lucide-react';
import { useProject } from '../../store/ProjectContext';
import { 
  exportViewToExcel, 
  exportViewToCSV, 
  exportViewToJSON, 
  exportProjectJSON,
  exportViewToHTML, 
  copyViewSummaryToClipboard, 
  shareViewViaEmail,
  getViewItemCount 
} from '../../services/exportService';
import { exportProjectExcel, exportFeatureMatrixExcel, downloadDeliveryTemplate } from '../../services/excelService';

interface ShareExportMenuProps {
  viewId?: string;
  className?: string;
  buttonLabel?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  compact?: boolean;
}

export const ShareExportMenu: React.FC<ShareExportMenuProps> = ({
  viewId,
  className = '',
  buttonLabel = 'Share & Export',
  variant = 'outline',
  compact = false,
}) => {
  const { state, setView } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeView = viewId || state.view;
  const itemCount = getViewItemCount(state, activeView);

  // Close on click outside or escape key
  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  const handleCopySummary = async () => {
    try {
      setExporting('copy');
      const ok = await copyViewSummaryToClipboard(state, activeView);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setExporting(null);
    }
  };

  const handleExportViewExcel = async () => {
    try {
      setExporting('view-excel');
      await exportViewToExcel(state, activeView);
      setIsOpen(false);
    } finally {
      setExporting(null);
    }
  };

  const handleExportMasterExcel = async () => {
    try {
      setExporting('master-excel');
      await exportProjectExcel(state);
      setIsOpen(false);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCSV = () => {
    exportViewToCSV(state, activeView);
    setIsOpen(false);
  };

  const handleExportJSON = () => {
    exportViewToJSON(state, activeView);
    setIsOpen(false);
  };

  const handleExportHTML = () => {
    exportViewToHTML(state, activeView);
    setIsOpen(false);
  };

  const handleExportFeatureMatrix = async () => {
    try {
      setExporting('feature-matrix');
      await exportFeatureMatrixExcel(state);
      setIsOpen(false);
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadDeliveryTemplate = async () => {
    try {
      setExporting('delivery-template');
      await downloadDeliveryTemplate(state);
      setIsOpen(false);
    } finally {
      setExporting(null);
    }
  };

  const handleExportFullProjectJSON = () => {
    exportProjectJSON(state);
    setIsOpen(false);
  };

  const handleShareEmail = () => {
    shareViewViaEmail(state, activeView);
    setIsOpen(false);
  };

  const handleOpenCxoModal = () => {
    setView('reports', false, 'cxo');
    window.dispatchEvent(new CustomEvent('switch-report-tab', { detail: 'cxo' }));
    setIsOpen(false);
  };

  const handlePrint = () => {
    setIsOpen(false);
    window.print();
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[var(--color-primary-hex)] text-white hover:opacity-95 shadow-xs border-transparent';
      case 'secondary':
        return 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface-offset)] border-[var(--color-divider)]';
      case 'ghost':
        return 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border-transparent';
      case 'outline':
      default:
        return 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 shadow-2xs';
    }
  };

  const VIEW_TITLES: Record<string, string> = {
    tasks: 'Tasks',
    deliveries: 'Deliveries',
    defects: 'Defects',
    features: 'Features',
    scaffolder: 'Project Scaffolder',
    risks: 'RAID',
    team: 'Team',
    capacity: 'Capacity',
    log: 'Audit Log',
    releases: 'Releases',
    registry: 'Option Libraries',
    dropdowns: 'Option Libraries',
    templates: 'Step Blueprints',
    steps: 'Step Blueprints',
    fields: 'Field Architect',
    reports: 'Reports',
    dash: 'Intelligence',
    overview: 'Overview',
    timeline: 'Timeline',
    settings: 'Workspace Settings',
  };

  const viewTitle = VIEW_TITLES[activeView] || (activeView.charAt(0).toUpperCase() + activeView.slice(1));

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-[60]' : ''} ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Share and export data"
        className={`h-9 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 touch-hit-expand ${getButtonStyles()}`}
        title="Share, distribute, or export view data"
      >
        <Share2 size={14} className="shrink-0 text-[var(--color-primary-hex)]" />
        {!compact && <span className="hidden sm:inline">{buttonLabel}</span>}
        <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="fixed right-3 left-3 top-[62px] sm:top-full sm:left-auto sm:right-0 sm:absolute sm:w-84 sm:mt-1.5 max-h-[calc(100dvh-120px)] overflow-y-auto custom-scroll rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xl z-[60] divide-y divide-[var(--color-divider)] animate-in fade-in zoom-in-95 duration-100 overscroll-contain"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header Info */}
          <div className="p-3 bg-[var(--color-surface-2)]/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-faint)]">
                Export & Distribution
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]">
                {viewTitle}: {itemCount} records
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] font-medium mt-1 truncate">
              {state.name || 'ProjectPulse Workspace'}
            </p>
          </div>

          {/* Section 1: Share & Distribute */}
          <div className="p-1.5 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
              Share & Distribute
            </div>

            {/* CXO Executive Brief */}
            <button
              onClick={handleOpenCxoModal}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <Mail size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Steering Email Brief (CXO)
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Executive status brief & health metrics
                </div>
              </div>
            </button>

            {/* Copy Markdown Summary */}
            <button
              onClick={handleCopySummary}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Copy View Summary</span>
                  {copied && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      Copied!
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Markdown & TSV table to clipboard
                </div>
              </div>
            </button>

            {/* Share as Interactive HTML */}
            <button
              onClick={handleExportHTML}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Globe size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)]">
                  Standalone Interactive HTML
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Self-contained styled HTML report file
                </div>
              </div>
            </button>

            {/* Print / Save PDF */}
            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                <Printer size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)]">
                  Print / Save as PDF
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Printer-friendly executive layout
                </div>
              </div>
            </button>

            {/* Draft Email */}
            <button
              onClick={handleShareEmail}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Mail size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)]">
                  Share via Email Draft
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Open default mail client with summary
                </div>
              </div>
            </button>
          </div>

          {/* Section 2: Data & Workbook Exports */}
          <div className="p-1.5 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
              Data & Workbooks
            </div>

            {/* View to Excel */}
            <button
              onClick={handleExportViewExcel}
              disabled={exporting === 'view-excel'}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left disabled:opacity-50"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Export {viewTitle} (.xlsx)</span>
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                    Current View
                  </span>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Styled sheet with {itemCount} records
                </div>
              </div>
            </button>

            {/* Feature Matrix Deep Dive (when on features view) */}
            {activeView === 'features' && (
              <button
                onClick={handleExportFeatureMatrix}
                disabled={exporting === 'feature-matrix'}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left disabled:opacity-50"
                role="menuitem"
              >
                <div className="w-6 h-6 rounded-md bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Layers size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                    <span>Export Feature Matrix (.xlsx)</span>
                    <span className="text-[9px] font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-1 py-0.2 rounded">
                      5 Sheets
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                    Architecture, screens, components & schema pack
                  </div>
                </div>
              </button>
            )}

            {/* Delivery Import Template (when on deliveries view) */}
            {activeView === 'deliveries' && (
              <button
                onClick={handleDownloadDeliveryTemplate}
                disabled={exporting === 'delivery-template'}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left disabled:opacity-50"
                role="menuitem"
              >
                <div className="w-6 h-6 rounded-md bg-sky-600/10 text-sky-600 flex items-center justify-center shrink-0">
                  <Download size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                    <span>Download Delivery Template (.xlsx)</span>
                    <span className="text-[9px] font-bold text-sky-700 dark:text-sky-400 bg-sky-500/10 px-1 py-0.2 rounded">
                      Template
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                    12-column standardized ALM import template
                  </div>
                </div>
              </button>
            )}

            {/* Master Excel */}
            <button
              onClick={handleExportMasterExcel}
              disabled={exporting === 'master-excel'}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left disabled:opacity-50"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-teal-600/10 text-teal-600 flex items-center justify-center shrink-0">
                <Layers size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Export Master Excel (.xlsx)</span>
                  <span className="text-[9px] font-bold text-teal-700 dark:text-teal-400 bg-teal-500/10 px-1 py-0.2 rounded">
                    15 Sheets
                  </span>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Complete multi-sheet enterprise workbook
                </div>
              </div>
            </button>

            {/* View CSV */}
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-amber-600/10 text-amber-600 flex items-center justify-center shrink-0">
                <FileText size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)]">
                  Export {viewTitle} CSV (.csv)
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  RFC 4180 standard comma-separated file
                </div>
              </div>
            </button>

            {/* View JSON */}
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
                <Code size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)]">
                  Export {viewTitle} JSON (.json)
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Raw structured records with metadata
                </div>
              </div>
            </button>

            {/* Full Project JSON Backup */}
            <button
              onClick={handleExportFullProjectJSON}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer group text-left"
              role="menuitem"
            >
              <div className="w-6 h-6 rounded-md bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Code size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                  <span>Export Full Project JSON (.json)</span>
                  <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded">
                    Backup
                  </span>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Full workspace snapshot with all entities
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareExportMenu;
