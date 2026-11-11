export interface ViewHelpItem {
  id: string;
  title: string;
  shortLabel: string;
  badge: string;
  description: string;
  keyMetricsAndFields: {
    name: string;
    desc: string;
    formula?: string;
  }[];
  capabilities: {
    title: string;
    desc: string;
  }[];
  proTips: string[];
}

export interface StandardFieldItem {
  name: string;
  badge: string;
  desc: string;
  example: string;
  domain?: 'Tasks' | 'Defects' | 'Deliveries' | 'Custom';
  isCustom?: boolean;
}

export interface ShortcutItem {
  keys: string;
  action: string;
  category: 'Navigation' | 'Actions' | 'Dialogs';
}

export const VIEW_HELP_DATA: Record<string, ViewHelpItem> = {
  overview: {
    id: 'overview',
    title: 'Executive Overview & Steering Guide',
    shortLabel: 'Overview',
    badge: 'Strategic Telemetry',
    description: 'A visual-only strategic steering cockpit providing high-level health dials, milestone release radar, early warning signals, and architecture module gravity. Detailed metrics and scenario modelers are accessible in the Intelligence Cockpit.',
    keyMetricsAndFields: [
      {
        name: 'Health Index',
        desc: 'Composite project health dial (0–100%) indicating overall schedule integrity and delivery viability.',
        formula: '100 - (OverdueTasks × 50% + BlockedTasks × 30% + OnHoldTasks × 20%) / TotalActiveTasks × 100'
      },
      {
        name: 'Milestone Delivery Radar',
        desc: 'Visual roadmap tracking major release gates, target completion dates, and phase progress arcs.'
      },
      {
        name: 'Early Warning System (EWS)',
        desc: 'Automated continuous telemetry scan detecting critical anomalies: overdue deliverables, high-threat RAID items, and pending steering decisions.'
      },
      {
        name: 'Strategic Deliverables & Module Gravity',
        desc: 'Visual package completion tracks and architectural distribution of scope across core system domains.'
      }
    ],
    capabilities: [
      {
        title: 'Visual At-A-Glance Status',
        desc: 'Zero tabular clutter: pure spatial telemetry dials and milestone progress bars tailored for CXO and Steerco presentations.'
      },
      {
        title: 'One-Click Deep-Dive to Intelligence',
        desc: 'Press "G D" or click "Intelligence Cockpit" to immediately transition to granular Monte Carlo simulations, What-If Sandboxes, and EVM cost metrics.'
      },
      {
        title: 'Executive Briefing & Distribution',
        desc: 'Share view summaries or generate Executive CXO Email Briefings directly from the PageHeader menu.'
      }
    ],
    proTips: [
      'Hover over the Composite Health gauge to view the exact penalty deductions impacting your score.',
      'Use the Executive Overview for leadership alignment, and the Intelligence Cockpit for forensic analysis.',
      'Press "G D" at any time to jump directly from Overview into the Advanced Intelligence Dashboard.'
    ]
  },

  dash: {
    id: 'dash',
    title: 'Intelligence Dashboard & Analytics Guide',
    shortLabel: 'Intelligence',
    badge: 'Advanced Telemetry',
    description: 'Comprehensive project intelligence suite featuring granular predictive telemetry, What-If simulation sandboxes, resource utilization matrices, statistical velocity bands, EVM cost metrics, steering logs, and transactional audit ledgers.',
    keyMetricsAndFields: [
      {
        name: 'Weekly Delivery Velocity Band & Benchmark',
        desc: 'Evaluates rolling delivered output against team average velocity benchmarks, deadline burn-rate targets, and statistical control limits (±1.25σ Shewhart corridor) with interactive sprint task inspection.'
      },
      {
        name: 'Monte Carlo Simulation',
        desc: 'Runs 1,000 statistical iterations across remaining scope using historical velocity variance to forecast P50 (expected), P80 (conservative), and P95 (high confidence) delivery dates.'
      },
      {
        name: 'Cumulative Flow Diagram (CFD)',
        desc: 'Visualizes WIP (Work In Progress) stability over time across Not Started, In Progress, Review, and Done to expose workflow bottlenecks.'
      },
      {
        name: 'Sprint Burndown & Burnup',
        desc: 'Daily effort burn tracking compared against the ideal linear velocity trajectory.'
      },
      {
        name: 'Defect Density & MTTR',
        desc: 'Software defect escape rate and Mean Time To Resolution (MTTR) categorized by severity tiers (S1 to S4).'
      },
      {
        name: 'Module Effort Breakdown',
        desc: 'Aggregated distribution of planned versus actual effort across architectural modules.'
      }
    ],
    capabilities: [
      {
        title: 'Widget Layout Customization',
        desc: 'Expand widgets to full width or compress to bento grid mode to tailor the telemetry layout to your monitor.'
      },
      {
        title: 'Right-Click Chart Export',
        desc: 'Right-click any Recharts graphic or simulation canvas to copy a high-resolution chart image for presentations.'
      },
      {
        title: 'Dynamic Mini-Map Jump Navigation',
        desc: 'Use the sticky mini-map index on the right to jump smoothly between telemetry sections.'
      }
    ],
    proTips: [
      'Compare your Monte Carlo P80 date with client commitments to build an evidence-based risk buffer.',
      'If the In Review band in your CFD widens consistently, allocate senior code reviewers to relieve the bottleneck.',
      'Widgets automatically inherit the active color tokens from your selected theme.'
    ]
  },

  reports: {
    id: 'reports',
    title: 'Stakeholder Reporting Suite Guide',
    shortLabel: 'Reports',
    badge: 'Audit & Scorecard',
    description: 'Formal reporting engine designed for client steering committees, internal PMO reviews, and compliance audits with customized data pivots and multi-format exports.',
    keyMetricsAndFields: [
      {
        name: 'Audit Scorecard',
        desc: 'Comprehensive compliance checklist evaluating task metadata completeness, missing dates, unassigned items, and unresolved defects.'
      },
      {
        name: 'Executive KPI Summary',
        desc: 'High-level rollups of total delivery scope, completion percentage, variance against baseline, and open risk exposure.'
      },
      {
        name: 'Multi-Dimensional Pivot',
        desc: 'Dynamic data grouping by Module, Release Version, Assignee, Priority, or Status.'
      }
    ],
    capabilities: [
      {
        title: 'Customizable Report Sections',
        desc: 'Toggle narrative commentary, KPI cards, module breakdowns, defect logs, and RAID items on or off prior to generation.'
      },
      {
        title: 'Multi-Format Export Engine',
        desc: 'Export presentation-ready reports to formatted Excel workbooks, printer-optimized PDFs, or formatted email briefs.'
      }
    ],
    proTips: [
      'Use the Executive CXO Email Brief modal (accessible from Pulse & Analytics in the sidebar) to generate HTML and Markdown updates for leadership.',
      'Verify that all tasks have assigned modules and owners to achieve a 100% Audit Scorecard rating.'
    ]
  },

  tasks: {
    id: 'tasks',
    title: 'Tasks Matrix & Execution Grid Guide',
    shortLabel: 'Tasks',
    badge: 'Execution Cockpit',
    description: 'The primary command center for granular work execution, chronological linear scheduling, hierarchical subtasks, and transactional project data management.',
    keyMetricsAndFields: [
      {
        name: 'Task ID',
        desc: 'Unique persistent alphanumeric identifier (e.g., T-101) maintained across imports and exports.'
      },
      {
        name: 'Module',
        desc: 'The functional architectural boundary this work item belongs to (e.g., Auth Engine, Payment Gateway).'
      },
      {
        name: 'Status',
        desc: 'Current lifecycle state: Not Started, In Progress, Review, Completed, On Hold, or Cancelled. Click badge to quick-cycle.'
      },
      {
        name: 'Priority & Queuing',
        desc: 'Urgency tier (Critical, High, Medium, Low). Critical items are automatically scheduled earliest in developer capacity queues.'
      },
      {
        name: 'Complexity Multiplier',
        desc: 'Effort scaling factor for GUI screens: Easy (1.0x), Medium (1.5x), and Complex (2.0x).'
      },
      {
        name: 'Date Triad',
        desc: 'Planned Start/Due Date (evaluated against Approved Baseline Start/Due Date, with predictive Forecast Due Date based on actual velocity).'
      },
      {
        name: 'Dependencies',
        desc: 'Predecessor task links. Blocked tasks display an alert lock icon indicating unfinished prerequisites.'
      }
    ],
    capabilities: [
      {
        title: 'Spreadsheet Grid & Kanban Toggle',
        desc: 'Seamlessly switch between high-density spreadsheet grid mode and drag-and-drop Kanban workflow boards.'
      },
      {
        title: 'Column Filters & Sorting',
        desc: 'Toggle the inline filter row to filter simultaneously by Module, Release, Status, Priority, or Assignee, with multi-column sorting.'
      },
      {
        title: 'Hierarchical Subtask Tree',
        desc: 'Expand any parent task row to manage granular child subtasks with automatic effort and progress rollups.'
      },
      {
        title: 'Configurable Pagination',
        desc: 'Choose between 10, 25, 50, 100, or all rows per page to eliminate unnecessary scrolling. Preferences persist across sessions.'
      }
    ],
    proTips: [
      'Overdue tasks are flagged with a prominent red accent on the due date and card border only if incomplete.',
      'Right-click or use the action menu on any task to duplicate it or add a child subtask.',
      'Double-click any cell in the grid to perform instant inline edits.'
    ]
  },

  deliveries: {
    id: 'deliveries',
    title: 'ALM Deliveries & Packaging Guide',
    shortLabel: 'Deliveries',
    badge: 'Packaging & Sign-off',
    description: 'Central command for mapping engineering work into formal Application Lifecycle Management (ALM) delivery packages, Package Delivery Notes (PDNs), and sign-off agreements.',
    keyMetricsAndFields: [
      {
        name: 'ALM ID & PDN Package',
        desc: 'Formal enterprise tracking identifier (e.g., ALM-8012) bundled with one or more versioned PDN release packages.'
      },
      {
        name: 'Environment Tier',
        desc: 'Target deployment infrastructure: DEV, SIT (System Integration Testing), UAT (User Acceptance Testing), STAGING, or PROD.'
      },
      {
        name: 'Formal Sign-off Status',
        desc: 'Stakeholder authorization gate: Pending, Approved, Conditionally Approved, or Rejected.'
      },
      {
        name: 'Smoke Test Status',
        desc: 'Post-deployment automated verification state: Passed, Failed, In Progress, or Blocked.'
      },
      {
        name: 'Linked Scope',
        desc: 'Inventory of linked user stories, defect fixes, and architectural GUI screens bundled in the release note.'
      }
    ],
    capabilities: [
      {
        title: 'Printable Delivery Note Generator',
        desc: 'Produces corporate delivery notes complete with official letterhead, scope breakdown, resolved bug list, and formal signature blocks.'
      },
      {
        title: 'Auto-Link from Tasks',
        desc: 'Scan unbundled completed tasks and automatically group them into draft ALM delivery packages by module and release version.'
      },
      {
        title: '3D Heatmap & Tree Hierarchy',
        desc: 'Inspect nested relationships: Release Vehicle → Feature → Task → ALM Package → PDN with rollups.'
      }
    ],
    proTips: [
      'Ensure smoke tests and sign-offs are marked Approved before promoting an ALM package to PROD.',
      'Export the Delivery Schedule directly to Excel for external vendor or client delivery handovers.'
    ]
  },

  timeline: {
    id: 'timeline',
    title: 'Project Timeline & Gantt Engine Guide',
    shortLabel: 'Timeline',
    badge: 'Gantt & Critical Path',
    description: 'Interactive high-fidelity Gantt chart for visual chronological scheduling, linear assignee queuing, dependency linking, and critical path identification.',
    keyMetricsAndFields: [
      {
        name: 'Linear Assignee Queues',
        desc: 'Schedules tasks assigned to each member sequentially without unrealistic calendar overlaps, prioritizing Critical items first.'
      },
      {
        name: 'Time Scale Resolution',
        desc: 'Toggle between Day, Week, and Month zoom levels for granular sprint or quarterly milestone planning.'
      },
      {
        name: 'Progress Fill Overlays',
        desc: 'Internal shaded segments inside timeline bars indicate exact percentage completion.'
      },
      {
        name: 'Milestone Markers',
        desc: 'Zero-duration delivery checkpoints with matching start and due dates rendered as milestone flags.'
      }
    ],
    capabilities: [
      {
        title: 'Dependency Drag Linking',
        desc: 'Visually connect predecessor tasks to successor tasks to model cascading timelines.'
      },
      {
        title: 'Critical Path Highlighting',
        desc: 'Highlights the sequence of dependent tasks that directly determines the overall project delivery date.'
      }
    ],
    proTips: [
      'Tasks without planned start or due dates are excluded from the Gantt canvas. Ensure dates are populated in the Tasks Matrix.',
      'Use Week scale for sprint retrospectives and Month scale for executive steering presentations.'
    ]
  },

  releases: {
    id: 'releases',
    title: 'Release Roadmap & Milestones Guide',
    shortLabel: 'Roadmap',
    badge: 'Milestone Vehicles',
    description: 'Strategic version gating and milestone vehicle planner, mapping features and delivery packages to production release target dates.',
    keyMetricsAndFields: [
      {
        name: 'Release Version',
        desc: 'Version tag (e.g., v1.0.0, v1.2.0-hotfix, Q3-GA) representing a deployable software increment.'
      },
      {
        name: 'Scope Completion %',
        desc: 'Rollup of all tasks and ALM packages assigned to the release.'
      },
      {
        name: 'Release Status',
        desc: 'Planning, In Development, Code Freeze, In Staging, or Released.'
      },
      {
        name: 'Target Date & Health',
        desc: 'Calendar release deadline combined with delivery confidence score.'
      }
    ],
    capabilities: [
      {
        title: 'Version Scope Gating',
        desc: 'Filter tasks and features by release vehicle to verify that release candidate scope is fully completed.'
      },
      {
        title: 'Release Burnup Trajectory',
        desc: 'Track scope addition versus completion pace as code freeze approaches.'
      }
    ],
    proTips: [
      'Move deferred items to future releases directly from the release roadmap to keep commitments realistic.',
      'Coordinate with the ALM Deliveries view to verify all packages have smoke tests passed before triggering code freeze.'
    ]
  },

  team: {
    id: 'team',
    title: 'Team Hub & Organizational Structure Guide',
    shortLabel: 'Team',
    badge: 'Workforce Directory',
    description: 'Comprehensive directory of engineering and management talent, featuring organizational reporting hierarchies, skills matrices, contact profiles, and capacity allocations.',
    keyMetricsAndFields: [
      {
        name: 'Role & Department',
        desc: 'Primary job title (e.g., Senior Fullstack Engineer, QA Lead, Architect) and team designation.'
      },
      {
        name: 'Weekly Capacity',
        desc: 'Standard productive hours or business days available per week (defaults to 5 days / 40 hours).'
      },
      {
        name: 'Queue Depth',
        desc: 'Total pending effort divided by weekly capacity. A queue depth of 200% represents 2 full weeks of queued backlog.'
      },
      {
        name: 'Reports To (Hierarchy)',
        desc: 'Designated manager used to automatically compile the dynamic organizational hierarchy tree.'
      },
      {
        name: 'Planned Leaves',
        desc: 'Scheduled vacations and absences that automatically deduct capacity from scheduling and timeline calculations.'
      }
    ],
    capabilities: [
      {
        title: 'Dynamic Org Chart Tree',
        desc: 'Visual tree diagram rendering reporting relationships from executive leadership to individual contributors.'
      },
      {
        title: 'Skills & Role Coverage',
        desc: 'Identify shortages (e.g., QA or DevOps gaps) by comparing assigned backlog requirements with team competencies.'
      }
    ],
    proTips: [
      'Always log planned leaves in member profiles in advance to ensure the Intelligent Scheduler accounts for reduced availability.',
      'Click on any member card to view their current task assignments and throughput velocity.'
    ]
  },

  capacity: {
    id: 'capacity',
    title: 'Capacity Modeling & Scheduling Sandbox Guide',
    shortLabel: 'Capacity',
    badge: 'Intelligent Scheduler',
    description: 'Predictive resource leveling engine featuring 12-week forward workload heatmaps, automated conflict diagnostics, and sandbox schedule optimization.',
    keyMetricsAndFields: [
      {
        name: 'Daily Load Thresholds',
        desc: 'Green (<80% daily load: Healthy), Amber (80–100%: At Capacity), Red (>100%: Overallocated / Burnout Risk).'
      },
      {
        name: 'Queue Depth Index',
        desc: 'Calculated as (Total Pending Days) / (Weekly Capacity). Indicates backlog runway per developer.'
      },
      {
        name: 'Conflict Diagnostics',
        desc: 'Identifies concurrent over-allocations and dependency sequence violations (e.g., task scheduled before predecessor due date).'
      }
    ],
    capabilities: [
      {
        title: 'Interactive Date Shifting',
        desc: 'Hover over task chips in the schedule grid to shift timelines by -1 or +1 business days with automatic dependent cascading.'
      },
      {
        title: 'Global AI Auto-Resolver',
        desc: 'Click "Auto-Resolve All" to run heuristic schedule optimization that balances assignments and eliminates date conflicts.'
      },
      {
        title: 'Sandbox Planning Safety',
        desc: 'Simulate leveling changes in an isolated state; changes only alter live task dates when you click "Apply & Save".'
      }
    ],
    proTips: [
      'Use the Diagnostics tab to locate specific overlaps, then click "Resolve Assignee" for targeted one-member leveling.',
      'Check the 12-week heatmap at sprint planning to prevent overloading specialists on critical path modules.'
    ]
  },

  defects: {
    id: 'defects',
    title: 'Defect Workshop & Quality Triage Guide',
    shortLabel: 'Defects',
    badge: 'Quality Assurance',
    description: 'Repository for logging, triaging, and tracking software bugs from discovery through verification and closure, linked to tasks and GUI screens.',
    keyMetricsAndFields: [
      {
        name: 'Defect ID',
        desc: 'Persistent defect identifier (e.g., DEF-101) with direct links to impacted tasks.'
      },
      {
        name: 'Severity (S1–S4)',
        desc: 'S1-Blocker (System down / Release blocker), S2-Critical (Core functionality broken), S3-Major (Workaround exists), S4-Minor (Cosmetic/UI).'
      },
      {
        name: 'Lifecycle Status',
        desc: 'New → Open → In Progress → Resolved → Retest → Closed.'
      },
      {
        name: 'Defect Age',
        desc: 'Elapsed calendar days since discovery, highlighting stale bugs exceeding SLA targets.'
      }
    ],
    capabilities: [
      {
        title: 'Entity Linking',
        desc: 'Directly link defects to tasks, subtasks, or GUI screens to trace defect origins and component quality.'
      },
      {
        title: 'Quick Status Cycling & Filters',
        desc: 'Filter by Severity and Status with column-level inline search.'
      }
    ],
    proTips: [
      'Zero S1 and S2 defects are required for release sign-off in the ALM Deliveries view.',
      'Use the Defect Workshop to ensure verified fixes undergo Retest before being marked Closed.'
    ]
  },

  risks: {
    id: 'risks',
    title: 'RAID Register & Decision Log Guide',
    shortLabel: 'RAID',
    badge: 'Governance & Risks',
    description: 'Formal management log for Risks, Assumptions, Issues, and Dependencies (RAID), accompanied by an executive Decision Log.',
    keyMetricsAndFields: [
      {
        name: 'RAID Type',
        desc: 'Risk (Potential threat), Assumption (Unverified hypothesis), Issue (Current active blocker), Dependency (External prerequisite).'
      },
      {
        name: 'Probability (1–5)',
        desc: 'Likelihood rating from 1 (Very Low: <10%) to 5 (Very High: >80%).'
      },
      {
        name: 'Impact Level',
        desc: 'Low, Medium, or High consequence on schedule, cost, or quality.'
      },
      {
        name: 'Severity Score',
        desc: 'Composite risk score calculated as Probability × Impact Weight, driving early warning alerts.'
      },
      {
        name: 'Mitigation Plan',
        desc: 'Specific preventive action plan and accountable owner responsible for resolution.'
      }
    ],
    capabilities: [
      {
        title: 'Decisions Register',
        desc: 'Track strategic architectural, scope, and technical steering decisions with sign-off dates and rationale.'
      },
      {
        title: 'Impact Matrix Heatmap',
        desc: 'Visual 5×3 grid placing risks into Green, Amber, or Red threat zones.'
      }
    ],
    proTips: [
      'Issues with High Impact automatically trigger alerts in the Early Warning System (EWS) on the Executive Overview.',
      'Review and update mitigation target dates weekly during governance standups.'
    ]
  },

  retro: {
    id: 'retro',
    title: 'Sprint Retrospective & Continuous Improvement Guide',
    shortLabel: 'Retro',
    badge: 'Kaizen Telemetry',
    description: 'Continuous improvement forum capturing sprint feedback, team morale telemetry, and accountable action items to refine team velocity.',
    keyMetricsAndFields: [
      {
        name: '4Ls Framework',
        desc: 'Categorization: Liked (What went well), Learned (New insights), Lacked (What hindered us), Longed For (What we wished we had).'
      },
      {
        name: 'Team Sentiment Score',
        desc: 'Aggregate morale index (1–5 stars) tracked across sprints to measure team energy and sustainability.'
      },
      {
        name: 'Action Items & Ownership',
        desc: 'Actionable improvements assigned to specific owners with target completion dates to prevent recurring pain points.'
      }
    ],
    capabilities: [
      {
        title: 'Start / Stop / Continue Alternate View',
        desc: 'Toggle between 4Ls and Start/Stop/Continue methodologies to match your team\'s retrospective cadence.'
      },
      {
        title: 'Action Item Tracking',
        desc: 'Promote retrospective action items directly into the Tasks Matrix to ensure follow-through.'
      }
    ],
    proTips: [
      'Limit retrospective action items to 2–3 high-impact commitments per sprint to maximize completion rate.',
      'Track Team Sentiment trends alongside velocity to detect burnout early.'
    ]
  },

  log: {
    id: 'log',
    title: 'Activity Log & Transactional Audit Ledger Guide',
    shortLabel: 'Audit Log',
    badge: 'Compliance & Audit',
    description: 'An immutable, system-generated audit ledger recording every entity mutation, date change, status transition, and deletion in the application.',
    keyMetricsAndFields: [
      {
        name: 'Timestamp & Actor',
        desc: 'Exact ISO timestamp and user identity responsible for the transaction.'
      },
      {
        name: 'Entity & Action',
        desc: 'Target item (Task, Member, Defect, RAID) and operation type (Created, Updated, Deleted, Status Change).'
      },
      {
        name: 'Delta Values',
        desc: 'Audited snapshot showing the previous value and the updated value.'
      },
      {
        name: 'Transition Reason',
        desc: 'Mandatory explanatory comments required when tasks are moved to On Hold or Cancelled.'
      }
    ],
    capabilities: [
      {
        title: 'Searchable Audit Trail',
        desc: 'Filter logs by Task ID, User Name, Field Name, or Date Range to investigate changes.'
      },
      {
        title: 'State Reconstruction Reference',
        desc: 'Use historical before/after logs to recover original task dates or descriptions in case of accidental overwrites.'
      }
    ],
    proTips: [
      'Activity logs are maintained in local persistence and included in full Excel workbook backups.',
      'Export the audit ledger prior to major compliance milestones to demonstrate strict change management.'
    ]
  },

  features: {
    id: 'features',
    title: 'Functional Matrix & Strategic Capabilities Guide',
    shortLabel: 'Matrix',
    badge: 'Domain Blueprint',
    description: 'Maps high-level business requirements and functional capabilities to technical architecture screens, modules, and execution tasks.',
    keyMetricsAndFields: [
      {
        name: 'Feature Capability',
        desc: 'Business capability specification (e.g., Multi-Factor Auth, Automated Leveling, PDF Exporter).'
      },
      {
        name: 'Mapped Screens',
        desc: 'Logical UI screens and components required to deliver the feature.'
      },
      {
        name: 'Task Rollup Progress',
        desc: 'Aggregate percentage completion of all underlying technical tasks mapped to the capability.'
      },
      {
        name: 'Strategic Alignment',
        desc: 'Priority tier and target release milestone for commercial readiness.'
      }
    ],
    capabilities: [
      {
        title: 'Requirement-to-Code Traceability',
        desc: 'Inspect exactly which engineering tasks deliver each business requirement to give clear status to non-technical stakeholders.'
      },
      {
        title: 'Feature Readiness Index',
        desc: 'Determine whether a capability is ready for beta testing or client demo.'
      }
    ],
    proTips: [
      'Use this view during roadmap presentations with product managers and business stakeholders.',
      'Click on any feature to drill into its underlying execution tasks.'
    ]
  },

  scaffolder: {
    id: 'scaffolder',
    title: 'Project Architect & Scaffolder Guide',
    shortLabel: 'Scaffolder',
    badge: 'Rapid Code Scaffolding',
    description: 'Rapid architectural planning wizard that translates module blueprints and GUI screen definitions into fully populated task hierarchies and workflows.',
    keyMetricsAndFields: [
      {
        name: 'Step 1: Blueprint Modules',
        desc: 'Define functional modules (e.g., Auth, Payments, Analytics), assign leads, and tag release versions.'
      },
      {
        name: 'Step 2: GUI Screen Inventory',
        desc: 'Map user interface screens to modules, assign complexity ratings (Easy 1.0x, Medium 1.5x, Complex 2.0x).'
      },
      {
        name: 'Step 3: Strategic Feature Generation',
        desc: 'Connect screens and modules to high-level features before generating complete task trees.'
      }
    ],
    capabilities: [
      {
        title: 'Bulk TSV / CSV Import',
        desc: 'Copy lists of module names directly from Excel or spreadsheets and paste them into the wizard.'
      },
      {
        title: 'Architecture Presets',
        desc: 'Load pre-configured architecture templates (e.g., Mobile Banking & FinTech, E-Commerce SaaS, Enterprise ERP).'
      },
      {
        title: 'Sandbox Safety Gate',
        desc: 'Preview generated task trees in an isolated sandbox before committing them to the live workspace.'
      }
    ],
    proTips: [
      'Configure Step Templates first so the Scaffolder can automatically generate standard technical steps for each screen.',
      'Assign realistic complexity ratings in Step 2 to ensure accurate automated effort calculations.'
    ]
  },

  fields: {
    id: 'fields',
    title: 'Field Architect & Custom Metadata Guide',
    shortLabel: 'Fields',
    badge: 'Schema Extensibility',
    description: 'Extend the ProjectPulse data model with bespoke custom metadata fields that appear seamlessly across task and defect grids.',
    keyMetricsAndFields: [
      {
        name: 'Field Types',
        desc: 'Text, Select (dropdown), Number, Date, or Checkbox (boolean).'
      },
      {
        name: 'Entity Scope',
        desc: 'Apply custom attributes to Tasks, Defects, or Deliveries.'
      },
      {
        name: 'Required Validation',
        desc: 'Enforce mandatory data entry when creating or editing items.'
      }
    ],
    capabilities: [
      {
        title: 'Dynamic Field Injection',
        desc: 'Custom fields automatically integrate into tables, modals, filters, and Excel exports without database migrations.'
      },
      {
        title: 'Reordering & Visibility',
        desc: 'Drag to reorder custom fields to control their display position in modal forms.'
      }
    ],
    proTips: [
      'Use "Select" fields with predefined options rather than free text to keep reporting data clean and consistent.',
      'Examples of useful custom fields: Cost Center, Billable, Client Code, Security Clearance.'
    ]
  },

  steps: {
    id: 'steps',
    title: 'Step Blueprints & Workflow Templates Guide',
    shortLabel: 'Blueprints',
    badge: 'Workflow Automation',
    description: 'Define reusable operational sequences and delivery phases that automatically generate standard child subtasks for engineering modules.',
    keyMetricsAndFields: [
      {
        name: 'Template Name',
        desc: 'Standardized delivery workflow (e.g., API Endpoint Delivery, Microservice Scaffold, React Screen Build).'
      },
      {
        name: 'Default Effort',
        desc: 'Estimated effort baseline for each operational step (tracked in Days, Hours, or Months).'
      },
      {
        name: 'Sequence Order',
        desc: 'Sequential order of execution (e.g., 1. Design Schema → 2. Implement API → 3. Write Unit Tests → 4. Code Review).'
      }
    ],
    capabilities: [
      {
        title: 'One-Click Subtask Generation',
        desc: 'Apply a blueprint to any task to instantly populate its child execution checklist with consistent estimates.'
      },
      {
        title: 'Scaffolder Integration',
        desc: 'The Project Scaffolder uses these step templates to build standardized task structures during initial project setup.'
      }
    ],
    proTips: [
      'Create separate templates for Frontend Screens, Backend APIs, and Infrastructure deployments.',
      'Include a code review or QA verification step in every blueprint to maintain release quality.'
    ]
  },

  dropdowns: {
    id: 'dropdowns',
    title: 'Pulse Registry & Option Libraries Guide',
    shortLabel: 'Registry',
    badge: 'Taxonomy Governance',
    description: 'Manage and standardize the global lookup taxonomies used across project matrices: Task Statuses, Priorities, Categories, Roles, Modules, and Releases.',
    keyMetricsAndFields: [
      {
        name: 'Taxonomy Categories',
        desc: 'Statuses, Priorities, Task Categories, Team Roles, Module Names, and Release Versions.'
      },
      {
        name: 'Data Integrity Guard',
        desc: 'Prevents typos and variations across team members to guarantee clean filtering and accurate rollups.'
      }
    ],
    capabilities: [
      {
        title: 'Bulk Options Editor',
        desc: 'Edit or paste entire lookup lists at once (one item per line) for rapid taxonomy configuration.'
      },
      {
        title: 'Active Usage Protection',
        desc: 'Alerts you if an option targeted for deletion is actively used by existing tasks or members.'
      }
    ],
    proTips: [
      'Standardize your Module and Role lists before importing team members or creating tasks.',
      'Use consistent naming conventions for Release Versions (e.g., "v1.0.0", "v1.1.0") to keep roadmaps organized.'
    ]
  },

  settings: {
    id: 'settings',
    title: 'System Configuration & Data Governance Guide',
    shortLabel: 'Settings',
    badge: 'Governance & Data',
    description: 'Global workspace settings, project baselines, Excel workbook synchronization, effort units, theme management, and Role-Based Access Control (RBAC).',
    keyMetricsAndFields: [
      {
        name: 'Effort Tracking Unit',
        desc: 'Global unit of measure: Days, Hours, or Months. Automatically adjusts all effort labels and calculations.'
      },
      {
        name: 'Project Baselines',
        desc: 'Immutable snapshot of planned start and due dates used to measure real schedule variance and delivery slippage.'
      },
      {
        name: 'Excel Workbook Synchronization',
        desc: 'Full-fidelity import and export of all 10+ relational project entities via formatted XLSX workbooks.'
      },
      {
        name: 'Role-Based Access Control (RBAC)',
        desc: 'Granular view and capability permissions for Admin, Project Manager, Lead Engineer, Developer, and Stakeholder personas.'
      }
    ],
    capabilities: [
      {
        title: 'Baseline Snapshot Management',
        desc: 'Capture approved baselines before sprint execution and compare actual progress against baseline targets.'
      },
      {
        title: 'Demo Database Loader',
        desc: 'Instantly populate the workspace with the comprehensive Project Titan sample database to explore all features.'
      },
      {
        title: 'Full Workspace Wipe (New Project)',
        desc: 'Admin capability to clear all entities and start a clean project workspace with custom metadata.'
      }
    ],
    proTips: [
      'Create a baseline snapshot at the start of each release cycle to maintain historical variance records.',
      'Regularly export your project to Excel as an offline backup.'
    ]
  }
};

