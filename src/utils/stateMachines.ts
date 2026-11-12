import {
  Decision,
  DefectStatus,
  Delivery,
  RetroItem,
  Subtask,
  Task,
  TaskStatus,
} from '../types';

export type RaidStatus = 'Identified' | 'Active' | 'Mitigated' | 'Closed' | 'Realized';
export type DecisionStatus = Decision['status'];
export type ReleaseStatus = 'Planned' | 'Active' | 'Released';
export type RetroActionStatus = NonNullable<RetroItem['status']>;
export type DeliveryStageAction = 'start' | 'ready' | 'deploy' | 'rollback' | 'cancel';
export type SessionPhase = 'unauthenticated' | 'onboarding' | 'denied' | 'authorized';

const todayDateStr = () => new Date().toISOString().split('T')[0];

function cycleOrdered<T>(order: readonly T[], current: T): T {
  const idx = order.indexOf(current);
  return idx === -1 ? order[0] : order[(idx + 1) % order.length];
}

// ============================================================================
// 1. Task & Subtask State Machine
// ============================================================================

export const TASK_QUICK_CYCLE: readonly TaskStatus[] = [
  TaskStatus.NOT_STARTED,
  TaskStatus.IN_PROGRESS,
  TaskStatus.UNDER_REVIEW,
  TaskStatus.COMPLETED,
];

const TASK_ACTIVE_OR_DONE = new Set<TaskStatus>([
  TaskStatus.IN_PROGRESS,
  TaskStatus.UNDER_REVIEW,
  TaskStatus.COMPLETED,
]);

export function getBlockedByIds(task: Pick<Task, 'dependsOn'>, allTasks: Task[]): string[] {
  if (!task.dependsOn || task.dependsOn.length === 0) return [];
  return task.dependsOn.filter((depId) => {
    const dep = allTasks.find((t) => t.id === depId);
    return Boolean(dep && dep.status !== TaskStatus.COMPLETED);
  });
}

export type TaskTransitionResult =
  | { ok: true; patch: Partial<Task>; celebrated: boolean; reason?: undefined }
  | { ok: false; blockedBy: string[]; reason: string };

/**
 * Validates and normalizes a task mutation against dependency guards,
 * progress bounds, and completion timestamp invariants.
 */
export function resolveTaskTransition(
  currentTask: Task,
  proposed: Partial<Task>,
  allTasks: Task[]
): TaskTransitionResult {
  const mergedDeps = proposed.dependsOn ?? currentTask.dependsOn ?? [];
  const nextStatus = proposed.status ?? currentTask.status;
  const nextProgress = proposed.progress ?? currentTask.progress;

  const blockedBy = getBlockedByIds({ dependsOn: mergedDeps }, allTasks);
  if (
    blockedBy.length > 0 &&
    (TASK_ACTIVE_OR_DONE.has(nextStatus) || (proposed.progress !== undefined && proposed.progress > 0))
  ) {
    return {
      ok: false,
      blockedBy,
      reason: `Cannot advance task while blocked by: ${blockedBy.join(', ')}`,
    };
  }

  const patch: Partial<Task> = { ...proposed };
  let celebrated = false;

  if (nextStatus === TaskStatus.COMPLETED) {
    patch.progress = 100;
    if (!patch.actCompletionDate && !currentTask.actCompletionDate) {
      patch.actCompletionDate = todayDateStr();
    }
    celebrated = currentTask.status !== TaskStatus.COMPLETED;
  } else {
    if (proposed.status !== undefined && currentTask.status === TaskStatus.COMPLETED) {
      patch.actCompletionDate = null;
    }
    if (
      proposed.status !== undefined &&
      currentTask.status === TaskStatus.NOT_STARTED &&
      nextStatus !== TaskStatus.CANCELLED &&
      nextStatus !== TaskStatus.NOT_STARTED &&
      nextProgress === 0
    ) {
      patch.progress = 25;
    }
  }

  return { ok: true, patch, celebrated };
}

export function nextTaskQuickStatus(current: TaskStatus): TaskStatus {
  return cycleOrdered(TASK_QUICK_CYCLE, current);
}

/** Recomputes subtask & parent task state coherently when a subtask checkbox toggles. */
export function computeSubtaskRollup(task: Task, toggledSubId: string): Partial<Task> {
  const updatedSubtasks: Subtask[] = task.subtasks.map((s) => {
    if (s.id !== toggledSubId) return s;
    const nextDone = !s.done;
    return {
      ...s,
      done: nextDone,
      status: nextDone ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
      progress: nextDone ? 100 : 0,
    };
  });

  const doneCount = updatedSubtasks.filter((s) => s.done).length;
  const newProgress = updatedSubtasks.length
    ? Math.round((doneCount / updatedSubtasks.length) * 100)
    : task.progress;
  const allDone = updatedSubtasks.length > 0 && doneCount === updatedSubtasks.length;

  let nextStatus = task.status;
  if (allDone) {
    nextStatus = TaskStatus.COMPLETED;
  } else if (task.status === TaskStatus.COMPLETED && !allDone) {
    nextStatus = TaskStatus.IN_PROGRESS;
  } else if (newProgress > 0 && task.status === TaskStatus.NOT_STARTED) {
    nextStatus = TaskStatus.IN_PROGRESS;
  }

  return {
    subtasks: updatedSubtasks,
    progress: newProgress,
    status: nextStatus,
    actCompletionDate: allDone
      ? task.actCompletionDate || todayDateStr()
      : nextStatus !== TaskStatus.COMPLETED
        ? null
        : task.actCompletionDate,
  };
}

