import React, { useState, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { importProjectExcel } from '../../services/excelService';
import Button from '../shared/Button';
import { Activity, UploadCloud, FileSpreadsheet, ArrowRight, Loader2, Database } from 'lucide-react';
import { motion } from 'motion/react';

const SetupView: React.FC = () => {
  const { resetProject, updateProject, loadSample } = useProject();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [team, setTeam] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg)] p-6 overflow-y-auto select-none">
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
        className="max-w-[540px] w-full text-center"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-hex)] flex items-center justify-center text-white shadow-xs">
            <Activity size={22} strokeWidth={2.4} />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">ProjectPulse</span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2.5">
          Engineering Delivery Cockpit<br />
          <span className="text-[var(--color-text-muted)] text-xl sm:text-2xl font-medium">Multi-Tier Backlog, ALM Packaging & Capacity</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-[var(--color-text-muted)] text-xs sm:text-sm mb-7 leading-relaxed max-w-md mx-auto">
          Local-first engineering workstation with zero hardcoded sample data. Create a blank project or import an enterprise Excel database.
        </motion.p>

        {/* Create Fresh Project Card */}
        <motion.div variants={itemVariants} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 text-left shadow-xs mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Create New Project
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Clean Blank State
            </span>
          </div>
          
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Project name</label>
              <input 
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm"
                placeholder="e.g. Platform Modernization Q3"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Mission statement & scope</label>
              <textarea 
                className="w-full px-3.5 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm resize-none"
                placeholder="Brief project mission statement..."
                rows={2}
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Initial Team members (comma-separated)</label>
              <input 
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
          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[var(--color-text)]">
            <FileSpreadsheet size={15} className="text-indigo-500" />
            <span>Excel Database Portability & Testing</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mb-3.5 leading-relaxed">
            Need to evaluate all modules? Import your custom workbook or load the enterprise demo Excel database (24 tasks, 12 deliveries, 10 team members, RAID items, and defect registers).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="h-9 px-3.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-semibold text-[var(--color-text)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={13} className="animate-spin text-indigo-500" /> : <UploadCloud size={13} className="text-indigo-500" />}
              <span>Upload .xlsx File</span>
            </button>

            <button
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
  );
};

export default SetupView;
