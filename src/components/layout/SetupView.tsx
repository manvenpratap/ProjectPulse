import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { useAuth } from '../../store/AuthContext';
import { importProjectExcel } from '../../services/excelService';
import Button from '../shared/Button';
import HelpModal from '../shared/HelpModal';
import SectionHelpButton from '../shared/SectionHelpButton';
import ThemeFlyout from './ThemeFlyout';
import UserProfileFlyout from './UserProfileFlyout';
import AccessManagerModal from '../auth/AccessManagerModal';
import {
  Activity,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  Database,
  Download,
  Palette,
  HelpCircle
} from 'lucide-react';
import { motion, type Variants } from 'motion/react';

const SetupView: React.FC = () => {
  const { resetProject, updateProject, loadSample } = useProject();
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [team, setTeam] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccessManagerOpen, setIsAccessManagerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpenHelp = () => setIsHelpOpen(true);
    window.addEventListener('open-view-help', handleOpenHelp);
    return () => window.removeEventListener('open-view-help', handleOpenHelp);
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    const teamArr = team.split(',').map(s => s.trim()).filter(Boolean);
    resetProject(name, desc, teamArr);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const data = await importProjectExcel(file);
      updateProject(data);
    } catch (err: any) {
      alert('Failed to import Excel database: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemo = async () => {
    try {
      setIsImporting(true);
      await loadSample('web');
    } catch (err: any) {
      alert('Failed to load demo database: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.04
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1] as const
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] select-none">
      {/* Lightweight Onboarding Utility Header */}
      <header className="h-14 px-4 sm:px-6 border-b border-[var(--color-divider)] bg-[var(--color-surface)]/80 backdrop-blur-xl flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-hex)] flex items-center justify-center text-white shadow-2xs">
            <Activity size={17} strokeWidth={2.4} aria-hidden="true" />
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-tight text-[var(--color-text)] block leading-tight">
              ProjectPulse
            </span>
            <span className="text-[10px] font-mono text-[var(--color-text-faint)] block">
              Workspace Setup
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            title="Appearance Settings"
            aria-label="Appearance and Theme Settings"
            className="rounded-xl min-h-[36px] min-w-[36px]"
            onClick={() => setIsThemeOpen(true)}
          >
            <Palette size={17} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Help & Screen Guide (F1 or ?)"
            aria-label="Help and Screen Guide"
            className="rounded-xl min-h-[36px] min-w-[36px]"
            onClick={() => setIsHelpOpen(true)}
          >
            <HelpCircle size={17} />
          </Button>

          {currentUser && (
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-[var(--color-surface-2)] border border-[var(--color-divider)] transition-colors cursor-pointer"
                title={`${currentUser.name} (${currentUser.role}) — Switch persona or sign out`}
                aria-label="User Account and Access Controls"
              >
                <div className="w-6 h-6 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-bold text-[11px] flex items-center justify-center">
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-[var(--color-text)]">
                  {currentUser.name.split(' ')[0]} · <span className="text-[var(--color-text-muted)] font-normal">{currentUser.role}</span>
                </span>
              </button>

              <UserProfileFlyout
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onOpenAccessManager={() => setIsAccessManagerOpen(true)}
              />
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".xlsx"
          className="hidden"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[560px] w-full text-center"
        >
          <motion.h1 variants={itemVariants} className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            ProjectPulse 2.0
          </motion.h1>

          {/* Create Fresh Project Card */}
          <motion.div variants={itemVariants} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 text-left shadow-xs mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Create New Project
                </h2>
                <SectionHelpButton view="setup" section="Clean Blank Workspace" size={13} />
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="setup-project-name" className="text-xs font-semibold text-[var(--color-text-muted)]">Project name</label>
                <input
                  id="setup-project-name"
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm"
                  placeholder="e.g. Platform Modernization Q3"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="setup-project-desc" className="text-xs font-semibold text-[var(--color-text-muted)]">Mission statement & scope</label>
                <textarea
                  id="setup-project-desc"
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm resize-none"
                  placeholder="Brief project mission statement..."
                  rows={2}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="setup-project-team" className="text-xs font-semibold text-[var(--color-text-muted)]">Initial Team members (comma-separated)</label>
                <input
                  id="setup-project-team"
                  className="w-full px-3.5 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm"
                  placeholder="Alex Rivera, Sarah Chen, Marcus Wong"
                  value={team}
                  onChange={e => setTeam(e.target.value)}
                />
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-5 h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs bg-[var(--color-primary-hex)] text-[var(--color-primary-text)]"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              <span>Create Blank Project & Enter Hub</span>
              <ArrowRight size={15} />
            </Button>
          </motion.div>

          {/* Excel Import & Demo Database Options */}
          <motion.div variants={itemVariants} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-left shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                <FileSpreadsheet size={15} className="text-indigo-500" />
                <span>Excel Database Portability & Demo</span>
                <SectionHelpButton view="setup" section="Excel Database Portability" size={13} />
              </div>
              <a
                href="/demo-data.xlsx"
                download
                className="text-[11px] font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1"
              >
                <Download size={11} /> Template .xlsx
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="h-9 px-3.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-semibold text-[var(--color-text)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isImporting ? <Loader2 size={13} className="animate-spin text-indigo-500" /> : <UploadCloud size={13} className="text-indigo-500" />}
                <span>Upload .xlsx File</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemo}
                disabled={isImporting}
                className="h-9 px-3.5 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isImporting ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
                <span>Load Demo Database</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <ThemeFlyout isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} targetView="setup" />
      <AccessManagerModal isOpen={isAccessManagerOpen} onClose={() => setIsAccessManagerOpen(false)} />
    </div>
  );
};

export default SetupView;