// ============================================================================
// 2. ALM Delivery Pipeline Machine
// ============================================================================

export type DeliveryTransitionResult =
  | { ok: true; patch: Partial<Delivery>; reason?: undefined }
  | { ok: false; reason: string };

export function transitionDeliveryStage(
  delivery: Delivery,
  action: DeliveryStageAction
): DeliveryTransitionResult {
  switch (action) {
    case 'start':
      if (delivery.status !== 'Scheduled') {
        return { ok: false, reason: 'Only Scheduled packages can be started.' };
      }
      return { ok: true, patch: { status: 'In Progress', almStatus: 'In Progress' } };

    case 'ready':
      if (delivery.status !== 'In Progress') {
        return { ok: false, reason: 'Only In Progress packages can be marked Ready.' };
      }
      return { ok: true, patch: { status: 'Ready for Deployment', almStatus: 'Ready for Test' } };

    case 'deploy':
      if (delivery.status !== 'Ready for Deployment') {
        return { ok: false, reason: 'Package must be Ready for Deployment before going live.' };
      }
      if (delivery.signOffStatus === 'Rejected') {
        return { ok: false, reason: 'Cannot deploy a package whose sign-off was Rejected.' };
      }
      if (delivery.smokeTestStatus === 'Failed') {
        return { ok: false, reason: 'Cannot deploy while Smoke Gate status is Failed.' };
      }
      return {
        ok: true,
        patch: {
          status: 'Deployed',
          actualDeliveryDate: todayDateStr(),
          almStatus: 'Closed',
          smokeTestStatus: 'Passed',
          signOffStatus: delivery.signOffStatus === 'Pending' ? 'Approved' : delivery.signOffStatus,
        },
      };

    case 'rollback':
      if (delivery.status !== 'Deployed') {
        return { ok: false, reason: 'Only Deployed packages can be rolled back.' };
      }
      return {
        ok: true,
        patch: {
          status: 'Rolled Back',
          almStatus: 'Open',
          smokeTestStatus: 'Failed',
        },
      };

    case 'cancel':
      return { ok: true, patch: { status: 'Cancelled', almStatus: 'Closed' } };
  }
}

// ============================================================================
// 3. Defect Triage Machine
// ============================================================================

export const DEFECT_QUICK_CYCLE: readonly DefectStatus[] = [
  DefectStatus.NEW,
  DefectStatus.ASSIGNED,
  DefectStatus.IN_PROGRESS,
  DefectStatus.FIXED,
  DefectStatus.RETEST,
  DefectStatus.CLOSED,
];

export const TERMINAL_DEFECT_STATUSES = new Set<string>([
  DefectStatus.CLOSED.toLowerCase(),
  DefectStatus.FIXED.toLowerCase(),
  DefectStatus.REJECTED.toLowerCase(),
  DefectStatus.DEFERRED.toLowerCase(),
  'resolved',
]);

export function nextDefectQuickStatus(current: DefectStatus): DefectStatus {
  return cycleOrdered(DEFECT_QUICK_CYCLE, current);
}

// ============================================================================
// 4. RAID & Decision Governance Machines
// ============================================================================

export const RAID_STATUSES: readonly RaidStatus[] = [
  'Identified',
  'Active',
  'Mitigated',
  'Closed',
  'Realized',
];

export const TERMINAL_RAID_STATUSES = new Set<string>([
  'closed',
  'resolved',
  'mitigated',
  'retired',
  'cancelled',
]);

export function normalizeRaidStatus(raw?: string | null): RaidStatus {
  const s = String(raw || '').trim().toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'mitigated') return 'Mitigated';
  if (s === 'realized') return 'Realized';
  if (TERMINAL_RAID_STATUSES.has(s)) return 'Closed';
  return 'Identified';
}

export const DECISION_STATUSES: readonly DecisionStatus[] = [
  'Pending Sign-off',
  'Approved',
  'Rejected',
  'Appealed',
];

export const PENDING_DECISION_STATUSES = new Set<string>([
  'pending sign-off',
  'appealed',
]);

export function isDecisionStatusPending(status?: string | null): boolean {
  const s = String(status || '').trim().toLowerCase();
  return PENDING_DECISION_STATUSES.has(s) || s.includes('pending') || s.includes('review') || s.includes('appeal');
}

// ============================================================================
// 5. Release & Retrospective Action Machines
// ============================================================================

export const RELEASE_CYCLE: readonly ReleaseStatus[] = ['Planned', 'Active', 'Released'];

export function nextReleaseStatus(current: ReleaseStatus): ReleaseStatus {
  return cycleOrdered(RELEASE_CYCLE, current);
}

export const RETRO_ACTION_CYCLE: readonly RetroActionStatus[] = [
  'Open',
  'In Progress',
  'Resolved',
];

export function nextRetroActionStatus(current?: RetroActionStatus): RetroActionStatus {
  return cycleOrdered(RETRO_ACTION_CYCLE, current ?? 'Open');
}

// ============================================================================
// 6. Session & View Authorization Phase Machine
// ============================================================================

export function resolveSessionPhase(
  isAuthenticated: boolean,
  projectName: string | undefined,
  currentView: string,
  hasViewAccess: (viewId: string) => boolean
): SessionPhase {
  if (!isAuthenticated) return 'unauthenticated';
  if (!projectName) return 'onboarding';
  if (!hasViewAccess(currentView)) return 'denied';
  return 'authorized';
}
