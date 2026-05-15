import { ProjectState, TaskStatus, TaskPriority, Member, Task } from '../types';
import { getDefaultState } from '../store/defaultState';
import { nowISO, todayStr, addBusDays } from '../utils/projectUtils';

export const getWebSample = (): Partial<ProjectState> => {
  const state = getDefaultState();
  state.name = 'Nexus Platform Overhaul';
  state.desc = 'Enterprise-grade hierarchical project with module-level status rollups';
  
  state.members = [
    { id: 'MEM-001', name: 'Alex Rivera', role: 'Engineering Manager', status: 'Active', reportsTo: '', email: 'alex@nexus.io', phone: '+1-555-0100', birthday: '15 May', plannedLeaves: [] },
    { id: 'MEM-002', name: 'Sarah Chen', role: 'Lead Architect', status: 'Active', reportsTo: 'Alex Rivera', email: 'sarah@nexus.io', phone: '+1-555-0101', birthday: '22 Jun', plannedLeaves: [] },
    { id: 'MEM-003', name: 'Marcus Wong', role: 'Lead Frontend', status: 'Active', reportsTo: 'Alex Rivera', email: 'marcus@nexus.io', phone: '+1-555-0102', birthday: '10 Jan', plannedLeaves: [] },
    { id: 'MEM-004', name: 'Elena Vance', role: 'Lead Design', status: 'Active', reportsTo: 'Alex Rivera', email: 'elena@nexus.io', phone: '+1-555-0103', birthday: '05 Sep', plannedLeaves: [] },
  ];
  state.nextMemberId = 5;

  const t1: Task = {
    id: 'TASK-001',
    name: 'Core API Layer',
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.CRITICAL,
    category: 'Feature',
    module: 'API Gateway',
    moduleType: 'Server',
    assignee: 'Sarah Chen',
    release: 'v1.0.0',
    startDate: '2026-01-10',
    dueDate: '2026-01-30',
    actCompletionDate: '2026-01-28',
    progress: 100,
    estHours: 20,
    actHours: 18,
    dependsOn: [],
    notes: 'Base authentication and routing',
    subtasks: [],
    guiScreens: [],
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  const t2: Task = {
    id: 'TASK-002',
    name: 'Dashboard UI Framework',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    category: 'Feature',
    module: 'User Interface',
    moduleType: 'GUI',
    assignee: 'Marcus Wong',
    release: 'v1.1.0',
    startDate: '2026-02-01',
    dueDate: '2026-03-15',
    actCompletionDate: null,
    progress: 65,
    estHours: 15,
    actHours: 10,
    dependsOn: ['TASK-001'],
    notes: 'Responsive layout and shared components',
    subtasks: [],
    guiScreens: ['Home Feed', 'User Profile'],
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  const t3: Task = {
    id: 'TASK-003',
    name: 'Real-time Data Stream',
    status: TaskStatus.ON_HOLD,
    priority: TaskPriority.MEDIUM,
    category: 'Improvement',
    module: 'Core Engine',
    moduleType: 'Server',
    assignee: 'Sarah Chen',
    release: 'v1.2.0',
    startDate: '2026-03-01',
    dueDate: '2026-04-30',
    actCompletionDate: null,
    progress: 15,
    estHours: 40,
    actHours: 8,
    dependsOn: ['TASK-001'],
    notes: 'WebSocket integration for live updates',
    subtasks: [],
    guiScreens: [],
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  state.tasks = [t1, t2, t3];
  state.nextTaskId = 4;

  state.log = [
    { ts: nowISO(), action: 'Created', taskId: 'TASK-001', taskName: 'Core API Layer', field: '', oldVal: '', newVal: '', module: 'API Gateway', assignee: 'Sarah Chen' },
    { ts: nowISO(), action: 'Status Changed', taskId: 'TASK-001', taskName: 'Core API Layer', field: 'status', oldVal: 'In Progress', newVal: 'Completed', module: 'API Gateway', assignee: 'Sarah Chen' },
    { ts: nowISO(), action: 'Created', taskId: 'TASK-002', taskName: 'Dashboard UI Framework', field: '', oldVal: '', newVal: '', module: 'User Interface', assignee: 'Marcus Wong' },
  ];

  state.defects = [
    { id: 'DEF-001', title: 'Memory leak in socket handler', type: 'Functional Bug', severity: 'S1 - Blocker', priority: 'Critical', status: TaskStatus.IN_PROGRESS as any, linkedType: 'Task', linkedId: 'TASK-003', assignee: 'Sarah Chen', reporter: 'Alex Rivera', desc: 'Process crashes after 4h of activity', steps: '1. Connect to socket\n2. Wait 4h', createdAt: nowISO(), updatedAt: nowISO() }
  ];
  state.nextDefectId = 2;

  return state;
};
