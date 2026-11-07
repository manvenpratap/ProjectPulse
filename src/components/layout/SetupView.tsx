import React, { useState } from 'react';
import { useProject } from '../../store/ProjectContext';
import Button from '../shared/Button';
import { Zap, Activity, FolderOpen, Database, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const SetupView: React.FC = () => {
  const { resetProject, loadSample } = useProject();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [team, setTeam] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const teamArr = team.split(',').map(s => s.trim()).filter(Boolean);
    resetProject(name, desc, teamArr);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg)] p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[500px] w-full text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[var(--color-primary-hex)] rounded-xl flex items-center justify-center text-white">
            <Zap size={22} strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">ProjectPulse</span>
        </div>

        <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
          Track. Log. Report.<br />
          <span className="text-[var(--color-text-muted)]">All in one place.</span>
        </h1>
        
        <p className="text-[var(--color-text-muted)] text-sm mb-10 leading-relaxed">
          Premium project management for high-density engineering tracking.
        </p>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[24px] p-8 text-left shadow-xl mb-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-6">
            Create New Project
          </h2>
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Project Name</label>
              <input 
                className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm"
                placeholder="e.g. Platform Modernization Q3"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Description</label>
              <textarea 
                className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm resize-none"
                placeholder="Brief project summary..."
                rows={2}
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Team Members (comma-separated)</label>
              <input 
                className="w-full px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg outline-none focus:border-[var(--color-primary-hex)] transition-colors text-sm"
                placeholder="Alex, Sarah, Marcus, Elena"
                value={team}
                onChange={e => setTeam(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full h-12 rounded-xl text-[14px] flex items-center justify-center gap-2"
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          <span>Create Project & Enter Hub</span>
          <ArrowRight size={16} />
        </Button>

        <div className="mt-8 pt-8 border-t border-[var(--color-divider)] flex flex-wrap justify-center gap-4">
          <Button variant="ghost" size="sm" className="text-[11px] opacity-70" onClick={() => loadSample('web')}>
            <FolderOpen size={14} className="mr-1" /> Load Sample: Web
          </Button>
          <Button variant="ghost" size="sm" className="text-[11px] opacity-70" onClick={() => loadSample('mobile')}>
             Load Sample: Mobile
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupView;
