import {
  Presentation,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Package,
  GanttChart,
  Flag,
  Users,
  BarChart3,
  Bug,
  ShieldAlert,
  Smile,
  History,
  Layers,
  Blocks,
  Database,
  BookOpen,
  ListChecks,
  Settings as SettingsIcon,
  LucideIcon
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  description: string;
  shortcut?: string;
  keywords?: string[];
}

export interface NavHub {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  defaultView: string;
  defaultCollapsed?: boolean;
  items: NavItem[];
}

export interface QuickSubModeTarget {
  id: string;
  viewId: string;
  subTab: string;
  label: string;
  parentLabel: string;
  description: string;
  keywords: string[];
}

export const NAV_HUBS: NavHub[] = [
  {
    id: 'analytics',
    label: 'Insights & Reporting',
    icon: Presentation,
    description: 'Executive telemetry, predictive forecasts, status reports and CXO email briefs',
    defaultView: 'overview',
    items: [
      {
        id: 'overview',
        label: 'Executive Overview',
        shortLabel: 'Overview',
        icon: Presentation,
        description: 'Executive health dials, milestone radar and early warning signals',
        shortcut: 'G O',
        keywords: ['home', 'status', 'health', 'cockpit', 'steerco']
      },
      {
        id: 'dash',
        label: 'Project Intelligence',
        shortLabel: 'Intelligence',
        icon: LayoutDashboard,
        description: 'Monte Carlo ETA, cumulative flow, velocity bands and EVM analytics',
        shortcut: 'G D',
        keywords: ['monte carlo', 'cfd', 'burn', 'evm', 'forecast', 'analytics']
      },
      {
        id: 'reports',
        label: 'Pulse Reports',
        shortLabel: 'Reports',
        icon: FileText,
        description: 'Board status packs, CXO Email Briefing, release checklists and print dossiers',
        shortcut: 'G R',
        keywords: ['cxo', 'email', 'brief', 'status', 'print', 'pdf', 'board']
      }
    ]
  },
  {
    id: 'planning',
    label: 'Planning & Scope',
    icon: Flag,
    description: 'Release milestones, functional domain mapping and architecture scaffolding',
    defaultView: 'releases',
    items: [
      {
        id: 'releases',
        label: 'Release Roadmap',
        shortLabel: 'Roadmap',
        icon: Flag,
        description: 'Release milestones, target dates and version gating',
        keywords: ['versions', 'milestones', 'gates']
      },
      {
        id: 'features',
        label: 'Functional Matrix',
        shortLabel: 'Matrix',
        icon: Layers,
        description: 'Capabilities, unassigned screens, timeline and swimlane coverage',
        shortcut: 'G F',
        keywords: ['capabilities', 'screens', 'modules', 'swimlane']
      },
      {
        id: 'scaffolder',
        label: 'Project Scaffolder',
        shortLabel: 'Scaffolder',
        icon: Blocks,
        description: 'Module and task hierarchy generator with presets and CSV import',
        keywords: ['wizard', 'architect', 'modules', 'generate', 'presets']
      },
      {
        id: 'timeline',
        label: 'Project Timeline',
        shortLabel: 'Timeline',
        icon: GanttChart,
        description: 'Interactive Gantt schedule across modules and release milestones',
        shortcut: 'G L',
        keywords: ['gantt', 'schedule', 'dates']
      }
    ]
  },
  {
    id: 'execution',
    label: 'Delivery & Execution',
    icon: ClipboardList,
    description: 'Sprint tasks, Kanban boards, Gantt timelines and ALM release packages',
    defaultView: 'tasks',
    items: [
      {
        id: 'tasks',
        label: 'Tasks & Timeline',
        shortLabel: 'Tasks',
        icon: ClipboardList,
        description: 'Task matrix grid, Kanban workflow board and Gantt timeline',
        shortcut: 'G T',
        keywords: ['backlog', 'grid', 'kanban', 'board', 'gantt', 'timeline', 'subtasks']
      },
      {
        id: 'deliveries',
        label: 'ALM Deliveries',
        shortLabel: 'Deliveries',
        icon: Package,
        description: 'Deployment packages, environment pipelines and 3D heatmaps',
        keywords: ['alm', 'packages', 'deployments', 'qa', 'uat']
      }
    ]
  },
  {
    id: 'team',
    label: 'People & Capacity',
    icon: Users,
    description: 'Engineering directory, org hierarchy, workload heatmaps and 5-day scheduler',
    defaultView: 'team',
    items: [
      {
        id: 'team',
        label: 'Team Hub',
        shortLabel: 'Team',
        icon: Users,
        description: 'Team roster, skill matrix and reporting hierarchy',
        keywords: ['members', 'engineers', 'skills', 'org', 'leave']
      },
      {
        id: 'capacity',
        label: 'Capacity & Schedule',
        shortLabel: 'Capacity',
        icon: BarChart3,
        description: '8-week workload heatmap, 5-day scheduler and AI resource leveling',
        shortcut: 'G C',
        keywords: ['scheduler', 'utilization', 'workload', 'leveling', 'heatmap']
      }
    ]
  },
  {
    id: 'governance',
    label: 'Quality & Governance',
    icon: ShieldAlert,
    description: 'Defect triage, RAID register, sprint retrospectives and audit trail',
    defaultView: 'defects',
    items: [
      {
        id: 'defects',
        label: 'Defect Workshop',
        shortLabel: 'Defects',
        icon: Bug,
        description: 'Defect queue, severity triage and resolution tracking',
        shortcut: 'G B',
        keywords: ['bugs', 'issues', 'qa', 'severity']
      },
      {
        id: 'risks',
        label: 'RAID Register',
        shortLabel: 'RAID',
        icon: ShieldAlert,
        description: 'Risks, Assumptions, Issues, Dependencies and decision sign-offs',
        shortcut: 'G K',
        keywords: ['risks', 'assumptions', 'dependencies', 'decisions', 'sign-off']
      },
      {
        id: 'retro',
        label: 'Sprint Retrospective',
        shortLabel: 'Retrospective',
        icon: Smile,
        description: 'Kaizen team sentiment, voting and action item conversion',
        keywords: ['kaizen', 'kudos', 'actions', 'retro']
      },
      {
        id: 'log',
        label: 'Audit Log',
        shortLabel: 'Audit Log',
        icon: History,
        description: 'Transactional activity history and governance audit notes',
        keywords: ['history', 'activity', 'changes', 'compliance']
      }
    ]
  },
  {
    id: 'settings',
    label: 'Workspace & Schema',
    icon: SettingsIcon,
    description: 'Custom fields, step blueprints, lookup lists, themes, baselines and access',
    defaultView: 'settings',
    defaultCollapsed: true,
    items: [
      {
        id: 'fields',
        label: 'Field Architect',
        shortLabel: 'Custom Fields',
        icon: Database,
        description: 'Standard columns and custom metadata attributes',
        keywords: ['schema', 'columns', 'attributes', 'metadata']
      },
      {
        id: 'steps',
        label: 'Step Blueprints',
        shortLabel: 'Blueprints',
        icon: BookOpen,
        description: 'Reusable subtask workflow templates for tasks and screens',
        keywords: ['templates', 'subtasks', 'workflows', 'checklists']
      },
      {
        id: 'dropdowns',
        label: 'Option Libraries',
        shortLabel: 'Option Libraries',
        icon: ListChecks,
        description: 'Standardized status, priority and domain lookup lists',
        keywords: ['registry', 'taxonomies', 'dropdowns', 'lists']
      },
      {
        id: 'settings',
        label: 'Workspace Settings',
        shortLabel: 'Settings',
        icon: SettingsIcon,
        description: 'Effort parameters, Theme Studio, Baselines, RBAC Access and Excel I/O',
        shortcut: 'G S',
        keywords: ['configuration', 'themes', 'baselines', 'snapshots', 'access', 'rbac', 'excel', 'import', 'export', 'wipe', 'reset']
      }
    ]
  }
];

