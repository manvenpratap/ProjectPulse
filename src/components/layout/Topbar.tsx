import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { getHealthScore } from '../../utils/projectUtils';
import Button from '../shared/Button';
import HelpModal from '../shared/HelpModal';
import { 
  Bell, 
  Palette, 
  Search, 
  Plus, 
  Command,
  HelpCircle,
  FolderOpen,
  ChevronDown,
  RefreshCw,
  Database,
  FileSpreadsheet,
  Download,
  Settings,
  Layout,
  ListChecks,
  BookOpen,
  Blocks,
  Component as ComponentIcon,
  Menu,
  Flag,
  Smile
} from 'lucide-react';
import clsx from 'clsx';
import ThemeFlyout from './ThemeFlyout';
import NotificationFlyout from './NotificationFlyout';

import { exportProjectExcel, importProjectExcel } from '../../services/excelService';

interface TopbarProps {
  toggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
  const { state, setView, setTheme, resetProject, searchTerm, setSearchTerm, updateProject } = useProject();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importProjectExcel(file);
      updateProject(importedData);
      alert('Project data imported successfully from Excel.');
    } catch (err: any) {
      alert('Failed to import Excel: ' + err.message);
    }
    // Reset file input so same file can be imported again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut: G then /
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
         e.preventDefault();
         searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const health = getHealthScore(state.tasks);
  const overdueCount = state.tasks.filter(t => {
     const dd = new Date(t.dueDate);
     return dd < new Date() && t.status !== 'Completed';
  }).length;

  const handleExport = async () => {
    await exportProjectExcel(state);
    setIsActionsOpen(false);
  };

  const getHealthColor = (score: number) => {
    if (score > 80) return "text-emerald-500";
    if (score > 50) return "text-amber-500";
    return "text-red-500";
  };

  const getHealthLabel = (score: number) => {
    if (score > 80) return "On Track";
    if (score > 50) return "At Risk";
    return "Critical";
  };

  return (
    <>
      <header className="h-[calc(54px+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-[var(--color-surface)]/85 backdrop-blur-xl saturate-180 border-b border-[var(--color-divider)] flex items-center px-4 gap-3 md:gap-4 shrink-0 z-20 shadow-2xs sticky top-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button 
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--color-surface-2)] rounded-xl text-[var(--color-text-muted)] transition-colors active:scale-95 cursor-pointer"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs md:text-sm text-[var(--color-text)] tracking-tight truncate max-w-[120px] md:max-w-[200px]" title={state.name}>
              {state.name}
            </span>
          </div>
          
          <div className="w-[1px] h-4 bg-[var(--color-divider)]" />
          
          <div className="relative hidden sm:block">
            <button 
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors text-xs font-semibold text-[var(--color-text-muted)] cursor-pointer active:scale-97"
            >
              <FolderOpen size={14} />
              <span>Project Actions</span>
              <ChevronDown size={12} className={clsx("transition-transform duration-200", isActionsOpen && "rotate-180")} />
            </button>

            {isActionsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsActionsOpen(false)} 
                />
                <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-surface)]/95 backdrop-blur-2xl border border-[var(--color-divider)] rounded-2xl shadow-xl z-20 py-2 overflow-hidden ring-1 ring-black/5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 duration-150 origin-top-left">
                  <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-faint)]">
                    Data & Persistence
                  </div>
                  <button 
                    onClick={handleExport}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-500" />
                    <span>Export Project Excel…</span>
                  </button>
                  <button 
                    onClick={handleImportClick}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <FileSpreadsheet size={16} className="text-indigo-500" />
                    <span>Import from Excel…</span>
                  </button>
                  <a 
                    href="/demo-data.xlsx"
                    download
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98] no-underline text-[var(--color-text)]"
                    onClick={() => setIsActionsOpen(false)}
                  >
                    <Download size={16} className="text-slate-500" />
                    <span>Download Demo Excel</span>
                  </a>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx"
                    onChange={handleFileChange}
                  />
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('log'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Database size={16} className="text-blue-500" />
                    <span>View Activity Logs</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); resetProject(state.name, 'A fresh restart of the current workspace.', []); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <RefreshCw size={16} />
                    <span>New Project (Wipe All)</span>
                  </button>

                  <div className="h-[1px] bg-[var(--color-divider)] my-2" />
                  
                  <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-faint)]">
                    Workspace Config
                  </div>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('fields'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Layout size={16} className="text-indigo-500" />
                    <span>Field Architect…</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('dropdowns'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <ListChecks size={16} className="text-amber-500" />
                    <span>Option Libraries…</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('steps'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <BookOpen size={16} className="text-purple-500" />
                    <span>Step Templates…</span>
                  </button>

                  <div className="h-[1px] bg-[var(--color-divider)] my-2" />
                  
                  <div className="px-3 py-2 text-xs font-semibold text-[var(--color-text-faint)]">
                    Project Architecture
                  </div>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('releases'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Flag size={16} className="text-indigo-500" />
                    <span>Release Roadmap…</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('retro'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Smile size={16} className="text-emerald-500" />
                    <span>Sprint Retrospective…</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('scaffolder'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Blocks size={16} className="text-rose-500" />
                    <span>Project Scaffolder…</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('features'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors duration-150 active:scale-[0.98]"
                  >
                    <ComponentIcon size={16} className="text-cyan-500" />
                    <span>Strategic Features…</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] shadow-2xs backdrop-blur-sm">
          <div className={clsx("w-2 h-2 rounded-full motion-safe:animate-pulse bg-current", getHealthColor(health))} />
          <span className={clsx("text-xs font-semibold tracking-tight", getHealthColor(health))}>
            {getHealthLabel(health)} {health}%
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="relative group hidden lg:block">
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--color-text-faint)] pointer-events-none border border-[var(--color-divider)] px-1.5 py-0.5 rounded-md bg-[var(--color-surface)]/80 shadow-2xs">
              /
            </kbd>
            <input 
              ref={searchInputRef}
              className="w-[200px] lg:w-[260px] xl:w-[300px] h-9 pl-9 pr-8 bg-[var(--color-surface-2)]/80 border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)]/40 focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-primary-hex)]/15 transition-all duration-150"
              placeholder="Search tasks, defects, RAID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
          </div>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              title="Smart Alerts"
              aria-label="Smart Alerts and Notifications" 
              className={clsx("rounded-xl min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] relative", isNotifOpen && "bg-[var(--color-surface-2)]")}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <Bell size={18} />
              {overdueCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--color-surface)]" />
              )}
            </Button>
            <NotificationFlyout isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            title="Appearance Settings"
            aria-label="Appearance and Theme Settings" 
            className="rounded-xl min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px]"
            onClick={() => setIsThemeOpen(true)}
          >
            <Palette size={18} />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            title="Help & Guide"
            aria-label="Help and Guide" 
            className="rounded-xl min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] hidden sm:flex"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle size={18} />
          </Button>

          <div className="w-[1px] h-5 bg-[var(--color-divider)] mx-0.5 md:mx-1 hidden sm:block" />

          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setView('tasks')}
            className="h-9 rounded-xl shadow-sm px-3 md:px-4 text-xs font-semibold"
          >
            <Plus size={16} className="md:mr-1.5" /> <span className="hidden md:inline">New Task</span>
          </Button>
        </div>
      </header>

      <ThemeFlyout isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default Topbar;
