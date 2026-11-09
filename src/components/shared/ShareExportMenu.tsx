import React, { useState, useRef, useEffect } from 'react';
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
  exportViewToHTML, 
  copyViewSummaryToClipboard, 
  shareViewViaEmail,
  getViewItemCount 
} from '../../services/exportService';
import { exportProjectExcel } from '../../services/excelService';

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
  const { state } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeView = viewId || state.view;
  const itemCount = getViewItemCount(state, activeView);

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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

  const handleShareEmail = () => {
    shareViewViaEmail(state, activeView);
    setIsOpen(false);
  };

  const handleOpenCxoModal = () => {
    window.dispatchEvent(new CustomEvent('open-cxo-email'));
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

  const viewTitle = activeView.charAt(0).toUpperCase() + activeView.slice(1);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Share and export data"
        className={`h-9 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${getButtonStyles()}`}
        title="Share, distribute, or export view data"
      >
        <Share2 size={14} className="shrink-0 text-[var(--color-primary-hex)]" />
        {!compact && <span className="hidden sm:inline">{buttonLabel}</span>}
        <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-72 sm:w-80 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--color-divider)] animate-in fade-in zoom-in-95 duration-100"
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
                    Full
                  </span>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] truncate">
                  Complete 10-sheet enterprise workbook
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareExportMenu;
