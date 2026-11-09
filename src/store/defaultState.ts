import { ProjectState, TaskStatus, TaskPriority, DefectStatus, FieldConfig } from '../types';

export const DEFAULT_TASK_COLS: FieldConfig[] = [
  { key: 'id', label: 'TASK ID', width: 90, type: 'text', visible: true, required: true },
  { key: 'name', label: 'TASK NAME & CHECKLIST', width: 320, type: 'text', visible: true, required: true },
  { key: 'module', label: 'MODULE & SCOPE', width: 180, type: 'select', mapKey: 'module', visible: true, required: true },
  { key: 'status', label: 'STATUS', width: 130, type: 'select', mapKey: 'status', visible: true, required: true },
  { key: 'priority', label: 'PRIORITY', width: 110, type: 'select', mapKey: 'priority', visible: true, required: true },
  { key: 'assignee', label: 'ASSIGNEE', width: 150, type: 'select', mapKey: 'member', visible: true },
  { key: 'dueDate', label: 'DUE DATE', width: 130, type: 'date', visible: true },
  { key: 'progress', label: 'PROGRESS', width: 110, type: 'progress', visible: true },
  { key: 'startDate', label: 'PLANNED START', width: 120, type: 'date', visible: true },
  { key: 'actCompletionDate', label: 'COMPLETED DATE', width: 120, type: 'date', visible: true },
  { key: 'estDays', label: 'EST. EFFORT (DAYS)', width: 100, type: 'number', visible: true },
  { key: 'actDays', label: 'ACT. EFFORT (DAYS)', width: 100, type: 'number', visible: true },
  { key: 'category', label: 'CATEGORY', width: 120, type: 'select', mapKey: 'category', visible: true },
  { key: 'release', label: 'TARGET RELEASE', width: 120, type: 'select', mapKey: 'version', visible: true },
  { key: 'dependsOn', label: 'DEPENDENCIES', width: 110, type: 'text', visible: true },
  { key: 'guiScreens', label: 'GUI SCREENS', width: 140, type: 'text', visible: true },
  { key: 'notes', label: 'NOTES & REMARKS', width: 180, type: 'text', visible: true }
];

export const DEFAULT_DEFECT_COLS: FieldConfig[] = [
  { key: 'id', label: 'DEFECT ID', width: 90, type: 'text', visible: true, required: true },
  { key: 'title', label: 'SUMMARY & SCOPE', width: 260, type: 'text', visible: true, required: true },
  { key: 'severity', label: 'SEVERITY', width: 120, type: 'select', mapKey: 'defectSeverity', visible: true, required: true },
  { key: 'priority', label: 'PRIORITY', width: 110, type: 'select', mapKey: 'defectPriority', visible: true, required: true },
  { key: 'status', label: 'STATUS', width: 120, type: 'select', mapKey: 'defectStatus', visible: true, required: true },
  { key: 'assignee', label: 'ASSIGNEE', width: 140, type: 'select', mapKey: 'member', visible: true },
  { key: 'reporter', label: 'REPORTER', width: 130, type: 'select', mapKey: 'member', visible: true },
  { key: 'linkedId', label: 'LINKED ITEM', width: 120, type: 'text', visible: true },
  { key: 'type', label: 'DEFECT TYPE', width: 130, type: 'select', mapKey: 'defectType', visible: true },
  { key: 'createdAt', label: 'REPORTED DATE', width: 110, type: 'date', visible: true },
  { key: 'updatedAt', label: 'LAST UPDATED', width: 110, type: 'date', visible: true },
  { key: 'steps', label: 'REPRODUCTION STEPS', width: 200, type: 'text', visible: true },
  { key: 'desc', label: 'DETAILS & LOGS', width: 200, type: 'text', visible: true }
];

export const DEFAULT_DELIVERY_COLS: FieldConfig[] = [
  { key: 'almId', label: 'DEFECT ID - ALM ID', width: 140, type: 'text', visible: true, required: true },
  { key: 'id', label: 'DELIVERY ID', width: 110, type: 'text', visible: true },
  { key: 'name', label: 'DESCRIPTION - ALM DESCRIPTION', width: 280, type: 'text', visible: true, required: true },
  { key: 'pdn', label: 'PDN INFO', width: 130, type: 'text', visible: true, required: true },
  { key: 'pdnProcessingDate', label: 'PDN PROCESSING DATE', width: 140, type: 'date', visible: true, required: true },
  { key: 'componentsDelivered', label: 'COMPONENTS DELIVERED', width: 240, type: 'text', visible: true, required: true },
  { key: 'category', label: 'CATEGORY', width: 140, type: 'select', mapKey: 'deliveryCategory', visible: true, required: true },
  { key: 'module', label: 'MODULE', width: 130, type: 'select', mapKey: 'module', visible: true, required: true },
  { key: 'environment', label: 'ENVIRONMENT', width: 110, type: 'select', mapKey: 'deliveryEnv', visible: true },
  { key: 'almStatus', label: 'ALM STATUS', width: 130, type: 'select', mapKey: 'almStatus', visible: true, required: true },
  { key: 'status', label: 'DEPLOYMENT STATUS', width: 130, type: 'select', mapKey: 'deliveryStatus', visible: true },
  { key: 'releaseVersion', label: 'RELEASE VERSION', width: 120, type: 'select', mapKey: 'version', visible: true },
  { key: 'signOffStatus', label: 'SIGN-OFF STATUS', width: 120, type: 'select', mapKey: 'deliverySignOff', visible: true },
  { key: 'smokeTestStatus', label: 'SMOKE TEST GATE', width: 130, type: 'select', mapKey: 'smokeTestStatus', visible: true },
  { key: 'approver', label: 'APPROVER / LEAD', width: 130, type: 'select', mapKey: 'member', visible: true },
  { key: 'reportedBy', label: 'REPORTED BY', width: 130, type: 'select', mapKey: 'member', visible: true, required: true },
  { key: 'fixedBy', label: 'DEFECT FIXED BY', width: 130, type: 'select', mapKey: 'member', visible: true, required: true },
  { key: 'targetDeliveryDate', label: 'TARGET DATE', width: 130, type: 'date', visible: true },
  { key: 'actualDeliveryDate', label: 'ACTUAL DATE', width: 130, type: 'date', visible: true },
  { key: 'rollbackPlan', label: 'ROLLBACK PLAN', width: 180, type: 'text', visible: true }
];

