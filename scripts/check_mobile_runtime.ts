import assert from 'node:assert/strict';
import { getDefaultState } from '../src/store/defaultState';
import { analyzeProject } from '../src/services/aiService';
import { TaskPriority, TaskStatus } from '../src/types';

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

  console.log('Mobile runtime self-check passed (native telemetry + offline fallback).');
}

main();

