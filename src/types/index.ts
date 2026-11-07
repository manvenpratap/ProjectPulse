/**
 * Global Project Pulse Types
 */

export enum TaskStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  ON_HOLD = 'On Hold',
  UNDER_REVIEW = 'Under Review',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export enum TaskPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum DefectStatus {
  NEW = 'New',
  ASSIGNED = 'Assigned',
  FIXED = 'Fixed',
  RETEST = 'Retest',
  CLOSED = 'Closed',
  REJECTED = 'Rejected',
  DEFERRED = 'Deferred',
}

export interface Subtask {
  id: string;
  name: string;
  status: TaskStatus;
  category?: string;
  done: boolean;
  effort: number;
  progress: number;
  type: 'step' | 'screen';
  actDays?: number;
  actCompletionDate?: string;
  startDate?: string;
  dueDate?: string;
}

export interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  module: string;
  moduleType: string;
  assignee: string;
  release: string;
  startDate: string;
  dueDate: string;
  actCompletionDate: string | null;
  progress: number;
  estDays: number;
  actDays: number;
  dependsOn: string[];
  notes: string;
  subtasks: Subtask[];
  guiScreens: string[];
  updatedAt: string;
  createdAt: string;
  [customKey: string]: any;
}

export interface Leave {
  from: string;
  to: string;
  reason: string;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  status: string;
  reportsTo: string;
  email: string;
  phone: string;
  birthday: string;
  plannedLeaves: Leave[];
}

export interface Defect {
  id: string;
  title: string;
  type: string;
  severity: string;
  priority: string;
  status: DefectStatus;
  linkedType: 'Task' | 'Subtask' | 'Screen';
  linkedId: string;
  assignee: string;
  reporter: string;
  desc: string;
  steps: string;
  createdAt: string;
  updatedAt: string;
  [customKey: string]: any;
}

export interface ProjectReport {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  frequency: string;
  summary: string;
  activities: string;
  achievements: string;
  risks: string;
  plans: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomField {
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';
  source?: 'local' | 'global';
  globalKey?: string;
  options?: string[];
  required?: boolean;
}

export interface StepTemplate {
  name: string;
  category: string;
  steps: {
    name: string;
    effort: number;
  }[];
}

export interface WidgetLayout {
  id: string;
  type: string;
  t?: string; // Title
  on: boolean;
  span?: number;
  chartType?: string;
  view?: 'chart' | 'table';
  rows?: string[];
  cols?: string[];
  vals?: { f: string; op: string; t?: string }[];
  filters?: any;
}

export interface ProjectState {
  name: string;
  desc: string;
  tasks: Task[];
  members: Member[];
  defects: Defect[];
  reports: ProjectReport[];
  raids: RaidItem[];
  decisions: Decision[];
  baselines: Baseline[];
  releases: Release[];
  log: LogEntry[];
  features: Feature[];
  dropdowns: Record<string, string[]>;
  customFields: CustomField[];
  defCustomFields: CustomField[];
  stepTemplates: StepTemplate[];
  settings: ProjectSettings;
  view: string;
  theme: string;
  nextTaskId: number;
  nextMemberId: number;
  nextSubId: number;
  nextDefectId: number;
  nextLogId: number;
  nextReportId: number;
  nextRaidId?: number;
  nextDecisionId?: number;
  nextBaselineId?: number;
  [key: string]: any;
}

export interface LogEntry {
  ts: string;
  action: string;
  taskId: string;
  taskName: string;
  field: string;
  oldVal: string;
  newVal: string;
  comment?: string;
  module: string;
  assignee: string;
}

export interface Feature {
  name: string;
  desc: string;
  screens: string[];
  release?: string;
}

export interface RaidItem {
  id: string;
  type: 'Risk' | 'Assumption' | 'Issue' | 'Dependency';
  title: string;
  desc: string;
  owner: string;
  impact: 'High' | 'Medium' | 'Low';
  probability?: 'High' | 'Medium' | 'Low' | null;
  severity: string;
  dueDate: string;
  status: string;
  mitigation: string;
  linkedTasks?: string[];
  linkedMilestones?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  title: string;
  desc: string;
  status: 'Pending Sign-off' | 'Approved' | 'Rejected' | 'Appealed';
  impact: string;
  approver: string;
  proposedBy: string;
  rationale: string;
  alternatives: string;
  linkedTask: string;
  linkedMilestone: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Baseline {
  id: string;
  name: string;
  desc: string;
  taskId: string;
  taskName: string;
  baselineStartDate: string;
  baselineDueDate: string;
  baselineEffort: number;
  actStartDate: string;
  actDueDate: string;
  actEffort: number;
  varianceDays: number;
  slippageReason: string;
  snapshotDate: string;
}

export interface Release {
  id: string;
  name: string;
  date: string;
  status: 'Planned' | 'Active' | 'Released';
}

export interface ProjectSettings {
  daysPerWeek: number;
  workDays: number;
  effortUnit?: string;
  hoursPerDay?: number;
  hoursPerWeek?: number;
  roadmapModulesSelected?: string[];
  roadmapModuleTypesSelected?: string[];
  roadmapViewMode?: 'unified' | 'swimlane';
  viewOrder?: string[];
  alertPrefs: {
    overdue: boolean;
    dueSoon: boolean;
    blocked: boolean;
    overloaded: boolean;
    leave: boolean;
    stale: boolean;
    milestone: boolean;
    daysUntilDue: number;
    staleDays: number;
  };
}
