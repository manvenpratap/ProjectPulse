import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  Layers, 
  Plus, 
  Search, 
  Map as MapIcon, 
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
  AlertCircle,
  Sparkles,
  ListChecks,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import SectionHelpButton from '../shared/SectionHelpButton';
import CollapsibleSummaryStrip from '../shared/CollapsibleSummaryStrip';
import TablePagination, { usePagination } from '../shared/TablePagination';
import DataTable, { ColumnDef, DensityMode } from '../shared/DataTable';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import { toast } from '../../utils/toast';
import clsx from 'clsx';
import { Feature, Task, TaskStatus } from '../../types';
import { daysDiff, fmtDate, todayStr } from '../../utils/projectUtils';
import { motion, AnimatePresence } from 'motion/react';
import FeatureTimelineChart from './FeatureTimelineChart';
import FeatureSwimlaneChart from './FeatureSwimlaneChart';
import { MotionPage, StaggerContainer, StaggerItem } from '../shared/MotionPage';
import { AnimatedMetric } from '../shared/AnimatedMetric';

type ViewMode = 'matrix' | 'table' | 'timeline' | 'swimlane';
type ComplexityFilter = 'all' | 'simple' | 'moderate' | 'complex';

// ── Intelligence & Auto-Inference Constants & Algorithms (HTML Reference Parity) ──
const FEAT_STOP_WORDS = new Set([
  'screen', 'view', 'page', 'modal', 'form', 'ui', 'tab', 'component',
  'dialog', 'popup', 'panel', 'widget', 'list', 'details', 'overview',
  'manage', 'management', 'settings', 'setting', 'edit', 'create', 'add',
  'new', 'v1', 'v2', 'the', 'a', 'and', 'for', 'to', 'module'
]);

function featTokenise(str: string): string[] {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !FEAT_STOP_WORDS.has(t));
}

function inferFeatureCategory(name: string, desc: string = ''): string {
  const text = `${name || ''} ${desc || ''}`.toLowerCase();
  if (/\b(governance|compliance|audit|aml|kyc|tax|regulatory|sanction|sanctions|forensic|forensics)\b/.test(text)) return 'Compliance';
  if (/\b(risk|var|margin|collateral|credit|underwriting)\b/.test(text)) return 'Risk Management';
  if (/\b(rebalance|rebalancing|portfolio)\b/.test(text)) return 'Portfolio Management';
  if (/\b(crypto|token|tokenization|smart contract|blockchain|liquidity pool|yield|staking)\b/.test(text)) return 'Digital Assets';
  if (/\b(billing|invoice|invoicing|fee|commission|rebate)\b/.test(text)) return 'Billing';
  if (/\b(payment|payments|remittance|wire|currency|fx|sepa|swift)\b/.test(text)) return 'Payments';
  if (/\b(market data|ticker|orderbook|market intelligence)\b/.test(text)) return 'Market Data';
  if (/\b(order|orders|trade|trading|trades|matching|execution|lending|borrowing|bond|bonds|derivative|derivatives|option|options|algo)\b/.test(text)) return 'Trading';
  if (/\b(analytics|analytic|dashboard|intelligence|chart|sunburst|etl|bi|reporting|kpi|metric)\b/.test(text)) return 'Analytics';
  if (/\b(auth|authentication|oauth|sso|security|mfa|permission|rbac|identity)\b/.test(text)) return 'Security & Auth';
  if (/\b(architecture|infrastructure|gateway|api|pipeline|microservice|cluster|cache)\b/.test(text)) return 'Architecture';
  return 'Core Platform';
}

function inferTargetRelease(
  selectedScreens: string[],
  screenTasksMap: Record<string, Task[]>,
  releases: { name: string }[]
): string | null {
  if (!selectedScreens.length) return null;

  const releaseOrderMap = new Map<string, number>();
  releases.forEach((r, idx) => {
    if (r.name) releaseOrderMap.set(r.name.trim(), idx);
  });

  let bestIdx = -1;
  let bestRelease = '';

  selectedScreens.forEach(scName => {
    const parentTasks = screenTasksMap[scName] || [];
    parentTasks.forEach(t => {
      const rv = (t.release || (t as any).releaseVersion || '').trim();
      if (!rv) return;
      if (releaseOrderMap.has(rv)) {
        const ord = releaseOrderMap.get(rv)!;
        if (ord > bestIdx) {
          bestIdx = ord;
          bestRelease = rv;
        }
      } else if (!bestRelease) {
        bestRelease = rv;
      }
    });
  });

  return bestRelease || null;
}

function computeScreenSuggestions(
  featName: string,
  selectedScreens: string[],
  allScreens: string[],
  screenModuleMap: Record<string, string>
): { name: string; module: string; score: number }[] {
  const selectedSet = new Set(selectedScreens);
  const refTokens = new Set<string>(featTokenise(featName));
  selectedScreens.forEach(s => featTokenise(s).forEach(t => refTokens.add(t)));

  if (refTokens.size === 0) return [];

  const scored: { name: string; module: string; score: number }[] = [];
  allScreens.forEach(s => {
    if (selectedSet.has(s)) return;
    const mod = screenModuleMap[s] || '';
    const sTokens = [...featTokenise(s), ...featTokenise(mod)];
    let overlap = 0;
    sTokens.forEach(t => {
      if (refTokens.has(t)) overlap++;
    });
    if (overlap >= 1) {
      scored.push({ name: s, module: mod, score: overlap });
    }
  });

  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.slice(0, 8);
}

const STANDARD_CATEGORIES = [
  'Core Platform',
  'Architecture',
  'Trading',
  'Risk Management',
  'Compliance',
  'Portfolio Management',
  'Analytics',
  'Billing',
  'Payments',
  'Market Data',
  'Security & Auth',
  'Digital Assets',
  'UI/UX Polish'
];

type FeaturePreset = 'all' | 'active' | 'at_risk' | 'matured' | 'planned' | 'complex' | 'unmapped';

