import { ProjectState, TaskStatus, TaskPriority, DefectStatus } from '../types';

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
  retros: [
    {
      id: 'RETRO-01',
      category: 'went_well',
      title: 'Automated CI/CD cut deployment time by 45%',
      desc: 'The GitHub Actions pipeline optimization eliminated manual staging handoffs.',
      author: 'Sarah Chen',
      votes: 7,
      createdAt: '2026-10-20'
    },
    {
      id: 'RETRO-02',
      category: 'went_well',
      title: 'Zero regressions on ALM Release v1.1.0',
      desc: 'Smoke test coverage caught 3 edge cases prior to staging promotion.',
      author: 'Marcus Vance',
      votes: 5,
      createdAt: '2026-10-21'
    },
    {
      id: 'RETRO-03',
      category: 'needs_improvement',
      title: 'API Gateway specs changed mid-sprint',
      desc: 'Lack of frozen contracts delayed front-end mock integration by 2 full days.',
      author: 'Elena Rostova',
      votes: 9,
      createdAt: '2026-10-22'
    },
    {
      id: 'RETRO-04',
      category: 'needs_improvement',
      title: 'Flaky E2E test in payment sandbox',
      desc: 'Intermittent third-party webhook timeout caused false negative builds.',
      author: 'Devon Miles',
      votes: 6,
      createdAt: '2026-10-23'
    },
    {
      id: 'RETRO-05',
      category: 'action_item',
      title: 'Introduce OpenAPI spec freeze 48h before sprint kick-off',
      desc: 'Architecture lead must sign off contract before frontend tasks are assigned.',
      author: 'David Kim',
      assignedTo: 'Marcus Vance',
      status: 'In Progress',
      targetSprint: 'Sprint 24',
      votes: 11,
      createdAt: '2026-10-24'
    },
    {
      id: 'RETRO-06',
      category: 'action_item',
      title: 'Implement synthetic test retries on webhook mock',
      desc: 'Add deterministic mock server to avoid external sandbox network flakiness.',
      author: 'Sarah Chen',
      assignedTo: 'Devon Miles',
      status: 'Open',
      targetSprint: 'Sprint 24',
      votes: 8,
      createdAt: '2026-10-24'
    },
    {
      id: 'RETRO-07',
      category: 'kudos',
      title: 'Kudos to Elena for squashing the S1 Blocker in record time!',
      desc: 'Stayed late to patch the authorization header edge-case before release cut.',
      author: 'Alex Morgan',
      votes: 12,
      createdAt: '2026-10-25'
    }
  ],
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
