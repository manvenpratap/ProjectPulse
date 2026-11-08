import React, { useState, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { importProjectExcel } from '../../services/excelService';
import Button from '../shared/Button';
import { Zap, UploadCloud, FileSpreadsheet, ArrowRight, Loader2, Sparkles } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg)] p-6 overflow-y-auto">
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
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Zap size={22} strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">ProjectPulse</span>
        </motion.div>

        <motion.h1 variants={itemVariants} className="font-display text-4xl font-bold tracking-tight mb-3">
          Track. Log. Report.<br />
          <span className="text-[var(--color-text-muted)]">Unified engineering delivery.</span>
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-[var(--color-text-muted)] text-sm mb-8 leading-relaxed max-w-md mx-auto">
          Production-grade project management workspace with zero hardcoded sample data. Start blank or import your Excel database.
        </motion.p>

        {/* Create Fresh Project Card */}
        <motion.div variants={itemVariants} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px] p-8 text-left shadow-xl mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Create New Project
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Clean Blank State
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Project name</label>
              <input 
                className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm"
                placeholder="e.g. Platform Modernization Q3"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Description</label>
              <textarea 
                className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm resize-none"
                placeholder="Brief project mission statement..."
                rows={2}
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-muted)]">Initial Team members (comma-separated)</label>
              <input 
                className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm"
                placeholder="Alex Rivera, Sarah Chen, Marcus Wong"
                value={team}
                onChange={e => setTeam(e.target.value)}
              />
            </div>
          </div>

          <Button 
            variant="primary" 
            size="lg" 
            className="w-full mt-6 h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            <span>Create Blank Project & Enter Hub</span>
            <ArrowRight size={16} />
          </Button>
        </motion.div>

        {/* Excel Import & Demo Database Options */}
        <motion.div variants={itemVariants} className="bg-[var(--color-surface)]/60 backdrop-blur-md border border-[var(--color-border)] rounded-[20px] p-6 text-left shadow-md">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[var(--color-text)]">
            <FileSpreadsheet size={16} className="text-indigo-500" />
            <span>Excel Database Portability & Testing</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)] mb-4 leading-relaxed">
            Need to test and showcase all features? Import an existing workbook or load the enterprise demo Excel database with 24 tasks, 12 deliveries, 10 team members, RAID, and defect workshops.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="h-10 px-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold text-[var(--color-text)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin text-indigo-500" /> : <UploadCloud size={14} className="text-indigo-500" />}
              <span>Upload .xlsx File</span>
            </button>

            <button
              onClick={handleLoadDemo}
              disabled={isImporting}
              className="h-10 px-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Load Demo Database</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SetupView;
