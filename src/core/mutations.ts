// Pure task mutations. Keeping these out of components makes them testable
// and keeps the "duration is the fundamental unit" rules in one place.

import {
  addDuration,
  daysBetween,
  resolveWindow,
  todayISO,
} from "./duration";
import type { AppData, Duration, Task } from "./types";

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

/**
 * Snooze by the task's OWN duration (the split-button's primary action and
 * the "snooze to next by duration" procrastination case). Duration is the
 * fundamental unit, so this needs no extra input.
 */
export function snoozeByDuration(
  data: AppData,
  id: string,
  today = todayISO()
): AppData {
  return {
    ...data,
    tasks: data.tasks.map((t) =>
      t.id === id
        ? touch({ ...t, snoozedUntil: addDuration(today, t.duration) })
        : t
    ),
  };
}

/**
 * Snooze by a DIFFERENT duration. Default behavior: this also resets the
 * task's duration (e.g. "check mail weekly" but can't for a month → the
 * cadence itself moves to a month).
 */
export function snoozeByNewDuration(
  data: AppData,
  id: string,
  duration: Duration,
  today = todayISO()
): AppData {
  return {
    ...data,
    tasks: data.tasks.map((t) =>
      t.id === id
        ? touch({
            ...t,
            duration,
            snoozedUntil: addDuration(today, duration),
          })
        : t
    ),
  };
}

/** Snooze to a specific date; treated as a day-duration from today. */
export function snoozeUntil(
  data: AppData,
  id: string,
  date: string,
  today = todayISO()
): AppData {
  const amount = Math.max(1, daysBetween(today, date));
  return snoozeByNewDuration(data, id, { amount, unit: "day" }, today);
}

/**
 * Mark progress: hide the task for a while (default ~1 week) so it stops
 * cluttering focus — but never past a hard deadline, which is still
 * respected.
 */
export function markProgress(
  data: AppData,
  id: string,
  days = 7,
  today = todayISO()
): AppData {
  return {
    ...data,
    tasks: data.tasks.map((t) => {
      if (t.id !== id) return t;
      let until = addDuration(today, { amount: days, unit: "day" });
      const w = resolveWindow(t);
      if (w?.hardDeadline && w.end < until) until = w.end;
      return touch({ ...t, progressMadeUntil: until });
    }),
  };
}

/** Persist subtask done-state (used by the completion dialog). */
export function setSubtasksDone(
  data: AppData,
  id: string,
  doneIds: string[]
): AppData {
  const set = new Set(doneIds);
  return {
    ...data,
    tasks: data.tasks.map((t) =>
      t.id === id
        ? touch({
            ...t,
            subtasks: t.subtasks.map((s) => ({ ...s, done: set.has(s.id) })),
          })
        : t
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
