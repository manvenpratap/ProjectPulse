import { ProjectState, TaskStatus, TaskPriority, DefectStatus } from '../types';

export const getDefaultState = (): ProjectState => ({
  name: '',
  desc: '',
  tasks: [],
  members: [],
  defects: [],
  reports: [],
  log: [],
  features: [
    { name: 'Core Infrastructure', screens: ['Database Schema', 'Core Services', 'API Gateway'], desc: 'Fundamental system services and architecture.' },
    { name: 'User Management', screens: ['Cash Accounts', 'Security Accounts', 'Authentication'], desc: 'User lifecycle and account security.' },
    { name: 'Market Intelligence', screens: ['Portfolio Valuations', 'Market Data Feed', 'Analytics Dashboard'], desc: 'Data processing and reporting.' }
  ],
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
    defectType: ['Functional Bug', 'UI/UX Issue', 'Performance', 'Security', 'Data Issue', 'Suggestion']
  },
  customFields: [],
  defCustomFields: [],
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
  view: 'tasks',
  theme: 'paper',
  nextTaskId: 1,
  nextMemberId: 1,
  nextSubId: 1,
  nextDefectId: 1,
  nextLogId: 1,
  nextReportId: 1
});