export const STANDARD_FIELD_GUIDE: StandardFieldItem[] = [
  {
    name: 'Status',
    badge: 'Lifecycle',
    desc: 'The current state of work. Options: Not Started, In Progress, Review, Completed, On Hold, Cancelled. Click any status badge in the grid to quick-cycle.',
    example: 'In Progress'
  },
  {
    name: 'Priority',
    badge: 'Scheduling',
    desc: 'Urgency tier: Critical, High, Medium, Low. Directly determines scheduling order in developer queues; Critical items are always scheduled earliest.',
    example: 'Critical'
  },
  {
    name: 'Category',
    badge: 'Classification',
    desc: 'Functional classification of the work item. Standard values: Feature, Bug, Server Module, GUI Screen, Documentation, Infrastructure.',
    example: 'Server Module'
  },
  {
    name: 'Progress',
    badge: 'Completion',
    desc: 'Granular progress percentage (0–100%). For parent tasks with subtasks, progress automatically reflects the weighted rollup of child items.',
    example: '75%'
  },
  {
    name: 'Estimated Effort',
    badge: 'Planning',
    desc: 'The projected effort required to complete the task, tracked in the project\'s configured effort unit (Days, Hours, or Months).',
    example: '3.5 days'
  },
  {
    name: 'Actual Effort',
    badge: 'Actuals',
    desc: 'The logged effort spent on the task so far. Enables team variance analysis (Actual vs Estimated effort).',
    example: '4.0 days'
  },
  {
    name: 'Module',
    badge: 'Architecture',
    desc: 'The functional domain or architectural subsystem this task impacts (e.g., Auth Engine, Core Ledger, Notifications).',
    example: 'Auth Engine'
  },
  {
    name: 'Release Version',
    badge: 'Delivery',
    desc: 'The target release vehicle milestone (e.g., v1.0.0, Q3 Release). Links tasks to release roadmaps and ALM packages.',
    example: 'v1.0.0'
  },
  {
    name: 'Complexity Rating',
    badge: 'Scaling',
    desc: 'Task difficulty scale for GUI screens: Easy (1.0x effort), Medium (1.5x effort), and Complex (2.0x effort multiplier).',
    example: 'Complex (2.0x)'
  },
  {
    name: 'Planned Start Date',
    badge: 'Schedule',
    desc: 'Feasible planned start date for execution. In linear scheduling, automatically adjusts to start after predecessor tasks complete.',
    example: '2026-03-02'
  },
  {
    name: 'Planned Due Date',
    badge: 'Schedule',
    desc: 'Target completion date. Highlighted in red if the date is in the past and the task remains incomplete.',
    example: '2026-03-15'
  },
  {
    name: 'Baseline Dates',
    badge: 'Governance',
    desc: 'Immutable snapshot of approved start and due dates captured during project baselining, used to compute schedule variance.',
    example: 'Base Due: 2026-03-10'
  },
  {
    name: 'Dependencies',
    badge: 'Graph',
    desc: 'Predecessor task IDs required before this task can begin. Tasks with unfinished predecessors display an alert lock icon.',
    example: 'T-101, T-104'
  }
];

