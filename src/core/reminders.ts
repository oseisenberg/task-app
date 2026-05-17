// Reminder engine.
//
// Reminders are positioned RELATIVE TO THE DURATION, not to absolute dates.
// This is the key idea: once a task has a duration, "remind me 3 times" or
// "remind me before it starts" finally make sense without juggling dates.
//
// - anchor "start": offsetDays from the window start (negative = before it)
// - anchor "end":   offsetDays from the window end   (negative = before,
//                    positive = after — e.g. a follow-up)
// - anchor "evenly-spaced": `count` reminders spread across the window
//
// Birthdays fall out naturally: a 1-day window with a "start, -2 days"
// reminder and a "start, 0" reminder. The glasses case: a 1-month window
// with a single "start, +5 days" reminder — totally separate from when the
// task can actually be done.

import { addDuration, parseISO, resolveWindow } from "./duration";
import type { Reminder, Task, TimeOfDay } from "./types";

const TIME_OF_DAY_HOUR: Record<TimeOfDay, number> = {
  morning: 9,
  afternoon: 14,
  evening: 19,
  anytime: 9,
};

function at(dateISO: string, r: Reminder): Date {
  const d = parseISO(dateISO);
  d.setHours(r.hour ?? TIME_OF_DAY_HOUR[r.timeOfDay], 0, 0, 0);
  return d;
}

function offsetDate(dateISO: string, days: number): string {
  return addDuration(dateISO, { amount: days, unit: "day" });
}

/**
 * Resolve all concrete fire times for a task's reminders, given its current
 * duration window. Returns sorted Date objects. No-duration tasks (no
 * window) produce nothing — reminders are inherently duration-relative.
 */
export function reminderTimes(task: Task): Date[] {
  const w = resolveWindow(task);
  if (!w) return [];

  const out: Date[] = [];
  for (const r of task.reminders) {
    if (r.anchor === "start") {
      out.push(at(offsetDate(w.start, r.offsetDays ?? 0), r));
    } else if (r.anchor === "end") {
      out.push(at(offsetDate(w.end, r.offsetDays ?? 0), r));
    } else {
      const n = Math.max(1, r.count ?? 1);
      const totalDays =
        (parseISO(w.end).getTime() - parseISO(w.start).getTime()) /
        86_400_000;
      for (let i = 1; i <= n; i++) {
        const day = Math.round((totalDays * i) / (n + 1));
        out.push(at(offsetDate(w.start, day), r));
      }
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

/** The next reminder strictly after `now`, or null. */
export function nextReminder(task: Task, now: Date = new Date()): Date | null {
  return reminderTimes(task).find((d) => d.getTime() > now.getTime()) ?? null;
}

/**
 * Reminders due in the window (lastChecked, now]. Only callers that pass the
 * focus set in will fire notifications — by design notifications are limited
 * to focus-mode tasks so they don't overload.
 */
export function dueReminders(
  tasks: Task[],
  lastChecked: Date,
  now: Date = new Date()
): { task: Task; when: Date }[] {
  const due: { task: Task; when: Date }[] = [];
  for (const task of tasks) {
    for (const when of reminderTimes(task)) {
      if (when.getTime() > lastChecked.getTime() && when.getTime() <= now.getTime()) {
        due.push({ task, when });
      }
    }
  }
  return due;
}
