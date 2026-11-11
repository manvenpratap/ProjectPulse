import React, { useState, useMemo } from 'react';
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
  AlertTriangle,
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
  SlidersHorizontal,
  ClipboardList,
  Bug,
  Package,
  TrendingUp,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Button from '../shared/Button';
import PageHeader from '../shared/PageHeader';
import Modal from '../shared/Modal';
import clsx from 'clsx';
import { CustomField, FieldConfig } from '../../types';
import { 
  DEFAULT_TASK_COLS, 
  DEFAULT_DEFECT_COLS, 
  DEFAULT_DELIVERY_COLS 
} from '../../store/defaultState';

type DomainTab = 'tasks' | 'defects' | 'deliveries';

export const FieldArchitect: React.FC = () => {
  const { state, updateProject } = useProject();
  const [activeTab, setActiveTab] = useState<DomainTab>('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Field Form State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CustomField['type']>('text');
  const [formSource, setFormSource] = useState<'manual' | 'global'>('manual');
  const [formGlobalKey, setFormGlobalKey] = useState<string>('category');
  const [formOptions, setFormOptions] = useState<string>('');
  const [formRequired, setFormRequired] = useState(false);

  // 1. Get standard & custom fields for current domain
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

  // Telemetry stats
  const visibleStdCount = stdCols.filter(c => c.visible !== false).length;
  const totalAttributes = stdCols.length + customFields.length;

  // Filtered standard fields based on search query
  const filteredStdCols = useMemo(() => {
    if (!searchQuery.trim()) return stdCols;
    const q = searchQuery.toLowerCase();
    return stdCols.filter(c => 
      c.key.toLowerCase().includes(q) || 
      c.label.toLowerCase().includes(q) || 
      (c.type || '').toLowerCase().includes(q) ||
      (c.mapKey || '').toLowerCase().includes(q)
    );
  }, [stdCols, searchQuery]);

  // Filtered custom fields
  const filteredCustomFields = useMemo(() => {
    if (!searchQuery.trim()) return customFields;
    const q = searchQuery.toLowerCase();
    return customFields.filter(cf => 
      cf.name.toLowerCase().includes(q) || 
      cf.type.toLowerCase().includes(q) ||
      (cf.globalKey || '').toLowerCase().includes(q)
    );
  }, [customFields, searchQuery]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: Existing System Core Attributes Customization
  // ─────────────────────────────────────────────────────────────

  const handleUpdateCols = (newCols: FieldConfig[]) => {
    if (activeTab === 'tasks') updateProject({ cols: newCols });
    else if (activeTab === 'defects') updateProject({ defCols: newCols });
    else updateProject({ delCols: newCols });
  };

  const handleLabelChange = (key: string, newLabel: string) => {
    const updated = stdCols.map(c => c.key === key ? { ...c, label: newLabel } : c);
    handleUpdateCols(updated);
  };

  const handleWidthChange = (key: string, newWidth: number) => {
    const widthVal = Math.max(50, Math.min(800, isNaN(newWidth) ? 100 : newWidth));
    const updated = stdCols.map(c => c.key === key ? { ...c, width: widthVal } : c);
    handleUpdateCols(updated);
  };

  const handleToggleVisibility = (key: string) => {
    // Prevent hiding critical non-hideable identification keys
    if (key === 'id' || key === 'name' || key === 'title' || key === 'almId') return;
    const updated = stdCols.map(c => c.key === key ? { ...c, visible: c.visible === false ? true : false } : c);
    handleUpdateCols(updated);
  };

  const handleMoveCol = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= stdCols.length) return;
    const next = [...stdCols];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    handleUpdateCols(next);
  };

  const handleResetDefaults = () => {
    if (!window.confirm(`Reset ${activeTab.toUpperCase()} field labels, order, and widths back to system factory defaults?`)) return;
    if (activeTab === 'tasks') updateProject({ cols: DEFAULT_TASK_COLS });
    else if (activeTab === 'defects') updateProject({ defCols: DEFAULT_DEFECT_COLS });
    else updateProject({ delCols: DEFAULT_DELIVERY_COLS });
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: Custom Fields (Add / Edit / Remove)
  // ─────────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingIdx(null);
    setFormName('');
    setFormType('text');
    setFormSource('manual');
    setFormGlobalKey('category');
    setFormOptions('');
    setFormRequired(false);
    setIsModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const cf = customFields[idx];
    if (!cf) return;
    setEditingIdx(idx);
    setFormName(cf.name);
    setFormType(cf.type);
    setFormSource(cf.source === 'global' ? 'global' : 'manual');
    setFormGlobalKey(cf.globalKey || 'category');
    setFormOptions(Array.isArray(cf.options) ? cf.options.join('; ') : '');
    setFormRequired(!!cf.required);
    setIsModalOpen(true);
  };

  const handleSaveCustomField = () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      alert('Please enter an attribute name.');
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
    if (editingIdx !== null) {
      updated[editingIdx] = newField;
    } else {
      updated.push(newField);
    }

    if (activeTab === 'tasks') updateProject({ customFields: updated });
    else if (activeTab === 'defects') updateProject({ defCustomFields: updated });
    else updateProject({ delCustomFields: updated });

    setIsModalOpen(false);
  };

  const handleRemoveCustomField = (idx: number) => {
    const cf = customFields[idx];
    if (!window.confirm(`Permanently delete custom attribute "${cf.name}"? Data stored in this field across existing items will be removed.`)) return;

    const updated = customFields.filter((_, i) => i !== idx);
    if (activeTab === 'tasks') updateProject({ customFields: updated });
    else if (activeTab === 'defects') updateProject({ defCustomFields: updated });
    else updateProject({ delCustomFields: updated });
  };

  // Helper icons for column types
  const getTypeDisplay = (type?: string, mapKey?: string) => {
    switch (type) {
      case 'date':
        return { icon: <Calendar size={13} />, label: 'TEMPORAL' };
      case 'number':
        return { icon: <TrendingUp size={13} />, label: 'NUMERIC' };
      case 'select':
        return { 
          icon: <ListFilter size={13} />, 
          label: mapKey ? `SELECTION • ${mapKey.toUpperCase()}` : 'SELECTION' 
        };
      case 'progress':
        return { icon: <BarChart2 size={13} />, label: 'PERCENTAGE' };
      case 'checkbox':
        return { icon: <CheckSquare size={13} />, label: 'BOOLEAN' };
      default:
        return { icon: <FileText size={13} />, label: 'TEXT' };
    }
  };

  const availableDropdownKeys = Object.keys(state.dropdowns || {});

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* ── Page Header ── */}
      <PageHeader
        icon={Database}
        title="Field Architect"
        subtitle="Configure existing system core attributes & define proprietary custom field extensions"
        actions={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Domain Pill Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl shadow-2xs">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={clsx(
                  "px-3 py-1.5 min-h-[34px] flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                  activeTab === 'tasks' 
                    ? "bg-[var(--color-primary-hex)] text-white shadow-xs" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <ClipboardList size={13} />
                <span>TASKS</span>
              </button>
              <button 
                onClick={() => setActiveTab('defects')}
                className={clsx(
                  "px-3 py-1.5 min-h-[34px] flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                  activeTab === 'defects' 
                    ? "bg-[var(--color-primary-hex)] text-white shadow-xs" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Bug size={13} />
                <span>DEFECTS</span>
              </button>
              <button 
                onClick={() => setActiveTab('deliveries')}
                className={clsx(
                  "px-3 py-1.5 min-h-[34px] flex items-center gap-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95",
                  activeTab === 'deliveries' 
                    ? "bg-[var(--color-primary-hex)] text-white shadow-xs" 
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
              >
                <Package size={13} />
                <span>DELIVERIES</span>
              </button>
            </div>

            {/* Reset Defaults */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetDefaults} 
              title="Reset field labels and widths back to system factory defaults"
              className="h-9 px-3 text-xs font-bold rounded-xl active:scale-95"
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

      {/* ── Operational Subheader & Telemetry Bar ── */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-divider)] px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Search / Filter Input */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] opacity-60 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter attributes by name, type, or ID…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] text-[var(--color-text)] outline-none transition-colors"
          />
        </div>

        {/* Inline Compact Telemetry Stats Bar */}
        <div className="flex items-stretch border border-[var(--color-divider)] rounded-xl overflow-hidden bg-[var(--color-surface-2)] shadow-2xs text-xs">
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-[var(--color-divider)]">
            <Database size={13} className="text-[var(--color-primary-hex)]" />
            <span className="font-semibold text-[var(--color-text-muted)]">Total</span>
            <span className="font-mono font-bold text-sm text-[var(--color-text)]">{totalAttributes}</span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-[var(--color-divider)]">
            <ShieldCheck size={13} className="text-sky-500" />
            <span className="font-semibold text-[var(--color-text-muted)]">System</span>
            <span className="font-mono font-bold text-sm text-sky-500">{stdCols.length}</span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-2 border-r border-[var(--color-divider)]">
            <Layers size={13} className="text-amber-500" />
            <span className="font-semibold text-[var(--color-text-muted)]">Custom</span>
            <span className="font-mono font-bold text-sm text-amber-500">{customFields.length}</span>
          </div>
          <div className="px-3 py-1.5 flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 font-bold">
            <CheckCircle2 size={13} />
            <span>100% Integrity</span>
          </div>
        </div>
      </div>

      {/* ── Main Workspace: Two-Panel Responsive Architecture ── */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 w-full min-w-0 max-w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* ═════════════════════════════════════════════════════════ */}
          {/* LEFT PANEL: SYSTEM CORE ATTRIBUTES (Existing Fields)     */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="xl:col-span-8 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary-hex)] shadow-[0_0_8px_var(--color-primary-hex)]" />
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                    System Core Attributes
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-primary-hex)] border border-[var(--color-divider)]">
                      {visibleStdCount} ACTIVE
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Reorder fields · Edit display labels · Configure column widths (px) · Toggle grid visibility
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[var(--color-text-faint)] uppercase hidden md:inline">
                {activeTab.toUpperCase()} SCHEMA
              </span>
            </div>

            {/* List Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[var(--color-surface-2)]/30 border-b border-[var(--color-divider)] text-[10px] font-mono font-bold text-[var(--color-text-faint)] uppercase tracking-wider">
              <div className="col-span-1 text-center">ORDER</div>
              <div className="col-span-2">SYSTEM ID</div>
              <div className="col-span-3">DATA TYPE</div>
              <div className="col-span-4">CUSTOM DISPLAY LABEL</div>
              <div className="col-span-2 text-right">WIDTH (PX)</div>
            </div>

            {/* Field Rows */}
            <div className="divide-y divide-[var(--color-divider)] overflow-x-auto">
              {filteredStdCols.map((col, idx) => {
                const realIdx = stdCols.findIndex(c => c.key === col.key);
                const typeInfo = getTypeDisplay(col.type, col.mapKey);
                const isLocked = col.key === 'id' || col.key === 'name' || col.key === 'title' || col.key === 'almId';
                const isHidden = col.visible === false;

                return (
                  <div 
                    key={col.key}
                    className={clsx(
                      "grid grid-cols-12 gap-2 items-center px-4 py-3 transition-colors duration-150 hover:bg-[var(--color-surface-2)]/50",
                      isHidden && "opacity-50 bg-[var(--color-surface-2)]/20"
                    )}
                  >
                    {/* Reorder & Visibility */}
                    <div className="col-span-1 flex items-center justify-center gap-1">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleMoveCol(realIdx, 'up')}
                          disabled={realIdx === 0}
                          title="Move up"
                          className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          onClick={() => handleMoveCol(realIdx, 'down')}
                          disabled={realIdx === stdCols.length - 1}
                          title="Move down"
                          className="p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown size={11} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleToggleVisibility(col.key)}
                        disabled={isLocked}
                        title={isLocked ? "Required core field (cannot hide)" : (isHidden ? "Show column in table" : "Hide column in table")}
                        className={clsx(
                          "p-1 rounded cursor-pointer transition-colors",
                          isLocked 
                            ? "text-[var(--color-text-faint)] cursor-not-allowed opacity-50" 
                            : isHidden 
                              ? "text-rose-400 hover:text-rose-300" 
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                        )}
                      >
                        {isLocked ? <Lock size={12} /> : isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>

                    {/* System ID */}
                    <div className="col-span-2 font-mono text-[11px] font-bold text-[var(--color-text-muted)] truncate" title={col.key}>
                      {col.key.toUpperCase()}
                    </div>

                    {/* Data Type Badge */}
                    <div className="col-span-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20 truncate max-w-full">
                        {typeInfo.icon}
                        <span className="truncate">{typeInfo.label}</span>
                      </div>
                    </div>

                    {/* Custom Display Label Input */}
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={col.label}
                        onChange={e => handleLabelChange(col.key, e.target.value)}
                        placeholder={col.key}
                        className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] focus:bg-[var(--color-surface)] text-[var(--color-text)] outline-none transition-colors"
                        title="Edit column display label for table headers & exports"
                      />
                    </div>

                    {/* Column Width Input */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        min={50}
                        max={600}
                        step={10}
                        value={col.width || 120}
                        onChange={e => handleWidthChange(col.key, parseInt(e.target.value))}
                        className="w-16 px-1.5 py-1 text-xs font-mono font-bold text-center rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-divider)] focus:border-[var(--color-primary-hex)] text-[var(--color-text)] outline-none"
                      />
                      <span className="text-[10px] font-mono text-[var(--color-text-faint)] font-bold">PX</span>
                    </div>
                  </div>
                );
              })}

              {filteredStdCols.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                  No system attributes matched "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* RIGHT PANEL: CUSTOM EXTENSIONS (Proprietary Attributes)   */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-2xl shadow-xs overflow-hidden flex flex-col">
              {/* Panel Header */}
              <div className="p-4 sm:p-5 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                      Custom Extensions
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--color-surface-2)] text-amber-500 border border-[var(--color-divider)]">
                        {customFields.length}
                      </span>
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      User-defined proprietary fields for {activeTab}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={openAddModal} 
                  className="h-8 px-2.5 rounded-lg text-xs font-bold active:scale-95"
                >
                  <Plus size={13} className="mr-1" />
                  <span>Add</span>
                </Button>
              </div>

              {/* Custom Field Cards List */}
              <div className="p-4 space-y-3 max-h-[620px] overflow-y-auto custom-scroll">
                {filteredCustomFields.map((cf, idx) => {
                  const realIdx = customFields.findIndex(f => f.name === cf.name);
                  const isDropdown = cf.type === 'dropdown';
                  const isGlobal = cf.source === 'global';

                  return (
                    <div 
                      key={cf.name}
                      className="p-4 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)]/40 hover:border-[var(--color-primary-hex)]/40 hover:bg-[var(--color-surface-2)] transition-all shadow-2xs group relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0 border border-[var(--color-primary-hex)]/20 shadow-2xs">
                            {cf.type === 'number' ? <Hash size={16} /> :
                             cf.type === 'date' ? <Calendar size={16} /> :
                             cf.type === 'checkbox' ? <CheckSquare size={16} /> :
                             cf.type === 'dropdown' ? <Building size={16} /> :
                             <Type size={16} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-[var(--color-text)] truncate">{cf.name}</h4>
                              {cf.required && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  REQUIRED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--color-text-muted)] font-semibold flex-wrap">
                              <span className="text-[var(--color-primary-hex)] font-mono uppercase text-[10px]">
                                {cf.type}
                              </span>
                              <span>•</span>
                              {isDropdown && isGlobal ? (
                                <span className="text-amber-500">GLOBAL: {cf.globalKey?.toUpperCase()}</span>
                              ) : isDropdown && cf.options ? (
                                <span>{cf.options.length} OPTIONS</span>
                              ) : (
                                <span>CUSTOM ATTRIBUTE</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:scale-95" 
                            onClick={() => openEditModal(realIdx)}
                            title="Edit attribute schema"
                          >
                            <Edit2 size={13} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10 active:scale-95" 
                            onClick={() => handleRemoveCustomField(realIdx)}
                            title="Delete custom field"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[var(--color-divider)] flex items-center justify-between text-[10px] font-mono text-[var(--color-text-faint)]">
                        <span>ID: CF_{cf.name.replace(/\s+/g, '_').toUpperCase()}</span>
                        <span className="text-emerald-500 font-bold">Active</span>
                      </div>
                    </div>
                  );
                })}

                {customFields.length === 0 && (
                  <div className="p-8 text-center rounded-xl border border-dashed border-[var(--color-divider)] bg-[var(--color-surface-2)]/20">
                    <Layout size={32} className="mx-auto mb-2 text-[var(--color-text-faint)] opacity-40" />
                    <h5 className="font-bold text-xs text-[var(--color-text)]">No Custom Attributes Defined</h5>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1 max-w-[220px] mx-auto">
                      Extend the system schema with proprietary properties for {activeTab}.
                    </p>
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
              </div>
            </div>

            {/* Architecture Guidance Card */}
            <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xs">
              <div className="flex items-center gap-2 mb-2 font-bold text-xs text-[var(--color-text)]">
                <Sparkles size={14} className="text-[var(--color-primary-hex)]" />
                <span>Enterprise Schema Synchronization</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Custom labels, reordered columns, and custom extensions dynamically synchronize across active matrices, Kanban cards, modal editors, and publication Excel workbooks.
              </p>
            </div>
          </div>

        </div>
      </div>

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
            <Button variant="primary" className="rounded-xl min-h-[38px] px-4 font-bold bg-[var(--color-primary-hex)] text-white" onClick={handleSaveCustomField}>
              {editingIdx !== null ? 'Update Attribute' : 'Create Attribute'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs font-semibold">
          {/* Field Name */}
          <div>
            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Attribute Display Name *</label>
            <input 
              className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold text-sm outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
              placeholder="e.g. Security Classification, Client Contract ID"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type & Constraint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Data Type</label>
              <select 
                className="w-full h-10 px-3 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl font-bold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
              >
                <option value="text">Textual (String)</option>
                <option value="number">Numeric (Float/Int)</option>
                <option value="date">Temporal (Calendar Date)</option>
                <option value="checkbox">Boolean (Yes/No Checkbox)</option>
                <option value="dropdown">Categorical (Selection Dropdown)</option>
              </select>
            </div>

            <div className="flex flex-col justify-center">
              <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Constraint</label>
              <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                <input 
                  type="checkbox"
                  className="w-4 h-4 rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] focus:ring-[var(--color-primary-hex)]"
                  checked={formRequired}
                  onChange={(e) => setFormRequired(e.target.checked)}
                />
                <span className="text-xs font-semibold text-[var(--color-text)]">Required Input Field</span>
              </label>
            </div>
          </div>

          {/* Categorical Dropdown Options Source */}
          {formType === 'dropdown' && (
            <div className="p-3.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Dropdown Options Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSource('manual')}
                    className={clsx(
                      "py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      formSource === 'manual'
                        ? "bg-[var(--color-primary-hex)] text-white border-[var(--color-primary-hex)]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)]"
                    )}
                  >
                    Custom Manual List
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSource('global')}
                    className={clsx(
                      "py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      formSource === 'global'
                        ? "bg-[var(--color-primary-hex)] text-white border-[var(--color-primary-hex)]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)]"
                    )}
                  >
                    Global Option Library
                  </button>
                </div>
              </div>

              {formSource === 'global' ? (
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Link to Global Dropdown Library</label>
                  <select
                    className="w-full h-9 px-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-bold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                    value={formGlobalKey}
                    onChange={e => setFormGlobalKey(e.target.value)}
                  >
                    {availableDropdownKeys.map(k => (
                      <option key={k} value={k}>{k.toUpperCase()} ({state.dropdowns[k]?.length || 0} entries)</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                    Updates in Option Libraries automatically propagate to this custom field.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Manual Options (semicolon or comma separated)</label>
                  <textarea
                    rows={2}
                    className="w-full p-2 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-medium outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)]"
                    placeholder="e.g. Critical Tier 1; High Tier 2; Normal Tier 3"
                    value={formOptions}
                    onChange={e => setFormOptions(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default FieldArchitect;
