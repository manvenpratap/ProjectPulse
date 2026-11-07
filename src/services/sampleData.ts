import { ProjectState, TaskStatus, TaskPriority, Member, Task, DefectStatus } from '../types';
import { getDefaultState } from '../store/defaultState';
import { nowISO, todayStr, addBusDays } from '../utils/projectUtils';

export const getWebSample = (): Partial<ProjectState> => {
  const state = getDefaultState();
  state.name = 'Project Phoenix: Enterprise Rollout';
  state.desc = 'A high-complexity infrastructure modernization project involving 12+ cloud modules and 5 global engineering teams. Focus on security, scalability, and seamless user experience across the global nexus ecosystem.';
  
  state.members = [
    { id: 'MEM-001', name: 'Alex Rivera', role: 'Engineering Manager', status: 'Active', reportsTo: '', email: 'alex@nexus.io', phone: '+1-555-0100', birthday: '15 May', plannedLeaves: [] },
    { id: 'MEM-002', name: 'Sarah Chen', role: 'Lead Architect', status: 'Active', reportsTo: 'Alex Rivera', email: 'sarah@nexus.io', phone: '+1-555-0101', birthday: '22 Jun', plannedLeaves: [] },
    { id: 'MEM-003', name: 'Marcus Wong', role: 'Lead Frontend', status: 'Active', reportsTo: 'Alex Rivera', email: 'marcus@nexus.io', phone: '+1-555-0102', birthday: '10 Jan', plannedLeaves: [] },
    { id: 'MEM-004', name: 'Elena Vance', role: 'Lead Design', status: 'Active', reportsTo: 'Alex Rivera', email: 'elena@nexus.io', phone: '+1-555-0103', birthday: '05 Sep', plannedLeaves: [] },
    { id: 'MEM-005', name: 'James Holden', role: 'DevOps Lead', status: 'Active', reportsTo: 'Sarah Chen', email: 'james@nexus.io', phone: '+1-555-0104', birthday: '12 Mar', plannedLeaves: [] },
    { id: 'MEM-006', name: 'Naomi Nagata', role: 'Staff Engineer', status: 'Active', reportsTo: 'Sarah Chen', email: 'naomi@nexus.io', phone: '+1-555-0105', birthday: '28 Jul', plannedLeaves: [] },
    { id: 'MEM-007', name: 'Amos Burton', role: 'Senior Developer', status: 'Active', reportsTo: 'Naomi Nagata', email: 'amos@nexus.io', phone: '+1-555-0106', birthday: '15 Nov', plannedLeaves: [] },
    { id: 'MEM-008', name: 'Bobby Draper', role: 'QA Lead', status: 'Active', reportsTo: 'Alex Rivera', email: 'bobby@nexus.io', phone: '+1-555-0107', birthday: '19 Dec', plannedLeaves: [] },
    { id: 'MEM-009', name: 'Chrisjen A.', role: 'Product Manager', status: 'Active', reportsTo: '', email: 'chris@nexus.io', phone: '+1-555-0108', birthday: '30 Apr', plannedLeaves: [] },
  ];
  state.nextMemberId = 10;

  const tasks: Task[] = [
    {
      id: 'TASK-001', name: 'Core API Gateway Architecture', status: TaskStatus.COMPLETED, priority: TaskPriority.CRITICAL,
      category: 'Architecture', module: 'API Gateway', moduleType: 'Server', assignee: 'Sarah Chen', release: 'v1.0.0',
      startDate: '2026-01-01', dueDate: '2026-01-15', actCompletionDate: '2026-01-14', progress: 100, estDays: 5, actDays: 5.25,
      dependsOn: [], notes: 'Base auth and routing settled.', 
      subtasks: [
        { id: 'SUB-001', name: 'Define API Specs', status: TaskStatus.COMPLETED, done: true, effort: 1, progress: 100, type: 'step' },
        { id: 'SUB-002', name: 'Select Gateway Provider', status: TaskStatus.COMPLETED, done: true, effort: 0.5, progress: 100, type: 'step' },
        { id: 'SUB-003', name: 'Architecture Review', status: TaskStatus.COMPLETED, done: true, effort: 1.5, progress: 100, type: 'step' }
      ], 
      guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-002', name: 'Auth Module Implementation', status: TaskStatus.COMPLETED, priority: TaskPriority.CRITICAL,
      category: 'Feature', module: 'Authentication', moduleType: 'Server', assignee: 'Naomi Nagata', release: 'v1.0.0',
      startDate: '2026-01-10', dueDate: '2026-02-05', actCompletionDate: '2026-02-04', progress: 100, estDays: 10, actDays: 9.75,
      dependsOn: ['TASK-001'], notes: 'OAuth2 and JWT integration complete.', 
      subtasks: [
        { id: 'SUB-004', name: 'JWT Generator', status: TaskStatus.COMPLETED, done: true, effort: 2, progress: 100, type: 'step' },
        { id: 'SUB-005', name: 'Database Schema', status: TaskStatus.COMPLETED, done: true, effort: 1, progress: 100, type: 'step' },
        { id: 'SUB-006', name: 'Social Login Connectors', status: TaskStatus.COMPLETED, done: true, effort: 3, progress: 100, type: 'step' }
      ], 
      guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-003', name: 'Global Navigation Shell', status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH,
      category: 'GUI Screen', module: 'User Interface', moduleType: 'GUI', assignee: 'Marcus Wong', release: 'v1.0.0',
      startDate: '2026-01-15', dueDate: '2026-02-10', actCompletionDate: '2026-02-12', progress: 100, estDays: 4.5, actDays: 5,
      dependsOn: [], notes: 'Responsive shell with sidebar.', 
      subtasks: [
        { id: 'SUB-007', name: 'Sidebar Navigation', status: TaskStatus.COMPLETED, done: true, effort: 1, progress: 100, type: 'screen' },
        { id: 'SUB-008', name: 'Layout Context', status: TaskStatus.COMPLETED, done: true, effort: 0.5, progress: 100, type: 'step' },
        { id: 'SUB-009', name: 'Theme Engine', status: TaskStatus.COMPLETED, done: true, effort: 1.5, progress: 100, type: 'step' }
      ], 
      guiScreens: ['App Shell', 'Sidebar'], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-004', name: 'User Profile Dashboard', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM,
      category: 'GUI Screen', module: 'User Interface', moduleType: 'GUI', assignee: 'Marcus Wong', release: 'v1.1.0',
      startDate: '2026-02-15', dueDate: '2026-05-20', actCompletionDate: null, progress: 75, estDays: 6, actDays: 5,
      dependsOn: ['TASK-003'], notes: 'Integration with User API pending.', 
      subtasks: [
        { id: 'SUB-010', name: 'Profile Information View', status: TaskStatus.COMPLETED, done: true, effort: 1.5, progress: 100, type: 'screen' },
        { id: 'SUB-011', name: 'Settings Management', status: TaskStatus.IN_PROGRESS, done: false, effort: 2, progress: 40, type: 'screen' },
        { id: 'SUB-012', name: 'Activity Feed Widget', status: TaskStatus.NOT_STARTED, done: false, effort: 1.5, progress: 0, type: 'screen' }
      ], 
      guiScreens: ['Profile Settings', 'Personal Info'], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-005', name: 'Market Intelligence Engine', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH,
      category: 'Feature', module: 'Core Engine', moduleType: 'Server', assignee: 'Sarah Chen', release: 'v1.1.0',
      startDate: '2026-02-01', dueDate: '2026-04-15', actCompletionDate: null, progress: 45, estDays: 15, actDays: 7.5,
      dependsOn: ['TASK-001'], notes: 'Complex calculation logic implementation.', 
      subtasks: [
        { id: 'SUB-013', name: 'Data Pipeline Design', status: TaskStatus.COMPLETED, done: true, effort: 2.5, progress: 100, type: 'step' },
        { id: 'SUB-014', name: 'Algorithm Core Logic', status: TaskStatus.IN_PROGRESS, done: false, effort: 7.5, progress: 30, type: 'step' },
        { id: 'SUB-015', name: 'Output Validator', status: TaskStatus.NOT_STARTED, done: false, effort: 2.5, progress: 0, type: 'step' }
      ], 
      guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-006', name: 'Real-time Feed Integration', status: TaskStatus.UNDER_REVIEW, priority: TaskPriority.HIGH,
      category: 'Feature', module: 'Market Data', moduleType: 'Server', assignee: 'Amos Burton', release: 'v1.1.0',
      startDate: '2026-03-01', dueDate: '2026-03-25', actCompletionDate: null, progress: 95, estDays: 7.5, actDays: 8,
      dependsOn: ['TASK-005'], notes: 'PR under review by Sarah.', 
      subtasks: [
        { id: 'SUB-016', name: 'WebSocket Handler', status: TaskStatus.COMPLETED, done: true, effort: 2.5, progress: 100, type: 'step' },
        { id: 'SUB-017', name: 'Buffer Management', status: TaskStatus.COMPLETED, done: true, effort: 1.5, progress: 100, type: 'step' },
        { id: 'SUB-018', name: 'Error Recovery Logic', status: TaskStatus.IN_PROGRESS, done: false, effort: 2, progress: 80, type: 'step' }
      ], 
      guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-007', name: 'Cloud Infrastructure Setup (AWS)', status: TaskStatus.COMPLETED, priority: TaskPriority.CRITICAL,
      category: 'DevOps', module: 'Infrastructure', moduleType: 'Server', assignee: 'James Holden', release: 'v1.0.0',
      startDate: '2026-01-01', dueDate: '2026-01-20', actCompletionDate: '2026-01-18', progress: 100, estDays: 4, actDays: 3,
      dependsOn: [], notes: 'VPC and Subnets ready.', subtasks: [], guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-008', name: 'CI/CD Pipeline Automation', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH,
      category: 'DevOps', module: 'Infrastructure', moduleType: 'Server', assignee: 'James Holden', release: 'v1.1.0',
      startDate: '2026-01-25', dueDate: '2026-06-30', actCompletionDate: null, progress: 30, estDays: 11, actDays: 5,
      dependsOn: ['TASK-007'], notes: 'Automating blue-green deployments.', subtasks: [], guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-009', name: 'Visual Brand Guidelines', status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM,
      category: 'Design', module: 'User Interface', moduleType: 'GUI', assignee: 'Elena Vance', release: 'v1.0.0',
      startDate: '2026-01-05', dueDate: '2026-01-25', actCompletionDate: '2026-01-24', progress: 100, estDays: 3, actDays: 2.75,
      dependsOn: [], notes: 'Styleguide and Figma tokens synced.', subtasks: [], guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-010', name: 'Advanced Search Component', status: TaskStatus.NOT_STARTED, priority: TaskPriority.LOW,
      category: 'Improvement', module: 'Shared Services', moduleType: 'GUI', assignee: 'Marcus Wong', release: 'v1.2.0',
      startDate: '2026-06-01', dueDate: '2026-06-20', actCompletionDate: null, progress: 0, estDays: 2.5, actDays: 0,
      dependsOn: ['TASK-003'], notes: 'Flexible search for all entities.', subtasks: [], guiScreens: ['Global Search'], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-011', name: 'Security Audit & Penetration Test', status: TaskStatus.ON_HOLD, priority: TaskPriority.CRITICAL,
      category: 'Testing', module: 'Authentication', moduleType: 'Server', assignee: 'Sarah Chen', release: 'v1.1.0',
      startDate: '2026-04-15', dueDate: '2026-05-15', actCompletionDate: null, progress: 0, estDays: 6, actDays: 0,
      dependsOn: ['TASK-002'], notes: 'Waiting for legal clearance.', subtasks: [], guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    },
    {
      id: 'TASK-012', name: 'Report Generation API', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM,
      category: 'Feature', module: 'Analytics Service', moduleType: 'Server', assignee: 'Naomi Nagata', release: 'v1.1.0',
      startDate: '2026-03-20', dueDate: '2026-04-25', actCompletionDate: null, progress: 20, estDays: 5.5, actDays: 1.25,
      dependsOn: ['TASK-006'], notes: 'PDF generation using headless chrome.', subtasks: [], guiScreens: [], createdAt: nowISO(), updatedAt: nowISO()
    }
  ];

  state.tasks = tasks;
  state.nextTaskId = 13;
  state.nextSubId = 19;

  state.features = [
    { 
      name: 'Cloud Native Modernization', 
      desc: 'Migrating legacy monolith architecture to scalable AWS-driven cloud services with zero-downtime requirements.', 
      screens: ['API Gateway', 'Infrastructure'] 
    },
    { 
      name: 'Omnichannel Experience', 
      desc: 'Delivering a consistent and high-performance user interface across desktop and mobile browsers.', 
      screens: ['User Interface', 'Shared Services'] 
    },
    { 
      name: 'Data-Driven Insights', 
      desc: 'Leveraging real-time market data to provide predictive analytics and automated report generation.', 
      screens: ['Core Engine', 'Market Data', 'Analytics Service'] 
    }
  ];

  state.log = [
    { ts: addBusDays(nowISO(), -30), action: 'Created', taskId: 'TASK-001', taskName: 'Core API Gateway Architecture', field: '', oldVal: '', newVal: '', module: 'API Gateway', assignee: 'Sarah Chen' },
    { ts: addBusDays(nowISO(), -25), action: 'Status Changed', taskId: 'TASK-001', taskName: 'Core API Gateway Architecture', field: 'status', oldVal: 'Not Started', newVal: 'Completed', module: 'API Gateway', assignee: 'Sarah Chen' },
    { ts: addBusDays(nowISO(), -28), action: 'Created', taskId: 'TASK-007', taskName: 'Cloud Infrastructure Setup (AWS)', field: '', oldVal: '', newVal: '', module: 'Infrastructure', assignee: 'James Holden' },
    { ts: addBusDays(nowISO(), -24), action: 'Status Changed', taskId: 'TASK-007', taskName: 'Cloud Infrastructure Setup (AWS)', field: 'status', oldVal: 'In Progress', newVal: 'Completed', module: 'Infrastructure', assignee: 'James Holden' },
    { ts: addBusDays(nowISO(), -20), action: 'Created', taskId: 'TASK-002', taskName: 'Auth Module Implementation', field: '', oldVal: '', newVal: '', module: 'Authentication', assignee: 'Naomi Nagata' },
    { ts: addBusDays(nowISO(), -18), action: 'Status Changed', taskId: 'TASK-002', taskName: 'Auth Module Implementation', field: 'status', oldVal: 'In Progress', newVal: 'Completed', module: 'Authentication', assignee: 'Naomi Nagata' },
    { ts: addBusDays(nowISO(), -15), action: 'Status Changed', taskId: 'TASK-003', taskName: 'Global Navigation Shell', field: 'status', oldVal: 'In Progress', newVal: 'Completed', module: 'User Interface', assignee: 'Marcus Wong' },
    { ts: addBusDays(nowISO(), -12), action: 'Created', taskId: 'TASK-009', taskName: 'Visual Brand Guidelines', field: '', oldVal: '', newVal: '', module: 'User Interface', assignee: 'Elena Vance' },
    { ts: addBusDays(nowISO(), -10), action: 'Status Changed', taskId: 'TASK-009', taskName: 'Visual Brand Guidelines', field: 'status', oldVal: 'In Progress', newVal: 'Completed', module: 'User Interface', assignee: 'Elena Vance' },
    { ts: addBusDays(nowISO(), -8), action: 'Created', taskId: 'TASK-005', taskName: 'Market Intelligence Engine', field: '', oldVal: '', newVal: '', module: 'Core Engine', assignee: 'Sarah Chen' },
    { ts: addBusDays(nowISO(), -5), action: 'Comment', taskId: 'TASK-005', taskName: 'Market Intelligence Engine', field: 'notes', oldVal: '', newVal: 'Starting complex logic implementation.', module: 'Core Engine', assignee: 'Sarah Chen' },
    { ts: addBusDays(nowISO(), -3), action: 'Status Changed', taskId: 'TASK-006', taskName: 'Real-time Feed Integration', field: 'status', oldVal: 'In Progress', newVal: 'Under Review', module: 'Market Data', assignee: 'Amos Burton' },
    { ts: addBusDays(nowISO(), -2), action: 'Defect Logged', taskId: 'TASK-006', taskName: 'Real-time Feed Integration', field: 'defects', oldVal: '', newVal: 'DEF-001', module: 'Market Data', assignee: 'Amos Burton' },
  ];

  state.defects = [
    { id: 'DEF-001', title: 'Memory leak in socket handler', type: 'Functional Bug', severity: 'S1 - Blocker', priority: 'Critical', status: DefectStatus.ASSIGNED, linkedType: 'Task', linkedId: 'TASK-006', assignee: 'Amos Burton', reporter: 'Alex Rivera', desc: 'Process crashes after 4h of activity', steps: '1. Connect to socket\n2. Wait 4h', createdAt: nowISO(), updatedAt: nowISO() },
    { id: 'DEF-002', title: 'Mobile menu overlap on Safari', type: 'UI/UX Issue', severity: 'S3 - Medium', priority: 'Medium', status: DefectStatus.NEW, linkedType: 'Task', linkedId: 'TASK-003', assignee: 'Marcus Wong', reporter: 'Elena Vance', desc: 'Hamburger menu covers the logo on iPhone 13.', steps: '1. Open on Safari iOS\n2. View port height < 600px', createdAt: nowISO(), updatedAt: nowISO() },
    { id: 'DEF-003', title: 'Invalid token extraction refactor', type: 'Technical Debt', severity: 'S4 - Low', priority: 'Low', status: DefectStatus.DEFERRED, linkedType: 'Task', linkedId: 'TASK-002', assignee: 'Naomi Nagata', reporter: 'Sarah Chen', desc: 'Auth middleware uses deprecated regex for bearer token extraction.', steps: 'Code audit observation', createdAt: nowISO(), updatedAt: nowISO() }
  ];
  state.nextDefectId = 4;

  state.raids = [
    {
      id: 'RAID-001',
      type: 'Risk',
      title: 'VPC Gateway Transit Latency Threshold',
      desc: 'Cross-region data synchronization might exceed the SLA under peak transactional traffic loads.',
      owner: 'James Holden',
      impact: 'High',
      probability: 'Medium',
      severity: 'S2 - Major',
      dueDate: '2026-05-15',
      status: 'Active',
      mitigation: 'Implement CloudFront edge-cache caching routing policies.',
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: 'RAID-002',
      type: 'Dependency',
      title: 'Auth social connector sandbox credentials',
      desc: 'Social auth client IDs require formal approval from compliance.',
      owner: 'Naomi Nagata',
      impact: 'Medium',
      probability: null,
      severity: 'S3 - Moderate',
      dueDate: '2026-04-10',
      status: 'Identified',
      mitigation: 'Mock authentication endpoints configured as secondary fallbacks.',
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: 'RAID-003',
      type: 'Issue',
      title: 'Memory leak blocking Socket QA cycle',
      desc: 'DEF-001 socket leakage crashes test environment container instances.',
      owner: 'Amos Burton',
      impact: 'High',
      probability: null,
      severity: 'S1 - Critical',
      dueDate: '2026-03-25',
      status: 'Active',
      mitigation: 'Isolate socket buffers and run manual garbage collection iterations.',
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ];
  state.nextRaidId = 4;

  state.decisions = [
    {
      id: 'DEC-001',
      title: 'Migrate core application persistence layer to Cloud SQL',
      desc: 'Transition legacy monolithic schema to transactional relational PostgreSQL database to handle audit trails.',
      status: 'Approved',
      impact: 'High',
      approver: 'Alex Rivera',
      proposedBy: 'Sarah Chen',
      rationale: 'PostgreSQL robust JSONB data typing and strong consistency satisfy regulatory compliance mandates.',
      alternatives: 'DynamoDB or standard MongoDB. Ruled out due to complex multi-row transactional join overhead.',
      linkedTask: 'TASK-001',
      linkedMilestone: '',
      dueDate: '2026-01-10',
      createdAt: nowISO(),
      updatedAt: nowISO()
    },
    {
      id: 'DEC-002',
      title: 'Implement AWS Cognito for external user management',
      desc: 'Delegate client identity federation to AWS cloud identity provider.',
      status: 'Pending Sign-off',
      impact: 'Medium',
      approver: 'Alex Rivera',
      proposedBy: 'Naomi Nagata',
      rationale: 'Reduces custom codebase footprint and guarantees secure SOC2 compliant token flows.',
      alternatives: 'Custom OAuth2 implementation using node-oauth. Ruled out due to security liability constraints.',
      linkedTask: 'TASK-002',
      linkedMilestone: '',
      dueDate: '2026-04-15',
      createdAt: nowISO(),
      updatedAt: nowISO()
    }
  ];
  state.releases = [
    { id: 'rel-1', name: 'v1.0.0', startDate: '2026-01-01', date: '2026-02-15', status: 'Released' },
    { id: 'rel-2', name: 'v1.1.0', startDate: '2026-02-16', date: '2026-04-30', status: 'Active' },
    { id: 'rel-3', name: 'v2.0.0-Beta', startDate: '2026-05-01', date: '2026-07-31', status: 'Planned' },
    { id: 'rel-4', name: 'v2.1.0', startDate: '2026-08-01', date: '2026-09-30', status: 'Planned' }
  ];

  state.deliveries = [
    {
      id: 'DEL-001',
      almId: 'ALM-10101',
      name: 'API Gateway TLS Termination & OAuth Token Introspection',
      pdn: 'PDN-2026-001',
      pdnProcessingDate: '2026-01-14',
      componentsDelivered: 'kong-gateway.yml, cert-manager.tf, auth-filter.lua',
      category: 'GSP++ Delivery',
      module: 'API Gateway',
      moduleType: 'Server',
      releaseVersion: 'v1.0.0',
      environment: 'Production',
      almStatus: 'Closed',
      status: 'Deployed',
      signOffStatus: 'Approved',
      approver: 'Alex Rivera',
      smokeTestStatus: 'Passed',
      reportedBy: 'Bobby Draper',
      fixedBy: 'Sarah Chen',
      targetDeliveryDate: '2026-01-15',
      actualDeliveryDate: '2026-01-14',
      leadTimeDays: 14,
      variance: -1,
      linkedType: 'Task',
      linkedId: 'TASK-001 : Core API Gateway Architecture',
      linkedTasks: ['TASK-001'],
      linkedScreens: [],
      rollbackPlan: 'Revert helm chart release to v0.9.8 via argocd rollback',
      notes: 'Passed automated security scan and compliance audits.',
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: '2026-01-14T17:30:00Z'
    },
    {
      id: 'DEL-002',
      almId: 'ALM-10105',
      name: 'OAuth2 JWT Token Revocation & Blacklisting Cache',
      pdn: 'PDN-2026-002',
      pdnProcessingDate: '2026-02-04',
      componentsDelivered: 'auth-service.jar, redis-cluster.json',
      category: 'Feature Release',
      module: 'Authentication',
      moduleType: 'Server',
      releaseVersion: 'v1.0.0',
      environment: 'Production',
      almStatus: 'Closed',
      status: 'Deployed',
      signOffStatus: 'Approved',
      approver: 'Alex Rivera',
      smokeTestStatus: 'Passed',
      reportedBy: 'Chrisjen A.',
      fixedBy: 'Naomi Nagata',
      targetDeliveryDate: '2026-02-05',
      actualDeliveryDate: '2026-02-04',
      leadTimeDays: 12,
      variance: -1,
      linkedType: 'Task',
      linkedId: 'TASK-002 : Auth Module Implementation',
      linkedTasks: ['TASK-002'],
      linkedScreens: [],
      rollbackPlan: 'Switch traffic back to auth-blue cluster via Route53 weights',
      notes: 'Redis sentinel nodes synced with 0 dropped sessions.',
      createdAt: '2026-01-10T09:00:00Z',
      updatedAt: '2026-02-04T16:00:00Z'
    },
    {
      id: 'DEL-003',
      almId: 'ALM-10112',
      name: 'Responsive Global Navigation Bar & Workspace Shell',
      pdn: 'PDN-2026-003',
      pdnProcessingDate: '2026-02-12',
      componentsDelivered: 'Navbar.tsx, Sidebar.tsx, nav-tokens.css',
      category: 'GSP++ Delivery',
      module: 'User Interface',
      moduleType: 'GUI',
      releaseVersion: 'v1.0.0',
      environment: 'Production',
      almStatus: 'Closed',
      status: 'Deployed',
      signOffStatus: 'Approved',
      approver: 'Alex Rivera',
      smokeTestStatus: 'Passed',
      reportedBy: 'Elena Vance',
      fixedBy: 'Marcus Wong',
      targetDeliveryDate: '2026-02-10',
      actualDeliveryDate: '2026-02-12',
      leadTimeDays: 10,
      variance: 2,
      linkedType: 'Multi',
      linkedId: 'TASK-003 : Global Navigation Shell (+2)',
      linkedTasks: ['TASK-003'],
      linkedScreens: ['App Shell', 'Sidebar'],
      rollbackPlan: 'Deploy previous static asset bundle from S3 bucket release-v1-prev',
      notes: 'Validated cross-browser on Chromium, Safari, and Firefox.',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-02-12T18:00:00Z'
    },
    {
      id: 'DEL-004',
      almId: 'ALM-10120',
      name: 'User Profile & Security MFA Setup GUI Screens',
      pdn: 'PDN-2026-004',
      pdnProcessingDate: '2026-03-20',
      componentsDelivered: 'ProfileView.tsx, MfaQrModal.tsx, api-client.ts',
      category: 'GSP++ Delivery',
      module: 'User Interface',
      moduleType: 'GUI',
      releaseVersion: 'v1.1.0',
      environment: 'UAT',
      almStatus: 'Ready for Test',
      status: 'Ready for Deployment',
      signOffStatus: 'Pending',
      approver: 'Alex Rivera',
      smokeTestStatus: 'Running',
      reportedBy: 'Bobby Draper',
      fixedBy: 'Marcus Wong',
      targetDeliveryDate: '2026-03-22',
      actualDeliveryDate: null,
      leadTimeDays: 18,
      variance: 0,
      linkedType: 'Multi',
      linkedId: 'TASK-004 : User Profile Dashboard (+2)',
      linkedTasks: ['TASK-004'],
      linkedScreens: ['Profile Settings', 'Personal Info'],
      rollbackPlan: 'Feature flag disable mfa_screen_v1 in LaunchDarkly',
      notes: 'Smoke tests actively running in UAT stage 2.',
      createdAt: '2026-02-15T09:30:00Z',
      updatedAt: '2026-03-20T11:45:00Z'
    },
    {
      id: 'DEL-005',
      almId: 'ALM-10128',
      name: 'Market Feed Backpressure Buffer & Kafka Consumer Group',
      pdn: 'PDN-2026-005',
      pdnProcessingDate: '2026-03-18',
      componentsDelivered: 'feed-consumer.go, ring-buffer.h, docker-compose.yml',
      category: 'GSP++ Delivery',
      module: 'Core Engine',
      moduleType: 'Server',
      releaseVersion: 'v1.1.0',
      environment: 'Staging',
      almStatus: 'Fixed',
      status: 'In Progress',
      signOffStatus: 'Pending',
      approver: 'Sarah Chen',
      smokeTestStatus: 'Not Run',
      reportedBy: 'Bobby Draper',
      fixedBy: 'Amos Burton',
      targetDeliveryDate: '2026-03-25',
      actualDeliveryDate: null,
      leadTimeDays: 22,
      variance: 3,
      linkedType: 'Multi',
      linkedId: 'TASK-005 : Market Intelligence Engine (+1)',
      linkedTasks: ['TASK-005', 'TASK-006'],
      linkedScreens: [],
      rollbackPlan: 'Drain consumer offset back to stable checkpoint 842100',
      notes: 'Memory optimization in progress for high-throughput bursts.',
      createdAt: '2026-02-01T11:00:00Z',
      updatedAt: '2026-03-18T14:20:00Z'
    },
    {
      id: 'DEL-006',
      almId: 'ALM-10134',
      name: 'Socket Disconnection Reconnect Memory Leak Patch',
      pdn: 'PDN-2026-006',
      pdnProcessingDate: '2026-03-24',
      componentsDelivered: 'ws-pool.ts, memleak-profiler.sh',
      category: 'Regression/NRT Defect',
      module: 'Market Data',
      moduleType: 'Server',
      releaseVersion: 'v1.1.0',
      environment: 'QA',
      almStatus: 'In Progress',
      status: 'In Progress',
      signOffStatus: 'Pending',
      approver: 'Sarah Chen',
      smokeTestStatus: 'Not Run',
      reportedBy: 'Bobby Draper',
      fixedBy: 'Amos Burton',
      targetDeliveryDate: '2026-03-25',
      actualDeliveryDate: null,
      leadTimeDays: 6,
      variance: 1,
      linkedType: 'Task',
      linkedId: 'TASK-006 : Real-time Feed Integration',
      linkedTasks: ['TASK-006'],
      linkedScreens: [],
      rollbackPlan: 'Revert commit b9f218 and restart node processes',
      notes: 'Addresses DEF-001 socket leakage issue during stress tests.',
      createdAt: '2026-03-01T14:00:00Z',
      updatedAt: '2026-03-24T16:10:00Z'
    },
    {
      id: 'DEL-007',
      almId: 'ALM-10142',
      name: 'Automated Blue-Green Deployment Terraform Automation',
      pdn: 'PDN-2026-007',
      pdnProcessingDate: '2026-03-15',
      componentsDelivered: 'main.tf, ecs-service.tf, alb-listener.tf',
      category: 'DevOps',
      module: 'Infrastructure',
      moduleType: 'Server',
      releaseVersion: 'v1.1.0',
      environment: 'Staging',
      almStatus: 'Open',
      status: 'Scheduled',
      signOffStatus: 'Pending',
      approver: 'Sarah Chen',
      smokeTestStatus: 'Not Run',
      reportedBy: 'James Holden',
      fixedBy: 'James Holden',
      targetDeliveryDate: '2026-04-10',
      actualDeliveryDate: null,
      leadTimeDays: 15,
      variance: 0,
      linkedType: 'Task',
      linkedId: 'TASK-008 : CI/CD Pipeline Automation',
      linkedTasks: ['TASK-008'],
      linkedScreens: [],
      rollbackPlan: 'terraform state rollback to statefile backup-0315',
      notes: 'Terraform plan reviewed and dry-run executed on non-prod VPC.',
      createdAt: '2026-01-25T13:00:00Z',
      updatedAt: '2026-03-15T10:00:00Z'
    },
    {
      id: 'DEL-008',
      almId: 'ALM-10150',
      name: 'Design System Tokens & Theme Flyout Matrix',
      pdn: 'PDN-2026-008',
      pdnProcessingDate: '2026-01-24',
      componentsDelivered: 'theme-engine.ts, tokens.json, ThemeFlyout.tsx',
      category: 'Feature Release',
      module: 'User Interface',
      moduleType: 'GUI',
      releaseVersion: 'v1.0.0',
      environment: 'Production',
      almStatus: 'Closed',
      status: 'Deployed',
      signOffStatus: 'Approved',
      approver: 'Alex Rivera',
      smokeTestStatus: 'Passed',
      reportedBy: 'Elena Vance',
      fixedBy: 'Marcus Wong',
      targetDeliveryDate: '2026-01-25',
      actualDeliveryDate: '2026-01-24',
      leadTimeDays: 8,
      variance: -1,
      linkedType: 'Task',
      linkedId: 'TASK-009 : Visual Brand Guidelines',
      linkedTasks: ['TASK-009'],
      linkedScreens: ['Theme Flyout'],
      rollbackPlan: 'Default to pulse theme tokens fallback',
      notes: 'Includes 20 high-contrast themes and responsive styling.',
      createdAt: '2026-01-05T09:00:00Z',
      updatedAt: '2026-01-24T15:00:00Z'
    },
    {
      id: 'DEL-009',
      almId: 'ALM-10165',
      name: 'Multi-Entity Global Search Indexer & Quick Palette',
      pdn: 'PDN-2026-009',
      pdnProcessingDate: '2026-04-01',
      componentsDelivered: 'search-worker.ts, SearchModal.tsx',
      category: 'Feature Release',
      module: 'Shared Services',
      moduleType: 'GUI',
      releaseVersion: 'v2.0.0-Beta',
      environment: 'Dev',
      almStatus: 'New',
      status: 'Scheduled',
      signOffStatus: 'Not Required',
      approver: 'Alex Rivera',
      smokeTestStatus: 'Not Run',
      reportedBy: 'Chrisjen A.',
      fixedBy: 'Marcus Wong',
      targetDeliveryDate: '2026-06-20',
      actualDeliveryDate: null,
      leadTimeDays: 0,
      variance: 0,
      linkedType: 'Task',
      linkedId: 'TASK-010 : Advanced Search Component',
      linkedTasks: ['TASK-010'],
      linkedScreens: ['Global Search'],
      rollbackPlan: 'Disable search shortcut listener in window manager',
      notes: 'Initial specs agreed with product manager.',
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: '2026-03-01T10:00:00Z'
    },
    {
      id: 'DEL-010',
      almId: 'ALM-10172',
      name: 'Interactive Gantt SVG Timeline with Dependency Arcs',
      pdn: 'PDN-2026-010',
      pdnProcessingDate: '2026-02-18',
      componentsDelivered: 'GanttSvg.tsx, dependency-calculator.ts',
      category: 'GSP++ Delivery',
      module: 'User Interface',
      moduleType: 'GUI',
      releaseVersion: 'v1.1.0',
      environment: 'UAT',
      almStatus: 'Ready for Test',
      status: 'Ready for Deployment',
      signOffStatus: 'Approved',
      approver: 'Alex Rivera',
      smokeTestStatus: 'Passed',
      reportedBy: 'Bobby Draper',
      fixedBy: 'Marcus Wong',
      targetDeliveryDate: '2026-02-20',
      actualDeliveryDate: '2026-02-18',
      leadTimeDays: 14,
      variance: -2,
      linkedType: 'Task',
      linkedId: 'TASK-003 : Global Navigation Shell',
      linkedTasks: ['TASK-003'],
      linkedScreens: ['Timeline View'],
      rollbackPlan: 'Toggle to standard table view mode only',
      notes: 'Zero flicker SVG path rendering verified with 100+ tasks.',
      createdAt: '2026-02-01T08:00:00Z',
      updatedAt: '2026-02-18T17:00:00Z'
    }
  ];
  state.nextDeliveryId = 11;

  return state;
};

