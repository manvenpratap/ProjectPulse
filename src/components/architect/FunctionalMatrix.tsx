import React, { useState, useMemo } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Layers, 
  Plus, 
  Search, 
  Map, 
  Activity,
  Edit2, 
  Trash2, 
  ChevronRight, 
  ShieldCheck, 
  ArrowRight, 
  XCircle,
  Wand2,
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flag,
  Tag,
  LayoutGrid,
  Columns,
  GanttChart,
  Kanban,
  Filter,
  Monitor,
  Check,
  X,
  ArrowUpDown,
  ChevronDown,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef } from '../shared/DataTable';
import clsx from 'clsx';
import { Feature, Task, TaskStatus } from '../../types';
import { daysDiff, fmtDate, todayStr } from '../../utils/projectUtils';
import { motion, AnimatePresence } from 'motion/react';
import FeatureTimelineChart from './FeatureTimelineChart';
import FeatureSwimlaneChart from './FeatureSwimlaneChart';

type ViewMode = 'matrix' | 'table' | 'timeline' | 'swimlane';
type ComplexityFilter = 'all' | 'simple' | 'moderate' | 'complex';

export const FunctionalMatrix: React.FC = () => {
  const { state, updateProject } = useProject();
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<ComplexityFilter>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Coverage Audit Panel Toggle
  const [showCoverageAudit, setShowCoverageAudit] = useState(false);
  const [unmappedTargetFeature, setUnmappedTargetFeature] = useState<string>('');

  // Auto-Build Modal
  const [isAutoBuildOpen, setIsAutoBuildOpen] = useState(false);
  const [autoBuildCandidates, setAutoBuildCandidates] = useState<{ name: string; desc: string; screens: string[]; module: string; selected: boolean }[]>([]);

  // Edit / Details Modal
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Feature | null>(null);
  const [newScreenInput, setNewScreenInput] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const features = state.features || [];

  // ── 1. Discover all project screens across tasks, subtasks & features ──
  const { allScreens, screenModuleMap, screenTasksMap } = useMemo(() => {
    const screens = new Set<string>();
    const modMap: Record<string, string> = {};
    const taskMap: Record<string, Task[]> = {};

    const registerScreen = (name: string, task?: Task, mod?: string) => {
      const clean = name.trim();
      if (!clean) return;
      screens.add(clean);
      if (mod && !modMap[clean]) modMap[clean] = mod;
      if (task) {
        if (!taskMap[clean]) taskMap[clean] = [];
        if (!taskMap[clean].includes(task)) taskMap[clean].push(task);
      }
    };

    // 1. Scan task GUI screens
    state.tasks.forEach(t => {
      const taskMod = t.module || 'General';

      if (t.guiScreens) {
        if (Array.isArray(t.guiScreens)) {
          t.guiScreens.forEach(sc => registerScreen(sc, t, taskMod));
        } else if (typeof t.guiScreens === 'string') {
          (t.guiScreens as string).split(',').forEach(sc => registerScreen(sc, t, taskMod));
        }
      }

      // Check subtasks specifically designated as screens
      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach(st => {
          if ((st.type === 'screen' || (st as any).isScreen) && st.name) {
            registerScreen(st.name, t, taskMod);
          }
        });
      }

      // Check task name if category is GUI Screen
      if (t.name && t.category === 'GUI Screen') {
        registerScreen(t.name, t, taskMod);
      }
    });

    // 2. Scan features' declared screens
    features.forEach(f => {
      (f.screens || []).forEach(sc => registerScreen(sc, undefined, f.category || 'General'));
    });

    return {
      allScreens: Array.from(screens).sort(),
      screenModuleMap: modMap,
      screenTasksMap: taskMap
    };
  }, [state.tasks, features]);

  // ── 2. Derive mapped vs unmapped screens ──
  const { allMappedScreens, mappedScreens, unmappedScreens } = useMemo(() => {
    const screensInFeatures = new Set<string>();
    features.forEach(f => {
      (f.screens || []).forEach(s => {
        const clean = s.trim();
        if (clean) screensInFeatures.add(clean);
      });
    });

    const mapped = allScreens.filter(s => screensInFeatures.has(s));
    const unmapped = allScreens.filter(s => !screensInFeatures.has(s));

    return {
      allMappedScreens: screensInFeatures,
      mappedScreens: mapped,
      unmappedScreens: unmapped
    };
  }, [features, allScreens]);

  const coveragePct = allScreens.length > 0 
    ? Math.round((mappedScreens.length / allScreens.length) * 100) 
    : 100;

  // ── 3. Derive Feature Telemetry (Maturation, Linked Tasks, Overdue, Dates) ──
  const featureMetrics = useMemo(() => {
    const metrics: Record<string, {
      totTasks: number;
      doneTasks: number;
      avgProg: number;
      overdueTasks: number;
      status: 'Planned' | 'Active' | 'Done' | 'At Risk';
      minDate: string | null;
      maxDate: string | null;
      impactedModules: string[];
      screensByModule: Record<string, string[]>;
    }> = {};

    features.forEach(f => {
      const screens = f.screens || [];
      const linkedTasks = state.tasks.filter(t => 
        t.module === f.name || 
        screens.includes(t.name) || 
        (t.guiScreens && (Array.isArray(t.guiScreens) ? t.guiScreens.some(sc => screens.includes(sc)) : screens.includes(String(t.guiScreens)))) ||
        (t.subtasks && t.subtasks.some(st => screens.includes(st.name)))
      );

      const totTasks = linkedTasks.length;
      const doneTasks = linkedTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
      const avgProg = totTasks > 0 ? Math.round(linkedTasks.reduce((s, t) => s + (t.progress || 0), 0) / totTasks) : 0;
      
      const overdueTasks = linkedTasks.filter(t => {
        const dd = daysDiff(t.dueDate);
        return dd !== null && dd < 0 && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED;
      }).length;

      let status: 'Planned' | 'Active' | 'Done' | 'At Risk' = 'Planned';
      if (overdueTasks > 0) status = 'At Risk';
      else if (avgProg === 100 || (totTasks > 0 && doneTasks === totTasks)) status = 'Done';
      else if (avgProg > 0 || totTasks > 0) status = 'Active';

      // Dates
      const startDates = linkedTasks.map(t => t.startDate).filter(Boolean) as string[];
      const dueDates = linkedTasks.map(t => t.dueDate).filter(Boolean) as string[];
      startDates.sort();
      dueDates.sort();
      const minDate = startDates.length > 0 ? startDates[0] : null;
      const maxDate = dueDates.length > 0 ? dueDates[dueDates.length - 1] : null;

      // Modules
      const modSet = new Set<string>();
      const scByMod: Record<string, string[]> = {};
      screens.forEach(s => {
        const m = screenModuleMap[s] || 'General';
        modSet.add(m);
        if (!scByMod[m]) scByMod[m] = [];
        scByMod[m].push(s);
      });
      linkedTasks.forEach(t => {
        if (t.module) modSet.add(t.module);
      });

      metrics[f.name] = {
        totTasks,
        doneTasks,
        avgProg,
        overdueTasks,
        status,
        minDate,
        maxDate,
        impactedModules: Array.from(modSet),
        screensByModule: scByMod
      };
    });

    return metrics;
  }, [features, state.tasks, screenModuleMap]);

  // Aggregate Stats
  const totalFeatures = features.length;
  const avgMaturity = totalFeatures > 0 
    ? Math.round(features.reduce((acc, f) => acc + (featureMetrics[f.name]?.avgProg || 0), 0) / totalFeatures)
    : 0;
  const totalAtRisk = features.filter(f => (featureMetrics[f.name]?.overdueTasks || 0) > 0).length;

  // Distinct Modules for Filtering
  const allModules = useMemo(() => {
    const mods = new Set<string>();
    features.forEach(f => {
      (featureMetrics[f.name]?.impactedModules || []).forEach(m => mods.add(m));
    });
    return Array.from(mods).sort();
  }, [features, featureMetrics]);

  // ── 4. Filtering Logic ──
  const filteredFeatures = useMemo(() => {
    return features.filter(f => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        f.name.toLowerCase().includes(q) || 
        f.desc.toLowerCase().includes(q) || 
        (f.screens || []).some(s => s.toLowerCase().includes(q));
      if (!matchSearch) return false;

      const screenCount = (f.screens || []).length;
      if (complexityFilter === 'simple' && screenCount > 2) return false;
      if (complexityFilter === 'moderate' && (screenCount < 3 || screenCount > 5)) return false;
      if (complexityFilter === 'complex' && screenCount < 6) return false;

      if (selectedModule !== 'all') {
        const mods = featureMetrics[f.name]?.impactedModules || [];
        if (!mods.includes(selectedModule)) return false;
      }

      if (selectedStatus !== 'all') {
        const st = featureMetrics[f.name]?.status;
        if (st !== selectedStatus) return false;
      }

      return true;
    });
  }, [features, searchTerm, complexityFilter, selectedModule, selectedStatus, featureMetrics]);

  const pagination = usePagination<Feature>(filteredFeatures, 10, 'pp_page_size_features');

  const columns = useMemo<ColumnDef<Feature>[]>(() => [
    {
      id: 'name',
      header: 'Feature Node',
      headerTitle: 'Strategic capability name and architectural scope',
      width: 'min-w-[260px]',
      cell: (f) => (
        <div className="flex items-center gap-1.5 min-w-0 max-w-[300px]">
          <span className="font-bold text-xs text-[var(--color-text)] truncate" title={f.name}>
            {f.name}
          </span>
          {f.desc && (
            <span className="text-[10px] text-[var(--color-text-muted)] truncate hidden xl:inline max-w-[150px] shrink-0" title={f.desc}>
              · {f.desc}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      headerTitle: 'Implementation lifecycle status (Planned, Active, Done, At Risk)',
      width: 'w-28',
      cell: (f) => {
        const mObj = featureMetrics[f.name] || { status: 'Planned' };
        return (
          <span className={clsx(
            "st-badge text-[10px]",
            mObj.status === 'Done' ? "st-completed" : mObj.status === 'At Risk' ? "st-blocked" : mObj.status === 'Active' ? "st-in-progress" : "st-scheduled"
          )}>
            <span className="dot" />
            <span>{mObj.status}</span>
          </span>
        );
      }
    },
    {
      id: 'release',
      header: 'Release',
      headerTitle: 'Target release milestone',
      width: 'w-24',
      cell: (f) => (
        <span className="font-mono text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
          {f.release || '—'}
        </span>
      )
    },
    {
      id: 'category',
      header: 'Category',
      headerTitle: 'Functional architectural domain category',
      width: 'w-28',
      cell: (f) => (
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px] border border-indigo-500/20 whitespace-nowrap inline-block">
          {f.category || 'General'}
        </span>
      )
    },
    {
      id: 'maturation',
      header: 'Maturation',
      headerTitle: 'Backlog completion percentage across mapped tasks',
      width: 'w-36',
      cell: (f) => {
        const mObj = featureMetrics[f.name] || { avgProg: 0, doneTasks: 0, totTasks: 0 };
        return (
          <div className="flex items-center gap-2 whitespace-nowrap">
            <div className="h-1.5 w-16 bg-[var(--color-surface-2)] rounded-full overflow-hidden border border-[var(--color-divider)]/40 shadow-inner">
              <div 
                className={clsx(
                  "h-full rounded-full transition-all",
                  mObj.avgProg >= 100 ? "bg-emerald-500" : mObj.avgProg >= 40 ? "bg-cyan-500" : "bg-amber-500"
                )} 
                style={{ width: `${mObj.avgProg}%` }} 
              />
            </div>
            <span className="font-bold font-mono text-[11px]">{mObj.avgProg}%</span>
            <span className="text-[10px] text-[var(--color-text-faint)] font-mono">({mObj.doneTasks}/{mObj.totTasks})</span>
          </div>
        );
      }
    },
    {
      id: 'screens',
      header: 'Mapped Screens',
      headerTitle: 'Total count of GUI screen views implementing this capability',
      width: 'w-36',
      cell: (f) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <span className="font-bold font-mono text-xs">{f.screens.length}</span>
          <span className="text-[11px] text-[var(--color-text-muted)]">screens</span>
          {f.screens.length > 0 && (
            <span className="text-[10px] text-[var(--color-text-faint)] truncate max-w-[120px]">
              ({f.screens.slice(0, 2).join(', ')}{f.screens.length > 2 ? '...' : ''})
            </span>
          )}
        </div>
      )
    },
    {
      id: 'modules',
      header: 'Impacted Modules',
      headerTitle: 'Software components and modules impacted',
      width: 'w-36',
      cell: (f) => {
        const mObj = featureMetrics[f.name] || { impactedModules: [] };
        return (
          <span className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[160px] whitespace-nowrap block" title={mObj.impactedModules.join(', ')}>
            {mObj.impactedModules.join(', ') || '—'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      width: 'w-20',
      align: 'center',
      cell: (f) => {
        const actualIdx = features.indexOf(f);
        return (
          <div className="flex items-center justify-center gap-1 whitespace-nowrap" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => startEdit(actualIdx)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              title="Edit"
              aria-label="Edit feature"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => removeFeature(actualIdx)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
              title="Delete"
              aria-label="Delete feature"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], [features, featureMetrics]);

  // ── 5. Feature Action Handlers ──
  const handleAddFeature = () => {
    const newFeature: Feature = {
      name: 'New Strategic Feature',
      desc: 'Define the architectural scope and user journey goals here.',
      screens: [],
      release: 'v1.0.0',
      category: 'Core Platform'
    };
    updateProject({ features: [...features, newFeature] });
    setEditingIdx(features.length);
    setEditForm(newFeature);
  };

  const removeFeature = (idx: number) => {
    if (confirm(`Permanently remove "${features[idx].name}" from the matrix?`)) {
      const newFeatures = features.filter((_, i) => i !== idx);
      updateProject({ features: newFeatures });
    }
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...features[idx] });
    setNewScreenInput('');
  };

  const saveEdit = () => {
    if (editingIdx === null || !editForm) return;
    const newFeatures = [...features];
    newFeatures[editingIdx] = editForm;
    updateProject({ features: newFeatures });
    setEditingIdx(null);
    setEditForm(null);
  };

  // Quick Map Unmapped Screen to Feature
  const handleAssignUnmappedScreen = (screenName: string, targetFeatureName: string) => {
    if (!targetFeatureName) return;
    const targetIdx = features.findIndex(f => f.name === targetFeatureName);
    if (targetIdx < 0) return;

    const target = features[targetIdx];
    if (target.screens.includes(screenName)) return;

    const updated = {
      ...target,
      screens: [...target.screens, screenName]
    };
    const newFeatures = [...features];
    newFeatures[targetIdx] = updated;
    updateProject({ features: newFeatures });
  };

  // Bundle All Unmapped Screens Into a New Feature
  const handleBundleUnmappedScreens = () => {
    if (!unmappedScreens.length) return;
    const bundledFeature: Feature = {
      name: 'Interface Extension Node',
      desc: `Auto-bundled strategic node mapping ${unmappedScreens.length} unassigned interface screens.`,
      screens: [...unmappedScreens],
      release: 'v1.1.0',
      category: 'UI/UX Polish'
    };
    updateProject({ features: [...features, bundledFeature] });
    setShowCoverageAudit(false);
  };

  // ── 6. Auto-Build Feature Matrix Algorithm (Matches projectpulse.html) ──
  const handleOpenAutoBuild = () => {
    // Group all discovered screens by module and stem tokens
    const stopWords = new Set(['screen', 'view', 'page', 'modal', 'form', 'ui', 'tab', 'component', 'dialog', 'popup', 'panel', 'widget', 'list', 'details', 'overview', 'manage', 'management', 'settings', 'setting', 'edit', 'create', 'add', 'new', 'v1', 'v2', 'the', 'a', 'and', 'for', 'to', 'module']);
    
    // Group screens by primary module
    const moduleBuckets: Record<string, string[]> = {};
    allScreens.forEach(sc => {
      const mod = screenModuleMap[sc] || 'General';
      if (!moduleBuckets[mod]) moduleBuckets[mod] = [];
      moduleBuckets[mod].push(sc);
    });

    const candidates: { name: string; desc: string; screens: string[]; module: string; selected: boolean }[] = [];

    Object.entries(moduleBuckets).forEach(([mod, screens]) => {
      if (screens.length <= 4) {
        candidates.push({
          name: `${mod} Workflow & Capabilities`,
          desc: `Strategic functional capability covering ${screens.length} key workflow interfaces in ${mod}.`,
          screens: [...screens],
          module: mod,
          selected: true
        });
      } else {
        // Split into chunks of 3-4
        for (let i = 0; i < screens.length; i += 4) {
          const chunk = screens.slice(i, i + 4);
          const chunkIndex = Math.floor(i / 4) + 1;
          candidates.push({
            name: `${mod} Part ${chunkIndex}`,
            desc: `Architectural feature node mapping interface screens ${i + 1}-${Math.min(i + 4, screens.length)} across ${mod}.`,
            screens: chunk,
            module: mod,
            selected: true
          });
        }
      }
    });

    setAutoBuildCandidates(candidates);
    setIsAutoBuildOpen(true);
  };

  const handleApplyAutoBuild = () => {
    const selected = autoBuildCandidates.filter(c => c.selected);
    if (!selected.length) return;

    const newFeatures: Feature[] = selected.map(c => ({
      name: c.name,
      desc: c.desc,
      screens: c.screens,
      release: 'v1.0.0',
      category: c.module
    }));

    updateProject({ features: newFeatures });
    setIsAutoBuildOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* ── 1. Page Header with Controls ── */}
      <PageHeader
        icon={Layers}
        title="Functional Matrix & Architecture"
        subtitle={`${totalFeatures} Strategic Capabilities • ${mappedScreens.length}/${allScreens.length} Screens Mapped • ${coveragePct}% Architecture Coverage`}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-full flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
              <button
                onClick={() => setViewMode('matrix')}
                aria-label="Grid Matrix View"
                title="Grid Matrix Cards"
                className={clsx(
                  "px-2 sm:px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === 'matrix' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <LayoutGrid size={13} />
                <span className="hidden sm:inline">Matrix</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                aria-label="Tabular List View"
                title="Tabular List View"
                className={clsx(
                  "px-2 sm:px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === 'table' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Columns size={13} />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                aria-label="Timeline Gantt View"
                title="Timeline Gantt View"
                className={clsx(
                  "px-2 sm:px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === 'timeline' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <GanttChart size={13} />
                <span className="hidden sm:inline">Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('swimlane')}
                aria-label="Swimlane View"
                title="Swimlane Status View"
                className={clsx(
                  "px-2 sm:px-2.5 py-1 min-h-[32px] text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === 'swimlane' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Kanban size={13} />
                <span className="hidden sm:inline">Swimlane</span>
              </button>
            </div>

            {/* Auto-Build Button */}
            <button
              onClick={handleOpenAutoBuild}
              className="px-2.5 sm:px-3 py-1.5 min-h-[32px] rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/30 hover:bg-[var(--color-primary-hex)] hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="Automatically cluster screens and generate feature nodes"
            >
              <Wand2 size={13} />
              <span className="hidden sm:inline">Auto-Build</span>
            </button>

            {/* Screen Coverage Audit Toggle Button */}
            <button
              onClick={() => setShowCoverageAudit(!showCoverageAudit)}
              className={clsx(
                "px-2.5 sm:px-3 py-1.5 min-h-[32px] rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs",
                showCoverageAudit
                  ? "bg-[var(--color-surface-2)] border-[var(--color-primary-hex)] text-[var(--color-primary-hex)]"
                  : "bg-[var(--color-surface)] border-[var(--color-divider)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
              title="Toggle Screen Coverage Audit panel"
            >
              <ScanSearch size={13} className={coveragePct === 100 ? "text-emerald-500" : "text-amber-500"} />
              <span>Coverage</span>
              <span className={clsx(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                coveragePct === 100 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              )}>
                {coveragePct}%
              </span>
            </button>
          </div>
        }
        primaryAction={
          <Button variant="primary" size="sm" onClick={handleAddFeature} className="h-9 rounded-xl font-bold px-3 active:scale-95 shrink-0 text-xs shadow-xs">
            <Plus size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">New Feature</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      {/* ── 2. Screen Coverage Audit Drawer / Panel (ProjectPulse HTML Parity) ── */}
      <AnimatePresence>
        {showCoverageAudit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/90 backdrop-blur-md overflow-hidden shrink-0"
          >
            <div className="px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className={clsx(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs",
                    unmappedScreens.length === 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                  )}>
                    <ScanSearch size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[var(--color-text)] flex items-center gap-2">
                      <span>Screen Coverage Audit</span>
                      <span className={clsx(
                        "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
                        unmappedScreens.length === 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                      )}>
                        {coveragePct}% Covered ({mappedScreens.length} of {allScreens.length} mapped)
                      </span>
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {unmappedScreens.length === 0 
                        ? "100% of architectural screens are connected to strategic feature nodes."
                        : `${unmappedScreens.length} screen(s) remain unassigned to any strategic feature.`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unmappedScreens.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleBundleUnmappedScreens}
                      className="text-xs h-7.5 rounded-lg border-amber-500/30 text-amber-600 hover:bg-amber-500/10 font-bold"
                    >
                      Bundle All Into New Feature
                    </Button>
                  )}
                  <button 
                    onClick={() => setShowCoverageAudit(false)}
                    className="p-1 hover:bg-[var(--color-surface)] rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] cursor-pointer"
                    aria-label="Close Coverage Audit"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Unmapped Screens Grid */}
              {unmappedScreens.length > 0 ? (
                <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                    Unassigned Interface Windows & Screens:
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scroll">
                    {unmappedScreens.map((s) => (
                      <div 
                        key={s} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)] border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold"
                      >
                        <Monitor size={12} className="text-amber-500 shrink-0" />
                        <span>{s}</span>
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleAssignUnmappedScreen(s, e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                          aria-label={`Assign ${s} to feature`}
                          className="bg-transparent text-[10px] font-bold text-[var(--color-primary-hex)] underline cursor-pointer outline-none ml-1"
                        >
                          <option value="" disabled>Map to...</option>
                          {features.map(f => (
                            <option key={f.name} value={f.name}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Operational KPI Banner & Toolbar ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 bg-[var(--color-surface)] border-b border-[var(--color-divider)] space-y-3 shrink-0">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">Features</span>
            <span className="font-mono font-bold text-sm text-[var(--color-text)]">{totalFeatures}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">Mapped Screens</span>
            <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">{mappedScreens.length} / {allScreens.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">Avg Maturation</span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{avgMaturity}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">At Risk</span>
            <span className={clsx("font-mono font-bold text-sm", totalAtRisk > 0 ? "text-rose-500" : "text-emerald-500")}>
              {totalAtRisk}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input 
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] transition-colors"
                placeholder="Search features, screens, goals..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Complexity Filter */}
            <select
              value={complexityFilter}
              onChange={e => setComplexityFilter(e.target.value as ComplexityFilter)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] outline-none cursor-pointer"
            >
              <option value="all">All Complexity</option>
              <option value="simple">Simple (0-2 screens)</option>
              <option value="moderate">Moderate (3-5 screens)</option>
              <option value="complex">Complex (6+ screens)</option>
            </select>

            {/* Module Filter */}
            {allModules.length > 0 && (
              <select
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] outline-none cursor-pointer"
              >
                <option value="all">All Modules</option>
                {allModules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="Active">Active</option>
              <option value="Done">Done</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Showing <strong>{filteredFeatures.length}</strong> of {totalFeatures} nodes
            </span>
          </div>
        </div>
      </div>

      {/* ── 4. Main Workspace Display Modes ── */}
      <div className={clsx(
        "flex-1 min-w-0",
        viewMode === 'timeline' || viewMode === 'swimlane'
          ? "flex flex-col min-h-0 overflow-hidden"
          : "overflow-auto custom-scroll p-4 sm:p-6 lg:p-8"
      )}>
        {/* ── VIEW MODE 1: GRID MATRIX CARDS (Matches projectpulse.html) ── */}
        {viewMode === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-flow-dense gap-5 sm:gap-6 items-stretch">
            {filteredFeatures.map((f, idx) => {
              const actualIdx = features.indexOf(f);
              const mObj = featureMetrics[f.name] || {
                totTasks: 0,
                doneTasks: 0,
                avgProg: 0,
                overdueTasks: 0,
                status: 'Planned',
                minDate: null,
                maxDate: null,
                impactedModules: [],
                screensByModule: {}
              };

              const healthColor = mObj.overdueTasks > 0 ? "border-l-rose-500" : mObj.avgProg === 100 ? "border-l-emerald-500" : mObj.avgProg > 30 ? "border-l-cyan-500" : "border-l-amber-500";
              const accentBadgeBg = mObj.overdueTasks > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : mObj.avgProg === 100 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : mObj.avgProg > 30 ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

              return (
                <div 
                  key={f.name + idx}
                  className={clsx(
                    "card-glass border-l-4 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col relative overflow-hidden group",
                    healthColor
                  )}
                >
                  <div className="p-5 sm:p-6 flex-1 flex flex-col space-y-4">
                    {/* Top Row: Index avatar, Title, and Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-center font-mono font-bold text-xs text-[var(--color-primary-hex)] shrink-0">
                          {String(actualIdx + 1).padStart(2, '0')}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm sm:text-base text-[var(--color-text)] tracking-tight leading-tight truncate">
                            {f.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {/* Status badge */}
                            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1", accentBadgeBg)}>
                              {mObj.status === 'At Risk' ? <AlertTriangle size={10} /> : mObj.status === 'Done' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                              <span>{mObj.status}</span>
                            </span>

                            {f.release && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-muted)] inline-flex items-center gap-1">
                                <Flag size={9} />
                                <span>{f.release}</span>
                              </span>
                            )}

                            {f.category && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 inline-flex items-center gap-1">
                                <Tag size={9} />
                                <span>{f.category}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => startEdit(actualIdx)}
                          className="w-7 h-7 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit feature"
                          aria-label="Edit feature"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => removeFeature(actualIdx)}
                          className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete feature"
                          aria-label="Delete feature"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed min-h-[2.5rem]">
                      {f.desc || 'No strategic description defined.'}
                    </p>

                    {/* Progress Bar & Maturation */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--color-text)] flex items-center gap-1">
                          <span>{mObj.avgProg}% Maturation</span>
                        </span>
                        <span className="text-[11px] text-[var(--color-text-faint)] font-mono">
                          {mObj.doneTasks}/{mObj.totTasks} tasks done
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            mObj.overdueTasks > 0 ? "bg-rose-500" : mObj.avgProg === 100 ? "bg-emerald-500" : "bg-cyan-500"
                          )} 
                          style={{ width: `${mObj.avgProg}%` }} 
                        />
                      </div>
                    </div>

                    {/* Module-grouped Window / Screen Tags */}
                    <div className="mt-auto pt-3 border-t border-[var(--color-divider)] space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                        Mapped Interfaces & Screens:
                      </span>
                      {Object.keys(mObj.screensByModule).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(mObj.screensByModule).map(([modName, screensList]) => (
                            <div key={modName} className="p-2 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] space-y-1.5">
                              <div className="flex items-center justify-between text-[10px] font-bold text-[var(--color-text-muted)]">
                                <span className="flex items-center gap-1">
                                  <Layers size={10} className="text-[var(--color-primary-hex)]" />
                                  <span>{modName}</span>
                                </span>
                                <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-surface)] text-[var(--color-text-faint)] font-mono">
                                  {screensList.length}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {screensList.map(s => (
                                  <span 
                                    key={s} 
                                    className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] text-[11px] font-medium text-[var(--color-text)] flex items-center gap-1"
                                  >
                                    <Monitor size={10} className="text-[var(--color-text-faint)]" />
                                    <span>{s}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center bg-[var(--color-surface-2)] rounded-xl border border-dashed border-[var(--color-divider)] text-[11px] text-[var(--color-text-faint)] italic">
                          No screens mapped yet. Click Edit to map interfaces.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Strip */}
                  <div className="px-5 py-2.5 bg-[var(--color-surface-2)]/60 border-t border-[var(--color-divider)] flex items-center justify-between text-xs">
                    <button 
                      onClick={() => setSelectedFeature(f)}
                      className="font-bold text-[var(--color-primary-hex)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Details</span>
                      <ChevronRight size={13} />
                    </button>
                    <span className={clsx(
                      "text-[10px] font-bold font-mono",
                      mObj.overdueTasks > 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {mObj.overdueTasks > 0 ? `${mObj.overdueTasks} Overdue` : 'On Track'}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredFeatures.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-[var(--color-divider)] rounded-3xl p-8 bg-[var(--color-surface)]">
                <Map size={48} className="mx-auto text-[var(--color-text-faint)] opacity-40 mb-3" />
                <h3 className="font-extrabold text-base text-[var(--color-text)]">No Features Match Filters</h3>
                <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1">
                  Adjust your search terms or complexity filters, or auto-generate features from unmapped screens.
                </p>
                <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setComplexityFilter('all'); setSelectedModule('all'); setSelectedStatus('all'); }} className="mt-4 font-bold">
                  Reset All Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW MODE 2: TABULAR LIST (Powered by generic DataTable) ── */}
        {viewMode === 'table' && (
          <DataTable<Feature>
            data={filteredFeatures}
            columns={columns}
            keyField="name"
            showRowNumbers
            pagination={pagination}
            itemLabel="features"
            onRowClick={(f) => setSelectedFeature(f)}
            rowClassName={(f) => {
              const mObj = featureMetrics[f.name];
              return (mObj && mObj.overdueTasks > 0) ? "is-overdue bg-rose-500/[0.02]" : "";
            }}
          />
        )}

        {/* ── VIEW MODE 3: TIMELINE GANTT VIEW (Matches projectpulse.html) ── */}
        {viewMode === 'timeline' && (
          <FeatureTimelineChart
            features={filteredFeatures}
            allFeatures={features}
            tasks={state.tasks}
            releases={state.releases || []}
            members={state.members || []}
            featureMetrics={featureMetrics}
            screenTasksMap={screenTasksMap}
            onSelectFeature={(f) => {
              setSelectedFeature(f);
            }}
          />
        )}

        {/* ── VIEW MODE 4: SWIMLANE STATUS VIEW (Matches projectpulse.html) ── */}
        {viewMode === 'swimlane' && (
          <FeatureSwimlaneChart
            features={filteredFeatures}
            allFeatures={features}
            tasks={state.tasks}
            releases={state.releases || []}
            members={state.members || []}
            featureMetrics={featureMetrics}
            screenTasksMap={screenTasksMap}
            onSelectFeature={(f) => {
              setSelectedFeature(f);
            }}
          />
        )}
      </div>

      {/* ── 5. Auto-Build Feature Matrix Modal (Matches projectpulse.html) ── */}
      {isAutoBuildOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center font-bold">
                  <Wand2 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text)]">Auto-Build Feature Matrix</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Algorithmically clustered features derived from screen tokens and module releases</p>
                </div>
              </div>
              <button onClick={() => setIsAutoBuildOpen(false)} className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 custom-scroll text-xs">
              <div className="p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] flex items-center justify-between">
                <span>Select which feature clusters you want to generate:</span>
                <span className="font-bold text-[var(--color-primary-hex)]">
                  {autoBuildCandidates.filter(c => c.selected).length} selected
                </span>
              </div>

              {autoBuildCandidates.map((cand, ci) => (
                <div 
                  key={ci}
                  onClick={() => {
                    const next = [...autoBuildCandidates];
                    next[ci].selected = !next[ci].selected;
                    setAutoBuildCandidates(next);
                  }}
                  className={clsx(
                    "p-3.5 rounded-xl border transition-all cursor-pointer space-y-2",
                    cand.selected ? "bg-[var(--color-primary-highlight-hex)]/30 border-[var(--color-primary-hex)]" : "bg-[var(--color-surface)] border-[var(--color-divider)] opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={cand.selected} 
                        onChange={() => {}} 
                        className="rounded border-[var(--color-divider)] cursor-pointer" 
                      />
                      <h4 className="font-bold text-xs text-[var(--color-text)]">{cand.name}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-divider)] text-[10px] font-semibold text-[var(--color-text-muted)]">
                      {cand.module} ({cand.screens.length} screens)
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] pl-6">{cand.desc}</p>
                  <div className="flex flex-wrap gap-1 pl-6">
                    {cand.screens.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-[var(--color-surface)] text-[10px] font-medium border border-[var(--color-divider)]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[var(--color-surface-2)] border-t border-[var(--color-divider)] flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAutoBuildOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleApplyAutoBuild} className="font-bold">
                Apply Generated Features to Matrix
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Feature Detail Inspector Drawer ── */}
      {selectedFeature && (
        <div className="fixed inset-0 z-[110] flex motion-safe:animate-in motion-safe:fade-in duration-200">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedFeature(null)} />
          <div className="ml-auto w-full max-w-xl bg-[var(--color-surface)] h-full relative shadow-2xl flex flex-col border-l border-[var(--color-divider)]">
            <div className="p-6 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">Strategic Feature Node</span>
                <h2 className="text-xl font-black text-[var(--color-text)] tracking-tight">{selectedFeature.name}</h2>
              </div>
              <button onClick={() => setSelectedFeature(null)} className="p-2 text-[var(--color-text-faint)] hover:text-[var(--color-text)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scroll space-y-6 text-xs">
              <section className="space-y-2">
                <h4 className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px]">Strategic Purpose</h4>
                <p className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border-l-4 border-[var(--color-primary-hex)] text-xs text-[var(--color-text)] leading-relaxed italic">
                  “{selectedFeature.desc || 'No strategic description defined.'}”
                </p>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px]">Mapped Target Interfaces ({selectedFeature.screens.length})</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFeature.screens.map((s, si) => (
                    <div key={si} className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] flex items-center justify-center font-bold text-[10px] text-[var(--color-primary-hex)] border border-[var(--color-divider)]">
                        {si + 1}
                      </div>
                      <span className="font-bold text-[var(--color-text)] truncate">{s}</span>
                    </div>
                  ))}
                  {selectedFeature.screens.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-[var(--color-text-faint)] border border-dashed border-[var(--color-divider)] rounded-xl">
                      No interface screens mapped.
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px]">Linked Technical Tasks</h4>
                <div className="space-y-2">
                  {state.tasks.filter(t => t.module === selectedFeature.name || selectedFeature.screens.includes(t.name) || (t.subtasks && t.subtasks.some(st => selectedFeature.screens.includes(st.name)))).map(t => (
                    <div key={t.id} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-[var(--color-primary-hex)]">{t.id}</span>
                          <span className="font-bold text-xs">{t.name}</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">Due: {t.dueDate} • Assignee: {t.assignee}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400">{t.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="p-4 bg-[var(--color-surface-2)] border-t border-[var(--color-divider)] flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedFeature(null)}>Close</Button>
              <Button 
                variant="primary" 
                size="sm" 
                className="font-bold"
                onClick={() => {
                  const targetIdx = features.findIndex(f => f.name === selectedFeature.name);
                  setSelectedFeature(null);
                  if (targetIdx >= 0) startEdit(targetIdx);
                }}
              >
                Edit Feature Definition
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Edit / Create Feature Modal ── */}
      {editForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--color-divider)] flex justify-between items-center bg-[var(--color-surface-2)]">
              <h3 className="text-base font-extrabold text-[var(--color-text)]">
                {editingIdx !== null && editingIdx < features.length ? 'Edit Strategic Feature' : 'Create Strategic Feature'}
              </h3>
              <button onClick={() => setEditForm(null)} className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[var(--color-text-muted)] block mb-1">Feature Name</label>
                <input 
                  className="w-full px-3 py-2 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-[var(--color-text-muted)] block mb-1">Strategic Description / Scope</label>
                <textarea 
                  rows={3}
                  className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] resize-none"
                  value={editForm.desc}
                  onChange={e => setEditForm({ ...editForm, desc: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[var(--color-text-muted)] block mb-1">Target Release</label>
                  <input 
                    className="w-full px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] font-mono"
                    value={editForm.release || ''}
                    placeholder="v1.0.0"
                    onChange={e => setEditForm({ ...editForm, release: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--color-text-muted)] block mb-1">Category / Domain</label>
                  <input 
                    className="w-full px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                    value={editForm.category || ''}
                    placeholder="Architecture"
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>
              </div>

              {/* Mapped Screens */}
              <div className="space-y-2">
                <label className="font-bold text-[var(--color-text-muted)] block">Mapped Interface Windows & Screens</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scroll p-2 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)]">
                  {editForm.screens.map((sc, sci) => (
                    <span key={sci} className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] text-[11px] font-semibold flex items-center gap-1">
                      <span>{sc}</span>
                      <button 
                        onClick={() => {
                          const next = editForm.screens.filter((_, i) => i !== sci);
                          setEditForm({ ...editForm, screens: next });
                        }}
                        className="text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {editForm.screens.length === 0 && (
                    <span className="text-[11px] text-[var(--color-text-faint)] italic">No screens assigned yet.</span>
                  )}
                </div>

                {/* Add Screen Input */}
                <div className="flex items-center gap-2">
                  <input 
                    className="flex-1 px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                    placeholder="Type or pick a screen to map..."
                    value={newScreenInput}
                    onChange={e => setNewScreenInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newScreenInput.trim()) {
                        e.preventDefault();
                        if (!editForm.screens.includes(newScreenInput.trim())) {
                          setEditForm({ ...editForm, screens: [...editForm.screens, newScreenInput.trim()] });
                        }
                        setNewScreenInput('');
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7.5 rounded-lg"
                    onClick={() => {
                      if (newScreenInput.trim() && !editForm.screens.includes(newScreenInput.trim())) {
                        setEditForm({ ...editForm, screens: [...editForm.screens, newScreenInput.trim()] });
                        setNewScreenInput('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[var(--color-surface-2)] border-t border-[var(--color-divider)] flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditForm(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveEdit} className="font-bold">Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunctionalMatrix;
