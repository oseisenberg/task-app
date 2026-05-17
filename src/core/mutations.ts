// Pure task mutations. Keeping these out of components makes them testable
// and keeps the "duration is the fundamental unit" rules in one place.

import { addDuration, todayISO } from "./duration";
import type { AppData, Task } from "./types";

function touch(t: Task): Task {
  return { ...t, updatedAt: new Date().toISOString() };
}

export function upsertTask(data: AppData, task: Task): AppData {
  const exists = data.tasks.some((t) => t.id === task.id);
  const next = touch(task);
  return {
    ...data,
    tasks: exists
      ? data.tasks.map((t) => (t.id === task.id ? next : t))
      : [...data.tasks, next],
  };
}

export function deleteTask(data: AppData, id: string): AppData {
  return { ...data, tasks: data.tasks.filter((t) => t.id !== id) };
}

export function patchTask(
  data: AppData,
  id: string,
  patch: Partial<Task>
): AppData {
  return {
    ...data,
    tasks: data.tasks.map((t) =>
      t.id === id ? touch({ ...t, ...patch }) : t
    ),
  };
}

/** Edit-menu action: move a recurring task's window to start today. */
export function moveToToday(data: AppData, id: string): AppData {
  return patchTask(data, id, { startDate: todayISO() });
}

/**
 * Complete a task. Completion REQUIRES an end date (default today) — a task
 * without one effectively never gets done. Recurring tasks roll forward:
 * the next start is measured from the completion date by default.
 */
export function completeTask(
  data: AppData,
  id: string,
  endDate = todayISO()
): AppData {
  return {
    ...data,
    tasks: data.tasks.map((t) => {
      if (t.id !== id) return t;
      const history = [...t.completionHistory, endDate];
      if (t.recurrence) {
        const base =
          t.recurrence.basis === "completion" ? endDate : t.startDate;
        return touch({
          ...t,
          completionHistory: history,
          startDate: addDuration(base, t.recurrence.every),
          progressMadeUntil: null,
          snoozedUntil: null,
        });
      }
      return touch({
        ...t,
        completionHistory: history,
        active: false,
      });
    }),
  };
}
