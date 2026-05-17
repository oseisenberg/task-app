import { newId } from "./id";
import { todayISO } from "./duration";
import type { Settings, Task, TaskKind } from "./types";

/**
 * Create a task with as few decisions as possible: start = today,
 * duration = settings default, soft deadline (no explicit end date).
 * In many cases the only thing the user changes is the duration.
 */
export function makeTask(
  title: string,
  settings: Settings,
  kind: TaskKind = "oneoff"
): Task {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title,
    kind,
    startDate: todayISO(),
    duration: { ...settings.defaultDuration },
    durationAnchor: settings.defaultDurationAnchor,
    explicitEndDate: null,
    noDuration: false,
    priority: 3,
    recurrence:
      kind === "recurring"
        ? { basis: "completion", every: { ...settings.defaultDuration } }
        : null,
    reminders: [],
    subtasks: [],
    tags: [],
    progressMadeUntil: null,
    snoozedUntil: null,
    active: true,
    archived: false,
    completionHistory: [],
    confirmOnComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}
