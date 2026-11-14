import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  ListChecks, 
  Search, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Database,
  Upload, 
  X, 
  Check,
  Star,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Edit2,
  ExternalLink,
  Layers,
  Sparkles,
  Tag,
  AlertCircle,
  Copy,
  BookOpen,
  FolderPlus,
  FileText,
  CheckSquare,
  Square
} from 'lucide-react';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import PageHeader from '../shared/PageHeader';
import SectionHelpButton from '../shared/SectionHelpButton';
import CollapsibleSummaryStrip from '../shared/CollapsibleSummaryStrip';
import SlideOverDrawer from '../shared/SlideOverDrawer';
import { toast } from '../../utils/toast';
import { MotionPage, StaggerContainer, StaggerItem } from '../shared/MotionPage';
import { AnimatedMetric } from '../shared/AnimatedMetric';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { todayStr } from '../../utils/projectUtils';

// Core reserved libraries present in the baseline system
export const RESERVED_CORE_KEYS = new Set([
  'status', 'priority', 'category', 'module', 'moduleType', 
  'version', 'role', 'memberStatus', 'defectStatus', 'defectPriority', 
  'defectSeverity', 'defectType', 'deliveryStatus', 'deliveryCategory', 
  'deliveryEnv', 'deliverySignOff', 'smokeTestStatus', 'almStatus'
]);

// Human-friendly titles for core technical library keys
export const LIBRARY_LABELS: Record<string, string> = {
  status: 'Task Status',
  priority: 'Task Priority',
  category: 'Task Category',
  module: 'Codebase Modules',
  moduleType: 'Module Architecture Type',
  version: 'Release Versions',
  role: 'Team Member Roles',
  memberStatus: 'Member Availability Status',
  defectStatus: 'Defect Lifecycle Status',
  defectPriority: 'Defect Urgency Priority',
  defectSeverity: 'Defect Severity Rating',
  defectType: 'Defect Classification Type',
  deliveryStatus: 'Delivery Pipeline Status',
  deliveryCategory: 'Delivery Release Scope',
  deliveryEnv: 'Target Environment',
  deliverySignOff: 'Sign-Off Governance State',
  smokeTestStatus: 'Smoke Test Suite State',
  almStatus: 'ALM Defect Tracking Status'
};

export const formatLibraryName = (key: string): string => {
  if (LIBRARY_LABELS[key]) return LIBRARY_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export const getOptionBadgeStyle = (val: string) => {
  const lower = val.toLowerCase();
  if (lower.includes('completed') || lower.includes('fixed') || lower.includes('passed') || lower.includes('approved') || lower.includes('active') || lower.includes('closed')) {
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25';
  }
  if (lower.includes('in progress') || lower.includes('running') || lower.includes('assigned') || lower.includes('open') || lower.includes('retest')) {
    return 'bg-sky-500/10 text-sky-500 border-sky-500/25';
  }
  if (lower.includes('critical') || lower.includes('blocker') || lower.includes('failed') || lower.includes('rejected') || lower.includes('s1') || lower.includes('cancelled') || lower.includes('rolled back')) {
    return 'bg-rose-500/10 text-rose-500 border-rose-500/25';
  }
  if (lower.includes('high') || lower.includes('s2') || lower.includes('warn') || lower.includes('on hold')) {
    return 'bg-amber-500/10 text-amber-500 border-amber-500/25';
  }
  if (lower.includes('review') || lower.includes('staging') || lower.includes('uat') || lower.includes('s3') || lower.includes('notice')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
  }
  if (lower.includes('not started') || lower.includes('new') || lower.includes('scheduled') || lower.includes('pending') || lower.includes('not run')) {
    return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
  }
  return 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)]';
};

