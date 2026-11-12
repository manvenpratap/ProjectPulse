import { ProjectState, TaskStatus } from "../types";
import {
  getHealthScore,
  isBlocked,
  isDefectResolved,
  isOverdue,
  isRaidActive,
} from "../utils/projectUtils";

function buildOfflinePulseReport(state: ProjectState, reason?: string): string {
  const tasks = state.tasks || [];
  const defects = state.defects || [];
  const raids = state.raids || [];
  const deliveries = state.deliveries || [];

  const health = getHealthScore(tasks);
  const completedCount = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const blockedTasks = tasks.filter((t) => isBlocked(t, tasks));
  const overdueTasks = tasks.filter((t) => isOverdue(t));
  const openDefects = defects.filter((d) => !isDefectResolved(d.status));
  const criticalDefects = openDefects.filter((d) =>
    String(d.severity || d.priority || "").toLowerCase().includes("crit") ||
    String(d.severity || d.priority || "").toLowerCase().includes("high")
  );
  const activeRaids = raids.filter((r) => isRaidActive(r.status));
  const pendingDeliveries = deliveries.filter(
    (d) => d.status !== "Deployed" && d.status !== "Cancelled"
  );

  const attentionList = [...overdueTasks, ...blockedTasks.filter((b) => !overdueTasks.includes(b))]
    .slice(0, 5)
    .map(
      (t) =>
        `- **${t.id}** ${t.name} (${t.status}, Due: ${t.dueDate || "TBD"}, Owner: ${t.assignee || "Unassigned"})`
    )
    .join("\n");

  return [
    `### Executive Pulse Briefing — ${state.name || "Workspace"}`,
    `> *On-Device Telemetry Summary${reason ? ` (${reason})` : ""}*`,
    "",
    `- **Overall Health Score:** **${health}%**`,
    `- **Scope Progress:** ${completedCount}/${tasks.length} tasks completed (${overdueTasks.length} overdue, ${blockedTasks.length} blocked)`,
    `- **Quality & Defects:** ${openDefects.length} open defects (${criticalDefects.length} critical/high)`,
    `- **Governance & Delivery:** ${activeRaids.length} active RAID items · ${pendingDeliveries.length} pending deliveries`,
    "",
    attentionList
      ? `#### Immediate Attention Queue\n${attentionList}`
      : "#### Immediate Attention Queue\n- No overdue or blocked tasks detected in current local state.",
  ].join("\n");
}

export async function analyzeProject(state: ProjectState): Promise<string> {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const apiBase = (env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const isNative =
    typeof window !== "undefined" &&
    Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

  // Offline / standalone native bundle without an explicit remote API host runs deterministic local telemetry
  if (isNative && !apiBase) {
    return buildOfflinePulseReport(state, "Local Mobile Telemetry");
  }

  try {
    const response = await fetch(`${apiBase}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state }),
    });

    if (!response.ok) {
      return buildOfflinePulseReport(state, `API HTTP ${response.status} fallback`);
    }

    const data = await response.json();
    return data.text || buildOfflinePulseReport(state, "Empty response fallback");
  } catch {
    return buildOfflinePulseReport(state, "Offline fallback");
  }
}
