import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProject } from '../../store/ProjectContext';
import { TaskStatus, TaskPriority, Feature } from '../../types';
import { todayStr, getTeamNames } from '../../utils/projectUtils';
import { 
  Blocks, 
  Plus, 
  Trash2, 
  Copy, 
  CopyPlus, 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  Layers, 
  Monitor, 
  Database, 
  Upload, 
  X, 
  Check, 
  Search, 
  PanelRight, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  AlertCircle,
  ExternalLink,
  Sliders,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import PageHeader from '../shared/PageHeader';
import SectionHelpButton from '../shared/SectionHelpButton';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import { MotionPage } from '../shared/MotionPage';
import { toast } from '../../utils/toast';
import clsx from 'clsx';

export interface ScaffoldModule {
  id: string;
  name: string;
  type: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  release: string;
  screens: string;
}

type ScaffolderStep = 'blueprint' | 'alignment';

const LAYER_CONFIG: Record<string, { label: string; badge: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  Server: { label: 'Server Layer', badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Database },
  GUI: { label: 'GUI Interface', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Monitor },
  Interface: { label: 'API / Bridge', badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Layers },
  Infrastructure: { label: 'Infrastructure', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Blocks }
};

const PRESET_BLUEPRINTS = [
  {
    name: 'Cloud Modernization Suite',
    description: 'Microservices architecture with serverless events and auth gateway',
    data: `Auth Gateway, Server, Sarah Jenkins, High, In Progress, v1.0.0, OAuth Token Flow|Session Validation\nOrder Pipeline, Server, Alex Rivera, High, Planned, v1.0.0, Checkout Pipeline|Payment Webhook\nCustomer Portal, GUI, Elena Rostova, Medium, In Progress, v1.1.0, Customer Dashboard|Account Settings|Billing Ledger\nObservability Mesh, Infrastructure, Marcus Vance, Low, Not Started, v1.2.0, Trace Exporter|Log Shipper`
  },
  {
    name: 'Mobile Banking & FinTech',
    description: 'Core banking ledger, biometrics, KYC, and card controls',
    data: `Core Banking Ledger, Server, Sarah Jenkins, High, In Progress, v1.0.0, Double-entry Engine|Reconciliation Worker\nBiometric Auth, GUI, Elena Rostova, High, Planned, v1.0.0, FaceID Prompt|PIN Fallback|Device Trust Register\nPayment Rail, Server, Alex Rivera, High, Planned, v1.1.0, Wire Transfer Engine|Instant ACH Adapter\nCard Management, GUI, Elena Rostova, Medium, Not Started, v1.1.0, Virtual Cards|Spending Limits|Freeze Card`
  },
  {
    name: 'Enterprise Analytics & AI',
    description: 'Event streams, inference endpoints, and executive dashboards',
    data: `Telemetry Ingestion, Server, Sarah Jenkins, High, In Progress, v1.0.0, Event Stream Consumer|Schema Validator\nModel Serving Cluster, Server, Marcus Vance, High, Planned, v1.0.0, Inference Endpoint|Batch Scorer\nExecutive Dashboard, GUI, Elena Rostova, Medium, In Progress, v1.1.0, KPI Executive Overview|Cohort Retention Matrix\nAlert Dispatcher, Server, Alex Rivera, Medium, Not Started, v1.2.0, PagerDuty Webhook|Slack Bot Channel`
  }
];

const createInitialModule = (name = '', type = 'Server'): ScaffoldModule => ({
  id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name,
  type,
  assignee: '',
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.NOT_STARTED,
  release: 'v1.0.0',
  screens: ''
});

export const ScaffolderView: React.FC = () => {
  const { state, setView, createTask, updateProject, addLog } = useProject();
  const [step, setStep] = useState<ScaffolderStep>('blueprint');
  const [modules, setModules] = useState<ScaffoldModule[]>([
    createInitialModule('Identity Gateway', 'Server')
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [layerFilter, setLayerFilter] = useState<string>('all');
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
  const [drawerModuleId, setDrawerModuleId] = useState<string | null>(null);

  // Bulk modal state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search & 'Escape' to deselect / close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (selectedModuleIds.size > 0) {
          setSelectedModuleIds(new Set());
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModuleIds]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch = !searchQuery.trim() || 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.release.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLayer = layerFilter === 'all' || m.type === layerFilter;
      return matchesSearch && matchesLayer;
    });
  }, [modules, searchQuery, layerFilter]);

  // Layer counts
  const layerCounts = useMemo(() => {
    const counts = { all: modules.length, Server: 0, GUI: 0, Interface: 0, Infrastructure: 0 };
    modules.forEach(m => {
      if (m.type in counts) {
        counts[m.type as keyof typeof counts]++;
      }
    });
    return counts;
  }, [modules]);

  // Drawer module lookup
  const drawerModule = useMemo(() => {
    return modules.find(m => m.id === drawerModuleId) || null;
  }, [modules, drawerModuleId]);

  const drawerIndex = useMemo(() => {
    if (!drawerModuleId) return -1;
    return filteredModules.findIndex(m => m.id === drawerModuleId);
  }, [filteredModules, drawerModuleId]);

  const handleNextDrawerModule = () => {
    if (drawerIndex >= 0 && drawerIndex < filteredModules.length - 1) {
      setDrawerModuleId(filteredModules[drawerIndex + 1].id);
    }
  };

  const handlePreviousDrawerModule = () => {
    if (drawerIndex > 0) {
      setDrawerModuleId(filteredModules[drawerIndex - 1].id);
    }
  };

  // CRUD handlers
  const addRow = () => {
    const newMod = createInitialModule();
    setModules(prev => [...prev, newMod]);
    setDrawerModuleId(newMod.id);
  };

  const updateModule = (id: string, field: keyof ScaffoldModule, val: any) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const removeRow = (id: string) => {
    setModules(prev => prev.filter(m => m.id !== id));
    if (selectedModuleIds.has(id)) {
      const next = new Set(selectedModuleIds);
      next.delete(id);
      setSelectedModuleIds(next);
    }
    if (drawerModuleId === id) setDrawerModuleId(null);
  };

  const duplicateRow = (id: string) => {
    const target = modules.find(m => m.id === id);
    if (!target) return;
    const duplicated: ScaffoldModule = {
      ...target,
      id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${target.name} (Copy)`
    };
    const idx = modules.findIndex(m => m.id === id);
    setModules(prev => [...prev.slice(0, idx + 1), duplicated, ...prev.slice(idx + 1)]);
    toast.success(`Duplicated module "${target.name}".`);
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedModuleIds(new Set(filteredModules.map(m => m.id)));
    } else {
      setSelectedModuleIds(new Set());
    }
  };

  const toggleSelectModule = (id: string) => {
    setSelectedModuleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Batch actions
  const handleBatchDelete = () => {
    if (confirm(`Delete ${selectedModuleIds.size} selected module(s)?`)) {
      setModules(prev => prev.filter(m => !selectedModuleIds.has(m.id)));
      if (drawerModuleId && selectedModuleIds.has(drawerModuleId)) {
        setDrawerModuleId(null);
      }
      setSelectedModuleIds(new Set());
      toast.success('Deleted selected modules.');
    }
  };

  const handleBatchDuplicate = () => {
    const toDuplicate = modules.filter(m => selectedModuleIds.has(m.id));
    const newItems = toDuplicate.map(m => ({
      ...m,
      id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${m.name} (Copy)`
    }));
    setModules(prev => [...prev, ...newItems]);
    setSelectedModuleIds(new Set());
    toast.success(`Duplicated ${toDuplicate.length} module(s).`);
  };

  const handleBatchSetLayer = (layer: string) => {
    setModules(prev => prev.map(m => selectedModuleIds.has(m.id) ? { ...m, type: layer } : m));
    toast.success(`Updated layer to "${layer}" for ${selectedModuleIds.size} module(s).`);
  };

  const handleBatchSetPriority = (p: TaskPriority) => {
    setModules(prev => prev.map(m => selectedModuleIds.has(m.id) ? { ...m, priority: p } : m));
    toast.success(`Updated priority to "${p}" for ${selectedModuleIds.size} module(s).`);
  };

  // Bulk import
  const handleBulkImport = () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    if (!lines.length) return;

    const parsed: ScaffoldModule[] = [];
    lines.forEach(line => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts[0]) {
        const type = parts[1] || 'Server';
        const assignee = parts[2] || '';
        const priorityStr = (parts[3] || 'Medium').toLowerCase();
        const priority = priorityStr.includes('crit') ? TaskPriority.CRITICAL : priorityStr.includes('high') ? TaskPriority.HIGH : priorityStr.includes('low') ? TaskPriority.LOW : TaskPriority.MEDIUM;
        const statusStr = (parts[4] || 'Not Started').toLowerCase();
        const status = statusStr.includes('prog') ? TaskStatus.IN_PROGRESS : statusStr.includes('comp') ? TaskStatus.COMPLETED : statusStr.includes('hold') ? TaskStatus.ON_HOLD : TaskStatus.NOT_STARTED;
        const release = parts[5] || 'v1.0.0';
        const screens = (parts[6] || '').split('|').map(s => s.trim()).filter(Boolean).join('\n');

        parsed.push({
          id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: parts[0],
          type,
          assignee,
          priority,
          status,
          release,
          screens
        });
      }
    });

    if (parsed.length > 0) {
      if (importMode === 'replace') {
        setModules(parsed);
      } else {
        const currentValid = modules.filter(m => m.name.trim());
        setModules([...currentValid, ...parsed]);
      }
      setIsBulkOpen(false);
      setBulkText('');
      toast.success(`Imported ${parsed.length} module(s).`);
    }
  };

  const handleFinish = () => {
    const validModules = modules.filter(m => m.name.trim());
    if (!validModules.length) {
      toast.error('Please define at least one module with a name.');
      return;
    }

    const newFeatures: Feature[] = [...(state.features || [])];

    validModules.forEach(m => {
      const subtasks: any[] = [];
      const guiScreens: string[] = [];
      
      if (m.type === 'GUI' && m.screens.trim()) {
        const screenLines = m.screens.split('\n').filter(l => l.trim());
        screenLines.forEach((line, lx) => {
          const parts = line.split(',').map(s => s.trim());
          const name = parts[0];
          if (name) {
            guiScreens.push(name);
            subtasks.push({
              id: `ST-${lx + 1}`,
              name: `Template: ${name}`,
              status: TaskStatus.NOT_STARTED,
              progress: 0,
              done: false,
              effort: 1,
              type: 'screen'
            });
          }
        });
      }

      if (!newFeatures.some(f => f.name === m.name)) {
        newFeatures.push({
          name: m.name,
          desc: `Architecture component for ${m.name} module.`,
          screens: guiScreens
        });
      }

      createTask({
        name: m.name,
        module: m.name,
        moduleType: m.type,
        assignee: m.assignee,
        priority: m.priority,
        status: m.status,
        release: m.release,
        startDate: todayStr(),
        dueDate: todayStr(),
        category: m.type === 'GUI' ? 'GUI Interface' : 'Architecture Component',
        subtasks: subtasks,
        guiScreens: guiScreens
      });
    });

    updateProject({ features: newFeatures });
    addLog('Architecture Scaffolder Generated', 'SCAFFOLD', `${validModules.length} Modules`, 'Architecture', '', `${validModules.length} Modules created`);
    toast.success(`Successfully generated architecture with ${validModules.length} modules!`);
    setView('tasks');
  };

  const isAllSelected = filteredModules.length > 0 && filteredModules.every(m => selectedModuleIds.has(m.id));
  const isPartiallySelected = filteredModules.some(m => selectedModuleIds.has(m.id)) && !isAllSelected;

  const renderStepStepper = () => (
    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 max-w-xl mx-auto px-1">
      <button 
        onClick={() => setStep('blueprint')}
        className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer focus:outline-none"
      >
        <div className={clsx(
          "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-sm",
          "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] ring-2 ring-[var(--color-primary-hex)]/30"
        )}>1</div>
        <span className={clsx("text-xs sm:text-sm font-bold", step === 'blueprint' ? "text-[var(--color-primary-hex)]" : "text-[var(--color-text-faint)]")}>
          Module Blueprint
        </span>
      </button>
      <div className="flex-1 h-px bg-[var(--color-divider)]" />
      <button 
        onClick={() => setStep('alignment')}
        className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer focus:outline-none"
      >
        <div className={clsx(
          "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-sm",
          step === 'alignment' 
            ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] ring-2 ring-[var(--color-primary-hex)]/30" 
            : "bg-[var(--color-surface-offset)] text-[var(--color-text-faint)]"
        )}>2</div>
        <span className={clsx("text-xs sm:text-sm font-bold", step === 'alignment' ? "text-[var(--color-primary-hex)]" : "text-[var(--color-text-faint)]")}>
          Interface Mapping
        </span>
      </button>
    </div>
  );

  return (
    <MotionPage className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Blocks}
        title="Project Scaffolder"
        subtitle={step === 'blueprint' ? 'Define architectural modules, layers, and team ownership' : 'Map GUI screen hierarchies and confirm project generation'}
        actions={
          step === 'alignment' ? (
            <Button variant="ghost" size="sm" onClick={() => setStep('blueprint')} className="h-9 font-bold active:scale-95 flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back
            </Button>
          ) : undefined
        }
        primaryAction={
          step === 'blueprint' ? (
            <Button variant="primary" size="sm" onClick={() => setStep('alignment')} className="h-9 px-4 font-bold rounded-xl active:scale-95 shadow-xs flex items-center gap-1.5">
              <span>Next Step</span>
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleFinish} className="h-9 px-4 font-bold rounded-xl active:scale-95 shadow-xs flex items-center gap-1.5">
              <Zap size={14} />
              <span>Generate Architecture</span>
            </Button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {renderStepStepper()}

        {step === 'blueprint' && (
          <div className="space-y-4 sm:space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300">
            {/* Action Bar & Filter Presets */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-sm">
              {/* Search input with '/' shortcut */}
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Filter modules by name, lead, or release… (Press /)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-xs bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                  aria-label="Filter modules"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] p-0.5"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Preset Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  data-filter-layer="all"
                  onClick={() => setLayerFilter('all')}
                  className={clsx(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0",
                    layerFilter === 'all'
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                  )}
                >
                  All ({layerCounts.all})
                </button>
                {(['Server', 'GUI', 'Interface', 'Infrastructure'] as const).map(layer => (
                  <button
                    key={layer}
                    data-filter-layer={layer}
                    onClick={() => setLayerFilter(layer)}
                    className={clsx(
                      "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1",
                      layerFilter === layer
                        ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                    )}
                  >
                    <span>{layer}</span>
                    <span className="text-[10px] opacity-75">({layerCounts[layer] || 0})</span>
                  </button>
                ))}

                {(layerFilter !== 'all' || searchQuery) && (
                  <button
                    onClick={() => { setLayerFilter('all'); setSearchQuery(''); }}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0 cursor-pointer ml-1"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Primary Blueprint Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsBulkOpen(true)} 
                  className="h-9 px-3 font-bold rounded-xl border-[var(--color-divider)] bg-[var(--color-surface-2)] active:scale-95 text-xs"
                >
                  <Upload size={14} className="mr-1.5 text-[var(--color-primary-hex)]" />
                  <span>Bulk & Presets</span>
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={addRow} 
                  className="h-9 px-3.5 font-bold rounded-xl active:scale-95 shadow-xs text-xs"
                >
                  <Plus size={14} className="mr-1.5" />
                  <span>Add Module</span>
                </Button>
              </div>
            </div>

            {/* Linear-Grade Table Container */}
            <div className="card overflow-hidden border border-[var(--color-divider)] shadow-sm">
              {/* Desktop Linear-Grade Precision Table */}
              <div className="hidden lg:block overflow-x-auto custom-scroll">
                <table className="w-full border-collapse text-left text-xs min-w-[960px]">
                  <thead>
                    <tr className="bg-[var(--color-surface-offset)] border-b border-[var(--color-divider)] text-[var(--color-text-muted)] font-semibold select-none">
                      <th className="w-10 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={el => { if (el) el.indeterminate = isPartiallySelected; }}
                          onChange={handleSelectAll}
                          aria-label="Select all modules"
                          className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] focus:ring-[var(--color-primary-hex)] cursor-pointer"
                        />
                      </th>
                      <th className="w-12 px-2 py-3 text-center font-mono text-[var(--color-text-faint)]">#</th>
                      <th className="w-64 px-4 py-3 sticky left-0 bg-[var(--color-surface-offset)] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                        Module Name
                      </th>
                      <th className="w-40 px-3 py-3">Layer Architecture</th>
                      <th className="w-44 px-3 py-3">Lead Assignee</th>
                      <th className="w-32 px-3 py-3">Priority</th>
                      <th className="w-28 px-3 py-3">Release</th>
                      <th className="w-32 px-3 py-3">Screens / Sitemap</th>
                      <th className="w-24 px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-divider)]">
                    {filteredModules.map((m, idx) => {
                      const isSelected = selectedModuleIds.has(m.id);
                      const layer = LAYER_CONFIG[m.type] || LAYER_CONFIG.Server;
                      const LayerIcon = layer.icon;
                      const screenCount = m.screens.trim() ? m.screens.split('\n').filter(Boolean).length : 0;

                      return (
                        <tr 
                          key={m.id}
                          className={clsx(
                            "group transition-colors duration-150 hover:bg-[var(--color-surface-2)]/60",
                            isSelected && "bg-[var(--color-primary-highlight-hex)]/40"
                          )}
                        >
                          {/* Checkbox */}
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectModule(m.id)}
                              aria-label={`Select module ${m.name || 'Untitled'}`}
                              className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] focus:ring-[var(--color-primary-hex)] cursor-pointer"
                            />
                          </td>

                          {/* Index */}
                          <td className="px-2 py-2.5 text-center font-mono text-[var(--color-text-faint)]">
                            {idx + 1}
                          </td>

                          {/* Frozen Sticky Module Name */}
                          <td className="px-4 py-2.5 sticky left-0 bg-[var(--color-surface)] group-hover:bg-[var(--color-surface-2)] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={m.name}
                                onChange={e => updateModule(m.id, 'name', e.target.value)}
                                placeholder="e.g. Identity Management"
                                className="w-full font-bold text-xs bg-transparent border-b border-transparent focus:border-[var(--color-primary-hex)] outline-none py-1 transition-all text-[var(--color-text)] placeholder:font-normal placeholder:text-[var(--color-text-faint)]"
                              />
                            </div>
                          </td>

                          {/* Layer Type */}
                          <td className="px-3 py-2.5">
                            <div className="relative inline-block w-full">
                              <select
                                value={m.type}
                                onChange={e => updateModule(m.id, 'type', e.target.value)}
                                className={clsx(
                                  "w-full h-8 px-2.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer transition-colors bg-transparent",
                                  layer.badge
                                )}
                              >
                                <option value="Server" className="bg-[var(--color-surface)] text-[var(--color-text)]">Server Layer</option>
                                <option value="GUI" className="bg-[var(--color-surface)] text-[var(--color-text)]">GUI Interface</option>
                                <option value="Interface" className="bg-[var(--color-surface)] text-[var(--color-text)]">API / Bridge</option>
                                <option value="Infrastructure" className="bg-[var(--color-surface)] text-[var(--color-text)]">Infrastructure</option>
                              </select>
                            </div>
                          </td>

                          {/* Lead Assignee */}
                          <td className="px-3 py-2.5">
                            <select
                              value={m.assignee}
                              onChange={e => updateModule(m.id, 'assignee', e.target.value)}
                              className="w-full h-8 px-2 bg-transparent text-xs font-semibold outline-none focus:bg-[var(--color-surface-2)] rounded-lg border border-transparent focus:border-[var(--color-primary-hex)]/30 text-[var(--color-text)] cursor-pointer"
                            >
                              <option value="" className="bg-[var(--color-surface)] text-[var(--color-text)]">Unassigned</option>
                              {(getTeamNames(state.members) || []).map(name => (
                                <option key={name} value={name} className="bg-[var(--color-surface)] text-[var(--color-text)]">{name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Priority */}
                          <td className="px-3 py-2.5">
                            <select
                              value={m.priority}
                              onChange={e => updateModule(m.id, 'priority', e.target.value as TaskPriority)}
                              className="w-full h-8 px-2 bg-transparent text-xs font-semibold outline-none focus:bg-[var(--color-surface-2)] rounded-lg border border-transparent focus:border-[var(--color-primary-hex)]/30 text-[var(--color-text)] cursor-pointer"
                            >
                              {Object.values(TaskPriority).map(p => (
                                <option key={p} value={p} className="bg-[var(--color-surface)] text-[var(--color-text)]">{p}</option>
                              ))}
                            </select>
                          </td>

                          {/* Release */}
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={m.release}
                              onChange={e => updateModule(m.id, 'release', e.target.value)}
                              placeholder="v1.0.0"
                              className="w-full h-8 px-2 bg-transparent font-mono text-xs font-bold outline-none focus:bg-[var(--color-surface-2)] rounded-lg border border-transparent focus:border-[var(--color-primary-hex)]/30 text-[var(--color-primary-hex)]"
                            />
                          </td>

                          {/* Screens / Sitemap indicator */}
                          <td className="px-3 py-2.5">
                            {m.type === 'GUI' ? (
                              <button
                                onClick={() => setDrawerModuleId(m.id)}
                                className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                title="Edit screen sitemap in Drawer"
                              >
                                <Monitor size={12} />
                                <span>{screenCount > 0 ? `${screenCount} Screen(s)` : 'Configure'}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-[var(--color-text-faint)] font-mono pl-2">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setDrawerModuleId(m.id)}
                                title="Inspect Module Blueprint in Peek Drawer"
                                aria-label={`Inspect ${m.name}`}
                                className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
                              >
                                <PanelRight size={14} />
                              </button>
                              <button
                                onClick={() => duplicateRow(m.id)}
                                title="Duplicate Module"
                                aria-label={`Duplicate ${m.name}`}
                                className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface)] rounded-lg transition-colors cursor-pointer"
                              >
                                <CopyPlus size={14} />
                              </button>
                              <button
                                onClick={() => removeRow(m.id)}
                                title="Remove Module"
                                aria-label={`Remove ${m.name}`}
                                className="p-1.5 text-[var(--color-text-faint)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Module Cards View */}
              <div className="lg:hidden p-3 space-y-3">
                {filteredModules.map((m, idx) => {
                  const isSelected = selectedModuleIds.has(m.id);
                  const layer = LAYER_CONFIG[m.type] || LAYER_CONFIG.Server;
                  const screenCount = m.screens.trim() ? m.screens.split('\n').filter(Boolean).length : 0;

                  return (
                    <div 
                      key={m.id}
                      className={clsx(
                        "p-4 rounded-xl border transition-all space-y-3",
                        isSelected ? "border-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)]/20" : "border-[var(--color-divider)] bg-[var(--color-surface)]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectModule(m.id)}
                            aria-label={`Select ${m.name}`}
                            className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] focus:ring-[var(--color-primary-hex)] cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Module Name</label>
                            <input
                              type="text"
                              value={m.name}
                              onChange={e => updateModule(m.id, 'name', e.target.value)}
                              placeholder="Module Name"
                              className="w-full font-bold text-sm bg-transparent border-b border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] outline-none py-0.5 text-[var(--color-text)]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setDrawerModuleId(m.id)}
                            className="p-1.5 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)]"
                            aria-label="Inspect module"
                          >
                            <PanelRight size={15} />
                          </button>
                          <button
                            onClick={() => removeRow(m.id)}
                            className="p-1.5 text-[var(--color-text-faint)] hover:text-rose-500"
                            aria-label="Remove module"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block mb-1">Layer</label>
                          <select
                            value={m.type}
                            onChange={e => updateModule(m.id, 'type', e.target.value)}
                            className={clsx("w-full h-8 px-2 rounded-lg font-bold border outline-none bg-transparent", layer.badge)}
                          >
                            <option value="Server">Server</option>
                            <option value="GUI">GUI</option>
                            <option value="Interface">API</option>
                            <option value="Infrastructure">Infra</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block mb-1">Lead</label>
                          <select
                            value={m.assignee}
                            onChange={e => updateModule(m.id, 'assignee', e.target.value)}
                            className="w-full h-8 px-2 rounded-lg bg-[var(--color-surface-2)] text-xs font-semibold outline-none border border-[var(--color-divider)]"
                          >
                            <option value="">Unassigned</option>
                            {(getTeamNames(state.members) || []).map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block mb-1">Priority</label>
                          <select
                            value={m.priority}
                            onChange={e => updateModule(m.id, 'priority', e.target.value as TaskPriority)}
                            className="w-full h-8 px-2 rounded-lg bg-[var(--color-surface-2)] text-xs font-semibold outline-none border border-[var(--color-divider)]"
                          >
                            {Object.values(TaskPriority).map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block mb-1">Release</label>
                          <input
                            type="text"
                            value={m.release}
                            onChange={e => updateModule(m.id, 'release', e.target.value)}
                            placeholder="v1.0.0"
                            className="w-full h-8 px-2 rounded-lg bg-[var(--color-surface-2)] text-xs font-mono font-bold outline-none border border-[var(--color-divider)] text-[var(--color-primary-hex)]"
                          />
                        </div>
                      </div>

                      {m.type === 'GUI' && (
                        <div className="pt-2 border-t border-[var(--color-divider)] flex items-center justify-between">
                          <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Screen Sitemap:</span>
                          <button
                            onClick={() => setDrawerModuleId(m.id)}
                            className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                          >
                            <span>{screenCount > 0 ? `${screenCount} screens` : 'Add Screens'}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Zero-State / Empty States */}
              {filteredModules.length === 0 && (
                <div className="py-12 px-4 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center mx-auto text-[var(--color-text-faint)]">
                    <Blocks size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-text)]">No Architecture Modules Found</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto">
                      {searchQuery || layerFilter !== 'all' 
                        ? 'Try clearing your active filters or search terms.' 
                        : 'Get started by creating a blank module or loading an enterprise architecture blueprint.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {searchQuery || layerFilter !== 'all' ? (
                      <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setLayerFilter('all'); }}>
                        <RefreshCw size={13} className="mr-1.5" /> Clear Filters
                      </Button>
                    ) : (
                      <>
                        <Button variant="primary" size="sm" onClick={addRow} className="font-bold">
                          <Plus size={14} className="mr-1.5" /> Add Blank Module
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(true)} className="font-bold">
                          <Upload size={14} className="mr-1.5 text-[var(--color-primary-hex)]" /> Load Presets
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: INTERFACE MAPPING */}
        {step === 'alignment' && (
          <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 duration-300">
            <div className="card p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-divider)] pb-5">
                <div>
                  <h2 className="text-lg font-black text-[var(--color-text)] flex items-center gap-2">
                    <span>Interface Mapping & Screen Hierarchy</span>
                    <SectionHelpButton view="scaffolder" section="GUI Screen Inventory" label="Interface Mapping guide" size={14} />
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Review generated tasks and configure GUI screen sitemaps before compiling project state.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep('blueprint')} className="font-bold">
                    <ArrowLeft size={14} className="mr-1.5" /> Back to Blueprint
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleFinish} className="font-black px-4 shadow-sm">
                    <Zap size={14} className="mr-1.5" /> Generate Architecture
                  </Button>
                </div>
              </div>

              {/* Grid of Modules */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {modules.filter(m => m.name.trim()).map((m) => {
                  const layer = LAYER_CONFIG[m.type] || LAYER_CONFIG.Server;
                  const LayerIcon = layer.icon;
                  const screenCount = m.screens.trim() ? m.screens.split('\n').filter(Boolean).length : 0;

                  return (
                    <div 
                      key={m.id}
                      className="p-5 rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:border-[var(--color-primary-hex)]/40 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center font-bold", layer.badge)}>
                            <LayerIcon size={18} />
                          </div>
                          <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-md border", layer.badge)}>
                            {m.type}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-[var(--color-text)] truncate">{m.name}</h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-[11px] mt-3 pt-3 border-t border-[var(--color-divider)]">
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--color-text-faint)] block uppercase">Owner</span>
                            <span className="font-bold text-[var(--color-text)]">{m.assignee || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--color-text-faint)] block uppercase">Release</span>
                            <span className="font-mono font-bold text-[var(--color-primary-hex)]">{m.release || 'v1.0.0'}</span>
                          </div>
                        </div>
                      </div>

                      {m.type === 'GUI' ? (
                        <div className="space-y-2 pt-2 border-t border-[var(--color-divider)]">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-emerald-600 block">Screen Sitemap</label>
                            <span className="text-[10px] font-mono text-[var(--color-text-faint)]">{screenCount} subtask(s)</span>
                          </div>
                          <textarea
                            value={m.screens}
                            onChange={e => updateModule(m.id, 'screens', e.target.value)}
                            placeholder="e.g. Dashboard&#10;Settings&#10;Analytics View"
                            rows={3}
                            className="w-full text-xs font-mono p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] custom-scroll"
                          />
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-[var(--color-surface-2)] text-[11px] text-[var(--color-text-muted)] flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-[var(--color-primary-hex)] shrink-0" />
                          <span>Standard architectural task and feature mapping will be created.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Action Bar for Batch Selection ── */}
      <AnimatePresence>
        {selectedModuleIds.size > 0 && (
          <motion.div
            data-testid="floating-action-bar"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-divider)] shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 text-xs max-w-[95vw] overflow-x-auto"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--color-divider)] font-bold text-[var(--color-text)] shrink-0">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center text-[10px]">
                {selectedModuleIds.size}
              </span>
              <span>Selected</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleBatchDuplicate}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Duplicate selected modules"
              >
                <CopyPlus size={13} className="text-[var(--color-primary-hex)]" />
                <span>Duplicate</span>
              </button>

              {/* Set Layer quick actions */}
              <div className="relative inline-flex items-center">
                <select
                  onChange={e => { if (e.target.value) handleBatchSetLayer(e.target.value); }}
                  value=""
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold text-xs cursor-pointer bg-transparent outline-none"
                  aria-label="Set Layer for selected modules"
                >
                  <option value="" disabled>Set Layer…</option>
                  <option value="Server">Server</option>
                  <option value="GUI">GUI</option>
                  <option value="Interface">API / Bridge</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>

              {/* Set Priority quick actions */}
              <div className="relative inline-flex items-center">
                <select
                  onChange={e => { if (e.target.value) handleBatchSetPriority(e.target.value as TaskPriority); }}
                  value=""
                  className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold text-xs cursor-pointer bg-transparent outline-none"
                  aria-label="Set Priority for selected modules"
                >
                  <option value="" disabled>Set Priority…</option>
                  {Object.values(TaskPriority).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleBatchDelete}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete selected modules"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedModuleIds(new Set())}
              className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] ml-1 cursor-pointer shrink-0"
              title="Deselect all (Escape)"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Master-Detail Module Blueprint Peek Side Drawer ── */}
      {drawerModule && (
        <SlideOverDrawer
          isOpen={true}
          onClose={() => setDrawerModuleId(null)}
          onNext={handleNextDrawerModule}
          onPrevious={handlePreviousDrawerModule}
          hasNext={drawerIndex < filteredModules.length - 1}
          hasPrevious={drawerIndex > 0}
          widthClass="w-full sm:w-[500px] lg:w-[560px]"
          title={
            <div className="flex items-center gap-2">
              <Blocks size={16} className="text-[var(--color-primary-hex)] shrink-0" />
              <span className="truncate">{drawerModule.name || 'Untitled Module'}</span>
            </div>
          }
          subtitle={
            <div className="flex items-center gap-2 mt-0.5">
              <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-md border", LAYER_CONFIG[drawerModule.type]?.badge || LAYER_CONFIG.Server.badge)}>
                {drawerModule.type} Layer
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                Release: {drawerModule.release || 'v1.0.0'}
              </span>
            </div>
          }
        >
          <div className="p-5 sm:p-6 space-y-6 text-xs custom-scroll">
            {/* 4-Metric Telemetry Bento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Layer</span>
                <span className="text-xs font-bold text-[var(--color-text)] mt-1 block">{drawerModule.type}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Priority</span>
                <span className="text-xs font-bold text-[var(--color-text)] mt-1 block">{drawerModule.priority}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Lead</span>
                <span className="text-xs font-bold text-[var(--color-text)] mt-1 block truncate">{drawerModule.assignee || 'Unassigned'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <span className="text-[10px] font-bold text-[var(--color-text-faint)] uppercase block">Release</span>
                <span className="text-xs font-mono font-bold text-[var(--color-primary-hex)] mt-1 block">{drawerModule.release || 'v1.0.0'}</span>
              </div>
            </div>

            {/* Editable Attributes */}
            <div className="space-y-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)]">
              <h4 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">Module Specification</h4>
              
              <div>
                <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Module Name</label>
                <input
                  type="text"
                  value={drawerModule.name}
                  onChange={e => updateModule(drawerModule.id, 'name', e.target.value)}
                  placeholder="e.g. Identity Gateway"
                  className="w-full h-9 px-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-bold text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Layer Type</label>
                  <select
                    value={drawerModule.type}
                    onChange={e => updateModule(drawerModule.id, 'type', e.target.value)}
                    className="w-full h-9 px-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-semibold text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="Server">Server Layer</option>
                    <option value="GUI">GUI Interface</option>
                    <option value="Interface">API / Bridge</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Lead Assignee</label>
                  <select
                    value={drawerModule.assignee}
                    onChange={e => updateModule(drawerModule.id, 'assignee', e.target.value)}
                    className="w-full h-9 px-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-semibold text-xs text-[var(--color-text)] outline-none"
                  >
                    <option value="">Unassigned</option>
                    {(getTeamNames(state.members) || []).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Priority</label>
                  <select
                    value={drawerModule.priority}
                    onChange={e => updateModule(drawerModule.id, 'priority', e.target.value as TaskPriority)}
                    className="w-full h-9 px-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-semibold text-xs text-[var(--color-text)] outline-none"
                  >
                    {Object.values(TaskPriority).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Release Version</label>
                  <input
                    type="text"
                    value={drawerModule.release}
                    onChange={e => updateModule(drawerModule.id, 'release', e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full h-9 px-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] font-mono font-bold text-xs text-[var(--color-primary-hex)] outline-none focus:border-[var(--color-primary-hex)]"
                  />
                </div>
              </div>
            </div>

            {/* GUI Screen Sitemap Editor */}
            {drawerModule.type === 'GUI' && (
              <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Monitor size={14} className="text-emerald-500" />
                    <h4 className="text-xs font-bold text-[var(--color-text)]">GUI Screen Sitemap</h4>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    {drawerModule.screens.trim() ? `${drawerModule.screens.split('\n').filter(Boolean).length} screens` : '0 screens'}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Enter each GUI screen on a new line. Each screen becomes an automated template subtask linked to the module task.
                </p>

                <textarea
                  value={drawerModule.screens}
                  onChange={e => updateModule(drawerModule.id, 'screens', e.target.value)}
                  placeholder={`Overview Dashboard\nAccount Settings\nBilling History`}
                  rows={5}
                  className="w-full text-xs font-mono p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] custom-scroll"
                />

                {/* Quick screen append helpers */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['+ Overview Dashboard', '+ User Profile', '+ Settings & Preferences', '+ Audit Trail'].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        const clean = preset.replace(/^\+\s*/, '');
                        const next = drawerModule.screens.trim() ? `${drawerModule.screens.trim()}\n${clean}` : clean;
                        updateModule(drawerModule.id, 'screens', next);
                      }}
                      className="px-2 py-1 rounded-lg border border-[var(--color-divider)] text-[10px] font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Architecture Generation Impact Dossier */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface-offset)] border border-[var(--color-divider)] space-y-3">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[var(--color-primary-hex)]" />
                <h4 className="text-xs font-bold text-[var(--color-text)]">Architecture Generation Impact</h4>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                  <span className="text-[var(--color-text-muted)]">Generated Task:</span>
                  <span className="font-bold text-[var(--color-text)]">{drawerModule.name || 'Untitled'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                  <span className="text-[var(--color-text-muted)]">Category:</span>
                  <span className="font-semibold text-[var(--color-primary-hex)]">
                    {drawerModule.type === 'GUI' ? 'GUI Interface' : 'Architecture Component'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                  <span className="text-[var(--color-text-muted)]">Strategic Feature in Matrix:</span>
                  <span className="font-semibold text-emerald-600">Active Blueprint Feature</span>
                </div>
              </div>
            </div>
          </div>
        </SlideOverDrawer>
      )}

      {/* ── BULK IMPORT & ARCHITECTURE PRESETS MODAL ── */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <span>Bulk Module & Architecture Presets</span>
            <SectionHelpButton view="scaffolder" section="Bulk TSV / CSV Import" label="Bulk import guide" size={13} />
          </span>
        }
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsBulkOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleBulkImport}
              disabled={!bulkText.trim()}
              className="font-bold shadow-sm"
            >
              <Check size={14} className="mr-1.5" /> Import {bulkText.trim() ? `${bulkText.trim().split('\n').filter(Boolean).length} Module(s)` : 'Modules'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Architecture Presets */}
          <div>
            <label className="text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-wider mb-2 block">
              Choose Architecture Blueprint Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESET_BLUEPRINTS.map((bp, bidx) => (
                <button
                  key={bidx}
                  onClick={() => setBulkText(bp.data)}
                  className="text-left p-3 rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary-hex)]/40 hover:bg-[var(--color-primary-highlight-hex)] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--color-text)] group-hover:text-[var(--color-primary-hex)] transition-colors">
                    <Layers size={13} className="text-[var(--color-primary-hex)]" />
                    <span className="truncate">{bp.name}</span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1 line-clamp-2 leading-relaxed">
                    {bp.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* TSV / CSV Text Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[var(--color-text-faint)] uppercase tracking-wider">
                Module Blueprint Matrix (CSV / TSV)
              </label>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={7}
              className="w-full text-xs font-mono p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-hex)]/20 focus:border-[var(--color-primary-hex)] transition-all custom-scroll"
              placeholder={`Identity Gateway, Server, Sarah Jenkins, High, In Progress, v1.0.0, Login|MFA Setup\nAnalytics Dashboard, GUI, Elena Rostova, Medium, Not Started, v1.1.0, Overview|Drilldown`}
            />
          </div>

          {/* Import Mode */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <span className="text-xs font-medium text-[var(--color-text)]">Import Strategy</span>
            <div className="flex gap-2">
              <button
                onClick={() => setImportMode('append')}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  importMode === 'append' ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                Append to existing
              </button>
              <button
                onClick={() => setImportMode('replace')}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  importMode === 'replace' ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                Replace all
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </MotionPage>
  );
};

export default ScaffolderView;