export const FunctionalMatrix: React.FC = () => {
  const { state, updateProject, setView } = useProject();
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [searchTerm, setSearchTerm] = useState('');
  const [complexityFilter, setComplexityFilter] = useState<ComplexityFilter>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activePreset, setActivePreset] = useState<FeaturePreset>('all');
  
  // Batch Operations State
  const [selectedFeatureNames, setSelectedFeatureNames] = useState<Set<string>>(new Set());
  const [batchRelease, setBatchRelease] = useState<string>('');
  const [batchCategory, setBatchCategory] = useState<string>('');

  // Inline Editing & Dropdown Jump Menu State
  const [editingField, setEditingField] = useState<{ name: string; field: 'name' | 'desc' } | null>(null);
  const [editingVal, setEditingVal] = useState<string>('');
  const [categoryMenuFeatureName, setCategoryMenuFeatureName] = useState<string | null>(null);
  const [releaseMenuFeatureName, setReleaseMenuFeatureName] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Coverage Audit Panel Toggle & Maps
  const [showCoverageAudit, setShowCoverageAudit] = useState(false);
  const [unmappedTargetFeature, setUnmappedTargetFeature] = useState<string>('');
  const [batchAssignMap, setBatchAssignMap] = useState<Record<string, string>>({});
  const [screenAssignMap, setScreenAssignMap] = useState<Record<string, string>>({});

  // Auto-Build Modal
  const [isAutoBuildOpen, setIsAutoBuildOpen] = useState(false);
  const [autoBuildCandidates, setAutoBuildCandidates] = useState<{ name: string; desc: string; screens: string[]; module: string; selected: boolean }[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Edit / Details Modal State & Auto-Inference Guards (HTML Parity)
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Feature | null>(null);
  const [newScreenInput, setNewScreenInput] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [releaseUserSet, setReleaseUserSet] = useState(false);
  const [categoryUserSet, setCategoryUserSet] = useState(false);
  const [releaseAutoInferred, setReleaseAutoInferred] = useState(false);
  const [categoryAutoInferred, setCategoryAutoInferred] = useState(false);
  const [screenSearchQuery, setScreenSearchQuery] = useState('');
  const [screenPickerModule, setScreenPickerModule] = useState<string>('all');

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

  // ── Group unmapped screens by module (HTML Parity: unmappedByModule) ──
  const unmappedByModule = useMemo(() => {
    const map: Record<string, string[]> = {};
    unmappedScreens.forEach(scName => {
      const mod = screenModuleMap[scName] || 'General';
      if (!map[mod]) map[mod] = [];
      map[mod].push(scName);
    });
    Object.keys(map).forEach(k => map[k].sort());
    return map;
  }, [unmappedScreens, screenModuleMap]);

  const sortedUnmappedModules = useMemo(() => {
    return Object.keys(unmappedByModule).sort((a, b) => a.localeCompare(b));
  }, [unmappedByModule]);

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

  // ── Quick Filter Presets & Counts ──
  const presetCounts = useMemo(() => {
    const counts = {
      all: features.length,
      active: 0,
      at_risk: 0,
      matured: 0,
      planned: 0,
      complex: 0,
      unmapped: 0,
    };

    features.forEach(f => {
      const mObj = featureMetrics[f.name];
      const screenCount = (f.screens || []).length;
      if (mObj?.status === 'Active') counts.active++;
      if (mObj && (mObj.overdueTasks > 0 || mObj.status === 'At Risk')) counts.at_risk++;
      if (mObj && (mObj.avgProg === 100 || mObj.status === 'Done')) counts.matured++;
      if (mObj?.status === 'Planned') counts.planned++;
      if (screenCount >= 6) counts.complex++;
      if (screenCount === 0) counts.unmapped++;
    });

    return counts;
  }, [features, featureMetrics]);

  const PRESETS: { id: FeaturePreset; label: string; count: number }[] = useMemo(() => [
    { id: 'all', label: 'All Features', count: presetCounts.all },
    { id: 'active', label: 'Active', count: presetCounts.active },
    { id: 'at_risk', label: 'At Risk', count: presetCounts.at_risk },
    { id: 'matured', label: 'Fully Matured', count: presetCounts.matured },
    { id: 'planned', label: 'Planned', count: presetCounts.planned },
    { id: 'complex', label: 'Complex (6+)', count: presetCounts.complex },
    { id: 'unmapped', label: 'Unmapped Screens', count: presetCounts.unmapped },
  ], [presetCounts]);

  const handlePresetClick = (preset: FeaturePreset) => {
    setActivePreset(preset);
  };

  const hasActiveFilters = activePreset !== 'all' || searchTerm !== '' || complexityFilter !== 'all' || selectedModule !== 'all' || selectedStatus !== 'all';

  const resetAllFilters = () => {
    setActivePreset('all');
    setSearchTerm('');
    setComplexityFilter('all');
    setSelectedModule('all');
    setSelectedStatus('all');
  };

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

      // Preset Filtering
      if (activePreset === 'active' && featureMetrics[f.name]?.status !== 'Active') return false;
      if (activePreset === 'at_risk' && !(featureMetrics[f.name]?.overdueTasks > 0 || featureMetrics[f.name]?.status === 'At Risk')) return false;
      if (activePreset === 'matured' && !(featureMetrics[f.name]?.avgProg === 100 || featureMetrics[f.name]?.status === 'Done')) return false;
      if (activePreset === 'planned' && featureMetrics[f.name]?.status !== 'Planned') return false;
      if (activePreset === 'complex' && (f.screens || []).length < 6) return false;
      if (activePreset === 'unmapped' && (f.screens || []).length > 0) return false;

      return true;
    });
  }, [features, searchTerm, complexityFilter, selectedModule, selectedStatus, activePreset, featureMetrics]);

  const pagination = usePagination<Feature>(filteredFeatures, 10, 'pp_page_size_features');

  // ── Options and Dropdown Data for Modal & Filter ──
  const allCategoryOptions = useMemo(() => {
    const set = new Set<string>(STANDARD_CATEGORIES);
    features.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).sort();
  }, [features]);

  const allReleaseOptions = useMemo(() => {
    const list = (state.releases || []).map(r => r.name).filter(Boolean);
    if (list.length === 0) return ['v1.0.0', 'v1.1.0', 'v2.0.0'];
    return list;
  }, [state.releases]);

  // Peek Sequential Navigation
  const selectedFeatureIndex = useMemo(() => {
    if (!selectedFeature) return -1;
    return filteredFeatures.findIndex(f => f.name === selectedFeature.name);
  }, [filteredFeatures, selectedFeature]);

  const handlePrevFeature = () => {
    if (selectedFeatureIndex > 0) {
      setSelectedFeature(filteredFeatures[selectedFeatureIndex - 1]);
    }
  };

  const handleNextFeature = () => {
    if (selectedFeatureIndex >= 0 && selectedFeatureIndex < filteredFeatures.length - 1) {
      setSelectedFeature(filteredFeatures[selectedFeatureIndex + 1]);
    }
  };

  // Keyboard navigation & search focus listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === '[') {
        if (selectedFeature) handlePrevFeature();
      }
      if (e.key === ']') {
        if (selectedFeature) handleNextFeature();
      }
      if (e.key === 'Escape') {
        setEditingField(null);
        setCategoryMenuFeatureName(null);
        setReleaseMenuFeatureName(null);
        setSelectedFeature(null);
        setSelectedFeatureNames(new Set());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFeature, selectedFeatureIndex, filteredFeatures]);

  // Close menus on outside click
  useEffect(() => {
    if (!categoryMenuFeatureName && !releaseMenuFeatureName) return;
    const handleClickOutside = () => {
      setCategoryMenuFeatureName(null);
      setReleaseMenuFeatureName(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [categoryMenuFeatureName, releaseMenuFeatureName]);

  const handleCommitEdit = (targetName: string, field: 'name' | 'desc') => {
    if (!editingVal.trim() && field === 'name') {
      setEditingField(null);
      return;
    }
    const idx = features.findIndex(f => f.name === targetName);
    if (idx < 0) {
      setEditingField(null);
      return;
    }
    const newFeatures = [...features];
    newFeatures[idx] = {
      ...newFeatures[idx],
      [field]: editingVal.trim()
    };
    updateProject({ features: newFeatures });
    toast.success(`Updated feature ${field}`);
    setEditingField(null);
  };

  const handleSetFeatureCategory = (feat: Feature, category: string) => {
    const idx = features.findIndex(f => f.name === feat.name);
    if (idx < 0) return;
    const newFeatures = [...features];
    newFeatures[idx] = { ...newFeatures[idx], category };
    updateProject({ features: newFeatures });
    setCategoryMenuFeatureName(null);
    toast.success(`Category set to "${category}"`);
  };

  const handleSetFeatureRelease = (feat: Feature, release: string) => {
    const idx = features.findIndex(f => f.name === feat.name);
    if (idx < 0) return;
    const newFeatures = [...features];
    newFeatures[idx] = { ...newFeatures[idx], release };
    updateProject({ features: newFeatures });
    setReleaseMenuFeatureName(null);
    toast.success(`Release set to "${release}"`);
  };

  const handleToggleSelectAll = () => {
    if (selectedFeatureNames.size === filteredFeatures.length) {
      setSelectedFeatureNames(new Set());
    } else {
      setSelectedFeatureNames(new Set(filteredFeatures.map(f => f.name)));
    }
  };

  const handleToggleSelectFeature = (name: string) => {
    setSelectedFeatureNames(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleBatchApplyRelease = (rel: string) => {
    if (!rel || selectedFeatureNames.size === 0) return;
    const newFeatures = features.map(f => selectedFeatureNames.has(f.name) ? { ...f, release: rel } : f);
    updateProject({ features: newFeatures });
    toast.success(`Assigned ${selectedFeatureNames.size} feature(s) to release ${rel}`);
    setSelectedFeatureNames(new Set());
    setBatchRelease('');
  };

  const handleBatchApplyCategory = (cat: string) => {
    if (!cat || selectedFeatureNames.size === 0) return;
    const newFeatures = features.map(f => selectedFeatureNames.has(f.name) ? { ...f, category: cat } : f);
    updateProject({ features: newFeatures });
    toast.success(`Assigned ${selectedFeatureNames.size} feature(s) to category ${cat}`);
    setSelectedFeatureNames(new Set());
    setBatchCategory('');
  };

  const handleBatchDelete = () => {
    if (selectedFeatureNames.size === 0) return;
    setConfirmState({
      isOpen: true,
      title: `Delete ${selectedFeatureNames.size} Features?`,
      message: `Are you sure you want to permanently remove ${selectedFeatureNames.size} features from the functional matrix? Constituent interface screens will become unmapped.`,
      onConfirm: () => {
        const newFeatures = features.filter(f => !selectedFeatureNames.has(f.name));
        updateProject({ features: newFeatures });
        toast.info(`Deleted ${selectedFeatureNames.size} features.`);
        setSelectedFeatureNames(new Set());
      }
    });
  };

  const columns = useMemo<ColumnDef<Feature>[]>(() => [
    {
      id: 'select',
      header: (
        <input
          type="checkbox"
          checked={filteredFeatures.length > 0 && selectedFeatureNames.size === filteredFeatures.length}
          onChange={handleToggleSelectAll}
          className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] focus:ring-0 cursor-pointer"
          aria-label="Select all features"
        />
      ),
      width: 'w-10',
      align: 'center',
      cell: (f) => (
        <input
          type="checkbox"
          checked={selectedFeatureNames.has(f.name)}
          onChange={() => handleToggleSelectFeature(f.name)}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] focus:ring-0 cursor-pointer"
          aria-label={`Select ${f.name}`}
        />
      )
    },
    {
      id: 'name',
      header: 'Feature Node',
      headerTitle: 'Strategic capability name and architectural scope (Double-click to inline edit)',
      width: 'min-w-[260px]',
      cell: (f) => {
        const isEditingName = editingField?.name === f.name && editingField?.field === 'name';
        return (
          <div className="flex flex-col min-w-0 max-w-[320px]">
            {isEditingName ? (
              <input
                autoFocus
                type="text"
                value={editingVal}
                onChange={(e) => setEditingVal(e.target.value)}
                onBlur={() => handleCommitEdit(f.name, 'name')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommitEdit(f.name, 'name');
                  if (e.key === 'Escape') setEditingField(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-1.5 py-0.5 bg-[var(--color-surface-2)] border border-[var(--color-primary-hex)] rounded text-xs font-bold text-[var(--color-text)] outline-none"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingField({ name: f.name, field: 'name' });
                  setEditingVal(f.name);
                }}
                className="font-bold text-xs text-[var(--color-text)] truncate hover:text-[var(--color-primary-hex)] cursor-pointer"
                title={`${f.name} (Double-click to edit)`}
              >
                {f.name}
              </span>
            )}
            {f.desc && (
              <span className="cell-secondary text-[10px] text-[var(--color-text-muted)] truncate" title={f.desc}>
                {f.desc}
              </span>
            )}
          </div>
        );
      }
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
      headerTitle: 'Target release milestone (Click to switch)',
      width: 'w-28',
      cell: (f) => {
        const isMenuOpen = releaseMenuFeatureName === f.name;
        return (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setReleaseMenuFeatureName(isMenuOpen ? null : f.name);
              }}
              className="font-mono text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] whitespace-nowrap inline-flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded hover:bg-[var(--color-surface-2)]"
              title="Click to change target release"
            >
              <span>{f.release || '—'}</span>
              <ChevronDown size={10} className="text-[var(--color-text-faint)]" />
            </button>
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1 w-32 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-xl z-50 py-1 text-xs"
              >
                {allReleaseOptions.map((rel) => (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => handleSetFeatureRelease(f, rel)}
                    className={clsx(
                      "w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-2)] flex items-center justify-between cursor-pointer font-mono",
                      f.release === rel ? "font-bold text-[var(--color-primary-hex)]" : "text-[var(--color-text)]"
                    )}
                  >
                    <span>{rel}</span>
                    {f.release === rel && <Check size={11} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
    },
    {
      id: 'category',
      header: 'Category',
      headerTitle: 'Functional architectural domain category (Click to switch)',
      width: 'w-32',
      cell: (f) => {
        const isMenuOpen = categoryMenuFeatureName === f.name;
        return (
          <div className="relative inline-block">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCategoryMenuFeatureName(isMenuOpen ? null : f.name);
              }}
              className="px-2 py-0.5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] font-semibold text-[10px] border border-[var(--color-primary-hex)]/20 hover:border-[var(--color-primary-hex)] whitespace-nowrap inline-flex items-center gap-1 cursor-pointer transition-colors"
              title="Click to change category"
            >
              <span>{f.category || 'General'}</span>
              <ChevronDown size={10} />
            </button>
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1 w-44 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto text-xs"
              >
                {STANDARD_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSetFeatureCategory(f, cat)}
                    className={clsx(
                      "w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-2)] flex items-center justify-between cursor-pointer",
                      f.category === cat ? "font-bold text-[var(--color-primary-hex)]" : "text-[var(--color-text)]"
                    )}
                  >
                    <span>{cat}</span>
                    {f.category === cat && <Check size={11} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
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
      width: 'w-24',
      align: 'center',
      cell: (f) => {
        const actualIdx = features.indexOf(f);
        return (
          <div className="flex items-center justify-center gap-1 whitespace-nowrap" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedFeature(f)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-primary-hex)] transition-colors cursor-pointer"
              title="Quick Peek Drawer"
              aria-label="Quick peek feature"
            >
              <ExternalLink size={13} />
            </button>
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
  ], [features, featureMetrics, filteredFeatures, selectedFeatureNames, editingField, editingVal, categoryMenuFeatureName, releaseMenuFeatureName, allReleaseOptions]);

  const availableScreenModules = useMemo(() => {
    const mods = new Set<string>();
    allScreens.forEach(sc => {
      mods.add(screenModuleMap[sc] || 'General');
    });
    return Array.from(mods).sort();
  }, [allScreens, screenModuleMap]);

  // Screen Suggestions for Modal (HTML Parity: computeScreenSuggestions)
  const screenSuggestions = useMemo(() => {
    if (!editForm) return [];
    return computeScreenSuggestions(editForm.name, editForm.screens, allScreens, screenModuleMap);
  }, [editForm?.name, editForm?.screens, allScreens, screenModuleMap]);

  // Candidate screens grouped by module for modal screen picker
  const candidateScreensByModule = useMemo(() => {
    if (!editForm) return {};
    const selectedSet = new Set(editForm.screens);
    const q = screenSearchQuery.toLowerCase().trim();
    const map: Record<string, string[]> = {};

    allScreens.forEach(sc => {
      if (selectedSet.has(sc)) return;
      const mod = screenModuleMap[sc] || 'General';
      if (q && !sc.toLowerCase().includes(q) && !mod.toLowerCase().includes(q)) {
        return;
      }
      if (screenPickerModule !== 'all' && mod !== screenPickerModule) {
        return;
      }
      if (!map[mod]) map[mod] = [];
      map[mod].push(sc);
    });

    Object.keys(map).forEach(k => map[k].sort());
    return map;
  }, [editForm?.screens, allScreens, screenModuleMap, screenSearchQuery, screenPickerModule]);

  // ── Modal Input Handlers with Auto-Inference ──
  const handleFeatureNameChange = (name: string) => {
    if (!editForm) return;
    const updated = { ...editForm, name };
    if (!categoryUserSet) {
      const inferredCat = inferFeatureCategory(name, updated.desc);
      updated.category = inferredCat;
      setCategoryAutoInferred(true);
    }
    setEditForm(updated);
  };

  const handleAddScreenToEditForm = (screenName: string) => {
    if (!editForm) return;
    const clean = screenName.trim();
    if (!clean || editForm.screens.includes(clean)) return;
    const nextScreens = [...editForm.screens, clean];
    const updated = { ...editForm, screens: nextScreens };
    if (!releaseUserSet) {
      const inferredRel = inferTargetRelease(nextScreens, screenTasksMap, state.releases || []);
      if (inferredRel) {
        updated.release = inferredRel;
        setReleaseAutoInferred(true);
      }
    }
    setEditForm(updated);
  };

  const handleRemoveScreenFromEditForm = (screenIndex: number) => {
    if (!editForm) return;
    const nextScreens = editForm.screens.filter((_, i) => i !== screenIndex);
    const updated = { ...editForm, screens: nextScreens };
    if (!releaseUserSet) {
      const inferredRel = inferTargetRelease(nextScreens, screenTasksMap, state.releases || []);
      if (inferredRel) {
        updated.release = inferredRel;
        setReleaseAutoInferred(true);
      } else if (nextScreens.length === 0) {
        updated.release = '';
        setReleaseAutoInferred(false);
      }
    }
    setEditForm(updated);
  };

  const handleClearAutoRelease = () => {
    setReleaseUserSet(true);
    setReleaseAutoInferred(false);
    if (editForm) {
      setEditForm({ ...editForm, release: '' });
    }
  };

  const handleClearAutoCategory = () => {
    setCategoryUserSet(true);
    setCategoryAutoInferred(false);
    if (editForm) {
      setEditForm({ ...editForm, category: '' });
    }
  };

  // ── 5. Feature Action Handlers ──
  const handleAddFeature = (initialScreens?: string[], defaultName?: string) => {
    const sc = initialScreens || [];
    const inferredRel = inferTargetRelease(sc, screenTasksMap, state.releases || []) || 'v1.0.0';
    const inferredCat = defaultName ? inferFeatureCategory(defaultName) : 'Core Platform';
    const newFeature: Feature = {
      name: defaultName || 'New Strategic Feature',
      desc: sc.length > 0 
        ? `Architectural feature node mapping ${sc.length} interface screen(s).` 
        : 'Define the architectural scope and user journey goals here.',
      screens: [...sc],
      release: inferredRel,
      category: inferredCat
    };
    setEditingIdx(features.length);
    setEditForm(newFeature);
    setReleaseUserSet(false);
    setCategoryUserSet(false);
    setReleaseAutoInferred(Boolean(sc.length && inferredRel));
    setCategoryAutoInferred(Boolean(defaultName && inferredCat));
    setNewScreenInput('');
    setScreenSearchQuery('');
  };

  const removeFeature = (idx: number) => {
    const featName = features[idx].name;
    setConfirmState({
      isOpen: true,
      title: 'Remove Feature from Matrix',
      message: `Permanently remove "${featName}" from the functional matrix? Constituent interface screens will become unmapped.`,
      onConfirm: () => {
        const newFeatures = features.filter((_, i) => i !== idx);
        updateProject({ features: newFeatures });
        toast.info(`Feature "${featName}" removed from matrix.`);
      }
    });
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditForm({ ...features[idx] });
    setNewScreenInput('');
    setScreenSearchQuery('');
    setReleaseUserSet(true);
    setCategoryUserSet(true);
    setReleaseAutoInferred(false);
    setCategoryAutoInferred(false);
  };

  const saveEdit = () => {
    if (editingIdx === null || !editForm) return;
    const cleanName = editForm.name.trim();
    if (!cleanName) {
      toast.warning('Please enter a feature name before saving.');
      return;
    }
    const finalFeature: Feature = {
      ...editForm,
      name: cleanName,
      screens: editForm.screens.map(s => s.trim()).filter(Boolean)
    };
    const newFeatures = [...features];
    if (editingIdx < features.length) {
      newFeatures[editingIdx] = finalFeature;
    } else {
      newFeatures.push(finalFeature);
    }
    updateProject({ features: newFeatures });
    toast.success(`Feature "${cleanName}" saved.`);
    setEditingIdx(null);
    setEditForm(null);
  };

  // Quick Map Unmapped Screen to Feature (or open Create Feature modal)
  const handleAssignUnmappedScreen = (screenName: string, targetFeatureName: string) => {
    if (!targetFeatureName) return;
    if (targetFeatureName === '__new__') {
      const mod = screenModuleMap[screenName] || 'General';
      handleAddFeature([screenName], `${screenName} Feature`);
      return;
    }

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

  // Batch Map all unmapped screens in a module to a feature (or open Create Feature modal)
  const handleBatchAssignModule = (modName: string) => {
    const targetVal = batchAssignMap[modName];
    if (!targetVal) {
      toast.warning('Please select a target feature from the dropdown first.');
      return;
    }
    const screensInMod = unmappedByModule[modName] || [];
    if (!screensInMod.length) return;

    if (targetVal === '__new__') {
      handleAddFeature(screensInMod, `${modName} Capabilities`);
      return;
    }

    const targetIdx = features.findIndex(f => f.name === targetVal);
    if (targetIdx < 0) return;

    const target = features[targetIdx];
    const existingScreens = new Set(target.screens || []);
    let addedCount = 0;
    screensInMod.forEach(s => {
      if (!existingScreens.has(s)) {
        existingScreens.add(s);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      const updated = { ...target, screens: Array.from(existingScreens) };
      const newFeatures = [...features];
      newFeatures[targetIdx] = updated;
      updateProject({ features: newFeatures });
      toast.success(`Mapped ${addedCount} screen(s) to ${target.name}.`);
    }
  };

  // Map single unmapped screen to a feature (or open Create Feature modal)
  const handleAssignScreen = (scName: string) => {
    const targetVal = screenAssignMap[scName];
    if (!targetVal) {
      toast.warning('Please select a target feature from the dropdown first.');
      return;
    }
    handleAssignUnmappedScreen(scName, targetVal);
  };

  // Bundle All Unmapped Screens Into a New Feature
  const handleBundleUnmappedScreens = () => {
    if (!unmappedScreens.length) return;
    handleAddFeature(unmappedScreens, 'Interface Extension Capabilities');
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
    <MotionPage className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* ── 1. Page Header with Controls ── */}
      <PageHeader
        icon={Layers}
        title="Functional Matrix & Architecture"
        subtitle={`${totalFeatures} Features • ${mappedScreens.length}/${allScreens.length} Screens (${coveragePct}%)`}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap md:flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl">
              <button
                onClick={() => setViewMode('matrix')}
                aria-label="Grid Matrix View"
                title="Grid Matrix Cards"
                className={clsx(
                  "px-2.5 py-1 min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-0 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer",
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
                  "px-2.5 py-1 min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-0 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer",
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
                  "px-2.5 py-1 min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-0 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer",
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
                  "px-2.5 py-1 min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-0 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer",
                  viewMode === 'swimlane' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Kanban size={13} />
                <span className="hidden sm:inline">Swimlane</span>
              </button>
            </div>

            {/* Table Density Switcher (Visible in Table View) */}
            {viewMode === 'table' && (
              <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={clsx(
                    "px-2.5 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    density === 'compact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                  )}
                  title="Compact Table Density"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={clsx(
                    "px-2.5 py-1 min-h-[28px] rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    density === 'comfortable' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-xs" : "text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                  )}
                  title="Comfortable Table Density"
                >
                  Comfortable
                </button>
              </div>
            )}

            {/* Auto-Build Button */}
            <button
              onClick={handleOpenAutoBuild}
              aria-label="Auto-Build features from unmapped screens"
              className="px-2.5 sm:px-3 py-1.5 min-h-[36px] min-w-[36px] sm:min-h-[32px] rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/30 hover:bg-[var(--color-primary-hex)] hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="Automatically cluster screens and generate feature nodes"
            >
              <Wand2 size={13} />
              <span className="hidden sm:inline">Auto-Build</span>
            </button>

            {/* Screen Coverage Audit Toggle Button */}
            <button
              onClick={() => setShowCoverageAudit(!showCoverageAudit)}
              className={clsx(
                "px-2.5 sm:px-3 py-1.5 min-h-[36px] sm:min-h-[32px] rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs",
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
          <Button variant="primary" size="sm" onClick={() => handleAddFeature()} className="h-9 rounded-xl font-bold px-3 active:scale-95 shrink-0 text-xs shadow-xs">
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
                      <SectionHelpButton view="features" section="Screen Coverage Audit" label="Screen Coverage Audit guide" size={13} />
                      <span className={clsx(
                        "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold",
                        unmappedScreens.length === 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                      )}>
                        {coveragePct}% Covered ({mappedScreens.length} of {allScreens.length} mapped)
                      </span>
                    </h3>
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

              {/* Module-Grouped Unmapped Screens (HTML Parity: unmappedByModule) */}
              {unmappedScreens.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scroll pr-1">
                  {sortedUnmappedModules.map(modLabel => {
                    const screensInMod = unmappedByModule[modLabel] || [];
                    const batchVal = batchAssignMap[modLabel] || '';
                    return (
                      <div 
                        key={modLabel}
                        className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl p-3.5 space-y-2.5 shadow-2xs"
                      >
                        {/* Module Card Header */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[var(--color-primary-hex)]/10 text-[var(--color-primary-hex)] flex items-center justify-center font-bold shrink-0">
                              <Layers size={13} />
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text)]">
                              {modLabel}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-muted)]">
                              {screensInMod.length} screen{screensInMod.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Batch Assign Controls for Module */}
                          <div className="flex items-center gap-1.5">
                            <select
                              value={batchVal}
                              onChange={(e) => setBatchAssignMap(prev => ({ ...prev, [modLabel]: e.target.value }))}
                              className="text-xs px-2.5 py-1 rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface-2)] text-[var(--color-text)] outline-none max-w-[180px] cursor-pointer"
                              title={`Assign all unmapped screens in ${modLabel} to a feature`}
                            >
                              <option value="">Assign module to…</option>
                              {features.map(f => (
                                <option key={f.name} value={f.name}>{f.name}</option>
                              ))}
                              <option value="__new__">+ New Feature…</option>
                            </select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBatchAssignModule(modLabel)}
                              className="text-[11px] h-7 px-2.5 rounded-lg font-bold shrink-0"
                              title={`Assign all ${screensInMod.length} screens in ${modLabel}`}
                            >
                              <ListChecks size={12} className="mr-1 text-[var(--color-primary-hex)]" />
                              Assign All
                            </Button>
                          </div>
                        </div>

                        {/* Screens Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {screensInMod.map(scName => {
                            const scVal = screenAssignMap[scName] || '';
                            return (
                              <div
                                key={scName}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] hover:border-amber-500/40 transition-colors"
                              >
                                <div className="flex-1 min-w-0 pr-1">
                                  <div className="text-xs font-bold text-[var(--color-text)] truncate" title={scName}>
                                    {scName}
                                  </div>
                                  <div className="text-[10px] text-[var(--color-text-faint)] flex items-center gap-1 mt-0.5">
                                    <Monitor size={10} className="shrink-0 text-amber-500" />
                                    <span className="truncate">{modLabel}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <select
                                    value={scVal}
                                    onChange={(e) => setScreenAssignMap(prev => ({ ...prev, [scName]: e.target.value }))}
                                    className="text-[11px] px-2 py-1 rounded-md border border-[var(--color-divider)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none max-w-[130px] cursor-pointer"
                                  >
                                    <option value="">Assign to…</option>
                                    {features.map(f => (
                                      <option key={f.name} value={f.name}>{f.name}</option>
                                    ))}
                                    <option value="__new__">+ New Feature…</option>
                                  </select>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleAssignScreen(scName)}
                                    className="text-[10px] h-6.5 px-2 rounded-md font-bold shrink-0"
                                    title={`Map ${scName}`}
                                  >
                                    <LinkIcon size={10} className="mr-1" />
                                    Map
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. Operational KPI Banner & Toolbar ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-divider)] space-y-2.5 shrink-0">
        {/* Collapsible KPI Strip */}
        <CollapsibleSummaryStrip
          title="Feature Coverage Telemetry"
          summary={[
            { label: 'Features', value: totalFeatures, tone: 'primary' },
            { label: 'Mapped Screens', value: `${mappedScreens.length} / ${allScreens.length}`, tone: 'sky' },
            { label: 'Avg Maturation', value: `${avgMaturity}%`, tone: 'emerald' },
            { label: 'At Risk', value: totalAtRisk, tone: totalAtRisk > 0 ? 'rose' : 'emerald' }
          ]}
          contentClassName="pt-2.5 pb-1"
        >
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <StaggerItem className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">Features</span>
            <span className="font-mono font-bold text-sm text-[var(--color-text)]">
              <AnimatedMetric value={totalFeatures} />
            </span>
          </StaggerItem>
          <StaggerItem className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">Mapped Screens</span>
            <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
              <AnimatedMetric value={mappedScreens.length} /> / {allScreens.length}
            </span>
          </StaggerItem>
          <StaggerItem className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">Avg Maturation</span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              <AnimatedMetric value={avgMaturity} suffix="%" />
            </span>
          </StaggerItem>
          <StaggerItem className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between">
            <span className="font-semibold text-[var(--color-text-muted)]">At Risk</span>
            <span className={clsx("font-mono font-bold text-sm", totalAtRisk > 0 ? "text-rose-500" : "text-emerald-500")}>
              <AnimatedMetric value={totalAtRisk} />
            </span>
          </StaggerItem>
        </StaggerContainer>
        </CollapsibleSummaryStrip>

        {/* ── Quick Filter Presets Strip ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          {PRESETS.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all cursor-pointer border active:scale-95",
                  isActive
                    ? "bg-[var(--color-primary-hex)] text-white border-[var(--color-primary-hex)] shadow-xs font-bold"
                    : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:border-[var(--color-border)] hover:text-[var(--color-text)]"
                )}
              >
                <span>{p.label}</span>
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-faint)]"
                  )}
                >
                  {p.count}
                </span>
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-[var(--color-primary-hex)] font-semibold hover:underline flex items-center gap-1 whitespace-nowrap px-2 py-1 cursor-pointer"
            >
              <X size={12} />
              Reset All
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input 
                ref={searchInputRef}
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] transition-colors"
                placeholder="Search features, screens, goals... (/)"
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

              const healthBorder = mObj.overdueTasks > 0 ? "border-rose-500/30 hover:border-rose-500/60" : mObj.avgProg === 100 ? "border-emerald-500/30 hover:border-emerald-500/60" : mObj.avgProg > 30 ? "border-cyan-500/30 hover:border-cyan-500/60" : "border-amber-500/30 hover:border-amber-500/60";
              const accentBadgeBg = mObj.overdueTasks > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" : mObj.avgProg === 100 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : mObj.avgProg > 30 ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

              return (
                <div 
                  key={f.name + idx}
                  onClick={() => setSelectedFeature(f)}
                  className={clsx(
                    "card-glass border rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col relative overflow-hidden group cursor-pointer",
                    healthBorder
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
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 inline-flex items-center gap-1">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFeature(f);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-primary-hex)] flex items-center justify-center transition-colors cursor-pointer"
                          title="Quick Peek Drawer"
                          aria-label="Quick peek feature"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(actualIdx);
                          }}
                          className="w-7 h-7 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit feature"
                          aria-label="Edit feature"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFeature(actualIdx);
                          }}
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
                <MapIcon size={48} className="mx-auto text-[var(--color-text-faint)] opacity-40 mb-3" />
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
            density={density}
            pagination={pagination}
            itemLabel="features"
            stickyFirstColumn={true}
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

      {/* ── 5. Auto-Build Feature Matrix Modal (Standard Accessible Modal) ── */}
      <Modal
        isOpen={isAutoBuildOpen}
        onClose={() => setIsAutoBuildOpen(false)}
        title="Auto-Build Feature Matrix"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsAutoBuildOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleApplyAutoBuild} className="font-bold">
              Apply Generated Features to Matrix
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs">
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
      </Modal>

      {/* ── 6. Feature Detail Master-Detail Peek Side Drawer ── */}
      <SlideOverDrawer
        isOpen={Boolean(selectedFeature)}
        onClose={() => setSelectedFeature(null)}
        widthClass="w-full sm:w-[540px] lg:w-[620px]"
        onPrevious={handlePrevFeature}
        onNext={handleNextFeature}
        hasPrevious={selectedFeatureIndex > 0}
        hasNext={selectedFeatureIndex < filteredFeatures.length - 1}
        title={
          selectedFeature ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                {String((features.findIndex(f => f.name === selectedFeature.name) >= 0 ? features.findIndex(f => f.name === selectedFeature.name) : 0) + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[var(--color-text)] truncate">{selectedFeature.name}</h3>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{selectedFeature.category || 'Core Platform'}</p>
              </div>
            </div>
          ) : undefined
        }
        subtitle={
          selectedFeature ? (() => {
            const mObj = featureMetrics[selectedFeature.name] || { status: 'Planned', avgProg: 0 };
            return (
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  mObj.status === 'Done' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                  mObj.status === 'At Risk' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                  mObj.status === 'Active' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                  "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]"
                )}>
                  {mObj.status}
                </span>
                {selectedFeature.release && (
                  <span className="text-[11px] font-mono text-[var(--color-text-faint)] flex items-center gap-1">
                    <Flag size={11} /> {selectedFeature.release}
                  </span>
                )}
              </div>
            );
          })() : undefined
        }
        footer={
          selectedFeature ? (
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] text-[var(--color-text-faint)]">
                Feature {selectedFeatureIndex + 1} of {filteredFeatures.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const f = selectedFeature;
                    const targetIdx = features.findIndex(feat => feat.name === f.name);
                    setSelectedFeature(null);
                    if (targetIdx >= 0) startEdit(targetIdx);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Edit2 size={13} />
                  <span>Edit Definition</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedFeature(null);
                    setView('tasks');
                  }}
                  className="flex items-center gap-1.5"
                >
                  <span>View in Tasks</span>
                  <ExternalLink size={13} />
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        {selectedFeature && (() => {
          const mObj = featureMetrics[selectedFeature.name] || {
            totTasks: 0,
            doneTasks: 0,
            avgProg: 0,
            overdueTasks: 0,
            status: 'Planned',
            impactedModules: []
          };
          const linkedTasks = state.tasks.filter(t => 
            t.module === selectedFeature.name || 
            selectedFeature.screens.includes(t.name) || 
            (t.subtasks && t.subtasks.some(st => selectedFeature.screens.includes(st.name)))
          );

          return (
            <div className="space-y-6 text-xs">
              {/* Maturation & 4-Stat Metric Bento */}
              <div className="p-4 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--color-text)]">Backlog Maturation</span>
                  <span className="font-mono font-bold text-sm text-[var(--color-primary-hex)]">{mObj.avgProg}%</span>
                </div>
                <div className="h-2 w-full bg-[var(--color-surface)] rounded-full overflow-hidden border border-[var(--color-divider)]">
                  <div
                    className={clsx(
                      "h-full rounded-full transition-all",
                      mObj.avgProg >= 100 ? "bg-emerald-500" : mObj.avgProg >= 40 ? "bg-cyan-500" : "bg-amber-500"
                    )}
                    style={{ width: `${mObj.avgProg}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                    <div className="text-[9px] uppercase text-[var(--color-text-faint)] font-semibold">Total Tasks</div>
                    <div className="text-xs font-bold font-mono text-[var(--color-text)] mt-0.5">{mObj.totTasks}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                    <div className="text-[9px] uppercase text-[var(--color-text-faint)] font-semibold">Done Tasks</div>
                    <div className="text-xs font-bold font-mono text-emerald-500 mt-0.5">{mObj.doneTasks}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                    <div className="text-[9px] uppercase text-[var(--color-text-faint)] font-semibold">Overdue</div>
                    <div className={clsx("text-xs font-bold font-mono mt-0.5", mObj.overdueTasks > 0 ? "text-rose-500" : "text-[var(--color-text-muted)]")}>
                      {mObj.overdueTasks}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic Purpose */}
              <div className="space-y-2">
                <h4 className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px]">Strategic Purpose</h4>
                <p className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs text-[var(--color-text)] leading-relaxed italic">
                  “{selectedFeature.desc || 'No strategic description defined.'}”
                </p>
              </div>

              {/* Impacted Modules */}
              {mObj.impactedModules.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px]">Impacted Modules</h4>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)]">
                    {mObj.impactedModules.map((mod, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-divider)] font-medium">
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mapped Target Interfaces */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px]">
                    Mapped Target Interfaces ({selectedFeature.screens.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scroll pr-1">
                  {selectedFeature.screens.map((s, si) => (
                    <div key={si} className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] flex items-center justify-center font-bold text-[10px] text-[var(--color-primary-hex)] border border-[var(--color-divider)] shrink-0">
                        {si + 1}
                      </div>
                      <span className="font-semibold text-xs text-[var(--color-text)] truncate">{s}</span>
                    </div>
                  ))}
                  {selectedFeature.screens.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-[var(--color-text-faint)] border border-dashed border-[var(--color-divider)] rounded-xl">
                      No interface screens mapped.
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Technical Tasks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--color-text-faint)] uppercase tracking-wider text-[10px]">
                    Linked Technical Tasks ({linkedTasks.length})
                  </h4>
                  {linkedTasks.length > 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFeature(null);
                        setView('tasks');
                      }}
                      className="text-xs text-[var(--color-primary-hex)] font-semibold hover:underline cursor-pointer"
                    >
                      View all in Tasks &rarr;
                    </button>
                  )}
                </div>
                {linkedTasks.length === 0 ? (
                  <div className="p-4 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)] text-center text-xs text-[var(--color-text-muted)]">
                    No technical tasks directly linked to this feature.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scroll pr-1">
                    {linkedTasks.slice(0, 8).map(t => (
                      <div key={t.id} className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[var(--color-primary-hex)]">{t.id}</span>
                            <span className="font-bold text-xs truncate">{t.name}</span>
                          </div>
                          <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5 truncate">
                            {t.dueDate ? `Due ${t.dueDate}` : 'No date'} • Assignee: {t.assignee || 'Unassigned'}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400 shrink-0">{t.progress}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </SlideOverDrawer>

      {/* ── 7. Edit / Create Feature Modal (Standard Accessible Modal) ── */}
      {editForm && (
        <Modal
          isOpen={true}
          onClose={() => setEditForm(null)}
          title={editingIdx !== null && editingIdx < features.length ? 'Edit Strategic Feature' : 'Create Strategic Feature'}
          size="lg"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="ghost" size="sm" onClick={() => setEditForm(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={saveEdit} className="font-bold">Save Changes</Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
                <label className="font-bold text-[var(--color-text-muted)] block mb-1">Feature Name</label>
                <input 
                  className="w-full px-3 py-2 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                  placeholder="e.g. Risk Analytics & Limit Engine"
                  value={editForm.name}
                  onChange={e => handleFeatureNameChange(e.target.value)}
                />
              </div>

              <div>
                <label className="font-bold text-[var(--color-text-muted)] block mb-1">Strategic Description / Scope</label>
                <textarea 
                  rows={2}
                  className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] resize-none"
                  placeholder="Describe the architectural capabilities, objectives, or user journeys covered by this feature..."
                  value={editForm.desc}
                  onChange={e => setEditForm({ ...editForm, desc: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Release with Auto Inference */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="font-bold text-[var(--color-text-muted)]">Target Release</label>
                    {releaseAutoInferred && editForm.release && (
                      <button
                        type="button"
                        onClick={handleClearAutoRelease}
                        title="Auto-inferred from constituent screen tasks. Click to clear."
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-hex)]/10 border border-[var(--color-primary-hex)]/30 rounded-full px-2 py-0.5 hover:bg-[var(--color-primary-hex)]/20 cursor-pointer transition-colors"
                      >
                        <Sparkles size={10} />
                        <span>Auto: {editForm.release}</span>
                        <X size={9} className="opacity-70" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      list="feature-releases-list"
                      className="w-full px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] font-mono"
                      value={editForm.release || ''}
                      placeholder="e.g. v1.0.0"
                      onChange={e => {
                        setReleaseUserSet(true);
                        setReleaseAutoInferred(false);
                        setEditForm({ ...editForm, release: e.target.value });
                      }}
                    />
                    <datalist id="feature-releases-list">
                      {allReleaseOptions.map(r => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Category with Auto Inference */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="font-bold text-[var(--color-text-muted)]">Category / Domain</label>
                    {categoryAutoInferred && editForm.category && (
                      <button
                        type="button"
                        onClick={handleClearAutoCategory}
                        title="Auto-inferred from feature name keywords. Click to clear."
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary-hex)] bg-[var(--color-primary-hex)]/10 border border-[var(--color-primary-hex)]/30 rounded-full px-2 py-0.5 hover:bg-[var(--color-primary-hex)]/20 cursor-pointer transition-colors"
                      >
                        <Sparkles size={10} />
                        <span>Auto: {editForm.category}</span>
                        <X size={9} className="opacity-70" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      list="feature-categories-list"
                      className="w-full px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                      value={editForm.category || ''}
                      placeholder="e.g. Core Platform"
                      onChange={e => {
                        setCategoryUserSet(true);
                        setCategoryAutoInferred(false);
                        setEditForm({ ...editForm, category: e.target.value });
                      }}
                    />
                    <datalist id="feature-categories-list">
                      {allCategoryOptions.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Mapped Screens Header & Chips */}
              <div className="space-y-2 pt-1 border-t border-[var(--color-divider)]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--color-text)] flex items-center gap-2">
                    <span>Mapped Interface Windows & Screens</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full font-bold bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-primary-hex)]">
                      {editForm.screens.length} mapped
                    </span>
                  </label>
                  {editForm.screens.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({ ...editForm, screens: [] });
                        if (!releaseUserSet) {
                          setEditForm(prev => prev ? { ...prev, screens: [], release: '' } : null);
                          setReleaseAutoInferred(false);
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scroll p-2.5 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-divider)]">
                  {editForm.screens.map((sc, sci) => {
                    const mod = screenModuleMap[sc] || 'General';
                    return (
                      <span 
                        key={sci} 
                        className="px-2 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)] text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs"
                      >
                        <Monitor size={11} className="text-[var(--color-primary-hex)] shrink-0" />
                        <span className="text-[var(--color-text)]">{sc}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] uppercase tracking-wider">
                          {mod}
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveScreenFromEditForm(sci)}
                          className="text-rose-500 hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                          title="Remove screen"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {editForm.screens.length === 0 && (
                    <span className="text-[11px] text-[var(--color-text-faint)] italic py-1">
                      No screens assigned yet. Click suggested screens below or choose from the module groups.
                    </span>
                  )}
                </div>
              </div>

              {/* AI Screen Suggestions (HTML Parity: computeScreenSuggestions) */}
              {screenSuggestions.length > 0 && (
                <div className="p-3 rounded-xl bg-[var(--color-primary-hex)]/5 border border-dashed border-[var(--color-primary-hex)]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[var(--color-primary-hex)] uppercase tracking-wider">
                      <Sparkles size={13} />
                      <span>Suggested Screens (Token-Overlap Match)</span>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Click pill to add</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {screenSuggestions.map(s => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => handleAddScreenToEditForm(s.name)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-primary-hex)]/30 hover:border-[var(--color-primary-hex)] hover:bg-[var(--color-primary-hex)]/10 text-xs font-semibold text-[var(--color-text)] transition-all cursor-pointer group shadow-2xs"
                        title={`Module: ${s.module || 'General'} — Click to add`}
                      >
                        <Plus size={11} className="text-[var(--color-primary-hex)] group-hover:scale-125 transition-transform" />
                        <span>{s.name}</span>
                        {s.module && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] uppercase tracking-wider">
                            {s.module}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Module-Grouped Screen Selection & Search */}
              <div className="space-y-2.5 pt-1 border-t border-[var(--color-divider)]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-[var(--color-text)] text-xs">
                    Available Interface Screens by Module
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={screenPickerModule}
                      onChange={e => setScreenPickerModule(e.target.value)}
                      className="text-[11px] px-2 py-1 rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface-2)] text-[var(--color-text)] outline-none cursor-pointer"
                    >
                      <option value="all">All Modules</option>
                      {availableScreenModules.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter / Custom Add Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                    <input 
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] transition-colors"
                      placeholder="Search screens or enter custom screen..."
                      value={screenSearchQuery}
                      onChange={e => setScreenSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && screenSearchQuery.trim()) {
                          e.preventDefault();
                          handleAddScreenToEditForm(screenSearchQuery.trim());
                          setScreenSearchQuery('');
                        }
                      }}
                    />
                    {screenSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setScreenSearchQuery('')} 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7.5 rounded-lg shrink-0 font-bold"
                    onClick={() => {
                      if (screenSearchQuery.trim()) {
                        handleAddScreenToEditForm(screenSearchQuery.trim());
                        setScreenSearchQuery('');
                      }
                    }}
                  >
                    <Plus size={12} className="mr-1 text-[var(--color-primary-hex)]" />
                    Add Custom
                  </Button>
                </div>

                {/* Module-Grouped Inventory Grid */}
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll pr-1">
                  {Object.keys(candidateScreensByModule).length > 0 ? (
                    Object.entries(candidateScreensByModule).map(([mod, screens]) => (
                      <div 
                        key={mod}
                        className="p-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[var(--color-text)]">
                            <Layers size={11} className="text-[var(--color-primary-hex)]" />
                            <span>{mod}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)]">
                              {screens.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              screens.forEach(s => handleAddScreenToEditForm(s));
                            }}
                            className="text-[10px] font-bold text-[var(--color-primary-hex)] hover:underline cursor-pointer"
                          >
                            + Add All in {mod}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {screens.map(sc => (
                            <button
                              key={sc}
                              type="button"
                              onClick={() => handleAddScreenToEditForm(sc)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)] text-[11px] font-medium text-[var(--color-text)] transition-colors cursor-pointer group"
                            >
                              <Plus size={10} className="text-[var(--color-text-faint)] group-hover:text-[var(--color-primary-hex)]" />
                              <span>{sc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-[11px] text-[var(--color-text-faint)] italic">
                      No matching unmapped screens found. Type above to add a custom screen.
                    </div>
                  )}
                </div>
              </div>
            </div>
        </Modal>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant="danger"
        confirmLabel="Remove Feature"
      />

      {/* ── Floating Action Bar for Batch Selection ── */}
      <AnimatePresence>
        {selectedFeatureNames.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[var(--color-surface-2)]/95 backdrop-blur-md border border-[var(--color-divider)] shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 text-xs"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--color-divider)]">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary-hex)] text-white text-[10px] font-bold flex items-center justify-center">
                {selectedFeatureNames.size}
              </span>
              <span className="font-semibold text-[var(--color-text)]">Selected</span>
            </div>

            {/* Batch Assign Release */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-text-muted)] text-[11px]">Release:</span>
              <select
                value={batchRelease}
                onChange={(e) => {
                  setBatchRelease(e.target.value);
                  if (e.target.value) handleBatchApplyRelease(e.target.value);
                }}
                className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] cursor-pointer"
              >
                <option value="">Assign Release...</option>
                {allReleaseOptions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Batch Assign Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--color-text-muted)] text-[11px]">Category:</span>
              <select
                value={batchCategory}
                onChange={(e) => {
                  setBatchCategory(e.target.value);
                  if (e.target.value) handleBatchApplyCategory(e.target.value);
                }}
                className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg px-2 py-1 text-xs text-[var(--color-text)] cursor-pointer"
              >
                <option value="">Assign Category...</option>
                {STANDARD_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Batch Delete */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDelete}
              className="text-rose-500 hover:bg-rose-500/10 border-rose-500/30 flex items-center gap-1 h-7"
            >
              <Trash2 size={12} />
              <span>Delete</span>
            </Button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedFeatureNames(new Set())}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs font-medium cursor-pointer ml-1"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionPage>
  );
};

export default FunctionalMatrix;