const RegistryView: React.FC = () => {
  const { state, updateProject, setView } = useProject();
  const [selectedKey, setSelectedRegistryKey] = useState<string>('status');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'core' | 'custom'>('all');
  
  // In-library option filter, batch selection & peek dossier
  const [optionSearch, setOptionSearch] = useState<string>('');
  const [selectedOptionValues, setSelectedOptionValues] = useState<Set<string>>(new Set());
  const [peekOptionValue, setPeekOptionValue] = useState<string | null>(null);
  const [mobileActivePanel, setMobileActivePanel] = useState<'libraries' | 'editor'>('libraries');
  const optionSearchRef = useRef<HTMLInputElement>(null);
  const librarySearchRef = useRef<HTMLInputElement>(null);

  // New option input
  const [newValue, setNewValue] = useState<string>('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // Inline editing state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Bulk edit modal
  const [isBulkOpen, setIsBulkOpen] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (mobileActivePanel === 'libraries') {
          librarySearchRef.current?.focus();
        } else {
          optionSearchRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileActivePanel]);

  // New Library Modal
  const [isNewLibModalOpen, setIsNewLibModalOpen] = useState<boolean>(false);
  const [newLibKey, setNewLibKey] = useState<string>('');
  const [newLibInitialValues, setNewLibInitialValues] = useState<string>('');
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'primary';
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
    confirmLabel: 'Confirm'
  });

  const dropdowns = state.dropdowns || {};
  const defaults = state.dropdownDefaults || {};
  const keys = useMemo(() => Object.keys(dropdowns).sort(), [dropdowns]);

  // Ensure selected key is valid
  useEffect(() => {
    if (!dropdowns[selectedKey] && keys.length > 0) {
      setSelectedRegistryKey(keys[0]);
    }
  }, [dropdowns, selectedKey, keys]);

  const values = dropdowns[selectedKey] || [];
  const isReserved = RESERVED_CORE_KEYS.has(selectedKey);
  const currentDefault = defaults[selectedKey] || null;

  // Filtered keys for sidebar
  const filteredKeys = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    return keys.filter(k => {
      const label = formatLibraryName(k).toLowerCase();
      const matchesSearch = !q || k.toLowerCase().includes(q) || label.includes(q);
      const isCore = RESERVED_CORE_KEYS.has(k);
      const matchesTab = activeTab === 'all' || (activeTab === 'core' && isCore) || (activeTab === 'custom' && !isCore);
      return matchesSearch && matchesTab;
    });
  }, [keys, searchFilter, activeTab]);

  const coreCount = useMemo(() => keys.filter(k => RESERVED_CORE_KEYS.has(k)).length, [keys]);
  const customCount = useMemo(() => keys.filter(k => !RESERVED_CORE_KEYS.has(k)).length, [keys]);
  const totalValuesCount = useMemo(() => Object.values(dropdowns).reduce((acc, curr) => acc + curr.length, 0), [dropdowns]);

  // Check custom fields that link to the selected library
  const linkedCustomFields = useMemo(() => {
    const list: { domain: string; name: string }[] = [];
    (state.customFields || []).forEach(cf => {
      if (cf.type === 'dropdown' && (cf.globalKey === selectedKey || (cf as any).optionsKey === selectedKey)) {
        list.push({ domain: 'Tasks', name: cf.name });
      }
    });
    (state.defCustomFields || []).forEach(cf => {
      if (cf.type === 'dropdown' && (cf.globalKey === selectedKey || (cf as any).optionsKey === selectedKey)) {
        list.push({ domain: 'Defects', name: cf.name });
      }
    });
    (state.delCustomFields || []).forEach(cf => {
      if (cf.type === 'dropdown' && (cf.globalKey === selectedKey || (cf as any).optionsKey === selectedKey)) {
        list.push({ domain: 'Deliveries', name: cf.name });
      }
    });
    return list;
  }, [state.customFields, state.defCustomFields, state.delCustomFields, selectedKey]);

  // Total custom fields using any dropdown library
  const totalLinkedFields = useMemo(() => {
    let count = 0;
    const allCfs = [...(state.customFields || []), ...(state.defCustomFields || []), ...(state.delCustomFields || [])];
    allCfs.forEach(cf => {
      if (cf.type === 'dropdown' && (cf.globalKey || (cf as any).optionsKey)) {
        count++;
      }
    });
    return count;
  }, [state.customFields, state.defCustomFields, state.delCustomFields]);

  // Filtered values within selected option library
  const filteredValues = useMemo(() => {
    if (!optionSearch.trim()) return values;
    const q = optionSearch.trim().toLowerCase();
    return values.filter(v => v.toLowerCase().includes(q));
  }, [values, optionSearch]);

  const isAllSelected = filteredValues.length > 0 && filteredValues.every(v => selectedOptionValues.has(v));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOptionValues(new Set());
    } else {
      setSelectedOptionValues(new Set(filteredValues));
    }
  };

  const handleToggleSelectOption = (val: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedOptionValues(prev => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
  };

  const handleBatchCopyComma = () => {
    const text = Array.from(selectedOptionValues).join(', ');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${selectedOptionValues.size} options as comma-separated list`);
  };

  const handleBatchCopyLines = () => {
    const text = Array.from(selectedOptionValues).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${selectedOptionValues.size} options as newline list`);
  };

  const handleBatchDeleteOptions = () => {
    if (selectedOptionValues.size === 0) return;
    const count = selectedOptionValues.size;
    setConfirmState({
      isOpen: true,
      title: 'Batch Delete Options',
      message: `Are you sure you want to remove ${count} selected options from ${formatLibraryName(selectedKey)}?`,
      variant: 'danger',
      confirmLabel: `Delete ${count} Options`,
      onConfirm: () => {
        const newVals = values.filter(v => !selectedOptionValues.has(v));
        const updatedDefaults = { ...defaults };
        if (selectedOptionValues.has(updatedDefaults[selectedKey])) {
          delete updatedDefaults[selectedKey];
        }
        updateProject({
          dropdowns: {
            ...state.dropdowns,
            [selectedKey]: newVals
          },
          dropdownDefaults: updatedDefaults
        });
        setSelectedOptionValues(new Set());
        toast.info(`Removed ${count} options.`);
      }
    });
  };

  const handleCopyLibraryMarkdown = () => {
    const rows = values.map((v, i) => `| ${i + 1} | ${v} | ${defaults[selectedKey] === v ? 'Default' : 'Standard'} |`).join('\n');
    const md = `# Option Library: ${formatLibraryName(selectedKey)} (${selectedKey})\n\n| # | Option Value | Default |\n|---|---|---|\n${rows}\n`;
    navigator.clipboard.writeText(md);
    toast.success(`Copied ${formatLibraryName(selectedKey)} as Markdown table.`);
  };

  // Option Usage Dossier
  const getOptionUsage = useCallback((val: string) => {
    let tasks: { id: string; name: string; status: string }[] = [];
    let defects: { id: string; title: string; status: string }[] = [];
    let deliveries: { id: string; name: string; status: string }[] = [];
    let members: { id: string; name: string; role: string }[] = [];

    if (selectedKey === 'status') {
      tasks = state.tasks.filter(t => t.status === val).map(t => ({ id: t.id, name: t.name, status: t.status }));
    } else if (selectedKey === 'priority') {
      tasks = state.tasks.filter(t => t.priority === val).map(t => ({ id: t.id, name: t.name, status: t.status }));
    } else if (selectedKey === 'category') {
      tasks = state.tasks.filter(t => t.category === val).map(t => ({ id: t.id, name: t.name, status: t.status }));
    } else if (selectedKey === 'module') {
      tasks = state.tasks.filter(t => t.module === val).map(t => ({ id: t.id, name: t.name, status: t.status }));
    } else if (selectedKey === 'version') {
      tasks = state.tasks.filter(t => t.version === val).map(t => ({ id: t.id, name: t.name, status: t.status }));
    } else if (selectedKey === 'role') {
      members = state.members.filter(m => m.role === val).map(m => ({ id: m.id, name: m.name, role: m.role }));
    } else if (selectedKey === 'defectStatus') {
      defects = state.defects.filter(d => d.status === val).map(d => ({ id: d.id, title: d.title, status: d.status }));
    } else if (selectedKey === 'defectPriority') {
      defects = state.defects.filter(d => d.priority === val).map(d => ({ id: d.id, title: d.title, status: d.status }));
    } else if (selectedKey === 'defectSeverity') {
      defects = state.defects.filter(d => d.severity === val).map(d => ({ id: d.id, title: d.title, status: d.status }));
    } else if (selectedKey === 'defectType') {
      defects = state.defects.filter(d => d.type === val).map(d => ({ id: d.id, title: d.title, status: d.status }));
    } else if (selectedKey === 'deliveryStatus') {
      deliveries = state.deliveries.filter(d => d.status === val).map(d => ({ id: d.id, name: d.name, status: d.status }));
    } else if (selectedKey === 'deliveryCategory') {
      deliveries = state.deliveries.filter(d => d.category === val).map(d => ({ id: d.id, name: d.name, status: d.status }));
    } else if (selectedKey === 'deliveryEnv') {
      deliveries = state.deliveries.filter(d => d.environment === val).map(d => ({ id: d.id, name: d.name, status: d.status }));
    } else if (selectedKey === 'deliverySignOff') {
      deliveries = state.deliveries.filter(d => d.signOffStatus === val).map(d => ({ id: d.id, name: d.name, status: d.status }));
    } else if (selectedKey === 'almStatus') {
      deliveries = state.deliveries.filter(d => d.almStatus === val).map(d => ({ id: d.id, name: d.name, status: d.status }));
    }

    const linkedCfs = (state.customFields || []).filter(cf => cf.globalKey === selectedKey || (cf as any).optionsKey === selectedKey);
    if (linkedCfs.length > 0) {
      const linkedTasks = state.tasks.filter(t => 
        linkedCfs.some(cf => (t as any)[cf.name] === val)
      ).map(t => ({ id: t.id, name: t.name, status: t.status }));
      tasks = [...tasks, ...linkedTasks];
    }

    const totalUsage = tasks.length + defects.length + deliveries.length + members.length;
    return { tasks, defects, deliveries, members, totalUsage };
  }, [selectedKey, state.tasks, state.defects, state.deliveries, state.members, state.customFields]);

  // Sequential drawer navigation for option peek
  const peekIdx = useMemo(() => {
    if (!peekOptionValue) return -1;
    return filteredValues.indexOf(peekOptionValue);
  }, [peekOptionValue, filteredValues]);

  const hasPrevOption = peekIdx > 0;
  const hasNextOption = peekIdx >= 0 && peekIdx < filteredValues.length - 1;

  const handlePrevOption = useCallback(() => {
    if (hasPrevOption) setPeekOptionValue(filteredValues[peekIdx - 1]);
  }, [hasPrevOption, peekIdx, filteredValues]);

  const handleNextOption = useCallback(() => {
    if (hasNextOption) setPeekOptionValue(filteredValues[peekIdx + 1]);
  }, [hasNextOption, peekIdx, filteredValues]);

  useEffect(() => {
    if (!peekOptionValue) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
      if (e.key === '[') {
        e.preventDefault();
        handlePrevOption();
      } else if (e.key === ']') {
        e.preventDefault();
        handleNextOption();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [peekOptionValue, handlePrevOption, handleNextOption]);

  // ── Actions ──

  const handleAddValue = () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      toast.warning(`Value "${trimmed}" already exists in the "${formatLibraryName(selectedKey)}" library.`);
      return;
    }
    const updated = [...values, trimmed];
    updateProject({
      dropdowns: {
        ...state.dropdowns,
        [selectedKey]: updated
      }
    });
    setNewValue('');
    addInputRef.current?.focus();
    toast.success(`Option "${trimmed}" added.`);
  };

  const handleRemoveValue = (idx: number) => {
    const target = values[idx];
    setConfirmState({
      isOpen: true,
      title: 'Remove Option',
      message: `Remove option "${target}" from ${formatLibraryName(selectedKey)}? Existing entities with this value will keep it until changed.`,
      variant: 'danger',
      confirmLabel: 'Remove Option',
      onConfirm: () => {
        const updated = values.filter((_, i) => i !== idx);
        const updatedDefaults = { ...defaults };
        if (updatedDefaults[selectedKey] === target) {
          delete updatedDefaults[selectedKey];
        }
        updateProject({
          dropdowns: {
            ...state.dropdowns,
            [selectedKey]: updated
          },
          dropdownDefaults: updatedDefaults
        });
        toast.info(`Option "${target}" removed.`);
      }
    });
  };

  const handleToggleDefault = (optionVal: string) => {
    const updatedDefaults = { ...defaults };
    if (defaults[selectedKey] === optionVal) {
      delete updatedDefaults[selectedKey];
    } else {
      updatedDefaults[selectedKey] = optionVal;
    }
    updateProject({ dropdownDefaults: updatedDefaults });
  };

  const handleMoveOption = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= values.length) return;
    const nextValues = [...values];
    const [moved] = nextValues.splice(idx, 1);
    nextValues.splice(targetIdx, 0, moved);
    updateProject({
      dropdowns: {
        ...state.dropdowns,
        [selectedKey]: nextValues
      }
    });
  };

  const handleSortOptions = (order: 'asc' | 'desc') => {
    const sorted = [...values].sort((a, b) => 
      order === 'asc' ? a.localeCompare(b, undefined, { numeric: true }) : b.localeCompare(a, undefined, { numeric: true })
    );
    updateProject({
      dropdowns: {
        ...state.dropdowns,
        [selectedKey]: sorted
      }
    });
  };

  const handleStartEdit = (idx: number, currentVal: string) => {
    setEditingIdx(idx);
    setEditingText(currentVal);
  };

  const handleSaveEdit = (idx: number) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setEditingIdx(null);
      return;
    }
    const oldVal = values[idx];
    if (trimmed !== oldVal && values.includes(trimmed)) {
      toast.warning(`Value "${trimmed}" already exists in this library.`);
      return;
    }
    const nextValues = [...values];
    nextValues[idx] = trimmed;

    const updatedDefaults = { ...defaults };
    if (updatedDefaults[selectedKey] === oldVal) {
      updatedDefaults[selectedKey] = trimmed;
    }

    updateProject({
      dropdowns: {
        ...state.dropdowns,
        [selectedKey]: nextValues
      },
      dropdownDefaults: updatedDefaults
    });
    setEditingIdx(null);
    toast.success('Option updated.');
  };

  const handleOpenBulk = () => {
    setBulkText(values.join('\n'));
    setIsBulkOpen(true);
  };

  const handleSaveBulk = () => {
    const updated = bulkText.split('\n').map(v => v.trim()).filter(Boolean);
    const deduplicated = Array.from(new Set(updated));
    
    const updatedDefaults = { ...defaults };
    if (updatedDefaults[selectedKey] && !deduplicated.includes(updatedDefaults[selectedKey])) {
      delete updatedDefaults[selectedKey];
    }

    updateProject({
      dropdowns: {
        ...state.dropdowns,
        [selectedKey]: deduplicated
      },
      dropdownDefaults: updatedDefaults
    });
    setIsBulkOpen(false);
    toast.success(`Updated ${formatLibraryName(selectedKey)} with ${deduplicated.length} options.`);
  };

  const handleCreateLibrary = () => {
    const cleanKey = newLibKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanKey) {
      toast.warning('Please enter a valid alphanumeric library key (e.g. tierLevel, billingPlan).');
      return;
    }
    if (dropdowns[cleanKey]) {
      toast.warning(`An option library named "${cleanKey}" already exists.`);
      return;
    }
    const initialItems = newLibInitialValues
      .split('\n')
      .flatMap(l => l.split(','))
      .map(s => s.trim())
      .filter(Boolean);
    const deduplicated = Array.from(new Set(initialItems));

    updateProject({
      dropdowns: {
        ...dropdowns,
        [cleanKey]: deduplicated
      }
    });
    setSelectedRegistryKey(cleanKey);
    setNewLibKey('');
    setNewLibInitialValues('');
    setIsNewLibModalOpen(false);
    toast.success(`Custom library "${cleanKey}" created with ${deduplicated.length} items.`);
  };

  const handleDeleteLibrary = () => {
    if (isReserved) {
      toast.error('System Core libraries cannot be deleted to preserve core entity schema integrity.');
      return;
    }
    setConfirmState({
      isOpen: true,
      title: 'Delete Option Library',
      message: `Delete entire "${formatLibraryName(selectedKey)}" (${selectedKey}) library? Any custom fields referencing this option set will fall back to manual entry.`,
      variant: 'danger',
      confirmLabel: 'Delete Library',
      onConfirm: () => {
        const nextDropdowns = { ...dropdowns };
        delete nextDropdowns[selectedKey];
        const nextDefaults = { ...defaults };
        delete nextDefaults[selectedKey];
        updateProject({
          dropdowns: nextDropdowns,
          dropdownDefaults: nextDefaults
        });
        setSelectedRegistryKey(Object.keys(nextDropdowns)[0] || 'status');
        toast.info(`Library "${selectedKey}" deleted.`);
      }
    });
  };

  return (
    <MotionPage className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* ── 1. Page Header ── */}
      <PageHeader
        icon={ListChecks}
        title="Option Libraries"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('fields')}
              title="Open Field Architect to manage custom fields"
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Database size={13} className="text-[var(--color-primary-hex)]" />
              <span className="hidden sm:inline">Field Architect</span>
            </button>
          </div>
        }
        primaryAction={
          <button
            onClick={() => setIsNewLibModalOpen(true)}
            title="Create new custom option library"
            className="h-9 px-3.5 text-xs font-bold rounded-xl bg-[var(--color-primary-hex)] text-white hover:opacity-95 flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Library</span>
          </button>
        }
      />

      {/* ── 2. Collapsible Telemetry KPI Strip (Minimized by default) ── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-1 shrink-0">
        <CollapsibleSummaryStrip
          title="Option Library Telemetry"
          summary={[
            { label: 'Option Libraries', value: `${keys.length} (${coreCount} core)`, tone: 'primary' },
            { label: 'Defined Options', value: totalValuesCount, tone: 'purple' },
            { label: 'Fields Linked', value: totalLinkedFields, tone: 'amber' },
            { label: 'Sync Integrity', value: '100% Live', tone: 'emerald' }
          ]}
          contentClassName="pt-2.5 pb-1"
        >
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StaggerItem className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Option Libraries
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                <AnimatedMetric value={keys.length} /> <span className="text-xs font-medium text-[var(--color-text-muted)]">({coreCount} core · {customCount} custom)</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
          </StaggerItem>

          <StaggerItem className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Total Defined Options
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                <AnimatedMetric value={totalValuesCount} /> <span className="text-xs font-medium text-[var(--color-text-muted)]">entries</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Tag size={16} />
            </div>
          </StaggerItem>

          <StaggerItem className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Custom Fields Linked
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                <AnimatedMetric value={totalLinkedFields} /> <span className="text-xs font-medium text-[var(--color-text-muted)]">attributes</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Database size={16} />
            </div>
          </StaggerItem>

          <StaggerItem className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Sync Integrity
              </div>
              <div className="text-lg font-display font-black text-emerald-500 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                100% Live
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} />
            </div>
          </StaggerItem>
        </StaggerContainer>
        </CollapsibleSummaryStrip>
      </div>

      {/* ── 3. Split Master/Detail Workshop Layout ── */}
      <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6 lg:p-8 pt-2 flex flex-col">
        {/* Mobile Panel Switcher (< lg) */}
        <div className="lg:hidden flex items-center p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] mb-3 text-xs shrink-0">
          <button
            onClick={() => setMobileActivePanel('libraries')}
            className={clsx(
              "flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer",
              mobileActivePanel === 'libraries'
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                : "text-[var(--color-text-muted)]"
            )}
          >
            Libraries ({keys.length})
          </button>
          <button
            onClick={() => setMobileActivePanel('editor')}
            className={clsx(
              "flex-1 py-1.5 rounded-lg text-center font-bold transition-all cursor-pointer truncate px-2",
              mobileActivePanel === 'editor'
                ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                : "text-[var(--color-text-muted)]"
            )}
          >
            Editor: {formatLibraryName(selectedKey)} ({values.length})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-0 flex-1">
          {/* ── LEFT: Library Sidebar (Col 1-4) ── */}
          <div className={clsx(
            "lg:col-span-4 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden h-full",
            mobileActivePanel === 'editor' && "hidden lg:flex"
          )}>
            {/* Sidebar Search & Tab Controls */}
            <div className="p-3.5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 space-y-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input
                  ref={librarySearchRef}
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter libraries (name or key)…"
                  className="w-full h-9 pl-9 pr-8 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] transition-colors shadow-2xs"
                />
                {searchFilter && (
                  <button
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-xs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={clsx(
                    "flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition-all cursor-pointer",
                    activeTab === 'all' 
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-2xs" 
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  All ({keys.length})
                </button>
                <button
                  onClick={() => setActiveTab('core')}
                  className={clsx(
                    "flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition-all cursor-pointer",
                    activeTab === 'core' 
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-2xs" 
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  Core ({coreCount})
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={clsx(
                    "flex-1 py-1 text-center font-bold text-[11px] rounded-lg transition-all cursor-pointer",
                    activeTab === 'custom' 
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] shadow-2xs" 
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                >
                  Custom ({customCount})
                </button>
              </div>
            </div>

            {/* Library Items Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scroll p-2 space-y-1">
              {filteredKeys.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                  No matching option libraries found.
                </div>
              ) : (
                filteredKeys.map(k => {
                  const isActive = selectedKey === k;
                  const isCore = RESERVED_CORE_KEYS.has(k);
                  const count = dropdowns[k]?.length || 0;
                  const def = defaults[k];

                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setSelectedRegistryKey(k);
                        setSelectedOptionValues(new Set());
                        setOptionSearch('');
                        setMobileActivePanel('editor');
                      }}
                      className={clsx(
                        "w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between group transition-all cursor-pointer border",
                        isActive
                          ? "bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/40 shadow-xs"
                          : "border-transparent hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx(
                            "text-xs font-bold truncate",
                            isActive ? "text-[var(--color-primary-hex)]" : "text-[var(--color-text)]"
                          )}>
                            {formatLibraryName(k)}
                          </span>
                          {def && (
                            <span title={`Default: ${def}`} className="inline-flex items-center shrink-0">
                              <Star size={11} className="text-amber-500 fill-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-[var(--color-text-faint)]">
                            {k}
                          </span>
                          <span className={clsx(
                            "text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider",
                            isCore ? "bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]" : "bg-purple-500/10 text-purple-400"
                          )}>
                            {isCore ? 'Core' : 'Custom'}
                          </span>
                        </div>
                      </div>

                      <span className={clsx(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg shrink-0",
                        isActive 
                          ? "bg-[var(--color-primary-hex)] text-white" 
                          : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)]"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Sidebar Bottom Footer */}
            <div className="p-3 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)]/60">
              <button
                onClick={() => setIsNewLibModalOpen(true)}
                className="w-full h-9 rounded-xl border border-dashed border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/50 hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FolderPlus size={14} className="text-[var(--color-primary-hex)]" />
                <span>Add Custom Library</span>
              </button>
            </div>
          </div>

          {/* ── RIGHT: Library Workshop / Editor (Col 5-12) ── */}
          <div className={clsx(
            "lg:col-span-8 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden h-full",
            mobileActivePanel === 'libraries' && "hidden lg:flex"
          )}>
            {/* Workshop Header Bar */}
            <div className="p-4 sm:p-5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/40 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-display font-black text-[var(--color-text)] tracking-tight">
                    {formatLibraryName(selectedKey)}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)]">
                    {selectedKey}
                  </span>
                  <SectionHelpButton view="dropdowns" section="Taxonomy Categories" label="Option Library guide" size={14} />
                </div>

                {/* Linked Custom Fields Banner */}
                {linkedCustomFields.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-[11px] font-semibold text-[var(--color-text-faint)]">Linked in:</span>
                    {linkedCustomFields.map((cf, i) => (
                      <button
                        key={i}
                        onClick={() => setView('fields')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] text-[11px] font-medium text-[var(--color-primary-hex)] hover:underline cursor-pointer"
                        title="Click to view in Field Architect"
                      >
                        <span>{cf.domain}: {cf.name}</span>
                        <ExternalLink size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                {/* Alphabetical Sort */}
                <div className="inline-flex items-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] p-0.5">
                  <button
                    onClick={() => handleSortOptions('asc')}
                    title="Sort options A to Z"
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                  >
                    <span>A→Z</span>
                  </button>
                  <button
                    onClick={() => handleSortOptions('desc')}
                    title="Sort options Z to A"
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
                  >
                    <span>Z→A</span>
                  </button>
                </div>

                {/* Copy Markdown Table */}
                <button
                  onClick={handleCopyLibraryMarkdown}
                  title="Copy option library as Markdown table"
                  className="h-9 px-2.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Copy size={13} className="text-[var(--color-primary-hex)]" />
                </button>

                {/* Bulk Edit Button */}
                <button
                  onClick={handleOpenBulk}
                  title="Bulk edit or paste multiple options at once"
                  className="h-9 px-3 text-xs font-semibold rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Upload size={13} className="text-[var(--color-primary-hex)]" />
                  <span>Bulk Edit</span>
                </button>

                {/* Delete Set Button (Custom Only) */}
                {!isReserved && (
                  <button
                    onClick={handleDeleteLibrary}
                    title="Delete custom option library"
                    className="h-9 px-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Add Bar */}
            <div className="p-3.5 sm:p-4 border-b border-[var(--color-divider)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    ref={addInputRef}
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                    placeholder="Type new option value and press Enter…"
                    className="w-full h-10 px-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs sm:text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] focus:bg-[var(--color-surface)] transition-all shadow-inner"
                  />
                  {newValue && (
                    <button
                      onClick={() => setNewValue('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleAddValue}
                  disabled={!newValue.trim()}
                  className="h-10 px-4 rounded-xl bg-[var(--color-primary-hex)] text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Option</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-faint)] mt-2 px-1">
                <span>Tip: Click the star icon to set an option as the default value in selector dropdowns.</span>
                <span className="font-mono">{values.length} total options</span>
              </div>
            </div>

            {/* Quick Option Filter & Selection Bar */}
            <div className="px-3.5 sm:px-4 py-2.5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/40 flex items-center justify-between gap-2 text-xs">
              <div className="relative flex-1 max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input
                  ref={optionSearchRef}
                  type="text"
                  value={optionSearch}
                  onChange={e => setOptionSearch(e.target.value)}
                  placeholder={`Filter ${formatLibraryName(selectedKey)} options… (Press /)`}
                  className="w-full h-8 pl-8 pr-7 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] shadow-2xs"
                />
                {optionSearch && (
                  <button
                    onClick={() => setOptionSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleToggleSelectAll}
                  className="h-8 px-2.5 rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[11px] font-bold text-[var(--color-text)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  {isAllSelected ? <CheckSquare size={13} className="text-[var(--color-primary-hex)]" /> : <Square size={13} className="text-[var(--color-text-faint)]" />}
                  <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
                </button>
              </div>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-2">
              {filteredValues.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--color-divider)] rounded-2xl bg-[var(--color-surface-2)]/30">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] flex items-center justify-center text-[var(--color-text-faint)] mb-3">
                    <ListChecks size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text)] mb-1">
                    {optionSearch ? 'No Matching Options' : 'Option Library is Empty'}
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm mb-4">
                    {optionSearch
                      ? `No options matched "${optionSearch}". Clear filter to view all options.`
                      : 'Add standard values using the input above, or use Bulk Edit to paste multiple options in one click.'}
                  </p>
                  {optionSearch ? (
                    <button
                      onClick={() => setOptionSearch('')}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text)] text-xs font-bold border border-[var(--color-divider)] cursor-pointer"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      onClick={handleOpenBulk}
                      className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] text-xs font-bold border border-[var(--color-primary-hex)]/30 cursor-pointer"
                    >
                      Paste Multiple Values
                    </button>
                  )}
                </div>
              ) : (
                filteredValues.map((val, idx) => {
                  const realIdx = values.indexOf(val);
                  const isDefault = currentDefault === val;
                  const isEditing = editingIdx === realIdx;
                  const badgeStyle = getOptionBadgeStyle(val);
                  const isSelected = selectedOptionValues.has(val);

                  return (
                    <div
                      key={`${val}-${realIdx}`}
                      className={clsx(
                        "p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group",
                        isSelected
                          ? "bg-[var(--color-primary-highlight-hex)]/40 border-[var(--color-primary-hex)]/50 shadow-xs"
                          : isDefault 
                            ? "bg-amber-500/[0.04] border-amber-500/30 shadow-2xs" 
                            : "bg-[var(--color-surface)] border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 hover:bg-[var(--color-surface-2)]/50"
                      )}
                    >
                      {/* Left: Checkbox + Index + Visual Pill + Text / Editor */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectOption(val, e)}
                          aria-label={`Select option ${val}`}
                          className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] cursor-pointer w-3.5 h-3.5 shrink-0"
                        />

                        {/* Index */}
                        <span className="font-mono text-[10px] font-bold text-[var(--color-text-faint)] w-5 text-center shrink-0">
                          {String(realIdx + 1).padStart(2, '0')}
                        </span>

                        {/* Color Preview Pill */}
                        <span className={clsx("w-2 h-2 rounded-full shrink-0 border", badgeStyle)} />

                        {/* Text or Inline Editor */}
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              autoFocus
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(realIdx);
                                if (e.key === 'Escape') setEditingIdx(null);
                              }}
                              className="h-8 px-2 bg-[var(--color-surface-2)] border border-[var(--color-primary-hex)] rounded-lg text-xs font-bold text-[var(--color-text)] outline-none flex-1"
                            />
                            <button
                              onClick={() => handleSaveEdit(realIdx)}
                              className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              title="Save changes (Enter)"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingIdx(null)}
                              className="p-1 rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                              title="Cancel (Esc)"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span 
                              onDoubleClick={() => handleStartEdit(realIdx, val)}
                              className="text-xs font-bold text-[var(--color-text)] truncate cursor-pointer select-text" 
                              title="Double click to edit"
                            >
                              {val}
                            </span>
                            {isDefault && (
                              <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                <Star size={9} className="fill-amber-500" /> Default
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick Peek Dossier Trigger */}
                        <button
                          onClick={() => setPeekOptionValue(val)}
                          className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Inspect live option usage dossier across project"
                        >
                          <ExternalLink size={12} />
                        </button>

                        {/* Default Star Button */}
                        <button
                          onClick={() => handleToggleDefault(val)}
                          className={clsx(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            isDefault 
                              ? "text-amber-500 bg-amber-500/10" 
                              : "text-[var(--color-text-faint)] hover:text-amber-500 hover:bg-amber-500/10 opacity-70 group-hover:opacity-100"
                          )}
                          title={isDefault ? "Clear default" : "Set as default option in selectors"}
                        >
                          <Star size={13} className={isDefault ? "fill-amber-500" : ""} />
                        </button>

                        {/* Move Up */}
                        <button
                          disabled={realIdx === 0 || Boolean(optionSearch)}
                          onClick={() => handleMoveOption(realIdx, 'up')}
                          className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-20 cursor-pointer"
                          title="Move option up"
                        >
                          <ChevronUp size={13} />
                        </button>

                        {/* Move Down */}
                        <button
                          disabled={realIdx === values.length - 1 || Boolean(optionSearch)}
                          onClick={() => handleMoveOption(realIdx, 'down')}
                          className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-20 cursor-pointer"
                          title="Move option down"
                        >
                          <ChevronDown size={13} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(realIdx, val)}
                          className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Edit value"
                        >
                          <Edit2 size={12} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleRemoveValue(realIdx)}
                          className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Remove option"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Workshop Bottom Status Bar */}
            <div className="p-3 px-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between text-xs text-[var(--color-text-muted)] font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Changes save instantly to workspace memory & Excel export engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-500">Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Floating Action Bar for Batch Selection ── */}
      <AnimatePresence>
        {selectedOptionValues.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-y-1/2 -translate-x-1/2 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border border-[var(--color-divider)] shadow-2xl rounded-2xl px-4 py-2.5 flex items-center gap-3 text-xs"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--color-divider)] font-bold text-[var(--color-text)]">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center text-[10px]">
                {selectedOptionValues.size}
              </span>
              <span>Selected</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleBatchCopyComma}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copy selected values as comma-separated list"
              >
                <Copy size={12} className="text-[var(--color-primary-hex)]" />
                <span>Copy CSV</span>
              </button>

              <button
                onClick={handleBatchCopyLines}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copy selected values as newline list"
              >
                <FileText size={12} className="text-purple-400" />
                <span>Copy Lines</span>
              </button>

              <button
                onClick={handleBatchDeleteOptions}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Delete selected options from library"
              >
                <Trash2 size={12} />
                <span>Delete ({selectedOptionValues.size})</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedOptionValues(new Set())}
              className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] ml-1 cursor-pointer"
              title="Deselect all"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Master-Detail Option Usage Dossier Drawer ── */}
      <SlideOverDrawer
        isOpen={Boolean(peekOptionValue)}
        onClose={() => setPeekOptionValue(null)}
        widthClass="w-full sm:w-[500px] lg:w-[560px]"
        onPrevious={hasPrevOption ? handlePrevOption : undefined}
        onNext={hasNextOption ? handleNextOption : undefined}
        hasPrevious={hasPrevOption}
        hasNext={hasNextOption}
      >
        {peekOptionValue && (() => {
          const usage = getOptionUsage(peekOptionValue);
          const isDef = defaults[selectedKey] === peekOptionValue;
          const badgeStyle = getOptionBadgeStyle(peekOptionValue);

          return (
            <div className="flex flex-col h-full overflow-y-auto custom-scroll p-6 space-y-6">
              {/* Drawer Header Banner */}
              <div className="space-y-3 pb-5 border-b border-[var(--color-divider)]">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5", badgeStyle)}>
                    <span className="w-2 h-2 rounded-full border shrink-0 bg-current" />
                    <span>{peekOptionValue}</span>
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-offset)] border border-[var(--color-divider)] text-[var(--color-text-muted)]">
                    {selectedKey}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-display font-black text-[var(--color-text)] tracking-tight">
                      {peekOptionValue}
                    </h2>
                    {isDef && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                        <Star size={10} className="fill-amber-500" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--color-text-muted)]">
                    <span>Belongs to</span>
                    <strong className="text-[var(--color-text)] font-semibold">{formatLibraryName(selectedKey)}</strong>
                    <span>library</span>
                  </div>
                </div>
              </div>

              {/* 4-Stat Metric Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Tasks</div>
                  <div className="text-base font-bold text-[var(--color-text)] mt-1">
                    <AnimatedMetric value={usage.tasks.length} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Defects</div>
                  <div className="text-base font-bold text-[var(--color-text)] mt-1">
                    <AnimatedMetric value={usage.defects.length} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Deliveries</div>
                  <div className="text-base font-bold text-[var(--color-text)] mt-1">
                    <AnimatedMetric value={usage.deliveries.length} />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/60 border border-[var(--color-divider)]">
                  <div className="text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase">Total Impact</div>
                  <div className="text-base font-bold text-[var(--color-primary-hex)] mt-1">
                    <AnimatedMetric value={usage.totalUsage} />
                  </div>
                </div>
              </div>

              {/* Orphan Risk Warning if Total Impact > 0 */}
              {usage.totalUsage > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 text-xs">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Live Workspace Dependencies</div>
                    <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                      This option is currently active in {usage.totalUsage} project entity records. Modifying or deleting it will impact live workflow records.
                    </div>
                  </div>
                </div>
              )}

              {/* Linked Entities Mini-List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text)]">
                  <span>Linked Project Records ({usage.totalUsage})</span>
                </div>

                {usage.totalUsage === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[var(--color-divider)] rounded-xl text-xs text-[var(--color-text-muted)]">
                    No live project records are currently using this option.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto custom-scroll space-y-1.5 p-1">
                    {usage.tasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { setView('tasks'); setPeekOptionValue(null); }}
                        className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] font-bold text-[var(--color-text-faint)] shrink-0">{t.id}</span>
                          <span className="font-semibold text-[var(--color-text)] truncate">{t.name}</span>
                        </div>
                        <span className="text-[10px] text-[var(--color-primary-hex)] font-semibold shrink-0 flex items-center gap-0.5">
                          <span>Task</span> <ExternalLink size={10} />
                        </span>
                      </div>
                    ))}
                    {usage.defects.map(d => (
                      <div
                        key={d.id}
                        onClick={() => { setView('defects'); setPeekOptionValue(null); }}
                        className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] font-bold text-[var(--color-text-faint)] shrink-0">{d.id}</span>
                          <span className="font-semibold text-[var(--color-text)] truncate">{d.title}</span>
                        </div>
                        <span className="text-[10px] text-rose-500 font-semibold shrink-0 flex items-center gap-0.5">
                          <span>Defect</span> <ExternalLink size={10} />
                        </span>
                      </div>
                    ))}
                    {usage.deliveries.map(del => (
                      <div
                        key={del.id}
                        onClick={() => { setView('deliveries'); setPeekOptionValue(null); }}
                        className="p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 transition-colors cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] font-bold text-[var(--color-text-faint)] shrink-0">{del.id}</span>
                          <span className="font-semibold text-[var(--color-text)] truncate">{del.name}</span>
                        </div>
                        <span className="text-[10px] text-sky-500 font-semibold shrink-0 flex items-center gap-0.5">
                          <span>Package</span> <ExternalLink size={10} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--color-divider)] space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleDefault(peekOptionValue)}
                  className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Star size={13} className={isDef ? "fill-amber-500 text-amber-500" : "text-amber-500"} />
                  <span>{isDef ? 'Clear as Default Value' : 'Set as Selector Default'}</span>
                </Button>
              </div>
            </div>
          );
        })()}
      </SlideOverDrawer>

      {/* ── 6. Bulk Edit Options Modal (Standard Accessible Modal) ── */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <span>Bulk Edit: {formatLibraryName(selectedKey)}</span>
            <SectionHelpButton view="dropdowns" section="Bulk Options Editor" label="Bulk options guide" size={13} />
          </span>
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsBulkOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBulk} className="font-bold shadow-sm">
              <Check size={14} className="mr-1.5" /> Save Values ({bulkText.split('\n').filter(s => s.trim()).length})
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={10}
            className="w-full text-xs font-mono p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] transition-all leading-relaxed shadow-inner"
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
          <div className="flex items-center justify-end text-[11px] text-[var(--color-text-faint)]">
            <span className="font-mono font-bold text-[var(--color-text)]">
              {bulkText.split('\n').filter(s => s.trim()).length} parsed items
            </span>
          </div>
        </div>
      </Modal>

      {/* ── 5. Create Custom Library Modal (Standard Accessible Modal) ── */}
      <Modal
        isOpen={isNewLibModalOpen}
        onClose={() => setIsNewLibModalOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <span>Create Custom Option Library</span>
            <SectionHelpButton view="dropdowns" section="Library Key Identifiers" label="Custom library guide" size={13} />
          </span>
        }
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsNewLibModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleCreateLibrary} 
              disabled={!newLibKey.trim()}
              className="font-bold shadow-sm"
            >
              <Plus size={14} className="mr-1.5" /> Create Library
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1.5">
              Library Key Identifier <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={newLibKey}
              onChange={(e) => setNewLibKey(e.target.value)}
              placeholder="e.g. tierLevel, billingPlan, region"
              className="w-full h-10 px-3.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-mono font-bold text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] transition-colors shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1.5">
              Initial Option Values <span className="text-[var(--color-text-faint)] font-normal">(optional)</span>
            </label>
            <textarea
              value={newLibInitialValues}
              onChange={(e) => setNewLibInitialValues(e.target.value)}
              rows={4}
              placeholder="Tier 1 - Enterprise&#10;Tier 2 - Growth&#10;Tier 3 - Starter"
              className="w-full text-xs p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] transition-colors shadow-inner leading-relaxed"
            />
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.confirmLabel}
      />
    </MotionPage>
  );
};

export default RegistryView;
