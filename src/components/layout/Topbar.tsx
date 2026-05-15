import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import { getHealthScore } from '../../utils/projectUtils';
import Button from '../shared/Button';
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
  Settings,
  Layout,
  ListChecks,
  BookOpen,
  Blocks,
  Component as ComponentIcon
} from 'lucide-react';
import clsx from 'clsx';
import ThemeFlyout from './ThemeFlyout';

import { exportProjectExcel } from '../../services/excelService';

interface TopbarProps {
  toggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
  const { state, setView, setTheme, resetProject } = useProject();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  
  const health = getHealthScore(state.tasks);

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
      <header className="h-[52px] bg-[var(--color-surface)] border-b border-[var(--color-divider)] flex items-center px-4 gap-4 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-[var(--color-text)] truncate max-w-[200px]" title={state.name}>
              {state.name}
            </span>
          </div>
          
          <div className="w-[1px] h-5 bg-[var(--color-divider)]" />
          
          <div className="relative">
            <button 
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors text-xs font-semibold text-[var(--color-text-muted)]"
            >
              <FolderOpen size={14} />
              Project Actions
              <ChevronDown size={12} className={clsx("transition-transform", isActionsOpen && "rotate-180")} />
            </button>

            {isActionsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsActionsOpen(false)} 
                />
                <div className="absolute top-full left-0 mt-1 w-64 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-2xl z-20 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
                    Data & Persistence
                  </div>
                  <button 
                    onClick={handleExport}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-500" />
                    <span>Export Project Excel...</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('log'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors"
                  >
                    <Database size={16} className="text-blue-500" />
                    <span>View Activity Logs</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); resetProject(); }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm transition-colors"
                  >
                    <RefreshCw size={16} />
                    <span>New Project (Wipe All)</span>
                  </button>

                  <div className="h-[1px] bg-[var(--color-divider)] my-2" />
                  
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
                    Workspace Config
                  </div>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('fields'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors"
                  >
                    <Layout size={16} className="text-indigo-500" />
                    <span>Field Architect...</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('dropdowns'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors"
                  >
                    <ListChecks size={16} className="text-amber-500" />
                    <span>Option Libraries...</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('steps'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors"
                  >
                    <BookOpen size={16} className="text-purple-500" />
                    <span>Step Templates...</span>
                  </button>

                  <div className="h-[1px] bg-[var(--color-divider)] my-2" />
                  
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-faint)]">
                    Project Architecture
                  </div>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('scaffolder'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors"
                  >
                    <Blocks size={16} className="text-rose-500" />
                    <span>Project Scaffolder...</span>
                  </button>
                  <button 
                    onClick={() => { setIsActionsOpen(false); setView('features'); }}
                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-primary-highlight-hex)] flex items-center gap-3 text-sm transition-colors"
                  >
                    <ComponentIcon size={16} className="text-cyan-500" />
                    <span>Strategic Features...</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
          <div className={clsx("w-2 h-2 rounded-full animate-pulse bg-current", getHealthColor(health))} />
          <span className={clsx("text-[10px] font-bold uppercase tracking-wider", getHealthColor(health))}>
            {getHealthLabel(health)} {health}%
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <div className="relative group hidden md:block">
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--color-text-faint)] pointer-events-none border border-[var(--color-divider)] px-1 rounded bg-[var(--color-surface)]">
              G /
            </kbd>
            <input 
              className="w-[200px] lg:w-[320px] h-9 pl-9 pr-4 bg-[var(--color-surface-2)] border border-transparent rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)] focus:bg-[var(--color-surface)] transition-all"
              placeholder="Search projects, tasks, IDs..."
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
          </div>

          <Button variant="ghost" size="icon" title="Smart Alerts" className="rounded-xl">
            <Bell size={18} />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            title="Appearance Settings" 
            className="rounded-xl"
            onClick={() => setIsThemeOpen(true)}
          >
            <Palette size={18} />
          </Button>

          <Button variant="ghost" size="icon" title="Help & Guide" className="rounded-xl">
            <HelpCircle size={18} />
          </Button>

          <div className="w-[1px] h-5 bg-[var(--color-divider)] mx-1" />

          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setView('tasks')}
            className="h-9 rounded-xl shadow-sm px-4"
          >
            <Plus size={16} className="mr-1.5" /> <span>New Task</span>
          </Button>
        </div>
      </header>

      <ThemeFlyout isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
    </>
  );
};

export default Topbar;
