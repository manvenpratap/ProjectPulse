import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  Keyboard, 
  Sparkles, 
  Layers, 
  Sliders, 
  Lightbulb, 
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  TableProperties,
  ArrowRight
} from 'lucide-react';
import { useProject } from '../../store/ProjectContext';
import { 
  VIEW_HELP_DATA, 
  STANDARD_FIELD_GUIDE, 
  GLOBAL_SHORTCUTS, 
  ViewHelpItem,
  getMergedFieldGuide,
  StandardFieldItem 
} from '../../config/viewHelpData';
import { NAV_HUBS } from '../../config/navigation';
import clsx from 'clsx';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetView?: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, targetView }) => {
  const { state, setView } = useProject();
  const [activeTab, setActiveTab] = useState<'screen' | 'fields' | 'shortcuts'>('screen');
  const [selectedViewId, setSelectedViewId] = useState<string>(targetView || state.view || 'overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldDomain, setFieldDomain] = useState<'all' | 'tasks' | 'defects' | 'deliveries' | 'custom'>('all');

  // Keep selected view synchronized when opened with active view or targetView prop
  useEffect(() => {
    if (isOpen) {
      setSelectedViewId(targetView || state.view || 'overview');
      setSearchQuery('');
    }
  }, [isOpen, targetView, state.view]);

  // Listen for global custom event 'open-view-help'
  useEffect(() => {
    const handleOpenViewHelp = (e: any) => {
      if (e.detail?.view) {
        setSelectedViewId(e.detail.view);
      }
      setActiveTab('screen');
    };
    window.addEventListener('open-view-help', handleOpenViewHelp);
    return () => window.removeEventListener('open-view-help', handleOpenViewHelp);
  }, []);

  const currentViewGuide: ViewHelpItem = VIEW_HELP_DATA[selectedViewId] || VIEW_HELP_DATA.overview;

  // Flattened nav items for view switcher
  const allViews = useMemo(() => {
    return NAV_HUBS.flatMap(h => h.items.map(item => ({
      ...item,
      hubLabel: h.label
    })));
  }, []);

  // Dynamically pull and merge field definitions from state (FieldArchitect) with fallback to STANDARD_FIELD_GUIDE
  const allFieldItems = useMemo(() => {
    return getMergedFieldGuide(state, fieldDomain);
  }, [state, fieldDomain]);

  const customFieldCount = useMemo(() => {
    return (
      (state.customFields?.length || 0) +
      (state.defCustomFields?.length || 0) +
      (state.delCustomFields?.length || 0)
    );
  }, [state.customFields, state.defCustomFields, state.delCustomFields]);

  // Filtered fields when searching
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return allFieldItems;
    const q = searchQuery.toLowerCase();
    return allFieldItems.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.desc.toLowerCase().includes(q) || 
      f.badge.toLowerCase().includes(q)
    );
  }, [allFieldItems, searchQuery]);

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery.trim()) return GLOBAL_SHORTCUTS;
    const q = searchQuery.toLowerCase();
    return GLOBAL_SHORTCUTS.filter(s => 
      s.keys.toLowerCase().includes(q) || 
      s.action.toLowerCase().includes(q) || 
      s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Platform Operations & Screen Knowledge Guide"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="flex items-center gap-1.5 text-[var(--color-text-faint)]">
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)]">F1</span>
            <span>or</span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] border border-[var(--color-divider)]">?</span>
            <span className="hidden sm:inline">opens this guide anytime</span>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Got It!
          </Button>
        </div>
      }
    >
      <div className="flex flex-col space-y-4 py-2 min-h-[460px] max-h-[72vh] overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-divider)] pb-3 shrink-0">
          <div className="flex p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
            <button
              onClick={() => setActiveTab('screen')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'screen' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Sparkles size={13} />
              <span>Screen Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'fields' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <TableProperties size={13} />
              <span>Fields & Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeTab === 'shortcuts' 
                  ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Keyboard size={13} />
              <span>Shortcuts</span>
            </button>
          </div>

          {/* Quick Screen Selector Dropdown */}
          {activeTab === 'screen' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[var(--color-text-faint)] hidden sm:inline">Screen:</span>
              <select
                value={selectedViewId}
                onChange={e => setSelectedViewId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] outline-none cursor-pointer hover:border-[var(--color-primary-hex)]/40 transition-colors"
                aria-label="Select screen to view help guide"
              >
                {allViews.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.label} ({v.hubLabel})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search bar for fields and shortcuts */}
          {activeTab !== 'screen' && (
            <div className="relative w-48 sm:w-64">
              <input
                type="text"
                placeholder={`Search ${activeTab === 'fields' ? 'fields' : 'shortcuts'}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] placeholder-[var(--color-text-faint)] outline-none focus:border-[var(--color-primary-hex)]/40 transition-all"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
            </div>
          )}
        </div>

        {/* ── TAB 1: SCREEN GUIDE ── */}
        {activeTab === 'screen' && currentViewGuide && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scroll">
            {/* View Mission & Title Banner */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border border-[var(--color-primary-hex)]/20">
                    {currentViewGuide.badge}
                  </span>
                  <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                    {currentViewGuide.title}
                  </h3>
                </div>

                {state.view !== currentViewGuide.id && (
                  <button
                    onClick={() => {
                      setView(currentViewGuide.id);
                      onClose();
                    }}
                    className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Switch to this screen</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                {currentViewGuide.description}
              </p>
            </div>

            {/* Key Fields & Telemetry Calculations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sliders size={15} className="text-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Key Fields, Metrics & Formulas
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentViewGuide.keyMetricsAndFields.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs space-y-1.5 hover:border-[var(--color-primary-hex)]/30 transition-colors">
                    <div className="text-xs font-bold text-[var(--color-text)] flex items-center justify-between">
                      <span>{item.name}</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      {item.desc}
                    </p>
                    {item.formula && (
                      <div className="mt-1 pt-1.5 border-t border-[var(--color-divider)] text-[10px] font-mono text-[var(--color-primary-hex)] bg-[var(--color-surface-2)]/80 p-1.5 rounded-lg break-all">
                        <span className="font-bold">Formula: </span>{item.formula}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Capabilities & Operational Workflows */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Core Capabilities & Workflows
                </h4>
              </div>
              <div className="space-y-2">
                {currentViewGuide.capabilities.map((cap, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs space-y-1">
                    <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span>{cap.title}</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed pl-5">
                      {cap.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tips & Best Practices */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Lightbulb size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Pro Tips & Best Practices
                </h4>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-xs text-[var(--color-text-muted)] leading-relaxed">
                {currentViewGuide.proTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── TAB 2: STANDARD & DYNAMIC CUSTOM FIELDS REFERENCE ── */}
        {activeTab === 'fields' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scroll">
            <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] flex flex-wrap items-center justify-between gap-2">
              <div>
                Standard data dictionary describing core task and delivery attributes across all matrices.
                {customFieldCount > 0 && (
                  <span className="ml-1 font-semibold text-[var(--color-primary-hex)]">
                    • {customFieldCount} dynamic custom schema attribute{customFieldCount > 1 ? 's' : ''} synchronized from Field Architect.
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setView('fields');
                  onClose();
                }}
                className="text-xs font-semibold text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Customize in Field Architect</span>
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Domain Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: 'all', label: 'All Attributes' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'defects', label: 'Defects' },
                { id: 'deliveries', label: 'Deliveries' },
                { id: 'custom', label: `Custom Fields (${customFieldCount})` }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => setFieldDomain(d.id as any)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 text-xs",
                    fieldDomain === d.id
                      ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] shadow-2xs"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-divider)]"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFields.map((field, idx) => (
                <div 
                  key={idx} 
                  className={clsx(
                    "p-3 rounded-xl bg-[var(--color-surface)] border shadow-2xs space-y-1.5 transition-colors",
                    field.isCustom 
                      ? "border-[var(--color-primary-hex)]/40 bg-[var(--color-primary-highlight-hex)]/20"
                      : "border-[var(--color-divider)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-[var(--color-text)] truncate">{field.name}</span>
                      {field.isCustom && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] font-bold shrink-0">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-faint)] border border-[var(--color-divider)] font-semibold shrink-0">
                      {field.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                    {field.desc}
                  </p>
                  <div className="text-[10px] text-[var(--color-text-faint)] font-mono">
                    <span className="font-semibold text-[var(--color-text-muted)]">Example: </span>{field.example}
                  </div>
                </div>
              ))}
            </div>

            {filteredFields.length === 0 && (
              <div className="p-8 text-center text-xs text-[var(--color-text-faint)] border border-dashed border-[var(--color-divider)] rounded-xl">
                No fields found matching "{searchQuery}".
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: KEYBOARD SHORTCUTS & QUICKSTART ── */}
        {activeTab === 'shortcuts' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scroll">
            <div className="p-3 rounded-xl bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)] text-xs text-[var(--color-text-muted)]">
              Keyboard shortcuts and fast-action hotkeys to navigate, filter, and operate ProjectPulse efficiently.
            </div>

            <div className="space-y-2">
              {filteredShortcuts.map((s, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-faint)] shrink-0 font-bold border border-[var(--color-divider)]">
                      {s.category}
                    </span>
                    <span className="text-[var(--color-text)] truncate">{s.action}</span>
                  </div>
                  <kbd className="px-2 py-1 rounded-lg font-mono text-[11px] font-bold bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)] shrink-0 shadow-2xs">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Platform Quickstart Summary */}
            <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/50 border border-[var(--color-divider)] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                Platform Architecture Notes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[var(--color-text-muted)]">
                <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-1">
                  <span className="font-bold text-[var(--color-text)] block">Offline-First Engine</span>
                  <p className="text-[11px]">All data state is instantly persisted to browser storage with zero latency and automatic cache hydration.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-1">
                  <span className="font-bold text-[var(--color-text)] block">Full Excel Roundtrip</span>
                  <p className="text-[11px]">Export and import all 10+ relational project entities via XLSX with comprehensive validation.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-1">
                  <span className="font-bold text-[var(--color-text)] block">Role Governance</span>
                  <p className="text-[11px]">Switch personas (Admin, Lead, Dev, Stakeholder) via the user profile menu to test RBAC rules.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default HelpModal;
