import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import {
  Building,
  Trash2,
  Edit2,
  Plus,
  Database,
  Layout,
  Type,
  Calendar,
  Hash,
  CheckSquare,
  RotateCcw,
  Search,
  CheckCircle2,
  ShieldCheck,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  ListFilter,
  BarChart2,
  FileText,
  ClipboardList,
  Bug,
  Package,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  X,
  Undo2,
  ExternalLink,
  Columns3,
  AlertCircle
} from 'lucide-react';
import SectionHelpButton from '../shared/SectionHelpButton';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import Modal from '../shared/Modal';
import { formatLibraryName } from './RegistryView';
import clsx from 'clsx';
import { CustomField, FieldConfig } from '../../types';
import {
  DEFAULT_TASK_COLS,
  DEFAULT_DEFECT_COLS,
  DEFAULT_DELIVERY_COLS
} from '../../store/defaultState';

type DomainTab = 'tasks' | 'defects' | 'deliveries';
type ColFilter = 'all' | 'visible' | 'hidden' | 'modified';

interface UndoSnapshot {
  tab: DomainTab;
  message: string;
  cols?: FieldConfig[];
  customFields?: CustomField[];
}

const DOMAIN_META: Record<DomainTab, { label: string; targetView: string; linkLabel: string }> = {
  tasks: { label: 'Tasks', targetView: 'tasks', linkLabel: 'Tasks Grid' },
  defects: { label: 'Defects', targetView: 'defects', linkLabel: 'Defect Workshop' },
  deliveries: { label: 'Deliveries', targetView: 'deliveries', linkLabel: 'ALM Deliveries' }
};

const DOMAIN_STARTERS: Record<DomainTab, CustomField[]> = {
  tasks: [
    { name: 'Client Signoff', type: 'checkbox', required: false },
    { name: 'Risk Score', type: 'number', required: false },
    { name: 'Release Gate', type: 'dropdown', source: 'manual', options: ['Dev Ready', 'QA Approved', 'UAT Signed Off', 'Prod Live'], required: false },
    { name: 'Target Audit Date', type: 'date', required: false }
  ],
  defects: [
    { name: 'Customer Impacted', type: 'checkbox', required: false },
    { name: 'Regression Build', type: 'text', required: false },
    { name: 'Root Cause Category', type: 'dropdown', source: 'manual', options: ['Logic', 'API Contract', 'Data Sync', 'UI Layout', 'Infra'], required: false },
    { name: 'Fix ETA', type: 'date', required: false }
  ],
  deliveries: [
    { name: 'Security Scan Passed', type: 'checkbox', required: false },
    { name: 'Deployment Window', type: 'dropdown', source: 'manual', options: ['Weekday Off-Peak', 'Weekend Change', 'Hotfix Immediate'], required: false },
    { name: 'Artifact Size (MB)', type: 'number', required: false },
    { name: 'Go-Live Signoff Date', type: 'date', required: false }
  ]
};

const LOCKED_KEYS = new Set(['id', 'name', 'title', 'almId']);

/** Local-draft numeric input so clearing characters doesn't immediately snap to a fallback width. */
const WidthNumberInput: React.FC<{
  value: number;
  ariaLabel: string;
  onCommit: (width: number) => void;
}> = ({ value, ariaLabel, onCommit }) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 50 && parsed <= 600) {
      onCommit(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(draft, 10);
    const clamped = Number.isNaN(parsed) ? value : Math.max(50, Math.min(600, parsed));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <input
      type="number"
      min={50}
      max={600}
      step={10}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label={ariaLabel}
      className="w-full md:w-16 px-1.5 py-1.5 md:py-1 text-xs font-mono font-bold tabular-nums text-center rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] text-[var(--color-text)] outline-none transition-colors"
    />
  );
};

