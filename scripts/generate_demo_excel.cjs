const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function buildDemoDatabase() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ProjectPulse';
  wb.lastModifiedBy = 'ProjectPulse';
  wb.created = new Date();
  wb.modified = new Date();

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Slate-900 / Navy
  };
  const headerFont = {
    name: 'Segoe UI',
    color: { argb: 'FF38BDF8' }, // Sky-400
    bold: true,
    size: 10
  };
  const headerBorder = {
    bottom: { style: 'medium', color: { argb: 'FF0284C7' } }
  };

  function applyHeaderStyles(sheet) {
    const row = sheet.getRow(1);
    row.font = headerFont;
    row.fill = headerFill;
    row.border = headerBorder;
    row.height = 24;
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  // ==========================================
  // 1. DASHBOARD SHEET (Metadata & KPIs)
  // ==========================================
  const ds = wb.addWorksheet('Dashboard');
  ds.columns = [
    { header: 'Metric', key: 'm', width: 34 },
    { header: 'Value', key: 'v', width: 55 }
  ];
  ds.addRow({ m: 'Project Name', v: 'Project Titan: Global Cloud Banking Platform' });
  ds.addRow({ m: 'Project Description', v: 'Enterprise-grade Tier-1 core banking migration to cloud-native microservices with multi-region active-active persistence, PCI-DSS compliance, and zero-downtime deployment pipelines.' });
  ds.addRow({ m: 'Total Tasks', v: 24 });
  ds.addRow({ m: 'Completed Tasks', v: 8 });
  ds.addRow({ m: 'In Progress Tasks', v: 11 });
  ds.addRow({ m: 'Total Defects Registered', v: 12 });
  ds.addRow({ m: 'Active RAID Items', v: 10 });
  ds.addRow({ m: 'Business Decisions Signed-off', v: 8 });
  ds.addRow({ m: 'Team Capacity count', v: 10 });
  ds.addRow({ m: 'Target Primary Release', v: 'v1.1.0' });
  ds.addRow({ m: 'Baseline Health Score', v: '94.2% (Nominal)' });
  applyHeaderStyles(ds);

  // ==========================================
  // 2. TASKS SHEET
  // ==========================================
  const ts = wb.addWorksheet('Tasks');
  ts.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Task Name', key: 'name', width: 42 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 14 },
    { header: 'Progress', key: 'progress', width: 12 },
    { header: 'Module', key: 'module', width: 24 },
    { header: 'Dependencies', key: 'dependsOn', width: 22 },
    { header: 'Effort (d)', key: 'estDays', width: 12 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Module Type', key: 'moduleType', width: 14 },
    { header: 'Release', key: 'release', width: 14 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'Actual Completion Date', key: 'actCompletionDate', width: 20 },
    { header: 'Actual Effort (d)', key: 'actDays', width: 15 },
    { header: 'GUI Screens', key: 'guiScreens', width: 28 },
    { header: 'Notes', key: 'notes', width: 40 },
    { header: 'Subtasks', key: 'subtasks', width: 45 },
  ];

  const tasksData = [
    {
      id: 'TASK-001', name: 'Core API Gateway Architecture & Routing', status: 'Completed', priority: 'Critical',
      assignee: 'Sarah Chen', dueDate: '2026-01-15', progress: 100, module: 'API Gateway', dependsOn: [], estDays: 5,
      category: 'Architecture', moduleType: 'Server', release: 'v1.0.0', startDate: '2026-01-02', actCompletionDate: '2026-01-14', actDays: 5.25,
      guiScreens: ['API Gateway'], notes: 'Kong and Envoy mesh routing evaluated and deployed.',
      subtasks: [
        { id: 'SUB-001', name: 'Define OpenAPI Gateway Specifications', status: 'Completed', done: true, effort: 1.5, progress: 100, type: 'step' },
        { id: 'SUB-002', name: 'Implement Envoy Rate Limiting Filter', status: 'Completed', done: true, effort: 2, progress: 100, type: 'step' },
        { id: 'SUB-003', name: 'Benchmark Ingress Latency SLA (<2ms)', status: 'Completed', done: true, effort: 1.5, progress: 100, type: 'step' }
      ]
    },
    {
      id: 'TASK-002', name: 'OAuth2 Zero-Trust Identity Provider Engine', status: 'Completed', priority: 'Critical',
      assignee: 'Naomi Nagata', dueDate: '2026-02-05', progress: 100, module: 'Authentication', dependsOn: ['TASK-001'], estDays: 10,
      category: 'Feature', moduleType: 'Server', release: 'v1.0.0', startDate: '2026-01-16', actCompletionDate: '2026-02-04', actDays: 9.75,
      guiScreens: ['Authentication'], notes: 'PKCE tokens, RSA key rotations, and session caching in Redis.',
      subtasks: [
        { id: 'SUB-004', name: 'JWT Generator & Signature Validator', status: 'Completed', done: true, effort: 3, progress: 100, type: 'step' },
        { id: 'SUB-005', name: 'MFA SMS & TOTP Authenticator Provider', status: 'Completed', done: true, effort: 4, progress: 100, type: 'step' },
        { id: 'SUB-006', name: 'OAuth2 Role Claim Integration', status: 'Completed', done: true, effort: 2.75, progress: 100, type: 'step' }
      ]
    },
    {
      id: 'TASK-003', name: 'Global Application Shell & Navigation Canvas', status: 'Completed', priority: 'High',
      assignee: 'Marcus Wong', dueDate: '2026-02-10', progress: 100, module: 'User Interface', dependsOn: [], estDays: 5,
      category: 'GUI Screen', moduleType: 'GUI', release: 'v1.0.0', startDate: '2026-01-20', actCompletionDate: '2026-02-09', actDays: 5,
      guiScreens: ['App Shell', 'Sidebar Navigation'], notes: 'Desktop and mobile responsive layout with fluid transitions.',
      subtasks: [
        { id: 'SUB-007', name: 'Collapsible Responsive Navigation Sidebar', status: 'Completed', done: true, effort: 2, progress: 100, type: 'screen' },
        { id: 'SUB-008', name: 'Global Header with Command Palette Kbd', status: 'Completed', done: true, effort: 1.5, progress: 100, type: 'screen' },
        { id: 'SUB-009', name: 'Multi-theme Engine Setup (Dark/Light)', status: 'Completed', done: true, effort: 1.5, progress: 100, type: 'step' }
      ]
    },
    {
      id: 'TASK-004', name: 'Multi-Region PostgreSQL Active-Active Sync', status: 'Completed', priority: 'Critical',
      assignee: 'James Holden', dueDate: '2026-02-15', progress: 100, module: 'Infrastructure', dependsOn: ['TASK-001'], estDays: 12,
      category: 'DevOps', moduleType: 'Server', release: 'v1.0.0', startDate: '2026-01-18', actCompletionDate: '2026-02-14', actDays: 11.5,
      guiScreens: ['Database Schema'], notes: 'Logical replication across AWS us-east-1 and eu-central-1.',
      subtasks: [
        { id: 'SUB-010', name: 'Configure Bucardo Bi-directional Replication', status: 'Completed', done: true, effort: 4, progress: 100, type: 'step' },
        { id: 'SUB-011', name: 'Automate Failover Quorum with Patroni', status: 'Completed', done: true, effort: 4.5, progress: 100, type: 'step' },
        { id: 'SUB-012', name: 'Verify Split-Brain Conflict Resolution', status: 'Completed', done: true, effort: 3, progress: 100, type: 'step' }
      ]
    },
    {
      id: 'TASK-005', name: 'Cash Accounts Ledger & Double-Entry Engine', status: 'Completed', priority: 'Critical',
      assignee: 'Amos Burton', dueDate: '2026-02-28', progress: 100, module: 'Account Management (AM)', dependsOn: ['TASK-002', 'TASK-004'], estDays: 8,
      category: 'Server Module', moduleType: 'Server', release: 'v1.0.0', startDate: '2026-02-06', actCompletionDate: '2026-02-27', actDays: 8.5,
      guiScreens: ['Cash Accounts'], notes: 'Immutable transaction ledger with cryptographic hashing.',
      subtasks: [
        { id: 'SUB-013', name: 'Double Entry Debit/Credit Schema', status: 'Completed', done: true, effort: 2.5, progress: 100, type: 'step' },
        { id: 'SUB-014', name: 'Balance Locking & Concurrent Hold Mechanism', status: 'Completed', done: true, effort: 3.5, progress: 100, type: 'step' },
        { id: 'SUB-015', name: 'Ledger Reconciliation Cron Job', status: 'Completed', done: true, effort: 2.5, progress: 100, type: 'step' }
      ]
    },
    {
      id: 'TASK-006', name: 'Automated Flyway Database Migration Engine', status: 'Completed', priority: 'Medium',
      assignee: 'James Holden', dueDate: '2026-03-05', progress: 100, module: 'Database Migration', dependsOn: ['TASK-004'], estDays: 4,
      category: 'Database Migration', moduleType: 'Server', release: 'v1.0.0', startDate: '2026-02-16', actCompletionDate: '2026-03-04', actDays: 4,
      guiScreens: ['Database Schema'], notes: 'Automated CI/CD schema validation and dry-run migrations.',
      subtasks: []
    },
    {
      id: 'TASK-007', name: 'CloudHSM Hardware Cryptographic Integration', status: 'Completed', priority: 'High',
      assignee: 'David Kim', dueDate: '2026-03-12', progress: 100, module: 'Infrastructure', dependsOn: ['TASK-002'], estDays: 5,
      category: 'Security', moduleType: 'Server', release: 'v1.0.0', startDate: '2026-03-01', actCompletionDate: '2026-03-11', actDays: 5.5,
      guiScreens: ['Authentication'], notes: 'FIPS 140-2 Level 3 compliant encryption of customer PII.',
      subtasks: []
    },
    {
      id: 'TASK-008', name: 'Mobile Client Dark Theme & WCAG Contrast Audit', status: 'Completed', priority: 'Medium',
      assignee: 'Elena Vance', dueDate: '2026-03-18', progress: 100, module: 'User Interface', dependsOn: ['TASK-003'], estDays: 4,
      category: 'Design', moduleType: 'GUI', release: 'v1.0.0', startDate: '2026-03-10', actCompletionDate: '2026-03-17', actDays: 3.75,
      guiScreens: ['App Shell', 'Sidebar Navigation'], notes: 'Achieved 100% WCAG 2.2 AA token compliance.',
      subtasks: []
    },
    {
      id: 'TASK-009', name: 'Portfolio Valuations Engine & Calculation Kernel', status: 'In Progress', priority: 'Critical',
      assignee: 'Sarah Chen', dueDate: '2026-11-28', progress: 75, module: 'Portfolio Management (PM)', dependsOn: ['TASK-005'], estDays: 14,
      category: 'Feature', moduleType: 'Server', release: 'v1.1.0', startDate: '2026-10-15', actCompletionDate: '', actDays: 10,
      guiScreens: ['Portfolio Valuations'], notes: 'Real-time mark-to-market calculations and margin checks.',
      subtasks: [
        { id: 'SUB-016', name: 'Mark-to-Market Valuation Kernel', status: 'Completed', done: true, effort: 4, progress: 100, type: 'step' },
        { id: 'SUB-017', name: 'Portfolio Unrealized P&L Calculator', status: 'In Progress', done: false, effort: 5, progress: 75, type: 'step' },
        { id: 'SUB-018', name: 'Asset Allocation Breakdown Aggregator', status: 'Not Started', done: false, effort: 5, progress: 20, type: 'step' }
      ]
    },
    {
      id: 'TASK-010', name: 'Real-Time WebSocket Market Data Feed Pipeline', status: 'In Progress', priority: 'High',
      assignee: 'Naomi Nagata', dueDate: '2026-11-25', progress: 65, module: 'Market Data', dependsOn: ['TASK-001'], estDays: 12,
      category: 'Feature', moduleType: 'Server', release: 'v1.1.0', startDate: '2026-10-20', actCompletionDate: '', actDays: 8,
      guiScreens: ['Market Data Feed'], notes: 'High-throughput NASDAQ/LSE multicast ticker ingest.',
      subtasks: [
        { id: 'SUB-019', name: 'WebSocket Server with Epoll / io_uring', status: 'Completed', done: true, effort: 4, progress: 100, type: 'step' },
        { id: 'SUB-020', name: 'Binary Protocol Buffers Serialization', status: 'In Progress', done: false, effort: 4, progress: 60, type: 'step' },
        { id: 'SUB-021', name: 'Throttling & Backpressure Ring Buffer', status: 'Not Started', done: false, effort: 4, progress: 0, type: 'step' }
      ]
    },
    {
      id: 'TASK-011', name: 'Executive Overview Dashboard & EVM Analytics', status: 'In Progress', priority: 'High',
      assignee: 'Marcus Wong', dueDate: '2026-11-20', progress: 85, module: 'User Interface', dependsOn: ['TASK-003'], estDays: 7,
      category: 'GUI Screen', moduleType: 'GUI', release: 'v1.1.0', startDate: '2026-11-01', actCompletionDate: '', actDays: 6,
      guiScreens: ['Analytics Dashboard', 'Portfolio Valuations'], notes: 'Interactive charts for velocity, burndown, and EVM budget.',
      subtasks: [
        { id: 'SUB-022', name: 'Recharts S-Curve Visualizations', status: 'Completed', done: true, effort: 2.5, progress: 100, type: 'screen' },
        { id: 'SUB-023', name: 'Monte Carlo Delivery Confidence Gauges', status: 'In Progress', done: false, effort: 2.5, progress: 80, type: 'screen' },
        { id: 'SUB-024', name: 'Export Executive PDF & PNG Snapshot', status: 'Not Started', done: false, effort: 2, progress: 0, type: 'step' }
      ]
    },
    {
      id: 'TASK-012', name: 'SWIFT Clearing Gateway & ISO 20022 Compliance', status: 'In Progress', priority: 'Critical',
      assignee: 'Amos Burton', dueDate: '2026-12-05', progress: 50, module: 'Payment Module', dependsOn: ['TASK-005'], estDays: 15,
      category: 'Server Module', moduleType: 'Server', release: 'v1.1.0', startDate: '2026-10-25', actCompletionDate: '', actDays: 7.5,
      guiScreens: ['Cash Accounts'], notes: 'pacs.008 customer credit transfers and pacs.002 status reports.',
      subtasks: [
        { id: 'SUB-025', name: 'XML ISO 20022 Parser and Schema Validator', status: 'Completed', done: true, effort: 5, progress: 100, type: 'step' },
        { id: 'SUB-026', name: 'SWIFT Alliance Gateway Connector MT103', status: 'In Progress', done: false, effort: 6, progress: 40, type: 'step' },
        { id: 'SUB-027', name: 'Sanction Screening PEP & OFAC Check Hook', status: 'Not Started', done: false, effort: 4, progress: 0, type: 'step' }
      ]
    },
    {
      id: 'TASK-013', name: 'Security & Penetration Testing Remediation', status: 'In Progress', priority: 'High',
      assignee: 'David Kim', dueDate: '2026-11-22', progress: 60, module: 'Shared Services', dependsOn: ['TASK-002', 'TASK-007'], estDays: 8,
      category: 'Testing', moduleType: 'Server', release: 'v1.1.0', startDate: '2026-11-05', actCompletionDate: '', actDays: 4.8,
      guiScreens: ['Authentication'], notes: 'Addressing findings from external CREST audit.',
      subtasks: []
    },
    {
      id: 'TASK-014', name: 'Automated Chaos Monkey & Failover Simulation', status: 'Under Review', priority: 'Medium',
      assignee: 'James Holden', dueDate: '2026-11-18', progress: 95, module: 'Infrastructure', dependsOn: ['TASK-004'], estDays: 6,
      category: 'DevOps', moduleType: 'Server', release: 'v1.1.0', startDate: '2026-11-02', actCompletionDate: '', actDays: 5.75,
      guiScreens: ['Database Schema'], notes: 'Simulated AZ loss during peak transaction volume with zero loss.',
      subtasks: []
    },
    {
      id: 'TASK-015', name: 'Distributed Tracing with OpenTelemetry & Jaeger', status: 'Completed', priority: 'Medium',
      assignee: 'Sarah Chen', dueDate: '2026-11-10', progress: 100, module: 'Core Engine', dependsOn: ['TASK-001'], estDays: 6,
      category: 'Improvement', moduleType: 'Server', release: 'v1.1.0', startDate: '2026-10-28', actCompletionDate: '2026-11-09', actDays: 5.5,
      guiScreens: ['Core Services'], notes: 'W3C trace context propagation across all gRPC services.',
      subtasks: []
    },
    {
      id: 'TASK-016', name: 'Cash Accounts GUI Screen & Transfer Modal', status: 'In Progress', priority: 'High',
      assignee: 'Marcus Wong', dueDate: '2026-11-26', progress: 70, module: 'User Interface', dependsOn: ['TASK-005'], estDays: 6,
      category: 'GUI Screen', moduleType: 'GUI', release: 'v1.1.0', startDate: '2026-11-08', actCompletionDate: '', actDays: 4.2,
      guiScreens: ['Cash Accounts'], notes: 'Interactive multi-currency transaction history and one-click transfer.',
      subtasks: [
        { id: 'SUB-028', name: 'Cash Account Statement Grid', status: 'Completed', done: true, effort: 3, progress: 100, type: 'screen' },
        { id: 'SUB-029', name: 'Transfer Wire Initiation Modal Form', status: 'In Progress', done: false, effort: 3, progress: 40, type: 'screen' }
      ]
    },
    {
      id: 'TASK-017', name: 'Security Accounts GUI & Holdings Table', status: 'In Progress', priority: 'Medium',
      assignee: 'Elena Vance', dueDate: '2026-11-30', progress: 45, module: 'User Interface', dependsOn: ['TASK-009'], estDays: 7,
      category: 'GUI Screen', moduleType: 'GUI', release: 'v1.1.0', startDate: '2026-11-10', actCompletionDate: '', actDays: 3,
      guiScreens: ['Security Accounts'], notes: 'Securities inventory with live bid/ask quotes and yield calculations.',
      subtasks: []
    },
    {
      id: 'TASK-018', name: 'End-to-End Automated Regression Playwright Suite', status: 'In Progress', priority: 'High',
      assignee: 'Bobby Draper', dueDate: '2026-11-29', progress: 70, module: 'Shared Services', dependsOn: ['TASK-003', 'TASK-016'], estDays: 10,
      category: 'Testing', moduleType: 'Interface', release: 'v1.1.0', startDate: '2026-11-05', actCompletionDate: '', actDays: 7,
      guiScreens: ['Cash Accounts', 'App Shell'], notes: 'Over 140 cross-browser test scenarios executing in CI.',
      subtasks: []
    },
    {
      id: 'TASK-019', name: 'High-Frequency Order Book Matching Engine', status: 'On Hold', priority: 'Critical',
      assignee: 'Naomi Nagata', dueDate: '2027-01-15', progress: 25, module: 'Core Engine', dependsOn: ['TASK-009', 'TASK-010'], estDays: 20,
      category: 'Research', moduleType: 'Server', release: 'v2.0.0-Beta', startDate: '2026-11-01', actCompletionDate: '', actDays: 5,
      guiScreens: ['Core Services'], notes: 'Lock-free L3 order book design awaiting FPGA co-processor specs.',
      subtasks: []
    },
    {
      id: 'TASK-020', name: 'Kafka Event Sourcing Immutable Audit Pipeline', status: 'Not Started', priority: 'High',
      assignee: 'Amos Burton', dueDate: '2027-01-20', progress: 0, module: 'Shared Services', dependsOn: ['TASK-012'], estDays: 10,
      category: 'Feature', moduleType: 'Server', release: 'v2.0.0-Beta', startDate: '2026-12-10', actCompletionDate: '', actDays: 0,
      guiScreens: ['Audit Inspection'], notes: 'Compacted topics with tiered S3 cold archive.',
      subtasks: []
    },
    {
      id: 'TASK-021', name: 'Multi-Currency Settlement FX Conversion Matrix', status: 'Not Started', priority: 'High',
      assignee: 'David Kim', dueDate: '2027-01-25', progress: 0, module: 'Payment Module', dependsOn: ['TASK-012'], estDays: 12,
      category: 'Feature', moduleType: 'Server', release: 'v2.0.0-Beta', startDate: '2026-12-15', actCompletionDate: '', actDays: 0,
      guiScreens: ['Cash Accounts'], notes: 'Automated real-time FX spread calculation and hedging triggers.',
      subtasks: []
    },
    {
      id: 'TASK-022', name: 'Customer Support Portal & Audit Inspection GUI', status: 'Not Started', priority: 'Medium',
      assignee: 'Marcus Wong', dueDate: '2027-02-05', progress: 0, module: 'User Interface', dependsOn: ['TASK-003'], estDays: 9,
      category: 'GUI Screen', moduleType: 'GUI', release: 'v2.0.0-Beta', startDate: '2027-01-05', actCompletionDate: '', actDays: 0,
      guiScreens: ['Audit Inspection'], notes: 'Role-gated internal UI for compliance officers.',
      subtasks: []
    },
    {
      id: 'TASK-023', name: 'Real-Time Push Notification Engine (APNS & FCM)', status: 'Not Started', priority: 'Medium',
      assignee: 'Amos Burton', dueDate: '2027-02-12', progress: 0, module: 'Shared Services', dependsOn: ['TASK-002'], estDays: 7,
      category: 'Feature', moduleType: 'Interface', release: 'v2.0.0-Beta', startDate: '2027-01-12', actCompletionDate: '', actDays: 0,
      guiScreens: ['App Shell'], notes: 'Sub-second mobile push delivery for transaction confirmations.',
      subtasks: []
    },
    {
      id: 'TASK-024', name: 'Micro-Frontend Module Federation & CDN Edge Caching', status: 'Not Started', priority: 'Low',
      assignee: 'Elena Vance', dueDate: '2027-02-20', progress: 0, module: 'User Interface', dependsOn: ['TASK-003'], estDays: 8,
      category: 'Performance', moduleType: 'GUI', release: 'v2.0.0-Beta', startDate: '2027-01-20', actCompletionDate: '', actDays: 0,
      guiScreens: ['App Shell'], notes: 'Decoupled build and deploy pipeline per business domain.',
      subtasks: []
    }
  ];

  tasksData.forEach(t => {
    ts.addRow({
      id: t.id,
      name: t.name,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee,
      dueDate: t.dueDate,
      progress: t.progress + '%',
      module: t.module,
      dependsOn: t.dependsOn.join(', '),
      estDays: t.estDays,
      category: t.category,
      moduleType: t.moduleType,
      release: t.release,
      startDate: t.startDate,
      actCompletionDate: t.actCompletionDate,
      actDays: t.actDays,
      guiScreens: t.guiScreens.join(', '),
      notes: t.notes,
      subtasks: JSON.stringify(t.subtasks)
    });
  });
  applyHeaderStyles(ts);

  // ==========================================
  // 3. DELIVERIES SHEET (ALM / PDN Workstation)
  // ==========================================
  const dels = wb.addWorksheet('Deliveries');
  dels.columns = [
    { header: 'Delivery ID', key: 'id', width: 14 },
    { header: 'ALM Defect ID', key: 'almId', width: 16 },
    { header: 'Description - ALM Description', key: 'name', width: 44 },
    { header: 'PDN Reference', key: 'pdn', width: 18 },
    { header: 'PDN Processing Date', key: 'pdnProcessingDate', width: 18 },
    { header: 'Components Delivered', key: 'componentsDelivered', width: 34 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Module', key: 'module', width: 22 },
    { header: 'Module Type', key: 'moduleType', width: 14 },
    { header: 'Release Version', key: 'releaseVersion', width: 16 },
    { header: 'Target Environment', key: 'environment', width: 16 },
    { header: 'ALM Status', key: 'almStatus', width: 16 },
    { header: 'Deployment Status', key: 'status', width: 20 },
    { header: 'Sign-off Status', key: 'signOffStatus', width: 16 },
    { header: 'Approver', key: 'approver', width: 20 },
    { header: 'Smoke Test Status', key: 'smokeTestStatus', width: 16 },
    { header: 'Reporter', key: 'reportedBy', width: 18 },
    { header: 'Developer / Fixed By', key: 'fixedBy', width: 20 },
    { header: 'Target Delivery Date', key: 'targetDeliveryDate', width: 18 },
    { header: 'Actual Delivery Date', key: 'actualDeliveryDate', width: 18 },
    { header: 'Lead Time (d)', key: 'leadTimeDays', width: 14 },
    { header: 'Delay Variance (d)', key: 'variance', width: 16 },
    { header: 'Linked Type', key: 'linkedType', width: 14 },
    { header: 'Linked ID / Scope', key: 'linkedId', width: 26 },
    { header: 'Linked Tasks', key: 'linkedTasks', width: 22 },
    { header: 'Linked Screens', key: 'linkedScreens', width: 22 },
    { header: 'Rollback Plan', key: 'rollbackPlan', width: 38 },
    { header: 'Notes', key: 'notes', width: 38 },
  ];

  const deliveriesData = [
    {
      id: 'DEL-001', almId: 'ALM-10492', name: 'Fix JWT RS256 token signature expiration boundary check',
      pdn: 'PDN-2026-Q1-088', pdnProcessingDate: '2026-02-04', componentsDelivered: 'lib-auth-token-v2.jar, envoy-filter.wasm',
      category: 'Security Patch', module: 'Authentication', moduleType: 'Server', releaseVersion: 'v1.0.0',
      environment: 'Production', almStatus: 'Closed', status: 'Deployed', signOffStatus: 'Approved',
      approver: 'Sarah Chen', smokeTestStatus: 'Passed', reportedBy: 'David Kim', fixedBy: 'Naomi Nagata',
      targetDeliveryDate: '2026-02-04', actualDeliveryDate: '2026-02-04', leadTimeDays: 2, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-002', linkedTasks: ['TASK-002'], linkedScreens: ['Authentication'],
      rollbackPlan: 'Blue/green switch back to lib-auth-token-v1.8.jar within 90s.', notes: 'Successfully deployed in canary cluster with 0 errors.'
    },
    {
      id: 'DEL-002', almId: 'ALM-10512', name: 'PostgreSQL bi-directional logical sync lag optimization',
      pdn: 'PDN-2026-Q1-094', pdnProcessingDate: '2026-02-14', componentsDelivered: 'patroni-ha.conf, bucardo-custom-worker',
      category: 'Maintenance', module: 'Infrastructure', moduleType: 'Server', releaseVersion: 'v1.0.0',
      environment: 'Production', almStatus: 'Closed', status: 'Deployed', signOffStatus: 'Approved',
      approver: 'Sarah Chen', smokeTestStatus: 'Passed', reportedBy: 'James Holden', fixedBy: 'James Holden',
      targetDeliveryDate: '2026-02-14', actualDeliveryDate: '2026-02-14', leadTimeDays: 4, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-004', linkedTasks: ['TASK-004'], linkedScreens: ['Database Schema'],
      rollbackPlan: 'Revert Patroni max_wal_senders config and restart replica daemon.', notes: 'Replication lag dropped from 450ms to 28ms.'
    },
    {
      id: 'DEL-003', almId: 'ALM-10534', name: 'Cash Accounts ledger balance locking race condition patch',
      pdn: 'PDN-2026-Q1-102', pdnProcessingDate: '2026-02-27', componentsDelivered: 'ledger-core-v1.1.dll, sp_balance_lock.sql',
      category: 'Hotfix', module: 'Account Management (AM)', moduleType: 'Server', releaseVersion: 'v1.0.0',
      environment: 'Production', almStatus: 'Closed', status: 'Deployed', signOffStatus: 'Approved',
      approver: 'Alex Rivera', smokeTestStatus: 'Passed', reportedBy: 'Bobby Draper', fixedBy: 'Amos Burton',
      targetDeliveryDate: '2026-02-27', actualDeliveryDate: '2026-02-27', leadTimeDays: 1, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-005', linkedTasks: ['TASK-005'], linkedScreens: ['Cash Accounts'],
      rollbackPlan: 'Execute sp_balance_lock_rollback.sql and restore previous hotfix DLL.', notes: 'Isolated concurrency conflict resolved under 10k TPS load.'
    },
    {
      id: 'DEL-004', almId: 'ALM-10578', name: 'WebSocket ticker reconnect storm surge buffer limit',
      pdn: 'PDN-2026-Q2-012', pdnProcessingDate: '2026-11-12', componentsDelivered: 'market-streamer-go-v1.2.tar.gz',
      category: 'GSP++ Delivery', module: 'Market Data', moduleType: 'Server', releaseVersion: 'v1.1.0',
      environment: 'Staging', almStatus: 'Ready for Test', status: 'Ready for Deployment', signOffStatus: 'Approved',
      approver: 'Sarah Chen', smokeTestStatus: 'Passed', reportedBy: 'Marcus Wong', fixedBy: 'Naomi Nagata',
      targetDeliveryDate: '2026-11-15', actualDeliveryDate: '2026-11-12', leadTimeDays: 3, variance: -3,
      linkedType: 'Task', linkedId: 'TASK-010', linkedTasks: ['TASK-010'], linkedScreens: ['Market Data Feed'],
      rollbackPlan: 'Rolling container restart to image tag v1.1.4.', notes: 'Surge buffer tested against 50,000 synthetic reconnects.'
    },
    {
      id: 'DEL-005', almId: 'ALM-10601', name: 'OpenTelemetry Jaeger trace context injection in gRPC interceptor',
      pdn: 'PDN-2026-Q2-018', pdnProcessingDate: '2026-11-09', componentsDelivered: 'grpc-telemetry-middleware.go',
      category: 'Feature Release', module: 'Core Engine', moduleType: 'Server', releaseVersion: 'v1.1.0',
      environment: 'Staging', almStatus: 'Closed', status: 'Deployed', signOffStatus: 'Approved',
      approver: 'Alex Rivera', smokeTestStatus: 'Passed', reportedBy: 'Sarah Chen', fixedBy: 'Sarah Chen',
      targetDeliveryDate: '2026-11-10', actualDeliveryDate: '2026-11-09', leadTimeDays: 2, variance: -1,
      linkedType: 'Task', linkedId: 'TASK-015', linkedTasks: ['TASK-015'], linkedScreens: ['Core Services'],
      rollbackPlan: 'Disable OTLP exporter flag in daemon environment variable.', notes: '100% trace capture verified across staging mesh.'
    },
    {
      id: 'DEL-006', almId: 'ALM-10625', name: 'Executive Overview EVM charts rendering NaN on zero-baseline projects',
      pdn: 'PDN-2026-Q2-024', pdnProcessingDate: '2026-11-14', componentsDelivered: 'web-bundle-overview.chunk.js',
      category: 'Regression/NRT Defect', module: 'User Interface', moduleType: 'GUI', releaseVersion: 'v1.1.0',
      environment: 'QA', almStatus: 'Fixed', status: 'In Progress', signOffStatus: 'Pending',
      approver: 'Alex Rivera', smokeTestStatus: 'Running', reportedBy: 'Bobby Draper', fixedBy: 'Marcus Wong',
      targetDeliveryDate: '2026-11-16', actualDeliveryDate: null, leadTimeDays: 2, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-011', linkedTasks: ['TASK-011'], linkedScreens: ['Analytics Dashboard'],
      rollbackPlan: 'Git revert commit b812fa and re-trigger webpack pipeline.', notes: 'Added zero-division fallback guard in calculateEVM().'
    },
    {
      id: 'DEL-007', almId: 'ALM-10644', name: 'SWIFT pacs.008 XML namespace serialization schema conformance',
      pdn: 'PDN-2026-Q2-031', pdnProcessingDate: '2026-11-15', componentsDelivered: 'swift-iso20022-module.jar',
      category: 'GSP++ Delivery', module: 'Payment Module', moduleType: 'Server', releaseVersion: 'v1.1.0',
      environment: 'UAT', almStatus: 'In Progress', status: 'In Progress', signOffStatus: 'Pending',
      approver: 'David Kim', smokeTestStatus: 'Running', reportedBy: 'Amos Burton', fixedBy: 'Amos Burton',
      targetDeliveryDate: '2026-11-20', actualDeliveryDate: null, leadTimeDays: 5, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-012', linkedTasks: ['TASK-012'], linkedScreens: ['Cash Accounts'],
      rollbackPlan: 'Restore backup JAR from Nexus repository v1.0.8.', notes: 'Undergoing SWIFT Alliance simulator test suite.'
    },
    {
      id: 'DEL-008', almId: 'ALM-10680', name: 'Cash Accounts GUI wire transfer confirmation modal keyboard trap',
      pdn: 'PDN-2026-Q2-038', pdnProcessingDate: '', componentsDelivered: 'react-components-transfer.js',
      category: 'Regression/NRT Defect', module: 'User Interface', moduleType: 'GUI', releaseVersion: 'v1.1.0',
      environment: 'Dev', almStatus: 'Open', status: 'Scheduled', signOffStatus: 'Pending',
      approver: 'Alex Rivera', smokeTestStatus: 'Not Run', reportedBy: 'Elena Vance', fixedBy: 'Marcus Wong',
      targetDeliveryDate: '2026-11-22', actualDeliveryDate: null, leadTimeDays: 0, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-016', linkedTasks: ['TASK-016'], linkedScreens: ['Cash Accounts'],
      rollbackPlan: 'Revert focus trap hook in dialog primitive.', notes: 'Scheduled for Sprint 24 QA cycle.'
    },
    {
      id: 'DEL-009', almId: 'ALM-10705', name: 'Portfolio mark-to-market bond accrued interest precision truncation',
      pdn: 'PDN-2026-Q2-045', pdnProcessingDate: '', componentsDelivered: 'calc-kernel-cpp-v2.so',
      category: 'Hotfix', module: 'Portfolio Management (PM)', moduleType: 'Server', releaseVersion: 'v1.1.0',
      environment: 'QA', almStatus: 'In Progress', status: 'Scheduled', signOffStatus: 'Pending',
      approver: 'Sarah Chen', smokeTestStatus: 'Not Run', reportedBy: 'Chrisjen A.', fixedBy: 'Sarah Chen',
      targetDeliveryDate: '2026-11-25', actualDeliveryDate: null, leadTimeDays: 0, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-009', linkedTasks: ['TASK-009'], linkedScreens: ['Portfolio Valuations'],
      rollbackPlan: 'Recompile kernel with standard double precision fallback.', notes: 'Upgrading internal accumulator to 128-bit decimal floating point.'
    },
    {
      id: 'DEL-010', almId: 'ALM-10722', name: 'Automated Playwright test execution pipeline on ephemeral GitHub runners',
      pdn: 'PDN-2026-Q2-050', pdnProcessingDate: '2026-11-06', componentsDelivered: 'ci-workflow-e2e.yaml',
      category: 'Maintenance', module: 'Shared Services', moduleType: 'Interface', releaseVersion: 'v1.1.0',
      environment: 'Dev', almStatus: 'Closed', status: 'Deployed', signOffStatus: 'Approved',
      approver: 'Alex Rivera', smokeTestStatus: 'Passed', reportedBy: 'Bobby Draper', fixedBy: 'Bobby Draper',
      targetDeliveryDate: '2026-11-08', actualDeliveryDate: '2026-11-06', leadTimeDays: 3, variance: -2,
      linkedType: 'Task', linkedId: 'TASK-018', linkedTasks: ['TASK-018'], linkedScreens: ['App Shell'],
      rollbackPlan: 'Re-enable static runner matrix.', notes: 'E2E runtime reduced from 42 mins to 14 mins.'
    },
    {
      id: 'DEL-011', almId: 'ALM-10750', name: 'Kafka event compaction schema registry compatibility validator',
      pdn: 'PDN-2026-Q2-062', pdnProcessingDate: '', componentsDelivered: 'schema-registry-plugin.jar',
      category: 'Feature Release', module: 'Shared Services', moduleType: 'Server', releaseVersion: 'v2.0.0-Beta',
      environment: 'Dev', almStatus: 'New', status: 'Scheduled', signOffStatus: 'Not Required',
      approver: 'Sarah Chen', smokeTestStatus: 'Not Run', reportedBy: 'Amos Burton', fixedBy: 'Amos Burton',
      targetDeliveryDate: '2026-12-28', actualDeliveryDate: null, leadTimeDays: 0, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-020', linkedTasks: ['TASK-020'], linkedScreens: ['Audit Inspection'],
      rollbackPlan: 'Disable schema enforcement filter.', notes: 'Requires Confluent Schema Registry v7.4.'
    },
    {
      id: 'DEL-012', almId: 'ALM-10788', name: 'CloudHSM automated annual certificate and key rotation daemon',
      pdn: 'PDN-2026-Q2-070', pdnProcessingDate: '2026-03-12', componentsDelivered: 'hsm-key-rotator.sh, systemd-unit',
      category: 'Security Patch', module: 'Infrastructure', moduleType: 'Server', releaseVersion: 'v1.0.0',
      environment: 'Production', almStatus: 'Closed', status: 'Deployed', signOffStatus: 'Approved',
      approver: 'David Kim', smokeTestStatus: 'Passed', reportedBy: 'David Kim', fixedBy: 'James Holden',
      targetDeliveryDate: '2026-03-12', actualDeliveryDate: '2026-03-12', leadTimeDays: 2, variance: 0,
      linkedType: 'Task', linkedId: 'TASK-007', linkedTasks: ['TASK-007'], linkedScreens: ['Authentication'],
      rollbackPlan: 'Manual HSM pin entry fallback script.', notes: 'Successfully passed PCI-DSS 4.0 requirement 3.6.'
    }
  ];

  deliveriesData.forEach(d => {
    dels.addRow({
      id: d.id,
      almId: d.almId,
      name: d.name,
      pdn: d.pdn,
      pdnProcessingDate: d.pdnProcessingDate,
      componentsDelivered: d.componentsDelivered,
      category: d.category,
      module: d.module,
      moduleType: d.moduleType,
      releaseVersion: d.releaseVersion,
      environment: d.environment,
      almStatus: d.almStatus,
      status: d.status,
      signOffStatus: d.signOffStatus,
      approver: d.approver,
      smokeTestStatus: d.smokeTestStatus,
      reportedBy: d.reportedBy,
      fixedBy: d.fixedBy,
      targetDeliveryDate: d.targetDeliveryDate,
      actualDeliveryDate: d.actualDeliveryDate,
      leadTimeDays: d.leadTimeDays,
      variance: d.variance,
      linkedType: d.linkedType,
      linkedId: d.linkedId,
      linkedTasks: d.linkedTasks.join(', '),
      linkedScreens: d.linkedScreens.join(', '),
      rollbackPlan: d.rollbackPlan,
      notes: d.notes
    });
  });
  applyHeaderStyles(dels);

  // ==========================================
  // 4. RAID ITEMS SHEET
  // ==========================================
  const rs = wb.addWorksheet('RAID Items');
  rs.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Title', key: 'title', width: 38 },
    { header: 'Description', key: 'desc', width: 48 },
    { header: 'Impact', key: 'impact', width: 12 },
    { header: 'Probability', key: 'probability', width: 14 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Owner', key: 'owner', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Mitigation Plan', key: 'mitigation', width: 48 },
  ];

  const raidData = [
    {
      id: 'RAID-001', type: 'Risk', title: 'NASDAQ Multicast ticker ingestion rate limit throttle',
      desc: 'During market open volatility surges, incoming ticker UDP bursts may saturate ingress gateway socket buffers.',
      impact: 'Critical', probability: 'High', severity: 'Critical', owner: 'Naomi Nagata', dueDate: '2026-11-25', status: 'Active',
      mitigation: 'Implement kernel-level AF_XDP zero-copy packet processing and adaptive ring-buffer overflow backpressure.'
    },
    {
      id: 'RAID-002', type: 'Risk', title: 'SOC-2 Type II cryptographic key rotation window expiry',
      desc: 'AWS CloudHSM automated key rotation certificate must renew before annual compliance audit lock.',
      impact: 'High', probability: 'Low', severity: 'Medium', owner: 'David Kim', dueDate: '2026-12-15', status: 'Active',
      mitigation: 'Deploy systemd cron job with automated dual-key rollover and alerting 30 days prior to expiry.'
    },
    {
      id: 'RAID-003', type: 'Issue', title: 'Inter-regional latency variance between US and EU replication nodes',
      desc: 'Transatlantic fiber jitter periodically spikes cross-region PostgreSQL synchronous quorum commit latency past 120ms.',
      impact: 'High', probability: 'High', severity: 'High', owner: 'James Holden', dueDate: '2026-11-20', status: 'In Progress',
      mitigation: 'Transition cross-region commit mode to asynchronous with conflict-free replicated data types (CRDTs).'
    },
    {
      id: 'RAID-004', type: 'Assumption', title: 'SWIFT Alliance Gateway supports ISO 20022 XML Schema 2026',
      desc: 'Assumes SWIFT Network testing environment operates on MT/MX coexistence guidelines through end of Q2.',
      impact: 'High', probability: 'Medium', severity: 'Medium', owner: 'Amos Burton', dueDate: '2026-12-01', status: 'Active',
      mitigation: 'Validate payload specs against SWIFT MyStandards Readiness Portal sandbox weekly.'
    },
    {
      id: 'RAID-005', type: 'Dependency', title: 'External CREST certified penetration test report sign-off',
      desc: 'Tier-1 production rollout gates strictly on zero unresolved S1/S2 penetration testing vulnerabilities.',
      impact: 'Critical', probability: 'High', severity: 'Critical', owner: 'David Kim', dueDate: '2026-11-28', status: 'Active',
      mitigation: 'Hold daily triage with security auditors to patch and re-verify remediation builds inside 24 hours.'
    },
    {
      id: 'RAID-006', type: 'Risk', title: 'Database connection pool starvation during batch settlement cut',
      desc: 'End-of-day portfolio valuation batch job concurrently opens 800+ database connections.',
      impact: 'High', probability: 'Medium', severity: 'High', owner: 'Sarah Chen', dueDate: '2026-12-05', status: 'Active',
      mitigation: 'Enforce PgBouncer connection multiplexing with max pool size 250 and statement timeouts.'
    },
    {
      id: 'RAID-007', type: 'Assumption', title: 'Client browser hardware support for WebAssembly acceleration',
      desc: 'Desktop analytics charting assumes client browser supports SIMD 128-bit WebAssembly instructions.',
      impact: 'Medium', probability: 'Low', severity: 'Low', owner: 'Marcus Wong', dueDate: '2026-11-30', status: 'Active',
      mitigation: 'Include pure TypeScript math calculation fallback path when SIMD feature detection fails.'
    },
    {
      id: 'RAID-008', type: 'Issue', title: 'Flaky payment sandbox mock webhook HTTP timeouts',
      desc: 'Staging third-party payment partner sandbox intermittently drops webhook callbacks.',
      impact: 'Medium', probability: 'High', severity: 'Medium', owner: 'Bobby Draper', dueDate: '2026-11-18', status: 'In Progress',
      mitigation: 'Replace partner sandbox dependency with locally containerized WireMock mock server.'
    },
    {
      id: 'RAID-009', type: 'Dependency', title: 'Design token alignment between Web and Native iOS tokens',
      desc: 'Tokens export from Figma tokens studio must compile cleanly to both Tailwind CSS and Swift constants.',
      impact: 'Medium', probability: 'Medium', severity: 'Medium', owner: 'Elena Vance', dueDate: '2026-11-22', status: 'Active',
      mitigation: 'Implement Style Dictionary automated GitHub Action pipeline triggering on Figma webhook.'
    },
    {
      id: 'RAID-010', type: 'Risk', title: 'Browser memory leak on continuous 8-hour WebSocket streaming',
      desc: 'High-frequency quote updates retained in detached DOM nodes cause tab memory exhaustion.',
      impact: 'High', probability: 'Medium', severity: 'High', owner: 'Marcus Wong', dueDate: '2026-11-24', status: 'Active',
      mitigation: 'Enforce virtualized windowing on price ladder with strict object recycling pool.'
    }
  ];

  raidData.forEach(r => {
    rs.addRow({
      id: r.id,
      type: r.type,
      title: r.title,
      desc: r.desc,
      impact: r.impact,
      probability: r.probability,
      severity: r.severity,
      owner: r.owner,
      dueDate: r.dueDate,
      status: r.status,
      mitigation: r.mitigation
    });
  });
  applyHeaderStyles(rs);

  // ==========================================
  // 5. DEFECTS SHEET
  // ==========================================
  const dfs = wb.addWorksheet('Defects');
  dfs.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Title', key: 'title', width: 38 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Severity', key: 'severity', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Linked To', key: 'linkedType', width: 12 },
    { header: 'Linked ID', key: 'linkedId', width: 14 },
    { header: 'Assignee', key: 'assignee', width: 20 },
    { header: 'Reporter', key: 'reporter', width: 20 },
    { header: 'Description', key: 'desc', width: 44 },
    { header: 'Reproduction Steps', key: 'steps', width: 44 },
  ];

  const defectsData = [
    {
      id: 'DEF-001', title: 'Token expiration boundary creates 401 loop on concurrent requests',
      type: 'Security', severity: 'S1 - Blocker', priority: 'Critical', status: 'Fixed',
      linkedType: 'Task', linkedId: 'TASK-002', assignee: 'Naomi Nagata', reporter: 'David Kim',
      desc: 'When token expires while 3 API calls are in flight, multiple refresh attempts invalidate the rotation token.',
      steps: '1. Set token expiry to 10s. 2. Fire 3 concurrent API requests. 3. Observe 401 loop.'
    },
    {
      id: 'DEF-002', title: 'Cash account ledger balance lock deadlock under heavy contention',
      type: 'Functional Bug', severity: 'S1 - Blocker', priority: 'Critical', status: 'Closed',
      linkedType: 'Task', linkedId: 'TASK-005', assignee: 'Amos Burton', reporter: 'Bobby Draper',
      desc: 'Simultaneous mutual transfers between Account A and Account B resulted in PostgreSQL lock deadlock.',
      steps: '1. Create transfer A -> B. 2. Concurrently execute transfer B -> A. 3. Query pg_stat_activity.'
    },
    {
      id: 'DEF-003', title: 'Executive Overview EVM charts rendering NaN when baselines empty',
      type: 'UI/UX Issue', severity: 'S2 - High', priority: 'High', status: 'Assigned',
      linkedType: 'Task', linkedId: 'TASK-011', assignee: 'Marcus Wong', reporter: 'Bobby Draper',
      desc: 'Opening dashboard on a brand new project produces NaN% velocity indicators.',
      steps: '1. Create blank project. 2. Navigate to Dashboard. 3. Note NaN in EVM badge.'
    },
    {
      id: 'DEF-004', title: 'SWIFT pacs.008 XML namespace prefix rejected by validation engine',
      type: 'Functional Bug', severity: 'S2 - High', priority: 'High', status: 'Assigned',
      linkedType: 'Task', linkedId: 'TASK-012', assignee: 'Amos Burton', reporter: 'Sarah Chen',
      desc: 'Namespace prefix ns2:Document is rejected; validator expects default un-prefixed xmlns.',
      steps: '1. Generate pacs.008 sample. 2. Run xmllint against XSD schema. 3. Observe validation failure.'
    },
    {
      id: 'DEF-005', title: 'WebSocket ticker subscriber queue memory leak on tab hidden state',
      type: 'Performance', severity: 'S2 - High', priority: 'High', status: 'Assigned',
      linkedType: 'Task', linkedId: 'TASK-010', assignee: 'Naomi Nagata', reporter: 'Marcus Wong',
      desc: 'When user switches browser tabs, requestAnimationFrame halts and quote queue grows indefinitely.',
      steps: '1. Connect to market stream. 2. Background tab for 30 mins. 3. Inspect Chrome DevTools Heap.'
    },
    {
      id: 'DEF-006', title: 'Cash Accounts transfer confirmation modal keyboard trap issue',
      type: 'UI/UX Issue', severity: 'S3 - Medium', priority: 'Medium', status: 'New',
      linkedType: 'Task', linkedId: 'TASK-016', assignee: 'Marcus Wong', reporter: 'Elena Vance',
      desc: 'Pressing Tab inside confirmation dialog does not cycle within modal boundaries.',
      steps: '1. Open Transfer Modal. 2. Tab past Cancel button. 3. Focus lands on background page elements.'
    },
    {
      id: 'DEF-007', title: 'Bond accrued interest decimal precision truncated past 4 decimal places',
      type: 'Data Issue', severity: 'S2 - High', priority: 'High', status: 'New',
      linkedType: 'Task', linkedId: 'TASK-009', assignee: 'Sarah Chen', reporter: 'Chrisjen A.',
      desc: 'Fixed income bond portfolio valuations deviate by $0.004 per lot due to float32 cast.',
      steps: '1. Book US Treasury 10Y note. 2. Query accrued interest endpoint. 3. Compare with Bloomberg terminal.'
    },
    {
      id: 'DEF-008', title: 'Patroni split-brain recovery alert message contains malformed timestamp',
      type: 'Functional Bug', severity: 'S3 - Medium', priority: 'Low', status: 'Fixed',
      linkedType: 'Task', linkedId: 'TASK-004', assignee: 'James Holden', reporter: 'James Holden',
      desc: 'Alert webhook payload timestamp formatted as epoch integer instead of ISO 8601 string.',
      steps: '1. Trigger Patroni leader election test. 2. Inspect Slack webhook payload.'
    },
    {
      id: 'DEF-009', title: 'Dark mode color contrast ratio on disabled form inputs below 3:1',
      type: 'UI/UX Issue', severity: 'S4 - Low', priority: 'Low', status: 'Fixed',
      linkedType: 'Task', linkedId: 'TASK-008', assignee: 'Elena Vance', reporter: 'Bobby Draper',
      desc: 'Disabled inputs in obsidian theme evaluated at 2.4:1 contrast ratio against background.',
      steps: '1. Switch to Obsidian theme. 2. Inspect disabled button in Chrome DevTools Lighthouse.'
    },
    {
      id: 'DEF-010', title: 'Playwright test runner fails intermittently on payment webhook mock',
      type: 'Functional Bug', severity: 'S3 - Medium', priority: 'Medium', status: 'Retest',
      linkedType: 'Task', linkedId: 'TASK-018', assignee: 'Bobby Draper', reporter: 'Bobby Draper',
      desc: 'Third-party sandbox network flakiness causes 1 in 10 CI runs to fail on payment step.',
      steps: '1. Execute test:e2e 10 times in loop. 2. Observe timeout on test_payment_wire.'
    },
    {
      id: 'DEF-011', title: 'API Gateway CORS pre-flight header missing Access-Control-Max-Age',
      type: 'Performance', severity: 'S3 - Medium', priority: 'Medium', status: 'Closed',
      linkedType: 'Task', linkedId: 'TASK-001', assignee: 'Sarah Chen', reporter: 'Marcus Wong',
      desc: 'Browser issues OPTIONS pre-flight on every single REST call rather than caching for 1 hour.',
      steps: '1. Inspect browser Network tab. 2. Observe OPTIONS request before every POST.'
    },
    {
      id: 'DEF-012', title: 'Database schema migration rollback script missing drop trigger statements',
      type: 'Functional Bug', severity: 'S2 - High', priority: 'High', status: 'Fixed',
      linkedType: 'Task', linkedId: 'TASK-006', assignee: 'James Holden', reporter: 'Sarah Chen',
      desc: 'Rolling back migration V1.4 leaves orphaned auditing triggers on public.transactions table.',
      steps: '1. Apply V1.4 migration. 2. Execute Flyway undo. 3. Check information_schema.triggers.'
    }
  ];

  defectsData.forEach(d => {
    dfs.addRow({
      id: d.id,
      title: d.title,
      type: d.type,
      severity: d.severity,
      priority: d.priority,
      status: d.status,
      linkedType: d.linkedType,
      linkedId: d.linkedId,
      assignee: d.assignee,
      reporter: d.reporter,
      desc: d.desc,
      steps: d.steps
    });
  });
  applyHeaderStyles(dfs);

  // ==========================================
  // 6. DECISIONS SHEET (ADRs)
  // ==========================================
  const decs = wb.addWorksheet('Decisions');
  decs.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Description', key: 'desc', width: 44 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Impact', key: 'impact', width: 14 },
    { header: 'Approver', key: 'approver', width: 20 },
    { header: 'Proposed By', key: 'proposedBy', width: 20 },
    { header: 'Rationale', key: 'rationale', width: 44 },
    { header: 'Due Date', key: 'dueDate', width: 14 },
  ];

  const decisionsData = [
    {
      id: 'ADR-001', title: 'Adoption of gRPC & Protocol Buffers for Inter-Service Telemetry',
      desc: 'Standardize all internal synchronous service-to-service communication on gRPC HTTP/2.',
      status: 'Approved', impact: 'Critical', approver: 'Sarah Chen', proposedBy: 'Sarah Chen',
      rationale: 'Sub-millisecond wire serialization, strict schema contracts, and bidirectional streaming.',
      dueDate: '2026-01-10'
    },
    {
      id: 'ADR-002', title: 'PostgreSQL Active-Active Multi-Region Replication Strategy',
      desc: 'Deploy Bucardo and Patroni across US-East and EU-Central with local read replicas.',
      status: 'Approved', impact: 'Critical', approver: 'Alex Rivera', proposedBy: 'James Holden',
      rationale: 'Ensures zero-data loss RPO=0 and <60s automated RTO failover compliance.',
      dueDate: '2026-01-25'
    },
    {
      id: 'ADR-003', title: 'Zero-Trust Mutual TLS (mTLS) Mesh with Istio Service Mesh',
      desc: 'Mandate mTLS encryption and SPIFFE/SPIRE cryptographic workload identities.',
      status: 'Approved', impact: 'High', approver: 'David Kim', proposedBy: 'David Kim',
      rationale: 'Prevents lateral movement in event of container breakout; satisfies PCI-DSS 4.0.',
      dueDate: '2026-02-01'
    },
    {
      id: 'ADR-004', title: 'Event Sourcing & CQRS Pattern for Ledger Auditability',
      desc: 'Decouple transaction write-side commands from read-side analytical queries via Kafka.',
      status: 'Approved', impact: 'Critical', approver: 'Alex Rivera', proposedBy: 'Amos Burton',
      rationale: 'Guarantees complete immutable financial audit trail without mutating existing rows.',
      dueDate: '2026-02-15'
    },
    {
      id: 'ADR-005', title: 'Strict WCAG 2.2 AA Accessibility Compliance Baseline',
      desc: 'Enforce accessible markup, focus indicators, and 4.5:1 text contrast across all UI.',
      status: 'Approved', impact: 'Medium', approver: 'Alex Rivera', proposedBy: 'Elena Vance',
      rationale: 'Legal compliance for European Accessibility Act (EAA) and universal usability.',
      dueDate: '2026-03-01'
    },
    {
      id: 'ADR-006', title: 'Distributed Tracing with OpenTelemetry and Jaeger Collector',
      desc: 'Inject W3C traceparent headers across API gateway and downstream workers.',
      status: 'Approved', impact: 'High', approver: 'Sarah Chen', proposedBy: 'Naomi Nagata',
      rationale: 'End-to-end distributed latency observability for SLA guarantee tracking.',
      dueDate: '2026-10-20'
    },
    {
      id: 'ADR-007', title: 'Redis Enterprise Clustering for Global Session & Ticker Cache',
      desc: 'Utilize Redis active-active geo-distributed clusters for authentication tokens.',
      status: 'Under Review', impact: 'High', approver: 'Sarah Chen', proposedBy: 'Naomi Nagata',
      rationale: 'Eliminates cross-continental auth latency on repeated client requests.',
      dueDate: '2026-11-30'
    },
    {
      id: 'ADR-008', title: 'Automated Canary Deployments with ArgoCD and Prometheus Rollouts',
      desc: 'Implement progressive traffic routing (5%, 25%, 50%, 100%) based on error rate analysis.',
      status: 'Approved', impact: 'High', approver: 'Alex Rivera', proposedBy: 'James Holden',
      rationale: 'Automated instant rollback if canary 5xx error rate exceeds 0.05%.',
      dueDate: '2026-11-15'
    }
  ];

  decisionsData.forEach(d => {
    decs.addRow({
      id: d.id,
      title: d.title,
      desc: d.desc,
      status: d.status,
      impact: d.impact,
      approver: d.approver,
      proposedBy: d.proposedBy,
      rationale: d.rationale,
      dueDate: d.dueDate
    });
  });
  applyHeaderStyles(decs);

  // ==========================================
  // 7. TEAM MEMBERS SHEET
  // ==========================================
  const tms = wb.addWorksheet('Team Members');
  tms.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Role', key: 'role', width: 25 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Reports To', key: 'reportsTo', width: 20 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Emp ID', key: 'empId', width: 15 },
    { header: 'Location', key: 'location', width: 22 },
    { header: 'Birthday', key: 'birthday', width: 14 },
    { header: 'Skills', key: 'skills', width: 38 },
    { header: 'Join Date', key: 'joinDate', width: 14 },
  ];

  const teamData = [
    {
      id: 'MEM-001', name: 'Alex Rivera', role: 'Engineering Manager', status: 'Active', reportsTo: '',
      email: 'alex.rivera@titanbank.io', phone: '+1-555-0100', empId: 'TITAN-1001', location: 'San Francisco, CA',
      birthday: '15 Nov', skills: 'System Architecture, Agile Leadership, Kubernetes, Strategic Planning', joinDate: '2023-01-15'
    },
    {
      id: 'MEM-002', name: 'Sarah Chen', role: 'Lead Architect', status: 'Active', reportsTo: 'Alex Rivera',
      email: 'sarah.chen@titanbank.io', phone: '+1-555-0101', empId: 'TITAN-1002', location: 'Seattle, WA',
      birthday: '22 Nov', skills: 'Go, Distributed Systems, PostgreSQL, GraphQL, gRPC', joinDate: '2023-03-01'
    },
    {
      id: 'MEM-003', name: 'Marcus Wong', role: 'Lead Frontend', status: 'Active', reportsTo: 'Alex Rivera',
      email: 'marcus.wong@titanbank.io', phone: '+1-555-0102', empId: 'TITAN-1003', location: 'Austin, TX',
      birthday: '10 Dec', skills: 'React 19, TypeScript, Tailwind CSS, Data Visualization, Performance', joinDate: '2023-04-12'
    },
    {
      id: 'MEM-004', name: 'Elena Vance', role: 'Lead Design', status: 'Active', reportsTo: 'Alex Rivera',
      email: 'elena.vance@titanbank.io', phone: '+1-555-0103', empId: 'TITAN-1004', location: 'New York, NY',
      birthday: '05 Dec', skills: 'Figma, Design Systems, Microinteractions, WCAG 2.2 AA, Spatial Design', joinDate: '2023-06-20'
    },
    {
      id: 'MEM-005', name: 'James Holden', role: 'DevOps Lead', status: 'Active', reportsTo: 'Sarah Chen',
      email: 'james.holden@titanbank.io', phone: '+1-555-0104', empId: 'TITAN-1005', location: 'Chicago, IL',
      birthday: '12 Nov', skills: 'Terraform, AWS, Docker, Kubernetes, CI/CD, Patroni', joinDate: '2023-08-10'
    },
    {
      id: 'MEM-006', name: 'Naomi Nagata', role: 'Staff Engineer', status: 'Active', reportsTo: 'Sarah Chen',
      email: 'naomi.nagata@titanbank.io', phone: '+1-555-0105', empId: 'TITAN-1006', location: 'Toronto, ON',
      birthday: '28 Nov', skills: 'Rust, Concurrency, Microservices, WebSockets, High-Throughput I/O', joinDate: '2023-09-01'
    },
    {
      id: 'MEM-007', name: 'Amos Burton', role: 'Senior Developer', status: 'Active', reportsTo: 'Naomi Nagata',
      email: 'amos.burton@titanbank.io', phone: '+1-555-0106', empId: 'TITAN-1007', location: 'Boston, MA',
      birthday: '15 Nov', skills: 'Node.js, PostgreSQL, Redis, Kafka, ISO 20022 SWIFT', joinDate: '2024-01-10'
    },
    {
      id: 'MEM-008', name: 'Bobby Draper', role: 'QA Lead', status: 'Active', reportsTo: 'Alex Rivera',
      email: 'bobby.draper@titanbank.io', phone: '+1-555-0107', empId: 'TITAN-1008', location: 'Denver, CO',
      birthday: '19 Dec', skills: 'Playwright, Chaos Engineering, Security Automation, Smoke Testing', joinDate: '2024-02-15'
    },
    {
      id: 'MEM-009', name: 'Chrisjen A.', role: 'Product Manager', status: 'Active', reportsTo: '',
      email: 'chrisjen.a@titanbank.io', phone: '+1-555-0108', empId: 'TITAN-1009', location: 'Washington, DC',
      birthday: '30 Nov', skills: 'Product Strategy, Regulatory Compliance, Roadmapping, Stakeholder Governance', joinDate: '2023-02-01'
    },
    {
      id: 'MEM-010', name: 'David Kim', role: 'Security Architect', status: 'Active', reportsTo: 'Sarah Chen',
      email: 'david.kim@titanbank.io', phone: '+1-555-0109', empId: 'TITAN-1010', location: 'London, UK',
      birthday: '18 Nov', skills: 'Zero-Trust, CloudHSM, FIPS 140-2, Penetration Testing, PCI-DSS', joinDate: '2023-05-15'
    }
  ];

  teamData.forEach(m => {
    tms.addRow({
      id: m.id,
      name: m.name,
      role: m.role,
      status: m.status,
      reportsTo: m.reportsTo,
      email: m.email,
      phone: m.phone,
      empId: m.empId,
      location: m.location,
      birthday: m.birthday,
      skills: m.skills,
      joinDate: m.joinDate
    });
  });
  applyHeaderStyles(tms);

  // ==========================================
  // 8. RELEASES SHEET
  // ==========================================
  const rels = wb.addWorksheet('Releases');
  rels.columns = [
    { header: 'Release ID', key: 'id', width: 14 },
    { header: 'Release Version', key: 'name', width: 22 },
    { header: 'Start Date', key: 'startDate', width: 16 },
    { header: 'Target Date', key: 'date', width: 16 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  const releasesData = [
    { id: 'rel-1', name: 'v1.0.0', startDate: '2026-01-02', date: '2026-03-20', status: 'Completed' },
    { id: 'rel-2', name: 'v1.1.0', startDate: '2026-03-25', date: '2026-11-30', status: 'In Progress' },
    { id: 'rel-3', name: 'v2.0.0-Beta', startDate: '2026-12-01', date: '2027-02-28', status: 'Planned' },
    { id: 'rel-4', name: 'v2.1.0', startDate: '2027-03-01', date: '2027-05-30', status: 'Planned' }
  ];

  releasesData.forEach(r => {
    rels.addRow({
      id: r.id,
      name: r.name,
      startDate: r.startDate,
      date: r.date,
      status: r.status
    });
  });
  applyHeaderStyles(rels);

  // ==========================================
  // 9. SPRINT RETROS SHEET
  // ==========================================
  const rts = wb.addWorksheet('Retros');
  rts.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Title', key: 'title', width: 38 },
    { header: 'Description', key: 'desc', width: 48 },
    { header: 'Author', key: 'author', width: 20 },
    { header: 'Assigned To', key: 'assignedTo', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Target Sprint', key: 'targetSprint', width: 16 },
    { header: 'Votes', key: 'votes', width: 10 },
    { header: 'Created Date', key: 'createdAt', width: 15 },
  ];

  const retroData = [
    {
      id: 'RETRO-01', category: 'went_well', title: 'Automated CI/CD cut deployment time by 45%',
      desc: 'The GitHub Actions pipeline optimization eliminated manual staging handoffs.',
      author: 'Sarah Chen', assignedTo: '', status: '', targetSprint: 'Sprint 23', votes: 9, createdAt: '2026-10-20'
    },
    {
      id: 'RETRO-02', category: 'went_well', title: 'Zero regressions on ALM Release v1.0.0 production cut',
      desc: 'Automated smoke test coverage caught 3 edge cases prior to staging promotion.',
      author: 'Bobby Draper', assignedTo: '', status: '', targetSprint: 'Sprint 23', votes: 12, createdAt: '2026-10-21'
    },
    {
      id: 'RETRO-03', category: 'went_well', title: 'Sub-millisecond latency on order book matching kernel',
      desc: 'Lock-free memory ring buffer achieved p99 latency of 840 microseconds.',
      author: 'Naomi Nagata', assignedTo: '', status: '', targetSprint: 'Sprint 23', votes: 14, createdAt: '2026-10-22'
    },
    {
      id: 'RETRO-04', category: 'needs_improvement', title: 'SWIFT XML Gateway specs changed mid-sprint',
      desc: 'Lack of frozen XSD schema delayed mock integration by 2 full days.',
      author: 'Amos Burton', assignedTo: '', status: '', targetSprint: 'Sprint 23', votes: 8, createdAt: '2026-10-22'
    },
    {
      id: 'RETRO-05', category: 'needs_improvement', title: 'Flaky E2E test in payment sandbox environment',
      desc: 'Intermittent third-party webhook timeout caused false negative builds.',
      author: 'Bobby Draper', assignedTo: '', status: '', targetSprint: 'Sprint 23', votes: 7, createdAt: '2026-10-23'
    },
    {
      id: 'RETRO-06', category: 'action_item', title: 'Introduce OpenAPI spec freeze 48h before sprint kick-off',
      desc: 'Architecture lead must sign off contract before frontend tasks are assigned.',
      author: 'David Kim', assignedTo: 'Sarah Chen', status: 'In Progress', targetSprint: 'Sprint 24', votes: 11, createdAt: '2026-10-24'
    },
    {
      id: 'RETRO-07', category: 'action_item', title: 'Implement synthetic test retries on local WireMock mock',
      desc: 'Add deterministic mock server to avoid external sandbox network flakiness.',
      author: 'Sarah Chen', assignedTo: 'Bobby Draper', status: 'Open', targetSprint: 'Sprint 24', votes: 8, createdAt: '2026-10-24'
    },
    {
      id: 'RETRO-08', category: 'kudos', title: 'Kudos to Naomi for squashing the S1 Blocker in record time!',
      desc: 'Stayed late to patch the authorization token edge-case before release cut.',
      author: 'Alex Rivera', assignedTo: '', status: '', targetSprint: 'Sprint 23', votes: 15, createdAt: '2026-10-25'
    }
  ];

  retroData.forEach(r => {
    rts.addRow({
      id: r.id,
      category: r.category,
      title: r.title,
      desc: r.desc,
      author: r.author,
      assignedTo: r.assignedTo,
      status: r.status,
      targetSprint: r.targetSprint,
      votes: r.votes,
      createdAt: r.createdAt
    });
  });
  applyHeaderStyles(rts);

  // ==========================================
  // 10. FEATURES SHEET (Functional Matrix)
  // ==========================================
  const fts = wb.addWorksheet('Features');
  fts.columns = [
    { header: 'Feature Name', key: 'name', width: 28 },
    { header: 'Screens', key: 'screens', width: 38 },
    { header: 'Description', key: 'desc', width: 48 },
  ];

  const featuresData = [
    { name: 'Core Infrastructure', screens: ['Database Schema', 'Core Services', 'API Gateway'], desc: 'Fundamental system services, network mesh, and storage architecture.' },
    { name: 'User Management & Security', screens: ['Authentication', 'User Profile', 'Role RBAC'], desc: 'Identity verification, MFA tokens, and role-based access control.' },
    { name: 'Cash & Account Ledger', screens: ['Cash Accounts', 'Transfer Modal', 'Ledger Audit'], desc: 'Double-entry balance tracking and ISO 20022 clearing.' },
    { name: 'Market Intelligence & Analytics', screens: ['Portfolio Valuations', 'Market Data Feed', 'Analytics Dashboard'], desc: 'Real-time order book feed and EVM velocity analytics.' }
  ];

  featuresData.forEach(f => {
    fts.addRow({
      name: f.name,
      screens: f.screens.join(', '),
      desc: f.desc
    });
  });
  applyHeaderStyles(fts);

  // ==========================================
  // 11. ACTIVITY LOGS SHEET
  // ==========================================
  const ls = wb.addWorksheet('Activity Logs');
  ls.columns = [
    { header: 'Timestamp', key: 'ts', width: 24 },
    { header: 'Action', key: 'action', width: 20 },
    { header: 'Assignee', key: 'assignee', width: 18 },
    { header: 'Task ID', key: 'taskId', width: 12 },
    { header: 'Task Name', key: 'taskName', width: 38 },
    { header: 'Module', key: 'module', width: 20 },
    { header: 'Modified Field', key: 'field', width: 16 },
    { header: 'Old Value', key: 'oldVal', width: 16 },
    { header: 'New Value', key: 'newVal', width: 16 },
    { header: 'Comment', key: 'comment', width: 42 },
  ];

  const logsData = [
    { ts: '2026-11-08T09:15:00.000Z', action: 'Task Progress Updated', assignee: 'Marcus Wong', taskId: 'TASK-011', taskName: 'Executive Overview Dashboard & EVM Analytics', module: 'User Interface', field: 'progress', oldVal: '70', newVal: '85', comment: 'Completed Monte Carlo simulation charts integration.' },
    { ts: '2026-11-08T08:30:00.000Z', action: 'Delivery Sign-off', assignee: 'Alex Rivera', taskId: 'DEL-005', taskName: 'OpenTelemetry Jaeger trace context injection', module: 'Core Engine', field: 'signOffStatus', oldVal: 'Pending', newVal: 'Approved', comment: 'Signed off for Staging promotion.' },
    { ts: '2026-11-07T16:45:00.000Z', action: 'Defect Resolved', assignee: 'Sarah Chen', taskId: 'DEF-011', taskName: 'API Gateway CORS pre-flight header missing Max-Age', module: 'API Gateway', field: 'status', oldVal: 'Assigned', newVal: 'Closed', comment: 'Max-Age set to 3600 seconds in Envoy filter.' },
    { ts: '2026-11-07T14:10:00.000Z', action: 'Task Completed', assignee: 'Sarah Chen', taskId: 'TASK-015', taskName: 'Distributed Tracing with OpenTelemetry & Jaeger', module: 'Core Engine', field: 'status', oldVal: 'In Progress', newVal: 'Completed', comment: 'Merged PR #142 into staging branch.' },
    { ts: '2026-11-06T18:00:00.000Z', action: 'RAID Item Created', assignee: 'Naomi Nagata', taskId: 'RAID-001', taskName: 'NASDAQ Multicast ticker ingestion rate limit throttle', module: 'Market Data', field: 'status', oldVal: '', newVal: 'Active', comment: 'Identified risk during 100k packet burst test.' },
    { ts: '2026-11-06T11:20:00.000Z', action: 'Decision Approved', assignee: 'Alex Rivera', taskId: 'ADR-008', taskName: 'Automated Canary Deployments with ArgoCD', module: 'Infrastructure', field: 'status', oldVal: 'Under Review', newVal: 'Approved', comment: 'Approved by engineering steering committee.' }
  ];

  logsData.forEach(l => {
    ls.addRow(l);
  });
  applyHeaderStyles(ls);

  // Write outputs
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicPath = path.join(publicDir, 'demo_project_database.xlsx');
  const rootPath = path.resolve(__dirname, '../demo_project_database.xlsx');

  await wb.xlsx.writeFile(publicPath);
  console.log('Successfully written demo excel database to:', publicPath);
  await wb.xlsx.writeFile(rootPath);
  console.log('Successfully written demo excel database to root:', rootPath);
}

buildDemoDatabase().catch(err => {
  console.error('Error generating demo database:', err);
  process.exit(1);
});
