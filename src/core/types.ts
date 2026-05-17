// Core domain types.
//
// Design principle: DURATION is the fundamental unit, not start/end dates.
// Every task has a duration anchored to EITHER its start date OR its end
// date. Defaults (start = today, duration = settings default) mean the only
// decision is usually the duration. A soft deadline is implied by the
// duration; an explicitly set end date is what makes a deadline "hard".

export type ISODate = string; // "YYYY-MM-DD"

export type TaskKind = "oneoff" | "recurring";

/** Which endpoint the duration is measured from. */
export type DurationAnchor = "start" | "end";

/** Coarse time-of-day; an explicit hour is only used when specified. */
export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

/** A length of time in calendar units. */
export interface Duration {
  /** Number of `unit`s. */
  amount: number;
  unit: "day" | "week" | "month" | "year";
}

/**
 * A reminder positioned RELATIVE TO THE DURATION, not an absolute date.
 * - "start"/"end": offset from that endpoint (offsetDays may be negative,
 *   i.e. before start or after end — used for birthdays).
 * - "evenly-spaced": `count` reminders spread across the duration.
 */
export interface Reminder {
  id: string;
  anchor: "start" | "end" | "evenly-spaced";
  /** For start/end anchors: days from the endpoint (negative = before). */
  offsetDays?: number;
  /** For evenly-spaced: how many reminders across the duration. */
  count?: number;
  timeOfDay: TimeOfDay;
  /** Only set when the user specified an exact hour (0-23). */
  hour?: number;
}

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  done: boolean;
}

export interface RecurrenceRule {
  /** Default behavior: next occurrence is measured from completion date. */
  basis: "completion" | "scheduled";
  every: Duration;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  kind: TaskKind;

  // ---- Duration core ----
  startDate: ISODate;
  duration: Duration;
  durationAnchor: DurationAnchor;
  /** If set, this is a HARD deadline. If null, deadline is soft (implied). */
  explicitEndDate: ISODate | null;
  /** Supported but never the default; the exception. */
  noDuration: boolean;

  // ---- Prioritization (independent of deadline) ----
  priority: 1 | 2 | 3 | 4 | 5; // 5 = highest

  // ---- Recurrence (distinct from duration) ----
  recurrence: RecurrenceRule | null;

  reminders: Reminder[];
  subtasks: Subtask[];
  tags: string[];

  // ---- State ----
  /** "Made progress" — hide until this date, but still respect deadline. */
  progressMadeUntil: ISODate | null;
  snoozedUntil: ISODate | null;
  active: boolean;
  archived: boolean;
  completionHistory: ISODate[];

  /** When on, show description when completing subtasks too. */
  confirmOnComplete: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  /** Default duration applied to new tasks. */
  defaultDuration: Duration;
  /** Default anchor for new tasks. */
  defaultDurationAnchor: DurationAnchor;
  /** How many tasks focus mode picks per day by default. */
  focusTargetCount: number;
}

export interface AppData {
  version: 1;
  settings: Settings;
  tasks: Task[];
}

export const DEFAULT_SETTINGS: Settings = {
  defaultDuration: { amount: 1, unit: "month" },
  defaultDurationAnchor: "start",
  focusTargetCount: 5,
};
