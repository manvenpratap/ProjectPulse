import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Code, 
  Globe, 
  Copy, 
  ChevronDown, 
  Check 
} from 'lucide-react';
import { useProject } from '../../store/ProjectContext';
import { 
  exportViewToExcel, 
  exportViewToCSV, 
  exportViewToJSON, 
  exportViewToHTML, 
  copyViewSummaryToClipboard 
} from '../../services/exportService';

interface ViewExportButtonProps {
  viewId: string;
  label?: string;
  className?: string;
}

export const ViewExportButton: React.FC<ViewExportButtonProps> = ({
  viewId,
  label = 'Export',
  className = '',
}) => {
  const { state } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  const handleQuickExcel = async () => {
    try {
      setIsExporting(true);
      await exportViewToExcel(state, viewId);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSV = () => {
    exportViewToCSV(state, viewId);
    setIsOpen(false);
  };

  const handleJSON = () => {
    exportViewToJSON(state, viewId);
    setIsOpen(false);
  };

  const handleHTML = () => {
    exportViewToHTML(state, viewId);
    setIsOpen(false);
  };

  const handleCopy = async () => {
    const ok = await copyViewSummaryToClipboard(state, viewId);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-center rounded-xl shadow-2xs ${isOpen ? 'z-50' : ''} ${className}`} ref={dropdownRef}>
      {/* Primary Action Button (Direct View Excel Export) */}
      <button
        type="button"
        onClick={handleQuickExcel}
        disabled={isExporting}
        title={`Export ${label} to Excel (.xlsx)`}
        className="h-9 px-2.5 sm:px-3 text-xs font-semibold rounded-l-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-divider)] border-r-0 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
      >
        <Download size={13} className="text-[var(--color-primary-hex)] shrink-0" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      {/* Dropdown Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`More export options for ${label}`}
        title="More formats (CSV, JSON, HTML, Copy)"
        className="h-9 px-1.5 text-xs font-semibold rounded-r-xl bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-divider)] flex items-center justify-center transition-colors cursor-pointer active:scale-95"
      >
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-lg z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <button
            onClick={async () => {
              await handleQuickExcel();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer text-left"
            role="menuitem"
          >
            <FileSpreadsheet size={13} className="text-emerald-500 shrink-0" />
            <span>Excel Sheet (.xlsx)</span>
          </button>

          <button
            onClick={handleCSV}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer text-left"
            role="menuitem"
          >
            <FileText size={13} className="text-amber-500 shrink-0" />
            <span>CSV File (.csv)</span>
          </button>

          <button
            onClick={handleJSON}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer text-left"
            role="menuitem"
          >
            <Code size={13} className="text-purple-500 shrink-0" />
            <span>JSON Document (.json)</span>
          </button>

          <button
            onClick={handleHTML}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer text-left"
            role="menuitem"
          >
            <Globe size={13} className="text-blue-500 shrink-0" />
            <span>Interactive HTML (.html)</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors cursor-pointer text-left"
            role="menuitem"
          >
            {copied ? <Check size={13} className="text-emerald-500 shrink-0" /> : <Copy size={13} className="text-[var(--color-text-muted)] shrink-0" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary Table'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewExportButton;