export const QUICK_SUBMODE_TARGETS: QuickSubModeTarget[] = [
  {
    id: 'reports:cxo',
    viewId: 'reports',
    subTab: 'cxo',
    label: 'CXO Email Briefing Studio',
    parentLabel: 'Pulse Reports',
    description: 'Generate rich HTML & Markdown executive steering email updates',
    keywords: ['cxo', 'email', 'brief', 'newsletter', 'steerco', 'executive']
  },
  {
    id: 'tasks:board',
    viewId: 'tasks',
    subTab: 'board',
    label: 'Kanban Workflow Board',
    parentLabel: 'Tasks & Timeline',
    description: 'Drag-and-drop task columns by status',
    keywords: ['kanban', 'board', 'columns', 'drag']
  },
  {
    id: 'tasks:timeline',
    viewId: 'tasks',
    subTab: 'timeline',
    label: 'Gantt Timeline View',
    parentLabel: 'Tasks & Timeline',
    description: 'Interactive module swimlane Gantt chart',
    keywords: ['gantt', 'timeline', 'swimlanes', 'schedule']
  },
  {
    id: 'capacity:schedule',
    viewId: 'capacity',
    subTab: 'schedule',
    label: '5-Day Daily Scheduler',
    parentLabel: 'Capacity & Schedule',
    description: 'Day-by-day engineer allocation and workload balancing',
    keywords: ['scheduler', 'daily', 'allocation', 'balance']
  },
  {
    id: 'dash:predictive',
    viewId: 'dash',
    subTab: 'predictive',
    label: 'Monte Carlo & AI Pulse',
    parentLabel: 'Project Intelligence',
    description: 'P50 / P90 delivery forecasts and What-If staffing sandbox',
    keywords: ['monte carlo', 'p50', 'p90', 'sandbox', 'ai']
  },
  {
    id: 'dash:flow',
    viewId: 'dash',
    subTab: 'flow',
    label: 'Delivery Flow & Velocity Band',
    parentLabel: 'Project Intelligence',
    description: 'CFD, burndown and Shewhart velocity control corridors',
    keywords: ['cfd', 'velocity', 'burndown', 'shewhart']
  },
  {
    id: 'dash:evm',
    viewId: 'dash',
    subTab: 'evm',
    label: 'EVM & Financial Cockpit',
    parentLabel: 'Project Intelligence',
    description: 'CPI, SPI, earned value metrics and blended cost simulation',
    keywords: ['evm', 'budget', 'cost', 'cpi', 'spi', 'finance']
  },
  {
    id: 'dash:quality',
    viewId: 'dash',
    subTab: 'quality',
    label: 'Quality & Governance Telemetry',
    parentLabel: 'Project Intelligence',
    description: 'Defect escape rates, blocked bottlenecks and RAID pressure',
    keywords: ['quality', 'governance', 'escape', 'bottleneck']
  },
  {
    id: 'settings:theme',
    viewId: 'settings',
    subTab: 'theme',
    label: 'Theme Studio & Palettes',
    parentLabel: 'Workspace Settings',
    description: 'Switch Swiss design themes and light/dark color modes',
    keywords: ['theme', 'dark mode', 'light mode', 'palette', 'appearance']
  },
  {
    id: 'settings:baselines',
    viewId: 'settings',
    subTab: 'baselines',
    label: 'Baseline Snapshots',
    parentLabel: 'Workspace Settings',
    description: 'Capture and compare schedule variance snapshots',
    keywords: ['baseline', 'snapshot', 'variance']
  },
  {
    id: 'settings:access',
    viewId: 'settings',
    subTab: 'access',
    label: 'Roles & Access Control (RBAC)',
    parentLabel: 'Workspace Settings',
    description: 'Manage personas, role capabilities and view permissions',
    keywords: ['rbac', 'roles', 'users', 'permissions', 'access']
  }
];

export function getHubForView(viewId: string, hasTaskAccess = false): NavHub {
  if (viewId === 'timeline' && hasTaskAccess) {
    return NAV_HUBS.find(hub => hub.id === 'execution') || NAV_HUBS[0];
  }
  const found = NAV_HUBS.find(hub => hub.items.some(item => item.id === viewId));
  return found || NAV_HUBS[0];
}

export function getNavItem(viewId: string): NavItem | undefined {
  for (const hub of NAV_HUBS) {
    const item = hub.items.find(i => i.id === viewId);
    if (item) return item;
  }
  return undefined;
}

export function getAllNavItems(): NavItem[] {
  return NAV_HUBS.flatMap(hub => hub.items);
}