export const getDefaultState = (): ProjectState => ({
  name: '',
  desc: '',
  tasks: [],
  members: [],
  defects: [],
  deliveries: [],
  reports: [],
  raids: [],
  decisions: [],
  baselines: [],
  releases: [],
  retros: [],
  log: [],
  features: [],
  dropdowns: {
    status: ['Not Started', 'In Progress', 'On Hold', 'Under Review', 'Completed', 'Cancelled'],
    priority: ['Critical', 'High', 'Medium', 'Low'],
    category: ['Feature', 'Bug', 'Improvement', 'Research', 'Documentation', 'DevOps', 'Testing', 'Design', 'Server Module', 'GUI Screen'],
    module: ['Account Management (AM)', 'Portfolio Management (PM)', 'Market Data', 'Shared Services', 'Core Engine', 'Authentication', 'User Interface', 'API Gateway', 'Analytics Service', 'Payment Module', 'Database Migration', 'Infrastructure'],
    moduleType: ['Server', 'GUI', 'Interface'],
    version: ['v1.0.0', 'v1.1.0', 'v2.0-Beta', 'v2.0.0-Beta', 'v2.1.0', 'Next Major'],
    role: ['Engineering Manager', 'Lead Architect', 'Lead Frontend', 'Lead Design', 'Jr Lead UX', 'Jr Lead Research', 'Developer', 'Designer', 'QA', 'PM', 'DevOps', 'Analyst'],
    memberStatus: ['Active', 'Other Assignment', 'On Leave', 'Serving Notice Period', 'Departed'],
    defectStatus: ['New', 'Assigned', 'Fixed', 'Retest', 'Closed', 'Rejected', 'Deferred'],
    defectPriority: ['Critical', 'High', 'Medium', 'Low'],
    defectSeverity: ['S1 - Blocker', 'S2 - High', 'S3 - Medium', 'S4 - Low'],
    defectType: ['Functional Bug', 'UI/UX Issue', 'Performance', 'Security', 'Data Issue', 'Suggestion'],
    deliveryStatus: ['Scheduled', 'In Progress', 'Ready for Deployment', 'Deployed', 'Cancelled', 'Rolled Back'],
    deliveryCategory: ['GSP++ Delivery', 'Regression/NRT Defect', 'Feature Release', 'Hotfix', 'Maintenance', 'Security Patch'],
    deliveryEnv: ['Production', 'Staging', 'UAT', 'QA', 'Dev'],
    deliverySignOff: ['Pending', 'Approved', 'Rejected', 'Not Required'],
    smokeTestStatus: ['Not Run', 'Running', 'Passed', 'Failed'],
    almStatus: ['New', 'Open', 'In Progress', 'Fixed', 'Ready for Test', 'Retest', 'Closed', 'Rejected', 'Reopened']
  },
  customFields: [],
  defCustomFields: [],
  delCustomFields: [],
  cols: DEFAULT_TASK_COLS,
  defCols: DEFAULT_DEFECT_COLS,
  delCols: DEFAULT_DELIVERY_COLS,
  stepTemplates: [
    {
      name: 'Server-Side Workflow', category: 'Server Module', steps: [
        { name: 'Schema Design', effort: 2 },
        { name: 'API Endpoint Definition', effort: 3 },
        { name: 'Business Logic Implementation', effort: 4 },
        { name: 'Unit Testing', effort: 2 },
        { name: 'Load Testing', effort: 1 },
        { name: 'API Documentation', effort: 1 }
      ]
    },
    {
      name: 'GUI-Side Workflow', category: 'GUI Screen', steps: [
        { name: 'UX Wireframe', effort: 2 },
        { name: 'Component Prototyping', effort: 3 },
        { name: 'State Management Integration', effort: 2 },
        { name: 'Cross-Browser Testing', effort: 1 },
        { name: 'Accessibility Audit', effort: 1 },
        { name: 'Visual QA', effort: 1 }
      ]
    },
    {
      name: 'Standard Dev Flow', category: 'Feature', steps: [
        { name: 'Requirements Review', effort: 1 },
        { name: 'Development', effort: 5 },
        { name: 'Code Review', effort: 1 },
        { name: 'QA Verification', effort: 2 },
        { name: 'Deployment', effort: 1 }
      ]
    },
  ],
  settings: {
    daysPerWeek: 5,
    workDays: 5,
    alertPrefs: { 
      overdue: true, 
      dueSoon: true, 
      blocked: true, 
      overloaded: true, 
      leave: true, 
      stale: true, 
      milestone: true, 
      daysUntilDue: 3, 
      staleDays: 7 
    }
  },
  view: 'overview',
  theme: 'pulse',
  nextTaskId: 1,
  nextMemberId: 1,
  nextSubId: 1,
  nextDefectId: 1,
  nextDeliveryId: 1,
  nextLogId: 1,
  nextReportId: 1,
  nextRaidId: 1,
  nextDecisionId: 1,
  nextBaselineId: 1
});
