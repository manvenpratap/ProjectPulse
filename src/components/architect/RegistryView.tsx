import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  FolderPlus
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import SectionHelpButton from '../shared/SectionHelpButton';
import CollapsibleSummaryStrip from '../shared/CollapsibleSummaryStrip';
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
  
  // New option input
  const [newValue, setNewValue] = useState<string>('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // Inline editing state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Bulk edit modal
  const [isBulkOpen, setIsBulkOpen] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  // New Library Modal
  const [isNewLibModalOpen, setIsNewLibModalOpen] = useState<boolean>(false);
  const [newLibKey, setNewLibKey] = useState<string>('');
  const [newLibInitialValues, setNewLibInitialValues] = useState<string>('');

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

  // ── Actions ──

  const handleAddValue = () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      alert(`Value "${trimmed}" already exists in the "${formatLibraryName(selectedKey)}" library.`);
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
  };

  const handleRemoveValue = (idx: number) => {
    const target = values[idx];
    if (!window.confirm(`Remove option "${target}" from ${formatLibraryName(selectedKey)}?`)) return;
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
      alert(`Value "${trimmed}" already exists in this library.`);
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
  };

  const handleCreateLibrary = () => {
    const cleanKey = newLibKey.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanKey) {
      alert('Please enter a valid alphanumeric library key (e.g. tierLevel, billingPlan).');
      return;
    }
    if (dropdowns[cleanKey]) {
      alert(`An option library named "${cleanKey}" already exists.`);
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
  };

  const handleDeleteLibrary = () => {
    if (isReserved) {
      alert('System Core libraries cannot be deleted to preserve core entity schema integrity.');
      return;
    }
    if (window.confirm(`Delete entire "${formatLibraryName(selectedKey)}" (${selectedKey}) library? Any custom fields referencing this option set will fall back to manual entry.`)) {
      const nextDropdowns = { ...dropdowns };
      delete nextDropdowns[selectedKey];
      const nextDefaults = { ...defaults };
      delete nextDefaults[selectedKey];
      updateProject({
        dropdowns: nextDropdowns,
        dropdownDefaults: nextDefaults
      });
      setSelectedRegistryKey(Object.keys(nextDropdowns)[0] || 'status');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Option Libraries
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                {keys.length} <span className="text-xs font-medium text-[var(--color-text-muted)]">({coreCount} core · {customCount} custom)</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Total Defined Options
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                {totalValuesCount} <span className="text-xs font-medium text-[var(--color-text-muted)]">entries</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Tag size={16} />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Custom Fields Linked
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                {totalLinkedFields} <span className="text-xs font-medium text-[var(--color-text-muted)]">attributes</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Database size={16} />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
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
          </div>
        </div>
        </CollapsibleSummaryStrip>
      </div>

      {/* ── 3. Split Master/Detail Workshop Layout ── */}
      <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6 lg:p-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full min-h-0">
          {/* ── LEFT: Library Sidebar (Col 1-4) ── */}
          <div className="lg:col-span-4 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden h-full">
            {/* Sidebar Search & Tab Controls */}
            <div className="p-3.5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 space-y-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
                <input
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
                      onClick={() => setSelectedRegistryKey(k)}
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
          <div className="lg:col-span-8 flex flex-col bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden h-full">
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

            {/* Options List */}
            <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-2">
              {values.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[var(--color-divider)] rounded-2xl bg-[var(--color-surface-2)]/30">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] flex items-center justify-center text-[var(--color-text-faint)] mb-3">
                    <ListChecks size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-text)] mb-1">
                    Option Library is Empty
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] max-w-sm mb-4">
                    Add standard values using the input above, or use <strong>Bulk Edit</strong> to paste multiple options in one click.
                  </p>
                  <button
                    onClick={handleOpenBulk}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] text-xs font-bold border border-[var(--color-primary-hex)]/30 cursor-pointer"
                  >
                    Paste Multiple Values
                  </button>
                </div>
              ) : (
                values.map((val, idx) => {
                  const isDefault = currentDefault === val;
                  const isEditing = editingIdx === idx;
                  const badgeStyle = getOptionBadgeStyle(val);

                  return (
                    <div
                      key={idx}
                      className={clsx(
                        "p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group",
                        isDefault 
                          ? "bg-amber-500/[0.04] border-amber-500/30 shadow-2xs" 
                          : "bg-[var(--color-surface)] border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 hover:bg-[var(--color-surface-2)]/50"
                      )}
                    >
                      {/* Left: Index + Visual Pill + Text / Editor */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Index */}
                        <span className="font-mono text-[10px] font-bold text-[var(--color-text-faint)] w-6 text-center shrink-0">
                          {String(idx + 1).padStart(2, '0')}
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
                                if (e.key === 'Enter') handleSaveEdit(idx);
                                if (e.key === 'Escape') setEditingIdx(null);
                              }}
                              className="h-8 px-2 bg-[var(--color-surface-2)] border border-[var(--color-primary-hex)] rounded-lg text-xs font-bold text-[var(--color-text)] outline-none flex-1"
                            />
                            <button
                              onClick={() => handleSaveEdit(idx)}
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
                              onDoubleClick={() => handleStartEdit(idx, val)}
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
                          disabled={idx === 0}
                          onClick={() => handleMoveOption(idx, 'up')}
                          className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-20 cursor-pointer"
                          title="Move option up"
                        >
                          <ChevronUp size={13} />
                        </button>

                        {/* Move Down */}
                        <button
                          disabled={idx === values.length - 1}
                          onClick={() => handleMoveOption(idx, 'down')}
                          className="p-1 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-20 cursor-pointer"
                          title="Move option down"
                        >
                          <ChevronDown size={13} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(idx, val)}
                          className="p-1.5 rounded-lg text-[var(--color-text-faint)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                          title="Edit value"
                        >
                          <Edit2 size={12} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleRemoveValue(idx)}
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

      {/* ── 4. Bulk Edit Options Modal ── */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
            <div className="px-6 py-4 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center border border-[var(--color-primary-hex)]/20">
                  <ListChecks size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">
                    Bulk Edit: <span>{formatLibraryName(selectedKey)}</span>
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">One value per line. Duplicates automatically pruned upon save.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scroll space-y-3">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={12}
                className="w-full text-xs font-mono p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary-hex)] transition-all leading-relaxed shadow-inner"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-faint)]">
                <span>Empty lines excluded. Original ordering preserved.</span>
                <span className="font-mono font-bold text-[var(--color-text)]">
                  {bulkText.split('\n').filter(s => s.trim()).length} parsed items
                </span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-end gap-2.5">
              <Button variant="ghost" size="sm" onClick={() => setIsBulkOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveBulk} className="font-bold shadow-sm">
                <Check size={14} className="mr-1.5" /> Save Values ({bulkText.split('\n').filter(s => s.trim()).length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Create Custom Library Modal ── */}
      {isNewLibModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
            <div className="px-6 py-4 border-b border-[var(--color-divider)] flex items-center justify-between bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <FolderPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--color-text)]">
                    Create Custom Option Library
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Define a reusable selection taxonomy for custom fields</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewLibModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                <p className="text-[11px] text-[var(--color-text-faint)] mt-1">
                  Alphanumeric identifier used across schemas and custom field lookups.
                </p>
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
                <p className="text-[11px] text-[var(--color-text-faint)] mt-1">
                  Separate with new lines or commas. More can be added anytime.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex items-center justify-end gap-2.5">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistryView;
