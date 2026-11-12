import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useProject } from '../../store/ProjectContext';
import { 
  BookOpen, 
  Trash2, 
  Edit2, 
  Plus, 
  Layers,
  ArrowRight,
  Clock,
  Zap,
  Info,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Copy,
  CopyPlus,
  Search,
  AlertTriangle,
  RefreshCw,
  FileText,
  Sparkles,
  Check,
  X,
  PlusCircle,
  MinusCircle,
  Sliders,
  Upload,
  LayoutGrid,
  List,
  Database,
  ExternalLink,
  ShieldCheck,
  Share2
} from 'lucide-react';
import Button from '../shared/Button';
import clsx from 'clsx';
import { StepTemplate, Task, Subtask, TaskStatus } from '../../types';
import PageHeader from '../shared/PageHeader';
import SectionHelpButton from '../shared/SectionHelpButton';
import CollapsibleSummaryStrip from '../shared/CollapsibleSummaryStrip';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import DataTable, { ColumnDef, DensityMode } from '../shared/DataTable';
import TablePagination, { usePagination } from '../shared/TablePagination';
import { toast } from '../../utils/toast';
import { motion, AnimatePresence } from 'motion/react';
import { todayStr } from '../../utils/projectUtils';

// ============================================================================
// STANDARD ALM INDUSTRY WORKFLOW BLUEPRINT PRESETS
// ============================================================================
export const STANDARD_BLUEPRINT_PRESETS: StepTemplate[] = [
  {
    name: 'Full-Stack Feature Pipeline',
    category: 'Feature',
    steps: [
      { name: 'PRD & Technical Specification', effort: 1 },
      { name: 'Data Model & API Contract', effort: 2 },
      { name: 'Backend Business Logic', effort: 4 },
      { name: 'Frontend Component Integration', effort: 3 },
      { name: 'Integration & E2E Testing', effort: 2 },
      { name: 'Security Review & Staging Deploy', effort: 1 }
    ]
  },
  {
    name: 'Server-Side Architecture Workflow',
    category: 'Server Module',
    steps: [
      { name: 'Schema Migration & Indexing', effort: 2 },
      { name: 'REST & gRPC Endpoint Definition', effort: 3 },
      { name: 'Service Kernel & Transaction Logic', effort: 4 },
      { name: 'Unit & Mock Integration Testing', effort: 2 },
      { name: 'Load & Latency Benchmarking', effort: 1 },
      { name: 'OpenAPI Spec & Observability Telemetry', effort: 1 }
    ]
  },
  {
    name: 'GUI Screen & Micro-Frontend Flow',
    category: 'GUI Screen',
    steps: [
      { name: 'Figma Tokens & Design Alignment', effort: 1 },
      { name: 'Component Shell & State Store', effort: 3 },
      { name: 'API Client & Query Cache Sync', effort: 2 },
      { name: 'Responsive Breakpoint & Mobile Tuning', effort: 1 },
      { name: 'WCAG 2.2 AA Accessibility Audit', effort: 1 },
      { name: 'Visual Regression & Cross-Browser QA', effort: 1 }
    ]
  },
  {
    name: 'Critical Defect & Hotfix Triage',
    category: 'Bug',
    steps: [
      { name: 'Defect Reproduction & Diagnostic Log Dump', effort: 1 },
      { name: 'Root Cause Isolation & Impact Scope', effort: 1 },
      { name: 'Targeted Code Patch & Regression Test', effort: 2 },
      { name: 'Non-Regression Test Suite Verification', effort: 1 },
      { name: 'Emergency Hotfix Deploy & Smoke Verification', effort: 1 }
    ]
  },
  {
    name: 'DevOps & Cloud Infrastructure (IaC)',
    category: 'DevOps',
    steps: [
      { name: 'Terraform / CloudFormation Architecture', effort: 2 },
      { name: 'Secret & IAM RBAC Configuration', effort: 1 },
      { name: 'CI/CD Pipeline & Health Check Hooks', effort: 3 },
      { name: 'Staging Environment Dry Run', effort: 1 },
      { name: 'Multi-AZ Production Cutover & Monitoring', effort: 1 }
    ]
  },
  {
    name: 'Security & Pen-Testing Governance',
    category: 'Testing',
    steps: [
      { name: 'Threat Model & Attack Surface Map', effort: 2 },
      { name: 'Static & Dynamic Code Analysis (SAST/DAST)', effort: 2 },
      { name: 'Dependency Vulnerability Audit', effort: 1 },
      { name: 'Penetration Testing & Exploit Verification', effort: 3 },
      { name: 'Security Remediation & CXO Sign-Off', effort: 1 }
    ]
  }
];

export const getCategoryMeta = (cat: string) => {
  switch (cat) {
    case 'Server Module':
      return { color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: Database };
    case 'GUI Screen':
    case 'GUI Module':
      return { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Layers };
    case 'Bug':
      return { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertTriangle };
    case 'DevOps':
      return { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: RefreshCw };
    case 'Testing':
      return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 };
    case 'Design':
      return { color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', icon: Sparkles };
    default:
      return { color: 'text-[var(--color-primary-hex)]', bg: 'bg-[var(--color-primary-highlight-hex)]', border: 'border-[var(--color-primary-hex)]/20', icon: Zap };
  }
};

const PHASE_COLORS = [
  'bg-sky-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-teal-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-blue-400'
];

// ============================================================================
// SMART WORKFLOW SYNCHRONIZATION ALGORITHM
// ============================================================================
export interface SyncStep {
  name: string;
  effort: number;
}

