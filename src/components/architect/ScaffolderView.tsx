import React, { useState } from 'react';
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
  Info,
  Layers,
  Monitor,
  CheckCircle2,
  Database,
  Upload,
  X,
  Check
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import clsx from 'clsx';

interface ScaffoldModule {
  name: string;
  type: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  release: string;
  screens: string;
}

const ScaffolderView: React.FC = () => {
  const { state, setView, createTask, updateProject } = useProject();
  const [step, setStep] = useState(1);
  const [modules, setModules] = useState<ScaffoldModule[]>([
    { name: '', type: 'Server', assignee: '', priority: TaskPriority.MEDIUM, status: TaskStatus.NOT_STARTED, release: 'v1.0.0', screens: '' }
  ]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

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
    }
  };

  const addRow = () => {
    setModules([...modules, { name: '', type: 'Server', assignee: '', priority: TaskPriority.MEDIUM, status: TaskStatus.NOT_STARTED, release: 'v1.0.0', screens: '' }]);
  };

  const updateModule = (idx: number, field: keyof ScaffoldModule, val: any) => {
    const newModules = [...modules];
    newModules[idx] = { ...newModules[idx], [field]: val };
    setModules(newModules);
  };

  const removeRow = (idx: number) => {
    setModules(modules.filter((_, i) => i !== idx));
  };

  const duplicateRow = (idx: number) => {
    const row = { ...modules[idx], name: modules[idx].name + ' (Copy)' };
    setModules([...modules.slice(0, idx + 1), row, ...modules.slice(idx + 1)]);
  };

  const handleFinish = () => {
    const validModules = modules.filter(m => m.name.trim());
    if (!validModules.length) return;

    const newFeatures: Feature[] = [...(state.features || [])];

    validModules.forEach(m => {
      const subtasks: any[] = [];
      const guiScreens: string[] = [];
      
      // Split screens and handle them
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

      // Create strategic feature link if missing
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
    setView('tasks');
  };

  const renderStepStepper = () => (
    <div className="flex items-center gap-4 mb-12 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <div className={clsx(
          "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-150",
          step >= 1 ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-md" : "bg-[var(--color-surface-offset)] text-[var(--color-text-faint)]"
        )}>1</div>
        <span className={clsx("text-sm font-semibold", step === 1 ? "text-[var(--color-primary-hex)]" : "text-[var(--color-text-faint)]")}>Blueprint</span>
      </div>
      <div className="flex-1 h-px bg-[var(--color-divider)]" />
      <div className="flex items-center gap-3">
        <div className={clsx(
          "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors duration-150",
          step >= 2 ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-md" : "bg-[var(--color-surface-offset)] text-[var(--color-text-faint)]"
        )}>2</div>
        <span className={clsx("text-sm font-semibold", step === 2 ? "text-[var(--color-primary-hex)]" : "text-[var(--color-text-faint)]")}>Alignment</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      <PageHeader
        icon={Blocks}
        title="Project Scaffolder"
        subtitle="Design modular architecture and fast-scaffold deliverable matrices and task hierarchies"
        actions={
          step > 1 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="h-9 font-bold active:scale-95 flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back
            </Button>
          ) : undefined
        }
        primaryAction={
          step === 1 ? (
            <Button variant="primary" size="sm" onClick={() => setStep(2)} className="h-9 px-4 font-bold rounded-xl active:scale-95 shadow-xs flex items-center gap-1.5">
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
      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full space-y-8">
        {renderStepStepper()}

        {step === 1 && (
          <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-500">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-8 border-b border-[var(--color-divider)] pb-6">
                <div>
                  <h2 className="text-lg font-bold">Module Blueprint</h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Define core business domains and layers</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="outline" size="sm" onClick={() => setIsBulkOpen(true)} className="h-10 px-4 font-bold rounded-xl border-[var(--color-divider)] bg-white/50 active:scale-[0.98]">
                    <Upload size={16} className="mr-2 text-[var(--color-primary-hex)]" /> Bulk Import & Presets
                  </Button>
                  <Button variant="outline" size="sm" onClick={addRow} className="h-10 px-5 font-bold rounded-xl border-[var(--color-divider)] bg-white/50 active:scale-[0.98]">
                    <Plus size={16} className="mr-2" /> Add Module
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setStep(2)} className="h-10 px-7 font-black rounded-xl active:scale-[0.98]">
                    Next Step <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface-offset)]/30 shadow-sm">
                {/* Mobile Scaffolder Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {modules.map((m, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-[var(--color-divider)] shadow-sm relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="min-w-0 flex-1">
                          <label className="text-xs font-medium text-[var(--color-primary-hex)] mb-1 block">Module Name</label>
                          <input 
                            className="w-full font-bold text-sm bg-transparent border-b border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] outline-none pb-1 focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                            placeholder="e.g. Identity"
                            value={m.name}
                            onChange={(e) => updateModule(i, 'name', e.target.value)}
                          />
                        </div>
                        <button onClick={() => removeRow(i)} className="p-2 text-red-400 hover:text-red-600 active:scale-95"><Trash2 size={16}/></button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Layer</label>
                          <select 
                            className="w-full text-xs font-bold bg-transparent border-b border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] outline-none pb-1"
                            value={m.type}
                            onChange={(e) => updateModule(i, 'type', e.target.value)}
                          >
                            <option value="Server">Server</option>
                            <option value="GUI">GUI</option>
                            <option value="Interface">API</option>
                            <option value="Infrastructure">Infrastructure</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Lead</label>
                          <select 
                            className="w-full text-xs font-bold bg-transparent border-b border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] outline-none pb-1"
                            value={m.assignee}
                            onChange={(e) => updateModule(i, 'assignee', e.target.value)}
                          >
                            <option value="">None</option>
                            {(getTeamNames(state.members) || []).map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Priority</label>
                          <select 
                            className="w-full text-xs font-bold bg-transparent border-b border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] outline-none pb-1"
                            value={m.priority}
                            onChange={(e) => updateModule(i, 'priority', e.target.value as any)}
                          >
                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">Release</label>
                          <input 
                            className="w-full text-xs font-bold bg-transparent border-b border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] outline-none pb-1"
                            placeholder="v1.0"
                            value={m.release}
                            onChange={(e) => updateModule(i, 'release', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {modules.length === 0 && (
                    <div className="py-8 text-center text-[var(--color-text-faint)] font-bold italic text-xs">No modules defined.</div>
                  )}
                </div>

                <table className="hidden lg:table w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[var(--color-surface-offset)] border-b border-[var(--color-divider)] text-xs font-semibold text-[var(--color-text-muted)] text-left">
                      <th className="p-4 w-64">Module Name</th>
                      <th className="p-4 w-40">Layer Type</th>
                      <th className="p-4 w-48">Lead Assignee</th>
                      <th className="p-4 w-32">Priority</th>
                      <th className="p-4 w-40">Release</th>
                      <th className="p-4 w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((m, i) => (
                      <tr key={i} className="border-b border-[var(--color-divider)] last:border-0 hover:bg-[var(--color-surface)]/50 transition-colors">
                        <td className="p-2">
                          <input 
                            className="w-full h-10 px-3 bg-transparent font-bold text-sm outline-none focus:bg-white rounded-lg transition-colors border border-transparent focus:border-[var(--color-primary-hex)]/20"
                            placeholder="e.g. Identity Management"
                            value={m.name}
                            onChange={(e) => updateModule(i, 'name', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <select 
                            className="w-full h-10 px-2 bg-transparent text-sm font-semibold outline-none focus:bg-white rounded-lg transition-colors border border-transparent focus:border-[var(--color-primary-hex)]/20"
                            value={m.type}
                            onChange={(e) => updateModule(i, 'type', e.target.value)}
                          >
                            <option value="Server">Server Layer</option>
                            <option value="GUI">GUI Interface</option>
                            <option value="Interface">API / Bridge</option>
                            <option value="Infrastructure">Infrastructure</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select 
                            className="w-full h-10 px-2 bg-transparent text-sm font-semibold outline-none focus:bg-white rounded-lg transition-colors border border-transparent focus:border-[var(--color-primary-hex)]/20"
                            value={m.assignee}
                            onChange={(e) => updateModule(i, 'assignee', e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {(getTeamNames(state.members) || []).map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <select 
                            className="w-full h-10 px-2 bg-transparent text-sm font-semibold outline-none focus:bg-white rounded-lg transition-colors border border-transparent focus:border-[var(--color-primary-hex)]/20"
                            value={m.priority}
                            onChange={(e) => updateModule(i, 'priority', e.target.value as any)}
                          >
                            {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input 
                            className="w-full h-10 px-3 bg-transparent text-sm outline-none focus:bg-white rounded-lg transition-colors border border-transparent focus:border-[var(--color-primary-hex)]/20"
                            placeholder="v1.0.0"
                            value={m.release}
                            onChange={(e) => updateModule(i, 'release', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1 justify-center">
                            <button onClick={() => duplicateRow(i)} title="Duplicate Row" className="p-2 text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] transition-colors cursor-pointer"><CopyPlus size={16}/></button>
                            <button onClick={() => removeRow(i)} title="Remove Row" className="p-2 text-[var(--color-text-faint)] hover:text-red-600 transition-colors cursor-pointer"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-6 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-divider)] text-[var(--color-text)]">
               <Info size={24} className="shrink-0 mt-1 opacity-60" />
               <div>
                  <h4 className="font-bold mb-1">Architectural Insight</h4>
                  <p className="text-sm opacity-80 leading-relaxed">
                    Defining your project by <strong>Modules</strong> and <strong>Layers</strong> instead of loose tasks ensures consistent reporting and strategic alignment. Modules set to <strong>GUI Interface</strong> type will allow you to map Sitemap screens in the next step.
                  </p>
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 duration-500">
             <div className="card p-8">
                <div className="flex items-center justify-between mb-12 border-b border-[var(--color-divider)] pb-6">
                  <div>
                    <h2 className="text-xl font-black">Interface Mapping</h2>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Connect architectural layers to strategic goals</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="ghost" className="font-bold active:scale-[0.98]" onClick={() => setStep(1)}><ArrowLeft size={18} className="mr-2" /> Back</Button>
                    <Button variant="primary" className="h-12 px-10 font-black rounded-2xl shadow-xl shadow-xs active:scale-[0.98]" onClick={handleFinish}>
                      <Zap size={18} className="mr-2" /> Generate Architecture
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {modules.filter(m => m.name.trim()).map((m, i) => (
                    <div key={i} className="p-6 rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:border-[var(--color-primary-hex)]/30 group transition-colors duration-150">
                       <div className="flex items-center justify-between mb-4">
                          <div className={clsx(
                             "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                             m.type === 'GUI' ? "bg-cyan-500/10 text-cyan-500" : m.type === 'Server' ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                          )}>
                             {m.type === 'GUI' ? <Monitor size={22} /> : m.type === 'Server' ? <Database size={22} /> : <Layers size={22} />}
                          </div>
                          <span className="text-xs font-medium text-[var(--color-text-muted)]">{m.type}</span>
                       </div>
                       <h3 className="font-black text-lg mb-4 text-[var(--color-text)] truncate">{m.name}</h3>
                       
                       <div className="space-y-4 pt-4 border-t border-[var(--color-divider)] border-dashed">
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-medium text-[var(--color-text-muted)]">Owner</span>
                             <span className="font-semibold">{m.assignee || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-medium text-[var(--color-text-muted)]">Release</span>
                             <span className="font-semibold text-[var(--color-primary-hex)] px-2 py-0.5 bg-[var(--color-primary-highlight-hex)] rounded italic">{m.release || 'Backlog'}</span>
                          </div>
                       </div>
                       
                       {m.type === 'GUI' && (
                         <div className="mt-6">
                            <label className="text-xs font-semibold text-[var(--color-primary-hex)] block mb-2">Screen Sitemap</label>
                            <textarea 
                              className="w-full h-32 p-3 bg-[var(--color-surface-offset)]/50 rounded-xl text-xs font-semibold focus:bg-white border-2 border-transparent focus:border-[var(--color-primary-hex)]/20 transition-colors duration-150 custom-scroll focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]"
                              placeholder="Dashboard, AppShell, n&#10;Settings, Modal, y"
                              value={m.screens}
                              onChange={(e) => updateModule(i, 'screens', e.target.value)}
                            />
                            <p className="text-[10px] text-[var(--color-text-faint)] mt-2 font-medium italic">Format: Name, Parent, New Window(y/n)</p>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
        {/* BULK IMPORT & ARCHITECTURE PRESETS MODAL */}
        {isBulkOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in duration-150">
            <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
              <div className="px-6 py-4 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center border border-[var(--color-primary-hex)]/20">
                    <Blocks size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-text)]">Bulk Module & Architecture Presets</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">Import TSV/CSV or choose an enterprise stack preset</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBulkOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scroll space-y-5">
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
                    <span className="text-[11px] font-mono text-[var(--color-text-faint)]">
                      Name, Type, Assignee, Priority, Status, Release, Screens (Pipe-separated)
                    </span>
                  </div>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={8}
                    className="w-full text-xs font-mono p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-hex)]/20 focus:border-[var(--color-primary-hex)] transition-all"
                    placeholder={`Identity Gateway, Server, Bob, High, In Progress, v1.0.0, Login|MFA Setup\nAnalytics Dashboard, GUI, Alice, Medium, Not Started, v1.1.0, Overview|Drilldown`}
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

              <div className="px-6 py-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-end gap-3">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScaffolderView;