const getTypeDisplay = (type?: string, mapKey?: string) => {
  switch (type) {
    case 'date':
      return { icon: <Calendar size={12} />, label: 'TEMPORAL', tone: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
    case 'number':
      return { icon: <TrendingUp size={12} />, label: 'NUMERIC', tone: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    case 'select':
      return {
        icon: <ListFilter size={12} />,
        label: mapKey ? `SELECTION • ${mapKey.toUpperCase()}` : 'SELECTION',
        tone: 'text-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] border-[var(--color-primary-hex)]/20'
      };
    case 'progress':
      return { icon: <BarChart2 size={12} />, label: 'PERCENTAGE', tone: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    case 'checkbox':
      return { icon: <CheckSquare size={12} />, label: 'BOOLEAN', tone: 'text-violet-400 bg-violet-500/10 border-violet-500/20' };
    default:
      return { icon: <FileText size={12} />, label: 'TEXT', tone: 'text-[var(--color-text-muted)] bg-[var(--color-surface-2)] border-[var(--color-divider)]' };
  }
};

export const FieldArchitect: React.FC = () => {
  const { state, updateProject, setView } = useProject();
  const [activeTab, setActiveTab] = useState<DomainTab>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [colFilter, setColFilter] = useState<ColFilter>('all');

  // Drag & drop + focus jump state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState('');
  const [undoState, setUndoState] = useState<UndoSnapshot | null>(null);

  // Custom Field Form State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CustomField['type']>('text');
  const [formSource, setFormSource] = useState<'manual' | 'global'>('manual');
  const [formGlobalKey, setFormGlobalKey] = useState<string>('category');
  const [formOptions, setFormOptions] = useState<string>('');
  const [formRequired, setFormRequired] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  const showUndoToast = (snapshot: UndoSnapshot) => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setUndoState(snapshot);
    undoTimerRef.current = window.setTimeout(() => setUndoState(null), 8000);
  };

  // Current & factory default columns for active domain
  const defaultCols: FieldConfig[] = useMemo(() => {
    if (activeTab === 'tasks') return DEFAULT_TASK_COLS;
    if (activeTab === 'defects') return DEFAULT_DEFECT_COLS;
    return DEFAULT_DELIVERY_COLS;
  }, [activeTab]);

  const defaultColMap = useMemo(() => {
    const map = new Map<string, { col: FieldConfig; index: number }>();
    defaultCols.forEach((col, index) => map.set(col.key, { col, index }));
    return map;
  }, [defaultCols]);

  const stdCols: FieldConfig[] = useMemo(() => {
    if (activeTab === 'tasks') return state.cols || DEFAULT_TASK_COLS;
    if (activeTab === 'defects') return state.defCols || DEFAULT_DEFECT_COLS;
    return state.delCols || DEFAULT_DELIVERY_COLS;
  }, [activeTab, state.cols, state.defCols, state.delCols]);

  const customFields: CustomField[] = useMemo(() => {
    if (activeTab === 'tasks') return state.customFields || [];
    if (activeTab === 'defects') return state.defCustomFields || [];
    return state.delCustomFields || [];
  }, [activeTab, state.customFields, state.defCustomFields, state.delCustomFields]);

  const isColModified = (col: FieldConfig, realIdx: number) => {
    const def = defaultColMap.get(col.key);
    if (!def) return true;
    return (
      col.label !== def.col.label ||
      (col.width || 120) !== (def.col.width || 120) ||
      (col.visible !== false) !== (def.col.visible !== false) ||
      realIdx !== def.index
    );
  };

  // Telemetry stats
  const visibleStdCols = useMemo(() => stdCols.filter(c => c.visible !== false), [stdCols]);
  const hiddenCount = stdCols.length - visibleStdCols.length;
  const modifiedCount = useMemo(
    () => stdCols.filter((c, i) => isColModified(c, i)).length,
    [stdCols, defaultColMap]
  );
  const totalAttributes = stdCols.length + customFields.length;
  const totalVisibleWidthPx = useMemo(
    () => visibleStdCols.reduce((sum, c) => sum + (c.width || 120), 0) + customFields.length * 130,
    [visibleStdCols, customFields]
  );

  const canDragReorder = !searchQuery.trim() && colFilter === 'all';

  // Filtered standard fields
  const filteredStdCols = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stdCols.filter((c, idx) => {
      if (colFilter === 'visible' && c.visible === false) return false;
      if (colFilter === 'hidden' && c.visible !== false) return false;
      if (colFilter === 'modified' && !isColModified(c, idx)) return false;
      if (!q) return true;
      return (
        c.key.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        (c.type || '').toLowerCase().includes(q) ||
        (c.mapKey || '').toLowerCase().includes(q)
      );
    });
  }, [stdCols, searchQuery, colFilter, defaultColMap]);

  // Filtered custom fields
  const filteredCustomFields = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customFields;
    return customFields.filter(cf =>
      cf.name.toLowerCase().includes(q) ||
      cf.type.toLowerCase().includes(q) ||
      (cf.globalKey || '').toLowerCase().includes(q)
    );
  }, [customFields, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: System Core Attributes
  // ─────────────────────────────────────────────────────────────

  const handleUpdateCols = (newCols: FieldConfig[], tab: DomainTab = activeTab) => {
    if (tab === 'tasks') updateProject({ cols: newCols });
    else if (tab === 'defects') updateProject({ defCols: newCols });
    else updateProject({ delCols: newCols });
  };

  const handleUpdateCustomFields = (newFields: CustomField[], tab: DomainTab = activeTab) => {
    if (tab === 'tasks') updateProject({ customFields: newFields });
    else if (tab === 'defects') updateProject({ defCustomFields: newFields });
    else updateProject({ delCustomFields: newFields });
  };

  const handleLabelChange = (key: string, newLabel: string) => {
    handleUpdateCols(stdCols.map(c => c.key === key ? { ...c, label: newLabel } : c));
  };

  const handleWidthChange = (key: string, newWidth: number) => {
    const widthVal = Math.max(50, Math.min(600, Number.isNaN(newWidth) ? 120 : newWidth));
    handleUpdateCols(stdCols.map(c => c.key === key ? { ...c, width: widthVal } : c));
  };

  const handleToggleVisibility = (key: string) => {
    if (LOCKED_KEYS.has(key)) return;
    const target = stdCols.find(c => c.key === key);
    const updated = stdCols.map(c => c.key === key ? { ...c, visible: c.visible === false ? true : false } : c);
    handleUpdateCols(updated);
    if (target) {
      setLiveStatus(`${target.label} ${target.visible === false ? 'shown' : 'hidden'} in ${DOMAIN_META[activeTab].label}`);
    }
  };

  const handleShowAllHidden = () => {
    showUndoToast({ tab: activeTab, cols: stdCols, message: `Restored ${hiddenCount} hidden column${hiddenCount === 1 ? '' : 's'}` });
    handleUpdateCols(stdCols.map(c => ({ ...c, visible: true })));
    setLiveStatus(`All hidden columns restored in ${DOMAIN_META[activeTab].label}`);
  };

  const handleMoveCol = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= stdCols.length || fromIdx === toIdx) return;
    const next = [...stdCols];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    handleUpdateCols(next);
    setLiveStatus(`Moved ${moved.label} to position ${toIdx + 1} of ${stdCols.length}`);
  };

  const handleResetSingleCol = (key: string) => {
    const def = defaultColMap.get(key);
    if (!def) return;
    showUndoToast({ tab: activeTab, cols: stdCols, message: `Restored ${def.col.label} to default` });
    handleUpdateCols(stdCols.map(c => c.key === key ? { ...def.col } : c));
    setLiveStatus(`Restored ${def.col.label} to default`);
  };

  const handleResetDefaults = () => {
    showUndoToast({
      tab: activeTab,
      cols: stdCols,
      message: `Reset ${DOMAIN_META[activeTab].label} columns to defaults`
    });
    handleUpdateCols(defaultCols.map(c => ({ ...c })));
    setColFilter('all');
    setLiveStatus(`Reset ${DOMAIN_META[activeTab].label} columns to defaults`);
  };

  const handleUndo = () => {
    if (!undoState) return;
    if (undoState.cols) handleUpdateCols(undoState.cols, undoState.tab);
    if (undoState.customFields) handleUpdateCustomFields(undoState.customFields, undoState.tab);
    setActiveTab(undoState.tab);
    setLiveStatus(`Reverted: ${undoState.message}`);
    setUndoState(null);
  };

  const jumpToField = (selectorAttr: 'data-field-key' | 'data-custom-key', key: string) => {
    setFocusedKey(key);
    const el = document.querySelector(`[${selectorAttr}="${CSS.escape(key)}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    window.setTimeout(() => setFocusedKey(prev => (prev === key ? null : prev)), 1600);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: Custom Fields (Add / Edit / Starter / Toggle / Remove)
  // ─────────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingIdx(null);
    setFormName('');
    setFormType('text');
    setFormSource('manual');
    setFormGlobalKey(Object.keys(state.dropdowns || {})[0] || 'category');
    setFormOptions('');
    setFormRequired(false);
    setNameError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const cf = customFields[idx];
    if (!cf) return;
    setEditingIdx(idx);
    setFormName(cf.name);
    setFormType(cf.type);
    setFormSource(cf.source === 'global' ? 'global' : 'manual');
    setFormGlobalKey(cf.globalKey || Object.keys(state.dropdowns || {})[0] || 'category');
    setFormOptions(Array.isArray(cf.options) ? cf.options.join('; ') : '');
    setFormRequired(!!cf.required);
    setNameError(null);
    setIsModalOpen(true);
  };

  const handleSaveCustomField = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setNameError('Enter an attribute display name.');
      nameInputRef.current?.focus();
      return;
    }

    const duplicate = customFields.some(
      (f, i) => i !== editingIdx && f.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      setNameError(`"${trimmedName}" already exists in ${DOMAIN_META[activeTab].label}.`);
      nameInputRef.current?.focus();
      return;
    }

    const optionsList = formSource === 'manual' && formType === 'dropdown'
      ? formOptions.split(/[;,]/).map(s => s.trim()).filter(Boolean)
      : undefined;

    const newField: CustomField = {
      name: trimmedName,
      type: formType,
      source: formType === 'dropdown' ? formSource : undefined,
      globalKey: formType === 'dropdown' && formSource === 'global' ? formGlobalKey : undefined,
      options: optionsList,
      required: formRequired
    };

    const updated = [...customFields];
    if (editingIdx !== null) updated[editingIdx] = newField;
    else updated.push(newField);

    handleUpdateCustomFields(updated);
    setIsModalOpen(false);
    setLiveStatus(`${editingIdx !== null ? 'Updated' : 'Created'} custom field ${trimmedName}`);
  };

  const handleAddStarterField = (starter: CustomField) => {
    const exists = customFields.some(f => f.name.toLowerCase() === starter.name.toLowerCase());
    if (exists) {
      jumpToField('data-custom-key', starter.name);
      return;
    }
    showUndoToast({
      tab: activeTab,
      customFields,
      message: `Added "${starter.name}" custom field`
    });
    handleUpdateCustomFields([...customFields, { ...starter }]);
    setLiveStatus(`Added custom field ${starter.name}`);
  };

  const handleDuplicateCustomField = (idx: number) => {
    const cf = customFields[idx];
    if (!cf) return;
    let copyName = `${cf.name} Copy`;
    let n = 2;
    while (customFields.some(f => f.name.toLowerCase() === copyName.toLowerCase())) {
      copyName = `${cf.name} Copy ${n++}`;
    }
    handleUpdateCustomFields([...customFields, { ...cf, name: copyName }]);
    setLiveStatus(`Duplicated ${cf.name} as ${copyName}`);
  };

  const handleToggleCustomRequired = (idx: number) => {
    const updated = customFields.map((cf, i) => (i === idx ? { ...cf, required: !cf.required } : cf));
    handleUpdateCustomFields(updated);
  };

  const handleRemoveCustomField = (idx: number) => {
    const cf = customFields[idx];
    if (!cf) return;
    showUndoToast({
      tab: activeTab,
      customFields,
      message: `Deleted "${cf.name}" custom field`
    });
    handleUpdateCustomFields(customFields.filter((_, i) => i !== idx));
    setLiveStatus(`Deleted custom field ${cf.name}`);
  };

  const handleCopyStorageKey = async (cfName: string) => {
    const storageKey = `CF_${cfName.replace(/\s+/g, '_').toUpperCase()}`;
    try {
      await navigator.clipboard.writeText(storageKey);
      setCopiedKey(storageKey);
      window.setTimeout(() => setCopiedKey(prev => (prev === storageKey ? null : prev)), 1500);
    } catch {
      // Clipboard may be unavailable in non-HTTPS contexts
    }
  };

  const availableDropdownKeys = Object.keys(state.dropdowns || {});
  const parsedManualOptions = useMemo(
    () => formOptions.split(/[;,]/).map(s => s.trim()).filter(Boolean),
    [formOptions]
  );
  const generatedKey = formName.trim()
    ? `CF_${formName.trim().replace(/\s+/g, '_').toUpperCase()}`
    : 'CF_ATTRIBUTE_KEY';

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] relative">
      {/* Screen reader status announcer (dynamic-sort) */}
      <p role="status" className="sr-only">
        {liveStatus}
      </p>

      {/* ── Page Header ── */}
      <PageHeader
        icon={Database}
        title="Field Architect"
        actions={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap md:flex-wrap">
            {/* Domain Switcher (keep exact accessible names TASKS / DEFECTS / DELIVERIES) */}
            <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => { setActiveTab('tasks'); setColFilter('all'); }}
                className={clsx(
                  'px-3 py-1.5 min-h-[34px] flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95',
                  activeTab === 'tasks'
                    ? 'bg-[var(--color-primary-hex)] text-white shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <ClipboardList size={13} />
                <span>TASKS</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('defects'); setColFilter('all'); }}
                className={clsx(
                  'px-3 py-1.5 min-h-[34px] flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95',
                  activeTab === 'defects'
                    ? 'bg-[var(--color-primary-hex)] text-white shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <Bug size={13} />
                <span>DEFECTS</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('deliveries'); setColFilter('all'); }}
                className={clsx(
                  'px-3 py-1.5 min-h-[34px] flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95',
                  activeTab === 'deliveries'
                    ? 'bg-[var(--color-primary-hex)] text-white shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <Package size={13} />
                <span>DELIVERIES</span>
              </button>
            </div>

            {/* Open active matrix in app */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView(DOMAIN_META[activeTab].targetView)}
              title={`Open ${DOMAIN_META[activeTab].linkLabel}`}
              className="h-9 px-2.5 text-xs font-semibold rounded-xl hidden lg:inline-flex"
            >
              <ExternalLink size={13} className="mr-1.5" />
              <span>{DOMAIN_META[activeTab].linkLabel}</span>
            </Button>

            {/* Reset Defaults */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              title="Reset field labels, order, and widths back to system factory defaults"
              className={clsx(
                'h-9 px-3 text-xs font-bold rounded-xl active:scale-95 transition-colors',
                modifiedCount > 0 && 'border-amber-500/40 bg-amber-500/5'
              )}
            >
              <RotateCcw size={13} className="mr-1.5 text-amber-500" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </Button>
          </div>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            className="h-9 px-3.5 rounded-xl font-bold active:scale-95 shadow-xs"
          >
            <Plus size={14} className="mr-1.5" />
            <span>Add Field</span>
          </Button>
        }
      />

      {/* ── Filter Bar & Live Telemetry Strip ── */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-divider)] px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <search className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] opacity-60 pointer-events-none" />
            <input
              type="search"
              placeholder="Filter attributes by name, type, or ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Filter attributes by name, type, or ID"
              className="w-full h-8 pl-8 pr-7 text-xs rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] text-[var(--color-text)] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear attribute search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5 rounded cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </search>

          {/* Attribute state filters */}
          <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl overflow-x-auto no-scrollbar">
            {([
              { id: 'all', label: 'All', count: stdCols.length },
              { id: 'visible', label: 'Visible', count: visibleStdCols.length },
              { id: 'hidden', label: 'Hidden', count: hiddenCount },
              { id: 'modified', label: 'Modified', count: modifiedCount }
            ] as const).map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setColFilter(pill.id)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap',
                  colFilter === pill.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs border border-[var(--color-divider)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                )}
              >
                <span>{pill.label}</span>
                <span className="font-mono text-[10px] opacity-75 tabular-nums">{pill.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Real Schema Telemetry Pills */}
        <div className="grid grid-cols-2 sm:flex w-full md:w-auto items-stretch border border-[var(--color-divider)] rounded-xl overflow-hidden bg-[var(--color-surface-2)] shadow-2xs text-xs">
          <div className="px-3 py-1.5 flex items-center gap-2 border-b sm:border-b-0 border-r border-[var(--color-divider)]">
            <Database size={13} className="text-[var(--color-primary-hex)]" />
            <span className="font-semibold text-[var(--color-text-muted)]">Total</span>
            <span className="font-mono font-bold tabular-nums text-[var(--color-text)]">{totalAttributes}</span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-2 border-b sm:border-b-0 sm:border-r border-[var(--color-divider)]">
            <ShieldCheck size={13} className="text-sky-500" />
            <span className="font-semibold text-[var(--color-text-muted)]">Visible</span>
            <span className="font-mono font-bold tabular-nums text-sky-500">
              {visibleStdCols.length}/{stdCols.length}
            </span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-[var(--color-divider)]">
            <Layers size={13} className="text-amber-500" />
            <span className="font-semibold text-[var(--color-text-muted)]">Custom</span>
            <span className="font-mono font-bold tabular-nums text-amber-500">{customFields.length}</span>
          </div>
          <div
            className={clsx(
              'px-3 py-1.5 flex items-center gap-1.5 font-semibold',
              modifiedCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
            )}
          >
            <CheckCircle2 size={13} />
            <span className="font-mono tabular-nums">
              {modifiedCount > 0 ? `${modifiedCount} Customized` : 'Factory Sync'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full space-y-5">
        {/* LIVE TABLE COLUMN BLUEPRINT PREVIEW */}
        <section
          aria-label="Live table column preview"
          className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl p-3.5 sm:p-4 shadow-2xs min-w-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Columns3 size={14} className="text-[var(--color-primary-hex)]" />
              <span className="text-xs font-bold text-[var(--color-text)]">
                Live Table Header Blueprint
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-muted)] tabular-nums">
                {visibleStdCols.length + customFields.length} COLS • {totalVisibleWidthPx.toLocaleString()} PX
              </span>
            </div>
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={handleShowAllHidden}
                className="text-[11px] font-semibold text-[var(--color-primary-hex)] hover:underline cursor-pointer flex items-center gap-1"
              >
                <Eye size={12} />
                <span>Show {hiddenCount} hidden</span>
              </button>
            )}
          </div>

          <div className="flex items-stretch gap-1.5 overflow-x-auto custom-scroll pb-1 max-w-full">
            {visibleStdCols.map((col, idx) => {
              const mod = isColModified(col, stdCols.findIndex(c => c.key === col.key));
              const colWidth = col.width || 120;
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => jumpToField('data-field-key', col.key)}
                  style={{ width: `${Math.max(92, Math.min(240, colWidth))}px`, flexShrink: 0 }}
                  title={`${col.label || col.key} (${colWidth}px) — click to locate row`}
                  className={clsx(
                    'text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-98 group',
                    focusedKey === col.key
                      ? 'border-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)] shadow-xs'
                      : 'border-[var(--color-divider)] bg-[var(--color-surface-2)]/70 hover:border-[var(--color-primary-hex)]/50 hover:bg-[var(--color-surface-2)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-[var(--color-text-faint)]">
                    <span className="tabular-nums">#{idx + 1}</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      {mod && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Modified from default" />}
                      {colWidth}px
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-[var(--color-text)] truncate mt-0.5">
                    {col.label || col.key.toUpperCase()}
                  </div>
                </button>
              );
            })}

            {customFields.map(cf => (
              <button
                key={`preview-${cf.name}`}
                type="button"
                onClick={() => jumpToField('data-custom-key', cf.name)}
                style={{ width: '132px', flexShrink: 0 }}
                title={`Custom: ${cf.name} (${cf.type}) — click to locate`}
                className={clsx(
                  'text-left px-2.5 py-1.5 rounded-xl border border-dashed transition-all cursor-pointer active:scale-98',
                  focusedKey === cf.name
                    ? 'border-amber-500 bg-amber-500/15'
                    : 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500 hover:bg-amber-500/10'
                )}
              >
                <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-amber-500">
                  <span>CUSTOM</span>
                  <span className="uppercase">{cf.type}</span>
                </div>
                <div className="text-[11px] font-bold text-[var(--color-text)] truncate mt-0.5">
                  {cf.name.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ═════════════════════════════════════════════════════════ */}
          {/* LEFT PANEL: SYSTEM CORE ATTRIBUTES (Existing Fields)      */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="xl:col-span-8 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-hex)] shadow-[0_0_8px_var(--color-primary-hex)] shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="!font-sans font-bold text-sm tracking-tight text-[var(--color-text)] truncate">
                    System Core Attributes
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-primary-hex)] border border-[var(--color-divider)] tabular-nums shrink-0 whitespace-nowrap">
                    {visibleStdCols.length} ACTIVE
                  </span>
                  <SectionHelpButton view="fields" section="Schema Synchronization" label="Core Attributes guide" size={13} />
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[var(--color-text-faint)] uppercase hidden md:inline shrink-0">
                {activeTab.toUpperCase()} SCHEMA
              </span>
            </div>

            {/* Desktop List Header (>= md) */}
            <div className="hidden md:grid md:grid-cols-[88px_minmax(88px,0.85fr)_156px_minmax(185px,1.8fr)_90px] gap-2.5 px-4 py-2.5 bg-[var(--color-surface-2)]/30 border-b border-[var(--color-divider)] text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase tracking-wider">
              <div className="text-center">ORDER</div>
              <div>SYSTEM ID</div>
              <div>DATA TYPE</div>
              <div>CUSTOM DISPLAY LABEL</div>
              <div className="text-right">WIDTH (PX)</div>
            </div>

            {/* Single-DOM Responsive Schema List */}
            <div className="divide-y divide-[var(--color-divider)]">
              {filteredStdCols.map((col) => {
                const realIdx = stdCols.findIndex(c => c.key === col.key);
                const typeInfo = getTypeDisplay(col.type, col.mapKey);
                const isLocked = LOCKED_KEYS.has(col.key);
                const isHidden = col.visible === false;
                const modified = isColModified(col, realIdx);
                const widthPct = Math.min(100, Math.round(((col.width || 120) / 420) * 100));

                return (
                  <div
                    key={col.key}
                    data-field-key={col.key}
                    onDragOver={(e) => {
                      if (!canDragReorder || dragIdx === null) return;
                      e.preventDefault();
                      if (dragOverIdx !== realIdx) setDragOverIdx(realIdx);
                    }}
                    onDrop={(e) => {
                      if (!canDragReorder || dragIdx === null) return;
                      e.preventDefault();
                      handleMoveCol(dragIdx, realIdx);
                      setDragIdx(null);
                      setDragOverIdx(null);
                    }}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 60px' }}
                    className={clsx(
                      'grid grid-cols-12 md:grid-cols-[88px_minmax(88px,0.85fr)_156px_minmax(185px,1.8fr)_90px] gap-2.5 items-center px-3.5 sm:px-4 py-3.5 md:py-2.5 transition-all duration-150 hover:bg-[var(--color-surface-2)]/50',
                      isHidden && 'opacity-55 bg-[var(--color-surface-2)]/25',
                      focusedKey === col.key && 'ring-2 ring-inset ring-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)]/40',
                      dragOverIdx === realIdx && dragIdx !== realIdx && 'border-t-2 border-t-[var(--color-primary-hex)] bg-[var(--color-primary-highlight-hex)]/25'
                    )}
                  >
                    {/* Drag Grip, Up/Down & Visibility */}
                    <div className="col-span-5 md:col-auto order-2 md:order-1 flex items-center justify-end md:justify-start gap-1">
                      <div
                        draggable={canDragReorder}
                        onDragStart={(e) => {
                          setDragIdx(realIdx);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDragIdx(null);
                          setDragOverIdx(null);
                        }}
                        title={canDragReorder ? 'Drag row to reorder column' : 'Clear search & filters to drag-reorder'}
                        className={clsx(
                          'hidden md:flex items-center justify-center p-0.5 rounded text-[var(--color-text-faint)]',
                          canDragReorder
                            ? 'cursor-grab active:cursor-grabbing hover:text-[var(--color-text)]'
                            : 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        <GripVertical size={13} />
                      </div>

                      <div className="flex flex-row md:flex-col items-center gap-0.5 md:gap-0">
                        <button
                          type="button"
                          onClick={() => handleMoveCol(realIdx, realIdx - 1)}
                          disabled={realIdx === 0}
                          title="Move up"
                          aria-label={`Move ${col.key} up`}
                          className="p-1.5 md:p-0.5 min-h-[34px] min-w-[34px] md:min-h-0 md:min-w-0 flex items-center justify-center rounded-lg md:rounded bg-[var(--color-surface-2)] md:bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp size={12} className="md:w-[11px] md:h-[11px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCol(realIdx, realIdx + 1)}
                          disabled={realIdx === stdCols.length - 1}
                          title="Move down"
                          aria-label={`Move ${col.key} down`}
                          className="p-1.5 md:p-0.5 min-h-[34px] min-w-[34px] md:min-h-0 md:min-w-0 flex items-center justify-center rounded-lg md:rounded bg-[var(--color-surface-2)] md:bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown size={12} className="md:w-[11px] md:h-[11px]" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(col.key)}
                        disabled={isLocked}
                        aria-pressed={isLocked ? undefined : !isHidden}
                        title={isLocked ? 'Required core field (cannot hide)' : isHidden ? 'Show column in table' : 'Hide column in table'}
                        aria-label={isLocked ? 'Required core field' : isHidden ? `Show ${col.key}` : `Hide ${col.key}`}
                        className={clsx(
                          'p-1.5 md:p-1 min-h-[34px] min-w-[34px] md:min-h-0 md:min-w-0 flex items-center justify-center rounded-lg md:rounded cursor-pointer transition-colors border md:border-0 border-[var(--color-divider)] bg-[var(--color-surface-2)] md:bg-transparent',
                          isLocked
                            ? 'text-[var(--color-text-faint)] cursor-not-allowed opacity-50'
                            : isHidden
                              ? 'text-rose-400 hover:text-rose-300'
                              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        )}
                      >
                        {isLocked ? <Lock size={12} /> : isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>

                      {modified && defaultColMap.has(col.key) && (
                        <button
                          type="button"
                          onClick={() => handleResetSingleCol(col.key)}
                          title="Restore this attribute to factory default"
                          aria-label={`Restore ${col.key} default`}
                          className="p-1 rounded text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          <RotateCcw size={11} />
                        </button>
                      )}
                    </div>

                    {/* System ID + Mobile Type Pill (stacked cleanly on mobile, separate cols on md+) */}
                    <div
                      className="col-span-7 md:col-auto order-1 md:order-2 flex md:block items-center gap-2 min-w-0"
                      title={col.key}
                    >
                      <div className="font-mono text-xs md:text-[11px] font-bold text-[var(--color-text)] md:text-[var(--color-text-muted)] truncate flex items-center gap-1.5">
                        <span className="truncate">{col.key.toUpperCase()}</span>
                        {modified && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                            title="Customized from factory default"
                          />
                        )}
                      </div>
                      <div className="md:hidden inline-flex shrink-0">
                        <div
                          className={clsx(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border',
                            typeInfo.tone
                          )}
                        >
                          {typeInfo.icon}
                          <span className="truncate max-w-[84px]">{typeInfo.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Data Type Pill */}
                    <div className="hidden md:block md:order-3 min-w-0">
                      <div
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border truncate max-w-full',
                          typeInfo.tone
                        )}
                      >
                        {typeInfo.icon}
                        <span className="truncate">{typeInfo.label}</span>
                      </div>
                    </div>

                    {/* Custom Display Label Input */}
                    <div className="col-span-8 md:col-auto order-3 md:order-4">
                      <input
                        type="text"
                        value={col.label}
                        onChange={e => handleLabelChange(col.key, e.target.value)}
                        placeholder={col.key}
                        aria-label={`Display label for ${col.key}`}
                        className="w-full px-2.5 py-1.5 md:py-1 text-xs font-semibold rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] focus:bg-[var(--color-surface)] text-[var(--color-text)] outline-none transition-colors"
                        title="Edit column display label for table headers & exports"
                      />
                    </div>

                    {/* Column Width Input + Visual Proportion Bar */}
                    <div className="col-span-4 md:col-auto order-4 md:order-5 flex flex-col items-end gap-1">
                      <div className="flex items-center justify-end gap-1.5 w-full md:w-auto">
                        <WidthNumberInput
                          value={col.width || 120}
                          ariaLabel={`Width in px for ${col.key}`}
                          onCommit={(w) => handleWidthChange(col.key, w)}
                        />
                        <span className="text-[10px] font-mono text-[var(--color-text-faint)] font-bold">PX</span>
                      </div>
                      <div className="hidden md:block w-20 h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary-hex)]/65 transition-all duration-200"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredStdCols.length === 0 && (
                <div className="p-8 text-center space-y-2 text-xs text-[var(--color-text-muted)]">
                  <p>No system attributes matched the active filter.</p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setColFilter('all'); }}
                    className="text-[var(--color-primary-hex)] font-semibold hover:underline cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* RIGHT PANEL: CUSTOM EXTENSIONS & QUICK STARTERS           */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="xl:col-span-4 space-y-5">
            <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden flex flex-col">
              {/* Panel Header */}
              <div className="p-4 sm:p-5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] shrink-0" />
                  <h3 className="!font-sans font-bold text-sm tracking-tight text-[var(--color-text)] truncate">
                    Custom Extensions
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-amber-500 border border-[var(--color-divider)] tabular-nums shrink-0">
                    {customFields.length}
                  </span>
                  <SectionHelpButton view="fields" section="Field Types" label="Custom Fields guide" size={13} />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openAddModal}
                  className="h-8 px-2.5 rounded-lg text-xs font-bold active:scale-95 shrink-0"
                >
                  <Plus size={13} className="mr-1" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Custom Field Cards List */}
              <div className="p-4 space-y-3 max-h-[620px] overflow-y-auto custom-scroll">
                {filteredCustomFields.map(cf => {
                  const realIdx = customFields.findIndex(f => f.name === cf.name);
                  const isDropdown = cf.type === 'dropdown';
                  const isGlobal = cf.source === 'global';
                  const storageKey = `CF_${cf.name.replace(/\s+/g, '_').toUpperCase()}`;

                  return (
                    <div
                      key={cf.name}
                      data-custom-key={cf.name}
                      className={clsx(
                        'p-3.5 rounded-xl border bg-[var(--color-surface-2)]/40 hover:border-[var(--color-primary-hex)]/40 hover:bg-[var(--color-surface-2)] transition-all shadow-2xs group',
                        focusedKey === cf.name
                          ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
                          : 'border-[var(--color-divider)]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/20 shadow-2xs">
                            {cf.type === 'number' ? <Hash size={15} /> :
                             cf.type === 'date' ? <Calendar size={15} /> :
                             cf.type === 'checkbox' ? <CheckSquare size={15} /> :
                             cf.type === 'dropdown' ? <Building size={15} /> :
                             <Type size={15} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-[var(--color-text)] truncate">{cf.name}</h4>
                              <button
                                type="button"
                                onClick={() => handleToggleCustomRequired(realIdx)}
                                title={cf.required ? 'Click to make optional' : 'Click to mark required'}
                                className={clsx(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded border cursor-pointer transition-colors',
                                  cf.required
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/25'
                                    : 'bg-[var(--color-surface)] text-[var(--color-text-faint)] border-[var(--color-divider)] hover:text-[var(--color-text)]'
                                )}
                              >
                                {cf.required ? 'REQUIRED' : 'OPTIONAL'}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--color-text-muted)] font-semibold flex-wrap">
                              <span className="text-[var(--color-primary-hex)] font-mono uppercase text-[10px]">
                                {cf.type}
                              </span>
                              <span>•</span>
                              {isDropdown && isGlobal ? (
                                <span className="text-amber-500 truncate">
                                  {cf.globalKey ? formatLibraryName(cf.globalKey) : 'Global Library'}
                                </span>
                              ) : isDropdown && cf.options ? (
                                <span>{cf.options.length} OPTIONS</span>
                              ) : (
                                <span>CUSTOM</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95"
                            onClick={() => openEditModal(realIdx)}
                            title="Edit attribute schema"
                            aria-label={`Edit ${cf.name}`}
                          >
                            <Edit2 size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95"
                            onClick={() => handleDuplicateCustomField(realIdx)}
                            title="Duplicate custom field"
                            aria-label={`Duplicate ${cf.name}`}
                          >
                            <Copy size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10 active:scale-95"
                            onClick={() => handleRemoveCustomField(realIdx)}
                            title="Delete custom field"
                            aria-label={`Delete ${cf.name}`}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-[var(--color-divider)] flex items-center justify-between text-[10px] font-mono text-[var(--color-text-faint)]">
                        <span>ID: {storageKey}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyStorageKey(cf.name)}
                          className="inline-flex items-center gap-1 hover:text-[var(--color-text)] cursor-pointer transition-colors"
                          title="Copy column storage key"
                        >
                          {copiedKey === storageKey ? (
                            <>
                              <Check size={11} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <span>Copy ID</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {customFields.length === 0 && (
                  <div className="p-6 text-center rounded-xl border border-dashed border-[var(--color-divider)] bg-[var(--color-surface-2)]/20">
                    <Layout size={28} className="mx-auto mb-2 text-[var(--color-text-faint)] opacity-45" />
                    <h5 className="font-bold text-xs text-[var(--color-text)]">No Custom Attributes Defined</h5>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openAddModal}
                      className="mt-3 h-8 px-3 rounded-lg text-xs font-bold"
                    >
                      <Plus size={13} className="mr-1" />
                      <span>Add First Field</span>
                    </Button>
                  </div>
                )}

                {customFields.length > 0 && filteredCustomFields.length === 0 && (
                  <div className="p-5 text-center text-xs text-[var(--color-text-muted)]">
                    No custom fields matched "{searchQuery}".
                  </div>
                )}

                {/* Quick-Add Domain Starter Templates */}
                <div className="pt-3 border-t border-[var(--color-divider)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-text-faint)] flex items-center gap-1.5">
                      <Sparkles size={11} className="text-amber-500" />
                      <span>Quick Templates</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-faint)]">1-CLICK ADD</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-1.5">
                    {DOMAIN_STARTERS[activeTab].map(starter => {
                      const added = customFields.some(f => f.name.toLowerCase() === starter.name.toLowerCase());
                      return (
                        <button
                          key={starter.name}
                          type="button"
                          onClick={() => handleAddStarterField(starter)}
                          className={clsx(
                            'w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-99',
                            added
                              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500'
                              : 'border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 hover:border-[var(--color-primary-hex)]/40 hover:bg-[var(--color-surface-2)] text-[var(--color-text)]'
                          )}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{starter.name}</div>
                            <div className="text-[10px] font-mono uppercase text-[var(--color-text-faint)]">
                              {starter.type}{starter.options ? ` • ${starter.options.length} options` : ''}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold shrink-0 px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)]">
                            {added ? 'Added' : '+ Add'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Non-Blocking Undo Toast ── */}
      {undoState && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xl text-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span className="font-semibold text-[var(--color-text)]">{undoState.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-primary-hex)] text-white font-bold cursor-pointer active:scale-95"
          >
            <Undo2 size={12} />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={() => setUndoState(null)}
            aria-label="Dismiss notification"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer p-0.5"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Custom Field Modal (Create / Edit) ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIdx !== null ? `Edit Custom Field: ${formName}` : `Add Custom Field (${activeTab.toUpperCase()})`}
        size="md"
        footer={
          <div className="flex gap-2.5 w-full justify-end">
            <Button variant="ghost" className="rounded-xl min-h-[38px] px-4 font-semibold" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="rounded-xl min-h-[38px] px-4 font-bold bg-[var(--color-primary-hex)] text-white"
              onClick={() => handleSaveCustomField()}
            >
              {editingIdx !== null ? 'Update Attribute' : 'Create Attribute'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCustomField} noValidate className="space-y-4 text-xs font-semibold">
          {/* Field Name + Live Storage Key Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label htmlFor="fa-field-name" className="text-xs font-medium text-[var(--color-text-muted)]">
                Attribute Display Name <span aria-hidden="true" className="text-rose-500">*</span>
              </label>
              <span id="fa-key-preview" className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text-faint)]">
                {generatedKey}
              </span>
            </div>
            <input
              ref={nameInputRef}
              id="fa-field-name"
              required
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'fa-name-error' : 'fa-key-preview'}
              className={clsx(
                'w-full h-10 px-3 bg-[var(--color-surface-2)] border rounded-xl font-bold text-sm outline-none text-[var(--color-text)] transition-colors',
                nameError
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-[var(--color-divider)] focus:border-[var(--color-primary-hex)]'
              )}
              placeholder="e.g. Security Classification, Client Contract ID"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (nameError) setNameError(null);
              }}
              autoFocus
            />
            {nameError && (
              <p id="fa-name-error" role="alert" className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1.5">
                <AlertCircle size={12} />
                <span>{nameError}</span>
              </p>
            )}
          </div>

          {/* Type & Constraint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fa-field-type" className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                Data Type
              </label>
              <select
                id="fa-field-type"
                className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                value={formType}
                onChange={(e) => setFormType(e.target.value as CustomField['type'])}
              >
                <option value="text">Textual (String)</option>
                <option value="number">Numeric (Float/Int)</option>
                <option value="date">Temporal (Calendar Date)</option>
                <option value="checkbox">Boolean (Yes/No Checkbox)</option>
                <option value="dropdown">Categorical (Selection Dropdown)</option>
              </select>
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Constraint</span>
              <label
                htmlFor="fa-field-required"
                className="flex items-center justify-between gap-2.5 h-10 px-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] cursor-pointer select-none"
              >
                <span className="text-xs font-semibold text-[var(--color-text)]">Required Input Field</span>
                <input
                  id="fa-field-required"
                  type="checkbox"
                  {...({ switch: '' } as Record<string, string>)}
                  className="w-4 h-4 rounded border-[var(--color-divider)] accent-[var(--color-primary-hex)] cursor-pointer"
                  checked={formRequired}
                  onChange={(e) => setFormRequired(e.target.checked)}
                />
              </label>
            </div>
          </div>

          {/* Categorical Dropdown Options Source */}
          {formType === 'dropdown' && (
            <div className="p-3.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 space-y-3">
              <div>
                <span className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Dropdown Options Source</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={formSource === 'manual'}
                    onClick={() => setFormSource('manual')}
                    className={clsx(
                      'py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                      formSource === 'manual'
                        ? 'bg-[var(--color-primary-hex)] text-white border-[var(--color-primary-hex)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)]'
                    )}
                  >
                    Custom Manual List
                  </button>
                  <button
                    type="button"
                    aria-pressed={formSource === 'global'}
                    onClick={() => setFormSource('global')}
                    className={clsx(
                      'py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer',
                      formSource === 'global'
                        ? 'bg-[var(--color-primary-hex)] text-white border-[var(--color-primary-hex)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)]'
                    )}
                  >
                    Global Option Library
                  </button>
                </div>
              </div>

              {formSource === 'global' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="fa-global-lib" className="text-xs font-medium text-[var(--color-text-muted)]">
                      Link to Global Dropdown Library
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setView('dropdowns');
                      }}
                      className="text-[11px] font-semibold text-[var(--color-primary-hex)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Libraries</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>
                  <select
                    id="fa-global-lib"
                    className="w-full h-9 px-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-bold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                    value={formGlobalKey}
                    onChange={e => setFormGlobalKey(e.target.value)}
                  >
                    {availableDropdownKeys.map(k => (
                      <option key={k} value={k}>
                        {formatLibraryName(k)} ({state.dropdowns[k]?.length || 0} entries)
                      </option>
                    ))}
                  </select>
                  {state.dropdowns[formGlobalKey]?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {state.dropdowns[formGlobalKey].slice(0, 6).map(opt => (
                        <span
                          key={opt}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)]"
                        >
                          {opt}
                        </span>
                      ))}
                      {state.dropdowns[formGlobalKey].length > 6 && (
                        <span className="text-[10px] font-mono text-[var(--color-text-faint)] px-1 py-0.5">
                          +{state.dropdowns[formGlobalKey].length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="fa-manual-opts" className="text-xs font-medium text-[var(--color-text-muted)] block">
                    Manual Options (semicolon or comma separated)
                  </label>
                  <textarea
                    id="fa-manual-opts"
                    rows={2}
                    className="w-full p-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-medium outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                    placeholder="e.g. Critical Tier 1; High Tier 2; Normal Tier 3"
                    value={formOptions}
                    onChange={e => setFormOptions(e.target.value)}
                  />
                  {parsedManualOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {parsedManualOptions.map((opt, i) => (
                        <span
                          key={`${opt}-${i}`}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Live Table Cell Preview */}
          <div className="p-3 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)]/35 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-faint)]">
                Column & Cell Preview
              </div>
              <div className="text-xs font-bold text-[var(--color-text)] truncate mt-0.5">
                {(formName.trim() || 'NEW ATTRIBUTE').toUpperCase()}
                {formRequired && <span className="text-rose-500 ml-1">*</span>}
              </div>
            </div>
            <div className="shrink-0 text-xs font-semibold">
              {formType === 'checkbox' && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Yes</span>
              )}
              {formType === 'number' && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] font-mono tabular-nums">42</span>
              )}
              {formType === 'date' && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] font-mono tabular-nums">2026-11-12</span>
              )}
              {formType === 'dropdown' && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/25">
                  {formSource === 'global'
                    ? state.dropdowns[formGlobalKey]?.[0] || 'Option ▾'
                    : parsedManualOptions[0] || 'Option ▾'}
                </span>
              )}
              {formType === 'text' && (
                <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-divider)] text-[var(--color-text-muted)]">
                  Sample text
                </span>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FieldArchitect;