export function smartSyncSubtasks(
  existingSubtasks: Subtask[],
  oldSteps: SyncStep[] | null,
  newSteps: SyncStep[],
  parentTask: Task,
  nextSubIdStart: number
): { syncedSubtasks: Subtask[]; nextSubId: number } {
  const updated: (Subtask | null)[] = new Array(newSteps.length).fill(null);
  const claimedExisting = new Set<number>();
  let currentSubId = nextSubIdStart;

  // 1. Exact Name Match (Highest priority)
  newSteps.forEach((nStep, nIdx) => {
    const nName = nStep.name.trim();
    const matchIdx = existingSubtasks.findIndex(
      (e, eIdx) => !claimedExisting.has(eIdx) && e.name.trim().toLowerCase() === nName.toLowerCase()
    );
    if (matchIdx > -1) {
      updated[nIdx] = {
        ...existingSubtasks[matchIdx],
        name: nStep.name,
        effort: nStep.effort || existingSubtasks[matchIdx].effort || 1
      };
      claimedExisting.add(matchIdx);
    }
  });

  // 2. Relative Position Matching for Remaining (Handles renames while preserving progress)
  newSteps.forEach((nStep, nIdx) => {
    if (updated[nIdx]) return;
    const oldStepName = oldSteps && oldSteps[nIdx] ? oldSteps[nIdx].name.trim().toLowerCase() : null;
    if (oldStepName) {
      const matchIdx = existingSubtasks.findIndex(
        (e, eIdx) => !claimedExisting.has(eIdx) && e.name.trim().toLowerCase() === oldStepName
      );
      if (matchIdx > -1) {
        updated[nIdx] = {
          ...existingSubtasks[matchIdx],
          name: nStep.name,
          effort: nStep.effort || 1
        };
        claimedExisting.add(matchIdx);
        return;
      }
    }
    const unclaimedIdx = existingSubtasks.findIndex((e, eIdx) => !claimedExisting.has(eIdx));
    if (unclaimedIdx > -1) {
      updated[nIdx] = {
        ...existingSubtasks[unclaimedIdx],
        name: nStep.name,
        effort: nStep.effort || 1
      };
      claimedExisting.add(unclaimedIdx);
    }
  });

  // 3. New Steps (that couldn't be matched)
  const taskIsDone = parentTask.status === TaskStatus.COMPLETED || parentTask.progress === 100;
  newSteps.forEach((nStep, nIdx) => {
    if (!updated[nIdx]) {
      const subId = 'ST-' + String(currentSubId++).padStart(3, '0');
      updated[nIdx] = {
        id: subId,
        name: nStep.name,
        status: taskIsDone ? TaskStatus.COMPLETED : TaskStatus.NOT_STARTED,
        done: taskIsDone,
        progress: taskIsDone ? 100 : 0,
        effort: nStep.effort || 1,
        actDays: taskIsDone ? (nStep.effort || 1) : 0,
        type: 'step',
        category: parentTask.category,
        startDate: parentTask.startDate,
        dueDate: parentTask.dueDate,
        actCompletionDate: taskIsDone ? (parentTask.actCompletionDate || parentTask.dueDate || undefined) : undefined
      };
    }
  });

  return {
    syncedSubtasks: updated.filter((s): s is Subtask => s !== null),
    nextSubId: currentSubId
  };
}