export const GLOBAL_SHORTCUTS: ShortcutItem[] = [
  { keys: '/', action: 'Focus Global Search bar across all tasks, defects & RAID items', category: 'Navigation' },
  { keys: 'F1 or ?', action: 'Open contextual in-app screen help & user guide', category: 'Dialogs' },
  { keys: 'Esc', action: 'Close open modal, flyout drawer, or dismiss alert', category: 'Dialogs' },
  { keys: 'Cmd+E / Ctrl+E', action: 'Export complete project database to Excel workbook', category: 'Actions' },
  { keys: 'G O', action: 'Jump directly to Executive Overview', category: 'Navigation' },
  { keys: 'G D', action: 'Jump directly to Intelligence Dashboard', category: 'Navigation' },
  { keys: 'G T', action: 'Jump directly to Tasks Matrix', category: 'Navigation' },
  { keys: 'Double-Click Cell', action: 'Quick inline edit on supported spreadsheet table cells', category: 'Actions' }
];

export function getMergedFieldGuide(
  state?: any,
  filterDomain?: 'all' | 'tasks' | 'defects' | 'deliveries' | 'custom'
): StandardFieldItem[] {
  const guideMap = new Map<string, StandardFieldItem>();

  // 1. Seed baseline standard field guide (Tasks)
  STANDARD_FIELD_GUIDE.forEach(f => {
    guideMap.set(f.name.toLowerCase(), {
      ...f,
      domain: 'Tasks',
      isCustom: false
    });
  });

  if (!state) {
    return Array.from(guideMap.values());
  }

  // 2. Dynamic state.fieldDefinitions overrides
  if (state.fieldDefinitions && typeof state.fieldDefinitions === 'object') {
    Object.entries(state.fieldDefinitions).forEach(([key, def]: [string, any]) => {
      if (def && typeof def === 'object') {
        const item: StandardFieldItem = {
          name: def.name || def.label || key,
          badge: def.badge || (def.isCustom ? 'Custom Schema' : 'Standard Field'),
          desc: def.desc || def.description || `Configured attribute: ${key}`,
          example: def.example || 'Configured value',
          domain: def.domain || 'Custom',
          isCustom: !!def.isCustom
        };
        guideMap.set((def.name || key).toLowerCase(), item);
      }
    });
  }

  // 3. Sync standard column overrides from state.cols, state.defCols, state.delCols
  if (Array.isArray(state.cols)) {
    state.cols.forEach((c: any) => {
      if (!c) return;
      const keyName = (c.label || c.key || '').toLowerCase();
      const existing = guideMap.get(keyName);
      if (existing) {
        if (c.label) existing.name = c.label;
        if (c.description) existing.desc = c.description;
      }
    });
  }

  // 4. Ingest task custom fields from FieldArchitect (state.customFields)
  if (Array.isArray(state.customFields)) {
    state.customFields.forEach((cf: any) => {
      if (!cf?.name) return;
      const typeLabel = cf.type ? cf.type.toUpperCase() : 'TEXT';
      const optsStr = Array.isArray(cf.options) && cf.options.length > 0 ? ` Options: ${cf.options.join(', ')}.` : '';
      const reqStr = cf.required ? ' (Required field)' : '';
      const exampleStr = Array.isArray(cf.options) && cf.options.length > 0 
        ? cf.options[0] 
        : (cf.type === 'number' ? '42' : cf.type === 'date' ? '2026-12-01' : cf.type === 'checkbox' ? 'true' : 'Custom value');

      guideMap.set(cf.name.toLowerCase(), {
        name: cf.name,
        badge: `Custom (Tasks) • ${typeLabel}`,
        desc: `User-defined ${cf.type} field configured via Field Architect.${optsStr}${reqStr}`,
        example: exampleStr,
        domain: 'Tasks',
        isCustom: true
      });
    });
  }

  // 5. Ingest defect custom fields (state.defCustomFields)
  if (Array.isArray(state.defCustomFields)) {
    state.defCustomFields.forEach((cf: any) => {
      if (!cf?.name) return;
      const typeLabel = cf.type ? cf.type.toUpperCase() : 'TEXT';
      const optsStr = Array.isArray(cf.options) && cf.options.length > 0 ? ` Options: ${cf.options.join(', ')}.` : '';
      const exampleStr = Array.isArray(cf.options) && cf.options.length > 0 ? cf.options[0] : 'Defect attribute';

      guideMap.set(`defect_${cf.name.toLowerCase()}`, {
        name: `${cf.name} (Defects)`,
        badge: `Custom (Defects) • ${typeLabel}`,
        desc: `User-defined defect attribute configured via Field Architect.${optsStr}`,
        example: exampleStr,
        domain: 'Defects',
        isCustom: true
      });
    });
  }

  // 6. Ingest delivery custom fields (state.delCustomFields)
  if (Array.isArray(state.delCustomFields)) {
    state.delCustomFields.forEach((cf: any) => {
      if (!cf?.name) return;
      const typeLabel = cf.type ? cf.type.toUpperCase() : 'TEXT';
      const optsStr = Array.isArray(cf.options) && cf.options.length > 0 ? ` Options: ${cf.options.join(', ')}.` : '';
      const exampleStr = Array.isArray(cf.options) && cf.options.length > 0 ? cf.options[0] : 'Delivery attribute';

      guideMap.set(`delivery_${cf.name.toLowerCase()}`, {
        name: `${cf.name} (Deliveries)`,
        badge: `Custom (Deliveries) • ${typeLabel}`,
        desc: `User-defined delivery attribute configured via Field Architect.${optsStr}`,
        example: exampleStr,
        domain: 'Deliveries',
        isCustom: true
      });
    });
  }

  let results = Array.from(guideMap.values());
  if (filterDomain && filterDomain !== 'all') {
    if (filterDomain === 'custom') {
      results = results.filter(r => r.isCustom);
    } else if (filterDomain === 'tasks') {
      results = results.filter(r => r.domain === 'Tasks');
    } else if (filterDomain === 'defects') {
      results = results.filter(r => r.domain === 'Defects');
    } else if (filterDomain === 'deliveries') {
      results = results.filter(r => r.domain === 'Deliveries');
    }
  }

  return results;
}

