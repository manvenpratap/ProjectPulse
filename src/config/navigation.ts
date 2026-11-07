import { 
  Presentation,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Package,
  GanttChart,
  Flag,
  CalendarDays,
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
}

export interface NavHub {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  defaultView: string;
  items: NavItem[];
}

export const NAV_HUBS: NavHub[] = [
  {
    id: 'analytics',
    label: 'Pulse & Analytics',
    icon: Presentation,
    description: 'Executive dashboards, delivery telemetry and project reports',
    defaultView: 'overview',
    items: [
      { id: 'overview', label: 'Executive Overview', shortLabel: 'Overview', icon: Presentation, description: 'Executive status and project health' },
      { id: 'dash', label: 'Intelligence', shortLabel: 'Intelligence', icon: LayoutDashboard, description: 'Monte Carlo, CFD and burn metrics' },
      { id: 'reports', label: 'Pulse Reports', shortLabel: 'Reports', icon: FileText, description: 'Formal reporting and audit scorecard' },
    ]
  },
  {
    id: 'execution',
    label: 'Work Execution',
    icon: ClipboardList,
    description: 'Tasks, ALM delivery packages, timelines, roadmaps and scheduling',
    defaultView: 'tasks',
    items: [
      { id: 'tasks', label: 'Tasks Matrix', shortLabel: 'Tasks', icon: ClipboardList, description: 'Spreadsheet grid and Kanban board' },
      { id: 'deliveries', label: 'ALM Deliveries', shortLabel: 'Deliveries', icon: Package, description: 'Delivery packages and 3D heatmaps' },
      { id: 'timeline', label: 'Project Timeline', shortLabel: 'Timeline', icon: GanttChart, description: 'Gantt chart with swimlane tracking' },
      { id: 'releases', label: 'Release Roadmap', shortLabel: 'Roadmap', icon: Flag, description: 'Release milestones and version gating' },
      { id: 'scheduler', label: 'Intelligent Scheduler', shortLabel: 'Scheduler', icon: CalendarDays, description: 'Autonomous scheduling and auto-leveling' },
    ]
  },
  {
    id: 'team',
    label: 'Team & Capacity',
    icon: Users,
    description: 'Team directory, resource hierarchy and capacity modeling',
    defaultView: 'team',
    items: [
      { id: 'team', label: 'Team Hub', shortLabel: 'Team', icon: Users, description: 'Team directory and hierarchy graph' },
      { id: 'capacity', label: 'Capacity Plan', shortLabel: 'Capacity', icon: BarChart3, description: 'Workload heatmap and team leveling' },
    ]
  },
  {
    id: 'governance',
    label: 'Quality & Governance',
    icon: ShieldAlert,
    description: 'Defects, risk management, retrospectives and activity audit',
    defaultView: 'defects',
    items: [
      { id: 'defects', label: 'Defect Workshop', shortLabel: 'Defects', icon: Bug, description: 'Bug tracking and severity triage' },
      { id: 'risks', label: 'RAID Register', shortLabel: 'RAID', icon: ShieldAlert, description: 'Risks, Assumptions, Issues, Dependencies' },
      { id: 'retro', label: 'Sprint Retrospective', shortLabel: 'Retrospective', icon: Smile, description: 'Kaizen continuous improvement telemetry' },
      { id: 'log', label: 'Activity Log', shortLabel: 'Audit Log', icon: History, description: 'Transactional change ledger' },
    ]
  },
  {
    id: 'architecture',
    label: 'System Architecture',
    icon: Layers,
    description: 'Domain modeling, custom schemas, blueprints and registries',
    defaultView: 'features',
    items: [
      { id: 'features', label: 'Functional Matrix', shortLabel: 'Matrix', icon: Layers, description: 'Strategic functional capabilities' },
      { id: 'scaffolder', label: 'Project Architect', shortLabel: 'Scaffolder', icon: Blocks, description: 'Component and module generator' },
      { id: 'fields', label: 'Field Architect', shortLabel: 'Custom Fields', icon: Database, description: 'Metadata schemas and attributes' },
      { id: 'steps', label: 'Step Templates', shortLabel: 'Blueprints', icon: BookOpen, description: 'Automated technical workflow steps' },
      { id: 'dropdowns', label: 'Pulse Registry', shortLabel: 'Registries', icon: ListChecks, description: 'Taxonomies and lookup libraries' },
    ]
  },
  {
    id: 'settings',
    label: 'Configuration',
    icon: SettingsIcon,
    description: 'Project baseline management and system preferences',
    defaultView: 'settings',
    items: [
      { id: 'settings', label: 'Configuration', shortLabel: 'Settings', icon: SettingsIcon, description: 'Project configuration and preferences' },
    ]
  }
];

export function getHubForView(viewId: string): NavHub {
  const found = NAV_HUBS.find(hub => hub.items.some(item => item.id === viewId));
  return found || NAV_HUBS[0];
}

export function getAllNavItems(): NavItem[] {
  return NAV_HUBS.flatMap(hub => hub.items);
}