// ============================================================================
// MAIN COMPONENT: ENHANCED STEP BLUEPRINTS ARCHITECT
// ============================================================================
const StepTemplates: React.FC = () => {
  const { state, updateProject } = useProject();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<StepTemplate | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'quickText'>('visual');
  const [quickText, setQuickText] = useState<string>('');
  const [confirmPropagation, setConfirmPropagation] = useState<boolean>(false);
  const [taskSearch, setTaskSearch] = useState<string>('');

  // Primary Page Controls: Filter, Search, and View Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [density, setDensity] = useState<DensityMode>('comfortable');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [deleteTargetIdx, setDeleteTargetIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = state.stepTemplates || [];
  const categories = state.dropdowns?.category || [
    'Feature', 'Server Module', 'GUI Screen', 'GUI Module', 'DevOps', 'Testing', 'Research', 'Documentation'
  ];

  // Distinct categories present in active templates
  const presentCategories = useMemo(() => {
    return Array.from(new Set(templates.map(t => t.category).filter(Boolean)));
  }, [templates]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return templates.filter(t => {
      const matchesSearch = !q || 
        t.name.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q) ||
        t.steps.some(s => s.name.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  // Sorted Templates for Deterministic Ordering and Table Sorting
  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortBy === 'name') {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortBy === 'category') {
        aVal = a.category.toLowerCase();
        bVal = b.category.toLowerCase();
      } else if (sortBy === 'steps') {
        aVal = a.steps.length;
        bVal = b.steps.length;
      } else if (sortBy === 'effort') {
        aVal = a.steps.reduce((sum, s) => sum + (Number(s.effort) || 0), 0);
        bVal = b.steps.reduce((sum, s) => sum + (Number(s.effort) || 0), 0);
      } else if (sortBy === 'linkedTasks') {
        const aCount = state.tasks.filter(t => t.category === a.category || (a.category === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))).length;
        const bCount = state.tasks.filter(t => t.category === b.category || (b.category === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))).length;
        aVal = aCount;
        bVal = bCount;
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredTemplates, sortBy, sortAsc, state.tasks]);

  const pagination = usePagination<StepTemplate>(sortedTemplates, 10, 'pp_page_size_step_blueprints');

  // Operational Telemetry Metrics
  const totalSteps = useMemo(() => {
    return templates.reduce((acc, t) => acc + (t.steps ? t.steps.length : 0), 0);
  }, [templates]);

  const totalEffortAcrossAll = useMemo(() => {
    return templates.reduce((acc, t) => acc + t.steps.reduce((sum, s) => sum + (Number(s.effort) || 0), 0), 0);
  }, [templates]);

  const tasksLinkedCount = useMemo(() => {
    return state.tasks.filter(task => {
      return templates.some(tpl => {
        if (tpl.category === 'GUI Screen') {
          return task.category === 'GUI Screen' || 
            (task.subtasks && task.subtasks.some(st => st.type === 'screen')) ||
            (task.guiScreens && task.guiScreens.length > 0);
        }
        return task.category === tpl.category;
      });
    }).length;
  }, [state.tasks, templates]);

  // Blueprint Handlers
  const handleAddTemplate = () => {
    const defaultCat = categories[0] || 'Feature';
    const newTpl: StepTemplate = {
      name: 'New Technical Workflow',
      category: defaultCat,
      steps: [
        { name: 'Initial Requirement Specification', effort: 1 },
        { name: 'Architecture & Schema Blueprint', effort: 2 },
        { name: 'Core Engine Implementation', effort: 4 },
        { name: 'Automated Test & Verification', effort: 2 }
      ]
    };
    setEditingIdx(null);
    setEditForm(JSON.parse(JSON.stringify(newTpl)));
    setQuickText(newTpl.steps.map(s => `${s.name}:${s.effort}`).join('\n'));
    setConfirmPropagation(false);
    setEditorMode('visual');
  };

  const removeTemplate = (idx: number) => {
    setDeleteTargetIdx(idx);
  };

  const confirmDeleteTemplate = () => {
    if (deleteTargetIdx === null) return;
    const target = templates[deleteTargetIdx];
    const updated = templates.filter((_, i) => i !== deleteTargetIdx);
    updateProject({ stepTemplates: updated });
    toast.success(`Deleted workflow blueprint "${target.name}".`);
    setDeleteTargetIdx(null);
  };

  const duplicateTemplate = (idx: number) => {
    const target = templates[idx];
    const cloned: StepTemplate = {
      ...JSON.parse(JSON.stringify(target)),
      name: `${target.name} (Copy)`
    };
    updateProject({ stepTemplates: [...templates, cloned] });
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    const formCopy = JSON.parse(JSON.stringify(templates[idx]));
    setEditForm(formCopy);
    setQuickText(formCopy.steps.map((s: any) => `${s.name}:${s.effort}`).join('\n'));
    setConfirmPropagation(false);
    setEditorMode('visual');
  };

  const copyBlueprintMarkdown = (idx: number) => {
    const tpl = templates[idx];
    const totalEffort = tpl.steps.reduce((sum, s) => sum + (Number(s.effort) || 0), 0);
    const md = [
      `### ${tpl.name} (${tpl.category} Workflow)`,
      `**Total Planned Effort:** ${totalEffort} days · **Phases:** ${tpl.steps.length}`,
      '',
      ...tpl.steps.map((s, si) => `- [ ] **Phase ${si + 1}:** ${s.name} (${s.effort}d)`)
    ].join('\n');

    navigator.clipboard.writeText(md);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const columns = useMemo<ColumnDef<StepTemplate>[]>(() => [
    {
      id: 'name',
      header: 'Blueprint Name',
      headerTitle: 'Standardized operational blueprint name and scope',
      sortable: true,
      sortKey: 'name',
      width: 'w-52 min-w-[180px]',
      cell: (tpl) => {
        const meta = getCategoryMeta(tpl.category);
        const IconComponent = meta.icon;
        const totalEffort = tpl.steps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
        return (
          <div className="flex items-center gap-2.5 py-1 min-w-0">
            <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs shrink-0", meta.bg, meta.color, meta.border)}>
              <IconComponent size={15} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-[var(--color-text)] hover:text-[var(--color-primary-hex)] transition-colors leading-snug truncate" title={tpl.name}>
                {tpl.name}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1.5 mt-0.5">
                <span>{tpl.steps.length} {tpl.steps.length === 1 ? 'phase' : 'phases'}</span>
                <span>·</span>
                <span>{totalEffort}d total</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'category',
      header: 'Category',
      headerTitle: 'Task category governed by this blueprint',
      sortable: true,
      sortKey: 'category',
      width: 'w-36',
      cell: (tpl) => {
        const meta = getCategoryMeta(tpl.category);
        const IconComponent = meta.icon;
        return (
          <span className={clsx("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs", meta.bg, meta.color, meta.border)}>
            <IconComponent size={11} />
            <span className="truncate">{tpl.category}</span>
          </span>
        );
      }
    },
    {
      id: 'steps',
      header: 'Phases',
      headerTitle: 'Number of standardized lifecycle phases',
      sortable: true,
      sortKey: 'steps',
      align: 'center',
      width: 'w-20',
      cell: (tpl) => (
        <span className="font-mono font-bold text-xs bg-[var(--color-surface-2)] border border-[var(--color-divider)] px-2 py-0.5 rounded-lg text-[var(--color-text)] shadow-2xs">
          {tpl.steps.length}
        </span>
      )
    },
    {
      id: 'effort',
      header: 'Effort',
      headerTitle: 'Cumulative standard estimated effort in person-days',
      sortable: true,
      sortKey: 'effort',
      align: 'center',
      width: 'w-20',
      cell: (tpl) => {
        const totalEffort = tpl.steps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
        return (
          <span className="font-mono font-bold text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 shadow-2xs">
            <Clock size={11} />
            <span>{totalEffort}d</span>
          </span>
        );
      }
    },
    {
      id: 'linkedTasks',
      header: 'Linked Tasks',
      headerTitle: 'Active tasks governed by this blueprint definition',
      sortable: true,
      sortKey: 'linkedTasks',
      align: 'center',
      width: 'w-24',
      cell: (tpl) => {
        const matchingTasks = state.tasks.filter(t => 
          t.category === tpl.category || (tpl.category === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))
        );
        const hasTasks = matchingTasks.length > 0;
        return (
          <span className={clsx(
            "font-semibold text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs",
            hasTasks 
              ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" 
              : "text-[var(--color-text-faint)] bg-[var(--color-surface-2)] border border-[var(--color-divider)]"
          )}>
            <CheckCircle2 size={11} />
            <span>{matchingTasks.length}</span>
          </span>
        );
      }
    },
    {
      id: 'pipeline',
      header: 'Workflow Pipeline Sequence',
      headerTitle: 'Proportional effort distribution and phase sequence',
      width: 'max-w-[280px]',
      cell: (tpl) => {
        const totalEffort = tpl.steps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
        return (
          <div className="space-y-1.5 py-1 max-w-[280px]">
            {/* Proportional Segmented Progress Bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden flex gap-0.5 bg-[var(--color-surface-2)] p-0.2 border border-[var(--color-divider)]">
              {tpl.steps.map((st, si) => {
                const pct = totalEffort > 0 ? (Number(st.effort) / totalEffort) * 100 : 100 / tpl.steps.length;
                return (
                  <div 
                    key={si}
                    style={{ width: `${Math.max(4, pct)}%` }}
                    className={clsx("h-full rounded-xs transition-all", PHASE_COLORS[si % PHASE_COLORS.length])}
                    title={`${st.name}: ${st.effort}d (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            {/* Sequence Pills */}
            <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden py-0.5 text-[10px]">
              {tpl.steps.slice(0, 2).map((st, si) => (
                <span 
                  key={si} 
                  className="font-medium px-1.5 py-0.5 rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)] shrink-0 inline-flex items-center gap-1 max-w-[110px]"
                  title={`${st.name} (${st.effort}d)`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[var(--color-surface)] text-[8px] font-bold text-[var(--color-text-faint)] inline-flex items-center justify-center border border-[var(--color-divider)] shrink-0">
                    {si + 1}
                  </span>
                  <span className="truncate">{st.name}</span>
                </span>
              ))}
              {tpl.steps.length > 2 && (
                <span className="text-[10px] font-bold text-[var(--color-primary-hex)] px-1.5 py-0.5 rounded bg-[var(--color-primary-highlight-hex)] shrink-0">
                  +{tpl.steps.length - 2} more
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      headerTitle: 'Manage blueprint template',
      align: 'right',
      width: 'w-28',
      cell: (tpl) => {
        const i = templates.findIndex(t => t.name === tpl.name);
        const isCopied = copiedIndex === i;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => copyBlueprintMarkdown(i)}
              title="Copy workflow as Markdown checklist"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer border border-transparent hover:border-[var(--color-divider)] touch-hit-expand"
            >
              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={13} />}
            </button>
            <button
              type="button"
              onClick={() => duplicateTemplate(i)}
              title="Duplicate blueprint"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer border border-transparent hover:border-sky-500/20 touch-hit-expand"
            >
              <CopyPlus size={13} />
            </button>
            <button
              type="button"
              onClick={() => startEdit(i)}
              title="Edit blueprint"
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-primary-highlight-hex)] transition-colors cursor-pointer border border-transparent hover:border-[var(--color-primary-hex)]/30 touch-hit-expand"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={() => removeTemplate(i)}
              title="Delete blueprint"
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer border border-transparent hover:border-rose-500/20 touch-hit-expand"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ], [templates, state.tasks, copiedIndex]);

  const handleImportBlueprints = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result as string;
        const parsed = JSON.parse(raw);
        const importedTemplates: StepTemplate[] = parsed.stepTemplates || (Array.isArray(parsed) ? parsed : null);

        if (!Array.isArray(importedTemplates) || importedTemplates.length === 0) {
          toast.error('Invalid blueprint JSON format. Expected an array of step templates.');
          return;
        }

        // Validate structure
        const validated = importedTemplates.filter(t => t.name && Array.isArray(t.steps) && t.steps.length > 0);
        if (validated.length === 0) {
          toast.error('No valid blueprint definitions found in JSON file.');
          return;
        }

        // Merge with existing by name
        const existingNames = new Set(templates.map(t => t.name.toLowerCase()));
        const merged = [...templates];
        let addedCount = 0;

        validated.forEach(v => {
          if (!existingNames.has(v.name.toLowerCase())) {
            merged.push(v);
            existingNames.add(v.name.toLowerCase());
            addedCount++;
          }
        });

        updateProject({ stepTemplates: merged });
        toast.success(`Successfully imported ${addedCount} new blueprint(s).`);
      } catch (err: any) {
        toast.error('Failed to parse blueprint JSON: ' + err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleImportPreset = (preset: StepTemplate) => {
    const exists = templates.some(t => t.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      toast.warning(`A blueprint named "${preset.name}" already exists.`);
      return;
    }
    updateProject({ stepTemplates: [...templates, preset] });
    toast.success(`Imported blueprint "${preset.name}".`);
    setIsPresetsOpen(false);
  };

  // Sync quick text when editForm.steps change in visual mode
  const syncToQuickText = (steps: { name: string; effort: number }[]) => {
    setQuickText(steps.map(s => `${s.name}:${s.effort}`).join('\n'));
  };

  // Step item handlers inside editor
  const addStep = () => {
    if (!editForm) return;
    const updated = [...editForm.steps, { name: 'New Operational Phase', effort: 1 }];
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const removeStep = (sIdx: number) => {
    if (!editForm) return;
    if (editForm.steps.length <= 1) {
      toast.warning('A workflow blueprint must contain at least one phase.');
      return;
    }
    const updated = editForm.steps.filter((_, i) => i !== sIdx);
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const updateStep = (sIdx: number, field: 'name' | 'effort', val: any) => {
    if (!editForm) return;
    const updated = [...editForm.steps];
    updated[sIdx] = { ...updated[sIdx], [field]: val };
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const moveStep = (sIdx: number, direction: 'up' | 'down') => {
    if (!editForm) return;
    const targetIdx = direction === 'up' ? sIdx - 1 : sIdx + 1;
    if (targetIdx < 0 || targetIdx >= editForm.steps.length) return;
    const updated = [...editForm.steps];
    const temp = updated[sIdx];
    updated[sIdx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const cloneStep = (sIdx: number) => {
    if (!editForm) return;
    const updated = [...editForm.steps];
    const source = updated[sIdx];
    updated.splice(sIdx + 1, 0, { name: `${source.name} (Next)`, effort: source.effort });
    setEditForm({ ...editForm, steps: updated });
    syncToQuickText(updated);
  };

  const handleQuickTextChange = (text: string) => {
    setQuickText(text);
    if (!editForm) return;
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const parsed = lines.map(line => {
      const parts = line.split(':');
      const name = parts[0]?.trim() || 'New Phase';
      const effort = parseFloat(parts[1]) || 1;
      return { name, effort: Math.max(0.5, effort) };
    });
    setEditForm({
      ...editForm,
      steps: parsed.length > 0 ? parsed : [{ name: 'Phase 1', effort: 1 }]
    });
  };

  // ==========================================================================
  // REAL-TIME AUTO COMPUTED IMPACT ENGINE
  // ==========================================================================
  const impact = useMemo(() => {
    if (!editForm) return null;

    const targetCategory = editForm.category;
    const tasks = state.tasks.filter(t => {
      if (targetCategory === 'GUI Screen') {
        return (
          t.category === 'GUI Screen' ||
          (t.subtasks && t.subtasks.some(st => st.type === 'screen')) ||
          (t.guiScreens && t.guiScreens.length > 0)
        );
      }
      return t.category === targetCategory;
    });

    const oldSteps = editingIdx !== null && templates[editingIdx] ? templates[editingIdx].steps : [];
    const newSteps = editForm.steps || [];

    let added = 0;
    let renamed = 0;
    let removed = 0;
    const claimedOld = new Set<number>();
    const claimedNew = new Set<number>();

    // 1. Exact name match
    newSteps.forEach((ns, ni) => {
      const matchIdx = oldSteps.findIndex(
        (os, oi) => !claimedOld.has(oi) && os.name.trim().toLowerCase() === ns.name.trim().toLowerCase()
      );
      if (matchIdx > -1) {
        claimedOld.add(matchIdx);
        claimedNew.add(ni);
      }
    });

    // 2. Relative position matching for remaining
    if (oldSteps.length > 0) {
      newSteps.forEach((ns, ni) => {
        if (claimedNew.has(ni)) return;
        if (ni < oldSteps.length && !claimedOld.has(ni)) {
          renamed++;
          claimedOld.add(ni);
          claimedNew.add(ni);
        }
      });
    }

    added = newSteps.length - claimedNew.size;
    removed = oldSteps.length - claimedOld.size;

    const oldTotalEffort = oldSteps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
    const newTotalEffort = newSteps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
    const effortDelta = newTotalEffort - oldTotalEffort;

    return {
      affectedTasks: tasks,
      taskCount: tasks.length,
      stepDiff: added + renamed + removed,
      added,
      renamed,
      removed,
      oldTotalEffort,
      newTotalEffort,
      effortDelta,
      hasStructuralChange: added > 0 || renamed > 0 || removed > 0,
      hasEffortChange: effortDelta !== 0
    };
  }, [editForm, editingIdx, templates, state.tasks]);

  // Execute Save and optional propagation
  const handleFinalize = (propagate: boolean) => {
    if (!editForm) return;
    if (!editForm.name.trim()) {
      toast.error('Blueprint name is required');
      return;
    }
    if (editForm.steps.length === 0) {
      toast.error('At least one phase is required in the workflow sequence');
      return;
    }

    let updatedTemplates: StepTemplate[];
    if (editingIdx !== null) {
      updatedTemplates = [...templates];
      updatedTemplates[editingIdx] = editForm;
    } else {
      updatedTemplates = [...templates, editForm];
    }

    let updatedTasks = state.tasks;
    let nextSubId = state.nextSubId || 100;
    const oldSteps = editingIdx !== null && templates[editingIdx] ? templates[editingIdx].steps : [];

    if (propagate && impact && impact.taskCount > 0) {
      updatedTasks = state.tasks.map(task => {
        const isAffected = 
          task.category === editForm.category ||
          (editForm.category === 'GUI Screen' && (
            (task.subtasks && task.subtasks.some(st => st.type === 'screen')) ||
            (task.guiScreens && task.guiScreens.length > 0)
          ));
        if (!isAffected) return task;

        const existingSubtasks = task.subtasks || [];
        const { syncedSubtasks, nextSubId: newSubId } = smartSyncSubtasks(
          existingSubtasks,
          oldSteps,
          editForm.steps,
          task,
          nextSubId
        );
        nextSubId = newSubId;

        const taskIsDone = task.status === TaskStatus.COMPLETED || task.progress === 100;
        const totalEffort = syncedSubtasks.reduce((sum, st) => sum + (st.effort || 0), 0);
        const doneCount = syncedSubtasks.filter(st => st.done || st.status === TaskStatus.COMPLETED).length;
        const progress = syncedSubtasks.length ? Math.round((doneCount / syncedSubtasks.length) * 100) : task.progress;

        return {
          ...task,
          subtasks: syncedSubtasks,
          estDays: totalEffort > 0 ? totalEffort : task.estDays,
          progress: taskIsDone ? 100 : progress,
          updatedAt: new Date().toISOString()
        };
      });
    }

    const logEntry = {
      ts: new Date().toISOString(),
      action: editingIdx !== null ? 'Update Blueprint' : 'Create Blueprint',
      taskId: '',
      taskName: editForm.name,
      field: 'workflow',
      oldVal: editingIdx !== null && templates[editingIdx] ? `${templates[editingIdx].steps.length} steps` : 'New',
      newVal: `${editForm.steps.length} steps`,
      comment: propagate && impact && impact.taskCount > 0
        ? `Propagated blueprint "${editForm.name}" to ${impact.taskCount} tasks in category "${editForm.category}".`
        : `Saved blueprint "${editForm.name}" for category "${editForm.category}".`,
      module: 'Architect',
      assignee: 'Admin'
    };

    updateProject({
      stepTemplates: updatedTemplates,
      tasks: updatedTasks,
      nextSubId,
      log: [...(state.log || []), logEntry]
    });

    setEditingIdx(null);
    setEditForm(null);
    setConfirmPropagation(false);
  };

  const filteredAffectedTasks = useMemo(() => {
    if (!impact) return [];
    if (!taskSearch.trim()) return impact.affectedTasks;
    const q = taskSearch.toLowerCase();
    return impact.affectedTasks.filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      (t.module && t.module.toLowerCase().includes(q))
    );
  }, [impact, taskSearch]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* Hidden File Input for JSON Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportBlueprints} 
        accept=".json" 
        className="hidden" 
      />

      {/* ── 1. Page Header ── */}
      <PageHeader
        icon={BookOpen}
        title="Step Blueprints"
        subtitle={`${templates.length} Templates`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresetsOpen(true)}
              title="Browse standard industry workflow presets"
              className="h-9 px-3 text-xs font-semibold rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span className="hidden sm:inline">ALM Presets</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import blueprints from JSON"
              className="h-9 px-2.5 sm:px-3 text-xs font-semibold rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-[var(--color-text)] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Upload size={13} className="text-[var(--color-text-muted)]" />
              <span className="hidden md:inline">Import</span>
            </button>
          </div>
        }
        primaryAction={
          <Button variant="primary" size="sm" onClick={handleAddTemplate} className="h-9 px-3.5 shadow-xs font-bold active:scale-95">
            <Plus size={15} className="mr-1" /> New Blueprint
          </Button>
        }
      />

      {/* ── 2. Collapsible Telemetry KPI Strip (Minimized by default) ── */}
      <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-1 shrink-0">
        <CollapsibleSummaryStrip
          title="Blueprint Telemetry"
          summary={[
            { label: 'Workflow Blueprints', value: templates.length, tone: 'primary' },
            { label: 'Standardized Phases', value: totalSteps, tone: 'purple' },
            { label: 'Tasks Governed', value: tasksLinkedCount, tone: 'emerald' },
            { label: 'Workflow Scope', value: `${totalEffortAcrossAll}d`, tone: 'amber' }
          ]}
          contentClassName="pt-2.5 pb-1"
        >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Workflow Blueprints
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                {templates.length} <span className="text-xs font-medium text-[var(--color-text-muted)]">templates</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center shrink-0">
              <BookOpen size={16} />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Standardized Phases
              </div>
              <div className="text-lg font-display font-black text-[var(--color-text)] mt-0.5">
                {totalSteps} <span className="text-xs font-medium text-[var(--color-text-muted)]">steps</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Tasks Governed
              </div>
              <div className="text-lg font-display font-black text-emerald-500 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {tasksLinkedCount} <span className="text-xs font-medium text-[var(--color-text-muted)]">tasks</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)]">
                Workflow Scope
              </div>
              <div className="text-lg font-display font-black text-amber-500 mt-0.5">
                {totalEffortAcrossAll}d <span className="text-xs font-medium text-[var(--color-text-muted)]">total effort</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
          </div>
        </div>
        </CollapsibleSummaryStrip>
      </div>

      {/* ── 3. Operational Toolbar (Filter, Search & View Modes) ── */}
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search blueprints by name, category, or phase…"
                className="w-full h-9 pl-9 pr-8 bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-xl text-xs font-medium text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)] transition-colors shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] hover:text-[var(--color-text)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-fade-x py-0.5 max-w-full sm:max-w-md">
              <button
                onClick={() => setSelectedCategory('all')}
                className={clsx(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  selectedCategory === 'all'
                    ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/30 shadow-2xs"
                    : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)]"
                )}
              >
                All Categories ({templates.length})
              </button>

              {presentCategories.map(cat => {
                const count = templates.filter(t => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={clsx(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
                      selectedCategory === cat
                        ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/30 shadow-2xs"
                        : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)]"
                    )}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Mode Toggle & Match Count */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              Showing <strong className="text-[var(--color-text)]">{sortedTemplates.length}</strong> of {templates.length}
            </span>

            {/* Density Mode Switcher (Visible in Table View) */}
            {viewMode === 'table' && (
              <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs">
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                    density === 'compact' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                  title="Compact Table Density"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('comfortable')}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                    density === 'comfortable' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  )}
                  title="Comfortable Table Density"
                >
                  Comfortable
                </button>
              </div>
            )}

            <div className="flex items-center p-0.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-semibold text-xs",
                  viewMode === 'grid' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="Visual Card Grid View"
              >
                <LayoutGrid size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={clsx(
                  "p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-semibold text-xs",
                  viewMode === 'table' ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                )}
                title="High-Density Table View"
              >
                <List size={14} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Main Blueprints Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-6 lg:p-8 pt-2">
        {filteredTemplates.length === 0 ? (
          <div className="py-24 bg-[var(--color-surface)] rounded-3xl border-2 border-dashed border-[var(--color-divider)] flex flex-col items-center justify-center text-center px-12">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] flex items-center justify-center mb-4">
              <BookOpen size={30} strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text)]">No Matching Blueprints Found</h3>
            <p className="text-xs max-w-sm mt-1 text-[var(--color-text-muted)] leading-relaxed">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try broadening your search query or reset the category filter.' 
                : 'Define standardized operational step templates for common tasks to automate checklist population and effort estimation.'}
            </p>
            <div className="flex items-center gap-2 mt-5">
              {(searchQuery || selectedCategory !== 'all') && (
                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                  Reset Filters
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleAddTemplate}>
                <Plus size={14} className="mr-1" /> Create Blueprint
              </Button>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── 4A. Visual Card Grid Mode ── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((tpl) => {
                const i = templates.findIndex(t => t.name === tpl.name);
                const totalEffort = tpl.steps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
                const matchingTasks = state.tasks.filter(t => 
                  t.category === tpl.category || (tpl.category === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))
                );
                const meta = getCategoryMeta(tpl.category);
                const IconComponent = meta.icon;
                const isCopied = copiedIndex === i;

                return (
                  <motion.div 
                    key={tpl.name}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    onClick={() => startEdit(i)}
                    className="card glass p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col group relative overflow-hidden"
                  >
                    {/* Top Row: Icon + Category + Action Bar */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs shrink-0", meta.bg, meta.color, meta.border)}>
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <span className={clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", meta.bg, meta.color, meta.border)}>
                            {tpl.category}
                          </span>
                          <div className="text-[11px] font-medium text-[var(--color-text-faint)] mt-1">
                            {tpl.steps.length} {tpl.steps.length === 1 ? 'phase' : 'phases'} · {totalEffort}d total
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); copyBlueprintMarkdown(i); }}
                          title="Copy workflow as Markdown checklist"
                          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); duplicateTemplate(i); }}
                          title="Duplicate blueprint"
                          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                        >
                          <CopyPlus size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startEdit(i); }}
                          title="Edit blueprint"
                          className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeTemplate(i); }}
                          title="Delete blueprint"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Blueprint Title & Linked Task Badge */}
                    <div className="mb-3">
                      <h3 className="font-display font-black text-base text-[var(--color-text)] leading-snug group-hover:text-[var(--color-primary-hex)] transition-colors line-clamp-1">
                        {tpl.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          {matchingTasks.length} active {matchingTasks.length === 1 ? 'task' : 'tasks'} linked
                        </span>
                      </div>
                    </div>

                    {/* Proportional Segmented Progress Bar */}
                    <div className="mb-3.5">
                      <div className="w-full h-2 rounded-full overflow-hidden flex gap-0.5 bg-[var(--color-surface-2)] p-0.5 border border-[var(--color-divider)]">
                        {tpl.steps.map((st, si) => {
                          const pct = totalEffort > 0 ? (Number(st.effort) / totalEffort) * 100 : 100 / tpl.steps.length;
                          return (
                            <div 
                              key={si}
                              style={{ width: `${Math.max(4, pct)}%` }}
                              className={clsx("h-full rounded-xs transition-all", PHASE_COLORS[si % PHASE_COLORS.length])}
                              title={`${st.name}: ${st.effort}d (${Math.round(pct)}%)`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Phase Sequence Preview Box */}
                    <div className="flex-1 bg-[var(--color-surface-2)]/60 rounded-xl p-3 border border-[var(--color-divider)]/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-faint)] mb-2 flex items-center justify-between">
                        <span>Workflow Pipeline</span>
                        <span>Effort</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scroll pr-1">
                        {tpl.steps.map((st, si) => (
                          <div key={si} className="flex items-center justify-between text-xs py-0.5 group/step">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="w-4 h-4 rounded-full bg-[var(--color-surface)] text-[9px] font-bold text-[var(--color-text-muted)] flex items-center justify-center shrink-0 border border-[var(--color-divider)]">
                                {si + 1}
                              </span>
                              <span className="font-medium text-[var(--color-text-muted)] group-hover/step:text-[var(--color-text)] transition-colors truncate">
                                {st.name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-[var(--color-text-faint)] shrink-0">
                              {st.effort}d
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: Auto-sync telemetry */}
                    <div className="mt-3.5 pt-2.5 border-t border-[var(--color-divider)] flex items-center justify-between text-xs text-[var(--color-text-faint)]">
                      <span className="flex items-center gap-1 font-medium text-[11px]">
                        <Zap size={11} className="text-emerald-500" /> Real-time blast sync
                      </span>
                      <span className="font-bold text-[var(--color-primary-hex)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 text-[11px]">
                        Configure <ArrowRight size={11} />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* ── 4B. High-Density Enterprise Table View (Powered by generic DataTable) ── */
          <DataTable<StepTemplate>
            data={sortedTemplates}
            columns={columns}
            keyField="name"
            minWidth="w-full"
            tableLabel="Step Blueprints and Workflow Templates"
            density={density}
            sortField={sortBy}
            sortAsc={sortAsc}
            onSort={(field) => {
              if (sortBy === field) {
                setSortAsc(!sortAsc);
              } else {
                setSortBy(field);
                setSortAsc(true);
              }
            }}
            showRowNumbers
            pagination={pagination}
            itemLabel="blueprints"
            onRowClick={(tpl) => {
              const i = templates.findIndex(t => t.name === tpl.name);
              if (i !== -1) startEdit(i);
            }}
            mobileCardRenderer={(tpl) => {
              const i = templates.findIndex(t => t.name === tpl.name);
              const totalEffort = tpl.steps.reduce((s, st) => s + (Number(st.effort) || 0), 0);
              const meta = getCategoryMeta(tpl.category);
              const IconComponent = meta.icon;
              const isCopied = copiedIndex === i;
              const matchingTasks = state.tasks.filter(t => 
                t.category === tpl.category || (tpl.category === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))
              );

              return (
                <div
                  onClick={() => startEdit(i)}
                  className="p-4 space-y-3 cursor-pointer active:bg-[var(--color-surface-2)]/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs shrink-0", meta.bg, meta.color, meta.border)}>
                        <IconComponent size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--color-text)] leading-snug truncate">{tpl.name}</div>
                        <span className={clsx("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 inline-block", meta.bg, meta.color, meta.border)}>
                          {tpl.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => copyBlueprintMarkdown(i)}
                        title="Copy Markdown"
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] touch-hit-expand cursor-pointer"
                      >
                        {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateTemplate(i)}
                        title="Duplicate"
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-sky-400 touch-hit-expand cursor-pointer"
                      >
                        <CopyPlus size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(i)}
                        title="Edit"
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-hex)] touch-hit-expand cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTemplate(i)}
                        title="Delete"
                        className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 touch-hit-expand cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Segmented mini progress bar */}
                  <div className="w-full h-1.5 rounded-full overflow-hidden flex gap-0.5 bg-[var(--color-surface-2)] p-0.2 border border-[var(--color-divider)]">
                    {tpl.steps.map((st, si) => {
                      const pct = totalEffort > 0 ? (Number(st.effort) / totalEffort) * 100 : 100 / tpl.steps.length;
                      return (
                        <div 
                          key={si}
                          style={{ width: `${Math.max(4, pct)}%` }}
                          className={clsx("h-full rounded-xs", PHASE_COLORS[si % PHASE_COLORS.length])}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-divider)] text-[var(--color-text-muted)]">
                    <span className="font-mono">{tpl.steps.length} phases · {totalEffort}d effort</span>
                    <span className="text-emerald-500 font-semibold">{matchingTasks.length} tasks linked</span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. ALM WORKFLOW PRESETS LIBRARY MODAL                                 */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        title="Standard ALM Industry Workflow Presets"
        size="lg"
      >
        <div className="space-y-3">
          {STANDARD_BLUEPRINT_PRESETS.map((preset, idx) => {
            const totalEffort = preset.steps.reduce((s, st) => s + st.effort, 0);
            const isAlreadyPresent = templates.some(t => t.name.toLowerCase() === preset.name.toLowerCase());
            const meta = getCategoryMeta(preset.category);

            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface-2)]/50 hover:border-[var(--color-primary-hex)]/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-[var(--color-text)]">
                      {preset.name}
                    </span>
                    <span className={clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full border", meta.bg, meta.color, meta.border)}>
                      {preset.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mb-2">
                    {preset.steps.length} sequential phases · {totalEffort} days total estimation
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {preset.steps.map((st, si) => (
                      <span key={si} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-divider)]">
                        {st.name} ({st.effort}d)
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  disabled={isAlreadyPresent}
                  onClick={() => handleImportPreset(preset)}
                  className={clsx(
                    "px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95",
                    isAlreadyPresent
                      ? "bg-[var(--color-surface-offset)] text-[var(--color-text-faint)] cursor-not-allowed border border-[var(--color-divider)]"
                      : "bg-[var(--color-primary-hex)] text-white hover:opacity-95"
                  )}
                >
                  {isAlreadyPresent ? (
                    <>
                      <Check size={13} /> Installed
                    </>
                  ) : (
                    <>
                      <Plus size={13} /> Import Blueprint
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* 6. HIGH-END EDIT BLUEPRINT MODAL WITH AUTO-COMPUTED LIVE IMPACT       */}
      {/* ===================================================================== */}
      {editForm && impact && (
        <Modal
          isOpen={!!editForm}
          onClose={() => { setEditForm(null); setConfirmPropagation(false); }}
          title={editingIdx !== null ? 'Edit Workflow Blueprint' : 'Create New Blueprint'}
          size="xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-divider)]">
              <div className="flex items-center gap-2">
                <SectionHelpButton view="steps" section="One-Click Subtask Generation" label="Blueprint impact guide" size={13} />
                <span className="text-xs text-[var(--color-text-muted)]">Configure phases, estimated effort, and propagate to active tasks</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] font-medium">
                <span className="font-bold text-[var(--color-text)]">{editForm.steps.length}</span> Phases
                <span className="text-[var(--color-divider)]">•</span>
                <span className="font-bold text-[var(--color-text)]">{impact.newTotalEffort}d</span> Total
              </div>
            </div>

            {/* Modal Main Body (2-Column Grid) */}
            <div className="overflow-y-auto custom-scroll">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ───────────────────────────────────────────────────────────── */}
                {/* LEFT COLUMN: BLUEPRINT IDENTITY & SEQUENCE BUILDER (7 Cols)  */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Blueprint Meta Card */}
                  <div className="p-4 rounded-2xl bg-[var(--color-surface-2)]/40 border border-[var(--color-divider)] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] mb-1.5 block">
                          Blueprint Name
                        </label>
                        <input 
                          type="text"
                          className="w-full h-10 px-3.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors shadow-2xs"
                          placeholder="e.g. Standard Feature Dev Flow"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[var(--color-text-muted)] mb-1.5 block">
                          Category Mapping
                        </label>
                        <select 
                          className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-xl text-xs font-semibold outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] transition-colors shadow-2xs cursor-pointer"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          {categories.map(cat => {
                            const count = state.tasks.filter(t => 
                              t.category === cat || (cat === 'GUI Screen' && ((t.subtasks && t.subtasks.some(st => st.type === 'screen')) || (t.guiScreens && t.guiScreens.length > 0)))
                            ).length;
                            return (
                              <option key={cat} value={cat}>
                                {cat} ({count} active {count === 1 ? 'task' : 'tasks'})
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Phase Sequence Editor Container */}
                  <div className="p-4.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-divider)]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                          Phase Sequence
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--color-text-faint)]">
                          ({editForm.steps.length} {editForm.steps.length === 1 ? 'step' : 'steps'})
                        </span>
                      </div>

                      {/* Mode Switcher */}
                      <div className="flex items-center p-0.5 bg-[var(--color-surface-2)] rounded-lg border border-[var(--color-divider)] text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setEditorMode('visual')}
                          className={clsx(
                            "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                            editorMode === 'visual'
                              ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                          )}
                        >
                          <Sliders size={12} /> Visual
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode('quickText')}
                          className={clsx(
                            "px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer",
                            editorMode === 'quickText'
                              ? "bg-[var(--color-surface)] text-[var(--color-primary-hex)] shadow-2xs"
                              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                          )}
                        >
                          <FileText size={12} /> Quick Text
                        </button>
                      </div>
                    </div>

                    {/* Visual Editor Mode */}
                    {editorMode === 'visual' ? (
                      <div className="space-y-2.5">
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll pr-1">
                          {editForm.steps.map((st, si) => (
                            <div 
                              key={si}
                              className="flex items-center gap-2 p-2.5 bg-[var(--color-surface-2)]/60 rounded-xl border border-[var(--color-divider)] group/step hover:border-[var(--color-primary-hex)]/30 transition-colors"
                            >
                              {/* Step Index Badge */}
                              <div className="w-6 h-6 rounded-lg bg-[var(--color-surface)] text-[11px] font-bold text-[var(--color-text-muted)] flex items-center justify-center border border-[var(--color-divider)] shrink-0 shadow-2xs">
                                #{si + 1}
                              </div>

                              {/* Step Name Input */}
                              <input 
                                type="text"
                                className="flex-1 h-8 px-2.5 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg text-xs font-medium text-[var(--color-text)] outline-none focus:border-[var(--color-primary-hex)]"
                                placeholder="Phase title..."
                                value={st.name}
                                onChange={(e) => updateStep(si, 'name', e.target.value)}
                              />

                              {/* Effort Input & Stepper */}
                              <div className="flex items-center gap-1 bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-lg px-2 h-8 shrink-0">
                                <Clock size={11} className="text-[var(--color-text-faint)]" />
                                <input 
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  className="w-12 text-center text-xs font-bold bg-transparent outline-none text-[var(--color-text)]"
                                  value={st.effort}
                                  onChange={(e) => updateStep(si, 'effort', parseFloat(e.target.value) || 0.5)}
                                />
                                <span className="text-[10px] font-semibold text-[var(--color-text-faint)]">days</span>
                              </div>

                              {/* Reorder Buttons */}
                              <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover/step:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  disabled={si === 0}
                                  onClick={() => moveStep(si, 'up')}
                                  title="Move up"
                                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  disabled={si === editForm.steps.length - 1}
                                  onClick={() => moveStep(si, 'down')}
                                  title="Move down"
                                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => cloneStep(si)}
                                  title="Duplicate phase"
                                  className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] cursor-pointer"
                                >
                                  <CopyPlus size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeStep(si)}
                                  title="Delete phase"
                                  className="p-1 rounded text-rose-500 hover:bg-rose-500/10 ml-0.5 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={addStep} 
                          className="w-full h-9 border border-dashed border-[var(--color-divider)] rounded-xl text-xs font-bold text-[var(--color-primary-hex)] hover:bg-[var(--color-surface-2)] cursor-pointer"
                        >
                          <Plus size={14} className="mr-1" /> Add Workflow Phase
                        </Button>
                      </div>
                    ) : (
                      /* Quick Text Editor Mode */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-text-faint)] px-1">
                          <span>SYNTAX: NAME:EFFORT (ONE PER LINE)</span>
                          <span>Auto-parses on keystroke</span>
                        </div>
                        <textarea 
                          rows={8}
                          value={quickText}
                          onChange={(e) => handleQuickTextChange(e.target.value)}
                          placeholder="Requirement Analysis:1&#10;Architecture Blueprint:2&#10;Backend Implementation:4&#10;Unit & Integration Test:2&#10;Deployment & Sign-off:1"
                          className="w-full p-3 font-mono text-xs bg-[var(--color-surface-2)]/70 border border-[var(--color-divider)] rounded-xl outline-none focus:border-[var(--color-primary-hex)] text-[var(--color-text)] custom-scroll leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* RIGHT COLUMN: AUTO-COMPUTED LIVE IMPACT COCKPIT (5 Cols)     */}
                {/* ───────────────────────────────────────────────────────────── */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="p-4.5 rounded-2xl bg-[var(--color-surface-2)]/50 border border-[var(--color-divider)] space-y-4">
                    
                    {/* Header with Live Indicator */}
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--color-divider)]">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                          Impact Analysis
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--color-text-faint)]">
                        Target: {editForm.category}
                      </span>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-center shadow-2xs">
                        <div className="text-lg font-black text-[var(--color-text)]">
                          {impact.taskCount}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--color-text-faint)] truncate">
                          Tasks Impacted
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-center shadow-2xs">
                        <div className="text-lg font-black text-[var(--color-text)]">
                          {impact.stepDiff}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--color-text-faint)] truncate">
                          Step Changes
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-center shadow-2xs">
                        <div className={clsx("text-lg font-black", impact.effortDelta > 0 ? "text-amber-500" : (impact.effortDelta < 0 ? "text-emerald-500" : "text-[var(--color-text)]"))}>
                          {impact.effortDelta > 0 ? `+${impact.effortDelta}d` : `${impact.effortDelta}d`}
                        </div>
                        <div className="text-[10px] font-medium text-[var(--color-text-faint)] truncate">
                          Effort Delta
                        </div>
                      </div>
                    </div>

                    {/* Structural Delta Feed */}
                    <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] space-y-2 text-xs">
                      {impact.added > 0 && (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          <PlusCircle size={14} className="shrink-0" />
                          <span>{impact.added} new {impact.added === 1 ? 'phase' : 'phases'} will be added to workflows</span>
                        </div>
                      )}
                      {impact.renamed > 0 && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                          <RefreshCw size={13} className="shrink-0" />
                          <span>{impact.renamed} {impact.renamed === 1 ? 'phase' : 'phases'} renamed (progress preserved)</span>
                        </div>
                      )}
                      {impact.removed > 0 && (
                        <div className="flex items-center gap-2 text-rose-500 font-medium">
                          <MinusCircle size={14} className="shrink-0" />
                          <span>{impact.removed} {impact.removed === 1 ? 'phase' : 'phases'} will be removed from workflow</span>
                        </div>
                      )}
                      {!impact.hasStructuralChange && (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check size={14} className="shrink-0" />
                          <span>
                            {impact.hasEffortChange
                              ? `Effort adjustments (${impact.oldTotalEffort}d → ${impact.newTotalEffort}d), structural steps remain aligned`
                              : 'Workflow phases identical to current blueprint version'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Affected Tasks Directory */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--color-text-muted)]">
                          Affected Tasks Directory ({impact.taskCount})
                        </span>
                        {impact.taskCount > 3 && (
                          <div className="relative w-28">
                            <input 
                              type="text"
                              placeholder="Filter..."
                              className="w-full h-6 px-2 text-[10px] bg-[var(--color-surface)] border border-[var(--color-divider)] rounded outline-none text-[var(--color-text)]"
                              value={taskSearch}
                              onChange={(e) => setTaskSearch(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div className="max-h-56 overflow-y-auto custom-scroll space-y-1.5 pr-1">
                        {filteredAffectedTasks.map(t => {
                          const subCount = t.subtasks?.length || 0;
                          const doneSubs = (t.subtasks || []).filter(s => s.done || s.status === TaskStatus.COMPLETED).length;
                          return (
                            <div 
                              key={t.id}
                              className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] hover:border-[var(--color-primary-hex)]/30 transition-colors text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-divider)] shrink-0">
                                    {t.id}
                                  </span>
                                  <span className="font-semibold text-[var(--color-text)] truncate" title={t.name}>
                                    {t.name}
                                  </span>
                                </div>
                                <span className={clsx(
                                  "text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0",
                                  t.status === TaskStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                  t.status === TaskStatus.IN_PROGRESS ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                                  (t.status === TaskStatus.BLOCKED || t.status === TaskStatus.ON_HOLD) ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-[var(--color-text-muted)]"
                                )}>
                                  {t.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-faint)]">
                                <span>{t.module || 'General'}</span>
                                <div className="flex items-center gap-2">
                                  <span>{doneSubs}/{subCount} phases</span>
                                  <span className="font-semibold text-[var(--color-text-muted)]">{t.progress}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {impact.taskCount === 0 && (
                          <div className="p-4 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-divider)] text-xs text-[var(--color-text-faint)]">
                            No active tasks found matching category &quot;{editForm.category}&quot;. Changes will apply to future tasks.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer (with Safe Propagation Confirmation) */}
            <div className="px-6 py-4 border-t border-[var(--color-divider)] bg-[var(--color-surface-2)] flex flex-col gap-3">
              {confirmPropagation ? (
                /* Confirmation View */
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-98 duration-150">
                  <div className="flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                    <span>
                      Propagate changes to <strong>{impact.taskCount} tasks</strong> in &quot;{editForm.category}&quot;? Progress will be safely preserved for matching phases.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setConfirmPropagation(false)}
                      className="text-xs cursor-pointer"
                    >
                      Back
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleFinalize(false)}
                      className="text-xs cursor-pointer"
                      title="Update template definition without touching existing tasks"
                    >
                      Save Blueprint Only
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleFinalize(true)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap size={13} /> Propagate to {impact.taskCount} Tasks
                    </Button>
                  </div>
                </div>
              ) : (
                /* Standard Footer */
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                    <Sparkles size={13} className="text-emerald-500" />
                    <span>
                      {impact.taskCount > 0 
                        ? `${impact.taskCount} tasks currently mapped to this blueprint` 
                        : 'No existing tasks affected by this blueprint'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    <Button 
                      variant="ghost" 
                      onClick={() => { setEditForm(null); setConfirmPropagation(false); }}
                      className="h-10 px-4 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </Button>

                    {impact.taskCount > 0 ? (
                      <Button 
                        variant="primary" 
                        onClick={() => setConfirmPropagation(true)}
                        className="h-10 px-5 text-xs font-bold bg-[var(--color-primary-hex)] text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap size={14} /> Review & Save Blueprint
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        onClick={() => handleFinalize(false)}
                        className="h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} /> Save Blueprint
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Delete Blueprint Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetIdx !== null}
        onClose={() => setDeleteTargetIdx(null)}
        onConfirm={confirmDeleteTemplate}
        title="Delete Technical Workflow Blueprint"
        message={deleteTargetIdx !== null && templates[deleteTargetIdx] ? `Delete the "${templates[deleteTargetIdx].name}" technical workflow blueprint? This action cannot be undone.` : ''}
        confirmLabel="Delete Blueprint"
        variant="danger"
      />
    </div>
  );
};

export default StepTemplates;
