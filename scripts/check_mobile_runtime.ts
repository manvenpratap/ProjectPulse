import assert from 'node:assert/strict';
import { getDefaultState } from '../src/store/defaultState';
import { analyzeProject } from '../src/services/aiService';
import { isLoopbackHost, resolveMobileLaunchUrl } from '../src/components/shared/MobileLaunchQrModal';
import { TaskPriority, TaskStatus, DefectStatus } from '../src/types';
import {
  computeSubtaskRollup,
  nextDefectQuickStatus,
  nextReleaseStatus,
  nextRetroActionStatus,
  normalizeRaidStatus,
  resolveSessionPhase,
  resolveTaskTransition,
  transitionDeliveryStage,
} from '../src/utils/stateMachines';

async function main() {
  const state = getDefaultState();
  state.name = 'Mobile Telemetry Check';
  state.tasks.push({
    id: 'TASK-1',
    name: 'Offline Smoke Verification',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    category: 'Mobile',
    module: 'iOS & Android',
    moduleType: 'App',
    assignee: 'Sarah Chen',
    release: 'v2.0',
    startDate: '2026-11-01',
    dueDate: '2020-01-01',
    actCompletionDate: null,
    progress: 50,
    estDays: 2,
    actDays: 1,
    dependsOn: [],
    notes: '',
    subtasks: [],
    guiScreens: [],
    updatedAt: '2026-11-12T00:00:00.000Z',
    createdAt: '2026-11-12T00:00:00.000Z',
  });

  // Simulate native Capacitor WebView runtime without remote server URL
  (globalThis as unknown as { window?: unknown }).window = {
    Capacitor: { isNativePlatform: () => true },
  };
  const nativeReport = await analyzeProject(state);
  assert.match(nativeReport, /Executive Pulse Briefing — Mobile Telemetry Check/);
  assert.match(nativeReport, /Overall Health Score:/);
  assert.match(nativeReport, /TASK-1/);

  // Simulate offline Web fetch rejection fallback
  delete (globalThis as unknown as { window?: unknown }).window;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Network unreachable');
  };
  try {
    const offlineReport = await analyzeProject(state);
    assert.match(offlineReport, /Offline fallback/);
    assert.match(offlineReport, /Scope Progress:.*0\/1 tasks completed/);
  } finally {
    globalThis.fetch = origFetch;
  }

  assert.equal(isLoopbackHost('localhost'), true);
  assert.equal(isLoopbackHost('127.0.0.1'), true);
  assert.equal(isLoopbackHost('192.168.1.10'), false);
  assert.equal(resolveMobileLaunchUrl('http://192.168.1.10:3000/', 'home', '#/dash'), 'http://192.168.1.10:3000');
  assert.equal(resolveMobileLaunchUrl('http://192.168.1.10:3000/', 'current', '#/dash'), 'http://192.168.1.10:3000/#/dash');

  // Explicit state machine checks
  const blockerTask = { ...state.tasks[0], id: 'TASK-BLK', status: TaskStatus.IN_PROGRESS };
  const blockedTask = { ...state.tasks[0], id: 'TASK-DEP', dependsOn: ['TASK-BLK'], status: TaskStatus.NOT_STARTED, progress: 0 };
  const blockedRes = resolveTaskTransition(blockedTask, { status: TaskStatus.IN_PROGRESS }, [blockerTask, blockedTask]);
  assert.equal(blockedRes.ok, false);

  const unblockedRes = resolveTaskTransition(blockedTask, { status: TaskStatus.COMPLETED }, [{ ...blockerTask, status: TaskStatus.COMPLETED }, blockedTask]);
  assert.equal(unblockedRes.ok, true);
  if (unblockedRes.ok) {
    assert.equal(unblockedRes.patch.progress, 100);
    assert.ok(unblockedRes.patch.actCompletionDate);
    assert.equal(unblockedRes.celebrated, true);
  }

  // Subtask rollup check (complete -> reopen)
  const parentTask = {
    ...state.tasks[0],
    status: TaskStatus.NOT_STARTED,
    progress: 0,
    subtasks: [{ id: 'S1', name: 'Step', status: TaskStatus.NOT_STARTED, done: false, effort: 1, progress: 0, type: 'step' as const }],
  };
  const completedRollup = computeSubtaskRollup(parentTask, 'S1');
  assert.equal(completedRollup.status, TaskStatus.COMPLETED);
  assert.equal(completedRollup.progress, 100);
  const reopenedRollup = computeSubtaskRollup({ ...parentTask, ...completedRollup } as typeof parentTask, 'S1');
  assert.equal(reopenedRollup.status, TaskStatus.IN_PROGRESS);
  assert.equal(reopenedRollup.actCompletionDate, null);

  // Delivery pipeline guard & transition check
  const rejectedDelivery = {
    id: 'DEL-1', almId: 'ALM-1', name: 'Pkg', pdn: 'PDN-1', pdnProcessingDate: '2026-11-12',
    componentsDelivered: '', category: 'Feature', module: 'Core', moduleType: 'Server',
    releaseVersion: 'v2.0', environment: 'QA', almStatus: 'Ready for Test', status: 'Ready for Deployment',
    signOffStatus: 'Rejected', approver: '', smokeTestStatus: 'Passed', reportedBy: '', fixedBy: '',
    targetDeliveryDate: '2026-11-12', actualDeliveryDate: null, leadTimeDays: 0, variance: 0,
    linkedType: 'None' as const, linkedId: '', linkedTasks: [], linkedScreens: [],
    rollbackPlan: '', notes: '', createdAt: '', updatedAt: '',
  };
  assert.equal(transitionDeliveryStage(rejectedDelivery, 'deploy').ok, false);
  const okDeploy = transitionDeliveryStage({ ...rejectedDelivery, signOffStatus: 'Pending' }, 'deploy');
  assert.equal(okDeploy.ok, true);
  if (okDeploy.ok) {
    assert.equal(okDeploy.patch.status, 'Deployed');
    assert.equal(okDeploy.patch.signOffStatus, 'Approved');
  }

  // Defect, RAID, Release, Retro, and Session phase transitions
  assert.equal(nextDefectQuickStatus(DefectStatus.FIXED), DefectStatus.RETEST);
  assert.equal(normalizeRaidStatus('Resolved'), 'Closed');
  assert.equal(nextReleaseStatus('Planned'), 'Active');
  assert.equal(nextRetroActionStatus('In Progress'), 'Resolved');
  assert.equal(resolveSessionPhase(false, 'Proj', 'overview', () => true), 'unauthenticated');
  assert.equal(resolveSessionPhase(true, '', 'overview', () => true), 'onboarding');
  assert.equal(resolveSessionPhase(true, 'Proj', 'settings', () => false), 'denied');
  assert.equal(resolveSessionPhase(true, 'Proj', 'overview', () => true), 'authorized');

  console.log('Mobile runtime, Safari QR, and explicit state machine checks passed.');
}

main();

