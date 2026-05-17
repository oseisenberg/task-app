// Duration engine: the math that turns (startDate, duration, anchor,
// explicitEndDate) into a concrete window and a soft/hard deadline.

import type { Duration, ISODate, Task } from "./types";

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now);
}

export function toISO(d: Date): ISODate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDuration(date: ISODate, dur: Duration, sign = 1): ISODate {
  const d = parseISO(date);
  const n = dur.amount * sign;
  switch (dur.unit) {
    case "day":
      d.setDate(d.getDate() + n);
      break;
    case "week":
      d.setDate(d.getDate() + n * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + n);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + n);
      break;
  }
  return toISO(d);
}

export function durationInDays(dur: Duration): number {
  switch (dur.unit) {
    case "day":
      return dur.amount;
    case "week":
      return dur.amount * 7;
    case "month":
      return dur.amount * 30;
    case "year":
      return dur.amount * 365;
  }
}

export function daysBetween(a: ISODate, b: ISODate): number {
  const ms = parseISO(b).getTime() - parseISO(a).getTime();
  return Math.round(ms / 86_400_000);
}

export interface Window {
  start: ISODate;
  /** Soft end implied by the duration (or the explicit hard deadline). */
  end: ISODate;
  /** True when end is an explicitly set hard deadline. */
  hardDeadline: boolean;
}

/**
 * Resolve a task's concrete [start, end] window.
 *
 * - anchor "start": window = [startDate, startDate + duration]
 * - anchor "end":   window = [end - duration, end]
 *   where `end` is explicitEndDate if set, else startDate + duration.
 * - An explicitEndDate always makes the deadline hard.
 */
export function resolveWindow(task: Task): Window | null {
  if (task.noDuration) return null;

  if (task.durationAnchor === "end") {
    const end =
      task.explicitEndDate ?? addDuration(task.startDate, task.duration);
    return {
      start: addDuration(end, task.duration, -1),
      end,
      hardDeadline: task.explicitEndDate !== null,
    };
  }

  // anchor "start"
  const softEnd = addDuration(task.startDate, task.duration);
  return {
    start: task.startDate,
    end: task.explicitEndDate ?? softEnd,
    hardDeadline: task.explicitEndDate !== null,
  };
}

/**
 * Given a hard end date, return the duration length such that the window's
 * start lands on `today` — "this can be done anytime from now until the
 * deadline" while keeping the duration anchored to the end date.
 */
export function durationSoStartIsToday(
  endDate: ISODate,
  today: ISODate = todayISO()
): Duration {
  return { amount: Math.max(0, daysBetween(today, endDate)), unit: "day" };
}
